"""
Gemini model configuration
Model name is read from the GEMINI_MODEL environment variable so it can be
changed on Cloud Run without a rebuild.
"""
import os

DEFAULT_GEMINI_MODEL = "gemini-3-flash-preview"


def get_gemini_model_name() -> str:
    # Read at runtime (after dotenv has loaded)
    return os.getenv("GEMINI_MODEL", "").strip() or DEFAULT_GEMINI_MODEL
