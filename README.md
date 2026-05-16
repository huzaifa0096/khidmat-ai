# Khidmat AI — Agentic Service Orchestrator for Pakistan's Informal Economy

> **#AISeekho 2026 Google Antigravity Hackathon — Challenge 2 Submission**
>
> *Ek voice se sub khidmat hazir — One voice, every service handled.*

Khidmat AI is an **agentic AI mobile platform** that automates the end-to-end lifecycle of informal-economy service requests in Pakistan — from natural-language intent (Urdu / Roman Urdu / English) all the way through provider discovery, smart ranking, booking simulation, two-sided marketplace acceptance, and post-service follow-up automation.

It is built around **Google Antigravity** as the core orchestration layer that coordinates **6 specialized agents** working together, with full traceable reasoning at every step.

---

## 🎯 Challenge Selected: **Challenge 2 — AI Service Orchestrator for Informal Economy**

We deliberately picked Challenge 2 because the informal economy in Pakistan (plumbers, electricians, AC technicians, tutors, beauticians, mobile repair, …) is **mobile-first by nature**, **Urdu-first by language**, and the agentic gap is enormous — most current "services apps" are glorified listings with no intelligence.

We also added **crossover features** that incorporate flavor from Challenges 1 and 3 within the scope of Challenge 2:

- **Smart Insights tab + For You predictive cards** ← Challenge 1 (Insight→Action) flavor
- **Crisis Mode** ← Challenge 3 (CIRO) flavor — multi-source signal fusion, area-wide alerts, priority dispatch

This gives us **breadth across 3 challenges' worth of capability** while staying anchored to Challenge 2's evaluation rubric.

---

## 🏗 System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│              MOBILE APP (React Native + Expo Router)                  │
│                                                                       │
│  15 screens · Dark + Light theme · Glassmorphism · Voice narration   │
│  ───────────────────────────────────────────────────────────────────  │
│  Onboarding (Google + Phone OTP + Demo Quick Sign-In)                │
│  Home Dashboard · Agent War Room · Results · Booking Flow            │
│  Provider Mode (Job Feed · Earnings · Accept/Cancel/Decline)         │
│  Live Map (Leaflet, theme-aware tiles) · For You (predictive)        │
│  Crisis Mode · Smart Insights · History · Profile · Settings         │
└──────────────────────────────┬───────────────────────────────────────┘
                               │ REST API
┌──────────────────────────────▼───────────────────────────────────────┐
│              FASTAPI BACKEND  (Python 3.11)                           │
│  /api/orchestrate/parse-and-rank     /api/orchestrate/confirm-booking │
│  /api/orchestrate/insights           /api/traces/*                    │
│  /api/bookings/{id}/cancel  /api/bookings/{id}/status                 │
│  /api/providers-self/register  /api/providers-self/me/jobs            │
│  /api/providers-self/me/jobs/{id}/respond  /me/earnings               │
│  /api/external/weather  /api/external/traffic                         │
│  /api/emergency-tickets  /api/alerts/broadcast                        │
└──────────────────────────────┬───────────────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────────────┐
│        GOOGLE ANTIGRAVITY ORCHESTRATION LAYER (6 agents)              │
│                                                                       │
│   1. Intent Parser            (Urdu/Roman/English → structured intent)│
│   2. Provider Discovery       (DB query + geo distance + filtering)   │
│   3. Ranking & Reasoning      (multi-dim weighted scoring + reasoning)│
│   4. Booking Executor         (8-step end-to-end booking simulation)  │
│   5. Follow-up Automator      (7-event timeline w/ branching rules)   │
│   6. Crisis/Insights          (Mode A: crisis  /  Mode B: insights)   │
└───────────────────────────────────────────────────────────────────────┘
```

For deep details, see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## 🥇 What Makes Khidmat AI Different

Challenge 2's problem space invites surface-level solutions. Khidmat AI separates itself across **seven measurable dimensions**:

| Dimension | Typical Submission | Khidmat AI |
|---|---|---|
| **Agent count** | 2-3 agents (parse + recommend) | **6 specialist agents** with clear roles + 24-tool catalog |
| **User sides** | Customer only | **Two-sided marketplace** — Customer + Provider modes in one app, real-time sync |
| **Languages** | English | **Trilingual reasoning** — Urdu, Roman Urdu, English (reasoning per provider matches input language) |
| **Ranking logic** | "Closest" or "Highest rated" | **7-dimensional weighted scoring** with urgency-adaptive weights + tradeoff surfacing ("4km farther but 0.3★ higher rating") |
| **Action simulation** | One booking confirmation | **8 atomic actions per booking** — receipt, ICS calendar, SMS draft, WhatsApp template, state mutation, follow-up timeline (7 events with branching rules) |
| **Cross-challenge depth** | Single challenge focus | **Crisis Mode** (Challenge 3 crossover with multi-source signal fusion) + **Smart Insights** (Challenge 1 crossover with simulated execution) |
| **Antigravity proof** | Agent specs in folder | **Live workspace execution** — Agent auto-generated PowerShell scripts (`api_calls*.ps1`) + `khidmat_ai_demo_walkthrough.md` while running our 4-part demo, recorded in `demo/antigravity-screenshots/antigravity-live-execution.mp4` |

**Plus polish judges notice:**
- Agent War Room — live multi-agent visualization screen
- Real interactive map (Leaflet + CARTO theme-aware tiles)
- 135 mock providers across 4 cities, 20 categories (most teams: 5-10)
- Provider self-onboarding + service management portal
- In-app chat with quick replies in Roman Urdu
- Trust Score tier system (Elite / Trusted / Verified / New)
- Bilingual UI + Dark/Light theme — fully dynamic across all 17 screens
- Hardcoded production backend URL so APK works out of the box
- Public GitHub repo with first-class README + architecture docs

**The bottom line:** Most submissions answer *"can you build a booking app with AI?"* Khidmat AI answers *"can you build a production-ready agentic platform that judges can install, sign in to as both customer AND provider, demo a crisis, see live agent reasoning, and clone from a public repo?"*

---

## 🤖 The 6 Agents (heart of Antigravity usage — 25% weight)

| # | Agent | Role |
|---|---|---|
| 1 | **Intent Parser** | Detects language, extracts service / location / time / urgency / constraints. Asks clarifications if incomplete. |
| 2 | **Provider Discovery** | Queries 135 providers, applies hard filters (availability, emergency-only, budget), sorts by proximity. |
| 3 | **Ranking & Reasoning** | 7-dim weighted scoring, urgency-adaptive weights, produces top-3 with reasoning in user's language + tradeoff surfacing + dynamic badges. |
| 4 | **Booking Executor** | 8 atomic actions: generate ID, reserve slot, create record, generate receipt, draft notifications (in-app/SMS/WhatsApp×2), generate ICS calendar, mutate state. |
| 5 | **Follow-up Automator** | Generates 7-event timeline (T-24h, T-2h, T-30m, T+30m, completion, rating, rebooking) with branching rules and escalation handlers. |
| 6 | **Crisis & Insights** | **Mode A**: signal fusion + dispatch coordination. **Mode B**: booking-history analytics for demand spikes & underserved areas. |

Full spec for each agent in [`antigravity-agents/agents/`](antigravity-agents/agents/).

---

## 📱 Mobile App — 15 Screens

| Screen | What it does |
|---|---|
| **Onboarding** | 4-step flow with Google Sign-In, phone OTP, location auto-detect via Geolocation API, Demo Quick Sign-In (Customer/Provider) for 2-device testing |
| **Home** | Compact AI status pill, hero prompt, voice/text input, premium demo scenarios, popular service chips |
| **Agent War Room** | Live Slack-style chat of 6 agents debating in real-time during processing |
| **Results** | Top-3 providers with reasoning, badges, score bars, AI voice narration of decision summary |
| **Booking Confirmed** | Pending-acceptance state with 3s polling, switches to confirmed when provider accepts, cancel button with reason picker |
| **Timeline** | 7-event follow-up lifecycle with branching rules |
| **Crisis Mode** | Pulsing red banner, multi-source signal fusion, dispatch plan, area alert, emergency surcharge, outcome projection |
| **For You** | 6 AI-predicted action cards (weather/social/savings/trends) + backend platform insights |
| **Live Map** | Real interactive map (Leaflet + CARTO theme-aware tiles), provider pins by lat/lng, user location, density chart |
| **Profile** | Account, Activity, Discover, Become a Provider, Sign Out — iOS Settings style |
| **Settings** | Dark/Light picker, language, notifications, experience, about |
| **Insights** | Smart Insights with simulated executions |
| **History** | Past bookings + agent traces |
| **Become a Provider** | Service self-registration form with category picker |
| **Provider Home** | Earnings (Today/Week/Month + 7-day chart), pending jobs feed (real + synthetic), accept/decline/cancel, online/offline toggle |

**Premium UI:** Glassmorphism, Moti spring animations, gradient buttons, haptic feedback, fully dark + light themes.

---

## 🚀 Run Locally

### Quick start (one click)
```powershell
cd "D:\Hackathon Challenge"
.\start.bat
```
Opens both servers + browser auto-launch.

### Manual

**Backend (FastAPI):**
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Mobile App (Expo):**
```bash
cd mobile-app
npm install
npx expo start
```

- Web preview: press `w` → http://localhost:8081
- Phone: scan QR with Expo Go (same WiFi)
- Android emulator: press `a`

### Optional environment variables
Create `mobile-app/.env`:
```
EXPO_PUBLIC_BACKEND_HOST=http://YOUR_LAN_IP:8000
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=...   # Optional — falls back to OSM/CARTO tiles
EXPO_PUBLIC_GOOGLE_CLIENT_ID=...      # Optional — falls back to demo Google button
```

Create `backend/.env`:
```
GEMINI_API_KEY=...   # Optional — Intent Parser falls back to deterministic rule engine
```

---

## ⚡ How We Win Each Evaluation Criterion

| Criterion | Weight | Highlights |
|---|---|---|
| **Use of Antigravity** | 25% | 6 agents in `antigravity-agents/agents/` · master workflow · 24-tool catalog · ~20 tool calls per request · full trace export |
| **Agentic Reasoning** | 20% | Multi-step pipeline · urgency branching · fallback paths · retry logic · branching rules in follow-up · visible in Agent War Room |
| **Matching Quality** | 20% | 7-dimensional weighted scoring · urgency-adaptive weights · tradeoff surfacing · language-matched reasoning · dynamic badges |
| **Action Simulation** | 15% | 8 atomic booking actions · 7-event follow-up · real pending → accept → confirm state machine · cancel with reason · live customer↔provider sync |
| **Technical Implementation** | 10% | 15 route modules · clean architecture · idempotent ops · theme-aware UI · 2 modes (customer+provider) · live polling |
| **Innovation & UX** | 10% | Agent War Room (multi-agent chat) · AI voice narration · two-sided marketplace · crisis crossover · insights crossover · real interactive map · For You predictive cards · Bilingual + light/dark theme · Demo Quick Sign-In for 2-device flow |

See [`docs/EVALUATION_MAPPING.md`](docs/EVALUATION_MAPPING.md) for detailed mapping.

---

## 📂 Project Structure

```
Khidmat-AI/
├── README.md                          ← You are here
├── SUBMISSION_CHECKLIST.md            ← Final pre-submission verification
├── QUICKSTART.md                      ← 2-minute setup
├── start.bat / stop.bat               ← One-click launchers
├── Required/                          ← Original hackathon documents
├── antigravity-agents/                ← Agent specs for Antigravity import
│   ├── agents/                        ← 6 agent definition files
│   ├── workflows/main_orchestration.md
│   └── tools.md                       ← 24-tool catalog
├── backend/                           ← FastAPI server
│   ├── main.py
│   ├── agents/                        ← Python agent implementations
│   ├── routes/                        ← 15 REST route modules
│   ├── utils/
│   └── requirements.txt
├── mobile-app/                        ← React Native + Expo
│   ├── app/                           ← Expo Router screens (15 files)
│   ├── src/
│   │   ├── components/                ← 14 reusable UI components
│   │   ├── theme/                     ← Design tokens + dark/light palettes
│   │   ├── state/                     ← AppContext
│   │   ├── hooks/                     ← useTheme, useLiveLocation, useSpeechRecognition
│   │   └── services/api.ts            ← Backend client
│   ├── assets/                        ← Icons + splash (generated)
│   ├── eas.json                       ← EAS build config
│   └── package.json
├── data/                              ← Mock datasets
│   ├── service_categories.json
│   ├── providers_mock.json            ← 135 generated providers
│   └── generate_providers.py
├── docs/
│   ├── ARCHITECTURE.md
│   ├── ANTIGRAVITY_USAGE.md
│   ├── EVALUATION_MAPPING.md
│   ├── DEMO_SCRIPT.md                 ← For the 4-min demo video
│   └── ANTIGRAVITY_IMPORT_GUIDE.md    ← Step-by-step Antigravity IDE setup
└── demo/                              ← 5 pre-generated agent traces
```

---

## 🎥 Demo Video

See [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md) — tightly choreographed 4-minute script.

Demo flow:
1. Sign in (Demo Customer) — 15s
2. Voice input + War Room — 60s
3. Results + AI voice narration — 30s
4. Pending booking + 2-device provider accept — 55s
5. Crisis Mode — 30s
6. Theme toggle + For You — 20s
7. Close — 10s

---

## 🏆 Submission Status

| Item | Status |
|---|---|
| Mobile app | ✅ Complete (15 screens, dark+light themes) |
| Backend orchestrator | ✅ Complete (FastAPI, 4 agent impls, 15 route modules) |
| Antigravity agent specs | ✅ Complete (6 agents + workflow + 24 tools) |
| Sample agent traces | ✅ 5 scenarios exported |
| Documentation | ✅ 6 markdown docs |
| App icons + splash | ✅ Generated |
| EAS build config | ✅ Ready |
| Two-sided marketplace | ✅ Working with real-time accept/cancel |
| Crisis Mode crossover | ✅ Working with multi-source signal fusion |
| Smart Insights + For You crossover | ✅ Working with simulated execution |
| Live map (theme-aware) | ✅ Working |
| Bilingual + Light/Dark theme | ✅ Fully dynamic across all screens |
| Demo video | ⏳ User records (script ready) |
| Antigravity IDE import | ✅ **Completed — live workflow executed** |

### 🤖 Antigravity Live Execution Proof

Imported into Antigravity IDE workspace `Hackathon Challenge` and ran a full 4-part agentic demonstration via the Agent Manager (Claude Sonnet 4.6 Thinking):

| Part | What Antigravity Agent Did | Evidence |
|---|---|---|
| 1 | Read all 6 agent spec files from `antigravity-agents/agents/`, quoted Intent Parser system prompt, explained workflow graph | Conversation: *"Demonstrating Khidmat AI Agentic Workflow"* |
| 2 | Made live HTTP POST to `/api/orchestrate/parse-and-rank` with Roman Urdu input — parsed intent, fired 6 agents, returned trace_id + top-3 providers with reasoning | Generated `api_calls.ps1` + `parse_part3.ps1` |
| 3 | Confirmed booking on top-1 provider via `/api/orchestrate/confirm-booking` — got `booking_id`, receipt, 7 follow-up events | Generated `api_calls_34.ps1` |
| 4 | Crisis input ("Ghar mein pani bhar gaya G-10") triggered Crisis Specialist — dispatched 2 providers (Moin Plumbing + Kamran Plumbing) with redundancy, broadcast area_alert in Urdu to 540 users | Generated `parse_part4.ps1` |

**Output artefacts (committed to repo):**
- `Khidmat Ai Demo Walkthrough.md` — auto-generated walkthrough doc
- `api_calls.ps1`, `api_calls_34.ps1`, `parse_part3.ps1`, `parse_part4.ps1` — PowerShell scripts Antigravity created on its own to execute the API calls (= real agentic action execution, not just reasoning)

This satisfies the **25% "Use of Google Antigravity"** criterion with verifiable evidence: agent specs + workspace import + live workflow execution + auto-generated tool scripts + saved conversation trace.

---

## 🙏 Acknowledgements

- **Google Antigravity** for the orchestration platform
- **Google for Developers**, **Telenor Pakistan**, **InnoVista**, **Ministry of IT & Telecom** for organizing #AISeekho 2026

---

**Team:** Huzaifa & co.
**Submitted:** May 2026 · #AISeekho 2026 Antigravity Hackathon · Challenge 2
