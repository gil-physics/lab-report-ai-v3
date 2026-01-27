import requests
import json

url = "http://localhost:8000/api/prepare-report-md"
data = {
    "template": "자유낙하와_포물체운동_템플릿",
    "items": [
        {
            "experiment_name": "자유낙하 테스트",
            "data": {"x": [0, 0.5, 1.0], "y": [0, 4.9, 9.8]},
            "x_unit": "s",
            "y_unit": "m/s",
            "raw_x": ["0.0", "0.5", "1.0"],
            "raw_y": ["0.0", "4.9", "9.8"]
        }
    ],
    "use_ai": False # To see the pre-processed template without AI interference
}

try:
    response = requests.post(url, json=data)
    result = response.json()
    md = result.get('markdown', '')
    print(f"Status: {response.status_code}")
    print(f"Markdown length: {len(md)}")
    
    with open("log_md.txt", "w", encoding="utf-8") as f:
        f.write(md)
    print("\n--- Raw Markdown saved to log_md.txt ---")
    
    img_count = md.count("<img")
    print(f"\nImage tag count: {img_count}")
    
    if '<img src=' in md and 'width="600"' in md:
        print("\n✅ SUCCESS: HTML image tag found with adjustable width!")
    else:
        print("\n❌ FAILURE: HTML image tag not found or missing attributes.")
        # Print what it FOUND instead
        if '![' in md:
            print(f"DEBUG: Found markdown image: {md[md.find('!['):md.find('![')+100]}")
        
except Exception as e:
    print(f"Error: {e}")
