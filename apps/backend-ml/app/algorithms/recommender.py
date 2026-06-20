from typing import List, Dict, Any

RECOMMENDATION_TEMPLATES = {
    "transport": [
        {
            "title": "Switch to Hybrid/Electric Commuting",
            "description": "Swapping 3 days of gasoline car travel with public train transit reduces emissions by roughly 70% per kilometer.",
            "category": "transport",
            "potential_saving_co2e": 12.5,
            "action_url": "/goals/create?category=transport"
        },
        {
            "title": "Consolidate Errands & Carpool",
            "description": "Combine local driving trips or carpool with colleagues to reduce total vehicle miles traveled.",
            "category": "transport",
            "potential_saving_co2e": 5.2,
            "action_url": "/goals/create?category=transport"
        }
    ],
    "diet": [
        {
            "title": "Participate in Green Mondays",
            "description": "Eliminating red meat and choosing plant-based meals for just one day a week saves significant agricultural methane emissions.",
            "category": "diet",
            "potential_saving_co2e": 4.3,
            "action_url": "/goals/create?category=diet"
        },
        {
            "title": "Swap Milk for Oat Milk",
            "description": "Oat milk production creates 80% less greenhouse gas emissions than standard dairy milk.",
            "category": "diet",
            "potential_saving_co2e": 1.8,
            "action_url": "/goals/create?category=diet"
        }
    ],
    "energy": [
        {
            "title": "Adjust Smart Thermostat",
            "description": "Lowering your indoor heating temperature by 1°C in winter saves up to 10% on energy bills and emissions.",
            "category": "energy",
            "potential_saving_co2e": 15.0,
            "action_url": "/goals/create?category=energy"
        },
        {
            "title": "Unplug Vampire Electronics",
            "description": "Consoles, micro-ovens, and stand-by computers draw power even when turned off. Use smart energy strips.",
            "category": "energy",
            "potential_saving_co2e": 2.5,
            "action_url": "/goals/create?category=energy"
        }
    ]
}

def get_recommendations(emissions_profile: Dict[str, float]) -> List[Dict[str, Any]]:
    """
    Ranks emission categories and filters candidate eco-actions that target the highest sectors.
    """
    # Sort categories to find the highest emission source
    sorted_sectors = sorted(
        emissions_profile.items(),
        key=lambda item: item[1],
        reverse=True
    )
    
    recommendations = []
    
    # Take templates from the top 2 emitting sectors
    for sector, amount in sorted_sectors:
        if amount > 0 and sector in RECOMMENDATION_TEMPLATES:
            recommendations.extend(RECOMMENDATION_TEMPLATES[sector])
            
    # Fallback if no logs recorded yet
    if not recommendations:
        recommendations.extend(RECOMMENDATION_TEMPLATES["transport"])
        recommendations.extend(RECOMMENDATION_TEMPLATES["diet"])
        
    return recommendations
