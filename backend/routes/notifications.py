"""Notification drafts (no real sending — simulation only)."""
from fastapi import APIRouter, Request
from datetime import datetime

router = APIRouter()


@router.post("/draft")
async def draft_notification(payload: dict, request: Request):
    """Generates a notification draft from booking data."""
    booking = payload.get("booking", {})
    channel = payload.get("channel", "in_app")
    audience = payload.get("audience", "user")

    notifications = booking.get("notifications", {})
    key = f"{audience}_{channel}"
    text = notifications.get(key) or notifications.get(f"{audience}_in_app", "Notification ready.")
    return {
        "ts": datetime.now().isoformat(),
        "channel": channel,
        "audience": audience,
        "text": text,
        "would_send_to": booking.get("user", {}).get("phone") if audience == "user" else booking.get("provider", {}).get("phone"),
        "status": "drafted_not_sent"
    }
