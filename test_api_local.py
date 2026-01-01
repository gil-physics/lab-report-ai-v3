"""
로컬 API 서버 테스트 스크립트
Vercel 없이 FastAPI를 직접 실행합니다.
"""

import sys
import os

# api 디렉토리를 Python path에 추가
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'api'))

# FastAPI app import
from analyze import app

def main():
    try:
        import uvicorn
    except ImportError:
        print("❌ uvicorn이 설치되지 않았습니다.")
        print("다음 명령어로 설치하세요:")
        print("pip install uvicorn")
        return

    print("=" * 60)
    print("🚀 Easy-Lab-Plotter Analysis API 시작")
    print("=" * 60)
    print()
    print("📍 API 서버: http://localhost:8000")
    print("📖 API 문서: http://localhost:8000/docs")
    print("🧪 테스트 엔드포인트: http://localhost:8000/api/analyze")
    print()
    print("💡 Ctrl+C를 눌러서 서버를 중지할 수 있습니다.")
    print("=" * 60)
    print()
    
    # FastAPI 서버 실행
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)

if __name__ == "__main__":
    main()
