from flask import Blueprint, request, jsonify
from app.data.big_data_processor import analytics_processor
from app.data.spark_processor import spark_engine

bp = Blueprint("analytics", __name__, url_prefix="/analytics")

@bp.route("/summary", methods=["GET"])
def get_analytics_summary():
    try:
        carriers = analytics_processor.compute_carrier_benchmarks()
        corridors = analytics_processor.compute_corridor_analytics()
        hubs = analytics_processor.compute_hub_analytics()
        causes = analytics_processor.compute_delay_causes_breakdown()
        
        # Calculate fleet-wide totals
        df = analytics_processor.load_data()
        total_records = len(df)
        total_delayed = int((df["is_delayed"] == 1).sum()) if "is_delayed" in df.columns else 0
        canc_count = int(df["is_cancelled"].astype(str).isin(["1", "1.0", "True"]).sum()) if "is_cancelled" in df.columns else 0
        div_count = int(df["is_diverted"].astype(str).isin(["1", "1.0", "True"]).sum()) if "is_diverted" in df.columns else 0

        return jsonify({
            "success": True,
            "data": {
                "total_records": total_records,
                "total_carriers": len(carriers),
                "total_corridors": len(corridors),
                "total_hubs": len(hubs),
                "on_time_rate_pct": round(((total_records - total_delayed) / total_records) * 100, 1) if total_records > 0 else 0.0,
                "delay_rate_pct": round((total_delayed / total_records) * 100, 1) if total_records > 0 else 0.0,
                "cancellation_rate_pct": round(canc_count / total_records * 100, 2) if total_records > 0 else 0.0,
                "diversion_rate_pct": round(div_count / total_records * 100, 2) if total_records > 0 else 0.0,
                "has_delay_causes": causes.get("has_delay_causes", False),
                "top_carriers": carriers[:5],
                "top_corridors": corridors[:5],
                "top_congested_hubs": hubs[:5],
                "processing_engine": "Pandas Memory-Optimized Engine"
            }
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@bp.route("/carriers", methods=["GET"])
def get_carrier_benchmarks():
    try:
        data = analytics_processor.compute_carrier_benchmarks()
        return jsonify({"success": True, "data": data})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@bp.route("/corridors", methods=["GET"])
def get_corridor_analytics():
    try:
        data = analytics_processor.compute_corridor_analytics()
        return jsonify({"success": True, "data": data})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@bp.route("/hubs", methods=["GET"])
def get_hub_analytics():
    try:
        data = analytics_processor.compute_hub_analytics()
        return jsonify({"success": True, "data": data})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@bp.route("/temporal", methods=["GET"])
def get_temporal_analytics():
    """Returns historical delay trends partitioned by month, day of week, and departure hour."""
    try:
        data = analytics_processor.compute_temporal_analytics()
        return jsonify({"success": True, "data": data})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@bp.route("/delay-causes", methods=["GET"])
def get_delay_causes():
    """Returns delay cause attribution breakdown only when delay cause columns are available."""
    try:
        data = analytics_processor.compute_delay_causes_breakdown()
        return jsonify({"success": True, "data": data})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@bp.route("/filter", methods=["GET"])
def filter_records():
    try:
        carrier = request.args.get("carrier")
        origin = request.args.get("origin")
        dest = request.args.get("dest")
        delay_status = request.args.get("status")
        risk_tier = request.args.get("risk_tier")
        min_hour = int(request.args.get("min_hour")) if request.args.get("min_hour") else None
        max_hour = int(request.args.get("max_hour")) if request.args.get("max_hour") else None
        limit = int(request.args.get("limit", 50))

        records = analytics_processor.filter_records(
            carrier=carrier,
            origin=origin,
            dest=dest,
            delay_status=delay_status,
            risk_tier=risk_tier,
            min_hour=min_hour,
            max_hour=max_hour,
            limit=limit
        )
        return jsonify({"success": True, "total": len(records), "data": records})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@bp.route("/spark-status", methods=["GET"])
def get_spark_status():
    try:
        status = spark_engine.get_cluster_status()
        return jsonify({"success": True, "data": status})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
