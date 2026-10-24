import os
import json
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
import pandas as pd
import numpy as np

from app.core.config import settings

logger = logging.getLogger(__name__)

# Standard BTS TranStats to platform internal column mapping
BTS_COLUMN_MAPPING = {
    # Flight Identification
    "FL_DATE": "flight_date",
    "OP_UNIQUE_CARRIER": "carrier_code",
    "UNIQUE_CARRIER": "carrier_code",
    "OP_CARRIER_FL_NUM": "flight_number",
    "FL_NUM": "flight_number",
    "CARRIER_NAME": "carrier_name",
    # Route & Geography
    "ORIGIN": "origin",
    "ORIGIN_CITY_NAME": "origin_name",
    "DEST": "dest",
    "DEST_CITY_NAME": "dest_name",
    "DISTANCE": "distance_miles",
    # Scheduled Timing
    "CRS_DEP_TIME": "scheduled_dep_time",
    "DEP_TIME": "actual_dep_time",
    "CRS_ARR_TIME": "scheduled_arr_time",
    "ARR_TIME": "actual_arr_time",
    "CRS_ELAPSED_TIME": "scheduled_elapsed_time",
    "ACTUAL_ELAPSED_TIME": "air_time_minutes",
    # Delays & Targets
    "DEP_DELAY": "dep_delay_minutes",
    "ARR_DELAY": "arr_delay_minutes",
    "ARR_DEL15": "is_delayed",
    "CANCELLED": "is_cancelled",
    "DIVERTED": "is_diverted",
    # Delay Causes (BTS)
    "CARRIER_DELAY": "carrier_delay",
    "WEATHER_DELAY": "weather_delay",
    "NAS_DELAY": "nas_delay",
    "SECURITY_DELAY": "security_delay",
    "LATE_AIRCRAFT_DELAY": "late_aircraft_delay",
}

CARRIER_NAMES = {
    "DL": "Delta Air Lines",
    "UA": "United Airlines",
    "AA": "American Airlines",
    "WN": "Southwest Airlines",
    "B6": "JetBlue Airways",
    "AS": "Alaska Airlines",
    "NK": "Spirit Airlines",
    "F9": "Frontier Airlines",
}

AIRPORT_COORDINATES = {
    "ATL": (33.6407, -84.4277, "Hartsfield-Jackson Atlanta"),
    "ORD": (41.9742, -87.9073, "Chicago O'Hare"),
    "DFW": (32.8998, -97.0403, "Dallas/Fort Worth"),
    "DEN": (39.8561, -104.6737, "Denver International"),
    "JFK": (40.6413, -73.7781, "John F. Kennedy New York"),
    "LAX": (33.9416, -118.4085, "Los Angeles International"),
    "SFO": (37.6213, -122.3790, "San Francisco International"),
    "SEA": (47.4502, -122.3088, "Seattle-Tacoma International"),
    "MIA": (25.7959, -80.2870, "Miami International"),
    "BOS": (42.3656, -71.0096, "Boston Logan International"),
    "CLT": (35.2144, -80.9473, "Charlotte Douglas"),
    "PHX": (33.4373, -112.0078, "Phoenix Sky Harbor"),
}

def is_null_val(v: Any) -> bool:
    if v is None:
        return True
    if hasattr(v, "empty") and v.empty:
        return True
    if hasattr(v, "iloc"):
        return len(v) == 0 or bool(pd.isna(v).all())
    if isinstance(v, (list, tuple, np.ndarray)):
        return len(v) == 0 or bool(pd.isna(v).all())
    try:
        return bool(pd.isna(v))
    except Exception:
        return False

def to_scalar_float(v: Any, default: float = 0.0) -> float:
    if is_null_val(v):
        return default
    if hasattr(v, "iloc"):
        v = v.iloc[0] if len(v) > 0 else default
    elif isinstance(v, (list, tuple, np.ndarray)):
        v = v[0] if len(v) > 0 else default
    try:
        return float(v)
    except (ValueError, TypeError):
        return default

def calculate_haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> int:
    R = 3958.8  # miles
    phi1, phi2 = np.radians(lat1), np.radians(lat2)
    dphi = np.radians(lat2 - lat1)
    dlam = np.radians(lon2 - lon1)
    a = np.sin(dphi / 2.0)**2 + np.cos(phi1) * np.cos(phi2) * np.sin(dlam / 2.0)**2
    c = 2.0 * np.arctan2(np.sqrt(a), np.sqrt(1.0 - a))
    return int(round(R * c))

class FlightDataIngestionPipeline:
    """
    Reusable data ingestion, validation, and cleaning pipeline for historical flight records.
    Handles both standard platform schema and official U.S. DOT BTS TranStats CSV formats.
    """

    def __init__(self, delay_threshold_minutes: int = 15):
        self.delay_threshold_minutes = delay_threshold_minutes
        self.quality_summary: Dict[str, Any] = {}

    def normalize_columns(self, df: pd.DataFrame) -> pd.DataFrame:
        """Standardizes input column headers across standard and BTS schemas."""
        rename_map = {}
        for col in df.columns:
            clean_col = str(col).strip().upper()
            if clean_col in BTS_COLUMN_MAPPING:
                rename_map[col] = BTS_COLUMN_MAPPING[clean_col]
            else:
                rename_map[col] = str(col).strip().lower()
        return df.rename(columns=rename_map)

    def parse_time_field(self, val: Any) -> Tuple[Optional[int], Optional[int], str]:
        """
        Parses scheduled departure time in HH:MM format or BTS integer format (e.g. 1430 -> 14, 30, '14:30').
        """
        if pd.isna(val):
            return None, None, "00:00"

        val_str = str(val).strip()
        # Case 1: HH:MM string
        if ":" in val_str:
            parts = val_str.split(":")
            try:
                hour = int(parts[0])
                minute = int(parts[1]) if len(parts) > 1 else 0
                if 0 <= hour <= 23 and 0 <= minute <= 59:
                    return hour, minute, f"{hour:02d}:{minute:02d}"
            except ValueError:
                pass

        # Case 2: Integer representation e.g. 815 -> 08:15, 1430 -> 14:30, 9 -> 00:09
        try:
            # Handle float strings like "1430.0"
            num_val = int(float(val_str))
            hour = num_val // 100
            minute = num_val % 100
            if 0 <= hour <= 23 and 0 <= minute <= 59:
                return hour, minute, f"{hour:02d}:{minute:02d}"
        except (ValueError, TypeError):
            pass

        return None, None, "00:00"

    def validate_and_clean(
        self,
        df: pd.DataFrame,
        source_name: str = "CSV Data Source"
    ) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Validates required columns, cleans values, filters corrupted rows, and computes quality metrics.
        """
        total_input_records = len(df)
        rejection_counts = {
            "missing_carrier_or_route": 0,
            "same_origin_and_dest": 0,
            "invalid_departure_time": 0,
            "invalid_negative_distance": 0,
            "missing_delay_ground_truth": 0,
            "duplicate_flight_record": 0,
        }

        df_norm = self.normalize_columns(df)

        # Ensure minimal required columns exist
        required_cols = ["origin", "dest"]
        missing_req = [c for c in required_cols if c not in df_norm.columns]
        if missing_req:
            raise ValueError(
                f"Invalid dataset schema. Missing mandatory columns: {missing_req}. "
                f"Found columns: {list(df_norm.columns)}"
            )

        valid_rows = []
        seen_keys = set()

        for idx, row in df_norm.iterrows():
            orig = str(row.get("origin", "")).strip().upper()
            dest = str(row.get("dest", "")).strip().upper()
            carrier = str(row.get("carrier_code", "UNK")).strip().upper()

            # Rule 1: Valid carrier and airport codes
            if not orig or not dest or len(orig) < 2 or len(dest) < 2:
                rejection_counts["missing_carrier_or_route"] += 1
                continue

            # Rule 2: Origin and Destination must differ
            if orig == dest:
                rejection_counts["same_origin_and_dest"] += 1
                continue

            # Rule 3: Valid scheduled departure time
            time_val = row.get("scheduled_dep_time")
            if pd.isna(time_val) and "dep_hour" in row:
                try:
                    dep_hour = int(row["dep_hour"])
                    dep_min = int(row.get("dep_minute", 0))
                    sched_time_str = f"{dep_hour:02d}:{dep_min:02d}"
                except:
                    dep_hour, dep_min, sched_time_str = None, None, ""
            else:
                dep_hour, dep_min, sched_time_str = self.parse_time_field(time_val)

            if dep_hour is None:
                rejection_counts["invalid_departure_time"] += 1
                continue

            # Rule 4: Distance check
            dist = row.get("distance_miles")
            if pd.notna(dist):
                try:
                    dist = float(dist)
                    if dist <= 0:
                        rejection_counts["invalid_negative_distance"] += 1
                        continue
                except ValueError:
                    dist = None
            if dist is None or pd.isna(dist):
                # Fallback to Haversine calculation if coordinates exist
                if orig in AIRPORT_COORDINATES and dest in AIRPORT_COORDINATES:
                    c1, c2 = AIRPORT_COORDINATES[orig], AIRPORT_COORDINATES[dest]
                    dist = calculate_haversine(c1[0], c1[1], c2[0], c2[1])
                else:
                    dist = 750.0  # Default regional distance

            # Rule 5: Arrival delay ground truth check
            arr_delay = row.get("arr_delay_minutes")
            if is_null_val(arr_delay):
                arr_delay = row.get("arr_delay")

            has_is_delayed = "is_delayed" in row and not is_null_val(row.get("is_delayed"))
            if is_null_val(arr_delay) and not has_is_delayed:
                rejection_counts["missing_delay_ground_truth"] += 1
                continue

            arr_delay_min = to_scalar_float(arr_delay, default=0.0)

            # Compute Target Variable based on configurable threshold
            if has_is_delayed:
                is_delayed = int(to_scalar_float(row.get("is_delayed"), default=0.0))
            else:
                is_delayed = 1 if arr_delay_min >= self.delay_threshold_minutes else 0

            # Rule 6: Duplicate detection (Flight + Date/Schedule)
            fl_id = str(row.get("flight_id", "")).strip().upper()
            if not fl_id:
                fl_num = str(row.get("flight_number", idx + 100)).strip()
                fl_id = f"{carrier}{fl_num}"

            fl_date = str(row.get("flight_date", "2024-01-01")).strip()
            dedup_key = f"{fl_id}_{fl_date}_{orig}_{dest}_{dep_hour}_{dep_min}"
            if dedup_key in seen_keys:
                rejection_counts["duplicate_flight_record"] += 1
                continue
            seen_keys.add(dedup_key)

            # Atmospheric & Airport parameters (fill with robust domain defaults if missing)
            wind_speed = float(row.get("wind_speed_knots", 12.0)) if pd.notna(row.get("wind_speed_knots")) else 12.0
            visibility = float(row.get("visibility_miles", 10.0)) if pd.notna(row.get("visibility_miles")) else 10.0
            precip = float(row.get("precipitation_mm", 0.0)) if pd.notna(row.get("precipitation_mm")) else 0.0
            orig_weather = str(row.get("origin_weather", "Clear")).strip()
            dest_weather = str(row.get("dest_weather", "Clear")).strip()
            congestion = str(row.get("congestion_level", "Moderate")).strip()
            taxi_out = float(row.get("taxi_out_minutes", 18.0)) if pd.notna(row.get("taxi_out_minutes")) else 18.0
            carrier_delay_rate = float(row.get("historical_carrier_delay_rate", 0.20)) if pd.notna(row.get("historical_carrier_delay_rate")) else 0.20

            # Date calendar features
            day_of_week = int(row.get("day_of_week", 2)) if pd.notna(row.get("day_of_week")) else 2
            month = int(row.get("month", 6)) if pd.notna(row.get("month")) else 6

            # Determine qualitative delay cause
            delay_cause = str(row.get("delay_cause", ""))
            if not delay_cause or delay_cause == "nan":
                if is_delayed == 0:
                    delay_cause = "On Time"
                elif orig_weather in ["Thunderstorm", "Snow / Ice", "Heavy Rain"]:
                    delay_cause = "Weather"
                elif taxi_out > 26 or congestion in ["High", "Severe"]:
                    delay_cause = "Air Traffic Control (NAS)"
                else:
                    delay_cause = "Late Inbound Aircraft"

            risk_tier = "Low"
            if is_delayed == 1:
                if arr_delay_min >= 60:
                    risk_tier = "Severe"
                elif arr_delay_min >= 30:
                    risk_tier = "High"
                else:
                    risk_tier = "Moderate"

            carrier_name = CARRIER_NAMES.get(carrier, carrier)
            orig_name = AIRPORT_COORDINATES.get(orig, (0, 0, f"{orig} Airport"))[2]
            dest_name = AIRPORT_COORDINATES.get(dest, (0, 0, f"{dest} Airport"))[2]

            valid_rows.append({
                "flight_id": fl_id,
                "flight_date": fl_date,
                "carrier_code": carrier,
                "carrier_name": carrier_name,
                "origin": orig,
                "origin_name": orig_name,
                "dest": dest,
                "dest_name": dest_name,
                "route": f"{orig} -> {dest}",
                "distance_miles": round(dist, 1),
                "scheduled_dep_time": sched_time_str,
                "dep_hour": dep_hour,
                "dep_minute": dep_min,
                "day_of_week": day_of_week,
                "month": month,
                "origin_weather": orig_weather,
                "dest_weather": dest_weather,
                "wind_speed_knots": round(wind_speed, 1),
                "visibility_miles": round(visibility, 1),
                "precipitation_mm": round(precip, 2),
                "congestion_level": congestion,
                "taxi_out_minutes": round(taxi_out, 1),
                "historical_carrier_delay_rate": round(carrier_delay_rate, 2),
                "arr_delay_minutes": round(arr_delay_min, 1),
                "is_delayed": is_delayed,
                "delay_cause": delay_cause,
                "delay_risk_tier": risk_tier,
                "dataset_label": "HISTORICAL_INGESTED"
            })

        clean_df = pd.DataFrame(valid_rows)
        valid_records = len(clean_df)
        rejected_records = sum(rejection_counts.values())

        quality_report = {
            "source_name": source_name,
            "delay_threshold_minutes": self.delay_threshold_minutes,
            "total_input_records": total_input_records,
            "valid_records": valid_records,
            "rejected_records": rejected_records,
            "acceptance_rate_pct": round((valid_records / total_input_records * 100), 1) if total_input_records > 0 else 0.0,
            "rejection_breakdown": rejection_counts,
            "clean_features_count": len(clean_df.columns) if not clean_df.empty else 0,
            "class_distribution": {
                "on_time_count": int((clean_df["is_delayed"] == 0).sum()) if not clean_df.empty else 0,
                "delayed_count": int((clean_df["is_delayed"] == 1).sum()) if not clean_df.empty else 0,
                "delay_rate_pct": round(float(clean_df["is_delayed"].mean() * 100), 1) if not clean_df.empty else 0.0
            }
        }
        self.quality_summary = quality_report
        return clean_df, quality_report

    def ingest_from_csv(self, file_path: Path) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """Loads and cleans a CSV file, saving the clean dataset and quality summary to disk."""
        if not file_path.exists():
            raise FileNotFoundError(f"Source file does not exist: {file_path}")

        logger.info(f"Ingesting flight data from {file_path}...")
        raw_df = pd.read_csv(file_path, low_memory=False)
        clean_df, report = self.validate_and_clean(raw_df, source_name=file_path.name)

        # Save to processed destinations
        output_csv = settings.DATA_PATH
        clean_df.to_csv(output_csv, index=False)

        # Save quality report JSON
        report_path = settings.DATA_DIR / "data_quality_report.json"
        with open(report_path, "w") as f:
            json.dump(report, f, indent=2)

        return clean_df, report

# Global pipeline instance
ingestion_pipeline = FlightDataIngestionPipeline()
