# Antigravity IDE Import Guide

> Step-by-step to import the 6 Khidmat AI agents into Google Antigravity for the live demo.

This guide is what you'll do **before** your presentation to set up Antigravity IDE with our 6 agents ready to run.

---

## Prerequisites

1. **Google Antigravity account** — Sign in at https://antigravity.google.com (or wherever the hackathon directed you)
2. **Hackathon credits redeemed** via https://goo.gle/aiseekho2026-hackcredits2
3. Your project at `D:\Hackathon Challenge\` with the `antigravity-agents/` folder

---

## Step 1: Create a New Antigravity Workspace

1. Open Antigravity IDE
2. **New Project** → name it `khidmat-ai-orchestrator`
3. Select **Agent Orchestration** template (or blank if not available)

---

## Step 2: Configure Tool Endpoints

Antigravity needs to call our FastAPI backend tools. Set the base URL:

| Setting | Value |
|---|---|
| **Base URL** | `http://localhost:8000` (when demoing locally) or your deployed URL |
| **Auth** | None (open API in demo mode) |

For a remote presentation, deploy backend to **Cloud Run** with these env vars set:
- `GEMINI_API_KEY` (optional — falls back to rule-based)

Quick deploy command:
```bash
cd backend
gcloud run deploy khidmat-backend --source . --region us-central1 --allow-unauthenticated
```

---

## Step 3: Import the 6 Agents

For each agent file in `antigravity-agents/agents/`, follow this pattern:

### Agent 1: Intent Parser
- **File:** `antigravity-agents/agents/01_intent_parser.md`
- **In Antigravity:** Click **+ New Agent** → name: `Intent Parser`
- **Description:** Paste the **"Role"** section
- **System prompt:** Paste the entire **"System Prompt"** code block
- **Tools to bind:**
  - `get_service_catalog` → `GET /api/catalog/services`
  - `get_city_catalog` → `GET /api/catalog/cities`
  - `current_datetime` (built-in)

### Agent 2: Provider Discovery
- **File:** `antigravity-agents/agents/02_provider_discovery.md`
- **Name:** `Provider Discovery`
- **Tools:**
  - `find_providers_by_category_and_city` → `GET /api/providers?category={category_id}&city={city_id}`
  - `compute_distance` → `POST /api/geo/distance`
  - `get_sector_coords` → `GET /api/geo/sector`

### Agent 3: Ranking & Reasoning
- **File:** `antigravity-agents/agents/03_ranking_reasoning.md`
- **Name:** `Ranking Brain`
- **Tools:**
  - `compute_score` → `POST /api/score`
  - `compute_score_batch` → `POST /api/score/batch`

### Agent 4: Booking Executor
- **File:** `antigravity-agents/agents/04_booking_executor.md`
- **Name:** `Booking Executor`
- **Tools:**
  - `reserve_slot` → `POST /api/bookings/reserve-slot`
  - `create_booking_record` → `POST /api/bookings`
  - `draft_user_notification` → `POST /api/notifications/draft`
  - `update_system_state` → `POST /api/state/update`

### Agent 5: Follow-up Automator
- **File:** `antigravity-agents/agents/05_followup_automator.md`
- **Name:** `Follow-up Automator`
- **Tools:**
  - `schedule_event` → `POST /api/schedule/event`
  - `generate_followup_plan` → `POST /api/schedule/followup-plan`

### Agent 6: Crisis & Insights Specialist
- **File:** `antigravity-agents/agents/06_crisis_insights.md`
- **Name:** `Crisis Specialist`
- **Tools:**
  - `fetch_weather` → `GET /api/external/weather`
  - `fetch_traffic_density` → `GET /api/external/traffic`
  - `fetch_recent_emergency_reports` → `GET /api/emergency-reports`
  - `create_emergency_ticket` → `POST /api/emergency-tickets`
  - `broadcast_area_alert` → `POST /api/alerts/broadcast`

---

## Step 4: Create the Master Workflow

1. **Workflows** → **+ New Workflow** → name: `khidmat_main_orchestration_v1`
2. Open `antigravity-agents/workflows/main_orchestration.md` and follow the graph
3. Add nodes in order:
   ```
   START
     → Intent Parser
     → [branch: intent.urgency == "emergency"]
         → Crisis Specialist
         → Provider Discovery (with crisis overrides)
       [else]
         → Provider Discovery
     → Ranking & Reasoning
     → PRESENT TO USER (wait state)
     → Booking Executor (on user confirm)
     → Follow-up Automator
   END
   ```
4. Set the **trigger** as: `POST /api/orchestrate/parse-and-rank`

---

## Step 5: Test Run

In Antigravity IDE:
1. Click **Run Workflow**
2. Input: `{ "user_text": "Mujhe kal subah G-13 mein AC technician chahiye" }`
3. Watch the trace render — should show all 5 agents (Intent → Discovery → Ranking → Booking → Follow-up) firing
4. Verify trace exports correctly via `GET /api/traces/{trace_id}/export`

---

## Step 6: Live Demo Cheatsheet

During your hackathon presentation:

| What to show | How |
|---|---|
| **Agent specs** | Open one `.md` file from `antigravity-agents/agents/` — read out the system prompt |
| **Workflow graph** | Show the visual graph in Antigravity IDE |
| **Live execution** | Click Run, enter the AC technician prompt, watch agents fire one by one |
| **Tool calls** | Expand any agent step to show the tool calls + arguments + results |
| **Trace export** | Show the JSON trace download — judges love this for "agentic transparency" |

---

## Step 7: Fallback if Antigravity is Down

If during your demo Antigravity IDE has issues:

1. Show the agent specs files directly in VS Code (`antigravity-agents/agents/`)
2. Demo the mobile app's **Agent War Room** screen — it visualizes the same multi-agent reasoning
3. Show `demo/sample_traces.json` — 5 pre-generated traces ready to walk through
4. Hit the live API: `curl -X POST http://localhost:8000/api/orchestrate/parse-and-rank -d '{"user_text":"..."}'`

The local FastAPI backend runs the **same agents** in Python — judges see identical behavior even without Antigravity Cloud.

---

## Trouble-shooting

| Issue | Fix |
|---|---|
| "Tool 404" | Check FastAPI is running on `localhost:8000`. Test `curl localhost:8000/health` |
| "Workflow fires once then stops" | Antigravity may need branch nodes — see graph in `main_orchestration.md` §STEP 3 |
| "Gemini quota exceeded" | The Intent Parser falls back to rule-based automatically. Demo still works |
| "Cloud Run cold start" | First request takes 10-15s. Pre-warm with `curl <url>/health` before demo |

---

You're now ready to walk judges through the **agentic intelligence** that powers Khidmat AI. The 6 agents, their reasoning, and the tool calls are all visible and explainable — exactly what the **25% Antigravity rubric** is looking for.
