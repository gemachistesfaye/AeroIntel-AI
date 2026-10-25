import sys
import json
import io
from pathlib import Path
import unittest

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.main import create_app
from app.core.config import settings

class EndToEndUserJourneyVerification(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.client = cls.app.test_client()

    def test_complete_user_journey(self):
        print("\n" + "=" * 70)
        print("EXECUTING END-TO-END USER JOURNEY VERIFICATION (10 WORKFLOW STEPS)")
        print("=" * 70)

        # Step 1: Open the dashboard
        print("\n[Step 1] Loading Mission Operations Dashboard...")
        res = self.client.get("/api/dashboard/summary")
        self.assertEqual(res.status_code, 200)
        dash = json.loads(res.data)
        self.assertTrue(dash["success"])
        self.assertGreater(dash["data"]["total_flights"], 0)
        print(f"  -> Dashboard loaded: {dash['data']['total_flights']} total flights, {dash['data']['on_time_rate_pct']}% on-time rate.")

        # Step 2: Upload a valid flight CSV
        print("\n[Step 2] Uploading a valid flight CSV via /api/data/upload...")
        sample_csv_content = (
            "flight_id,flight_date,carrier_code,origin,dest,scheduled_dep_time,distance_miles,arr_delay_minutes,origin_weather\n"
            "DL501,2024-07-10,DL,ATL,LAX,14:30,1946,35.0,Thunderstorm\n"
            "UA502,2024-07-10,UA,ORD,SFO,09:15,1846,-5.0,Clear\n"
            "AA503,2024-07-10,AA,DFW,MIA,16:00,1121,18.0,Light Rain\n"
            "B6504,2024-07-10,B6,JFK,BOS,11:30,187,0.0,Clear\n"
        )
        data = {
            "file": (io.BytesIO(sample_csv_content.encode("utf-8")), "e2e_test_upload.csv")
        }
        res_upload = self.client.post("/api/data/upload", data=data, content_type="multipart/form-data")
        self.assertEqual(res_upload.status_code, 200)
        upload_resp = json.loads(res_upload.data)
        self.assertTrue(upload_resp["success"])
        self.assertEqual(upload_resp["file_name"], "e2e_test_upload.csv")
        print(f"  -> CSV uploaded successfully: {upload_resp['file_name']}")

        # Step 3: View the ingestion and data-quality report
        print("\n[Step 3] Inspecting Data Ingestion Quality Audit Report...")
        report = upload_resp["quality_report"]
        self.assertEqual(report["total_input_records"], 4)
        self.assertEqual(report["valid_records"], 4)
        self.assertEqual(report["rejected_records"], 0)
        self.assertEqual(report["acceptance_rate_pct"], 100.0)
        print(f"  -> Quality audit verified: 4/4 valid records ({report['acceptance_rate_pct']}% acceptance).")

        # Step 4: Activate or select the processed dataset
        print("\n[Step 4] Ingesting and activating dataset into platform memory...")
        res_ingest = self.client.post("/api/data/ingest", json={"file_name": "e2e_test_upload.csv"})
        self.assertEqual(res_ingest.status_code, 200)
        ingest_data = json.loads(res_ingest.data)
        self.assertTrue(ingest_data["success"])
        self.assertEqual(ingest_data["records"], 4)
        print(f"  -> Dataset activated: {ingest_data['records']} active records.")

        # Step 5: View airline, airport, and route analytics
        print("\n[Step 5] Querying Carrier, Corridor, and Hub Analytics...")
        res_summary = self.client.get("/api/analytics/summary")
        self.assertEqual(res_summary.status_code, 200)
        summary_data = json.loads(res_summary.data)["data"]
        print(f"  -> Total carriers: {summary_data['total_carriers']}, total corridors: {summary_data['total_corridors']}")

        res_route = self.client.get("/api/route-intelligence")
        self.assertEqual(res_route.status_code, 200)
        route_data = json.loads(res_route.data)["data"]
        self.assertIn("corridors", route_data)
        self.assertIn("hubs", route_data)
        print(f"  -> Corridors evaluated: {len(route_data['corridors'])}, Hubs evaluated: {len(route_data['hubs'])}")

        # Step 6: Enter pre-departure flight information
        print("\n[Step 6] Entering Pre-Departure Flight Parameters...")
        flight_input = {
            "carrier_code": "DL",
            "origin": "ATL",
            "dest": "LAX",
            "dep_hour": 17,
            "dep_minute": 30,
            "day_of_week": 4, # Friday
            "month": 7,
            "origin_weather": "Thunderstorm",
            "dest_weather": "Clear",
            "wind_speed_knots": 28.0,
            "visibility_miles": 4.5,
            "precipitation_mm": 12.0,
            "congestion_level": "Severe",
            "taxi_out_minutes": 32.0,
            "distance_miles": 1946.0,
            "model_type": "candidate"
        }
        print(f"  -> Flight: DL ATL->LAX at 17:30, Thunderstorm, 28kt winds, taxi 32m.")

        # Step 7: Generate a delay-risk prediction
        print("\n[Step 7] Generating AI Delay-Risk Prediction...")
        res_pred = self.client.post("/api/predict/flight", json=flight_input)
        self.assertEqual(res_pred.status_code, 200)
        pred_data = json.loads(res_pred.data)["data"]
        pred = pred_data["prediction"]
        self.assertIn("delay_probability", pred)
        self.assertIn("risk_tier", pred)
        self.assertIn("expected_delay_minutes", pred)
        print(f"  -> Delay Probability: {pred['delay_probability_pct']}% | Risk Tier: {pred['risk_tier']} | Expected Delay: +{pred['expected_delay_minutes']}m")

        # Step 8: Submit invalid prediction inputs and confirm appropriate errors
        print("\n[Step 8] Submitting Invalid Prediction Inputs & Confirming Error Handling...")
        # Invalid departure hour (99)
        res_bad_hour = self.client.post("/api/predict/flight", json={"dep_hour": 99, "origin": "ATL", "dest": "LAX"})
        self.assertEqual(res_bad_hour.status_code, 400)
        bad_hour_json = json.loads(res_bad_hour.data)
        self.assertFalse(bad_hour_json["success"])
        self.assertIn("Departure hour must be between 0 and 23", bad_hour_json["error"])
        print("  -> Passed: Invalid departure hour correctly rejected with 400 Bad Request.")

        # Identical origin and destination (SFO -> SFO)
        res_bad_route = self.client.post("/api/predict/flight", json={"origin": "SFO", "dest": "SFO"})
        self.assertEqual(res_bad_route.status_code, 400)
        bad_route_json = json.loads(res_bad_route.data)
        self.assertFalse(bad_route_json["success"])
        self.assertIn("cannot be identical", bad_route_json["error"])
        print("  -> Passed: Identical origin and destination correctly rejected with 400 Bad Request.")

        # Inspect explanation & causality disclaimer
        expl = pred_data["explanation"]
        self.assertIn("attributions", expl)
        self.assertIn("causality_disclaimer", expl)
        self.assertGreater(len(expl["attributions"]), 0)
        print(f"  -> Explanation verified: {len(expl['attributions'])} attributions analyzed with regulatory disclaimer.")

        # Step 9: Compare baseline and candidate models
        print("\n[Step 9] Comparing Baseline (LogisticRegression) vs Candidate (HistGradientBoosting)...")
        res_comp = self.client.get("/api/model/compare")
        self.assertEqual(res_comp.status_code, 200)
        comp = json.loads(res_comp.data)["data"]
        self.assertIn("baseline_model", comp)
        self.assertIn("candidate_model", comp)
        b_acc = comp["baseline_model"]["accuracy"]
        c_acc = comp["candidate_model"]["accuracy"]
        print(f"  -> Baseline Accuracy: {b_acc:.2%}, ROC-AUC: {comp['baseline_model']['roc_auc']:.3f}")
        print(f"  -> Candidate Accuracy: {c_acc:.2%}, ROC-AUC: {comp['candidate_model']['roc_auc']:.3f}")

        # Step 10: Change delay threshold and confirm displayed metrics update
        print("\n[Step 10] Testing Dynamic Threshold Retraining (30 minutes vs 15 minutes)...")
        # First regenerate full benchmark dataset to evaluate on 1,250 rows
        self.client.post("/api/data/regenerate")
        res_retrain30 = self.client.post("/api/model/retrain", json={"delay_threshold_minutes": 30})
        self.assertEqual(res_retrain30.status_code, 200)
        retrain_data = json.loads(res_retrain30.data)["data"]
        self.assertEqual(retrain_data["delay_threshold_minutes"], 30)
        print(f"  -> Successfully re-evaluated models with 30-min threshold (Class Dist: {retrain_data['class_distribution']['delayed_count']} delayed).")

        # Restore platform standard 15 min threshold
        print("\nRestoring benchmark 15-min threshold...")
        res_retrain15 = self.client.post("/api/model/retrain", json={"delay_threshold_minutes": 15})
        self.assertEqual(res_retrain15.status_code, 200)
        print("  -> Benchmark dataset calibrated with standard 15-min threshold.")
        print("\n" + "=" * 70)
        print("ALL 10 END-TO-END WORKFLOW STEPS VERIFIED SUCCESSFULLY!")
        print("=" * 70)

if __name__ == "__main__":
    unittest.main()
