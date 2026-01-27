"""
Section Editing Service
Provides AI-powered section generation and modification for report editing
"""
import os
import google.generativeai as genai


async def generate_section(
    prompt: str,
    context_before: str = "",
    context_after: str = "",
    report_context: dict = None
) -> str:
    """
    Generate a new section/paragraph based on user prompt
    
    Args:
        prompt: User's instruction for what to generate
        context_before: Previous paragraph(s) for context
        context_after: Following paragraph(s) for context
        report_context: Additional context about the report
        
    Returns:
        Generated text
    """
    
    GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
    if not GOOGLE_API_KEY:
        return "AI API 키가 설정되지 않아 내용을 생성할 수 없습니다."
    
    genai.configure(api_key=GOOGLE_API_KEY)
    
    try:
        model = genai.GenerativeModel('gemini-3-flash-preview')
        
        ai_prompt = f"""
당신은 물리학 실험 보고서 작성 전문가입니다.

[컨텍스트]
앞 문단: {context_before if context_before else "없음"}
뒷 문단: {context_after if context_after else "없음"}

[사용자 요청]
{prompt}

위 요청에 따라 새로운 문단을 작성하세요. 주변 문맥의 톤과 스타일을 유지하고, 학술적이고 전문적인 '하십시오체'를 사용하세요.
마크다운 형식으로 작성하되, 수식이 필요한 경우 LaTeX 문법을 사용하세요 (예: $R^2$, $E=mc^2$).
"""
        
        response = await model.generate_content_async(ai_prompt)
        
        if not response.text:
            return "AI 응답을 생성할 수 없습니다."
        
        return response.text.strip()
        
    except Exception as e:
        error_str = str(e)
        if "429" in error_str or "quota" in error_str.lower():
            return "AI 생성 할당량(Quota)을 초과했습니다. 잠시 후 다시 시도해 주세요."
        return f"AI 내용 생성 중 오류 발생: {error_str}"


async def modify_section(
    original_text: str,
    instruction: str,
    context_before: str = "",
    context_after: str = "",
    report_context: dict = None
) -> str:
    """
    Modify an existing section/paragraph based on user instruction
    
    Args:
        original_text: Original paragraph to modify
        instruction: User's instruction for how to modify
        context_before: Previous paragraph(s) for context
        context_after: Following paragraph(s) for context
        report_context: Additional context about the report
        
    Returns:
        Modified text
    """
    
    GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
    if not GOOGLE_API_KEY:
        return "AI API 키가 설정되지 않아 내용을 생성할 수 없습니다."
    
    genai.configure(api_key=GOOGLE_API_KEY)
    
    try:
        model = genai.GenerativeModel('gemini-3-flash-preview')
        
        ai_prompt = f"""
당신은 물리학 실험 보고서 작성 전문가입니다.

[컨텍스트]
앞 문단: {context_before if context_before else "없음"}
뒷 문단: {context_after if context_after else "없음"}

[원본 텍스트]
{original_text}

[수정 지시사항]
{instruction}

위 지시사항에 따라 원본 텍스트를 수정하세요. 
- 주변 문맥의 톤과 스타일을 유지하세요
- 학술적이고 전문적인 '하십시오체'를 사용하세요
- 마크다운 형식으로 작성하되, 수식이 필요한 경우 LaTeX 문법을 사용하세요 (예: $R^2$, $E=mc^2$)
- 수정된 텍스트만 반환하고 부가 설명은 제외하세요
"""
        
        response = await model.generate_content_async(ai_prompt)
        
        if not response.text:
            return "AI 응답을 생성할 수 없습니다."
        
        return response.text.strip()
        
    except Exception as e:
        error_str = str(e)
        if "429" in error_str or "quota" in error_str.lower():
            return "AI 생성 할당량(Quota)을 초과했습니다. 잠시 후 다시 시도해 주세요."
        return f"AI 내용 생성 중 오류 발생: {error_str}"
