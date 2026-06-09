#!/usr/bin/env python3
"""검색 바 제거 + 모두 닫기/펼치기를 depth 흐름도 영역에 통합 (v2)"""

FILE = '/sessions/lucid-busy-hamilton/mnt/Prototype/cms_stg_prd_release_v1.1.html'

with open(FILE, 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f"Total lines: {len(lines)}")

# === Step 1: Identify lines to remove (search bar section) ===
# Lines 25811-25822 (0-indexed: 25810-25821)
search_start = None
search_end = None

for i in range(len(lines)):
    if '// Search + collapse all' in lines[i]:
        search_start = i
    if search_start is not None and search_end is None:
        # The search section ends with "h += '</div>';" followed by blank line
        if i > search_start and lines[i].strip() == "h += '</div>';" and i + 1 < len(lines) and lines[i+1].strip() == '':
            search_end = i + 1  # include the closing div line
            break

if search_start is None or search_end is None:
    print(f"ERROR: search_start={search_start}, search_end={search_end}")
    exit(1)

print(f"Search section: lines {search_start+1}-{search_end+1}")
for i in range(search_start, search_end + 1):
    print(f"  {i+1}: {lines[i].rstrip()[:80]}")

# === Step 2: Find where to insert toggle (after binding codes, before row close) ===
# The depth flow row is: h += '<div style="display:flex;...margin-bottom:10px...">'
# It contains depth pills + binding codes
# It closes with: h += '</div>'; at line ~25872
# We want to add the toggle button just before that closing </div>

# Find "h += '</div>';" that's on the line right after binding section closes
binding_close = None
for i in range(search_end, min(search_end + 80, len(lines))):
    if '_isCurBound(activeCur)' in lines[i]:
        # Found binding section, now find its closing
        brace_count = 0
        for j in range(i, min(i + 20, len(lines))):
            if '{' in lines[j]:
                brace_count += lines[j].count('{')
            if '}' in lines[j]:
                brace_count -= lines[j].count('}')
            if brace_count <= 0 and j > i:
                binding_close = j
                break
        break

if binding_close is None:
    print("ERROR: binding close not found")
    exit(1)

print(f"\nBinding section closes at line {binding_close+1}: {lines[binding_close].rstrip()[:80]}")

# The next line should be "    h += '</div>';" which closes the depth flow row
row_close = None
for i in range(binding_close + 1, binding_close + 5):
    if "h += '</div>';" in lines[i]:
        row_close = i
        break

if row_close is None:
    print("ERROR: row close not found after binding")
    exit(1)

print(f"Depth flow row closes at line {row_close+1}: {lines[row_close].rstrip()}")

# === Step 3: Build the toggle button code ===
toggle_lines = [
    "\n",
    "    // 모두 닫기/펼치기 토글\n",
    "    h += '<div style=\"margin-left:auto;flex-shrink:0\">';\n",
    "    h += '<button onclick=\"_curToggleAll()\" style=\"display:flex;align-items:center;gap:4px;padding:4px 10px;border:1px solid #E5E5EA;border-radius:6px;background:#fff;font-size:11px;font-weight:500;color:#48484A;cursor:pointer;transition:all .12s\" onmouseenter=\"this.style.borderColor=\\'#34C759\\';this.style.color=\\'#34C759\\'\" onmouseleave=\"this.style.borderColor=\\'#E5E5EA\\';this.style.color=\\'#48484A\\'\">';\n",
    "    h += '<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" style=\"width:12px;height:12px\"><polyline points=\"' + (CUR_TREE_STATE.allCollapsed ? '6 9 12 15 18 9' : '18 15 12 9 6 15') + '\"/></svg>';\n",
    "    h += (CUR_TREE_STATE.allCollapsed ? '\\uBAA8\\uB450 \\uD3BC\\uCE58\\uAE30' : '\\uBAA8\\uB450 \\uB2EB\\uAE30');\n",
    "    h += '</button></div>';\n",
]

# === Step 4: Apply changes ===
# Remove search section (lines search_start to search_end inclusive)
# Insert toggle before row_close

# Adjust row_close index after removal
removed_count = search_end - search_start + 1
adjusted_row_close = row_close - removed_count

new_lines = []
for i in range(len(lines)):
    if search_start <= i <= search_end:
        continue  # skip search section
    if i == row_close:
        # Insert toggle before the closing div
        new_lines.extend(toggle_lines)
    new_lines.append(lines[i])

# Write
with open(FILE, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f"\nDone! Removed {removed_count} lines, inserted {len(toggle_lines)} toggle lines")
print(f"Lines: {len(lines)} -> {len(new_lines)}")

# Verify
result = ''.join(new_lines)
if 'Search + collapse all' in result:
    print("WARNING: Search marker still present!")
else:
    print("OK: Search section removed")

if '_curToggleAll' in result:
    print("OK: Toggle function referenced")
else:
    print("WARNING: Toggle missing!")
