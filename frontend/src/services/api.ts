import {
  DashboardSummary,
  FlightListResponse,
  FlightQueryParams,
  PredictionRequest,
  PredictionResponse,
  RouteIntelligenceData,
  ModelEvaluationData,
  DataManagementInfo
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

  // Model Evaluation
  async getModelEvaluation(): Promise<ModelEvaluationData> {
    return fetchJson(`${API_BASE}/model/evaluation`);
  },

  // Retrain baseline model
  async retrainModel(): Promise<{ message: string; data: ModelEvaluationData }> {
    return fetchJson(`${API_BASE}/model/retrain`, { method: 'POST' });
  },

  // Data Management
  async getDataStatus(): Promise<DataManagementInfo> {
    return fetchJson(`${API_BASE}/data/status`);
  },

  // Regenerate demo dataset
  async regenerateData(): Promise<{ records: number; message: string }> {
    return fetchJson(`${API_BASE}/data/regenerate`, { method: 'POST' });
  },
};
