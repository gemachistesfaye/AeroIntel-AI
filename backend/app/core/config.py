import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
ARTIFACTS_DIR = BASE_DIR / "ml" / "artifacts"

class Settings:
    PROJECT_NAME: str = "AI-Powered Aviation Intelligence Platform"
    VERSION: str = "1.0.0-alpha"
    API_PREFIX: str = "/api"
    HOST: str = os.getenv("API_HOST", "127.0.0.1")
    PORT: int = int(os.getenv("API_PORT", 8000))
    CORS_ORIGINS: list = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]
    BASE_DIR: Path = BASE_DIR
    DATA_DIR: Path = DATA_DIR
    ARTIFACTS_DIR: Path = ARTIFACTS_DIR
    DATA_PATH: Path = DATA_DIR / "sample_flights.csv"
    MODEL_PATH: Path = ARTIFACTS_DIR / "baseline_model.joblib"
    REGRESSOR_PATH: Path = ARTIFACTS_DIR / "baseline_regressor.joblib"
    METRICS_PATH: Path = ARTIFACTS_DIR / "evaluation_metrics.json"

settings = Settings()
