"""
Curve Fitting Utilities
물리 함수 및 스마트 커브 피팅 엔진
"""

import numpy as np
import json
import os
from scipy.optimize import curve_fit
from sklearn.metrics import r2_score

# 현재 파일의 디렉토리 경로
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_DIR = os.path.join(os.path.dirname(CURRENT_DIR), 'config')

# ============================================
# 물리 함수 정의
# ============================================

def linear_func(x, a, b):
    """선형 함수: y = ax + b"""
    return a * x + b

def quadratic_func(x, a, b, c):
    """2차 함수: y = ax² + bx + c"""
    return a * x**2 + b * x + c

def exponential_func(x, a, b, c):
    """지수 함수: y = a·e^(bx) + c"""
    return a * np.exp(b * x) + c

def power_law_func(x, a, b, c):
    """거듭제곱 함수: y = a·x^b + c"""
    return a * np.abs(x)**b + c

def logarithmic_func(x, a, b):
    """로그 함수: y = a·ln(x) + b"""
    return a * np.log(np.abs(x) + 1e-10) + b

def sine_wave_func(x, a, b, c, d):
    """삼각 함수: y = a·sin(bx + c) + d"""
    return a * np.sin(b * x + c) + d

# 함수 매핑
FUNCTION_MAP = {
    'linear': linear_func,
    'quadratic': quadratic_func,
    'exponential': exponential_func,
    'power_law': power_law_func,
    'logarithmic': logarithmic_func,
    'sine': sine_wave_func
}

# ============================================
# 모델 설정 로드
# ============================================

def load_physics_models():
    """models.json 로드 및 함수 매핑"""
    models_path = os.path.join(CONFIG_DIR, 'models.json')
    
    with open(models_path, 'r', encoding='utf-8') as f:
        model_config = json.load(f)
    
    # 함수 추가
    physics_models = {}
    for key, config in model_config.items():
        physics_models[key] = {
            **config,
            'func': FUNCTION_MAP[key]
        }
    
    return physics_models

# 전역 변수로 로드
PHYSICS_MODELS = load_physics_models()

# ============================================
# 스마트 커브 피팅 엔진
# ============================================

def smart_curve_fitting(x_data, y_data, models_to_try=None):
    """
    여러 물리 모델을 자동으로 시도하고 최적 모델 반환 (차수 페널티 적용)
    
    Parameters:
    - x_data: X축 데이터
    - y_data: Y축 데이터
    - models_to_try: 시도할 모델 리스트 (None이면 모두 시도)
    
    Returns:
    - best_model: 최적 모델 정보 딕셔너리
    """
    if models_to_try is None:
        models_to_try = list(PHYSICS_MODELS.keys())
    
    results = []
    n = len(x_data)  # 데이터 개수
    
    for model_key in models_to_try:
        if model_key not in PHYSICS_MODELS:
            continue
        
        model_info = PHYSICS_MODELS[model_key]
        
        try:
            # 초기 추정값 (데이터 기반으로 개선)
            k = model_info['params']  # 파라미터 개수
            
            # 데이터 범위 계산
            y_range = y_data.max() - y_data.min() if len(y_data) > 0 else 1.0
            y_mean = y_data.mean() if len(y_data) > 0 else 0.0
            x_range = x_data.max() - x_data.min() if len(x_data) > 0 else 1.0
            
            # 스마트 초기값 설정
            if model_key == 'linear':
                # polyfit 대신 curve_fit을 사용하여 공분산 행렬(pcov)을 얻음
                p0 = [1.0, 0.0]
                # 더 나은 초기값 시도
                if len(x_data) > 1:
                    coeffs = np.polyfit(x_data, y_data, 1)
                    p0 = [coeffs[0], coeffs[1]]
            elif model_key == 'exponential':
                p0 = [y_range, 0.01, y_data.min()]
            elif model_key == 'power_law':
                p0 = [y_mean, 1.0, 0.0]
            elif model_key == 'logarithmic':
                p0 = [y_range / np.log(x_range) if x_range > 1 else 1.0, y_data.min()]
            elif model_key == 'sine':
                p0 = [y_range/2, 2*np.pi/x_range if x_range > 0 else 1.0, 0.0, y_mean]
            else:
                # 기본 초기값 사용
                p0 = model_info.get('initial_guess', [1.0] * k)
            
            # curve_fit 사용
            popt, pcov = curve_fit(
                model_info['func'], 
                x_data, 
                y_data, 
                p0=p0, 
                maxfev=5000
            )
            y_pred = model_info['func'](x_data, *popt)
            
            # 표준 오차(Standard Error) 계산
            # pcov의 대각 성분의 제곱근
            perr = np.sqrt(np.diag(pcov))
            standard_errors = perr.tolist()

            
            # R² 계산
            r_squared = r2_score(y_data, y_pred)
            
            # AIC (Akaike Information Criterion) 계산
            # 낮을수록 좋음 - 복잡도 페널티 포함
            residuals = y_data - y_pred
            rss = np.sum(residuals**2)  # Residual Sum of Squares
            
            # AIC 계산 (작을수록 좋음)
            aic = n * np.log(rss / n) + 2 * k

            # Adjusted R² 계산
            if n > k + 1:
                adj_r_squared = 1 - (1 - r_squared) * (n - 1) / (n - k - 1)
            else:
                adj_r_squared = r_squared
            
            # 차수 페널티 점수: R² * (1 - 0.02 * 파라미터 개수)
            # 높을수록 좋음 - 복잡한 모델에 대한 페널티 대폭 완화 (0.1 -> 0.02)
            # 2차 함수 등 정확도가 높은 모델이 선형 모델보다 우선 선택되도록 함
            penalty_score = r_squared * (1 - 0.02 * k)
            
            # 선형 모델 가산점 제거 (비선형 모델과 공정하게 경쟁)
            # if model_key == 'linear' and r_squared > 0.90:
            #     penalty_score *= 1.15
            
            
            # 유효한 결과만 저장
            if r_squared > 0 and not np.isnan(r_squared):
                # popt를 안전하게 리스트로 변환
                if isinstance(popt, (list, tuple)):
                    params_list = list(popt)
                elif hasattr(popt, 'tolist'):
                    params_list = popt.tolist()
                else:
                    params_list = list(np.array(popt))
                
                # 시각화용 트렌드라인 포인트 생성 (X 범위 내 50개 점)
                x_min, x_max = x_data.min(), x_data.max()
                x_range = x_max - x_min
                # 약간의 여유(5%) 추가
                x_trend = np.linspace(x_min - x_range*0.05, x_max + x_range*0.05, 50)
                y_trend = model_info['func'](x_trend, *params_list)
                
                trendline = [{"x": float(x), "y": float(y)} for x, y in zip(x_trend, y_trend)]

                results.append({
                    'model_key': model_key,
                    'name': model_info['name'],
                    'func': model_info['func'],
                    'params': params_list,
                    'standard_errors': standard_errors,
                    'equation': model_info['equation'],
                    'description': model_info['description'],
                    'r_squared': r_squared,
                    'adj_r_squared': adj_r_squared,
                    'aic': aic,
                    'param_count': k,
                    'penalty_score': penalty_score,
                    'trendline': trendline
                })
        
        except Exception as e:
            # 피팅 실패 시 로깅 (디버깅용)
            print(f"⚠️ Model '{model_key}' fitting failed: {type(e).__name__}: {str(e)}")
            continue
    
    # 결과가 없으면 None 반환
    if not results:
        return None
    
    # 차수 페널티 점수가 가장 높은 모델 선택 (단순한 모델 선호)
    best_model = max(results, key=lambda x: x['penalty_score'])
    
    # 추가: 모든 결과 반환 (앱에서 활용 가능)
    best_model['all_results'] = sorted(results, key=lambda x: x['penalty_score'], reverse=True)
    
    return best_model

# ============================================
# LaTeX 변환
# ============================================

def equation_to_latex(equation, params):
    """
    텍스트 수식을 LaTeX 형식으로 변환
    
    Parameters:
    - equation: 수식 문자열 (예: "y = ax^2 + bx + c")
    - params: 매개변수 리스트 [a, b, c, ...]
    
    Returns:
    - LaTeX 형식 문자열
    """
    latex_eq = equation
    
    # 매개변수 치환
    param_names = ['a', 'b', 'c', 'd', 'e', 'f']
    for i, param in enumerate(params):
        if i < len(param_names):
            # 소수점 이하 4자리까지 표시
            latex_eq = latex_eq.replace(param_names[i], f"{param:.4f}")
    
    # LaTeX 기호 변환
    latex_eq = latex_eq.replace('*', r'\cdot ')
    latex_eq = latex_eq.replace('^', '^{')
    
    # 거듭제곱 닫기
    import re
    latex_eq = re.sub(r'\^{(\w+)', r'^{\1}', latex_eq)
    
    # 특수 함수
    latex_eq = latex_eq.replace('e^', 'e^')
    latex_eq = latex_eq.replace('ln', r'\ln')
    latex_eq = latex_eq.replace('sin', r'\sin')
    latex_eq = latex_eq.replace('cos', r'\cos')
    
    return latex_eq
