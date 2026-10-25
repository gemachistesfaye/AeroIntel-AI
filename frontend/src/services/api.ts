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

let isBackendReachable = true;

export function getBackendReachableState(): boolean {
  return isBackendReachable;
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout for model training/large uploads

  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      signal: controller.signal,
      ...options,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      throw new Error(errorBody.error || `Request failed with status ${res.status}`);
    }

    const json = await res.json();
    if (json.success === false) {
      throw new Error(json.error || 'Server returned an error');
    }
    isBackendReachable = true;
    return (json.data !== undefined ? json.data : json) as T;
  } catch (err) {
    clearTimeout(timeoutId);
    isBackendReachable = false;
    throw err;
  }
}

export const aviationApi = {
  // Health
  async getHealth(): Promise<{ status: string; model_ready: boolean; records_loaded: number; is_mock?: boolean }> {
    return await fetchJson<{ status: string; model_ready: boolean; records_loaded: number }>(`${API_BASE}/health`);
  },

  // Dashboard Operations Overview
  async getDashboardSummary(): Promise<DashboardSummary> {
    return await fetchJson<DashboardSummary>(`${API_BASE}/dashboard/summary`);
  },

  // Flights & Telemetry
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

    return await fetchJson<FlightListResponse>(`${API_BASE}/flights?${query.toString()}`);
  },

  // Real Pre-Departure Delay Prediction (Scikit-Learn inference)
  async predictFlightDelay(payload: PredictionRequest): Promise<PredictionResponse> {
    return await fetchJson<PredictionResponse>(`${API_BASE}/predict/flight`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Route Intelligence & Hub Congestion
  async getRouteIntelligence(origin = '', dest = ''): Promise<RouteIntelligenceData> {
    const query = new URLSearchParams();
    if (origin) query.set('origin', origin);
    if (dest) query.set('dest', dest);
    return await fetchJson<RouteIntelligenceData>(`${API_BASE}/route-intelligence?${query.toString()}`);
  },

  // Model Evaluation & Performance Metrics
  async getModelEvaluation(): Promise<ModelEvaluationData> {
    return await fetchJson<ModelEvaluationData>(`${API_BASE}/model/evaluation`);
  },

  // Comparative Model Scorecards (Baseline vs Candidate)
  async getModelComparison(): Promise<ModelComparisonData> {
    return await fetchJson<ModelComparisonData>(`${API_BASE}/model/compare`);
  },

  // Retrain Models with Dynamic Threshold or Task
  async retrainModel(delayThresholdMinutes = 15, task = 'arrival_delay_classification'): Promise<{ message: string; data: ModelComparisonData }> {
    return await fetchJson<{ message: string; data: ModelComparisonData }>(`${API_BASE}/model/retrain`, {
      method: 'POST',
      body: JSON.stringify({ delay_threshold_minutes: delayThresholdMinutes, task }),
    });
  },

  // Data Management & Dataset Health
  async getDataStatus(): Promise<DataManagementInfo> {
    return await fetchJson<DataManagementInfo>(`${API_BASE}/data/status`);
  },

  // Data Quality Audit & Profiling
  async getDataQualityReport(): Promise<DataQualityReport> {
    return await fetchJson<DataQualityReport>(`${API_BASE}/data/quality`);
  },

  // Upload CSV or ZIP Dataset
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
    const data = await res.json();
    if (data.success === false) {
      throw new Error(data.error || 'Upload failed');
    }
    return data;
  },

  // Activate Ingested Dataset in Platform
  async ingestDataset(fileName?: string): Promise<{ success: boolean; records: number; quality_report: DataQualityReport; message: string }> {
    return await fetchJson(`${API_BASE}/data/ingest`, {
      method: 'POST',
      body: JSON.stringify({ file_name: fileName }),
    });
  },

  // Reload Benchmark BTS Dataset
  async regenerateData(): Promise<{ records: number; message: string; quality_report: DataQualityReport }> {
    return await fetchJson(`${API_BASE}/data/regenerate`, { method: 'POST' });
  },

  // Big Data Analytics
  async getAnalyticsSummary(): Promise<any> {
    return await fetchJson(`${API_BASE}/analytics/summary`);
  },

  async getCarrierBenchmarks(): Promise<any[]> {
    return await fetchJson(`${API_BASE}/analytics/carriers`);
  },

  async getCorridorAnalytics(): Promise<any[]> {
    return await fetchJson(`${API_BASE}/analytics/corridors`);
  },

  async getTemporalAnalytics(): Promise<any> {
    return await fetchJson(`${API_BASE}/analytics/temporal`);
  },

  async getDelayCauses(): Promise<any> {
    return await fetchJson(`${API_BASE}/analytics/delay-causes`);
  },

  async getEngineComparison(): Promise<any> {
    return await fetchJson(`${API_BASE}/analytics/engine-comparison`);
  }
};
