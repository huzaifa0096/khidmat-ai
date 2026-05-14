# Evaluation Criterion Mapping

> How Khidmat AI maps to each rubric line — for self-audit and judge convenience.

## 1. Use of Google Antigravity — 25%

| Rubric Sub-criterion | Khidmat AI Evidence |
|---|---|
| Core orchestration handled via Antigravity | Master workflow `khidmat_main_orchestration_v1` in `antigravity-agents/workflows/main_orchestration.md`. Routes every request through 6 agents with branching. |
| Effective use of tools (Maps, APIs) | 24 tools in `antigravity-agents/tools.md`. Per-request usage: 15-25 tool calls visible in trace. |
| Demonstrates planning + execution | Each agent has a "planning" phase (e.g., Ranking computes scores) and an "execution" phase (e.g., Booking Executor runs 8 atomic mutations). Both are traceable. |
| Not used superficially | Antigravity drives decisions, state mutations, and control flow — not just text generation. See [`ANTIGRAVITY_USAGE.md`](ANTIGRAVITY_USAGE.md) §7. |

## 2. Agentic Reasoning & Workflow — 20%

| Rubric Sub-criterion | Khidmat AI Evidence |
|---|---|
| Multi-step reasoning | 6 agents × ~3-8 sub-steps each = 30+ reasoning checkpoints per run, all captured in trace. |
| Logical flow from request → decision → action | Linear with controlled branches: Intent → (Crisis?) → Discovery → Ranking → Booking → Followup. |
| Evidence of autonomy | System chooses providers, surfaces tradeoffs, escalates emergencies, broadcasts alerts, schedules followups — all without user instruction beyond initial intent. |

## 3. Matching Quality & Decision Logic — 20%

| Rubric Sub-criterion | Khidmat AI Evidence |
|---|---|
| Relevant provider selection | 134 providers across 20 categories × 4 cities. Discovery hard-filters by availability, emergency-eligibility, gender pref, budget. |
| Clear ranking criteria | 7-dimensional scoring with urgency-adaptive weights. Full breakdown returned per provider in `score_breakdown`. |
| Strong reasoning behind decisions | Every top_3 entry has a 1-2 sentence reasoning in the user's language, citing specific numbers (distance, rating, completion %, etc.) + tradeoffs surfaced. |

## 4. Action Simulation & Execution — 15%

| Rubric Sub-criterion | Khidmat AI Evidence |
|---|---|
| Booking process realistically simulated | Booking Executor runs **8 atomic actions**: generate_booking_id, reserve_slot, create_booking_record, generate_receipt, draft_user_notification, draft_provider_notification, generate_ics_calendar, update_system_state. |
| Clear system state change | Every booking emits `system_state_changes[]` with explicit type+payload. State log queryable at `/api/state/log`. |
| End-to-end workflow demonstrated | Single user request → end state with: booking record, receipt with QR, ICS calendar, 4 notification drafts (in-app + SMS + WhatsApp + provider SMS), 7-event follow-up plan with branching rules. |

## 5. Technical Implementation — 10%

| Rubric Sub-criterion | Khidmat AI Evidence |
|---|---|
| Clean architecture | Layered: Mobile → API → Agents → Tools → Store. Each layer has a single responsibility. |
| API/tool integration | 14 backend route modules, RESTful endpoints, auto-generated Swagger UI at `/docs`. |
| Robust handling of edge cases | Empty candidates → fallback to secondary services + expanded search; missing intent → clarification loop; slot conflict → retry with next window; LLM failure → rule-based fallback. |

## 6. Innovation & UX — 10%

| Rubric Sub-criterion | Khidmat AI Evidence |
|---|---|
| Creative approach | (a) Live "Agent Thinking" visualization, (b) Crisis Mode crossover (Challenge 3 flavor), (c) Smart Insights crossover (Challenge 1 flavor), (d) Tradeoff surfacing in ranking |
| Intuitive interface | Voice-first home with mic button + suggestion chips + sample prompts; bilingual UI (Urdu ↔ English with one tap); glassmorphism with consistent visual hierarchy |
| Clear and engaging demo | Demo flow scripted in `docs/DEMO_SCRIPT.md` — covers happy path + crisis path in under 5 minutes |

---

## Bonus Strengths Worth Highlighting in Demo

1. **Multilingual end-to-end** — input, reasoning, notifications, and follow-up messages all respect the user's input language.
2. **Pakistan-specific** — sector codes (G-10, F-7, DHA Phase 5), Pakistani names, PKR pricing, Urdu marker detection.
3. **Transparency-by-design** — every agent step is exportable as JSON for audit. Judges can verify reasoning down to per-dimension scores.
4. **Production-ready scaffolding** — env-based config, dependency-injected store, thread-safe mutations, route-level separation.
