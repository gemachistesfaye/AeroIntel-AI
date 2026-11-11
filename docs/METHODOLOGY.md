# Methodology, Data Engineering & Machine Learning Formulation

## 1. Target Variable Formulation & Delay Thresholds

Under **Federal Aviation Administration (FAA)** and **Bureau of Transportation Statistics (BTS)** standards, a commercial flight is categorized as delayed if it arrives at the gate **15 minutes or later** than its scheduled arrival time ($T_{\text{sched}}$).

The pipeline supports both `arrival_delay_classification` (default) and `departure_delay_classification` tasks via `train_and_compare_models()`. For arrival classification, we define the binary target variable explicitly as:
$$y = \begin{cases} 1 & \text{if } \text{arr\_delay\_minutes} \ge \tau \\ 0 & \text{if } \text{arr\_delay\_minutes} < \tau \end{cases}$$
where $\tau$ is the configurable delay threshold (default: $\tau = 15$ minutes; reconfigurable to $\tau = 30$ or $\tau = 45$ minutes via `/api/model/retrain`). Cancelled and diverted flights are tracked during dataset profiling and excluded from delay prediction targets.

For the continuous regression task (`RandomForestRegressor`), the target variable is $\widehat{y}_{\text{reg}} \in \mathbb{R}$, representing the expected arrival delay duration in minutes.

---

## 2. Prevention of Target Leakage

A common defect in flight delay modeling is accidentally including variables that are only known **after** takeoff or touchdown.

To ensure physical and operational validity, `LeakagePolicyEnforcer` (`backend/app/ml/leakage_policy.py`) strictly validates all feature columns against a **Pre-Departure Allowlist** and **Post-Departure Blocklist** at both training and API inference time:

| Variable | Availability | Status in Model | Reason |
|---|---|---|---|
| `arr_delay_minutes` / `arr_delay` / `arr_del15` | Post-Arrival | ❌ **Excluded** | Ground-truth target variable |
| `dep_delay_minutes` / `dep_delay` / `dep_del15` | Post-Departure | ❌ **Excluded** | Unknown prior to departure (blocked from arrival prediction) |
| `actual_dep_time` / `actual_arr_time` | Post-Flight | ❌ **Excluded** | Unknown prior to flight pushback |
| `air_time_minutes` / `actual_elapsed_time` / `taxi_in` | Post-Flight | ❌ **Excluded** | Measured only after departure/landing |
| `delay_cause` / `carrier_delay` / `weather_delay` / `nas_delay` / `security_delay` / `late_aircraft_delay` | Post-Arrival | ❌ **Excluded** | Cause assigned post-mortem by carrier/dispatch |
| `scheduled_dep_time` (`dep_hour`, `dep_minute`, cyclic `sin`/`cos`) | Pre-Departure | ✅ **Included** | Available at schedule publication |
| `scheduled_elapsed_time` & `distance_miles` | Pre-Departure | ✅ **Included** | Published schedule duration and corridor distance |
| `origin_weather` / `dest_weather` | Pre-Departure | ✅ **Included** | Terminal forecast / baseline defaults when absent |
| `wind_speed_knots` / `visibility_miles` / `precipitation_mm` | Pre-Departure | ✅ **Included** | Surface weather parameters |
| `taxi_out_minutes` (scheduled buffer) | Pre-Departure | ✅ **Included** | Airport nominal taxi baseline (imputed to median if unavailable in raw BTS) |
| `historical_carrier_delay_rate` | Pre-Departure | ✅ **Included** | Carrier baseline punctuality rate |

---

## 3. Comparative Model Architecture

We formulate delay prediction as a comparative machine learning benchmark between two distinct algorithmic paradigms:

### Model A: Linear Baseline (Logistic Regression)
- **Objective**: Establish an interpretable, transparent statistical baseline.
- **Formulation**:
  $$P(y = 1 \mid \mathbf{x}) = \sigma(\mathbf{w}^T \mathbf{x} + b) = \frac{1}{1 + e^{-(\mathbf{w}^T \mathbf{x} + b)}}$$
- **Class Imbalance**: Employs `class_weight='balanced'` to prevent bias toward the majority class (70% on-time flights).
- **Limitation**: Inability to capture non-linear cross-interactions between atmospheric and logistical variables.

### Model B: Stronger Candidate Model (Histogram Gradient Boosting)
- **Objective**: Capture non-linear interactions (e.g. convective thunderstorms combined with high crosswinds and peak evening schedule banking hours).
- **Formulation**: An ensemble of decision trees trained sequentially by gradient descent in function space, utilizing histogram binning (inspired by LightGBM):
  $$F_m(\mathbf{x}) = F_{m-1}(\mathbf{x}) + \gamma_m h_m(\mathbf{x})$$
- **Performance**: High computational efficiency on a 16GB RAM laptop, native handling of categorical features, and robustness to outliers.

---

## 4. Evaluation Strategy & Trade-Off Analysis

- **Chronological Train/Test Split**: Records are sorted chronologically by `flight_date` and split 80% Training / 20% Holdout Test (`N=1,154` train / `N=289` test on the `1,443` completed flights in the default benchmark fixture). Preprocessors (`SimpleImputer`, `StandardScaler`, `OneHotEncoder`) are fit exclusively on the training partition inside scikit-learn `Pipeline` objects.
- **Naive Majority Class Dummy**: In the built-in benchmark fixture (`71.0%` On-Time vs `29.0%` Delayed at $\tau=15$ min), a zero-intelligence majority baseline achieves **70.96% accuracy** with **0.00% recall** and **0.5000 ROC-AUC**.
- **Verified Benchmark Results (`threshold = 15 min`, Test $N=289$)**:
  - **HistGradientBoosting (Auto-Selected by ROC-AUC)**: Accuracy `60.55%`, Precision `32.94%`, Recall `32.94%`, F1 `0.3294`, ROC-AUC `0.5182`, PR-AUC `0.3261`, Confusion Matrix `[[147, 57], [57, 28]]`.
  - **Logistic Regression (`class_weight='balanced'`)**: Accuracy `50.17%`, Precision `30.46%`, Recall `54.12%`, F1 `0.3898`, ROC-AUC `0.5090`, PR-AUC `0.3193`, Confusion Matrix `[[99, 105], [39, 46]]`.
  - **RandomForestRegressor**: `MAE = 25.26 min`, `RMSE = 39.78 min`, `$R^2 = -0.0182$`.
  - *Honesty Note*: On the small synthetic benchmark fixture evaluated chronologically without leakage, pre-departure features exhibit near-random discrimination; genuine multi-month BTS TranStats datasets should be uploaded via Data Management for stronger operational modeling.
- **Evaluation Telemetry**:
  - **Accuracy**: Overall fraction of correct classifications.
  - **Precision**: $\frac{TP}{TP + FP}$ — proportion of delay alarms that were real disruptions. Low precision leads to airline dispatcher "alarm fatigue" and costly unnecessary gate reassignments.
  - **Recall**: $\frac{TP}{TP + FN}$ — proportion of actual delays successfully flagged before departure. High recall shields airlines and air traffic control from sudden ground delay programs (GDP).
  - **F1 Score**: Harmonic mean of Precision and Recall.
  - **ROC-AUC & PR-AUC**: Threshold-invariant discrimination capability.

---

## 5. Feature Attribution & Explainability

Individual flight predictions are decomposed using local attribution against reference training medians:
$$\text{Attribution}_j = \text{sign}(x_j - \bar{x}_j) \cdot \alpha_j \cdot 100\%$$
Every explanation is tagged with its historical association in the U.S. DOT BTS dataset, accompanied by a scientific notice that observational machine learning indicates statistical associations, not causal guarantees.
