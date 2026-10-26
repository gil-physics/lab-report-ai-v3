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
from api.services.ai_service import generate_ai_content, is_ai_error
from api.services.template_service import load_report_template
from api.services.plot_service import generate_plot_base64, generate_residual_plot_base64, generate_plot_buffer, generate_residual_plot_buffer
from api.services.storage_service import upload_plot_to_supabase
import traceback
import uuid

router = APIRouter()

NOT_ENOUGH_DATA_MESSAGE = "숫자 데이터 쌍이 2개 이상 필요합니다. 1단계에서 데이터 범위에 빈 행이나 글자가 섞여 있지 않은지 확인하십시오."


def clean_xy(x_values, y_values):
    """Convert to float (None, '', text → NaN) and keep only pairs where both x and y are finite."""
    x = pd.to_numeric(pd.Series(list(x_values), dtype=object), errors="coerce").to_numpy(dtype=float)
    y = pd.to_numeric(pd.Series(list(y_values), dtype=object), errors="coerce").to_numpy(dtype=float)
    n = min(len(x), len(y))
    x, y = x[:n], y[:n]
    mask = np.isfinite(x) & np.isfinite(y)
    return x[mask], y[mask]

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
        
        x_data = data.get("x", [])
        y_data = data.get("y", [])
        raw_x = data.get("raw_x", [])
        raw_y = data.get("raw_y", [])
        x_unit = data.get("x_unit", "")
        y_unit = data.get("y_unit", "")
        
        if len(x_data) == 0 or len(y_data) == 0:
            return JSONResponse(status_code=400, content={"status": "error", "message": "Data cannot be empty"})
        
        if len(x_data) != len(y_data):
            return JSONResponse(status_code=400, content={"status": "error", "message": "X and Y data must have the same length"})

        # Drop blank / non-numeric rows (e.g. empty lines or a second header inside the selected range)
        x_data, y_data = clean_xy(x_data, y_data)
        if len(x_data) < 2:
            return JSONResponse(status_code=400, content={"status": "error", "message": NOT_ENOUGH_DATA_MESSAGE})

        # 유효숫자 계산 (Least Precise Rule)
        from api.utils.significant_figures import count_sig_figs, format_with_uncertainty
        
        min_sig_figs = 10  # Default large number
        for val_list in [raw_x, raw_y]:
            for v in val_list:
                if v:
                    try:
                        count = count_sig_figs(str(v))
                        if count > 0:
                            min_sig_figs = min(min_sig_figs, count)
                    except:
                        pass
        
        if min_sig_figs == 10: min_sig_figs = 3 # Fallback
        
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
                "latex": latex_equation,
                "trendline": best_model.get("trendline", []),
                "min_sig_figs": min_sig_figs,
                "x_unit": x_unit,
                "y_unit": y_unit
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
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})

@router.post("/prepare-report-md")
async def prepare_report_md(request: Request):
    """여러 분석 항목을 하나의 마크다운 보고서 초안으로 병합하며 그래프 이미지를 Base64로 포함합니다."""
    try:
        body = await request.json()
        template = body.get('template', 'none')
        items = body.get('items', [])
        use_ai = body.get('use_ai', False)
        
        print(f"DEBUG: prepare_report_md called with {len(items)} items, use_ai={use_ai}")
        
        if not items:
            return JSONResponse(status_code=400, content={"status": "error", "message": "No analysis items provided"})

        md_content = ["# 물리 실험 보고서"]
        if template and template != 'none':
            md_content.append(f"## {template.replace('_', ' ')}")
        
        template_content = load_report_template(template)
        
        template_content = load_report_template(template)

        md_content.append("## 1. 실험 결과 및 분석")

        reported_items = 0
        ai_warnings = []

        for idx, item in enumerate(items):
            exp_name = item.get('experiment_name', f'실험 {idx+1}')
            data = item.get('data', {})
            x_label = item.get('x_label', 'X')
            y_label = item.get('y_label', 'Y')
            x_unit = item.get('x_unit', '')
            y_unit = item.get('y_unit', '')
            raw_x = item.get('raw_x', [])
            raw_y = item.get('raw_y', [])
            
            # Regression Data (Raw) - keep only valid numeric (x, y) pairs
            x_vals, y_vals = clean_xy(data.get('x', []), data.get('y', []))

            if len(x_vals) < 2:
                continue

            # 🛠️ ALWAYS use Python to recalculate analysis for the final report (Source of Truth)
            # This ensures Step 3 is high-quality even if Step 2 was a fast frontend preview.
            analysis = smart_curve_fitting(x_vals, y_vals)
            if not analysis:
                continue
            
            # 유효숫자 및 오차 전파 (Least Precise Rule)
            from api.utils.significant_figures import count_sig_figs, format_with_uncertainty, format_value_sigfigs
            
            min_sig_figs = 10
            for val_list in [raw_x, raw_y]:
                for v in val_list:
                    if v:
                        try:
                            count = count_sig_figs(str(v))
                            if count > 0:
                                min_sig_figs = min(min_sig_figs, count)
                        except:
                            pass
            if min_sig_figs == 10: min_sig_figs = 3
            
            analysis['min_sig_figs'] = min_sig_figs
            analysis['x_unit'] = x_unit
            analysis['y_unit'] = y_unit
                
            # LaTeX 수식 생성
            latex_equation = equation_to_latex(analysis['equation'], analysis['params'])
            
            # Prediction for plotting
            y_pred_vals = analysis['func'](x_vals, *analysis['params'])
            residuals_vals = y_vals - y_pred_vals
            
            reported_items += 1
            md_content.append(f"### 1.{idx+1}. {exp_name}")
            md_content.append("")  # Blank line before table
            
            # Summary Table
            table_rows = [
                "| 항목 | 내용 |",
                "| :--- | :--- |",
                f"| 최적 모델 | {analysis.get('name', 'N/A')} |",
                f"| 회귀 수식 | {latex_equation.replace('$', '')} |",
                f"| 결정계수 (R²) | {analysis.get('r_squared', 0):.4f} |",
                f"| X 단위 | {x_unit if x_unit else 'N/A'} |",
                f"| Y 단위 | {y_unit if y_unit else 'N/A'} |",
                f"| 유효숫자 기준 | {min_sig_figs} digits |"
            ]
            
            if 'params' in analysis and analysis['params']:
                p_vals = analysis['params']
                p_errs = analysis.get('standard_errors', [0.0] * len(p_vals))
                param_names = ['a', 'b', 'c', 'd', 'e']
                # format_with_uncertainty uses sigfig-aware rounding for the error and value
                params_md = [f"{param_names[i] if i < 5 else f'p{i}'} = {format_with_uncertainty(v, e, sig_figs=2)}" for i, (v, e) in enumerate(zip(p_vals, p_errs))]
                table_rows.append(f"| 추정 파라미터 | {', '.join(params_md)} |")
            
            md_content.append("\n".join(table_rows))
            md_content.append("")
            
            # Extract settings from item if available (passed from Step 2)
            # body.items structure: [{data, x_label, y_label, x_range, y_range, is_log_scale, ...}]
            x_range = item.get('x_range')
            y_range = item.get('y_range')
            is_log = item.get('is_log_scale', False)

            # 🖼️ Generate plots and upload to Supabase Storage
            plot_filename = f"report_graph_{uuid.uuid4()}.png"
            res_filename = f"report_residual_{uuid.uuid4()}.png"
            
            # Generate plot buffers
            plot_buffer = generate_plot_buffer(x_vals, y_vals, y_pred_vals, x_label, y_label, f"{exp_name} 회귀 분석", x_range=x_range, y_range=y_range, is_log=is_log)
            res_buffer = generate_residual_plot_buffer(x_vals, residuals_vals, x_label, y_label, f"{exp_name} 잔차 분석", x_range=x_range)
            
            # Upload to Supabase and get public URLs
            plot_url = upload_plot_to_supabase(plot_buffer, plot_filename)
            res_url = upload_plot_to_supabase(res_buffer, res_filename)
            
            # Capture the first plot URL to return for context usage
            if 'first_plot_url' not in locals():
                first_plot_url = plot_url
            
            # AI Discussion
            if use_ai:
                # 📊 원본 데이터 통계 계산 추가
                raw_data_summary = None
                if len(x_vals) > 0 and len(y_vals) > 0:
                    raw_data_summary = {
                        "count": int(len(x_vals)),
                        "x_min": float(np.min(x_vals)),
                        "x_max": float(np.max(x_vals)),
                        "y_min": float(np.min(y_vals)),
                        "y_max": float(np.max(y_vals)),
                        "y_mean": float(np.mean(y_vals)),
                        "y_std": float(np.std(y_vals))
                    }

                # 🛠️ 템플릿 내 그래프 플레이스홀더를 실제 HTML 이미지 태그로 치환 (사이즈 조절 가능하도록)
                processed_template = template_content
                if processed_template:
                    # HTML 이미지 태그 (Supabase 공개 URL 사용)
                    img_html = f'<img src="{plot_url}" width="600" align="center" />'
                    res_html = f'<img src="{res_url}" width="600" align="center" />'
                    
                    # 다양한 플레이스홀더 패턴 대응
                    processed_template = processed_template.replace("![실험 그래프]({{graph_path}})", img_html)
                    processed_template = processed_template.replace("![잔차도]({{residual_path}})", res_html)
                    processed_template = processed_template.replace("{{graph_path}}", img_html)
                    processed_template = processed_template.replace("{{residual_path}}", res_html)
                    # 자유낙하 등 특정 템플릿 대응
                    processed_template = processed_template.replace("{{graph_trial1_05}}", img_html)

                md_content.append("")  # Blank line before AI section
                md_content.append(f"#### 📊 AI 실험 결과 분석 및 고찰 ({exp_name})")
                
                # Get CSV raw data from request body (if provided by frontend)
                csv_raw_data = body.get('csv_raw_data', None)
                
                ai_content = await generate_ai_content(exp_name, analysis, template, processed_template, raw_data_summary, csv_raw_data)
                if is_ai_error(ai_content):
                    ai_warnings.append(ai_content.strip())

                # 🖼️ AI 응답의 그래프 플레이스홀더를 실제 이미지로 치환 (Supabase URL 사용)
                img_html = f'<img src="{plot_url}" width="600" align="center" />'
                res_html = f'<img src="{res_url}" width="600" align="center" />'
                
                ai_content = ai_content.replace("{{GRAPH_REGRESSION}}", f"\n\n{img_html}\n\n")
                ai_content = ai_content.replace("{{GRAPH_RESIDUAL}}", f"\n\n{res_html}\n\n")
                
                md_content.append(ai_content)
                md_content.append("")  # Blank line after AI section

        if reported_items == 0:
            return JSONResponse(status_code=400, content={"status": "error", "message": NOT_ENOUGH_DATA_MESSAGE})

        final_markdown = "\n\n".join(md_content)
        print(f"DEBUG: Report generated successfully. Total length: {len(final_markdown)} chars")

        return JSONResponse(content={
            "status": "success",
            "markdown": final_markdown,
            "plot_url": locals().get('first_plot_url', None),
            "ai_warnings": ai_warnings
        })
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})

@router.get("/health")
async def health():
    return {"status": "healthy", "service": "analysis"}
