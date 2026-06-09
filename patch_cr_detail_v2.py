#!/usr/bin/env python3
"""
커리큘럼 수신 상세 뷰 UX 개선 패치
- 3-STEP 위저드 → 1페이지 스크롤 통합
- holding/rejected 상태 추가
- 3 액션: Temp 생성 / 보류 / 반려
"""
import sys

FILE = '/sessions/lucid-busy-hamilton/mnt/Prototype/cms_stg_prd_release_v1.1.html'

with open(FILE, 'r', encoding='utf-8') as f:
    src = f.read()

changes = 0

# ============================================================
# 1) CUR_RECV_STATE에서 step/showDiff 제거, diffOpen 추가
# ============================================================
old_state = """var CUR_RECV_STATE = {
  filter: 'all',          // all | detected | synced | unlinked
  search: '',
  detailId: null,         // 상세 뷰 대상 CR id
  step: 1,                // 상세 뷰 단계 (1~3)
  checkedCodes: {},       // STEP2: code별 체크 상태 { 'CR-xxx': true/false }
  showDiff: false
};"""

new_state = """var CUR_RECV_STATE = {
  filter: 'all',          // all | detected | holding | synced | unlinked
  search: '',
  detailId: null,         // 상세 뷰 대상 CR id
  checkedCodes: {},       // 코드별 체크 상태
  diffOpen: true          // diff 테이블 펼침 상태
};"""

if old_state in src:
    src = src.replace(old_state, new_state, 1)
    changes += 1
    print('[OK] 1. CUR_RECV_STATE updated')
else:
    print('[FAIL] 1. CUR_RECV_STATE not found')
    sys.exit(1)

# ============================================================
# 2) _crSetFilter — step 초기화 제거
# ============================================================
old_filter = """function _crSetFilter(f) {
  CUR_RECV_STATE.filter = f;
  CUR_RECV_STATE.detailId = null;
  CUR_RECV_STATE.step = 1;
  renderCurReceiveView();
}"""
new_filter = """function _crSetFilter(f) {
  CUR_RECV_STATE.filter = f;
  CUR_RECV_STATE.detailId = null;
  renderCurReceiveView();
}"""
if old_filter in src:
    src = src.replace(old_filter, new_filter, 1)
    changes += 1
    print('[OK] 2. _crSetFilter updated')

# ============================================================
# 3) _crOpenDetail — step/showDiff 초기화 제거
# ============================================================
old_open = """function _crOpenDetail(crId) {
  CUR_RECV_STATE.detailId = crId;
  CUR_RECV_STATE.step = 1;
  CUR_RECV_STATE.showDiff = false;"""
new_open = """function _crOpenDetail(crId) {
  CUR_RECV_STATE.detailId = crId;
  CUR_RECV_STATE.diffOpen = true;"""
if old_open in src:
    src = src.replace(old_open, new_open, 1)
    changes += 1
    print('[OK] 3. _crOpenDetail updated')

# ============================================================
# 4) _crBackToList — step 초기화 제거
# ============================================================
old_back = """function _crBackToList() {
  CUR_RECV_STATE.detailId = null;
  CUR_RECV_STATE.step = 1;
  renderCurReceiveView();
}"""
new_back = """function _crBackToList() {
  CUR_RECV_STATE.detailId = null;
  renderCurReceiveView();
}"""
if old_back in src:
    src = src.replace(old_back, new_back, 1)
    changes += 1
    print('[OK] 4. _crBackToList updated')

# ============================================================
# 5) _crSetStep, _crToggleDiff → _crToggleDiffOpen + _crHoldItems + _crRejectItems
# ============================================================
old_helpers = """function _crSetStep(n) {
  CUR_RECV_STATE.step = n;
  renderCurReceiveView();
}
function _crToggleCode(crId) {
  CUR_RECV_STATE.checkedCodes[crId] = !CUR_RECV_STATE.checkedCodes[crId];
  renderCurReceiveView();
}
function _crToggleDiff() {
  CUR_RECV_STATE.showDiff = !CUR_RECV_STATE.showDiff;
  renderCurReceiveView();
}"""

new_helpers = """function _crToggleCode(crId) {
  CUR_RECV_STATE.checkedCodes[crId] = !CUR_RECV_STATE.checkedCodes[crId];
  renderCurReceiveView();
}
function _crToggleDiffOpen() {
  CUR_RECV_STATE.diffOpen = !CUR_RECV_STATE.diffOpen;
  renderCurReceiveView();
}
function _crHoldItems() {
  var item = CUR_RECEIVE_DATA.find(function(r){ return r.id === CUR_RECV_STATE.detailId; });
  if(!item) return;
  if(!confirm('선택한 항목을 보류 처리합니다.\\n나중에 다시 처리할 수 있습니다.')) return;
  CUR_RECEIVE_DATA.forEach(function(r) {
    if(r.linkedCurId === item.linkedCurId && r.status === 'detected') {
      r.status = 'holding';
    }
  });
  _crBackToList();
}
function _crRejectItems() {
  var item = CUR_RECEIVE_DATA.find(function(r){ return r.id === CUR_RECV_STATE.detailId; });
  if(!item) return;
  if(!confirm('변경 데이터를 반려합니다.\\n상위 시스템에 재수신을 요청합니다.')) return;
  CUR_RECEIVE_DATA.forEach(function(r) {
    if(r.linkedCurId === item.linkedCurId && r.status === 'detected') {
      r.status = 'rejected';
    }
  });
  _crBackToList();
}"""

if old_helpers in src:
    src = src.replace(old_helpers, new_helpers, 1)
    changes += 1
    print('[OK] 5. Helper functions replaced')
else:
    print('[FAIL] 5. Old helper functions not found')
    sys.exit(1)

# ============================================================
# 6) 필터 탭에 holding/rejected 추가 — tabs 배열 교체
# ============================================================
old_tabs = """  var tabs = [
    {key:'all',label:'전체'},
    {key:'detected',label:'변경감지',dot:'#FF9500'},
    {key:'synced',label:'최신',dot:'#34C759'},
    {key:'unlinked',label:'미연결',dot:'#86868B'}
  ];"""
new_tabs = """  var tabs = [
    {key:'all',label:'전체'},
    {key:'detected',label:'변경감지',dot:'#FF9500'},
    {key:'holding',label:'보류',dot:'#0071E3'},
    {key:'synced',label:'최신',dot:'#34C759'},
    {key:'unlinked',label:'미연결',dot:'#86868B'}
  ];"""
if old_tabs in src:
    src = src.replace(old_tabs, new_tabs, 1)
    changes += 1
    print('[OK] 6. Filter tabs updated')

# ============================================================
# 7) 목록 카드 상태 색상에 holding/rejected 추가
# ============================================================
old_status_colors = """      var statusColors = {
        detected:{bg:'#FFF3E0',color:'#E65100',label:'변경감지',icon:'⚠'},
        synced:{bg:'#E8F5E9',color:'#2E7D32',label:'최신',icon:'✓'},
        unlinked:{bg:'#F5F5F7',color:'#86868B',label:'미연결',icon:'—'}
      };"""
new_status_colors = """      var statusColors = {
        detected:{bg:'#FFF3E0',color:'#E65100',label:'변경감지',icon:'⚠'},
        holding:{bg:'#E3F2FD',color:'#1565C0',label:'보류',icon:'⏸'},
        synced:{bg:'#E8F5E9',color:'#2E7D32',label:'최신',icon:'✓'},
        rejected:{bg:'#FFEBEE',color:'#C62828',label:'반려',icon:'↩'},
        unlinked:{bg:'#F5F5F7',color:'#86868B',label:'미연결',icon:'—'}
      };"""
if old_status_colors in src:
    src = src.replace(old_status_colors, new_status_colors, 1)
    changes += 1
    print('[OK] 7. Status colors updated')

# ============================================================
# 8) 전체 상세 뷰 함수 교체 (_crRenderDetail ~ _crRenderStep3)
# ============================================================
old_detail_start = '// ══════════════════════════════════════════\n// _crRenderDetail'
old_detail_end = "// ── Temp 생성 실행 ──"

start_idx = src.index(old_detail_start)
end_idx = src.index(old_detail_end)

new_detail_code = r"""// ══════════════════════════════════════════
// _crRenderDetail — 1페이지 통합 상세 뷰
// ══════════════════════════════════════════
function _crRenderDetail(root) {
  var crId = CUR_RECV_STATE.detailId;
  var item = CUR_RECEIVE_DATA.find(function(r){ return r.id === crId; });
  if(!item) { _crBackToList(); return; }

  var sc = _crSysColor(item.targetSystem);
  var siblings = _crGetSiblingCodes(item);
  var allRelated = [item].concat(siblings).filter(function(r){ return r.status === 'detected' || r.status === 'holding'; });
  var checkedCount = 0;
  allRelated.forEach(function(r){ if(CUR_RECV_STATE.checkedCodes[r.id]) checkedCount++; });
  var cur = CURRICULUM_DATA.find(function(c){ return c.id === item.linkedCurId; });
  var isDetected = item.status === 'detected' || item.status === 'holding';
  var h = '';

  // ── 헤더: 뒤로가기 + 코드 배지 ──
  h += '<div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">';
  h += '<button onclick="_crBackToList()" style="padding:6px 14px;border-radius:8px;border:1px solid var(--c-gray-200);background:#fff;color:var(--c-gray-700);font-size:12px;font-weight:500;cursor:pointer;display:flex;align-items:center;gap:4px"><svg viewBox="0 0 8 14" fill="none" stroke="currentColor" stroke-width="1.5" style="width:8px;height:14px"><path d="M7 1L1 7l6 6"/></svg>목록</button>';
  h += '<span style="font-size:11px;padding:3px 8px;border-radius:6px;font-weight:600;background:' + sc.bg + ';color:' + sc.color + ';border:1px solid ' + sc.border + '">' + sc.label + '</span>';
  h += '<span style="font-size:14px;padding:4px 12px;border-radius:7px;font-weight:700;font-family:\'SF Mono\',SFMono-Regular,Menlo,monospace;background:var(--c-gray-100);color:var(--c-gray-800);border:1px solid var(--c-gray-200);letter-spacing:.5px">' + item.subjectCode + '</span>';
  h += '<span style="font-size:14px;color:var(--c-gray-500)">' + item.subjectName + '</span>';
  h += '</div>';

  // ── 알림 배너 (간결하게) ──
  if(isDetected && item.diffSummary) {
    h += '<div style="background:linear-gradient(135deg,#FFF8E1,#FFF3E0);border:1px solid #FFB74D40;border-radius:14px;padding:16px 20px;margin-bottom:16px;display:flex;align-items:center;gap:14px">';
    h += '<div style="width:40px;height:40px;border-radius:12px;background:#FF950015;display:flex;align-items:center;justify-content:center;flex-shrink:0"><svg viewBox="0 0 20 20" fill="none" stroke="#FF9500" stroke-width="1.5" style="width:20px;height:20px"><path d="M10 6v4M10 14h.01M3.7 16h12.6c1.2 0 1.9-1.3 1.2-2.3L11.2 3.3c-.6-1-2-.9-2.5 0L2.5 13.7c-.6 1 .1 2.3 1.2 2.3z"/></svg></div>';
    h += '<div style="flex:1">';
    h += '<div style="font-size:14px;font-weight:700;color:#E65100;margin-bottom:2px">커리큘럼 변경 감지</div>';
    h += '<div style="font-size:12px;color:var(--c-gray-600)">' + (cur?cur.name:'') + ' v' + item.linkedCurVer + ' → v' + item.detectedVer + ' · ' + (item.diffSummary||'') + '</div>';
    h += '</div>';
    h += '<span style="font-size:11px;color:var(--c-gray-400)">' + (item.detectedDate||'') + '</span>';
    h += '</div>';
  } else if(item.status === 'synced') {
    h += '<div style="background:#E8F5E940;border:1px solid #A5D6A740;border-radius:14px;padding:16px 20px;margin-bottom:16px;display:flex;align-items:center;gap:14px">';
    h += '<div style="width:40px;height:40px;border-radius:12px;background:#34C75915;display:flex;align-items:center;justify-content:center;flex-shrink:0"><svg viewBox="0 0 20 20" fill="none" stroke="#34C759" stroke-width="2" style="width:20px;height:20px"><path d="M5 10l3 3 7-7"/></svg></div>';
    h += '<div><div style="font-size:14px;font-weight:700;color:#2E7D32">최신 상태</div>';
    h += '<div style="font-size:12px;color:var(--c-gray-500)">' + (cur?cur.name:'') + ' v' + item.linkedCurVer + '</div></div>';
    h += '</div>';
  } else if(item.status === 'unlinked') {
    h += '<div style="background:var(--c-gray-50);border:1px solid var(--c-gray-200);border-radius:14px;padding:16px 20px;margin-bottom:16px;display:flex;align-items:center;gap:14px">';
    h += '<div style="width:40px;height:40px;border-radius:12px;background:var(--c-gray-100);display:flex;align-items:center;justify-content:center;flex-shrink:0"><svg viewBox="0 0 20 20" fill="none" stroke="var(--c-gray-400)" stroke-width="1.5" style="width:20px;height:20px"><path d="M15 7l-5 5-5-5"/></svg></div>';
    h += '<div><div style="font-size:14px;font-weight:700;color:var(--c-gray-600)">미연결</div>';
    h += '<div style="font-size:12px;color:var(--c-gray-400)">연결된 커리큘럼이 없습니다</div></div>';
    h += '</div>';
  }

  // ── 변경 내역 (접기/펼치기) ──
  if(isDetected && item.diffDetail && item.diffDetail.length > 0) {
    var isOpen = CUR_RECV_STATE.diffOpen;
    h += '<div style="background:#fff;border-radius:14px;border:1px solid var(--c-gray-200);margin-bottom:16px;overflow:hidden">';
    h += '<div onclick="_crToggleDiffOpen()" style="padding:14px 20px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;user-select:none">';
    h += '<div style="font-size:13px;font-weight:600;color:var(--c-gray-800);display:flex;align-items:center;gap:6px">';
    h += '<svg viewBox="0 0 16 16" fill="none" stroke="#FF9500" stroke-width="1.5" style="width:13px;height:13px"><path d="M14 8H2M8 2v12"/></svg>';
    h += '변경 내역 <span style="font-size:11px;color:var(--c-gray-400);font-weight:400">' + item.diffDetail.length + '건</span></div>';
    h += '<svg viewBox="0 0 12 12" fill="none" stroke="var(--c-gray-400)" stroke-width="1.5" style="width:12px;height:12px;transition:transform .2s;transform:rotate(' + (isOpen?'180':'0') + 'deg)"><path d="M2 4l4 4 4-4"/></svg>';
    h += '</div>';
    if(isOpen) {
      h += '<div style="padding:0 20px 16px">';
      h += '<table style="width:100%;border-collapse:separate;border-spacing:0;font-size:12px">';
      h += '<thead><tr style="background:var(--c-gray-50)">';
      h += '<th style="padding:8px 12px;text-align:left;border-bottom:1px solid var(--c-gray-200);font-weight:600;color:var(--c-gray-500);border-radius:8px 0 0 0">항목</th>';
      h += '<th style="padding:8px 12px;text-align:center;border-bottom:1px solid var(--c-gray-200);font-weight:600;color:var(--c-gray-500)">Before</th>';
      h += '<th style="padding:8px 12px;text-align:center;border-bottom:1px solid var(--c-gray-200);font-weight:600;color:var(--c-gray-500)">After</th>';
      h += '<th style="padding:8px 12px;text-align:center;border-bottom:1px solid var(--c-gray-200);font-weight:600;color:var(--c-gray-500);border-radius:0 8px 0 0">영향도</th>';
      h += '</tr></thead><tbody>';
      for(var di=0;di<item.diffDetail.length;di++) {
        var dd = item.diffDetail[di];
        var impactColor = dd.impact==='high'?'#D32F2F':dd.impact==='medium'?'#FF9500':'#34C759';
        var impactLabel = dd.impact==='high'?'높음':dd.impact==='medium'?'중간':'낮음';
        h += '<tr><td style="padding:10px 12px;border-bottom:1px solid var(--c-gray-100);font-weight:500">' + dd.field + '</td>';
        h += '<td style="padding:10px 12px;border-bottom:1px solid var(--c-gray-100);text-align:center;color:var(--c-gray-500);text-decoration:line-through">' + dd.before + '</td>';
        h += '<td style="padding:10px 12px;border-bottom:1px solid var(--c-gray-100);text-align:center;font-weight:600;color:#E65100">' + dd.after + '</td>';
        h += '<td style="padding:10px 12px;border-bottom:1px solid var(--c-gray-100);text-align:center"><span style="font-size:10px;padding:2px 8px;border-radius:10px;font-weight:600;background:' + impactColor + '18;color:' + impactColor + '">' + impactLabel + '</span></td>';
        h += '</tr>';
      }
      h += '</tbody></table>';
      h += '</div>';
    }
    h += '</div>';
  }

  // ── 연결된 코드 (체크박스 포함) ──
  if(isDetected && allRelated.length > 0) {
    h += '<div style="background:#fff;border-radius:14px;padding:20px;border:1px solid var(--c-gray-200);margin-bottom:16px">';
    h += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">';
    h += '<div style="font-size:13px;font-weight:600;color:var(--c-gray-800);display:flex;align-items:center;gap:6px">';
    h += '<svg viewBox="0 0 16 16" fill="none" stroke="#8944AB" stroke-width="1.5" style="width:13px;height:13px"><path d="M6.5 8.5a3 3 0 004.2.3l1.8-1.8a3 3 0 00-4.2-4.2L7.3 3.8"/><path d="M9.5 7.5a3 3 0 00-4.2-.3L3.5 9a3 3 0 004.2 4.2l1-1"/></svg>';
    h += '연결된 코드</div>';
    h += '<span style="font-size:11px;color:var(--c-gray-400)">' + checkedCount + '/' + allRelated.length + ' 선택</span>';
    h += '</div>';

    h += '<div style="display:flex;flex-direction:column;gap:6px">';
    for(var ri=0;ri<allRelated.length;ri++) {
      var rel = allRelated[ri];
      var isChecked = !!CUR_RECV_STATE.checkedCodes[rel.id];
      var relSc = _crSysColor(rel.targetSystem);
      var compatColors = {
        compatible:{bg:'#E8F5E9',color:'#2E7D32',label:'호환',icon:'✓'},
        'review-needed':{bg:'#FFF3E0',color:'#E65100',label:'확인필요',icon:'!'},
        excluded:{bg:'#FFEBEE',color:'#C62828',label:'제외권장',icon:'✗'}
      };
      var compat = compatColors[rel.compatStatus] || compatColors.compatible;

      h += '<div onclick="_crToggleCode(\'' + rel.id + '\')" style="display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:10px;border:1.5px solid ' + (isChecked?'#FF9500':'var(--c-gray-200)') + ';background:' + (isChecked?'#FF950006':'#fff') + ';cursor:pointer;transition:all .15s">';
      h += '<div style="width:20px;height:20px;border-radius:6px;border:2px solid ' + (isChecked?'#FF9500':'var(--c-gray-300)') + ';display:flex;align-items:center;justify-content:center;flex-shrink:0;background:' + (isChecked?'#FF9500':'#fff') + ';transition:all .15s">';
      if(isChecked) h += '<svg viewBox="0 0 12 12" fill="none" stroke="#fff" stroke-width="2" style="width:10px;height:10px"><path d="M2 6l3 3 5-5"/></svg>';
      h += '</div>';
      h += '<span style="font-size:10px;padding:2px 6px;border-radius:4px;font-weight:600;background:' + relSc.bg + ';color:' + relSc.color + '">' + relSc.label + '</span>';
      h += '<span style="font-size:11px;padding:2px 8px;border-radius:4px;font-weight:600;font-family:\'SF Mono\',SFMono-Regular,Menlo,monospace;background:var(--c-gray-100);color:var(--c-gray-700);border:1px solid var(--c-gray-200);letter-spacing:.3px">' + rel.subjectCode + '</span>';
      h += '<span style="flex:1;font-size:12px;color:var(--c-gray-500)">' + rel.subjectName + '</span>';
      h += '<span style="font-size:10px;padding:3px 8px;border-radius:10px;font-weight:600;background:' + compat.bg + ';color:' + compat.color + '">' + compat.icon + ' ' + compat.label + '</span>';
      h += '</div>';
    }
    h += '</div>';
    h += '</div>';
  }

  // ── 액션 바 (3버튼) ──
  if(isDetected) {
    h += '<div style="background:#fff;border-radius:14px;padding:16px 20px;border:1px solid var(--c-gray-200);display:flex;align-items:center;justify-content:space-between;gap:12px">';
    // 좌: 반려
    h += '<button onclick="_crRejectItems()" style="padding:9px 18px;border-radius:10px;border:1px solid #FFCDD2;background:#fff;color:#C62828;font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:5px;transition:all .15s">';
    h += '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" style="width:12px;height:12px"><path d="M1 7h12M5 3L1 7l4 4"/></svg>반려</button>';
    // 중: 보류
    h += '<button onclick="_crHoldItems()" style="padding:9px 18px;border-radius:10px;border:1px solid #BBDEFB;background:#fff;color:#1565C0;font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:5px;transition:all .15s">';
    h += '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" style="width:12px;height:12px"><rect x="3" y="2" width="3" height="10" rx="1"/><rect x="8" y="2" width="3" height="10" rx="1"/></svg>보류</button>';
    // 우: Temp 생성
    h += '<button onclick="' + (checkedCount>0?'_crCreateTemp(\'' + (item.linkedCurId||'') + '\',' + (item.detectedVer||0) + ')':'') + '" style="padding:9px 24px;border-radius:10px;border:none;background:' + (checkedCount>0?'linear-gradient(135deg,#FF9500,#FF6D00)':'var(--c-gray-300)') + ';color:#fff;font-size:12px;font-weight:700;cursor:' + (checkedCount>0?'pointer':'not-allowed') + ';display:flex;align-items:center;gap:6px;box-shadow:' + (checkedCount>0?'0 2px 10px rgba(255,149,0,.3)':'none') + ';transition:all .15s">';
    h += '<svg viewBox="0 0 14 14" fill="none" stroke="#fff" stroke-width="1.5" style="width:12px;height:12px"><polygon points="8 1 2 8 7 8 6 13 12 6 7 6 8 1"/></svg>';
    h += 'v' + item.detectedVer + ' Temp 생성 <span style="font-size:10px;opacity:.8">(' + checkedCount + '건)</span></button>';
    h += '</div>';
  }

  root.innerHTML = h;
}

"""

src = src[:start_idx] + new_detail_code + src[end_idx:]
changes += 1
print('[OK] 8. Detail view replaced with single-page layout')

# ============================================================
# Write output
# ============================================================
with open(FILE, 'w', encoding='utf-8') as f:
    f.write(src)

print('\n=== PATCH COMPLETE: {} changes applied ==='.format(changes))
