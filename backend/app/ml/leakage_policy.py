"""
Centralized Target Leakage Prevention Policy for AeroIntel AI.

Defines strict separation between information available strictly PRIOR to departure
and post-departure/post-arrival operational outcomes and delay causes.
"""

from enum import Enum
from typing import List, Set, Dict, Any
import pandas as pd


class PredictionTask(str, Enum):
    ARRIVAL_DELAY_CLASSIFICATION = "arrival_delay_classification"      # Target: ArrDel15 >= 15 min
    DEPARTURE_DELAY_CLASSIFICATION = "departure_delay_classification"  # Target: DepDel15 >= 15 min
    ARRIVAL_DELAY_REGRESSION = "arrival_delay_regression"              # Target: ArrDelay (continuous)
    DEPARTURE_DELAY_REGRESSION = "departure_delay_regression"          # Target: DepDelay (continuous)


# Universal Post-Departure & Future Outcome Leakage Fields
# These fields MUST NEVER enter pre-departure model training or inference pipelines.
UNIVERSAL_LEAKAGE_FIELDS: Set[str] = {
    # Actual departure and arrival timestamps
    "dep_time",
    "actual_dep_time",
    "actual_departure",
    "arr_time",
    "actual_arr_time",
    "actual_arrival",
    
    # Departure delay outcomes
    "dep_delay",
    "dep_delay_minutes",
    "dep_delay_new",
    "dep_del15",
    "dep_delayed",
    
    # Arrival delay outcomes
    "arr_delay",
    "arr_delay_minutes",
    "arr_delay_new",
    "arr_del15",
    "is_delayed",
    "delay_15",
    
    # In-flight and turnaround operational outcomes
    "air_time",
    "air_time_minutes",
    "actual_elapsed_time",
    "elapsed_time",
    "wheels_off",
    "wheels_on",
    "taxi_in",
    "taxi_in_minutes",
    
    # Cancellations and diversions (post-schedule operational interventions)
    "cancelled",
    "is_cancelled",
    "canceled",
    "cancellation_code",
    "diverted",
    "is_diverted",
    
    # Post-flight delay cause categorizations (U.S. DOT BTS Form 234)
    "carrier_delay",
    "weather_delay",
    "nas_delay",
    "security_delay",
    "late_aircraft_delay",
    "delay_cause",
    "delay_reason",
    "delay_risk_tier",
    "dataset_label"
}


# Pre-Departure Whitelist: ONLY features strictly available before scheduled pushback
PRE_DEPARTURE_NUMERIC_FEATURES: List[str] = [
    "dep_hour",
    "dep_hour_sin",
    "dep_hour_cos",
    "dep_minute",
    "day_of_week",
    "month",
    "distance_miles",
    "scheduled_elapsed_time",
    "wind_speed_knots",
    "visibility_miles",
    "precipitation_mm",
    "taxi_out_minutes",
    "historical_carrier_delay_rate"
]

PRE_DEPARTURE_CATEGORICAL_FEATURES: List[str] = [
    "carrier_code",
    "origin",
    "dest",
    "origin_weather",
    "dest_weather",
    "congestion_level"
]


class LeakagePolicyEnforcer:
    """
    Enforces centralized target leakage prevention across all ML datasets and pipelines.
    """

    @classmethod
    def get_prohibited_features(cls, task: PredictionTask) -> Set[str]:
        """Returns the set of prohibited feature names for a given prediction task."""
        prohibited = set(UNIVERSAL_LEAKAGE_FIELDS)
        
        if task in [PredictionTask.DEPARTURE_DELAY_CLASSIFICATION, PredictionTask.DEPARTURE_DELAY_REGRESSION]:
            # For departure delay, arrival outcomes and delay causes are strictly prohibited
            prohibited.update({
                "arr_delay", "arr_delay_minutes", "arr_del15", "arr_time",
                "carrier_delay", "weather_delay", "nas_delay"
            })
        elif task in [PredictionTask.ARRIVAL_DELAY_CLASSIFICATION, PredictionTask.ARRIVAL_DELAY_REGRESSION]:
            # For pre-departure arrival prediction, both departure delays and arrival delays are prohibited
            prohibited.update({
                "dep_delay", "dep_delay_minutes", "dep_del15", "dep_time",
                "arr_delay", "arr_delay_minutes", "arr_del15", "arr_time"
            })
        return prohibited

    @classmethod
    def validate_features(cls, feature_names: List[str], task: PredictionTask) -> List[str]:
        """
        Validates a list of input feature names.
        Raises ValueError if any prohibited leakage feature is found.
        Returns the sanitized feature list.
        """
        prohibited = cls.get_prohibited_features(task)
        detected_leakage = [f for f in feature_names if f.lower() in prohibited]
        if detected_leakage:
            raise ValueError(
                f"Target leakage violation detected for task '{task.value}'. "
                f"Prohibited post-departure/outcome features present: {detected_leakage}. "
                f"These fields cannot be used as pre-departure inputs."
            )
        return feature_names

    @classmethod
    def sanitize_dataframe(cls, df: pd.DataFrame, task: PredictionTask) -> pd.DataFrame:
        """
        Removes any prohibited leakage columns from a dataframe prior to model training or scoring.
        """
        prohibited = cls.get_prohibited_features(task)
        clean_cols = [c for c in df.columns if c.lower() not in prohibited]
        return df[clean_cols].copy()

    @classmethod
    def get_target_column(cls, task: PredictionTask) -> str:
        """Returns the canonical target column name for a given prediction task."""
        if task == PredictionTask.DEPARTURE_DELAY_CLASSIFICATION:
            return "dep_del15"
        elif task == PredictionTask.ARRIVAL_DELAY_CLASSIFICATION:
            return "arr_del15"
        elif task == PredictionTask.DEPARTURE_DELAY_REGRESSION:
            return "dep_delay_minutes"
        elif task == PredictionTask.ARRIVAL_DELAY_REGRESSION:
            return "arr_delay_minutes"
        raise ValueError(f"Unknown task: {task}")

