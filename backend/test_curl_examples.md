# curl Examples — Backend API Smoke Tests

Run these after starting the backend at `http://localhost:8000`.

## Health Check

```bash
curl http://localhost:8000/health
```

## Catalog

```bash
curl http://localhost:8000/api/catalog/services
curl http://localhost:8000/api/catalog/cities
```

## Providers

```bash
# All AC technicians in Islamabad sorted by proximity to F-7
curl "http://localhost:8000/api/providers?category=ac_technician&city=islamabad&lat=33.7295&lng=73.0561"
```

## End-to-End Orchestration (Happy Path)

```bash
curl -X POST http://localhost:8000/api/orchestrate/parse-and-rank \
  -H "Content-Type: application/json" \
  -d '{"user_text":"Mujhe kal subah G-13 mein AC technician chahiye","user_id":"U001"}'
```

Expected: response with `intent`, `ranking.top_3` (3 providers), and full `trace`.

## End-to-End Orchestration (Crisis Path)

```bash
curl -X POST http://localhost:8000/api/orchestrate/parse-and-rank \
  -H "Content-Type: application/json" \
  -d '{"user_text":"Ghar mein pani bhar gaya hai, foran plumber bhejo G-10 mein","user_id":"U001"}'
```

Expected: response includes `crisis` object with `crisis_assessment`, `dispatch_plan`, `area_alert`, `pricing`, `outcome_projection`.

## Confirm Booking

After parse-and-rank, take the `trace_id` and a `provider_id` from `ranking.top_3[0]`:

```bash
curl -X POST http://localhost:8000/api/orchestrate/confirm-booking \
  -H "Content-Type: application/json" \
  -d '{
    "trace_id":"TRC-2026-05-12-XXXX",
    "chosen_provider_id":"P1007",
    "user":{"id":"U001","name":"Huzaifa","phone":"0300-1234567"}
  }'
```

Expected: response with `booking` (8 system_state_changes, full receipt, notifications) and `followup_plan` (7 events).

## Insights (Mode B of Crisis Specialist)

```bash
curl http://localhost:8000/api/orchestrate/insights
```

## Traces

```bash
# List recent traces
curl http://localhost:8000/api/traces

# Export a specific trace as JSON
curl http://localhost:8000/api/traces/TRC-2026-05-12-XXXX/export
```

## State Summary

```bash
curl http://localhost:8000/api/state/summary
```

Shows live counts of providers, bookings, traces, events, emergency tickets, etc.

## Emergency / Alerts

```bash
curl http://localhost:8000/api/emergency-tickets
curl http://localhost:8000/api/alerts
```

## External (Mock)

```bash
curl "http://localhost:8000/api/external/weather?city=islamabad"
curl "http://localhost:8000/api/external/traffic?sector=G-10"
```

## Bookings

```bash
# List all bookings
curl http://localhost:8000/api/bookings

# Get one
curl http://localhost:8000/api/bookings/KHD-2026-05-12-XXXX

# Get ICS calendar
curl http://localhost:8000/api/bookings/KHD-2026-05-12-XXXX/ics
```
