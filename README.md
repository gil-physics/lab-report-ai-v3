# Lab Report AI - Web-Native Scientific Report Editor

AI를 활용한 물리 실험 데이터 분석 및 고찰 자동 생성 도구입니다. 
기존의 복잡한 Word 변환 과정을 생략하고, 브라우저에서 바로 마크다운으로 편집하고 고품질로 인쇄(PDF 저장)할 수 있는 웹 기반 워크플로우를 제공합니다.

## 프로젝트 구조

- `/frontend`: Vite + React (TypeScript) 기반의 고기능 마크다운 편집기
- `/api`: FastAPI (Python) 기반의 데이터 분석 및 AI 고찰 생성 엔진
- `/report_templates`: 실험별 고찰 및 이론적 배경 탬플릿

## 시작하기

### 1. 백엔드 서버 시작
먼저 데이터 분석을 담당하는 Python 서버를 실행합니다. (Python 3.10+ 필요)
```bash
# 루트 폴더에서
python start_python_api.py
```

### 2. 프론트엔드 서버 시작
새 터미널을 열고 Vite 서버를 실행합니다.
```bash
# 루트 폴더에서
npm run dev:frontend
```

이후 브라우저에서 `http://localhost:5173`에 접속하여 사용하세요!

## 주요 기능

- **✨ AI 고찰 생성**: Gemini AI를 통해 실험 결과에 기반한 고퀄리티 물리 고찰 자동 작성
- **📈 인터랙티브 그래프**: 회귀 분석 및 잔차 그래프 실시간 렌더링
- **📝 마크다운 편집**: LaTeX 수식($$E=mc^2$$) 및 과학 테이블 실시간 미리보기
- **💾 자동 저장**: 브라우저 `localStorage`에 작업 내용 자동 저장
- **🖨️ PDF 저장**: 과학 보고서 양식의 전문적인 인쇄 스타일 매칭
