import React, { useState } from 'react';
import {
  Plane,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Building2,
  CloudRain,
  Wind,
  ShieldAlert,
  ChevronRight,
  Radio,
  Timer
} from 'lucide-react';
import { DashboardSummary } from '../../types/aviation';
import { DemoDataBanner } from '../Common/DemoDataBanner';
import { LoadingSpinner } from '../Common/LoadingSpinner';

interface DashboardViewProps {
  data: DashboardSummary | null;
  loading: boolean;
  onSelectFlight: (flightId: string) => void;
}

// Major FAA Hub Operational Status Ticker Data
const HUB_STATUSES = [
  { code: 'ATL', name: 'Atlanta', weather: 'Partly Cloudy', temp: '72°F', wind: '8 kts', taxi: '16m', status: 'Normal Flow', statusColor: 'emerald' },
  { code: 'ORD', name: "Chicago O'Hare", weather: 'Light Rain', temp: '54°F', wind: '22 kts', taxi: '28m', status: 'ATC Flow Hold', statusColor: 'amber' },
  { code: 'JFK', name: 'New York JFK', weather: 'Thunderstorm', temp: '61°F', wind: '28 kts', taxi: '36m', status: 'Ground Stop Risk', statusColor: 'rose' },
  { code: 'DFW', name: 'Dallas/Fort Worth', weather: 'Clear', temp: '78°F', wind: '10 kts', taxi: '18m', status: 'Normal Flow', statusColor: 'emerald' },
  { code: 'LAX', name: 'Los Angeles', weather: 'Sunny', temp: '68°F', wind: '6 kts', taxi: '17m', status: 'Normal Flow', statusColor: 'emerald' },
];

export const DashboardView: React.FC<DashboardViewProps> = ({ data, loading, onSelectFlight }) => {
  const [hoveredBank, setHoveredBank] = useState<number | null>(null);

  if (loading || !data) {
    return <LoadingSpinner message="Loading airline operations telemetry..." />;
  }

  const maxHourlyFlights = Math.max(...data.hourly_trend.map((h) => h.flights), 1);

  return (
    <div className="space-y-4">
      {/* Airport Hub Operations Ticker */}
      <div className="rounded-xl border border-slate-800 bg-[#111827] p-3">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80 text-xs">
          <div className="flex items-center gap-2">
            <Radio className="h-3.5 w-3.5 text-sky-400" />
            <span className="font-semibold text-white">FAA Hub Operations Status</span>
            <span className="text-[11px] text-slate-500 hidden sm:inline">&middot; Surface Weather & Runway Metering</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            Real-Time Ground Status
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {HUB_STATUSES.map((hub) => (
            <div key={hub.code} className="rounded-lg bg-slate-900/80 border border-slate-800/80 p-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-white text-sm">{hub.code}</span>
                <span
                  className={`text-[10px] font-medium px-1.5 py-0.2 rounded ${
                    hub.statusColor === 'emerald'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : hub.statusColor === 'amber'
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {hub.status}
                </span>
              </div>
              <div className="mt-1 text-[11px] text-slate-400 flex items-center justify-between">
                <span>{hub.weather}</span>
                <span className="font-mono">{hub.temp}</span>
              </div>
              <div className="mt-0.5 text-[10px] text-slate-500 flex items-center justify-between font-mono">
                <span>Taxi: {hub.taxi}</span>
                <span>Wind: {hub.wind}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <DemoDataBanner sectionTitle="Fleet Operations Overview" />

      {/* Flight Operations KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-800 bg-[#111827] p-3.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Active Monitored Flights</span>
            <Plane className="h-4 w-4 text-sky-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white">
            {data.total_flights.toLocaleString()}
          </div>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Commercial flights scheduled today
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#111827] p-3.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Fleet Punctuality (A14)</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">
            {data.on_time_rate_pct}%
          </div>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Within FAA 15-min arrival tolerance
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#111827] p-3.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Ground Holds / Disrupted</span>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-400">
            {data.delayed_flights_count}
          </div>
          <p className="mt-0.5 text-[11px] text-slate-500">
            {Math.round((data.delayed_flights_count / data.total_flights) * 100)}% of flights delayed &ge;15 min
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#111827] p-3.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Avg Surface Taxi-Out</span>
            <Timer className="h-4 w-4 text-sky-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white">
            18.4 min
          </div>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Gate pushback to wheel-up clearance
          </p>
        </div>
      </div>

      {/* Main Grid: Departure Bank Schedule & Delay Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Departure Banks Schedule Histogram (7 cols) - REAL AVIATION, NOT STOCK CHART */}
        <div className="rounded-xl border border-slate-800 bg-[#111827] p-4 lg:col-span-7">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Clock className="h-4 w-4 text-sky-400" /> Flight Departure Schedule Banks
              </h3>
              <p className="text-xs text-slate-400">Hourly departures: On-time flights (emerald) vs delayed operations (amber)</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="h-2 w-2 rounded-sm bg-emerald-500" /> On Time
              </span>
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="h-2 w-2 rounded-sm bg-amber-500" /> Delayed (&ge;15m)
              </span>
            </div>
          </div>

          {/* Departure Banks Bar Chart */}
          <div className="h-48 flex items-end gap-1.5 pt-6 pb-2 border-b border-slate-800">
            {data.hourly_trend.map((h, i) => {
              const onTimeFlights = h.flights - h.delayed;
              const totalHeightPct = Math.round((h.flights / maxHourlyFlights) * 100);
              const delayedHeightPct = Math.round((h.delayed / maxHourlyFlights) * 100);
              const onTimeHeightPct = totalHeightPct - delayedHeightPct;
              const isHovered = hoveredBank === i;

              return (
                <div
                  key={h.hour}
                  className="flex-1 flex flex-col items-center group relative h-full justify-end cursor-pointer"
                  onMouseEnter={() => setHoveredBank(i)}
                  onMouseLeave={() => setHoveredBank(null)}
                >
                  {/* Tooltip */}
                  {isHovered && (
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-20 rounded bg-slate-900 border border-slate-700 px-2.5 py-1 text-xs text-white shadow-xl whitespace-nowrap pointer-events-none">
                      <div className="font-bold">{h.hour} Departure Bank</div>
                      <div className="text-[11px] text-slate-400 flex gap-2">
                        <span className="text-emerald-400">{onTimeFlights} On-Time</span>
                        <span className="text-amber-400">{h.delayed} Delayed ({h.delay_rate_pct}%)</span>
                      </div>
                    </div>
                  )}

                  {/* Segmented Stacked Bar */}
                  <div className="w-full flex flex-col justify-end rounded-t overflow-hidden transition-all duration-200">
                    {/* Delayed Top Segment */}
                    <div
                      style={{ height: `${delayedHeightPct}%` }}
                      className={`w-full ${isHovered ? 'bg-amber-400' : 'bg-amber-500/80'} transition-colors`}
                    />
                    {/* On-Time Bottom Segment */}
                    <div
                      style={{ height: `${onTimeHeightPct}%` }}
                      className={`w-full ${isHovered ? 'bg-emerald-400' : 'bg-emerald-500/80'} transition-colors`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* X Axis Labels */}
          <div className="flex justify-between pt-2 text-[10px] font-mono text-slate-500">
            <span>06:00 (Morning Push)</span>
            <span>12:00 (Midday Hub)</span>
            <span>17:00 (Evening Rush)</span>
            <span>22:00 (Night Bank)</span>
          </div>
        </div>

        {/* Delay Cause Categorization (5 cols) */}
        <div className="rounded-xl border border-slate-800 bg-[#111827] p-4 lg:col-span-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-sky-400" /> Delay Cause Attribution
                </h3>
                <p className="text-xs text-slate-400">FAA standard classification breakdown</p>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                FAA Spec
              </span>
            </div>

            <div className="space-y-2.5 mt-3">
              {data.causes_breakdown.map((cause) => {
                const isOntime = cause.cause === 'On Time';
                const colorClass = isOntime
                  ? 'bg-emerald-500'
                  : cause.cause.includes('Weather')
                  ? 'bg-sky-500'
                  : cause.cause.includes('Air Traffic')
                  ? 'bg-amber-500'
                  : cause.cause.includes('Late')
                  ? 'bg-purple-500'
                  : 'bg-rose-500';

                return (
                  <div key={cause.cause} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-300">{cause.cause}</span>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-slate-500 text-[11px]">{cause.count} flts</span>
                        <span className="font-semibold text-white">{cause.percentage}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${colorClass}`}
                        style={{ width: `${cause.percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-2.5 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Threshold: &ge; 15 min arrival delay</span>
            <span className="text-emerald-400 font-medium">856 on-time flights</span>
          </div>
        </div>
      </div>

      {/* Bottom Row: Flight Operations Dispatch Board & Carrier Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Live Flight Information Display Board (FIDS Style) - 7 cols */}
        <div className="rounded-xl border border-slate-800 bg-[#111827] p-4 lg:col-span-7">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Plane className="h-4 w-4 text-sky-400" /> Monitored Flight Dispatch Board
              </h3>
              <p className="text-xs text-slate-400">Pre-departure schedule, route corridors & delay alerts</p>
            </div>
            <span className="text-xs text-slate-500 font-mono">Live Operations Feed</span>
          </div>

          <div className="space-y-2">
            {data.recent_disruptions.slice(0, 5).map((f, i) => (
              <div
                key={f.flight_id || i}
                onClick={() => f.flight_id && onSelectFlight(f.flight_id)}
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800/80 bg-slate-900/60 hover:bg-slate-800/50 hover:border-slate-700 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-8 w-8 rounded bg-slate-800 text-sky-400 font-mono font-bold text-xs border border-slate-700">
                    {f.carrier_code}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <span className="font-mono text-sky-300">{f.flight_id}</span>
                      <span className="text-slate-500">&middot;</span>
                      <span className="font-mono text-white font-bold">{f.route}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <span>Reason: {f.delay_cause}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-amber-400 block">
                      +{f.arr_delay_minutes}m Delay
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {f.delay_risk_tier} Risk
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-slate-300 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Carrier Punctuality Rankings (5 cols) */}
        <div className="rounded-xl border border-slate-800 bg-[#111827] p-4 lg:col-span-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-sky-400" /> Airline Carrier Punctuality
                </h3>
                <p className="text-xs text-slate-400">Fleet arrival performance (A14)</p>
              </div>
              <span className="text-xs text-slate-500 font-mono">{data.carrier_performance.length} Airlines</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 text-slate-400 font-medium">
                  <tr>
                    <th className="pb-1.5">Carrier</th>
                    <th className="pb-1.5 text-right">Flights</th>
                    <th className="pb-1.5 text-right">On-Time %</th>
                    <th className="pb-1.5 text-right">Avg Delay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {data.carrier_performance.map((c) => (
                    <tr key={c.code} className="hover:bg-slate-800/20 transition-colors">
                      <td className="py-2 font-sans font-medium text-white flex items-center gap-1.5">
                        <span className="px-1 py-0.2 rounded bg-slate-800 text-[10px] text-sky-400 font-mono border border-slate-700">
                          {c.code}
                        </span>
                        <span className="truncate max-w-[100px]">{c.name}</span>
                      </td>
                      <td className="py-2 text-right text-slate-300">{c.total_flights}</td>
                      <td className="py-2 text-right">
                        <span
                          className={`font-semibold ${
                            c.on_time_rate >= 75
                              ? 'text-emerald-400'
                              : c.on_time_rate >= 65
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {c.on_time_rate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-2 text-right text-slate-400">
                        +{c.avg_delay_minutes.toFixed(1)}m
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="mt-3 text-[11px] text-slate-500 text-center">
            Punctuality measured by FAA $\le 15$ min threshold
          </p>
        </div>
      </div>
    </div>
  );
};
