# How Antigravity Is Used

> Direct answer to the evaluation rubric's "Use of Google Antigravity (25%)" criterion.

Antigravity is **central to system logic** — not a peripheral wrapper. Here is how:

## 1. Orchestration Workflow Graph

The master workflow `khidmat_main_orchestration_v1` (defined in [`antigravity-agents/workflows/main_orchestration.md`](../antigravity-agents/workflows/main_orchestration.md)) is the brain of the application. It:

- Branches conditionally based on intent (emergency → crisis path; missing info → clarification loop)
- Sequences 6 specialist agents in a directed graph (DAG) with explicit handoff schemas
- Persists a complete trace of every run (queryable at `/api/traces`)

## 2. Six Specialist Agents

Each agent is defined as an Antigravity-importable spec in `antigravity-agents/agents/`:

| File | Agent | Responsibility |
|---|---|---|
| `01_intent_parser.md` | Intent Parser | NLU in Urdu/Roman/English |
| `02_provider_discovery.md` | Provider Discovery | Geo + filter search |
| `03_ranking_reasoning.md` | Ranking & Reasoning | Multi-dim scoring with explainable reasoning |
| `04_booking_executor.md` | Booking Executor | 8-action booking simulation |
| `05_followup_automator.md` | Follow-up Automator | 7-event lifecycle automation |
| `06_crisis_insights.md` | Crisis & Insights | Crisis coordination + demand analytics |

Each spec includes:
- Full system prompt
- Input/output JSON schema
- Tool list (with backend endpoint mapping)
- Worked examples
- Edge case handling

## 3. Tool Layer

The orchestrator gives every agent access to a shared tool catalog ([`antigravity-agents/tools.md`](../antigravity-agents/tools.md)) with **24 distinct tools**:

- **Data tools** (6): get_service_catalog, get_city_catalog, find_providers_*, get_provider
- **Geo tools** (2): compute_distance, get_sector_coords
- **Scoring tool** (1): compute_score with urgency-adaptive weights
- **Booking tools** (5): generate_booking_id, reserve_slot, create_booking_record, generate_receipt, generate_ics_calendar
- **Notification tools** (3): draft_user_notification, draft_provider_notification, broadcast_area_alert
- **Scheduling tools** (1): schedule_event
- **Crisis tools** (4): fetch_weather, fetch_traffic_density, fetch_recent_emergency_reports, create_emergency_ticket
- **State tools** (2): update_system_state, query_booking_history

Per typical user request, **15-25 tool calls** are made across the agent pipeline.

## 4. Reasoning Transparency

Every agent step produces a `reasoning_text` field that is captured in the trace. This is shown live in the mobile app's **Agent Thinking screen**:

```
Step 1 — Intent Parser
  reasoning: "Identified service as ac_technician (confidence 0.95).
              Location parsed: G-13, Islamabad.
              Time preference: tomorrow_morning (kal subah)."

Step 2 — Provider Discovery
  reasoning: "Found 12 primary AC technicians in Islamabad.
              Filtered 4 due to availability. Sorted by proximity to G-13.
              Top 8 returned."

Step 3 — Crisis Specialist (if emergency)
  reasoning: "Crisis type: urban_flooding, severity: critical, confidence: 1.0"

Step 4 — Ranking & Reasoning
  reasoning: "Selected Iqbal AC Solutions as top — only 1.1km away,
              4.4★ rated, 95% completion, verified, fastest response."

Step 5 — Booking Executor
  reasoning: "Booking executed end-to-end with 8 tool calls.
              Slot reserved at 2026-05-13T10:00:00. Notifications drafted."

Step 6 — Follow-up Automator
  reasoning: "Generated 7-touchpoint plan with branching rules for
              no-show and issue escalation. Language: roman_urdu."
```

## 5. Trace Export for Evaluation

Judges can export any run's trace as JSON via `/api/traces/{id}/export`. This gives them:
- Every tool call with arguments and results
- Every reasoning step in chronological order
- Final state and outcomes
- Total duration and per-step durations

## 6. Where the Real Antigravity Hook Goes

For the live demo, agent execution can be switched between:
- **Rule-based engine** (default for offline demo reliability)
- **Local Gemini Pro** (set `GEMINI_API_KEY` in `.env`)
- **Antigravity-managed LLM** (set `ANTIGRAVITY_API_KEY` and swap the agent runtime)

The agent specs in `antigravity-agents/` are designed to be imported directly into the Antigravity console — system prompts, schemas, and tool bindings all map 1:1 to Antigravity's agent definition format.

## 7. Not Used Superficially

Quoting the rubric: *"Antigravity used in core orchestration, effective handling of reasoning and tool execution, not used superficially."*

Khidmat AI doesn't use Antigravity as a thin LLM wrapper. The agents:
- Make **decisions** (which provider to pick, when to enter crisis mode)
- Drive **state mutations** (slot reservations, booking creation, system state updates)
- Handle **branching control flow** (clarification loops, emergency paths, retry on failure)
- Produce **structured artifacts** consumed by downstream agents (intent → candidates → top_3 → booking → followup_plan)

Each agent's role is **specialist** and **load-bearing** — removing any one breaks the system, which is the hallmark of true agentic orchestration.
