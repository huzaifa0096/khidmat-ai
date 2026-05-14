# Demo Video Script (4 minutes)

> Updated for the final feature set. Hit every rubric criterion in 240 seconds.

---

## Pre-Recording Setup

1. **Servers running** — `start.bat` (backend on 8000, mobile on 8081)
2. **Browser** — Edge/Chrome at `http://localhost:8081` in **incognito** (clean state)
3. **Optional** — 2nd device with Expo Go for the 2-device demo segment
4. **Recording** — OBS / Win+G / ScreenRec; 1080p, 30fps
5. **Audio** — mic check, no echo

Pre-clear AsyncStorage in browser dev tools so you land on onboarding fresh.

---

## Timestamped Script

### [0:00 – 0:20] Hook + Problem (20s)

**On screen:** Onboarding welcome screen with sparkle logo + tagline.

**Voiceover:**
> *"Pakistan ki informal economy — plumbers, AC technicians, tutors — chalti hai WhatsApp aur phone calls pe. Result: chaos. Khidmat AI ek voice se ye sab handle karta hai using six Google Antigravity agents."*

### [0:20 – 0:35] Sign In (15s)

**Action:** Tap yellow **DEMO · 2 DEVICES PE TEST** card → blue **CUSTOMER · Aisha** button.

**Voiceover:**
> *"Demo Customer mode mein sign in. Aisha Khan, G-13 Islamabad. One-tap auth — same account works across 2 phones for our marketplace demo."*

**Pause** on home screen 1 second so judges see:
- "6 AGENTS ONLINE · 135 PROVIDERS" green pill
- Hero greeting
- Mic + input

### [0:35 – 0:55] Voice Input + Submit (20s)

**Action:** Tap mic → demo text auto-types "Mujhe kal subah G-13 mein AC technician chahiye"

**Voiceover:**
> *"Roman Urdu input. AI samajh leti hai — service, location, time, urgency."*

**Action:** Tap "Khidmat Talab Karein" submit.

### [0:55 – 1:35] AGENT WAR ROOM — the shock moment (40s)

**On screen:** Agent War Room with 6 specialist agents chatting in a Slack-style channel.

**Pause 5 seconds** on the agent thread. Let judges read.

**Voiceover (read 2-3 actual messages aloud):**
> *"Yeh dekho — six agents live collaborating. Intent Parser detected Roman Urdu, ac_technician at G-13 with 95% confidence. Discovery found 6 providers, filtered 1. Ranking Brain says 'top match: Iqbal AC Solutions, 1.1km, 4.4 stars, 96% completion'. Most teams hide their AI behind a spinner. We show every agent's thought."*

### [1:35 – 2:05] Results + AI Voice Narration (30s)

**On screen:** Top 3 providers card list.

**Voiceover (let app's TTS speak first):**
> *"Watch this — the app actually narrates its decision out loud in Roman Urdu. Voice synthesis built in."*

**Wait 5s for narration**, then:
> *"Each provider has a reasoning bubble citing specific numbers, plus dynamic badges — Closest, Verified, Top Rated. Score bar at the bottom is the 7-dimensional weighted output."*

**Action:** Tap rank-1 card.

### [2:05 – 2:30] Booking Confirmation + Pending State (25s)

**On screen:** Booking confirmed screen with pulsing orange "Provider Ka Intezaar..." hero.

**Voiceover:**
> *"Booking sent — but watch this: it's NOT confirmed yet. Like Uber, the provider has to accept. The customer's screen polls every 3 seconds. Receipt, calendar invite, and WhatsApp notification all drafted but pending."*

### [2:30 – 3:00] Two-Sided Marketplace Live (30s)

**Action:** Open new tab / second phone. Sign in as **PROVIDER · Ahmed AC**.

**On screen:** Provider Home dashboard with earnings + pending requests.

**Voiceover:**
> *"Same app, second account, provider mode. Ahmed sees the live booking arrive. Earnings dashboard, online toggle, accept/decline."*

**Action:** Tap green **Accept Job** button.

**Switch back to customer device:** Within 3 seconds, screen flips from orange pending → **green confirmed**.

**Voiceover:**
> *"And the customer's phone — live confirmation. This is a real two-sided marketplace built in 7 days."*

### [3:00 – 3:30] Crisis Mode (30s)

**Action:** Customer side, back home. Type: *"Ghar mein pani bhar gaya hai foran plumber bhejo G-10"*

**On screen:** Pulsing red Crisis Mode banner with multi-source signal fusion.

**Voiceover:**
> *"Emergency input — the Crisis Specialist activates. Multi-source signal fusion: weather flash-flood alert, traffic spike 320%, three clustered reports in last 2 hours. Severity: critical. Two plumbers dispatched, area-wide alert broadcast to 540 nearby users in Urdu, P0 emergency ticket. This is our Challenge 3 crossover, built into Challenge 2's framework."*

### [3:30 – 3:50] Theme + For You (20s)

**Action:** Profile → Settings → Light Mode → Profile → For You.

**Voiceover:**
> *"Full dark and light theme support, persists across sessions. And our Challenge 1 crossover: For You — predictive AI cards based on weather, neighbors, season, and your history. 'AC service overdue, breakdown probability 23%'. Each card has a recommended action with simulated execution receipt."*

### [3:50 – 4:00] Close (10s)

**On screen:** Footer signature **"Powered by Google Antigravity · 6 specialized agents"**.

**Voiceover:**
> *"Khidmat AI. Six agents. Three challenges' depth. Production-grade two-sided marketplace. Built for Pakistan. Powered by Google Antigravity."*

---

## Director Notes

- **Pause on the War Room** for at least 5 seconds — let judges read.
- **Read reasoning bubbles verbatim** — proves they're not generic.
- **The pending → confirmed flip** is the moment — set up the camera angle to show both screens.
- **Voice narration** — make sure system volume is up, demo mic open.
- If something glitches, narrate calmly — *"this is built in 7 days, occasional polish gaps but the architecture is solid"*.
- **Total target:** 3:55. **Hard ceiling:** 5:00.

---

## Mid-Run Fallback (if something breaks)

| Failure | Workaround |
|---|---|
| Backend down | Show `docs/EVALUATION_MAPPING.md` and `antigravity-agents/agents/` instead |
| Map tile fails | Have a screenshot ready as overlay |
| Voice narration silent | Skip that beat, say *"AI voice narration is built — visible animation on the card shows the speaker icon"* |
| War room doesn't trigger | Show `demo/trace_happy_path_ac_tech_g13.json` JSON instead |
| 2-device sync fails | Just describe it — *"in production this is what would happen"* |

---

## Post-Recording

1. Trim to 4:00 max
2. Add light intro card (1s with logo) — optional
3. Export 1080p MP4
4. Upload to **YouTube Unlisted** OR **Google Drive (link-shareable)**
5. Add link to submission form
