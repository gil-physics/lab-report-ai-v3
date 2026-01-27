"""
Enhanced OCR Service with Gemini Vision API
Uses AI prompts to better understand table structure
"""
import os
import io
from typing import Dict, List, Optional
import google.generativeai as genai
from PIL import Image

try:
    import pytesseract
    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False


async def process_image_to_csv_with_gemini(image_bytes: bytes) -> Dict:
    """
    Convert image to CSV using 2-stage approach:
    Stage 1: Vision API extracts all text from image
    Stage 2: Gemini AI reorganizes text into structured CSV
    
    This is more accurate for complex table structures with handwriting.
    """
    
    GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
    if not GOOGLE_API_KEY:
        raise Exception("GOOGLE_API_KEY not configured")
    
    try:
        # ========================================
        # STAGE 1: Extract Text with Vision API
        # ========================================
        print("📸 Stage 1: Extracting text with Vision API...")
        
        try:
            from google.cloud import vision
            VISION_AVAILABLE = True
        except ImportError:
            VISION_AVAILABLE = False
        
        if not VISION_AVAILABLE:
            raise Exception("google-cloud-vision not installed. Run: pip install google-cloud-vision")
        
        # Use Vision API to extract text
        client = vision.ImageAnnotatorClient()
        image_vision = vision.Image(content=image_bytes)
        response = client.text_detection(image=image_vision)
        
        if response.error.message:
            raise Exception(f"Vision API error: {response.error.message}")
        
        texts = response.text_annotations
        if not texts:
            raise Exception("No text found in image")
        
        # Get full text from image
        extracted_text = texts[0].description
        print(f"✅ Stage 1 Complete: Extracted {len(extracted_text)} characters")
        
        # ========================================
        # STAGE 2: Reorganize with Gemini AI
        # ========================================
        print("🤖 Stage 2: Reorganizing text with Gemini AI...")
        
        genai.configure(api_key=GOOGLE_API_KEY)
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        # Enhanced prompt for text reorganization
        reorganization_prompt = f"""
다음은 실험 보고서 이미지에서 추출한 원본 텍스트입니다.
이 텍스트를 분석하여 **실험 데이터 테이블만** CSV 형식으로 재구성해 주세요.

[추출된 원본 텍스트]
{extracted_text}

⚠️ 중요 지시사항:

1. **제외할 것** (개인정보):
   - 학번 (Student ID)
   - 이름 (Name)
   - 실험 조원의 이름
   - TA 이름, 서명
   - 학생 정보 관련 모든 내용

2. **추출할 것**:
   - 실험명 (예: Experiment 1: Free Fall) 
   - 실험 데이터 테이블 (시간, 위치, 속도 등 측정값)
   - 실험 조건 (Picket Fence Spacing, Diameter 등)

3. **CSV 형식 규칙**:
   - 각 실험은 빈 줄로 구분
   - 첫 줄: 실험명 또는 컬럼 헤더
   - 숫자는 정확히 (소수점 포함)
   - 단위 유지 (0.05m처럼)

4. **테이블 구조 인식**:
    -실험명은 같으나 조건(예: Picket Fence Spacing 0.05m, 0.10m 등)이 다른 경우에는 다른 데이터 테이블로 인식
   - 행과 열을 명확히 구분
   - 반복 패턴을 찾아 테이블로 변환
   - 3개의 Trial이 있으면 3x3 표 형식으로

5. **출력 예시**:
```
Experiment 1: Free Fall - Picket Fence Spacing 0.05m
Trial_1,Time_1(s),Position_1(m),Time_2(s),Position_2(m),Time_3(s),Position_3(m)
1,0.00,0.00,0.00,0.00,0.543,0.00
2,0.05,0.05,0.05,0.05,0.589,0.05

Experiment 1: Free Fall - Picket Fence Spacing 0.10m
Trial_1,Time_1(s),Position_1(m),Time_2(s),Position_2(m),Time_3(s),Position_3(m)
1,0.00,0.00,0.00,0.00,0.543,0.00
2,0.05,0.05,0.05,0.05,0.589,0.05

Experiment 2: Projectile Motion
Angle,v(m/s)
45.0,3.447
60.0,3.465
```

위 규칙에 따라 원본 텍스트를 정리된 CSV로 변환해 주세요.
설명 없이 CSV 데이터만 출력하세요.
"""
        
        # Generate structured CSV
        response = await model.generate_content_async(reorganization_prompt)
        
        if not response.text:
            raise Exception("Gemini failed to reorganize text into CSV")
        
        csv_text = response.text.strip()
        
        # Remove markdown code blocks if present
        if '```' in csv_text:
            lines = csv_text.split('\n')
            csv_text = '\n'.join([
                line for line in lines 
                if not line.strip().startswith('```')
            ])
        
        print(f"✅ Stage 2 Complete: Generated CSV with {len(csv_text)} characters")
        
        # Parse to validate structure
        rows = []
        for line in csv_text.strip().split('\n'):
            if line.strip():
                cells = [cell.strip() for cell in line.split(',')]
                rows.append(cells)
        
        if not rows:
            raise Exception("No data in generated CSV")
        
        return {
            "csv_data": csv_text,
            "preview": rows[:5],
            "row_count": len(rows),
            "col_count": len(rows[0]) if rows else 0,
            "method": "2-stage (Vision API + Gemini AI)"
        }
        
    except Exception as e:
        print(f"❌ OCR Failed: {str(e)}")
        raise Exception(f"2-stage OCR failed: {str(e)}")


# Removed Tesseract fallback - not needed
