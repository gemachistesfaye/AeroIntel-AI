import React, { useState } from 'react';
import {
  Plane,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';
import { DashboardSummary } from '../../types/aviation';
import { LoadingSpinner } from '../Common/LoadingSpinner';

interface DashboardViewProps {
  data: DashboardSummary | null;
  loading: boolean;
  onSelectFlight: (flightId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ data, loading, onSelectFlight }) => {
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);

  if (loading || !data) {
    return <LoadingSpinner message="Loading operations overview..." />;
  }

  const maxHourlyFlights = Math.max(...data.hourly_trend.map((h) => h.flights), 1);

  return (
    <div className="space-y-6">
      {/* 4 Clean Primary Metric Cards - Unified White Typography */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-[#111827] p-5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">Total Flights</span>
            <Plane className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-3 text-3xl font-bold font-mono text-white">
            {data.total_flights.toLocaleString()}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Monitored schedule records
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#111827] p-5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">On-Time Rate</span>
            <CheckCircle2 className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-3 text-3xl font-bold font-mono text-white">
            {data.on_time_rate_pct}%
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Arrivals within FAA 15m tolerance
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#111827] p-5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">Delayed Flights</span>
            <AlertTriangle className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-3 text-3xl font-bold font-mono text-white">
            {data.delayed_flights_count}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {Math.round((data.delayed_flights_count / data.total_flights) * 100)}% of total operations
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#111827] p-5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">Average Delay</span>
            <Clock className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-3 text-3xl font-bold font-mono text-white">
            +{data.avg_delay_when_delayed_minutes}m
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Mean lateness for delayed flights
          </p>
        </div>
      </div>

      {/* Main Row: Scheduled Volume + Delay Causes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Hourly Scheduled Departures (7 cols) */}
        <div className="rounded-xl border border-slate-800 bg-[#111827] p-5 lg:col-span-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Departures by Hour</h3>
                <p className="text-xs text-slate-400">Scheduled flight volume across the operating day</p>
              </div>
              <span className="text-xs text-slate-500 font-mono">06:00 &ndash; 22:00</span>
            </div>

            {/* Consistent, Monochromatic Bar Chart */}
            <div className="h-48 flex items-end gap-2 pt-6 pb-2 border-b border-slate-800">
              {data.hourly_trend.map((h, i) => {
                const heightPct = Math.round((h.flights / maxHourlyFlights) * 100);
                const isHovered = hoveredHour === i;

                return (
                  <div
                    key={h.hour}
                    className="flex-1 flex flex-col items-center group relative h-full justify-end cursor-pointer"
                    onMouseEnter={() => setHoveredHour(i)}
                    onMouseLeave={() => setHoveredHour(null)}
                  >
                    {isHovered && (
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-20 rounded bg-slate-900 border border-slate-700 px-2.5 py-1 text-xs text-white shadow-xl whitespace-nowrap pointer-events-none">
                        <span className="font-bold">{h.hour}</span>: {h.flights} flights ({h.delayed} delayed)
                      </div>
                    )}

                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-t transition-colors ${
                        isHovered ? 'bg-sky-400' : 'bg-slate-700 hover:bg-slate-600'
                      }`}
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between pt-2 text-xs font-mono text-slate-500">
              <span>06:00</span>
              <span>10:00</span>
              <span>14:00</span>
              <span>18:00</span>
              <span>22:00</span>
            </div>
          </div>
        </div>

        {/* Delay Causes Breakdown (5 cols) - Consistent Neutral Blue/Slate Palette */}
        <div className="rounded-xl border border-slate-800 bg-[#111827] p-5 lg:col-span-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-slate-400" /> Delay Causes
                </h3>
                <p className="text-xs text-slate-400">FAA standard classification</p>
              </div>
              <span className="text-xs text-slate-500 font-mono">1,250 Flights</span>
            </div>

            <div className="space-y-3">
              {data.causes_breakdown.map((cause) => {
                const isOntime = cause.cause === 'On Time';

                return (
                  <div key={cause.cause} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium">{cause.cause}</span>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-slate-500">{cause.count}</span>
                        <span className="font-semibold text-white">{cause.percentage}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isOntime ? 'bg-emerald-500' : 'bg-sky-500'
                        }`}
                        style={{ width: `${cause.percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 text-xs text-slate-500 flex justify-between">
            <span>FAA standard: &ge; 15 min lateness</span>
            <span className="text-slate-400 font-medium font-mono">856 on-time (68.5%)</span>
          </div>
        </div>
      </div>

      {/* Bottom: Monitored Flights Log */}
      <div className="rounded-xl border border-slate-800 bg-[#111827] p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Plane className="h-4 w-4 text-slate-400" /> Monitored Flights Log
            </h3>
            <p className="text-xs text-slate-400">Recent commercial flight operations and status</p>
          </div>
          <span className="text-xs text-slate-500">Click row to inspect</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-slate-400 font-medium">
              <tr>
                <th className="pb-2.5">Flight ID</th>
                <th className="pb-2.5">Airline</th>
                <th className="pb-2.5">Route</th>
                <th className="pb-2.5">Delay Reason</th>
                <th className="pb-2.5 text-right">Status</th>
                <th className="pb-2.5 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {data.recent_disruptions.slice(0, 5).map((f, i) => (
                <tr
                  key={f.flight_id || i}
                  onClick={() => f.flight_id && onSelectFlight(f.flight_id)}
                  className="hover:bg-slate-800/30 transition-colors cursor-pointer group"
                >
                  <td className="py-3 font-bold text-sky-400 font-mono">
                    {f.flight_id}
                  </td>
                  <td className="py-3 font-sans text-slate-300">
                    {f.carrier_code}
                  </td>
                  <td className="py-3 text-white font-bold font-mono">
                    {f.route}
                  </td>
                  <td className="py-3 font-sans text-slate-400">
                    {f.delay_cause}
                  </td>
                  <td className="py-3 text-right">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700">
                      +{f.arr_delay_minutes}m Delay
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-slate-300 transition-colors inline" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
