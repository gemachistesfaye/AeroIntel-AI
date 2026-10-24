import React, { useState, useEffect } from 'react';
import {
  Compass,
  ArrowRight,
  TrendingDown,
  Clock,
  Layers,
  MapPin,
  Building,
  CheckCircle2,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';
import { RouteIntelligenceData, RouteCorridor, AirportHub } from '../../types/aviation';
import { aviationApi } from '../../services/api';
import { DemoDataBanner } from '../Common/DemoDataBanner';
import { LoadingSpinner } from '../Common/LoadingSpinner';

export const RouteIntelligenceView: React.FC = () => {
  const [data, setData] = useState<RouteIntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState<RouteCorridor | null>(null);
  const [corridorFilter, setCorridorFilter] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await aviationApi.getRouteIntelligence();
        setData(res);
        if (res.corridors.length > 0) {
          setSelectedRoute(res.corridors[0]);
        }
      } catch (err) {
        console.error('Failed to load route intelligence:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading || !data) {
    return <LoadingSpinner message="Analyzing national flight corridor networks and hub choke points..." />;
  }

  const filteredCorridors = data.corridors.filter(
    (c) =>
      c.route.toLowerCase().includes(corridorFilter.toLowerCase()) ||
      c.origin.toLowerCase().includes(corridorFilter.toLowerCase()) ||
      c.dest.toLowerCase().includes(corridorFilter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <DemoDataBanner sectionTitle="Air Corridor & Hub Route Intelligence" />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Corridors List (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-[#1a2947] bg-[#0f172a]/90 p-5 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Compass className="h-4 w-4 text-sky-400" /> Active Flight Corridors
              </h3>
              <p className="text-xs text-slate-400">Ranked by airspace congestion index</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {filteredCorridors.length} Corridors
            </span>
          </div>

          <input
            type="text"
            placeholder="Filter corridors (e.g. JFK, LAX, ORD)..."
            value={corridorFilter}
            onChange={(e) => setCorridorFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-900/90 px-3.5 py-2 text-xs text-white placeholder-slate-400 font-mono focus:border-sky-500 focus:outline-none"
          />

          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {filteredCorridors.map((c) => {
              const isSelected = selectedRoute?.route === c.route;
              const isSevere = c.congestion_index >= 70;
              const isModerate = c.congestion_index >= 45;

              return (
                <div
                  key={c.route}
                  onClick={() => setSelectedRoute(c)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-sky-500 bg-sky-500/10 shadow-md shadow-sky-500/10'
                      : 'border-slate-800/80 bg-slate-900/40 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm text-white">
                      {c.origin} &rarr; {c.dest}
                    </span>
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                        isSevere
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : isModerate
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      Congestion: {c.congestion_index}/100
                    </span>
                  </div>

                  <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] text-slate-400 font-mono">
                    <div>
                      <span>Punctuality:</span>
                      <span className="text-white block font-bold">{c.on_time_pct}%</span>
                    </div>
                    <div>
                      <span>Avg Delay:</span>
                      <span className="text-rose-400 block font-bold">
                        {c.avg_delay_minutes > 0 ? `+${c.avg_delay_minutes}m` : `${c.avg_delay_minutes}m`}
                      </span>
                    </div>
                    <div>
                      <span>Flights:</span>
                      <span className="text-white block font-bold">{c.flights_count}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Corridor Detailed Telemetry (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {selectedRoute ? (
            <div className="rounded-2xl border border-[#1a2947] bg-[#0f172a]/90 p-6 backdrop-blur-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-mono uppercase text-sky-400 font-bold block">
                    Corridor Deep Dive
                  </span>
                  <h3 className="text-xl font-bold font-mono text-white">
                    {selectedRoute.origin} &rarr; {selectedRoute.dest}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Distance</span>
                  <span className="font-mono text-sm font-bold text-white">
                    {selectedRoute.distance_miles} nautical mi
                  </span>
                </div>
              </div>

              {/* Corridor Scorecards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-center">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">On-Time Rate</span>
                  <span className="text-2xl font-bold font-mono text-emerald-400 mt-1 block">
                    {selectedRoute.on_time_pct}%
                  </span>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-center">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Average Delay</span>
                  <span className="text-2xl font-bold font-mono text-rose-400 mt-1 block">
                    {selectedRoute.avg_delay_minutes > 0
                      ? `+${selectedRoute.avg_delay_minutes}m`
                      : `${selectedRoute.avg_delay_minutes}m`}
                  </span>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-center">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Surface Taxi</span>
                  <span className="text-2xl font-bold font-mono text-white mt-1 block">
                    {selectedRoute.avg_taxi_minutes}m
                  </span>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-center">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Corridor Volume</span>
                  <span className="text-2xl font-bold font-mono text-sky-400 mt-1 block">
                    {selectedRoute.flights_count} flts
                  </span>
                </div>
              </div>

              {/* Active Carriers operating this corridor */}
              <div>
                <span className="text-xs font-bold text-slate-300 block mb-2">Operating Airlines</span>
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedRoute.active_carriers.map((c) => (
                    <span
                      key={c}
                      className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-mono font-bold text-sky-300"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              {/* Smart Routing Recommendations */}
              <div className="rounded-xl border border-sky-500/30 bg-sky-950/20 p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-sky-300">
                  <Lightbulb className="h-4 w-4 text-sky-400" />
                  <span>AI Route Optimization Advisory</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Historical flight telemetries indicate departure slots between{' '}
                  <strong className="text-white">06:00 and 09:30 Local</strong> achieve a{' '}
                  <strong className="text-emerald-400">+22% higher punctuality rate</strong> compared to evening banks (16:30 - 19:45). To minimize ATC meter-fix holds, prioritize morning turnarounds on the {selectedRoute.origin} &rarr; {selectedRoute.dest} corridor.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">
              Select an air corridor on the left to inspect detailed telemetry.
            </div>
          )}

          {/* Hub Airspace Congestion Index Table */}
          <div className="rounded-2xl border border-[#1a2947] bg-[#0f172a]/90 p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Building className="h-4 w-4 text-sky-400" /> Top Hub Airspace Congestion Index
                </h3>
                <p className="text-xs text-slate-400">Terminal bottleneck status and surface runway taxi queues</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-medium">
                  <tr>
                    <th className="pb-3">Hub Code</th>
                    <th className="pb-3">Airport Name</th>
                    <th className="pb-3">Departures</th>
                    <th className="pb-3">Punctuality %</th>
                    <th className="pb-3">Avg Taxi-Out</th>
                    <th className="pb-3 text-right">Congestion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {data.hubs.slice(0, 8).map((hub) => (
                    <tr key={hub.airport_code} className="hover:bg-slate-800/30">
                      <td className="py-2.5 font-bold text-sky-400">{hub.airport_code}</td>
                      <td className="py-2.5 font-sans text-slate-300 truncate max-w-[140px]">
                        {hub.airport_name}
                      </td>
                      <td className="py-2.5 text-slate-300">{hub.departures_count}</td>
                      <td className="py-2.5 font-bold">
                        <span className={hub.punctuality_pct >= 75 ? 'text-emerald-400' : 'text-amber-400'}>
                          {hub.punctuality_pct}%
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-300">{hub.avg_taxi_minutes} min</td>
                      <td className="py-2.5 text-right font-sans">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                            hub.congestion_tier === 'Severe'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : hub.congestion_tier === 'Elevated'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {hub.congestion_tier}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
