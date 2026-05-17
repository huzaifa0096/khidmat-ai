"""
Khidmat AI — FastAPI Backend
Main entry point. Wires routers, middleware, and serves the orchestration API.
"""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

from routes import catalog, providers, geo, score, bookings, notifications, schedule, emergency, external, state, orchestrate, traces, provider_self, feedback, chat, admin, bargain, estimate, tracking
from utils.store import Store

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    app.state.store = Store()
    app.state.store.load()
    yield
    # Shutdown — persist if needed
    app.state.store.persist()


app = FastAPI(
    title="Khidmat AI Orchestration API",
    description="Agentic backend for AI-powered service marketplace across Pakistan. Built for the #AISeekho 2026 Google Antigravity Hackathon.",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {
        "service": "Khidmat AI",
        "version": "1.0.0",
        "challenge": "Challenge 2 — AI Service Orchestrator for Informal Economy",
        "antigravity_workflow": "khidmat_main_orchestration_v1",
        "agents": [
            "intent_parser", "provider_discovery", "crisis_specialist",
            "trust_engine", "ranking_reasoning", "pricing_engine",
            "booking_executor", "followup_automator"
        ],
        "docs": "/docs"
    }


@app.get("/health")
async def health():
    return {"status": "ok", "providers_loaded": len(app.state.store.providers)}


# Register routers
app.include_router(catalog.router, prefix="/api/catalog", tags=["Catalog"])
app.include_router(providers.router, prefix="/api/providers", tags=["Providers"])
app.include_router(geo.router, prefix="/api/geo", tags=["Geo"])
app.include_router(score.router, prefix="/api/score", tags=["Scoring"])
app.include_router(bookings.router, prefix="/api/bookings", tags=["Bookings"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(schedule.router, prefix="/api/schedule", tags=["Scheduling"])
app.include_router(emergency.router, prefix="/api", tags=["Emergency"])
app.include_router(external.router, prefix="/api/external", tags=["External"])
app.include_router(state.router, prefix="/api/state", tags=["State"])
app.include_router(orchestrate.router, prefix="/api/orchestrate", tags=["Orchestration"])
app.include_router(traces.router, prefix="/api/traces", tags=["Agent Traces"])
app.include_router(provider_self.router, prefix="/api/providers-self", tags=["Provider Self-Service"])
app.include_router(feedback.router, prefix="/api/bookings", tags=["Feedback"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(bargain.router, prefix="/api/bargain", tags=["Bargain"])
app.include_router(estimate.router, prefix="/api/estimate", tags=["Photo Estimate"])
app.include_router(tracking.router, prefix="/api/tracking", tags=["Live Tracking"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=os.getenv("HOST", "0.0.0.0"), port=int(os.getenv("PORT", 8000)), reload=True)
