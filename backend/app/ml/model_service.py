import json
from pathlib import Path
from typing import Dict, Any, List
import joblib
import pandas as pd
import numpy as np

from app.core.config import settings
from app.ml.pipeline import engineer_features

class AviationModelService:
    def __init__(self):
        self.clf_pipeline = None
        self.reg_pipeline = None
        self.evaluation_metrics = None
        self._load_artifacts()

    def _load_artifacts(self):
        if settings.MODEL_PATH.exists():
            try:
                self.clf_pipeline = joblib.load(settings.MODEL_PATH)
            except Exception as e:
                print(f"Error loading classifier: {e}")
                
        if settings.REGRESSOR_PATH.exists():
            try:
                self.reg_pipeline = joblib.load(settings.REGRESSOR_PATH)
            except Exception as e:
                print(f"Error loading regressor: {e}")
                
        if settings.METRICS_PATH.exists():
            try:
                with open(settings.METRICS_PATH, "r") as f:
                    self.evaluation_metrics = json.load(f)
            except Exception as e:
                print(f"Error loading evaluation metrics: {e}")

    @property
    def is_ready(self) -> bool:
        return self.clf_pipeline is not None and self.reg_pipeline is not None

    def predict_flight_delay(self, flight_input: Dict[str, Any]) -> Dict[str, Any]:
        """Runs inference using the real Scikit-Learn pipelines."""
        if not self.is_ready:
            raise RuntimeError("Model pipelines are not loaded or trained.")
            
        # Standardize payload into a DataFrame
        raw_dict = {
            "carrier_code": str(flight_input.get("carrier_code", "DL")).upper(),
            "origin": str(flight_input.get("origin", "ATL")).upper(),
            "dest": str(flight_input.get("dest", "LAX")).upper(),
            "dep_hour": int(flight_input.get("dep_hour", 14)),
            "dep_minute": int(flight_input.get("dep_minute", 0)),
            "day_of_week": int(flight_input.get("day_of_week", 2)),
            "month": int(flight_input.get("month", 6)),
            "distance_miles": float(flight_input.get("distance_miles", 1200.0)),
            "air_time_minutes": float(flight_input.get("air_time_minutes", 180.0)),
            "taxi_out_minutes": float(flight_input.get("taxi_out_minutes", 18.0)),
            "origin_weather": str(flight_input.get("origin_weather", "Clear")),
            "dest_weather": str(flight_input.get("dest_weather", "Clear")),
            "wind_speed_knots": float(flight_input.get("wind_speed_knots", 12.0)),
            "visibility_miles": float(flight_input.get("visibility_miles", 10.0)),
            "precipitation_mm": float(flight_input.get("precipitation_mm", 0.0)),
            "congestion_level": str(flight_input.get("congestion_level", "Moderate")),
            "historical_carrier_delay_rate": float(flight_input.get("historical_carrier_delay_rate", 0.19))
        }
        
        df = pd.DataFrame([raw_dict])
        df_feat = engineer_features(df)
        
        # Real inference from Random Forest Classifier
        prob_array = self.clf_pipeline.predict_proba(df_feat)
        delay_prob = float(prob_array[0][1])
        is_delayed_pred = bool(delay_prob >= 0.5)
        
        # Real inference from Random Forest Regressor
        pred_delay_minutes = float(self.reg_pipeline.predict(df_feat)[0])
        # If classifier predicts very low probability, clamp expected delay logically
        if delay_prob < 0.25 and pred_delay_minutes > 15:
            pred_delay_minutes = float(np.clip(pred_delay_minutes * 0.4, -5, 14))
            
        # Determine risk tier
        if delay_prob >= 0.65 or pred_delay_minutes >= 45:
            risk_tier = "Severe Risk"
            risk_color = "#ef4444" # red
        elif delay_prob >= 0.45 or pred_delay_minutes >= 25:
            risk_tier = "High Risk"
            risk_color = "#f97316" # orange
        elif delay_prob >= 0.25 or pred_delay_minutes >= 12:
            risk_tier = "Moderate Risk"
            risk_color = "#eab308" # yellow
        else:
            risk_tier = "Low Risk (On Time)"
            risk_color = "#10b981" # green
            
        # Explainability & Risk Attribution (computed dynamically from feature inputs)
        contributing_factors = self._compute_risk_factors(raw_dict, delay_prob)
        
        return {
            "flight_query": raw_dict,
            "prediction": {
                "delay_probability": round(delay_prob, 4),
                "delay_probability_pct": round(delay_prob * 100, 1),
                "is_delayed_predicted": is_delayed_pred,
                "expected_delay_minutes": round(pred_delay_minutes, 1),
                "risk_tier": risk_tier,
                "risk_color": risk_color,
                "confidence_score": round(1.0 - abs(0.5 - delay_prob), 2),
                "model_version": self.evaluation_metrics.get("model_version", "1.0.0-baseline") if self.evaluation_metrics else "1.0.0-baseline",
                "inference_engine": "Scikit-Learn RandomForest Pipeline (Operational Baseline)"
            },
            "contributing_factors": contributing_factors,
            "operational_recommendations": self._generate_recommendations(raw_dict, risk_tier, contributing_factors)
        }

    def _compute_risk_factors(self, data: Dict[str, Any], prob: float) -> List[Dict[str, Any]]:
        factors = []
        
        # Weather factor
        orig_w = data["origin_weather"]
        dest_w = data["dest_weather"]
        if orig_w in ["Thunderstorm", "Snow / Ice", "Heavy Rain", "Fog"]:
            factors.append({
                "factor": f"Adverse Origin Weather ({orig_w})",
                "impact": "High Negative Impact",
                "score": +32,
                "description": f"Terminal airspace experiencing {orig_w.lower()}, inducing ground delay programs (GDP)."
            })
        if dest_w in ["Thunderstorm", "Snow / Ice", "Heavy Rain", "Fog"]:
            factors.append({
                "factor": f"Adverse Destination Weather ({dest_w})",
                "impact": "High Negative Impact",
                "score": +28,
                "description": f"Arrival meter fixes throttled due to severe conditions at {data['dest']}."
            })
            
        # Surface Congestion & Taxi
        taxi = data["taxi_out_minutes"]
        if taxi > 25:
            factors.append({
                "factor": f"Elevated Taxi-Out Time ({taxi} min)",
                "impact": "Moderate Negative Impact",
                "score": +20,
                "description": "Ramp and runway departure queues significantly exceed nominal 14 min baseline."
            })
            
        # Wind dynamics
        wind = data["wind_speed_knots"]
        if wind > 25:
            factors.append({
                "factor": f"High Surface Crosswinds ({wind} kts)",
                "impact": "Moderate Negative Impact",
                "score": +15,
                "description": "Single-runway operations or spacing buffers activated by air traffic control."
            })
            
        # Time of day / rush hour
        dep_hour = data["dep_hour"]
        if 16 <= dep_hour <= 19:
            factors.append({
                "factor": f"Evening Peak Hub Congestion ({dep_hour:02d}:00)",
                "impact": "Minor Negative Impact",
                "score": +12,
                "description": "High volume arrival/departure banks competing for airspace slots."
            })
            
        # Positive mitigating factors
        if orig_w == "Clear" and dest_w == "Clear" and taxi <= 16 and wind <= 15:
            factors.append({
                "factor": "Optimal Terminal Clearances & Weather",
                "impact": "Positive Mitigating Factor",
                "score": -25,
                "description": "Both origin and destination terminals reporting unrestricted VFR conditions."
            })
            
        if not factors:
            factors.append({
                "factor": "Nominal Fleet Turnaround Schedule",
                "impact": "Neutral / Normal",
                "score": 0,
                "description": "Standard operating parameters within acceptable tolerances."
            })
            
        return factors

    def _generate_recommendations(self, data: Dict[str, Any], risk_tier: str, factors: List[Dict[str, Any]]) -> List[str]:
        recs = []
        if "Severe" in risk_tier or "High" in risk_tier:
            recs.append("Alert flight dispatch and gate operations for possible ground delay program (GDP) impact.")
            recs.append("Pre-calculate fuel diversion reserves if destination weather holds below minimums.")
            recs.append("Review slot swap options with domestic ATC coordination center.")
        else:
            recs.append("Proceed on standard dispatch schedule; monitor en-route wind shear bulletins.")
            recs.append("Normal turnaround sequence approved.")
        return recs

# Singleton instance
model_service = AviationModelService()
