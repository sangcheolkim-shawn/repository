#!/usr/bin/env python3
"""
커리큘럼 수신(cur-receive) 뷰 전체 추가 패치
- 사이드바 메뉴
- HTML 컨테이너
- ALL_VIEWS / NAV_MAP 등록
- switchView 디스패처
- CUR_RECEIVE_DATA + CUR_RECV_STATE
- renderCurReceiveView() (목록)
- 상세뷰 3-STEP 의사결정 흐름
"""
import re, sys

FILE = '/sessions/lucid-busy-hamilton/mnt/Prototype/cms_stg_prd_v8.5.html'

with open(FILE, 'r', encoding='utf-8') as f:
    src = f.read()

changes = 0

# ============================================================
# 1) 사이드바: nav-service-bind 과 nav-service-content 사이에 nav-cur-receive 삽입
# ============================================================
sidebar_marker = '      <div class="sb-nav-sub" id="nav-service-content" onclick="switchView(\'service-content\')">'
sidebar_insert = '''      <div class="sb-nav-sub" id="nav-cur-receive" onclick="switchView('cur-receive')">
        <span class="sb-nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></span>
        <span class="sb-nav-label">커리큘럼 수신</span>
        <span class="sb-nav-badge" id="sbBadgeCurRecv" style="background:rgba(255,149,0,.25);color:#FF9500">0</span>
      </div>

'''
if sidebar_marker in src:
    src = src.replace(sidebar_marker, sidebar_insert + sidebar_marker, 1)
    changes += 1
    print('[OK] 1. Sidebar menu inserted')
else:
    print('[FAIL] 1. Sidebar marker not found')
    sys.exit(1)

# ============================================================
# 2) HTML 컨테이너: view-batch-receive 앞에 view-cur-receive 삽입
# ============================================================
container_marker = '    <!-- ════ BATCH RECEIVE VIEW (외부 수신 현황) ════ -->'
container_insert = '''    <!-- ════ CUR RECEIVE VIEW (커리큘럼 수신) ════ -->
    <div id="view-cur-receive" style="display:none;flex:1;flex-direction:column;overflow:hidden">
      <div class="page-header">
        <div class="page-header-icon" style="background:rgba(255,149,0,.12)"><svg viewBox="0 0 24 24" fill="none" stroke="#FF9500" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></div>
        <span class="page-header-title">커리큘럼 수신</span>
        <div class="page-header-stats">
          <span class="ph-stat">전체 <strong id="crTotalCount">0</strong>건</span>
          <span class="ph-stat" style="color:#FF9500">변경감지 <strong id="crDetectedCount">0</strong>건</span>
        </div>
      </div>
      <div id="crRoot" style="flex:1;overflow-y:auto;padding:20px;background:var(--c-bg)"></div>
    </div>

'''
if container_marker in src:
    src = src.replace(container_marker, container_insert + container_marker, 1)
    changes += 1
    print('[OK] 2. HTML container inserted')
else:
    print('[FAIL] 2. Container marker not found')
    sys.exit(1)

# ============================================================
# 3) ALL_VIEWS 배열에 'cur-receive' 추가
# ============================================================
old_allviews = "const ALL_VIEWS = ['review','deploy','service-content','settings','batch-receive','workflow','work-config','content-register','form-manage','curriculum','service-bind','scoring-sim'];"
new_allviews = "const ALL_VIEWS = ['review','deploy','service-content','settings','batch-receive','workflow','work-config','content-register','form-manage','curriculum','service-bind','scoring-sim','cur-receive'];"
if old_allviews in src:
    src = src.replace(old_allviews, new_allviews, 1)
    changes += 1
    print('[OK] 3. ALL_VIEWS updated')
else:
    print('[FAIL] 3. ALL_VIEWS marker not found')
    sys.exit(1)

# ============================================================
# 4) NAV_MAP에 'cur-receive' 추가
# ============================================================
navmap_marker = "  'scoring-sim':       'nav-scoring-sim',\n};"
navmap_replace = "  'scoring-sim':       'nav-scoring-sim',\n  'cur-receive':       'nav-cur-receive',\n};"
if navmap_marker in src:
    src = src.replace(navmap_marker, navmap_replace, 1)
    changes += 1
    print('[OK] 4. NAV_MAP updated')
else:
    print('[FAIL] 4. NAV_MAP marker not found')
    sys.exit(1)

# ============================================================
# 5) switchView 디스패처에 cur-receive 케이스 추가
# ============================================================
sw_marker = "  else if(view === 'scoring-sim') renderScoringSimView();"
sw_replace = "  else if(view === 'scoring-sim') renderScoringSimView();\n  else if(view === 'cur-receive') renderCurReceiveView();"
if sw_marker in src:
    src = src.replace(sw_marker, sw_replace, 1)
    changes += 1
    print('[OK] 5. switchView dispatcher updated')
else:
    print('[FAIL] 5. switchView marker not found')
    sys.exit(1)

# ============================================================
# 6) 데이터 + 상태 + 전체 렌더 함수 (BATCH_RECEIVE_DATA 바로 위에)
# ============================================================
data_marker = 'var BATCH_RECEIVE_DATA = ['

# NOTE: All Korean strings use unicode escapes per coding convention
cur_receive_code = r'''// ══════════════════════════════════════════
// ■ 커리큘럼 수신 (CUR-RECEIVE) — 데이터·상태·렌더
// ══════════════════════════════════════════

// -- 코드 중심 수신 데이터: 각 과목코드가 연결된 커리큘럼과의 차이를 기록
var CUR_RECEIVE_DATA = [
  {id:'CR-001', subjectCode:'M-MATH-301', subjectName:'수학 초등3 기초', targetSystem:'ND',
   linkedCurId:'CUR-001', linkedCurName:'수학 기초 과정', linkedCurVer:3,
   detectedVer:4, changeType:'structure', detectedDate:'2026-06-05',
   diffSummary:'과정 8→9, 세트 80→90',
   diffDetail:[
     {field:'과정 수',before:'8과정',after:'9과정',impact:'high'},
     {field:'세트 수',before:'80세트',after:'90세트',impact:'high'},
     {field:'과정명 변경',before:'기초수학 8과정',after:'기초수학 9과정 (심화)',impact:'medium'}
   ],
   status:'detected', compatStatus:'review-needed'},
  {id:'CR-002', subjectCode:'M-MATH-302', subjectName:'수학 초등3 심화', targetSystem:'ND',
   linkedCurId:'CUR-001', linkedCurName:'수학 기초 과정', linkedCurVer:3,
   detectedVer:4, changeType:'structure', detectedDate:'2026-06-05',
   diffSummary:'과정 8→9, 세트 80→90',
   diffDetail:[
     {field:'과정 수',before:'8과정',after:'9과정',impact:'high'},
     {field:'세트 수',before:'80세트',after:'90세트',impact:'high'}
   ],
   status:'detected', compatStatus:'compatible'},
  {id:'CR-003', subjectCode:'E-ENG-201', subjectName:'영어 회화 초등2', targetSystem:'ND',
   linkedCurId:'CUR-002', linkedCurName:'영어 회화 과정', linkedCurVer:2,
   detectedVer:null, changeType:null, detectedDate:null,
   diffSummary:null, diffDetail:[],
   status:'synced', compatStatus:'ok'},
  {id:'CR-004', subjectCode:'NH-M-501', subjectName:'눈높이 수학 변형A', targetSystem:'NH',
   linkedCurId:'CUR-001', linkedCurName:'수학 기초 과정', linkedCurVer:3,
   detectedVer:4, changeType:'structure', detectedDate:'2026-06-05',
   diffSummary:'과정 8→9, 세트 80→90',
   diffDetail:[
     {field:'과정 수',before:'8과정',after:'9과정',impact:'high'},
     {field:'세트 수',before:'80세트',after:'90세트',impact:'high'}
   ],
   status:'detected', compatStatus:'excluded'},
  {id:'CR-005', subjectCode:'K-KOR-101', subjectName:'국어 기초 초1', targetSystem:'ND',
   linkedCurId:null, linkedCurName:null, linkedCurVer:null,
   detectedVer:null, changeType:null, detectedDate:null,
   diffSummary:null, diffDetail:[],
   status:'unlinked', compatStatus:null},
  {id:'CR-006', subjectCode:'E-ENG-301', subjectName:'영어 파닉스 초3', targetSystem:'ND',
   linkedCurId:'CUR-006', linkedCurName:'영어 파닉스 과정', linkedCurVer:2,
   detectedVer:3, changeType:'label', detectedDate:'2026-06-07',
   diffSummary:'레이블 수정 2건',
   diffDetail:[
     {field:'과정명',before:'회화 기초',after:'파닉스 회화 기초',impact:'low'}
   ],
   status:'detected', compatStatus:'compatible'}
];

var CUR_RECV_STATE = {
  filter: 'all',          // all | detected | synced | unlinked
  search: '',
  detailId: null,         // 상세 뷰 대상 CR id
  step: 1,                // 상세 뷰 단계 (1~3)
  checkedCodes: {},       // STEP2: code별 체크 상태 { 'CR-xxx': true/false }
  showDiff: false
};

// ── 파이프라인 상태 집계 헬퍼 ──
function _crGetPipelineCounts() {
  var bind = 0, recv = 0, content = 0, deploy = 0;
  CURRICULUM_DATA.forEach(function(c) {
    if(c.status === 'active') {
      var hasBind = c.depths && c.depths.some(function(d){ return d.forms && d.forms.some(function(f){ return f.boundCodes && f.boundCodes.length > 0; }); });
      if(hasBind) bind++;
    }
  });
  recv = CUR_RECEIVE_DATA.filter(function(r){ return r.status === 'detected'; }).length;
  // content/deploy는 기존 데이터에서 집계
  var activeWI = (WORK_ITEMS_V7||[]).filter(function(w){ return w.phase === 'register'; });
  content = activeWI.length;
  var deployedWI = (WORK_ITEMS_V7||[]).filter(function(w){ return w.phase === 'deploy'; });
  deploy = deployedWI.length;
  return {bind:bind, recv:recv, content:content, deploy:deploy};
}

// ── 필터 설정 ──
function _crSetFilter(f) {
  CUR_RECV_STATE.filter = f;
  CUR_RECV_STATE.detailId = null;
  CUR_RECV_STATE.step = 1;
  renderCurReceiveView();
}
function _crSetSearch(v) {
  CUR_RECV_STATE.search = v;
  renderCurReceiveView();
}

// ── 같은 커리큘럼에 연결된 다른 코드 목록 ──
function _crGetSiblingCodes(crItem) {
  if(!crItem.linkedCurId) return [];
  return CUR_RECEIVE_DATA.filter(function(r) {
    return r.linkedCurId === crItem.linkedCurId && r.id !== crItem.id;
  });
}

// ── 상세 뷰 진입 ──
function _crOpenDetail(crId) {
  CUR_RECV_STATE.detailId = crId;
  CUR_RECV_STATE.step = 1;
  CUR_RECV_STATE.showDiff = false;
  // 기본 체크 상태 초기화 — 같은 커리큘럼의 detected 코드만 체크
  var item = CUR_RECEIVE_DATA.find(function(r){ return r.id === crId; });
  CUR_RECV_STATE.checkedCodes = {};
  if(item && item.linkedCurId) {
    CUR_RECEIVE_DATA.forEach(function(r) {
      if(r.linkedCurId === item.linkedCurId && r.status === 'detected') {
        CUR_RECV_STATE.checkedCodes[r.id] = (r.compatStatus !== 'excluded');
      }
    });
  }
  renderCurReceiveView();
}
function _crBackToList() {
  CUR_RECV_STATE.detailId = null;
  CUR_RECV_STATE.step = 1;
  renderCurReceiveView();
}
function _crSetStep(n) {
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
}

// ── 시스템 색상 헬퍼 ──
function _crSysColor(sys) {
  return WC_SYSTEM_COLORS[sys] || {bg:'#F5F5F7',color:'#86868B',border:'#D2D2D7',label:sys};
}

// ══════════════════════════════════════════
// renderCurReceiveView — 메인 엔트리
// ══════════════════════════════════════════
function renderCurReceiveView() {
  var root = document.getElementById('crRoot');
  if(!root) return;

  // 상세 뷰 모드
  if(CUR_RECV_STATE.detailId) {
    _crRenderDetail(root);
    return;
  }

  // 목록 뷰
  var h = '';
  var pipe = _crGetPipelineCounts();
  var f = CUR_RECV_STATE.filter;
  var q = (CUR_RECV_STATE.search || '').toLowerCase();

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
    h += '<div onclick="switchView(\'' + ps.view + '\')" style="flex:1;display:flex;align-items:center;justify-content:center;gap:6px;padding:10px 12px;border-radius:10px;cursor:pointer;transition:all .15s;' + (isActive ? 'background:' + ps.color + '10;border:1.5px solid ' + ps.color + '30' : 'background:transparent;border:1.5px solid transparent') + '">';
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

  // ── 필터 탭 + 검색 ──
  h += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;gap:12px;flex-wrap:wrap">';
  h += '<div style="display:flex;gap:0;border:1px solid var(--c-gray-200);border-radius:10px;overflow:hidden;background:var(--c-gray-50)">';
  var tabs = [
    {key:'all',label:'전체'},
    {key:'detected',label:'변경감지',dot:'#FF9500'},
    {key:'synced',label:'최신',dot:'#34C759'},
    {key:'unlinked',label:'미연결',dot:'#86868B'}
  ];
  for(var ti=0;ti<tabs.length;ti++) {
    var t = tabs[ti];
    var isOn = (f === t.key);
    var cnt = CUR_RECEIVE_DATA.filter(function(r){
      if(t.key === 'all') return true;
      return r.status === t.key;
    }).length;
    h += '<button onclick="_crSetFilter(\'' + t.key + '\')" style="padding:7px 16px;border:none;font-size:12px;font-weight:' + (isOn?'600':'500') + ';cursor:pointer;display:flex;align-items:center;gap:5px;background:' + (isOn?'#fff':'transparent') + ';color:' + (isOn?'var(--c-gray-900)':'var(--c-gray-500)') + ';transition:all .15s;' + (ti<tabs.length-1?'border-right:1px solid var(--c-gray-200)':'') + '">';
    if(t.dot) h += '<span style="width:7px;height:7px;border-radius:50%;background:' + t.dot + ';display:inline-block"></span>';
    h += t.label + ' <span style="font-size:10px;color:var(--c-gray-400)">' + cnt + '</span></button>';
  }
  h += '</div>';
  // 검색
  h += '<div style="position:relative;width:240px">';
  h += '<svg viewBox="0 0 16 16" fill="none" stroke="var(--c-gray-400)" stroke-width="1.5" style="width:14px;height:14px;position:absolute;left:10px;top:50%;transform:translateY(-50%)"><circle cx="7" cy="7" r="4.5"/><line x1="10.5" y1="10.5" x2="14" y2="14"/></svg>';
  h += '<input type="text" placeholder="코드\xB7커리큘럼 검색..." value="' + (CUR_RECV_STATE.search||'') + '" oninput="_crSetSearch(this.value)" style="width:100%;padding:8px 12px 8px 32px;border:1px solid var(--c-gray-200);border-radius:10px;font-size:12px;background:#fff;outline:none;box-sizing:border-box">';
  h += '</div>';
  h += '</div>';

  // ── 카드 목록 ──
  var filtered = CUR_RECEIVE_DATA.filter(function(r) {
    if(f !== 'all' && r.status !== f) return false;
    if(q) {
      var haystack = (r.subjectCode + ' ' + r.subjectName + ' ' + (r.linkedCurName||'')).toLowerCase();
      if(haystack.indexOf(q) < 0) return false;
    }
    return true;
  });

  if(filtered.length === 0) {
    h += '<div style="text-align:center;padding:60px 20px;color:var(--c-gray-400)">';
    h += '<svg viewBox="0 0 48 48" fill="none" stroke="var(--c-gray-300)" stroke-width="1.5" style="width:48px;height:48px;margin-bottom:12px"><rect x="6" y="6" width="36" height="36" rx="8"/><path d="M18 20h12M18 28h8"/></svg>';
    h += '<div style="font-size:14px;font-weight:600;margin-bottom:4px">해당하는 수신 항목이 없습니다</div>';
    h += '<div style="font-size:12px">필터 조건을 변경해보세요</div>';
    h += '</div>';
  } else {
    h += '<div style="display:flex;flex-direction:column;gap:10px">';
    for(var ci=0;ci<filtered.length;ci++) {
      var cr = filtered[ci];
      var sc = _crSysColor(cr.targetSystem);
      var statusColors = {
        detected:{bg:'#FFF3E0',color:'#E65100',label:'변경감지',icon:'⚠'},
        synced:{bg:'#E8F5E9',color:'#2E7D32',label:'최신',icon:'✓'},
        unlinked:{bg:'#F5F5F7',color:'#86868B',label:'미연결',icon:'—'}
      };
      var st = statusColors[cr.status] || statusColors.unlinked;
      var isDetected = cr.status === 'detected';

      h += '<div onclick="_crOpenDetail(\'' + cr.id + '\')" style="background:#fff;border-radius:14px;padding:16px 20px;border:1px solid ' + (isDetected?'#FFB74D40':'var(--c-gray-200)') + ';cursor:pointer;transition:all .15s;box-shadow:0 1px 3px rgba(0,0,0,.03)">';
      // 상단: 코드 + 시스템 배지 + 상태
      h += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">';
      h += '<div style="display:flex;align-items:center;gap:8px">';
      h += '<span style="font-size:11px;padding:3px 8px;border-radius:6px;font-weight:600;background:' + sc.bg + ';color:' + sc.color + ';border:1px solid ' + sc.border + '">' + sc.label + '</span>';
      h += '<span style="font-size:14px;font-weight:700;color:var(--c-gray-900);letter-spacing:-.3px">' + cr.subjectCode + '</span>';
      h += '<span style="font-size:13px;color:var(--c-gray-500)">' + cr.subjectName + '</span>';
      h += '</div>';
      h += '<span style="font-size:11px;padding:3px 10px;border-radius:20px;font-weight:600;background:' + st.bg + ';color:' + st.color + '">' + st.icon + ' ' + st.label + '</span>';
      h += '</div>';

      // 하단: 연결 커리큘럼 + diff 요약
      if(cr.linkedCurName) {
        h += '<div style="display:flex;align-items:center;gap:12px;padding:8px 12px;border-radius:10px;background:var(--c-gray-50)">';
        h += '<div style="display:flex;align-items:center;gap:6px;flex:1">';
        h += '<svg viewBox="0 0 16 16" fill="none" stroke="var(--c-gray-400)" stroke-width="1.5" style="width:13px;height:13px"><polygon points="8 1 1 5 8 9 15 5 8 1"/><polyline points="1 11 8 15 15 11"/><polyline points="1 8 8 12 15 8"/></svg>';
        h += '<span style="font-size:12px;color:var(--c-gray-700);font-weight:500">' + cr.linkedCurName + '</span>';
        h += '<span style="font-size:10px;color:var(--c-gray-400)">v' + cr.linkedCurVer + '</span>';
        h += '</div>';
        if(isDetected && cr.diffSummary) {
          h += '<div style="display:flex;align-items:center;gap:6px">';
          h += '<span style="font-size:11px;color:#E65100;font-weight:500">' + cr.diffSummary + '</span>';
          h += '<span style="font-size:10px;color:var(--c-gray-400)">v' + cr.detectedVer + ' 감지</span>';
          h += '<svg viewBox="0 0 8 14" fill="none" stroke="var(--c-gray-300)" stroke-width="1.5" style="width:8px;height:14px"><path d="M1 1l6 6-6 6"/></svg>';
          h += '</div>';
        }
        h += '</div>';
      } else {
        h += '<div style="padding:8px 12px;border-radius:10px;background:var(--c-gray-50);font-size:12px;color:var(--c-gray-400)">연결된 커리큘럼이 없습니다</div>';
      }
      h += '</div>';
    }
    h += '</div>';
  }

  // 배지 업데이트
  var totalEl = document.getElementById('crTotalCount');
  var detEl = document.getElementById('crDetectedCount');
  var badgeEl = document.getElementById('sbBadgeCurRecv');
  var detCount = CUR_RECEIVE_DATA.filter(function(r){ return r.status === 'detected'; }).length;
  if(totalEl) totalEl.textContent = CUR_RECEIVE_DATA.length;
  if(detEl) detEl.textContent = detCount;
  if(badgeEl) badgeEl.textContent = detCount;

  root.innerHTML = h;
}

// ══════════════════════════════════════════
// _crRenderDetail — 상세 뷰 (3-STEP)
// ══════════════════════════════════════════
function _crRenderDetail(root) {
  var crId = CUR_RECV_STATE.detailId;
  var item = CUR_RECEIVE_DATA.find(function(r){ return r.id === crId; });
  if(!item) { _crBackToList(); return; }

  var step = CUR_RECV_STATE.step;
  var sc = _crSysColor(item.targetSystem);
  var siblings = _crGetSiblingCodes(item);
  var allRelated = [item].concat(siblings).filter(function(r){ return r.status === 'detected'; });
  var h = '';

  // ── 뒤로가기 + 제목 ──
  h += '<div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">';
  h += '<button onclick="_crBackToList()" style="padding:6px 14px;border-radius:8px;border:1px solid var(--c-gray-200);background:#fff;color:var(--c-gray-700);font-size:12px;font-weight:500;cursor:pointer;display:flex;align-items:center;gap:4px"><svg viewBox="0 0 8 14" fill="none" stroke="currentColor" stroke-width="1.5" style="width:8px;height:14px"><path d="M7 1L1 7l6 6"/></svg>목록</button>';
  h += '<span style="font-size:11px;padding:3px 8px;border-radius:6px;font-weight:600;background:' + sc.bg + ';color:' + sc.color + ';border:1px solid ' + sc.border + '">' + sc.label + '</span>';
  h += '<span style="font-size:18px;font-weight:700;color:var(--c-gray-900);letter-spacing:-.5px">' + item.subjectCode + '</span>';
  h += '<span style="font-size:14px;color:var(--c-gray-500)">' + item.subjectName + '</span>';
  h += '</div>';

  // ── STEP 인디케이터 ──
  h += '<div style="display:flex;align-items:center;gap:0;margin-bottom:24px;padding:4px;background:#fff;border-radius:12px;border:1px solid var(--c-gray-200)">';
  var steps = [
    {n:1,label:'변경 알림',desc:'코드 변경 내역 확인'},
    {n:2,label:'영향 분석',desc:'코드별 적용 선택'},
    {n:3,label:'결과 미리보기',desc:'Temp 생성 확인'}
  ];
  for(var si=0;si<steps.length;si++) {
    var ss = steps[si];
    var isCur = step === ss.n;
    var isDone = step > ss.n;
    h += '<div onclick="' + (item.status==='detected'?'_crSetStep('+ss.n+')':'') + '" style="flex:1;display:flex;align-items:center;gap:8px;padding:10px 16px;border-radius:10px;cursor:pointer;transition:all .15s;' + (isCur?'background:#FF950010;':'') + '">';
    h += '<span style="width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;' + (isDone?'background:#34C759;color:#fff':isCur?'background:#FF9500;color:#fff':'background:var(--c-gray-100);color:var(--c-gray-400)') + '">' + (isDone?'✓':ss.n) + '</span>';
    h += '<div><div style="font-size:12px;font-weight:' + (isCur?'700':'500') + ';color:' + (isCur?'var(--c-gray-900)':'var(--c-gray-500)') + '">' + ss.label + '</div>';
    h += '<div style="font-size:10px;color:var(--c-gray-400)">' + ss.desc + '</div></div>';
    if(si < steps.length-1) {
      h += '</div>';
      h += '<svg viewBox="0 0 8 14" fill="none" stroke="var(--c-gray-300)" stroke-width="1" style="width:6px;height:14px;flex-shrink:0"><path d="M1 1l6 6-6 6"/></svg>';
    } else {
      h += '</div>';
    }
  }
  h += '</div>';

  // ── STEP 콘텐츠 ──
  if(step === 1) {
    h += _crRenderStep1(item, siblings);
  } else if(step === 2) {
    h += _crRenderStep2(item, allRelated);
  } else if(step === 3) {
    h += _crRenderStep3(item, allRelated);
  }

  root.innerHTML = h;
}

// ── STEP 1: 변경 알림 ──
function _crRenderStep1(item, siblings) {
  var h = '';
  var cur = CURRICULUM_DATA.find(function(c){ return c.id === item.linkedCurId; });

  // 알림 배너
  h += '<div style="background:linear-gradient(135deg,#FFF8E1,#FFF3E0);border:1px solid #FFB74D40;border-radius:14px;padding:20px 24px;margin-bottom:20px">';
  h += '<div style="display:flex;align-items:flex-start;gap:12px">';
  h += '<span style="font-size:24px;flex-shrink:0">⚠️</span>';
  h += '<div style="flex:1">';
  h += '<div style="font-size:15px;font-weight:700;color:#E65100;margin-bottom:6px">과목코드 ' + item.subjectCode + ' : ' + item.subjectName + ' 커리큘럼 변경이 감지되었습니다</div>';
  h += '<div style="font-size:12px;color:var(--c-gray-600);">감지일: ' + (item.detectedDate||'-') + ' \xB7 변경 유형: ' + (item.changeType==='structure'?'구조 변경':item.changeType==='label'?'레이블 수정':'기타') + '</div>';
  h += '</div>';
  h += '</div>';
  h += '</div>';

  // 연결된 커리큘럼 정보
  if(cur) {
    h += '<div style="background:#fff;border-radius:14px;padding:20px;border:1px solid var(--c-gray-200);margin-bottom:16px">';
    h += '<div style="font-size:13px;font-weight:700;color:var(--c-gray-800);margin-bottom:14px;display:flex;align-items:center;gap:6px">';
    h += '<svg viewBox="0 0 16 16" fill="none" stroke="#0071E3" stroke-width="1.5" style="width:14px;height:14px"><polygon points="8 1 1 5 8 9 15 5 8 1"/><polyline points="1 11 8 15 15 11"/><polyline points="1 8 8 12 15 8"/></svg>';
    h += '연결된 커리큘럼</div>';
    h += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">';
    h += '<div style="padding:12px;border-radius:10px;background:var(--c-gray-50)">';
    h += '<div style="font-size:10px;color:var(--c-gray-400);margin-bottom:4px">커리큘럼명</div>';
    h += '<div style="font-size:13px;font-weight:600;color:var(--c-gray-800)">' + cur.name + '</div></div>';
    h += '<div style="padding:12px;border-radius:10px;background:var(--c-gray-50)">';
    h += '<div style="font-size:10px;color:var(--c-gray-400);margin-bottom:4px">현재 버전</div>';
    h += '<div style="font-size:13px;font-weight:600;color:var(--c-gray-800)">v' + (cur.version||1) + ' <span style="font-size:10px;color:var(--c-gray-400)">(' + cur.status + ')</span></div></div>';
    h += '<div style="padding:12px;border-radius:10px;background:var(--c-gray-50)">';
    h += '<div style="font-size:10px;color:var(--c-gray-400);margin-bottom:4px">구조</div>';
    h += '<div style="font-size:13px;font-weight:600;color:var(--c-gray-800)">' + (cur.depths?cur.depths.map(function(d){return d.name+'('+d.count+')';}).join(' → '):'') + '</div></div>';
    h += '</div>';
    h += '</div>';
  }

  // Diff 테이블
  if(item.diffDetail && item.diffDetail.length > 0) {
    h += '<div style="background:#fff;border-radius:14px;padding:20px;border:1px solid var(--c-gray-200);margin-bottom:16px">';
    h += '<div style="font-size:13px;font-weight:700;color:var(--c-gray-800);margin-bottom:14px;display:flex;align-items:center;gap:6px">';
    h += '<svg viewBox="0 0 16 16" fill="none" stroke="#FF9500" stroke-width="1.5" style="width:14px;height:14px"><path d="M14 8H2M8 2v12"/></svg>';
    h += '변경 상세 (v' + item.linkedCurVer + ' → v' + item.detectedVer + ')</div>';
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

  // 같은 커리큘럼을 공유하는 다른 코드
  if(siblings.length > 0) {
    h += '<div style="background:#fff;border-radius:14px;padding:20px;border:1px solid var(--c-gray-200);margin-bottom:16px">';
    h += '<div style="font-size:13px;font-weight:700;color:var(--c-gray-800);margin-bottom:14px;display:flex;align-items:center;gap:6px">';
    h += '<svg viewBox="0 0 16 16" fill="none" stroke="#8944AB" stroke-width="1.5" style="width:14px;height:14px"><path d="M6.5 8.5a3 3 0 004.2.3l1.8-1.8a3 3 0 00-4.2-4.2L7.3 3.8"/><path d="M9.5 7.5a3 3 0 00-4.2-.3L3.5 9a3 3 0 004.2 4.2l1-1"/></svg>';
    h += '같은 커리큘럼을 공유하는 다른 코드 (' + siblings.length + '건)</div>';
    h += '<div style="display:flex;flex-direction:column;gap:6px">';
    for(var sbi=0;sbi<siblings.length;sbi++) {
      var sb = siblings[sbi];
      var sbSc = _crSysColor(sb.targetSystem);
      var sbSt = sb.status==='detected'?{bg:'#FFF3E0',color:'#E65100',label:'변경감지'}:sb.status==='synced'?{bg:'#E8F5E9',color:'#2E7D32',label:'최신'}:{bg:'#F5F5F7',color:'#86868B',label:sb.status};
      h += '<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:8px;background:var(--c-gray-50)">';
      h += '<span style="font-size:10px;padding:2px 6px;border-radius:4px;font-weight:600;background:' + sbSc.bg + ';color:' + sbSc.color + '">' + sbSc.label + '</span>';
      h += '<span style="font-size:12px;font-weight:600;color:var(--c-gray-800)">' + sb.subjectCode + '</span>';
      h += '<span style="font-size:11px;color:var(--c-gray-500)">' + sb.subjectName + '</span>';
      h += '<span style="margin-left:auto;font-size:10px;padding:2px 8px;border-radius:10px;font-weight:500;background:' + sbSt.bg + ';color:' + sbSt.color + '">' + sbSt.label + '</span>';
      h += '</div>';
    }
    h += '</div>';
    h += '</div>';
  }

  // 다음 단계 버튼
  if(item.status === 'detected') {
    h += '<div style="display:flex;justify-content:flex-end;gap:10px;margin-top:8px">';
    h += '<button onclick="_crSetStep(2)" style="padding:10px 24px;border-radius:10px;border:none;background:#FF9500;color:#fff;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px;box-shadow:0 2px 8px rgba(255,149,0,.3);transition:all .15s">영향 분석 진행 <svg viewBox="0 0 8 14" fill="none" stroke="#fff" stroke-width="2" style="width:8px;height:14px"><path d="M1 1l6 6-6 6"/></svg></button>';
    h += '</div>';
  }

  return h;
}

// ── STEP 2: 영향 분석 (코드별 선택) ──
function _crRenderStep2(item, allRelated) {
  var h = '';
  var checkedCount = 0;
  allRelated.forEach(function(r){ if(CUR_RECV_STATE.checkedCodes[r.id]) checkedCount++; });

  h += '<div style="background:#fff;border-radius:14px;padding:20px;border:1px solid var(--c-gray-200);margin-bottom:16px">';
  h += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">';
  h += '<div style="font-size:13px;font-weight:700;color:var(--c-gray-800);display:flex;align-items:center;gap:6px">';
  h += '<svg viewBox="0 0 16 16" fill="none" stroke="#FF9500" stroke-width="1.5" style="width:14px;height:14px"><rect x="2" y="2" width="12" height="12" rx="3"/><path d="M5 8l2 2 4-4"/></svg>';
  h += '코드별 업데이트 적용 선택</div>';
  h += '<span style="font-size:11px;color:var(--c-gray-400)">' + checkedCount + '/' + allRelated.length + ' 선택됨</span>';
  h += '</div>';

  h += '<div style="font-size:12px;color:var(--c-gray-500);margin-bottom:16px;padding:10px 14px;border-radius:10px;background:var(--c-gray-50)">';
  h += '선택한 코드는 v' + (item.detectedVer||'?') + ' 구조로 업데이트됩니다. 선택하지 않은 코드는 현재 버전(v' + item.linkedCurVer + ')을 유지합니다.</div>';

  // 코드 카드
  h += '<div style="display:flex;flex-direction:column;gap:8px">';
  for(var ri=0;ri<allRelated.length;ri++) {
    var rel = allRelated[ri];
    var isChecked = !!CUR_RECV_STATE.checkedCodes[rel.id];
    var relSc = _crSysColor(rel.targetSystem);
    var compatColors = {
      compatible:{bg:'#E8F5E9',color:'#2E7D32',label:'호환',icon:'✓'},
      'review-needed':{bg:'#FFF3E0',color:'#E65100',label:'확인필요',icon:'!'},
      excluded:{bg:'#FFEBEE',color:'#C62828',label:'제외',icon:'✗'}
    };
    var compat = compatColors[rel.compatStatus] || compatColors.compatible;

    h += '<div onclick="_crToggleCode(\'' + rel.id + '\')" style="display:flex;align-items:center;gap:14px;padding:14px 16px;border-radius:12px;border:1.5px solid ' + (isChecked?'#FF9500':'var(--c-gray-200)') + ';background:' + (isChecked?'#FF950008':'#fff') + ';cursor:pointer;transition:all .15s">';
    // 체크박스
    h += '<div style="width:22px;height:22px;border-radius:6px;border:2px solid ' + (isChecked?'#FF9500':'var(--c-gray-300)') + ';display:flex;align-items:center;justify-content:center;flex-shrink:0;background:' + (isChecked?'#FF9500':'#fff') + ';transition:all .15s">';
    if(isChecked) h += '<svg viewBox="0 0 12 12" fill="none" stroke="#fff" stroke-width="2" style="width:10px;height:10px"><path d="M2 6l3 3 5-5"/></svg>';
    h += '</div>';
    // 정보
    h += '<div style="flex:1;display:flex;align-items:center;gap:10px">';
    h += '<span style="font-size:10px;padding:2px 6px;border-radius:4px;font-weight:600;background:' + relSc.bg + ';color:' + relSc.color + '">' + relSc.label + '</span>';
    h += '<span style="font-size:13px;font-weight:600;color:var(--c-gray-800)">' + rel.subjectCode + '</span>';
    h += '<span style="font-size:12px;color:var(--c-gray-500)">' + rel.subjectName + '</span>';
    h += '</div>';
    // 호환성
    h += '<span style="font-size:10px;padding:3px 10px;border-radius:10px;font-weight:600;background:' + compat.bg + ';color:' + compat.color + '">' + compat.icon + ' ' + compat.label + '</span>';
    h += '</div>';
  }
  h += '</div>';
  h += '</div>';

  // 하단 버튼
  h += '<div style="display:flex;justify-content:space-between;margin-top:8px">';
  h += '<button onclick="_crSetStep(1)" style="padding:10px 20px;border-radius:10px;border:1px solid var(--c-gray-200);background:#fff;color:var(--c-gray-700);font-size:13px;font-weight:500;cursor:pointer;display:flex;align-items:center;gap:6px"><svg viewBox="0 0 8 14" fill="none" stroke="currentColor" stroke-width="2" style="width:8px;height:14px"><path d="M7 1L1 7l6 6"/></svg>이전</button>';
  h += '<button onclick="' + (checkedCount>0?'_crSetStep(3)':'') + '" style="padding:10px 24px;border-radius:10px;border:none;background:' + (checkedCount>0?'#FF9500':'var(--c-gray-300)') + ';color:#fff;font-size:13px;font-weight:600;cursor:' + (checkedCount>0?'pointer':'not-allowed') + ';display:flex;align-items:center;gap:6px;box-shadow:' + (checkedCount>0?'0 2px 8px rgba(255,149,0,.3)':'none') + '">결과 미리보기 <svg viewBox="0 0 8 14" fill="none" stroke="#fff" stroke-width="2" style="width:8px;height:14px"><path d="M1 1l6 6-6 6"/></svg></button>';
  h += '</div>';

  return h;
}

// ── STEP 3: 결과 미리보기 + Temp 생성 ──
function _crRenderStep3(item, allRelated) {
  var h = '';
  var included = allRelated.filter(function(r){ return CUR_RECV_STATE.checkedCodes[r.id]; });
  var excluded = allRelated.filter(function(r){ return !CUR_RECV_STATE.checkedCodes[r.id]; });
  var cur = CURRICULUM_DATA.find(function(c){ return c.id === item.linkedCurId; });

  // 결과 요약 카드
  h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">';

  // Before
  h += '<div style="background:#fff;border-radius:14px;padding:20px;border:1px solid var(--c-gray-200)">';
  h += '<div style="font-size:11px;font-weight:600;color:var(--c-gray-400);text-transform:uppercase;margin-bottom:12px;display:flex;align-items:center;gap:6px">';
  h += '<span style="width:8px;height:8px;border-radius:50%;background:var(--c-gray-300)"></span>BEFORE (v' + item.linkedCurVer + ')</div>';
  if(cur) {
    h += '<div style="font-size:14px;font-weight:600;color:var(--c-gray-800);margin-bottom:8px">' + cur.name + '</div>';
    h += '<div style="font-size:12px;color:var(--c-gray-500)">';
    if(cur.depths) { cur.depths.forEach(function(d,i){ h += (i>0?' → ':'') + d.name + '(' + d.count + ')'; }); }
    h += '</div>';
    h += '<div style="font-size:12px;color:var(--c-gray-400);margin-top:6px">연결 코드: ' + allRelated.length + '건</div>';
  }
  h += '</div>';

  // After
  h += '<div style="background:linear-gradient(135deg,#FFF8E1,#FFF3E0);border-radius:14px;padding:20px;border:1px solid #FFB74D40">';
  h += '<div style="font-size:11px;font-weight:600;color:#E65100;text-transform:uppercase;margin-bottom:12px;display:flex;align-items:center;gap:6px">';
  h += '<span style="width:8px;height:8px;border-radius:50%;background:#FF9500"></span>AFTER (v' + item.detectedVer + ' Temp)</div>';
  if(cur) {
    h += '<div style="font-size:14px;font-weight:600;color:#E65100;margin-bottom:8px">' + cur.name + ' v' + item.detectedVer + '</div>';
    h += '<div style="font-size:12px;color:#BF360C">' + (item.diffSummary||'') + '</div>';
    h += '<div style="font-size:12px;color:var(--c-gray-600);margin-top:6px">업데이트 코드: ' + included.length + '건 \xB7 유지: ' + excluded.length + '건</div>';
  }
  h += '</div>';
  h += '</div>';

  // 적용 대상 코드 목록
  h += '<div style="background:#fff;border-radius:14px;padding:20px;border:1px solid var(--c-gray-200);margin-bottom:16px">';
  h += '<div style="font-size:13px;font-weight:700;color:var(--c-gray-800);margin-bottom:14px">적용 결과 요약</div>';

  if(included.length > 0) {
    h += '<div style="margin-bottom:12px"><div style="font-size:11px;font-weight:600;color:#2E7D32;margin-bottom:8px">✓ v' + item.detectedVer + ' 적용 (' + included.length + '건)</div>';
    h += '<div style="display:flex;flex-wrap:wrap;gap:6px">';
    included.forEach(function(r) {
      var rsc = _crSysColor(r.targetSystem);
      h += '<span style="font-size:11px;padding:4px 10px;border-radius:8px;font-weight:500;background:#E8F5E9;color:#2E7D32;border:1px solid #A5D6A740">' + rsc.label + ' ' + r.subjectCode + '</span>';
    });
    h += '</div></div>';
  }

  if(excluded.length > 0) {
    h += '<div><div style="font-size:11px;font-weight:600;color:var(--c-gray-500);margin-bottom:8px">— v' + item.linkedCurVer + ' 유지 (' + excluded.length + '건)</div>';
    h += '<div style="display:flex;flex-wrap:wrap;gap:6px">';
    excluded.forEach(function(r) {
      var rsc = _crSysColor(r.targetSystem);
      h += '<span style="font-size:11px;padding:4px 10px;border-radius:8px;font-weight:500;background:var(--c-gray-100);color:var(--c-gray-500);border:1px solid var(--c-gray-200)">' + rsc.label + ' ' + r.subjectCode + '</span>';
    });
    h += '</div></div>';
  }
  h += '</div>';

  // 액션 안내
  h += '<div style="background:var(--c-gray-50);border-radius:14px;padding:16px 20px;margin-bottom:20px;font-size:12px;color:var(--c-gray-600);display:flex;align-items:flex-start;gap:10px">';
  h += '<svg viewBox="0 0 16 16" fill="none" stroke="#0071E3" stroke-width="1.5" style="width:16px;height:16px;flex-shrink:0;margin-top:1px"><circle cx="8" cy="8" r="6"/><path d="M8 5v3M8 10v.5"/></svg>';
  h += '<div><strong>Temp 생성 후 프로세스:</strong> v' + item.detectedVer + ' Temp 커리큘럼이 생성되며, 커리큘럼 편집기에서 구조를 확인\xB7수정할 수 있습니다. 이후 검수 → 배포 과정을 거쳐 새 Active 버전으로 반영됩니다.</div>';
  h += '</div>';

  // 하단 버튼
  h += '<div style="display:flex;justify-content:space-between;margin-top:8px">';
  h += '<button onclick="_crSetStep(2)" style="padding:10px 20px;border-radius:10px;border:1px solid var(--c-gray-200);background:#fff;color:var(--c-gray-700);font-size:13px;font-weight:500;cursor:pointer;display:flex;align-items:center;gap:6px"><svg viewBox="0 0 8 14" fill="none" stroke="currentColor" stroke-width="2" style="width:8px;height:14px"><path d="M7 1L1 7l6 6"/></svg>이전</button>';
  h += '<button onclick="_crCreateTemp(\'' + (item.linkedCurId||'') + '\',' + (item.detectedVer||0) + ')" style="padding:10px 28px;border-radius:10px;border:none;background:linear-gradient(135deg,#FF9500,#FF6D00);color:#fff;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:8px;box-shadow:0 4px 14px rgba(255,149,0,.35);transition:all .15s">';
  h += '<svg viewBox="0 0 16 16" fill="none" stroke="#fff" stroke-width="1.5" style="width:14px;height:14px"><polygon points="9 1 2 9 8 9 7 15 14 7 8 7 9 1"/></svg>';
  h += 'v' + item.detectedVer + ' Temp 생성</button>';
  h += '</div>';

  return h;
}

// ── Temp 생성 실행 ──
function _crCreateTemp(curId, newVer) {
  if(!curId) return;
  // 기존 _curVersionUp 로직 활용
  var cur = CURRICULUM_DATA.find(function(c){ return c.id === curId; });
  if(!cur) { alert('커리큘럼을 찾을 수 없습니다.'); return; }
  var existing = CURRICULUM_DATA.find(function(c){ return c.sourceId === curId && c.status === 'temp'; });
  if(existing) {
    if(!confirm('이미 Temp 작업이 존재합니다 (v' + (existing.version||'?') + ').\n기존 Temp를 열겠습니까?')) return;
    CUR_TREE_STATE.activeCurId = existing.id;
    CUR_MODE = 'edit';
    switchView('curriculum');
    return;
  }
  if(!confirm('v' + newVer + ' Temp 커리큘럼을 생성합니다.\n구조를 편집할 수 있습니다. 계속하시겠습니까?')) return;

  var newId = 'CUR-' + String(Math.floor(Math.random()*9000)+1000);
  var newCur = JSON.parse(JSON.stringify(cur));
  newCur.id = newId;
  newCur.status = 'temp';
  newCur.version = newVer;
  newCur.sourceId = curId;
  newCur.sourceVersion = cur.version || 1;
  newCur.createdAt = new Date().toISOString().slice(0,10);
  newCur.updatedAt = newCur.createdAt;
  CURRICULUM_DATA.push(newCur);

  // 수신 상태 업데이트
  CUR_RECEIVE_DATA.forEach(function(r) {
    if(r.linkedCurId === curId && CUR_RECV_STATE.checkedCodes[r.id]) {
      r.status = 'synced';
      r.detectedVer = null;
      r.changeType = null;
      r.diffSummary = null;
      r.diffDetail = [];
    }
  });

  CUR_TREE_STATE.activeCurId = newId;
  CUR_MODE = 'edit';
  switchView('curriculum');
}

'''

if data_marker in src:
    src = src.replace(data_marker, cur_receive_code + '\n' + data_marker, 1)
    changes += 1
    print('[OK] 6. CUR_RECEIVE data + render functions inserted')
else:
    print('[FAIL] 6. Data marker not found')
    sys.exit(1)

# ============================================================
# 7) batch-receive nav 활성 처리 영역 근처에 cur-receive nav 활성 처리 추가
# ============================================================
# scoring-sim nav active 부분 뒤에 cur-receive nav active 추가
scoring_nav_marker = "  // scoring-sim nav active\n  if(view === 'scoring-sim') {\n    var ssNav = document.getElementById('nav-scoring-sim');\n    if(ssNav) ssNav.classList.add('active');\n  }"
scoring_nav_replace = scoring_nav_marker + """
  // cur-receive nav active
  if(view === 'cur-receive') {
    var crNav = document.getElementById('nav-cur-receive');
    if(crNav) crNav.classList.add('active');
  }"""
if scoring_nav_marker in src:
    src = src.replace(scoring_nav_marker, scoring_nav_replace, 1)
    changes += 1
    print('[OK] 7. Nav active handler added')
else:
    print('[WARN] 7. Scoring nav marker not found — skipping')

# ============================================================
# Write output
# ============================================================
with open(FILE, 'w', encoding='utf-8') as f:
    f.write(src)

print('\n=== PATCH COMPLETE: {} changes applied ==='.format(changes))
