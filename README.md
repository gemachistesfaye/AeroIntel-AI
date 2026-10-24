# AeroIntel AI | AI-Powered Aviation Intelligence Platform
> **Flight Delay Prediction, Big Data Processing & Aerodrome Risk Analytics**

[![Frontend: React + TypeScript](https://img.shields.io/badge/Frontend-React%2018%20%7C%20TypeScript%20%7C%20Vite-blue.svg)](frontend/)
[![Backend: Python + Flask](https://img.shields.io/badge/Backend-Python%203.11%20%7C%20Flask-emerald.svg)](backend/)
[![ML: Comparative Pipelines](https://img.shields.io/badge/ML-LogisticRegression%20vs%20HistGradientBoosting-orange.svg)](backend/app/ml/)
[![Data: BTS & FAA On--Time Performance](https://img.shields.io/badge/Data-U.S.%20DOT%20BTS%20TranStats-purple.svg)](docs/DATASET.md)

---

## 1. Project Overview

**AeroIntel AI** is a professional full-stack aviation intelligence platform engineered to ingest large historical flight datasets, perform scalable memory-optimized aggregations, prevent target leakage, and predict commercial flight delays using comparative machine learning models with full explainability.

The platform models genuine physical and operational constraints: **runway crosswinds, surface taxi-out queues, arrival aerodrome weather minimums, airline turnaround reliability, and scheduled hub banking peaks**.

---

## 2. Core Modules & Capabilities

| Module | Description |
|---|---|
| ✈️ **Mission Dashboard** | Real-time fleet KPI metrics, FAA delay cause attribution (*Weather*, *NAS/ATC*, *Late Aircraft*, *Maintenance*), hourly congestion curves, and active disruptions. |
| 🔍 **Flight Analysis & Log** | Searchable log of flight records with multi-criteria filters (carrier, status, risk tier) and detailed telemetry drawer. |
| 🧠 **Predict Delay Engine** | Real-time ML simulator with **Model Toggle** (*Candidate HistGradientBoosting* vs *Baseline Logistic Regression*). Outputs probability, duration, confidence, and local feature attribution. |
| 🧭 **Route Intelligence** | Air corridor monitoring with Congestion Index (0–100), punctuality tracking, top hub bottleneck analysis, and departure slot recommendations. |
| 📊 **Model Comparison & Evaluation** | Transparent Machine Learning scorecard featuring side-by-side comparison between Baseline and Candidate models, confusion matrices, interactive dual ROC curves, Gini feature importances, and configurable delay threshold retraining. |
| 🗄️ **Data Management & Ingestion** | **CSV Dataset Upload & Validation**, data quality audit (valid vs rejected records breakdown), 24-field schema inspector, and benchmark dataset synthesis controls. |

---

## 3. Honest Machine Learning & Target Leakage Prevention

- **Strict Zero Target Leakage**: Models use ONLY variables realistically available *before pushback* (`dep_hour`, `day_of_week`, `origin_weather`, `wind_speed_knots`, `taxi_out_minutes` scheduled buffer, `historical_carrier_delay_rate`, etc.). Future post-departure variables (`arr_delay_minutes`, `dep_delay_minutes`, `actual_dep_time`, `actual_arr_time`, `air_time_minutes`, `delay_cause`) are strictly excluded.
- **Configurable Target Threshold**: Flight arrival delay is explicitly defined as `arr_delay_minutes >= 15` (FAA standard lateness threshold; configurable to 30 or 45 min).
- **Comparative Baseline**: Evaluates **Baseline Linear Model** (Logistic Regression with balanced weights) against **Stronger Candidate Model** (HistGradientBoosting tree ensemble) on an 80/20 holdout test split (250 flights).
- **Explainability & Scientific Transparency**: Explains each prediction through local feature deviations from nominal fleet baselines, accompanied by an explicit notice that observational ML demonstrates historical statistical correlation, not physical causality.

---

## 4. Big Data Processing Architecture

- **Local Memory Optimization (16GB RAM Windows Laptop)**:
  - Categorical dtype conversion reduces memory consumption by ~75%.
  - Downcasts numerics to `float32` and `int16`.
  - Supports chunked streaming (`chunksize=50000`) in `backend/app/data/big_data_processor.py`.
- **PySpark Architecture (`backend/app/data/spark_processor.py`)**:
  - Outlines the distributed PySpark DataFrame aggregation pipeline for cluster deployments (Google Cloud Dataproc / AWS EMR), while falling back cleanly to the memory-optimized Pandas engine locally without Java dependencies.

---

## 5. Quickstart & Local Setup on Windows

### Prerequisites
- **Python**: 3.10+ (Tested on Python 3.11)
- **Node.js**: 18+ (Tested on Node 22)
- **npm**: 9+

### Option A: One-Click Startup (Windows)
Double-click `start-dev.bat` or run in PowerShell:
```powershell
.\start-dev.ps1
```

### Option B: Manual Setup

#### 1. Setup Backend (Python)
```powershell
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Install requirements
pip install -r requirements.txt

# Run comparative model training
$env:PYTHONPATH="backend"
python app/ml/train_models.py

# Run backend test suite
python tests/test_data_processing_and_ml.py
python tests/test_api.py

# Start Flask backend server (port 8000)
python run.py
```
*Health check URL:* [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

#### 2. Setup Frontend (React + TypeScript)
In a separate terminal:
```powershell
cd frontend

# Install npm packages
npm install

# Start Vite dev server (port 5173)
npm run dev
```
*Frontend UI:* Open your browser at [http://localhost:5173](http://localhost:5173)

---

## 6. Supplying Historical Flight Datasets

See [docs/DATASET.md](docs/DATASET.md) for full attribution and download instructions.
1. Download official U.S. DOT BTS TranStats On-Time Reporting data or the Kaggle 2015 Flight Delays dataset.
2. Open the **Data Management** tab in the web interface and click **Upload Historical Flight Dataset (CSV)**.
3. The platform automatically maps headers (`CRS_DEP_TIME`, `ARR_DELAY`, `ORIGIN`, `DEST`, etc.), validates row integrity, detects rejected records, and generates an interactive Data Quality Report.
4. Click **Ingest & Activate Dataset** to process and retrain the predictive pipelines.

---

## 7. Running the Automated Test Suites

```powershell
cd backend
$env:PYTHONPATH="."

# Run entire backend test suite via unittest discovery (19 tests)
.\.venv\Scripts\python.exe -m unittest discover tests

# Or run individual test modules:
.\.venv\Scripts\python.exe tests/test_data_processing_and_ml.py   # 10 tests
.\.venv\Scripts\python.exe tests/test_api.py                      # 8 tests
.\.venv\Scripts\python.exe tests/test_e2e_journey.py              # 10-step full workflow
```
Actual output:
```
...................
----------------------------------------------------------------------
Ran 19 tests in 28.693s

OK
```

Verify frontend compilation with zero TypeScript errors:
```powershell
cd frontend
npm run build
```
Actual output:
```
✓ 1589 modules transformed.
dist/index.html                   1.19 kB │ gzip:  0.71 kB
dist/assets/index-IcoBIIYv.css   31.65 kB │ gzip:  6.13 kB
dist/assets/index-BNRSnPdH.js   256.44 kB │ gzip: 68.75 kB
✓ built in 10.13s
```

---

## 8. License & Academic Attribution
Developed as part of the **INSA Aviation Intelligence Research Project**. Open source under the MIT License.
Attribution: U.S. Department of Transportation Bureau of Transportation Statistics (BTS) TranStats.
