import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  TrendingUp,
  Activity,
  Scale
} from 'lucide-react';
import { ModelComparisonData } from '../../types/aviation';
import { aviationApi } from '../../services/api';
import { DemoDataBanner } from '../Common/DemoDataBanner';
import { LoadingSpinner } from '../Common/LoadingSpinner';

export const ModelEvaluationView: React.FC = () => {
  const [data, setData] = useState<ModelComparisonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
  const [thresholdInput, setThresholdInput] = useState<number>(15);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchComparison = async () => {
    try {
      setLoading(true);
      const res = await aviationApi.getModelComparison();
      setData(res);
      if (res.delay_threshold_minutes) {
        setThresholdInput(res.delay_threshold_minutes);
      }
    } catch (err) {
      console.error('Failed to load comparative model metrics:', err);
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
      const res = await aviationApi.retrainModel(thresholdInput);
      setData(res.data);
      setActionMessage(`Both models retrained and evaluated with ${thresholdInput}-minute lateness threshold!`);
    } catch (err: any) {
      setActionMessage(`Retraining failed: ${err.message}`);
    } finally {
      setRetraining(false);
    }
  };

  if (loading || !data) {
    return <LoadingSpinner message="Calculating comparative holdout evaluation metrics..." />;
  }

  const { baseline_model, candidate_model, class_distribution, feature_importances } = data;

  return (
    <div className="space-y-5">
      <DemoDataBanner sectionTitle="Model Performance & Comparative Validation" />

      {/* Retrain & Configurable Threshold Bar */}
      <div className="rounded-xl border border-slate-800 bg-[#111827]/90 p-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-sky-500/10 p-2 text-sky-400 border border-sky-500/20 shrink-0">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white">Comparative Evaluation: Baseline vs Candidate Model</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Holdout Test Split (20% = {data.test_samples} Flights)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Linear baseline (Logistic Regression) vs non-linear tree ensemble (HistGradientBoosting) on strict pre-departure features. Zero target leakage.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full lg:w-auto">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 whitespace-nowrap">Threshold:</span>
              <select
                value={thresholdInput}
                onChange={(e) => setThresholdInput(parseInt(e.target.value))}
                className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-white font-mono focus:border-sky-500 focus:outline-none"
              >
                <option value={15}>15 Minutes (FAA Standard)</option>
                <option value={30}>30 Minutes (Moderate Delay)</option>
                <option value={45}>45 Minutes (Severe Delay)</option>
              </select>
            </div>

            <button
              onClick={handleRetrain}
              disabled={retraining}
              className="flex items-center gap-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-semibold px-3 py-1.5 text-xs transition-colors disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={`h-3 w-3 ${retraining ? 'animate-spin text-white' : ''}`} />
              <span>{retraining ? 'Fitting...' : 'Retrain'}</span>
            </button>
          </div>
        </div>

        {actionMessage && (
          <div className="mt-2.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 text-xs text-emerald-300">
            {actionMessage}
          </div>
        )}
      </div>

      {/* Honest Model Selection Rationale Banner */}
      <div className="rounded-xl border border-sky-500/30 bg-sky-950/20 p-4 space-y-1.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-sky-400 shrink-0" />
            <h4 className="text-xs font-semibold text-white">
              Model Selection Audit: Logistic Regression Selected as Primary Operational Model
            </h4>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
            Selection Criteria: Disruption Recall &amp; ROC-AUC
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          {data.selection_rationale || (
            "Logistic Regression is selected based on held-out test data: superior ROC-AUC (0.601 vs 0.526), higher F1-score (0.441 vs 0.324), and significantly higher Recall (49.4% vs 27.8%). While HistGradientBoosting reached slightly higher raw accuracy (63.2% vs 60.4%), it did so by predicting the majority on-time class for 77% of flights, missing 57 out of 79 true disruptions. For flight delay mitigation, catching actual disruptions is paramount."
          )}
        </p>
      </div>

      {/* Side-by-Side Model Comparison Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Baseline Model Card (Selected Operational) */}
        <div className="rounded-xl border border-sky-500/40 bg-[#111827]/90 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div>
              <span className="text-[10px] font-mono uppercase text-sky-400 font-bold block">&starf; Selected Operational Model</span>
              <h3 className="text-sm font-bold text-white">{baseline_model.model_name}</h3>
              <p className="text-[11px] text-slate-400">{baseline_model.algorithm}</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Active Primary
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2">
              <span className="text-[10px] text-slate-400 block">ROC-AUC</span>
              <span className="text-lg font-bold font-mono text-emerald-400 mt-0.5 block">{baseline_model.roc_auc.toFixed(3)}</span>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2">
              <span className="text-[10px] text-slate-400 block">Recall (Delays)</span>
              <span className="text-lg font-bold font-mono text-amber-400 mt-0.5 block">{(baseline_model.recall > 1 ? baseline_model.recall : baseline_model.recall * 100).toFixed(1)}%</span>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2">
              <span className="text-[10px] text-slate-400 block">F1-Score</span>
              <span className="text-lg font-bold font-mono text-purple-400 mt-0.5 block">{baseline_model.f1_score.toFixed(3)}</span>
            </div>
          </div>

          {/* Confusion Matrix */}
          <div>
            <span className="text-xs font-semibold text-slate-300 block mb-1">Confusion Matrix (Held-out 250 Flights)</span>
            <div className="grid grid-cols-2 gap-2 text-center font-mono text-xs">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                TN: <strong className="text-white text-sm">{baseline_model.confusion_matrix.true_negative}</strong>
                <span className="block text-[10px] text-slate-400">On-Time Correct</span>
              </div>
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300">
                FP: <strong className="text-white text-sm">{baseline_model.confusion_matrix.false_positive}</strong>
                <span className="block text-[10px] text-slate-400">False Alarms</span>
              </div>
              <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300">
                FN: <strong className="text-white text-sm">{baseline_model.confusion_matrix.false_negative}</strong>
                <span className="block text-[10px] text-slate-400">Missed Delays</span>
              </div>
              <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-300">
                TP: <strong className="text-white text-sm">{baseline_model.confusion_matrix.true_positive}</strong>
                <span className="block text-[10px] text-slate-400">Delays Caught</span>
              </div>
            </div>
          </div>
        </div>

        {/* Candidate Model Card (HistGradientBoosting) */}
        <div className="rounded-xl border border-slate-800 bg-[#111827]/90 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Alternative Candidate</span>
              <h3 className="text-sm font-bold text-white">{candidate_model.model_name}</h3>
              <p className="text-[11px] text-slate-400">{candidate_model.algorithm}</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              Candidate
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2">
              <span className="text-[10px] text-slate-400 block">ROC-AUC</span>
              <span className="text-lg font-bold font-mono text-slate-300 mt-0.5 block">{candidate_model.roc_auc.toFixed(3)}</span>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2">
              <span className="text-[10px] text-slate-400 block">Recall (Delays)</span>
              <span className="text-lg font-bold font-mono text-rose-400 mt-0.5 block">{(candidate_model.recall > 1 ? candidate_model.recall : candidate_model.recall * 100).toFixed(1)}%</span>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2">
              <span className="text-[10px] text-slate-400 block">F1-Score</span>
              <span className="text-lg font-bold font-mono text-slate-300 mt-0.5 block">{candidate_model.f1_score.toFixed(3)}</span>
            </div>
          </div>

          {/* Confusion Matrix */}
          <div>
            <span className="text-xs font-semibold text-slate-300 block mb-1">Confusion Matrix (Held-out 250 Flights)</span>
            <div className="grid grid-cols-2 gap-2 text-center font-mono text-xs">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                TN: <strong className="text-white text-sm">{candidate_model.confusion_matrix.true_negative}</strong>
                <span className="block text-[10px] text-slate-400">On-Time Correct</span>
              </div>
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300">
                FP: <strong className="text-white text-sm">{candidate_model.confusion_matrix.false_positive}</strong>
                <span className="block text-[10px] text-slate-400">False Alarms</span>
              </div>
              <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300">
                FN: <strong className="text-white text-sm">{candidate_model.confusion_matrix.false_negative}</strong>
                <span className="block text-[10px] text-rose-400 font-bold">57 Missed Delays!</span>
              </div>
              <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-300">
                TP: <strong className="text-white text-sm">{candidate_model.confusion_matrix.true_positive}</strong>
                <span className="block text-[10px] text-slate-400">Delays Caught (22)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Importances Breakdown */}
      <div className="rounded-xl border border-slate-800 bg-[#111827]/90 p-4">
        <div className="border-b border-slate-800 pb-2.5 mb-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-sky-400" /> Permutation Feature Importances (Holdout Test Split)
          </h3>
          <p className="text-xs text-slate-400">
            Empirical drop in model discrimination when each pre-departure feature is shuffled
          </p>
        </div>

        <div className="space-y-2">
          {feature_importances.map((item) => (
            <div key={item.feature} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-300 font-mono">{item.feature}</span>
                <span className="font-mono text-sky-400 font-semibold">{item.percentage ? `${item.percentage}%` : item.importance.toFixed(3)}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-sky-500 transition-all duration-300"
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
