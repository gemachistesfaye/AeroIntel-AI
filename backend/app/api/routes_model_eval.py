from flask import Blueprint, jsonify
from app.ml.model_service import model_service
from app.ml.train_baseline import train_and_evaluate

bp = Blueprint("model_eval", __name__, url_prefix="/model")

@bp.route("/evaluation", methods=["GET"])
def get_model_evaluation():
    try:
        metrics = model_service.evaluation_metrics
        if not metrics:
            # If not yet loaded or file missing, compute on the fly
            metrics = train_and_evaluate()
            model_service._load_artifacts()

        return jsonify({"success": True, "data": metrics})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@bp.route("/retrain", methods=["POST"])
def retrain_model():
    try:
        metrics = train_and_evaluate()
        model_service._load_artifacts()
        return jsonify({"success": True, "message": "Baseline model retrained successfully", "data": metrics})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
