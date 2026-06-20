import unittest
import sys
import os

# Set sys path to resolve app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from app.core.calculation_engine import CalculationEngine

class TestCalculationEngine(unittest.TestCase):
    def test_transport_calculation(self):
        # Car calculation: 100km * 0.170 = 17.0 kg CO2e
        result = CalculationEngine.compute(
            category="transport",
            sub_category="car",
            value=100.0,
            verification_type="precise_record"
        )
        self.assertEqual(result["emissions_co2e_kg"], 17.0)
        self.assertEqual(result["confidence_score"], 0.90)
        self.assertIn("Factor (0.17", result["formula_explanation"])

    def test_energy_electricity(self):
        # Electricity calculation: 200 kWh * 0.385 = 77.0 kg CO2e
        result = CalculationEngine.compute(
            category="energy",
            sub_category="electricity",
            value=200.0,
            verification_type="automated"
        )
        self.assertEqual(result["emissions_co2e_kg"], 77.0)
        self.assertEqual(result["confidence_score"], 1.00)
        self.assertEqual(result["extrapolations"]["yearly_estimate_kg"], 77.0 * 12)

    def test_diet_vegan(self):
        # Vegan diet calculation: 7 days * 2.90 = 20.3 kg CO2e
        result = CalculationEngine.compute(
            category="food",
            sub_category="vegan",
            value=7.0,
            verification_type="rough_estimate"
        )
        self.assertEqual(result["emissions_co2e_kg"], 20.3)
        self.assertEqual(result["confidence_score"], 0.60)

    def test_waste_recycling_offset(self):
        # Recycling offset calculation: 50 kg * -0.200 = -10.0 kg CO2e
        result = CalculationEngine.compute(
            category="waste",
            sub_category="recycling",
            value=50.0,
            verification_type="precise_record"
        )
        self.assertEqual(result["emissions_co2e_kg"], -10.0)

    def test_invalid_category_error(self):
        with self.assertRaises(ValueError):
            CalculationEngine.compute("invalid_cat", "car", 10.0)

    def test_negative_values_error(self):
        with self.assertRaises(ValueError):
            CalculationEngine.compute("transport", "car", -50.0)

if __name__ == "__main__":
    unittest.main()
