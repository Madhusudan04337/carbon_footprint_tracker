import json
import os
from typing import Dict, Any, Literal
import math

# Realistic emission factors standard
factors_file_path = os.path.join(os.path.dirname(__file__), "emission_factors.json")
try:
    with open(factors_file_path, "r") as f:
        EMISSION_FACTORS = json.load(f)
except FileNotFoundError:
    EMISSION_FACTORS = {}

CONFIDENCE_SCORES = {
    "automated": 1.00,
    "precise_record": 0.90,
    "rough_estimate": 0.60,
    "default_fallback": 0.40
}

FORMULA_EXPLANATIONS = {
    "transport": "Emissions (kg CO2e) = Distance (km) * Factor ({factor_val} kg CO2e/km)",
    "energy": "Emissions (kg CO2e) = Consumption * Factor ({factor_val} kg CO2e/unit)",
    "food": "Emissions (kg CO2e) = Days logged * Factor ({factor_val} kg CO2e/day)",
    "waste": "Emissions (kg CO2e) = Waste Weight (kg) * Factor ({factor_val} kg CO2e/kg)"
}

CategoryType = Literal["transport", "energy", "food", "waste"]
InputVerificationType = Literal["automated", "precise_record", "rough_estimate", "default_fallback"]

class CalculationEngine:
    @staticmethod
    def get_factor(category: str, sub_category: str) -> float:
        """
        Retrieves the carbon emission factor. Designed for future expansions.
        """
        cat_data = EMISSION_FACTORS.get(category)
        if not cat_data:
            raise ValueError(f"Category '{category}' is not supported by the emission tables.")
        
        factor = cat_data.get(sub_category)
        if factor is None:
            raise ValueError(f"Sub-category '{sub_category}' is not supported in the '{category}' table.")
        
        return factor

    @staticmethod
    def compute(
        category: CategoryType,
        sub_category: str,
        value: float,
        verification_type: InputVerificationType = "rough_estimate"
    ) -> Dict[str, Any]:
        """
        Calculates emissions, confidence scores, and monthly/annual extrapolations.
        """
        if value < 0:
            raise ValueError("Input value must be a non-negative number.")

        factor = CalculationEngine.get_factor(category, sub_category)
        emissions = round(value * factor, 2)
        
        # Confidence Score mapping
        confidence = CONFIDENCE_SCORES.get(verification_type, 0.60)
        
        # Extrapolations based on standard carbon accounting practices
        monthly_est = 0.0
        yearly_est = 0.0
        
        if category == "food":
            # Input 'value' represents number of days logged
            daily_emissions = emissions / max(value, 1.0)
            monthly_est = round(daily_emissions * 30.4, 2)
            yearly_est = round(daily_emissions * 365.25, 2)
        elif category == "energy":
            # Input 'value' represents monthly utility consumption
            monthly_est = emissions
            yearly_est = round(emissions * 12.0, 2)
        elif category == "waste":
            # Input represents weekly waste collection intervals
            monthly_est = round(emissions * 4.33, 2)
            yearly_est = round(emissions * 52.14, 2)
        elif category == "transport":
            # Transport inputs are highly periodic, treated as one-off event logs
            # Extrapolation is mapped relative to daily commutes (assumed 20 days/month active transit baseline)
            monthly_est = emissions
            yearly_est = round(emissions * 12.0, 2)
            
        explanation = FORMULA_EXPLANATIONS.get(category, "").format(factor_val=factor)

        return {
            "category": category,
            "sub_category": sub_category,
            "input_value": value,
            "emissions_co2e_kg": emissions,
            "confidence_score": confidence,
            "extrapolations": {
                "monthly_estimate_kg": monthly_est,
                "yearly_estimate_kg": yearly_est
            },
            "formula_explanation": explanation
        }
