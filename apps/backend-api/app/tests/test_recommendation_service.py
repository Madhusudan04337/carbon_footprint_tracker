import unittest
import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Resolve app paths
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from app.core.database import Base
from app.models.user import User
from app.models.log import ActivityLog
from app.models.goal import Goal
from app.services.recommendation_service import RecommendationService

class TestRecommendationService(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Create lightweight in-memory SQLite DB for transactional unit tests
        cls.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(cls.engine)
        cls.SessionLocal = sessionmaker(bind=cls.engine)

    def test_recommendation_engine_prioritization(self):
        db = self.SessionLocal()
        try:
            # 1. Create a dummy test user
            user = User(
                email="user@test.com",
                password_hash="hash",
                first_name="Jane",
                last_name="Doe",
                country="US",
                postal_code="10001"
            )
            db.add(user)
            db.commit()
            db.refresh(user)

            # 2. Add high energy emissions log and lower transport emission log
            import datetime
            log_energy = ActivityLog(
                user_id=user.id,
                category="energy",
                sub_category="us_average",
                value=500.0,
                emissions_co2e=192.5, # High energy emission
                date=datetime.date(2026, 6, 20)
            )
            log_transport = ActivityLog(
                user_id=user.id,
                category="transport",
                sub_category="car",
                value=20.0,
                emissions_co2e=3.4,
                date=datetime.date(2026, 6, 20)
            )
            db.add(log_energy)
            db.add(log_transport)
            db.commit()

            # 3. Generate recommendations
            recommendations = RecommendationService.generate_recommendations(db, user_id=user.id)
            
            # The highest driver should be energy
            self.assertEqual(recommendations["highest_emission_driver"], "energy")
            
            # The first recommended template should be from the energy category
            first_rec = recommendations["prioritized_recommendations"][0]
            self.assertEqual(first_rec["category"], "energy")
            # HVAC (Adjust heating/cooling) is 15.0 kg savings, which should be prioritized over LEDs (6.0 kg)
            self.assertEqual(first_rec["title"], "Adjust Heating and Cooling")

        finally:
            db.close()

if __name__ == "__main__":
    unittest.main()
