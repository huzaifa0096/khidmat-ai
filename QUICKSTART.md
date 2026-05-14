# Quickstart — Run Everything in 2 Minutes

## Prerequisites
- **Python 3.11+**
- **Node.js 18+** (with npm)
- (Optional) **Expo Go** app on your phone for live testing

## Step 1 — Start the Backend

Open a terminal:

```powershell
cd "D:\Hackathon Challenge\backend"
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Backend live at `http://localhost:8000`
Swagger UI at `http://localhost:8000/docs`

## Step 2 — Start the Mobile App

In a **second** terminal:

```powershell
cd "D:\Hackathon Challenge\mobile-app"
npm install
npx expo start
```

When the QR appears, choose one:
- **Phone:** scan QR with Expo Go (must be on same Wi-Fi as your laptop; backend URL needs LAN IP in that case — see below)
- **Web preview:** press `w` in the terminal
- **Android emulator:** press `a` (backend URL will need `10.0.2.2:8000` instead of `127.0.0.1`)
- **iOS simulator:** press `i`

## Step 3 — Configure Backend URL (mobile/emulator only)

Edit `mobile-app/src/services/api.ts` and replace:

```ts
const BACKEND_HOST = process.env.EXPO_PUBLIC_BACKEND_HOST || 'http://127.0.0.1:8000';
```

- **Web preview:** leave as is (`127.0.0.1` works).
- **Android emulator:** change to `http://10.0.2.2:8000`.
- **Physical phone:** change to your machine's LAN IP, e.g. `http://192.168.1.10:8000`. Find it with `ipconfig` on Windows.

Or set the env var without editing:
```powershell
$env:EXPO_PUBLIC_BACKEND_HOST = 'http://192.168.1.10:8000'
npx expo start
```

## Step 4 — Try Sample Inputs

In the app's Home screen, tap mic or use these prompts:

- *"Mujhe kal subah G-13 mein AC technician chahiye"* — happy path
- *"Ghar mein pani bhar gaya hai, foran plumber bhejo G-10 mein"* — **Crisis Mode**
- *"I need a math tutor for O-Levels in F-10 Islamabad"* — English
- *"DHA Phase 5 Lahore mein plumber chahiye abhi"* — Lahore
- *"AC theek karwana hai"* — triggers clarification flow

## Step 5 — Generate Demo Traces (optional)

After backend is up:

```powershell
cd "D:\Hackathon Challenge"
python demo/export_sample_traces.py
```

Generates 5 trace JSON files in `demo/` — perfect for showing judges.

## Step 6 — Set Up Gemini (optional)

For Gemini-powered intent parsing (more robust than rule-based):

```powershell
cd "D:\Hackathon Challenge\backend"
Copy-Item .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

Get a free key at https://aistudio.google.com/apikey

The intent parser auto-detects the key and switches engines. If absent, it falls back to the deterministic rule-based parser — the demo still works perfectly.

## Troubleshooting

**Backend won't start:** Make sure port 8000 is free.
```powershell
Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
```

**Mobile app shows "Network Error":** Backend URL is wrong for your environment. See Step 3.

**npm install hangs:** Try `npm install --legacy-peer-deps` once.

**Expo Go disconnects on phone:** Make sure phone and laptop are on the same Wi-Fi network and the firewall allows port 8081 (Metro) and 8000 (backend).
