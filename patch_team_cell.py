#!/usr/bin/env python3
"""담당팀 셀을 과목 앞에 삽입"""

FILE = '/sessions/lucid-busy-hamilton/mnt/Prototype/cms_stg_prd_release_v1.1.html'

with open(FILE, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find the line with "// 과목" comment in _curTableRow
target_comment = '// ACFC'  # Won't work, need raw bytes

# Just search for the unique pattern in _curTableRow function
insert_idx = None
for i in range(len(lines)):
    # Looking for the subject cell section: starts with comment containing the Korean for 과목
    # and followed by td with text-align:center and cur.subject
    if 'cur.subject' in lines[i] and 'font-size:11px;font-weight:600' in lines[i]:
        # This is the subject display line. Go back to find the comment
        for j in range(i, max(i-5, 0), -1):
            if lines[j].strip().startswith('//') and j > 0 and lines[j-1].strip() == '':
                insert_idx = j
                break
            if lines[j].strip().startswith('//'):
                insert_idx = j
                break
        break

if insert_idx is None:
    print("ERROR: Could not find subject cell")
    exit(1)

print(f"Inserting team cell before line {insert_idx + 1}: {lines[insert_idx].rstrip()[:60]}")

# Build the team cell code
team_cell = [
    "  // \\uB2F4\\uB2F9\\uD300\n",
    "  h += '<td style=\"padding:10px 8px;text-align:center\">';\n",
    "  if(cur.team) {\n",
    "    var _tClr = {'\\uC218\\uD559\\uD300':'#0055B8','\\uC601\\uC5B4\\uD300':'#8944AB','\\uAD6D\\uC5B4\\uD300':'#B35C00','\\uACFC\\uD559\\uD300':'#1B8A3E','\\uC0AC\\uD68C\\uD300':'#D32F2F'};\n",
    "    var _tBg = {'\\uC218\\uD559\\uD300':'#E8F2FF','\\uC601\\uC5B4\\uD300':'#F9F0FF','\\uAD6D\\uC5B4\\uD300':'#FFF8F0','\\uACFC\\uD559\\uD300':'#F0FFF4','\\uC0AC\\uD68C\\uD300':'#FFF0F0'};\n",
    "    var _tc = _tClr[cur.team] || '#636366';\n",
    "    var _tb = _tBg[cur.team] || '#F5F5F7';\n",
    "    h += '<span style=\"font-size:10px;padding:2px 8px;border-radius:10px;background:' + _tb + ';color:' + _tc + ';font-weight:600;white-space:nowrap\">' + cur.team + '</span>';\n",
    "  } else {\n",
    "    h += '<span style=\"font-size:10px;color:#D1D1D6\">\\u2014</span>';\n",
    "  }\n",
    "  h += '</td>';\n",
    "\n",
]

new_lines = lines[:insert_idx] + team_cell + lines[insert_idx:]

with open(FILE, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f"Done! Inserted {len(team_cell)} lines")
print(f"Lines: {len(lines)} -> {len(new_lines)}")
