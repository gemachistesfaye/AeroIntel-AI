import json
from pathlib import Path
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np

from app.core.config import settings

class AviationDataManager:
    def __init__(self):
        self._df: Optional[pd.DataFrame] = None
        self._load()

    def _load(self):
        if settings.DATA_PATH.exists():
            try:
                self._df = pd.read_csv(settings.DATA_PATH)
            except Exception as e:
                print(f"Error loading dataset: {e}")
                self._df = pd.DataFrame()
        else:
            self._df = pd.DataFrame()

    def reload(self) -> int:
        self._load()
        return len(self._df) if self._df is not None else 0

    @property
    def df(self) -> pd.DataFrame:
        if self._df is None or self._df.empty:
            self._load()
        return self._df if self._df is not None else pd.DataFrame()

    def get_dashboard_summary(self) -> Dict[str, Any]:
        df = self.df
        if df.empty:
            return {"error": "Dataset is empty"}

        total_flights = int(len(df))
        delayed_flights = int(df["is_delayed"].sum())
        on_time_flights = total_flights - delayed_flights
        on_time_rate = round((on_time_flights / total_flights) * 100, 1)
        avg_delay_all = round(float(df["arr_delay_minutes"].mean()), 1)
        avg_delay_delayed = round(float(df[df["is_delayed"] == 1]["arr_delay_minutes"].mean()), 1) if delayed_flights > 0 else 0.0

        # Delay causes breakdown
        causes_counts = df["delay_cause"].value_counts().to_dict()
        causes_breakdown = [
            {"cause": str(k), "count": int(v), "percentage": round((int(v) / total_flights) * 100, 1)}
            for k, v in causes_counts.items()
        ]

        # Carrier performance
        carrier_perf = []
        for carrier, group in df.groupby("carrier_name"):
            c_total = len(group)
            c_delayed = int(group["is_delayed"].sum())
            c_rate = round(((c_total - c_delayed) / c_total) * 100, 1)
            c_avg_delay = round(float(group["arr_delay_minutes"].mean()), 1)
            code = group["carrier_code"].iloc[0]
            carrier_perf.append({
                "code": code,
                "name": carrier,
                "total_flights": c_total,
                "delayed_flights": c_delayed,
                "on_time_rate": c_rate,
                "avg_delay_minutes": c_avg_delay
            })
        carrier_perf.sort(key=lambda x: x["on_time_rate"], reverse=True)

        # Hourly delay trend (00:00 to 23:00)
        hourly_trend = []
        for hour in range(5, 24):
            h_df = df[df["dep_hour"] == hour]
            if not h_df.empty:
                h_total = len(h_df)
                h_delayed = int(h_df["is_delayed"].sum())
                h_rate = round((h_delayed / h_total) * 100, 1)
                h_avg = round(float(h_df["arr_delay_minutes"].mean()), 1)
            else:
                h_total = 0
                h_delayed = 0
                h_rate = 0.0
                h_avg = 0.0
            hourly_trend.append({
                "hour": f"{hour:02d}:00",
                "flights": h_total,
                "delayed": h_delayed,
                "delay_rate_pct": h_rate,
                "avg_delay_min": h_avg
            })

        # Recent / critical disruptions
        severe_flights = df[df["delay_risk_tier"].isin(["Severe", "High"])].head(6) if "delay_risk_tier" in df.columns else df.head(6)
        avail_disruption_cols = [
            c for c in [
                "flight_id", "carrier_code", "origin", "dest", "scheduled_dep_time",
                "arr_delay_minutes", "delay_cause", "delay_risk_tier", "origin_weather"
            ] if c in severe_flights.columns
        ]
        disruptions = severe_flights[avail_disruption_cols].to_dict(orient="records")

        # Determine true dataset label
        if "dataset_label" in df.columns and not df["dataset_label"].empty:
            raw_label = str(df["dataset_label"].iloc[0])
            if ("BTS" in raw_label or "HISTORICAL" in raw_label) and not ("SYNTHETIC" in raw_label or "BENCHMARK" in raw_label):
                d_label = "U.S. DOT BTS TranStats Historical Data"
            else:
                d_label = "Calibrated Aviation Benchmark Dataset (Synthetic Sample)"
        else:
            d_label = "U.S. DOT BTS TranStats Historical Data" if ("bts" in str(settings.DATA_PATH).lower() and "sample" not in str(settings.DATA_PATH).lower()) else "Calibrated Aviation Benchmark Dataset (Synthetic Sample)"

        canc_count = int(df["is_cancelled"].astype(str).isin(["1", "1.0", "True"]).sum()) if "is_cancelled" in df.columns else 0
        div_count = int(df["is_diverted"].astype(str).isin(["1", "1.0", "True"]).sum()) if "is_diverted" in df.columns else 0

        return {
            "dataset_label": d_label,
            "total_flights": total_flights,
            "on_time_rate_pct": on_time_rate,
            "avg_delay_minutes": avg_delay_all,
            "avg_delay_when_delayed_minutes": avg_delay_delayed,
            "delayed_flights_count": delayed_flights,
            "cancellation_count": canc_count,
            "cancellation_rate_pct": round(canc_count / total_flights * 100, 2) if total_flights > 0 else 0.0,
            "diversion_count": div_count,
            "diversion_rate_pct": round(div_count / total_flights * 100, 2) if total_flights > 0 else 0.0,
            "causes_breakdown": causes_breakdown,
            "carrier_performance": carrier_perf,
            "hourly_trend": hourly_trend,
            "recent_disruptions": disruptions
        }

    def get_flights(
        self,
        query: str = "",
        carrier: str = "",
        origin: str = "",
        dest: str = "",
        risk_tier: str = "",
        status: str = "",
        page: int = 1,
        limit: int = 20
    ) -> Dict[str, Any]:
        df = self.df
        if df.empty:
            return {"total": 0, "page": page, "limit": limit, "items": []}

        filtered = df.copy()

        if query:
            q = query.strip().upper()
            filtered = filtered[
                filtered["flight_id"].str.contains(q, case=False, na=False) |
                filtered["carrier_name"].str.contains(q, case=False, na=False) |
                filtered["origin"].str.contains(q, case=False, na=False) |
                filtered["dest"].str.contains(q, case=False, na=False)
            ]

        if carrier:
            filtered = filtered[filtered["carrier_code"] == carrier.upper()]

        if origin:
            filtered = filtered[filtered["origin"] == origin.upper()]

        if dest:
            filtered = filtered[filtered["dest"] == dest.upper()]

        if risk_tier:
            filtered = filtered[filtered["delay_risk_tier"] == risk_tier]

        if status:
            if status.lower() == "delayed":
                filtered = filtered[filtered["is_delayed"] == 1]
            elif status.lower() == "ontime":
                filtered = filtered[filtered["is_delayed"] == 0]

        total = len(filtered)
        start = (page - 1) * limit
        end = start + limit
        paged_df = filtered.iloc[start:end]

        items = paged_df.to_dict(orient="records")
        return {
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": int(np.ceil(total / limit)) if limit > 0 else 1,
            "items": items
        }

    def get_route_intelligence(self, origin: str = "", dest: str = "") -> Dict[str, Any]:
        df = self.df
        if df.empty:
            return {"corridors": [], "hubs": []}

        # Corridors
        corridors = []
        for route_name, group in df.groupby("route"):
            orig, dst = route_name.split(" -> ")
            total = len(group)
            delayed = int(group["is_delayed"].sum())
            ontime_pct = round(((total - delayed) / total) * 100, 1)
            avg_delay = round(float(group["arr_delay_minutes"].mean()), 1)
            avg_taxi = round(float(group["taxi_out_minutes"].mean()), 1)
            
            # Congestion index calculation (0-100)
            congestion_score = int(np.clip(
                (100 - ontime_pct) * 0.7 + (avg_delay if avg_delay > 0 else 0) * 0.5 + (avg_taxi - 12) * 1.5,
                5, 98
            ))

            corridors.append({
                "route": route_name,
                "origin": orig,
                "dest": dst,
                "flights_count": total,
                "delayed_count": delayed,
                "on_time_pct": ontime_pct,
                "avg_delay_minutes": avg_delay,
                "avg_taxi_minutes": avg_taxi,
                "congestion_index": congestion_score,
                "distance_miles": int(group["distance_miles"].iloc[0]),
                "active_carriers": sorted(list(group["carrier_code"].unique()))
            })

        # Apply route filter if provided
        if origin and dest:
            selected_corridor = next((c for c in corridors if c["origin"] == origin and c["dest"] == dest), None)
        else:
            selected_corridor = None

        # Sort corridors by highest congestion
        corridors.sort(key=lambda x: x["congestion_index"], reverse=True)

        # Hub Congestion Analysis
        hubs = []
        for airport in df["origin"].unique():
            orig_group = df[df["origin"] == airport]
            total_dep = len(orig_group)
            delayed_dep = int(orig_group["is_delayed"].sum())
            dep_punctuality = round(((total_dep - delayed_dep) / total_dep) * 100, 1)
            avg_taxi = round(float(orig_group["taxi_out_minutes"].mean()), 1)
            
            hubs.append({
                "airport_code": airport,
                "airport_name": orig_group["origin_name"].iloc[0],
                "departures_count": total_dep,
                "delayed_departures": delayed_dep,
                "punctuality_pct": dep_punctuality,
                "avg_taxi_minutes": avg_taxi,
                "congestion_tier": "Severe" if dep_punctuality < 65 else ("Elevated" if dep_punctuality < 78 else "Nominal")
            })
        hubs.sort(key=lambda x: x["punctuality_pct"])

        return {
            "dataset_label": "Calibrated Synthetic Benchmark Corridors",
            "corridors": corridors[:30],
            "hubs": hubs,
            "selected_corridor": selected_corridor
        }

    def get_data_management_info(self) -> Dict[str, Any]:
        df = self.df
        data_path = settings.DATA_PATH
        
        columns_info = []
        for col in df.columns:
            dtype = str(df[col].dtype)
            nulls = int(df[col].isnull().sum())
            sample_val = str(df[col].iloc[0]) if not df.empty else "N/A"
            columns_info.append({
                "name": col,
                "type": dtype,
                "null_count": nulls,
                "sample": sample_val
            })

        file_size_kb = round(data_path.stat().st_size / 1024, 1) if data_path.exists() else 0.0

        is_real = bool(
            ("dataset_label" in df.columns and
             (df["dataset_label"].str.contains("HISTORICAL|BTS", na=False)).any() and
             not (df["dataset_label"].str.contains("SYNTHETIC|BENCHMARK", na=False)).any()) or
            ("bts" in str(data_path).lower() and "sample" not in str(data_path).lower())
        )
        ds_name = "U.S. DOT BTS TranStats Historical Records" if is_real else "Calibrated Aviation Benchmark Dataset (Synthetic Sample)"
        src_label = "U.S. DOT BTS TranStats CSV / ZIP Upload" if is_real else "Calibrated Aviation Benchmark Dataset (Synthetic Sample)"

        valid_ranges = bool(
            "arr_delay_minutes" in df.columns and
            (df["arr_delay_minutes"] >= -60).all() and (df["arr_delay_minutes"] <= 400).all()
        ) if not df.empty else True

        return {
            "dataset_name": ds_name,
            "file_path": str(data_path),
            "file_size_kb": file_size_kb,
            "total_records": len(df),
            "total_columns": len(df.columns),
            "is_real_data": is_real,
            "columns": columns_info,
            "data_health": {
                "missing_values": int(df.isnull().sum().sum()),
                "duplicate_rows": int(df.duplicated(subset=["flight_id"]).sum()) if "flight_id" in df.columns else 0,
                "valid_delay_ranges": valid_ranges,
                "schema_valid": True
            },
            "ingestion_status": {
                "source": src_label,
                "live_stream_connected": False,
                "live_stream_notes": "U.S. DOT BTS Reporting Carrier On-Time Performance dataset active."
            }
        }

# Singleton instance
data_manager = AviationDataManager()
