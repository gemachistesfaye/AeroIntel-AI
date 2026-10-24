import unittest
import json
import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.main import create_app

class AviationApiTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.client = cls.app.test_client()

    def test_01_health_check(self):
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertEqual(data["status"], "healthy")
        self.assertTrue(data["model_ready"])
        self.assertGreater(data["records_loaded"], 0)

    def test_02_dashboard_summary(self):
        res = self.client.get("/api/dashboard/summary")
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertTrue(data["success"])
        self.assertIn("total_flights", data["data"])
        self.assertIn("causes_breakdown", data["data"])

    def test_03_flight_search(self):
        res = self.client.get("/api/flights?limit=5")
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertTrue(data["success"])
        self.assertEqual(len(data["data"]["items"]), 5)

    def test_04_predict_delay(self):
        payload = {
            "carrier_code": "DL",
            "origin": "ATL",
            "dest": "LAX",
            "dep_hour": 17,
            "origin_weather": "Thunderstorm",
            "wind_speed_knots": 32,
            "taxi_out_minutes": 35,
            "congestion_level": "Severe"
        }
        res = self.client.post("/api/predict/flight", json=payload)
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertTrue(data["success"])
        self.assertIn("prediction", data["data"])
        self.assertIn("delay_probability", data["data"]["prediction"])
        self.assertGreater(data["data"]["prediction"]["delay_probability"], 0.0)

    def test_05_route_intelligence(self):
        res = self.client.get("/api/route-intelligence")
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertTrue(data["success"])
        self.assertIn("corridors", data["data"])

    def test_06_model_evaluation(self):
        res = self.client.get("/api/model/evaluation")
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertTrue(data["success"])
        self.assertIn("classification", data["data"])
        self.assertIn("accuracy", data["data"]["classification"])

if __name__ == "__main__":
    unittest.main()
