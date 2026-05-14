"""System state mutations and event log."""
from datetime import datetime
from fastapi import APIRouter, Request

router = APIRouter()


@router.post("/update")
async def update_state(payload: dict, request: Request):
    store = request.app.state.store
    payload["ts"] = datetime.now().isoformat()
    store.log_state_change(payload)
    return {"success": True, "change": payload}


@router.get("/log")
async def get_state_log(request: Request):
    store = request.app.state.store
    return {"total": len(store.system_state_log), "log": store.system_state_log}


@router.get("/summary")
async def get_state_summary(request: Request):
    store = request.app.state.store
    return {
        "providers_total": len(store.providers),
        "bookings_total": len(store.bookings),
        "traces_total": len(store.traces),
        "events_total": len(store.events),
        "emergency_tickets_total": len(store.emergency_tickets),
        "alerts_total": len(store.area_alerts),
        "state_log_total": len(store.system_state_log)
    }
