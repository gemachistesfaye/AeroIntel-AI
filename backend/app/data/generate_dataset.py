import os
import random
import numpy as np
import pandas as pd
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent
OUTPUT_CSV = DATA_DIR / "sample_flights.csv"

CARRIERS = [
    {"code": "DL", "name": "Delta Air Lines", "base_delay_rate": 0.16},
    {"code": "UA", "name": "United Airlines", "base_delay_rate": 0.21},
    {"code": "AA", "name": "American Airlines", "base_delay_rate": 0.23},
    {"code": "WN", "name": "Southwest Airlines", "base_delay_rate": 0.20},
    {"code": "B6", "name": "JetBlue Airways", "base_delay_rate": 0.27},
    {"code": "AS", "name": "Alaska Airlines", "base_delay_rate": 0.15},
]

AIRPORTS = [
    {"code": "ATL", "name": "Hartsfield-Jackson Atlanta", "lat": 33.6407, "lon": -84.4277, "hub_factor": 1.25},
    {"code": "ORD", "name": "Chicago O'Hare", "lat": 41.9742, "lon": -87.9073, "hub_factor": 1.35},
    {"code": "DFW", "name": "Dallas/Fort Worth", "lat": 32.8998, "lon": -97.0403, "hub_factor": 1.20},
    {"code": "DEN", "name": "Denver International", "lat": 39.8561, "lon": -104.6737, "hub_factor": 1.22},
    {"code": "JFK", "name": "John F. Kennedy NY", "lat": 40.6413, "lon": -73.7781, "hub_factor": 1.40},
    {"code": "LAX", "name": "Los Angeles International", "lat": 33.9416, "lon": -118.4085, "hub_factor": 1.30},
    {"code": "SFO", "name": "San Francisco International", "lat": 37.6213, "lon": -122.3790, "hub_factor": 1.35},
    {"code": "SEA", "name": "Seattle-Tacoma International", "lat": 47.4502, "lon": -122.3088, "hub_factor": 1.15},
    {"code": "MIA", "name": "Miami International", "lat": 25.7959, "lon": -80.2870, "hub_factor": 1.18},
    {"code": "BOS", "name": "Boston Logan International", "lat": 42.3656, "lon": -71.0096, "hub_factor": 1.28},
    {"code": "CLT", "name": "Charlotte Douglas", "lat": 35.2144, "lon": -80.9473, "hub_factor": 1.15},
    {"code": "PHX", "name": "Phoenix Sky Harbor", "lat": 33.4373, "lon": -112.0078, "hub_factor": 1.10},
]

WEATHER_CONDITIONS = [
    {"name": "Clear", "risk_mult": 0.85, "prob": 0.55},
    {"name": "Light Rain", "risk_mult": 1.25, "prob": 0.20},
    {"name": "Heavy Rain", "risk_mult": 1.80, "prob": 0.10},
    {"name": "Thunderstorm", "risk_mult": 2.50, "prob": 0.07},
    {"name": "Fog", "risk_mult": 1.90, "prob": 0.05},
    {"name": "Snow / Ice", "risk_mult": 2.40, "prob": 0.03},
]

def haversine_distance(lat1, lon1, lat2, lon2):
    R = 3958.8  # Earth radius in miles
    phi1, phi2 = np.radians(lat1), np.radians(lat2)
    delta_phi = np.radians(lat2 - lat1)
    delta_lambda = np.radians(lon2 - lon1)
    a = np.sin(delta_phi / 2)**2 + np.cos(phi1) * np.cos(phi2) * np.sin(delta_lambda / 2)**2
    c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1 - a))
    return round(R * c)

def generate_sample_dataset(num_records=1250, seed=42):
    random.seed(seed)
    np.random.seed(seed)
    
    rows = []
    flight_num_counters = {c["code"]: 100 for c in CARRIERS}
    
    weather_names = [w["name"] for w in WEATHER_CONDITIONS]
    weather_probs = [w["prob"] for w in WEATHER_CONDITIONS]
    weather_map = {w["name"]: w["risk_mult"] for w in WEATHER_CONDITIONS}
    
    for i in range(num_records):
        carrier = random.choice(CARRIERS)
        carrier_code = carrier["code"]
        carrier_name = carrier["name"]
        flight_num_counters[carrier_code] += random.randint(1, 9)
        flight_id = f"{carrier_code}{flight_num_counters[carrier_code]}"
        
        orig = random.choice(AIRPORTS)
        dest = random.choice([a for a in AIRPORTS if a["code"] != orig["code"]])
        
        dist = haversine_distance(orig["lat"], orig["lon"], dest["lat"], dest["lon"])
        air_time = int(dist / 7.5 + random.randint(15, 30))
        
        # Schedule features
        dep_hour = int(np.clip(np.random.normal(13, 4.5), 5, 23))
        dep_minute = random.choice([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55])
        scheduled_dep_time = f"{dep_hour:02d}:{dep_minute:02d}"
        
        day_of_week = random.randint(0, 6) # Mon=0 to Sun=6
        month = random.randint(1, 12)
        
        # Environmental conditions
        orig_weather = np.random.choice(weather_names, p=weather_probs)
        dest_weather = np.random.choice(weather_names, p=weather_probs)
        
        wind_speed = round(random.uniform(4.0, 38.0 if "Thunderstorm" in [orig_weather, dest_weather] else 24.0), 1)
        visibility = round(random.uniform(1.2, 10.0) if orig_weather in ["Fog", "Heavy Rain", "Snow / Ice"] else random.uniform(8.0, 10.0), 1)
        precip = round(random.uniform(2.5, 22.0) if orig_weather in ["Heavy Rain", "Thunderstorm", "Snow / Ice"] else (random.uniform(0.1, 4.0) if orig_weather == "Light Rain" else 0.0), 2)
        
        # Congestion factor based on hub factor and time of day
        peak_multiplier = 1.4 if 16 <= dep_hour <= 20 or 7 <= dep_hour <= 9 else 0.9
        raw_congestion = (orig["hub_factor"] * peak_multiplier + random.uniform(-0.2, 0.3))
        if raw_congestion > 1.6:
            congestion_level = "Severe"
            taxi_out = random.randint(28, 48)
        elif raw_congestion > 1.3:
            congestion_level = "High"
            taxi_out = random.randint(20, 32)
        elif raw_congestion > 1.0:
            congestion_level = "Moderate"
            taxi_out = random.randint(15, 24)
        else:
            congestion_level = "Low"
            taxi_out = random.randint(10, 18)
            
        # Ground-truth delay calculation with genuine physical coupling
        weather_factor = max(weather_map[orig_weather], weather_map[dest_weather])
        carrier_rate = carrier["base_delay_rate"]
        
        # Realistic FAA/BTS baseline delay probability calculation (~20-22% delay rate)
        base_prob = (
            carrier_rate * 0.45 +
            (weather_factor - 1.0) * 0.22 +
            (raw_congestion - 1.0) * 0.18 +
            (0.04 if day_of_week in [4, 6] else 0.0) +
            (0.03 if month in [7, 8, 12] else 0.0) +
            (wind_speed / 40.0) * 0.08 +
            random.uniform(-0.04, 0.04)
        )
        delay_prob = float(np.clip(base_prob, 0.03, 0.88))
        is_delayed = 1 if (random.random() < delay_prob) else 0
        
        if is_delayed:
            # Positive delay >= 15 min
            mean_delay = 20 + (weather_factor - 1.0) * 40 + (raw_congestion - 1.0) * 30 + (wind_speed * 0.8)
            arr_delay = int(np.clip(np.random.exponential(mean_delay), 15, 240))
            
            # Determine dominant delay cause
            if weather_factor >= 1.8 or wind_speed > 30:
                cause = "Weather"
            elif congestion_level in ["Severe", "High"]:
                cause = "Air Traffic Control (NAS)"
            elif random.random() < 0.45:
                cause = "Late Inbound Aircraft"
            else:
                cause = "Carrier Maintenance"
                
            if arr_delay >= 75:
                risk_tier = "Severe"
            elif arr_delay >= 40:
                risk_tier = "High"
            else:
                risk_tier = "Moderate"
        else:
            arr_delay = int(random.uniform(-25, 14))
            cause = "On Time"
            risk_tier = "Low"
            
        rows.append({
            "flight_id": flight_id,
            "carrier_code": carrier_code,
            "carrier_name": carrier_name,
            "origin": orig["code"],
            "origin_name": orig["name"],
            "dest": dest["code"],
            "dest_name": dest["name"],
            "route": f"{orig['code']} -> {dest['code']}",
            "distance_miles": dist,
            "air_time_minutes": air_time,
            "scheduled_dep_time": scheduled_dep_time,
            "dep_hour": dep_hour,
            "dep_minute": dep_minute,
            "day_of_week": day_of_week,
            "month": month,
            "origin_weather": orig_weather,
            "dest_weather": dest_weather,
            "wind_speed_knots": wind_speed,
            "visibility_miles": visibility,
            "precipitation_mm": precip,
            "congestion_level": congestion_level,
            "taxi_out_minutes": taxi_out,
            "historical_carrier_delay_rate": round(carrier_rate, 2),
            "arr_delay_minutes": arr_delay,
            "is_delayed": is_delayed,
            "delay_cause": cause,
            "delay_risk_tier": risk_tier,
            "dataset_label": "DEMO_FAA_BTS_BENCHMARK"
        })
        
    df = pd.DataFrame(rows)
    OUTPUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(OUTPUT_CSV, index=False)
    print(f"Generated {len(df)} flight records at: {OUTPUT_CSV}")
    print(f"Delay rate: {df['is_delayed'].mean():.2%}, Causes: {dict(df['delay_cause'].value_counts())}")
    return df

if __name__ == "__main__":
    generate_sample_dataset()
