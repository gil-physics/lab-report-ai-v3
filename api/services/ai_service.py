import os
import google.generativeai as genai
from api.services.gemini_config import get_gemini_model_name
import re


async def generate_ai_content(exp_name, analysis, template_id, template_content=None, raw_data_summary=None, csv_data=None):
    # Load API key at runtime, not at import time
    GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
    if not GOOGLE_API_KEY:
        return "AI API 키가 설정되지 않아 내용을 생성할 수 없습니다."
    
    # --- [AI API LOGIC - NOW ACTIVE] ---
    genai.configure(api_key=GOOGLE_API_KEY)
    
    try:
        model = genai.GenerativeModel(get_gemini_model_name())
        
        # Build prompt using template if available
        template_context = ""
        if template_content:
            template_context = f"\n[참고할 보고서 템플릿 구조]\n{template_content}\n"

        # 📊 CSV 원본 데이터 컨텍스트 추가 (환각 방지)
        csv_context = ""
        if csv_data:
            # 처음 500자만 컨텍스트로 제공 (너무 길면 토큰 낭비)
            csv_preview = csv_data[:500] if len(csv_data) > 500 else csv_data
            csv_context = f"""
[원본 CSV 데이터 (참고용)]
{csv_preview}

⚠️ 주의: 위 데이터는 참고용입니다. 모든 수치는 아래 '분석 결과 정보'의 Python 계산 값을 정확히 사용하세요.
"""

        # 📊 데이터 통계 요약 정보 생성
        data_desc = ""
        example_citation = ""
        if raw_data_summary:
            data_desc = f"""
        [실험 데이터 통계 요약]
        - 데이터 개수: {raw_data_summary.get('count', 0)} 개
        - X값 범위: {raw_data_summary.get('x_min', 0):.4f} ~ {raw_data_summary.get('x_max', 0):.4f}
        - Y값 범위: {raw_data_summary.get('y_min', 0):.4f} ~ {raw_data_summary.get('y_max', 0):.4f}
        - Y값 평균: {raw_data_summary.get('y_mean', 0):.4f} (표준편차: {raw_data_summary.get('y_std', 0):.4f})
        """
            example_citation = f"예: \"측정된 Y값은 평균 {raw_data_summary.get('y_mean', 0):.2f}를 중심으로 {raw_data_summary.get('y_min', 0):.2f}에서 {raw_data_summary.get('y_max', 0):.2f} 사이의 범위를 보였습니다.\""

        # 🧠 AI 프롬프트 고도화 (데이터 주입): 환각 방지를 위해 명확한 수치 제공
        from api.utils.significant_figures import format_with_uncertainty
        
        params_info = []
        if 'params' in analysis:
            p_vals = analysis.get('params', [])
            p_errs = analysis.get('standard_errors', [0.0] * len(p_vals))
            p_names = ['a', 'b', 'c', 'd', 'e']
            for i, (v, e) in enumerate(zip(p_vals, p_errs)):
                n = p_names[i] if i < len(p_names) else f"p{i}"
                # Use scientific formatting for uncertainties
                params_info.append(f"{n} = {format_with_uncertainty(v, e, sig_figs=2)}")
        
        params_text = f"주요 파라미터 상세 값 (측정 오차 포함): {', '.join(params_info)}" if params_info else ""
        
        min_sig_figs = analysis.get('min_sig_figs', 3)
        x_unit = analysis.get('x_unit', '')
        y_unit = analysis.get('y_unit', '')

        prompt = f"""
# Role (역할)
당신은 대학 물리학 실험 과목의 전문 조교(TA)이자 학술 작문 전문가입니다. 당신의 목표는 제공된 실험 데이터와 배경 지식을 바탕으로 논리적이고, 과학적으로 엄밀하며, 가독성이 뛰어난 '물리학 실험 보고서 초안'을 작성하는 것입니다.

# Task (임무)
아래 [Input Data]를 바탕으로 물리 실험 보고서를 작성하십시오. 보고서는 일반적인 물리 실험 보고서의 표준 구조(서론, 이론, 실험 방법, 결과 및 분석, 토의, 결론)를 따라야 하며, 특히 데이터 분석과 오차 논의에 있어 깊이 있는 통찰력을 제공해야 합니다.

# Input Data (입력 데이터)
1. 실험 제목: {exp_name}
2. 적용된 물리 이론 및 키워드: {template_id if template_id != 'none' else '기본 물리학 법칙'}
3. [중요] 분석 결과 및 계산값 (Source of Truth):
   - 회귀 모델: {analysis.get('name', analysis.get('model', 'N/A'))}
   - 도출된 수식: {analysis.get('equation', 'N/A')}
   - 결정계수 (R²): {analysis.get('r_squared', 0):.4f}
   - 최소 유효숫자 기준: {min_sig_figs} 자리
   - X 단위: {x_unit if x_unit else '없음'}
   - Y 단위: {y_unit if y_unit else '없음'}
   - {params_text}
4. [참고] 실험 데이터 통계 요약:
   {data_desc if data_desc else "요약 정보 없음"}
5. [참고] 원본 데이터 미리보기:
   {csv_context if csv_context else "원본 데이터 없음"}
6. [참고] 보고서 템플릿 구조:
   {template_context if template_context else "기본 구조 사용"}

# Guidelines & Constraints (지침 및 제약사항)

## 1. 환각 방지 및 논리 (Anti-Hallucination & Logic)
- **Zero-Inference:** 제공된 데이터(Input Data 3, 4번)에 없는 수치를 절대 지어내거나 추측하지 마십시오. 데이터가 부족하면 "데이터 부족으로 확인 불가"라고 명시하십시오. **당신이 직접 계산하지 말고, 제공된 계산값(Source of Truth)만 정확히 인용하십시오.**
- **Scientific Grounding:** 물리 이론을 설명할 때는 학술적으로 검증된 내용만 포함하십시오.
- **Chain of Thought (CoT):** 결과 분석 및 토의 섹션 작성 시, "데이터가 A 경향을 보이므로 이론값 B와 비교했을 때 C라는 결론이 도출된다"는 식의 논리적 추론 과정을 서술하십시오.
- **Scientific Precision:** 제공된 유효숫자 기준({min_sig_figs} 자리)을 인지하고, 오차 범위(±)가 포함된 파라미터 값을 논의할 때 그 의미(정밀도, 정확도)를 해석하십시오. 단위({x_unit}, {y_unit})를 누락하지 마십시오.

## 2. 그래프 삽입 (IMPORTANT - 필수)
보고서의 **결과 및 분석** 섹션에서 데이터 경향을 설명할 때, 아래 플레이스홀더를 **반드시** 포함하십시오:
- `{{{{GRAPH_REGRESSION}}}}` : 회귀 분석 그래프 (데이터 경향 설명 직후에 배치)
- `{{{{GRAPH_RESIDUAL}}}}` : 잔차 분석 그래프 (오차 분석 시 배치)

예시:
```
측정 결과, 시간에 따른 속도 변화는 선형적인 증가 경향을 보였다. 회귀 분석 결과...

{{{{GRAPH_REGRESSION}}}}

위 그래프에서 확인할 수 있듯이, 결정계수 $R^2 = 0.9876$ 으로 높은 적합도를 보인다.
잔차 분석을 통해 모델의 적합성을 추가로 검증하였다.

{{{{GRAPH_RESIDUAL}}}}
```

## 3. 수식 작성
수식은 $...$로 감싸세요. 단, 수식 내부에 $ 기호를 넣으면 에러가 납니다. 예: $R^2 = 0.98$ (O)

## 4. 보고서 구조 (Report Structure)
- **템플릿 우선 순위:** 제공된 [보고서 템플릿 구조]가 있다면, 해당 템플릿의 목차와 형식을 **절대적으로** 따르십시오. 템플릿에 `[내용을 입력하세요]`와 같은 플레이스홀더가 있다면 이를 분석 결과로 채워 넣으십시오.
- **기본 구조 (템플릿 없을 시):**
    1. **서론 (Introduction):** 실험 목적과 배경 이론 소개.
    2. **실험 방법 (Methods):** 절차를 과거형으로 간결하게 기술.
    3. **결과 및 분석 (Results & Analysis):** 제공된 분석 결과를 요약하고 주요 경향성 및 오차율을 서술. **그래프 플레이스홀더 필수 포함.**
    4. **토의 (Discussion):** 오차의 원인을 '계통 오차'와 '우연 오차'로 구분하여 분석. 장비의 한계, 환경적 요인 등을 구체적으로 서술.
    5. **결론 (Conclusion):** 목적 달성 여부 요약.

# Output Format (출력 형식)
- 제공된 템플릿의 내용을 **그대로 유지**하면서, 플레이스홀더 부분만 당신의 전문적인 분석으로 교체하여 완성된 보고서를 출력하십시오.
- **그래프 플레이스홀더 필수:** 결과 분석 섹션에 `{{{{GRAPH_REGRESSION}}}}` 과 `{{{{GRAPH_RESIDUAL}}}}` 를 반드시 포함하십시오. 시스템이 이를 실제 그래프 이미지로 치환합니다.
- **HTML 이미지 태그 보존:** 템플릿 내에 포함된 `<img src="..." />` 태그는 **절대 삭제하거나 변경하지 말고 그대로** 출력에 포함하십시오.
- **데이터 중심 분석:** 그래프 이미지를 직접 설명하려 하지 말고(예: "빨간 선이 보입니다"), 제공된 **수치 데이터(Input Data 3번)**인 결정계수, 기울기, 오차값 등을 바탕으로 현상을 논리적으로 해석하십시오.
- 전체 출력은 Markdown 형식을 사용하십시오.
- 주요 섹션은 `##` 또는 템플릿에 정의된 헤더 수준으로 구분하십시오.

지금부터 위 지침을 완벽히 숙지하고 보고서 초안 작성을 시작하십시오.
"""
        
        response = await model.generate_content_async(prompt)
        
        # Check if response was blocked or has no text
        if not response.text:
            error_details = []
            if hasattr(response, 'prompt_feedback'):
                error_details.append(f"Prompt feedback: {response.prompt_feedback}")
            if hasattr(response, 'candidates') and response.candidates:
                for i, candidate in enumerate(response.candidates):
                    error_details.append(f"Candidate {i} finish_reason: {candidate.finish_reason}")
            
            error_msg = "AI 응답이 비어있습니다. " + " | ".join(error_details) if error_details else "AI 응답이 생성되지 않았습니다."
            return error_msg
        
        # 🔧 후처리: 특수 달러 기호를 정규 $ (U+0024)로 치환
        result_text = response.text
        # 유니코드 특수 달러 기호들을 일반 $로 치환
        dollar_variants = [
            '\uFF04',  # Fullwidth Dollar Sign (＄)
            '\uFE69',  # Small Dollar Sign (﹩)
            '\U0001F4B2',  # Heavy Dollar Sign (💲)
        ]
        for variant in dollar_variants:
            result_text = result_text.replace(variant, '$')
        
        return result_text
    except Exception as e:
        error_str = str(e)
        if "429" in error_str or "quota" in error_str.lower():
            return "AI 생성 할당량(Quota)을 초과했습니다. 무료 티어의 일일 제한에 도달한 것 같습니다. 잠시 후 다시 시도하거나 내일 다시 이용해 주세요."
        return f"AI 내용 생성 중 오류 발생: {error_str}"

