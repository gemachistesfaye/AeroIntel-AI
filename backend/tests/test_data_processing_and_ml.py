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

    def test_11_input_resilience_and_probability_bounds(self):
        """Verifies prediction probabilities remain strictly bounded in [0, 1] and handles missing/unexpected features."""
        # Test extreme severe conditions
        severe_input = {
            "carrier_code": "DL", "origin": "ATL", "dest": "ORD",
            "dep_hour": 18, "origin_weather": "Thunderstorm",
            "wind_speed_knots": 45.0, "taxi_out_minutes": 50.0,
            "congestion_level": "Severe", "unexpected_extra_param": "should_be_ignored"
        }
        res_severe = self.client.post("/api/predict/flight", json=severe_input)
        self.assertEqual(res_severe.status_code, 200)
        prob_severe = json.loads(res_severe.data)["data"]["prediction"]["delay_probability"]
        self.assertTrue(0.0 <= prob_severe <= 1.0, f"Probability out of bounds: {prob_severe}")
        self.assertGreater(prob_severe, 0.40)

        # Test benign calm conditions
        calm_input = {
            "carrier_code": "UA", "origin": "DEN", "dest": "SFO",
            "dep_hour": 8, "origin_weather": "Clear",
            "wind_speed_knots": 4.0, "taxi_out_minutes": 10.0,
            "congestion_level": "Low"
        }
        res_calm = self.client.post("/api/predict/flight", json=calm_input)
        self.assertEqual(res_calm.status_code, 200)
        prob_calm = json.loads(res_calm.data)["data"]["prediction"]["delay_probability"]
        self.assertTrue(0.0 <= prob_calm <= 1.0, f"Probability out of bounds: {prob_calm}")
        self.assertLess(prob_calm, prob_severe)

        # Test minimal payload with missing/None optional fields
        sparse_input = {"origin": "JFK", "dest": "MIA", "dep_hour": None, "wind_speed_knots": None}
        res_sparse = self.client.post("/api/predict/flight", json=sparse_input)
        self.assertEqual(res_sparse.status_code, 200)
        prob_sparse = json.loads(res_sparse.data)["data"]["prediction"]["delay_probability"]
        self.assertTrue(0.0 <= prob_sparse <= 1.0)

    def test_12_bts_column_mapping_and_airport_id_resolution(self):
        """Verifies configurable schema mapping for official BTS TranStats fields and numeric Airport IDs."""
        bts_raw = pd.DataFrame([
            {
                "FL_DATE": "2024-05-12",
                "OP_UNIQUE_CARRIER": "AA",
                "OP_CARRIER_FL_NUM": "1234",
                "ORIGIN_AIRPORT_ID": 10397, # ATL
                "DEST_AIRPORT_ID": 13930,   # ORD
                "CRS_DEP_TIME": 1430,      # Integer format 14:30
                "DISTANCE": 606.0,
                "ARR_DELAY": 22.0,
                "WEATHER_DELAY": 15.0,
                "NAS_DELAY": 7.0
            }
        ])
        clean_df, report = self.pipeline.validate_and_clean(bts_raw, source_name="BTS Test")
        self.assertEqual(report["valid_records"], 1)
        row = clean_df.iloc[0]
        self.assertEqual(row["origin"], "ATL")
        self.assertEqual(row["dest"], "ORD")
        self.assertEqual(row["dep_hour"], 14)
        self.assertEqual(row["dep_minute"], 30)
        self.assertEqual(row["arr_delay_minutes"], 22.0)
        self.assertEqual(row["is_delayed"], 1)
        self.assertEqual(row["delay_cause"], "Weather")

    def test_13_cancellation_and_diversion_tracking(self):
        """Verifies cancelled and diverted flights are tracked in profiling rather than marked as corrupt."""
        mixed_data = pd.DataFrame([
            {
                "flight_id": "NORM1", "carrier_code": "DL", "origin": "ATL", "dest": "LAX",
                "scheduled_dep_time": "10:00", "distance_miles": 1946.0, "arr_delay": 0.0,
                "cancelled": 0, "diverted": 0
            },
            {
                "flight_id": "CANC1", "carrier_code": "DL", "origin": "ATL", "dest": "LAX",
                "scheduled_dep_time": "12:00", "distance_miles": 1946.0, "arr_delay": None,
                "cancelled": 1, "diverted": 0 # Cancelled: no arr_delay
            },
            {
                "flight_id": "DIV1", "carrier_code": "DL", "origin": "ATL", "dest": "LAX",
                "scheduled_dep_time": "15:00", "distance_miles": 1946.0, "arr_delay": None,
                "cancelled": 0, "diverted": 1 # Diverted: no arr_delay
            }
        ])
        clean_df, report = self.pipeline.validate_and_clean(mixed_data, source_name="Cancellation Test")
        self.assertEqual(report["total_input_records"], 3)
        self.assertEqual(report["valid_records"], 1) # Only completed flight is ingested into delay predictor
        self.assertEqual(report["cancellation_count"], 1)
        self.assertEqual(report["diversion_count"], 1)
        self.assertEqual(report["rejection_breakdown"]["cancelled_or_diverted_flight"], 2)

    def test_14_large_file_chunked_profiling_and_bts_zip(self):
        """Verifies streaming chunked profiling on large datasets and tests real BTS zip archive if present."""
        zip_path = Path(__file__).resolve().parent.parent.parent / "T_ONTIME_REPORTING_20261025_074607.zip"
        if zip_path.exists():
            profile = self.pipeline.profile_dataset(zip_path)
            self.assertEqual(profile["total_input_records"], 544003)
            self.assertIn("ORIGIN_AIRPORT_ID", profile["columns_detected"])
            self.assertGreater(profile["unique_origins_count"], 300)
            self.assertIn("Pandas Streaming Chunk Engine", profile["processing_engine"])

    def test_15_temporal_and_delay_causes_analytics(self):
        """Verifies temporal delay breakdowns and delay cause availability reporting."""
        res_temp = self.client.get("/api/analytics/temporal")
        self.assertEqual(res_temp.status_code, 200)
        temp_data = json.loads(res_temp.data)["data"]
        self.assertIn("by_month", temp_data)
        self.assertIn("by_weekday", temp_data)
        self.assertIn("by_departure_hour", temp_data)

        res_causes = self.client.get("/api/analytics/delay-causes")
        self.assertEqual(res_causes.status_code, 200)
        causes_data = json.loads(res_causes.data)["data"]
        self.assertIn("has_delay_causes", causes_data)

if __name__ == "__main__":
    unittest.main()
