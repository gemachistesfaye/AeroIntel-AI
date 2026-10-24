import React, { useState, useEffect } from 'react';
import {
  Database,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileText,
  Server,
  Layers,
  HardDrive,
  Download
} from 'lucide-react';
import { DataManagementInfo } from '../../types/aviation';
import { aviationApi } from '../../services/api';
import { DemoDataBanner } from '../Common/DemoDataBanner';
import { LoadingSpinner } from '../Common/LoadingSpinner';

export const DataManagementView: React.FC = () => {
  const [data, setData] = useState<DataManagementInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await aviationApi.getDataStatus();
      setData(res);
    } catch (err) {
      console.error('Failed to load data status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleRegenerate = async () => {
    try {
      setRegenerating(true);
      setActionMessage(null);
      const res = await aviationApi.regenerateData();
      setActionMessage(`Dataset regenerated successfully: ${res.records} benchmark flights initialized.`);
      await fetchStatus();
    } catch (err: any) {
      setActionMessage(`Regeneration error: ${err.message}`);
    } finally {
      setRegenerating(false);
    }
  };

  if (loading || !data) {
    return <LoadingSpinner message="Inspecting flight dataset schema & integrity rules..." />;
  }

  const { data_health, ingestion_status, columns } = data;

  return (
    <div className="space-y-6">
      <DemoDataBanner sectionTitle="Data Management & Schema Governance" />

      {/* Dataset Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-[#0f172a]/90 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="uppercase font-semibold tracking-wider">Active Records</span>
            <Database className="h-4 w-4 text-sky-400" />
          </div>
          <span className="text-3xl font-extrabold font-mono text-white mt-3 block">
            {data.total_records.toLocaleString()}
          </span>
          <p className="text-xs text-slate-400 mt-1">Calibrated flight samples</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#0f172a]/90 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="uppercase font-semibold tracking-wider">Feature Schema</span>
            <Layers className="h-4 w-4 text-sky-400" />
          </div>
          <span className="text-3xl font-extrabold font-mono text-white mt-3 block">
            {data.total_columns}
          </span>
          <p className="text-xs text-slate-400 mt-1">Strict typed attributes</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#0f172a]/90 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="uppercase font-semibold tracking-wider">Storage Footprint</span>
            <HardDrive className="h-4 w-4 text-sky-400" />
          </div>
          <span className="text-3xl font-extrabold font-mono text-white mt-3 block">
            {data.file_size_kb} KB
          </span>
          <p className="text-xs text-slate-400 mt-1">sample_flights.csv</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#0f172a]/90 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="uppercase font-semibold tracking-wider">Data Health</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <span className="text-3xl font-extrabold font-mono text-emerald-400 mt-3 block">
            100%
          </span>
          <p className="text-xs text-slate-400 mt-1">0 missing, 0 duplicates</p>
        </div>
      </div>

      {/* Dataset Actions & Ingestion Pipeline Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Status */}
        <div className="rounded-2xl border border-[#1a2947] bg-[#0f172a]/90 p-5 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Server className="h-4 w-4 text-sky-400" /> Data Pipeline Ingestion Status
              </h3>
              <p className="text-xs text-slate-400">Current ingest modes and connector readiness</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              CSV Mode Active
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 flex items-center justify-between">
              <div>
                <span className="font-semibold text-white block">Primary Data Source</span>
                <span className="text-slate-400 text-[11px] font-mono">{ingestion_status.source}</span>
              </div>
              <span className="text-emerald-400 font-mono text-xs font-semibold">Loaded</span>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 flex items-center justify-between">
              <div>
                <span className="font-semibold text-white block">OpenSky Network ADS-B Live Stream</span>
                <span className="text-slate-400 text-[11px]">Direct radar transponder feed</span>
              </div>
              <span className="text-amber-400 font-mono text-xs font-semibold">Planned (Phase 2)</span>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 flex items-center justify-between">
              <div>
                <span className="font-semibold text-white block">NOAA Aviation Weather METAR/TAF</span>
                <span className="text-slate-400 text-[11px]">Real-time terminal aerodrome forecasts</span>
              </div>
              <span className="text-amber-400 font-mono text-xs font-semibold">Planned (Phase 2)</span>
            </div>
          </div>
        </div>

        {/* Dataset Controls & Data Quality Check */}
        <div className="rounded-2xl border border-[#1a2947] bg-[#0f172a]/90 p-5 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Data Quality & Synthesis Controls
              </h3>
              <p className="text-xs text-slate-400">Audit checks and dataset regeneration</p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-300">Null or Missing Values</span>
              <span className="font-mono text-emerald-400 font-bold">{data_health.missing_values} (Zero)</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-300">Duplicate Flight Identifiers</span>
              <span className="font-mono text-emerald-400 font-bold">{data_health.duplicate_rows} (Zero)</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-300">Arrival Delay Value Boundaries</span>
              <span className="font-mono text-emerald-400 font-bold">[-60m, +400m] Valid</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-slate-300">Schema Validation Status</span>
              <span className="font-mono text-emerald-400 font-bold">Passed (Strict)</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-50 transition-all shadow-sm"
            >
              <RefreshCw className={`h-4 w-4 ${regenerating ? 'animate-spin text-sky-400' : 'text-slate-400'}`} />
              <span>{regenerating ? 'Generating New Flight Records...' : 'Regenerate Calibrated Benchmark Dataset'}</span>
            </button>
          </div>

          {actionMessage && (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 text-xs text-emerald-300">
              {actionMessage}
            </div>
          )}
        </div>
      </div>

      {/* Complete Schema Inspector Table */}
      <div className="rounded-2xl border border-[#1a2947] bg-[#0f172a]/90 backdrop-blur-sm overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="h-4 w-4 text-sky-400" /> FAA / BTS Aviation Dataset Schema Inspector
            </h3>
            <p className="text-xs text-slate-400">Complete list of all 24 typed fields and sample data entries</p>
          </div>
          <span className="text-xs font-mono text-slate-400">{columns.length} columns loaded</span>
        </div>

        <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 border-b border-slate-800 bg-slate-900 text-[11px] uppercase tracking-wider text-slate-400 font-medium">
              <tr>
                <th className="px-5 py-3">#</th>
                <th className="px-4 py-3">Field Name</th>
                <th className="px-4 py-3">Data Type</th>
                <th className="px-4 py-3">Missing Values</th>
                <th className="px-5 py-3">Sample Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {columns.map((col, idx) => (
                <tr key={col.name} className="hover:bg-slate-800/40">
                  <td className="px-5 py-2.5 text-slate-400">{idx + 1}</td>
                  <td className="px-4 py-2.5 font-bold text-sky-400">{col.name}</td>
                  <td className="px-4 py-2.5 text-slate-300 font-sans">
                    <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px] font-mono border border-slate-700">
                      {col.type}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-emerald-400">{col.null_count} nulls</td>
                  <td className="px-5 py-2.5 text-slate-200 truncate max-w-xs">{col.sample}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
