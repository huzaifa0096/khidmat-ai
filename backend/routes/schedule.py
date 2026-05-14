"""Follow-up scheduling — generates the full 7-event timeline for any booking."""
from datetime import datetime, timedelta
from fastapi import APIRouter, Request
from utils.ids import followup_plan_id, event_id

router = APIRouter()


def _generate_followup_events(booking: dict, language: str = "roman_urdu") -> list[dict]:
    slot = datetime.fromisoformat(booking["scheduled_for"])
    provider = booking["provider"]["business_name"]
    cat = booking["service"]["category_name_en"]
    sector = booking["location"]["sector"]
    eta_minutes = booking["service"]["estimated_duration_minutes"]
    end_time = slot + timedelta(minutes=eta_minutes)

    is_ur = language in ("roman_urdu", "urdu", "mixed")

    def msg(ur, en):
        return ur if is_ur else en

    return [
        {
            "event_id": event_id(),
            "trigger_at": (slot - timedelta(hours=24)).isoformat(),
            "type": "reminder_24h",
            "channel": "sms",
            "audience": "user",
            "message_ur": f"Kal aap ki {cat} appointment hai {provider} ke saath {slot.strftime('%I:%M %p')} baje {sector} par. Confirm karne ke liye reply karein YES.",
            "message_en": f"Reminder: Tomorrow's {cat} appointment with {provider} at {slot.strftime('%I:%M %p')} in {sector}. Reply YES to confirm.",
            "auto_send": True,
            "expected_response": "confirmation"
        },
        {
            "event_id": event_id(),
            "trigger_at": (slot - timedelta(hours=2)).isoformat(),
            "type": "provider_status_check",
            "channel": "whatsapp",
            "audience": "provider",
            "message_ur": f"Bhai aap ka {cat} appointment 2 ghante mein hai {sector} par. Aap on the way honge?",
            "message_en": f"Reminder: {cat} appointment in 2 hours at {sector}. Confirm you're prepared.",
            "auto_send": True,
            "expected_response": "confirmation_or_eta"
        },
        {
            "event_id": event_id(),
            "trigger_at": (slot - timedelta(minutes=30)).isoformat(),
            "type": "user_eta_update",
            "channel": "push",
            "audience": "user",
            "message_ur": f"{provider} aap ke ghar ki taraf rawana ho rahe hain. ETA 30 min.",
            "message_en": f"{provider} is on the way. ETA 30 min.",
            "auto_send": True
        },
        {
            "event_id": event_id(),
            "trigger_at": (slot + timedelta(minutes=30)).isoformat(),
            "type": "service_progress_check",
            "channel": "in_app",
            "audience": "user",
            "message_ur": "Kya service shuru ho gayi hai? Reply: 1=Haan shuru hui, 2=Provider nahi aaya, 3=Koi issue hai",
            "message_en": "Has the service started? Reply: 1=Yes started, 2=Provider not arrived, 3=Issue",
            "auto_send": True,
            "expected_response": "1|2|3"
        },
        {
            "event_id": event_id(),
            "trigger_at": end_time.isoformat(),
            "type": "completion_check",
            "channel": "in_app",
            "audience": "user",
            "message_ur": "Aap ki service complete ho gayi? Reply: 1=Mukammal, 2=Abhi nahi, 3=Koi issue hai",
            "message_en": "Service complete? Reply: 1=Complete, 2=Not yet, 3=Issue",
            "auto_send": True,
            "expected_response": "1|2|3"
        },
        {
            "event_id": event_id(),
            "trigger_at": (end_time + timedelta(minutes=15)).isoformat(),
            "type": "rating_prompt",
            "channel": "push",
            "audience": "user",
            "message_ur": f"Please {provider} ko rate karein (1-5 stars) aur 1 line feedback dein.",
            "message_en": f"Please rate {provider} (1-5 stars) and share a one-line feedback.",
            "auto_send": True
        },
        {
            "event_id": event_id(),
            "trigger_at": (end_time + timedelta(days=1)).isoformat(),
            "type": "rebooking_prompt",
            "channel": "in_app",
            "audience": "user",
            "message_ur": "Aap ki service achhi rahi! Aglay visit ki schedule karein?",
            "message_en": "Glad your service went well! Schedule your next visit?",
            "auto_send": False
        }
    ]


@router.post("/event")
async def schedule_event(payload: dict, request: Request):
    """Schedule a single event (mock — just stores it)."""
    store = request.app.state.store
    payload["scheduled_at"] = datetime.now().isoformat()
    store.events.append(payload)
    return {"success": True, "event": payload}


@router.post("/followup-plan")
async def generate_followup_plan(payload: dict, request: Request):
    """Generate a complete follow-up plan for a booking."""
    store = request.app.state.store
    booking_id = payload.get("booking_id")
    language = payload.get("language", "roman_urdu")

    booking = store.bookings.get(booking_id)
    if not booking:
        return {"error": "booking_not_found"}

    events = _generate_followup_events(booking, language)
    plan_id = followup_plan_id()

    plan = {
        "booking_id": booking_id,
        "follow_up_plan_id": plan_id,
        "language": language,
        "events": events,
        "branching_rules": [
            {"if_response": "1", "on_event_type": "service_progress_check", "then": "mark_in_progress"},
            {"if_response": "2", "on_event_type": "service_progress_check", "then": "escalate_to_provider"},
            {"if_response": "3", "on_event_type": "service_progress_check", "then": "escalate_to_support"},
            {"if_response": "1", "on_event_type": "completion_check", "then": "mark_complete"},
            {"if_response": "3", "on_event_type": "completion_check", "then": "escalate_to_support"}
        ],
        "issue_detection_keywords": ["nahi aaya", "didn't come", "problem", "complaint", "refund", "shikayat"],
        "completion_estimated_at": events[4]["trigger_at"],
        "total_events_scheduled": len(events),
        "reasoning": f"Generated standard service follow-up for {booking['service']['category']} with {len(events)} touchpoints; included escalation rules for no-show and issues; language: {language}."
    }

    for e in events:
        store.events.append(e)

    return plan


@router.get("/events")
async def list_events(request: Request):
    return {"events": request.app.state.store.events}
