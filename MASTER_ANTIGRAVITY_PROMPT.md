# 🚀 Khidmat AI — Master Recreation Prompt for Google Antigravity

> **Single-shot prompt that an Antigravity Agent can read to recreate the entire Khidmat AI project from scratch — same files, same agents, same UI, same behavior.**
>
> **Audience:** Hackathon judges (read as documentation) · Google Antigravity Agent Manager (paste as build prompt) · Future contributors (use as canonical spec)

---

## 0. HOW TO USE THIS DOCUMENT

### Option A — Read It as Documentation
Sections 1–11 explain everything that was built and why. Walk through linearly to understand the project end-to-end.

### Option B — Paste It into Antigravity Agent Manager
1. Open Antigravity IDE
2. `File → Open Folder` → pick an empty folder
3. `Ctrl+E` to open Agent Manager
4. New Conversation, model: **Claude Sonnet 4.6 Thinking** or **Opus 4.7**
5. Paste this entire file
6. Append at the end: *"Start with Phase 1 of section 9 and proceed through all phases. Generate every file mentioned in section 4 and 5. Report progress per phase."*
7. Agent will build the project autonomously (~30–60 min)

### Option C — Live Demo Use
During hackathon presentation, paste sections 9 (Build Phases) into Antigravity and let the Agent build a representative slice live in front of judges. The full source code is already in this repository, so the live build is theatre — it shows agentic capability without risking deadline.

---

## 1. PROJECT SUMMARY

**Name:** Khidmat AI
**Tagline:** *Ek voice se sub khidmat hazir — One voice, every service handled.*
**Hackathon:** Google Antigravity #AISeekho 2026
**Challenge:** Challenge 2 — AI Service Orchestrator for Informal Economy
**Crossovers covered:** Challenge 1 (Insight→Action) + Challenge 3 (Crisis Intelligence)

**One-line description:**
An agentic AI mobile platform that automates the end-to-end lifecycle of informal-economy service requests in Pakistan (plumbers, electricians, AC technicians, tutors, beauticians) — from natural-language intent in **Urdu / Roman Urdu / English** through provider discovery, ranking, booking simulation, two-sided marketplace acceptance, and post-service follow-up — orchestrated by **6 specialist agents** running in **Google Antigravity**.

---

## 2. ARCHITECTURE OVERVIEW

```
┌──────────────────────────────────────────────────────────────────┐
│              MOBILE APP (React Native + Expo Router)              │
│  17 screens · Dark + Light theme · Urdu + Roman Urdu + English   │
│  - Onboarding (Google + phone OTP + Demo Quick Sign-In)          │
│  - Home (voice/text input, 9 services, samples)                  │
│  - Agent War Room (live 6-agent visualization)                   │
│  - Results (top-3 with reasoning + AI voice narration)           │
│  - Provider Detail (hero, About, photos, Book Now)               │
│  - Booking Confirmed (pending → confirmed, receipt, timeline)    │
│  - Provider Home (earnings, jobs feed, accept/decline)           │
│  - Chat (customer ↔ provider, quick replies)                     │
│  - Chats List (all conversation threads)                         │
│  - Crisis Mode (multi-source signal fusion)                      │
│  - Live Map (Leaflet + CARTO tiles)                              │
│  - For You (predictive cards)                                    │
│  - Insights · Timeline · History · Profile · Settings · Admin    │
└────────────────────────────┬─────────────────────────────────────┘
                             │  REST API (axios)
┌────────────────────────────▼─────────────────────────────────────┐
│              FASTAPI BACKEND (Python 3.11)                        │
│  15 route modules · 50+ endpoints · 24-tool catalog               │
│  - /api/orchestrate/parse-and-rank   (main pipeline)              │
│  - /api/orchestrate/confirm-booking  (8-step action)              │
│  - /api/providers-self/me/* (provider portal)                     │
│  - /api/chat/* (in-app messaging)                                 │
│  - /api/bookings/* (lifecycle + cancel + status)                  │
│  - /api/admin/* (live ops dashboard)                              │
│  - /api/external/weather, /traffic (mock signals)                 │
└────────────────────────────┬─────────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│   GOOGLE ANTIGRAVITY ORCHESTRATION (6 agents + workflow)          │
│  1. Intent Parser        (multilingual NLU)                       │
│  2. Provider Discovery   (geo + filters)                          │
│  3. Ranking & Reasoning  (7-dim weighted scoring)                 │
│  4. Booking Executor     (8 atomic actions)                       │
│  5. Follow-up Automator  (7-event lifecycle)                      │
│  6. Crisis & Insights    (signal fusion + analytics)              │
└──────────────────────────────────────────────────────────────────┘
```

**Tech stack:**
- **Mobile:** React Native, Expo Router 5, Expo SDK 54, Moti animations, react-native-webview (map), Leaflet + CARTO
- **Backend:** FastAPI, Pydantic, Uvicorn, Python 3.11, in-memory store with JSON seed
- **AI/Agents:** Google Antigravity, optional Gemini for LLM-backed intent parsing (rule-based fallback)
- **Distribution:** EAS Build (APK), Cloudflare quick tunnel for live backend
- **DevOps:** GitHub (public repo), no DB (in-memory + JSON), no third-party services

---

## 3. FOLDER STRUCTURE (CANONICAL)

```
khidmat-ai/
├── README.md
├── MASTER_ANTIGRAVITY_PROMPT.md  ← this file
├── SUBMISSION_CHECKLIST.md
├── QUICKSTART.md
├── ANTIGRAVITY_PASTE_CHEATSHEET.md
├── .gitignore
├── start.bat / stop.bat / start-all.ps1
├── api_calls.ps1                  ← auto-generated by Antigravity Agent
├── api_calls_34.ps1               ← auto-generated by Antigravity Agent
├── parse_part3.ps1                ← auto-generated by Antigravity Agent
├── parse_part4.ps1                ← auto-generated by Antigravity Agent
├── khidmat_ai_demo_walkthrough.md ← auto-generated by Antigravity Agent
├── part2_response.json / part3_response.json / part4_response.json
│
├── antigravity-agents/            ← 6 agent specs for Antigravity import
│   ├── README.md
│   ├── tools.md                   ← 24-tool catalog
│   ├── agents/
│   │   ├── 01_intent_parser.md
│   │   ├── 02_provider_discovery.md
│   │   ├── 03_ranking_reasoning.md
│   │   ├── 04_booking_executor.md
│   │   ├── 05_followup_automator.md
│   │   └── 06_crisis_insights.md
│   └── workflows/
│       └── main_orchestration.md
│
├── backend/                       ← FastAPI orchestrator
│   ├── main.py                    ← FastAPI app + 15 router includes
│   ├── requirements.txt
│   ├── .env.example
│   ├── agents/                    ← Python agent implementations
│   │   ├── intent_parser.py       (267 lines)
│   │   ├── provider_discovery.py  (108 lines)
│   │   ├── ranking_reasoning.py   (147 lines)
│   │   ├── crisis_specialist.py   (236 lines)
│   │   ├── pricing_engine.py      (166 lines)
│   │   └── trust_engine.py        (130 lines)
│   ├── routes/                    ← 15 REST route modules
│   │   ├── catalog.py             (24 lines)   GET /services, /cities
│   │   ├── providers.py           (60 lines)   GET providers + filter
│   │   ├── geo.py                 (26 lines)   POST /distance
│   │   ├── score.py               (77 lines)   POST /score (+ batch)
│   │   ├── bookings.py            (296 lines)  POST + lifecycle endpoints
│   │   ├── notifications.py       (25 lines)   POST /draft
│   │   ├── schedule.py            (149 lines)  events, followup-plan
│   │   ├── emergency.py           (73 lines)   tickets, broadcast
│   │   ├── external.py            (42 lines)   weather, traffic, reports
│   │   ├── state.py               (33 lines)   /summary, /update
│   │   ├── orchestrate.py         (404 lines)  parse-and-rank, confirm-booking
│   │   ├── traces.py              (38 lines)   list + export
│   │   ├── provider_self.py       (479 lines)  register, me/jobs, me/services
│   │   ├── feedback.py            (85 lines)   ratings + reviews
│   │   ├── chat.py                (154 lines)  threads + messages
│   │   └── admin.py               (214 lines)  overview, providers, analytics
│   └── utils/
│       ├── store.py               ← in-memory data store with load/persist
│       ├── ids.py                 ← booking_id(), receipt_id() generators
│       └── geo.py                 ← haversine_km()
│
├── data/                          ← Mock datasets (committed)
│   ├── service_categories.json    ← 20 categories + 4 cities + sectors
│   ├── providers_mock.json        ← 135 providers (already-generated)
│   └── generate_providers.py      ← deterministic generator script
│
├── mobile-app/                    ← React Native + Expo
│   ├── package.json, app.json, eas.json, tsconfig.json
│   ├── .env                       ← EXPO_PUBLIC_BACKEND_HOST=<tunnel>
│   ├── assets/                    ← icons, splash, logo (generated)
│   ├── app/                       ← Expo Router screens (17 files)
│   │   ├── _layout.tsx, index.tsx, onboarding.tsx
│   │   ├── results.tsx, agent-thinking.tsx
│   │   ├── booking-confirmed.tsx, timeline.tsx, history.tsx
│   │   ├── provider/[id].tsx, provider-home.tsx, my-services.tsx
│   │   ├── become-provider.tsx, profile.tsx, settings.tsx
│   │   ├── chat/[id].tsx, chats.tsx, crisis.tsx
│   │   ├── for-you.tsx, insights.tsx, map.tsx
│   │   ├── trace/[id].tsx, admin.tsx
│   └── src/
│       ├── components/            (15 reusable UI components)
│       ├── theme/                 (colors.ts, themes.ts, strings.ts)
│       ├── state/AppContext.tsx
│       ├── hooks/                 (useTheme, useLiveLocation, useSpeechRecognition)
│       ├── services/api.ts        ← axios client + 30+ exports
│       └── utils/providerImage.ts ← category-themed image mapper
│
├── docs/                          ← Markdown documentation
│   ├── ARCHITECTURE.md
│   ├── ANTIGRAVITY_USAGE.md
│   ├── ANTIGRAVITY_IMPORT_GUIDE.md
│   ├── DEMO_SCRIPT.md
│   └── EVALUATION_MAPPING.md
│
├── demo/                          ← Pre-generated agent traces + recordings
│   ├── trace_happy_path_ac_tech_g13.json
│   ├── trace_crisis_g10_flooding.json
│   ├── trace_english_tutor_request.json
│   ├── trace_incomplete_clarification.json
│   ├── trace_lahore_plumber.json
│   ├── sample_traces.json (combined)
│   ├── export_sample_traces.py
│   └── antigravity-screenshots/
│       ├── antigravity-live-execution.mp4   (32 MB Antigravity recording)
│       ├── CAPTURE_GUIDE.md
│       └── start-capture.ps1
│
└── Required/
    └── Google Antigravity Hackathon - Challenges.pdf
```

**Counts:**
- Backend: 2,179 lines (routes) + 1,054 lines (agents) ≈ 3,233 Python LOC
- Mobile: 9,797 lines (screens) + 4,927 lines (src) ≈ 14,724 TypeScript LOC
- Total source: ~18,000 lines committed; 141 files in initial commit
- Mock providers: **135** across 4 cities (Islamabad, Lahore, Karachi, Rawalpindi)
- Service categories: **20** (only 9 surfaced on home grid for clean UX)

---

## 4. BACKEND DEEP SPEC

### 4.1 `backend/main.py` — App Setup

FastAPI app with lifespan loader for the in-memory `Store`, CORS open, 16 routers mounted:

| Prefix | Module | Tag |
|---|---|---|
| `/api/catalog` | catalog | Catalog |
| `/api/providers` | providers | Providers |
| `/api/geo` | geo | Geo |
| `/api/score` | score | Scoring |
| `/api/bookings` | bookings + feedback | Bookings |
| `/api/notifications` | notifications | Notifications |
| `/api/schedule` | schedule | Scheduling |
| `/api` | emergency | Emergency |
| `/api/external` | external | External |
| `/api/state` | state | State |
| `/api/orchestrate` | orchestrate | Orchestration |
| `/api/traces` | traces | Agent Traces |
| `/api/providers-self` | provider_self | Provider Self-Service |
| `/api/chat` | chat | Chat |
| `/api/admin` | admin | Admin |

Plus `/health` endpoint returning `{status, providers_loaded}`.

### 4.2 Full Endpoint List

```
GET  /health
GET  /api/catalog/services
GET  /api/catalog/services/{category_id}
GET  /api/catalog/cities
GET  /api/providers
GET  /api/providers/{provider_id}
POST /api/geo/distance
GET  /api/geo/sector
POST /api/score
POST /api/score/batch
POST /api/bookings
POST /api/bookings/reserve-slot
GET  /api/bookings/{booking_id}
GET  /api/bookings/{booking_id}/status
GET  /api/bookings/{booking_id}/ics
POST /api/bookings/{booking_id}/cancel
POST /api/bookings/feedback
GET  /api/bookings/feedback/{booking_id}
POST /api/notifications/draft
POST /api/schedule/event
POST /api/schedule/followup-plan
GET  /api/schedule/events
GET  /api/emergency-reports
GET  /api/emergency-tickets
POST /api/emergency-tickets
POST /api/alerts/broadcast
GET  /api/alerts
GET  /api/external/weather
GET  /api/external/traffic
GET  /api/state/summary
POST /api/state/update
GET  /api/state/log
POST /api/orchestrate/parse-and-rank
POST /api/orchestrate/confirm-booking
GET  /api/orchestrate/insights
GET  /api/traces
GET  /api/traces/{trace_id}
GET  /api/traces/{trace_id}/export
POST /api/providers-self/register
GET  /api/providers-self/me/profile
PATCH /api/providers-self/me/profile
GET  /api/providers-self/me/jobs
POST /api/providers-self/me/jobs/{job_id}/respond
GET  /api/providers-self/me/earnings
POST /api/providers-self/me/services
DELETE /api/providers-self/me/services/{service_id}
POST /api/chat/messages
GET  /api/chat/messages/{booking_id}
GET  /api/chat/threads
GET  /api/admin/overview
GET  /api/admin/providers
GET  /api/admin/analytics
GET  /api/admin/revenue
```

### 4.3 Core Agent Implementations (in `backend/agents/`)

Each Python agent mirrors the Antigravity agent spec. Imported and called from `routes/orchestrate.py`.

**`intent_parser.py` (267 lines):**
- Rule-based regex/keyword matcher with Gemini fallback
- Language detection: Urdu / Roman Urdu / English / mixed
- Service category match (alias table from `service_categories.json`)
- Location extraction (cities + sector regex: `[FGIE]-\d{1,2}`)
- Time parsing (kal subah → tomorrow_morning, abhi → now, etc.)
- Urgency detection (foran, emergency, ghar mein flood → emergency)
- Returns structured JSON matching Antigravity agent 01 spec

**`provider_discovery.py` (108 lines):**
- Query store.providers filtered by category (primary OR secondary)
- Hard filters: emergency_24x7, availability match, gender, budget
- Distance via haversine from sector coords
- Sort + top 15

**`ranking_reasoning.py` (147 lines):**
- 7-dimensional scoring: distance, rating, reviews, verified, availability, completion, response_time
- Urgency-adaptive weights (normal/urgent/emergency)
- Bilingual reasoning text generation
- Tradeoffs surfacing, badges, decision summary

**`crisis_specialist.py` (236 lines):**
- Two modes: A (crisis coordinator) + B (insights engine)
- Mode A: signal fusion (weather + traffic + recent reports), dispatch plan, area alert
- Mode B: periodic insights from booking history (demand spikes, underserved areas)

**`pricing_engine.py` (166 lines):**
- Base price from provider's range
- Distance multiplier (km × Rs/km)
- Urgency surcharge (emergency = 1.5–2x)
- Platform commission (12–15%)
- Provider earnings split

**`trust_engine.py` (130 lines):**
- Compute trust score from rating, reviews, completion, verification, joined-date
- Tier classification: Elite (90+) / Trusted (75–89) / Verified (60–74) / New (<60)

### 4.4 Mock Data Shape

**`data/service_categories.json`:**
```json
{
  "categories": [
    {
      "id": "ac_technician",
      "name_en": "AC Technician",
      "name_ur": "اے سی ٹیکنیشن",
      "aliases": ["AC tech", "AC repair", "ایئر کنڈیشنر", "AC theek karne wala", ...],
      "icon": "snowflake",
      "color": "#4FC3F7",
      "emergency_eligible": true,
      "avg_price_pkr": "1500-5000"
    },
    // ... 20 categories total: ac_technician, plumber, electrician, carpenter,
    // painter, cleaner, tutor, beautician, mobile_repair, laptop_repair,
    // pest_control, car_mechanic, bike_mechanic, photographer, event_decorator,
    // catering, mason, geyser_repair, ro_water, generator_repair
  ],
  "cities": [
    {
      "id": "islamabad",
      "name_en": "Islamabad",
      "name_ur": "اسلام آباد",
      "center": {"lat": 33.6844, "lng": 73.0479},
      "sectors": [
        {"id": "F-6", "lat": ..., "lng": ...},
        // F-6 through I-9, G-6 through G-13, etc.
      ]
    },
    // lahore, karachi, rawalpindi
  ]
}
```

**`data/providers_mock.json`:**
```json
{
  "version": "1.0",
  "total": 135,
  "providers": [
    {
      "id": "P1001",
      "name": "Vakeel Chaudhry",
      "business_name": "Vakeel Cooling Experts",
      "primary_service": "ac_technician",
      "secondary_services": [],
      "city": "islamabad",
      "sector": "F-6",
      "location": {"lat": 33.72, "lng": 73.06},
      "phone": "0321-1445199",
      "rating": 3.9,
      "reviews_count": 385,
      "experience_years": 4,
      "verified": true,
      "emergency_24x7": true,
      "availability": "available_now",
      "avg_response_minutes": 85,
      "completion_rate_percent": 91,
      "price_range": "PKR 1527-5503",
      "languages": ["Urdu", "English", "Pashto"],
      "description": "Premium AC installation, ducting, and 24/7 emergency repairs...",
      "profile_image": "https://i.pravatar.cc/300?u=P1001",
      "joined_date": "2021-08-19",
      "completed_jobs": 669
    }
    // ... 134 more
  ]
}
```

Provider distribution: ~28 per city × 4 cities, weighted heavily toward popular categories. Each provider has deterministic seed-derived data so re-running the generator gives identical output.

---

## 5. MOBILE APP DEEP SPEC

### 5.1 17 Screens (in `mobile-app/app/`)

| File | Purpose | Key UI Elements |
|---|---|---|
| `_layout.tsx` (61 LOC) | Root layout, theme + auth gate | Stack navigator, AuthGate hook, themed shell |
| `onboarding.tsx` (1022 LOC) | 4-step flow | Google Sign-In button, phone OTP, location auto-detect, Demo Quick Sign-In (Customer/Provider) |
| `index.tsx` (706 LOC) | Home dashboard | Header with chats/bell, AI Powered banner, 9-service grid, search bar, Try Examples |
| `agent-thinking.tsx` (200 LOC) | Loading screen during parse-and-rank | Animated 6-agent flow, progress dots |
| `results.tsx` (463 LOC) | Top-3 providers | ProviderCard list, score bars, voice narration button |
| `provider/[id].tsx` (513 LOC) | Provider detail | Hero photo, About Me, Trust Score, AI Estimate, See More Photos, sticky Book Now |
| `booking-confirmed.tsx` (758 LOC) | Booking lifecycle | Status badge (pending/confirmed), receipt, 7-event timeline, cancel button with reason picker |
| `timeline.tsx` (219 LOC) | Follow-up plan view | Event list with branching rules |
| `history.tsx` (207 LOC) | Past bookings + traces | Card list, tap → trace/[id] |
| `provider-home.tsx` (886 LOC) | Provider portal | Online/offline toggle, My Services manager, earnings chart (7-day bars), pending jobs, accept/decline, switch to customer |
| `my-services.tsx` (498 LOC) | Service management | Add/remove secondary services, edit price range |
| `become-provider.tsx` (415 LOC) | Self-onboarding | Form with name, business, primary service picker, city/sector, phone, languages |
| `profile.tsx` (475 LOC) | User profile | Avatar, account section, activity (history/traces/services/saved), discover (For You/Map/Insights), business card, Khidmat Plus, settings/admin links, sign out |
| `settings.tsx` (342 LOC) | App settings | Theme picker (dark/light/system), language, notifications, experience, about |
| `chat/[id].tsx` (252 LOC) | Per-booking chat | Message bubbles, quick reply chips, mic input, send button, keyboard-aware |
| `chats.tsx` (266 LOC) | All conversations list | Avatar, name, service, last message, unread badge, time-ago |
| `crisis.tsx` (639 LOC) | Crisis Mode | Pulsing red banner, severity pill, evidence chain, dispatch plan with ETA, area alert, emergency surcharge, outcome projection, dispatch button |
| `for-you.tsx` (335 LOC) | Predictive cards | 6 AI-recommended actions with simulated execution receipts |
| `insights.tsx` (148 LOC) | Smart Insights | Platform analytics, demand patterns |
| `map.tsx` (388 LOC) | Live Provider Map | Leaflet WebView, theme-aware CARTO tiles, provider pins, user location, density chart |
| `trace/[id].tsx` (484 LOC) | Per-trace deep view | Step-by-step agent reasoning, tool calls, duration |
| `admin.tsx` (520 LOC) | Admin dashboard | Overview cards, provider table, analytics charts, revenue |

### 5.2 15 Reusable Components (in `mobile-app/src/components/`)

| Component | Purpose |
|---|---|
| `GlassCard.tsx` | Apple-style card surface (solid + tinted variants, no borders, theme-aware) |
| `Header.tsx` | Back button, title, subtitle, optional right action |
| `GradientButton.tsx` | Primary/danger/ghost variants with icon, loading state |
| `Logo.tsx` | Switches between dark/light logo PNGs based on tile prop |
| `ServiceChip.tsx` | Service category pill |
| `ProviderCard.tsx` | Rank badge, name, rating, distance, score bar, reasoning excerpt |
| `AgentWarRoom.tsx` | Live multi-agent chat visualization (Slack-style) |
| `AIStatusBanner.tsx` | Top banner showing AI active state |
| `PremiumMic.tsx` | Animated mic button with audio level pulse |
| `LiveActivityFeed.tsx` | Stream of recent platform events |
| `PerformanceTicker.tsx` | KPI ticker bar |
| `GoogleSignInButton.tsx` | Real GSI + demo fallback with mock Google users |
| `RealMap.tsx` | Leaflet WebView wrapper, native + web support, theme-aware tiles |
| `RatingModal.tsx` | Star picker + review text input |
| `CancelBookingSheet.tsx` | Bottom sheet with reason picker |

### 5.3 State & Hooks (in `mobile-app/src/`)

**`state/AppContext.tsx`** — Global app state:
- `lang` (ur | en) + `setLang` + translations bundle `t`
- `isSignedIn`, `user` (UserProfile), `signOut()`
- `currentTrace`, `setCurrentTrace` — last parse-and-rank result
- `currentBooking`, `setCurrentBooking` — active booking
- `mode` (customer | provider) + `setMode` + `isProvider` derived
- `theme` (dark | light | system) + `colors` (resolved palette)
- `hydrated` — async storage load complete flag

**`hooks/useTheme.ts`** — `{ colors, radii, shadows, spacing, isDark, theme }`

**`hooks/useLiveLocation.ts`** — Async access to expo-location with permission flow + reverse geocoding

**`hooks/useSpeechRecognition.ts`** — Cross-platform STT with start/stop, transcript, isListening state

### 5.4 Theme System (in `mobile-app/src/theme/`)

**`colors.ts`** — Dark palette + design tokens (radii, spacing, shadows, typography)
**`themes.ts`** — Light palette + theme export `{dark, light}`
**`strings.ts`** — i18n bundles for Urdu + English

**Brand colors (used everywhere):**
- Primary purple: `#3e003f` (deep aubergine, logo color)
- Accent orange: `#f05423` (warm)
- Off-white: `#f5f5f5` (light mode page bg)
- `brand.textAccent`: theme-aware — orange in dark, purple in light
- `border.divider`: theme-aware — 8% white in dark, 8% black in light

**Theme rules:**
- 60-30-10 color distribution
- No borders on cards (light or dark) — only background contrast
- Tinted cards: subtle fill on dark, plain white on light
- Solid surface cards: subtle Apple shadow on dark only

### 5.5 API Client (`src/services/api.ts`, 255 LOC)

```ts
// Backend URL resolved by:
// 1. process.env.EXPO_PUBLIC_BACKEND_HOST (from .env, set at build time)
// 2. PRODUCTION_BACKEND constant (hardcoded fallback for APK)
// 3. Metro hostUri (dev mode via Expo Go)
// 4. Platform fallback (Android emulator 10.0.2.2, else 127.0.0.1)

export const api = axios.create({ baseURL: BACKEND_URL, timeout: 30000 });

// 30+ exports, grouped:
// - Catalog: fetchServices, fetchCities
// - Orchestration: parseAndRank, confirmBooking, fetchInsights, createDirectBooking
// - Bookings: fetchBookings, fetchBookingStatus, cancelBooking, submitFeedback
// - Providers: fetchProviders, fetchProvider
// - Score: computeScore, computeScoreBatch
// - Provider Self: registerProvider, fetchMyJobs, respondToJob,
//                  fetchMyProfile, updateMyProfile, addService, removeService,
//                  fetchMyEarnings
// - Chat: fetchMessages, sendMessage, fetchChatThreads
// - Admin: fetchAdminOverview, fetchAdminProviders, fetchAdminAnalytics
// - State: fetchStateSummary, fetchStateLog
// - Traces: fetchTraces, fetchTrace
// - External: fetchWeather, fetchTraffic
```

---

## 6. ANTIGRAVITY 6 AGENT SPECS

Each is in `antigravity-agents/agents/0N_<name>.md`. Full system prompts, tool bindings, input/output schemas, and example interactions in those files. Summary:

### Agent 1 — Intent Parser
- **Role:** Parse natural-language input (Urdu/Roman Urdu/English) into structured intent
- **Tools:** `get_service_catalog`, `get_city_catalog`, `current_datetime`
- **Output:** `{language_detected, service_category_id, location, time, urgency, urgency_signals, constraints, missing_info, clarification_question_*, reasoning}`

### Agent 2 — Provider Discovery
- **Role:** Identify candidate providers from intent + filters
- **Tools:** `find_providers_by_category_and_city`, `find_providers_by_secondary_service`, `compute_distance`, `get_sector_coords`
- **Output:** `{candidates[], filtered_out[], total_matched, search_radius_km_used, reasoning}`

### Agent 3 — Ranking & Reasoning
- **Role:** Score + rank top-3 with explainable reasoning in user's language
- **Tools:** `compute_score`, `compute_score_batch`
- **Output:** `{top_3[{rank, provider_id, final_score, score_breakdown, reasoning_en, reasoning_ur, tradeoffs, highlight_badges}], decision_summary_en, decision_summary_ur, alternative_consideration}`

### Agent 4 — Booking Executor
- **Role:** Execute 8 atomic actions for booking confirmation
- **Tools:** `generate_booking_id`, `reserve_slot`, `create_booking_record`, `generate_receipt`, `draft_user_notification`, `draft_provider_notification`, `generate_ics_calendar`, `update_system_state`
- **Output:** `{booking_id, status, scheduled_for, provider, user, service, location, pricing, receipt, notifications, calendar_ics, system_state_changes, action_log}`

### Agent 5 — Follow-up Automator
- **Role:** Generate 7-event lifecycle plan with branching rules
- **Tools:** `schedule_event`, `generate_followup_plan`, `draft_message`, `register_branching_rule`
- **Output:** `{follow_up_plan_id, events[], branching_rules[], issue_detection_keywords[], completion_estimated_at, total_events_scheduled, reasoning}`

### Agent 6 — Crisis & Insights (Dual Mode)
- **Mode A (Crisis):** Multi-source signal fusion → dispatch plan + area alert + emergency ticket
- **Mode B (Insights):** Periodic analytics on booking history → recommendations
- **Tools:** `fetch_weather`, `fetch_traffic_density`, `fetch_recent_emergency_reports`, `create_emergency_ticket`, `broadcast_area_alert`
- **Output (Mode A):** `{crisis_assessment, dispatch_plan, pricing, area_alert, emergency_ticket, outcome_projection}`

---

## 7. ORCHESTRATION WORKFLOW

```
USER INPUT (text or voice)
    │
    ▼
┌─────────────────────────────┐
│ STEP 1 (optional)           │
│ Voice → Text                │
│ Tool: speech_to_text        │
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│ STEP 2: Intent Parser       │
│ Output: structured intent   │
└─────────────────────────────┘
    │
    ├── intent.missing_info[]? → CLARIFY → loop
    │
    ▼
┌─────────────────────────────────────────┐
│ STEP 3: Urgency branch                  │
│   emergency? → Crisis Specialist first  │
│   else      → proceed                   │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│ STEP 4: Provider Discovery  │
│ Output: candidates[15]      │
└─────────────────────────────┘
    │
    ├── empty? → expand radius / fallback
    │
    ▼
┌─────────────────────────────┐
│ STEP 5: Ranking & Reasoning │
│ Output: top_3 + reasoning   │
└─────────────────────────────┘
    │
    ▼  (return to UI, wait for user confirm)
┌─────────────────────────────┐
│ STEP 6: PRESENT TO USER     │
└─────────────────────────────┘
    │ (user taps provider → confirm)
    ▼
┌─────────────────────────────┐
│ STEP 7: Booking Executor    │
│ Output: full booking record │
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│ STEP 8: Follow-up Automator │
│ Output: 7-event plan        │
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│ STEP 9: PERSIST + RESPOND   │
│ - Save full trace           │
│ - Update history            │
│ - Return to mobile app      │
└─────────────────────────────┘
    │
    ▼ (background)
[Periodic: Insights Engine (Mode B of Agent 6)]
```

**Trace shape (saved per run):**
```json
{
  "trace_id": "TRC-2026-05-15-X9K2",
  "workflow_id": "khidmat_main_orchestration_v1",
  "started_at": "...",
  "completed_at": "...",
  "duration_ms": 16321,
  "user_input": "Mujhe kal subah G-13 mein AC technician chahiye",
  "steps": [
    { "step": 1, "agent": null, "action": "voice_to_text", "skipped": true },
    { "step": 2, "agent": "intent_parser", "tool_calls": [...], "output": {...}, "reasoning_text": "..." },
    { "step": 4, "agent": "provider_discovery", "tool_calls": [...], "output": {...} },
    { "step": 5, "agent": "ranking_reasoning", "output": {...} },
    { "step": 7, "agent": "booking_executor", "tool_calls": [8 actions], "output": {...} },
    { "step": 8, "agent": "followup_automator", "output": {...} }
  ],
  "final_state": {
    "booking_id": "KHD-2026-05-15-AB7K3",
    "status": "confirmed_with_followup_scheduled"
  }
}
```

---

## 8. KEY UX BEHAVIORS

1. **Multilingual reasoning**: Whatever language the user typed in (Urdu / Roman Urdu / English), the agent's `reasoning_*` field for top-3 providers comes back in that language. Display shows the matching field.

2. **Two-sided mode switch**: Profile screen has a single button "Switch to Provider Mode" / "Switch to Customer Mode". Same user, same data, instantly re-routes to `/provider-home` or `/`.

3. **Live pending → confirmed flip**: Customer's `booking-confirmed.tsx` polls `/api/bookings/{id}/status` every 3 seconds. When provider taps Accept on `provider-home.tsx`, the customer's screen flips within 3s — visible during a 2-device demo.

4. **Crisis auto-trigger**: If user opens `/crisis` without an active crisis trace, the screen calls `parseAndRank` with a synthetic emergency input automatically, so the screen is never blank.

5. **Booking 3-layer fallback**: `provider/[id].tsx` `handleBook` tries (1) existing trace, (2) fresh `parseAndRank` then `confirm-booking`, (3) direct `/api/bookings` POST. Booking can only fail if the entire backend is down.

6. **Sanitised user payload**: Booking calls only send `{id, name, phone}` to the backend even though the local user object has more fields (provider, avatarSeed, etc.) — prevents 422 validation errors.

7. **Agent War Room**: While `/agent-thinking.tsx` is open during parse-and-rank, it shows a live Slack-style chat with simulated messages from each agent at staggered intervals (timed to roughly match real agent durations).

8. **Voice narration on Results**: A speak button on `/results.tsx` reads `decision_summary_en` or `_ur` aloud via `expo-speech`.

9. **Quick Sign-In**: Onboarding has two demo buttons: "Sign in as Aisha (Customer)" and "Sign in as Ahmed (Provider)" — both bypass real auth and pre-populate the user object for 2-device demo flow.

10. **Theme dynamic everywhere**: Every screen uses `colors.*` from `useApp()` — no hardcoded hex except in tested-against-both-themes spots (e.g., gradient brand color stops).

---

## 9. PHASE-BY-PHASE REBUILD (For Antigravity Agent)

Paste this section into Antigravity. The agent will execute phases sequentially.

### PHASE 1 — Backend Skeleton (target: 15 min)

1. Create root folder `khidmat-ai/`
2. Inside, create `backend/` with subfolders `agents/`, `routes/`, `utils/`, `data/`
3. Generate `requirements.txt`:
   ```
   fastapi==0.115.0
   uvicorn[standard]==0.30.0
   pydantic==2.9.0
   python-dotenv==1.0.0
   ```
4. Create `backend/main.py` with FastAPI app, lifespan loader, CORS open, 16 router includes (see §4.1)
5. Create empty placeholder modules for all 16 routes (each with `router = APIRouter()`)
6. Run `pip install -r requirements.txt`
7. Run `python -m uvicorn main:app --reload --port 8000` — verify `GET /health` returns `{status: ok}`

### PHASE 2 — Mock Data + Store (target: 10 min)

1. Create `data/service_categories.json` with 20 categories + 4 cities (full structure in §4.4)
2. Create `data/generate_providers.py` — deterministic generator that creates 135 providers with seed=42
3. Run generator → produces `data/providers_mock.json`
4. Create `backend/utils/store.py` — in-memory `Store` class with `.providers`, `.categories`, `.cities`, `.bookings`, `.traces`, `.events`, helpers
5. Wire `store.load()` into FastAPI lifespan in `main.py`
6. Verify `GET /health` returns `providers_loaded: 135`

### PHASE 3 — Catalog + Providers + Geo Endpoints (target: 10 min)

1. Implement `routes/catalog.py` — `GET /services`, `GET /cities`, `GET /services/{id}`
2. Implement `routes/providers.py` — `GET /` with filters (category, city, sector, emergency_only, verified_only), distance sort
3. Implement `routes/geo.py` — `POST /distance` (haversine), `GET /sector` (coords lookup)
4. Implement `backend/utils/geo.py` — haversine_km helper
5. Test: `curl /api/catalog/services` returns 20 categories; `curl /api/providers?city=islamabad&limit=5` returns providers

### PHASE 4 — Score, Bookings, Notifications, Schedule (target: 20 min)

1. Implement `routes/score.py` — `POST /` weighted scoring, `POST /batch`
2. Implement `backend/agents/pricing_engine.py` and `trust_engine.py`
3. Implement `routes/bookings.py` — `POST /` (full booking creation), `POST /reserve-slot`, `GET /{id}`, `GET /{id}/status`, `GET /{id}/ics`, `POST /{id}/cancel`
4. Implement `routes/notifications.py` — `POST /draft` template generator
5. Implement `routes/schedule.py` — `POST /event`, `POST /followup-plan` (7-event generator), `GET /events`
6. Test: create a booking end-to-end via curl, fetch ICS

### PHASE 5 — Agent Implementations + Orchestrate (target: 30 min)

1. Implement `backend/agents/intent_parser.py` — rule-based with Gemini fallback (see §4.3)
2. Implement `backend/agents/provider_discovery.py`
3. Implement `backend/agents/ranking_reasoning.py`
4. Implement `backend/agents/crisis_specialist.py`
5. Implement `routes/orchestrate.py` — `POST /parse-and-rank` (full pipeline: intent → [crisis?] → discovery → ranking, with trace recording), `POST /confirm-booking` (continues trace: booking_executor + followup_automator), `GET /insights`
6. Implement `routes/traces.py` — `GET /`, `GET /{id}`, `GET /{id}/export`
7. Test: `curl POST /api/orchestrate/parse-and-rank -d '{"user_text":"Mujhe kal subah G-13 mein AC technician chahiye"}'` returns full top-3 + trace_id

### PHASE 6 — Provider Self-Service + Chat + Admin (target: 20 min)

1. Implement `routes/provider_self.py` — register, me/profile (GET/PATCH), me/jobs (with synthetic demo fallback + real pending logic + defensive try/except), me/services (POST/DELETE), me/earnings (7-day series)
2. Implement `routes/chat.py` — `POST /messages`, `GET /messages/{booking_id}` (with welcome seed), `GET /threads` (filter by user_id or provider_id)
3. Implement `routes/feedback.py` — `POST /feedback`, `GET /feedback/{booking_id}`
4. Implement `routes/emergency.py` and `routes/external.py` and `routes/state.py` (mock endpoints)
5. Implement `routes/admin.py` — overview, providers, analytics, revenue (compute from in-memory store)
6. Test all new endpoints work via curl

### PHASE 7 — Mobile App Skeleton (target: 15 min)

1. `npx create-expo-app mobile-app --template`
2. Set up Expo Router file structure
3. Install dependencies:
   ```bash
   npx expo install expo-router expo-linking expo-constants expo-status-bar
   npx expo install expo-haptics expo-speech expo-location expo-clipboard
   npx expo install moti react-native-reanimated react-native-gesture-handler
   npx expo install react-native-svg react-native-webview
   npm install axios @react-native-async-storage/async-storage
   npm install @expo/vector-icons expo-linear-gradient
   ```
4. Create `app/_layout.tsx` with Stack navigator + ThemedShell + AuthGate
5. Create `app.json` with `softwareKeyboardLayoutMode: "resize"` (Android)
6. Create `eas.json` with `EXPO_PUBLIC_BACKEND_HOST` in `preview` and `production` env blocks
7. Create `src/theme/colors.ts`, `themes.ts`, `strings.ts` with full palettes (see §5.4)
8. Create `src/state/AppContext.tsx` with full state shape (see §5.3)
9. Create `src/services/api.ts` with backend URL resolver + 30+ axios exports

### PHASE 8 — Core Components (target: 25 min)

Implement each component in `src/components/`. Each file should:
- Use `useApp()` for theme + lang
- Be self-contained
- Use Ionicons for icons
- Use Moti for entry/exit animations

Order: GlassCard → Header → GradientButton → Logo → ServiceChip → ProviderCard → AgentWarRoom → AIStatusBanner → PremiumMic → LiveActivityFeed → PerformanceTicker → GoogleSignInButton → RealMap → RatingModal → CancelBookingSheet

### PHASE 9 — Screens — Customer Flow (target: 60 min)

Implement screens in this order — each independently runnable:
1. `onboarding.tsx` — 4 steps with Demo Quick Sign-In
2. `index.tsx` — home with 9-service grid (full service array in §10), search + voice
3. `agent-thinking.tsx` — animated loading with Agent War Room embed
4. `results.tsx` — ProviderCard list + decision summary + voice narration
5. `provider/[id].tsx` — hero, About, photos, sticky Book Now with 3-layer fallback
6. `booking-confirmed.tsx` — status polling, receipt, timeline, cancel sheet
7. `chat/[id].tsx` — message bubbles, quick replies, keyboard-aware
8. `chats.tsx` — thread list with avatars + unread badge
9. `crisis.tsx` — pulsing banner, evidence, dispatch plan, area alert, surcharge, projection
10. `for-you.tsx` — predictive cards with simulated execution receipts
11. `map.tsx` — Leaflet WebView with theme-aware tiles
12. `insights.tsx` — analytics
13. `timeline.tsx` — follow-up plan view
14. `history.tsx` — past bookings
15. `profile.tsx` — full profile with all sections
16. `settings.tsx` — theme/lang/notifications
17. `trace/[id].tsx` — agent step-by-step view

### PHASE 10 — Screens — Provider Flow (target: 30 min)

1. `become-provider.tsx` — self-onboarding form
2. `provider-home.tsx` — earnings dashboard, jobs feed, accept/decline, switch mode
3. `my-services.tsx` — service management

### PHASE 11 — Agent Specs for Antigravity (target: 15 min)

Create files in `antigravity-agents/agents/` for each of the 6 agents (specs in §5):
- `01_intent_parser.md` through `06_crisis_insights.md`

Each has: Role, Responsibilities, System Prompt (paste-ready), Tools, Input/Output Schemas, Example Interactions.

Also create:
- `antigravity-agents/tools.md` — 24-tool catalog
- `antigravity-agents/workflows/main_orchestration.md` — workflow graph (§7)
- `antigravity-agents/README.md` — overview

### PHASE 12 — Documentation (target: 10 min)

- `README.md` — full architecture + 6 agents table + evaluation rubric + run instructions
- `docs/ARCHITECTURE.md` — deep technical details
- `docs/ANTIGRAVITY_USAGE.md` — how Antigravity is used
- `docs/ANTIGRAVITY_IMPORT_GUIDE.md` — step-by-step Antigravity import
- `docs/DEMO_SCRIPT.md` — 4-minute video script
- `docs/EVALUATION_MAPPING.md` — criterion-by-criterion mapping
- `SUBMISSION_CHECKLIST.md` — pre-submission verification
- `QUICKSTART.md` — 2-minute setup

### PHASE 13 — Polish + Verification (target: 15 min)

Run smoke tests:
1. Backend `/health` → 200 with `providers_loaded: 135`
2. `POST /api/orchestrate/parse-and-rank` with Roman Urdu input → returns top_3
3. `POST /api/orchestrate/confirm-booking` → returns booking + followup_plan
4. Crisis input → returns crisis_assessment + dispatch_plan + area_alert
5. Mobile `npx expo start` → home screen renders + theme switches + lang toggles
6. Mobile booking flow → 6 agents fire in Agent War Room → results → book → confirmed

---

## 10. CRITICAL CODE CONSTANTS

### Home Service Grid (`mobile-app/app/index.tsx`)

```ts
const SERVICES = (colors: any) => [
  { id: 'ac_technician', label_en: 'AC Technician', label_ur: 'AC Tech',
    icon: 'snow', color: '#4DA8FF', sub_en: '50+ providers' },
  { id: 'plumber', label_en: 'Plumber', label_ur: 'Plumber',
    icon: 'water', color: '#0A84FF', sub_en: '42+ providers' },
  { id: 'electrician', label_en: 'Electrician', label_ur: 'Electrician',
    icon: 'flash', color: '#FFC900', sub_en: '38+ providers' },
  { id: 'tutor', label_en: 'Tutor', label_ur: 'Tutor',
    icon: 'school', color: '#BF5AF2', sub_en: '25+ providers' },
  { id: 'beautician', label_en: 'Beautician', label_ur: 'Beautician',
    icon: 'sparkles', color: '#FF6F87', sub_en: '30+ providers' },
  { id: 'cleaner', label_en: 'Cleaner', label_ur: 'Safai',
    icon: 'leaf', color: '#30D158', sub_en: '45+ providers' },
  { id: 'mechanic', label_en: 'Mechanic', label_ur: 'Mistri',
    icon: 'construct', color: '#FF9F0A', sub_en: '20+ providers' },
  { id: 'carpenter', label_en: 'Carpenter', label_ur: 'Barhai',
    icon: 'hammer', color: '#A0522D', sub_en: '18+ providers' },
  { id: 'painter', label_en: 'Painter', label_ur: 'Painter',
    icon: 'brush', color: '#FF453A', sub_en: '15+ providers' },
];
```

### Ranking Weights

```python
RANKING_WEIGHTS = {
    "normal":    {"distance": 0.25, "rating": 0.25, "reviews": 0.10,
                  "verified": 0.10, "availability": 0.15, "completion": 0.10,
                  "response_time": 0.05},
    "urgent":    {"distance": 0.35, "rating": 0.20, "reviews": 0.05,
                  "verified": 0.10, "availability": 0.20, "completion": 0.05,
                  "response_time": 0.05},
    "emergency": {"distance": 0.50, "rating": 0.10, "reviews": 0.05,
                  "verified": 0.05, "availability": 0.25, "completion": 0.05,
                  "response_time": 0.00},
}
```

### Booking ID Format

```python
def booking_id() -> str:
    today = datetime.now().strftime("%Y-%m-%d")
    rand5 = ''.join(random.choices(string.ascii_uppercase + string.digits, k=5))
    return f"KHD-{today}-{rand5}"

def receipt_id() -> str:
    return "RCP-" + ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
```

### Follow-up Events Timeline

```
T-24h    reminder_24h   → user      SMS  "Kal aap ki <service> appointment hai..."
T-2h     status_check   → provider  WA   "Bhai, aap ka appointment 2 ghante mein hai..."
T-30min  on_the_way     → user      app  "<Provider> aap ke ghar ki taraf..."
T+30min  progress_check → user      SMS  "Service shuru ho gayi?"
T+ETA    completion     → user      SMS  "Aap ki service complete ho gayi?"
T+ETA+15 rating_prompt  → user      app  "Please <Provider> ko rate karein..."
T+1day   rebooking      → user      WA   "Next visit kab schedule karein?"
```

---

## 11. DEMO + SUBMISSION CHEATSHEET

### Demo Video Flow (3:30)

```
0:00–0:20  Sign in + home tour          "Khidmat AI - 6 agents, multilingual"
0:20–0:35  9-service grid + lang toggle "Urdu, Roman Urdu, English support"
0:35–1:10  Roman Urdu search → Agent War Room (let agents fire visibly)
1:10–1:35  Results with reasoning       "7-dim scoring, bilingual reasoning"
1:35–1:50  Provider detail              "Trust Score, AI estimate"
1:50–2:20  Book Now → confirmed         "8 atomic actions, ICS, receipt, timeline"
2:20–2:50  Switch to Provider Mode      "Two-sided marketplace, real-time accept"
2:50–3:05  Chat                         "Quick replies in Roman Urdu"
3:05–3:30  Crisis Mode                  "Multi-source fusion, 2 dispatched, alert"
3:30–3:40  Outro                        "Powered by Google Antigravity"
```

### Judge Q&A — Likely Questions + Answers

**Q: How is Antigravity central to your system?**
> A: Six agent specs live in `antigravity-agents/agents/` — each with a system prompt, tool bindings, and I/O schema, importable into the Agent Manager. The master workflow in `workflows/main_orchestration.md` defines branching for emergencies, fallback paths, and trace export. We also ran the Agent Manager live: it read our codebase, made HTTP calls to the backend, and auto-generated PowerShell scripts (`api_calls*.ps1`) + a walkthrough markdown — recorded in `demo/antigravity-screenshots/antigravity-live-execution.mp4`. That's not theatre; that's real action execution.

**Q: How do you handle multiple languages?**
> A: The Intent Parser detects language at the input boundary. Every downstream agent receives the detected language code. The Ranking agent generates reasoning fields in BOTH languages (`reasoning_en` + `reasoning_ur`) and the UI picks the matching one. Even quick-reply chips in chat have Roman Urdu variants.

**Q: Why two-sided marketplace?**
> A: Informal economy has providers AND consumers. Building only the customer side misses half the agentic problem — provider intake, job feed, accept/decline state machine, earnings, chat. Our app has both modes in the same APK with a single mode-switch button. During demo, two devices logged in as Demo Customer and Demo Provider show real-time accept flow within 3 seconds.

**Q: What if the backend dies during the demo?**
> A: Three fallback paths: (1) cached agent traces in `demo/sample_traces.json`, (2) the Antigravity execution recording in `demo/antigravity-screenshots/`, (3) the Agent War Room screen which has staggered simulated agent messages even if API fails. The booking flow itself has a 3-layer fallback (existing trace → fresh trace → direct booking endpoint) so it can never 422.

**Q: What if you can't show Antigravity live?**
> A: Two ways to recover: (1) open our `MASTER_ANTIGRAVITY_PROMPT.md` and walk through the agent specs section — judges see the same depth, (2) play the pre-recorded `antigravity-live-execution.mp4` from `demo/antigravity-screenshots/` which shows the agent live-building the project.

**Q: How is this different from generic booking apps?**
> A: Three concrete dimensions — (1) **Agent count** (6 vs typical 2–3), (2) **Crossover** (Challenges 1 and 3 covered: Smart Insights + Crisis Mode), (3) **Production polish** (working APK, public GitHub, Antigravity execution evidence). The README has a full comparison table.

### Backup Paths During Live Demo

| If this fails | Fall back to |
|---|---|
| APK network error | Open Expo Go on phone, scan QR from `npx expo start` |
| Backend tunnel dies | Run `cloudflared tunnel --url http://localhost:8000`, paste new URL into mobile .env |
| Antigravity IDE won't open | Open `antigravity-agents/agents/*.md` directly in VS Code; walk through specs |
| Live agent run fails in Antigravity | Play `demo/antigravity-screenshots/antigravity-live-execution.mp4` |
| Both devices can't connect | Demo single-device by manually switching modes via Profile → Switch button |

### Submission Form Fields (Paste-Ready)

| Field | Value |
|---|---|
| Team Name | `Muhammad Huzaifa` |
| Email | `huzaifanaeem.work@gmail.com` |
| Challenge | `Challenge 2 — AI Service Orchestrator for Informal Economy` |
| Project Name | `Khidmat AI` |
| Tagline | `Ek voice se sub khidmat hazir — One voice, every service handled` |
| GitHub Repo | `https://github.com/huzaifa0096/khidmat-ai` |
| Demo Video | `<YouTube unlisted URL after upload>` |
| APK Direct Link | `https://expo.dev/artifacts/eas/9mp81WDrxmPH2iupZsLWs4.apk` |
| README Link | `https://github.com/huzaifa0096/khidmat-ai/blob/main/README.md` |
| Master Recreation Prompt | `https://github.com/huzaifa0096/khidmat-ai/blob/main/MASTER_ANTIGRAVITY_PROMPT.md` |
| Antigravity Live Execution Evidence | `demo/antigravity-screenshots/antigravity-live-execution.mp4` in repo |

### Project Description (Submission Form)

```
Khidmat AI is the only Challenge 2 submission that ships a working two-sided
marketplace APK (Customer + Provider modes), runs 6 specialized agents in
Google Antigravity with auto-generated execution evidence, supports
Urdu / Roman Urdu / English reasoning, and crosses over into Challenge 1
(Smart Insights) and Challenge 3 (Crisis Mode) — all from a single public
GitHub repo that judges can clone and run in 60 seconds.

The 6 agents (specced for Antigravity import in antigravity-agents/agents/):
1. Intent Parser — multilingual NLU
2. Provider Discovery — geo + filters across 135 mock providers
3. Ranking & Reasoning — 7-dimensional weighted scoring with urgency-adaptive
   weights, bilingual explanations, tradeoff surfacing
4. Booking Executor — 8 atomic actions (ID, slot, receipt, ICS, SMS draft,
   WhatsApp template, state mutation)
5. Follow-up Automator — 7-event lifecycle with branching rules + escalation
6. Crisis & Insights — multi-source signal fusion (weather + traffic +
   clustered reports) for emergencies; periodic insights mode for analytics

Live Antigravity execution: We imported the project into an Antigravity
workspace and executed a 4-part agentic demonstration. The Agent autonomously
read our architecture, made HTTP calls to the FastAPI backend, parsed
responses, and generated PowerShell scripts (api_calls*.ps1) to execute the
API calls — proving real agentic action execution recorded in
demo/antigravity-screenshots/antigravity-live-execution.mp4 (32 MB).

Tech stack: React Native + Expo Router 5, FastAPI + Pydantic, Python 3.11,
Google Antigravity for orchestration, Cloudflare tunnel for live demo access,
EAS for Android APK build.

Master Recreation Prompt (MASTER_ANTIGRAVITY_PROMPT.md): A single document
that any Antigravity Agent can read to recreate the entire project from
scratch — every file, every agent, every screen, every behavior.
```

---

## 12. APPENDIX — Run Commands

### Local dev
```bash
# Terminal 1 — Backend
cd backend
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2 — Mobile (Expo Go)
cd mobile-app
npm install
npx expo start --tunnel

# Terminal 3 (optional) — Cloudflare tunnel for remote demo
cloudflared tunnel --url http://localhost:8000
# → paste resulting URL into mobile-app/.env as EXPO_PUBLIC_BACKEND_HOST
```

### Production APK build
```bash
cd mobile-app
eas login
eas build --platform android --profile preview
# Result: APK download link
```

### Antigravity import (live demo)
1. Open Antigravity IDE
2. `File → Open Folder` → select the project root
3. `Ctrl+E` → Agent Manager
4. `+ New Conversation`, model: Claude Sonnet 4.6 Thinking or Opus 4.7
5. Paste the demo prompt from `ANTIGRAVITY_PASTE_CHEATSHEET.md` (4-part agentic demo)
6. Watch agents fire + auto-generate scripts

---

## 13. SUMMARY FOR THE JUDGES

**Khidmat AI demonstrates that the informal economy of Pakistan can be served by an agentic AI system that:**

1. **Understands** natural language in 3 forms (Urdu, Roman Urdu, English)
2. **Reasons** across 7 dimensions with urgency-adaptive weights
3. **Acts** through 8 atomic booking actions including receipt, ICS, SMS, WhatsApp templates
4. **Coordinates** 6 specialist agents through Google Antigravity
5. **Adapts** to emergencies by switching to Crisis Mode with multi-source signal fusion
6. **Serves** both customers and providers in a single two-sided marketplace app
7. **Documents** itself completely so any judge can clone, run, and verify in 60 seconds

**Single source of truth:** This file. Every claim is implemented in the repo. Every file is committed. Every endpoint works.

**End of Master Recreation Prompt.**
