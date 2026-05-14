"""ID generation helpers."""
import random
import string
from datetime import datetime


def booking_id(prefix: str = "KHD") -> str:
    today = datetime.now().strftime("%Y-%m-%d")
    suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=5))
    return f"{prefix}-{today}-{suffix}"


def trace_id() -> str:
    today = datetime.now().strftime("%Y-%m-%d")
    suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"TRC-{today}-{suffix}"


def emergency_ticket_id() -> str:
    today = datetime.now().strftime("%Y-%m-%d")
    suffix = "".join(random.choices(string.digits, k=3))
    return f"EMG-{today}-{suffix}"


def event_id() -> str:
    return "FE-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=6))


def receipt_id() -> str:
    return "RCP-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=8))


def followup_plan_id() -> str:
    return "FLP-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
