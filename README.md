# AeroIntel AI | AI-Powered Aviation Intelligence Platform
> **Flight Delay Prediction, Air Corridor Intelligence & Aerodrome Risk Analytics**

[![Frontend: React + TypeScript](https://img.shields.io/badge/Frontend-React%2018%20%7C%20TypeScript%20%7C%20Vite-blue.svg)](frontend/)
[![Backend: Python + Flask](https://img.shields.io/badge/Backend-Python%203.11%20%7C%20Flask-emerald.svg)](backend/)
[![ML: Scikit-Learn](https://img.shields.io/badge/ML-Scikit--Learn%20Baseline-orange.svg)](backend/app/ml/)
[![Dataset: FAA/BTS Benchmark](https://img.shields.io/badge/Data-FAA%2FBTS%20Benchmark%20(1%2C250%20Flights)-purple.svg)](backend/app/data/)

---

## 1. Project Overview

**AeroIntel AI** is a professional full-stack aviation intelligence platform engineered to predict commercial flight delays, analyze air traffic congestion, and evaluate aerodrome risk factors. 

Instead of treating delay estimation as a simple toy problem, AeroIntel models genuine physical and operational couplings: **surface wind speeds, runway taxi-out queues, arrival airport weather minimums, carrier turnaround constraints, and peak schedule banking hours**.

---

## 2. Core Modules

| Module | Description |
|---|---|
| ✈️ **Mission Dashboard** | Real-time fleet KPI metrics, FAA delay cause attribution (Weather, NAS/ATC, Late Aircraft, Maintenance), hourly congestion curves, and active critical disruptions. |
| 🔍 **Flight Analysis & Log** | Interactive searchable log of 1,250 flight records with multi-criteria filters (carrier, status, risk tier) and detailed telemetry drawer. |
| 🧠 **Predict Delay Engine** | **Operational Scikit-Learn ML simulator**. Enter flight itinerary, weather, and congestion to get real-time delay probability, expected delay minutes, risk tiers, and feature attribution. |
| 🧭 **Route Intelligence** | Air corridor monitoring with Congestion Index (0–100), punctuality tracking, top hub bottleneck analysis, and departure slot recommendations. |
| 📊 **Model Evaluation** | Transparent Machine Learning scorecard featuring real Accuracy, Precision, Recall, F1, ROC-AUC, Confusion Matrix, interactive ROC curve, and Gini feature importances. |
| 🗄️ **Data Management** | 24-field schema inspector, data quality audit (zero nulls, physical boundary validation), and on-demand benchmark synthesis controls. |

---

## 3. Honest Implementation Status

To preserve engineering integrity and academic rigor, the platform's current operational boundaries are clearly stated:

- ✅ **Operational Baseline Machine Learning**: The prediction engine uses real, serialized Scikit-Learn `RandomForestClassifier` and `RandomForestRegressor` pipelines trained on 1,000 flight samples and evaluated against a 250-sample test holdout split.
- ⚠️ **Benchmark Dataset**: Operating on a calibrated benchmark dataset modeled after the **FAA and Bureau of Transportation Statistics (BTS)** standards. All benchmark data is explicitly labeled in the UI.
- ⏳ **Phase 2 Ingestion Roadmap**: Direct streaming connections to live **OpenSky Network ADS-B radar** and **NOAA METAR/TAF weather APIs** are documented in [docs/ROADMAP.md](docs/ROADMAP.md).

---

## 4. System Architecture & Tech Stack

```
INSA-Project/
├── backend/
│   ├── app/
│   │   ├── api/                     # Flask REST Blueprints (Dashboard, Flights, Predict, Route, Model, Data)
│   │   ├── core/                    # App configuration, settings, logging
│   │   ├── data/                    # Benchmark dataset generator & in-memory data loader
│   │   ├── ml/                      # Scikit-Learn feature pipeline, baseline training, model service
│   │   │   └── artifacts/           # Serialized models (.joblib) & evaluation_metrics.json
│   │   └── main.py                  # Flask application factory with CORS
│   ├── tests/                       # Automated API unit tests
│   ├── requirements.txt             # Python backend dependencies
│   └── run.py                       # Backend server startup entry point
├── frontend/
│   ├── src/
│   │   ├── components/              # Cockpit UI components (Dashboard, Analysis, Predict, Route, Model, Data)
│   │   ├── services/api.ts          # Typed API client connecting to backend
│   │   ├── types/aviation.ts        # Strict TypeScript interfaces
│   │   ├── App.tsx                  # Root application shell & routing
│   │   └── main.tsx                 # React DOM mount point
│   ├── package.json                 # Node dependencies (React 18, Vite, Tailwind CSS, Lucide)
│   ├── tailwind.config.js           # Aviation cockpit color theme
│   └── vite.config.ts               # Vite build configuration with API reverse proxy
├── docs/
│   ├── OBJECTIVES.md                # Problem formulation & mission objectives
│   ├── METHODOLOGY.md               # Data engineering & ML methodology
│   ├── ARCHITECTURE.md              # Architecture diagrams & REST API contracts
│   └── ROADMAP.md                   # Transparent status matrix & Phase 2 roadmap
├── start-dev.bat                    # One-click Windows startup script
├── start-dev.ps1                    # One-click PowerShell startup script
└── README.md
```

---

## 5. Quickstart & Local Setup

### Prerequisites
- **Python**: Version 3.10+ (Tested on 3.11)
- **Node.js**: Version 18+ (Tested on 22)
- **npm**: Version 9+

### Option A: One-Click Startup (Windows)
Double-click `start-dev.bat` or run in PowerShell:
```powershell
.\start-dev.ps1
```

### Option B: Manual Step-by-Step Setup

#### 1. Setup Backend (Python)
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# Windows Command Prompt:
.\.venv\Scripts\activate.bat
# Linux / macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# (Optional) Retrain baseline Scikit-Learn model & verify metrics
python app/ml/train_baseline.py

# Run API unit tests
python tests/test_api.py

# Start Flask backend server (port 8000)
python run.py
```
*Backend health check:* Visit [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

#### 2. Setup Frontend (React + TypeScript)
In a new terminal:
```bash
# Navigate to frontend directory
cd frontend

# Install npm packages
npm install

# Start Vite development server (port 5173)
npm run dev
```
*Frontend UI:* Open your browser at [http://localhost:5173](http://localhost:5173)

---

## 6. Running Automated Tests

Run the backend test suite verifying all 6 API endpoints and real model inference:
```bash
cd backend
python tests/test_api.py
```
Expected output:
```
Ran 6 tests in 0.724s
OK
```

Build the frontend to verify TypeScript type checking and asset compilation:
```bash
cd frontend
npm run build
```

---

## 7. Next Engineering Steps
See [docs/ROADMAP.md](docs/ROADMAP.md) for full details on:
1. Connecting live OpenSky Network ADS-B transponder streaming.
2. Ingesting NOAA Aviation Weather Center METAR/TAF observations.
3. Training recurrent LSTM networks for multi-leg rotational delay cascading.
4. Docker containerization and cloud orchestration.

---

## 8. License & Academic Attribution
Developed as part of the **INSA Aviation Intelligence Research Project**. Open source under the MIT License.
