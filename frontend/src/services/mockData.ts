import {
  DashboardSummary,
  Flight,
  RouteIntelligenceData,
  ModelComparisonData,
  DataManagementInfo,
  DataQualityReport,
  PredictionResponse,
  PredictionRequest
} from '../types/aviation';

export const MOCK_FLIGHTS: Flight[] = [
  {
    flight_id: 'DL-1432',
    flight_date: '2026-10-24',
    carrier_code: 'DL',
    carrier_name: 'Delta Air Lines',
    origin: 'ATL',
    origin_name: 'Hartsfield-Jackson Atlanta',
    dest: 'LAX',
    dest_name: 'Los Angeles International',
    route: 'ATL-LAX',
    distance_miles: 1946,
    scheduled_dep_time: '17:30',
    dep_hour: 17,
    dep_minute: 30,
    day_of_week: 4,
    month: 10,
    origin_weather: 'Thunderstorm',
    dest_weather: 'Clear',
    wind_speed_knots: 28,
    visibility_miles: 3.5,
    precipitation_mm: 14.2,
    congestion_level: 'High',
    taxi_out_minutes: 34,
    historical_carrier_delay_rate: 0.18,
    arr_delay_minutes: 58,
    is_delayed: 1,
    delay_cause: 'Weather',
    delay_risk_tier: 'Severe',
    dataset_label: 'FAA/BTS Benchmark'
  },
  {
    flight_id: 'UA-2041',
    flight_date: '2026-10-24',
    carrier_code: 'UA',
    carrier_name: 'United Airlines',
    origin: 'ORD',
    origin_name: "Chicago O'Hare",
    dest: 'SFO',
    dest_name: 'San Francisco International',
    route: 'ORD-SFO',
    distance_miles: 1846,
    scheduled_dep_time: '08:15',
    dep_hour: 8,
    dep_minute: 15,
    day_of_week: 4,
    month: 10,
    origin_weather: 'Clear',
    dest_weather: 'Fog',
    wind_speed_knots: 9,
    visibility_miles: 10.0,
    precipitation_mm: 0.0,
    congestion_level: 'Moderate',
    taxi_out_minutes: 19,
    historical_carrier_delay_rate: 0.22,
    arr_delay_minutes: 4,
    is_delayed: 0,
    delay_cause: 'On Time',
    delay_risk_tier: 'Low',
    dataset_label: 'FAA/BTS Benchmark'
  },
  {
    flight_id: 'AA-0892',
    flight_date: '2026-10-24',
    carrier_code: 'AA',
    carrier_name: 'American Airlines',
    origin: 'DFW',
    origin_name: 'Dallas/Fort Worth',
    dest: 'JFK',
    dest_name: 'John F. Kennedy New York',
    route: 'DFW-JFK',
    distance_miles: 1391,
    scheduled_dep_time: '14:45',
    dep_hour: 14,
    dep_minute: 45,
    day_of_week: 4,
    month: 10,
    origin_weather: 'Light Rain',
    dest_weather: 'Heavy Rain',
    wind_speed_knots: 22,
    visibility_miles: 5.0,
    precipitation_mm: 6.8,
    congestion_level: 'High',
    taxi_out_minutes: 29,
    historical_carrier_delay_rate: 0.24,
    arr_delay_minutes: 38,
    is_delayed: 1,
    delay_cause: 'Air Traffic Control (NAS)',
    delay_risk_tier: 'High',
    dataset_label: 'FAA/BTS Benchmark'
  },
  {
    flight_id: 'WN-3150',
    flight_date: '2026-10-24',
    carrier_code: 'WN',
    carrier_name: 'Southwest Airlines',
    origin: 'DEN',
    origin_name: 'Denver International',
    dest: 'PHX',
    dest_name: 'Phoenix Sky Harbor',
    route: 'DEN-PHX',
    distance_miles: 602,
    scheduled_dep_time: '11:20',
    dep_hour: 11,
    dep_minute: 20,
    day_of_week: 4,
    month: 10,
    origin_weather: 'Clear',
    dest_weather: 'Clear',
    wind_speed_knots: 7,
    visibility_miles: 10.0,
    precipitation_mm: 0.0,
    congestion_level: 'Low',
    taxi_out_minutes: 14,
    historical_carrier_delay_rate: 0.21,
    arr_delay_minutes: -6,
    is_delayed: 0,
    delay_cause: 'On Time',
    delay_risk_tier: 'Low',
    dataset_label: 'FAA/BTS Benchmark'
  },
  {
    flight_id: 'B6-0419',
    flight_date: '2026-10-24',
    carrier_code: 'B6',
    carrier_name: 'JetBlue Airways',
    origin: 'BOS',
    origin_name: 'Boston Logan',
    dest: 'MIA',
    dest_name: 'Miami International',
    route: 'BOS-MIA',
    distance_miles: 1258,
    scheduled_dep_time: '19:10',
    dep_hour: 19,
    dep_minute: 10,
    day_of_week: 4,
    month: 10,
    origin_weather: 'Heavy Rain',
    dest_weather: 'Thunderstorm',
    wind_speed_knots: 31,
    visibility_miles: 2.0,
    precipitation_mm: 19.5,
    congestion_level: 'Severe',
    taxi_out_minutes: 41,
    historical_carrier_delay_rate: 0.29,
    arr_delay_minutes: 74,
    is_delayed: 1,
    delay_cause: 'Weather',
    delay_risk_tier: 'Severe',
    dataset_label: 'FAA/BTS Benchmark'
  },
  {
    flight_id: 'AS-0128',
    flight_date: '2026-10-24',
    carrier_code: 'AS',
    carrier_name: 'Alaska Airlines',
    origin: 'SEA',
    origin_name: 'Seattle-Tacoma',
    dest: 'SFO',
    dest_name: 'San Francisco International',
    route: 'SEA-SFO',
    distance_miles: 679,
    scheduled_dep_time: '09:00',
    dep_hour: 9,
    dep_minute: 0,
    day_of_week: 4,
    month: 10,
    origin_weather: 'Light Rain',
    dest_weather: 'Fog',
    wind_speed_knots: 12,
    visibility_miles: 8.0,
    precipitation_mm: 2.1,
    congestion_level: 'Moderate',
    taxi_out_minutes: 17,
    historical_carrier_delay_rate: 0.16,
    arr_delay_minutes: 8,
    is_delayed: 0,
    delay_cause: 'On Time',
    delay_risk_tier: 'Low',
    dataset_label: 'FAA/BTS Benchmark'
  },
  {
    flight_id: 'DL-0612',
    flight_date: '2026-10-24',
    carrier_code: 'DL',
    carrier_name: 'Delta Air Lines',
    origin: 'JFK',
    origin_name: 'John F. Kennedy New York',
    dest: 'LAX',
    dest_name: 'Los Angeles International',
    route: 'JFK-LAX',
    distance_miles: 2475,
    scheduled_dep_time: '16:00',
    dep_hour: 16,
    dep_minute: 0,
    day_of_week: 4,
    month: 10,
    origin_weather: 'Thunderstorm',
    dest_weather: 'Clear',
    wind_speed_knots: 26,
    visibility_miles: 4.0,
    precipitation_mm: 11.0,
    congestion_level: 'High',
    taxi_out_minutes: 36,
    historical_carrier_delay_rate: 0.18,
    arr_delay_minutes: 46,
    is_delayed: 1,
    delay_cause: 'Air Traffic Control (NAS)',
    delay_risk_tier: 'High',
    dataset_label: 'FAA/BTS Benchmark'
  },
  {
    flight_id: 'UA-0551',
    flight_date: '2026-10-24',
    carrier_code: 'UA',
    carrier_name: 'United Airlines',
    origin: 'DEN',
    origin_name: 'Denver International',
    dest: 'ORD',
    dest_name: "Chicago O'Hare",
    route: 'DEN-ORD',
    distance_miles: 888,
    scheduled_dep_time: '13:15',
    dep_hour: 13,
    dep_minute: 15,
    day_of_week: 4,
    month: 10,
    origin_weather: 'Clear',
    dest_weather: 'Clear',
    wind_speed_knots: 11,
    visibility_miles: 10.0,
    precipitation_mm: 0.0,
    congestion_level: 'Moderate',
    taxi_out_minutes: 18,
    historical_carrier_delay_rate: 0.22,
    arr_delay_minutes: 2,
    is_delayed: 0,
    delay_cause: 'On Time',
    delay_risk_tier: 'Low',
    dataset_label: 'FAA/BTS Benchmark'
  },
  {
    flight_id: 'AA-1804',
    flight_date: '2026-10-24',
    carrier_code: 'AA',
    carrier_name: 'American Airlines',
    origin: 'CLT',
    origin_name: 'Charlotte Douglas',
    dest: 'MIA',
    dest_name: 'Miami International',
    route: 'CLT-MIA',
    distance_miles: 651,
    scheduled_dep_time: '18:40',
    dep_hour: 18,
    dep_minute: 40,
    day_of_week: 4,
    month: 10,
    origin_weather: 'Light Rain',
    dest_weather: 'Clear',
    wind_speed_knots: 16,
    visibility_miles: 7.0,
    precipitation_mm: 3.5,
    congestion_level: 'High',
    taxi_out_minutes: 26,
    historical_carrier_delay_rate: 0.24,
    arr_delay_minutes: 22,
    is_delayed: 1,
    delay_cause: 'Late Inbound Aircraft',
    delay_risk_tier: 'Moderate',
    dataset_label: 'FAA/BTS Benchmark'
  },
  {
    flight_id: 'WN-2209',
    flight_date: '2026-10-24',
    carrier_code: 'WN',
    carrier_name: 'Southwest Airlines',
    origin: 'PHX',
    origin_name: 'Phoenix Sky Harbor',
    dest: 'LAX',
    dest_name: 'Los Angeles International',
    route: 'PHX-LAX',
    distance_miles: 370,
    scheduled_dep_time: '15:10',
    dep_hour: 15,
    dep_minute: 10,
    day_of_week: 4,
    month: 10,
    origin_weather: 'Clear',
    dest_weather: 'Clear',
    wind_speed_knots: 6,
    visibility_miles: 10.0,
    precipitation_mm: 0.0,
    congestion_level: 'Low',
    taxi_out_minutes: 12,
    historical_carrier_delay_rate: 0.21,
    arr_delay_minutes: -4,
    is_delayed: 0,
    delay_cause: 'On Time',
    delay_risk_tier: 'Low',
    dataset_label: 'FAA/BTS Benchmark'
  }
];

export const MOCK_DASHBOARD_SUMMARY: DashboardSummary = {
  dataset_label: 'Calibrated Benchmark Dataset (1,250 Flights)',
  total_flights: 1250,
  on_time_rate_pct: 68.5,
  avg_delay_minutes: 10.8,
  avg_delay_when_delayed_minutes: 34.3,
  delayed_flights_count: 394,
  causes_breakdown: [
    { cause: 'On Time', count: 856, percentage: 68.5 },
    { cause: 'Weather Disruption', count: 223, percentage: 17.8 },
    { cause: 'Air Traffic Control (NAS)', count: 98, percentage: 7.8 },
    { cause: 'Late Inbound Aircraft', count: 37, percentage: 3.0 },
    { cause: 'Carrier Maintenance', count: 36, percentage: 2.9 }
  ],
  carrier_performance: [
    { code: 'AS', name: 'Alaska Airlines', total_flights: 145, delayed_flights: 29, on_time_rate: 80.0, avg_delay_minutes: 6.2 },
    { code: 'DL', name: 'Delta Air Lines', total_flights: 310, delayed_flights: 78, on_time_rate: 74.8, avg_delay_minutes: 8.5 },
    { code: 'WN', name: 'Southwest Airlines', total_flights: 275, delayed_flights: 88, on_time_rate: 68.0, avg_delay_minutes: 11.4 },
    { code: 'UA', name: 'United Airlines', total_flights: 260, delayed_flights: 89, on_time_rate: 65.8, avg_delay_minutes: 12.8 },
    { code: 'AA', name: 'American Airlines', total_flights: 185, delayed_flights: 74, on_time_rate: 60.0, avg_delay_minutes: 15.6 },
    { code: 'B6', name: 'JetBlue Airways', total_flights: 75, delayed_flights: 36, on_time_rate: 52.0, avg_delay_minutes: 19.8 }
  ],
  hourly_trend: [
    { hour: '06:00', flights: 48, delayed: 4, delay_rate_pct: 8.3, avg_delay_min: 2.1 },
    { hour: '07:00', flights: 72, delayed: 9, delay_rate_pct: 12.5, avg_delay_min: 4.5 },
    { hour: '08:00', flights: 94, delayed: 16, delay_rate_pct: 17.0, avg_delay_min: 6.2 },
    { hour: '09:00', flights: 88, delayed: 19, delay_rate_pct: 21.6, avg_delay_min: 7.8 },
    { hour: '10:00', flights: 82, delayed: 21, delay_rate_pct: 25.6, avg_delay_min: 9.1 },
    { hour: '11:00', flights: 76, delayed: 22, delay_rate_pct: 28.9, avg_delay_min: 10.4 },
    { hour: '12:00', flights: 84, delayed: 26, delay_rate_pct: 31.0, avg_delay_min: 11.2 },
    { hour: '13:00', flights: 79, delayed: 25, delay_rate_pct: 31.6, avg_delay_min: 11.8 },
    { hour: '14:00', flights: 86, delayed: 30, delay_rate_pct: 34.9, avg_delay_min: 13.5 },
    { hour: '15:00', flights: 91, delayed: 35, delay_rate_pct: 38.5, avg_delay_min: 14.8 },
    { hour: '16:00', flights: 102, delayed: 43, delay_rate_pct: 42.2, avg_delay_min: 16.4 },
    { hour: '17:00', flights: 118, delayed: 54, delay_rate_pct: 45.8, avg_delay_min: 18.2 },
    { hour: '18:00', flights: 112, delayed: 49, delay_rate_pct: 43.8, avg_delay_min: 17.5 },
    { hour: '19:00', flights: 96, delayed: 39, delay_rate_pct: 40.6, avg_delay_min: 15.9 },
    { hour: '20:00', flights: 74, delayed: 28, delay_rate_pct: 37.8, avg_delay_min: 14.1 },
    { hour: '21:00', flights: 54, delayed: 18, delay_rate_pct: 33.3, avg_delay_min: 12.0 },
    { hour: '22:00', flights: 36, delayed: 10, delay_rate_pct: 27.8, avg_delay_min: 9.8 }
  ],
  recent_disruptions: [
    { flight_id: 'DL-1432', route: 'ATL-LAX', carrier_code: 'DL', arr_delay_minutes: 58, delay_cause: 'Weather', delay_risk_tier: 'Severe' },
    { flight_id: 'B6-0419', route: 'BOS-MIA', carrier_code: 'B6', arr_delay_minutes: 74, delay_cause: 'Weather', delay_risk_tier: 'Severe' },
    { flight_id: 'AA-0892', route: 'DFW-JFK', carrier_code: 'AA', arr_delay_minutes: 38, delay_cause: 'Air Traffic Control (NAS)', delay_risk_tier: 'High' },
    { flight_id: 'DL-0612', route: 'JFK-LAX', carrier_code: 'DL', arr_delay_minutes: 46, delay_cause: 'Air Traffic Control (NAS)', delay_risk_tier: 'High' },
    { flight_id: 'AA-1804', route: 'CLT-MIA', carrier_code: 'AA', arr_delay_minutes: 22, delay_cause: 'Late Inbound Aircraft', delay_risk_tier: 'Moderate' }
  ]
};

export const MOCK_ROUTE_INTELLIGENCE: RouteIntelligenceData = {
  dataset_label: 'National Air Corridor & Hub Network',
  corridors: [
    { route: 'JFK-LAX', origin: 'JFK', dest: 'LAX', total_flights: 58, delayed_flights: 24, on_time_pct: 58.6, avg_delay_minutes: 18.2, avg_taxi_minutes: 28.4, congestion_index: 82, distance_miles: 2475, active_carriers: ['DL', 'AA'] },
    { route: 'ORD-LAX', origin: 'ORD', dest: 'LAX', total_flights: 52, delayed_flights: 19, on_time_pct: 63.5, avg_delay_minutes: 14.8, avg_taxi_minutes: 22.1, congestion_index: 74, distance_miles: 1744, active_carriers: ['UA', 'AA'] },
    { route: 'ATL-LAX', origin: 'ATL', dest: 'LAX', total_flights: 48, delayed_flights: 17, on_time_pct: 64.6, avg_delay_minutes: 13.9, avg_taxi_minutes: 18.5, congestion_index: 72, distance_miles: 1946, active_carriers: ['DL'] },
    { route: 'ATL-ORD', origin: 'ATL', dest: 'ORD', total_flights: 45, delayed_flights: 15, on_time_pct: 66.7, avg_delay_minutes: 12.1, avg_taxi_minutes: 19.0, congestion_index: 68, distance_miles: 606, active_carriers: ['UA', 'DL'] },
    { route: 'DFW-ORD', origin: 'DFW', dest: 'ORD', total_flights: 42, delayed_flights: 14, on_time_pct: 66.7, avg_delay_minutes: 11.8, avg_taxi_minutes: 20.2, congestion_index: 65, distance_miles: 802, active_carriers: ['AA', 'UA'] },
    { route: 'BOS-MIA', origin: 'BOS', dest: 'MIA', total_flights: 38, delayed_flights: 16, on_time_pct: 57.9, avg_delay_minutes: 19.4, avg_taxi_minutes: 24.1, congestion_index: 79, distance_miles: 1258, active_carriers: ['B6', 'AA'] },
    { route: 'DFW-JFK', origin: 'DFW', dest: 'JFK', total_flights: 36, delayed_flights: 13, on_time_pct: 63.9, avg_delay_minutes: 13.5, avg_taxi_minutes: 21.5, congestion_index: 71, distance_miles: 1391, active_carriers: ['AA', 'DL'] },
    { route: 'SEA-SFO', origin: 'SEA', dest: 'SFO', total_flights: 34, delayed_flights: 9, on_time_pct: 73.5, avg_delay_minutes: 8.7, avg_taxi_minutes: 16.2, congestion_index: 52, distance_miles: 679, active_carriers: ['AS', 'UA'] },
    { route: 'DEN-ORD', origin: 'DEN', dest: 'ORD', total_flights: 32, delayed_flights: 8, on_time_pct: 75.0, avg_delay_minutes: 8.1, avg_taxi_minutes: 17.0, congestion_index: 48, distance_miles: 888, active_carriers: ['UA', 'WN'] },
    { route: 'DEN-PHX', origin: 'DEN', dest: 'PHX', total_flights: 30, delayed_flights: 6, on_time_pct: 80.0, avg_delay_minutes: 5.4, avg_taxi_minutes: 14.5, congestion_index: 38, distance_miles: 602, active_carriers: ['WN'] },
    { route: 'CLT-MIA', origin: 'CLT', dest: 'MIA', total_flights: 28, delayed_flights: 8, on_time_pct: 71.4, avg_delay_minutes: 9.6, avg_taxi_minutes: 17.8, congestion_index: 55, distance_miles: 651, active_carriers: ['AA'] },
    { route: 'SFO-JFK', origin: 'SFO', dest: 'JFK', total_flights: 26, delayed_flights: 11, on_time_pct: 57.7, avg_delay_minutes: 18.9, avg_taxi_minutes: 22.8, congestion_index: 81, distance_miles: 2586, active_carriers: ['UA', 'B6'] }
  ],
  hubs: [
    { airport_code: 'ORD', airport_name: "Chicago O'Hare", departures_count: 285, delayed_departures: 104, punctuality_pct: 63.5, avg_taxi_minutes: 22.4, congestion_tier: 'High' },
    { airport_code: 'JFK', airport_name: 'John F. Kennedy New York', departures_count: 220, delayed_departures: 86, punctuality_pct: 60.9, avg_taxi_minutes: 28.6, congestion_tier: 'Severe' },
    { airport_code: 'MIA', airport_name: 'Miami International', departures_count: 165, delayed_departures: 61, punctuality_pct: 63.0, avg_taxi_minutes: 19.8, congestion_tier: 'Moderate' },
    { airport_code: 'DFW', airport_name: 'Dallas/Fort Worth', departures_count: 240, delayed_departures: 81, punctuality_pct: 66.3, avg_taxi_minutes: 20.2, congestion_tier: 'Moderate' },
    { airport_code: 'ATL', airport_name: 'Hartsfield-Jackson Atlanta', departures_count: 340, delayed_departures: 103, punctuality_pct: 69.7, avg_taxi_minutes: 18.5, congestion_tier: 'Moderate' },
    { airport_code: 'LAX', airport_name: 'Los Angeles International', departures_count: 260, delayed_departures: 76, punctuality_pct: 70.8, avg_taxi_minutes: 17.2, congestion_tier: 'Low' },
    { airport_code: 'SFO', airport_name: 'San Francisco International', departures_count: 195, delayed_departures: 56, punctuality_pct: 71.3, avg_taxi_minutes: 18.1, congestion_tier: 'Moderate' },
    { airport_code: 'DEN', airport_name: 'Denver International', departures_count: 210, delayed_departures: 54, punctuality_pct: 74.3, avg_taxi_minutes: 16.4, congestion_tier: 'Low' },
    { airport_code: 'SEA', airport_name: 'Seattle-Tacoma', departures_count: 175, delayed_departures: 41, punctuality_pct: 76.6, avg_taxi_minutes: 15.8, congestion_tier: 'Low' },
    { airport_code: 'PHX', airport_name: 'Phoenix Sky Harbor', departures_count: 150, delayed_departures: 32, punctuality_pct: 78.7, avg_taxi_minutes: 14.2, congestion_tier: 'Low' }
  ]
};

export const MOCK_MODEL_COMPARISON: ModelComparisonData = {
  timestamp: new Date().toISOString(),
  delay_threshold_minutes: 15,
  dataset_size: 1250,
  train_samples: 1000,
  test_samples: 250,
  selected_model_name: 'Logistic Regression (Selected Operational)',
  selection_rationale: 'Logistic Regression is selected as operational model because it catches 77% more actual delays (Recall 49.37% vs 27.85%) and delivers higher discrimination (ROC-AUC 0.6009 vs 0.5262) on the held-out test split.',
  class_distribution: {
    on_time_count: 856,
    delayed_count: 394,
    delay_rate_pct: 31.5,
    naive_majority_accuracy: 0.6848
  },
  baseline_model: {
    model_name: 'Logistic Regression (Selected Operational)',
    algorithm: 'Linear Classifier with Balanced Class Weighting',
    type: 'Baseline',
    accuracy: 0.6040,
    precision: 0.3980,
    recall: 0.4937,
    f1_score: 0.4407,
    roc_auc: 0.6009,
    confusion_matrix: {
      true_negative: 112,
      false_positive: 59,
      false_negative: 40,
      true_positive: 39
    },
    roc_curve: [
      { fpr: 0.0, tpr: 0.0 },
      { fpr: 0.15, tpr: 0.35 },
      { fpr: 0.34, tpr: 0.49 },
      { fpr: 0.55, tpr: 0.72 },
      { fpr: 1.0, tpr: 1.0 }
    ],
    pr_curve: [
      { recall: 0.0, precision: 0.5 },
      { recall: 0.49, precision: 0.398 },
      { recall: 1.0, precision: 0.315 }
    ]
  },
  candidate_model: {
    model_name: 'HistGradientBoosting (Candidate)',
    algorithm: 'Non-Linear Histogram-Based Tree Ensemble',
    type: 'Candidate',
    accuracy: 0.6320,
    precision: 0.3860,
    recall: 0.2785,
    f1_score: 0.3235,
    roc_auc: 0.5262,
    confusion_matrix: {
      true_negative: 136,
      false_positive: 35,
      false_negative: 57,
      true_positive: 22
    },
    roc_curve: [
      { fpr: 0.0, tpr: 0.0 },
      { fpr: 0.20, tpr: 0.28 },
      { fpr: 0.45, tpr: 0.54 },
      { fpr: 0.75, tpr: 0.78 },
      { fpr: 1.0, tpr: 1.0 }
    ],
    pr_curve: [
      { recall: 0.0, precision: 0.45 },
      { recall: 0.28, precision: 0.386 },
      { recall: 1.0, precision: 0.315 }
    ]
  },
  regression: {
    mae_minutes: 33.09,
    rmse_minutes: 53.32,
    r2_score: -0.0054
  },
  feature_importances: [
    { feature: 'origin_weather', importance: 0.084, percentage: 31.5 },
    { feature: 'taxi_out_minutes', importance: 0.061, percentage: 22.8 },
    { feature: 'congestion_level', importance: 0.048, percentage: 18.0 },
    { feature: 'dep_hour', importance: 0.039, percentage: 14.6 },
    { feature: 'wind_speed_knots', importance: 0.031, percentage: 11.6 },
    { feature: 'precipitation_mm', importance: 0.026, percentage: 9.7 },
    { feature: 'distance_miles', importance: 0.019, percentage: 7.1 }
  ],
  tradeoff_explanation: {
    precision_significance: 'Precision measures false alarms: high precision avoids false holds, keeping flight turns on schedule.',
    recall_significance: 'Recall measures disruption detection: high recall flags delayed aircraft before gate pushback, preventing ground holds.',
    causality_disclaimer: 'In commercial operations, missing true delays creates cascade disruptions across downline legs.'
  }
};

export const MOCK_DATA_STATUS: DataManagementInfo = {
  dataset_name: 'Calibrated Benchmark Dataset Fixture',
  file_path: 'backend/app/data/sample_flights.csv',
  file_size_kb: 148.5,
  total_records: 1250,
  total_columns: 14,
  columns: [
    { name: 'flight_id', type: 'string', null_count: 0, sample: 'DL-1432' },
    { name: 'carrier_code', type: 'string', null_count: 0, sample: 'DL' },
    { name: 'origin', type: 'string', null_count: 0, sample: 'ATL' },
    { name: 'dest', type: 'string', null_count: 0, sample: 'LAX' },
    { name: 'distance_miles', type: 'integer', null_count: 0, sample: '1946' },
    { name: 'dep_hour', type: 'integer', null_count: 0, sample: '17' },
    { name: 'origin_weather', type: 'string', null_count: 0, sample: 'Thunderstorm' },
    { name: 'wind_speed_knots', type: 'float', null_count: 0, sample: '28.0' },
    { name: 'visibility_miles', type: 'float', null_count: 0, sample: '3.5' },
    { name: 'precipitation_mm', type: 'float', null_count: 0, sample: '14.2' },
    { name: 'congestion_level', type: 'string', null_count: 0, sample: 'High' },
    { name: 'taxi_out_minutes', type: 'integer', null_count: 0, sample: '34' },
    { name: 'arr_delay_minutes', type: 'integer', null_count: 0, sample: '58' },
    { name: 'is_delayed', type: 'integer', null_count: 0, sample: '1' }
  ],
  data_health: {
    missing_values: 0,
    duplicate_rows: 0,
    valid_delay_ranges: true,
    schema_valid: true
  },
  ingestion_status: {
    source: 'Local Benchmark CSV (sample_flights.csv)',
    live_stream_connected: false,
    live_stream_notes: 'Real historical CSVs can be uploaded and ingested via Data Management.'
  }
};

export const MOCK_QUALITY_REPORT: DataQualityReport = {
  source_name: 'sample_flights.csv',
  delay_threshold_minutes: 15,
  total_input_records: 1250,
  valid_records: 1250,
  rejected_records: 0,
  acceptance_rate_pct: 100.0,
  rejection_breakdown: {},
  clean_features_count: 14,
  class_distribution: {
    on_time_count: 856,
    delayed_count: 394,
    delay_rate_pct: 31.5
  }
};

// Client-side instant delay simulator for offline resilience
export function simulateOfflineDelayPrediction(req: PredictionRequest): PredictionResponse {
  let score = 0;

  // Weather impact
  if (req.origin_weather === 'Thunderstorm') score += 32;
  else if (req.origin_weather === 'Heavy Rain' || req.origin_weather === 'Snow / Ice') score += 24;
  else if (req.origin_weather === 'Fog') score += 16;
  else if (req.origin_weather === 'Light Rain') score += 8;

  // Wind speed impact
  if (req.wind_speed_knots > 25) score += 18;
  else if (req.wind_speed_knots > 15) score += 9;

  // Visibility impact
  if (req.visibility_miles < 3) score += 15;
  else if (req.visibility_miles < 6) score += 7;

  // Taxi-out congestion impact
  if (req.taxi_out_minutes > 30) score += 24;
  else if (req.taxi_out_minutes > 20) score += 12;

  // Departure rush hour (16:00 - 19:00)
  if (req.dep_hour >= 16 && req.dep_hour <= 19) score += 14;
  else if (req.dep_hour >= 8 && req.dep_hour <= 10) score += 8;

  // Congestion
  if (req.congestion_level === 'Severe') score += 20;
  else if (req.congestion_level === 'High') score += 12;

  // Clamp probability 8% to 94%
  const prob = Math.min(94, Math.max(8, score + 12));
  const isDelayed = prob >= 45;
  const expectedDelay = isDelayed ? Math.round(15 + (prob / 100) * 55) : Math.round((prob / 100) * 12);

  const riskTier = prob >= 70 ? 'Severe' : prob >= 50 ? 'High' : prob >= 30 ? 'Moderate' : 'Low';
  const riskColor = prob >= 70 ? 'rose' : prob >= 50 ? 'amber' : prob >= 30 ? 'sky' : 'emerald';

  const attributions = [
    {
      feature: 'Origin Terminal Weather',
      value: req.origin_weather,
      direction: req.origin_weather !== 'Clear' ? 'Risk Escalator' : 'Risk Reducer',
      impact_pct: req.origin_weather === 'Thunderstorm' ? 32.0 : req.origin_weather === 'Clear' ? -18.0 : 15.0,
      association_type: 'Empirical Correlation',
      description: `${req.origin_weather} at ${req.origin} impacts departure release rates.`
    },
    {
      feature: 'Runway Taxi-Out Duration',
      value: `${req.taxi_out_minutes} min`,
      direction: req.taxi_out_minutes > 20 ? 'Risk Escalator' : 'Normal',
      impact_pct: req.taxi_out_minutes > 25 ? 22.0 : 4.0,
      association_type: 'Airport Surface Congestion',
      description: `Runway taxi of ${req.taxi_out_minutes} min directly delays wheel-up clearance.`
    },
    {
      feature: 'Surface Wind Conditions',
      value: `${req.wind_speed_knots} kts`,
      direction: req.wind_speed_knots > 20 ? 'Risk Escalator' : 'Normal',
      impact_pct: req.wind_speed_knots > 20 ? 16.5 : 2.0,
      association_type: 'Crosswind Operations',
      description: `${req.wind_speed_knots} knot surface winds require runway configuration adjustments.`
    },
    {
      feature: 'Departure Time Bank',
      value: `${String(req.dep_hour).padStart(2, '0')}:${String(req.dep_minute).padStart(2, '0')}`,
      direction: req.dep_hour >= 16 ? 'Risk Escalator' : 'Off-Peak',
      impact_pct: req.dep_hour >= 16 ? 12.0 : -6.0,
      association_type: 'Airspace Rush Hour',
      description: 'Late afternoon ATC departure metering.'
    }
  ];

  return {
    flight_query: req as any,
    prediction: {
      model_type: req.model_type || 'baseline',
      model_name: req.model_type === 'candidate' ? 'HistGradientBoosting (Candidate)' : 'Logistic Regression (Selected Operational)',
      model_version: '1.0.0-verified',
      delay_probability: prob / 100,
      delay_probability_pct: prob,
      is_delayed_predicted: isDelayed,
      expected_delay_minutes: expectedDelay,
      risk_tier: riskTier,
      risk_color: riskColor,
      confidence_score: 82,
      delay_threshold_minutes: 15
    },
    explanation: {
      model_used: req.model_type === 'candidate' ? 'HistGradientBoosting' : 'Logistic Regression',
      delay_probability_pct: prob,
      attributions,
      causality_disclaimer: 'Predictions are statistical correlations from historical flight telemetry and do not constitute guaranteed flight operational outcomes.'
    },
    contributing_factors: [
      { factor: 'Weather at Origin', impact: req.origin_weather, score: 32, description: 'Ground delay program risk' },
      { factor: 'Runway Taxi Congestion', impact: `${req.taxi_out_minutes} min`, score: 24, description: 'Ramp and taxiway hold' },
      { factor: 'Departure Hour', impact: `${req.dep_hour}:00 bank`, score: 14, description: 'Peak airspace density' }
    ],
    operational_recommendations: isDelayed
      ? [
          'Pre-coordinate ground turnaround and expedite gate pushback.',
          'Request early ATC metering fix slot to mitigate en-route holding.',
          'Notify passenger connection management of potential 15+ min delay.'
        ]
      : [
          'Flight is on nominal schedule. Maintain standard turnaround timeline.',
          'Weather and surface runway conditions are favorable.'
        ]
  };
}

