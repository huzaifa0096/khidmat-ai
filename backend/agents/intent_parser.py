"""
Intent Parser Agent — implementation.

Strategy:
1. If GEMINI_API_KEY is set, use Gemini for high-quality parsing with the system prompt from antigravity-agents/agents/01_intent_parser.md
2. Otherwise, use a robust rule-based fallback so the demo always works.
"""
import os
import json
import re
from datetime import datetime, timedelta
from typing import Optional


SYSTEM_PROMPT = """You are the Intent Parser for Khidmat AI, an agentic service marketplace for Pakistan.

Your sole responsibility is to parse user requests in Urdu, Roman Urdu, or English
into structured JSON. You do NOT recommend providers or book anything.

PAKISTANI CONTEXT:
- Cities: Islamabad, Lahore, Karachi, Rawalpindi
- Islamabad sectors look like: F-6, F-7, G-10, G-13, I-8, etc.
- Lahore areas: DHA Phase 5, Gulberg, Model Town, Johar Town, etc.
- Time expressions: "kal subah" = tomorrow morning, "abhi" = now, "shaam ko" = evening
- Urgency markers in Urdu: "foran", "jaldi", "emergency", "abhi"

You MUST return ONLY a JSON object matching this schema:
{
  "language_detected": "urdu | roman_urdu | english | mixed",
  "service_category_id": "<id from catalog>",
  "service_category_confidence": 0.0-1.0,
  "raw_service_phrase": "<exact phrase user used>",
  "location": {"city": "<city id>", "sector": "<sector id or null>", "raw_phrase": "<phrase>", "confidence": 0.0-1.0},
  "time": {"preference": "<one of: now | today_morning | today_afternoon | today_evening | tomorrow_morning | tomorrow_afternoon | tomorrow_evening | specific | flexible>", "specific_iso": "<ISO or null>", "raw_phrase": "<phrase>"},
  "urgency": "normal | urgent | emergency",
  "urgency_signals": ["foran"],
  "constraints": {"max_budget_pkr": null, "gender_preference": "any", "language_preference": []},
  "missing_info": [],
  "clarification_question_ur": null,
  "clarification_question_en": null,
  "reasoning": "<2-3 sentences>"
}

Return ONLY the JSON. No prose, no markdown, no code fences.
"""


# Rule-based fallback resources -----------------------------------------------------------

ROMAN_URDU_MARKERS = re.compile(r"\b(mujhe|chahiye|chaiyay|chaiye|karna|kal|subah|shaam|abhi|foran|aaj|kahan|kaun|bhejo|kar do|laao|theek|sahi|nikal|wala|wali|mein|me|par|pe|sahi|shukria|ji)\b", re.IGNORECASE)
URDU_SCRIPT = re.compile(r"[؀-ۿ]")

CATEGORY_ALIAS_MAP = None  # lazy-loaded
CITY_SECTOR_MAP = None     # lazy-loaded


def _ensure_catalog(store):
    global CATEGORY_ALIAS_MAP, CITY_SECTOR_MAP
    if CATEGORY_ALIAS_MAP is None:
        CATEGORY_ALIAS_MAP = {}
        for cat in store.categories:
            for alias in cat.get("aliases", []) + [cat["name_en"]]:
                CATEGORY_ALIAS_MAP[alias.lower()] = cat["id"]
    if CITY_SECTOR_MAP is None:
        CITY_SECTOR_MAP = {}
        for city in store.cities:
            for sec in city["sectors"]:
                CITY_SECTOR_MAP[sec["id"].lower()] = (city["id"], sec["id"])


def _detect_language(text: str) -> str:
    if URDU_SCRIPT.search(text):
        return "urdu" if not re.search(r"[a-zA-Z]", text) else "mixed"
    if ROMAN_URDU_MARKERS.search(text):
        return "roman_urdu"
    return "english"


def _detect_category(text: str, store) -> tuple[Optional[str], float, Optional[str]]:
    t = text.lower()
    best = None
    best_alias = None
    for alias, cat_id in CATEGORY_ALIAS_MAP.items():
        if alias.lower() in t:
            if best is None or len(alias) > len(best_alias or ""):
                best = cat_id
                best_alias = alias
    if best:
        return best, 0.95, best_alias
    return None, 0.0, None


def _detect_location(text: str, store) -> tuple[Optional[str], Optional[str], str, float]:
    t = text.lower()
    for sec_lower, (city_id, sec_id) in CITY_SECTOR_MAP.items():
        # match whole-word sector like "g-13" or "dha phase 5"
        if re.search(rf"\b{re.escape(sec_lower)}\b", t):
            return city_id, sec_id, sec_id, 0.98
    # fallback: try city name
    for city in store.cities:
        if city["name_en"].lower() in t:
            return city["id"], None, city["name_en"], 0.7
    return None, None, "", 0.0


def _detect_time(text: str) -> tuple[str, Optional[str], str]:
    t = text.lower()
    now = datetime.now()

    def iso_for(preference):
        mapping = {
            "now": now + timedelta(minutes=30),
            "today_morning": now.replace(hour=10, minute=0, second=0, microsecond=0),
            "today_afternoon": now.replace(hour=14, minute=0, second=0, microsecond=0),
            "today_evening": now.replace(hour=18, minute=0, second=0, microsecond=0),
            "tomorrow_morning": (now + timedelta(days=1)).replace(hour=10, minute=0, second=0, microsecond=0),
            "tomorrow_afternoon": (now + timedelta(days=1)).replace(hour=14, minute=0, second=0, microsecond=0),
            "tomorrow_evening": (now + timedelta(days=1)).replace(hour=18, minute=0, second=0, microsecond=0),
        }
        return mapping[preference].isoformat()

    if re.search(r"\b(abhi|now|right now|foran|immediately)\b", t):
        return "now", iso_for("now"), "abhi/now"
    if re.search(r"\b(kal|tomorrow)\b.*\b(subah|morning)\b", t):
        return "tomorrow_morning", iso_for("tomorrow_morning"), "kal subah"
    if re.search(r"\b(kal|tomorrow)\b.*\b(shaam|evening)\b", t):
        return "tomorrow_evening", iso_for("tomorrow_evening"), "kal shaam"
    if re.search(r"\b(kal|tomorrow)\b.*\b(dopahar|afternoon)\b", t):
        return "tomorrow_afternoon", iso_for("tomorrow_afternoon"), "kal dopahar"
    if re.search(r"\bkal\b|\btomorrow\b", t):
        return "tomorrow_morning", iso_for("tomorrow_morning"), "kal"
    if re.search(r"\baaj\b.*\b(subah|morning)\b|\btoday\b.*\b(morning)\b", t):
        return "today_morning", iso_for("today_morning"), "aaj subah"
    if re.search(r"\baaj\b.*\b(shaam|evening)\b|\btoday\b.*\b(evening)\b", t):
        return "today_evening", iso_for("today_evening"), "aaj shaam"
    if re.search(r"\baaj\b|\btoday\b", t):
        return "today_afternoon", iso_for("today_afternoon"), "aaj"
    return "flexible", None, ""


def _detect_urgency(text: str) -> tuple[str, list[str]]:
    t = text.lower()
    signals = []
    emergency_patterns = [
        r"\bforan\b", r"\bemergency\b", r"\babhi chahiye\b",
        r"\bghar mein (pani|flood|aag)\b", r"\bleak\b", r"\bfire\b",
        r"\bshort circuit\b", r"\bgas leak\b", r"\bpatient\b",
        r"\bbachay\b", r"pani bhar gaya", r"flooding"
    ]
    for pat in emergency_patterns:
        if re.search(pat, t):
            signals.append(re.search(pat, t).group())
    if signals:
        return "emergency", signals

    urgent_patterns = [r"\bjaldi\b", r"\burgent\b", r"\baaj hi\b", r"\bquickly\b", r"\bfast\b"]
    for pat in urgent_patterns:
        if re.search(pat, t):
            signals.append(re.search(pat, t).group())
    if signals:
        return "urgent", signals

    return "normal", []


def _rule_based_parse(text: str, store) -> dict:
    _ensure_catalog(store)
    language = _detect_language(text)
    cat_id, cat_conf, cat_phrase = _detect_category(text, store)
    city_id, sec_id, loc_phrase, loc_conf = _detect_location(text, store)
    time_pref, time_iso, time_phrase = _detect_time(text)
    urgency, signals = _detect_urgency(text)

    missing = []
    if not cat_id:
        missing.append("service_category")
    if not city_id:
        missing.append("city")
    if not sec_id:
        missing.append("sector")
    if time_pref == "flexible" and urgency != "emergency":
        # not strictly required — flexible is acceptable
        pass

    clarification_ur = None
    clarification_en = None
    if missing:
        ask = []
        if "service_category" in missing:
            ask.append("service")
        if "city" in missing or "sector" in missing:
            ask.append("location")
        joined = " aur ".join(ask) if ask else ""
        clarification_ur = f"Aap ka {joined} batayein? Kis sector mein hain aur kya service chahiye?"
        clarification_en = f"Please share your {' and '.join(ask)}. Which sector and what service?"

    reasoning_parts = []
    if cat_id:
        reasoning_parts.append(f"Identified service as {cat_id} (confidence {cat_conf}).")
    if city_id:
        reasoning_parts.append(f"Location parsed: {sec_id or '?'}, {city_id}.")
    if time_pref != "flexible":
        reasoning_parts.append(f"Time preference: {time_pref} ({time_phrase}).")
    if urgency != "normal":
        reasoning_parts.append(f"Urgency: {urgency} (signals: {signals}).")

    return {
        "language_detected": language,
        "service_category_id": cat_id,
        "service_category_confidence": cat_conf,
        "raw_service_phrase": cat_phrase or "",
        "location": {
            "city": city_id,
            "sector": sec_id,
            "raw_phrase": loc_phrase,
            "confidence": loc_conf
        },
        "time": {
            "preference": time_pref,
            "specific_iso": time_iso,
            "raw_phrase": time_phrase
        },
        "urgency": urgency,
        "urgency_signals": signals,
        "constraints": {
            "max_budget_pkr": None,
            "gender_preference": "any",
            "language_preference": []
        },
        "missing_info": missing,
        "clarification_question_ur": clarification_ur,
        "clarification_question_en": clarification_en,
        "reasoning": " ".join(reasoning_parts) or "Parsed with rule-based engine."
    }


def _gemini_parse(text: str, store) -> Optional[dict]:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None
    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        cats_summary = ", ".join(c["id"] for c in store.categories)
        sectors_summary = "; ".join(f"{c['id']}: {','.join(s['id'] for s in c['sectors'])}" for c in store.cities)

        full_prompt = SYSTEM_PROMPT + f"\n\nAVAILABLE CATEGORIES: {cats_summary}\nCITY SECTORS: {sectors_summary}\n\nUSER INPUT: {text}"
        resp = model.generate_content(full_prompt)
        raw = resp.text.strip()
        # strip code fences if present
        raw = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw, flags=re.MULTILINE).strip()
        return json.loads(raw)
    except Exception as e:
        # log and fall back
        print(f"[intent_parser] Gemini failed: {e}; using fallback.")
        return None


def parse(text: str, store) -> dict:
    result = _gemini_parse(text, store)
    if result:
        result["_engine"] = "gemini-1.5-flash"
        return result
    result = _rule_based_parse(text, store)
    result["_engine"] = "rule_based"
    return result
