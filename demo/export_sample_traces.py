"""
Export sample agent traces as JSON for demo evidence.
Run AFTER backend is up. Generates 3 traces:
  1. Happy path (AC tech booking)
  2. Crisis path (G-10 flooding)
  3. Incomplete intent (clarification flow)

Output: demo/sample_traces.json and 3 individual files.
"""
import io
import json
import os
import sys
from pathlib import Path
import httpx

# Force UTF-8 stdout on Windows
if sys.stdout.encoding.lower() != "utf-8":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

BACKEND = os.environ.get("BACKEND_URL", "http://127.0.0.1:8000")
OUT_DIR = Path(__file__).parent

USER = {"id": "U001", "name": "Huzaifa", "phone": "0300-1234567"}

scenarios = [
    {
        "name": "happy_path_ac_tech_g13",
        "input": "Mujhe kal subah G-13 mein AC technician chahiye",
        "confirm_booking": True
    },
    {
        "name": "crisis_g10_flooding",
        "input": "Ghar mein pani bhar gaya hai, foran plumber bhejo G-10 mein",
        "confirm_booking": True
    },
    {
        "name": "incomplete_clarification",
        "input": "AC theek karwana hai",
        "confirm_booking": False
    },
    {
        "name": "english_tutor_request",
        "input": "I need a math tutor for O-Levels in F-10 Islamabad",
        "confirm_booking": True
    },
    {
        "name": "lahore_plumber",
        "input": "DHA Phase 5 Lahore mein plumber chahiye abhi",
        "confirm_booking": True
    }
]


def run_scenario(client, scenario):
    name = scenario["name"]
    print(f"\n--- {name} ---")
    r = client.post(f"{BACKEND}/api/orchestrate/parse-and-rank",
                    json={"user_text": scenario["input"], "user_id": USER["id"]})
    r.raise_for_status()
    data = r.json()

    full = {
        "scenario_name": name,
        "input": scenario["input"],
        "parse_response": data
    }

    if scenario["confirm_booking"] and data.get("ranking", {}).get("top_3"):
        chosen = data["ranking"]["top_3"][0]["provider_id"]
        r2 = client.post(f"{BACKEND}/api/orchestrate/confirm-booking",
                         json={"trace_id": data["trace_id"], "chosen_provider_id": chosen, "user": USER})
        r2.raise_for_status()
        full["booking_response"] = r2.json()
        print(f"  OK Booked: {full['booking_response']['booking'].get('booking_id')}")
    else:
        print(f"  -> No booking (clarification needed: {data.get('needs_clarification')})")

    # save individual file
    (OUT_DIR / f"trace_{name}.json").write_text(json.dumps(full, indent=2, ensure_ascii=False), encoding="utf-8")
    return full


def main():
    try:
        with httpx.Client(timeout=30.0) as client:
            r = client.get(f"{BACKEND}/health")
            r.raise_for_status()
            print(f"Backend reachable: {r.json()}")

            all_traces = []
            for s in scenarios:
                try:
                    all_traces.append(run_scenario(client, s))
                except Exception as e:
                    print(f"  FAIL: {e}")

        # save consolidated
        (OUT_DIR / "sample_traces.json").write_text(
            json.dumps({"total": len(all_traces), "scenarios": all_traces}, indent=2, ensure_ascii=False),
            encoding="utf-8"
        )
        print(f"\nExported {len(all_traces)} traces to {OUT_DIR}/")

    except httpx.ConnectError:
        print(f"Cannot connect to {BACKEND}. Start the backend first:")
        print("  cd backend && python -m uvicorn main:app --reload")
        sys.exit(1)


if __name__ == "__main__":
    main()
