#!/usr/bin/env python3
"""
커리큘럼 수신 — 커리큘럼 중심 + 팩트 기반 UI 리팩토링
1) compatStatus 제거
2) 목록 뷰: 코드 중심 → 커리큘럼 중심 그룹 카드
3) 상세 뷰: 헤더 커리큘럼 중심, compatStatus 배지 제거
"""
import sys

FILE = '/sessions/lucid-busy-hamilton/mnt/Prototype/cms_stg_prd_release_v1.1.html'

with open(FILE, 'r', encoding='utf-8') as f:
    src = f.read()

changes = 0

# ============================================================
# 1) CUR_RECEIVE_DATA에서 compatStatus 제거
# ============================================================
compat_pairs = [
    (" compatStatus:'review-needed'}", " }"),
    (" compatStatus:'compatible'}", " }"),
    (" compatStatus:'ok'}", " }"),
    (" compatStatus:'excluded'}", " }"),
    (" compatStatus:null}", " }"),
]
for old, new in compat_pairs:
    # Replace only the specific pattern (comma before it)
    full_old = "," + old
    full_new = new
    count = src.count(full_old)
    if count > 0:
        src = src.replace(full_old, full_new)
        changes += 1
        print(f'[OK] 1. Removed compatStatus pattern ({count} instances): {old.strip()[:30]}...')

# Also update the comment
old_comment = "// -- 코드 중심 수신 데이터: 각 과목코드가 연결된 커리큘럼과의 차이를 기록"
new_comment = "// -- 수신 데이터: 각 과목코드가 연결된 커리큘럼과의 변경 내역 기록 (팩트 기반, 판단 없음)"
if old_comment in src:
    src = src.replace(old_comment, new_comment, 1)
    changes += 1
    print('[OK] 1b. Data comment updated')

# ============================================================
# 2) 목록 뷰 전면 교체 — 커리큘럼 중심 그룹 카드
# ============================================================
# Replace from "  // 목록 뷰" to just before "  // 배지 업데이트"
old_list_start = "  // 목록 뷰\n"
old_list_end = "\n  // 배지 업데이트"

start_idx = src.index(old_list_start)
end_idx = src.index(old_list_end)

new_list = """  // 목록 뷰 — 커리큘럼 중심 그룹핑
  var h = '';
  var pipe = _crGetPipelineCounts();
  var f = CUR_RECV_STATE.filter;
  var q = (CUR_RECV_STATE.search || '').toLowerCase();

  // ── 커리큘럼 그룹 빌드 (필터/검색 전) ──
  var _grpMap = {};
  var _grpOrder = [];
  var _statusPri = {detected:4, holding:3, rejected:2, synced:1, unlinked:0};
  CUR_RECEIVE_DATA.forEach(function(r) {
    if(!r.linkedCurId) {
      var uid = '_UL_' + r.id;
      _grpMap[uid] = {curId:null,curName:null,curVer:null,detectedVer:null,changeType:null,diffSummary:null,detectedDate:null,codes:[r],status:'unlinked',firstCrId:r.id};
      _grpOrder.push(uid);
      return;
    }
    if(!_grpMap[r.linkedCurId]) {
      _grpMap[r.linkedCurId] = {curId:r.linkedCurId,curName:r.linkedCurName,curVer:r.linkedCurVer,detectedVer:null,changeType:null,diffSummary:null,detectedDate:null,codes:[],status:'synced',firstCrId:r.id};
      _grpOrder.push(r.linkedCurId);
    }
    var g = _grpMap[r.linkedCurId];
    g.codes.push(r);
    if((_statusPri[r.status]||0) > (_statusPri[g.status]||0)) {
      g.status = r.status;
    }
    if(r.detectedVer && !g.detectedVer) { g.detectedVer = r.detectedVer; }
    if(r.diffSummary && !g.diffSummary) { g.diffSummary = r.diffSummary; }
    if(r.detectedDate && !g.detectedDate) { g.detectedDate = r.detectedDate; }
    if(r.changeType && !g.changeType) { g.changeType = r.changeType; }
  });

  // ── 파이프라인 헤더 ──
  h += '<div style="display:flex;align-items:center;gap:0;margin-bottom:20px;background:#fff;border-radius:14px;padding:6px 8px;border:1px solid var(--c-gray-200);box-shadow:0 1px 3px rgba(0,0,0,.04)">';
  var pipeSteps = [
    {label:'코드연결',count:pipe.bind,color:'#8944AB',icon:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" style="width:13px;height:13px"><path d="M6.5 8.5a3 3 0 004.2.3l1.8-1.8a3 3 0 00-4.2-4.2L7.3 3.8"/><path d="M9.5 7.5a3 3 0 00-4.2-.3L3.5 9a3 3 0 004.2 4.2l1-1"/></svg>',view:'service-bind'},
    {label:'수신',count:pipe.recv,color:'#FF9500',icon:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" style="width:13px;height:13px"><path d="M14 10v3a1 1 0 01-1 1H3a1 1 0 01-1-1v-3"/><polyline points="5 7 8 10 11 7"/><line x1="8" y1="10" x2="8" y2="2"/></svg>',view:'cur-receive',active:true},
    {label:'콘텐츠',count:pipe.content,color:'#0071E3',icon:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" style="width:13px;height:13px"><rect x="2" y="2" width="12" height="12" rx="2"/><line x1="5" y1="6" x2="11" y2="6"/><line x1="5" y1="9" x2="9" y2="9"/></svg>',view:'service-content'},
    {label:'배포',count:pipe.deploy,color:'#34C759',icon:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" style="width:13px;height:13px"><polygon points="9 1 2 9 8 9 7 15 14 7 8 7 9 1"/></svg>',view:'deploy'}
  ];
  for(var pi=0;pi<pipeSteps.length;pi++) {
    var ps = pipeSteps[pi];
    var isActive = !!ps.active;
    h += '<div onclick="switchView(\\'' + ps.view + '\\')" style="flex:1;display:flex;align-items:center;justify-content:center;gap:6px;padding:10px 12px;border-radius:10px;cursor:pointer;transition:all .15s;' + (isActive ? 'background:' + ps.color + '10;border:1.5px solid ' + ps.color + '30' : 'background:transparent;border:1.5px solid transparent') + '">';
    h += '<span style="color:' + ps.color + '">' + ps.icon + '</span>';
    h += '<span style="font-size:12px;font-weight:' + (isActive?'700':'500') + ';color:' + (isActive?ps.color:'var(--c-gray-500)') + '">' + ps.label + '</span>';
    h += '<span style="font-size:11px;font-weight:700;color:#fff;background:' + ps.color + ';padding:1px 7px;border-radius:10px;min-width:18px;text-align:center">' + ps.count + '</span>';
    if(pi < pipeSteps.length-1) {
      h += '</div>';
      h += '<svg viewBox="0 0 8 14" fill="none" stroke="var(--c-gray-300)" stroke-width="1.5" style="width:8px;height:14px;flex-shrink:0;margin:0 2px"><path d="M1 1l6 6-6 6"/></svg>';
    } else {
      h += '</div>';
    }
  }
  h += '</div>';

  // ── 필터 탭 + 검색 (그룹 단위 카운트) ──
  h += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;gap:12px;flex-wrap:wrap">';
  h += '<div style="display:flex;gap:0;border:1px solid var(--c-gray-200);border-radius:10px;overflow:hidden;background:var(--c-gray-50)">';
  var tabs = [
    {key:'all',label:'전체'},
    {key:'detected',label:'변경감지',dot:'#FF9500'},
    {key:'holding',label:'보류',dot:'#0071E3'},
    {key:'synced',label:'최신',dot:'#34C759'},
    {key:'unlinked',label:'미연결',dot:'#86868B'}
  ];
  for(var ti=0;ti<tabs.length;ti++) {
    var t = tabs[ti];
    var isOn = (f === t.key);
    var cnt = 0;
    _grpOrder.forEach(function(gid){ var g=_grpMap[gid]; if(t.key==='all'||g.status===t.key) cnt++; });
    h += '<button onclick="_crSetFilter(\\'' + t.key + '\\')" style="padding:7px 16px;border:none;font-size:12px;font-weight:' + (isOn?'600':'500') + ';cursor:pointer;display:flex;align-items:center;gap:5px;background:' + (isOn?'#fff':'transparent') + ';color:' + (isOn?'var(--c-gray-900)':'var(--c-gray-500)') + ';transition:all .15s;' + (ti<tabs.length-1?'border-right:1px solid var(--c-gray-200)':'') + '">';
    if(t.dot) h += '<span style="width:7px;height:7px;border-radius:50%;background:' + t.dot + ';display:inline-block"></span>';
    h += t.label + ' <span style="font-size:10px;color:var(--c-gray-400)">' + cnt + '</span></button>';
  }
  h += '</div>';
  h += '<div style="position:relative;width:240px">';
  h += '<svg viewBox="0 0 16 16" fill="none" stroke="var(--c-gray-400)" stroke-width="1.5" style="width:14px;height:14px;position:absolute;left:10px;top:50%;transform:translateY(-50%)"><circle cx="7" cy="7" r="4.5"/><line x1="10.5" y1="10.5" x2="14" y2="14"/></svg>';
  h += '<input type="text" placeholder="커리큘럼\\xB7코드 검색..." value="' + (CUR_RECV_STATE.search||'') + '" oninput="_crSetSearch(this.value)" style="width:100%;padding:8px 12px 8px 32px;border:1px solid var(--c-gray-200);border-radius:10px;font-size:12px;background:#fff;outline:none;box-sizing:border-box">';
  h += '</div>';
  h += '</div>';

  // ── 그룹 필터링 ──
  var filteredGids = _grpOrder.filter(function(gid) {
    var g = _grpMap[gid];
    if(f !== 'all' && g.status !== f) return false;
    if(q) {
      var match = false;
      if(g.curName && g.curName.toLowerCase().indexOf(q) >= 0) match = true;
      g.codes.forEach(function(c) {
        var hay = (c.subjectCode + ' ' + c.subjectName).toLowerCase();
        if(hay.indexOf(q) >= 0) match = true;
      });
      if(!match) return false;
    }
    return true;
  });

  // ── 그룹 카드 렌더링 ──
  if(filteredGids.length === 0) {
    h += '<div style="text-align:center;padding:60px 20px;color:var(--c-gray-400)">';
    h += '<svg viewBox="0 0 48 48" fill="none" stroke="var(--c-gray-300)" stroke-width="1.5" style="width:48px;height:48px;margin-bottom:12px"><rect x="6" y="6" width="36" height="36" rx="8"/><path d="M18 20h12M18 28h8"/></svg>';
    h += '<div style="font-size:14px;font-weight:600;margin-bottom:4px">해당하는 수신 항목이 없습니다</div>';
    h += '<div style="font-size:12px">필터 조건을 변경해보세요</div>';
    h += '</div>';
  } else {
    var statusColors = {
      detected:{bg:'#FFF3E0',color:'#E65100',label:'변경감지',icon:'⚠'},
      holding:{bg:'#E3F2FD',color:'#1565C0',label:'보류',icon:'⏸'},
      synced:{bg:'#E8F5E9',color:'#2E7D32',label:'최신',icon:'✓'},
      rejected:{bg:'#FFEBEE',color:'#C62828',label:'반려',icon:'↩'},
      unlinked:{bg:'#F5F5F7',color:'#86868B',label:'미연결',icon:'—'}
    };
    h += '<div style="display:flex;flex-direction:column;gap:10px">';
    for(var gi=0;gi<filteredGids.length;gi++) {
      var g = _grpMap[filteredGids[gi]];
      var st = statusColors[g.status] || statusColors.unlinked;
      var isAction = g.status === 'detected' || g.status === 'holding';
      var changeLabels = {structure:'구조 변경',content:'콘텐츠 변경',label:'레이블 변경'};

      h += '<div onclick="_crOpenDetail(\\'' + g.firstCrId + '\\')" style="background:#fff;border-radius:14px;padding:18px 22px;border:1px solid ' + (isAction?'#FFB74D40':'var(--c-gray-200)') + ';cursor:pointer;transition:all .15s;box-shadow:0 1px 3px rgba(0,0,0,.03)">';

      // 상단: 커리큘럼명 + 상태
      h += '<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:6px">';
      h += '<div style="flex:1">';
      if(g.curName) {
        h += '<div style="font-size:15px;font-weight:700;color:var(--c-gray-900);margin-bottom:4px">' + g.curName + '</div>';
        h += '<div style="font-size:12px;color:var(--c-gray-500);display:flex;align-items:center;gap:6px;flex-wrap:wrap">';
        if(g.detectedVer) {
          h += '<span>v' + g.curVer + '</span>';
          h += '<span style="color:var(--c-gray-300)">→</span>';
          h += '<span style="color:#E65100;font-weight:600">v' + g.detectedVer + '</span>';
          h += '<span style="color:var(--c-gray-300)">·</span>';
        } else {
          h += '<span>v' + (g.curVer||'—') + '</span>';
          h += '<span style="color:var(--c-gray-300)">·</span>';
        }
        if(g.diffSummary) h += '<span>' + g.diffSummary + '</span><span style="color:var(--c-gray-300)">·</span>';
        if(g.detectedDate) h += '<span>' + g.detectedDate + '</span>';
        h += '</div>';
      } else {
        h += '<div style="font-size:14px;color:var(--c-gray-400);font-weight:500">미연결 코드</div>';
      }
      h += '</div>';
      h += '<span style="font-size:11px;padding:4px 12px;border-radius:20px;font-weight:600;background:' + st.bg + ';color:' + st.color + ';white-space:nowrap;flex-shrink:0">' + st.icon + ' ' + st.label + '</span>';
      h += '</div>';

      // 코드 칩 목록
      h += '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px">';
      for(var ci2=0;ci2<g.codes.length;ci2++) {
        var c = g.codes[ci2];
        var csc = _crSysColor(c.targetSystem);
        h += '<div style="display:inline-flex;align-items:center;gap:5px;padding:5px 10px;border-radius:8px;border:1px solid var(--c-gray-200);background:var(--c-gray-50);font-size:11px">';
        h += '<span style="font-size:10px;padding:1px 5px;border-radius:3px;font-weight:600;background:' + csc.bg + ';color:' + csc.color + '">' + csc.label + '</span>';
        h += '<span style="font-family:\\'SF Mono\\',SFMono-Regular,Menlo,monospace;font-weight:600;color:var(--c-gray-800);letter-spacing:.3px">' + c.subjectCode + '</span>';
        h += '<span style="color:var(--c-gray-400)">' + c.subjectName + '</span>';
        h += '</div>';
      }
      h += '</div>';

      // 하단 요약
      if(g.curName && g.codes.length > 0) {
        h += '<div style="display:flex;align-items:center;gap:8px;margin-top:10px;padding-top:10px;border-top:1px solid var(--c-gray-100);font-size:11px;color:var(--c-gray-400)">';
        h += '<svg viewBox="0 0 16 16" fill="none" stroke="var(--c-gray-300)" stroke-width="1.5" style="width:12px;height:12px"><path d="M6.5 8.5a3 3 0 004.2.3l1.8-1.8a3 3 0 00-4.2-4.2L7.3 3.8"/><path d="M9.5 7.5a3 3 0 00-4.2-.3L3.5 9a3 3 0 004.2 4.2l1-1"/></svg>';
        h += '연결된 코드 <strong style="color:var(--c-gray-600)">' + g.codes.length + '</strong>건';
        if(g.changeType) h += ' · ' + (changeLabels[g.changeType]||g.changeType);
        h += '</div>';
      }

      h += '</div>';
    }
    h += '</div>';
  }
"""

src = src[:start_idx] + new_list + src[end_idx:]
changes += 1
print('[OK] 2. List view replaced with curriculum-centric groups')

# ============================================================
# 3) 상세 뷰 헤더 — 커리큘럼 중심으로 변경
# ============================================================
old_header = """  // ── 헤더: 뒤로가기 + 코드 배지 ──
  h += '<div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">';
  h += '<button onclick="_crBackToList()" style="padding:6px 14px;border-radius:8px;border:1px solid var(--c-gray-200);background:#fff;color:var(--c-gray-700);font-size:12px;font-weight:500;cursor:pointer;display:flex;align-items:center;gap:4px"><svg viewBox="0 0 8 14" fill="none" stroke="currentColor" stroke-width="1.5" style="width:8px;height:14px"><path d="M7 1L1 7l6 6"/></svg>목록</button>';
  h += '<span style="font-size:11px;padding:3px 8px;border-radius:6px;font-weight:600;background:' + sc.bg + ';color:' + sc.color + ';border:1px solid ' + sc.border + '">' + sc.label + '</span>';
  h += '<span style="font-size:14px;padding:4px 12px;border-radius:7px;font-weight:700;font-family:\\'SF Mono\\',SFMono-Regular,Menlo,monospace;background:var(--c-gray-100);color:var(--c-gray-800);border:1px solid var(--c-gray-200);letter-spacing:.5px">' + item.subjectCode + '</span>';
  h += '<span style="font-size:14px;color:var(--c-gray-500)">' + item.subjectName + '</span>';
  h += '</div>';"""

new_header = """  // ── 헤더: 뒤로가기 + 커리큘럼 정보 ──
  h += '<div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">';
  h += '<button onclick="_crBackToList()" style="padding:6px 14px;border-radius:8px;border:1px solid var(--c-gray-200);background:#fff;color:var(--c-gray-700);font-size:12px;font-weight:500;cursor:pointer;display:flex;align-items:center;gap:4px"><svg viewBox="0 0 8 14" fill="none" stroke="currentColor" stroke-width="1.5" style="width:8px;height:14px"><path d="M7 1L1 7l6 6"/></svg>목록</button>';
  h += '<div style="flex:1">';
  h += '<div style="font-size:16px;font-weight:700;color:var(--c-gray-900)">' + (cur?cur.name:item.linkedCurName||'미연결 코드') + '</div>';
  if(item.linkedCurVer) {
    h += '<div style="font-size:12px;color:var(--c-gray-500);margin-top:2px">';
    if(item.detectedVer) h += 'v' + item.linkedCurVer + ' → <span style="color:#E65100;font-weight:600">v' + item.detectedVer + '</span>';
    else h += 'v' + item.linkedCurVer;
    if(item.diffSummary) h += ' · ' + item.diffSummary;
    h += '</div>';
  }
  h += '</div>';
  h += '</div>';"""

if old_header in src:
    src = src.replace(old_header, new_header, 1)
    changes += 1
    print('[OK] 3. Detail header updated to curriculum-centric')
else:
    print('[WARN] 3. Detail header not found — checking manually')

# ============================================================
# 4) 상세 뷰 코드 체크박스에서 compatStatus 배지 제거
# ============================================================
old_compat_block = """      var compatColors = {
        compatible:{bg:'#E8F5E9',color:'#2E7D32',label:'호환',icon:'✓'},
        'review-needed':{bg:'#FFF3E0',color:'#E65100',label:'확인필요',icon:'!'},
        excluded:{bg:'#FFEBEE',color:'#C62828',label:'제외권장',icon:'✗'}
      };
      var compat = compatColors[rel.compatStatus] || compatColors.compatible;

      h += '<div onclick="_crToggleCode(\\'' + rel.id + '\\')" style="display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:10px;border:1.5px solid ' + (isChecked?'#FF9500':'var(--c-gray-200)') + ';background:' + (isChecked?'#FF950006':'#fff') + ';cursor:pointer;transition:all .15s">';
      h += '<div style="width:20px;height:20px;border-radius:6px;border:2px solid ' + (isChecked?'#FF9500':'var(--c-gray-300)') + ';display:flex;align-items:center;justify-content:center;flex-shrink:0;background:' + (isChecked?'#FF9500':'#fff') + ';transition:all .15s">';
      if(isChecked) h += '<svg viewBox="0 0 12 12" fill="none" stroke="#fff" stroke-width="2" style="width:10px;height:10px"><path d="M2 6l3 3 5-5"/></svg>';
      h += '</div>';
      h += '<span style="font-size:10px;padding:2px 6px;border-radius:4px;font-weight:600;background:' + relSc.bg + ';color:' + relSc.color + '">' + relSc.label + '</span>';
      h += '<span style="font-size:11px;padding:2px 8px;border-radius:4px;font-weight:600;font-family:\\'SF Mono\\',SFMono-Regular,Menlo,monospace;background:var(--c-gray-100);color:var(--c-gray-700);border:1px solid var(--c-gray-200);letter-spacing:.3px">' + rel.subjectCode + '</span>';
      h += '<span style="flex:1;font-size:12px;color:var(--c-gray-500)">' + rel.subjectName + '</span>';
      h += '<span style="font-size:10px;padding:3px 8px;border-radius:10px;font-weight:600;background:' + compat.bg + ';color:' + compat.color + '">' + compat.icon + ' ' + compat.label + '</span>';
      h += '</div>';"""

new_compat_block = """      h += '<div onclick="_crToggleCode(\\'' + rel.id + '\\')" style="display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:10px;border:1.5px solid ' + (isChecked?'#FF9500':'var(--c-gray-200)') + ';background:' + (isChecked?'#FF950006':'#fff') + ';cursor:pointer;transition:all .15s">';
      h += '<div style="width:20px;height:20px;border-radius:6px;border:2px solid ' + (isChecked?'#FF9500':'var(--c-gray-300)') + ';display:flex;align-items:center;justify-content:center;flex-shrink:0;background:' + (isChecked?'#FF9500':'#fff') + ';transition:all .15s">';
      if(isChecked) h += '<svg viewBox="0 0 12 12" fill="none" stroke="#fff" stroke-width="2" style="width:10px;height:10px"><path d="M2 6l3 3 5-5"/></svg>';
      h += '</div>';
      h += '<span style="font-size:10px;padding:2px 6px;border-radius:4px;font-weight:600;background:' + relSc.bg + ';color:' + relSc.color + '">' + relSc.label + '</span>';
      h += '<span style="font-size:11px;padding:2px 8px;border-radius:4px;font-weight:600;font-family:\\'SF Mono\\',SFMono-Regular,Menlo,monospace;background:var(--c-gray-100);color:var(--c-gray-700);border:1px solid var(--c-gray-200);letter-spacing:.3px">' + rel.subjectCode + '</span>';
      h += '<span style="flex:1;font-size:12px;color:var(--c-gray-500)">' + rel.subjectName + '</span>';
      h += '</div>';"""

if old_compat_block in src:
    src = src.replace(old_compat_block, new_compat_block, 1)
    changes += 1
    print('[OK] 4. compatStatus badges removed from detail view')
else:
    print('[WARN] 4. compatStatus block not found in detail view')

# ============================================================
# Write output
# ============================================================
with open(FILE, 'w', encoding='utf-8') as f:
    f.write(src)

print('\n=== PATCH COMPLETE: {} changes applied ==='.format(changes))
