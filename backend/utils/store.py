"""
In-memory data store. Loads mock providers + catalog from JSON files
and maintains runtime state (bookings, traces, system state changes).
"""
import json
import os
import threading
from pathlib import Path
from typing import Any


class Store:
    def __init__(self):
        self.providers: list[dict] = []
        self.categories: list[dict] = []
        self.cities: list[dict] = []
        self.bookings: dict[str, dict] = {}
        self.traces: dict[str, dict] = {}
        self.events: list[dict] = []
        self.emergency_tickets: dict[str, dict] = {}
        self.area_alerts: list[dict] = []
        self.system_state_log: list[dict] = []
        self.lock = threading.Lock()

    def load(self):
        data_dir = Path(os.getenv("DATA_DIR", "../data")).resolve()
        # Resolve relative to backend folder if not absolute
        if not data_dir.exists():
            here = Path(__file__).resolve().parent.parent.parent / "data"
            if here.exists():
                data_dir = here

        cat_path = data_dir / "service_categories.json"
        prov_path = data_dir / "providers_mock.json"

        if cat_path.exists():
            cat = json.loads(cat_path.read_text(encoding="utf-8"))
            self.categories = cat.get("categories", [])
            self.cities = cat.get("cities", [])
        if prov_path.exists():
            prov = json.loads(prov_path.read_text(encoding="utf-8"))
            self.providers = prov.get("providers", [])

    def persist(self):
        # Mock — no persistence to disk for now (in-memory demo)
        pass

    # Convenience accessors
    def get_provider(self, provider_id: str) -> dict | None:
        return next((p for p in self.providers if p["id"] == provider_id), None)

    def get_category(self, category_id: str) -> dict | None:
        return next((c for c in self.categories if c["id"] == category_id), None)

    def get_city(self, city_id: str) -> dict | None:
        return next((c for c in self.cities if c["id"] == city_id), None)

    def get_sector(self, city_id: str, sector_id: str) -> dict | None:
        city = self.get_city(city_id)
        if not city:
            return None
        return next((s for s in city["sectors"] if s["id"] == sector_id), None)

    def add_booking(self, booking: dict):
        with self.lock:
            self.bookings[booking["booking_id"]] = booking
            self.system_state_log.append({
                "type": "booking_created",
                "booking_id": booking["booking_id"],
                "ts": booking["created_at"]
            })

    def add_trace(self, trace: dict):
        with self.lock:
            self.traces[trace["trace_id"]] = trace

    def log_state_change(self, change: dict):
        with self.lock:
            self.system_state_log.append(change)
