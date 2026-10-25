import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.pipeline import Pipeline

from app.ml.leakage_policy import (
    LeakagePolicyEnforcer,
    PredictionTask,
    UNIVERSAL_LEAKAGE_FIELDS,
    PRE_DEPARTURE_NUMERIC_FEATURES,
    PRE_DEPARTURE_CATEGORICAL_FEATURES
)

# Export for backwards compatibility
NUMERICAL_PRE_DEPARTURE_FEATURES = PRE_DEPARTURE_NUMERIC_FEATURES
CATEGORICAL_PRE_DEPARTURE_FEATURES = PRE_DEPARTURE_CATEGORICAL_FEATURES
LEAKAGE_BLOCKLIST = sorted(list(UNIVERSAL_LEAKAGE_FIELDS))


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

    if "scheduled_elapsed_time" not in df_copy.columns:
        df_copy["scheduled_elapsed_time"] = 120.0

    if "taxi_out_minutes" not in df_copy.columns:
        df_copy["taxi_out_minutes"] = 16.0

    if "historical_carrier_delay_rate" not in df_copy.columns:
        df_copy["historical_carrier_delay_rate"] = 0.20

    if "wind_speed_knots" not in df_copy.columns:
        df_copy["wind_speed_knots"] = 12.0

    if "visibility_miles" not in df_copy.columns:
        df_copy["visibility_miles"] = 10.0

    if "precipitation_mm" not in df_copy.columns:
        df_copy["precipitation_mm"] = 0.0

    return df_copy


def build_preprocessor(task: PredictionTask = PredictionTask.ARRIVAL_DELAY_CLASSIFICATION) -> ColumnTransformer:
    """
    Builds a robust scikit-learn ColumnTransformer for pre-departure features.
    Handles unseen categories gracefully, scales continuous variables,
    and drops any unlisted or target leakage columns.
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
        remainder="drop"  # Drops any unlisted columns (including target leakage columns)
    )
    return preprocessor
