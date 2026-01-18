from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
import numpy as np
import pandas as pd
import sys
import os

# Ensure utils are importable
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from api.utils.curve_fitting import smart_curve_fitting, equation_to_latex
from api.utils.physics_formulas import get_recommended_formulas
from api.utils.outlier_detection import remove_outliers
from api.services.ai_service import generate_ai_content
from api.services.template_service import load_report_template
from api.services.plot_service import generate_plot_base64, generate_residual_plot_base64

router = APIRouter()

@router.get("/analyze")
async def analyze_get():
    """GET 요청 처리 (정보 제공)"""
    return {
        "message": "Analysis API is running",
        "version": "2.1.0",
        "usage": "Send POST request with data and options"
    }

@router.post("/analyze")
async def analyze(request: Request):
    """물리 실험 데이터 회귀 분석 엔드포인트"""
    try:
        body = await request.json()
        data = body.get("data", {})
        options = body.get("options", {})
        
        x_data = np.array(data.get("x", []))
        y_data = np.array(data.get("y", []))
        
        if len(x_data) == 0 or len(y_data) == 0:
            return JSONResponse(status_code=400, content={"status": "error", "message": "Data cannot be empty"})
        
        if len(x_data) != len(y_data):
            return JSONResponse(status_code=400, content={"status": "error", "message": "X and Y data must have the same length"})
        
        original_count = len(x_data)
        outliers_removed = 0
        
        # 이상치 제거
        remove_outliers_flag = options.get("remove_outliers", False)
        if remove_outliers_flag and len(x_data) >= 4:
            df_temp = pd.DataFrame({"x": x_data, "y": y_data})
            outlier_method = options.get("outlier_method", "iqr")
            outlier_multiplier = options.get("outlier_multiplier", 1.5)
            
            df_cleaned, outliers_removed = remove_outliers(df_temp, "y", method=outlier_method, multiplier=outlier_multiplier)
            x_data = df_cleaned["x"].values
            y_data = df_cleaned["y"].values
        
        if len(x_data) < 2:
            return JSONResponse(status_code=400, content={"status": "error", "message": "Not enough data points after outlier removal"})
        
        # 회귀 분석
        manual_model = options.get("manual_model", None)
        if manual_model:
            best_model = smart_curve_fitting(x_data, y_data, models_to_try=[manual_model])
        else:
            best_model = smart_curve_fitting(x_data, y_data)
        
        if not best_model:
            return JSONResponse(status_code=500, content={"status": "error", "message": "Failed to fit any model"})
        
        # 잔차 계산
        y_pred = best_model['func'](x_data, *best_model['params'])
        residuals = (y_data - y_pred).tolist()
        
        # 공식 추천
        df_for_formulas = pd.DataFrame({"x": x_data, "y": y_data})
        recommended_formulas = get_recommended_formulas(df_for_formulas)
        
        # LaTeX 수식 생성
        latex_equation = equation_to_latex(best_model['equation'], best_model['params'])
        
        return JSONResponse(content={
            "status": "success",
            "best_model": {
                "name": best_model["name"],
                "model_key": best_model["model_key"],
                "r_squared": float(best_model["r_squared"]),
                "adj_r_squared": float(best_model.get("adj_r_squared", best_model["r_squared"])),
                "aic": float(best_model.get("aic", 0)),
                "params": [float(p) for p in best_model["params"]],
                "standard_errors": [float(se) for se in best_model.get("standard_errors", [])],
                "equation": best_model["equation"],
                "latex": latex_equation
            },
            "residuals": residuals,
            "recommended_formulas": recommended_formulas[:5],
            "data_info": {
                "original_count": int(original_count),
                "used_count": int(len(x_data)),
                "outliers_removed": int(outliers_removed)
            }
        })
    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})

@router.post("/prepare-report-md")
async def prepare_report_md(request: Request):
    """여러 분석 항목을 하나의 마크다운 보고서 초안으로 병합하며 그래프 이미지를 Base64로 포함합니다."""
    try:
        body = await request.json()
        template = body.get('template', 'none')
        items = body.get('items', [])
        use_ai = body.get('use_ai', False)
        
        if not items:
            return JSONResponse(status_code=400, content={"status": "error", "message": "No analysis items provided"})

        md_content = ["# 물리 실험 보고서"]
        if template and template != 'none':
            md_content.append(f"## {template.replace('_', ' ')}")
        
        template_content = load_report_template(template)
        
        # Theory Section
        if template_content:
            theory_part = template_content
            if "토의 및 결론" in template_content: theory_part = template_content.split("토의 및 결론", 1)[0]
            elif "## 결론" in template_content: theory_part = template_content.split("## 결론", 1)[0]
            if "1. 실험결과분석" in theory_part: theory_part = theory_part.split("1. 실험결과분석")[0]
            md_content.append(theory_part.strip())
            md_content.append("---")

        md_content.append("## 1. 실험 결과 및 분석")
        
        for idx, item in enumerate(items):
            exp_name = item.get('experiment_name', f'실험 {idx+1}')
            analysis = item.get('analysis', {})
            data = item.get('data', {})
            x_label = item.get('x_label', 'X')
            y_label = item.get('y_label', 'Y')
            
            # Regression Data for plotting
            x_vals = np.array(data.get('x', []))
            y_vals = np.array(data.get('y', []))
            y_pred_vals = np.array(data.get('y_predicted', [])) if 'y_predicted' in data else None
            residuals_vals = np.array(data.get('residuals', [])) if 'residuals' in data else None
            
            md_content.append(f"### 1.{idx+1}. {exp_name}")
            md_content.append("")  # Blank line before table
            
            # Summary Table
            md_content.append("| 항목 | 내용 |")
            md_content.append("| :--- | :--- |")
            md_content.append(f"| 최적 모델 | {analysis.get('model', 'N/A')} |")
            md_content.append(f"| 회귀 수식 | ${analysis.get('latex', analysis.get('equation', 'N/A'))}$ |")
            md_content.append(f"| 결정계수 ($R^2$) | {analysis.get('r_squared', 0):.4f} |")
            
            if 'params' in analysis and analysis['params']:
                p_vals = analysis['params']
                p_errs = analysis.get('standard_errors', [0.0] * len(p_vals))
                param_names = ['a', 'b', 'c', 'd', 'e']
                params_md = [f"{param_names[i] if i < 5 else f'p{i}'} = {v:.4f} (± {e:.4f})" for i, (v, e) in enumerate(zip(p_vals, p_errs))]
                md_content.append(f"| 추정 파라미터 | {', '.join(params_md)} |")
            
            md_content.append("")  # Blank line after table
            
            # 🖼️ Generate Base64 Graphs
            if len(x_vals) > 0:
                md_content.append("")  # Blank line before images
                reg_plot_b64 = generate_plot_base64(x_vals, y_vals, y_pred_vals, x_label, y_label, f"{exp_name} 회귀 분석")
                md_content.append(f"![{exp_name} 회귀 분석 그래프]({reg_plot_b64})")
                md_content.append("")  # Blank line after image
                
                if residuals_vals is not None:
                    res_plot_b64 = generate_residual_plot_base64(x_vals, residuals_vals, x_label, y_label, f"{exp_name} 잔차 분석")
                    md_content.append(f"![{exp_name} 잔차 그래프]({res_plot_b64})")
                    md_content.append("")  # Blank line after image
            
            # AI Discussion
            if use_ai:
                md_content.append("")  # Blank line before AI section
                md_content.append(f"#### 📊 AI 실험 결과 분석 및 고찰 ({exp_name})")
                ai_content = await generate_ai_content(exp_name, analysis, template, template_content)
                md_content.append(ai_content)
                md_content.append("")  # Blank line after AI section

        # Footer Section
        if template_content:
            footer_part = ""
            if "토의 및 결론" in template_content: footer_part = "## 2. 토의 및 결론\n" + template_content.split("토의 및 결론", 1)[1]
            elif "## 결론" in template_content: footer_part = "## 2. 결론\n" + template_content.split("## 결론", 1)[1]
            if footer_part:
                md_content.append("---")
                md_content.append(footer_part.strip())

        return JSONResponse(content={"status": "success", "markdown": "\n\n".join(md_content)})
    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})

@router.get("/health")
async def health():
    return {"status": "healthy", "service": "analysis"}
