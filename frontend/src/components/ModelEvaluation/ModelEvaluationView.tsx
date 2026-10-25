import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  RefreshCw,
  ShieldCheck,
  Scale,
  Calendar,
  Layers
} from 'lucide-react';
import { ModelComparisonData } from '../../types/aviation';
import { aviationApi } from '../../services/api';
import { LoadingSpinner } from '../Common/LoadingSpinner';

export const ModelEvaluationView: React.FC = () => {
  const [data, setData] = useState<ModelComparisonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
  const [thresholdInput, setThresholdInput] = useState<number>(15);
  const [taskInput, setTaskInput] = useState<string>('arrival_delay_classification');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchComparison = async () => {
    try {
      setLoading(true);
      const res = await aviationApi.getModelComparison();
      setData(res);
      if (res.delay_threshold_minutes) {
        setThresholdInput(res.delay_threshold_minutes);
      }
      if (res.task) {
        setTaskInput(res.task);
      }
    } catch (err: any) {
      setActionMessage(`Failed to load comparative model metrics: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComparison();
  }, []);

  const handleRetrain = async () => {
    try {
      setRetraining(true);
      setActionMessage(null);
      const res = await aviationApi.retrainModel(thresholdInput, taskInput);
      setData(res.data);
      setActionMessage(`Evaluated models on ${res.data.test_samples} held-out flights for ${taskInput} at ${thresholdInput}m threshold!`);
    } catch (err: any) {
      setActionMessage(`Evaluation failed: ${err.message}`);
    } finally {
      setRetraining(false);
    }
  };

  if (loading || !data) {
    return <LoadingSpinner message="Calculating model performance metrics..." />;
  }

  const { baseline_model, candidate_model, feature_importances } = data;
  const isSelectedBaseline = data.selected_model_key === 'baseline';

  return (
    <div className="space-y-6">
      {/* Top Bar: Task & Threshold Selectors & Retrain Action */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 p-4 rounded-xl border border-slate-800 bg-[#111827]">
        <div className="flex items-center gap-2.5">
          <Scale className="h-4 w-4 text-slate-400" />
          <div>
            <h3 className="text-sm font-semibold text-white">Comparative Model Evaluation</h3>
            <p className="text-xs text-slate-400">
              {data.split_method || 'Chronological Holdout Split'} &middot; Pre-departure features only
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white font-mono focus:border-slate-500 focus:outline-none"
          >
            <option value="arrival_delay_classification">Arrival Delay (ArrDel15)</option>
            <option value="departure_delay_classification">Departure Delay (DepDel15)</option>
          </select>

          <select
            value={thresholdInput}
            onChange={(e) => setThresholdInput(parseInt(e.target.value))}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white font-mono focus:border-slate-500 focus:outline-none"
          >
            <option value={15}>15 Min Delay Threshold</option>
            <option value={30}>30 Min Delay Threshold</option>
            <option value={45}>45 Min Delay Threshold</option>
          </select>

          <button
            onClick={handleRetrain}
            disabled={retraining}
            className="flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium px-3.5 py-1.5 text-xs border border-slate-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${retraining ? 'animate-spin' : ''}`} />
            <span>{retraining ? 'Evaluating...' : 'Re-Evaluate'}</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="rounded-lg bg-slate-900 border border-slate-800 px-3.5 py-2 text-xs text-slate-300">
          {actionMessage}
        </div>
      )}

      {/* Dataset Provenance & Split Metadata */}
      <div className="p-4 rounded-xl border border-slate-800 bg-[#111827] space-y-2 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-sky-400" />
            <span className="font-semibold text-white">Dataset Identity:</span>
            <span className="font-mono text-sky-300 px-2 py-0.5 rounded bg-sky-950/60 border border-sky-800/40">
              {data.dataset_source}
            </span>
          </div>
          <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-slate-500" />
              {data.date_range?.min_date} &rarr; {data.date_range?.max_date}
            </span>
            <span className="flex items-center gap-1">
              <Layers className="h-3.5 w-3.5 text-slate-500" />
              Train: {data.train_samples} | Test: {data.test_samples}
            </span>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800 text-slate-400">
          <span className="text-white font-medium">Empirical Selection: </span>
          <span className="text-slate-300 font-medium">{data.selected_model_name}</span> &mdash; {data.selection_rationale}
        </div>
      </div>

      {/* Side-by-Side Model Scorecards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Baseline Model: Logistic Regression */}
        <div className={`rounded-xl border ${isSelectedBaseline ? 'border-sky-500/50 bg-[#111827]' : 'border-slate-800 bg-[#111827]'} p-5 space-y-4`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              {isSelectedBaseline && (
                <span className="text-[10px] font-mono text-sky-400 font-bold block uppercase">&starf; Selected Operational Model</span>
              )}
              <h3 className="text-sm font-bold text-white">{baseline_model.model_name}</h3>
              <p className="text-xs text-slate-400">{baseline_model.algorithm}</p>
            </div>
            <span className={`text-xs font-mono px-2 py-0.5 rounded ${isSelectedBaseline ? 'bg-sky-900/40 text-sky-300 border border-sky-800/60' : 'bg-slate-800 text-slate-400'}`}>
              {isSelectedBaseline ? 'Selected' : 'Baseline'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5 text-center text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-400 text-[10px] block font-sans">Accuracy</span>
              <span className="text-lg font-bold text-white mt-1 block">{(baseline_model.accuracy * 100).toFixed(1)}%</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-400 text-[10px] block font-sans">ROC-AUC</span>
              <span className="text-lg font-bold text-white mt-1 block">{baseline_model.roc_auc.toFixed(3)}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-400 text-[10px] block font-sans">Recall (Delays)</span>
              <span className="text-lg font-bold text-white mt-1 block">{(baseline_model.recall > 1 ? baseline_model.recall : baseline_model.recall * 100).toFixed(1)}%</span>
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-300 block mb-2">
              Confusion Matrix (Held-out {data.test_samples} Flights)
            </span>
            <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                <span className="text-white font-bold text-base block">{baseline_model.confusion_matrix.true_negative}</span>
                <span className="text-[10px] text-slate-500 font-sans">On-Time Correct (TN)</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                <span className="text-white font-bold text-base block">{baseline_model.confusion_matrix.false_positive}</span>
                <span className="text-[10px] text-slate-500 font-sans">False Alarms (FP)</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                <span className="text-white font-bold text-base block">{baseline_model.confusion_matrix.false_negative}</span>
                <span className="text-[10px] text-slate-500 font-sans">Missed Delays (FN)</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                <span className="text-white font-bold text-base block">{baseline_model.confusion_matrix.true_positive}</span>
                <span className="text-[10px] text-slate-500 font-sans">Delays Caught (TP)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Candidate Model: HistGradientBoosting */}
        <div className={`rounded-xl border ${!isSelectedBaseline ? 'border-sky-500/50 bg-[#111827]' : 'border-slate-800 bg-[#111827]'} p-5 space-y-4`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              {!isSelectedBaseline && (
                <span className="text-[10px] font-mono text-sky-400 font-bold block uppercase">&starf; Selected Operational Model</span>
              )}
              <h3 className="text-sm font-bold text-white">{candidate_model.model_name}</h3>
              <p className="text-xs text-slate-400">{candidate_model.algorithm}</p>
            </div>
            <span className={`text-xs font-mono px-2 py-0.5 rounded ${!isSelectedBaseline ? 'bg-sky-900/40 text-sky-300 border border-sky-800/60' : 'bg-slate-800 text-slate-400'}`}>
              {!isSelectedBaseline ? 'Selected' : 'Candidate'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5 text-center text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-400 text-[10px] block font-sans">Accuracy</span>
              <span className="text-lg font-bold text-white mt-1 block">{(candidate_model.accuracy * 100).toFixed(1)}%</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-400 text-[10px] block font-sans">ROC-AUC</span>
              <span className="text-lg font-bold text-white mt-1 block">{candidate_model.roc_auc.toFixed(3)}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-400 text-[10px] block font-sans">Recall (Delays)</span>
              <span className="text-lg font-bold text-white mt-1 block">{(candidate_model.recall > 1 ? candidate_model.recall : candidate_model.recall * 100).toFixed(1)}%</span>
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-300 block mb-2">
              Confusion Matrix (Held-out {data.test_samples} Flights)
            </span>
            <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                <span className="text-white font-bold text-base block">{candidate_model.confusion_matrix.true_negative}</span>
                <span className="text-[10px] text-slate-500 font-sans">On-Time Correct (TN)</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                <span className="text-white font-bold text-base block">{candidate_model.confusion_matrix.false_positive}</span>
                <span className="text-[10px] text-slate-500 font-sans">False Alarms (FP)</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                <span className="text-white font-bold text-base block">{candidate_model.confusion_matrix.false_negative}</span>
                <span className="text-[10px] text-slate-500 font-sans">Missed Delays (FN)</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                <span className="text-white font-bold text-base block">{candidate_model.confusion_matrix.true_positive}</span>
                <span className="text-[10px] text-slate-500 font-sans">Delays Caught (TP)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Importances */}
      <div className="rounded-xl border border-slate-800 bg-[#111827] p-5">
        <div className="pb-3 border-b border-slate-800 mb-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-slate-400" /> Permutation Feature Importances
          </h3>
          <p className="text-xs text-slate-400">Relative impact of pre-departure variables on delay risk</p>
        </div>

        <div className="space-y-2.5">
          {feature_importances.map((item) => (
            <div key={item.feature} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-mono">{item.feature}</span>
                <span className="font-mono text-slate-300 font-semibold">{item.percentage ? `${item.percentage}%` : item.importance.toFixed(3)}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-slate-500"
                  style={{ width: `${Math.min(100, item.percentage || (item.importance / 0.1) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
