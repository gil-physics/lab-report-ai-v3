"""
Section Editing API Routes
Handles AI-powered section generation and modification
"""
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
import sys
import os

# Ensure services are importable
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from api.services.edit_service import generate_section, modify_section, rewrite_text, PRESET_PROMPTS

router = APIRouter()


@router.post("/generate")
async def generate_new_section(request: Request):
    """
    Generate a new section based on user prompt
    
    Request body:
    {
        "prompt": "오차 원인 분석 추가",
        "context_before": "...",
        "context_after": "...",
        "report_context": {...}  # optional
    }
    
    Response:
    {
        "status": "success",
        "generated_text": "..."
    }
    """
    try:
        body = await request.json()
        
        prompt = body.get("prompt", "")
        if not prompt:
            return JSONResponse(
                status_code=400,
                content={"status": "error", "message": "Prompt is required"}
            )
        
        context_before = body.get("context_before", "")
        context_after = body.get("context_after", "")
        report_context = body.get("report_context", None)
        
        generated_text = await generate_section(
            prompt=prompt,
            context_before=context_before,
            context_after=context_after,
            report_context=report_context
        )
        
        return JSONResponse(content={
            "status": "success",
            "generated_text": generated_text
        })
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": str(e)}
        )


@router.post("/modify")
async def modify_existing_section(request: Request):
    """
    Modify an existing section based on user instruction
    
    Request body:
    {
        "original_text": "...",
        "instruction": "더 학술적으로 수정",
        "context_before": "...",
        "context_after": "...",
        "report_context": {...}  # optional
    }
    
    Response:
    {
        "status": "success",
        "modified_text": "..."
    }
    """
    try:
        body = await request.json()
        
        original_text = body.get("original_text", "")
        instruction = body.get("instruction", "")
        
        if not original_text or not instruction:
            return JSONResponse(
                status_code=400,
                content={"status": "error", "message": "original_text and instruction are required"}
            )
        
        context_before = body.get("context_before", "")
        context_after = body.get("context_after", "")
        report_context = body.get("report_context", None)
        
        modified_text = await modify_section(
            original_text=original_text,
            instruction=instruction,
            context_before=context_before,
            context_after=context_after,
            report_context=report_context
        )
        
        return JSONResponse(content={
            "status": "success",
            "modified_text": modified_text
        })
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": str(e)}
        )


@router.post("/rewrite")
async def rewrite_text_endpoint(request: Request):
    """
    Simple text rewrite with custom or preset prompt
    
    Request body:
    {
        "text": "원본 텍스트...",
        "prompt": "학술적으로 수정해주세요" | null,
        "preset": "formal" | "concise" | "expand" | "grammar" | null
    }
    
    Either prompt or preset is required
    """
    try:
        body = await request.json()
        
        text = body.get("text", "")
        if not text:
            return JSONResponse(
                status_code=400,
                content={"status": "error", "message": "Text is required"}
            )
        
        prompt = body.get("prompt")
        preset = body.get("preset")
        
        # Use preset prompt if specified
        if preset and preset in PRESET_PROMPTS:
            prompt = PRESET_PROMPTS[preset]
        
        if not prompt:
            return JSONResponse(
                status_code=400,
                content={"status": "error", "message": "Either prompt or preset is required"}
            )
        
        result = await rewrite_text(text, prompt)
        
        return JSONResponse(content={
            "status": "success",
            "rewritten_text": result,
            "original_text": text
        })
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": str(e)}
        )


@router.get("/presets")
async def get_presets():
    """Get available preset prompts"""
    return {
        "presets": [
            {"key": k, "label": v} for k, v in PRESET_PROMPTS.items()
        ]
    }


@router.get("/health")
async def edit_health():
    """Health check for edit service"""
    return {
        "status": "healthy",
        "service": "edit"
    }

