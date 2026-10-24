export type RiskTier = 'Low' | 'Moderate' | 'High' | 'Severe';

export interface Flight {
  flight_id: string;
  flight_date?: string;
  carrier_code: string;
  carrier_name: string;
  origin: string;
  origin_name: string;
  dest: string;
  dest_name: string;
  route: string;
  distance_miles: number;
  air_time_minutes?: number;
  scheduled_dep_time: string;
  dep_hour: number;
  dep_minute: number;
  day_of_week: number;
  month: number;
  origin_weather: string;
  dest_weather: string;
  wind_speed_knots: number;
  visibility_miles: number;
  precipitation_mm: number;
  congestion_level: string;
  taxi_out_minutes: number;
  historical_carrier_delay_rate: number;
  arr_delay_minutes: number;
  is_delayed: number;
  delay_cause: string;
  delay_risk_tier: RiskTier;
  dataset_label: string;
}

export interface DashboardSummary {
  dataset_label: string;
  total_flights: number;
  on_time_rate_pct: number;
  avg_delay_minutes: number;
  avg_delay_when_delayed_minutes: number;
  delayed_flights_count: number;
  causes_breakdown: {
    cause: string;
    count: number;
    percentage: number;
  }[];
  carrier_performance: {
    code: string;
    name: string;
    total_flights: number;
    delayed_flights: number;
    on_time_rate: number;
    avg_delay_minutes: number;
  }[];
  hourly_trend: {
    hour: string;
    flights: number;
    delayed: number;
    delay_rate_pct: number;
    avg_delay_min: number;
  }[];
  recent_disruptions: Partial<Flight>[];
}

export interface FlightQueryParams {
  q?: string;
  carrier?: string;
  origin?: string;
  dest?: string;
  risk_tier?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface FlightListResponse {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  items: Flight[];
}

export interface PredictionRequest {
  carrier_code: string;
  origin: string;
  dest: string;
  dep_hour: number;
  dep_minute: number;
  day_of_week: number;
  month: number;
  origin_weather: string;
  dest_weather: string;
  wind_speed_knots: number;
  visibility_miles: number;
  precipitation_mm: number;
  congestion_level: string;
  taxi_out_minutes: number;
  distance_miles?: number;
  historical_carrier_delay_rate?: number;
  model_type?: 'candidate' | 'baseline';
}

export interface AttributionItem {
  feature: string;
  value?: string;
  direction: string;
  impact_pct: number;
  association_type: string;
  description: string;
}

export interface PredictionResponse {
  flight_query: Record<string, any>;
  prediction: {
    model_type: string;
    model_name: string;
    model_version: string;
    delay_probability: number;
    delay_probability_pct: number;
    is_delayed_predicted: boolean;
    expected_delay_minutes: number;
    risk_tier: string;
    risk_color: string;
    confidence_score: number;
    delay_threshold_minutes: number;
  };
  explanation?: {
    model_used: string;
    delay_probability_pct: number;
    attributions: AttributionItem[];
    causality_disclaimer: string;
  };
  contributing_factors: {
    factor: string;
    impact: string;
    score: number;
    description: string;
  }[];
  operational_recommendations: string[];
}

export interface RouteCorridor {
  route: string;
  origin: string;
  dest: string;
  total_flights?: number;
  flights_count?: number;
  delayed_count?: number;
  delayed_flights?: number;
  on_time_pct: number;
  avg_delay_minutes: number;
  avg_taxi_minutes: number;
  congestion_index: number;
  distance_miles: number;
  active_carriers?: string[];
}

export interface AirportHub {
  airport_code: string;
  airport_name: string;
  departures_count: number;
  delayed_departures: number;
  punctuality_pct: number;
  avg_taxi_minutes: number;
  congestion_tier: string;
}

export interface RouteIntelligenceData {
  dataset_label: string;
  corridors: RouteCorridor[];
  hubs: AirportHub[];
  selected_corridor?: RouteCorridor | null;
}

export interface ModelClassificationMetrics {
  model_name: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  roc_auc: number;
  pr_auc?: number;
  algorithm?: string;
  type?: string;
  pros?: string;
  cons?: string;
  confusion_matrix: {
    true_negative: number;
    false_positive: number;
    false_negative: number;
    true_positive: number;
  };
  roc_curve: { fpr: number; tpr: number }[];
  pr_curve: { recall: number; precision: number }[];
}

export interface ModelComparisonData {
  timestamp: string;
  delay_threshold_minutes: number;
  dataset_size: number;
  train_samples: number;
  test_samples: number;
  class_distribution: {
    on_time_count: number;
    delayed_count: number;
    delay_rate_pct: number;
    naive_majority_accuracy: number;
  };
  baseline_model: ModelClassificationMetrics;
  candidate_model: ModelClassificationMetrics;
  regression: {
    mae_minutes: number;
    rmse_minutes: number;
    r2_score: number;
  };
  feature_importances: { feature: string; importance: number; percentage: number }[];
  tradeoff_explanation: {
    precision_significance: string;
    recall_significance: string;
    causality_disclaimer: string;
  };
}

export interface ModelEvaluationData {
  model_type: string;
  model_version: string;
  dataset_type: string;
  train_samples: number;
  test_samples: number;
  classification: {
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    roc_auc: number;
    confusion_matrix: {
      true_negative: number;
      false_positive: number;
      false_negative: number;
      true_positive: number;
    };
    roc_curve: { fpr: number; tpr: number }[];
    pr_curve: { recall: number; precision: number }[];
  };
  regression: {
    mae_minutes: number;
    rmse_minutes: number;
    r2_score: number;
  };
  feature_importances: { feature: string; importance: number }[];
  implementation_status: {
    status: string;
    is_mock: boolean;
    notes: string;
  };
}

export interface DataQualityReport {
  source_name: string;
  delay_threshold_minutes: number;
  total_input_records: number;
  valid_records: number;
  rejected_records: number;
  acceptance_rate_pct: number;
  rejection_breakdown: Record<string, number>;
  clean_features_count: number;
  class_distribution: {
    on_time_count: number;
    delayed_count: number;
    delay_rate_pct: number;
  };
}

export interface DataManagementInfo {
  dataset_name: string;
  file_path: string;
  file_size_kb: number;
  total_records: number;
  total_columns: number;
  columns: {
    name: string;
    type: string;
    null_count: number;
    sample: string;
  }[];
  data_health: {
    missing_values: number;
    duplicate_rows: number;
    valid_delay_ranges: boolean;
    schema_valid: boolean;
  };
  ingestion_status: {
    source: string;
    live_stream_connected: boolean;
    live_stream_notes: string;
  };
  quality_report?: DataQualityReport;
}
