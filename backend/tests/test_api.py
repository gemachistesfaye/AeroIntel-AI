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

    def test_07_api_validation_errors(self):
        """Verifies API endpoints return 400 with helpful errors when requests are invalid."""
        # Empty predict body
        res = self.client.post("/api/predict/flight", data="", content_type="application/json")
        self.assertEqual(res.status_code, 400)
        data = json.loads(res.data)
        self.assertFalse(data["success"])

        # Invalid departure hour
        res_hour = self.client.post("/api/predict/flight", json={"dep_hour": 99, "origin": "ATL", "dest": "LAX"})
        self.assertEqual(res_hour.status_code, 400)
        self.assertIn("Departure hour must be between 0 and 23", json.loads(res_hour.data)["error"])

        # Identical origin and destination
        res_route = self.client.post("/api/predict/flight", json={"origin": "ORD", "dest": "ORD"})
        self.assertEqual(res_route.status_code, 400)
        self.assertIn("cannot be identical", json.loads(res_route.data)["error"])

        # Negative distance
        res_dist = self.client.post("/api/predict/flight", json={"distance_miles": -100})
        self.assertEqual(res_dist.status_code, 400)
        self.assertIn("greater than 0", json.loads(res_dist.data)["error"])

        # Upload without file
        res_upload = self.client.post("/api/data/upload")
        self.assertEqual(res_upload.status_code, 400)
        data_upload = json.loads(res_upload.data)
        self.assertFalse(data_upload["success"])

        # Non-existent file ingestion
        res_ingest = self.client.post("/api/data/ingest", json={"file_name": "non_existent_file.csv"})
        self.assertEqual(res_ingest.status_code, 404)

        # Invalid retrain delay threshold
        res_retrain_inv = self.client.post("/api/model/retrain", json={"delay_threshold_minutes": -5})
        self.assertEqual(res_retrain_inv.status_code, 400)
        self.assertIn("between 5 and 120", json.loads(res_retrain_inv.data)["error"])

    def test_08_data_management_and_quality(self):
        """Verifies data status and quality report endpoints."""
        res_status = self.client.get("/api/data/status")
        self.assertEqual(res_status.status_code, 200)
        data_status = json.loads(res_status.data)
        self.assertTrue(data_status["success"])
        self.assertIn("total_records", data_status["data"])

        res_quality = self.client.get("/api/data/quality")
        self.assertEqual(res_quality.status_code, 200)
        data_quality = json.loads(res_quality.data)
        self.assertTrue(data_quality["success"])
        self.assertIn("valid_records", data_quality["data"])

    def test_09_schema_mapping_and_temporal_apis(self):
        """Verifies schema mapping inspection and temporal analytics APIs."""
        res_map = self.client.get("/api/data/schema-mapping")
        self.assertEqual(res_map.status_code, 200)
        map_data = json.loads(res_map.data)
        self.assertTrue(map_data["success"])
        self.assertIn("standard_bts_mapping", map_data["data"])
        self.assertIn("canonical_candidates", map_data["data"])

        res_temp = self.client.get("/api/analytics/temporal")
        self.assertEqual(res_temp.status_code, 200)
        temp_data = json.loads(res_temp.data)
        self.assertTrue(temp_data["success"])
        self.assertIn("by_departure_hour", temp_data["data"])

if __name__ == "__main__":
    unittest.main()
