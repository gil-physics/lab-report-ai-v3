import os
import google.generativeai as genai
import re


async def generate_ai_content(exp_name, analysis, template_id, template_content=None):
    # Load API key at runtime, not at import time
    GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
    if not GOOGLE_API_KEY:
        return "AI API 키가 설정되지 않아 내용을 생성할 수 없습니다."
    
    # Configure Gemini API with the loaded key
    genai.configure(api_key=GOOGLE_API_KEY)
    
    try:
        model = genai.GenerativeModel('gemini-3-flash-preview')
        
        # Build prompt using template if available
        template_context = ""
        if template_content:
            template_context = f"\n[참고할 보고서 템플릿 구조]\n{template_content}\n"

        # 🧠 AI 프롬프트 고도화 (데이터 주입): 환각 방지를 위해 명확한 수치 제공
        params_info = []
        if 'params' in analysis:
            p_vals = analysis.get('params', [])
            p_errs = analysis.get('standard_errors', [0.0] * len(p_vals))
            p_names = ['a', 'b', 'c', 'd', 'e']
            for i, (v, e) in enumerate(zip(p_vals, p_errs)):
                n = p_names[i] if i < len(p_names) else f"p{i}"
                params_info.append(f"{n} = {v:.4f} (±{e:.4f})")
        
        params_text = f"주요 파라미터 상세 값: {', '.join(params_info)}" if params_info else ""

        prompt = f"""
        당신은 대학교 물리학 실험 조교(TA)이자 전문 연구원입니다. 아래 실험 데이터와 제공된 템플릿 구조를 바탕으로 학술 보고서의 '결과 분석 및 토의' 섹션을 작성해주세요.
        {template_context}
        
        [실험 데이터 정보]
        실험 주제: {exp_name}
        적용된 물리 이론: {template_id if template_id != 'none' else '기본 물리학 법칙'}
        회귀 모델: {analysis.get('model')}
        도출된 수식: {analysis.get('equation')}
        결정계수 (R²): {analysis.get('r_squared', 0):.4f}
        {params_text}

        [작성 가이드라인]
        1. **수식 표현 규칙 (매우 중요 - 렌더링 실패 방지)**: 
           - **외부 공백 필수**: 수식 기호($)와 앞뒤 글자(한글, 영어, 숫자는 물론 괄호 포함) 사이에는 **반드시 공백을 한 칸** 두어야 합니다.
             (잘못된 예: ($R^2$), $R^2$는)
             (올바른 예: ( $R^2$ ), $R^2$ 는)
           - **내부 공백 금지**: 수식 기호($) 바로 안쪽에는 공백이 없어야 합니다.
             (잘못된 예: $ R^2 $, $ E=mc^2 $)
             (올바른 예: $R^2$, $E=mc^2$)
           - **독립된 수식($$)**: 복잡한 수식은 반드시 **앞뒤로 빈 줄(Enter)**을 두어 독립된 줄에 작성하세요.
             $$ E = mc^2 $$
        2. **데이터 정밀도 평가**: 파라미터의 표준오차(Standard Error)와 R² 값을 바탕으로 실험의 정밀도와 불확실성을 평가하세요.
        3. **템플릿 준수**: 제공된 템플릿의 구조를 존중하고 학술적인 문체로 내용을 채우세요.
        4. **오차 원인 분석**: 실제 물리적 제약(공기저항, 마찰 등)에 따른 오차 원인을 논리적으로 추론하세요.
        5. **가독성**: 중요한 포인트는 불렛 포인트(-)와 굵은 글씨(**)를 사용하여 강조하세요.

        [한글/LaTeX 출력 예시]
        - "결과는 ( $R^2 = 0.99$ ) 로 나타났으며, 이는 매우 정확한 결과입니다."
        - "마찰 계수 $ \mu $ 와 수직 항력 $ F_N $ 의 관계는..." (X) -> "마찰 계수 $\mu$ 와 수직 항력 $F_N$ 의 관계는..." (O)

        [톤 앤 매너]
        - 명확하고 학구적인 '하십시오체'를 사용하세요.
        - 마크다운 문법(Heading, Bold, List)을 적절히 섞어서 작성하세요.
        """
        
        response = await model.generate_content_async(prompt)
        
        # Check if response was blocked or has no text
        if not response.text:
            # Get detailed error information
            error_details = []
            if hasattr(response, 'prompt_feedback'):
                error_details.append(f"Prompt feedback: {response.prompt_feedback}")
            if hasattr(response, 'candidates') and response.candidates:
                for i, candidate in enumerate(response.candidates):
                    error_details.append(f"Candidate {i} finish_reason: {candidate.finish_reason}")
                    if hasattr(candidate, 'safety_ratings'):
                        error_details.append(f"Candidate {i} safety_ratings: {candidate.safety_ratings}")
            
            error_msg = "AI 응답이 비어있습니다. " + " | ".join(error_details) if error_details else "AI 응답이 생성되지 않았습니다."
            return error_msg
        
        return response.text
    except Exception as e:
        return f"AI 내용 생성 중 오류 발생: {str(e)}"
