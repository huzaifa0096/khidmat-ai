"""
Mock Provider Dataset Generator
Generates 100+ realistic Pakistani service providers
"""
import json
import random
import math
from pathlib import Path

random.seed(42)  # deterministic for reproducibility

FIRST_NAMES = [
    "Ali", "Ahmed", "Hassan", "Hussain", "Asad", "Bilal", "Faisal", "Imran",
    "Junaid", "Kamran", "Mansoor", "Naveed", "Owais", "Qasim", "Rashid",
    "Saad", "Tariq", "Umair", "Wasim", "Yasir", "Zubair", "Aslam", "Tahir",
    "Ibrahim", "Ismail", "Hamza", "Saqib", "Adeel", "Awais", "Asif",
    "Babar", "Danish", "Ehsan", "Fahad", "Gohar", "Haris", "Jamal", "Khalid",
    "Luqman", "Moin", "Nasir", "Omer", "Pervaiz", "Raheel", "Shahid", "Touseef",
    "Usman", "Vakeel", "Waqas", "Yousuf", "Zafar", "Arsalan", "Mehboob", "Salman",
    "Furqan", "Bashir", "Iqbal", "Akram", "Saleem", "Younis"
]

LAST_NAMES = [
    "Khan", "Ahmed", "Ali", "Hussain", "Raza", "Sheikh", "Malik", "Butt",
    "Chaudhry", "Qureshi", "Siddiqui", "Mughal", "Awan", "Rana", "Bhatti",
    "Abbasi", "Gillani", "Hashmi", "Shah", "Zaidi", "Janjua", "Tarar",
    "Khattak", "Afridi", "Yousafzai", "Baig", "Mirza", "Farooqi", "Ansari"
]

BUSINESS_SUFFIXES = {
    "ac_technician": ["AC Services", "Cooling Experts", "AC Solutions", "AC Care", "HVAC Pros"],
    "plumber": ["Plumbing Services", "Pipe Masters", "Plumbing Co.", "Quick Plumb", "Pro Plumbers"],
    "electrician": ["Electric Works", "Electrical Services", "Power Solutions", "Wire Masters", "Electric Co."],
    "carpenter": ["Carpentry Works", "Wood Crafts", "Furniture Masters", "Wood Experts"],
    "painter": ["Painters", "Paint Works", "Decor Painters", "Wall Art"],
    "cleaner": ["Cleaning Services", "Sparkle Clean", "Deep Clean Co.", "Home Shine"],
    "tutor": ["Academy", "Tuition Center", "Learning Hub", "Education"],
    "beautician": ["Beauty Studio", "Salon Services", "Glamour", "Beauty Lounge"],
    "mobile_repair": ["Mobile Care", "Phone Repair Hub", "Mobile Fix", "Tech Care"],
    "laptop_repair": ["Computer Solutions", "Laptop Care", "Tech Hub", "PC Doctor"],
    "pest_control": ["Pest Solutions", "Bug Busters", "Pest Care", "Eliminators"],
    "car_mechanic": ["Auto Workshop", "Car Care", "Motor Works", "Auto Experts"],
    "bike_mechanic": ["Bike Workshop", "Motor Garage", "Bike Care"],
    "photographer": ["Photography", "Studios", "Lens Co.", "Visuals"],
    "event_decorator": ["Events", "Decor Studio", "Event Planners", "Decoration Co."],
    "catering": ["Catering Co.", "Food Services", "Caterers", "Kitchen"],
    "mason": ["Construction", "Builders", "Mason Works"],
    "geyser_repair": ["Geyser Services", "Heater Care", "Geyser Experts"],
    "ro_water": ["RO Services", "Water Solutions", "Pure Water Co."],
    "generator_repair": ["Generator Services", "Power Care", "UPS Solutions"]
}

DESCRIPTIONS = {
    "ac_technician": [
        "Expert in split, window, and inverter AC installation, servicing, gas refilling, and repair. Same-day service guaranteed.",
        "Certified AC technician with experience in all major brands — Haier, Gree, Dawlance, Orient, Mitsubishi. Specializing in deep cleaning and gas top-up.",
        "Quick AC repair, PCB fault diagnosis, compressor replacement, and seasonal maintenance. 90-day service warranty.",
        "Premium AC installation, ducting, and 24/7 emergency repairs. Trained engineers, original parts only."
    ],
    "plumber": [
        "Leak repairs, pipe fitting, toilet/tap installation, bathroom renovation. Available for emergency calls.",
        "Specialist in PPRC and UPVC piping, water tank cleaning, motor installation, and drainage solutions.",
        "All plumbing work — kitchen, bathroom, geyser piping, water filter installation. Reasonable rates.",
        "Master plumber with 10+ years experience. Quick response, transparent pricing, quality fittings used."
    ],
    "electrician": [
        "All electrical work — wiring, switchboard installation, fan/light fixing, MCB and circuit breaker repair.",
        "Certified electrician for residential and commercial properties. Specializing in solar systems and inverters.",
        "Quick electrical fault diagnosis, short circuit repair, new wiring, and meter installation.",
        "Expert in home automation, smart switches, LED installation, and high-load wiring."
    ],
    "carpenter": [
        "Custom furniture, kitchen cabinets, wardrobes, doors, and wood polish. Modern designs available.",
        "Skilled in repair and modification of beds, sofas, dining tables, and office furniture.",
        "Specialist in MDF, plywood, and solid wood furniture with premium finishes.",
        "Custom-designed furniture, partition walls, and built-in cupboards for homes and offices."
    ],
    "painter": [
        "Interior and exterior painting, texture work, wall design, and waterproofing. Premium paints used.",
        "Specialist in matte, distemper, plastic emulsion, and weather coat painting.",
        "Wall painting, ceiling work, exterior coating, and texture finishes. Free site visit and quotation.",
        "Professional painting service with skilled team, drop-cloth protection, and 1-year warranty."
    ],
    "cleaner": [
        "Deep cleaning, kitchen, bathroom, sofa, carpet, and full home cleaning service.",
        "End-of-tenancy cleaning, post-construction cleaning, and regular maid service.",
        "Eco-friendly cleaning supplies, trained staff, and same-day availability.",
        "Specialized in marble polishing, floor scrubbing, and disinfection services."
    ],
    "tutor": [
        "Home tutor for O-Levels, A-Levels, Matric, and FSc — Math, Physics, Chemistry, English.",
        "Online and in-home tuition. Experienced in Cambridge, AKU-EB, and Federal Board syllabus.",
        "Specialist in math and science for grades 6-12. Personalized study plans and weekly tests.",
        "Quranic studies, English language coaching, and IELTS/SAT preparation."
    ],
    "beautician": [
        "Bridal makeup, party makeup, facials, hair styling, and waxing. Home service available.",
        "Certified beautician offering keratin treatment, hair color, manicure, pedicure, and threading.",
        "Premium bridal package, engagement makeup, and pre-wedding shoots styling.",
        "Specialist in clean-up facials, anti-aging treatments, and body polishing."
    ],
    "mobile_repair": [
        "Screen replacement, battery, charging port, speaker, and software repair for all brands.",
        "iPhone, Samsung, Oppo, Vivo, Infinix repair specialist. Original and OEM parts.",
        "Water damage repair, motherboard chip-level repair, and software flashing.",
        "Quick mobile repair with 30-day warranty. Free diagnostics."
    ],
    "laptop_repair": [
        "Laptop motherboard repair, screen replacement, battery, keyboard, and OS installation.",
        "Dell, HP, Lenovo, Asus, MacBook repair specialist. Data recovery available.",
        "Quick diagnostics, hardware upgrade (SSD, RAM), and virus removal.",
        "Custom PC building, gaming rig setup, and Windows/Linux installation."
    ],
    "pest_control": [
        "Termite, cockroach, rat, and mosquito treatment. Eco-safe chemicals used.",
        "Pre and post-construction termite treatment with 5-year warranty.",
        "Fumigation service for homes, offices, and warehouses. Discreet operation.",
        "General pest control with quarterly follow-ups and free re-treatment."
    ],
    "car_mechanic": [
        "All car brand repair — Toyota, Honda, Suzuki, Kia, Hyundai. Engine, AC, suspension, and body work.",
        "Computer diagnostics, hybrid car specialist, and pre-purchase inspections.",
        "Quick services — oil change, brake pads, tires, battery replacement. Pickup and drop available.",
        "Specialist in luxury and SUV repair, ECU programming, and accident repair."
    ],
    "bike_mechanic": [
        "All bike brand repair — Honda, Yamaha, Suzuki, United, Road Prince. Pickup service available.",
        "Engine overhaul, tuning, electrical, and accident repair.",
        "Quick service, tire change, oil change, and brake adjustment at doorstep.",
        "Specialist in 70cc to 150cc bikes, paint job, and modification."
    ],
    "photographer": [
        "Wedding, mehndi, and engagement photography. Cinematic videos with same-day highlights.",
        "Corporate events, product shoots, and portrait photography. 4K video and drone available.",
        "Pre-wedding shoots, baby photography, and family portraits in studio or outdoor.",
        "Premium wedding package with 2 photographers, 2 videographers, and album."
    ],
    "event_decorator": [
        "Wedding stage decoration, mehndi setup, walima, and birthday party decor.",
        "Floral arrangements, balloon decoration, and theme-based decor.",
        "Indoor and outdoor event setup, lighting, and sound system.",
        "Premium wedding decor with imported flowers, fairy lights, and custom themes."
    ],
    "catering": [
        "Wedding, mehndi, valima catering — desi, BBQ, continental, and Chinese cuisines.",
        "Corporate lunch, birthday parties, and intimate gatherings. Halal certified.",
        "Live cooking stations, BBQ setup, dessert bars, and traditional Pakistani food.",
        "Premium catering with crockery, waiters, and complete event management."
    ],
    "mason": [
        "Construction work — boundary walls, plaster, tiles, flooring, and brick work.",
        "Specialist in modern and traditional construction techniques.",
        "Home renovation, room addition, and roof waterproofing.",
        "Skilled mason team for new construction and remodeling projects."
    ],
    "geyser_repair": [
        "Gas and electric geyser repair, installation, and gas leakage fixing.",
        "All brand service — Super Asia, Canon, Nasgas, Inami. Pilot/burner replacement.",
        "Quick geyser installation, thermostat replacement, and tank cleaning.",
        "Geyser servicing with descaling and full safety check."
    ],
    "ro_water": [
        "RO plant installation, filter replacement, and TDS testing.",
        "Domestic and commercial water purifier service. All major brands.",
        "Water tank cleaning, RO maintenance, and water testing.",
        "5-stage and 7-stage RO system installation with warranty."
    ],
    "generator_repair": [
        "Generator, UPS, and inverter repair. All brands and KVA capacities.",
        "Diesel and gas generator overhaul, AVR repair, and battery service.",
        "Solar inverter installation and repair. Lithium battery setup.",
        "Annual maintenance contracts for generators with 24/7 emergency support."
    ]
}

LANGUAGES_OPTIONS = [
    ["Urdu", "English"],
    ["Urdu", "Punjabi"],
    ["Urdu", "English", "Punjabi"],
    ["Urdu", "Pashto"],
    ["Urdu", "Sindhi"],
    ["Urdu", "English", "Pashto"],
    ["Urdu"]
]

AVAILABILITY_STATES = [
    "available_now",
    "available_now",
    "available_now",
    "available_today",
    "available_today",
    "available_tomorrow",
    "busy_until_evening"
]


def haversine(lat1, lng1, lat2, lng2):
    """Distance in km between two coords."""
    R = 6371
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def jitter(value, amount=0.012):
    return value + random.uniform(-amount, amount)


def generate_phone():
    prefixes = ["0300", "0301", "0302", "0303", "0304", "0305", "0306", "0307", "0308", "0321", "0322", "0331", "0333", "0345"]
    return f"{random.choice(prefixes)}-{random.randint(1000000, 9999999)}"


def generate_price_range(category, cats_lookup):
    cat = cats_lookup[category]
    parts = cat["avg_price_pkr"].split("-")
    low = int(parts[0])
    high = int(parts[1])
    p_low = int(low * random.uniform(0.85, 1.15))
    p_high = int(high * random.uniform(0.85, 1.20))
    return f"PKR {p_low}-{p_high}"


def main():
    base = Path(__file__).parent
    categories_data = json.loads((base / "service_categories.json").read_text(encoding="utf-8"))
    cats = categories_data["categories"]
    cities = categories_data["cities"]
    cats_lookup = {c["id"]: c for c in cats}

    providers = []
    pid = 1000

    # Distribute providers: ~6-8 per category per city for top categories, fewer for niche
    distribution = {
        "ac_technician": 12, "plumber": 12, "electrician": 12, "carpenter": 6,
        "painter": 5, "cleaner": 8, "tutor": 10, "beautician": 7,
        "mobile_repair": 8, "laptop_repair": 5, "pest_control": 5, "car_mechanic": 8,
        "bike_mechanic": 5, "photographer": 6, "event_decorator": 4, "catering": 4,
        "mason": 4, "geyser_repair": 5, "ro_water": 4, "generator_repair": 4
    }

    for cat_id, count in distribution.items():
        cat = cats_lookup[cat_id]
        suffixes = BUSINESS_SUFFIXES[cat_id]
        descs = DESCRIPTIONS[cat_id]

        for _ in range(count):
            pid += 1
            city = random.choice(cities)
            sector = random.choice(city["sectors"])
            first = random.choice(FIRST_NAMES)
            last = random.choice(LAST_NAMES)
            full_name = f"{first} {last}"
            business = f"{first} {random.choice(suffixes)}"

            rating = round(random.uniform(3.6, 5.0), 1)
            reviews = random.randint(8, 480)
            experience = random.randint(1, 22)
            verified = random.random() > 0.25
            emergency = cat["emergency_eligible"] and random.random() > 0.55
            availability = random.choice(AVAILABILITY_STATES)
            response_min = random.randint(10, 90)
            completion = random.randint(85, 99)

            # Add secondary services for some providers
            secondary_services = []
            if random.random() > 0.7:
                pool = [c["id"] for c in cats if c["id"] != cat_id]
                secondary_services = random.sample(pool, k=random.randint(1, 2))

            provider = {
                "id": f"P{pid}",
                "name": full_name,
                "business_name": business,
                "primary_service": cat_id,
                "secondary_services": secondary_services,
                "city": city["id"],
                "city_name_en": city["name_en"],
                "sector": sector["id"],
                "location": {
                    "lat": jitter(sector["lat"]),
                    "lng": jitter(sector["lng"])
                },
                "phone": generate_phone(),
                "rating": rating,
                "reviews_count": reviews,
                "experience_years": experience,
                "verified": verified,
                "emergency_24x7": emergency,
                "availability": availability,
                "avg_response_minutes": response_min,
                "completion_rate_percent": completion,
                "price_range": generate_price_range(cat_id, cats_lookup),
                "languages": random.choice(LANGUAGES_OPTIONS),
                "description": random.choice(descs),
                "profile_image": f"https://i.pravatar.cc/300?u=P{pid}",
                "joined_date": f"202{random.randint(0, 5)}-{random.randint(1, 12):02d}-{random.randint(1, 28):02d}",
                "completed_jobs": random.randint(reviews, reviews * 3)
            }
            providers.append(provider)

    # Save
    out = {
        "version": "1.0",
        "generated_at": "2026-05-12",
        "total": len(providers),
        "providers": providers
    }
    (base / "providers_mock.json").write_text(json.dumps(out, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Generated {len(providers)} providers")

    # Quick stats
    by_city = {}
    by_cat = {}
    for p in providers:
        by_city[p["city"]] = by_city.get(p["city"], 0) + 1
        by_cat[p["primary_service"]] = by_cat.get(p["primary_service"], 0) + 1
    print("By city:", by_city)
    print("By category:", by_cat)


if __name__ == "__main__":
    main()
