# Methodology, Data Engineering & Machine Learning Formulation

## 1. Target Variable Formulation & Delay Thresholds

Under **Federal Aviation Administration (FAA)** and **Bureau of Transportation Statistics (BTS)** standards, a commercial flight is categorized as delayed if it arrives at the gate **15 minutes or later** than its scheduled arrival time ($T_{\text{sched}}$).

We define the binary target classification variable explicitly as:
$$y = \begin{cases} 1 & \text{if } \text{arr\_delay\_minutes} \ge \tau \\ 0 & \text{if } \text{arr\_delay\_minutes} < \tau \end{cases}$$
where $\tau$ is the configurable delay threshold (default: $\tau = 15$ minutes; reconfigurable to $\tau = 30$ or $\tau = 45$ minutes via `/api/model/retrain`).

For the continuous regression task, the target variable is $\widehat{y}_{\text{reg}} \in \mathbb{R}$, representing the expected late arrival duration in minutes.

---

## 2. Prevention of Target Leakage

A common defect in flight delay modeling is accidentally including variables that are only known **after** takeoff or touchdown.

To ensure physical and operational validity, our preprocessing pipeline strictly enforces a **Zero Target Leakage Blocklist**:

| Variable | Availability | Status in Model | Reason |
|---|---|---|---|
| `arr_delay_minutes` | Post-Arrival | ❌ **Excluded** | Ground-truth target variable |
| `dep_delay_minutes` | Post-Departure | ❌ **Excluded** | Future information when predicting prior to departure |
| `actual_dep_time` / `actual_arr_time` | Post-Flight | ❌ **Excluded** | Unknown prior to flight pushback |
| `air_time_minutes` | Post-Flight | ❌ **Excluded** | Airborne duration measured after landing |
| `delay_cause` | Post-Arrival | ❌ **Excluded** | Cause assigned post-mortem by dispatch |
| `scheduled_dep_time` | Pre-Departure | ✅ **Included** | Available at schedule publication |
| `origin_weather` / `dest_weather` | Pre-Departure | ✅ **Included** | Aerodrome terminal forecast (METAR/TAF) |
| `wind_speed_knots` | Pre-Departure | ✅ **Included** | Sustained runway surface crosswinds |
| `taxi_out_minutes` (scheduled buffer) | Pre-Departure | ✅ **Included** | Airport nominal taxi baseline |
| `historical_carrier_delay_rate` | Pre-Departure | ✅ **Included** | Carrier historical punctuality track record |

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

- **Train/Test Split**: 80% Training ($N=1,000$), 20% Holdout Test ($N=250$) stratified on the binary target.
- **Naive Majority Class Dummy**: In an aviation dataset where 68.5% of flights are on-time, a zero-intelligence dummy model predicting "Always On-Time" achieves **68.5% raw accuracy**, yet fails completely with **0% recall** on delayed flights.
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
