import React, { useState } from 'react';
import {
  BrainCircuit,
  Plane,
  Clock,
  Wind,
  CloudRain,
  Eye,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  ShieldCheck,
  Send,
  Sparkles,
  ArrowRight,
  Info
} from 'lucide-react';
import { PredictionRequest, PredictionResponse } from '../../types/aviation';
import { aviationApi } from '../../services/api';
import { DemoDataBanner } from '../Common/DemoDataBanner';
import { LoadingSpinner } from '../Common/LoadingSpinner';

const CARRIERS = [
  { code: 'DL', name: 'Delta Air Lines', baseRate: 0.16 },
  { code: 'UA', name: 'United Airlines', baseRate: 0.21 },
  { code: 'AA', name: 'American Airlines', baseRate: 0.23 },
  { code: 'WN', name: 'Southwest Airlines', baseRate: 0.20 },
  { code: 'B6', name: 'JetBlue Airways', baseRate: 0.27 },
  { code: 'AS', name: 'Alaska Airlines', baseRate: 0.15 },
];

const AIRPORTS = [
  { code: 'ATL', name: 'Hartsfield-Jackson Atlanta' },
  { code: 'ORD', name: "Chicago O'Hare" },
  { code: 'DFW', name: 'Dallas/Fort Worth' },
  { code: 'DEN', name: 'Denver International' },
  { code: 'JFK', name: 'John F. Kennedy New York' },
  { code: 'LAX', name: 'Los Angeles International' },
  { code: 'SFO', name: 'San Francisco International' },
  { code: 'SEA', name: 'Seattle-Tacoma' },
  { code: 'MIA', name: 'Miami International' },
  { code: 'BOS', name: 'Boston Logan' },
  { code: 'CLT', name: 'Charlotte Douglas' },
  { code: 'PHX', name: 'Phoenix Sky Harbor' },
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
  const [form, setForm] = useState<PredictionRequest>({
    carrier_code: 'DL',
    origin: 'ATL',
    dest: 'LAX',
    dep_hour: 17,
    dep_minute: 30,
    day_of_week: 4, // Friday
    month: 7, // July
    origin_weather: 'Thunderstorm',
    dest_weather: 'Clear',
    wind_speed_knots: 28,
    visibility_miles: 4.5,
    precipitation_mm: 12.0,
    congestion_level: 'High',
    taxi_out_minutes: 32,
    distance_miles: 1946,
    air_time_minutes: 275,
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.origin === form.dest) {
      setError('Origin and Destination airports must be different.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await aviationApi.predictFlightDelay(form);
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to execute delay prediction inference');
    } finally {
      setLoading(false);
    }
  };

  const handlePresetSelect = (preset: 'storm' | 'clear' | 'rush') => {
    if (preset === 'storm') {
      setForm({
        carrier_code: 'B6',
        origin: 'JFK',
        dest: 'MIA',
        dep_hour: 18,
        dep_minute: 15,
        day_of_week: 4,
        month: 8,
        origin_weather: 'Thunderstorm',
        dest_weather: 'Heavy Rain',
        wind_speed_knots: 34,
        visibility_miles: 2.0,
        precipitation_mm: 18.5,
        congestion_level: 'Severe',
        taxi_out_minutes: 42,
        distance_miles: 1089,
        air_time_minutes: 175,
      });
    } else if (preset === 'clear') {
      setForm({
        carrier_code: 'DL',
        origin: 'ATL',
        dest: 'DFW',
        dep_hour: 8,
        dep_minute: 0,
        day_of_week: 1, // Tuesday
        month: 5,
        origin_weather: 'Clear',
        dest_weather: 'Clear',
        wind_speed_knots: 8,
        visibility_miles: 10.0,
        precipitation_mm: 0.0,
        congestion_level: 'Low',
        taxi_out_minutes: 13,
        distance_miles: 731,
        air_time_minutes: 125,
      });
    } else if (preset === 'rush') {
      setForm({
        carrier_code: 'UA',
        origin: 'ORD',
        dest: 'SFO',
        dep_hour: 17,
        dep_minute: 45,
        day_of_week: 4,
        month: 11,
        origin_weather: 'Light Rain',
        dest_weather: 'Fog',
        wind_speed_knots: 22,
        visibility_miles: 6.0,
        precipitation_mm: 3.2,
        congestion_level: 'High',
        taxi_out_minutes: 30,
        distance_miles: 1846,
        air_time_minutes: 260,
      });
    }
  };

  return (
    <div className="space-y-6">
      <DemoDataBanner sectionTitle="AI Delay Prediction Inference Engine" />

      {/* Preset Scenarios Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-[#1a2947] bg-[#0f172a]/80 p-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-sky-400" /> Quick Simulation Presets
          </h3>
          <p className="text-xs text-slate-400">Load calibrated operational flight scenarios</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => handlePresetSelect('storm')}
            className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20"
          >
            &bull; Severe Storm at JFK
          </button>
          <button
            type="button"
            onClick={() => handlePresetSelect('rush')}
            className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20"
          >
            &bull; Evening Rush at ORD
          </button>
          <button
            type="button"
            onClick={() => handlePresetSelect('clear')}
            className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20"
          >
            &bull; Optimal Morning Clear
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Parameters Form (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-[#1a2947] bg-[#0f172a]/90 p-6 backdrop-blur-sm">
          <div className="border-b border-slate-800 pb-3 mb-5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-sky-400" /> Flight Simulation Parameters
            </h3>
            <p className="text-xs text-slate-400">
              Input flight itinerary, atmospheric variables, and airport queue metrics
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Carrier & Airport Pair */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold uppercase text-slate-400 block mb-1">
                  Operating Carrier
                </label>
                <select
                  value={form.carrier_code}
                  onChange={(e) => setForm({ ...form, carrier_code: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
                >
                  {CARRIERS.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase text-slate-400 block mb-1">
                  Origin Airport
                </label>
                <select
                  value={form.origin}
                  onChange={(e) => setForm({ ...form, origin: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
                >
                  {AIRPORTS.map((a) => (
                    <option key={a.code} value={a.code}>
                      {a.code} - {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase text-slate-400 block mb-1">
                  Destination Airport
                </label>
                <select
                  value={form.dest}
                  onChange={(e) => setForm({ ...form, dest: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
                >
                  {AIRPORTS.map((a) => (
                    <option key={a.code} value={a.code}>
                      {a.code} - {a.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Schedule & Timing */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-semibold uppercase text-slate-400 block mb-1">
                  Dep Hour (00-23)
                </label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={form.dep_hour}
                  onChange={(e) => setForm({ ...form, dep_hour: parseInt(e.target.value) || 0 })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white font-mono focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase text-slate-400 block mb-1">
                  Minute (00-59)
                </label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={form.dep_minute}
                  onChange={(e) => setForm({ ...form, dep_minute: parseInt(e.target.value) || 0 })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white font-mono focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase text-slate-400 block mb-1">
                  Day of Week
                </label>
                <select
                  value={form.day_of_week}
                  onChange={(e) => setForm({ ...form, day_of_week: parseInt(e.target.value) })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
                >
                  <option value={0}>Monday</option>
                  <option value={1}>Tuesday</option>
                  <option value={2}>Wednesday</option>
                  <option value={3}>Thursday</option>
                  <option value={4}>Friday (Peak)</option>
                  <option value={5}>Saturday</option>
                  <option value={6}>Sunday (Peak)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase text-slate-400 block mb-1">
                  Month
                </label>
                <select
                  value={form.month}
                  onChange={(e) => setForm({ ...form, month: parseInt(e.target.value) })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
                >
                  <option value={1}>January</option>
                  <option value={4}>April</option>
                  <option value={7}>July (Summer Peak)</option>
                  <option value={10}>October</option>
                  <option value={12}>December (Winter Peak)</option>
                </select>
              </div>
            </div>

            {/* Environmental & Terminal Weather */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-[11px] font-semibold uppercase text-slate-400 block mb-1">
                  Origin Terminal Weather
                </label>
                <select
                  value={form.origin_weather}
                  onChange={(e) => setForm({ ...form, origin_weather: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
                >
                  {WEATHER_OPTIONS.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase text-slate-400 block mb-1">
                  Destination Terminal Weather
                </label>
                <select
                  value={form.dest_weather}
                  onChange={(e) => setForm({ ...form, dest_weather: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
                >
                  {WEATHER_OPTIONS.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Aerodrome Conditions (Wind, Visibility, Taxi) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold uppercase text-slate-400 block mb-1">
                  Wind Speed (knots)
                </label>
                <input
                  type="number"
                  min="0"
                  max="65"
                  value={form.wind_speed_knots}
                  onChange={(e) => setForm({ ...form, wind_speed_knots: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white font-mono focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase text-slate-400 block mb-1">
                  Runway Taxi-Out (min)
                </label>
                <input
                  type="number"
                  min="5"
                  max="70"
                  value={form.taxi_out_minutes}
                  onChange={(e) => setForm({ ...form, taxi_out_minutes: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white font-mono focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase text-slate-400 block mb-1">
                  Airport Congestion
                </label>
                <select
                  value={form.congestion_level}
                  onChange={(e) => setForm({ ...form, congestion_level: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
                >
                  <option value="Low">Low (Nominal Flow)</option>
                  <option value="Moderate">Moderate (Standard Bank)</option>
                  <option value="High">High (Meter Fix Delay)</option>
                  <option value="Severe">Severe (Ground Stop / GDP)</option>
                </select>
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-sky-500/25 hover:from-sky-500 hover:to-blue-500 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" message="" />
                    <span>Executing Scikit-Learn Model Inference...</span>
                  </>
                ) : (
                  <>
                    <BrainCircuit className="h-4 w-4" />
                    <span>Run AI Delay Prediction</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Prediction Results Display (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {result ? (
            <div className="rounded-2xl border border-[#1a2947] bg-[#0f172a]/90 p-6 backdrop-blur-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-sky-400 font-bold block">
                    Inference Output
                  </span>
                  <h3 className="text-base font-bold text-white">Delay Risk Assessment</h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {result.prediction.model_version}
                </span>
              </div>

              {/* Probability & Delay Minutes Big Callouts */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-center">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    Delay Probability
                  </span>
                  <div
                    className="text-3xl font-extrabold font-mono mt-1"
                    style={{ color: result.prediction.risk_color }}
                  >
                    {result.prediction.delay_probability_pct}%
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {result.prediction.delay_probability >= 0.5 ? 'Delay Predicted (>15m)' : 'On-Time Expected'}
                  </span>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-center">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    Expected Arrival Delay
                  </span>
                  <div className="text-3xl font-extrabold font-mono text-white mt-1">
                    {result.prediction.expected_delay_minutes > 0
                      ? `+${result.prediction.expected_delay_minutes}m`
                      : `${result.prediction.expected_delay_minutes}m`}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">RandomForest Regressor</span>
                </div>
              </div>

              {/* Risk Tier Alert Badge */}
              <div
                className="rounded-xl p-3.5 border flex items-center justify-between text-xs"
                style={{
                  borderColor: `${result.prediction.risk_color}40`,
                  backgroundColor: `${result.prediction.risk_color}15`,
                  color: result.prediction.risk_color,
                }}
              >
                <div className="flex items-center gap-2 font-bold">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Risk Classification: {result.prediction.risk_tier}</span>
                </div>
                <span className="font-mono text-[10px]">Conf: {result.prediction.confidence_score}</span>
              </div>

              {/* Contributing Risk Factors */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-sky-400" /> Primary Contributing Factors
                </h4>
                <div className="space-y-2">
                  {result.contributing_factors.map((factor, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-3 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">{factor.factor}</span>
                        <span
                          className={`font-mono text-[11px] font-bold ${
                            factor.score > 0 ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          {factor.score > 0 ? `+${factor.score}` : `${factor.score}`} impact
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        {factor.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dispatch Recommendations */}
              <div className="rounded-xl border border-sky-500/20 bg-sky-950/20 p-3.5 text-xs">
                <span className="font-bold text-sky-300 block mb-1.5">Operational Dispatch Actions:</span>
                <ul className="space-y-1 text-[11px] text-slate-300 list-disc list-inside">
                  {result.operational_recommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[380px] rounded-2xl border border-dashed border-slate-800 bg-[#0f172a]/40 p-8 flex flex-col items-center justify-center text-center">
              <div className="rounded-2xl bg-slate-800/60 p-4 text-slate-400 mb-3 border border-slate-700/50">
                <BrainCircuit className="h-8 w-8 text-sky-400" />
              </div>
              <h4 className="text-sm font-bold text-white">Inference Engine Ready</h4>
              <p className="text-xs text-slate-400 max-w-xs mt-1">
                Configure flight parameters on the left or click a preset to trigger real-time Scikit-Learn baseline delay prediction.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
