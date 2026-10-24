from flask import Blueprint, request, jsonify
from app.data.data_loader import data_manager

bp = Blueprint("flights", __name__, url_prefix="/flights")

@bp.route("", methods=["GET"])
def get_flights():
    try:
        query = request.args.get("q", "")
        carrier = request.args.get("carrier", "")
        origin = request.args.get("origin", "")
        dest = request.args.get("dest", "")
        risk_tier = request.args.get("risk_tier", "")
        status = request.args.get("status", "")
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 15))

        res = data_manager.get_flights(
            query=query,
            carrier=carrier,
            origin=origin,
            dest=dest,
            risk_tier=risk_tier,
            status=status,
            page=page,
            limit=limit
        )
        return jsonify({"success": True, "data": res})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
