import os
import google.generativeai as genai
import re


async def generate_ai_content(exp_name, analysis, template_id, template_content=None, raw_data_summary=None):
    # Load API key at runtime, not at import time
    GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
    if not GOOGLE_API_KEY:
        return "AI API 키가 설정되지 않아 내용을 생성할 수 없습니다."
    
    # --- [TEMPORARY MOCK MODE FOR QUOTA ISSUES] ---
    # Return a structured draft locally instead of calling the Gemini API.
    # To restore AI: 1. Remove this mock block, 2. Uncomment the API logic below.
    
    try:
        stats_md = ""
        if raw_data_summary:
            count = int(raw_data_summary.get('count') or 0)
            x_min = float(raw_data_summary.get('x_min') or 0)
            x_max = float(raw_data_summary.get('x_max') or 0)
            y_min = float(raw_data_summary.get('y_min') or 0)
            y_max = float(raw_data_summary.get('y_max') or 0)
            y_mean = float(raw_data_summary.get('y_mean') or 0)
            y_std = float(raw_data_summary.get('y_std') or 0)
            
            stats_md = (
                f"- **데이터 포인트 수**: {count}개\n"
                f"- **X 범위**: {x_min:.4f} ~ {x_max:.4f}\n"
                f"- **Y 범위**: {y_min:.4f} ~ {y_max:.4f}\n"
                f"- **Y 평균**: {y_mean:.4f} (표준편차: {y_std:.4f})"
            )

        params_md = ""
        if 'params' in analysis:
            p_vals = analysis.get('params') or []
            p_errs = analysis.get('standard_errors') or [0.0] * len(p_vals)
            p_names = ['a', 'b', 'c', 'd', 'e']
            params_md = ", ".join([f"**{p_names[i] if i < len(p_names) else f'p{i}'}** = {float(v or 0):.4f} (±{float(e or 0):.4f})" for i, (v, e) in enumerate(zip(p_vals, p_errs))])

        mock_report = f"""
이 섹션은 현재 할당량 초과(Quota Exceeded)로 인해 AI가 작성한 초안으로 대체되었습니다.
아래 실험 결과 수치를 바탕으로 직접 분석 내용을 작성해 주시기 바랍니다.

### 1. 실험 결과 분석 요약 ({exp_name})

본 실험을 통해 얻은 데이터 {raw_data_summary.get('count', 0) if raw_data_summary else 'N/A'}개를 바탕으로 **{analysis.get('name', '회귀')} 모델** 분석을 수행한 결과는 다음과 같습니다.

- **분석 모델**: {analysis.get('name') or 'N/A'}
- **수행된 수식**: $ {analysis.get('equation') or 'N/A'} $
- **결정계수 ($ R^2 $)**: {float(analysis.get('r_squared') or 0):.4f} (데이터의 {float(analysis.get('r_squared') or 0)*100:.1f}%를 설명함)
- **주요 파라미터**: {params_md if params_md else "N/A"}

### 2. 데이터 분포 특성
{stats_md if stats_md else "데이터 요약 정보가 없습니다."}

### 3. 고찰 및 결론 (가이드)
작성 시 다음 사항을 고려하십시오:
1. **정밀도 평가**: $ R^2 $ 값이 1에 얼마나 가까운지를 통해 실험 모델의 신뢰성을 기술하세요.
2. **오차 원인**: 측정 기구의 한계나 환경적 요인(공기 저항, 마찰 등)이 파라미터 표준오차에 미친 영향을 분석하세요.
3. **이론값 비교**: 도출된 파라미터 값이 실제 물리 상수나 이론값과 얼마나 일치하는지 비교하세요.
        """
        return mock_report.strip()
        
    except Exception as e:
        return f"[시스템 오류] 초안 생성 중 문제 발생: {str(e)}"
    
    # --- [ORIGINAL AI API LOGIC - DISABLED] ---
    # genai.configure(api_key=GOOGLE_API_KEY)
    
    # try:
    #     model = genai.GenerativeModel('gemini-3-flash-preview')
        
    #     # Build prompt using template if available
    #     template_context = ""
    #     if template_content:
    #         template_context = f"\n[참고할 보고서 템플릿 구조]\n{template_content}\n"

    #     # 📊 데이터 통계 요약 정보 생성
    #     data_desc = ""
    #     example_citation = ""
    #     if raw_data_summary:
    #         data_desc = f"""
    #         [실험 데이터 통계 요약]
    #         - 데이터 개수: {raw_data_summary.get('count', 0)} 개
    #         - X값 범위: {raw_data_summary.get('x_min', 0):.4f} ~ {raw_data_summary.get('x_max', 0):.4f}
    #         - Y값 범위: {raw_data_summary.get('y_min', 0):.4f} ~ {raw_data_summary.get('y_max', 0):.4f}
    #         - Y값 평균: {raw_data_summary.get('y_mean', 0):.4f} (표준편차: {raw_data_summary.get('y_std', 0):.4f})
    #         """
    #         example_citation = f"예: \"측정된 Y값은 평균 {raw_data_summary.get('y_mean', 0):.2f}를 중심으로 {raw_data_summary.get('y_min', 0):.2f}에서 {raw_data_summary.get('y_max', 0):.2f} 사이의 범위를 보였습니다.\""

    #     # 🧠 AI 프롬프트 고도화 (데이터 주입): 환각 방지를 위해 명확한 수치 제공
    #     params_info = []
    #     if 'params' in analysis:
    #         p_vals = analysis.get('params', [])
    #         p_errs = analysis.get('standard_errors', [0.0] * len(p_vals))
    #         p_names = ['a', 'b', 'c', 'd', 'e']
    #         for i, (v, e) in enumerate(zip(p_vals, p_errs)):
    #             n = p_names[i] if i < len(p_names) else f"p{i}"
    #             params_info.append(f"{n} = {v:.4f} (±{e:.4f})")
        
    #     params_text = f"주요 파라미터 상세 값: {', '.join(params_info)}" if params_info else ""

    #     prompt = f"""
    #     당신은 대학교 물리학 실험 조교(TA)이자 전문 연구원입니다. 아래 **실제 실험 데이터 통계**와 분석 결과를 바탕으로 보고서의 '결과 분석 및 토의' 섹션을 작성하세요.
    #     {template_context}
        
    #     {data_desc}

    #     [분석 결과 정보]
    #     실험 주제: {exp_name}
    #     적용된 물리 이론: {template_id if template_id != 'none' else '기본 물리학 법칙'}
    #     회귀 모델: {analysis.get('name', analysis.get('model', 'N/A'))}
    #     도출된 수식: {analysis.get('equation', 'N/A')}
    #     결정계수 (R²): {analysis.get('r_squared', 0):.4f}
    #     {params_text}

    #     [작성 가이드라인]
    #     1. **구체적 수치 인용 (필수)**: 추상적인 표현 대신 위 '실험 데이터 통계 요약'에 있는 **구체적인 수치(최대/최소/평균/표준편차 등)**를 문장에 반드시 인용하세요. 
    #        - {example_citation if example_citation else '데이터 정밀도와 신뢰성을 수치적으로 제시하십시오.'}
    #     2. **수식 표현 규칙 (매우 중요)**: 
    #        - **외부 공백 필수**: 수식 기호($)와 앞뒤 글자 사이에는 **반드시 공백을 한 칸** 두세요. (예: ( $R^2$ ), 값은 $x$ 이다)
    #        - **내부 공백 금지**: 수식 기호($) 바로 안쪽에는 공백이 없어야 합니다. (예: $R^2$, $E=mc^2$)
    #        - **독립된 수식($$)**: 복잡한 수식은 앞뒤로 빈 줄을 두어 독립된 줄에 작성하세요.
    #     3. **데이터 정밀도 평가**: 표준오차와 R² 값을 바탕으로 실험의 정밀도를 수치적으로 평가하세요.
    #     4. **오차 원인 분석**: 실제 물리적 제약에 따른 오차 원인을 논리적으로 추론하세요.
    #     5. **가독성**: 중요한 포인트는 불렛 포인트(-)와 굵은 글씨(**)를 사용하여 강조하세요.

    #     [톤 앤 매너]
    #     - 전문적이고 학구적인 '하십시오체'를 사용하세요.
    #     - 마크다운 문법을 적절히 활용하세요.
    #     """
        
    #     response = await model.generate_content_async(prompt)
        
    #     # Check if response was blocked or has no text
    #     if not response.text:
    #         # ... (error handling remains same)
    #         error_details = []
    #         if hasattr(response, 'prompt_feedback'):
    #             error_details.append(f"Prompt feedback: {response.prompt_feedback}")
    #         if hasattr(response, 'candidates') and response.candidates:
    #             for i, candidate in enumerate(response.candidates):
    #                 error_details.append(f"Candidate {i} finish_reason: {candidate.finish_reason}")
            
    #         error_msg = "AI 응답이 비어있습니다. " + " | ".join(error_details) if error_details else "AI 응답이 생성되지 않았습니다."
    #         return error_msg
        
    #     return response.text
    # except Exception as e:
    #     error_str = str(e)
    #     if "429" in error_str or "quota" in error_str.lower():
    #         return "AI 생성 할당량(Quota)을 초과했습니다. 무료 티어의 일일 제한(20회)에 도달한 것 같습니다. 잠시 후 다시 시도하거나 내일 다시 이용해 주세요."
    #     return f"AI 내용 생성 중 오류 발생: {error_str}"
