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

The ingestion pipeline (`FlightDataIngestionPipeline` in `backend/app/data/ingestion.py`) automatically maps official BTS column headers to the platform's standardized internal features:

| BTS TranStats Column | Standardized Platform Field | Description |
|---|---|---|
| `FL_DATE` | `flight_date` | Flight date (YYYY-MM-DD) |
| `OP_UNIQUE_CARRIER` / `UNIQUE_CARRIER` | `carrier_code` | Operating airline 2-letter IATA code |
| `OP_CARRIER_FL_NUM` / `FL_NUM` | `flight_number` | Flight numeric callsign |
| `ORIGIN` | `origin` | 3-letter departure aerodrome code |
| `DEST` | `dest` | 3-letter arrival aerodrome code |
| `CRS_DEP_TIME` | `scheduled_dep_time` | Scheduled departure time (HHMM or HH:MM) |
| `CRS_ARR_TIME` | `scheduled_arr_time` | Scheduled arrival time (HHMM) |
| `DISTANCE` | `distance_miles` | Great circle distance in statute miles |
| `CRS_ELAPSED_TIME` | `scheduled_elapsed_time` | Planned flight duration in minutes |
| `ARR_DELAY` | `arr_delay_minutes` | Continuous arrival delay (+ for late, - for early) |
| `ARR_DEL15` | `is_delayed` | Ground-truth binary target ($\ge 15$ min delay) |
| `WEATHER_DELAY` | `weather_delay` | Delay attributable to weather conditions |
| `NAS_DELAY` | `nas_delay` | Delay attributable to National Airspace System |
| `CARRIER_DELAY` | `carrier_delay` | Delay attributable to airline maintenance/crew |

---

## 3. How to Supply the Historical Dataset

You can supply genuine historical data using either of the following two methods:

### Method A: Via the Web Interface (Recommended)
1. Launch the platform and navigate to the **Data Management** tab.
2. In the **Dataset Upload & Ingestion** card, click **Choose File** and select your downloaded BTS CSV file.
3. The platform executes the validation pipeline, checks column schemas, filters corrupted rows, and displays a complete **Data Quality Report** (Input rows, Valid rows, Rejection reasons, Acceptance rate).
4. Click **Ingest & Process Dataset** to save the clean dataset and update the operational analytics.

### Method B: Via CLI or Direct Placement
1. Download a monthly or yearly CSV archive from BTS TranStats or Kaggle.
2. Place the file at:
   ```
   backend/app/data/sample_flights.csv
   ```
   *(Or place it in `backend/app/data/historical/flights.csv`)*
3. Run the ingestion pipeline from your terminal:
   ```powershell
   cd backend
   $env:PYTHONPATH="backend"
   .\.venv\Scripts\python.exe -c "from app.data.ingestion import ingestion_pipeline; from pathlib import Path; ingestion_pipeline.ingest_from_csv(Path('app/data/sample_flights.csv'))"
   ```

---

## 4. Built-in Benchmark Fixture

For local testing and offline verification without downloading multi-gigabyte files, the platform provides a calibrated historical sample fixture at:
`backend/app/data/sample_flights.csv` (1,250 records across Delta, United, American, Southwest, JetBlue, and Alaska between top U.S. hubs).
All demo or benchmark data is explicitly labeled with the `DEMO BENCHMARK DATASET` indicator to maintain scientific transparency.

