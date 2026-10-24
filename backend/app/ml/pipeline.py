import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.pipeline import Pipeline

NUMERICAL_FEATURES = [
    "dep_hour",
    "dep_hour_sin",
    "dep_hour_cos",
    "day_of_week",
    "month",
    "distance_miles",
    "air_time_minutes",
    "taxi_out_minutes",
    "wind_speed_knots",
    "visibility_miles",
    "precipitation_mm",
    "historical_carrier_delay_rate"
]

CATEGORICAL_FEATURES = [
    "carrier_code",
    "origin",
    "dest",
    "origin_weather",
    "dest_weather",
    "congestion_level"
]

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Computes derived aviation and temporal features."""
    df_copy = df.copy()
    
    # Cyclical hour encoding
    if "dep_hour" in df_copy.columns:
        hours = df_copy["dep_hour"].astype(float)
        df_copy["dep_hour_sin"] = np.sin(2 * np.pi * hours / 24.0)
        df_copy["dep_hour_cos"] = np.cos(2 * np.pi * hours / 24.0)
    else:
        df_copy["dep_hour_sin"] = 0.0
        df_copy["dep_hour_cos"] = 1.0
        
    return df_copy

def build_preprocessor() -> ColumnTransformer:
    """Builds a scikit-learn ColumnTransformer for aviation features."""
    numeric_transformer = Pipeline(steps=[
        ("scaler", StandardScaler())
    ])
    
    categorical_transformer = Pipeline(steps=[
        ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
    ])
    
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numeric_transformer, NUMERICAL_FEATURES),
            ("cat", categorical_transformer, CATEGORICAL_FEATURES)
        ],
        remainder="drop"
    )
    return preprocessor
