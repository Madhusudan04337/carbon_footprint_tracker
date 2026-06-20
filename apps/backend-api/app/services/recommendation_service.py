from sqlalchemy.orm import Session
from typing import Dict, List, Any
from app.repositories.log_repo import log_repository
from app.repositories.goal_repo import goal_repository

RECOMMENDATION_DATABASE = [
    {
        "id": "rec-1",
        "title": "Upgrade to LED Light Bulbs",
        "description": "Replace remaining incandescent bulbs in your main rooms with LEDs. LEDs consume 80-85% less electricity.",
        "category": "energy",
        "potential_saving_co2e_kg": 6.0,
        "difficulty": "Easy",
        "explanation": "Lighting accounts for a significant portion of utility electricity; switching to LED bulbs offsets fossil-fuel generation."
    },
    {
        "id": "rec-2",
        "title": "Adjust Heating and Cooling",
        "description": "Offset indoor climate control by 1°C (lower in winter, higher in summer) to save on HVAC load.",
        "category": "energy",
        "potential_saving_co2e_kg": 15.0,
        "difficulty": "Easy",
        "explanation": "HVAC operations are the largest single home energy driver; adjusting targets reduces grid fuel loading."
    },
    {
        "id": "rec-3",
        "title": "Swap Driving for Public Transit",
        "description": "Choose transit train or bus for your next two work commutes instead of driving alone.",
        "category": "transport",
        "potential_saving_co2e_kg": 12.5,
        "difficulty": "Medium",
        "explanation": "Vehicles are highly carbon-intensive per mile; public transit divides trip emissions among hundreds of passengers."
    },
    {
        "id": "rec-4",
        "title": "Consolidate Errands",
        "description": "Combine driving runs into a single round trip to reduce cold starts and vehicle mileage.",
        "category": "transport",
        "potential_saving_co2e_kg": 4.0,
        "difficulty": "Easy",
        "explanation": "Warm engines run more efficiently, and mapping unified routes reduces total vehicle travel."
    },
    {
        "id": "rec-5",
        "title": "Adopt plant-based Monday",
        "description": "Exclude red meat and animal products from your diet on Mondays.",
        "category": "diet",
        "potential_saving_co2e_kg": 4.5,
        "difficulty": "Easy",
        "explanation": "Plant proteins create about 90% less carbon emissions compared to beef or sheep farming."
    },
    {
        "id": "rec-6",
        "title": "Swap Milk for Oat Milk",
        "description": "Opt for plant-based milks (oat, almond) for coffees and cooking.",
        "category": "diet",
        "potential_saving_co2e_kg": 1.8,
        "difficulty": "Easy",
        "explanation": "Dairy production is methane-heavy; oat milk creates 80% fewer greenhouse emissions."
    }
]

class RecommendationService:
    @staticmethod
    def generate_recommendations(db: Session, user_id: int) -> Dict[str, Any]:
        """
        AI Sustainability Recommendation Engine:
        Analyzes footprint history, isolates highest emission categories, filters active goals,
        and generates weekly plans.
        """
        # Fetch aggregated emissions directly from the database
        aggregates = log_repository.get_emissions_aggregation(db, user_id=user_id)
        goals = goal_repository.get_by_user(db, user_id=user_id)
        
        # 1. Map emissions breakdown
        category_totals = {
            "transport": 0.0,
            "energy": 0.0,
            "diet": 0.0
        }
        for category, emissions_sum in aggregates:
            if category in category_totals:
                category_totals[category] = emissions_sum or 0.0
                
        # Sort categories to find highest emission drivers
        sorted_categories = sorted(
            category_totals.items(),
            key=lambda x: x[1],
            reverse=True
        )
        
        # 2. Extract active goals to prevent redundant suggestions
        active_goal_categories = {g.category for g in goals if not g.completed}
        
        # 3. Filter templates matching the highest category and exclude categories with active goals
        candidates = []
        for category, total in sorted_categories:
            if category in active_goal_categories:
                continue # Skip category if user is actively pursuing a goal in it
                
            # Grab matching templates
            templates = [rec for rec in RECOMMENDATION_DATABASE if rec["category"] == category]
            candidates.extend(templates)
            
        # Fallbacks: if no logs yet or all categories have active goals
        if not candidates:
            candidates = [rec for rec in RECOMMENDATION_DATABASE if rec["category"] not in active_goal_categories]
            if not candidates:
                candidates = RECOMMENDATION_DATABASE
                
        # 4. Sort prioritized candidates by impact (potential savings DESC)
        candidates = sorted(
            candidates,
            key=lambda x: x["potential_saving_co2e_kg"],
            reverse=True
        )
        
        # Take the top 3 recommendations
        top_recs = candidates[:3]
        
        # Calculate total potential weekly savings
        weekly_savings = sum(r["potential_saving_co2e_kg"] for r in top_recs)
        
        # 5. Generate Weekly Action Plan based on top recommendations
        weekly_plan = {
            "Monday": "Kickoff: Review target areas. " + (top_recs[0]["title"] if len(top_recs) > 0 else "Review logs"),
            "Tuesday": "Active check-in: Log all consumption today.",
            "Wednesday": "Mid-week action: " + (top_recs[1]["title"] if len(top_recs) > 1 else "Avoid solo vehicle commutes"),
            "Thursday": "Energy check: Adjust thermostat target settings.",
            "Friday": "Weekend Setup: " + (top_recs[2]["title"] if len(top_recs) > 2 else "Verify recycling sorting"),
            "Saturday": "Community: Share tips or participate in local cleanups.",
            "Sunday": "Reflect: Review this week's logged metrics against goals."
        }
        
        # 6. Milestone objectives tracking achievements
        milestones = [
            {
                "badge_name": "Carbon Commuter Bronze",
                "condition": "Adopt and complete 2 transportation goals suggested by AI.",
                "points_award": 150
            },
            {
                "badge_name": "Vampire Slayer",
                "condition": "Adopt energy-saving bulb recommendation and log savings.",
                "points_award": 100
            }
        ]

        return {
            "user_id": user_id,
            "highest_emission_driver": sorted_categories[0][0] if sorted_categories and sorted_categories[0][1] > 0 else "none",
            "emissions_breakdown": category_totals,
            "prioritized_recommendations": top_recs,
            "weekly_action_plan": weekly_plan,
            "potential_weekly_savings_co2e_kg": round(weekly_savings, 2),
            "milestone_challenges": milestones,
            "explainability_model": "EcoTrace rule-based matching v1.0. Prioritizes largest category deficits."
        }
