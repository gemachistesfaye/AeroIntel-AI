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
| 🗄️ **Data Management & Ingestion** | **CSV & ZIP Dataset Upload & Validation**, configurable BTS TranStats schema mapping (with numeric Airport ID resolution), chunked profiling (>15 MB), data quality audit, and benchmark fixture activation. |

---

## 3. Honest Machine Learning & Model Selection

- **Strict Zero Target Leakage**: `LeakagePolicyEnforcer` (`backend/app/ml/leakage_policy.py`) ensures models use ONLY pre-departure variables (`dep_hour`, `day_of_week`, `month`, `distance_miles`, `scheduled_elapsed_time`, `origin_weather`, `wind_speed_knots`, `taxi_out_minutes` scheduled buffer, `historical_carrier_delay_rate`, etc.). Post-departure variables (`arr_delay_minutes`, `dep_delay_minutes`, `actual_dep_time`, `actual_arr_time`, `air_time_minutes`, `delay_cause`, `carrier_delay`, `weather_delay`, `nas_delay`, `security_delay`, `late_aircraft_delay`) are strictly excluded at both training and prediction time.
- **Configurable Target Threshold & Task**: Supports `arrival_delay_classification` (`arr_delay_minutes >= 15`, FAA standard) and `departure_delay_classification`, dynamically re-trainable (e.g., 15, 30, or 45 min) via `/api/model/retrain`.
- **Chronological Train/Test Split**: Chronological 80/20 holdout split sorted by `flight_date` (`1,154` training rows / `289` held-out test rows from the `1,443` completed flights in the `2024-06-01` to `2024-06-30` benchmark fixture; `57` cancelled/diverted rows are tracked in profiling and excluded from delay modeling).
- **Preprocessing Fitted Only on Training Split**: Preprocessors (`SimpleImputer`, `StandardScaler`, `OneHotEncoder`) are fit strictly inside `Pipeline` on the training split only, preventing data leakage.
- **Empirical Model Selection (ROC-AUC Criterion)**:
  - **Candidate HistGradientBoosting (Auto-Selected by ROC-AUC)**: Achieved **ROC-AUC: 0.5182**, **PR-AUC: 0.3261**, **Accuracy: 60.55%**, and **F1: 0.3294** (`32.94%` recall / precision).
  - **Baseline Logistic Regression (Balanced Class Weights)**: Achieved **ROC-AUC: 0.5090**, **PR-AUC: 0.3193**, **F1: 0.3898**, higher **Recall: 54.12%** (`46 / 85` delayed flights caught), and **Accuracy: 50.17%**.
  - **Delay Duration Regressor (`RandomForestRegressor`)**: **MAE: 25.26 min**, **RMSE: 39.78 min**, **$R^2$: -0.0182**.
  - Users can toggle dynamically between `candidate` (*HistGradientBoosting*) and `baseline` (*Logistic Regression*) in the **Predict Delay Engine**.

### Verified Benchmark Evaluation Scorecard (Chronological 20% Holdout Test Split, $N=289$)

| Evaluation Metric | Naive Majority Baseline | Baseline (Logistic Regression) | Selected Model (HistGradientBoosting) |
|---|---|---|---|
| **Model Type** | Zero-Intelligence Dummy | Linear Classifier (`balanced`) | Non-Linear Tree Ensemble (`balanced`) |
| **ROC-AUC** | 0.5000 | 0.5090 | **0.5182** |
| **PR-AUC** | — | 0.3193 | **0.3261** |
| **F1 Score** | 0.0000 | **0.3898** | 0.3294 |
| **Recall (Delays Caught)** | 0.00% (0 / 85) | **54.12%** (46 / 85) | 32.94% (28 / 85) |
| **Precision** | 0.00% | 30.46% | **32.94%** |
| **Accuracy** | **70.96%** (Dataset Majority) | 50.17% | 60.55% |
| **Confusion Matrix** | `[[204, 0], [85, 0]]` | `[[99, 105], [39, 46]]` | `[[147, 57], [57, 28]]` |

> **Known Model & Benchmark Limitation**: Because the built-in 1,443-flight fixture is a small synthetic benchmark with weak signal-to-noise separation when evaluated chronologically without post-flight leakage, both classifiers perform near chance (`ROC-AUC ~0.51–0.52`) and the duration regressor yields negative $R^2$ (`-0.0182`). Uploading genuine multi-month U.S. DOT BTS TranStats historical archives via **Data Management** is recommended for substantive predictive signal.

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
$env:PYTHONPATH="."
python app/ml/train_models.py

# Run backend test suite
python -m unittest discover -s tests -t . -v

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

## 6. Dataset Provenance, Limitations & Benchmark Transparency

- **Built-in Fixture (`bts_flight_sample.csv` / active `sample_flights.csv`)**: The default repository benchmark fixture contains **1,500 BTS-schema rows** (**1,443 valid completed flights** plus **57 cancelled/diverted records** tracked separately and excluded from delay training) spanning `2024-06-01` to `2024-06-30` across 26 official BTS columns. It is a **Calibrated Aviation Benchmark Dataset (Synthetic Sample)** (`CALIBRATED_BENCHMARK_SYNTHETIC`) provided for immediate out-of-the-box local execution, offline validation, and automated testing.
- **Genuine Historical Data Ingestion (CSV & ZIP)**: `FlightDataIngestionPipeline` (`backend/app/data/ingestion.py`) ingests official U.S. DOT BTS Reporting Carrier On-Time Performance `.csv` and `.zip` archives (with Zip Slip protection, temporary archive extraction, and chunked profiling for files >15 MB). Originals uploaded via the UI are preserved in `backend/app/data/uploads/` without silently overwriting source archives.
- **Scientific Honesty & Known Limitations**:
  - Benchmark data is explicitly labeled `CALIBRATED BENCHMARK (SYNTHETIC SAMPLE)` in the API, artifacts, and UI, and is never presented as genuine raw airline telemetry or black-box radar logs.
  - Because `bts_flight_sample.csv` is synthetic, its holdout predictive metrics (`ROC-AUC: 0.5182` HistGradientBoosting / `0.5090` LogisticRegression; regression $R^2$: `-0.0182`) reflect limited pre-departure separability.
  - Official BTS TranStats exports that omit 3-letter IATA columns (`ORIGIN`, `DEST`) and provide only numeric DOT IDs (`ORIGIN_AIRPORT_ID`, `DEST_AIRPORT_ID`) depend on the built-in Airport ID mapping table; full analytics require selecting `FL_DATE`, `OP_UNIQUE_CARRIER`, `ORIGIN`, `DEST`, `CRS_DEP_TIME`, `ARR_DELAY`, and `DISTANCE`.
  - See [docs/DATASET.md](docs/DATASET.md) for full BTS TranStats field mappings and download instructions.

---

## 7. Supplying Historical Flight Datasets

See [docs/DATASET.md](docs/DATASET.md) for full attribution and download instructions.
1. Download official U.S. DOT BTS TranStats Reporting Carrier On-Time Performance data (`.csv` or `.zip`).
2. Open the **Data Management** tab in the web interface and upload the `.csv` or `.zip` archive.
3. The platform automatically maps BTS headers (`FL_DATE`, `OP_UNIQUE_CARRIER`, `ORIGIN`, `DEST`, `CRS_DEP_TIME`, `ARR_DELAY`, `CANCELLED`, `DIVERTED`, delay causes, etc.), resolves numeric Airport IDs when supported, profiles missing/duplicate/cancelled/diverted records, and generates a **Data Quality Report**.
4. Click **Ingest & Activate Dataset** to normalize rows into the active workspace dataset and retrain the predictive models.

---

## 8. Running the Automated Test Suites

```powershell
cd backend
$env:PYTHONPATH="."

# Run entire backend test suite via unittest discovery (30 tests)
.\.venv\Scripts\python.exe -m unittest discover -s tests -t . -v

# Or run individual test modules:
.\.venv\Scripts\python.exe -m unittest tests.test_data_processing_and_ml -v  # 20 tests
.\.venv\Scripts\python.exe -m unittest tests.test_api -v                      # 9 tests
.\.venv\Scripts\python.exe -m unittest tests.test_e2e_journey -v              # 1 (10-step E2E workflow)
```

Verify frontend TypeScript compilation (with unused-local checking) and Vite production bundle build:
```powershell
cd frontend
.\node_modules\.bin\tsc.cmd -p tsconfig.json --noEmit --noUnusedLocals
npm run build
```

---

## 9. License & Academic Attribution
Developed as part of the **INSA Aviation Intelligence Research Project**. Open source under the MIT License.
Attribution: U.S. Department of Transportation Bureau of Transportation Statistics (BTS) TranStats.
