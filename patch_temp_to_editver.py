#!/usr/bin/env python3
"""Temp → 편집버전 용어 전면 교체 패치
사용자에게 보이는 UI 레이블만 교체, 내부 변수명/상태값은 유지
"""
import re, sys

FILE = '/sessions/lucid-busy-hamilton/mnt/Prototype/cms_stg_prd_release_v1.1.html'

with open(FILE, 'r', encoding='utf-8') as f:
    src = f.read()

original = src

# ── 1. 데이터: 커리큘럼 설명 텍스트 ──
src = src.replace(
    "desc:'수학 기초 커리큐럼 v4 Temp'",
    "desc:'수학 기초 커리큐럼 v4 편집버전'"
)

# ── 2. 커리큘럼 수신 뷰: Temp 생성 버튼 ──
src = src.replace(
    "Temp 생성 <span",
    "편집버전 생성 <span"
)

# ── 3. _crCreateTemp 함수 내 confirm 메시지 (두 곳 - 수신 뷰 + 커리큘럼 뷰) ──
src = src.replace(
    "이미 Temp 작업이 존재합니다",
    "이미 편집버전이 존재합니다"
)
src = src.replace(
    "기존 Temp를 열겠습니까?",
    "기존 편집버전을 열겠습니까?"
)
src = src.replace(
    "Temp 커리큐럼을 생성합니다",
    "편집버전을 생성합니다"
)
src = src.replace(
    "Temp 작업을 생성합니다",
    "편집버전을 생성합니다"
)

# ── 4. _curDeleteDraft: alert 메시지 ──
# "초안 또는 Temp 상태의 커리큘럼만 삭제할 수 있습니다"
# This is in unicode-escaped form in the HTML
src = src.replace(
    "Temp 상태의",
    "편집버전 상태의"
)
# Also check for the unicode-escaped version
src = src.replace(
    "\\u0054\\u0065\\u006d\\u0070",  # unlikely but check
    "\\ud3b8\\uc9d1\\ubc84\\uc804"
)

# ── 5. 서비스 콘텐츠 뷰: "Temp 작업 진행 중" ──
src = src.replace(
    "Temp 작업 진행 중",
    "편집버전 작업 진행 중"
)

# ── 6. 커리큘럼 리스트: Temp count badge ──
src = src.replace(
    "'Temp ' + tempCount",
    "'편집버전 ' + tempCount"
)

# ── 7. 커리큘럼 리스트: filter dropdown option ──
src = src.replace(
    ">Temp</option>",
    ">편집버전</option>"
)

# ── 8. 커리큘럼 리스트 카드: Temp badge ──
# "font-weight:600">Temp</span>" — appears in list cards
src = src.replace(
    'font-weight:600">Temp</span>',
    'font-weight:600">편집버전</span>'
)

# ── 9. 커리큘럼 에디터: Temp badge in header ──
src = src.replace(
    'border:1px solid #FFD9A8">Temp</span>',
    'border:1px solid #FFD9A8">편집버전</span>'
)

# ── 10. 에디터: "구조 변경 → v{n} Temp 생성" 버튼 ──
src = src.replace(
    "Temp 생성</button>",
    "편집버전 생성</button>"
)

# ── 11. 에디터: "Temp 삭제" 버튼 ──
src = src.replace(
    "Temp 삭제</button>",
    "편집버전 삭제</button>"
)

# ── 12. 에디터: "서비스 중 — v{n} Temp가 생성됩니다" ──
src = src.replace(
    "Temp가 생성됩니다",
    "편집버전이 생성됩니다"
)

# ── 13. 에디터: sourceVersion 복제 텍스트 ──
src = src.replace(
    "에서 복제</span>",
    "에서 생성</span>"
)

# ── 14. 커리큘럼 수신 뷰: _crCreateTemp 내 Temp 관련 (button title) ──
# Already handled by replacements above

# ── 15. Check for any remaining user-facing "Temp" with Korean context ──
# "Temp" as standalone word in alert/confirm (unicode-escaped in JS)
src = src.replace(
    "\\u0054emp",  # \Temp in escaped form
    "\\ud3b8\\uc9d1\\ubc84\\uc804"
)

# ── Verify ──
if src == original:
    print("ERROR: No changes made!")
    sys.exit(1)

with open(FILE, 'w', encoding='utf-8') as f:
    f.write(src)

# Count remaining user-facing "Temp" (excluding Template, _isTemp, tempCount, etc.)
remaining = []
for i, line in enumerate(src.split('\n'), 1):
    # Skip lines with Template, tempCount, _isTemp, _hasTempForCur, etc.
    if 'emplate' in line or '_isTemp' in line or 'tempCount' in line or '_hasTemp' in line or '_curDeleteDraft' in line:
        continue
    if 'Temp' in line and ('status' not in line or "=== 'temp'" not in line):
        # Check if it's a user-facing Temp
        if "'temp'" not in line and 'temp\'' not in line and 'expandedTemp' not in line:
            remaining.append(f"  Line {i}: {line.strip()[:100]}")

print("Patch applied successfully!")
if remaining:
    print(f"\nPotential remaining 'Temp' references ({len(remaining)}):")
    for r in remaining:
        print(r)
else:
    print("No remaining user-facing 'Temp' found.")
