# Main Orchestration Workflow — Antigravity Import

This is the master workflow that ties all 6 agents together. Import this into Antigravity as the primary orchestration graph.

## Workflow ID: `khidmat_main_orchestration_v1`

## Entry Point: `user_request_received`

```
[USER INPUT (text/voice)]
         │
         ▼
┌─────────────────────────────────────────┐
│  STEP 1: Voice → Text (if voice input)  │
│  Tool: speech_to_text                    │
│  Output: transcript                      │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  STEP 2: Intent Parser Agent             │
│  Input: transcript                       │
│  Output: structured intent               │
└─────────────────────────────────────────┘
         │
         ├──── intent.missing_info[] not empty
         │          ▼
         │     [ASK USER CLARIFICATION → loop back to STEP 2]
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 3: Branch on urgency                                   │
│                                                              │
│    if intent.urgency == "emergency":                         │
│      ──> STEP 3a: Crisis Specialist (Mode A) FIRST           │
│           — adjusts weights, may add secondary services      │
│                                                              │
│    else:                                                     │
│      ──> proceed to STEP 4                                   │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  STEP 4: Provider Discovery Agent        │
│  Input: intent + (crisis_overrides?)     │
│  Output: candidates[15]                  │
└─────────────────────────────────────────┘
         │
         ├──── candidates empty
         │          ▼
         │     [STEP 4b: Expand search radius / try secondary services / inform user]
         │
         ▼
┌─────────────────────────────────────────┐
│  STEP 5: Ranking & Reasoning Agent       │
│  Input: candidates + intent              │
│  Output: top_3 + reasoning               │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  STEP 6: PRESENT TO USER                 │
│  UI shows top 3 with reasoning           │
│  User taps provider → confirm booking    │
└─────────────────────────────────────────┘
         │
         ▼ (user confirms)
┌─────────────────────────────────────────┐
│  STEP 7: Booking Executor Agent          │
│  Input: chosen provider + intent + user  │
│  Output: booking_artifact (full)         │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  STEP 8: Follow-up Automator Agent       │
│  Input: booking_artifact                 │
│  Output: follow_up_plan with events      │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  STEP 9: PERSIST + LOG                   │
│  - Save full agent trace                 │
│  - Update user history                   │
│  - Update provider availability          │
│  - Return final state to mobile app      │
└─────────────────────────────────────────┘
         │
         ▼
[BACKGROUND] Periodic Insights Engine (Mode B of Agent 6)
        ──> reads booking_history, generates platform insights
```

## Agent Trace Schema

Every workflow run emits a complete trace:

```json
{
  "trace_id": "TRC-2026-05-12-X9K2",
  "workflow_id": "khidmat_main_orchestration_v1",
  "started_at": "2026-05-12T20:15:32+05:00",
  "completed_at": "2026-05-12T20:15:48+05:00",
  "duration_ms": 16321,
  "user_input": "Mujhe kal subah G-13 mein AC technician chahiye",
  "steps": [
    {
      "step": 1,
      "agent": null,
      "action": "voice_to_text",
      "skipped": true,
      "reason": "input was text"
    },
    {
      "step": 2,
      "agent": "intent_parser",
      "started_at": "...",
      "duration_ms": 1245,
      "input": "...",
      "tool_calls": [
        { "tool": "get_service_catalog", "duration_ms": 12 },
        { "tool": "get_city_catalog", "duration_ms": 8 }
      ],
      "output": { /* intent JSON */ },
      "reasoning_text": "Identified service as ac_technician (confidence 0.98)..."
    },
    {
      "step": 4,
      "agent": "provider_discovery",
      "tool_calls": [
        { "tool": "find_providers_by_category_and_city", "args": {...} },
        { "tool": "compute_distance", "calls": 12 }
      ],
      "output": { /* candidates */ }
    },
    {
      "step": 5,
      "agent": "ranking_reasoning",
      "output": { /* top_3 */ }
    },
    {
      "step": 7,
      "agent": "booking_executor",
      "tool_calls": [
        { "tool": "generate_booking_id" },
        { "tool": "reserve_slot" },
        { "tool": "create_booking_record" },
        { "tool": "generate_receipt" },
        { "tool": "draft_user_notification" },
        { "tool": "draft_provider_notification" },
        { "tool": "generate_ics_calendar" },
        { "tool": "update_system_state" }
      ],
      "output": { /* booking artifact */ }
    },
    {
      "step": 8,
      "agent": "followup_automator",
      "output": { /* follow_up_plan with 7 events */ }
    }
  ],
  "final_state": {
    "booking_id": "KHD-2026-05-12-AB7K3",
    "status": "confirmed_with_followup_scheduled"
  }
}
```

## Why This Workflow Wins Marks

| Evaluation Criterion | How This Workflow Addresses It |
|---|---|
| **Use of Antigravity (25%)** | 6 distinct agents, 20+ tool calls per run, multi-step orchestration with branching |
| **Agentic Reasoning (20%)** | Branching based on urgency, fallback paths for empty candidates, retry logic |
| **Matching Quality (20%)** | Weighted multi-dimensional scoring with urgency-adaptive weights |
| **Action Simulation (15%)** | 8 simulated actions per booking (slot, receipt, notifications, calendar, state) |
| **Technical Implementation (10%)** | Complete trace, error paths, idempotent operations |
| **Innovation & UX (10%)** | Crisis mode crossover, insights crossover, multi-language support |
