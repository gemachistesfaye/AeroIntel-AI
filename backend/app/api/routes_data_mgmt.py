import os
import json
from pathlib import Path
from flask import Blueprint, request, jsonify
import pandas as pd

from app.core.config import settings
from app.data.data_loader import data_manager
from app.data.ingestion import ingestion_pipeline
from app.data.generate_dataset import generate_sample_dataset

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
            # Generate quality report from active data
            clean_df, report = ingestion_pipeline.validate_and_clean(
                data_manager.df, source_name="Active Benchmark Dataset"
            )
            with open(report_path, "w") as f:
                json.dump(report, f, indent=2)

        return jsonify({"success": True, "data": report})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@bp.route("/upload", methods=["POST"])
def upload_csv():
    try:
        if "file" not in request.files:
            return jsonify({"success": False, "error": "No file uploaded. Please supply a CSV file."}), 400

        file = request.files["file"]
        if file.filename == "":
            return jsonify({"success": False, "error": "No file selected."}), 400

        if not file.filename.endswith(".csv"):
            return jsonify({"success": False, "error": "Invalid file format. Only CSV files are supported."}), 400

        save_path = UPLOAD_DIR / file.filename
        file.save(str(save_path))

        # Validate without immediately overwriting main dataset
        raw_df = pd.read_csv(save_path, low_memory=False)
        _, quality_report = ingestion_pipeline.validate_and_clean(raw_df, source_name=file.filename)

        return jsonify({
            "success": True,
            "message": f"File '{file.filename}' uploaded and validated successfully.",
            "file_name": file.filename,
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

        return jsonify({
            "success": True,
            "message": f"Successfully ingested {count} clean records into the platform.",
            "records": count,
            "quality_report": report
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@bp.route("/regenerate", methods=["POST"])
def regenerate_data():
    try:
        generate_sample_dataset()
        clean_df, report = ingestion_pipeline.ingest_from_csv(settings.DATA_PATH)
        count = data_manager.reload()

        # Refresh analytical cache
        from app.data.big_data_processor import analytics_processor
        analytics_processor.load_data(force_reload=True)

        return jsonify({
            "success": True,
            "message": f"Successfully regenerated and validated {count} benchmark records.",
            "records": count,
            "quality_report": report
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
