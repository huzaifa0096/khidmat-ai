"""
In-app chat route — messages between a customer and the provider on a booking.

Mock implementation — messages live in the booking record. No realtime
push; the client polls GET to keep things simple.
"""
from datetime import datetime
from typing import Literal
from fastapi import APIRouter, Request
from pydantic import BaseModel

router = APIRouter()


SUGGESTED_QUICK_REPLIES = {
    "customer": [
        "Kitne der mein pohchain gay?",
        "Gate khula hai, seedha 2nd floor par aa jayein",
        "Thank you!",
        "Mujhe extra parts chahiye honge?",
    ],
    "provider": [
        "Bhai 15 minute mein pohch raha hun",
        "Aap ki location confirm hai?",
        "Done — kal subah aap ko receipt bhejta hun",
        "Service complete — rating de dijiye",
    ],
}


class MessageCreate(BaseModel):
    booking_id: str
    sender: Literal["customer", "provider"]
    text: str


@router.post("/messages")
async def send_message(payload: MessageCreate, request: Request):
    store = request.app.state.store
    b = store.bookings.get(payload.booking_id)
    if not b:
        return {"error": "booking_not_found"}

    if "messages" not in b:
        b["messages"] = []

    msg = {
        "id": f"MSG-{len(b['messages']) + 1:04d}",
        "sender": payload.sender,
        "text": payload.text.strip()[:1000],
        "ts": datetime.now().isoformat(),
        "delivered": True,
        "read": False,
    }
    b["messages"].append(msg)
    store.log_state_change({
        "type": "chat_message",
        "booking_id": payload.booking_id,
        "sender": payload.sender,
        "ts": msg["ts"],
    })
    return {"success": True, "message": msg, "total": len(b["messages"])}


@router.get("/threads")
async def list_threads(
    request: Request,
    user_id: str | None = None,
    provider_id: str | None = None,
):
    """Return all bookings (chat threads) belonging to a customer or provider,
    with last message preview. Powers the 'Chat History' screen on both sides."""
    store = request.app.state.store
    threads = []
    for b in list(store.bookings.values()):
        if not isinstance(b, dict):
            continue
        booking_user = b.get("user") or {}
        booking_provider = b.get("provider") or {}
        # Filter by either user or provider
        if user_id and booking_user.get("id") != user_id:
            continue
        if provider_id and booking_provider.get("id") != provider_id:
            continue
        if not user_id and not provider_id:
            # No filter — show recent (demo fallback)
            pass

        msgs = b.get("messages") or []
        # Pick last non-system message preview
        last = next((m for m in reversed(msgs) if m.get("sender") != "system"), msgs[-1] if msgs else None)
        last_text = (last.get("text") if last else None) or (
            f"Booking {b.get('booking_id')} confirmed — say hello!"
        )
        last_ts = (last.get("ts") if last else None) or b.get("created_at", "")
        last_sender = last.get("sender") if last else "system"

        unread = sum(1 for m in msgs if not m.get("read") and m.get("sender") != "system")

        threads.append({
            "booking_id": b.get("booking_id"),
            "status": b.get("status", "confirmed"),
            "counterparty_name": booking_provider.get("business_name", "Service Provider") if user_id else booking_user.get("name", "Customer"),
            "counterparty_avatar": booking_provider.get("profile_image") if user_id else None,
            "service_name": (b.get("service") or {}).get("category_name_en", "Service"),
            "scheduled_for": b.get("scheduled_for", ""),
            "last_message": last_text[:120],
            "last_sender": last_sender,
            "last_ts": last_ts,
            "unread_count": unread,
        })

    threads.sort(key=lambda t: t.get("last_ts", ""), reverse=True)
    return {"total": len(threads), "threads": threads[:50]}


@router.get("/messages/{booking_id}")
async def list_messages(booking_id: str, request: Request, since: str | None = None):
    store = request.app.state.store
    b = store.bookings.get(booking_id)
    if not b:
        return {"messages": [], "error": "booking_not_found"}
    msgs = list(b.get("messages", []))

    # Seed with two welcome messages if empty so the screen never looks dead
    if not msgs:
        now = datetime.now().isoformat()
        msgs = [
            {
                "id": "MSG-system-1",
                "sender": "system",
                "text": f"Booking {booking_id} confirmed. Chat secured by Khidmat AI.",
                "ts": now,
                "delivered": True,
                "read": True,
            },
            {
                "id": "MSG-provider-greet",
                "sender": "provider",
                "text": f"Assalam-o-alaikum! {b['provider']['business_name']} se rabta. Aap ki booking mil gayi hai — ETA bata dunga shortly.",
                "ts": now,
                "delivered": True,
                "read": False,
            },
        ]
        b["messages"] = msgs
    if since:
        msgs = [m for m in msgs if m["ts"] > since]
    return {
        "booking_id": booking_id,
        "messages": msgs,
        "total": len(b.get("messages", [])),
        "quick_replies": SUGGESTED_QUICK_REPLIES,
    }
