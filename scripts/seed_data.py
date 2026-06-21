#!/usr/bin/env python3
"""
EcoTrace Fast Sample Data Seeder — uses asyncio + concurrent requests
Resilient against rate limits (429) using exponential backoff retries.
"""
import asyncio
import json
import random
import datetime
import sys

try:
    import aiohttp
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "aiohttp", "-q"])
    import aiohttp

BASE_URL = "https://ecotrace-api-626832785404.asia-south1.run.app/api"
CONCURRENCY = 8   # Moderate concurrency to reduce rate limit pressure

USERS = [
    {"email": "madhu@ecotrace.org",  "password": "Test@12345",  "first_name": "Madhu",  "last_name": "Sudan",  "country": "IN", "postal_code": "560001"},
    {"email": "priya@ecotrace.org",  "password": "EcoPass@789", "first_name": "Priya",  "last_name": "Sharma", "country": "IN", "postal_code": "400001"},
    {"email": "arjun@ecotrace.org",  "password": "Green@2024",  "first_name": "Arjun",  "last_name": "Patel",  "country": "IN", "postal_code": "110001"},
]

# Slightly reduced density (fewer log entries) to fit rate limits while maintaining rich charts
LOG_TEMPLATES = [
    # (category, sub_category, (min_val, max_val), entries_per_month)
    ("transport", "car_petrol",      (15, 80),   6),
    ("transport", "motorcycle",      (5,  30),    3),
    ("transport", "bus",             (10, 50),    4),
    ("transport", "train",           (20, 200),   2),
    ("transport", "flight_short",    (300, 900),  1),
    ("diet",      "beef",            (1, 5),      4),
    ("diet",      "chicken",         (1, 3),      6),
    ("diet",      "vegetarian",      (1, 2),      8),
    ("diet",      "dairy",           (1, 3),      8),
    ("energy",    "electricity",     (5, 30),     12),
    ("energy",    "natural_gas",     (1, 5),      12),
    ("energy",    "air_conditioning",(1, 8),      6),
]

GOALS = [
    {"title": "Reduce car travel by 20% this quarter",   "category": "transport", "target_reduction_percent": 20.0, "days": 90},
    {"title": "Switch to plant-based diet for 30 days",  "category": "diet",      "target_emissions_limit":   50.0, "days": 30},
    {"title": "Cut home electricity usage by 15%",       "category": "energy",    "target_reduction_percent": 15.0, "days": 60},
    {"title": "No flights for 3 months",                 "category": "transport", "target_emissions_limit":    0.0, "days": 90},
    {"title": "Use public transport daily",              "category": "transport", "target_reduction_percent": 30.0, "days": 30},
    {"title": "Reduce beef consumption by 50%",          "category": "diet",      "target_reduction_percent": 50.0, "days": 45},
    {"title": "Cycle to work for 2 weeks",               "category": "transport", "target_emissions_limit":    5.0, "days": 14},
    {"title": "Solar-powered home challenge",            "category": "energy",    "target_emissions_limit":   20.0, "days": 60},
]


def build_log_payloads(user_email: str) -> list[dict]:
    today = datetime.date.today()
    rng = random.Random(hash(user_email))
    payloads = []
    # Seed 3 months of history
    for months_back in range(3, 0, -1):
        month_start = today - datetime.timedelta(days=30 * months_back)
        for cat, sub_cat, (vmin, vmax), freq in LOG_TEMPLATES:
            entries = rng.randint(max(1, freq - 2), freq + 2)
            for _ in range(entries):
                day_offset = rng.randint(0, 27)
                log_date = month_start + datetime.timedelta(days=day_offset)
                payloads.append({
                    "category": cat,
                    "sub_category": sub_cat,
                    "value": round(rng.uniform(vmin, vmax), 2),
                    "date": log_date.isoformat(),
                })
    return payloads


def build_goal_payloads(user_email: str) -> list[dict]:
    today = datetime.date.today()
    rng = random.Random(hash(user_email) + 1)
    selected = rng.sample(GOALS, 5)
    payloads = []
    for tpl in selected:
        start = today - datetime.timedelta(days=rng.randint(5, 50))
        end   = start + datetime.timedelta(days=tpl["days"])
        p: dict = {
            "title":      tpl["title"],
            "category":   tpl["category"],
            "start_date": start.isoformat(),
            "end_date":   end.isoformat(),
        }
        if "target_reduction_percent" in tpl:
            p["target_reduction_percent"] = tpl["target_reduction_percent"]
        if "target_emissions_limit" in tpl:
            p["target_emissions_limit"] = tpl["target_emissions_limit"]
        payloads.append(p)
    return payloads


async def request_with_retry(session: aiohttp.ClientSession, method: str, path: str, payload: dict, token: str = "") -> dict:
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    url = f"{BASE_URL}{path}"
    attempts = 0
    max_attempts = 15
    base_backoff = 6.0
    
    while attempts < max_attempts:
        try:
            async with session.request(method, url, json=payload, headers=headers) as r:
                if r.status == 429:
                    attempts += 1
                    # Exponential backoff with jitter
                    sleep_time = base_backoff * (1.5 ** (attempts - 1)) + random.uniform(1.0, 3.0)
                    print(f"      ⚠️  [429 Too Many Requests] on {path}. Retrying attempt {attempts}/{max_attempts} in {sleep_time:.2f}s...")
                    await asyncio.sleep(sleep_time)
                    continue
                
                if r.status >= 400:
                    try:
                        return await r.json()
                    except Exception:
                        text = await r.text()
                        return {"detail": f"HTTP {r.status}: {text}"}
                
                try:
                    return await r.json()
                except Exception as e:
                    text = await r.text()
                    return {"detail": f"JSON decode error: {e}", "body": text}
        except Exception as e:
            attempts += 1
            sleep_time = base_backoff * (1.5 ** (attempts - 1)) + random.uniform(1.0, 3.0)
            print(f"      ⚠️  Connection error: {e}. Retrying attempt {attempts}/{max_attempts} in {sleep_time:.2f}s...")
            await asyncio.sleep(sleep_time)
            
    return {"detail": "Failed after max retry attempts due to connection issues or rate limiting"}


async def seed_user(session: aiohttp.ClientSession, user: dict, sem: asyncio.Semaphore):
    name = f"{user['first_name']} {user['last_name']}"
    print(f"\n{'─'*50}")
    print(f"  👤 {name}  ({user['email']})")
    print(f"{'─'*50}")

    # Register
    reg = await request_with_retry(session, "POST", "/auth/register", user)
    if "id" in reg:
        print(f"  ✅ Registered (id={reg['id']})")
    else:
        print(f"  ℹ  Skipped register: {reg.get('detail', reg.get('error', reg))}")

    # Login
    login = await request_with_retry(session, "POST", "/auth/login", {"email": user["email"], "password": user["password"]})
    if "access_token" not in login:
        print(f"  ❌ Login failed: {login}")
        return
    token = login["access_token"]
    print(f"  🔑 Authenticated")

    # ── Logs (concurrent, batched) ───────────────────────────────────────────
    log_payloads = build_log_payloads(user["email"])
    print(f"  📤 Sending {len(log_payloads)} log entries concurrently...")

    async def post_log(p):
        async with sem:
            return await request_with_retry(session, "POST", "/logs", p, token)

    results = await asyncio.gather(*[post_log(p) for p in log_payloads], return_exceptions=True)
    ok = sum(1 for r in results if isinstance(r, dict) and "id" in r)
    print(f"  📊 {ok}/{len(log_payloads)} logs created")

    # ── Goals ────────────────────────────────────────────────────────────────
    goal_payloads = build_goal_payloads(user["email"])
    goal_results = []
    for gp in goal_payloads:
        async with sem:
            gr = await request_with_retry(session, "POST", "/goals", gp, token)
            if "id" in gr:
                goal_results.append(gr["id"])

    # Mark first 2 complete
    for gid in goal_results[:2]:
        async with sem:
            await request_with_retry(session, "PUT", f"/goals/{gid}", {"completed": True}, token)

    print(f"  🎯 {len(goal_results)} goals created ({min(2,len(goal_results))} marked complete)")
    print(f"  ✅ {name} seeded!")


async def main():
    print("\n🌿  EcoTrace Resilient Data Seeder")
    print(f"    API : {BASE_URL}")
    print(f"    Users: {len(USERS)}  |  Concurrency: {CONCURRENCY}")

    sem = asyncio.Semaphore(CONCURRENCY)
    connector = aiohttp.TCPConnector(limit=CONCURRENCY)
    timeout = aiohttp.ClientTimeout(total=120)

    async with aiohttp.ClientSession(connector=connector, timeout=timeout) as session:
        for user in USERS:
            await seed_user(session, user, sem)

    print(f"\n{'═'*50}")
    print("  🎉 All users seeded successfully!")
    print(f"  🌐 https://ecotrace-frontend-626832785404.asia-south1.run.app")
    print(f"{'═'*50}\n")


if __name__ == "__main__":
    asyncio.run(main())
