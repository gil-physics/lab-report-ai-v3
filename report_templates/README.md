# 📊 실험 보고서 템플릿 시스템

## 🎯 목적
사용자의 실험 보고서 스타일을 학습하여 맞춤형 PDF 보고서를 자동 생성합니다.

## 📁 폴더 구조

```
easy-lab-plotter/
├── user_reports/          ← 여기에 실험 보고서 파일을 넣어주세요!
│   ├── README.md
│   └── (사용자 보고서들)
│
└── report_templates/      ← AI가 생성한 템플릿이 여기에 저장됩니다
    ├── README.md (이 파일)
    ├── 기본_템플릿.md
    └── (생성된 템플릿들)
```

## 🔄 작동 방식

### 1단계: 보고서 업로드
```
user_reports/ 폴더에 실험 보고서 파일 저장
```

### 2단계: 템플릿 생성 (AI가 자동)
```python
# AI가 보고서를 분석하여:
- 구조 파악
- 작성 스타일 학습
- 템플릿 생성
```

### 3단계: PDF 자동 생성
```python
# Easy-Lab Plotter에서:
데이터 업로드 → 템플릿 선택 → PDF 다운로드
```

## 📝 템플릿 문법

템플릿은 **Handlebars 문법**을 사용합니다:

### 변수
```
{{variable_name}}
```

### 조건문
```
{{#if condition}}
  내용
{{else}}
  다른 내용
{{/if}}
```

### 반복문
```
{{#each items}}
  - {{this}}
{{/each}}
```

## 🔧 사용 가능한 변수

### 기본 정보
- `{{experiment_title}}` - 실험 제목
- `{{date}}` - 실험 날짜
- `{{experimenter}}` - 실험자 이름

### 데이터
- `{{data_table}}` - 원본 데이터 표
- `{{calculated_table}}` - 계산 결과 표

### 회귀 분석
- `{{model_name}}` - 선택된 모델 이름
- `{{regression_equation}}` - 회귀식
- `{{r_squared}}` - R² 값
- `{{adj_r_squared}}` - 조정된 R²

### 그래프
- `{{graph_path}}` - 메인 그래프 경로
- `{{residual_path}}` - 잔차도 경로

### 분석 결과
- `{{slope}}` - 기울기
- `{{intercept}}` - y절편
- `{{slope_positive}}` - 기울기 양수 여부 (boolean)
- `{{high_r_squared}}` - R² > 0.95 여부

## 📋 예시 템플릿

`기본_템플릿.md` 파일을 참고하세요.

## 🚀 다음 단계

1. ✅ 폴더 구조 생성 완료
2. ⏳ `user_reports/`에 보고서 업로드 대기
3. ⏳ AI 템플릿 분석 및 생성
4. ⏳ PDF 생성 기능 구현

---

**현재 상태:** 사용자 보고서 업로드 대기 중 📂
