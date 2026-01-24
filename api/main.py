from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes.analyze import router as analyze_router
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env.local'))

app = FastAPI(
    title="Easy-Lab-Plotter Analysis API",
    version="2.1.0",
    description="Physics lab data regression analysis and formula recommendation"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Include routers
app.include_router(analyze_router, prefix="/api")

# Serve generated plots
plots_dir = os.path.join(os.path.dirname(__file__), "static", "plots")
if not os.path.exists(plots_dir):
    os.makedirs(plots_dir)
app.mount("/plots", StaticFiles(directory=plots_dir), name="plots")

static_dir = os.path.join(os.path.dirname(__file__), "static")

# SPA Routing Support:
# 1. First, try to serve requested files from 'static' directory (JS, CSS, images, etc.)
# 2. If file not found, serve 'index.html' to let React Router handle the path
@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    # Build complete file path
    static_file_path = os.path.join(static_dir, full_path)
    
    # If it's a real file (like /assets/main.js), serve it
    if os.path.isfile(static_file_path):
        return FileResponse(static_file_path)
    
    # Otherwise, serve index.html for client-side routing
    index_path = os.path.join(static_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    
    return {"error": "Frontend build files not found"}

# Vercel handler (if needed)
handler = app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
