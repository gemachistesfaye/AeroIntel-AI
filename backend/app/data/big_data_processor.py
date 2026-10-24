import json
from pathlib import Path
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np

from app.core.config import settings

class FlightAnalyticsProcessor:
    """
    High-performance analytical processing engine for historical flight records.
    Optimized for memory efficiency (category dtypes, numeric downcasting, chunked streaming).
    """

    def __init__(self, data_path: Optional[Path] = None):
        self.data_path = data_path or settings.DATA_PATH
        self._df: Optional[pd.DataFrame] = None

    def _optimize_dtypes(self, df: pd.DataFrame) -> pd.DataFrame:
        """Converts high-cardinality strings to categories and downcasts numerics to minimize RAM."""
        df_opt = df.copy()
        
        # Categoricals (reduces RAM usage by 70-80%)
        cat_cols = ["carrier_code", "origin", "dest", "origin_weather", "dest_weather", "congestion_level", "delay_cause", "delay_risk_tier"]
        for col in cat_cols:
            if col in df_opt.columns:
                df_opt[col] = df_opt[col].astype("category")

        # Downcast numerics
        num_floats = ["distance_miles", "wind_speed_knots", "visibility_miles", "precipitation_mm", "taxi_out_minutes", "arr_delay_minutes"]
        for col in num_floats:
            if col in df_opt.columns:
                df_opt[col] = pd.to_numeric(df_opt[col], downcast="float")

        int_cols = ["dep_hour", "dep_minute", "day_of_week", "month", "is_delayed"]
        for col in int_cols:
            if col in df_opt.columns:
                df_opt[col] = pd.to_numeric(df_opt[col], downcast="integer")

        return df_opt

    def load_data(self, force_reload: bool = False) -> pd.DataFrame:
        if self._df is None or force_reload:
            if self.data_path.exists():
                raw_df = pd.read_csv(self.data_path, low_memory=False)
                self._df = self._optimize_dtypes(raw_df)
            else:
                self._df = pd.DataFrame()
        return self._df

    def process_large_csv_in_chunks(
        self,
        csv_path: Path,
        chunk_size: int = 50000
    ) -> Dict[str, Any]:
        """
        Processes multi-gigabyte flight datasets in streaming chunks without exhausting memory.
        Calculates cumulative metrics across chunks.
        """
        total_rows = 0
        total_delayed = 0
        total_delay_minutes = 0.0
        carrier_counts: Dict[str, int] = {}
        airport_counts: Dict[str, int] = {}

        for chunk in pd.read_csv(csv_path, chunksize=chunk_size, low_memory=False):
            total_rows += len(chunk)
            if "is_delayed" in chunk.columns:
                total_delayed += int(chunk["is_delayed"].sum())
            if "arr_delay_minutes" in chunk.columns:
                total_delay_minutes += float(chunk["arr_delay_minutes"].sum())

            if "carrier_code" in chunk.columns:
                for c, count in chunk["carrier_code"].value_counts().items():
                    carrier_counts[str(c)] = carrier_counts.get(str(c), 0) + int(count)

            if "origin" in chunk.columns:
                for a, count in chunk["origin"].value_counts().items():
                    airport_counts[str(a)] = airport_counts.get(str(a), 0) + int(count)

        avg_delay = round(total_delay_minutes / total_rows, 2) if total_rows > 0 else 0.0
        on_time_pct = round(((total_rows - total_delayed) / total_rows) * 100, 1) if total_rows > 0 else 0.0

        return {
            "total_processed_rows": total_rows,
            "total_delayed_rows": total_delayed,
            "on_time_percentage": on_time_pct,
            "average_delay_minutes": avg_delay,
            "carrier_distribution": carrier_counts,
            "top_airports": dict(sorted(airport_counts.items(), key=lambda x: x[1], reverse=True)[:10])
        }

    def filter_records(
        self,
        carrier: Optional[str] = None,
        origin: Optional[str] = None,
        dest: Optional[str] = None,
        delay_status: Optional[str] = None,
        risk_tier: Optional[str] = None,
        min_hour: Optional[int] = None,
        max_hour: Optional[int] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        df = self.load_data()
        if df.empty:
            return []

        filtered = df
        if carrier:
            filtered = filtered[filtered["carrier_code"].astype(str).str.upper() == carrier.upper()]
        if origin:
            filtered = filtered[filtered["origin"].astype(str).str.upper() == origin.upper()]
        if dest:
            filtered = filtered[filtered["dest"].astype(str).str.upper() == dest.upper()]
        if delay_status:
            if delay_status.lower() == "delayed":
                filtered = filtered[filtered["is_delayed"] == 1]
            elif delay_status.lower() == "ontime":
                filtered = filtered[filtered["is_delayed"] == 0]
        if risk_tier:
            filtered = filtered[filtered["delay_risk_tier"].astype(str).str.lower() == risk_tier.lower()]
        if min_hour is not None:
            filtered = filtered[filtered["dep_hour"] >= min_hour]
        if max_hour is not None:
            filtered = filtered[filtered["dep_hour"] <= max_hour]

        return filtered.head(limit).to_dict(orient="records")

    def compute_carrier_benchmarks(self) -> List[Dict[str, Any]]:
        df = self.load_data()
        if df.empty or "carrier_name" not in df.columns:
            return []

        results = []
        for carrier, group in df.groupby("carrier_name", observed=True):
            total = len(group)
            delayed = int((group["is_delayed"] == 1).sum())
            ontime_rate = round(((total - delayed) / total) * 100, 1) if total > 0 else 0.0
            avg_delay = round(float(group["arr_delay_minutes"].mean()), 1)
            med_delay = round(float(group["arr_delay_minutes"].median()), 1)
            p90_delay = round(float(group["arr_delay_minutes"].quantile(0.90)), 1)
            carrier_code = str(group["carrier_code"].iloc[0])

            results.append({
                "carrier_code": carrier_code,
                "carrier_name": str(carrier),
                "total_flights": total,
                "delayed_flights": delayed,
                "on_time_rate_pct": ontime_rate,
                "avg_delay_minutes": avg_delay,
                "median_delay_minutes": med_delay,
                "p90_delay_minutes": p90_delay,
            })
        results.sort(key=lambda x: x["on_time_rate_pct"], reverse=True)
        return results

    def compute_corridor_analytics(self) -> List[Dict[str, Any]]:
        df = self.load_data()
        if df.empty or "route" not in df.columns:
            return []

        corridors = []
        for route, group in df.groupby("route", observed=True):
            total = len(group)
            delayed = int((group["is_delayed"] == 1).sum())
            ontime_pct = round(((total - delayed) / total) * 100, 1) if total > 0 else 0.0
            avg_delay = round(float(group["arr_delay_minutes"].mean()), 1)
            avg_taxi = round(float(group["taxi_out_minutes"].mean()), 1) if "taxi_out_minutes" in group.columns else 16.0
            orig, dst = str(route).split(" -> ") if " -> " in str(route) else (group["origin"].iloc[0], group["dest"].iloc[0])

            # Congestion Index formula (0 to 100)
            congestion_score = int(np.clip(
                (100 - ontime_pct) * 0.65 + max(avg_delay, 0) * 0.5 + max(avg_taxi - 12, 0) * 1.5,
                5, 98
            ))

            corridors.append({
                "route": str(route),
                "origin": str(orig),
                "dest": str(dst),
                "total_flights": total,
                "delayed_flights": delayed,
                "on_time_pct": ontime_pct,
                "avg_delay_minutes": avg_delay,
                "avg_taxi_minutes": avg_taxi,
                "congestion_index": congestion_score,
                "distance_miles": int(group["distance_miles"].iloc[0]) if "distance_miles" in group.columns else 0
            })
        corridors.sort(key=lambda x: x["congestion_index"], reverse=True)
        return corridors

    def compute_hub_analytics(self) -> List[Dict[str, Any]]:
        df = self.load_data()
        if df.empty or "origin" not in df.columns:
            return []

        hubs = []
        for airport, group in df.groupby("origin", observed=True):
            total = len(group)
            delayed = int((group["is_delayed"] == 1).sum())
            ontime_pct = round(((total - delayed) / total) * 100, 1) if total > 0 else 0.0
            avg_taxi = round(float(group["taxi_out_minutes"].mean()), 1) if "taxi_out_minutes" in group.columns else 16.0
            name = str(group["origin_name"].iloc[0]) if "origin_name" in group.columns else f"{airport} Airport"

            hubs.append({
                "airport_code": str(airport),
                "airport_name": name,
                "departures_count": total,
                "delayed_departures": delayed,
                "punctuality_pct": ontime_pct,
                "avg_taxi_minutes": avg_taxi,
                "congestion_tier": "Severe" if ontime_pct < 65 else ("Elevated" if ontime_pct < 78 else "Nominal")
            })
        hubs.sort(key=lambda x: x["punctuality_pct"])
        return hubs

# Global analytics processor instance
analytics_processor = FlightAnalyticsProcessor()

