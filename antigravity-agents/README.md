# Antigravity Agent System — Khidmat AI

This folder contains the complete agent definitions for the **Khidmat AI** service orchestrator. These are designed to be imported into Google Antigravity as the orchestration brain of the system.

## Agent Roster

| # | Agent | Role | Primary Tools |
|---|---|---|---|
| 1 | **Intent Parser** | Understands user request in Urdu/Roman Urdu/English; extracts service type, location, time, urgency | LLM (Gemini Pro), translation |
| 2 | **Provider Discovery** | Finds candidate providers via location + category | Provider DB, Maps API |
| 3 | **Ranking & Reasoning** | Ranks candidates with explainable scoring (distance, rating, availability, price, language match) | Scoring engine, distance calc |
| 4 | **Booking Executor** | Simulates booking, generates receipt, calendar invite | Booking DB, calendar tool, notification tool |
| 5 | **Follow-up Automator** | Schedules reminders, status checks, completion confirmations | Scheduler, SMS/WhatsApp draft tool |
| 6 | **Crisis & Insights Specialist** | Crossover agent — handles emergency routing (Challenge 3 flavor) and demand-trend insights (Challenge 1 flavor) | Weather API, traffic API, analytics |

## Workflow

```
User Input (text/voice)
        │
        ▼
┌──────────────────────────┐
│  1. Intent Parser Agent  │ ──▶ extracts: service, location, time, urgency
└──────────────────────────┘
        │
        ▼ if emergency detected
┌──────────────────────────────────────┐
│  6a. Crisis Specialist (priority)    │ ──▶ activates emergency routing
└──────────────────────────────────────┘
        │
        ▼
┌──────────────────────────┐
│  2. Provider Discovery   │ ──▶ candidates: [P1042, P1087, P1112, ...]
└──────────────────────────┘
        │
        ▼
┌──────────────────────────┐
│  3. Ranking & Reasoning  │ ──▶ top-3 with reasoning per provider
└──────────────────────────┘
        │
        ▼ user confirms choice
┌──────────────────────────┐
│  4. Booking Executor     │ ──▶ booking_id, receipt, calendar invite
└──────────────────────────┘
        │
        ▼
┌──────────────────────────┐
│  5. Follow-up Automator  │ ──▶ reminder T-1h, status check, completion
└──────────────────────────┘
        │
        ▼ post-booking analytics
┌──────────────────────────────────────┐
│  6b. Insights Specialist (passive)   │ ──▶ demand trends, recommendations
└──────────────────────────────────────┘
```

## Files

- `agents/` — Individual agent definitions (prompt, tools, schema)
- `schemas/` — JSON schemas for inputs/outputs of each agent
- `workflows/` — Full orchestration flows for Antigravity import
- `tools.md` — Tool catalog accessible to all agents
