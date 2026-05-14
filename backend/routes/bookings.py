"""Booking simulation — generates IDs, receipts, ICS calendar, notification drafts, state changes."""
from datetime import datetime, timedelta
from fastapi import APIRouter, Request
from pydantic import BaseModel
from typing import Optional
from utils.ids import booking_id, receipt_id
from agents.pricing_engine import estimate_price
from agents.trust_engine import compute_trust_score

router = APIRouter()


def _resolve_slot_iso(time_pref: str, specific_iso: Optional[str] = None) -> str:
    now = datetime.now()
    if specific_iso:
        return specific_iso
    mapping = {
        "now": now + timedelta(minutes=30),
        "today_morning": now.replace(hour=10, minute=0, second=0, microsecond=0),
        "today_afternoon": now.replace(hour=14, minute=0, second=0, microsecond=0),
        "today_evening": now.replace(hour=18, minute=0, second=0, microsecond=0),
        "tomorrow_morning": (now + timedelta(days=1)).replace(hour=10, minute=0, second=0, microsecond=0),
        "tomorrow_afternoon": (now + timedelta(days=1)).replace(hour=14, minute=0, second=0, microsecond=0),
        "tomorrow_evening": (now + timedelta(days=1)).replace(hour=18, minute=0, second=0, microsecond=0),
        "flexible": (now + timedelta(days=1)).replace(hour=10, minute=0, second=0, microsecond=0),
    }
    return mapping.get(time_pref, mapping["flexible"]).isoformat()


def _format_slot_human(iso: str) -> str:
    try:
        dt = datetime.fromisoformat(iso.replace("Z", "+00:00"))
        return dt.strftime("%a, %d %b %Y — %I:%M %p")
    except Exception:
        return iso


def _generate_ics(booking: dict) -> str:
    slot = booking["scheduled_for"]
    end = (datetime.fromisoformat(slot) + timedelta(minutes=90)).isoformat()
    return f"""BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Khidmat AI//EN
BEGIN:VEVENT
UID:{booking['booking_id']}@khidmat.ai
DTSTAMP:{datetime.now().strftime('%Y%m%dT%H%M%SZ')}
DTSTART:{slot.replace('-','').replace(':','').split('+')[0]}
DTEND:{end.replace('-','').replace(':','').split('+')[0]}
SUMMARY:Khidmat AI — {booking['provider']['business_name']}
LOCATION:{booking['location']['sector']}, {booking['location']['city']}
DESCRIPTION:Booking ID: {booking['booking_id']}\\nService: {booking['service']['category']}
END:VEVENT
END:VCALENDAR"""


@router.post("/reserve-slot")
async def reserve_slot(payload: dict, request: Request):
    store = request.app.state.store
    provider_id = payload["provider_id"]
    slot_iso = payload["slot_iso"]
    # Naive mock — always succeeds unless explicitly marked taken in store
    store.log_state_change({
        "type": "slot_reserved",
        "provider_id": provider_id,
        "slot_iso": slot_iso,
        "ts": datetime.now().isoformat()
    })
    return {"success": True, "slot_iso": slot_iso}


class BookingCreate(BaseModel):
    provider_id: str
    user: dict  # { id, name, phone }
    intent: dict
    time_preference: str
    time_specific_iso: Optional[str] = None
    pricing: Optional[dict] = None  # optional pre-computed pricing breakdown


def _compute_distance_km_approx(provider: dict, intent: dict) -> float:
    """Best-effort distance for pricing if discovery didn't pre-compute."""
    p_city = (provider.get("city") or "").lower()
    p_sec = (provider.get("sector") or "").lower()
    i_city = (intent.get("location", {}).get("city") or "").lower()
    i_sec = (intent.get("location", {}).get("sector") or "").lower()
    if p_city != i_city:
        return 12.0
    if p_sec == i_sec:
        return 1.2
    return 4.5


@router.post("")
async def create_booking(payload: BookingCreate, request: Request):
    store = request.app.state.store
    provider = store.get_provider(payload.provider_id)
    if not provider:
        return {"error": "provider_not_found"}

    bid = booking_id()
    slot_iso = _resolve_slot_iso(payload.time_preference, payload.time_specific_iso)
    created_at = datetime.now().isoformat()
    category = store.get_category(payload.intent.get("service_category_id"))
    cat_name = category["name_en"] if category else payload.intent.get("service_category_id")

    rcpt_id = receipt_id()
    slot_human = _format_slot_human(slot_iso)
    visit_charge = 500
    estimated = provider.get("price_range", "PKR 1500-3500")

    # Compute pricing breakdown via the Pricing Engine if not supplied.
    pricing = payload.pricing
    if not pricing:
        distance_km = _compute_distance_km_approx(provider, payload.intent)
        pricing = estimate_price(
            category_id=payload.intent.get("service_category_id", "default"),
            distance_km=distance_km,
            urgency=payload.intent.get("urgency", "normal"),
            provider_price_range=provider.get("price_range"),
        )
    final_pkr = pricing["final_pkr"]
    commission = pricing["platform_commission_pkr"]
    provider_earnings = pricing["provider_earnings_pkr"]
    trust = compute_trust_score(provider)

    booking = {
        "booking_id": bid,
        "status": "pending_provider_acceptance",
        "created_at": created_at,
        "accepted_at": None,
        "declined_at": None,
        "scheduled_for": slot_iso,
        "provider": {
            "id": provider["id"],
            "name": provider["name"],
            "business_name": provider["business_name"],
            "phone": provider["phone"],
            "rating": provider["rating"],
            "profile_image": provider["profile_image"]
        },
        "user": payload.user,
        "service": {
            "category": payload.intent.get("service_category_id"),
            "category_name_en": cat_name,
            "estimated_duration_minutes": 90
        },
        "location": {
            "city": payload.intent["location"]["city"],
            "sector": payload.intent["location"]["sector"],
            "address_text": f"{payload.intent['location']['sector']}, {payload.intent['location']['city'].title()}"
        },
        "pricing": pricing,
        "trust": trust,
        "receipt": {
            "receipt_id": rcpt_id,
            "lines": [
                {"label": "Service", "value": f"{cat_name} — Diagnosis & Service"},
                {"label": "Provider", "value": provider["business_name"]},
                {"label": "Slot", "value": slot_human},
                {"label": "Location", "value": f"{payload.intent['location']['sector']}, {payload.intent['location']['city'].title()}"},
                {"label": "Trust Score", "value": f"{trust['score']}/100 ({trust['tier_label']})"},
                {"label": "Base Price", "value": f"PKR {pricing['base_pkr']:,}"},
                {"label": "Distance Cost", "value": f"PKR {pricing['distance_cost_pkr']:,} ({pricing['distance_km']} km)"},
                {"label": "Urgency Multiplier", "value": f"×{pricing['urgency_multiplier']:.2f} ({pricing['urgency']})"},
                {"label": "Provider Variation", "value": f"×{pricing['provider_variation']:.2f}"},
                {"label": "Visit Charge", "value": f"PKR {visit_charge}"},
                {"label": "Estimated Total", "value": f"PKR {final_pkr:,} (range PKR {pricing['range_low_pkr']:,}–{pricing['range_high_pkr']:,})"},
                {"label": "Platform Commission (5%)", "value": f"-PKR {commission:,}"},
                {"label": "Provider Earnings", "value": f"PKR {provider_earnings:,}"},
            ],
            "pricing_breakdown": pricing,
            "qr_payload": f"khidmat://booking/{bid}"
        },
        "notifications": {
            "user_in_app": f"✅ Booking Confirmed!\n{provider['business_name']} will arrive at {payload.intent['location']['sector']} on {slot_human}. Booking ID: {bid}.",
            "user_sms": f"Khidmat AI: Booking confirmed with {provider['business_name']} for {slot_human} at {payload.intent['location']['sector']}. Reply CANCEL to cancel. Receipt: khidmat.ai/r/{bid}",
            "provider_whatsapp": (
                f"Assalam-o-alaikum {provider['name']} bhai. Aap ko ek booking mili hai:\n"
                f"• Service: {cat_name}\n"
                f"• Time: {slot_human}\n"
                f"• Location: {payload.intent['location']['sector']} {payload.intent['location']['city'].title()}\n"
                f"• Customer: {payload.user.get('name','User')} ({payload.user.get('phone','N/A')})\n"
                f"Reply YES to confirm."
            ),
            "provider_sms": f"Khidmat: New booking — {cat_name}, {payload.intent['location']['sector']}, {slot_human}. Confirm: khidmat.ai/p/{bid}"
        },
        "calendar_ics_url": f"/api/bookings/{bid}/ics",
        "system_state_changes": [
            {"type": "provider_availability", "provider_id": provider["id"], "slot_taken": slot_iso},
            {"type": "booking_created", "booking_id": bid},
            {"type": "user_history", "user_id": payload.user.get("id", "U001"), "added": bid}
        ],
        "action_log": [
            {"step": 1, "action": "generate_booking_id", "result": bid, "ts": created_at},
            {"step": 2, "action": "reserve_slot", "result": "success", "ts": created_at},
            {"step": 3, "action": "create_booking_record", "result": "stored", "ts": created_at},
            {"step": 4, "action": "generate_receipt", "result": rcpt_id, "ts": created_at},
            {"step": 5, "action": "draft_user_notification", "result": "ready", "ts": created_at},
            {"step": 6, "action": "draft_provider_notification", "result": "ready", "ts": created_at},
            {"step": 7, "action": "generate_ics_calendar", "result": "ready", "ts": created_at},
            {"step": 8, "action": "update_system_state", "result": "applied", "ts": created_at}
        ]
    }

    booking["calendar_ics"] = _generate_ics(booking)
    store.add_booking(booking)
    return booking


@router.get("/{booking_id}")
async def get_booking(booking_id: str, request: Request):
    store = request.app.state.store
    b = store.bookings.get(booking_id)
    if not b:
        return {"error": "not_found"}
    return b


@router.get("/{booking_id}/status")
async def get_booking_status(booking_id: str, request: Request):
    """Poll-friendly status endpoint for the customer to watch acceptance."""
    store = request.app.state.store
    b = store.bookings.get(booking_id)
    if not b:
        return {"error": "not_found"}
    return {
        "booking_id": booking_id,
        "status": b.get("status"),
        "accepted_at": b.get("accepted_at"),
        "declined_at": b.get("declined_at"),
        "cancelled_at": b.get("cancelled_at"),
        "cancellation_reason": b.get("cancellation_reason"),
        "cancelled_by": b.get("cancelled_by"),
        "provider_name": b["provider"].get("business_name"),
    }


@router.post("/{booking_id}/cancel")
async def cancel_booking(booking_id: str, payload: dict, request: Request):
    """Cancel a booking with a reason. by_party: 'customer' or 'provider'."""
    store = request.app.state.store
    b = store.bookings.get(booking_id)
    if not b:
        return {"error": "not_found"}

    if b.get("status") in ("cancelled_by_customer", "cancelled_by_provider", "declined_by_provider"):
        return {"error": "already_cancelled", "current_status": b["status"]}

    by_party = payload.get("by_party", "customer")
    reason = payload.get("reason", "No reason provided")
    reason_code = payload.get("reason_code", "other")
    new_status = "cancelled_by_provider" if by_party == "provider" else "cancelled_by_customer"
    now_iso = datetime.now().isoformat()

    b["status"] = new_status
    b["cancelled_at"] = now_iso
    b["cancellation_reason"] = reason
    b["cancellation_reason_code"] = reason_code
    b["cancelled_by"] = by_party

    store.log_state_change({
        "type": "booking_cancelled",
        "booking_id": booking_id,
        "by_party": by_party,
        "reason_code": reason_code,
        "reason": reason,
        "ts": now_iso,
    })

    return {
        "success": True,
        "booking_id": booking_id,
        "new_status": new_status,
        "cancelled_at": now_iso,
        "reason": reason,
        "by_party": by_party,
    }


@router.get("/{booking_id}/ics")
async def get_ics(booking_id: str, request: Request):
    store = request.app.state.store
    b = store.bookings.get(booking_id)
    if not b:
        return {"error": "not_found"}
    return {"ics": b.get("calendar_ics", "")}


@router.get("")
async def list_bookings(request: Request, user_id: Optional[str] = None, limit: int = 50):
    store = request.app.state.store
    bookings = list(store.bookings.values())
    if user_id:
        bookings = [b for b in bookings if b["user"].get("id") == user_id]
    bookings.sort(key=lambda b: b["created_at"], reverse=True)
    return {"total": len(bookings), "bookings": bookings[:limit]}
