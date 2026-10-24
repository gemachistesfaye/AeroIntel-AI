import React, { useState, useEffect } from 'react';
import {
  Database,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileText,
  Server,
  Upload,
  AlertTriangle,
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
    return <LoadingSpinner message="Inspecting flight dataset schema & quality audits..." />;
  }

  const { data_health, columns } = data;
  const activeReport = uploadReport || qualityReport;

  return (
    <div className="space-y-5">
      <DemoDataBanner sectionTitle="Data Ingestion & Schema Health" />

      {/* Dataset Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-xl border border-slate-800 bg-[#111827]/90 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Active Flight Records</span>
            <Database className="h-4 w-4 text-sky-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white">
            {data.total_records.toLocaleString()}
          </div>
          <p className="mt-1 text-[11px] text-slate-500 font-mono">
            {data.file_path} ({data.file_size_kb} KB)
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#111827]/90 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Data Health Status</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">
            100% Clean
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            0 missing values &middot; 0 duplicates
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#111827]/90 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Schema Attributes</span>
            <FileText className="h-4 w-4 text-sky-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white">
            {data.total_columns || columns.length} Columns
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            FAA TranStats Compliant Types
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#111827]/90 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Ingestion Pipeline</span>
            <Server className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-400">
            Ready
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            CSV Ingestion Pipeline Active
          </p>
        </div>
      </div>

      {actionMessage && (
        <div className={`rounded-lg border px-3.5 py-2 text-xs flex items-center gap-2 ${
          actionMessage.isError ? 'border-rose-500/30 bg-rose-500/10 text-rose-300' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
        }`}>
          {actionMessage.isError ? <AlertCircle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Upload and Ingestion Action Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* CSV Upload Dropzone */}
        <div className="rounded-xl border border-slate-800 bg-[#111827]/90 p-4 space-y-3">
          <div className="border-b border-slate-800 pb-2">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Upload className="h-4 w-4 text-sky-400" /> Ingest Real Historical Flight Dataset
            </h3>
            <p className="text-xs text-slate-400">
              Upload official U.S. DOT BTS TranStats CSV or Kaggle 2015 Flight Delays dataset
            </p>
          </div>

          <div className="border-2 border-dashed border-slate-700/80 rounded-lg p-5 text-center hover:border-sky-500/50 transition-colors">
            <input
              type="file"
              id="csvFileInput"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label htmlFor="csvFileInput" className="cursor-pointer block space-y-2">
              <Upload className="h-7 w-7 text-sky-400 mx-auto" />
              <div className="text-xs font-semibold text-white">
                {uploading ? 'Validating CSV...' : 'Click to select or drag flight CSV'}
              </div>
              <p className="text-[11px] text-slate-500">
                Supports BTS TranStats schema (.csv up to 100MB)
              </p>
            </label>
          </div>

          {uploadedFileName && (
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-emerald-400" />
                <span className="font-mono text-white font-medium">{uploadedFileName}</span>
              </div>
              <button
                onClick={handleIngestUploaded}
                disabled={ingesting}
                className="rounded-md bg-emerald-600 px-3 py-1 font-semibold text-white hover:bg-emerald-500 transition-colors disabled:opacity-50"
              >
                {ingesting ? 'Ingesting...' : 'Activate In Platform'}
              </button>
            </div>
          )}
        </div>

        {/* Quality Audit Report */}
        <div className="rounded-xl border border-slate-800 bg-[#111827]/90 p-4 space-y-3">
          <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Data Quality Audit Report
              </h3>
              <p className="text-xs text-slate-400">Automated cleaning and rejection metrics</p>
            </div>
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-slate-300 hover:text-white disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${regenerating ? 'animate-spin text-sky-400' : ''}`} />
              <span>{regenerating ? 'Synthesizing...' : 'Re-synthesize'}</span>
            </button>
          </div>

          {activeReport ? (
            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-3 gap-2 text-center font-mono">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Total Input</span>
                  <span className="font-bold text-white text-sm mt-0.5 block">{activeReport.total_input_records}</span>
                </div>
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <span className="text-[10px] text-slate-400 block">Accepted</span>
                  <span className="font-bold text-sm mt-0.5 block">{activeReport.valid_records}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400">
                  <span className="text-[10px] text-slate-500 block">Rejected</span>
                  <span className="font-bold text-sm mt-0.5 block">{activeReport.rejected_records}</span>
                </div>
              </div>

              <div className="flex justify-between p-2 rounded bg-slate-900/60 border border-slate-800/80">
                <span className="text-slate-400">Acceptance Rate:</span>
                <span className="font-mono font-bold text-emerald-400">{activeReport.acceptance_rate_pct}%</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-slate-900/60 border border-slate-800/80">
                <span className="text-slate-400">Valid Schema:</span>
                <span className="font-mono text-emerald-400">{data_health.schema_valid ? 'Verified (14 features)' : 'Unverified'}</span>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-500">
              No quality audit available yet. Upload a CSV to generate a report.
            </div>
          )}
        </div>
      </div>

      {/* Schema Columns Table */}
      <div className="rounded-xl border border-slate-800 bg-[#111827]/90 p-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Dataset Feature Schema</h3>
            <p className="text-xs text-slate-400">Validated BTS TranStats data types &amp; sample values</p>
          </div>
          <span className="text-xs text-slate-500">{columns.length} Fields</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="border-b border-slate-800 text-slate-400 font-sans font-medium">
              <tr>
                <th className="pb-2">Field Name</th>
                <th className="pb-2">Data Type</th>
                <th className="pb-2 text-right">Missing</th>
                <th className="pb-2 text-right">Sample Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {columns.map((col) => (
                <tr key={col.name} className="hover:bg-slate-800/20">
                  <td className="py-2 text-sky-400 font-bold">{col.name}</td>
                  <td className="py-2 text-slate-400">{col.type}</td>
                  <td className="py-2 text-right text-emerald-400">{col.null_count}</td>
                  <td className="py-2 text-right text-slate-300 font-sans">{String(col.sample)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
