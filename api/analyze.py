"""
Easy-Lab-Plotter Analysis API
Vercel Serverless Function for Physics Lab Data Analysis

FastAPI 엔드포인트: POST /api/analyze
"""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import sys
import os
import pandas as pd
import numpy as np
from io import BytesIO
from datetime import datetime
from urllib.parse import quote
import matplotlib
matplotlib.use('Agg')  # Non-GUI backend for server
import matplotlib.pyplot as plt
import google.generativeai as genai
from dotenv import load_dotenv
import platform

# Load environment variables from .env.local
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env.local'))

# Configure Gemini API
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)

# Font configuration for Korean support in matplotlib
system_os = platform.system()
if system_os == "Windows":
    plt.rcParams['font.family'] = 'Malgun Gothic'
elif system_os == "Darwin":
    plt.rcParams['font.family'] = 'AppleGothic'
else:
    plt.rcParams['font.family'] = 'NanumGothic'
plt.rcParams['axes.unicode_minus'] = False  # Fix minus sign tofu

def load_report_template(template_id):
    if not template_id or template_id == 'none':
        return None
    
    # Template folder: ../report_templates/
    base_dir = os.path.dirname(os.path.dirname(__file__))
    template_path = os.path.join(base_dir, 'report_templates', f"{template_id}_템플릿.md")
    
    if not os.path.exists(template_path):
        # Try alternate check without "_템플릿" just in case
        template_path_alt = os.path.join(base_dir, 'report_templates', f"{template_id}.md")
        if os.path.exists(template_path_alt):
            template_path = template_path_alt
        else:
            return None
            
    try:
        with open(template_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
            # Find the starting point: "⚠️ **LLM 사용 안내**"
            usage_guide_marker = '⚠️ **LLM 사용 안내**'
            if usage_guide_marker in content:
                parts = content.split(usage_guide_marker, 1)
                content = usage_guide_marker + parts[1]
            
            # If marker not found, still try to strip leading YAML if it exists
            elif content.startswith('---'):
                parts = content.split('---', 2)
                if len(parts) >= 3:
                    content = parts[2].strip()
                    
            return content
    except Exception as e:
        print(f"Error loading template {template_id}: {e}")
        return None



def enforce_spacing_rules(text):
    """
    최소한의 가독성 보정:
    수식($) 앞뒤에만 약간의 공백을 주어 렌더링 안정성을 높입니다.
    """
    if not text:
        return text
    
    import re
    # $ 수식 앞뒤에 글자가 붙어있으면 한 칸 띔 (AI가 놓쳤을 경우를 대비한 최소 보정)
    text = re.sub(r'(?<=[^$\s])(\$+)', r' \1', text)
    text = re.sub(r'(\$+)(?=[^$\s])', r'\1 ', text)
    
    return text


# Define AI Content Generator Helper
async def generate_ai_content(exp_name, analysis, template_id, template_content=None, raw_data_summary=None):
    if not GOOGLE_API_KEY:
        return "AI API 키가 설정되지 않아 내용을 생성할 수 없습니다."
    
    try:
        model = genai.GenerativeModel('gemini-3-flash-preview')
        
        # Build prompt using template if available
        template_context = ""
        if template_content:
            template_context = f"\n[참고할 보고서 템플릿 구조]\n{template_content}\n"

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
        당신은 대학교 물리학 실험 조교(TA)이자 전문 연구원입니다. 아래 **실제 실험 데이터 통계**와 분석 결과를 바탕으로 보고서의 '결과 분석 및 토의' 섹션을 작성하세요.
        {template_context}
        
        {data_desc}

        [분석 결과 정보]
        실험 주제: {exp_name}
        적용된 물리 이론: {template_id if template_id != 'none' else '기본 물리학 법칙'}
        회귀 모델: {analysis.get('name', analysis.get('model', 'N/A'))}
        도출된 수식: {analysis.get('equation', 'N/A')}
        결정계수 (R²): {analysis.get('r_squared', 0):.4f}
        {params_text}

        [작성 가이드라인]
        1. **구체적 수치 인용 (필수)**: 추상적인 표현 대신 위 '실험 데이터 통계 요약'에 있는 **구체적인 수치(최대/최소/평균/표준편차 등)**를 문장에 반드시 인용하세요. 
           - {example_citation if example_citation else '데이터 정밀도와 신뢰성을 수치적으로 제시하십시오.'}
        2. **수식 표현 규칙 (매우 중요)**: 
           - **외부 공백 필수**: 수식 기호($)와 앞뒤 글자 사이에는 **반드시 공백을 한 칸** 두세요. (예: ( $R^2$ ), 값은 $x$ 이다)
           - **내부 공백 금지**: 수식 기호($) 바로 안쪽에는 공백이 없어야 합니다. (예: $R^2$, $E=mc^2$)
           - **독립된 수식($$)**: 복잡한 수식은 앞뒤로 빈 줄을 두어 독립된 줄에 작성하세요.
        3. **데이터 정밀도 평가**: 표준오차와 R² 값을 바탕으로 실험의 정밀도를 수치적으로 평가하세요.
        4. **오차 원인 분석**: 실제 물리적 제약에 따른 오차 원인을 논리적으로 추론하세요.
        5. **가독성**: 중요한 포인트는 불렛 포인트(-)와 굵은 글씨(**)를 사용하여 강조하세요.

        [톤 앤 매너]
        - 전문적이고 학구적인 '하십시오체'를 사용하세요.
        - 마크다운 문법을 적절히 활용하세요.
        """
        
        response = await model.generate_content_async(prompt)
        # 🛡️ 'Safety Filter' 적용: AI가 띄어쓰기 규칙을 어겨도 코드가 자동으로 강제 보정
        return enforce_spacing_rules(response.text)
    except Exception as e:
        return f"AI 내용 생성 중 오류 발생: {str(e)}"

# utils 모듈 경로 추가
sys.path.append(os.path.dirname(__file__))

from utils.curve_fitting import smart_curve_fitting, equation_to_latex
from utils.physics_formulas import get_recommended_formulas
from utils.outlier_detection import remove_outliers
from services.plot_service import generate_plot_file, generate_residual_plot_file

app = FastAPI(
    title="Easy-Lab-Plotter Analysis API",
    version="2.0.0",
    description="Physics lab data regression analysis and formula recommendation"
)

# CORS 설정 (모든 오리진 허용 - 프로덕션에서는 제한 권장)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/analyze")
async def analyze_get():
    """GET 요청 처리 (정보 제공)"""
    return {
        "message": "Analysis API is running",
        "version": "2.0.0",
        "usage": "Send POST request with data and options",
        "example": {
            "data": {
                "x": [0, 1, 2, 3, 4],
                "y": [0, 9.8, 19.6, 29.4, 39.2]
            },
            "options": {
                "remove_outliers": True,
                "manual_model": None
            }
        }
    }


@app.post("/api/analyze")
async def analyze(request: Request):
    """
    물리 실험 데이터 회귀 분석 엔드포인트
    
    Request Body:
    {
        "data": {"x": [...], "y": [...]},
        "options": {
            "remove_outliers": bool,
            "manual_model": str | null,
            "outlier_method": str (default: "iqr"),
            "outlier_multiplier": float (default: 1.5)
        }
    }
    
    Response:
    {
        "status": "success",
        "best_model": {...},
        "residuals": [...],
        "recommended_formulas": [...],
        "data_info": {...}
    }
    """
    try:
        body = await request.json()
        
        # 데이터 추출
        data = body.get("data", {})
        options = body.get("options", {})
        
        x_data = np.array(data.get("x", []))
        y_data = np.array(data.get("y", []))
        
        # 데이터 검증
        if len(x_data) == 0 or len(y_data) == 0:
            return JSONResponse(
                status_code=400,
                content={"status": "error", "message": "Data cannot be empty"}
            )
        
        if len(x_data) != len(y_data):
            return JSONResponse(
                status_code=400,
                content={"status": "error", "message": "X and Y data must have the same length"}
            )
        
        original_count = len(x_data)
        outliers_removed = 0
        
        # 이상치 제거
        remove_outliers_flag = options.get("remove_outliers", False)
        if remove_outliers_flag and len(x_data) >= 4:
            # DataFrame 생성
            df_temp = pd.DataFrame({"x": x_data, "y": y_data})
            
            outlier_method = options.get("outlier_method", "iqr")
            outlier_multiplier = options.get("outlier_multiplier", 1.5)
            
            df_cleaned, outliers_removed = remove_outliers(
                df_temp, 
                "y", 
                method=outlier_method,
                multiplier=outlier_multiplier
            )
            
            x_data = df_cleaned["x"].values
            y_data = df_cleaned["y"].values
        
        # 최소 데이터 포인트 체크
        if len(x_data) < 2:
            return JSONResponse(
                status_code=400,
                content={
                    "status": "error",
                    "message": "Not enough data points after outlier removal (minimum 2 required)"
                }
            )
        
        # 회귀 분석
        manual_model = options.get("manual_model", None)
        
        if manual_model:
            best_model = smart_curve_fitting(x_data, y_data, models_to_try=[manual_model])
        else:
            best_model = smart_curve_fitting(x_data, y_data)
        
        if not best_model:
            return JSONResponse(
                status_code=500,
                content={
                    "status": "error",
                    "message": "Failed to fit any model to the data"
                }
            )
        
        # 잔차 계산
        y_pred = best_model['func'](x_data, *best_model['params'])
        residuals = (y_data - y_pred).tolist()
        
        # 공식 추천 (DataFrame 필요)
        df_for_formulas = pd.DataFrame({"x": x_data, "y": y_data})
        recommended_formulas = get_recommended_formulas(df_for_formulas)
        
        # 공식 정보 간소화 (상위 5개만)
        simplified_formulas = []
        for formula in recommended_formulas[:5]:
            simplified_formulas.append({
                "name": formula["name"],
                "description": formula["description"],
                "matched_columns": formula["matched_columns"],
                "formula": formula["formula"],
                "result_name": formula["result_name"]
            })
        
        # LaTeX 수식 생성
        latex_equation = equation_to_latex(best_model['equation'], best_model['params'])
        
        # 응답 데이터 구성
        response_data = {
            "status": "success",
            "best_model": {
                "name": best_model["name"],
                "model_key": best_model["model_key"],
                "r_squared": float(best_model["r_squared"]),
                "adj_r_squared": float(best_model.get("adj_r_squared", best_model["r_squared"])),
                "aic": float(best_model.get("aic", 0)),
                "params": [float(p) for p in best_model["params"]],
                "standard_errors": [float(se) for se in best_model.get("standard_errors", [])], # Add standard errors
                "equation": best_model["equation"],
                "latex": latex_equation
            },
            "residuals": residuals,
            "recommended_formulas": simplified_formulas,
            "data_info": {
                "original_count": int(original_count),
                "used_count": int(len(x_data)),
                "outliers_removed": int(outliers_removed)
            }
        }
        
        # 다른 모델 비교 정보 (있으면 추가)
        if "all_results" in best_model and len(best_model["all_results"]) > 1:
            alternative_models = []
            for result in best_model["all_results"][:5]:
                alternative_models.append({
                    "name": result["name"],
                    "model_key": result["model_key"],
                    "r_squared": float(result["r_squared"]),
                    "adj_r_squared": float(result.get("adj_r_squared", result["r_squared"])),
                    "aic": float(result.get("aic", 0))
                })
            response_data["alternative_models"] = alternative_models
        
        return JSONResponse(content=response_data)
    
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": str(e),
                "type": type(e).__name__
            }
        )


# Health check endpoint
@app.get("/api/health")
async def health():
    """Health check endpoint for monitoring"""
    return {"status": "healthy", "service": "analysis"}


# Markdown Report Preparation endpoint
@app.post("/api/prepare-report-md")
async def prepare_report_md(request: Request):
    """
    여러 분석 항목을 하나의 마크다운 보고서 초안으로 병합합니다.
    """
    try:
        body = await request.json()
        
        template = body.get('template', 'none')
        items = body.get('items', [])
        use_ai = body.get('use_ai', False)
        
        if not items:
            return JSONResponse(status_code=400, content={"status": "error", "message": "No analysis items provided"})

        md_content = ["# 물리 실험 보고서\n"]
        
        if template and template != 'none':
            template_name = template.replace('_', ' ')
            md_content.append(f"## {template_name}\n")
        
        # Load template content
        template_content = load_report_template(template)
        
        # Theory Section (from template)
        if template_content:
            theory_part = template_content
            if "토의 및 결론" in template_content:
                theory_part = template_content.split("토의 및 결론", 1)[0]
            elif "## 결론" in template_content:
                theory_part = template_content.split("## 결론", 1)[0]
            
            if "1. 실험결과분석" in theory_part:
                theory_part = theory_part.split("1. 실험결과분석")[0]
            
            md_content.append(theory_part.strip())
            md_content.append("\n---\n")

        # Determine base URL for static files (plots)
        host = request.headers.get("host", "localhost:8000")
        protocol = "https" if request.headers.get("x-forwarded-proto") == "https" else "http"
        base_url = f"{protocol}://{host}"

        # Analysis Results Section
        md_content.append("## 1. 실험 결과 및 분석\n")
        
        for idx, item in enumerate(items):
            exp_name = item.get('experiment_name', f'실험 {idx+1}')
            data = item.get('data', {})
            x_label = item.get('x_label', 'X')
            y_label = item.get('y_label', 'Y')
            
            # Regression Data (Raw)
            x_vals = np.array(data.get('x', []), dtype=float)
            y_vals = np.array(data.get('y', []), dtype=float)
            
            mask = ~np.isnan(x_vals) & ~np.isnan(y_vals)
            x_vals = x_vals[mask]
            y_vals = y_vals[mask]

            print(f"DEBUG [prepare-report-md]: Data count={len(x_vals)}, X={x_label}")

            if len(x_vals) < 2:
                continue

            # 🛠️ ALWAYS use Python to recalculate analysis for the final report (Source of Truth)
            analysis = smart_curve_fitting(x_vals, y_vals)
            if not analysis:
                continue
                
            # LaTeX 수식 생성
            latex_equation = equation_to_latex(analysis['equation'], analysis['params'])
            
            # Prediction for plotting
            y_pred_vals = analysis['func'](x_vals, *analysis['params'])
            residuals_vals = y_vals - y_pred_vals
            
            md_content.append(f"### 1.{idx+1}. {exp_name}\n")
            
            # Summary Table
            md_content.append("| 항목 | 내용 |")
            md_content.append("| :--- | :--- |")
            md_content.append(f"| 최적 모델 | {analysis.get('name', 'N/A')} |")
            md_content.append(f"| 회귀 수식 | ${latex_equation}$ |")
            md_content.append(f"| 결정계수 ($R^2$) | {analysis.get('r_squared', 0):.4f} |")
            
            # Parameters
            if 'params' in analysis and analysis['params']:
                p_vals = analysis['params']
                p_errs = analysis.get('standard_errors', [0.0] * len(p_vals))
                param_names = ['a', 'b', 'c', 'd', 'e']
                
                params_md = []
                for i, (val, err) in enumerate(zip(p_vals, p_errs)):
                    p_name = param_names[i] if i < len(param_names) else f"p{i}"
                    params_md.append(f"{p_name} = {val:.4f} (± {err:.4f})")
                
                md_content.append(f"| 추정 파라미터 | {', '.join(params_md)} |")
            
            md_content.append("\n")
            
            # 🖼️ Generate Static Graph Files using Matplotlib (Quality over Speed)
            plot_filename = f"report_graph_{uuid.uuid4()}.png"
            res_filename = f"report_residual_{uuid.uuid4()}.png"
            
            # Directory setup
            plots_dir = os.path.join(os.path.dirname(__file__), "static", "plots")
            if not os.path.exists(plots_dir):
                os.makedirs(plots_dir)
            
            # Save files
            generate_plot_file(x_vals, y_vals, os.path.join(plots_dir, plot_filename), y_pred_vals, x_label, y_label, f"{exp_name} 회귀 분석")
            generate_residual_plot_file(x_vals, residuals_vals, os.path.join(plots_dir, res_filename), x_label, y_label, f"{exp_name} 잔차 분석")
            
            # Markdown links
            md_content.append(f"![{exp_name} 회귀 분석 그래프]({base_url}/plots/{plot_filename})\n")
            md_content.append(f"![{exp_name} 잔차 그래프]({base_url}/plots/{res_filename})\n")

            # Capture the first plot URL to return for context usage
            if 'first_plot_url' not in locals():
                first_plot_url = f"{base_url}/plots/{plot_filename}"
            
            # AI Discussion
            if use_ai:
                # 📊 원본 데이터 통계 계산 추가
                raw_data_summary = {
                    "count": int(len(x_vals)),
                    "x_min": float(np.min(x_vals)),
                    "x_max": float(np.max(x_vals)),
                    "y_min": float(np.min(y_vals)),
                    "y_max": float(np.max(y_vals)),
                    "y_mean": float(np.mean(y_vals)),
                    "y_std": float(np.std(y_vals))
                }

                md_content.append(f"#### 📊 AI 실험 결과 분석 및 고찰 ({exp_name})\n")
                ai_content = await generate_ai_content(exp_name, analysis, template, template_content, raw_data_summary)
                md_content.append(ai_content)
                md_content.append("\n")

        # Footer Section (from template)
        if template_content:
            footer_part = ""
            if "토의 및 결론" in template_content:
                footer_part = "## 2. 토의 및 결론\n" + template_content.split("토의 및 결론", 1)[1]
            elif "## 결론" in template_content:
                footer_part = "## 2. 결론\n" + template_content.split("## 결론", 1)[1]
            
            if footer_part:
                md_content.append("\n---\n")
                md_content.append(footer_part.strip())

        return JSONResponse(content={
            "status": "success",
            "markdown": "\n".join(md_content),
            "plot_url": locals().get('first_plot_url', None)
        })
        
    except Exception as e:
        print(f"Error preparing report MD: {str(e)}")
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})



        
    except Exception as e:
        print(f"Error generating report: {str(e)}")
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": f"Report generation failed: {str(e)}"}
        )


# Vercel handler (ASGI app)
# Vercel이 이 변수를 찾아서 실행합니다
handler = app
