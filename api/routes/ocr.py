"""
OCR API Routes
Handles image upload and conversion to CSV using Gemini Vision
"""
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import sys
import os

# Ensure services are importable
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from api.services.ocr_gemini import process_image_to_csv_with_gemini

router = APIRouter()


@router.post("/upload")
async def upload_image_for_ocr(file: UploadFile = File(...)):
    """
    Upload an image and convert to CSV using Gemini Vision AI
    
    Request: multipart/form-data with image file
    Response: {
        "status": "success",
        "csv_data": str,
        "preview": [[...]],
        "row_count": int,
        "col_count": int,
        "method": "gemini_vision"
    }
    """
    try:
        # Validate file type
        if not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=400,
                detail="Invalid file type. Please upload an image file (PNG, JPG, JPEG)."
            )
        
        # Read image bytes
        image_bytes = await file.read()
        
        # Check file size (max 10MB)
        if len(image_bytes) > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail="File too large. Maximum size is 10MB."
            )
        
        # Process image with Gemini Vision AI
        result = await process_image_to_csv_with_gemini(image_bytes)
        
        return JSONResponse(content={
            "status": "success",
            **result
        })
        
    except HTTPException as he:
        raise he
    except Exception as e:
        # Print detailed error for debugging
        import traceback
        print(f"\n❌ OCR Error Details:")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        print(f"Traceback:")
        traceback.print_exc()
        print("\n")
        
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": f"OCR processing failed: {str(e)}"
            }
        )


@router.get("/health")
async def ocr_health():
    """Health check for OCR service"""
    return {
        "status": "healthy",
        "service": "ocr"
    }
