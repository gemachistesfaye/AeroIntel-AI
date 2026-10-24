# Methodology & Data Science Pipeline

## 1. Aviation Data Schema & Benchmark
The platform currently utilizes a calibrated benchmark dataset modeled after the **U.S. Department of Transportation Bureau of Transportation Statistics (BTS)** and **Federal Aviation Administration (FAA)** on-time reporting standards.

### Primary Dataset Attributes (24 Fields):
| Field | Type | Description |
|---|---|---|
| `flight_id` | String | Unique flight callsign (e.g. DL1042, UA452, AA819) |
| `carrier_code` | Categorical | Airline IATA code (DL, UA, AA, WN, B6, AS) |
| `carrier_name` | String | Commercial airline operator name |
| `origin` / `dest` | Categorical | 3-letter IATA airport code (e.g. ATL, ORD, JFK, LAX) |
| `distance_miles` | Numeric | Great-circle Haversine distance in statute miles |
| `air_time_minutes`| Numeric | Airborne flight duration excluding taxi |
| `scheduled_dep_time` | String | Scheduled departure timestamp (HH:MM) |
| `dep_hour` / `dep_minute` | Numeric | Extracted departure hour (0-23) and minute |
| `day_of_week` | Numeric | 0 (Monday) to 6 (Sunday) |
| `month` | Numeric | Calendar month (1 to 12) for seasonal climatology |
| `origin_weather` | Categorical | Terminal weather (Clear, Light Rain, Heavy Rain, Thunderstorm, Fog, Snow/Ice) |
| `dest_weather` | Categorical | Arrival aerodrome weather condition |
| `wind_speed_knots` | Numeric | Surface sustained crosswind speed in knots |
| `visibility_miles` | Numeric | Prevailing horizontal visibility in statute miles |
| `precipitation_mm` | Numeric | Accumulated precipitation in millimeters |
| `congestion_level` | Categorical | Active hub ground congestion (Low, Moderate, High, Severe) |
| `taxi_out_minutes` | Numeric | Time spent between gate departure and takeoff roll |
| `historical_carrier_delay_rate` | Numeric | Historical on-time punctuality baseline for carrier |
| `arr_delay_minutes`| Numeric | Continuous arrival delay (negative = early, positive = late) |
| `is_delayed` | Binary | **Target Variable**: 1 if `arr_delay_minutes >= 15`, else 0 |
| `delay_cause` | Categorical | Primary FAA cause (Weather, ATC/NAS, Late Aircraft, Carrier, On Time) |
| `delay_risk_tier` | Categorical | Risk classification (Low, Moderate, High, Severe) |

---

## 2. Feature Engineering Pipeline

### A. Cyclical Temporal Encoding
Linear numerical hours (0 to 23) create an artificial discontinuity between 23:59 and 00:00. We apply sine and cosine transformations:
$$\text{dep\_hour\_sin} = \sin\left(\frac{2\pi \cdot \text{hour}}{24}\right), \quad \text{dep\_hour\_cos} = \cos\left(\frac{2\pi \cdot \text{hour}}{24}\right)$$

### B. Preprocessing & Column Transformers
- **Numerical Scaling**: `StandardScaler` standardizes continuous features (`wind_speed_knots`, `taxi_out_minutes`, `precipitation_mm`, `distance_miles`, `air_time_minutes`) to zero mean and unit variance.
- **Categorical Encoding**: `OneHotEncoder(handle_unknown='ignore', sparse_output=False)` encodes high-cardinality airports, airline codes, and categorical weather states.

---

## 3. Modeling Architecture

### Baseline Classifier: Random Forest Classifier
- **Algorithm**: `RandomForestClassifier(n_estimators=120, max_depth=9, class_weight='balanced')`
- **Objective**: Estimate posterior delay probability $P(\text{Delay} \ge 15\text{ min} \mid X)$.
- **Class Imbalance Handling**: Applied `class_weight='balanced'` to offset the natural 70/30 on-time vs. delayed distribution.

### Baseline Regressor: Random Forest Regressor
- **Algorithm**: `RandomForestRegressor(n_estimators=100, max_depth=8)`
- **Objective**: Estimate expected magnitude of late arrival in minutes ($\widehat{y} \in \mathbb{R}$).

---

## 4. Evaluation Strategy & Metrics
- **Validation Split**: 80% Train ($N=1,000$), 20% Holdout Test ($N=250$) stratified on `is_delayed`.
- **Classification Telemetry**:
  - **Accuracy**: $66.8\%$
  - **Precision**: $45.8\%$
  - **Recall**: $27.9\%$
  - **F1 Score**: $0.347$
  - **ROC-AUC**: $0.570$
- **Regression Telemetry**:
  - **MAE**: $32.7$ minutes
  - **RMSE**: $48.2$ minutes
- **Explainability**: Gini importance decomposition across wind dynamics, taxi runway queues, carrier fleet history, and atmospheric visibility.
