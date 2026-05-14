# Tool Catalog — Available to All Agents

This catalog lists every tool the Antigravity orchestrator exposes to its agents. Each tool maps to a backend FastAPI endpoint.

## Data Tools

### `get_service_catalog()`
Returns the list of service categories with aliases for fuzzy matching.
- **Endpoint:** `GET /api/catalog/services`
- **Returns:** `{ categories: [...] }`

### `get_city_catalog()`
Returns supported cities and their sectors with coordinates.
- **Endpoint:** `GET /api/catalog/cities`

### `find_providers_by_category_and_city(category_id, city_id)`
- **Endpoint:** `GET /api/providers?category={}&city={}`
- **Returns:** `{ providers: [...] }`

### `find_providers_by_secondary_service(category_id, city_id)`
Fallback search through providers' secondary_services array.
- **Endpoint:** `GET /api/providers?secondary_category={}&city={}`

### `get_provider(provider_id)`
- **Endpoint:** `GET /api/providers/{id}`

## Geo Tools

### `compute_distance(lat1, lng1, lat2, lng2)`
Haversine distance in km.
- **Endpoint:** `POST /api/geo/distance`

### `get_sector_coords(city_id, sector_id)`
Returns coordinates for a sector centroid.
- **Endpoint:** `GET /api/geo/sector?city={}&sector={}`

## Scoring Tools

### `compute_score(provider, weights)`
Computes weighted score per the ranking model.
- **Endpoint:** `POST /api/score`

## Booking Tools

### `generate_booking_id()`
Returns a unique ID like `KHD-2026-05-12-AB7K3`.

### `reserve_slot(provider_id, slot_iso, duration_minutes)`
- **Endpoint:** `POST /api/bookings/reserve-slot`

### `create_booking_record(payload)`
- **Endpoint:** `POST /api/bookings`

### `generate_receipt(booking)`
Returns structured receipt + QR payload.
- **Endpoint:** `POST /api/bookings/{id}/receipt`

### `generate_ics_calendar(booking)`
- **Endpoint:** `GET /api/bookings/{id}/ics`

## Notification Tools (simulated)

### `draft_user_notification(booking, channel)`
- **Endpoint:** `POST /api/notifications/draft`

### `draft_provider_notification(booking)`

### `broadcast_area_alert(city, sector, message_ur, message_en)`
Emergency Mode only.
- **Endpoint:** `POST /api/alerts/broadcast`

## Scheduling Tools

### `schedule_event(event_type, trigger_at, payload)`
- **Endpoint:** `POST /api/schedule/event`

## Crisis Tools

### `fetch_weather(city, time)`
- **Endpoint:** `GET /api/external/weather?city={}` (mock data)

### `fetch_traffic_density(sector)`
- **Endpoint:** `GET /api/external/traffic?sector={}` (mock data)

### `fetch_recent_emergency_reports(sector, hours)`
- **Endpoint:** `GET /api/emergency-reports?sector={}&hours={}`

### `create_emergency_ticket(payload)`
- **Endpoint:** `POST /api/emergency-tickets`

## State Tools

### `update_system_state(payload)`
Atomic state mutation (provider availability, booking count, etc.).
- **Endpoint:** `POST /api/state/update`

### `query_booking_history(filters)`
For Insights Mode.
- **Endpoint:** `GET /api/bookings?...`

## Time Tools

### `current_datetime()`
Returns ISO string for current Pakistan time (PKT).

## LLM Tools

### `translate(text, target_lang)`
Wraps Gemini for Urdu ↔ English translation.

### `detect_language(text)`
Returns detected language code.
