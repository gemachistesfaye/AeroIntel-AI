import React, { useState, useEffect } from 'react';
import {
  BarChart4,
  Cpu,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  TrendingUp,
  Activity,
  Layers,
  Clock
} from 'lucide-react';
import { ModelEvaluationData } from '../../types/aviation';
import { aviationApi } from '../../services/api';
import { DemoDataBanner } from '../Common/DemoDataBanner';
import { LoadingSpinner } from '../Common/LoadingSpinner';

export const ModelEvaluationView: React.FC = () => {
  const [data, setData] = useState<ModelEvaluationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
  const [retrainMessage, setRetrainMessage] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await aviationApi.getModelEvaluation();
      setData(res);
    } catch (err) {
      console.error('Failed to load model evaluation metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleRetrain = async () => {
    try {
      setRetraining(true);
      setRetrainMessage(null);
      const res = await aviationApi.retrainModel();
      setData(res.data);
      setRetrainMessage('Model retrained and evaluated successfully with Scikit-Learn.');
    } catch (err: any) {
      setRetrainMessage(`Retraining failed: ${err.message}`);
    } finally {
      setRetraining(false);
    }
  };

  if (loading || !data) {
    return <LoadingSpinner message="Loading Scikit-Learn evaluation telemetry & confusion matrix..." />;
  }

  const { classification, regression, feature_importances, implementation_status } = data;
  const cm = classification.confusion_matrix;

  return (
    <div className="space-y-6">
      <DemoDataBanner sectionTitle="Machine Learning Model Evaluation & Transparency" />

      {/* Honest Implementation Status Banner */}
      <div className="rounded-2xl border border-sky-500/30 bg-sky-950/20 p-5 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-sky-500/20 p-2.5 text-sky-400 border border-sky-500/40">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Honest Implementation Status: Baseline Scikit-Learn</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {implementation_status.status}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                {implementation_status.notes}
              </p>
            </div>
          </div>

          <button
            onClick={handleRetrain}
            disabled={retraining}
            className="flex items-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-all disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${retraining ? 'animate-spin text-sky-400' : 'text-slate-400'}`} />
            <span>{retraining ? 'Fitting Pipelines...' : 'Retrain Baseline Model'}</span>
          </button>
        </div>

        {retrainMessage && (
          <div className="mt-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 text-xs text-emerald-300">
            {retrainMessage}
          </div>
        )}
      </div>

      {/* Top Classification Metrics Scorecards */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <Activity className="h-4 w-4 text-sky-400" /> Delay Classification Scorecards (Test Split = 250 Flights)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="rounded-xl border border-slate-800 bg-[#0f172a]/90 p-4 text-center">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Accuracy</span>
            <span className="text-2xl font-bold font-mono text-white mt-1 block">
              {(classification.accuracy * 100).toFixed(1)}%
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Overall Correctness</span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0f172a]/90 p-4 text-center">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Precision</span>
            <span className="text-2xl font-bold font-mono text-sky-400 mt-1 block">
              {(classification.precision * 100).toFixed(1)}%
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">True Delay Alerts</span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0f172a]/90 p-4 text-center">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Recall</span>
            <span className="text-2xl font-bold font-mono text-amber-400 mt-1 block">
              {(classification.recall * 100).toFixed(1)}%
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Delays Detected</span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0f172a]/90 p-4 text-center">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">F1 Score</span>
            <span className="text-2xl font-bold font-mono text-purple-400 mt-1 block">
              {classification.f1_score.toFixed(3)}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Harmonic Mean</span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0f172a]/90 p-4 text-center">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">ROC-AUC</span>
            <span className="text-2xl font-bold font-mono text-emerald-400 mt-1 block">
              {classification.roc_auc.toFixed(3)}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Discrimination Power</span>
          </div>
        </div>
      </div>

      {/* Regression & Duration Metrics */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4 text-sky-400" /> Delay Duration Regressor (Minutes Error)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-800 bg-[#0f172a]/90 p-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Mean Absolute Error (MAE)</span>
              <span className="text-xs font-mono text-sky-400 font-bold">Standard</span>
            </div>
            <span className="text-2xl font-bold font-mono text-white mt-1 block">
              &plusmn;{regression.mae_minutes} min
            </span>
            <p className="text-[10px] text-slate-400 mt-1">Average discrepancy in predicted late arrival</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0f172a]/90 p-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Root Mean Squared (RMSE)</span>
              <span className="text-xs font-mono text-slate-400">Outlier Penalty</span>
            </div>
            <span className="text-2xl font-bold font-mono text-white mt-1 block">
              {regression.rmse_minutes} min
            </span>
            <p className="text-[10px] text-slate-400 mt-1">Sensitivity to extreme storm ground stop delays</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0f172a]/90 p-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">R-Squared (R&sup2;)</span>
              <span className="text-xs font-mono text-slate-400">Variance Explained</span>
            </div>
            <span className="text-2xl font-bold font-mono text-white mt-1 block">
              {regression.r2_score.toFixed(3)}
            </span>
            <p className="text-[10px] text-slate-400 mt-1">Proportion of variance captured by features</p>
          </div>
        </div>
      </div>

      {/* Row: Confusion Matrix + ROC Curve */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Confusion Matrix (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-[#1a2947] bg-[#0f172a]/90 p-5 backdrop-blur-sm">
          <div className="border-b border-slate-800 pb-3 mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-sky-400" /> Confusion Matrix (Test Split)
            </h3>
            <p className="text-xs text-slate-400">Ground Truth vs Baseline Classifier Predictions</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center text-xs">
            {/* True Negative */}
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
              <span className="text-[10px] uppercase text-emerald-400 font-bold block">True Negative (TN)</span>
              <span className="text-2xl font-extrabold font-mono text-white mt-1 block">{cm.true_negative}</span>
              <p className="text-[10px] text-emerald-300 mt-1">Correctly identified on-time</p>
            </div>

            {/* False Positive */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
              <span className="text-[10px] uppercase text-amber-400 font-bold block">False Positive (FP)</span>
              <span className="text-2xl font-extrabold font-mono text-white mt-1 block">{cm.false_positive}</span>
              <p className="text-[10px] text-amber-300 mt-1">False delay alarm</p>
            </div>

            {/* False Negative */}
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3">
              <span className="text-[10px] uppercase text-rose-400 font-bold block">False Negative (FN)</span>
              <span className="text-2xl font-extrabold font-mono text-white mt-1 block">{cm.false_negative}</span>
              <p className="text-[10px] text-rose-300 mt-1">Missed actual delay</p>
            </div>

            {/* True Positive */}
            <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-3">
              <span className="text-[10px] uppercase text-sky-400 font-bold block">True Positive (TP)</span>
              <span className="text-2xl font-extrabold font-mono text-white mt-1 block">{cm.true_positive}</span>
              <p className="text-[10px] text-sky-300 mt-1">Correctly flagged delay</p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Total Test Samples: {data.test_samples}</span>
            <span>Balanced Class Weights Applied</span>
          </div>
        </div>

        {/* ROC Curve Chart (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-[#1a2947] bg-[#0f172a]/90 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-sky-400" /> Receiver Operating Characteristic (ROC)
              </h3>
              <p className="text-xs text-slate-400">True Positive Rate vs False Positive Rate</p>
            </div>
            <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/30">
              AUC = {classification.roc_auc.toFixed(3)}
            </span>
          </div>

          {/* SVG ROC Plot */}
          <div className="relative h-56 w-full flex items-center justify-center">
            <svg viewBox="0 0 400 220" className="w-full h-full overflow-visible">
              {/* Grid Lines */}
              <line x1="40" y1="20" x2="380" y2="20" stroke="#1e293b" strokeDasharray="3 3" />
              <line x1="40" y1="70" x2="380" y2="70" stroke="#1e293b" strokeDasharray="3 3" />
              <line x1="40" y1="120" x2="380" y2="120" stroke="#1e293b" strokeDasharray="3 3" />
              <line x1="40" y1="170" x2="380" y2="170" stroke="#1e293b" strokeDasharray="3 3" />

              <line x1="40" y1="20" x2="40" y2="170" stroke="#334155" />
              <line x1="380" y1="20" x2="380" y2="170" stroke="#1e293b" strokeDasharray="3 3" />
              <line x1="40" y1="170" x2="380" y2="170" stroke="#334155" />

              {/* Diagonal No-Skill Reference (40,170) to (380,20) */}
              <line x1="40" y1="170" x2="380" y2="20" stroke="#475569" strokeDasharray="4 4" strokeWidth="1.5" />

              {/* ROC Curve Polyline */}
              {classification.roc_curve && classification.roc_curve.length > 1 && (
                <polyline
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                  points={classification.roc_curve
                    .map((pt) => {
                      const x = 40 + pt.fpr * (380 - 40);
                      const y = 170 - pt.tpr * (170 - 20);
                      return `${x},${y}`;
                    })
                    .join(' ')}
                />
              )}

              {/* Axis Labels */}
              <text x="210" y="200" fill="#94a3b8" fontSize="10" textAnchor="middle" fontFamily="sans-serif">
                False Positive Rate (1 - Specificity)
              </text>
              <text x="15" y="95" fill="#94a3b8" fontSize="10" textAnchor="middle" transform="rotate(-90 15 95)" fontFamily="sans-serif">
                True Positive Rate (Sensitivity)
              </text>
            </svg>
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 bg-sky-400 inline-block" /> Trained Model Baseline
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 bg-slate-500 border-dashed inline-block" /> Random Classifier (AUC=0.50)
            </span>
          </div>
        </div>
      </div>

      {/* Feature Importances Breakdown */}
      <div className="rounded-2xl border border-[#1a2947] bg-[#0f172a]/90 p-5 backdrop-blur-sm">
        <div className="border-b border-slate-800 pb-3 mb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <BarChart4 className="h-4 w-4 text-sky-400" /> Relative Feature Importances (Random Forest Gini Impurity)
          </h3>
          <p className="text-xs text-slate-400">
            How heavily each category influenced the tree splits in our baseline delay model
          </p>
        </div>

        <div className="space-y-3">
          {feature_importances.map((item) => {
            const pct = Math.round(item.importance * 100);
            return (
              <div key={item.feature} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">{item.feature}</span>
                  <span className="font-mono text-sky-400 font-bold">{pct}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-500 to-blue-600 transition-all duration-500"
                    style={{ width: `${Math.max(pct, 4)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
