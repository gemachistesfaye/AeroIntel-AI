from flask import Blueprint, jsonify
from app.data.data_loader import data_manager
from app.data.generate_dataset import generate_sample_dataset

bp = Blueprint("data_mgmt", __name__, url_prefix="/data")

@bp.route("/status", methods=["GET"])
def get_data_status():
    try:
        info = data_manager.get_data_management_info()
        return jsonify({"success": True, "data": info})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@bp.route("/regenerate", methods=["POST"])
def regenerate_data():
    try:
        generate_sample_dataset()
        count = data_manager.reload()
        return jsonify({
            "success": True,
            "message": f"Successfully regenerated {count} benchmark flight records.",
            "records": count
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
