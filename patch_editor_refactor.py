#!/usr/bin/env python3
"""커리큘럼 편집기 통합 리팩토링 패치
1. 스텝 인디케이터 제거
2. "편집" 버튼 제거 → 상태별 액션 바 (저장/검수요청 흐름)
3. 기본정보 인라인 편집 (input)
4. 헤더 커리큘럼명 인라인 편집
5. Temp 워크플로우 스테퍼 제거 → 상태 바 교체
6. 양식 연결 현황 → 양식 연결 관리 (depth별 칩 + 추가/제거)
7. 트리 alias 컬럼 제거
8. 스텝 CTA 제거
9. 편집버전 삭제 하단 이동
"""
import sys

FILE = '/sessions/lucid-busy-hamilton/mnt/Prototype/cms_stg_prd_release_v1.1.html'

with open(FILE, 'r', encoding='utf-8') as f:
    src = f.read()

original = src
changes = 0

def replace_once(old, new, label=""):
    global src, changes
    if old not in src:
        print(f"WARNING: not found — {label or old[:60]}")
        return False
    src = src.replace(old, new, 1)
    changes += 1
    print(f"OK: {label or old[:50]}...")
    return True

# ═══════════════════════════════════════
#  1. 에디터 스텝 인디케이터 제거
# ═══════════════════════════════════════
replace_once(
    "  h += _renderStepIndicator('curriculum');\n\n  // Header with back",
    "  // Header with back",
    "Remove step indicator from editor"
)

# ═══════════════════════════════════════
#  2. 헤더 커리큘럼명 → 인라인 편집 input
# ═══════════════════════════════════════
replace_once(
    "h += '<span style=\"font-size:16px;font-weight:600;color:#1D1D1F\">' + (activeCur ? activeCur.name : '') + '</span>';",
    "h += '<input type=\"text\" value=\"' + (activeCur ? activeCur.name : '') + '\" onchange=\"_curUpdateBasicInfo(\\x27' + activeId + '\\x27,\\x27name\\x27,this.value)\" style=\"font-size:16px;font-weight:600;color:#1D1D1F;border:1px solid transparent;border-radius:6px;padding:2px 6px;background:transparent;outline:none;min-width:180px\" onfocus=\"this.style.borderColor=\\x27#B3D7FF\\x27;this.style.background=\\x27#fff\\x27\" onblur=\"this.style.borderColor=\\x27transparent\\x27;this.style.background=\\x27transparent\\x27\">';",
    "Header name → inline input"
)

# ═══════════════════════════════════════
#  3. 액션 버튼 전면 교체
#     Active: 편집버전 생성
#     편집버전: 저장 + 검수 요청(비활성) — 삭제는 하단
#     Draft: 저장
# ═══════════════════════════════════════
OLD_ACTIONS = """  // Action buttons — state-based
  h += '<div style="margin-left:auto;display:flex;gap:8px;flex-shrink:0">';
  if(_isActive) {
    // Active: read-only actions
    h += '<button onclick="alert(\\'\\ub808\\uc774\\ube14 \\uc218\\uc815 \\ubaa8\\ub4dc\\ub85c \\uc804\\ud658\\ud569\\ub2c8\\ub2e4.\\\\n\\uc774\\ub984/\\uc124\\uba85 \\ub4f1\\uc744 \\ubcc0\\uacbd\\ud560 \\uc218 \\uc788\\uc2b5\\ub2c8\\ub2e4.\\')" style="padding:6px 14px;border-radius:8px;border:1px solid #E5E5EA;background:#fff;color:#636366;font-size:12px;font-weight:500;cursor:pointer">\\u270f\\ufe0f \\ub808\\uc774\\ube14 \\uc218\\uc815</button>';
    h += '<button onclick="_curVersionUp(\\'' + activeId + '\\')" style="padding:6px 14px;border-radius:8px;border:none;background:#0071E3;color:#fff;font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:4px;white-space:nowrap">';
    h += '<svg viewBox="0 0 16 16" fill="none" stroke="#fff" stroke-width="1.5" style="width:12px;height:12px"><path d="M8 12V4M5 7l3-3 3 3"/></svg>\\uad6c\\uc870 \\ubcc0\\uacbd \\u2192 v' + _nextVer + ' \\ud3b8\\uc9d1\\ubc84\\uc804 \\uc0dd\\uc131</button>';
  } else if(_isTemp) {
    // Temp: edit actions
    h += '<button onclick="_curEditStructure(\\'' + activeId + '\\')" style="padding:6px 14px;border-radius:8px;border:1px solid #8944AB;background:#F9F0FF;color:#8944AB;font-size:12px;font-weight:500;cursor:pointer">\\u2727 \\ud3b8\\uc9d1</button>';
    h += '<button onclick="alert(\\'\\uac80\\uc218 \\uc694\\uccad\\uc744 \\ubcf4\\ub0c5\\ub2c8\\ub2e4.\\\\n\\uac80\\uc218\\uc790\\uac00 \\ud655\\uc778 \\ud6c4 \\ubc30\\ud3ec\\ud569\\ub2c8\\ub2e4.\\')" style="padding:6px 14px;border-radius:8px;border:none;background:#34C759;color:#fff;font-size:12px;font-weight:600;cursor:pointer">\\uac80\\uc218 \\uc694\\uccad</button>';
    h += '<button onclick="_curDeleteDraft(\\'' + activeId + '\\')" style="padding:6px 14px;border-radius:8px;border:1px solid #FFCCCC;background:#FFF5F5;color:#C62828;font-size:12px;font-weight:500;cursor:pointer">\\ud3b8\\uc9d1\\ubc84\\uc804 \\uc0ad\\uc81c</button>';
  } else {
    // Draft: free actions
    h += '<button onclick="_curEditStructure(\\'' + activeId + '\\')" style="padding:6px 14px;border-radius:8px;border:1px solid #8944AB;background:#F9F0FF;color:#8944AB;font-size:12px;font-weight:500;cursor:pointer">\\u2727 \\ud3b8\\uc9d1</button>';
  }
  h += '</div></div>';"""

# The above has too many escaping layers. Let me use a simpler approach.

# Instead of exact matching, let me find the section by unique markers
# and replace it line by line

print("--- Replacing action buttons section ---")

# Find the action section start and end
action_start = "  // Action buttons — state-based"
action_end = "  h += '</div></div>';\n\n  // Navigation context banner"

if action_start in src and action_end in src:
    idx_start = src.index(action_start)
    idx_end = src.index(action_end) + len("  h += '</div></div>';")

    new_actions = """  // Action buttons — state-based (v2: 저장/검수 흐름)
  h += '<div style="margin-left:auto;display:flex;gap:8px;flex-shrink:0">';
  if(_isActive) {
    h += '<button onclick="_curVersionUp(\\'' + activeId + '\\')" style="padding:6px 14px;border-radius:8px;border:none;background:#0071E3;color:#fff;font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:4px;white-space:nowrap">';
    h += '<svg viewBox="0 0 16 16" fill="none" stroke="#fff" stroke-width="1.5" style="width:12px;height:12px"><path d="M8 12V4M5 7l3-3 3 3"/></svg>\\ud3b8\\uc9d1\\ubc84\\uc804 \\uc0dd\\uc131</button>';
  } else if(_isTemp) {
    h += '<button onclick="_curSaveEdit(\\'' + activeId + '\\')" style="padding:6px 14px;border-radius:8px;border:1px solid #E5E5EA;background:#fff;color:#636366;font-size:12px;font-weight:500;cursor:pointer;display:flex;align-items:center;gap:4px">';
    h += '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" style="width:12px;height:12px"><path d="M13 2H3a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V4l-3-2z"/><path d="M11 14V8H5v6"/><path d="M5 2v3h5"/></svg>\\uc800\\uc7a5</button>';
    h += '<button onclick="alert(\\'\\uac80\\uc218 \\uc694\\uccad\\uc744 \\ubcf4\\ub0c5\\ub2c8\\ub2e4.\\\\n\\uac80\\uc218\\uc790\\uac00 \\ud655\\uc778 \\ud6c4 \\ubc30\\ud3ec\\ud569\\ub2c8\\ub2e4.\\')" style="padding:6px 14px;border-radius:8px;border:none;background:#34C759;color:#fff;font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:4px">\\uac80\\uc218 \\uc694\\uccad <svg viewBox="0 0 16 16" fill="none" stroke="#fff" stroke-width="1.5" style="width:11px;height:11px"><path d="M3 8h10M9 4l4 4-4 4"/></svg></button>';
  } else {
    h += '<button onclick="_curSaveEdit(\\'' + activeId + '\\')" style="padding:6px 14px;border-radius:8px;border:1px solid #E5E5EA;background:#fff;color:#636366;font-size:12px;font-weight:500;cursor:pointer;display:flex;align-items:center;gap:4px">';
    h += '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" style="width:12px;height:12px"><path d="M13 2H3a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V4l-3-2z"/><path d="M11 14V8H5v6"/><path d="M5 2v3h5"/></svg>\\uc800\\uc7a5</button>';
  }
  h += '</div></div>';"""

    src = src[:idx_start] + new_actions + src[idx_end:]
    changes += 1
    print("OK: Action buttons replaced with save/review flow")
else:
    print("WARNING: Action buttons section not found")

# ═══════════════════════════════════════
#  4. 기본정보 → 인라인 편집 (input 필드)
# ═══════════════════════════════════════
# 과목 field
replace_once(
    "h += '<div style=\"padding:6px 10px;border-radius:6px;background:#fff;border:1px solid #E5E5EA;font-size:12px;color:#1D1D1F\">' + (activeCur.subject||'-') + '</div></div>';",
    "h += '<input type=\"text\" value=\"' + (activeCur.subject||'') + '\" onchange=\"_curUpdateBasicInfo(\\x27' + activeId + '\\x27,\\x27subject\\x27,this.value)\" style=\"width:100%;box-sizing:border-box;padding:6px 10px;border-radius:6px;background:#fff;border:1px solid #E5E5EA;font-size:12px;color:#1D1D1F;outline:none\" onfocus=\"this.style.borderColor=\\x27#B3D7FF\\x27\" onblur=\"this.style.borderColor=\\x27#E5E5EA\\x27\"></div>';",
    "Basic info: 과목 → input"
)

# 학년 field
replace_once(
    "h += '<div style=\"padding:6px 10px;border-radius:6px;background:#fff;border:1px solid #E5E5EA;font-size:12px;color:#1D1D1F\">' + (activeCur.grade||'-') + '</div></div>';",
    "h += '<input type=\"text\" value=\"' + (activeCur.grade||'') + '\" onchange=\"_curUpdateBasicInfo(\\x27' + activeId + '\\x27,\\x27grade\\x27,this.value)\" style=\"width:100%;box-sizing:border-box;padding:6px 10px;border-radius:6px;background:#fff;border:1px solid #E5E5EA;font-size:12px;color:#1D1D1F;outline:none\" onfocus=\"this.style.borderColor=\\x27#B3D7FF\\x27\" onblur=\"this.style.borderColor=\\x27#E5E5EA\\x27\"></div>';",
    "Basic info: 학년 → input"
)

# 교육과정 field
replace_once(
    "h += '<div style=\"padding:6px 10px;border-radius:6px;background:#fff;border:1px solid #E5E5EA;font-size:12px;color:#1D1D1F\">' + (activeCur.eduCurriculum||'-') + '</div></div>';",
    "h += '<input type=\"text\" value=\"' + (activeCur.eduCurriculum||'') + '\" onchange=\"_curUpdateBasicInfo(\\x27' + activeId + '\\x27,\\x27eduCurriculum\\x27,this.value)\" style=\"width:100%;box-sizing:border-box;padding:6px 10px;border-radius:6px;background:#fff;border:1px solid #E5E5EA;font-size:12px;color:#1D1D1F;outline:none\" onfocus=\"this.style.borderColor=\\x27#B3D7FF\\x27\" onblur=\"this.style.borderColor=\\x27#E5E5EA\\x27\"></div>';",
    "Basic info: 교육과정 → input"
)

# 설명 field
replace_once(
    "h += '<div style=\"padding:6px 10px;border-radius:6px;background:#fff;border:1px solid #E5E5EA;font-size:12px;color:#636366\">' + (activeCur.desc||'-') + '</div></div>';",
    "h += '<input type=\"text\" value=\"' + (activeCur.desc||'') + '\" onchange=\"_curUpdateBasicInfo(\\x27' + activeId + '\\x27,\\x27desc\\x27,this.value)\" style=\"width:100%;box-sizing:border-box;padding:6px 10px;border-radius:6px;background:#fff;border:1px solid #E5E5EA;font-size:12px;color:#636366;outline:none\" onfocus=\"this.style.borderColor=\\x27#B3D7FF\\x27\" onblur=\"this.style.borderColor=\\x27#E5E5EA\\x27\"></div>';",
    "Basic info: 설명 → input"
)

# ═══════════════════════════════════════
#  5. Temp 워크플로우 스테퍼 제거 → 간결한 상태 바
# ═══════════════════════════════════════
stepper_start = "  } else if(_isTemp) {\n    // Workflow stepper\n    h += '<div style=\"margin-top:10px;padding:14px 16px;border-radius:10px;background:#FAFAFA;border:1px solid #E5E5EA\">';"
stepper_end = "    h += '</div>';\n  } else if(_isDraft) {"

if stepper_start in src and stepper_end in src:
    idx_s = src.index(stepper_start)
    idx_e = src.index(stepper_end, idx_s) + len("    h += '</div>';")

    new_stepper = """  } else if(_isTemp) {
    // v2: 간결한 상태 바 (스테퍼 제거)
    if(_srcCurForEditor) {
      h += '<div style="margin-top:10px;padding:10px 14px;border-radius:8px;background:#FAEEDA;border:1px solid #FAC775;display:flex;align-items:center;gap:8px">';
      h += '<span style="width:8px;height:8px;border-radius:50%;background:#EF9F27;flex-shrink:0"></span>';
      h += '<span style="font-size:11px;color:#854F0B;flex:1">v' + (activeCur.sourceVersion||'?') + '\\uc5d0\\uc11c \\uc0dd\\uc131\\ub41c \\ud3b8\\uc9d1\\ubc84\\uc804</span>';
      var _cmpParts = [];
      activeCur.depths.forEach(function(d,di) {
        if(d.count===null) return;
        var srcD = _srcCurForEditor.depths[di];
        var srcCnt = srcD ? (srcD.count||0) : 0;
        var curCnt = d.count || 0;
        if(curCnt !== srcCnt) {
          var diff = curCnt - srcCnt;
          _cmpParts.push(d.name + ' ' + srcCnt + '\\u2192' + curCnt + ' (' + (diff>0?'+':'') + diff + ')');
        }
      });
      if(_cmpParts.length > 0) {
        _cmpParts.forEach(function(p) {
          h += '<span style="font-size:10px;padding:2px 8px;border-radius:8px;background:#E6F1FB;color:#0C447C">' + p + '</span>';
        });
      }
      h += '</div>';
    }"""

    src = src[:idx_s] + new_stepper + src[idx_e:]
    changes += 1
    print("OK: Temp stepper → simple status bar")
else:
    print("WARNING: Temp stepper section not found")

# ═══════════════════════════════════════
#  6. 양식 연결 현황 → 양식 연결 관리 (칩 + 추가/제거)
# ═══════════════════════════════════════
form_section_start = "  // ── 양식 연결 요약 (depth별) ──"
form_section_end = "    h += '</div>';\n    }\n  }\n\n    // Collect forms for alias columns"

if form_section_start in src and form_section_end in src:
    idx_s = src.index(form_section_start)
    idx_e = src.index(form_section_end, idx_s) + len("    h += '</div>';\n    }\n  }")

    new_form_section = """  // ── 양식 연결 관리 (depth별 칩 + 추가/제거) ──
  if(activeCur) {
    h += '<div style="padding:10px 24px 10px;background:#FAFCFF;border-bottom:1px solid #E5E5EA;flex-shrink:0">';
    h += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">';
    h += '<svg viewBox="0 0 16 16" fill="none" stroke="#8944AB" stroke-width="1.5" style="width:13px;height:13px;flex-shrink:0"><rect x="2" y="1" width="12" height="14" rx="2"/><line x1="5" y1="5" x2="11" y2="5"/><line x1="5" y1="8" x2="9" y2="8"/></svg>';
    h += '<span style="font-size:11px;font-weight:600;color:#8944AB">\\uc591\\uc2dd \\uc5f0\\uacb0 \\uad00\\ub9ac</span>';
    h += '</div>';

    activeCur.depths.forEach(function(d, di) {
      var dForms = d.forms || [];
      var isContent = d.count === null;
      var depthLabel = isContent ? '\\ucf58\\ud150\\uce20' : (d.name || (di+1) + '\\ub2e8\\uacc4');

      h += '<div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:6px">';
      h += '<span style="display:inline-flex;align-items:center;justify-content:center;min-width:56px;padding:3px 8px;border-radius:5px;background:#F5F5F7;border:1px solid #E5E5EA;font-size:10px;font-weight:700;color:#48484A;flex-shrink:0;white-space:nowrap">' + depthLabel + '</span>';
      h += '<div style="display:flex;flex-wrap:wrap;gap:4px;padding-top:1px;align-items:center">';

      if(dForms.length > 0) {
        dForms.forEach(function(fb, fi) {
          var fm = (FORM_TEMPLATES||[]).find(function(f){return f.id===fb.formId;});
          var fName = fb.label || (fm ? fm.name : '?');
          var tsList = fm && fm.targetSystems ? fm.targetSystems : [];
          var tsFiltered = tsList.filter(function(t){return t!=='ALL';});

          h += '<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:5px;background:#F9F0FF;border:1px solid #D9B3F0;font-size:10px;font-weight:600;color:#8944AB">';
          h += fName;
          if(tsFiltered.length > 0) {
            tsFiltered.forEach(function(ts) {
              var sc = WC_SYSTEM_COLORS[ts] || {bg:'#F5F5F7',color:'#636366',border:'#E5E5EA',label:ts};
              h += ' <span style="padding:1px 5px;border-radius:3px;background:' + sc.bg + ';color:' + sc.color + ';border:1px solid ' + sc.border + ';font-size:9px;font-weight:700">' + sc.label + '</span>';
            });
          }
          h += ' <span onclick="_curRemoveFormFromDepth(\\x27' + activeId + '\\x27,' + di + ',' + fi + ')" style="cursor:pointer;color:#D9B3F0;font-size:12px;margin-left:2px" onmouseenter="this.style.color=\\x27#FF3B30\\x27" onmouseleave="this.style.color=\\x27#D9B3F0\\x27">\\u00d7</span>';
          h += '</span>';
        });
      } else {
        h += '<span style="font-size:10px;color:#AEAEB2;padding:3px 0">\\uc5f0\\uacb0\\ub41c \\uc591\\uc2dd \\uc5c6\\uc74c</span>';
      }
      h += '<button onclick="_curAddFormToDepth(\\x27' + activeId + '\\x27,' + di + ')" style="padding:2px 8px;border-radius:5px;border:1px dashed #D9B3F0;background:transparent;font-size:10px;color:#8944AB;cursor:pointer;display:inline-flex;align-items:center;gap:2px" onmouseenter="this.style.background=\\x27#F9F0FF\\x27" onmouseleave="this.style.background=\\x27transparent\\x27">+ \\ucd94\\uac00</button>';
      h += '</div></div>';
    });

    h += '</div>';
  }"""

    src = src[:idx_s] + new_form_section + src[idx_e:]
    changes += 1
    print("OK: Form section → chip management with add/remove")
else:
    print("WARNING: Form section not found")

# ═══════════════════════════════════════
#  7. alias 컬럼 수집 코드 + 헤더 + 트리 호출 변경
# ═══════════════════════════════════════

# 7a: alias column collection → 제거하고 간단한 트리 호출로 교체
alias_start = "    // Collect forms for alias columns"
alias_end = "  var _hasAliasCols = _aliasForms.length > 0;"

if alias_start in src and alias_end in src:
    idx_s = src.index(alias_start)
    idx_e = src.index(alias_end, idx_s) + len(alias_end)

    new_alias = """    // v2: alias 컨럼 제거 — 트리는 노드명 편집에 집중
  var _hasAliasCols = false;
  var _aliasForms = [];"""

    src = src[:idx_s] + new_alias + src[idx_e:]
    changes += 1
    print("OK: Alias column collection removed")
else:
    print("WARNING: Alias column collection not found")

# ═══════════════════════════════════════
#  8. 스텝 CTA 제거
# ═══════════════════════════════════════
replace_once(
    "  h += _renderStepCta('curriculum');",
    "  // Step CTA 제거 (v2: 상단 액션바로 통합)",
    "Remove step CTA"
)

# ═══════════════════════════════════════
#  9. 편집버전 삭제 → 트리 하단에 배치
# ═══════════════════════════════════════
# 트리 하단 "최상위 항목 추가" 버튼 뒤에 삭제 옵션 추가
replace_once(
    "h += '\\uCD5C\\uC0C1\\uC704 \\uD56D\\uBAA9 \\uCD94\\uAC00</button>';\n    h += '</div>';",
    """h += '\\uCD5C\\uC0C1\\uC704 \\uD56D\\uBAA9 \\uCD94\\uAC00</button>';
    h += '</div>';
    // v2: \\ud3b8\\uc9d1\\ubc84\\uc804 \\uc0ad\\uc81c (\\ud558\\ub2e8 \\ubc30\\uce58)
    if(_isTemp) {
      h += '<div style="padding:12px 24px;border-top:1px solid #F5F5F7;display:flex;align-items:center;justify-content:space-between">';
      h += '<span style="font-size:11px;color:#AEAEB2">\\uc774 \\ud3b8\\uc9d1\\ubc84\\uc804\\uc774 \\ub354 \\uc774\\uc0c1 \\ud544\\uc694\\ud558\\uc9c0 \\uc54a\\uc73c\\uc2e0\\uac00\\uc694?</span>';
      h += '<button onclick="_curDeleteDraft(\\'' + activeId + '\\')" style="padding:4px 12px;border-radius:6px;border:1px solid #FFCCCC;background:transparent;color:#C62828;font-size:11px;cursor:pointer" onmouseenter="this.style.background=\\x27#FFF5F5\\x27" onmouseleave="this.style.background=\\x27transparent\\x27">\\ud3b8\\uc9d1\\ubc84\\uc804 \\uc0ad\\uc81c</button>';
      h += '</div>';
    }""",
    "Add delete option at bottom"
)

# ═══════════════════════════════════════
#  10. 헬퍼 함수 추가: _curUpdateBasicInfo, _curSaveEdit,
#      _curAddFormToDepth, _curRemoveFormFromDepth
# ═══════════════════════════════════════
helper_anchor = "function _curEditStructure(curId) {"

new_helpers = """// v2: 인라인 기본정보 수정
function _curUpdateBasicInfo(curId, field, value) {
  var cur = (CURRICULUM_DATA||[]).find(function(c){ return c.id === curId; });
  if(!cur) return;
  cur[field] = value;
  cur.updatedAt = new Date().toISOString().slice(0,10);
}

// v2: 저장 버튼
function _curSaveEdit(curId) {
  var cur = (CURRICULUM_DATA||[]).find(function(c){ return c.id === curId; });
  if(!cur) return;
  cur.updatedAt = new Date().toISOString().slice(0,10);
  alert('\\uc800\\uc7a5\\ub418\\uc5c8\\uc2b5\\ub2c8\\ub2e4.');
  renderCurriculumView();
}

// v2: depth에 양식 추가
function _curAddFormToDepth(curId, depthIdx) {
  var cur = (CURRICULUM_DATA||[]).find(function(c){ return c.id === curId; });
  if(!cur || !cur.depths[depthIdx]) return;
  var existing = (cur.depths[depthIdx].forms || []).map(function(f){return f.formId;});
  var available = (FORM_TEMPLATES||[]).filter(function(f){ return existing.indexOf(f.id) < 0; });
  if(available.length === 0) { alert('\\ucd94\\uac00\\ud560 \\uc218 \\uc788\\ub294 \\uc591\\uc2dd\\uc774 \\uc5c6\\uc2b5\\ub2c8\\ub2e4.'); return; }
  var names = available.map(function(f,i){ return (i+1) + '. ' + f.name; }).join('\\n');
  var choice = prompt('\\ucd94\\uac00\\ud560 \\uc591\\uc2dd \\ubc88\\ud638\\ub97c \\uc120\\ud0dd\\ud558\\uc138\\uc694:\\n' + names);
  if(!choice) return;
  var idx = parseInt(choice) - 1;
  if(isNaN(idx) || idx < 0 || idx >= available.length) return;
  var sel = available[idx];
  if(!cur.depths[depthIdx].forms) cur.depths[depthIdx].forms = [];
  cur.depths[depthIdx].forms.push({formId:sel.id, label:sel.name, boundCodes:[], bindConfig:{}});
  cur.updatedAt = new Date().toISOString().slice(0,10);
  renderCurriculumView();
}

// v2: depth에서 양식 제거
function _curRemoveFormFromDepth(curId, depthIdx, formIdx) {
  var cur = (CURRICULUM_DATA||[]).find(function(c){ return c.id === curId; });
  if(!cur || !cur.depths[depthIdx] || !cur.depths[depthIdx].forms) return;
  var fm = cur.depths[depthIdx].forms[formIdx];
  if(!fm) return;
  if(!confirm('\\u201c' + (fm.label||'?') + '\\u201d \\uc591\\uc2dd\\uc744 \\uc774 depth\\uc5d0\\uc11c \\uc81c\\uac70\\ud558\\uc2dc\\uaca0\\uc2b5\\ub2c8\\uae4c?')) return;
  cur.depths[depthIdx].forms.splice(formIdx, 1);
  cur.updatedAt = new Date().toISOString().slice(0,10);
  renderCurriculumView();
}

"""

if helper_anchor in src:
    idx = src.index(helper_anchor)
    src = src[:idx] + new_helpers + src[idx:]
    changes += 1
    print("OK: Helper functions added")
else:
    print("WARNING: Helper anchor not found")

# ═══════════════════════════════════════
#  Final write
# ═══════════════════════════════════════
if changes == 0:
    print("\nERROR: No changes applied!")
    sys.exit(1)

with open(FILE, 'w', encoding='utf-8') as f:
    f.write(src)

print(f"\nTotal changes: {changes}")
print("Patch complete!")
