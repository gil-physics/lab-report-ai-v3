"""
OCR Service for converting images to CSV data
Supports Google Cloud Vision API (primary) and Tesseract (fallback)
"""
import os
import io
from typing import Dict, List, Optional
import base64

try:
    from google.cloud import vision
    VISION_AVAILABLE = True
except ImportError:
    VISION_AVAILABLE = False

try:
    import pytesseract
    from PIL import Image
    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False


async def process_image_to_csv(image_bytes: bytes) -> Dict:
    """
    Convert image containing table data to CSV format
    
    Args:
        image_bytes: Raw image data
        
    Returns:
        {
            "csv_data": str,      # CSV formatted string
            "preview": list,      # 2D array preview
            "row_count": int,
            "col_count": int,
            "method": str         # "vision_api" or "tesseract"
        }
    """
    
    # Try Tesseract first (무료, API 키 불필요)
    if TESSERACT_AVAILABLE:
        try:
            result = await _process_with_tesseract(image_bytes)
            if result:
                return result
        except Exception as e:
            print(f"Tesseract failed: {e}, trying Vision API if available")
    
    # Fallback to Google Vision API (더 정확하지만 API 키 필요)
    if VISION_AVAILABLE:
        try:
            result = await _process_with_vision_api(image_bytes)
            if result:
                return result
        except Exception as e:
            raise Exception(f"Both OCR methods failed. Tesseract and Vision API errors: {e}")
    
    raise Exception("No OCR engine available. Please install tesseract-ocr (https://github.com/UB-Mannheim/tesseract/wiki)")


async def _process_with_vision_api(image_bytes: bytes) -> Optional[Dict]:
    """Process image using Google Cloud Vision API"""
    
    # Configure Vision API client
    client = vision.ImageAnnotatorClient()
    image = vision.Image(content=image_bytes)
    
    # Perform text detection
    response = client.text_detection(image=image)
    
    if response.error.message:
        raise Exception(f"Vision API error: {response.error.message}")
    
    texts = response.text_annotations
    if not texts:
        return None
    
    # Extract full text
    full_text = texts[0].description
    
    # Parse text into table structure
    rows = _parse_text_to_table(full_text)
    
    if not rows:
        return None
    
    # Convert to CSV
    csv_data = _table_to_csv(rows)
    
    return {
        "csv_data": csv_data,
        "preview": rows,
        "row_count": len(rows),
        "col_count": len(rows[0]) if rows else 0,
        "method": "vision_api"
    }


async def _process_with_tesseract(image_bytes: bytes) -> Optional[Dict]:
    """Process image using Tesseract OCR"""
    
    # Convert bytes to PIL Image
    image = Image.open(io.BytesIO(image_bytes))
    
    # Perform OCR
    text = pytesseract.image_to_string(image)
    
    if not text.strip():
        return None
    
    # Parse text into table structure
    rows = _parse_text_to_table(text)
    
    if not rows:
        return None
    
    # Convert to CSV
    csv_data = _table_to_csv(rows)
    
    return {
        "csv_data": csv_data,
        "preview": rows,
        "row_count": len(rows),
        "col_count": len(rows[0]) if rows else 0,
        "method": "tesseract"
    }


def _parse_text_to_table(text: str) -> List[List[str]]:
    """
    Parse OCR text into table structure
    Simple heuristic: split by lines, then by whitespace/tabs
    """
    lines = text.strip().split('\n')
    rows = []
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # Split by multiple spaces or tabs (common table delimiter)
        cells = [cell.strip() for cell in line.split() if cell.strip()]
        
        if cells:
            rows.append(cells)
    
    # Ensure consistent column count (pad with empty strings if needed)
    if rows:
        max_cols = max(len(row) for row in rows)
        for row in rows:
            while len(row) < max_cols:
                row.append("")
    
    return rows


def _table_to_csv(rows: List[List[str]]) -> str:
    """Convert 2D array to CSV string"""
    import csv
    import io
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerows(rows)
    
    return output.getvalue()


def _try_convert_to_number(value: str) -> str:
    """
    Try to convert string to number, return original if fails
    Useful for data validation
    """
    try:
        # Try float conversion
        float(value)
        return value
    except ValueError:
        return value
