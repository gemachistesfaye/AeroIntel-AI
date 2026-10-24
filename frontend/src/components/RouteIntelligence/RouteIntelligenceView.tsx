import React, { useState, useEffect } from 'react';
import {
  Compass,
  ArrowRight,
  Clock,
  Layers,
  MapPin,
  Building,
  CheckCircle2,
  AlertTriangle,
  Search
} from 'lucide-react';
import { RouteIntelligenceData, RouteCorridor, AirportHub } from '../../types/aviation';
import { aviationApi } from '../../services/api';
import { DemoDataBanner } from '../Common/DemoDataBanner';
import { LoadingSpinner } from '../Common/LoadingSpinner';

// Airport coordinate projection (SVG 680 x 340 space)
const HUB_COORDINATES: Record<string, { x: number; y: number; name: string }> = {
  SEA: { x: 85, y: 55, name: 'Seattle-Tacoma' },
  SFO: { x: 55, y: 165, name: 'San Francisco' },
  LAX: { x: 75, y: 225, name: 'Los Angeles' },
  PHX: { x: 155, y: 235, name: 'Phoenix' },
  DEN: { x: 265, y: 165, name: 'Denver' },
  DFW: { x: 350, y: 245, name: 'Dallas/Fort Worth' },
  ORD: { x: 440, y: 130, name: "Chicago O'Hare" },
  ATL: { x: 485, y: 225, name: 'Atlanta' },
  CLT: { x: 530, y: 195, name: 'Charlotte' },
  MIA: { x: 550, y: 310, name: 'Miami' },
  JFK: { x: 580, y: 115, name: 'New York JFK' },
  BOS: { x: 610, y: 90, name: 'Boston' },
};

export const RouteIntelligenceView: React.FC = () => {
  const [data, setData] = useState<RouteIntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState<RouteCorridor | null>(null);
  const [selectedHub, setSelectedHub] = useState<string | null>(null);
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
    <div className="space-y-5">
      <DemoDataBanner sectionTitle="Air Corridors & Hub Network" />

      {/* SVG Air Corridor Network Map */}
      <div className="rounded-xl border border-slate-800 bg-[#111827]/90 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Compass className="h-4 w-4 text-sky-400" /> Continental US Air Corridor Network
            </h3>
            <p className="text-xs text-slate-400">Click any corridor route or airport node to inspect delay risk and traffic volume</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400" /> &gt;70% On-Time
            </span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="h-2 w-2 rounded-full bg-amber-400" /> 60-70%
            </span>
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="h-2 w-2 rounded-full bg-rose-400" /> &lt;60% Congested
            </span>
          </div>
        </div>

        {/* Map Canvas */}
        <div className="relative w-full overflow-hidden rounded-lg bg-[#0a0f1b] border border-slate-800/80 p-2">
          <svg viewBox="0 0 680 340" className="w-full h-64 sm:h-80 select-none">
            {/* Subtle Map Grid lines */}
            {[60, 120, 180, 240, 300].map((y) => (
              <line key={y} x1="20" y1={y} x2="660" y2={y} stroke="#172237" strokeWidth="1" strokeDasharray="3 6" opacity="0.4" />
            ))}
            {[100, 200, 300, 400, 500, 600].map((x) => (
              <line key={x} x1={x} y1="20" x2={x} y2="320" stroke="#172237" strokeWidth="1" strokeDasharray="3 6" opacity="0.4" />
            ))}

            {/* Flight Corridor Arcs */}
            {data.corridors.map((c) => {
              const orig = HUB_COORDINATES[c.origin];
              const dest = HUB_COORDINATES[c.dest];
              if (!orig || !dest) return null;

              const isSelected = selectedRoute?.route === c.route;
              const isHubSelected = selectedHub && (c.origin === selectedHub || c.dest === selectedHub);

              // Curved control point for Bézier curve
              const midX = (orig.x + dest.x) / 2;
              const midY = (orig.y + dest.y) / 2 - 25;
              const pathD = `M ${orig.x} ${orig.y} Q ${midX} ${midY} ${dest.x} ${dest.y}`;

              const onTime = c.on_time_pct ?? 65;
              const strokeColor = isSelected
                ? '#38bdf8'
                : onTime >= 70
                ? '#10b981'
                : onTime >= 60
                ? '#f59e0b'
                : '#f43f5e';

              return (
                <g key={c.route} className="cursor-pointer" onClick={() => { setSelectedRoute(c); setSelectedHub(null); }}>
                  {/* Invisible thicker hit area for clicking */}
                  <path d={pathD} fill="none" stroke="transparent" strokeWidth="14" />
                  {/* Visual arc */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={isSelected ? '3' : isHubSelected ? '2' : '1.5'}
                    strokeOpacity={isSelected ? 1 : isHubSelected ? 0.9 : selectedHub ? 0.2 : 0.65}
                    className={isSelected ? 'corridor-active' : 'transition-all'}
                  />
                </g>
              );
            })}

            {/* Airport Hub Nodes */}
            {Object.entries(HUB_COORDINATES).map(([code, coord]) => {
              const isSelected = selectedHub === code || selectedRoute?.origin === code || selectedRoute?.dest === code;

              return (
                <g
                  key={code}
                  className="cursor-pointer group"
                  onClick={() => {
                    setSelectedHub(code === selectedHub ? null : code);
                    const match = data.corridors.find((c) => c.origin === code || c.dest === code);
                    if (match) setSelectedRoute(match);
                  }}
                >
                  {/* Pulse ring for selected */}
                  {isSelected && (
                    <circle cx={coord.x} cy={coord.y} r="10" fill="none" stroke="#38bdf8" strokeWidth="1.5" className="animate-ping" opacity="0.6" />
                  )}
                  {/* Outer circle */}
                  <circle
                    cx={coord.x}
                    cy={coord.y}
                    r={isSelected ? 6 : 4.5}
                    fill={isSelected ? '#38bdf8' : '#1e293b'}
                    stroke={isSelected ? '#ffffff' : '#475569'}
                    strokeWidth="1.5"
                    className="transition-transform group-hover:scale-125"
                  />
                  {/* Code label */}
                  <text
                    x={coord.x}
                    y={coord.y - 8}
                    textAnchor="middle"
                    fill={isSelected ? '#ffffff' : '#94a3b8'}
                    fontSize="10"
                    fontWeight={isSelected ? '700' : '600'}
                    fontFamily="monospace"
                  >
                    {code}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Active selection banner */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between rounded-lg bg-slate-900/90 border border-slate-800 px-3 py-1.5 text-xs backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">Active Corridor:</span>
              <span className="font-mono text-sky-400 font-bold">{selectedRoute?.route || 'Select a Corridor'}</span>
              {selectedRoute && (
                <span className="text-slate-400 text-[11px] hidden sm:inline">
                  &middot; {selectedRoute.distance_miles} miles
                </span>
              )}
            </div>
            {selectedRoute && (
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className={selectedRoute.on_time_pct >= 70 ? 'text-emerald-400' : 'text-rose-400'}>
                  {selectedRoute.on_time_pct}% On-Time
                </span>
                <span className="text-slate-400">+{selectedRoute.avg_delay_minutes}m avg delay</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Corridor & Hub Metrics Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Corridors List (5 cols) */}
        <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-[#111827]/90 p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-white">Air Corridors</h3>
              <p className="text-xs text-slate-400">Select to highlight route telemetry</p>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Filter corridors..."
                value={corridorFilter}
                onChange={(e) => setCorridorFilter(e.target.value)}
                className="w-36 rounded-md border border-slate-700 bg-slate-900/80 pl-8 pr-2.5 py-1 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
            {filteredCorridors.map((c) => {
              const isSelected = selectedRoute?.route === c.route;
              const onTime = c.on_time_pct ?? 65;

              return (
                <div
                  key={c.route}
                  onClick={() => setSelectedRoute(c)}
                  className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'border-sky-500/50 bg-sky-500/10'
                      : 'border-slate-800/80 bg-slate-900/40 hover:bg-slate-800/50 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-white">{c.route}</span>
                    <span className="text-[11px] text-slate-400">({c.distance_miles} mi)</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className={`font-semibold ${onTime >= 70 ? 'text-emerald-400' : onTime >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>
                      {onTime}%
                    </span>
                    <span className="text-slate-400 text-[11px]">+{c.avg_delay_minutes}m</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Hub Congestion Table (7 cols) */}
        <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-[#111827]/90 p-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Building className="h-4 w-4 text-sky-400" /> Airport Hub Choke Points
              </h3>
              <p className="text-xs text-slate-400">FAA terminal turnaround punctuality & taxi-out delays</p>
            </div>
            <span className="text-xs text-slate-500">{data.hubs.length} Key Hubs</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 font-medium">
                <tr>
                  <th className="pb-2">Airport</th>
                  <th className="pb-2 text-right">Departures</th>
                  <th className="pb-2 text-right">Punctuality</th>
                  <th className="pb-2 text-right">Avg Taxi</th>
                  <th className="pb-2 text-right">Congestion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {data.hubs.map((hub) => {
                  const isSelected = selectedHub === hub.airport_code;

                  return (
                    <tr
                      key={hub.airport_code}
                      onClick={() => setSelectedHub(hub.airport_code === selectedHub ? null : hub.airport_code)}
                      className={`hover:bg-slate-800/30 transition-colors cursor-pointer ${
                        isSelected ? 'bg-sky-500/10' : ''
                      }`}
                    >
                      <td className="py-2 font-sans font-medium text-white flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-sky-400 font-mono border border-slate-700">
                          {hub.airport_code}
                        </span>
                        <span className="truncate max-w-[120px]">{hub.airport_name}</span>
                      </td>
                      <td className="py-2 text-right text-slate-300">{hub.departures_count}</td>
                      <td className="py-2 text-right">
                        <span className={`font-semibold ${hub.punctuality_pct >= 70 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {hub.punctuality_pct.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-2 text-right text-slate-300">{hub.avg_taxi_minutes}m</td>
                      <td className="py-2 text-right font-sans text-slate-400 text-[11px]">
                        {hub.congestion_tier}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
