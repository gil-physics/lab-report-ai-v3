"""
Unified AI Text Editing Service
Combines simple rewrite and context-aware generation/modification
"""
import os
import google.generativeai as genai



# Preset prompts for quick rewrite access
PRESET_PROMPTS = {
    "formal": "학술적이고 격식있는 문체로 바꿔주세요",
    "concise": "핵심만 남기고 간결하게 줄여주세요",
    "expand": "더 자세하고 구체적으로 설명해주세요",
    "grammar": "문법과 맞춤법을 교정해주세요"
}


async def rewrite_text(text: str, prompt: str, context_before: str = "", context_after: str = "") -> str:
    """
    Rewrite text using Gemini AI with custom prompt and optional context
    
    Args:
        text: The original text to rewrite
        prompt: User's instruction for how to rewrite
        context_before: Optional previous paragraph(s) for context
        context_after: Optional following paragraph(s) for context
    
    Returns:
        Rewritten text
    """
    # Configure API at runtime, not import time
    GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
    if not GOOGLE_API_KEY:
        raise Exception("GOOGLE_API_KEY 환경변수가 설정되지 않았습니다.")
    
    genai.configure(api_key=GOOGLE_API_KEY)
    
    try:
        model = genai.GenerativeModel('gemini-3-pro-preview')
        
        context_section = ""
        if context_before or context_after:
            context_section = f"""
[컨텍스트]
앞 문단: {context_before if context_before else "없음"}
뒷 문단: {context_after if context_after else "없음"}
"""
        
        full_prompt = f"""당신은 물리 실험 보고서 작성을 도와주는 AI 어시스턴트입니다.
{context_section}
사용자 요청: {prompt}

아래 텍스트를 위 요청에 맞게 수정해주세요. 수정된 텍스트만 출력하고, 설명이나 추가 코멘트는 붙이지 마세요.

원본 텍스트:
{text}

수정된 텍스트:"""

        response = model.generate_content(full_prompt)
        
        if response.text:
            return response.text.strip()
        return text
        
    except Exception as e:
        print(f"Rewrite error: {e}")
        raise e


async def generate_section(
    prompt: str,
    context_before: str = "",
    context_after: str = "",
    report_context: dict = None
) -> str:
    """
    Generate a new section/paragraph based on user prompt
    """
    GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
    if not GOOGLE_API_KEY:
        raise Exception("GOOGLE_API_KEY 환경변수가 설정되지 않았습니다.")
    
    genai.configure(api_key=GOOGLE_API_KEY)
    
    try:
        model = genai.GenerativeModel('gemini-3-pro-preview')
        
        ai_prompt = f"""당신은 물리학 실험 보고서 작성 전문가입니다.

[컨텍스트]
앞 문단: {context_before if context_before else "없음"}
뒷 문단: {context_after if context_after else "없음"}

[사용자 요청]
{prompt}

위 요청에 따라 새로운 문단을 작성하세요. 주변 문맥의 톤과 스타일을 유지하고, 학술적이고 전문적인 '하십시오체'를 사용하세요.
마크다운 형식으로 작성하되, 수식이 필요한 경우 LaTeX 문법을 사용하세요 (예: $R^2$, $E=mc^2$).
"""
        
        response = model.generate_content(ai_prompt)
        
        if not response.text:
            return "AI 응답을 생성할 수 없습니다."
        
        return response.text.strip()
        
    except Exception as e:
        error_str = str(e)
        if "429" in error_str or "quota" in error_str.lower():
            return "AI 생성 할당량(Quota)을 초과했습니다. 잠시 후 다시 시도해 주세요."
        raise e


async def modify_section(
    original_text: str,
    instruction: str,
    context_before: str = "",
    context_after: str = ""
) -> str:
    """
    Modify an existing section/paragraph with context awareness
    This is a wrapper around rewrite_text for backward compatibility
    """
    return await rewrite_text(
        text=original_text,
        prompt=instruction,
        context_before=context_before,
        context_after=context_after
    )
