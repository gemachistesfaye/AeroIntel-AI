from flask import Blueprint, request, jsonify
from app.ml.model_service import model_service
from app.ml.train_models import train_and_compare_models

bp = Blueprint("model_eval", __name__, url_prefix="/model")

@bp.route("/evaluation", methods=["GET"])
def get_model_evaluation():
    try:
        metrics = model_service.evaluation_metrics
        if not metrics:
            train_and_compare_models()
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
        raw_threshold = payload.get("delay_threshold_minutes", 15)
        task = payload.get("task", "arrival_delay_classification")
        try:
            delay_threshold = int(raw_threshold)
            if not (5 <= delay_threshold <= 120):
                return jsonify({
                    "success": False,
                    "error": f"Delay threshold must be between 5 and 120 minutes (received {delay_threshold})."
                }), 400
        except (ValueError, TypeError):
            return jsonify({
                "success": False,
                "error": f"Invalid delay threshold '{raw_threshold}'. Must be an integer between 5 and 120."
            }), 400

        comparison = train_and_compare_models(delay_threshold_minutes=delay_threshold, task=task)
        model_service._load_artifacts()

        return jsonify({
            "success": True,
            "message": f"Models retrained successfully for task '{task}' with {delay_threshold}-minute lateness threshold.",
            "data": comparison
        })
    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
