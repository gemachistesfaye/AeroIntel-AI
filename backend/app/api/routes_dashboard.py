from flask import Blueprint, jsonify
from app.data.data_loader import data_manager

bp = Blueprint("dashboard", __name__, url_prefix="/dashboard")

@bp.route("/summary", methods=["GET"])
def get_dashboard_summary():
    try:
        data = data_manager.get_dashboard_summary()
        return jsonify({"success": True, "data": data})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
