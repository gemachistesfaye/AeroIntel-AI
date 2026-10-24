import json
from pathlib import Path
from typing import Dict, Any, List, Optional
import joblib
import pandas as pd
import numpy as np

from app.core.config import settings
from app.ml.pipeline import engineer_features
from app.ml.explainability import explainer

class AviationModelService:
    def __init__(self):
        self.candidate_pipeline = None
        self.baseline_pipeline = None
        self.reg_pipeline = None
        self.evaluation_comparison = None
        self.evaluation_metrics = None
        self._load_artifacts()

    def _load_artifacts(self):
        # 1. Candidate model (HistGradientBoosting)
        candidate_path = settings.ARTIFACTS_DIR / "candidate_gradient_boost.joblib"
        if candidate_path.exists():
            try:
                self.candidate_pipeline = joblib.load(candidate_path)
            except Exception as e:
                print(f"Error loading candidate model: {e}")
        elif settings.MODEL_PATH.exists():
            try:
                self.candidate_pipeline = joblib.load(settings.MODEL_PATH)
            except Exception as e:
                print(f"Error loading fallback model: {e}")

        # 2. Baseline model (Logistic Regression)
        baseline_path = settings.ARTIFACTS_DIR / "baseline_linear_model.joblib"
        if baseline_path.exists():
            try:
                self.baseline_pipeline = joblib.load(baseline_path)
            except Exception as e:
                print(f"Error loading baseline model: {e}")

        # 3. Regressor pipeline
        if settings.REGRESSOR_PATH.exists():
            try:
                self.reg_pipeline = joblib.load(settings.REGRESSOR_PATH)
            except Exception as e:
                print(f"Error loading regressor: {e}")

        # 4. Comparative metadata
        comparison_path = settings.ARTIFACTS_DIR / "evaluation_comparison.json"
        if comparison_path.exists():
            try:
                with open(comparison_path, "r") as f:
                    self.evaluation_comparison = json.load(f)
            except Exception as e:
                print(f"Error loading evaluation comparison: {e}")

        # 5. Legacy metrics
        if settings.METRICS_PATH.exists():
            try:
                with open(settings.METRICS_PATH, "r") as f:
                    self.evaluation_metrics = json.load(f)
            except Exception as e:
                print(f"Error loading legacy metrics: {e}")

    @property
    def is_ready(self) -> bool:
        return self.candidate_pipeline is not None or self.baseline_pipeline is not None

    def get_comparison_metrics(self) -> Dict[str, Any]:
        if not self.evaluation_comparison:
            self._load_artifacts()
        return self.evaluation_comparison or {}

    def predict_flight_delay(
        self,
        flight_input: Dict[str, Any],
        model_type: str = "candidate"
    ) -> Dict[str, Any]:
        """
        Runs inference using the chosen Scikit-Learn pipeline (Candidate or Baseline).
        Strictly excludes any target leakage features.
        """
        if not self.is_ready:
            raise RuntimeError("Model pipelines have not been trained or loaded.")

        # Select pipeline
        if model_type.lower() == "baseline" and self.baseline_pipeline is not None:
            pipeline = self.baseline_pipeline
            model_name = "Baseline (Logistic Regression)"
            version = "1.0.0-linear-baseline"
        else:
            pipeline = self.candidate_pipeline or self.baseline_pipeline
            model_name = "Candidate (HistGradientBoosting)"
            version = "2.0.0-gradient-boost"

        # Sanitize and validate inputs
        raw_dict = {
            "carrier_code": str(flight_input.get("carrier_code", "DL")).strip().upper(),
            "origin": str(flight_input.get("origin", "ATL")).strip().upper(),
            "dest": str(flight_input.get("dest", "LAX")).strip().upper(),
            "dep_hour": int(flight_input.get("dep_hour", 14)),
            "dep_minute": int(flight_input.get("dep_minute", 0)),
            "day_of_week": int(flight_input.get("day_of_week", 2)),
            "month": int(flight_input.get("month", 6)),
            "distance_miles": float(flight_input.get("distance_miles", 1200.0)),
            "taxi_out_minutes": float(flight_input.get("taxi_out_minutes", 16.0)),
            "origin_weather": str(flight_input.get("origin_weather", "Clear")).strip(),
            "dest_weather": str(flight_input.get("dest_weather", "Clear")).strip(),
            "wind_speed_knots": float(flight_input.get("wind_speed_knots", 12.0)),
            "visibility_miles": float(flight_input.get("visibility_miles", 10.0)),
            "precipitation_mm": float(flight_input.get("precipitation_mm", 0.0)),
            "congestion_level": str(flight_input.get("congestion_level", "Moderate")).strip(),
            "historical_carrier_delay_rate": float(flight_input.get("historical_carrier_delay_rate", 0.20))
        }

        # Convert to DataFrame and apply feature engineering
        df = pd.DataFrame([raw_dict])
        df_feat = engineer_features(df)

        # Real classification inference
        prob_array = pipeline.predict_proba(df_feat)
        delay_prob = float(prob_array[0][1])
        is_delayed_pred = bool(delay_prob >= 0.50)

        # Real regression inference (predicted arrival delay minutes)
        if self.reg_pipeline is not None:
            pred_delay_minutes = float(self.reg_pipeline.predict(df_feat)[0])
            if delay_prob < 0.25 and pred_delay_minutes > 15:
                pred_delay_minutes = float(np.clip(pred_delay_minutes * 0.35, -5, 14))
        else:
            pred_delay_minutes = 25.0 if is_delayed_pred else -4.0

        # Risk Classification Tier
        if delay_prob >= 0.65 or pred_delay_minutes >= 45:
            risk_tier = "Severe Risk"
            risk_color = "#ef4444"
        elif delay_prob >= 0.45 or pred_delay_minutes >= 25:
            risk_tier = "High Risk"
            risk_color = "#f97316"
        elif delay_prob >= 0.25 or pred_delay_minutes >= 12:
            risk_tier = "Moderate Risk"
            risk_color = "#eab308"
        else:
            risk_tier = "Low Risk (On Time)"
            risk_color = "#10b981"

        confidence_score = round(1.0 - abs(0.50 - delay_prob), 2)

        # Feature Attribution & Explainability
        explanation = explainer.explain_instance(raw_dict, delay_prob, model_name)

        return {
            "flight_query": raw_dict,
            "prediction": {
                "model_type": model_type,
                "model_name": model_name,
                "model_version": version,
                "delay_probability": round(delay_prob, 4),
                "delay_probability_pct": round(delay_prob * 100, 1),
                "is_delayed_predicted": is_delayed_pred,
                "expected_delay_minutes": round(pred_delay_minutes, 1),
                "risk_tier": risk_tier,
                "risk_color": risk_color,
                "confidence_score": confidence_score,
                "delay_threshold_minutes": self.evaluation_comparison.get("delay_threshold_minutes", 15) if self.evaluation_comparison else 15
            },
            "explanation": explanation,
            "contributing_factors": [
                {
                    "factor": a["feature"],
                    "impact": a["direction"],
                    "score": int(a["impact_pct"]),
                    "description": a["description"]
                }
                for a in explanation["attributions"]
            ],
            "operational_recommendations": self._generate_recommendations(raw_dict, risk_tier)
        }

    def _generate_recommendations(self, data: Dict[str, Any], risk_tier: str) -> List[str]:
        recs = []
        if "Severe" in risk_tier:
            recs.append("Alert dispatch operations for impending Ground Delay Program (GDP) meter-fix holds.")
            recs.append(f"Consider requesting an earlier departure slot window before the {data['dep_hour']:02d}:00 rush.")
            recs.append("Increase contingency fuel reserves for potential en-route vectoring.")
        elif "High" in risk_tier:
            recs.append("Monitor destination terminal weather radar updates 90 minutes prior to pushback.")
            recs.append("Notify gate crew for expedited turnaround to maximize departure slot compliance.")
        else:
            recs.append("Proceed under standard flight dispatch schedule.")
            recs.append("Aerodrome arrival capacity operating under nominal VMC conditions.")
        return recs

model_service = AviationModelService()
