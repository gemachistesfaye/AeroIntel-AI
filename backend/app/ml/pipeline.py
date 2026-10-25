import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.pipeline import Pipeline

# Pre-departure numeric features strictly available BEFORE flight departs
NUMERICAL_PRE_DEPARTURE_FEATURES = [
    "dep_hour",
    "dep_hour_sin",
    "dep_hour_cos",
    "dep_minute",
    "day_of_week",
    "month",
    "distance_miles",
    "taxi_out_minutes",          # Airport baseline scheduled runway taxi buffer
    "wind_speed_knots",          # Terminal aerodrome surface wind forecast
    "visibility_miles",          # Terminal visibility forecast
    "precipitation_mm",          # Terminal precipitation forecast
    "historical_carrier_delay_rate" # Historical punctuality rate prior to departure
]

# Pre-departure categorical features
CATEGORICAL_PRE_DEPARTURE_FEATURES = [
    "carrier_code",
    "origin",
    "dest",
    "origin_weather",
    "dest_weather",
    "congestion_level"
]

# TARGET LEAKAGE BLOCKLIST: Features measured AFTER departure or arrival that MUST NEVER be fed to model
LEAKAGE_BLOCKLIST = [
    "arr_delay_minutes",
    "arr_delay",
    "dep_delay_minutes",
    "dep_delay",
    "actual_dep_time",
    "actual_arr_time",
    "dep_time",
    "arr_time",
    "air_time_minutes",
    "air_time",
    "actual_elapsed_time",
    "delay_cause",
    "is_delayed",
    "delay_risk_tier",
    "dataset_label",
    "is_cancelled",
    "cancelled",
    "cancellation_code",
    "is_diverted",
    "diverted",
    "carrier_delay",
    "weather_delay",
    "nas_delay",
    "security_delay",
    "late_aircraft_delay",
    "taxi_in",
    "taxi_in_minutes"
]

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Computes derived temporal features without any future target leakage.
    Transforms scheduled departure time into continuous cyclical sin/cos coordinates.
    """
    df_copy = df.copy()

    # Cyclical hour encoding (smooth 24-hour cycle)
    if "dep_hour" in df_copy.columns:
        hours = df_copy["dep_hour"].astype(float)
        df_copy["dep_hour_sin"] = np.sin(2.0 * np.pi * hours / 24.0)
        df_copy["dep_hour_cos"] = np.cos(2.0 * np.pi * hours / 24.0)
    else:
        df_copy["dep_hour_sin"] = 0.0
        df_copy["dep_hour_cos"] = 1.0

    if "dep_minute" not in df_copy.columns:
        df_copy["dep_minute"] = 0

    if "day_of_week" not in df_copy.columns:
        df_copy["day_of_week"] = 2

    if "month" not in df_copy.columns:
        df_copy["month"] = 6

    if "historical_carrier_delay_rate" not in df_copy.columns:
        df_copy["historical_carrier_delay_rate"] = 0.20

    return df_copy

def build_preprocessor() -> ColumnTransformer:
    """
    Builds a robust scikit-learn ColumnTransformer for pre-departure features.
    Handles unseen categories gracefully and scales continuous variables.
    """
    numeric_transformer = Pipeline(steps=[
        ("scaler", StandardScaler())
    ])

    categorical_transformer = Pipeline(steps=[
        ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
    ])

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numeric_transformer, NUMERICAL_PRE_DEPARTURE_FEATURES),
            ("cat", categorical_transformer, CATEGORICAL_PRE_DEPARTURE_FEATURES)
        ],
        remainder="drop" # Drops any unlisted columns (including target leakage columns)
    )
    return preprocessor
