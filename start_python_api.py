"""
Lab Report AI - Local Python API Server
Run this to start the Python FastAPI server for regression analysis
"""

import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(__file__))

# Import and run the API
from api.main import app
import uvicorn

if __name__ == "__main__":
    print("=" * 60)
    print("Lab Report AI - Python Analysis API")
    print("=" * 60)
    print("")
    print("Starting FastAPI server on http://localhost:8000")
    print("API Endpoint: http://localhost:8000/api/analyze")
    print("")
    print("Press CTRL+C to quit")
    print("=" * 60)
    print("")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
