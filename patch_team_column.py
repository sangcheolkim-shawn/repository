#!/usr/bin/env python3
"""커리큘럼 관리 목록 — 담당팀 컬럼 추가 + 팀 필터/정렬 + Temp 누락 수정"""

FILE = '/sessions/lucid-busy-hamilton/mnt/Prototype/cms_stg_prd_release_v1.1.html'

with open(FILE, 'r', encoding='utf-8') as f:
    src = f.read()

original_len = len(src)
changes = 0

# ═══ 1. CUR_LIST_STATE에 filterGroup 추가 ═══
old_state = "var CUR_LIST_STATE = {search:'', filterStatus:'all', filterTeam:'all', filterBind:'all', filterMeta:'all', sortBy:'name-asc', page:1, perPage:10};"
new_state = "var CUR_LIST_STATE = {search:'', filterStatus:'all', filterTeam:'all', filterGroup:'all', filterBind:'all', filterMeta:'all', sortBy:'name-asc', page:1, perPage:10};"
if old_state in src:
    src = src.replace(old_state, new_state)
    changes += 1
    print("1. CUR_LIST_STATE: filterGroup 추가")
else:
    print("1. SKIP: CUR_LIST_STATE not found")

# ═══ 2. 필터 로직에 팀 필터 추가 ═══
old_filter = "if(S.filterTeam !== 'all' && c.subject !== S.filterTeam) return false;"
new_filter = "if(S.filterTeam !== 'all' && c.subject !== S.filterTeam) return false;\n    if(S.filterGroup !== 'all' && c.team !== S.filterGroup) return false;"
if old_filter in src:
    src = src.replace(old_filter, new_filter)
    changes += 1
    print("2. 필터 로직: 팀 필터 추가")
else:
    print("2. SKIP: filter logic not found")

# ═══ 3. 검색 필터에 팀 필드 추가 ═══
old_search = "var ec = (c.eduCurriculum||'').toLowerCase().indexOf(sq) >= 0;"
new_search = "var ec = (c.eduCurriculum||'').toLowerCase().indexOf(sq) >= 0;\n      var tm = (c.team||'').toLowerCase().indexOf(sq) >= 0;"
if old_search in src:
    src = src.replace(old_search, new_search)
    changes += 1
    print("3. 검색: 팀 필드 검색 추가")
else:
    print("3. SKIP: search field not found")

# Update the search condition to include team
old_search_cond = "if(!nm && !cr && !sj && !gr && !ec && !fmm) return false;"
new_search_cond = "if(!nm && !cr && !sj && !gr && !ec && !tm && !fmm) return false;"
if old_search_cond in src:
    src = src.replace(old_search_cond, new_search_cond)
    changes += 1
    print("3b. 검색 조건: 팀 포함")
else:
    print("3b. SKIP: search condition not found")

# ═══ 4. 정렬에 팀 정렬 추가 ═══
old_sort_team = "if(S.sortBy === 'team') return (a.subject||'').localeCompare(b.subject||'');"
new_sort_team = "if(S.sortBy === 'team') return (a.team||'').localeCompare(b.team||'');\n    if(S.sortBy === 'subject') return (a.subject||'').localeCompare(b.subject||'');"
if old_sort_team in src:
    src = src.replace(old_sort_team, new_sort_team)
    changes += 1
    print("4. 정렬: 팀별/과목별 분리")
else:
    print("4. SKIP: sort team not found")

# ═══ 5. 헤더 배지 Temp → 편집버전 ═══
old_temp_badge = '>Temp ' + "' + tempCount + '"
new_temp_badge = '>\\uD3B8\\uC9D1\\uBC84\\uC804 ' + "' + tempCount + '"
# The actual file has: >Temp ' + tempCount + '
# We need to match: ">Temp ' + tempCount"
old_temp = '">Temp \' + tempCount + \'</span>\';\n'
new_temp = '">\\uD3B8\\uC9D1\\uBC84\\uC804 \' + tempCount + \'</span>\';\n'
if old_temp in src:
    src = src.replace(old_temp, new_temp)
    changes += 1
    print("5. 헤더 배지: Temp -> 편집버전")
else:
    # Try without newline
    old_temp2 = '">Temp \' + tempCount + \'</span>\';'
    new_temp2 = '">\\uD3B8\\uC9D1\\uBC84\\uC804 \' + tempCount + \'</span>\';'
    if old_temp2 in src:
        src = src.replace(old_temp2, new_temp2)
        changes += 1
        print("5. 헤더 배지: Temp -> 편집버전 (alt)")
    else:
        print("5. SKIP: Temp badge not found")

# ═══ 6. 팀 목록 추출 코드 추가 (subjects 옆에) ═══
old_subjects = "var subjects = [];\n  curricula.forEach(function(c) { if(c.subject && subjects.indexOf(c.subject) < 0) subjects.push(c.subject); });"
new_subjects = """var subjects = [];
  curricula.forEach(function(c) { if(c.subject && subjects.indexOf(c.subject) < 0) subjects.push(c.subject); });
  var teams = [];
  curricula.forEach(function(c) { if(c.team && teams.indexOf(c.team) < 0) teams.push(c.team); });
  var _teamColors = {'\\uC218\\uD559\\uD300':'#0055B8','\\uC601\\uC5B4\\uD300':'#8944AB','\\uAD6D\\uC5B4\\uD300':'#B35C00','\\uACFC\\uD559\\uD300':'#1B8A3E','\\uC0AC\\uD68C\\uD300':'#D32F2F'};
  var _teamBgs = {'\\uC218\\uD559\\uD300':'#E8F2FF','\\uC601\\uC5B4\\uD300':'#F9F0FF','\\uAD6D\\uC5B4\\uD300':'#FFF8F0','\\uACFC\\uD559\\uD300':'#F0FFF4','\\uC0AC\\uD68C\\uD300':'#FFF0F0'};"""
if old_subjects in src:
    src = src.replace(old_subjects, new_subjects)
    changes += 1
    print("6. 팀 목록 추출 + 색상 맵 추가")
else:
    print("6. SKIP: subjects extraction not found")

# ═══ 7. 필터 행에 팀 필터 드롭다운 추가 (과목 필터 앞에) ═══
old_filter_subject = """  // \\uACFC\\uBAA9 \\uD544\\uD130
  h += '<select onchange="CUR_LIST_STATE.filterTeam=this.value;CUR_LIST_STATE.page=1;renderCurriculumView()" style="padding:6px 8px;border:1px solid #E5E5EA;border-radius:8px;font-size:11px;background:#fff;cursor:pointer;outline:none">';
  h += '<option value="all"' + (S.filterTeam==='all'?' selected':'') + '>\\uACFC\\uBAA9: \\uC804\\uCCB4</option>';
  subjects.forEach(function(t) {
    h += '<option value="' + t + '"' + (S.filterTeam===t?' selected':'') + '>' + t + '</option>';
  });
  h += '</select>';"""

new_filter_subject = """  // \\uB2F4\\uB2F9\\uD300 \\uD544\\uD130
  h += '<select onchange="CUR_LIST_STATE.filterGroup=this.value;CUR_LIST_STATE.page=1;renderCurriculumView()" style="padding:6px 8px;border:1px solid #E5E5EA;border-radius:8px;font-size:11px;background:#fff;cursor:pointer;outline:none">';
  h += '<option value="all"' + (S.filterGroup==='all'?' selected':'') + '>\\uB2F4\\uB2F9\\uD300: \\uC804\\uCCB4</option>';
  teams.forEach(function(t) {
    var _tc = _teamColors[t] || '#636366';
    h += '<option value="' + t + '"' + (S.filterGroup===t?' selected':'') + ' style="color:' + _tc + '">' + t + '</option>';
  });
  h += '</select>';
  // \\uACFC\\uBAA9 \\uD544\\uD130
  h += '<select onchange="CUR_LIST_STATE.filterTeam=this.value;CUR_LIST_STATE.page=1;renderCurriculumView()" style="padding:6px 8px;border:1px solid #E5E5EA;border-radius:8px;font-size:11px;background:#fff;cursor:pointer;outline:none">';
  h += '<option value="all"' + (S.filterTeam==='all'?' selected':'') + '>\\uACFC\\uBAA9: \\uC804\\uCCB4</option>';
  subjects.forEach(function(t) {
    h += '<option value="' + t + '"' + (S.filterTeam===t?' selected':'') + '>' + t + '</option>';
  });
  h += '</select>';"""

if old_filter_subject in src:
    src = src.replace(old_filter_subject, new_filter_subject)
    changes += 1
    print("7. 팀 필터 드롭다운 추가")
else:
    print("7. SKIP: subject filter not found")

# ═══ 8. 정렬 옵션에 팀별 추가, 기존 과목별 유지 ═══
old_sort_opts = """  h += '<option value="team"' + (S.sortBy==='team'?' selected':'') + '>\\uACFC\\uBAA9\\uBCC4</option>';"""
new_sort_opts = """  h += '<option value="team"' + (S.sortBy==='team'?' selected':'') + '>\\uD300\\uBCC4</option>';
  h += '<option value="subject"' + (S.sortBy==='subject'?' selected':'') + '>\\uACFC\\uBAA9\\uBCC4</option>';"""
if old_sort_opts in src:
    src = src.replace(old_sort_opts, new_sort_opts)
    changes += 1
    print("8. 정렬: 팀별/과목별 옵션 분리")
else:
    print("8. SKIP: sort options not found")

# ═══ 9. 테이블 헤더에 담당팀 추가 (과목 뒤에), 분류 컬럼 제거 ═══
# Add 담당팀 column after 과목
old_th_subject = """h += '<th style="padding:8px 8px;text-align:center;font-size:10px;font-weight:600;color:#8E8E93;white-space:nowrap">\\uACFC\\uBAA9</th>';
    h += '<th style="padding:8px 8px;text-align:center;font-size:10px;font-weight:600;color:#8E8E93;white-space:nowrap">\\uD559\\uB144</th>';"""

new_th_subject = """h += '<th style="padding:8px 8px;text-align:center;font-size:10px;font-weight:600;color:#8E8E93;white-space:nowrap">\\uB2F4\\uB2F9\\uD300</th>';
    h += '<th style="padding:8px 8px;text-align:center;font-size:10px;font-weight:600;color:#8E8E93;white-space:nowrap">\\uACFC\\uBAA9</th>';
    h += '<th style="padding:8px 8px;text-align:center;font-size:10px;font-weight:600;color:#8E8E93;white-space:nowrap">\\uD559\\uB144</th>';"""
if old_th_subject in src:
    src = src.replace(old_th_subject, new_th_subject)
    changes += 1
    print("9. 테이블 헤더: 담당팀 추가")
else:
    print("9. SKIP: table header not found")

# Remove 분류 column header
old_th_meta = """    h += '<th style="padding:8px 8px;text-align:left;font-size:10px;font-weight:600;color:#8E8E93;white-space:nowrap">\\uBD84\\uB958</th>';
    h += '<th style="padding:8px 8px;text-align:right;font-size:10px;font-weight:600;color:#8E8E93;white-space:nowrap">\\uC218\\uC815\\uC77C</th>';"""

new_th_meta = """    h += '<th style="padding:8px 8px;text-align:right;font-size:10px;font-weight:600;color:#8E8E93;white-space:nowrap">\\uC218\\uC815\\uC77C</th>';"""
if old_th_meta in src:
    src = src.replace(old_th_meta, new_th_meta)
    changes += 1
    print("9b. 테이블 헤더: 분류 컬럼 제거")
else:
    print("9b. SKIP: meta header not found")

# ═══ 10. 테이블 행에 담당팀 셀 추가 (과목 뒤에) ═══
# Find the 과목 cell and add team cell before it
old_td_subject = """  // \\uACFC\\uBAA9
  h += '<td style="padding:10px 8px;text-align:center">';
  if(cur.subject) {
    h += '<span style="font-size:11px;font-weight:600;color:#1D1D1F">' + cur.subject + '</span>';
  } else {
    h += '<span style="font-size:10px;color:#D1D1D6">\\u2014</span>';
  }
  h += '</td>';"""

new_td_subject = """  // \\uB2F4\\uB2F9\\uD300
  h += '<td style="padding:10px 8px;text-align:center">';
  if(cur.team) {
    var _tClr = {'\\uC218\\uD559\\uD300':'#0055B8','\\uC601\\uC5B4\\uD300':'#8944AB','\\uAD6D\\uC5B4\\uD300':'#B35C00','\\uACFC\\uD559\\uD300':'#1B8A3E','\\uC0AC\\uD68C\\uD300':'#D32F2F'};
    var _tBg = {'\\uC218\\uD559\\uD300':'#E8F2FF','\\uC601\\uC5B4\\uD300':'#F9F0FF','\\uAD6D\\uC5B4\\uD300':'#FFF8F0','\\uACFC\\uD559\\uD300':'#F0FFF4','\\uC0AC\\uD68C\\uD300':'#FFF0F0'};
    var _tc = _tClr[cur.team] || '#636366';
    var _tb = _tBg[cur.team] || '#F5F5F7';
    h += '<span style="font-size:10px;padding:2px 8px;border-radius:10px;background:' + _tb + ';color:' + _tc + ';font-weight:600;white-space:nowrap">' + cur.team + '</span>';
  } else {
    h += '<span style="font-size:10px;color:#D1D1D6">\\u2014</span>';
  }
  h += '</td>';

  // \\uACFC\\uBAA9
  h += '<td style="padding:10px 8px;text-align:center">';
  if(cur.subject) {
    h += '<span style="font-size:11px;font-weight:600;color:#1D1D1F">' + cur.subject + '</span>';
  } else {
    h += '<span style="font-size:10px;color:#D1D1D6">\\u2014</span>';
  }
  h += '</td>';"""

if old_td_subject in src:
    src = src.replace(old_td_subject, new_td_subject)
    changes += 1
    print("10. 테이블 행: 담당팀 셀 추가")
else:
    print("10. SKIP: subject cell not found")

# ═══ 11. 분류 셀 제거 ═══
old_td_meta = """  // \\uBD84\\uB958
  h += '<td style="padding:10px 8px">';
  var _metaLabels = [];
  if(cur.depths) cur.depths.forEach(function(d){ if(d.metaSchema) d.metaSchema.forEach(function(ms){ if(_metaLabels.length < 3) _metaLabels.push(ms.label||ms.key); }); });
  if(_metaLabels.length > 0) {
    _metaLabels.forEach(function(ml) {
      h += '<span style="font-size:9px;padding:1px 6px;border-radius:3px;background:#FFF8F0;color:#B35C00;border:1px solid #FFD9A8;margin-right:2px;white-space:nowrap">' + ml + '</span>';
    });
    var _totalMeta = 0;
    if(cur.depths) cur.depths.forEach(function(d){ if(d.metaSchema) _totalMeta += d.metaSchema.length; });
    if(_totalMeta > 3) h += '<span style="font-size:9px;color:#8E8E93">+' + (_totalMeta-3) + '</span>';
  } else {
    h += '<span style="font-size:10px;color:#D1D1D6">\\u2014</span>';
  }
  h += '</td>';

  // \\uC218\\uC815\\uC77C"""

new_td_meta = """  // \\uC218\\uC815\\uC77C"""

if old_td_meta in src:
    src = src.replace(old_td_meta, new_td_meta)
    changes += 1
    print("11. 테이블 행: 분류 셀 제거")
else:
    print("11. SKIP: meta cell not found")

# ═══ 12. 분류 필터도 제거 (filterMeta 관련) ═══
# Keep the filter for now — it's optional and doesn't hurt
# Just remove the UI dropdown. Actually let's keep it since user didn't say to remove it.

# ═══ Verify & Write ═══
print(f"\n총 {changes}개 변경 적용")
print(f"원본: {original_len} chars -> 수정: {len(src)} chars (delta: {len(src)-original_len})")

# Verify no remaining header "Temp"
import re
temp_in_header = [m.start() for m in re.finditer(r'>Temp ', src)]
if temp_in_header:
    for pos in temp_in_header:
        ctx = src[max(0,pos-30):pos+40]
        print(f"  WARNING: '>Temp ' at {pos}: ...{ctx[:70]}...")

with open(FILE, 'w', encoding='utf-8') as f:
    f.write(src)

print("\nPatch complete!")
