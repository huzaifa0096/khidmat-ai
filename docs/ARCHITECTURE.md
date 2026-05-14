# Architecture — Deep Dive

## System Layers

### Layer 1 — Mobile Client (React Native + Expo Router)
- Single codebase → iOS + Android + Web preview
- **State management:** lightweight React Context (`AppContext`) — language preference, current trace, current booking, user info
- **Persistence:** AsyncStorage for language preference; trace/booking are session-scoped
- **Network:** axios with 30s timeout
- **Animations:** Moti (Reanimated 3 wrapper) for declarative spring/timing animations
- **Visual identity:** Glassmorphism (`expo-blur`) on dark background with brand gradients (indigo→cyan, pink→amber, red→orange for emergency)

### Layer 2 — Orchestration API (FastAPI)
Two key endpoints drive the entire flow:

#### `POST /api/orchestrate/parse-and-rank`
Runs steps 1–4 of the workflow synchronously and returns the structured `intent`, optional `crisis` object, `ranking.top_3`, and a complete `trace`.

```
1. Intent Parser  ────────►  intent JSON
2. Provider Discovery  ───►  candidates[]
3. (if emergency) Crisis Specialist  ──►  dispatch_plan, area_alert, emergency_ticket
4. Ranking & Reasoning  ──►  top_3 with reasoning + badges
```

#### `POST /api/orchestrate/confirm-booking`
Runs steps 5–6 after the user picks a provider:

```
5. Booking Executor  ────►  booking + receipt + state_changes + notifications
6. Follow-up Automator  ─►  7-event plan + branching rules
```

### Layer 3 — Agent Implementations (Python)
Each agent in `backend/agents/` is a pure Python module that the orchestrator imports and calls. This **mirrors** the Antigravity agent specs in `antigravity-agents/agents/` so that, when running in Antigravity, the same logic structure is used — only the LLM execution shifts from local Gemini (or rule-based fallback) to Antigravity's managed LLM.

Why this dual structure: **judges can verify the agent designs without needing the live Antigravity environment**, while the live system runs deterministically for the demo.

### Layer 4 — Data Store
In-memory `Store` class loaded at startup. Holds:
- `providers` — 134 generated providers across 4 cities × 20 categories
- `categories`, `cities` — catalog data with sector coordinates
- `bookings`, `traces`, `events`, `emergency_tickets`, `area_alerts`, `system_state_log` — runtime mutations
- Thread-safe via `threading.Lock`

Not persisted between restarts — appropriate for demo. Production: swap with Postgres + Redis.

---

## Agent Communication Pattern

Agents communicate via **structured JSON contracts** (see each `antigravity-agents/agents/0N_*.md` for full schemas). No agent calls another directly — the orchestration route (in `backend/routes/orchestrate.py`) is the single point of coordination.

This pattern gives us:
- **Traceability** — every agent's input/output is captured in the trace
- **Replayability** — given a trace, we can reproduce or simulate any subsequent step
- **Testability** — each agent is unit-testable in isolation

---

## Scoring Model (Ranking & Reasoning)

Per-candidate scoring uses 7 normalized dimensions, weighted dynamically by urgency:

| Dimension | Score Formula | Normal | Urgent | Emergency |
|---|---|---|---|---|
| distance | `max(0, 1 - distance_km / 15)` | 0.25 | 0.35 | 0.50 |
| rating | `(rating - 3.0) / 2.0` | 0.25 | 0.20 | 0.10 |
| reviews | `min(1, log10(reviews+1) / 3)` | 0.10 | 0.05 | 0.05 |
| verified | `1.0 / 0.5` | 0.10 | 0.10 | 0.05 |
| availability | `now=1.0, today=0.85, tomorrow=0.7, busy=0.4` | 0.15 | 0.20 | 0.25 |
| completion | `(rate - 80) / 20` | 0.10 | 0.05 | 0.05 |
| response_time | `max(0, 1 - mins/90)` | 0.05 | 0.05 | 0.00 |

`final_score = Σ(score × weight)` ∈ [0, 1]

Reasoning is built up dimension by dimension and assembled into a natural-language sentence in the user's language.

Badges are awarded based on dimension thresholds (e.g., `Closest` if this is the minimum distance candidate, `Top Rated` if rating ≥ 4.7, `Fastest Response` if avg_response_minutes ≤ 25, …).

---

## Crisis Mode Logic

When `intent.urgency == "emergency"`, the Crisis Specialist activates **after** Discovery (so it has candidates) but **before** Ranking (so it can adjust dispatch). It:

1. Fetches **weather** for the city (mock — Islamabad/Rawalpindi return flash-flood alert, Lahore/Karachi heatwave)
2. Fetches **traffic** for the sector (G-10/G-11 return very_high with water_logging incidents)
3. Fetches **recent emergency reports** (G-10/G-11/G-13 return clusters)
4. Classifies crisis type from intent keywords + signal fusion (urban_flooding, gas_leak, fire, power_outage, accident)
5. Picks top-2 emergency-eligible providers for **redundancy**
6. Adds **secondary providers** from a crisis bundle map (flooding → also dispatch electrician)
7. Computes surcharge (1.2x to 2.0x based on severity)
8. Generates area-wide alert in user's language
9. Creates emergency ticket with priority (P0 for critical/high, P1 otherwise)
10. Projects outcome (response_time vs baseline, % improvement)

---

## Trace Schema

Every workflow run emits a complete `trace` object:

```jsonc
{
  "trace_id": "TRC-2026-05-12-Z5O1",
  "workflow_id": "khidmat_main_orchestration_v1",
  "started_at": "...",
  "completed_at": "...",
  "duration_ms": 1240,
  "user_input": "Mujhe kal subah G-13 mein AC technician chahiye",
  "user_id": "U001",
  "steps": [
    {
      "step": 1,
      "agent": "intent_parser",
      "engine": "rule_based" /* or "gemini-1.5-flash" */,
      "tool_calls": [/* ... */],
      "output": {/* intent JSON */},
      "reasoning_text": "..."
    },
    /* ... */
  ],
  "final_state": {
    "status": "confirmed_with_followup_scheduled",
    "booking_id": "KHD-2026-05-12-AB7K3",
    "follow_up_plan_id": "FLP-X3K9P"
  }
}
```

This trace is what judges can export via `GET /api/traces/{id}/export` as evidence of agentic reasoning.

---

## Why React Native + Expo (and not Flutter)?

Two reasons:
1. **Setup time** — Expo runs instantly with `npx expo start`; no SDK download. Critical given the 8-day timeline.
2. **Web preview** — `npx expo start --web` gives a working browser preview for fast iteration during demos. Flutter web is rougher around RN edges.

Premium UI is fully achievable with `expo-blur`, `expo-linear-gradient`, `moti`, and `@expo/vector-icons` (Ionicons).

---

## Production Roadmap (out of scope for hackathon)

| Component | Now | Later |
|---|---|---|
| Provider DB | In-memory JSON | Postgres + PostGIS for geo |
| LLM | Local Gemini Pro or rule-based fallback | Antigravity-managed Gemini Ultra |
| Maps | Haversine + mock coords | Google Maps Places + Routes API |
| Notifications | Drafted strings | Twilio SMS + WhatsApp Business API |
| Calendar | Generated ICS string | Google Calendar API integration |
| Voice | Mock with sample prompts | Cloud Speech-to-Text (Urdu) + Text-to-Speech |
| Auth | Hardcoded user | OAuth + phone OTP |
| Persistence | In-memory | Postgres + Redis + cron-based archival |
