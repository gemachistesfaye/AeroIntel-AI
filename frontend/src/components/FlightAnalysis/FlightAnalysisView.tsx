import React, { useState, useEffect } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  AlertCircle,
  X,
  Plane
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
    <div className="space-y-5">
      <DemoDataBanner sectionTitle="Flight Schedule Log & Telemetry" />

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-slate-800 bg-[#111827]/90 p-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by flight number (e.g. DL-1432), origin, or destination..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={carrierFilter}
              onChange={(e) => { setCarrierFilter(e.target.value); setPage(1); }}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
            >
              <option value="">All Carriers</option>
              <option value="DL">Delta (DL)</option>
              <option value="UA">United (UA)</option>
              <option value="AA">American (AA)</option>
              <option value="WN">Southwest (WN)</option>
              <option value="B6">JetBlue (B6)</option>
              <option value="AS">Alaska (AS)</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="ontime">On-Time (&lt;15m)</option>
              <option value="delayed">Delayed (&ge;15m)</option>
            </select>

            <select
              value={riskFilter}
              onChange={(e) => { setRiskFilter(e.target.value); setPage(1); }}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
            >
              <option value="">All Risk Tiers</option>
              <option value="Low">Low Risk</option>
              <option value="Moderate">Moderate Risk</option>
              <option value="High">High Risk</option>
              <option value="Severe">Severe Risk</option>
            </select>

            <button
              type="submit"
              className="rounded-lg bg-sky-500 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-400 transition-colors"
            >
              Apply Filter
            </button>

            {(searchQuery || carrierFilter || riskFilter || statusFilter) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-2 text-xs text-slate-300 hover:text-white"
              >
                Reset
              </button>
            )}
          </div>
        </form>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing <span className="font-semibold text-white font-mono">{flights.length}</span> of{' '}
            <span className="font-semibold text-white font-mono">{total}</span> matching flights
          </div>
          <div className="text-[11px] font-mono text-slate-500">Threshold: &ge; 15 min lateness</div>
        </div>
      </div>

      {/* Flight Records Table */}
      <div className="rounded-xl border border-slate-800 bg-[#111827]/90 overflow-hidden">
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
                  <th className="px-4 py-3">Flight ID</th>
                  <th className="px-3 py-3">Carrier</th>
                  <th className="px-3 py-3">Route</th>
                  <th className="px-3 py-3">Departure</th>
                  <th className="px-3 py-3">Surface Weather</th>
                  <th className="px-3 py-3">Taxi-Out</th>
                  <th className="px-3 py-3">Arrival Delay</th>
                  <th className="px-3 py-3">Delay Cause</th>
                  <th className="px-3 py-3">Risk Tier</th>
                  <th className="px-4 py-3 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {flights.map((f) => {
                  const isDelayed = f.is_delayed === 1;
                  return (
                    <tr
                      key={f.flight_id}
                      onClick={() => setSelectedFlight(f)}
                      className="hover:bg-slate-800/30 cursor-pointer transition-colors group"
                    >
                      <td className="px-4 py-3 font-bold text-sky-400 group-hover:text-sky-300">
                        {f.flight_id}
                      </td>
                      <td className="px-3 py-3 font-sans">
                        <span className="inline-flex items-center gap-1.5 font-medium text-slate-300">
                          <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-800 px-1 py-0.5 rounded border border-slate-700">
                            {f.carrier_code}
                          </span>
                          {f.carrier_name}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-200">
                        <span className="font-bold text-white">{f.origin}</span> &rarr;{' '}
                        <span className="font-bold text-white">{f.dest}</span>
                        <span className="text-[10px] text-slate-500 block font-normal font-sans">
                          {f.distance_miles} mi
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-300">{f.scheduled_dep_time}</td>
                      <td className="px-3 py-3 font-sans">
                        <span className="text-slate-300">{f.origin_weather}</span>
                        <span className="text-[10px] text-slate-500 font-mono block">
                          {f.wind_speed_knots} kts wind
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-300">{f.taxi_out_minutes} min</td>
                      <td className="px-3 py-3 font-bold">
                        <span className={isDelayed ? 'text-rose-400' : 'text-emerald-400'}>
                          {f.arr_delay_minutes > 0 ? `+${f.arr_delay_minutes}m` : `${f.arr_delay_minutes}m`}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-sans text-slate-400">{f.delay_cause}</td>
                      <td className="px-3 py-3 font-sans">
                        <RiskBadge tier={f.delay_risk_tier} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-sky-400 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="border-t border-slate-800/80 px-4 py-3 flex items-center justify-between text-xs text-slate-400">
            <div>
              Page <span className="font-bold text-white">{page}</span> of{' '}
              <span className="font-bold text-white">{totalPages}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-md border border-slate-700 bg-slate-900 p-1.5 text-slate-300 hover:bg-slate-800 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-md border border-slate-700 bg-slate-900 p-1.5 text-slate-300 hover:bg-slate-800 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Slide-over Inspection Drawer */}
      {selectedFlight && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0f172a] border-l border-slate-800 h-full overflow-y-auto p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Plane className="h-5 w-5 text-sky-400" />
                <h3 className="text-base font-bold text-white font-mono">{selectedFlight.flight_id}</h3>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  {selectedFlight.carrier_code}
                </span>
              </div>
              <button
                onClick={() => setSelectedFlight(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Route Corridor</span>
                <span className="font-bold text-white font-mono">
                  {selectedFlight.origin} ({selectedFlight.origin_name}) &rarr; {selectedFlight.dest} ({selectedFlight.dest_name})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Distance</span>
                <span className="font-mono text-slate-200">{selectedFlight.distance_miles} statute miles</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Scheduled Departure</span>
                <span className="font-mono text-slate-200">{selectedFlight.scheduled_dep_time} Local</span>
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Terminal Weather</span>
                <span className="text-slate-200">{selectedFlight.origin_weather} ({selectedFlight.wind_speed_knots} kts)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Runway Taxi-Out</span>
                <span className="font-mono text-slate-200">{selectedFlight.taxi_out_minutes} minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Airspace Congestion</span>
                <span className="text-slate-200">{selectedFlight.congestion_level}</span>
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Arrival Status</span>
                <span className={`font-bold font-mono ${selectedFlight.is_delayed ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {selectedFlight.arr_delay_minutes > 0 ? `+${selectedFlight.arr_delay_minutes}m Delay` : `${selectedFlight.arr_delay_minutes}m (On-Time)`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Primary Delay Reason</span>
                <span className="text-slate-200">{selectedFlight.delay_cause}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Assigned Risk Tier</span>
                <RiskBadge tier={selectedFlight.delay_risk_tier} />
              </div>
            </div>

            <p className="text-[11px] text-slate-500 italic text-center">
              Record from 1,250 FAA/BTS flight benchmark fixture
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
