import os
import json
import logging
from pathlib import Path
from flask import Blueprint, request, jsonify
import pandas as pd

from app.core.config import settings
from app.data.data_loader import data_manager
from app.data.ingestion import (
    ingestion_pipeline,
    extract_csv_from_zip,
    BTS_COLUMN_MAPPING,
    CANONICAL_FIELD_CANDIDATES
)

logger = logging.getLogger(__name__)

bp = Blueprint("data_mgmt", __name__, url_prefix="/data")

UPLOAD_DIR = settings.DATA_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@bp.route("/status", methods=["GET"])
def get_data_status():
    try:
        info = data_manager.get_data_management_info()
        return jsonify({"success": True, "data": info})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@bp.route("/quality", methods=["GET"])
def get_data_quality_report():
    try:
        report_path = settings.DATA_DIR / "data_quality_report.json"
        if report_path.exists():
            with open(report_path, "r") as f:
                report = json.load(f)
        else:
            clean_df, report = ingestion_pipeline.validate_and_clean(
                data_manager.df, source_name="Active Aviation Dataset"
            )
            with open(report_path, "w") as f:
                json.dump(report, f, indent=2)

        return jsonify({"success": True, "data": report})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@bp.route("/schema-mapping", methods=["GET", "POST"])
def manage_schema_mapping():
    """Inspects or configures custom BTS schema mappings."""
    try:
        if request.method == "POST":
            payload = request.get_json(force=True, silent=True) or {}
            custom_map = payload.get("mapping", {})
            ingestion_pipeline.set_custom_mapping(custom_map)
            return jsonify({
                "success": True,
                "message": f"Configured {len(custom_map)} custom column mappings.",
                "custom_mapping": custom_map
            })
        else:
            return jsonify({
                "success": True,
                "data": {
                    "standard_bts_mapping": BTS_COLUMN_MAPPING,
                    "canonical_candidates": CANONICAL_FIELD_CANDIDATES,
                    "active_custom_mapping": ingestion_pipeline.custom_mappings
                }
            })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@bp.route("/upload", methods=["POST"])
def upload_csv():
    try:
        if "file" not in request.files:
            return jsonify({"success": False, "error": "No file uploaded. Please supply a CSV or ZIP file."}), 400

        file = request.files["file"]
        if file.filename == "":
            return jsonify({"success": False, "error": "No file selected."}), 400

        fname = file.filename.lower()
        if not (fname.endswith(".csv") or fname.endswith(".zip")):
            return jsonify({"success": False, "error": "Invalid file format. Only CSV and ZIP files are supported."}), 400

        # Preserve the original uploaded file in uploads directory without overwriting active data
        save_path = UPLOAD_DIR / file.filename
        file.save(str(save_path))

        # If file is a zip archive, extract the main CSV
        if fname.endswith(".zip"):
            csv_path = extract_csv_from_zip(save_path, output_dir=UPLOAD_DIR)
        else:
            csv_path = save_path

        # Check file size for chunked streaming profiling
        file_size_bytes = csv_path.stat().st_size
        if file_size_bytes > 15 * 1024 * 1024:  # > 15MB: use chunked streaming
            quality_report = ingestion_pipeline.profile_dataset(csv_path, source_name=file.filename)
        else:
            raw_df = pd.read_csv(csv_path, low_memory=False)
            _, quality_report = ingestion_pipeline.validate_and_clean(raw_df, source_name=file.filename)

        return jsonify({
            "success": True,
            "message": f"File '{file.filename}' uploaded and profiled successfully.",
            "file_name": file.filename,
            "preserved_path": str(save_path),
            "quality_report": quality_report
        })
    except Exception as e:
        return jsonify({"success": False, "error": f"Failed to process uploaded file: {str(e)}"}), 400

@bp.route("/ingest", methods=["POST"])
def ingest_dataset():
    try:
        payload = request.get_json(force=True, silent=True) or {}
        file_name = payload.get("file_name")

        if file_name:
            target_path = UPLOAD_DIR / file_name
            if not target_path.exists():
                return jsonify({"success": False, "error": f"Uploaded file not found: {file_name}"}), 404
        else:
            target_path = settings.DATA_PATH

        clean_df, report = ingestion_pipeline.ingest_from_csv(target_path)
        count = data_manager.reload()

        # Refresh analytical cache
        from app.data.big_data_processor import analytics_processor
        analytics_processor.load_data(force_reload=True)

        # Retrain ML models on the newly activated dataset if enough records exist
        retrained = False
        if count >= 10:
            try:
                from app.ml.train_models import train_and_compare_models
                from app.ml.model_service import model_service
                train_and_compare_models(custom_data_path=settings.DATA_PATH)
                model_service._load_artifacts()
                retrained = True
            except Exception as train_err:
                logger.warning(f"Could not auto-retrain models on ingested data: {train_err}")

        return jsonify({
            "success": True,
            "message": f"Successfully ingested {count} clean records into the platform." + (" Models retrained on real data." if retrained else ""),
            "records": count,
            "quality_report": report
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@bp.route("/regenerate", methods=["POST"])
def reload_benchmark_data():
    """Re-ingests the verified BTS benchmark dataset without synthesizing fake records."""
    try:
        bts_sample = settings.DATA_DIR / "bts_flight_sample.csv"
        source_target = bts_sample if bts_sample.exists() else settings.DATA_PATH

        clean_df, report = ingestion_pipeline.ingest_from_csv(source_target)
        count = data_manager.reload()

        # Refresh analytical cache
        from app.data.big_data_processor import analytics_processor
        analytics_processor.load_data(force_reload=True)

        try:
            from app.ml.train_models import train_and_compare_models
            from app.ml.model_service import model_service
            if count >= 10:
                train_and_compare_models(custom_data_path=settings.DATA_PATH)
                model_service._load_artifacts()
        except Exception:
            pass

        return jsonify({
            "success": True,
            "message": f"Successfully activated {count} authentic BTS benchmark records.",
            "records": count,
            "quality_report": report
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
