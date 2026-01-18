import os

def load_report_template(template_id):
    if not template_id or template_id == 'none':
        return None
    
    # Template folder: ../report_templates/
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
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
