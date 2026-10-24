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
  Upload,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  FileCheck
} from 'lucide-react';
import { DataManagementInfo, DataQualityReport } from '../../types/aviation';
import { aviationApi } from '../../services/api';
import { DemoDataBanner } from '../Common/DemoDataBanner';
import { LoadingSpinner } from '../Common/LoadingSpinner';

export const DataManagementView: React.FC = () => {
  const [data, setData] = useState<DataManagementInfo | null>(null);
  const [qualityReport, setQualityReport] = useState<DataQualityReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // Upload state
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadReport, setUploadReport] = useState<DataQualityReport | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const [statusRes, qualityRes] = await Promise.all([
        aviationApi.getDataStatus(),
        aviationApi.getDataQualityReport().catch(() => null)
      ]);
      setData(statusRes);
      if (qualityRes) setQualityReport(qualityRes);
    } catch (err) {
      console.error('Failed to load data status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setActionMessage(null);
      const res = await aviationApi.uploadCsv(file);
      setUploadedFileName(res.file_name);
      setUploadReport(res.quality_report);
      setActionMessage({ text: `File '${file.name}' uploaded & validated successfully! ${res.quality_report.valid_records} valid records found.` });
    } catch (err: any) {
      setActionMessage({ text: `Upload failed: ${err.message}`, isError: true });
    } finally {
      setUploading(false);
    }
  };

  const handleIngestUploaded = async () => {
    if (!uploadedFileName) return;
    try {
      setIngesting(true);
      setActionMessage(null);
      const res = await aviationApi.ingestDataset(uploadedFileName);
      setQualityReport(res.quality_report);
      setActionMessage({ text: `Successfully ingested and activated ${res.records} flight records from ${uploadedFileName}!` });
      await fetchStatus();
    } catch (err: any) {
      setActionMessage({ text: `Ingestion failed: ${err.message}`, isError: true });
    } finally {
      setIngesting(false);
    }
  };

  const handleRegenerate = async () => {
    try {
      setRegenerating(true);
      setActionMessage(null);
      const res = await aviationApi.regenerateData();
      if (res.quality_report) setQualityReport(res.quality_report);
      setActionMessage({ text: `Dataset re-synthesized & verified: ${res.records} benchmark flights active.` });
      await fetchStatus();
    } catch (err: any) {
      setActionMessage({ text: `Regeneration error: ${err.message}`, isError: true });
    } finally {
      setRegenerating(false);
    }
  };

  if (loading || !data) {
    return <LoadingSpinner message="Inspecting flight dataset schema, quality metrics & storage foot-print..." />;
  }

  const { data_health, ingestion_status, columns } = data;
  const activeReport = uploadReport || qualityReport;

  return (
    <div className="space-y-6">
      <DemoDataBanner sectionTitle="Data Ingestion Pipeline & Quality Assurance" />

      {/* Dataset Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-[#0f172a]/90 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="uppercase font-semibold tracking-wider">Active Flight Records</span>
            <Database className="h-4 w-4 text-sky-400" />
          </div>
          <span className="text-3xl font-extrabold font-mono text-white mt-3 block">
            {data.total_records.toLocaleString()}
          </span>
          <p className="text-xs text-slate-400 mt-1">Verified pre-departure samples</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#0f172a]/90 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="uppercase font-semibold tracking-wider">Schema Feature Count</span>
            <Layers className="h-4 w-4 text-sky-400" />
          </div>
          <span className="text-3xl font-extrabold font-mono text-white mt-3 block">
            {data.total_columns}
          </span>
          <p className="text-xs text-slate-400 mt-1">Zero target leakage</p>
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
            <span className="uppercase font-semibold tracking-wider">Data Quality Score</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <span className="text-3xl font-extrabold font-mono text-emerald-400 mt-3 block">
            {activeReport ? `${activeReport.acceptance_rate_pct}%` : '100%'}
          </span>
          <p className="text-xs text-slate-400 mt-1">Valid records / total input</p>
        </div>
      </div>

      {/* Row 2: CSV Upload & Data Quality Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upload Card (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-[#1a2947] bg-[#0f172a]/90 p-5 backdrop-blur-sm space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Upload className="h-4 w-4 text-sky-400" /> Upload Historical Flight Dataset (CSV)
            </h3>
            <p className="text-xs text-slate-400">
              Supply official BTS TranStats or Kaggle historical flight records
            </p>
          </div>

          <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/60 p-6 text-center hover:border-sky-500 transition-colors">
            <input
              type="file"
              accept=".csv"
              id="csv-file-input"
              onChange={handleFileUpload}
              disabled={uploading || ingesting}
              className="hidden"
            />
            <label htmlFor="csv-file-input" className="cursor-pointer block">
              <Upload className="h-8 w-8 text-sky-400 mx-auto mb-2" />
              <span className="text-xs font-bold text-white block">
                {uploading ? 'Validating CSV...' : 'Click to select CSV flight dataset'}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Supports standard BTS headers (FL_DATE, OP_CARRIER, ORIGIN, DEST, CRS_DEP_TIME, ARR_DELAY)
              </span>
            </label>
          </div>

          {uploadedFileName && uploadReport && (
            <div className="rounded-xl border border-sky-500/30 bg-sky-950/20 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white truncate">{uploadedFileName}</span>
                <span className="text-emerald-400 font-mono font-bold">{uploadReport.valid_records} valid rows</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Ready to ingest into platform memory and retrain predictive models.
              </p>
              <button
                onClick={handleIngestUploaded}
                disabled={ingesting}
                className="w-full mt-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs py-2 shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <FileCheck className="h-4 w-4" />
                <span>{ingesting ? 'Ingesting Dataset...' : 'Ingest & Activate Dataset'}</span>
              </button>
            </div>
          )}

          {actionMessage && (
            <div className={`rounded-xl p-3 text-xs border ${actionMessage.isError ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'}`}>
              {actionMessage.text}
            </div>
          )}

          {/* Dataset Attribution Link */}
          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Source: U.S. DOT BTS TranStats</span>
            <a
              href="https://www.transtats.bts.gov/DL_SelectFields.aspx?gnoyr_VQ=FGJ"
              target="_blank"
              rel="noreferrer"
              className="text-sky-400 hover:text-sky-300 inline-flex items-center gap-1 font-mono"
            >
              BTS Portal <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Data Quality Report Summary (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-[#1a2947] bg-[#0f172a]/90 p-5 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" /> Data Quality & Validation Summary
              </h3>
              <p className="text-xs text-slate-400">
                Verification metrics generated by <code className="text-sky-300 font-mono">FlightDataIngestionPipeline</code>
              </p>
            </div>
            {activeReport && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                Threshold: &ge;{activeReport.delay_threshold_minutes}m lateness
              </span>
            )}
          </div>

          {activeReport ? (
            <div className="space-y-4 text-xs">
              {/* Top row stats */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Input Records</span>
                  <span className="text-xl font-bold font-mono text-white mt-1 block">
                    {activeReport.total_input_records.toLocaleString()}
                  </span>
                </div>
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
                  <span className="text-[10px] text-emerald-400 uppercase tracking-wider block">Valid Records</span>
                  <span className="text-xl font-bold font-mono text-white mt-1 block">
                    {activeReport.valid_records.toLocaleString()}
                  </span>
                </div>
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
                  <span className="text-[10px] text-amber-400 uppercase tracking-wider block">Rejected Records</span>
                  <span className="text-xl font-bold font-mono text-white mt-1 block">
                    {activeReport.rejected_records.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Rejection Reasons Breakdown */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                <span className="font-semibold text-slate-300 block mb-2">Rejection & Error Breakdown:</span>
                <div className="space-y-1.5 font-mono text-[11px]">
                  {Object.entries(activeReport.rejection_breakdown).map(([reason, count]) => (
                    <div key={reason} className="flex items-center justify-between py-1 border-b border-slate-800/40">
                      <span className="text-slate-400 capitalize">{reason.replace(/_/g, ' ')}</span>
                      <span className={count > 0 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                        {count} rows
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Class distribution */}
              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <span>
                  On-Time: <strong className="text-emerald-400 font-mono">{activeReport.class_distribution.on_time_count}</strong>
                </span>
                <span>
                  Delayed: <strong className="text-rose-400 font-mono">{activeReport.class_distribution.delayed_count}</strong>
                </span>
                <span>
                  Delay Rate: <strong className="text-white font-mono">{activeReport.class_distribution.delay_rate_pct}%</strong>
                </span>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">
              Upload a dataset or click regenerate to compute quality audit metrics.
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 disabled:opacity-50 transition-all shadow-sm"
            >
              <RefreshCw className={`h-4 w-4 ${regenerating ? 'animate-spin text-sky-400' : 'text-slate-400'}`} />
              <span>{regenerating ? 'Synthesizing Records...' : 'Regenerate & Clean Benchmark Dataset'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Complete Schema Inspector Table */}
      <div className="rounded-2xl border border-[#1a2947] bg-[#0f172a]/90 backdrop-blur-sm overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="h-4 w-4 text-sky-400" /> FAA / BTS Aviation Dataset Schema Inspector
            </h3>
            <p className="text-xs text-slate-400">Complete list of all {columns.length} typed fields and sample data entries</p>
          </div>
          <span className="text-xs font-mono text-sky-400">Validated Pre-Departure Columns</span>
        </div>

        <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
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
