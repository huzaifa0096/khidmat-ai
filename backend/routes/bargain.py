"""
Bargain route — exposes the 7th agent (Bargain Agent) over HTTP.

Endpoints:
  POST /api/bargain/negotiate         single-round negotiation
  POST /api/bargain/session           multi-round session (full session in one call)
"""
from fastapi import APIRouter, Request
from pydantic import BaseModel
from typing import Optional

from agents.bargain_agent import negotiate, negotiate_full_session

router = APIRouter()


class NegotiateRequest(BaseModel):
    provider_id: str
    customer_offer_pkr: int
    proposed_price_pkr: int
    is_repeat_customer: bool = False
    urgency: str = "normal"
    round_number: int = 1


class SessionRequest(BaseModel):
    provider_id: str
    initial_price_pkr: int
    customer_offers: list[int]
    is_repeat_customer: bool = False
    urgency: str = "normal"


@router.post("/negotiate")
async def bargain_negotiate(payload: NegotiateRequest, request: Request):
    """Run a single bargaining round."""
    store = request.app.state.store
    provider = store.get_provider(payload.provider_id)
    if not provider:
        return {"error": "provider_not_found", "provider_id": payload.provider_id}

    result = negotiate(
        provider=provider,
        customer_offer_pkr=payload.customer_offer_pkr,
        proposed_price_pkr=payload.proposed_price_pkr,
        is_repeat_customer=payload.is_repeat_customer,
        urgency=payload.urgency,
        round_number=payload.round_number,
    )

    # Log to state changes
    store.log_state_change({
        "type": "bargain_round",
        "provider_id": payload.provider_id,
        "decision": result["decision"],
        "agreed_price": result["agreed_price_pkr"],
        "round": result["round"],
    })

    return {
        "provider_id": payload.provider_id,
        "provider_business_name": provider.get("business_name"),
        **result,
    }


@router.post("/session")
async def bargain_session(payload: SessionRequest, request: Request):
    """Run a full multi-round negotiation session."""
    store = request.app.state.store
    provider = store.get_provider(payload.provider_id)
    if not provider:
        return {"error": "provider_not_found"}

    result = negotiate_full_session(
        provider=provider,
        initial_price_pkr=payload.initial_price_pkr,
        customer_offers=payload.customer_offers,
        is_repeat_customer=payload.is_repeat_customer,
        urgency=payload.urgency,
    )

    store.log_state_change({
        "type": "bargain_session_complete",
        "provider_id": payload.provider_id,
        "outcome": result["outcome"],
        "final_price": result["final_price_pkr"],
        "rounds": result["total_rounds"],
    })

    return result
