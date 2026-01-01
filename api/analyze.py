"""
Easy-Lab-Plotter Analysis API
Vercel Serverless Function for Physics Lab Data Analysis

FastAPI 엔드포인트: POST /api/analyze
"""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import sys
import os
import pandas as pd
import numpy as np

# utils 모듈 경로 추가
sys.path.append(os.path.dirname(__file__))

from utils.curve_fitting import smart_curve_fitting, equation_to_latex
from utils.physics_formulas import get_recommended_formulas
from utils.outlier_detection import remove_outliers

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


# Vercel handler (ASGI app)
# Vercel이 이 변수를 찾아서 실행합니다
handler = app
