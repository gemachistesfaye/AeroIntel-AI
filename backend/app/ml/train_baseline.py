import json
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, roc_curve, precision_recall_curve,
    confusion_matrix, mean_absolute_error, mean_squared_error, r2_score
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

from app.core.config import settings
from app.ml.pipeline import engineer_features, build_preprocessor

def train_and_evaluate():
    print("=" * 60)
    print("AI Aviation Intelligence Platform - Baseline Model Training")
    print("=" * 60)
    
    data_path = settings.DATA_PATH
    if not data_path.exists():
        raise FileNotFoundError(f"Dataset not found at {data_path}. Run generate_dataset.py first.")
        
    df = pd.read_csv(data_path)
    print(f"Loaded dataset: {len(df)} rows from {data_path}")
    print(f"Dataset delay rate: {df['is_delayed'].mean():.2%}")
    
    df_feat = engineer_features(df)
    
    # Train test split
    train_df, test_df = train_test_split(
        df_feat, test_size=0.20, random_state=42, stratify=df_feat["is_delayed"]
    )
    print(f"Train split: {len(train_df)} rows | Test split: {len(test_df)} rows")
    
    # 1. Classification Model: Probability of Flight Delay (arr_delay >= 15 min)
    clf_preprocessor = build_preprocessor()
    clf_model = RandomForestClassifier(
        n_estimators=120,
        max_depth=9,
        min_samples_split=4,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1
    )
    
    clf_pipeline = Pipeline(steps=[
        ("preprocessor", clf_preprocessor),
        ("classifier", clf_model)
    ])
    
    y_train_clf = train_df["is_delayed"]
    y_test_clf = test_df["is_delayed"]
    
    print("\nFitting Delay Classification Pipeline (Random Forest)...")
    clf_pipeline.fit(train_df, y_train_clf)
    
    # Classification Predictions
    y_pred_clf = clf_pipeline.predict(test_df)
    y_prob_clf = clf_pipeline.predict_proba(test_df)[:, 1]
    
    # Classification Metrics
    acc = accuracy_score(y_test_clf, y_pred_clf)
    prec = precision_score(y_test_clf, y_pred_clf, zero_division=0)
    rec = recall_score(y_test_clf, y_pred_clf, zero_division=0)
    f1 = f1_score(y_test_clf, y_pred_clf, zero_division=0)
    roc_auc = roc_auc_score(y_test_clf, y_prob_clf)
    cm = confusion_matrix(y_test_clf, y_pred_clf).tolist() # [[TN, FP], [FN, TP]]
    
    # ROC curve points for frontend visual rendering (decimated to ~20 points)
    fpr, tpr, _ = roc_curve(y_test_clf, y_prob_clf)
    roc_indices = np.linspace(0, len(fpr) - 1, min(25, len(fpr))).astype(int)
    roc_points = [{"fpr": round(float(fpr[i]), 4), "tpr": round(float(tpr[i]), 4)} for i in roc_indices]
    if roc_points[-1]["fpr"] < 1.0:
        roc_points.append({"fpr": 1.0, "tpr": 1.0})
        
    # PR curve points
    pr_prec, pr_rec, _ = precision_recall_curve(y_test_clf, y_prob_clf)
    pr_indices = np.linspace(0, len(pr_rec) - 1, min(25, len(pr_rec))).astype(int)
    pr_points = [{"recall": round(float(pr_rec[i]), 4), "precision": round(float(pr_prec[i]), 4)} for i in pr_indices]
    
    # 2. Regression Model: Expected Delay Duration (Minutes)
    reg_preprocessor = build_preprocessor()
    reg_model = RandomForestRegressor(
        n_estimators=100,
        max_depth=8,
        min_samples_split=4,
        random_state=42,
        n_jobs=-1
    )
    
    reg_pipeline = Pipeline(steps=[
        ("preprocessor", reg_preprocessor),
        ("regressor", reg_model)
    ])
    
    y_train_reg = train_df["arr_delay_minutes"]
    y_test_reg = test_df["arr_delay_minutes"]
    
    print("Fitting Delay Duration Regressor Pipeline...")
    reg_pipeline.fit(train_df, y_train_reg)
    
    y_pred_reg = reg_pipeline.predict(test_df)
    mae = mean_absolute_error(y_test_reg, y_pred_reg)
    rmse = np.sqrt(mean_squared_error(y_test_reg, y_pred_reg))
    r2 = r2_score(y_test_reg, y_pred_reg)
    
    # Feature Importances extraction
    preprocessor = clf_pipeline.named_steps["preprocessor"]
    cat_encoder = preprocessor.named_transformers_["cat"].named_steps["onehot"]
    cat_feature_names = cat_encoder.get_feature_names_out().tolist()
    from app.ml.pipeline import NUMERICAL_FEATURES
    all_feature_names = NUMERICAL_FEATURES + cat_feature_names
    importances = clf_pipeline.named_steps["classifier"].feature_importances_
    
    # Aggregate importance by readable feature category
    grouped_importance = {}
    for name, imp in zip(all_feature_names, importances):
        # Clean name
        if name.startswith("cat__"):
            base = name.split("__")[1].split("_")[0]
        else:
            base = name.replace("num__", "").split("_")[0]
            
        label_map = {
            "wind": "Wind Speed & Dynamics",
            "taxi": "Airport Taxi & Surface Queue",
            "historical": "Carrier Historical Reliability",
            "precipitation": "Precipitation & Moisture",
            "visibility": "Atmospheric Visibility",
            "congestion": "Hub Airspace Congestion",
            "origin": "Departure Weather & Hub Load",
            "dest": "Arrival Conditions & Airspace",
            "carrier": "Carrier Fleet Constraints",
            "dep": "Scheduled Departure Time / Peak",
            "distance": "Flight Distance & Air Time",
            "day": "Day of Week Peak",
            "month": "Seasonal Climatology"
        }
        category = label_map.get(base, base.title())
        grouped_importance[category] = grouped_importance.get(category, 0.0) + float(imp)
        
    top_features = sorted(
        [{"feature": k, "importance": round(v, 4)} for k, v in grouped_importance.items()],
        key=lambda x: x["importance"],
        reverse=True
    )
    
    # Save artifacts
    settings.ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(clf_pipeline, settings.MODEL_PATH)
    joblib.dump(reg_pipeline, settings.REGRESSOR_PATH)
    
    evaluation_metadata = {
        "model_type": "RandomForest Baseline (Scikit-Learn)",
        "model_version": "1.0.0-baseline",
        "dataset_type": "FAA/BTS Historical Benchmark (Sample Data)",
        "train_samples": len(train_df),
        "test_samples": len(test_df),
        "classification": {
            "accuracy": round(float(acc), 4),
            "precision": round(float(prec), 4),
            "recall": round(float(rec), 4),
            "f1_score": round(float(f1), 4),
            "roc_auc": round(float(roc_auc), 4),
            "confusion_matrix": {
                "true_negative": cm[0][0],
                "false_positive": cm[0][1],
                "false_negative": cm[1][0],
                "true_positive": cm[1][1]
            },
            "roc_curve": roc_points,
            "pr_curve": pr_points
        },
        "regression": {
            "mae_minutes": round(float(mae), 2),
            "rmse_minutes": round(float(rmse), 2),
            "r2_score": round(float(r2), 4)
        },
        "feature_importances": top_features,
        "implementation_status": {
            "status": "Operational Baseline",
            "is_mock": False,
            "notes": "Real Scikit-Learn RandomForest pipelines trained on realistic aviation parameters. Production grade deep learning (e.g. LSTM temporal sequence + XGBoost ensemble) on live ADS-B is planned for Phase 2."
        }
    }
    
    with open(settings.METRICS_PATH, "w") as f:
        json.dump(evaluation_metadata, f, indent=2)
        
    print("\n" + "=" * 40)
    print("EVALUATION RESULTS (Honest Scikit-Learn Metrics):")
    print(f"Accuracy:  {acc:.2%}")
    print(f"Precision: {prec:.2%}")
    print(f"Recall:    {rec:.2%}")
    print(f"F1 Score:  {f1:.4f}")
    print(f"ROC-AUC:   {roc_auc:.4f}")
    print(f"Delay Duration MAE: {mae:.1f} minutes")
    print(f"Confusion Matrix: TN={cm[0][0]}, FP={cm[0][1]}, FN={cm[1][0]}, TP={cm[1][1]}")
    print(f"Artifacts saved to: {settings.ARTIFACTS_DIR}")
    print("=" * 40)
    return evaluation_metadata

if __name__ == "__main__":
    train_and_evaluate()
