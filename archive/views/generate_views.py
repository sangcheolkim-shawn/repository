import os

VIEWS = [
    ("workflow",         "SPEC_01_작업진행보드"),
    ("work-config",      "SPEC_02_작업설정"),
    ("content-register", "SPEC_03_콘텐츠등록"),
    ("review",           "SPEC_04_검수관리"),
    ("deploy",           "SPEC_05_배포관리"),
    ("service-bind",     "SPEC_06_과목코드연결"),
    ("service-content",  "SPEC_07_서비스콘텐츠관리"),
    ("form-manage",      "SPEC_08_입력양식관리"),
    ("curriculum",       "SPEC_09_커리큘럼관리"),
    ("scoring-sim",      "SPEC_10_채점시뮬레이션"),
    ("batch-receive",    "SPEC_11_외부수신현황"),
    ("settings",         "SPEC_12_시스템관리"),
]

TEMPLATE = '''<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>{title} — CMS v8.5</title>
<style>
body {{ margin:0; overflow:hidden; }}
iframe {{ width:1440px; height:900px; border:none; display:block; }}
</style>
</head>
<body>
<iframe id="proto" src="../cms_stg_prd_v8.5.html"></iframe>
<script>
document.getElementById('proto').addEventListener('load', function() {{
  var w = this.contentWindow;
  try {{ w.switchView('{view}'); }} catch(e) {{
    setTimeout(function(){{ w.switchView('{view}'); }}, 300);
  }}
}});
</script>
</body>
</html>
'''

outdir = os.path.dirname(os.path.abspath(__file__))
for view_id, spec_name in VIEWS:
    filename = f"{spec_name}.html"
    content = TEMPLATE.format(view=view_id, title=spec_name.replace("_", " "))
    filepath = os.path.join(outdir, filename)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  Created: {filename}")

print(f"\nDone — {len(VIEWS)} view files generated in {outdir}")
