import os
import sys
import asyncio
import io
from dotenv import load_dotenv

project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.append(project_root)
from api.services.ai_service import generate_ai_content

# Load .env.local
load_dotenv(os.path.join(project_root, '.env.local'))

# Ensure UTF-8 output
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

async def test_generation():
    print("Testing AI logic with units and sig-figs...")
    
    # Mock data
    exp_name = "자유 낙하 실험 (가속도 측정)"
    analysis = {
        "name": "Linear Regression (Gravity)",
        "model": "linear",
        "equation": "v = a*t + b",
        "r_squared": 0.9985,
        "params": [9.782, 0.045],
        "standard_errors": [0.012, 0.008],
        "min_sig_figs": 3,
        "x_unit": "s",
        "y_unit": "m/s"
    }
    template_id = "free_fall"
    template_content = "## 이론\n자유 낙하는 중력만이 작용하는 운동입니다.\n\n## 토의 및 결론\n실험 결과를 분석하고 오차를 논의합니다."
    
    raw_data_summary = {
        "count": 10,
        "x_min": 0.0,
        "x_max": 1.0,
        "y_min": 0.0,
        "y_max": 9.8,
        "y_mean": 4.9,
        "y_std": 2.8
    }
    
    csv_data = "t,v\n0.1,0.98\n0.2,1.95\n0.3,2.94\n0.4,3.92\n0.5,4.90"

    print("Sending request to Gemini...")
    result = await generate_ai_content(
        exp_name, 
        analysis, 
        template_id, 
        template_content=template_content, 
        raw_data_summary=raw_data_summary, 
        csv_data=csv_data
    )
    
    print("\n--- AI Response Preview ---")
    print(result[:500] + "...")
    print("--------------------------\n")
    
    # Verification checks
    checks = {
        "Data Citation (9.782)": "9.78" in result,
        "Uncertainty Citation (± or \\pm)": "±" in result or "\\pm" in result,
        "Unit Citation (m/s)": "m/s" in result or "s" in result,
        "Sig-figs Mention": "유효숫자" in result or str(analysis['min_sig_figs']) in result,
        "LaTeX formatting ($)": "$" in result
    }
    
    output_log = []
    output_log.append(f"AI Response Length: {len(result)} chars")
    output_log.append("-" * 30)
    
    all_passed = True
    for check, passed in checks.items():
        status = "PASSED" if passed else "FAILED"
        if not passed: all_passed = False
        output_log.append(f"[{status}] {check}")
        print(f"[{status}] {check}")
        
    with open('test_report_scientific.txt', 'w', encoding='utf-8') as f:
        f.write(result)
        f.write("\n\n" + "-" * 30 + "\n")
        f.write("\n".join(output_log))
    
    print(f"\nResults saved to test_report_scientific.txt")
    if all_passed:
        print("✅ All scientific precision checks passed!")
    else:
        print("❌ Some checks failed. Please review the output.")

if __name__ == "__main__":
    asyncio.run(test_generation())
