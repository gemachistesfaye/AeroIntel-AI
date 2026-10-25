import os
import json
import time
import zipfile
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple, Union
import pandas as pd
import numpy as np

from app.core.config import settings

logger = logging.getLogger(__name__)

# Standard BTS TranStats to platform internal column mapping
BTS_COLUMN_MAPPING = {
    # Flight Identification
    "FL_DATE": "flight_date",
    "FLIGHT_DATE": "flight_date",
    "FLIGHTDATE": "flight_date",
    "DATE": "flight_date",
    "OP_UNIQUE_CARRIER": "carrier_code",
    "UNIQUE_CARRIER": "carrier_code",
    "OP_CARRIER": "carrier_code",
    "REPORTING_AIRLINE": "carrier_code",
    "DOT_ID_REPORTING_AIRLINE": "carrier_code",
    "CARRIER": "carrier_code",
    "AIRLINE": "carrier_code",
    "OP_CARRIER_FL_NUM": "flight_number",
    "FL_NUM": "flight_number",
    "FLIGHT_NUMBER": "flight_number",
    "CARRIER_NAME": "carrier_name",
    "AIRLINE_NAME": "carrier_name",
    # Route & Geography
    "ORIGIN": "origin",
    "ORIGIN_AIRPORT_ID": "origin_airport_id",
    "ORIGIN_AIRPORT_SEQ_ID": "origin_airport_seq_id",
    "ORIGIN_CITY_MARKET_ID": "origin_city_market_id",
    "ORIGIN_CITY_NAME": "origin_name",
    "DEST": "dest",
    "DEST_AIRPORT_ID": "dest_airport_id",
    "DEST_AIRPORT_SEQ_ID": "dest_airport_seq_id",
    "DEST_CITY_MARKET_ID": "dest_city_market_id",
    "DEST_CITY_NAME": "dest_name",
    "DISTANCE": "distance_miles",
    "DISTANCE_MILES": "distance_miles",
    # Scheduled Timing
    "CRS_DEP_TIME": "scheduled_dep_time",
    "SCHEDULED_DEP_TIME": "scheduled_dep_time",
    "DEP_TIME": "actual_dep_time",
    "ACTUAL_DEP_TIME": "actual_dep_time",
    "CRS_ARR_TIME": "scheduled_arr_time",
    "SCHEDULED_ARR_TIME": "scheduled_arr_time",
    "ARR_TIME": "actual_arr_time",
    "ACTUAL_ARR_TIME": "actual_arr_time",
    "CRS_ELAPSED_TIME": "scheduled_elapsed_time",
    "ACTUAL_ELAPSED_TIME": "air_time_minutes",
    "AIR_TIME": "air_time_minutes",
    # Delays & Targets
    "DEP_DELAY": "dep_delay_minutes",
    "DEP_DELAY_NEW": "dep_delay_minutes",
    "ARR_DELAY": "arr_delay_minutes",
    "ARR_DELAY_NEW": "arr_delay_minutes",
    "ARR_DEL15": "is_delayed",
    "IS_DELAYED": "is_delayed",
    "CANCELLED": "is_cancelled",
    "CANCELED": "is_cancelled",
    "IS_CANCELLED": "is_cancelled",
    "CANCELLATION_CODE": "cancellation_code",
    "DIVERTED": "is_diverted",
    "IS_DIVERTED": "is_diverted",
    # Delay Causes (BTS)
    "CARRIER_DELAY": "carrier_delay",
    "WEATHER_DELAY": "weather_delay",
    "NAS_DELAY": "nas_delay",
    "SECURITY_DELAY": "security_delay",
    "LATE_AIRCRAFT_DELAY": "late_aircraft_delay",
    # Airport Operations
    "TAXI_OUT": "taxi_out_minutes",
    "TAXI_OUT_MINUTES": "taxi_out_minutes",
    "TAXI_IN": "taxi_in_minutes",
    "TAXI_IN_MINUTES": "taxi_in_minutes"
}

# Configurable Canonical Candidates for auto-discovery
CANONICAL_FIELD_CANDIDATES: Dict[str, List[str]] = {
    "flight_date": ["FL_DATE", "FLIGHT_DATE", "FLIGHTDATE", "DATE"],
    "carrier_code": ["OP_UNIQUE_CARRIER", "UNIQUE_CARRIER", "OP_CARRIER", "REPORTING_AIRLINE", "CARRIER", "AIRLINE", "AIRLINE_CODE"],
    "flight_number": ["OP_CARRIER_FL_NUM", "FL_NUM", "FLIGHT_NUMBER", "FLIGHT_NUM", "TAIL_NUM"],
    "carrier_name": ["CARRIER_NAME", "AIRLINE_NAME"],
    "origin": ["ORIGIN", "ORIGIN_AIRPORT_ID", "ORIGIN_CITY_MARKET_ID", "ORIGIN_AIRPORT_SEQ_ID", "ORIGIN_AIRPORT"],
    "origin_name": ["ORIGIN_CITY_NAME", "ORIGIN_STATE_ABR", "ORIGIN_STATE_NM"],
    "dest": ["DEST", "DEST_AIRPORT_ID", "DEST_CITY_MARKET_ID", "DEST_AIRPORT_SEQ_ID", "DEST_AIRPORT"],
    "dest_name": ["DEST_CITY_NAME", "DEST_STATE_ABR", "DEST_STATE_NM"],
    "scheduled_dep_time": ["CRS_DEP_TIME", "SCHEDULED_DEP_TIME", "DEP_TIME_BLK", "SCHEDULED_DEPARTURE"],
    "actual_dep_time": ["DEP_TIME", "ACTUAL_DEP_TIME", "ACTUAL_DEPARTURE"],
    "scheduled_arr_time": ["CRS_ARR_TIME", "SCHEDULED_ARR_TIME", "ARR_TIME_BLK", "SCHEDULED_ARRIVAL"],
    "actual_arr_time": ["ARR_TIME", "ACTUAL_ARR_TIME", "ACTUAL_ARRIVAL"],
    "distance_miles": ["DISTANCE", "DISTANCE_MILES", "DIST"],
    "dep_delay_minutes": ["DEP_DELAY", "DEP_DELAY_NEW", "DEP_DELAY_MINUTES"],
    "arr_delay_minutes": ["ARR_DELAY", "ARR_DELAY_NEW", "ARR_DELAY_MINUTES"],
    "is_delayed": ["ARR_DEL15", "IS_DELAYED", "DELAY_15"],
    "is_cancelled": ["CANCELLED", "CANCELED", "IS_CANCELLED"],
    "cancellation_code": ["CANCELLATION_CODE"],
    "is_diverted": ["DIVERTED", "IS_DIVERTED"],
    "carrier_delay": ["CARRIER_DELAY"],
    "weather_delay": ["WEATHER_DELAY"],
    "nas_delay": ["NAS_DELAY"],
    "security_delay": ["SECURITY_DELAY"],
    "late_aircraft_delay": ["LATE_AIRCRAFT_DELAY"],
    "taxi_out_minutes": ["TAXI_OUT", "TAXI_OUT_MINUTES"],
    "taxi_in_minutes": ["TAXI_IN", "TAXI_IN_MINUTES"],
    "air_time_minutes": ["AIR_TIME", "ACTUAL_ELAPSED_TIME"],
    "scheduled_elapsed_time": ["CRS_ELAPSED_TIME"]
}

# U.S. DOT BTS World Area Code / Airport ID to IATA code dictionary
BTS_AIRPORT_ID_TO_IATA: Dict[int, str] = {
    10135: "ABE", 10136: "ABI", 10140: "ABQ", 10141: "ABR", 10146: "ABY",
    10155: "ACT", 10157: "ACV", 10158: "ACY", 10185: "AEX", 10208: "AGS",
    10257: "ALB", 10268: "ALO", 10279: "AMA", 10299: "ANC", 10397: "ATL",
    10408: "ATW", 10423: "AUS", 10431: "AVL", 10434: "AVP", 10469: "AZO",
    10529: "BDL", 10561: "BFL", 10581: "BGM", 10599: "BGR", 10620: "BHM",
    10627: "BIL", 10631: "BIS", 10666: "BLI", 10676: "BLV", 10693: "BNA",
    10713: "BOI", 10721: "BOS", 10731: "BPT", 10732: "BQK", 10739: "BQN",
    10747: "BRO", 10754: "BRW", 10779: "BTR", 10781: "BTV", 10785: "BUF",
    10792: "BUF", 10800: "BUR", 10821: "BWI", 10834: "BZN", 10849: "CAE",
    10868: "CAK", 10874: "CCR", 10918: "CHA", 10926: "CHO", 10935: "CHS",
    10967: "CID", 10980: "CIU", 10990: "CKB", 10994: "CLE", 11003: "CLL",
    11042: "CLD", 11057: "CLT", 11066: "CMH", 11067: "CMI", 11076: "CMX",
    11097: "COD", 11109: "COS", 11111: "COU", 11122: "CPR", 11140: "CRP",
    11146: "CRW", 11150: "CSG", 11193: "CVG", 11203: "CWA", 11252: "DAB",
    11259: "DAL", 11267: "DAY", 11274: "DBQ", 11278: "DCA", 11292: "DEN",
    11298: "DFW", 11308: "DHN", 11337: "DIK", 11413: "DRO", 11423: "DSM",
    11433: "DTW", 11447: "DVL", 11471: "EAR", 11481: "EAT", 11503: "EAU",
    11525: "ECP", 11531: "EGE", 11540: "ELP", 11577: "ERI", 11587: "ESC",
    11617: "EUG", 11618: "EWR", 11624: "EYW", 11630: "FAI", 11637: "FAR",
    11638: "FAT", 11641: "FAY", 11648: "FCA", 11697: "FLL", 11721: "FLG",
    11775: "FNT", 11778: "FOD", 11823: "FSD", 11865: "FSM", 11867: "FWA",
    11921: "GCC", 11953: "GNV", 11977: "GPT", 11980: "GRB", 11982: "GRI",
    11986: "GRK", 11995: "GRR", 11996: "GSO", 12003: "GSP", 12007: "GTF",
    12012: "GTR", 12016: "GUC", 12173: "HNL", 12191: "HOU", 12197: "HPN",
    12206: "HRL", 12217: "HSV", 12223: "HTS", 12264: "IAD", 12266: "IAH",
    12278: "ICT", 12280: "IDA", 12323: "ILM", 12339: "IND", 12391: "INL",
    12441: "ISP", 12448: "ITH", 12451: "JAX", 12478: "JFK", 12511: "JLN",
    12519: "JMS", 12523: "JNU", 12758: "KOA", 12889: "LAS", 12892: "LAX",
    12953: "LGA", 12982: "LIH", 13198: "MCI", 13204: "MCO", 13232: "MDW",
    13244: "MEM", 13303: "MIA", 13342: "MKE", 13360: "MLB", 13487: "MSP",
    13495: "MSY", 13577: "MYR", 13796: "OAK", 13830: "OGG", 13851: "OKC",
    13871: "OMA", 13930: "ORD", 13931: "ORF", 14027: "PBI", 14057: "PDX",
    14082: "PGV", 14100: "PHL", 14107: "PHX", 14112: "PIE", 14122: "PIT",
    14492: "RDU", 14524: "RIC", 14635: "RSW", 14674: "SAN", 14679: "SAN",
    14683: "SAT", 14730: "SJU", 14747: "SEA", 14771: "SFO", 14783: "SGF",
    14831: "SJC", 14869: "SLC", 14893: "SMF", 15016: "STL", 15024: "STP",
    15304: "TPA", 15376: "TUS"
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

def resolve_airport_code(val: Any) -> str:
    """Translates BTS numeric Airport IDs (e.g. 10397) or strings to standard 3-letter IATA code."""
    if is_null_val(val):
        return ""
    val_str = str(val).strip().upper()
    if val_str.isdigit():
        num_id = int(val_str)
        return BTS_AIRPORT_ID_TO_IATA.get(num_id, f"APT-{num_id}")
    try:
        fval = float(val_str)
        if fval.is_integer():
            return BTS_AIRPORT_ID_TO_IATA.get(int(fval), f"APT-{int(fval)}")
    except ValueError:
        pass
    return val_str

def extract_csv_from_zip(zip_path: Path, output_dir: Optional[Path] = None) -> Path:
    """Safely extracts the main CSV from an uploaded BTS zip archive."""
    target_dir = output_dir or zip_path.parent
    with zipfile.ZipFile(zip_path, 'r') as z:
        csv_members = [
            m for m in z.namelist()
            if m.lower().endswith(".csv") and not m.startswith("__MACOSX")
        ]
        if not csv_members:
            raise ValueError(f"Zip archive '{zip_path.name}' does not contain any CSV files.")
        extracted_file = z.extract(csv_members[0], path=str(target_dir))
        logger.info(f"Extracted {csv_members[0]} from {zip_path.name}")
        return Path(extracted_file)

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
    Reusable data ingestion, validation, profiling, and cleaning pipeline for historical flight records.
    Handles both standard platform schema and official U.S. DOT BTS TranStats CSV formats.
    """

    def __init__(self, delay_threshold_minutes: int = 15):
        self.delay_threshold_minutes = delay_threshold_minutes
        self.quality_summary: Dict[str, Any] = {}
        self.custom_mappings: Dict[str, str] = {}

    def set_custom_mapping(self, mapping: Dict[str, str]):
        """Sets user-configurable schema mappings."""
        self.custom_mappings = mapping

    def normalize_columns(
        self,
        df: pd.DataFrame,
        custom_mapping: Optional[Dict[str, str]] = None
    ) -> pd.DataFrame:
        """
        Standardizes input column headers across standard, BTS, and custom user schemas.
        Inspects actual column names and supports relevant BTS fields through configurable mapping.
        """
        active_mapping = {**self.custom_mappings, **(custom_mapping or {})}
        df_cols_clean = {str(c).strip(): c for c in df.columns}
        df_cols_upper = {str(c).strip().upper(): c for c in df.columns}
        rename_map = {}

        # 1. Apply user custom overrides first
        for src, target in active_mapping.items():
            src_clean = str(src).strip()
            if src_clean in df_cols_clean:
                rename_map[df_cols_clean[src_clean]] = target
            elif src_clean.upper() in df_cols_upper:
                rename_map[df_cols_upper[src_clean.upper()]] = target

        # 2. Match canonical candidates (configurable auto-mapping)
        matched_targets = set(rename_map.values())
        for canonical_name, candidates in CANONICAL_FIELD_CANDIDATES.items():
            if canonical_name in matched_targets:
                continue
            for cand in candidates:
                cand_upper = cand.strip().upper()
                if cand_upper in df_cols_upper:
                    orig_col = df_cols_upper[cand_upper]
                    if orig_col not in rename_map:
                        rename_map[orig_col] = canonical_name
                        matched_targets.add(canonical_name)
                        break

        # 3. Apply legacy BTS direct mapping if not yet matched
        for col in df.columns:
            if col not in rename_map:
                clean_col = str(col).strip().upper()
                if clean_col in BTS_COLUMN_MAPPING:
                    rename_map[col] = BTS_COLUMN_MAPPING[clean_col]
                else:
                    rename_map[col] = str(col).strip().lower()

        df_renamed = df.rename(columns=rename_map)

        # 4. Resolve Airport IDs to standard IATA if origin/dest are numeric IDs
        if "origin" in df_renamed.columns:
            df_renamed["origin"] = df_renamed["origin"].apply(resolve_airport_code)
        elif "origin_airport_id" in df_renamed.columns:
            df_renamed["origin"] = df_renamed["origin_airport_id"].apply(resolve_airport_code)

        if "dest" in df_renamed.columns:
            df_renamed["dest"] = df_renamed["dest"].apply(resolve_airport_code)
        elif "dest_airport_id" in df_renamed.columns:
            df_renamed["dest"] = df_renamed["dest_airport_id"].apply(resolve_airport_code)

        return df_renamed

    def parse_time_field(self, val: Any) -> Tuple[Optional[int], Optional[int], str]:
        """
        Parses scheduled departure time in HH:MM format or BTS integer format (e.g. 1430 -> 14, 30, '14:30').
        """
        if is_null_val(val):
            return None, None, "00:00"

        val_str = str(val).strip()
        if ":" in val_str:
            parts = val_str.split(":")
            try:
                hour = int(parts[0])
                minute = int(parts[1]) if len(parts) > 1 else 0
                if 0 <= hour <= 23 and 0 <= minute <= 59:
                    return hour, minute, f"{hour:02d}:{minute:02d}"
            except ValueError:
                pass

        try:
            num_val = int(float(val_str))
            hour = num_val // 100
            minute = num_val % 100
            if 0 <= hour <= 23 and 0 <= minute <= 59:
                return hour, minute, f"{hour:02d}:{minute:02d}"
        except (ValueError, TypeError):
            pass

        return None, None, "00:00"

    def profile_dataset(
        self,
        file_path_or_df: Union[Path, str, pd.DataFrame],
        source_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Performs high-performance data profiling on an uploaded or active flight dataset.
        Supports chunked streaming for large files (> 50,000 rows).
        """
        start_time = time.time()
        chunk_size = 50000

        if isinstance(file_path_or_df, (Path, str)):
            path = Path(file_path_or_df)
            if not path.exists():
                raise FileNotFoundError(f"File not found: {path}")
            if path.suffix.lower() == ".zip":
                path = extract_csv_from_zip(path)
            
            src_name = source_name or path.name
            
            # Read first chunk to inspect header columns and check size
            first_chunk = pd.read_csv(path, nrows=10, low_memory=False)
            columns_detected = list(first_chunk.columns)

            # Streaming profiling across chunks
            total_records = 0
            unique_carriers = set()
            unique_origins = set()
            unique_dests = set()
            missing_by_col = {c: 0 for c in columns_detected}
            cancelled_count = 0
            diverted_count = 0
            min_date = None
            max_date = None

            for chunk in pd.read_csv(path, chunksize=chunk_size, low_memory=False):
                total_records += len(chunk)
                for c in columns_detected:
                    if c in chunk.columns:
                        missing_by_col[c] += int(chunk[c].isna().sum())

                norm_chunk = self.normalize_columns(chunk)
                if "carrier_code" in norm_chunk.columns:
                    unique_carriers.update(norm_chunk["carrier_code"].dropna().astype(str).unique())
                if "origin" in norm_chunk.columns:
                    unique_origins.update(norm_chunk["origin"].dropna().astype(str).unique())
                if "dest" in norm_chunk.columns:
                    unique_dests.update(norm_chunk["dest"].dropna().astype(str).unique())

                if "is_cancelled" in norm_chunk.columns:
                    cancelled_count += int((norm_chunk["is_cancelled"].astype(str).isin(["1", "1.0", "True"])).sum())
                if "is_diverted" in norm_chunk.columns:
                    diverted_count += int((norm_chunk["is_diverted"].astype(str).isin(["1", "1.0", "True"])).sum())

                if "flight_date" in norm_chunk.columns:
                    dates = norm_chunk["flight_date"].dropna().astype(str)
                    if not dates.empty:
                        c_min, c_max = dates.min(), dates.max()
                        min_date = c_min if min_date is None else min(min_date, c_min)
                        max_date = c_max if max_date is None else max(max_date, c_max)

            processing_engine = "Pandas Streaming Chunk Engine (50k/chunk)"
        else:
            df = file_path_or_df
            src_name = source_name or "In-Memory Dataset"
            total_records = len(df)
            columns_detected = list(df.columns)
            missing_by_col = {c: int(df[c].isna().sum()) for c in columns_detected}
            norm_df = self.normalize_columns(df)
            unique_carriers = set(norm_df["carrier_code"].dropna().astype(str).unique()) if "carrier_code" in norm_df.columns else set()
            unique_origins = set(norm_df["origin"].dropna().astype(str).unique()) if "origin" in norm_df.columns else set()
            unique_dests = set(norm_df["dest"].dropna().astype(str).unique()) if "dest" in norm_df.columns else set()
            cancelled_count = int(norm_df["is_cancelled"].astype(str).isin(["1", "1.0", "True"]).sum()) if "is_cancelled" in norm_df.columns else 0
            diverted_count = int(norm_df["is_diverted"].astype(str).isin(["1", "1.0", "True"]).sum()) if "is_diverted" in norm_df.columns else 0
            if "flight_date" in norm_df.columns and not norm_df["flight_date"].dropna().empty:
                min_date = str(norm_df["flight_date"].min())
                max_date = str(norm_df["flight_date"].max())
            else:
                min_date, max_date = None, None
            processing_engine = "Pandas Memory-Optimized In-Memory Engine"

        duration = time.time() - start_time
        total_missing = sum(missing_by_col.values())
        norm_cols = [str(c).strip().upper() for c in columns_detected]
        has_delay_causes = any(c in norm_cols for c in ["CARRIER_DELAY", "WEATHER_DELAY", "NAS_DELAY", "LATE_AIRCRAFT_DELAY"])

        return {
            "source_name": src_name,
            "total_input_records": total_records,
            "columns_detected": columns_detected,
            "columns_count": len(columns_detected),
            "date_range": {
                "min_date": min_date or "N/A",
                "max_date": max_date or "N/A"
            },
            "missing_values_count": total_missing,
            "missing_values_by_column": missing_by_col,
            "duplicate_rows_count": 0, # Evaluated during row validation
            "unique_airlines_count": len(unique_carriers),
            "unique_airlines": sorted(list(unique_carriers))[:15],
            "unique_origins_count": len(unique_origins),
            "unique_origins": sorted(list(unique_origins))[:15],
            "unique_dests_count": len(unique_dests),
            "unique_dests": sorted(list(unique_dests))[:15],
            "cancellation_count": cancelled_count,
            "cancellation_rate_pct": round(cancelled_count / total_records * 100, 2) if total_records > 0 else 0.0,
            "diversion_count": diverted_count,
            "diversion_rate_pct": round(diverted_count / total_records * 100, 2) if total_records > 0 else 0.0,
            "has_delay_causes": has_delay_causes,
            "processing_engine": processing_engine,
            "processing_duration_seconds": round(duration, 3)
        }

    def validate_and_clean(
        self,
        df: pd.DataFrame,
        source_name: str = "CSV Data Source",
        custom_mapping: Optional[Dict[str, str]] = None
    ) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Validates required columns, cleans values, filters corrupted rows, tracks cancellations,
        and generates a comprehensive Data Quality & Profiling Report.
        """
        start_time = time.time()
        total_input_records = len(df)
        rejection_counts = {
            "missing_carrier_or_route": 0,
            "same_origin_and_dest": 0,
            "invalid_departure_time": 0,
            "invalid_negative_distance": 0,
            "missing_delay_ground_truth": 0,
            "cancelled_or_diverted_flight": 0,
            "duplicate_flight_record": 0,
        }

        df_norm = self.normalize_columns(df, custom_mapping=custom_mapping)

        # Check for mandatory routing columns
        required_cols = ["origin", "dest"]
        missing_req = [c for c in required_cols if c not in df_norm.columns]
        if missing_req:
            raise ValueError(
                f"Invalid dataset schema. Missing mandatory columns: {missing_req}. "
                f"Found columns: {list(df_norm.columns)}"
            )

        # Check if delay ground-truth columns exist in dataset
        has_arr_delay_col = "arr_delay_minutes" in df_norm.columns or "arr_delay" in df_norm.columns
        has_is_delayed_col = "is_delayed" in df_norm.columns

        valid_rows = []
        seen_keys = set()
        cancelled_count = 0
        diverted_count = 0

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

            # Check Cancellation / Diversion status
            is_cancelled_val = row.get("is_cancelled")
            is_diverted_val = row.get("is_diverted")
            is_cancelled = str(is_cancelled_val).strip() in ["1", "1.0", "True"] if not is_null_val(is_cancelled_val) else False
            is_diverted = str(is_diverted_val).strip() in ["1", "1.0", "True"] if not is_null_val(is_diverted_val) else False
            if is_cancelled:
                cancelled_count += 1
            if is_diverted:
                diverted_count += 1

            # Rule 3: Valid scheduled departure time
            time_val = row.get("scheduled_dep_time")
            if is_null_val(time_val) and "dep_hour" in row:
                try:
                    dep_hour = int(row["dep_hour"])
                    dep_min = int(row.get("dep_minute", 0))
                    sched_time_str = f"{dep_hour:02d}:{dep_min:02d}"
                except Exception:
                    dep_hour, dep_min, sched_time_str = None, None, ""
            else:
                dep_hour, dep_min, sched_time_str = self.parse_time_field(time_val)

            if dep_hour is None:
                rejection_counts["invalid_departure_time"] += 1
                continue

            # Rule 4: Distance check
            dist = row.get("distance_miles")
            if not is_null_val(dist):
                try:
                    dist = float(dist)
                    if dist <= 0:
                        rejection_counts["invalid_negative_distance"] += 1
                        continue
                except ValueError:
                    dist = None
            if dist is None or is_null_val(dist):
                if orig in AIRPORT_COORDINATES and dest in AIRPORT_COORDINATES:
                    c1, c2 = AIRPORT_COORDINATES[orig], AIRPORT_COORDINATES[dest]
                    dist = calculate_haversine(c1[0], c1[1], c2[0], c2[1])
                else:
                    dist = 750.0

            # Rule 5: Arrival delay ground truth
            # If flight was cancelled or diverted, it did not arrive normally
            if is_cancelled or is_diverted:
                rejection_counts["cancelled_or_diverted_flight"] += 1
                continue

            arr_delay = row.get("arr_delay_minutes")
            if is_null_val(arr_delay):
                arr_delay = row.get("arr_delay")

            has_is_delayed = "is_delayed" in row and not is_null_val(row.get("is_delayed"))
            if is_null_val(arr_delay) and not has_is_delayed:
                rejection_counts["missing_delay_ground_truth"] += 1
                continue

            arr_delay_min = to_scalar_float(arr_delay, default=0.0)
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

            # Atmospheric & Operational features (with robust fallback defaults)
            wind_speed = float(row.get("wind_speed_knots", 12.0)) if not is_null_val(row.get("wind_speed_knots")) else 12.0
            visibility = float(row.get("visibility_miles", 10.0)) if not is_null_val(row.get("visibility_miles")) else 10.0
            precip = float(row.get("precipitation_mm", 0.0)) if not is_null_val(row.get("precipitation_mm")) else 0.0
            orig_weather = str(row.get("origin_weather", "Clear")).strip()
            dest_weather = str(row.get("dest_weather", "Clear")).strip()
            congestion = str(row.get("congestion_level", "Moderate")).strip()
            taxi_out = float(row.get("taxi_out_minutes", 18.0)) if not is_null_val(row.get("taxi_out_minutes")) else 18.0
            carrier_delay_rate = float(row.get("historical_carrier_delay_rate", 0.20)) if not is_null_val(row.get("historical_carrier_delay_rate")) else 0.20

            day_of_week = int(row.get("day_of_week", 2)) if not is_null_val(row.get("day_of_week")) else 2
            month = int(row.get("month", 6)) if not is_null_val(row.get("month")) else 6

            # Delay cause determination
            delay_cause = str(row.get("delay_cause", ""))
            if not delay_cause or delay_cause.lower() in ["nan", "none", ""]:
                if is_delayed == 0:
                    delay_cause = "On Time"
                elif not is_null_val(row.get("weather_delay")) and float(row.get("weather_delay")) > 0:
                    delay_cause = "Weather"
                elif not is_null_val(row.get("nas_delay")) and float(row.get("nas_delay")) > 0:
                    delay_cause = "Air Traffic Control (NAS)"
                elif not is_null_val(row.get("carrier_delay")) and float(row.get("carrier_delay")) > 0:
                    delay_cause = "Carrier Maintenance"
                elif not is_null_val(row.get("late_aircraft_delay")) and float(row.get("late_aircraft_delay")) > 0:
                    delay_cause = "Late Inbound Aircraft"
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
        skipped_records = rejection_counts["cancelled_or_diverted_flight"]
        duration = time.time() - start_time

        # Calculate profiling distributions
        unique_carriers = sorted(list(set(clean_df["carrier_code"].unique()))) if not clean_df.empty else []
        unique_origins = sorted(list(set(clean_df["origin"].unique()))) if not clean_df.empty else []
        unique_dests = sorted(list(set(clean_df["dest"].unique()))) if not clean_df.empty else []
        min_date = clean_df["flight_date"].min() if not clean_df.empty and "flight_date" in clean_df.columns else "N/A"
        max_date = clean_df["flight_date"].max() if not clean_df.empty and "flight_date" in clean_df.columns else "N/A"

        norm_cols = [str(c).strip().upper() for c in df.columns]
        has_delay_causes = any(c in norm_cols for c in ["CARRIER_DELAY", "WEATHER_DELAY", "NAS_DELAY", "LATE_AIRCRAFT_DELAY"])

        quality_report = {
            "source_name": source_name,
            "delay_threshold_minutes": self.delay_threshold_minutes,
            "total_input_records": total_input_records,
            "valid_records": valid_records,
            "rejected_records": rejected_records,
            "skipped_records": skipped_records,
            "acceptance_rate_pct": round((valid_records / total_input_records * 100), 1) if total_input_records > 0 else 0.0,
            "rejection_breakdown": rejection_counts,
            "rejection_reasons_explained": {
                "missing_carrier_or_route": "Flight record missing departure/destination aerodrome or carrier code",
                "same_origin_and_dest": "Origin and destination aerodromes are identical (invalid flight route)",
                "invalid_departure_time": "Scheduled departure time is missing or unparseable",
                "invalid_negative_distance": "Flight distance is zero or negative",
                "missing_delay_ground_truth": "Arrival delay outcome (ARR_DELAY / ARR_DEL15) is missing",
                "cancelled_or_diverted_flight": "Flight was cancelled or diverted prior to arrival (tracked in operations, excluded from delay prediction)",
                "duplicate_flight_record": "Duplicate flight number on the same date, route, and scheduled slot"
            },
            "columns_detected": list(df.columns),
            "columns_count": len(df.columns),
            "date_range": {
                "min_date": str(min_date),
                "max_date": str(max_date)
            },
            "missing_values_count": int(df.isna().sum().sum()),
            "duplicate_rows_count": rejection_counts["duplicate_flight_record"],
            "unique_airlines_count": len(unique_carriers),
            "unique_airlines": unique_carriers[:15],
            "unique_origins_count": len(unique_origins),
            "unique_origins": unique_origins[:15],
            "unique_dests_count": len(unique_dests),
            "unique_dests": unique_dests[:15],
            "cancellation_count": cancelled_count,
            "cancellation_rate_pct": round(cancelled_count / total_input_records * 100, 2) if total_input_records > 0 else 0.0,
            "diversion_count": diverted_count,
            "diversion_rate_pct": round(diverted_count / total_input_records * 100, 2) if total_input_records > 0 else 0.0,
            "has_delay_causes": has_delay_causes,
            "clean_features_count": len(clean_df.columns) if not clean_df.empty else 0,
            "processing_engine": "Pandas Memory-Optimized Ingestion Engine (Local 16GB RAM)",
            "processing_duration_seconds": round(duration, 3),
            "class_distribution": {
                "on_time_count": int((clean_df["is_delayed"] == 0).sum()) if not clean_df.empty else 0,
                "delayed_count": int((clean_df["is_delayed"] == 1).sum()) if not clean_df.empty else 0,
                "delay_rate_pct": round(float(clean_df["is_delayed"].mean() * 100), 1) if not clean_df.empty else 0.0
            }
        }
        self.quality_summary = quality_report
        return clean_df, quality_report

    def ingest_from_csv(
        self,
        file_path: Path,
        custom_mapping: Optional[Dict[str, str]] = None
    ) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Loads and cleans a CSV or ZIP file, saving the clean dataset and quality summary to disk.
        Preserves original uploaded files in the uploads folder.
        """
        if not file_path.exists():
            raise FileNotFoundError(f"Source file does not exist: {file_path}")

        # If file is a zip archive, extract first
        target_csv_path = file_path
        if file_path.suffix.lower() == ".zip":
            target_csv_path = extract_csv_from_zip(file_path)

        logger.info(f"Ingesting flight data from {target_csv_path}...")
        raw_df = pd.read_csv(target_csv_path, low_memory=False)
        clean_df, report = self.validate_and_clean(raw_df, source_name=file_path.name, custom_mapping=custom_mapping)

        # Save to processed destination
        output_csv = settings.DATA_PATH
        clean_df.to_csv(output_csv, index=False)

        # Save quality report JSON
        report_path = settings.DATA_DIR / "data_quality_report.json"
        with open(report_path, "w") as f:
            json.dump(report, f, indent=2)

        return clean_df, report

# Global pipeline instance
ingestion_pipeline = FlightDataIngestionPipeline()
