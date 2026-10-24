import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Plane,
  ChevronLeft,
  ChevronRight,
  Wind,
  CloudRain,
  Eye,
  Clock,
  Compass,
  Building,
  AlertCircle,
  X
} from 'lucide-react';
import { Flight, FlightQueryParams, RiskTier } from '../../types/aviation';
import { aviationApi } from '../../services/api';
import { RiskBadge, Badge } from '../Common/Badge';
import { DemoDataBanner } from '../Common/DemoDataBanner';
import { LoadingSpinner } from '../Common/LoadingSpinner';

interface FlightAnalysisViewProps {
  initialFlightId?: string | null;
  onClearInitialFlight?: () => void;
}

export const FlightAnalysisView: React.FC<FlightAnalysisViewProps> = ({
  initialFlightId,
  onClearInitialFlight,
}) => {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState(initialFlightId || '');
  const [carrierFilter, setCarrierFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Selected flight for detail drawer/modal
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);

  const fetchFlights = async () => {
    try {
      setLoading(true);
      const params: FlightQueryParams = {
        q: searchQuery,
        carrier: carrierFilter,
        risk_tier: riskFilter,
        status: statusFilter,
        page,
        limit: 15,
      };
      const res = await aviationApi.getFlights(params);
      setFlights(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);

      // If initial flight ID was provided, automatically select it once loaded
      if (initialFlightId && res.items.length > 0) {
        const found = res.items.find((f) => f.flight_id === initialFlightId);
        if (found) setSelectedFlight(found);
      }
    } catch (err) {
      console.error('Failed to fetch flights:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlights();
  }, [page, carrierFilter, riskFilter, statusFilter]);

  // Debounced or enter search
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchFlights();
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setCarrierFilter('');
    setRiskFilter('');
    setStatusFilter('');
    setPage(1);
    if (onClearInitialFlight) onClearInitialFlight();
  };

  return (
    <div className="space-y-6">
      <DemoDataBanner sectionTitle="Flight Operations & Analysis" />

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-[#1a2947] bg-[#0f172a]/90 p-5 backdrop-blur-sm">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by flight number (e.g. DL1042), carrier, origin, or destination..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900/90 pl-10 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono"
            />
          </div>

          <div className="flex items-center flex-wrap gap-2 w-full md:w-auto">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-300 focus:border-sky-500 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="ontime">On-Time Only (&lt;15m)</option>
              <option value="delayed">Delayed Only (&ge;15m)</option>
            </select>

            {/* Carrier Filter */}
            <select
              value={carrierFilter}
              onChange={(e) => {
                setCarrierFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-300 focus:border-sky-500 focus:outline-none"
            >
              <option value="">All Carriers</option>
              <option value="DL">Delta (DL)</option>
              <option value="UA">United (UA)</option>
              <option value="AA">American (AA)</option>
              <option value="WN">Southwest (WN)</option>
              <option value="B6">JetBlue (B6)</option>
              <option value="AS">Alaska (AS)</option>
            </select>

            {/* Risk Tier Filter */}
            <select
              value={riskFilter}
              onChange={(e) => {
                setRiskFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-300 focus:border-sky-500 focus:outline-none"
            >
              <option value="">All Risk Tiers</option>
              <option value="Low">Low Risk</option>
              <option value="Moderate">Moderate Risk</option>
              <option value="High">High Risk</option>
              <option value="Severe">Severe Risk</option>
            </select>

            <button
              type="submit"
              className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-sky-500 transition-colors"
            >
              Apply Filter
            </button>

            {(searchQuery || carrierFilter || riskFilter || statusFilter) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-300 hover:text-white"
              >
                Reset
              </button>
            )}
          </div>
        </form>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing <span className="font-semibold text-white font-mono">{flights.length}</span> of{' '}
            <span className="font-semibold text-white font-mono">{total}</span> matching flight records
          </div>
          <div className="text-[11px] font-mono text-sky-400">FAA 15-Minute Lateness Threshold</div>
        </div>
      </div>

      {/* Flight Records Table */}
      <div className="rounded-2xl border border-[#1a2947] bg-[#0f172a]/90 backdrop-blur-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Filtering flight records..." />
        ) : flights.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No flight records match the specified filters. Try resetting the search terms.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-900/60 text-[11px] uppercase tracking-wider text-slate-400 font-medium">
                <tr>
                  <th className="px-5 py-3.5">Flight ID</th>
                  <th className="px-4 py-3.5">Carrier</th>
                  <th className="px-4 py-3.5">Route</th>
                  <th className="px-4 py-3.5">Scheduled</th>
                  <th className="px-4 py-3.5">Weather & Wind</th>
                  <th className="px-4 py-3.5">Taxi-Out</th>
                  <th className="px-4 py-3.5">Arrival Delay</th>
                  <th className="px-4 py-3.5">Delay Reason</th>
                  <th className="px-4 py-3.5">Risk Tier</th>
                  <th className="px-4 py-3.5 text-right">Telemetry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {flights.map((f) => {
                  const isDelayed = f.is_delayed === 1;
                  return (
                    <tr
                      key={f.flight_id}
                      onClick={() => setSelectedFlight(f)}
                      className="hover:bg-sky-500/5 cursor-pointer transition-colors group"
                    >
                      <td className="px-5 py-3.5 font-bold text-sky-400 group-hover:text-sky-300">
                        {f.flight_id}
                      </td>
                      <td className="px-4 py-3.5 font-sans">
                        <span className="inline-flex items-center gap-1.5 font-medium text-slate-300">
                          <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-800 px-1 py-0.5 rounded">
                            {f.carrier_code}
                          </span>
                          {f.carrier_name}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-200">
                        <span className="font-bold text-white">{f.origin}</span> &rarr;{' '}
                        <span className="font-bold text-white">{f.dest}</span>
                        <span className="text-[10px] text-slate-400 block font-normal font-sans">
                          {f.distance_miles} mi ({f.air_time_minutes} min)
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-300">{f.scheduled_dep_time}</td>
                      <td className="px-4 py-3.5 font-sans">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <span>{f.origin_weather}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {f.wind_speed_knots} kts wind
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-300">{f.taxi_out_minutes} min</td>
                      <td className="px-4 py-3.5 font-bold">
                        <span className={isDelayed ? 'text-rose-400' : 'text-emerald-400'}>
                          {f.arr_delay_minutes > 0 ? `+${f.arr_delay_minutes} min` : `${f.arr_delay_minutes} min`}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-sans text-slate-300">{f.delay_cause}</td>
                      <td className="px-4 py-3.5 font-sans">
                        <RiskBadge tier={f.delay_risk_tier} />
                      </td>
                      <td className="px-4 py-3.5 text-right font-sans">
                        <button className="text-xs text-sky-400 hover:text-sky-300 underline underline-offset-2">
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 px-5 py-3 text-xs text-slate-400">
          <div>
            Page <span className="font-bold text-white font-mono">{page}</span> of{' '}
            <span className="font-bold text-white font-mono">{totalPages}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page >= totalPages}
              className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-40"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Flight Detail Modal Drawer */}
      {selectedFlight && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl rounded-2xl border border-[#1f335e] bg-[#0c1324] p-6 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-sky-500/10 p-2 text-sky-400 border border-sky-500/30">
                  <Plane className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white font-mono">{selectedFlight.flight_id}</h3>
                    <RiskBadge tier={selectedFlight.delay_risk_tier} />
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {selectedFlight.dataset_label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {selectedFlight.carrier_name} &bull; {selectedFlight.route}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedFlight(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Flight Body Grid */}
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Departure Origin</span>
                <span className="font-bold text-white font-mono text-sm">{selectedFlight.origin}</span>
                <p className="text-[11px] text-slate-400 truncate">{selectedFlight.origin_name}</p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Arrival Destination</span>
                <span className="font-bold text-white font-mono text-sm">{selectedFlight.dest}</span>
                <p className="text-[11px] text-slate-400 truncate">{selectedFlight.dest_name}</p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Scheduled Departure</span>
                <span className="font-bold text-sky-400 font-mono text-sm">{selectedFlight.scheduled_dep_time}</span>
                <p className="text-[11px] text-slate-400">Hour {selectedFlight.dep_hour}:00</p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Arrival Status</span>
                <span
                  className={`font-bold font-mono text-sm ${
                    selectedFlight.is_delayed ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {selectedFlight.arr_delay_minutes > 0
                    ? `+${selectedFlight.arr_delay_minutes} min Late`
                    : `${selectedFlight.arr_delay_minutes} min On-Time`}
                </span>
                <p className="text-[11px] text-slate-400">{selectedFlight.delay_cause}</p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Runway Taxi Time</span>
                <span className="font-bold text-white font-mono text-sm">{selectedFlight.taxi_out_minutes} min</span>
                <p className="text-[11px] text-slate-400">Congestion: {selectedFlight.congestion_level}</p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Distance & Flight Time</span>
                <span className="font-bold text-white font-mono text-sm">{selectedFlight.distance_miles} miles</span>
                <p className="text-[11px] text-slate-400">{selectedFlight.air_time_minutes} min airborne</p>
              </div>
            </div>

            {/* Environmental & Terminal Conditions */}
            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Wind className="h-4 w-4 text-sky-400" /> Terminal Weather Conditions
              </h4>
              <div className="grid grid-cols-3 gap-3 text-xs text-slate-300">
                <div>
                  <span className="text-[10px] text-slate-400 block">Origin Conditions</span>
                  <span className="font-semibold">{selectedFlight.origin_weather}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Surface Wind</span>
                  <span className="font-semibold font-mono">{selectedFlight.wind_speed_knots} knots</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Atmospheric Visibility</span>
                  <span className="font-semibold font-mono">{selectedFlight.visibility_miles} statute miles</span>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedFlight(null)}
                className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
              >
                Close Telemetry View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
