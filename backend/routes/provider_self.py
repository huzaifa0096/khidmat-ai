"""
Provider self-service endpoints — registration, job feed, earnings.
Powers the "Provider Mode" of Khidmat AI.
"""
import random
import string
from datetime import datetime, timedelta
from fastapi import APIRouter, Request
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class ProviderRegister(BaseModel):
    user_id: str
    name: str
    business_name: str
    primary_service: str
    city: str
    sector: str
    phone: str
    price_range: Optional[str] = None
    languages: Optional[list[str]] = None
    description: Optional[str] = None


@router.post("/register")
async def register_provider(payload: ProviderRegister, request: Request):
    """Self-register a new provider. Idempotent — if user_owner_id already exists,
    returns the existing record (useful for demo Quick Sign-In)."""
    store = request.app.state.store
    # Idempotency: same user_id → same provider record
    existing = next(
        (p for p in store.providers if p.get("user_owner_id") == payload.user_id),
        None,
    )
    if existing:
        return {"success": True, "provider": existing, "reused": True}
    sector = store.get_sector(payload.city, payload.sector)
    if not sector:
        # fallback to city center
        city = store.get_city(payload.city)
        if not city:
            return {"error": "invalid_city"}
        lat = city["center"]["lat"]
        lng = city["center"]["lng"]
    else:
        lat = sector["lat"]
        lng = sector["lng"]

    pid = "P" + payload.user_id[-4:] + "".join(random.choices(string.digits, k=3))
    provider = {
        "id": pid,
        "name": payload.name,
        "business_name": payload.business_name,
        "primary_service": payload.primary_service,
        "secondary_services": [],
        "city": payload.city,
        "city_name_en": payload.city.title(),
        "sector": payload.sector,
        "location": {"lat": lat, "lng": lng},
        "phone": payload.phone,
        # Boosted defaults so the user's own listing appears in top-3 during their demo
        "rating": 4.8,
        "reviews_count": 12,
        "experience_years": 5,
        "verified": True,
        "emergency_24x7": True,
        "availability": "available_now",
        "avg_response_minutes": 18,
        "completion_rate_percent": 98,
        "price_range": payload.price_range or "PKR 1500-5000",
        "languages": payload.languages or ["Urdu", "English"],
        "description": payload.description or f"{payload.primary_service.replace('_',' ').title()} services by {payload.name}.",
        "profile_image": f"https://i.pravatar.cc/300?u={pid}",
        "joined_date": datetime.now().date().isoformat(),
        "completed_jobs": 0,
        "user_owner_id": payload.user_id,
        "self_registered": True,
    }
    store.providers.append(provider)
    store.log_state_change({
        "type": "provider_registered",
        "provider_id": pid,
        "user_id": payload.user_id,
        "ts": datetime.now().isoformat(),
    })
    return {"success": True, "provider": provider}


def _synthetic_pending_jobs(store, provider_id: Optional[str], category: Optional[str]) -> list[dict]:
    """Generate 2-4 realistic pending jobs for demo realism."""
    samples = [
        {
            "service": "AC not cooling, gas refill needed",
            "customer": "Ayesha Khan",
            "sector": "G-13",
            "scheduled_in_minutes": 45,
            "price_estimate": "PKR 2,500–4,000",
        },
        {
            "service": "Kitchen sink leak — urgent",
            "customer": "Bilal Ahmed",
            "sector": "F-10",
            "scheduled_in_minutes": 15,
            "price_estimate": "PKR 1,200–2,000",
        },
        {
            "service": "MCB replacement and wiring check",
            "customer": "Saima Malik",
            "sector": "I-8",
            "scheduled_in_minutes": 120,
            "price_estimate": "PKR 1,800–3,200",
        },
        {
            "service": "Geyser pilot not igniting",
            "customer": "Hassan Raza",
            "sector": "F-11",
            "scheduled_in_minutes": 90,
            "price_estimate": "PKR 1,500–2,800",
        },
    ]
    jobs = []
    now = datetime.now()
    for i, s in enumerate(samples):
        scheduled = now + timedelta(minutes=s["scheduled_in_minutes"])
        jobs.append({
            "job_id": f"JOB-{now.strftime('%H%M')}-{i+1:02d}",
            "status": "pending",
            "service_text": s["service"],
            "customer_name": s["customer"],
            "sector": s["sector"],
            "scheduled_for": scheduled.isoformat(),
            "scheduled_in": s["scheduled_in_minutes"],
            "price_estimate": s["price_estimate"],
            "distance_km": round(0.4 + i * 0.7, 1),
        })
    return jobs


@router.get("/me/jobs")
async def my_jobs(request: Request, user_id: Optional[str] = None, provider_id: Optional[str] = None):
    """Return job feed for THIS provider — real pending + confirmed bookings + synthetic demo pending."""
    import traceback
    try:
        store = request.app.state.store

        real_pending: list[dict] = []
        confirmed: list[dict] = []

        for b in list(store.bookings.values()):
            try:
                if not isinstance(b, dict):
                    continue
                booking_provider = b.get("provider") or {}
                is_my_booking = False
                if provider_id and booking_provider.get("id") == provider_id:
                    is_my_booking = True
                elif not provider_id and len(confirmed) + len(real_pending) < 6:
                    # Demo fallback when no provider_id passed
                    is_my_booking = True
                if not is_my_booking:
                    continue

                pricing = b.get("pricing") or {}
                # Support new (final_pkr/range_low_pkr/range_high_pkr) and legacy (estimated_range_pkr) shapes
                if "range_low_pkr" in pricing and "range_high_pkr" in pricing:
                    try:
                        price_estimate = f"PKR {int(pricing['range_low_pkr']):,}–{int(pricing['range_high_pkr']):,}"
                    except Exception:
                        price_estimate = f"PKR {pricing.get('range_low_pkr')}–{pricing.get('range_high_pkr')}"
                elif "final_pkr" in pricing:
                    try:
                        price_estimate = f"PKR {int(pricing['final_pkr']):,}"
                    except Exception:
                        price_estimate = f"PKR {pricing.get('final_pkr')}"
                else:
                    price_estimate = pricing.get("estimated_range_pkr", "PKR —")

                svc = b.get("service") or {}
                usr = b.get("user") or {}
                loc = b.get("location") or {}
                rec = b.get("receipt") or {}

                item = {
                    "job_id": b.get("booking_id") or b.get("id") or "—",
                    "service_text": svc.get("category_name_en") or svc.get("name_en") or "Service",
                    "customer_name": usr.get("name", "Customer"),
                    "customer_phone": usr.get("phone", ""),
                    "sector": loc.get("sector", "—"),
                    "city": loc.get("city", "—"),
                    "scheduled_for": b.get("scheduled_for", ""),
                    "price_estimate": price_estimate,
                    "receipt_id": rec.get("receipt_id", "—") if isinstance(rec, dict) else "—",
                    "is_real": True,
                    "status": b.get("status", "confirmed"),
                }

                status = b.get("status", "confirmed")
                if status == "pending_provider_acceptance":
                    # surface as real pending so provider can accept
                    try:
                        scheduled = datetime.fromisoformat(b["scheduled_for"])
                        mins = max(0, int((scheduled - datetime.now()).total_seconds() // 60))
                    except Exception:
                        mins = 0
                    item.update({
                        "scheduled_in": mins,
                        "distance_km": 0.0,
                    })
                    real_pending.append(item)
                elif status == "confirmed":
                    confirmed.append(item)
            except Exception as inner:
                print(f"[my_jobs] skipping malformed booking: {inner}")
                traceback.print_exc()
                continue

        confirmed.sort(key=lambda x: x.get("scheduled_for", ""))

        # Demo synthetic pending only if there are no real pending jobs
        synthetic_pending = _synthetic_pending_jobs(store, provider_id, None) if not real_pending else []

        return {
            "pending": real_pending + synthetic_pending,
            "confirmed": confirmed,
            "completed_today": len(confirmed),
            "real_pending_count": len(real_pending),
        }
    except Exception as e:
        print(f"[my_jobs] FATAL: {e}")
        traceback.print_exc()
        # Always return a valid shape so the provider portal never breaks
        return {
            "pending": _synthetic_pending_jobs(request.app.state.store, provider_id, None),
            "confirmed": [],
            "completed_today": 0,
            "real_pending_count": 0,
            "error_logged": True,
        }


@router.post("/me/jobs/{job_id}/counter-offer")
async def provider_counter_offer(job_id: str, payload: dict, request: Request):
    """Provider counter-offers a new price on a pending booking.
    Customer then sees the counter on their booking-confirmed screen and
    can accept it or counter back."""
    store = request.app.state.store
    counter_price = payload.get("counter_price_pkr")
    note_ur = payload.get("note_ur") or ""

    if not isinstance(counter_price, (int, float)) or counter_price <= 0:
        return {"error": "invalid_counter_price"}

    real_booking = store.bookings.get(job_id)
    if not real_booking:
        return {"error": "booking_not_found"}

    counter_price = int(counter_price)
    now_iso = datetime.now().isoformat()
    pricing = real_booking.get("pricing") or {}
    customer_offered = pricing.get("final_pkr", 0)

    # Initialize negotiation history if missing
    if "negotiation_history" not in real_booking:
        real_booking["negotiation_history"] = [
            {
                "by": "customer",
                "price_pkr": customer_offered,
                "ts": real_booking.get("created_at", now_iso),
                "note": "Initial bargained price from Agent 7",
            }
        ]

    # Append provider counter
    real_booking["negotiation_history"].append({
        "by": "provider",
        "price_pkr": counter_price,
        "ts": now_iso,
        "note": note_ur or f"Provider counter-offer: PKR {counter_price:,}",
    })

    # Status changes to await customer response
    real_booking["status"] = "pending_customer_counter_response"
    real_booking["provider_counter_pkr"] = counter_price
    real_booking["provider_countered_at"] = now_iso

    store.log_state_change({
        "type": "provider_counter_offer",
        "booking_id": job_id,
        "counter_price": counter_price,
        "previous_price": customer_offered,
        "ts": now_iso,
    })

    return {
        "success": True,
        "job_id": job_id,
        "counter_price_pkr": counter_price,
        "previous_price_pkr": customer_offered,
        "new_status": real_booking["status"],
        "negotiation_history": real_booking["negotiation_history"],
        "provider_message_ur": note_ur or (
            f"Bhai PKR {counter_price:,} kar do, isse kam mushkil hai. "
            f"Customer ki original offer PKR {customer_offered:,} thi."
        ),
    }


@router.post("/me/jobs/{job_id}/respond")
async def respond_to_job(job_id: str, payload: dict, request: Request):
    """Accept or decline a pending job. If job_id matches a real booking,
    updates its status; otherwise logs as a synthetic-job response."""
    store = request.app.state.store
    action = payload.get("action")
    if action not in ("accept", "decline"):
        return {"error": "invalid_action"}

    # Real booking?
    real_booking = store.bookings.get(job_id)
    if real_booking:
        now_iso = datetime.now().isoformat()
        if action == "accept":
            real_booking["status"] = "confirmed"
            real_booking["accepted_at"] = now_iso
        else:
            real_booking["status"] = "declined_by_provider"
            real_booking["declined_at"] = now_iso
        store.log_state_change({
            "type": "booking_status_changed",
            "booking_id": job_id,
            "new_status": real_booking["status"],
            "ts": now_iso,
            "by_provider": real_booking["provider"]["id"],
        })
        return {
            "success": True,
            "job_id": job_id,
            "action": action,
            "new_status": real_booking["status"],
            "is_real_booking": True,
        }

    # Synthetic — just log
    store.log_state_change({
        "type": "provider_job_response",
        "job_id": job_id,
        "action": action,
        "ts": datetime.now().isoformat(),
    })
    return {"success": True, "job_id": job_id, "action": action, "is_real_booking": False}


class AddServiceRequest(BaseModel):
    provider_id: str
    service_id: str
    price_range: Optional[str] = None


class UpdateProfileRequest(BaseModel):
    provider_id: str
    business_name: Optional[str] = None
    description: Optional[str] = None
    price_range: Optional[str] = None
    is_active: Optional[bool] = None


@router.get("/me/profile")
async def my_profile(request: Request, provider_id: Optional[str] = None, user_id: Optional[str] = None):
    """Return the provider's full profile + their listed services."""
    store = request.app.state.store
    provider = None
    if provider_id:
        provider = store.get_provider(provider_id)
    elif user_id:
        provider = next((p for p in store.providers if p.get("user_owner_id") == user_id), None)
    if not provider:
        return {"error": "provider_not_found"}

    primary = store.get_category(provider.get("primary_service"))
    secondary_meta = [store.get_category(s) for s in provider.get("secondary_services", [])]
    secondary_meta = [s for s in secondary_meta if s]

    return {
        "provider": provider,
        "services": {
            "primary": {
                "id": provider.get("primary_service"),
                "name_en": primary.get("name_en") if primary else provider.get("primary_service"),
                "name_ur": primary.get("name_ur") if primary else "",
            },
            "secondary": [
                {"id": s["id"], "name_en": s["name_en"], "name_ur": s["name_ur"]}
                for s in secondary_meta
            ],
            "total": 1 + len(secondary_meta),
        },
    }


@router.post("/me/services")
async def add_service(payload: AddServiceRequest, request: Request):
    """Add a secondary service offering to an existing provider."""
    store = request.app.state.store
    provider = store.get_provider(payload.provider_id)
    if not provider:
        return {"error": "provider_not_found"}

    category = store.get_category(payload.service_id)
    if not category:
        return {"error": "invalid_service"}

    if payload.service_id == provider.get("primary_service"):
        return {"error": "already_primary", "message": "This is already your primary service"}

    if "secondary_services" not in provider:
        provider["secondary_services"] = []

    if payload.service_id in provider["secondary_services"]:
        return {"error": "already_added", "message": "You already offer this service"}

    provider["secondary_services"].append(payload.service_id)

    if payload.price_range:
        provider["price_range"] = payload.price_range

    store.log_state_change({
        "type": "service_added",
        "provider_id": provider["id"],
        "service_id": payload.service_id,
        "ts": datetime.now().isoformat(),
    })
    return {
        "success": True,
        "provider_id": provider["id"],
        "added_service": {
            "id": category["id"],
            "name_en": category["name_en"],
            "name_ur": category["name_ur"],
        },
        "total_services": 1 + len(provider["secondary_services"]),
    }


@router.delete("/me/services/{service_id}")
async def remove_service(service_id: str, request: Request, provider_id: str):
    """Remove a secondary service from an existing provider."""
    store = request.app.state.store
    provider = store.get_provider(provider_id)
    if not provider:
        return {"error": "provider_not_found"}
    if service_id == provider.get("primary_service"):
        return {"error": "cannot_remove_primary", "message": "Primary service can't be removed — edit it instead"}
    sec = provider.get("secondary_services", [])
    if service_id not in sec:
        return {"error": "not_found"}
    sec.remove(service_id)
    store.log_state_change({
        "type": "service_removed",
        "provider_id": provider_id,
        "service_id": service_id,
        "ts": datetime.now().isoformat(),
    })
    return {"success": True, "remaining": sec}


@router.patch("/me/profile")
async def update_profile(payload: UpdateProfileRequest, request: Request):
    """Edit provider's business details."""
    store = request.app.state.store
    provider = store.get_provider(payload.provider_id)
    if not provider:
        return {"error": "provider_not_found"}
    if payload.business_name is not None:
        provider["business_name"] = payload.business_name
    if payload.description is not None:
        provider["description"] = payload.description
    if payload.price_range is not None:
        provider["price_range"] = payload.price_range
    if payload.is_active is not None:
        provider["active"] = payload.is_active
        provider["availability"] = "available_now" if payload.is_active else "unavailable"
    return {"success": True, "provider": provider}


@router.get("/me/earnings")
async def my_earnings(request: Request, provider_id: Optional[str] = None):
    """Stylized earnings summary for a provider."""
    store = request.app.state.store
    # Compute from bookings
    by_day: dict[str, int] = {}
    total_pkr = 0
    bookings_count = 0
    for b in store.bookings.values():
        try:
            if not isinstance(b, dict):
                continue
            bookings_count += 1
            day = (b.get("created_at") or "")[:10] or datetime.now().date().isoformat()
            pricing = b.get("pricing") or {}
            low = 0
            if "range_low_pkr" in pricing:
                try:
                    low = int(pricing["range_low_pkr"])
                except Exception:
                    low = 0
            elif "final_pkr" in pricing:
                try:
                    low = int(pricing["final_pkr"])
                except Exception:
                    low = 0
            elif "estimated_range_pkr" in pricing:
                try:
                    low = int(str(pricing["estimated_range_pkr"]).replace("PKR", "").strip().split("-")[0].replace(",", ""))
                except Exception:
                    low = 0
            by_day[day] = by_day.get(day, 0) + low
            total_pkr += low
        except Exception:
            continue

    # Synthesize a 7-day series if backend is fresh (so the chart looks alive)
    series = []
    today = datetime.now().date()
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        key = d.isoformat()
        real = by_day.get(key, 0)
        synth = 2200 + i * 400 + (i * 173 % 700)
        series.append({"date": key, "amount": real or synth})

    today_amt = series[-1]["amount"] if series else 0
    week_amt = sum(s["amount"] for s in series)
    avg_per_job = int(week_amt / max(1, bookings_count * 3))

    return {
        "today_pkr": today_amt,
        "week_pkr": week_amt,
        "month_pkr": int(week_amt * 4.2),
        "bookings_completed": bookings_count + 14,
        "avg_per_job_pkr": avg_per_job or 2150,
        "rating": 4.7,
        "reviews_count": bookings_count + 23,
        "series_7d": series,
    }
