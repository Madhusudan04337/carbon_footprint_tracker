"""
EcoTrace Sample Data Seeder
Populates the backend with realistic activity logs, goals, and verifies analytics + recommendations.
Run from: apps/backend-api/
Usage: python seed_data.py
"""

import requests
import json
import hashlib
from datetime import date, timedelta

BASE = "http://127.0.0.1:8000/api"

def generate_safe_password(email: str) -> str:
    return "Pass-" + hashlib.sha256(email.encode()).hexdigest()[:12] + "!"

# ─── 1. Authenticate ─────────────────────────────────────────────────────────
print("🔐 Authenticating...")
creds = {"email": "eco_guardian@ecotrace.org", "password": generate_safe_password("eco_guardian@ecotrace.org")}

res = requests.post(f"{BASE}/auth/login", json=creds)
if not res.ok:
    # Auto-register if not found
    reg = requests.post(f"{BASE}/auth/register", json={
        **creds,
        "first_name": "Eco",
        "last_name": "Guardian",
        "country": "US",
        "postal_code": "90210"
    })
    print(f"  Registered user: {reg.status_code}")
    res = requests.post(f"{BASE}/auth/login", json=creds)

token = res.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}
print(f"  ✅ Authenticated. Token acquired.\n")

# ─── Helper ───────────────────────────────────────────────────────────────────
def post(path, body):
    r = requests.post(f"{BASE}{path}", json=body, headers=headers)
    if r.ok:
        return r.json()
    else:
        print(f"  ⚠️  {path} failed [{r.status_code}]: {r.text[:120]}")
        return None

def put(path, body):
    r = requests.put(f"{BASE}{path}", json=body, headers=headers)
    return r.json() if r.ok else None

def get(path):
    r = requests.get(f"{BASE}{path}", headers=headers)
    return r.json() if r.ok else None

def day(offset):
    return str(date.today() - timedelta(days=offset))

# ─── 2. Activity Logs — TRANSPORT (all sub-categories) ────────────────────────
print("🚗 Seeding TRANSPORT logs...")

transport_logs = [
    # gasoline_car: 150 km commute
    {"category": "transport", "sub_category": "gasoline_car", "value": 150.0, "date": day(25)},
    # diesel_car: 200 km road trip
    {"category": "transport", "sub_category": "diesel_car",   "value": 200.0, "date": day(22)},
    # hybrid_car: 120 km weekend drive
    {"category": "transport", "sub_category": "hybrid_car",   "value": 120.0, "date": day(18)},
    # electric_car: 90 km daily
    {"category": "transport", "sub_category": "electric_car", "value":  90.0, "date": day(15)},
    # bus commute: 40 km
    {"category": "transport", "sub_category": "bus",          "value":  40.0, "date": day(12)},
    # train: 320 km intercity
    {"category": "transport", "sub_category": "train",        "value": 320.0, "date": day(10)},
    # short-haul flight: 800 km
    {"category": "transport", "sub_category": "flight_short", "value": 800.0, "date": day(7)},
    # long-haul flight: 6000 km international
    {"category": "transport", "sub_category": "flight_long",  "value": 6000.0,"date": day(5)},
]

for log in transport_logs:
    result = post("/logs", log)
    if result:
        print(f"  ✅ {log['sub_category']:15s}  {log['value']:>7.1f} km  →  {result['emissions_co2e']} kg CO2e")

# ─── 3. Activity Logs — DIET (all sub-categories) ────────────────────────────
print("\n🍔 Seeding DIET logs...")

diet_logs = [
    # vegan: 7 days
    {"category": "diet", "sub_category": "vegan",        "value":  7.0, "date": day(28)},
    # vegetarian: 5 days
    {"category": "diet", "sub_category": "vegetarian",   "value":  5.0, "date": day(21)},
    # pescatarian: 4 days
    {"category": "diet", "sub_category": "pescatarian",  "value":  4.0, "date": day(14)},
    # low_meat: 6 days
    {"category": "diet", "sub_category": "low_meat",     "value":  6.0, "date": day(9)},
    # high_meat: 3 days
    {"category": "diet", "sub_category": "high_meat",    "value":  3.0, "date": day(3)},
]

for log in diet_logs:
    result = post("/logs", log)
    if result:
        print(f"  ✅ {log['sub_category']:15s}  {log['value']:>5.1f} days  →  {result['emissions_co2e']} kg CO2e")

# ─── 4. Activity Logs — ENERGY (all sub-categories) ─────────────────────────
print("\n⚡ Seeding ENERGY logs...")

energy_logs = [
    # us_average grid: 450 kWh monthly bill
    {"category": "energy", "sub_category": "us_average",  "value": 450.0, "date": day(30)},
    # clean renewable mix: 300 kWh solar
    {"category": "energy", "sub_category": "clean_mix",   "value": 300.0, "date": day(20)},
    # coal-heavy grid: 380 kWh heavy winter use
    {"category": "energy", "sub_category": "coal_heavy",  "value": 380.0, "date": day(13)},
    # another us_average month
    {"category": "energy", "sub_category": "us_average",  "value": 510.0, "date": day(2)},
]

for log in energy_logs:
    result = post("/logs", log)
    if result:
        print(f"  ✅ {log['sub_category']:15s}  {log['value']:>6.1f} kWh  →  {result['emissions_co2e']} kg CO2e")

# ─── 5. Goals — one per category + one overall ───────────────────────────────
print("\n🎯 Seeding GOALS...")

goals_data = [
    {
        "title": "Cut Transport Emissions by 20% This Month",
        "category": "transport",
        "target_reduction_percent": 20.0,
        "target_emissions_limit": None,
        "start_date": str(date.today().replace(day=1)),
        "end_date": str(date.today().replace(day=28))
    },
    {
        "title": "Switch to Plant-Based Diet for 2 Weeks",
        "category": "diet",
        "target_reduction_percent": 35.0,
        "target_emissions_limit": 60.0,
        "start_date": day(0),
        "end_date": str(date.today() + timedelta(days=14))
    },
    {
        "title": "Reduce Home Energy Use Below 400 kWh",
        "category": "energy",
        "target_reduction_percent": None,
        "target_emissions_limit": 148.4,
        "start_date": day(0),
        "end_date": str(date.today() + timedelta(days=30))
    },
    {
        "title": "Go Carbon Neutral This Quarter",
        "category": "overall",
        "target_reduction_percent": 50.0,
        "target_emissions_limit": 500.0,
        "start_date": day(0),
        "end_date": str(date.today() + timedelta(days=90))
    },
]

created_goals = []
for goal in goals_data:
    result = post("/goals", goal)
    if result:
        created_goals.append(result)
        print(f"  ✅ [{result['id']}] {result['title'][:55]}")

# Mark first goal as completed to show the toggle feature
if created_goals:
    first_id = created_goals[0]["id"]
    toggled = put(f"/goals/{first_id}", {"completed": True})
    if toggled:
        print(f"\n  ✔️  Marked goal [{first_id}] as COMPLETED (demonstrates toggle feature)")

# ─── 6. Verify endpoints ─────────────────────────────────────────────────────
print("\n📊 Verifying Analytics Summary...")
analytics = get("/analytics/summary")
if analytics:
    print(f"  total_emissions_co2e  : {analytics['total_emissions_co2e']} kg")
    print(f"  category_breakdown    : {analytics['category_breakdown']}")
    print(f"  logs_count            : {analytics['logs_count']}")
    pct = analytics['benchmarks']['percent_difference']
    avg = analytics['benchmarks']['national_monthly_average']
    print(f"  vs national avg ({avg} kg): {'+' if pct > 0 else ''}{pct}%")

print("\n💡 Verifying Recommendations...")
recs = get("/recommendations")
if recs:
    print(f"  highest_emission_driver : {recs.get('highest_emission_driver')}")
    print(f"  potential_weekly_savings: {recs.get('potential_weekly_savings_co2e_kg')} kg CO2e")
    for r in recs.get("prioritized_recommendations", []):
        print(f"  → [{r['difficulty']}] {r['title']} (saves {r['potential_saving_co2e_kg']} kg)")

print("\n✅ Seeding complete! Open http://localhost:5173 to see populated data.")
