from flask import Blueprint, request, jsonify
from app.ml.model_service import model_service
from app.ml.train_models import train_and_compare_models

bp = Blueprint("model_eval", __name__, url_prefix="/model")

@bp.route("/evaluation", methods=["GET"])
def get_model_evaluation():
    try:
        metrics = model_service.evaluation_metrics
        if not metrics:
            comparison = train_and_compare_models()
            model_service._load_artifacts()
            metrics = model_service.evaluation_metrics

        return jsonify({"success": True, "data": metrics})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@bp.route("/compare", methods=["GET"])
def get_model_comparison():
    try:
        comparison = model_service.get_comparison_metrics()
        if not comparison:
            comparison = train_and_compare_models()
            model_service._load_artifacts()

        return jsonify({"success": True, "data": comparison})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@bp.route("/retrain", methods=["POST"])
def retrain_model():
    try:
        payload = request.get_json(force=True, silent=True) or {}
        delay_threshold = int(payload.get("delay_threshold_minutes", 15))

        comparison = train_and_compare_models(delay_threshold_minutes=delay_threshold)
        model_service._load_artifacts()

        return jsonify({
            "success": True,
            "message": f"Models retrained successfully with {delay_threshold}-minute lateness threshold.",
            "data": comparison
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
