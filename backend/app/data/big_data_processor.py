import json
import time
from pathlib import Path
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np

from app.core.config import settings

MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
WEEKDAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

class FlightAnalyticsProcessor:
    """
    High-performance analytical processing engine for historical flight records.
    Optimized for memory efficiency (category dtypes, numeric downcasting, chunked streaming).
    Provides airline, aerodrome, route, and temporal (month/weekday/hour) intelligence.
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
        start_time = time.time()
        total_rows = 0
        total_delayed = 0
        total_delay_minutes = 0.0
        cancelled_rows = 0
        diverted_rows = 0
        carrier_counts: Dict[str, int] = {}
        airport_counts: Dict[str, int] = {}

        for chunk in pd.read_csv(csv_path, chunksize=chunk_size, low_memory=False):
            total_rows += len(chunk)
            if "is_delayed" in chunk.columns:
                total_delayed += int(chunk["is_delayed"].sum())
            if "arr_delay_minutes" in chunk.columns:
                total_delay_minutes += float(chunk["arr_delay_minutes"].dropna().sum())
            if "is_cancelled" in chunk.columns:
                cancelled_rows += int(chunk["is_cancelled"].astype(str).isin(["1", "1.0", "True"]).sum())
            if "is_diverted" in chunk.columns:
                diverted_rows += int(chunk["is_diverted"].astype(str).isin(["1", "1.0", "True"]).sum())

            if "carrier_code" in chunk.columns:
                for c, count in chunk["carrier_code"].value_counts().items():
                    carrier_counts[str(c)] = carrier_counts.get(str(c), 0) + int(count)

            if "origin" in chunk.columns:
                for a, count in chunk["origin"].value_counts().items():
                    airport_counts[str(a)] = airport_counts.get(str(a), 0) + int(count)

        duration = time.time() - start_time
        avg_delay = round(total_delay_minutes / total_rows, 2) if total_rows > 0 else 0.0
        on_time_pct = round(((total_rows - total_delayed) / total_rows) * 100, 1) if total_rows > 0 else 0.0

        return {
            "total_processed_rows": total_rows,
            "total_delayed_rows": total_delayed,
            "on_time_percentage": on_time_pct,
            "average_delay_minutes": avg_delay,
            "cancellation_count": cancelled_rows,
            "cancellation_rate_pct": round(cancelled_rows / total_rows * 100, 2) if total_rows > 0 else 0.0,
            "diversion_count": diverted_rows,
            "diversion_rate_pct": round(diverted_rows / total_rows * 100, 2) if total_rows > 0 else 0.0,
            "carrier_distribution": carrier_counts,
            "top_airports": dict(sorted(airport_counts.items(), key=lambda x: x[1], reverse=True)[:10]),
            "processing_engine": "Pandas Memory-Optimized Streaming Engine",
            "processing_duration_seconds": round(duration, 3)
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
            if total == 0:
                continue
            delayed = int((group["is_delayed"] == 1).sum()) if "is_delayed" in group.columns else 0
            ontime_rate = round(((total - delayed) / total) * 100, 1)
            delay_rate = round((delayed / total) * 100, 1)
            avg_delay = round(float(group["arr_delay_minutes"].mean()), 1) if "arr_delay_minutes" in group.columns else 0.0
            med_delay = round(float(group["arr_delay_minutes"].median()), 1) if "arr_delay_minutes" in group.columns else 0.0
            p90_delay = round(float(group["arr_delay_minutes"].quantile(0.90)), 1) if "arr_delay_minutes" in group.columns else 0.0
            carrier_code = str(group["carrier_code"].iloc[0]) if "carrier_code" in group.columns else "UNK"

            # Cancellation & diversion rates when available
            canc_count = int(group["is_cancelled"].astype(str).isin(["1", "1.0", "True"]).sum()) if "is_cancelled" in group.columns else 0
            div_count = int(group["is_diverted"].astype(str).isin(["1", "1.0", "True"]).sum()) if "is_diverted" in group.columns else 0
            canc_rate = round(canc_count / total * 100, 2)
            div_rate = round(div_count / total * 100, 2)

            results.append({
                "carrier_code": carrier_code,
                "carrier_name": str(carrier),
                "total_flights": total,
                "delayed_flights": delayed,
                "on_time_rate_pct": ontime_rate,
                "delay_rate_pct": delay_rate,
                "avg_delay_minutes": avg_delay,
                "median_delay_minutes": med_delay,
                "p90_delay_minutes": p90_delay,
                "cancellation_rate_pct": canc_rate,
                "diversion_rate_pct": div_rate
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
            if total == 0:
                continue
            delayed = int((group["is_delayed"] == 1).sum()) if "is_delayed" in group.columns else 0
            ontime_pct = round(((total - delayed) / total) * 100, 1)
            avg_delay = round(float(group["arr_delay_minutes"].mean()), 1) if "arr_delay_minutes" in group.columns else 0.0
            avg_taxi = round(float(group["taxi_out_minutes"].mean()), 1) if "taxi_out_minutes" in group.columns else 16.0
            orig, dst = str(route).split(" -> ") if " -> " in str(route) else (group["origin"].iloc[0], group["dest"].iloc[0])

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
                "delay_rate_pct": round(delayed / total * 100, 1),
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
            if total == 0:
                continue
            delayed = int((group["is_delayed"] == 1).sum()) if "is_delayed" in group.columns else 0
            ontime_pct = round(((total - delayed) / total) * 100, 1)
            avg_taxi = round(float(group["taxi_out_minutes"].mean()), 1) if "taxi_out_minutes" in group.columns else 16.0
            name = str(group["origin_name"].iloc[0]) if "origin_name" in group.columns else f"{airport} Airport"

            canc_count = int(group["is_cancelled"].astype(str).isin(["1", "1.0", "True"]).sum()) if "is_cancelled" in group.columns else 0
            div_count = int(group["is_diverted"].astype(str).isin(["1", "1.0", "True"]).sum()) if "is_diverted" in group.columns else 0

            hubs.append({
                "airport_code": str(airport),
                "airport_name": name,
                "departures_count": total,
                "delayed_departures": delayed,
                "punctuality_pct": ontime_pct,
                "delay_rate_pct": round(delayed / total * 100, 1),
                "avg_taxi_minutes": avg_taxi,
                "cancellation_rate_pct": round(canc_count / total * 100, 2),
                "diversion_rate_pct": round(div_count / total * 100, 2),
                "congestion_tier": "Severe" if ontime_pct < 65 else ("Elevated" if ontime_pct < 78 else "Nominal")
            })
        hubs.sort(key=lambda x: x["punctuality_pct"])
        return hubs

    def compute_temporal_analytics(self) -> Dict[str, Any]:
        """
        Computes historical delay analytics partitioned by month, day of week, and departure hour.
        Safely handles missing columns and zero denominators.
        """
        df = self.load_data()
        if df.empty:
            return {
                "by_month": [],
                "by_weekday": [],
                "by_departure_hour": [],
                "total_records": 0
            }

        # 1. By Month (1..12)
        by_month = []
        if "month" in df.columns:
            for m in range(1, 13):
                m_df = df[df["month"] == m]
                total = len(m_df)
                if total > 0:
                    delayed = int((m_df["is_delayed"] == 1).sum()) if "is_delayed" in m_df.columns else 0
                    avg_del = round(float(m_df["arr_delay_minutes"].mean()), 1) if "arr_delay_minutes" in m_df.columns else 0.0
                    canc = int(m_df["is_cancelled"].astype(str).isin(["1", "1.0", "True"]).sum()) if "is_cancelled" in m_df.columns else 0
                    div = int(m_df["is_diverted"].astype(str).isin(["1", "1.0", "True"]).sum()) if "is_diverted" in m_df.columns else 0
                    by_month.append({
                        "month_index": m,
                        "month_name": MONTH_NAMES[m - 1],
                        "total_flights": total,
                        "delayed_flights": delayed,
                        "on_time_rate_pct": round(((total - delayed) / total) * 100, 1),
                        "delay_rate_pct": round(delayed / total * 100, 1),
                        "avg_delay_minutes": avg_del,
                        "cancellation_rate_pct": round(canc / total * 100, 2),
                        "diversion_rate_pct": round(div / total * 100, 2)
                    })

        # 2. By Weekday (0..6 -> Mon..Sun)
        by_weekday = []
        if "day_of_week" in df.columns:
            for w in range(7):
                w_df = df[df["day_of_week"] == w]
                total = len(w_df)
                if total > 0:
                    delayed = int((w_df["is_delayed"] == 1).sum()) if "is_delayed" in w_df.columns else 0
                    avg_del = round(float(w_df["arr_delay_minutes"].mean()), 1) if "arr_delay_minutes" in w_df.columns else 0.0
                    canc = int(w_df["is_cancelled"].astype(str).isin(["1", "1.0", "True"]).sum()) if "is_cancelled" in w_df.columns else 0
                    div = int(w_df["is_diverted"].astype(str).isin(["1", "1.0", "True"]).sum()) if "is_diverted" in w_df.columns else 0
                    by_weekday.append({
                        "weekday_index": w,
                        "weekday_name": WEEKDAY_NAMES[w],
                        "total_flights": total,
                        "delayed_flights": delayed,
                        "on_time_rate_pct": round(((total - delayed) / total) * 100, 1),
                        "delay_rate_pct": round(delayed / total * 100, 1),
                        "avg_delay_minutes": avg_del,
                        "cancellation_rate_pct": round(canc / total * 100, 2),
                        "diversion_rate_pct": round(div / total * 100, 2)
                    })

        # 3. By Scheduled Departure Hour (0..23)
        by_dep_hour = []
        if "dep_hour" in df.columns:
            for h in range(24):
                h_df = df[df["dep_hour"] == h]
                total = len(h_df)
                if total > 0:
                    delayed = int((h_df["is_delayed"] == 1).sum()) if "is_delayed" in h_df.columns else 0
                    avg_del = round(float(h_df["arr_delay_minutes"].mean()), 1) if "arr_delay_minutes" in h_df.columns else 0.0
                    canc = int(h_df["is_cancelled"].astype(str).isin(["1", "1.0", "True"]).sum()) if "is_cancelled" in h_df.columns else 0
                    div = int(h_df["is_diverted"].astype(str).isin(["1", "1.0", "True"]).sum()) if "is_diverted" in h_df.columns else 0
                    by_dep_hour.append({
                        "hour": h,
                        "hour_label": f"{h:02d}:00",
                        "total_flights": total,
                        "delayed_flights": delayed,
                        "on_time_rate_pct": round(((total - delayed) / total) * 100, 1),
                        "delay_rate_pct": round(delayed / total * 100, 1),
                        "avg_delay_minutes": avg_del,
                        "cancellation_rate_pct": round(canc / total * 100, 2),
                        "diversion_rate_pct": round(div / total * 100, 2)
                    })

        return {
            "by_month": by_month,
            "by_weekday": by_weekday,
            "by_departure_hour": by_dep_hour,
            "total_records": len(df)
        }

    def compute_delay_causes_breakdown(self) -> Dict[str, Any]:
        """
        Extracts historical delay cause distributions only when cause columns are present.
        """
        df = self.load_data()
        if df.empty:
            return {"has_delay_causes": False, "causes": [], "total_delayed": 0}

        # Check qualitative column
        if "delay_cause" in df.columns:
            delayed_df = df[df["is_delayed"] == 1] if "is_delayed" in df.columns else df
            total = len(delayed_df)
            if total == 0:
                return {"has_delay_causes": True, "causes": [], "total_delayed": 0}
            causes_counts = delayed_df["delay_cause"].value_counts()
            breakdown = [
                {
                    "cause": str(cause),
                    "count": int(cnt),
                    "percentage": round(int(cnt) / total * 100, 1)
                }
                for cause, cnt in causes_counts.items()
                if str(cause) != "On Time"
            ]
            return {
                "has_delay_causes": True,
                "causes": breakdown,
                "total_delayed": total,
                "notes": "Derived from historical BTS delay categorization"
            }

        return {
            "has_delay_causes": False,
            "causes": [],
            "total_delayed": 0,
            "notes": "Historical delay cause columns (CARRIER_DELAY, WEATHER_DELAY, NAS_DELAY) are not present in this dataset."
        }

# Global analytics processor instance
analytics_processor = FlightAnalyticsProcessor()
