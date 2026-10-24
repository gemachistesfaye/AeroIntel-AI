from flask import Flask, jsonify
from flask_cors import CORS
from app.core.config import settings

from app.api.routes_dashboard import bp as dashboard_bp
from app.api.routes_flights import bp as flights_bp
from app.api.routes_predict import bp as predict_bp
from app.api.routes_route_intel import bp as route_intel_bp
from app.api.routes_model_eval import bp as model_eval_bp
from app.api.routes_data_mgmt import bp as data_mgmt_bp
from app.api.routes_analytics import bp as analytics_bp

def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Register blueprints
    app.register_blueprint(dashboard_bp, url_prefix=f"{settings.API_PREFIX}/dashboard")
    app.register_blueprint(flights_bp, url_prefix=f"{settings.API_PREFIX}/flights")
    app.register_blueprint(predict_bp, url_prefix=f"{settings.API_PREFIX}/predict")
    app.register_blueprint(route_intel_bp, url_prefix=f"{settings.API_PREFIX}/route-intelligence")
    app.register_blueprint(model_eval_bp, url_prefix=f"{settings.API_PREFIX}/model")
    app.register_blueprint(data_mgmt_bp, url_prefix=f"{settings.API_PREFIX}/data")
    app.register_blueprint(analytics_bp, url_prefix=f"{settings.API_PREFIX}/analytics")

    @app.route(f"{settings.API_PREFIX}/health", methods=["GET"])
    def health_check():
        from app.ml.model_service import model_service
        from app.data.data_loader import data_manager
        return jsonify({
            "status": "healthy",
            "service": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "model_ready": model_service.is_ready,
            "records_loaded": len(data_manager.df),
            "environment": "development"
        })

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"success": False, "error": "Endpoint not found"}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"success": False, "error": "Internal server error"}), 500

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(host=settings.HOST, port=settings.PORT, debug=True)
