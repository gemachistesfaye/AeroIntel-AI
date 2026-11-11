# Historical Flight Dataset Attribution & Supply Instructions

## 1. Primary Dataset Source & Attribution

The **AeroIntel AI Platform** is designed to process genuine historical commercial flight data from the **United States Department of Transportation (DOT) Bureau of Transportation Statistics (BTS)**.

- **Dataset Title**: Airline On-Time Performance Data (Reporting Carrier On-Time Performance)
- **Publishing Authority**: Bureau of Transportation Statistics (BTS), Office of the Assistant Secretary for Research and Technology, U.S. Department of Transportation
- **Attribution**: U.S. DOT BTS TranStats Public Data (14 CFR Part 234)
- **Official Portal**: [https://www.transtats.bts.gov/DL_SelectFields.aspx?gnoyr_VQ=FGJ](https://www.transtats.bts.gov/DL_SelectFields.aspx?gnoyr_VQ=FGJ)
- **Kaggle Mirror**: [https://www.kaggle.com/datasets/usdot/flight-delays](https://www.kaggle.com/datasets/usdot/flight-delays)

---

## 2. Core BTS Schema Mapping

The ingestion pipeline (`FlightDataIngestionPipeline` in `backend/app/data/ingestion.py`) automatically maps both uppercase/snake_case (`FL_DATE`, `OP_UNIQUE_CARRIER`) and PascalCase/camelCase (`FlightDate`, `Reporting_Airline`) BTS headers — and resolves numeric `OriginAirportID` / `DestAirportID` values when 3-letter IATA codes are absent — to the platform's standardized fields (`BTS_COLUMN_MAP` / `/api/data/schema-mapping`):

| BTS TranStats Column | Standardized Platform Field | Description |
|---|---|---|
| `FL_DATE` / `FlightDate` | `flight_date` | Flight date (YYYY-MM-DD) |
| `OP_UNIQUE_CARRIER` / `Reporting_Airline` | `carrier_code` | Operating airline 2-letter IATA code |
| `OP_CARRIER_FL_NUM` / `Flight_Number_Reporting_Airline` | `flight_number` | Flight numeric callsign |
| `ORIGIN` / `Origin` (or `OriginAirportID`) | `origin` | 3-letter departure aerodrome code |
| `DEST` / `Dest` (or `DestAirportID`) | `dest` | 3-letter arrival aerodrome code |
| `CRS_DEP_TIME` / `CRSDepTime` | `scheduled_dep_time` | Scheduled departure time (HHMM or HH:MM) |
| `CRS_ARR_TIME` / `CRSArrTime` | `scheduled_arr_time` | Scheduled arrival time (HHMM) |
| `DISTANCE` / `Distance` | `distance_miles` | Great circle distance in statute miles |
| `CRS_ELAPSED_TIME` / `CRSElapsedTime` | `scheduled_elapsed_time` | Planned flight duration in minutes |
| `DEP_DELAY` / `DepDelay` | `dep_delay_minutes` | Continuous departure delay (+ for late, - for early) |
| `ARR_DELAY` / `ArrDelay` | `arr_delay_minutes` | Continuous arrival delay (+ for late, - for early) |
| `ARR_DEL15` / `ArrDel15` | `is_delayed` | Ground-truth binary target ($\ge 15$ min delay) |
| `CANCELLED` / `DIVERTED` | `cancelled` / `diverted` | Operational disruption flags (tracked in profiling, excluded from delay modeling) |
| `WEATHER_DELAY`, `NAS_DELAY`, `CARRIER_DELAY`, `SECURITY_DELAY`, `LATE_AIRCRAFT_DELAY` | Normalized cause columns | Historical post-flight delay cause breakdowns (rendered in UI when present) |

---

## 3. How to Supply the Historical Dataset

You can supply genuine historical data using either of the following two methods:

### Method A: Via the Web Interface (Recommended)
1. Launch the platform and navigate to the **Data Management** tab.
2. In the **Dataset Upload & Ingestion** card, choose your downloaded BTS `.csv` or `.zip` archive (original uploads are preserved in `backend/app/data/uploads/`).
3. The platform executes the validation & streaming profiling pipeline (chunked for files >15 MB), checks column schemas, tracks cancelled/diverted and rejected/duplicate rows, and displays a complete **Data Quality Report**.
4. Click **Ingest & Activate Dataset** to save normalized records to the active workspace dataset and retrain the predictive models.

### Method B: Via CLI or Direct Placement
1. Download a monthly or yearly CSV/ZIP archive from BTS TranStats or Kaggle.
2. Place the file at:
   ```
   backend/app/data/sample_flights.csv
   ```
3. Run the ingestion pipeline from your terminal:
   ```powershell
   cd backend
   $env:PYTHONPATH="."
   .\.venv\Scripts\python.exe -c "from app.data.ingestion import ingestion_pipeline; from pathlib import Path; ingestion_pipeline.ingest_from_csv(Path('app/data/sample_flights.csv'))"
   ```

---

## 4. Built-in Benchmark Fixture & Limitations

For local testing and offline verification without downloading multi-gigabyte archives, the platform ships a calibrated synthetic benchmark fixture with official 26-column BTS headers at:
- **Source Fixture**: `backend/app/data/bts_flight_sample.csv` (`1,500` input records spanning `2024-06-01` to `2024-06-30` across 6 carriers: `AA`, `AS`, `B6`, `DL`, `UA`, `WN`; yields `1,443` valid completed flights plus `57` cancelled/diverted records excluded from delay modeling).
- **Active Workspace File**: Clicking **Reload Benchmark Sample** (or `/api/data/regenerate`) normalizes `bts_flight_sample.csv` into `backend/app/data/sample_flights.csv`.

All synthetic benchmark outputs are explicitly labeled `CALIBRATED BENCHMARK (SYNTHETIC SAMPLE)` in the API and UI to maintain scientific transparency. Note that BTS TranStats exports containing *only* numeric DOT airport IDs without IATA columns rely on the built-in `AirportIDResolver` lookup table; selecting `ORIGIN`, `DEST`, `FL_DATE`, `OP_UNIQUE_CARRIER`, `CRS_DEP_TIME`, `ARR_DELAY`, and `DISTANCE` in TranStats ensures full coverage.

