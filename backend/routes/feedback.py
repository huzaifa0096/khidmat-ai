"""
Feedback / Rating route — customers rate providers after service completion.

Updates the provider's rating in-place (simulated weighted average over
existing reviews_count) and persists the feedback as a system state change
so it appears in the trace + admin analytics.
"""
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Request
from pydantic import BaseModel, Field

router = APIRouter()


class FeedbackRequest(BaseModel):
    booking_id: str
    rating: float = Field(..., ge=1.0, le=5.0)
    review: Optional[str] = ""
    tags: Optional[list[str]] = None  # ["on_time", "professional", "fair_price", ...]


@router.post("/feedback")
async def submit_feedback(payload: FeedbackRequest, request: Request):
    store = request.app.state.store
    b = store.bookings.get(payload.booking_id)
    if not b:
        return {"error": "booking_not_found"}

    provider_id = b["provider"]["id"]
    provider = store.get_provider(provider_id)
    if not provider:
        return {"error": "provider_not_found"}

    # Weighted rolling rating update
    old_rating = float(provider.get("rating", 4.0))
    reviews_count = int(provider.get("reviews_count", 50))
    new_rating = round(((old_rating * reviews_count) + payload.rating) / (reviews_count + 1), 2)
    provider["rating"] = new_rating
    provider["reviews_count"] = reviews_count + 1

    # Persist on the booking
    fb_record = {
        "rating": payload.rating,
        "review": payload.review or "",
        "tags": payload.tags or [],
        "submitted_at": datetime.now().isoformat(),
        "old_provider_rating": old_rating,
        "new_provider_rating": new_rating,
    }
    b["feedback"] = fb_record
    b["status"] = "completed"
    b["completed_at"] = fb_record["submitted_at"]

    store.log_state_change({
        "type": "feedback_submitted",
        "booking_id": payload.booking_id,
        "provider_id": provider_id,
        "rating": payload.rating,
        "rating_delta": round(new_rating - old_rating, 3),
        "ts": fb_record["submitted_at"],
    })

    return {
        "success": True,
        "booking_id": payload.booking_id,
        "provider_id": provider_id,
        "rating_submitted": payload.rating,
        "provider_rating_now": new_rating,
        "provider_reviews_now": reviews_count + 1,
        "booking_status": "completed",
    }


@router.get("/feedback/{booking_id}")
async def get_feedback(booking_id: str, request: Request):
    store = request.app.state.store
    b = store.bookings.get(booking_id)
    if not b:
        return {"error": "booking_not_found"}
    return {
        "booking_id": booking_id,
        "feedback": b.get("feedback"),
        "status": b.get("status"),
    }
