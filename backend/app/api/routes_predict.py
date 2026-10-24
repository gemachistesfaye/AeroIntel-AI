from flask import Blueprint, request, jsonify
from app.ml.model_service import model_service

bp = Blueprint("predict", __name__, url_prefix="/predict")

@bp.route("/flight", methods=["POST"])
def predict_flight():
    try:
        payload = request.get_json(force=True, silent=True) or {}
        if not payload:
            return jsonify({
                "success": False,
                "error": "Request body must contain valid JSON flight parameters."
            }), 400

        model_type = payload.get("model_type", "baseline")
        result = model_service.predict_flight_delay(payload, model_type=model_type)
        return jsonify({"success": True, "data": result})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@bp.route("/health", methods=["GET"])
def predict_health():
    return jsonify({
        "ready": model_service.is_ready,
        "selected_model": "LogisticRegression (Selected Operational Model)",
        "candidate_model": "HistGradientBoosting (Alternative Candidate)",
        "type": "Operational Comparative Pipelines"
    })
