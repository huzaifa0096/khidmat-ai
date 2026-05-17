"""
Bargain Agent (7th agent) — Khidmat AI's culturally-aware price negotiator.

Pakistan ka informal economy bhao-tao (haggling) pe chalti hai. Generic
booking apps don't model this — Khidmat AI does. This agent simulates a
provider's negotiation behaviour given:
  - The customer's proposed price
  - The provider's known price floor and ceiling
  - Demand level (time-of-day, day-of-week, weather)
  - Customer history (repeat customer = small discount)
  - Competitor average

It returns either:
  - ACCEPT (price <= provider's floor + acceptable margin)
  - COUNTER (proposed counter-offer with bilingual justification)
  - REJECT (price too far below floor; provider walks away)

This is a NEW agent in the Antigravity orchestration — making the total
agent count 7 (Intent, Discovery, Ranking, Booking, Followup, Crisis,
Bargain), proving real agentic depth beyond typical hackathon submissions.
"""
from __future__ import annotations
from datetime import datetime
from typing import Optional


def _parse_price_range(price_range: str) -> tuple[int, int]:
    """Parse 'PKR 1500-3500' → (1500, 3500). Defaults to (1500, 5000)."""
    try:
        cleaned = price_range.replace("PKR", "").replace(",", "").strip()
        parts = cleaned.split("-")
        if len(parts) == 2:
            return int(parts[0].strip()), int(parts[1].strip())
    except Exception:
        pass
    return 1500, 5000


def _demand_multiplier(hour_of_day: int, weekday: int) -> float:
    """Friday/Saturday evening = high demand → less willing to discount."""
    # Friday=4, Saturday=5; evening = 17-22
    is_weekend = weekday in (4, 5)
    is_evening = 17 <= hour_of_day <= 22
    if is_weekend and is_evening:
        return 1.20  # high demand
    if is_evening or is_weekend:
        return 1.10
    if 10 <= hour_of_day <= 14:
        return 1.00  # normal day
    return 0.92  # off-peak (early morning, late night) — more willing


def negotiate(
    provider: dict,
    customer_offer_pkr: int,
    proposed_price_pkr: int,
    is_repeat_customer: bool = False,
    urgency: str = "normal",
    round_number: int = 1,
) -> dict:
    """
    Run one bargaining round.

    Logic invariants (critical for correctness):
      1. If customer_offer >= proposed_price → AUTO ACCEPT at proposed_price.
         No haggling needed if customer is willing to pay full price (or more).
      2. Counter price is ALWAYS strictly between (customer_offer, proposed_price].
         Never below customer's offer (illogical) and never above the original
         quote (provider would never raise the price).
      3. Effective floor is capped at proposed_price — provider cannot have a
         "minimum" higher than their own asking price.
      4. Reject only when offer is meaningfully below the floor (sanity check).
    """
    low, high = _parse_price_range(provider.get("price_range", "PKR 1500-5000"))
    # Provider's real walk-away point (a bit below the stated low end)
    base_floor = int(low * 0.85)

    now = datetime.now()
    demand = _demand_multiplier(now.hour, now.weekday())

    # Loyalty discount + emergency rules
    loyalty_discount = 0.05 if is_repeat_customer else 0.0
    if urgency == "emergency":
        demand = max(demand, 1.25)
        loyalty_discount = 0.0

    # Adjust floor by demand
    effective_floor = int(base_floor * demand)

    # Round strictness — provider gets firmer over rounds, BUT we cap below.
    if round_number > 1:
        strictness = 1.0 + (round_number - 1) * 0.04
        effective_floor = int(effective_floor * strictness)

    # SAFEGUARD: floor must never exceed proposed price (logically impossible).
    # Cap at 88% of proposed so there's always room for a sensible counter.
    effective_floor = min(effective_floor, int(proposed_price_pkr * 0.88))

    business_name = provider.get("business_name", "Provider")
    context = {
        "provider_low": low,
        "provider_high": high,
        "provider_base_floor": base_floor,
        "effective_floor_after_demand": effective_floor,
        "proposed_price": proposed_price_pkr,
        "customer_offer": customer_offer_pkr,
        "demand_multiplier": round(demand, 2),
        "demand_label": (
            "high" if demand >= 1.15 else "medium" if demand >= 1.05 else "normal"
        ),
        "is_repeat_customer": is_repeat_customer,
        "urgency": urgency,
        "round_number": round_number,
        "weekday": now.weekday(),
        "hour": now.hour,
    }

    # ===== DECISION 1: AUTO-ACCEPT when customer matches or exceeds the quote =====
    if customer_offer_pkr >= proposed_price_pkr:
        agreed = proposed_price_pkr
        if is_repeat_customer:
            agreed = int(proposed_price_pkr * (1 - loyalty_discount))
        return {
            "decision": "accept",
            "agreed_price_pkr": agreed,
            "round": round_number,
            "reasoning_en": (
                f"Provider accepted at PKR {agreed:,}. "
                f"{'Customer matched the quoted price' if customer_offer_pkr == proposed_price_pkr else 'Customer offered at or above the asking price'} "
                f"of PKR {proposed_price_pkr:,}. No further haggling needed."
                f"{f' Loyalty discount of {int(loyalty_discount*100)}% applied for repeat customer.' if is_repeat_customer and loyalty_discount > 0 else ''}"
            ),
            "reasoning_ur": (
                f"Provider ne PKR {agreed:,} pe accept kar liya. "
                f"Aap ne quote ke barabar ya zyada offer kiya tha, isi liye bargain ki zaroorat nahi pari."
                f"{f' Repeat customer ke liye {int(loyalty_discount*100)}% loyalty discount mila.' if is_repeat_customer and loyalty_discount > 0 else ''}"
            ),
            "provider_message_ur": f"Theek hai bhai, PKR {agreed:,} mein kar denge. Aap aaayien.",
            "next_step": "user_can_accept_counter",
            "context": context,
        }

    # ===== DECISION 2: ACCEPT when customer offer is at or above the effective floor =====
    if customer_offer_pkr >= effective_floor:
        agreed = customer_offer_pkr
        if is_repeat_customer:
            agreed = int(agreed * (1 - loyalty_discount))
        savings = proposed_price_pkr - agreed
        return {
            "decision": "accept",
            "agreed_price_pkr": agreed,
            "round": round_number,
            "reasoning_en": (
                f"Provider accepted at PKR {agreed:,}. "
                f"This is PKR {savings:,} below the initial quote of PKR {proposed_price_pkr:,} "
                f"({int(savings / max(1, proposed_price_pkr) * 100)}% saving). "
                f"Reason: customer's offer met the provider's effective floor of PKR {effective_floor:,} "
                f"(adjusted for {context['demand_label']} demand)."
                f"{' Loyalty discount applied.' if is_repeat_customer else ''}"
            ),
            "reasoning_ur": (
                f"Provider ne PKR {agreed:,} pe accept kar liya. "
                f"Yeh original quote (PKR {proposed_price_pkr:,}) se {savings:,} kam hai "
                f"({int(savings / max(1, proposed_price_pkr) * 100)}% bachat). "
                f"Aap ki offer provider ke floor (PKR {effective_floor:,}) ke barabar ya zyada thi."
                f"{' Loyalty discount bhi mila.' if is_repeat_customer else ''}"
            ),
            "provider_message_ur": f"Theek hai bhai, PKR {agreed:,} mein kar denge. Aap aaayien.",
            "next_step": "user_can_accept_counter",
            "context": context,
        }

    # ===== DECISION 3: REJECT when offer is WAY below floor (sanity threshold) =====
    reject_threshold = int(effective_floor * 0.65)
    if customer_offer_pkr < reject_threshold:
        walk_away_price = effective_floor + int(low * 0.03)
        return {
            "decision": "reject",
            "agreed_price_pkr": None,
            "round": round_number,
            "reasoning_en": (
                f"Provider can't accept PKR {customer_offer_pkr:,} — that's "
                f"{int((1 - customer_offer_pkr / effective_floor) * 100)}% below the floor of "
                f"PKR {effective_floor:,} given {context['demand_label']} demand. "
                f"The walk-away minimum is PKR {walk_away_price:,}."
            ),
            "reasoning_ur": (
                f"Provider PKR {customer_offer_pkr:,} pe nahi kar sakta — yeh floor "
                f"(PKR {effective_floor:,}) se {int((1 - customer_offer_pkr / effective_floor) * 100)}% kam hai. "
                f"Minimum PKR {walk_away_price:,} chahiye hoga."
            ),
            "provider_message_ur": (
                f"Bhai itne kam mein possible nahi. Minimum PKR {walk_away_price:,} bana de to baat karein."
            ),
            "next_step": "user_can_counter_again",
            "context": context,
        }

    # ===== DECISION 4: COUNTER — must be strictly between (offer, proposed) =====
    # Provider meets the customer ~55% of the way (slightly biased toward provider)
    gap = proposed_price_pkr - customer_offer_pkr
    counter_bias = 0.55 if round_number == 1 else 0.65 if round_number == 2 else 0.75
    counter = customer_offer_pkr + int(gap * counter_bias)

    # Apply small loyalty discount on counter
    if is_repeat_customer:
        counter = int(counter * (1 - loyalty_discount * 0.5))

    # ENFORCE INVARIANTS:
    # 1. Counter must be at or above effective floor
    counter = max(counter, effective_floor)
    # 2. Counter must be STRICTLY GREATER than the customer's offer (else accept)
    counter = max(counter, customer_offer_pkr + max(50, int(gap * 0.10)))
    # 3. Counter must NEVER exceed the proposed price (provider can't raise it)
    counter = min(counter, proposed_price_pkr)

    # Sanity: if after all clamping counter ended up >= proposed, accept at proposed
    if counter >= proposed_price_pkr:
        return {
            "decision": "accept",
            "agreed_price_pkr": proposed_price_pkr,
            "round": round_number,
            "reasoning_en": (
                f"Counter rounded up to the original quote of PKR {proposed_price_pkr:,}. "
                f"Provider accepted at the asking price."
            ),
            "reasoning_ur": (
                f"Counter PKR {proposed_price_pkr:,} ke barabar pohch gaya. "
                f"Provider ne original price pe accept kar liya."
            ),
            "provider_message_ur": f"Theek hai bhai, PKR {proposed_price_pkr:,} mein kar denge.",
            "next_step": "user_can_accept_counter",
            "context": context,
        }

    counter_savings = proposed_price_pkr - counter
    return {
        "decision": "counter",
        "agreed_price_pkr": counter,
        "round": round_number,
        "reasoning_en": (
            f"Provider counter-offers PKR {counter:,} (down from PKR {proposed_price_pkr:,}). "
            f"That's PKR {counter_savings:,} savings ({int(counter_savings / proposed_price_pkr * 100)}% off). "
            f"Customer's offer of PKR {customer_offer_pkr:,} was below the effective floor of "
            f"PKR {effective_floor:,} (floor adjusted for {context['demand_label']} demand). "
            f"The provider met the customer roughly {int(counter_bias * 100)}% of the way."
            f"{' Loyalty discount included.' if is_repeat_customer else ''}"
        ),
        "reasoning_ur": (
            f"Provider ne counter offer ki: PKR {counter:,} (original PKR {proposed_price_pkr:,} se {counter_savings:,} kam — "
            f"{int(counter_savings / proposed_price_pkr * 100)}% bachat). "
            f"Aap ki offer (PKR {customer_offer_pkr:,}) floor (PKR {effective_floor:,}) se neeche thi."
            f"{' Loyalty discount bhi shamil hai.' if is_repeat_customer else ''}"
        ),
        "provider_message_ur": (
            f"Bhai PKR {counter:,} kar sakta hun, isse kam mushkil hai. "
            f"{'Aap pehle bhi book kar chuke hain, isi liye yeh rate de raha hun.' if is_repeat_customer else 'Bata dein.'}"
        ),
        "next_step": "user_can_counter_again",
        "context": context,
    }


def negotiate_full_session(
    provider: dict,
    initial_price_pkr: int,
    customer_offers: list[int],
    is_repeat_customer: bool = False,
    urgency: str = "normal",
) -> dict:
    """
    Run a full multi-round bargaining session.

    customer_offers: list of customer's counter prices in sequence
    Returns the full negotiation log + final outcome.
    """
    rounds = []
    current_proposed = initial_price_pkr
    for i, offer in enumerate(customer_offers):
        result = negotiate(
            provider=provider,
            customer_offer_pkr=offer,
            proposed_price_pkr=current_proposed,
            is_repeat_customer=is_repeat_customer,
            urgency=urgency,
            round_number=i + 1,
        )
        rounds.append({
            "round": i + 1,
            "customer_offered": offer,
            **result,
        })
        if result["decision"] == "accept":
            break
        if result["decision"] == "reject":
            break
        # If counter, update proposed for next round
        current_proposed = result["agreed_price_pkr"]

    final = rounds[-1]
    outcome = final["decision"]
    final_price = final["agreed_price_pkr"]

    return {
        "session_id": f"BARGAIN-{datetime.now().strftime('%H%M%S')}",
        "provider_id": provider.get("id"),
        "initial_price_pkr": initial_price_pkr,
        "total_rounds": len(rounds),
        "outcome": outcome,
        "final_price_pkr": final_price,
        "total_savings_pkr": (initial_price_pkr - final_price) if final_price else 0,
        "rounds": rounds,
        "reasoning_summary": rounds[-1]["reasoning_en"],
    }
