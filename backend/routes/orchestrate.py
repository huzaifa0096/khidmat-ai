"""
Main Orchestration Route.

POST /api/orchestrate/parse-and-rank
  In:  { user_text }
  Out: full trace with intent + (crisis assessment if emergency) + candidates + top_3

POST /api/orchestrate/confirm-booking
  In:  { trace_id, chosen_provider_id, user, time_preference, time_specific_iso? }
  Out: booking + followup_plan + final trace
"""
import time
from datetime import datetime
from fastapi import APIRouter, Request
from pydantic import BaseModel
from typing import Optional

from agents import intent_parser, provider_discovery, ranking_reasoning, crisis_specialist
from agents.pricing_engine import estimate_price
from agents.trust_engine import compute_trust_score
from routes.bookings import create_booking, BookingCreate
from routes.schedule import generate_followup_plan
from routes.emergency import recent_emergency_reports, broadcast_alert, create_emergency_ticket
from routes.external import weather as weather_route, traffic as traffic_route
from utils.ids import trace_id

router = APIRouter()


class ParseAndRankRequest(BaseModel):
    user_text: str
    user_id: Optional[str] = "U001"


class ConfirmBookingRequest(BaseModel):
    trace_id: str
    chosen_provider_id: str
    user: dict
    time_preference: Optional[str] = None
    time_specific_iso: Optional[str] = None


def _step(step_num, agent_name, action, started, output, tool_calls=None, reasoning_text=None):
    return {
        "step": step_num,
        "agent": agent_name,
        "action": action,
        "started_at": started,
        "duration_ms": int((time.time() - time.mktime(datetime.fromisoformat(started).timetuple())) * 1000) if False else 0,
        "tool_calls": tool_calls or [],
        "output": output,
        "reasoning_text": reasoning_text or ""
    }


@router.post("/parse-and-rank")
async def parse_and_rank(payload: ParseAndRankRequest, request: Request):
    store = request.app.state.store
    tid = trace_id()
    started_at = datetime.now().isoformat()
    t0 = time.time()

    trace = {
        "trace_id": tid,
        "workflow_id": "khidmat_main_orchestration_v1",
        "started_at": started_at,
        "user_input": payload.user_text,
        "user_id": payload.user_id,
        "steps": []
    }

    # STEP 1: Intent Parser
    step_started = datetime.now().isoformat()
    intent = intent_parser.parse(payload.user_text, store)
    trace["steps"].append({
        "step": 1,
        "agent": "intent_parser",
        "started_at": step_started,
        "duration_ms": int((time.time() - t0) * 1000),
        "engine": intent.get("_engine", "rule_based"),
        "tool_calls": [
            {"tool": "get_service_catalog", "result": f"{len(store.categories)} categories loaded"},
            {"tool": "get_city_catalog", "result": f"{len(store.cities)} cities loaded"},
            {"tool": "detect_language", "result": intent["language_detected"]}
        ],
        "output": intent,
        "reasoning_text": intent.get("reasoning", "")
    })

    # If missing critical info, short-circuit and ask
    if intent.get("missing_info"):
        trace["completed_at"] = datetime.now().isoformat()
        trace["final_state"] = {"status": "awaiting_clarification", "clarification": {
            "ur": intent.get("clarification_question_ur"),
            "en": intent.get("clarification_question_en")
        }}
        store.add_trace(trace)
        return {"trace_id": tid, "intent": intent, "needs_clarification": True, "trace": trace}

    # STEP 2: Provider Discovery (always runs first to have candidates for dispatch)
    d_step_start = datetime.now().isoformat()
    discovery = provider_discovery.discover(intent, store)
    trace["steps"].append({
        "step": 2,
        "agent": "provider_discovery",
        "started_at": d_step_start,
        "duration_ms": int((time.time() - t0) * 1000),
        "tool_calls": [
            {"tool": "find_providers_by_category_and_city", "args": {"category_id": intent["service_category_id"], "city_id": intent["location"]["city"]}, "result": f"{discovery['total_matched']} matched"},
            {"tool": "compute_distance", "result": f"{len(discovery['candidates'])} candidates with distance"},
        ],
        "output": {
            "total_matched": discovery["total_matched"],
            "candidates_ids": [c["provider_id"] for c in discovery["candidates"]],
            "filtered_out_count": len(discovery["filtered_out"]),
            "filtered_out_sample": discovery["filtered_out"][:3]
        },
        "reasoning_text": discovery["reasoning"]
    })

    # STEP 3 (optional): Crisis Specialist if emergency — runs AFTER discovery to populate dispatch
    crisis_result = None
    if intent.get("urgency") == "emergency":
        sec = intent["location"]["sector"] or ""
        city = intent["location"]["city"] or ""

        w_step_start = datetime.now().isoformat()
        weather_data = await weather_route(city=city, time=None) if city else {}
        traffic_data = await traffic_route(sector=sec) if sec else {}
        reports_data = await recent_emergency_reports(sector=sec, hours=2, request=request) if sec else {"cluster_detected": False}

        crisis_result = crisis_specialist.assess_and_dispatch(
            intent, discovery, store, weather_data, traffic_data, reports_data
        )

        trace["steps"].append({
            "step": 3,
            "agent": "crisis_specialist",
            "started_at": w_step_start,
            "duration_ms": int((time.time() - t0) * 1000),
            "mode": "A_crisis",
            "tool_calls": [
                {"tool": "fetch_weather", "args": {"city": city}, "result": weather_data},
                {"tool": "fetch_traffic_density", "args": {"sector": sec}, "result": traffic_data},
                {"tool": "fetch_recent_emergency_reports", "args": {"sector": sec, "hours": 2}, "result": {"cluster_detected": reports_data.get("cluster_detected", False), "count": len(reports_data.get("reports", []))}}
            ],
            "output": crisis_result,
            "reasoning_text": f"Crisis type: {crisis_result['crisis_assessment']['type']}, severity: {crisis_result['crisis_assessment']['severity']}, confidence: {crisis_result['crisis_assessment']['confidence']}"
        })

        # Broadcast alert if area-wide
        if crisis_result.get("area_alert"):
            alert_payload = {
                "city": city,
                "sector": sec,
                **crisis_result["area_alert"]
            }
            alert = await broadcast_alert(alert_payload, request)
            trace["steps"].append({
                "step": 3.5,
                "agent": "crisis_specialist",
                "action": "broadcast_area_alert",
                "output": alert
            })

        # Create emergency ticket
        ticket_payload = {
            "priority": crisis_result["emergency_ticket"]["priority"],
            "type": crisis_result["crisis_assessment"]["type"],
            "city": city,
            "sector": sec,
            "evidence": crisis_result["crisis_assessment"]["evidence"],
            "providers_dispatched": [p["provider_id"] for p in crisis_result["dispatch_plan"]["primary_providers"]],
            "escalated_to_authority": crisis_result["emergency_ticket"]["escalated_to_authority"],
            "escalation_recommended": crisis_result["emergency_ticket"]["escalation_recommended"]
        }
        ticket = await create_emergency_ticket(ticket_payload, request)
        trace["steps"].append({
            "step": 3.6,
            "agent": "crisis_specialist",
            "action": "create_emergency_ticket",
            "output": ticket
        })

    # STEP 3.7: Trust Engine — composite trust score per candidate
    tr_step_start = datetime.now().isoformat()
    trust_scores = {}
    for c in discovery["candidates"]:
        ts = compute_trust_score(c["raw"])
        c["trust"] = ts
        trust_scores[c["provider_id"]] = ts
    trust_summary = {
        "scored_count": len(trust_scores),
        "tier_distribution": {
            tier: sum(1 for s in trust_scores.values() if s["tier"] == tier)
            for tier in ("elite", "trusted", "verified", "new")
        },
        "average_score": round(sum(s["score"] for s in trust_scores.values()) / max(1, len(trust_scores)), 1),
    }
    trace["steps"].append({
        "step": 3.7,
        "agent": "trust_engine",
        "started_at": tr_step_start,
        "duration_ms": int((time.time() - t0) * 1000),
        "tool_calls": [
            {"tool": "compute_trust_score", "args": {"weights": "0.40/0.25/0.15/0.10/0.10"}, "calls": len(trust_scores)},
        ],
        "output": {
            "trust_summary": trust_summary,
            "top_5_scores": sorted(
                [{"provider_id": pid, "score": s["score"], "tier": s["tier"]} for pid, s in trust_scores.items()],
                key=lambda x: -x["score"]
            )[:5],
        },
        "reasoning_text": (
            f"Computed composite trust score for {len(trust_scores)} candidates. "
            f"Distribution — Elite: {trust_summary['tier_distribution']['elite']}, "
            f"Trusted: {trust_summary['tier_distribution']['trusted']}, "
            f"Verified: {trust_summary['tier_distribution']['verified']}, "
            f"New: {trust_summary['tier_distribution']['new']}. "
            f"Average score {trust_summary['average_score']}/100."
        ),
    })

    # STEP 4: Ranking & Reasoning
    r_step_start = datetime.now().isoformat()
    ranking = ranking_reasoning.rank(discovery, intent)
    trace["steps"].append({
        "step": 4,
        "agent": "ranking_reasoning",
        "started_at": r_step_start,
        "duration_ms": int((time.time() - t0) * 1000),
        "tool_calls": [
            {"tool": "compute_score", "args": {"urgency": intent["urgency"], "weights_used": ranking.get("weights_used_urgency")}, "calls": len(discovery["candidates"])}
        ],
        "output": {
            "top_3_ids": [t["provider_id"] for t in ranking["top_3"]],
            "decision_summary_en": ranking["decision_summary_en"],
            "decision_summary_ur": ranking["decision_summary_ur"]
        },
        "reasoning_text": ranking["decision_summary_en"]
    })

    # STEP 4.5: Pricing Engine — compute estimate breakdown for the top match
    if ranking.get("top_3"):
        p_step_start = datetime.now().isoformat()
        top = ranking["top_3"][0]
        top_candidate = next((c for c in discovery["candidates"] if c["provider_id"] == top["provider_id"]), None)
        distance_km = top_candidate["distance_km"] if top_candidate else 3.0
        provider_range = top_candidate["raw"].get("price_range") if top_candidate else None
        pricing = estimate_price(
            category_id=intent["service_category_id"],
            distance_km=distance_km,
            urgency=intent.get("urgency", "normal"),
            provider_price_range=provider_range,
        )
        # Attach pricing onto each top_3 entry
        for entry in ranking["top_3"]:
            cand = next((c for c in discovery["candidates"] if c["provider_id"] == entry["provider_id"]), None)
            if cand:
                entry["pricing"] = estimate_price(
                    category_id=intent["service_category_id"],
                    distance_km=cand["distance_km"],
                    urgency=intent.get("urgency", "normal"),
                    provider_price_range=cand["raw"].get("price_range"),
                )
                entry["trust"] = trust_scores.get(entry["provider_id"])

        trace["steps"].append({
            "step": 4.5,
            "agent": "pricing_engine",
            "started_at": p_step_start,
            "duration_ms": int((time.time() - t0) * 1000),
            "tool_calls": [
                {"tool": "estimate_price", "args": {
                    "category": intent["service_category_id"],
                    "distance_km": round(distance_km, 1),
                    "urgency": intent.get("urgency", "normal"),
                }, "result": f"PKR {pricing['final_pkr']}"},
                {"tool": "apply_commission", "args": {"percent": pricing["commission_percent"]}, "result": f"PKR {pricing['platform_commission_pkr']}"},
            ],
            "output": pricing,
            "reasoning_text": pricing["reasoning"],
        })
        ranking["pricing_top_match"] = pricing

    trace["completed_at"] = datetime.now().isoformat()
    trace["duration_ms"] = int((time.time() - t0) * 1000)
    trace["final_state"] = {"status": "awaiting_user_choice", "presented_options": len(ranking["top_3"])}

    store.add_trace(trace)

    return {
        "trace_id": tid,
        "intent": intent,
        "crisis": crisis_result,
        "discovery_summary": {
            "total_matched": discovery["total_matched"],
            "filtered_out_count": len(discovery["filtered_out"])
        },
        "ranking": ranking,
        "trace": trace
    }


@router.post("/confirm-booking")
async def confirm_booking(payload: ConfirmBookingRequest, request: Request):
    store = request.app.state.store
    trace = store.traces.get(payload.trace_id)
    if not trace:
        return {"error": "trace_not_found"}

    # Find original intent in trace
    intent = None
    for s in trace["steps"]:
        if s.get("agent") == "intent_parser":
            intent = s["output"]
            break
    if not intent:
        return {"error": "intent_not_in_trace"}

    # Use provided time_preference or fall back to intent
    time_pref = payload.time_preference or intent["time"]["preference"]
    time_specific = payload.time_specific_iso or intent["time"]["specific_iso"]

    t0 = time.time()

    # STEP 5: Booking Executor
    book_started = datetime.now().isoformat()
    booking_req = BookingCreate(
        provider_id=payload.chosen_provider_id,
        user=payload.user,
        intent=intent,
        time_preference=time_pref,
        time_specific_iso=time_specific
    )
    booking = await create_booking(booking_req, request)

    trace["steps"].append({
        "step": 5,
        "agent": "booking_executor",
        "started_at": book_started,
        "duration_ms": int((time.time() - t0) * 1000),
        "tool_calls": [
            {"tool": "generate_booking_id", "result": booking["booking_id"]},
            {"tool": "reserve_slot", "args": {"provider_id": payload.chosen_provider_id, "slot_iso": booking["scheduled_for"]}, "result": "success"},
            {"tool": "create_booking_record", "result": "stored"},
            {"tool": "generate_receipt", "result": booking["receipt"]["receipt_id"]},
            {"tool": "draft_user_notification", "result": "ready"},
            {"tool": "draft_provider_notification", "result": "ready"},
            {"tool": "generate_ics_calendar", "result": "ready"},
            {"tool": "update_system_state", "result": f"{len(booking['system_state_changes'])} changes applied"}
        ],
        "output": {
            "booking_id": booking["booking_id"],
            "receipt_id": booking["receipt"]["receipt_id"],
            "scheduled_for": booking["scheduled_for"],
            "state_changes": booking["system_state_changes"]
        },
        "reasoning_text": f"Booking executed end-to-end with 8 tool calls. Slot reserved at {booking['scheduled_for']}. Notifications drafted for user and provider."
    })

    # STEP 6: Follow-up Automator
    f_started = datetime.now().isoformat()
    followup = await generate_followup_plan(
        {"booking_id": booking["booking_id"], "language": intent.get("language_detected", "roman_urdu")},
        request
    )
    trace["steps"].append({
        "step": 6,
        "agent": "followup_automator",
        "started_at": f_started,
        "duration_ms": int((time.time() - t0) * 1000),
        "tool_calls": [
            {"tool": "schedule_event", "calls": followup["total_events_scheduled"]},
            {"tool": "register_branching_rule", "calls": len(followup["branching_rules"])}
        ],
        "output": {
            "follow_up_plan_id": followup["follow_up_plan_id"],
            "total_events_scheduled": followup["total_events_scheduled"],
            "completion_estimated_at": followup["completion_estimated_at"]
        },
        "reasoning_text": followup["reasoning"]
    })

    trace["final_state"] = {
        "status": "confirmed_with_followup_scheduled",
        "booking_id": booking["booking_id"],
        "follow_up_plan_id": followup["follow_up_plan_id"]
    }
    trace["completed_at"] = datetime.now().isoformat()

    return {
        "trace_id": payload.trace_id,
        "booking": booking,
        "followup_plan": followup,
        "trace": trace
    }


@router.get("/insights")
async def insights(request: Request):
    """Mode B insights from booking history (Challenge 1 crossover)."""
    return crisis_specialist.generate_insights(request.app.state.store)
