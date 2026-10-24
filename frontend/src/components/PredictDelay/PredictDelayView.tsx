import React, { useState } from 'react';
import {
  Plane,
  Clock,
  Wind,
  CloudRain,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Send,
  Sparkles,
  ArrowRight,
  Calculator,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { PredictionRequest, PredictionResponse } from '../../types/aviation';
import { aviationApi } from '../../services/api';
import { DemoDataBanner } from '../Common/DemoDataBanner';

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
    visibility_miles: 3.5,
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
      setError(err.message || 'Failed to execute delay prediction');
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
        dep_minute: 15,
        day_of_week: 4,
        month: 10,
        origin_weather: 'Thunderstorm',
        dest_weather: 'Heavy Rain',
        wind_speed_knots: 34,
        visibility_miles: 2.0,
        precipitation_mm: 19.5,
        congestion_level: 'Severe',
        taxi_out_minutes: 42,
        distance_miles: 1089,
      });
    } else if (preset === 'clear') {
      setForm({
        ...form,
        carrier_code: 'DL',
        origin: 'ATL',
        dest: 'DFW',
        dep_hour: 8,
        dep_minute: 0,
        day_of_week: 2,
        month: 10,
        origin_weather: 'Clear',
        dest_weather: 'Clear',
        wind_speed_knots: 8,
        visibility_miles: 10.0,
        precipitation_mm: 0.0,
        congestion_level: 'Low',
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
        day_of_week: 5,
        month: 10,
        origin_weather: 'Light Rain',
        dest_weather: 'Fog',
        wind_speed_knots: 22,
        visibility_miles: 6.0,
        precipitation_mm: 4.5,
        congestion_level: 'High',
        taxi_out_minutes: 36,
        distance_miles: 1846,
      });
    }
  };

  const probPct = result?.prediction.delay_probability_pct ?? 0;
  const isDelayed = result?.prediction.is_delayed_predicted ?? false;

  return (
    <div className="space-y-5">
      <DemoDataBanner sectionTitle="Flight Delay Prediction Engine" />

      {/* Preset Dispatch Scenarios */}
      <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl border border-slate-800 bg-[#111827]/90 text-xs">
        <span className="text-slate-400 font-medium flex items-center gap-1.5 mr-2">
          <Zap className="h-3.5 w-3.5 text-amber-400" /> Quick Scenarios:
        </span>
        <button
          onClick={() => handlePresetSelect('storm')}
          className="px-2.5 py-1 rounded-md border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 transition-colors"
        >
          Severe Storm (JFK &rarr; MIA)
        </button>
        <button
          onClick={() => handlePresetSelect('rush')}
          className="px-2.5 py-1 rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 transition-colors"
        >
          Rush Hour Crosswind (ORD &rarr; SFO)
        </button>
        <button
          onClick={() => handlePresetSelect('clear')}
          className="px-2.5 py-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition-colors"
        >
          Clear Skies Nominal (ATL &rarr; DFW)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Flight Parameters Form (7 cols) */}
        <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-[#111827]/90 p-4 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-white">Pre-Departure Parameters</h3>
              <p className="text-xs text-slate-400">Strictly pre-departure variables &mdash; zero target leakage</p>
            </div>
            {/* Model Selector */}
            <div className="flex items-center rounded-lg border border-slate-700 bg-slate-900 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setSelectedModelType('baseline')}
                className={`px-2 py-1 rounded-md transition-all ${
                  selectedModelType === 'baseline'
                    ? 'bg-sky-500 text-white font-medium shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Selected Operational Model"
              >
                Logistic Reg (Primary)
              </button>
              <button
                type="button"
                onClick={() => setSelectedModelType('candidate')}
                className={`px-2 py-1 rounded-md transition-all ${
                  selectedModelType === 'candidate'
                    ? 'bg-sky-500 text-white font-medium shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Candidate Non-Linear Tree Model"
              >
                HistGradBoost
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Routing Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Airline Carrier</label>
                <select
                  value={form.carrier_code}
                  onChange={(e) => setForm({ ...form, carrier_code: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                >
                  {CARRIERS.map((c) => (
                    <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Origin Airport</label>
                <select
                  value={form.origin}
                  onChange={(e) => setForm({ ...form, origin: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                >
                  {AIRPORTS.map((a) => (
                    <option key={a.code} value={a.code}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Destination Airport</label>
                <select
                  value={form.dest}
                  onChange={(e) => setForm({ ...form, dest: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                >
                  {AIRPORTS.map((a) => (
                    <option key={a.code} value={a.code}>{a.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Departure Time & Taxi Out */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Scheduled Departure Hour ({String(form.dep_hour).padStart(2, '0')}:00)
                </label>
                <input
                  type="range"
                  min="6"
                  max="23"
                  value={form.dep_hour}
                  onChange={(e) => setForm({ ...form, dep_hour: Number(e.target.value) })}
                  className="w-full accent-sky-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Runway Taxi-Out ({form.taxi_out_minutes} min)
                </label>
                <input
                  type="range"
                  min="10"
                  max="60"
                  value={form.taxi_out_minutes}
                  onChange={(e) => setForm({ ...form, taxi_out_minutes: Number(e.target.value) })}
                  className="w-full accent-sky-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Surface Congestion</label>
                <select
                  value={form.congestion_level}
                  onChange={(e) => setForm({ ...form, congestion_level: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                >
                  <option value="Low">Low (Nominal Flow)</option>
                  <option value="Moderate">Moderate (Minor Queue)</option>
                  <option value="High">High (Ramp Hold)</option>
                  <option value="Severe">Severe (Ground Stop Risk)</option>
                </select>
              </div>
            </div>

            {/* Weather & Surface Conditions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Origin Weather</label>
                <select
                  value={form.origin_weather}
                  onChange={(e) => setForm({ ...form, origin_weather: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                >
                  {WEATHER_OPTIONS.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Crosswinds ({form.wind_speed_knots} kts)
                </label>
                <input
                  type="range"
                  min="0"
                  max="45"
                  value={form.wind_speed_knots}
                  onChange={(e) => setForm({ ...form, wind_speed_knots: Number(e.target.value) })}
                  className="w-full accent-sky-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Visibility ({form.visibility_miles} miles)
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={form.visibility_miles}
                  onChange={(e) => setForm({ ...form, visibility_miles: Number(e.target.value) })}
                  className="w-full accent-sky-500 cursor-pointer"
                />
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
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-sky-500 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-sky-400 transition-colors disabled:opacity-50"
            >
              <Calculator className="h-4 w-4" />
              <span>{loading ? 'Evaluating Pre-Departure Weights...' : 'Compute Delay Probability'}</span>
            </button>
          </form>
        </div>

        {/* Right: Delay Prediction Cockpit Gauge (5 cols) */}
        <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-[#111827]/90 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
              <div>
                <h3 className="text-sm font-semibold text-white">Delay Risk Assessment</h3>
                <p className="text-xs text-slate-400">Pre-departure inference &amp; feature attributions</p>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-sky-400 border border-slate-700">
                &ge; 15m Target
              </span>
            </div>

            {result ? (
              <div className="space-y-4">
                {/* Speedometer Gauge Visual */}
                <div className="flex flex-col items-center justify-center py-2">
                  <div className="relative w-40 h-24 flex items-end justify-center">
                    <svg viewBox="0 0 160 90" className="w-full h-full">
                      {/* Background Arc */}
                      <path
                        d="M 20 80 A 60 60 0 0 1 140 80"
                        fill="none"
                        stroke="#1e293b"
                        strokeWidth="12"
                        strokeLinecap="round"
                      />
                      {/* Active Probability Arc */}
                      <path
                        d="M 20 80 A 60 60 0 0 1 140 80"
                        fill="none"
                        stroke={probPct >= 60 ? '#f43f5e' : probPct >= 40 ? '#f59e0b' : '#10b981'}
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray="188"
                        strokeDashoffset={188 - (188 * (probPct / 100))}
                        className="transition-all duration-700"
                      />
                    </svg>
                    <div className="absolute bottom-0 flex flex-col items-center">
                      <span className="text-2xl font-bold font-mono text-white leading-none">
                        {probPct}%
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">
                        Delay Risk
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        isDelayed
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {result.prediction.risk_tier} Risk
                    </span>
                    <span className="text-xs font-mono text-slate-300">
                      +{result.prediction.expected_delay_minutes} min expected
                    </span>
                  </div>
                </div>

                {/* Factor Attributions */}
                {result.explanation?.attributions && (
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Primary Risk Contributors
                    </span>
                    <div className="space-y-1.5">
                      {result.explanation.attributions.slice(0, 3).map((attr, i) => (
                        <div key={i} className="flex items-center justify-between text-xs p-1.5 rounded bg-slate-900/60 border border-slate-800/80">
                          <span className="text-slate-300">{attr.feature}</span>
                          <span className={`font-mono font-semibold ${attr.impact_pct > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {attr.impact_pct > 0 ? `+${attr.impact_pct}%` : `${attr.impact_pct}%`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-500 space-y-2">
                <Calculator className="h-8 w-8 text-slate-700 mx-auto" />
                <p>Adjust flight parameters on the left and click Compute.</p>
                <p className="text-slate-600">Model uses verified pre-departure Scikit-Learn weights.</p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-2.5 border-t border-slate-800 text-[10px] text-slate-500 text-center">
            Probabilistic model estimates based on historical FAA BTS benchmarks.
          </div>
        </div>
      </div>
    </div>
  );
};
