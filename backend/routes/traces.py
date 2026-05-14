"""Agent trace storage + export (for evaluation evidence)."""
from fastapi import APIRouter, Request

router = APIRouter()


@router.get("")
async def list_traces(request: Request, limit: int = 20):
    store = request.app.state.store
    traces = list(store.traces.values())
    traces.sort(key=lambda t: t["started_at"], reverse=True)
    return {"total": len(traces), "traces": traces[:limit]}


@router.get("/{trace_id}")
async def get_trace(trace_id: str, request: Request):
    store = request.app.state.store
    t = store.traces.get(trace_id)
    if not t:
        return {"error": "not_found"}
    return t


@router.get("/{trace_id}/export")
async def export_trace(trace_id: str, request: Request):
    store = request.app.state.store
    t = store.traces.get(trace_id)
    if not t:
        return {"error": "not_found"}
    return {
        "trace_id": trace_id,
        "format": "antigravity_v1",
        "exported_at": t.get("completed_at"),
        "workflow": t.get("workflow_id"),
        "user_input": t.get("user_input"),
        "steps_count": len(t.get("steps", [])),
        "full_trace": t
    }
