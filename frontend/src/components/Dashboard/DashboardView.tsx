import React from 'react';
import {
  Plane,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  BarChart2,
  ShieldAlert,
  ArrowUpRight,
  Flame
} from 'lucide-react';
import { DashboardSummary, Flight } from '../../types/aviation';
import { StatCard } from '../Layout/StatCard';
import { RiskBadge, Badge } from '../Common/Badge';
import { DemoDataBanner } from '../Common/DemoDataBanner';
import { LoadingSpinner } from '../Common/LoadingSpinner';

interface DashboardViewProps {
  data: DashboardSummary | null;
  loading: boolean;
  onSelectFlight: (flightId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ data, loading, onSelectFlight }) => {
  if (loading || !data) {
    return <LoadingSpinner message="Aggregating nationwide aviation metrics..." />;
  }

  // Find max flights in hourly trend for scaling
  const maxHourlyFlights = Math.max(...data.hourly_trend.map((h) => h.flights), 1);

  return (
    <div className="space-y-6">
      <DemoDataBanner sectionTitle="Mission Operations Dashboard" />

      {/* Top Level Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Monitored Flights"
          value={data.total_flights.toLocaleString()}
          subtitle="Benchmark flight schedule records"
          icon={Plane}
          accentColor="sky"
          trend={{ value: '100% Validated', isPositive: true }}
        />
        <StatCard
          title="Fleet On-Time Rate"
          value={`${data.on_time_rate_pct}%`}
          subtitle="Arrival within FAA 15-min tolerance"
          icon={CheckCircle2}
          accentColor={data.on_time_rate_pct >= 75 ? 'emerald' : 'amber'}
          trend={{
            value: data.on_time_rate_pct >= 75 ? '+2.4%' : '-3.1%',
            isPositive: data.on_time_rate_pct >= 75,
            label: 'vs target (80%)',
          }}
        />
        <StatCard
          title="Avg Delayed Duration"
          value={`+${data.avg_delay_when_delayed_minutes}m`}
          subtitle="Mean delay for disrupted flights"
          icon={Clock}
          accentColor="rose"
          trend={{ value: `${data.delayed_flights_count} flights`, isPositive: false }}
        />
        <StatCard
          title="Active Disruptions"
          value={data.delayed_flights_count}
          subtitle={`${Math.round((data.delayed_flights_count / data.total_flights) * 100)}% of total fleet operations`}
          icon={AlertTriangle}
          accentColor="amber"
          trend={{ value: 'Requires Action', isPositive: false }}
        />
      </div>

      {/* Row 2: Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Delay Causes Attribution */}
        <div className="rounded-2xl border border-[#1a2947] bg-[#0f172a]/80 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-sky-400" /> Delay Cause Attribution
              </h3>
              <p className="text-xs text-slate-400">FAA Categorization breakdown</p>
            </div>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              FAA Standards
            </span>
          </div>

          <div className="space-y-3.5">
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
                      <span className="text-slate-400">{cause.count} flts</span>
                      <span className="font-semibold text-white">{cause.percentage}%</span>
                    </div>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
                      style={{ width: `${cause.percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Hourly Delay Curve */}
        <div className="rounded-2xl border border-[#1a2947] bg-[#0f172a]/80 p-5 backdrop-blur-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-sky-400" /> Hourly Hub Congestion & Delay Risk Curve
              </h3>
              <p className="text-xs text-slate-400">Flight departure volume vs delay probability across operational hours</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-sky-500" />
                <span className="text-slate-400">Volume</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-400" />
                <span className="text-slate-400">Delay Rate %</span>
              </div>
            </div>
          </div>

          <div className="h-52 flex items-end gap-1.5 pt-6 pb-2 border-b border-slate-800">
            {data.hourly_trend.map((h) => {
              const heightPct = Math.round((h.flights / maxHourlyFlights) * 100);
              const isPeak = h.delay_rate_pct > 35;

              return (
                <div key={h.hour} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                  {/* Tooltip */}
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                    <div className="rounded bg-slate-900 border border-slate-700 px-2 py-1 text-[10px] text-white whitespace-nowrap shadow-xl">
                      <span className="font-bold">{h.hour}</span>: {h.flights} flights ({h.delay_rate_pct}% delayed)
                    </div>
                  </div>

                  {/* Delay rate indicator pip */}
                  <div
                    className={`w-1.5 h-1.5 rounded-full mb-1 transition-all ${
                      isPeak ? 'bg-rose-400 shadow-sm shadow-rose-500' : 'bg-slate-600'
                    }`}
                  />

                  {/* Volume bar */}
                  <div
                    className={`w-full rounded-t transition-all duration-300 group-hover:brightness-125 ${
                      isPeak ? 'bg-gradient-to-t from-sky-600 to-rose-500' : 'bg-sky-600/60'
                    }`}
                    style={{ height: `${Math.max(heightPct, 8)}%` }}
                  />
                  <span className="text-[9px] font-mono text-slate-400 mt-2 truncate w-full text-center">
                    {h.hour.slice(0, 2)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-2 text-right text-[11px] text-slate-400">
            Scheduled Departure Hour (Local System)
          </div>
        </div>
      </div>

      {/* Row 3: Carrier Performance & Critical Disruptions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Carrier On-Time Performance */}
        <div className="rounded-2xl border border-[#1a2947] bg-[#0f172a]/80 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-sky-400" /> Carrier Reliability Leaderboard
              </h3>
              <p className="text-xs text-slate-400">Ranked by on-time flight arrival percentage</p>
            </div>
          </div>

          <div className="space-y-3">
            {data.carrier_performance.map((c, idx) => (
              <div key={c.code} className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-3">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/30">
                      {c.code}
                    </span>
                    <span className="font-semibold text-white">{c.name}</span>
                  </div>
                  <span
                    className={`font-mono font-bold text-xs ${
                      c.on_time_rate >= 75 ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {c.on_time_rate}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{c.total_flights} total flights</span>
                  <span>Avg delay: {c.avg_delay_minutes > 0 ? `+${c.avg_delay_minutes}m` : `${c.avg_delay_minutes}m`}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Critical Operational Disruptions Table */}
        <div className="rounded-2xl border border-[#1a2947] bg-[#0f172a]/80 p-5 backdrop-blur-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Flame className="h-4 w-4 text-rose-400" /> Critical Active Disruptions
              </h3>
              <p className="text-xs text-slate-400">Flights experiencing severe weather or airspace slot delays</p>
            </div>
            <span className="text-xs text-slate-400 font-mono">Immediate Attention</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-medium">
                <tr>
                  <th className="pb-3">Flight ID</th>
                  <th className="pb-3">Route</th>
                  <th className="pb-3">Scheduled</th>
                  <th className="pb-3">Delay Duration</th>
                  <th className="pb-3">Primary Root Cause</th>
                  <th className="pb-3">Risk Tier</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {data.recent_disruptions.map((flight) => (
                  <tr key={flight.flight_id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 font-bold text-sky-400">{flight.flight_id}</td>
                    <td className="py-3 text-slate-200">
                      {flight.origin} &rarr; {flight.dest}
                    </td>
                    <td className="py-3 text-slate-400">{flight.scheduled_dep_time}</td>
                    <td className="py-3 font-semibold text-rose-400">+{flight.arr_delay_minutes} min</td>
                    <td className="py-3 font-sans text-slate-300">{flight.delay_cause}</td>
                    <td className="py-3 font-sans">
                      <RiskBadge tier={flight.delay_risk_tier || 'High'} />
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => flight.flight_id && onSelectFlight(flight.flight_id)}
                        className="inline-flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 font-sans"
                      >
                        Inspect <ArrowUpRight className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
