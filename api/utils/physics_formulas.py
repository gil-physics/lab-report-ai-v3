"""
Physics Formulas Utilities
물리 공식 추천 및 계산 시스템
"""

import json
import os

# 현재 파일의 디렉토리 경로
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_DIR = os.path.join(os.path.dirname(CURRENT_DIR), 'config')

# ============================================
# 설정 로드
# ============================================

def load_physics_keywords():
    """physics_keywords.json 로드"""
    keywords_path = os.path.join(CONFIG_DIR, 'physics_keywords.json')
    
    with open(keywords_path, 'r', encoding='utf-8') as f:
        return json.load(f)

PHYSICS_KEYWORDS = load_physics_keywords()

# ============================================
# 추천 공식 라이브러리
# ============================================

RECOMMENDED_FORMULAS = {
    # ===== A. 역학 (Mechanics) =====
    'force_newton': {
        'name': '힘 (뉴턴 제2법칙)',
        'category': '역학',
        'required_vars': ['mass', 'acceleration'],
        'formula': 'mass * acceleration',
        'result_name': '힘_calc',
        'unit': 'N',
        'description': 'F = m·a (뉴턴 제2법칙)'
    },
    'momentum': {
        'name': '운동량 (Momentum)',
        'category': '역학',
        'required_vars': ['mass', 'velocity'],
        'formula': 'mass * velocity',
        'result_name': '운동량_calc',
        'unit': 'kg·m/s',
        'description': 'p = m·v (운동량)'
    },
    'impulse': {
        'name': '충격량 (Impulse)',
        'category': '역학',
        'required_vars': ['force', 'time'],
        'formula': 'force * time',
        'result_name': '충격량_calc',
        'unit': 'N·s',
        'description': 'J = F·Δt (충격량 = 힘 × 시간)'
    },
    'torque': {
        'name': '돌림힘/토크 (Torque)',
        'category': '역학',
        'required_vars': ['radius', 'force'],
        'formula': 'radius * force',
        'result_name': '돌림힘_calc',
        'unit': 'N·m',
        'description': 'τ = r·F (돌림힘, 각도 90° 가정)'
    },
    'centripetal_force': {
        'name': '구심력 (Centripetal Force)',
        'category': '역학',
        'required_vars': ['mass', 'velocity', 'radius'],
        'formula': 'mass * velocity**2 / radius',
        'result_name': '구심력_calc',
        'unit': 'N',
        'description': 'F_c = m·v²/r (원운동하는 물체에 작용하는 구심력)'
    },
    'kinetic_energy': {
        'name': '운동에너지 (Kinetic Energy)',
        'category': '역학',
        'required_vars': ['mass', 'velocity'],
        'formula': '0.5 * mass * velocity**2',
        'result_name': '운동에너지_calc',
        'unit': 'J',
        'description': 'K = ½m·v² (운동에너지)'
    },
    
    # ===== B. 회전 운동 (Rotation) =====
    'moment_of_inertia_point': {
        'name': '관성모멘트_점입자/링',
        'category': '회전',
        'required_vars': ['mass', 'radius'],
        'formula': 'mass * radius**2',
        'result_name': '관성모멘트_점입자_calc',
        'unit': 'kg·m²',
        'description': 'I = m·r² (점 입자 또는 링)'
    },
    'moment_of_inertia_disk': {
        'name': '관성모멘트_원판/실린더',
        'category': '회전',
        'required_vars': ['mass', 'radius'],
        'formula': '0.5 * mass * radius**2',
        'result_name': '관성모멘트_원판_calc',
        'unit': 'kg·m²',
        'description': 'I = 0.5·m·r² (원판 또는 실린더, 중심축)'
    },
    'moment_of_inertia_sphere': {
        'name': '관성모멘트_구',
        'category': '회전',
        'required_vars': ['mass', 'radius'],
        'formula': '0.4 * mass * radius**2',
        'result_name': '관성모멘트_구_calc',
        'unit': 'kg·m²',
        'description': 'I = 0.4·m·r² (고체 구, 중심축)'
    },
    'moment_of_inertia_rod': {
        'name': '관성모멘트_막대',
        'category': '회전',
        'required_vars': ['mass', 'length'],
        'formula': '(1/12) * mass * length**2',
        'result_name': '관성모멘트_막대_calc',
        'unit': 'kg·m²',
        'description': 'I = (1/12)·m·L² (막대, 중심축)'
    },
    
    # ===== C. 진동 (Oscillation) =====
    'simple_pendulum': {
        'name': '단진자 주기 (Simple Pendulum)',
        'category': '진동',
        'required_vars': ['length'],
        'formula': '2 * 3.14159 * (length / 9.8)**0.5',
        'result_name': '단진자주기_calc',
        'unit': 's',
        'description': 'T = 2π√(L/g) (단진자의 주기, g=9.8m/s²)'
    },
    'spring_constant_from_force': {
        'name': '용수철 상수 (복원력)',
        'category': '진동',
        'required_vars': ['force', 'displacement'],
        'formula': 'force / displacement',
        'result_name': '용수철상수_calc',
        'unit': 'N/m',
        'description': 'k = F/x (훅의 법칙)'
    },
    
    # ===== D. 파동 (Waves) =====
    'wave_speed': {
        'name': '파동 속도',
        'category': '파동',
        'required_vars': ['wavelength', 'frequency'],
        'formula': 'wavelength * frequency',
        'result_name': '파동속도_calc',
        'unit': 'm/s',
        'description': 'v = λ·f (파동의 기본 식)'
    },
    
    # ===== E. 전자기학 (Electromagnetism) =====
    'ohms_law_voltage': {
        'name': '옴의 법칙 (전압)',
        'category': '전자기',
        'required_vars': ['current', 'resistance'],
        'formula': 'current * resistance',
        'result_name': '전압_calc',
        'unit': 'V',
        'description': 'V = I·R (옴의 법칙)'
    },
    'ohms_law_resistance': {
        'name': '옴의 법칙 (저항)',
        'category': '전자기',
        'required_vars': ['voltage', 'current'],
        'formula': 'voltage / current',
        'result_name': '저항_calc',
        'unit': 'Ω',
        'description': 'R = V/I (저항 구하기)'
    },
    'electric_power': {
        'name': '전력 (Electric Power)',
        'category': '전자기',
        'required_vars': ['voltage', 'current'],
        'formula': 'voltage * current',
        'result_name': '전력_calc',
        'unit': 'W',
        'description': 'P = V·I (전기 전력)'
    },
}

# ============================================
# 공식 추천 함수
# ============================================

def find_variable_in_columns(var_type, columns):
    """
    컬럼 이름에서 특정 물리 변수가 있는지 검색
    
    Parameters:
    - var_type: 검색할 변수 타입 (예: 'mass', 'velocity')
    - columns: DataFrame 컬럼 리스트
    
    Returns:
    - 매칭된 컬럼명 or None
    """
    if var_type not in PHYSICS_KEYWORDS:
        return None
    
    keywords = PHYSICS_KEYWORDS[var_type]
    columns_lower = [col.lower() for col in columns]
    
    for keyword in keywords:
        keyword_lower = keyword.lower()
        for i, col_lower in enumerate(columns_lower):
            if keyword_lower in col_lower:
                return columns[i]
    
    return None

def get_recommended_formulas(df):
    """
    데이터프레임의 컬럼을 분석하여 추천 가능한 공식 리스트 반환
    
    Parameters:
    - df: 분석할 DataFrame
    
    Returns:
    - 추천 공식 리스트 (딕셔너리 형태)
    """
    available_vars = {}
    columns = df.columns.tolist()
    
    # 각 물리 변수가 데이터에 있는지 확인
    for var_type in PHYSICS_KEYWORDS.keys():
        matched_col = find_variable_in_columns(var_type, columns)
        if matched_col:
            available_vars[var_type] = matched_col
    
    # 추천 가능한 공식 필터링
    recommended = []
    for formula_key, formula_info in RECOMMENDED_FORMULAS.items():
        required = formula_info['required_vars']
        
        # 모든 필수 변수가 있는지 확인
        if all(var in available_vars for var in required):
            # 매칭된 컬럼명 추가
            formula_with_cols = formula_info.copy()
            formula_with_cols['matched_columns'] = {var: available_vars[var] for var in required}
            formula_with_cols['formula_key'] = formula_key
            recommended.append(formula_with_cols)
    
    return recommended
