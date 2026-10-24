import unittest
import json
import sys
from pathlib import Path
import pandas as pd
import numpy as np

# Ensure backend directory is in path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.main import create_app
from app.data.ingestion import FlightDataIngestionPipeline
from app.data.big_data_processor import FlightAnalyticsProcessor
from app.ml.pipeline import (
    engineer_features, build_preprocessor,
    NUMERICAL_PRE_DEPARTURE_FEATURES, CATEGORICAL_PRE_DEPARTURE_FEATURES,
    LEAKAGE_BLOCKLIST
)
from app.ml.model_service import model_service
from app.ml.train_models import train_and_compare_models

class DataProcessingAndMLExhaustiveTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.client = cls.app.test_client()
        cls.pipeline = FlightDataIngestionPipeline(delay_threshold_minutes=15)

    def test_01_data_validation_and_cleaning(self):
        """Verifies that clean records pass validation and required columns are extracted."""
        raw_data = pd.DataFrame([
            {
                "flight_id": "DL101",
                "carrier_code": "DL",
                "origin": "ATL",
                "dest": "LAX",
                "scheduled_dep_time": "14:30",
                "distance_miles": 1946.0,
                "arr_delay_minutes": 25.0,
            },
            {
                "flight_id": "UA202",
                "carrier_code": "UA",
                "origin": "ORD",
                "dest": "SFO",
                "scheduled_dep_time": "08:15",
                "distance_miles": 1846.0,
                "arr_delay_minutes": 5.0,
            }
        ])
        clean_df, report = self.pipeline.validate_and_clean(raw_data)
        self.assertEqual(report["total_input_records"], 2)
        self.assertEqual(report["valid_records"], 2)
        self.assertEqual(report["rejected_records"], 0)
        self.assertEqual(clean_df.iloc[0]["is_delayed"], 1) # 25 >= 15
        self.assertEqual(clean_df.iloc[1]["is_delayed"], 0) # 5 < 15

    def test_02_rejection_of_corrupted_and_invalid_records(self):
        """Tests rejection of invalid negative distances, same origin-dest, and missing times."""
        invalid_data = pd.DataFrame([
            {"flight_id": "ERR1", "carrier_code": "AA", "origin": "JFK", "dest": "JFK", "scheduled_dep_time": "10:00", "arr_delay": 10}, # Same orig & dest
            {"flight_id": "ERR2", "carrier_code": "AA", "origin": "JFK", "dest": "LAX", "scheduled_dep_time": "12:00", "distance_miles": -100, "arr_delay": 0}, # Negative distance
            {"flight_id": "ERR3", "carrier_code": "AA", "origin": "JFK", "dest": "LAX", "scheduled_dep_time": "INVALID_TIME", "distance_miles": 1200, "arr_delay": 0}, # Bad time
            {"flight_id": "VALID1", "carrier_code": "AA", "origin": "JFK", "dest": "MIA", "scheduled_dep_time": "10:00", "distance_miles": 1089, "arr_delay_minutes": 20}
        ])
        clean_df, report = self.pipeline.validate_and_clean(invalid_data)
        self.assertEqual(report["total_input_records"], 4)
        self.assertEqual(report["valid_records"], 1)
        self.assertEqual(report["rejected_records"], 3)
        self.assertGreater(report["rejection_breakdown"]["same_origin_and_dest"], 0)
        self.assertGreater(report["rejection_breakdown"]["invalid_negative_distance"], 0)

    def test_03_strict_prevention_of_target_leakage(self):
        """Verifies that future delay variables are NEVER included in model preprocessor features."""
        preprocessor = build_preprocessor()
        all_feature_inputs = NUMERICAL_PRE_DEPARTURE_FEATURES + CATEGORICAL_PRE_DEPARTURE_FEATURES

        for leakage_col in LEAKAGE_BLOCKLIST:
            self.assertNotIn(
                leakage_col, all_feature_inputs,
                f"Target leakage violation! Column '{leakage_col}' found in model training features."
            )

    def test_04_comparative_model_inference_endpoints(self):
        """Tests that prediction API supports both candidate and baseline models with explainability."""
        payload = {
            "carrier_code": "DL",
            "origin": "ATL",
            "dest": "LAX",
            "dep_hour": 17,
            "origin_weather": "Thunderstorm",
            "wind_speed_knots": 30.0,
            "taxi_out_minutes": 35.0,
            "congestion_level": "Severe",
            "model_type": "candidate"
        }
        res = self.client.post("/api/predict/flight", json=payload)
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertTrue(data["success"])
        pred = data["data"]["prediction"]
        self.assertIn("delay_probability", pred)
        self.assertIn("expected_delay_minutes", pred)
        self.assertIn("risk_tier", pred)

        # Verify explainability and causality disclaimer
        expl = data["data"]["explanation"]
        self.assertIn("causality_disclaimer", expl)
        self.assertIn("attributions", expl)
        self.assertGreater(len(expl["attributions"]), 0)

        # Test Baseline Model selection
        payload["model_type"] = "baseline"
        res_baseline = self.client.post("/api/predict/flight", json=payload)
        self.assertEqual(res_baseline.status_code, 200)
        data_base = json.loads(res_baseline.data)
        self.assertEqual(data_base["data"]["prediction"]["model_type"], "baseline")

    def test_05_model_comparison_api(self):
        """Verifies that /api/model/compare exposes side-by-side metrics and selected model."""
        res = self.client.get("/api/model/compare")
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertTrue(data["success"])
        comp = data["data"]
        self.assertIn("baseline_model", comp)
        self.assertIn("candidate_model", comp)
        self.assertIn("class_distribution", comp)
        self.assertIn("tradeoff_explanation", comp)
        self.assertIn("selected_model_name", comp)
        self.assertEqual(comp["selected_model_key"], "baseline")

    def test_06_big_data_analytics_endpoints(self):
        """Tests analytics summary, carrier benchmarks, and corridors."""
        res = self.client.get("/api/analytics/summary")
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertTrue(data["success"])
        self.assertIn("total_carriers", data["data"])

        res_carriers = self.client.get("/api/analytics/carriers")
        self.assertEqual(res_carriers.status_code, 200)
        carriers_data = json.loads(res_carriers.data)
        self.assertTrue(carriers_data["success"])
        self.assertGreater(len(carriers_data["data"]), 0)

    def test_07_empty_dataset_handling(self):
        """Verifies pipeline handles completely empty dataframe with headers gracefully."""
        empty_df = pd.DataFrame(columns=["origin", "dest", "scheduled_dep_time", "arr_delay_minutes"])
        clean_df, report = self.pipeline.validate_and_clean(empty_df, source_name="Empty Test")
        self.assertEqual(report["total_input_records"], 0)
        self.assertEqual(report["valid_records"], 0)
        self.assertEqual(report["rejected_records"], 0)
        self.assertEqual(report["acceptance_rate_pct"], 0.0)
        self.assertTrue(clean_df.empty)

    def test_08_missing_mandatory_columns_error(self):
        """Verifies pipeline raises ValueError when mandatory schema columns are absent."""
        corrupted_df = pd.DataFrame([{"random_col_1": 123, "random_col_2": "test"}])
        with self.assertRaises(ValueError) as ctx:
            self.pipeline.validate_and_clean(corrupted_df)
        self.assertIn("Missing mandatory columns", str(ctx.exception))

    def test_09_duplicate_records_detection(self):
        """Verifies duplicate flight records in the same schedule slot are deduplicated."""
        dup_data = pd.DataFrame([
            {
                "flight_id": "DL999",
                "flight_date": "2024-06-15",
                "carrier_code": "DL",
                "origin": "ATL",
                "dest": "LAX",
                "scheduled_dep_time": "14:30",
                "distance_miles": 1946.0,
                "arr_delay_minutes": 10.0,
            },
            {
                "flight_id": "DL999",
                "flight_date": "2024-06-15",
                "carrier_code": "DL",
                "origin": "ATL",
                "dest": "LAX",
                "scheduled_dep_time": "14:30",
                "distance_miles": 1946.0,
                "arr_delay_minutes": 10.0,
            }
        ])
        clean_df, report = self.pipeline.validate_and_clean(dup_data)
        self.assertEqual(report["total_input_records"], 2)
        self.assertEqual(report["valid_records"], 1)
        self.assertEqual(report["rejected_records"], 1)
        self.assertEqual(report["rejection_breakdown"]["duplicate_flight_record"], 1)

    def test_10_dynamic_delay_threshold_retraining(self):
        """Verifies model retrains with dynamic delay threshold and updates comparison metadata."""
        res = self.client.post("/api/model/retrain", json={"delay_threshold_minutes": 30})
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertTrue(data["success"])
        self.assertEqual(data["data"]["delay_threshold_minutes"], 30)
        self.assertIn("candidate_model", data["data"])
        self.assertIn("baseline_model", data["data"])

        # Reset back to standard 15 min threshold
        res_reset = self.client.post("/api/model/retrain", json={"delay_threshold_minutes": 15})
        self.assertEqual(res_reset.status_code, 200)
        data_reset = json.loads(res_reset.data)
        self.assertEqual(data_reset["data"]["delay_threshold_minutes"], 15)

if __name__ == "__main__":
    unittest.main()
