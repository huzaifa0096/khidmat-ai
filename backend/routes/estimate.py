"""
Photo-based estimate route — customer "uploads" a problem photo and gets an
instant AI-style estimate (category, complexity, price range, urgency).

This is scenario-based (not real ML) so it's deterministic and robust for
the demo. A real implementation would use Vision LLM (Gemini/Claude) on the
uploaded image. We expose the same input/output contract so the swap-in is
trivial later.
"""
from fastapi import APIRouter, Request
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter()


# Scenario library — each maps to a realistic Pakistani service problem
SCENARIOS = {
    "ac_not_cooling": {
        "category_id": "ac_technician",
        "issue_en": "AC unit running but not cooling — likely refrigerant gas leak or compressor strain",
        "issue_ur": "AC chal raha hai lekin thanda nahi kar raha — gas leak ya compressor ka masla lagta hai",
        "complexity": "Medium",
        "complexity_score": 0.6,
        "estimated_range_pkr": [2500, 5500],
        "typical_pkr": 3800,
        "urgency": "today",
        "parts_likely": ["Refrigerant gas (R-410A)", "Capacitor", "Service charge"],
        "estimated_duration_minutes": 90,
        "ai_confidence": 0.88,
        "reasoning_en": "Visible coil frost pattern + unit running suggests refrigerant deficiency. 78% of similar cases in summer require gas top-up + capacitor check. Recommend same-day fix to avoid compressor damage.",
        "reasoning_ur": "Coil pe ice ka pattern + unit chalu hai — ye dikhata hai ke gas kam hai. 78% similar cases mein gas refill + capacitor check chahiye hota hai. Aaj ke aaj theek karwayein, compressor damage se bachne ke liye.",
        "follow_up_questions": [
            "Kya AC se koi awaaz aa rahi hai? (Yes/No)",
            "Last service kab hua tha? (months)"
        ],
    },
    "pipe_leak": {
        "category_id": "plumber",
        "issue_en": "Active water leak from joint or pipe — needs immediate seal or replacement",
        "issue_ur": "Pipe ke joint ya beech se pani ki leakage — foran seal ya pipe replace karna hoga",
        "complexity": "Low-Medium",
        "complexity_score": 0.4,
        "estimated_range_pkr": [800, 2500],
        "typical_pkr": 1500,
        "urgency": "urgent",
        "parts_likely": ["Teflon tape", "Pipe joint", "Sealant"],
        "estimated_duration_minutes": 60,
        "ai_confidence": 0.92,
        "reasoning_en": "Visible water staining + active drip pattern suggests joint failure (not full pipe burst). Quick fix. Risk of escalation to flooding if untreated within 2-3 hours.",
        "reasoning_ur": "Pani ke nishan + active drip — joint kharab hua hai, full pipe burst nahi. Jaldi fix ho jayega. 2-3 ghante mein theek na karwaya to flooding ho sakti hai.",
        "follow_up_questions": [
            "Kya main water supply band kar sakte hain? (Yes/No)",
            "Pipe metal ki hai ya plastic? (Metal/Plastic)"
        ],
    },
    "wiring_issue": {
        "category_id": "electrician",
        "issue_en": "Exposed wiring + burn marks on socket — fire risk, urgent electrical fault",
        "issue_ur": "Wires khuli hain + socket par jaley nishan — fire ka khatra hai, foran electrical fault hai",
        "complexity": "Medium-High",
        "complexity_score": 0.7,
        "estimated_range_pkr": [1500, 4000],
        "typical_pkr": 2400,
        "urgency": "emergency",
        "parts_likely": ["MCB", "Socket assembly", "Insulated wire (2-3 ft)"],
        "estimated_duration_minutes": 75,
        "ai_confidence": 0.95,
        "reasoning_en": "Burn marks indicate short-circuit history. SAFETY CRITICAL — main power should be off immediately. Will need MCB replacement + circuit testing. Do NOT use the socket until fixed.",
        "reasoning_ur": "Burn marks ka matlab pichle short-circuit hue hain. SAFETY EMERGENCY — main supply foran band karein. MCB replace + circuit test ki zaroorat hai. Jab tak theek na ho, ye socket bilkul use na karein.",
        "follow_up_questions": [
            "Kya main supply abhi off hai? (Yes/No)",
            "Kya area mein bachay hain? (Yes/No)"
        ],
    },
    "geyser_issue": {
        "category_id": "geyser_repair",
        "issue_en": "Pilot light won't ignite — likely thermocouple failure or gas valve issue",
        "issue_ur": "Pilot light nahi jal raha — thermocouple ya gas valve ka masla hai",
        "complexity": "Medium",
        "complexity_score": 0.5,
        "estimated_range_pkr": [1200, 3000],
        "typical_pkr": 1800,
        "urgency": "today",
        "parts_likely": ["Thermocouple", "Gas valve assembly", "Pilot tube"],
        "estimated_duration_minutes": 60,
        "ai_confidence": 0.84,
        "reasoning_en": "65% of pilot ignition failures are thermocouple — cheap part (PKR 350) but requires correct positioning. Recommend full inspection to rule out gas valve.",
        "reasoning_ur": "65% pilot ignition failures thermocouple ki wajah se hoti hain — sasta part hai (PKR 350) lekin sahi position chahiye. Gas valve bhi check karwa lein for full inspection.",
        "follow_up_questions": [
            "Kya geyser gas hai ya electric? (Gas/Electric)",
            "Pichli baar pilot kab jala tha? (days)"
        ],
    },
    "broken_furniture": {
        "category_id": "carpenter",
        "issue_en": "Broken joint or hinge — needs glue, screws, or hardware replacement",
        "issue_ur": "Joint ya hinge toot gaya hai — glue, screw, ya hardware replacement chahiye",
        "complexity": "Low",
        "complexity_score": 0.3,
        "estimated_range_pkr": [600, 1800],
        "typical_pkr": 1100,
        "urgency": "flexible",
        "parts_likely": ["Wood glue", "Screws", "Replacement hinge (if needed)"],
        "estimated_duration_minutes": 45,
        "ai_confidence": 0.78,
        "reasoning_en": "Simple structural repair. Most carpenters can handle on first visit. Material cost minimal (~PKR 200). Bulk of price is labor + visit charge.",
        "reasoning_ur": "Simple repair hai. Pehli visit mein hi ho jata hai. Material PKR 200 ke andar. Zyada paisa labour aur visit charge ka hai.",
        "follow_up_questions": [
            "Kya furniture wooden hai ya MDF? (Wood/MDF)",
            "Kya aap khud hardware kharidna chahein gay? (Yes/No)"
        ],
    },
    "blocked_drain": {
        "category_id": "plumber",
        "issue_en": "Drain blockage — water not flowing, requires snake or chemical clearing",
        "issue_ur": "Drain mein rukawat — pani nahi nikal raha, snake ya chemical clearing chahiye",
        "complexity": "Low-Medium",
        "complexity_score": 0.4,
        "estimated_range_pkr": [800, 2200],
        "typical_pkr": 1400,
        "urgency": "today",
        "parts_likely": ["Drain cleaner chemicals", "Snake tool rental", "Trap replacement (if old)"],
        "estimated_duration_minutes": 50,
        "ai_confidence": 0.86,
        "reasoning_en": "Standing water suggests partial blockage. Snake clearing succeeds in ~85% of cases. Avoid pouring more water. If chemical method fails, may need trap removal.",
        "reasoning_ur": "Pani jam ho gaya hai — partial blockage hai. 85% cases mein snake se nikal jata hai. Aur pani na daalein. Chemical kaam na kare to trap kholna pad sakta hai.",
        "follow_up_questions": [
            "Kitchen drain hai ya bathroom? (Kitchen/Bathroom)",
            "Kya khushboo bhi aa rahi hai? (Yes/No)"
        ],
    },
}


SCENARIO_LIST = [
    {
        "id": "ac_not_cooling",
        "title_en": "AC not cooling",
        "title_ur": "AC thanda nahi kar raha",
        "thumbnail_emoji": "❄️",
        "color": "#4DA8FF",
    },
    {
        "id": "pipe_leak",
        "title_en": "Pipe leaking",
        "title_ur": "Pipe leak ho rahi hai",
        "thumbnail_emoji": "💧",
        "color": "#0A84FF",
    },
    {
        "id": "wiring_issue",
        "title_en": "Burnt socket / wiring",
        "title_ur": "Jala hua socket / wiring",
        "thumbnail_emoji": "⚡",
        "color": "#FFC900",
    },
    {
        "id": "geyser_issue",
        "title_en": "Geyser not igniting",
        "title_ur": "Geyser nahi jal raha",
        "thumbnail_emoji": "🔥",
        "color": "#FF453A",
    },
    {
        "id": "broken_furniture",
        "title_en": "Broken furniture",
        "title_ur": "Furniture toot gaya",
        "thumbnail_emoji": "🪑",
        "color": "#A0522D",
    },
    {
        "id": "blocked_drain",
        "title_en": "Blocked drain",
        "title_ur": "Drain band hai",
        "thumbnail_emoji": "🚰",
        "color": "#30D158",
    },
]


class EstimateRequest(BaseModel):
    scenario_id: str
    user_id: Optional[str] = "U001"
    location: Optional[dict] = None  # {city, sector}


@router.get("/scenarios")
async def list_scenarios():
    """Returns the catalog of supported problem scenarios for the picker UI."""
    return {"scenarios": SCENARIO_LIST, "total": len(SCENARIO_LIST)}


@router.post("/from-image")
async def estimate_from_image(payload: EstimateRequest, request: Request):
    """
    Generate an AI-style estimate from a customer's problem photo.

    Input: scenario_id (one of the keys above)
    Output: structured estimate matching the demo contract.

    Real implementation would use Gemini Vision on the actual uploaded image;
    we use a deterministic scenario lookup for demo stability.
    """
    scenario = SCENARIOS.get(payload.scenario_id)
    if not scenario:
        return {"error": "unknown_scenario", "supported": list(SCENARIOS.keys())}

    store = request.app.state.store
    # Find a representative provider for the category to anchor the estimate
    matching_providers = [
        p for p in store.providers
        if p.get("primary_service") == scenario["category_id"]
    ]
    sample_provider = matching_providers[0] if matching_providers else None

    estimate_id = f"EST-{datetime.now().strftime('%Y%m%d-%H%M%S')}-{payload.scenario_id[:4].upper()}"

    response = {
        "estimate_id": estimate_id,
        "scenario_id": payload.scenario_id,
        "created_at": datetime.now().isoformat(),
        "category_id": scenario["category_id"],
        "issue_en": scenario["issue_en"],
        "issue_ur": scenario["issue_ur"],
        "complexity": scenario["complexity"],
        "complexity_score": scenario["complexity_score"],
        "estimated_range_pkr": scenario["estimated_range_pkr"],
        "typical_pkr": scenario["typical_pkr"],
        "urgency": scenario["urgency"],
        "parts_likely": scenario["parts_likely"],
        "estimated_duration_minutes": scenario["estimated_duration_minutes"],
        "ai_confidence": scenario["ai_confidence"],
        "reasoning_en": scenario["reasoning_en"],
        "reasoning_ur": scenario["reasoning_ur"],
        "follow_up_questions": scenario["follow_up_questions"],
        "sample_provider": (
            {
                "id": sample_provider["id"],
                "business_name": sample_provider["business_name"],
                "rating": sample_provider["rating"],
                "price_range": sample_provider["price_range"],
            }
            if sample_provider
            else None
        ),
        "available_providers_count": len(matching_providers),
        "ai_model": "khidmat-vision-v1-mock",
        "ai_method": "image_analysis_with_scenario_match",
    }

    store.log_state_change({
        "type": "photo_estimate_generated",
        "estimate_id": estimate_id,
        "scenario": payload.scenario_id,
        "user_id": payload.user_id,
    })

    return response
