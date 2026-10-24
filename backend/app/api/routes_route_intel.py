from flask import Blueprint, request, jsonify
from app.data.data_loader import data_manager

bp = Blueprint("route_intel", __name__, url_prefix="/route-intelligence")

@bp.route("", methods=["GET"])
def get_route_intelligence():
    try:
        origin = request.args.get("origin", "")
        dest = request.args.get("dest", "")
        data = data_manager.get_route_intelligence(origin=origin, dest=dest)
        return jsonify({"success": True, "data": data})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
