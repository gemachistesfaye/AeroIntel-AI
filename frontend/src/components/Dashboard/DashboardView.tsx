import React, { useState } from 'react';
import {
  Plane,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  ShieldAlert,
  ArrowUpRight,
  ChevronRight,
  Activity
} from 'lucide-react';
import { DashboardSummary } from '../../types/aviation';
import { StatCard } from '../Layout/StatCard';
import { DemoDataBanner } from '../Common/DemoDataBanner';
import { LoadingSpinner } from '../Common/LoadingSpinner';

interface DashboardViewProps {
  data: DashboardSummary | null;
  loading: boolean;
  onSelectFlight: (flightId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ data, loading, onSelectFlight }) => {
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);

  if (loading || !data) {
    return <LoadingSpinner message="Aggregating nationwide aviation metrics..." />;
  }

  const maxHourlyFlights = Math.max(...data.hourly_trend.map((h) => h.flights), 1);
  const maxDelayRate = Math.max(...data.hourly_trend.map((h) => h.delay_rate_pct), 1);

  // SVG Chart Dimensions
  const chartWidth = 600;
  const chartHeight = 160;
  const padding = { top: 20, right: 20, bottom: 30, left: 35 };
  const graphWidth = chartWidth - padding.left - padding.right;
  const graphHeight = chartHeight - padding.top - padding.bottom;

  // Build SVG path points for the delay rate curve
  const points = data.hourly_trend.map((h, i) => {
    const x = padding.left + (i / (data.hourly_trend.length - 1)) * graphWidth;
    const y = padding.top + graphHeight - (h.delay_rate_pct / 50) * graphHeight;
    return { x, y, hour: h.hour, flights: h.flights, delayRate: h.delay_rate_pct };
  });

  const pathD = points.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${padding.top + graphHeight} L ${points[0].x} ${padding.top + graphHeight} Z`;

  return (
    <div className="space-y-5">
      <DemoDataBanner sectionTitle="Operations Overview" />

      {/* Top Level Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <StatCard
          title="Monitored Flights"
          value={data.total_flights.toLocaleString()}
          subtitle="Benchmark flight schedules"
          icon={Plane}
          accentColor="sky"
          trend={{ value: '1,250 Verified', isPositive: true }}
        />
        <StatCard
          title="Fleet On-Time Rate"
          value={`${data.on_time_rate_pct}%`}
          subtitle="Arrival within FAA 15-min tolerance"
          icon={CheckCircle2}
          accentColor={data.on_time_rate_pct >= 70 ? 'emerald' : 'amber'}
          trend={{
            value: data.on_time_rate_pct >= 75 ? '+2.4%' : '-3.1%',
            isPositive: data.on_time_rate_pct >= 70,
            label: 'vs 80% target',
          }}
        />
        <StatCard
          title="Avg Delayed Duration"
          value={`+${data.avg_delay_when_delayed_minutes}m`}
          subtitle="Mean lateness for delayed flights"
          icon={Clock}
          accentColor="rose"
          trend={{ value: `${data.delayed_flights_count} flights`, isPositive: false }}
        />
        <StatCard
          title="Disrupted Flights"
          value={data.delayed_flights_count}
          subtitle={`${Math.round((data.delayed_flights_count / data.total_flights) * 100)}% of total operations`}
          icon={AlertTriangle}
          accentColor="amber"
          trend={{ value: 'Actionable', isPositive: false }}
        />
      </div>

      {/* Middle Grid: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Hourly Trend SVG Chart (7 cols) */}
        <div className="rounded-xl border border-slate-800 bg-[#111827]/90 p-4 lg:col-span-7">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-sky-400" /> Hourly Hub Congestion & Delay Rate
              </h3>
              <p className="text-xs text-slate-400">Flight volume (bars) vs delay probability (line) across the operational day</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-slate-700" />
                <span className="text-slate-400">Volume</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-400" />
                <span className="text-slate-400">Delay %</span>
              </div>
            </div>
          </div>

          {/* SVG Visualization */}
          <div className="relative w-full overflow-hidden">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-44 select-none">
              <defs>
                <linearGradient id="delayAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 25, 50].map((val) => {
                const y = padding.top + graphHeight - (val / 50) * graphHeight;
                return (
                  <g key={val}>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={chartWidth - padding.right}
                      y2={y}
                      stroke="#1e293b"
                      strokeDasharray="3 3"
                    />
                    <text x={padding.left - 6} y={y + 3} textAnchor="end" fill="#64748b" fontSize="9" fontFamily="monospace">
                      {val}%
                    </text>
                  </g>
                );
              })}

              {/* Volume Bars */}
              {data.hourly_trend.map((h, i) => {
                const barWidth = 14;
                const x = padding.left + (i / (data.hourly_trend.length - 1)) * graphWidth - barWidth / 2;
                const barHeight = (h.flights / maxHourlyFlights) * (graphHeight * 0.7);
                const y = padding.top + graphHeight - barHeight;
                const isHovered = hoveredHour === i;

                return (
                  <rect
                    key={h.hour}
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    rx="2"
                    fill={isHovered ? '#38bdf8' : '#334155'}
                    opacity={isHovered ? 0.9 : 0.6}
                    className="transition-colors cursor-pointer"
                    onMouseEnter={() => setHoveredHour(i)}
                    onMouseLeave={() => setHoveredHour(null)}
                  />
                );
              })}

              {/* Delay Area Fill */}
              <path d={areaD} fill="url(#delayAreaGrad)" />

              {/* Delay Rate Line */}
              <path d={pathD} fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

              {/* Data Points */}
              {points.map((p, i) => {
                const isHovered = hoveredHour === i;
                return (
                  <circle
                    key={p.hour}
                    cx={p.x}
                    cy={p.y}
                    r={isHovered ? 4.5 : 2.5}
                    fill={isHovered ? '#ffffff' : '#f43f5e'}
                    stroke="#0f172a"
                    strokeWidth="1.5"
                    className="cursor-pointer transition-all"
                    onMouseEnter={() => setHoveredHour(i)}
                    onMouseLeave={() => setHoveredHour(null)}
                  />
                );
              })}

              {/* X Axis Labels */}
              {data.hourly_trend.map((h, i) => {
                if (i % 3 !== 0 && i !== data.hourly_trend.length - 1) return null;
                const x = padding.left + (i / (data.hourly_trend.length - 1)) * graphWidth;
                return (
                  <text key={h.hour} x={x} y={chartHeight - 8} textAnchor="middle" fill="#64748b" fontSize="10" fontFamily="monospace">
                    {h.hour}
                  </text>
                );
              })}
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredHour !== null && (
              <div
                className="absolute top-2 right-2 rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-xs shadow-xl pointer-events-none"
              >
                <div className="font-semibold text-white">{data.hourly_trend[hoveredHour].hour} Departure Bank</div>
                <div className="text-slate-400 text-[11px] flex gap-3 mt-0.5">
                  <span>Flights: <strong className="text-sky-400">{data.hourly_trend[hoveredHour].flights}</strong></span>
                  <span>Delayed: <strong className="text-rose-400">{data.hourly_trend[hoveredHour].delay_rate_pct}%</strong></span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Delay Cause Attribution (5 cols) */}
        <div className="rounded-xl border border-slate-800 bg-[#111827]/90 p-4 lg:col-span-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-sky-400" /> Delay Cause Attribution
                </h3>
                <p className="text-xs text-slate-400">FAA TranStats official categorization</p>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                FAA Spec
              </span>
            </div>

            <div className="space-y-2.5">
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
                        <span className="text-slate-500 text-[11px]">{cause.count} flights</span>
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

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Threshold: &ge; 15 min arrival delay</span>
            <span className="text-emerald-400 font-medium">856 on-time flights</span>
          </div>
        </div>
      </div>

      {/* Bottom Row: Carrier Performance & Recent Disruptions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Carrier Punctuality Table (7 cols) */}
        <div className="rounded-xl border border-slate-800 bg-[#111827]/90 p-4 lg:col-span-7">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-white">Carrier Punctuality Rankings</h3>
              <p className="text-xs text-slate-400">Aggregated on-time performance by airline operator</p>
            </div>
            <span className="text-xs text-slate-500">{data.carrier_performance.length} Carriers</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 font-medium">
                <tr>
                  <th className="pb-2">Airline</th>
                  <th className="pb-2 text-right">Flights</th>
                  <th className="pb-2 text-right">Delayed</th>
                  <th className="pb-2 text-right">On-Time %</th>
                  <th className="pb-2 text-right">Avg Delay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {data.carrier_performance.map((c) => (
                  <tr key={c.code} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 font-sans font-medium text-white flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-sky-400 font-mono border border-slate-700">
                        {c.code}
                      </span>
                      <span>{c.name}</span>
                    </td>
                    <td className="py-2.5 text-right text-slate-300">{c.total_flights}</td>
                    <td className="py-2.5 text-right text-slate-400">{c.delayed_flights}</td>
                    <td className="py-2.5 text-right">
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
                    <td className="py-2.5 text-right text-slate-300">
                      +{c.avg_delay_minutes.toFixed(1)}m
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Disruption Watchlist (5 cols) */}
        <div className="rounded-xl border border-slate-800 bg-[#111827]/90 p-4 lg:col-span-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Activity className="h-4 w-4 text-rose-400" /> Disruption Watchlist
                </h3>
                <p className="text-xs text-slate-400">High-risk & delayed corridor operations</p>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30">
                Action Req.
              </span>
            </div>

            <div className="space-y-2">
              {data.recent_disruptions.slice(0, 5).map((f, i) => (
                <div
                  key={f.flight_id || i}
                  onClick={() => f.flight_id && onSelectFlight(f.flight_id)}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800/60 hover:border-slate-700 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-sky-400 border border-slate-700">
                      {f.carrier_code}
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                        <span>{f.flight_id}</span>
                        <span className="text-slate-500">&middot;</span>
                        <span className="text-slate-300 font-mono">{f.route}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">{f.delay_cause}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-rose-400">
                      +{f.arr_delay_minutes}m
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-slate-300 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-3 text-[11px] text-slate-500 text-center">
            Click any flight to view pre-departure turnarounds & telemetries
          </p>
        </div>
      </div>
    </div>
  );
};
