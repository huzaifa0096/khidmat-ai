# 📸 Antigravity Screenshots — Capture Guide

> **2-3 minute task.** Take 6 screenshots of the Antigravity conversation and save them here.

---

## ⌨️ How to Screenshot on Windows

1. Press **`Win + Shift + S`** → screen will dim
2. Drag a rectangle around the area you want to capture
3. Screenshot copied to clipboard + notification appears bottom-right
4. Click the notification → opens **Snipping Tool** preview
5. **`Ctrl + S`** to save → navigate to this folder:
   ```
   D:\Hackathon Challenge\demo\antigravity-screenshots\
   ```
6. Save with the **exact filename** from the table below

---

## 🎯 Setup Before Starting

1. Open Antigravity IDE
2. Click on conversation: **"Demonstrating Khidmat AI Agentic Workflow"** (left sidebar)
3. Conversation should fill the right pane
4. **Scroll to the very TOP** of the conversation

---

## 📷 6 Screenshots to Capture

### 1. `01-prompt.png` — The Original Prompt
**Scroll position:** Very top of conversation
**What to capture:** Your full prompt that starts with *"You are demonstrating Khidmat AI..."*
**Should include:** First ~5-6 lines of the prompt + the workspace name "Hackathon Challenge" at top

---

### 2. `02-agents-listed.png` — Part 1 (6 Agents)
**Scroll down to:** Section where Agent lists the 6 agent files
**What to capture:** The list showing:
- `01_intent_parser.md`
- `02_provider_discovery.md`
- `03_ranking_reasoning.md`
- `04_booking_executor.md`
- `05_followup_automator.md`
- `06_crisis_insights.md`
**Bonus:** Include the Intent Parser system prompt quote if visible

---

### 3. `03-api-call.png` — Part 2 (HTTP Call + Intent)
**Scroll down to:** Section where Agent made HTTP POST
**What to capture:** Should show:
- HTTP request tool call (POST to `parse-and-rank`)
- Parsed JSON intent with `service_category_id: ac_technician`, `sector: G-13`, `language_detected: roman_urdu`
- The `trace_id` (e.g., TRC-2026-05-15-XXXX)
- Top-3 providers with names + reasoning

---

### 4. `04-booking.png` — Part 3 (Booking Confirmed)
**Scroll down to:** Section where booking was made
**What to capture:**
- POST to `confirm-booking`
- `booking_id` (KHD-2026-05-15-XXXXX)
- Receipt details (slot, price, provider)
- Follow-up plan events (T-24h reminder, etc.)

---

### 5. `05-crisis.png` — Part 4 (Crisis Dispatch) ⭐
**Scroll to bottom:** This is the screenshot you ALREADY shared in chat
**What to capture:**
- Table showing 2 providers (Moin Plumbing P1013 41min + Kamran Plumbing P1014 74min)
- `area_alert.message_ur` — Urdu flooding alert
- "Broadcast to 540 estimated users"
- Final summary box: *"Khidmat AI uses 6 specialized agents..."*

---

### 6. `06-files-modified.png` — Agentic Action Proof
**Scroll to:** Just below the final summary
**What to capture:**
- **"Files Modified: 4"** section
- The 4 file tabs: `api_calls.ps1`, `api_calls_34.ps1`, `parse_part3.ps1`, `parse_part4.ps1`
- **"Review Changes"** button
- The "Khidmat Ai Demo Walkthrough" document chip

**Why this matters:** This proves Antigravity didn't just reason — it generated REAL PowerShell scripts on its own to execute the API calls. That's **action execution = 25% Antigravity criterion satisfied with hard evidence.**

---

## ✅ Verification

After saving all 6, verify in File Explorer:

```
D:\Hackathon Challenge\demo\antigravity-screenshots\
├── 01-prompt.png
├── 02-agents-listed.png
├── 03-api-call.png
├── 04-booking.png
├── 05-crisis.png
└── 06-files-modified.png
```

All 6 files present? ✅ You're done.

---

## 💡 Pro Tip

If a section is too tall to fit one screenshot, take 2 screenshots:
- `03a-api-call-top.png`
- `03b-api-call-bottom.png`

It's fine — judges prefer more clarity over fewer images.

---

## 🎬 What's Next

After screenshots are done:
1. These images go into your **demo video** at the Antigravity scene (60-second segment)
2. Optionally embed them in `README.md` for the GitHub repo
3. Attach them to the hackathon submission form as "Antigravity execution evidence"

---

**Total time:** 2-3 minutes. Start with `01-prompt.png` and work down. 🚀
