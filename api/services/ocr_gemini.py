"""
OCR Service with Gemini Vision (Single-Stage)
Uses Gemini multimodal to directly read images and extract table data
"""
import os
import io
from typing import Dict
import google.generativeai as genai
from PIL import Image


async def process_image_to_csv_with_gemini(image_bytes: bytes) -> Dict:
    """
    Convert image to CSV using Gemini Vision (single-stage approach).
    Gemini directly analyzes the image and extracts table data.
    
    This is more accurate than OCR + text processing because Gemini
    understands the visual structure of tables.
    """
    
    GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
    if not GOOGLE_API_KEY:
        raise Exception("GOOGLE_API_KEY not configured")
    
    try:
        print("🤖 Gemini Vision: Analyzing image and extracting data...")
        
        genai.configure(api_key=GOOGLE_API_KEY)
        model = genai.GenerativeModel('gemini-3-pro-preview')
        
        # Load image from bytes
        img = Image.open(io.BytesIO(image_bytes))
        print(f"📸 Image loaded: {img.size[0]}x{img.size[1]} pixels")
        
        # Prompt for direct image-to-CSV extraction
        extraction_prompt = """
당신은 물리 실험 데이터 테이블 인식 전문가입니다.
첨부된 이미지에서 **실험 데이터 테이블만** 추출하여 CSV 형식으로 출력하세요.

═══════════════════════════════════════════════════════════════
🎯 **핵심 역할**
═══════════════════════════════════════════════════════════════
- 이미지에 있는 숫자 데이터를 **정확하게** 읽어서 CSV로 변환
- 손글씨도 정확하게 인식하세요
- 소수점(.), 쉼표(,), 숫자를 정확히 구분하세요

═══════════════════════════════════════════════════════════════
📋 **추출 규칙**
═══════════════════════════════════════════════════════════════

1. **제외할 것** (개인정보):
   - 학번 (Student ID), 이름 (Name)
   - 실험 조원의 이름
   - TA 이름, 서명
   - 학생 정보 관련 모든 내용

2. **추출할 것**:
   - 실험명 (예: Experiment 1: Free Fall)
   - 실험 데이터 테이블 (시간, 위치, 속도 등 측정값)
   - 실험 조건 (Picket Fence Spacing, Diameter 등)

3. **숫자 정확도 (중요)**:
   - 소수점 위치를 정확히 인식 (예: 2.376, 0.05)
   - 단위를 정확히 구분 (cm, m, s, m/s)
   - 손글씨 숫자도 문맥에 맞게 정확히 해석

4. **CSV 형식**:
   - 각 실험은 빈 줄로 구분
   - 첫 줄: 실험명 또는 컬럼 헤더
   - 숫자는 소수점 포함하여 정확히

5. **출력 예시**:
```
Experiment 1: Free Fall - Picket Fence Spacing 0.05m
Measurement,Time_1st(s),Position_1st(m),Time_2nd(s),Position_2nd(m),Time_3rd(s),Position_3rd(m)
1,2.319,0.00,3.166,0.00,2.543,0.00
2,2.376,0.05,3.222,0.05,2.599,0.05

Experiment 2: Projectile Motion
Angle(deg),Range_1st(cm),Range_2nd(cm),Range_3rd(cm)
45,122.7,124.8,122.7
60,110.7,110.4,111.6
```

═══════════════════════════════════════════════════════════════

⚠️ 설명 없이 CSV 데이터만 출력하세요.
⚠️ 이미지에서 보이는 숫자를 정확하게 읽어주세요.
"""
        
        # Send image + prompt to Gemini
        response = await model.generate_content_async([extraction_prompt, img])
        
        if not response.text:
            raise Exception("Gemini failed to extract data from image")
        
        csv_text = response.text.strip()
        
        # Remove markdown code blocks if present
        if '```' in csv_text:
            lines = csv_text.split('\n')
            csv_text = '\n'.join([
                line for line in lines 
                if not line.strip().startswith('```')
            ])
        
        print(f"✅ Gemini Vision Complete: Generated CSV with {len(csv_text)} characters")
        print(f"\n{'='*60}")
        print(f"📊 [DEBUG] Extracted CSV:\n{csv_text}")
        print(f"{'='*60}\n")
        
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
            "method": "Gemini Vision (single-stage)"
        }
        
    except Exception as e:
        print(f"❌ Gemini Vision OCR Failed: {str(e)}")
        raise Exception(f"Gemini Vision OCR failed: {str(e)}")
