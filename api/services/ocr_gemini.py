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
        model = genai.GenerativeModel('gemini-flash-latest')
        
        # Enhanced prompt for text reorganization (STRICT: organize only, no interpretation)
        reorganization_prompt = f"""
다음은 실험 보고서 이미지에서 추출한 원본 텍스트입니다.
이 텍스트를 분석하여 **실험 데이터 테이블만** CSV 형식으로 재구성해 주세요.

[추출된 원본 텍스트]
{extracted_text}

═══════════════════════════════════════════════════════════════
🎯 **핵심 역할** (YOUR ONLY JOB)
═══════════════════════════════════════════════════════════════
- 당신의 역할은 오직 **데이터 정리/포맷팅**입니다
- 흩어진 텍스트를 가독성 좋은 CSV 테이블로 **재배치**만 하세요
- 데이터의 해석, 분석, 계산, 수정은 절대 하지 마세요
- 원본에 있는 모든 숫자를 빠짐없이 추출하세요

═══════════════════════════════════════════════════════════════
🚫 **절대 금지** (DATA INTEGRITY - NEVER DO THIS)
═══════════════════════════════════════════════════════════════
- ❌ 숫자 해석/변환/계산/반올림 금지
- ❌ 읽기 어려운 숫자 추측 금지 → "?" 표시
- ❌ 원본에 없는 값 추가 금지
- ❌ 소수점, 자릿수 변경 금지 (예: 0.050 → 0.05 변환 금지)
- ❌ 누락된 값 추측/계산 금지 → 빈칸 유지
- ❌ 단위 변환 금지 (예: cm → m 변환 금지)

═══════════════════════════════════════════════════════════════
📋 **추출 규칙**
═══════════════════════════════════════════════════════════════

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
   - 숫자는 원본 그대로 (소수점 포함)
   - 단위 유지 (0.05m처럼)

4. **테이블 구조 인식**:
   - 실험명은 같으나 조건이 다른 경우 → 별도 테이블로 분리
   - 행과 열을 명확히 구분
   - 반복 패턴을 찾아 테이블로 변환

5. **출력 예시**:
```
Experiment 1: Free Fall - Picket Fence Spacing 0.05m
Trial,Time(s),Position(m)
1,0.00,0.00
2,0.05,0.05

Experiment 2: Projectile Motion
Angle,v(m/s)
45.0,3.447
60.0,3.465
```

위 규칙에 따라 원본 텍스트를 정리된 CSV로 변환해 주세요.
⚠️ 설명 없이 CSV 데이터만 출력하세요.
⚠️ 숫자는 절대 수정하지 마세요. 원본 그대로 출력하세요.
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
