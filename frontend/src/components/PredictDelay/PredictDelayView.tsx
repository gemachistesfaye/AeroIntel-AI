import React, { useState } from 'react';
import {
  Plane,
  AlertTriangle,
  Calculator,
  Zap,
  Clock,
  Wind
} from 'lucide-react';
import { PredictionRequest, PredictionResponse } from '../../types/aviation';
import { aviationApi } from '../../services/api';

const CARRIERS = [
  { code: 'DL', name: 'Delta Air Lines' },
  { code: 'UA', name: 'United Airlines' },
  { code: 'AA', name: 'American Airlines' },
  { code: 'WN', name: 'Southwest Airlines' },
  { code: 'B6', name: 'JetBlue Airways' },
  { code: 'AS', name: 'Alaska Airlines' },
];

const AIRPORTS = [
  { code: 'ATL', name: 'Atlanta (ATL)' },
  { code: 'ORD', name: "Chicago O'Hare (ORD)" },
  { code: 'DFW', name: 'Dallas/Fort Worth (DFW)' },
  { code: 'DEN', name: 'Denver (DEN)' },
  { code: 'JFK', name: 'New York JFK (JFK)' },
  { code: 'LAX', name: 'Los Angeles (LAX)' },
  { code: 'SFO', name: 'San Francisco (SFO)' },
  { code: 'SEA', name: 'Seattle-Tacoma (SEA)' },
  { code: 'MIA', name: 'Miami (MIA)' },
  { code: 'BOS', name: 'Boston Logan (BOS)' },
  { code: 'CLT', name: 'Charlotte Douglas (CLT)' },
  { code: 'PHX', name: 'Phoenix Sky Harbor (PHX)' },
];

const WEATHER_OPTIONS = [
  'Clear',
  'Light Rain',
  'Heavy Rain',
  'Thunderstorm',
  'Fog',
  'Snow / Ice',
];

export const PredictDelayView: React.FC = () => {
  const [selectedModelType, setSelectedModelType] = useState<'candidate' | 'baseline'>('baseline');
  const [form, setForm] = useState<PredictionRequest>({
    carrier_code: 'DL',
    origin: 'ATL',
    dest: 'LAX',
    dep_hour: 17,
    dep_minute: 30,
    day_of_week: 4,
    month: 10,
    origin_weather: 'Thunderstorm',
    dest_weather: 'Clear',
    wind_speed_knots: 28,
    visibility_miles: 4.0,
    precipitation_mm: 14.0,
    congestion_level: 'High',
    taxi_out_minutes: 32,
    distance_miles: 1946,
    model_type: 'baseline',
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (form.origin === form.dest) {
      setError('Origin and Destination airports must be different.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const payload: PredictionRequest = {
        ...form,
        model_type: selectedModelType,
      };
      const res = await aviationApi.predictFlightDelay(payload);
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to calculate prediction');
    } finally {
      setLoading(false);
    }
  };

  const handlePresetSelect = (preset: 'storm' | 'clear' | 'rush') => {
    if (preset === 'storm') {
      setForm({
        ...form,
        carrier_code: 'B6',
        origin: 'JFK',
        dest: 'MIA',
        dep_hour: 18,
        dep_minute: 0,
        origin_weather: 'Thunderstorm',
        wind_speed_knots: 32,
        taxi_out_minutes: 38,
        distance_miles: 1089,
      });
    } else if (preset === 'clear') {
      setForm({
        ...form,
        carrier_code: 'DL',
        origin: 'ATL',
        dest: 'DFW',
        dep_hour: 9,
        dep_minute: 0,
        origin_weather: 'Clear',
        wind_speed_knots: 8,
        taxi_out_minutes: 14,
        distance_miles: 731,
      });
    } else {
      setForm({
        ...form,
        carrier_code: 'UA',
        origin: 'ORD',
        dest: 'SFO',
        dep_hour: 17,
        dep_minute: 0,
        origin_weather: 'Light Rain',
        wind_speed_knots: 22,
        taxi_out_minutes: 32,
        distance_miles: 1846,
      });
    }
  };

  const probPct = result?.prediction.delay_probability_pct ?? 0;
  const isDelayed = result?.prediction.is_delayed_predicted ?? false;

  return (
    <div className="space-y-6">
      {/* Quick Presets Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-slate-800 bg-[#111827]">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-400" />
          <span className="text-xs font-semibold text-white">Preset Scenarios:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handlePresetSelect('storm')}
            className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-xs text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
          >
            Severe Storm (JFK &rarr; MIA)
          </button>
          <button
            type="button"
            onClick={() => handlePresetSelect('rush')}
            className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-xs text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
          >
            Evening Rush (ORD &rarr; SFO)
          </button>
          <button
            type="button"
            onClick={() => handlePresetSelect('clear')}
            className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-xs text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
          >
            Clear Weather (ATL &rarr; DFW)
          </button>
        </div>
      </div>

      {/* Main Grid: Form Left (7 cols), Result Right (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Clean Inputs Form */}
        <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-[#111827] p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-white">Flight & Weather Inputs</h3>
              <p className="text-xs text-slate-400">Pre-departure parameters only &mdash; zero target leakage</p>
            </div>
            {/* Model Toggle */}
            <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setSelectedModelType('baseline')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  selectedModelType === 'baseline'
                    ? 'bg-sky-500 text-white font-medium'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Logistic Regression
              </button>
              <button
                type="button"
                onClick={() => setSelectedModelType('candidate')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  selectedModelType === 'candidate'
                    ? 'bg-sky-500 text-white font-medium'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                HistGradientBoosting
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Row 1: Airline & Airports */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Airline</label>
                <select
                  value={form.carrier_code}
                  onChange={(e) => setForm({ ...form, carrier_code: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
                >
                  {CARRIERS.map((c) => (
                    <option key={c.code} value={c.code}>{c.code} &ndash; {c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Origin</label>
                <select
                  value={form.origin}
                  onChange={(e) => setForm({ ...form, origin: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
                >
                  {AIRPORTS.map((a) => (
                    <option key={a.code} value={a.code}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Destination</label>
                <select
                  value={form.dest}
                  onChange={(e) => setForm({ ...form, dest: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
                >
                  {AIRPORTS.map((a) => (
                    <option key={a.code} value={a.code}>{a.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Departure Hour, Runway Taxi, Surface Weather */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Departure ({String(form.dep_hour).padStart(2, '0')}:00)
                </label>
                <input
                  type="range"
                  min="6"
                  max="23"
                  value={form.dep_hour}
                  onChange={(e) => setForm({ ...form, dep_hour: Number(e.target.value) })}
                  className="w-full accent-sky-500 cursor-pointer mt-2"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Runway Taxi ({form.taxi_out_minutes} min)
                </label>
                <input
                  type="range"
                  min="10"
                  max="60"
                  value={form.taxi_out_minutes}
                  onChange={(e) => setForm({ ...form, taxi_out_minutes: Number(e.target.value) })}
                  className="w-full accent-sky-500 cursor-pointer mt-2"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Weather</label>
                <select
                  value={form.origin_weather}
                  onChange={(e) => setForm({ ...form, origin_weather: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
                >
                  {WEATHER_OPTIONS.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-300 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-sky-500 py-2.5 text-xs font-semibold text-white hover:bg-sky-400 transition-colors disabled:opacity-50"
            >
              <Calculator className="h-4 w-4" />
              <span>{loading ? 'Evaluating Model Weights...' : 'Calculate Delay Probability'}</span>
            </button>
          </form>
        </div>

        {/* Right: Delay Risk Speedometer */}
        <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-[#111827] p-5 flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-sm font-semibold text-white">Delay Risk Result</h3>
              <p className="text-xs text-slate-400">Probability of &ge; 15 min flight delay</p>
            </div>

            {result ? (
              <div className="space-y-4 text-center">
                {/* SVG Speedometer */}
                <div className="relative w-44 h-24 mx-auto flex items-end justify-center">
                  <svg viewBox="0 0 160 90" className="w-full h-full">
                    <path
                      d="M 20 80 A 60 60 0 0 1 140 80"
                      fill="none"
                      stroke="#1e293b"
                      strokeWidth="12"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 20 80 A 60 60 0 0 1 140 80"
                      fill="none"
                      stroke={probPct >= 50 ? '#f59e0b' : '#38bdf8'}
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray="188"
                      strokeDashoffset={188 - (188 * (probPct / 100))}
                      className="transition-all duration-700"
                    />
                  </svg>
                  <div className="absolute bottom-0 flex flex-col items-center">
                    <span className="text-3xl font-bold font-mono text-white leading-none">
                      {probPct}%
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">
                      Risk Score
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      isDelayed
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {result.prediction.risk_tier} Risk
                  </span>
                  <span className="text-xs font-mono text-slate-300">
                    +{result.prediction.expected_delay_minutes} min expected
                  </span>
                </div>

                {/* Factors */}
                {result.explanation?.attributions && (
                  <div className="space-y-1.5 pt-3 border-t border-slate-800 text-left">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                      Key Contributing Factors
                    </span>
                    {result.explanation.attributions.slice(0, 3).map((attr, i) => (
                      <div key={i} className="flex items-center justify-between text-xs p-2 rounded bg-slate-900 border border-slate-800">
                        <span className="text-slate-300">{attr.feature}</span>
                        <span className="font-mono text-slate-300 font-semibold">
                          {attr.impact_pct > 0 ? `+${attr.impact_pct}%` : `${attr.impact_pct}%`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-14 text-center text-xs text-slate-500 space-y-2">
                <Calculator className="h-8 w-8 text-slate-700 mx-auto" />
                <p>Select flight parameters and click Calculate.</p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500 text-center">
            Probabilistic model estimates based on historical FAA BTS benchmarks.
          </div>
        </div>
      </div>
    </div>
  );
};
