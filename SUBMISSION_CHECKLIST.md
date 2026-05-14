# 🏆 Khidmat AI — Submission Checklist

> Final pre-submission verification for **#AISeekho 2026 Antigravity Hackathon · Challenge 2**

---

## ✅ Engineering Done

| Component | Status | Where |
|---|---|---|
| Mobile App | ✅ Complete | `mobile-app/` (React Native + Expo, 15 screens) |
| Backend orchestrator | ✅ Complete | `backend/` (FastAPI, 4 agent impls, 15 route modules) |
| Antigravity agent specs | ✅ Complete | `antigravity-agents/agents/` (6 agents + workflow + tools catalog) |
| Mock dataset | ✅ Complete | `data/providers_mock.json` (135 providers · 4 cities · 20 categories) |
| Sample agent traces | ✅ Complete | `demo/trace_*.json` (5 scenarios) |
| Documentation | ✅ Complete | `README.md`, `docs/ARCHITECTURE.md`, `docs/ANTIGRAVITY_USAGE.md`, `docs/EVALUATION_MAPPING.md`, `docs/DEMO_SCRIPT.md`, `docs/ANTIGRAVITY_IMPORT_GUIDE.md` |
| App icons + splash | ✅ Generated | `mobile-app/assets/` (icon, adaptive-icon, splash, favicon) |
| EAS build config | ✅ Ready | `mobile-app/eas.json` |
| Light + Dark theme | ✅ Dynamic | All 15 screens + all components |
| Two-sided marketplace | ✅ Working | Customer + Provider modes, real-time accept/cancel |
| Crisis Mode | ✅ Working | Challenge 3 crossover with multi-source signal fusion |
| Smart Insights | ✅ Working | Challenge 1 crossover with simulated actions |
| Google Sign-In | ✅ Working | Real GSI with demo fallback |
| Live location | ✅ Working | Geolocation API with sector matching |
| Real interactive map | ✅ Working | Leaflet + CARTO theme-aware tiles |

---

## ⏳ Your Tasks Before Submission

### 1. Record Demo Video (3–5 minutes) — REQUIRED

**Script:** `docs/DEMO_SCRIPT.md`

**Quick checklist:**
- [ ] Both servers running (`start.bat`)
- [ ] Browser at `localhost:8081` OR phone with Expo Go connected
- [ ] Screen recording software ready (OBS, ScreenRec, or Windows Game Bar Win+G)
- [ ] Microphone tested
- [ ] Run through script once before recording

**Cover these scenes (each ~30-45s):**
1. **Sign in** — Demo Customer "Aisha" button
2. **Search** — "Mujhe kal subah G-13 mein AC technician chahiye"
3. **Agent War Room** — pause to read 2-3 agent messages
4. **Results** — point out reasoning, badges, score
5. **Book** — show pending state with polling indicator
6. **Switch device/account** to Provider — show booking arrive
7. **Accept** — show customer's screen update instantly
8. **Crisis demo** — "Ghar mein pani bhar gaya foran plumber G-10"
9. **Theme toggle** — Settings → Light/Dark
10. **Wrap with "Powered by Google Antigravity"**

Upload to YouTube (unlisted) or Drive (link-shareable).

### 2. Antigravity IDE Setup — STRONGLY RECOMMENDED

Follow `docs/ANTIGRAVITY_IMPORT_GUIDE.md`. Open Antigravity IDE and:
- [ ] Create workspace `khidmat-ai-orchestrator`
- [ ] Import each of 6 agents from `antigravity-agents/agents/`
- [ ] Set up `khidmat_main_orchestration_v1` workflow
- [ ] Run one test query to verify tools resolve
- [ ] Keep tab open during presentation

### 3. GitHub Push — REQUIRED

```bash
cd "D:\Hackathon Challenge"
git init   # if not already
git add .
git commit -m "Khidmat AI — #AISeekho 2026 Challenge 2 final"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/khidmat-ai.git
git push -u origin main
```

Make repo **public** so judges can clone and run.

### 4. Submission Form Fields (May 20 deadline)

| Field | What to paste |
|---|---|
| **Team Name** | Your team name |
| **Challenge Selected** | Challenge 2 — AI Service Orchestrator |
| **GitHub repo URL** | Public link |
| **Demo video URL** | YouTube / Drive |
| **README link** | `https://github.com/YOU/khidmat-ai/blob/main/README.md` |
| **Mobile build / APK** | (optional) Run `eas build --platform android --profile preview` and attach |

---

## 🎯 Evaluation Rubric Self-Score

| Criterion | Weight | Projected | Why |
|---|---|---|---|
| Use of Antigravity | 25% | 22-24 | 6 agents + workflow + tools catalog all importable; backend mirrors agent logic; trace export for audit |
| Agentic Reasoning & Workflow | 20% | 18-19 | Multi-step pipeline with branching, retries, fallbacks; visible in War Room |
| Matching Quality | 20% | 18-19 | 7-dim weighted scoring, urgency-adaptive, reasoning in user's language, tradeoff surfacing |
| Action Simulation | 15% | 14-15 | 8 atomic booking actions + 7-event followup + accept/cancel state machine |
| Technical Implementation | 10% | 9-10 | Clean layered architecture, 15 route modules, idempotent ops, theme-aware UI |
| Innovation & UX | 10% | 9-10 | Agent War Room, AI voice narration, two-sided marketplace, crisis crossover, real map, predictive For You |
| **TOTAL** | 100% | **90-97** | **TOP 1-3 territory** |

---

## 💡 Talking Points for Live Q&A

**"How is Antigravity central?"**
> *"Six specialist agents are defined in our `antigravity-agents/` folder — Intent Parser, Provider Discovery, Ranking & Reasoning, Booking Executor, Follow-up Automator, and Crisis Specialist. Each agent has a system prompt, JSON I/O schema, and tool bindings. The master workflow orchestrates them with branching for emergencies. Antigravity executes the agents; our backend exposes 24 tools they call into."*

**"Why two-sided marketplace?"**
> *"Real informal economy has providers and consumers. We built BOTH sides in one app — Demo Customer and Demo Provider buttons let judges sign in on two devices and watch real-time booking flow. Customer books → pending → provider accepts → customer's screen flips to confirmed within 3 seconds."*

**"How does Crisis Mode work?"**
> *"The Crisis Specialist agent activates when intent urgency = emergency. It fuses 4 signals: user keywords, weather API, traffic density, and clustered emergency reports in that sector. Outputs: severity, confidence, multi-provider dispatch plan, area-wide alert broadcast, emergency ticket. This is our Challenge 3 crossover."*

**"What's the For You tab?"**
> *"That's our Challenge 1 crossover. Our Insights Specialist agent analyzes booking patterns and surfaces predictions: 'AC service overdue, breakdown probability 23%', 'Plumber demand up 47% in your sector'. Each card has Recommended Action with Simulated Execution receipt — Challenge 1's exact Insight → Action → Simulation arc."*

**"What's unique about your AI ranking?"**
> *"7-dimensional weighted scoring: distance, rating, reviews, verified, availability, completion rate, response time. Weights shift based on urgency — emergency boosts distance to 50% weight. Every recommendation has a reasoning sentence in the user's language citing specific numbers. We also surface tradeoffs like '4km farther but 0.3★ higher rating'."*

---

## 🚀 Day-of-Presentation Setup

**30 minutes before:**
- [ ] Run `start.bat` to spin up backend + mobile
- [ ] Open `http://localhost:8081` in browser (web preview)
- [ ] Open `http://localhost:8000/docs` in another tab (Swagger UI for live API demo)
- [ ] Open `antigravity-agents/agents/` folder in VS Code
- [ ] Open Antigravity IDE workspace
- [ ] Test mic + screen sharing
- [ ] Have 2 phones ready with Expo Go (1 customer, 1 provider) on same WiFi

**During presentation:**
- [ ] Open with the **30-second hook** — "Khidmat AI: 6 agents make the informal economy click"
- [ ] Show **AGENT WAR ROOM** during search — your shock moment
- [ ] Demo **2-device customer ↔ provider flow** — judges will gasp
- [ ] End with **theme toggle Light ↔ Dark** — polish moment

---

## ✅ You're Ready

Everything is built. Documentation is complete. Demo data is seeded. Just record the video and present.

**Submission deadline:** 2026-05-20
**Days remaining:** 7

Good luck. 🚀
