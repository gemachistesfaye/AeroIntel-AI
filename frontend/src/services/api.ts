import {
  DashboardSummary,
  FlightListResponse,
  FlightQueryParams,
  PredictionRequest,
  PredictionResponse,
  RouteIntelligenceData,
  ModelEvaluationData,
  ModelComparisonData,
  DataManagementInfo,
  DataQualityReport
} from '../types/aviation';

const API_BASE = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Request failed with status ${res.status}`);
  }

  const json = await res.json();
  if (json.success === false) {
    throw new Error(json.error || 'Server returned an error');
  }
  return (json.data !== undefined ? json.data : json) as T;
}

export const aviationApi = {
  // Health
  async getHealth(): Promise<{ status: string; model_ready: boolean; records_loaded: number }> {
    return fetchJson(`${API_BASE}/health`);
  },

  // Dashboard
  async getDashboardSummary(): Promise<DashboardSummary> {
    return fetchJson(`${API_BASE}/dashboard/summary`);
  },

  // Flights
  async getFlights(params: FlightQueryParams = {}): Promise<FlightListResponse> {
    const query = new URLSearchParams();
    if (params.q) query.set('q', params.q);
    if (params.carrier) query.set('carrier', params.carrier);
    if (params.origin) query.set('origin', params.origin);
    if (params.dest) query.set('dest', params.dest);
    if (params.risk_tier) query.set('risk_tier', params.risk_tier);
    if (params.status) query.set('status', params.status);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));

    return fetchJson(`${API_BASE}/flights?${query.toString()}`);
  },

  // Predict
  async predictFlightDelay(payload: PredictionRequest): Promise<PredictionResponse> {
    return fetchJson(`${API_BASE}/predict/flight`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Route Intelligence
  async getRouteIntelligence(origin = '', dest = ''): Promise<RouteIntelligenceData> {
    const query = new URLSearchParams();
    if (origin) query.set('origin', origin);
    if (dest) query.set('dest', dest);
    return fetchJson(`${API_BASE}/route-intelligence?${query.toString()}`);
  },

  // Model Evaluation & Comparison
  async getModelEvaluation(): Promise<ModelEvaluationData> {
    return fetchJson(`${API_BASE}/model/evaluation`);
  },

  async getModelComparison(): Promise<ModelComparisonData> {
    return fetchJson(`${API_BASE}/model/compare`);
  },

  async retrainModel(delayThresholdMinutes = 15): Promise<{ message: string; data: ModelComparisonData }> {
    return fetchJson(`${API_BASE}/model/retrain`, {
      method: 'POST',
      body: JSON.stringify({ delay_threshold_minutes: delayThresholdMinutes }),
    });
  },

  // Data Management & Ingestion
  async getDataStatus(): Promise<DataManagementInfo> {
    return fetchJson(`${API_BASE}/data/status`);
  },

  async getDataQualityReport(): Promise<DataQualityReport> {
    return fetchJson(`${API_BASE}/data/quality`);
  },

  async uploadCsv(file: File): Promise<{ success: boolean; message: string; file_name: string; quality_report: DataQualityReport }> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/data/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      throw new Error(errorBody.error || `Upload failed with status ${res.status}`);
    }
    return res.json();
  },

  async ingestDataset(fileName?: string): Promise<{ success: boolean; records: number; quality_report: DataQualityReport; message: string }> {
    return fetchJson(`${API_BASE}/data/ingest`, {
      method: 'POST',
      body: JSON.stringify({ file_name: fileName }),
    });
  },

  async regenerateData(): Promise<{ records: number; message: string; quality_report: DataQualityReport }> {
    return fetchJson(`${API_BASE}/data/regenerate`, { method: 'POST' });
  },

  // Big Data Analytics
  async getAnalyticsSummary(): Promise<any> {
    return fetchJson(`${API_BASE}/analytics/summary`);
  },

  async getCarrierBenchmarks(): Promise<any[]> {
    return fetchJson(`${API_BASE}/analytics/carriers`);
  },

  async getCorridorAnalytics(): Promise<any[]> {
    return fetchJson(`${API_BASE}/analytics/corridors`);
  },
};
