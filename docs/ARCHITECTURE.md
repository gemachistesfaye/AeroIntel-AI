# System Architecture & Technical Specifications

```mermaid
flowchart TD
    subgraph Frontend["Frontend Client (React 18 + TypeScript + Vite)"]
        UI_Dash["Mission Dashboard"]
        UI_Analysis["Flight Analysis & Log"]
        UI_Predict["Predict Delay Simulator"]
        UI_Route["Route Intelligence"]
        UI_Model["Model Evaluation & ROC"]
        UI_Data["Data Management & Schema"]
        API_Client["Aviation API Service (Axios / Fetch)"]
        
        UI_Dash --> API_Client
        UI_Analysis --> API_Client
        UI_Predict --> API_Client
        UI_Route --> API_Client
        UI_Model --> API_Client
        UI_Data --> API_Client
    end

    subgraph Backend["Python Backend (Flask REST API + CORS)"]
        Router["Flask Blueprints /api"]
        DashBP["/api/dashboard"]
        FlightBP["/api/flights"]
        PredictBP["/api/predict"]
        RouteBP["/api/route-intelligence"]
        ModelBP["/api/model"]
        DataBP["/api/data"]

        Router --> DashBP
        Router --> FlightBP
        Router --> PredictBP
        Router --> RouteBP
        Router --> ModelBP
        Router --> DataBP
    end

    subgraph CoreServices["Backend Service Layer"]
        ModelService["AviationModelService (Real-Time Inference)"]
        DataManager["AviationDataManager (In-Memory Pandas Query Engine)"]
    end

    subgraph DataML["Data & Machine Learning Pipeline"]
        Dataset[("sample_flights.csv (FAA/BTS Benchmark)")]
        Pipeline["Feature Engineering & ColumnTransformer"]
        ClfModel["RandomForestClassifier (.joblib)"]
        RegModel["RandomForestRegressor (.joblib)"]
        EvalMeta["evaluation_metrics.json"]
    end

    API_Client <-->|HTTP / JSON via Port 8000| Router
    PredictBP --> ModelService
    DashBP --> DataManager
    FlightBP --> DataManager
    RouteBP --> DataManager
    ModelBP --> ModelService
    DataBP --> DataManager

    DataManager <--> Dataset
    ModelService <--> ClfModel
    ModelService <--> RegModel
    ModelService <--> EvalMeta
    Pipeline --> ClfModel
    Pipeline --> RegModel
```

## API Specifications

### 1. `GET /api/health`
Returns service status, model availability, and active dataset row counts.
- **Response**:
```json
{
  "status": "healthy",
  "service": "AI-Powered Aviation Intelligence Platform",
  "version": "1.0.0-alpha",
  "model_ready": true,
  "records_loaded": 1250,
  "environment": "development"
}
```

### 2. `GET /api/dashboard/summary`
Returns high-level fleet statistics, delay causes breakdown, carrier punctuality ranking, hourly delay curves, and recent critical disruptions.

### 3. `GET /api/flights`
Query parameters:
- `q`: Search term (flight ID, carrier name, origin, dest)
- `carrier`: Filter by airline code (DL, UA, AA, WN, B6, AS)
- `risk_tier`: Filter by Low, Moderate, High, Severe
- `status`: ontime or delayed
- `page`: Page index (1-based)
- `limit`: Records per page (default: 15)

### 4. `POST /api/predict/flight`
Executes real-time inference using the Scikit-Learn baseline pipeline.
- **Request Body**:
```json
{
  "carrier_code": "DL",
  "origin": "ATL",
  "dest": "LAX",
  "dep_hour": 17,
  "dep_minute": 30,
  "day_of_week": 4,
  "month": 7,
  "origin_weather": "Thunderstorm",
  "dest_weather": "Clear",
  "wind_speed_knots": 28.0,
  "visibility_miles": 4.5,
  "precipitation_mm": 12.0,
  "congestion_level": "High",
  "taxi_out_minutes": 32.0
}
```
- **Response**:
```json
{
  "success": true,
  "data": {
    "prediction": {
      "delay_probability": 0.742,
      "delay_probability_pct": 74.2,
      "is_delayed_predicted": true,
      "expected_delay_minutes": 38.5,
      "risk_tier": "Severe Risk",
      "risk_color": "#ef4444",
      "confidence_score": 0.76,
      "model_version": "1.0.0-baseline"
    },
    "contributing_factors": [
      {
        "factor": "Adverse Origin Weather (Thunderstorm)",
        "impact": "High Negative Impact",
        "score": 32,
        "description": "Terminal airspace experiencing thunderstorm, inducing ground delay programs (GDP)."
      }
    ],
    "operational_recommendations": [
      "Alert flight dispatch and gate operations for possible ground delay program (GDP) impact.",
      "Pre-calculate fuel diversion reserves if destination weather holds below minimums."
    ]
  }
}
```

### 5. `GET /api/route-intelligence`
Aggregates performance metrics across origin-destination corridors and airport hubs.

### 6. `GET /api/model/evaluation`
Provides honest Scikit-Learn performance metrics, confusion matrix counts, ROC/PR curve points, and feature importance rankings.

### 7. `POST /api/data/regenerate`
Regenerates the benchmark CSV dataset and reloads the memory cache.
