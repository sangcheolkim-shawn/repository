/**
 * CMS 레거시 뷰 아카이브 — v8.5 프리징 시점 추출
 *
 * 이 파일은 v8.5 프로토타입에서 사이드바에 노출되지 않는 레거시 뷰의
 * 렌더 함수와 전용 헬퍼를 분리 보존한 것입니다.
 *
 * 포함된 뷰:
 *   - dashboard (대시보드)
 *   - course-list (과목 목록)
 *   - structure (구조 편집기)
 *   - content (콘텐츠 작업 — 구 UI)
 *   - workorder (작업 지시서)
 *   - live-content (서비스 콘텐츠 — 구 UI)
 *   - answer-editor (해답 편집기 — 렌더 함수만, 공유 함수는 메인에 유지)
 *   - code-manage (과목코드 관리)
 *   - learning-type (콘텐츠 템플릿 관리 — 렌더 함수만, LT_STATE/LT_FIELD_POOL은 메인에 유지)
 *   - bundle-hub (허브-스포크 번들)
 *   - service-dist (서비스 배포 — 구 UI)
 *   - type-mapping (유형 매핑 매트릭스)
 *
 * 추출일: 2026-04-30
 * 원본: cms_stg_prd_v8.5.html
 * 담당: Shawn (sangcheol.kim@daekyo.co.kr)
 *
 * ※ 이 코드는 단독 실행 불가 — 메인 프로토타입의 공유 데이터 구조에 의존합니다.
 *   개발자 참조용으로만 사용하세요.
 */


// ═══ Block 1: Old Content/Structure/Dashboard System (원본 라인 2940~6409) ═══
// ════════════════════════════════
//  ■ MODE SWITCHING
// ════════════════════════════════
function switchMode(mode) {
  if(mode === STATE.currentMode) return;
  if((mode === 'content' || mode === 'course-list') && STATE.hasChanges) {
    showConfirm('저장되지 않은 변경사항','변경사항을 저장하지 않고 이동할까요?', ()=>doSwitch(mode), '이동', 'btn-primary');
    return;
  }
  doSwitch(mode);
}
function doSwitch(mode) {
  STATE.currentMode = mode;
  // Show/hide views
  document.getElementById('view-course-list').style.display = mode==='course-list' ? 'flex' : 'none';
  document.getElementById('view-structure').style.display   = mode==='structure'   ? 'flex' : 'none';
  document.getElementById('view-content').style.display     = mode==='content'     ? 'flex' : 'none';
  // Sidebar: 상위 메뉴
  document.getElementById('nav-course-list').classList.toggle('active', mode==='course-list'||mode==='structure');
  document.getElementById('nav-structure').classList.toggle('active',   mode==='course-list'||mode==='structure');
  document.getElementById('nav-content').classList.toggle('active',     mode==='content');
  // 콘텐츠 아닌 화면으로 이동 시 하위 메뉴 active 모두 해제
  if(mode !== 'content') {
    ['nav-content-work','nav-content-review','nav-content-live']
      .forEach(id => document.getElementById(id)?.classList.remove('active'));
  }
  if(mode==='course-list')  renderCourseList();
  else if(mode==='structure') initStructureView();
  else { STATE.currentNode=null; STATE.currentStep=1; renderDashboard(); }
}

// ── 콘텐츠 등록 하위 메뉴 진입 ──
function switchToContent(tab) {
  STATE.dashTab = tab || 'work';
  if(STATE.currentMode !== 'content') {
    // 다른 화면에서 오는 경우
    if(STATE.hasChanges) {
      showConfirm('저장되지 않은 변경사항','변경사항을 저장하지 않고 이동할까요?',
        ()=>{ doSwitch('content'); _updateContentSubNav(); }, '이동', 'btn-primary');
      return;
    }
    doSwitch('content');
  } else {
    // 이미 콘텐츠 화면 — 탭만 전환
    STATE.currentNode = null;
    STATE.currentStep = 1;
    renderDashboard();
  }
  _updateContentSubNav();
}

function _updateContentSubNav() {
  const tab = STATE.dashTab;
  // 하위 메뉴 active
  document.getElementById('nav-content-work')  ?.classList.toggle('active', tab==='work');
  document.getElementById('nav-content-review')?.classList.toggle('active', tab==='review');
  document.getElementById('nav-content-live')  ?.classList.toggle('active', tab==='live');
  // 상위 메뉴는 항상 active (expanded 표시)
  document.getElementById('nav-content')?.classList.add('active');
  // 페이지 헤더 아이콘·타이틀
  const iconSvgs = {
    work:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>',
    review: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>',
    live:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49"/></svg>',
  };
  const titles = {work:'작업 중', review:'검수 중', live:'서비스 중'};
  const iconEl  = document.getElementById('contentPageIcon');
  const titleEl = document.getElementById('contentPageTitle');
  if(iconEl)  iconEl.innerHTML  = iconSvgs[tab] || iconSvgs.work;
  if(titleEl) titleEl.textContent = titles[tab] || '콘텐츠 등록';
  // 파이프라인 힌트 active 클래스
  ['work','review','live'].forEach(t => {
    const el = document.getElementById('cph'+t.charAt(0).toUpperCase()+t.slice(1));
    if(!el) return;
    el.className = 'cph-step' + (t===tab ? ` active active-${t}` : '');
  });
}

// ════════════════════════════════
//  ■ COURSE LIST (등록된 학습 과정)
// ════════════════════════════════
const SUBJECT_COLORS = [
  {accent:'#6366F1',bg:'#E8F2FF',icon:'A'},
  {accent:'#34C759',bg:'#F0FFF4',icon:'B'},
  {accent:'#FF3B30',bg:'#FFF2F1',icon:'C'},
  {accent:'#FF9500',bg:'#FFF8F0',icon:'D'},
  {accent:'#AF52DE',bg:'#F9F0FF',icon:'E'},
];
function getSubjectColor(idx) { return SUBJECT_COLORS[idx % SUBJECT_COLORS.length]; }

// ── Filter state ──
const CLF = {
  query:  '',
  owner:  'all',    // 'all'|'mine'|'team'
  status: 'all',    // 'all'|'done'|'inprog'|'urgent'|'idle'
  ctype:  'all',    // 'all'|'song'|'note'|'video'|'flash'
  sort:   'created-desc',
  view:   'grid',   // 'grid'|'list'
};

// Compute derived stats for a subject (cached per render)
function _subjStats(subj) {
  const leaves  = getLeaves(subj.id);
  const doneN   = leaves.filter(l=>getSt(l.id).status==='done').length;
  const urgentN = leaves.filter(l=>getSt(l.id).status==='urgent').length;
  const inprogN = leaves.filter(l=>getSt(l.id).status==='inprog').length;
  const pct     = leaves.length ? Math.round(leaves.reduce((a,l)=>a+getPct(getSt(l.id)),0)/leaves.length) : 0;
  const status  = doneN===leaves.length&&leaves.length>0?'done':urgentN>0?'urgent':inprogN>0?'inprog':'idle';
  const typeMap = {};
  leaves.forEach(l=>{ const t=l.contentType||'song'; typeMap[t]=(typeMap[t]||0)+1; });
  return { leaves, doneN, urgentN, inprogN, pct, status, typeMap, topGroups: getChildren(subj.id) };
}

function renderCourseList() {
  const subjects = getSubjects();
  const cnt = document.getElementById('clSubjectCount');
  if(cnt) cnt.textContent = subjects.length;
  const badge = document.getElementById('sbSubjectBadge');
  if(badge) badge.textContent = subjects.length;
  clApplyFilter();
}

function clOnSearch() {
  const inp = document.getElementById('clSearchInput');
  CLF.query = (inp?.value || '').trim().toLowerCase();
  const clearBtn = document.getElementById('clSearchClear');
  if(clearBtn) clearBtn.style.display = CLF.query ? '' : 'none';
  clApplyFilter();
}

function clClearSearch() {
  const inp = document.getElementById('clSearchInput');
  if(inp) inp.value = '';
  CLF.query = '';
  const clearBtn = document.getElementById('clSearchClear');
  if(clearBtn) clearBtn.style.display = 'none';
  clApplyFilter();
}

function clSetOwner(val) {
  CLF.owner = val;
  document.querySelectorAll('[data-owner]').forEach(b => b.classList.toggle('on', b.dataset.owner===val));
  clApplyFilter();
}

function clSetStatus(val) {
  CLF.status = val;
  document.querySelectorAll('[data-status]').forEach(b => b.classList.toggle('on', b.dataset.status===val));
  clApplyFilter();
}

function clSetCtype(val) {
  CLF.ctype = val;
  document.querySelectorAll('[data-ctype]').forEach(b => b.classList.toggle('on', b.dataset.ctype===val));
  clApplyFilter();
}

function clSetView(v) {
  CLF.view = v;
  document.getElementById('clViewGrid')?.classList.toggle('on', v==='grid');
  document.getElementById('clViewList')?.classList.toggle('on', v==='list');
  const grid = document.getElementById('courseGrid');
  if(grid) grid.classList.toggle('list-view', v==='list');
}

function clResetAll() {
  CLF.query=''; CLF.owner='all'; CLF.status='all'; CLF.ctype='all'; CLF.sort='created-desc';
  const inp = document.getElementById('clSearchInput');
  if(inp) inp.value = '';
  document.getElementById('clSearchClear').style.display='none';
  document.querySelectorAll('[data-owner]').forEach(b=>b.classList.toggle('on',b.dataset.owner==='all'));
  document.querySelectorAll('[data-status]').forEach(b=>b.classList.toggle('on',b.dataset.status==='all'));
  document.querySelectorAll('[data-ctype]').forEach(b=>b.classList.toggle('on',b.dataset.ctype==='all'));
  const sel = document.getElementById('clSortSelect');
  if(sel) sel.value = 'created-desc';
  clApplyFilter();
}

function clApplyFilter() {
  const sel = document.getElementById('clSortSelect');
  if(sel) CLF.sort = sel.value;

  const allSubjects = getSubjects();
  // 1. Filter
  let list = allSubjects.filter((s, idx) => {
    const stats = _subjStats(s);
    // Search query
    if(CLF.query) {
      const hay = ((s.label||'')+(s.descTitle||'')+(s.descHtml||'')).toLowerCase();
      if(!hay.includes(CLF.query)) return false;
    }
    // Owner (placeholder logic — uses node order as proxy: even=mine, odd=team)
    if(CLF.owner === 'mine' && (idx%2!==0)) return false;
    if(CLF.owner === 'team' && (idx%2===0)) return false;
    // Status
    if(CLF.status !== 'all' && stats.status !== CLF.status) return false;
    // Content type
    if(CLF.ctype !== 'all' && !stats.typeMap[CLF.ctype]) return false;
    return true;
  });

  // 2. Sort
  list = list.slice().sort((a, b) => {
    const sa = _subjStats(a), sb = _subjStats(b);
    switch(CLF.sort) {
      case 'name-asc':         return a.label.localeCompare(b.label, 'ko');
      case 'name-desc':        return b.label.localeCompare(a.label, 'ko');
      case 'progress-desc':    return sb.pct - sa.pct;
      case 'progress-asc':     return sa.pct - sb.pct;
      case 'content-desc':     return sb.leaves.length - sa.leaves.length;
      case 'incomplete-desc':  return sb.urgentN - sa.urgentN;
      case 'created-asc':      return allSubjects.indexOf(a) - allSubjects.indexOf(b);
      default:                 return allSubjects.indexOf(b) - allSubjects.indexOf(a); // created-desc
    }
  });

  // 3. Render
  const grid = document.getElementById('courseGrid');
  if(grid) {
    grid.className = 'course-grid' + (CLF.view==='list' ? ' list-view' : '');
    if(list.length === 0) {
      grid.innerHTML = '';
    } else {
      grid.innerHTML = list.map((s) => {
        const globalIdx = allSubjects.indexOf(s);
        return CLF.view === 'list' ? buildCourseCardList(s, globalIdx) : buildCourseCard(s, globalIdx);
      }).join('') + (CLF.query==='' && CLF.owner==='all' && CLF.status==='all' && CLF.ctype==='all' ? buildNewCourseCard() : '');
    }
  }

  // 4. Filtered count display
  const isFiltered = CLF.query || CLF.owner!=='all' || CLF.status!=='all' || CLF.ctype!=='all';
  const filteredEl = document.getElementById('clFilteredCount');
  const filteredNum = document.getElementById('clFilteredNum');
  if(filteredEl) filteredEl.style.display = isFiltered ? '' : 'none';
  if(filteredNum) filteredNum.textContent = list.length;

  // 5. Empty state
  const emptyState = document.getElementById('clEmptyState');
  const wrap = document.querySelector('.cl-wrap');
  if(emptyState) emptyState.style.display = list.length===0 ? 'flex' : 'none';
  if(wrap) wrap.style.display = list.length===0 ? 'none' : '';
  const emptyMsg = document.getElementById('clEmptyMsg');
  if(emptyMsg) {
    if(CLF.query) emptyMsg.textContent = `"${CLF.query}"에 해당하는 과정이 없습니다`;
    else emptyMsg.textContent = '선택한 필터에 해당하는 과정이 없습니다';
  }

  // 6. Active filter chips
  clRenderActiveFilters(isFiltered);
}

function clRenderActiveFilters(show) {
  const bar = document.getElementById('clActiveFilters');
  if(!bar) return;
  if(!show) { bar.style.display='none'; return; }
  bar.style.display = 'flex';

  const OWNER_LABELS  = {mine:'내 과정', team:'팀 과정'};
  const STATUS_LABELS = {done:'완료', inprog:'진행 중', urgent:'미등록', idle:'대기'};
  const CTYPE_LABELS  = {song:'동요', note:'해설', video:'영상', flash:'플래시카드'};
  const SORT_LABELS   = {
    'created-desc':'최신 생성순','created-asc':'오래된 순',
    'name-asc':'이름 가나다순','name-desc':'이름 역순',
    'progress-desc':'진행률 높은 순','progress-asc':'진행률 낮은 순',
    'content-desc':'콘텐츠 많은 순','incomplete-desc':'미완료 많은 순'
  };

  let chips = '';
  if(CLF.query) chips += `<span class="cl-af-chip">"${CLF.query}" <button class="cl-af-x" onclick="clClearSearch()">✕</button></span>`;
  if(CLF.owner!=='all') chips += `<span class="cl-af-chip">${OWNER_LABELS[CLF.owner]} <button class="cl-af-x" onclick="clSetOwner('all')">✕</button></span>`;
  if(CLF.status!=='all') chips += `<span class="cl-af-chip">${STATUS_LABELS[CLF.status]} <button class="cl-af-x" onclick="clSetStatus('all')">✕</button></span>`;
  if(CLF.ctype!=='all') chips += `<span class="cl-af-chip">${CTYPE_LABELS[CLF.ctype]} <button class="cl-af-x" onclick="clSetCtype('all')">✕</button></span>`;
  if(CLF.sort!=='created-desc') chips += `<span class="cl-af-chip">${SORT_LABELS[CLF.sort]} <button class="cl-af-x" onclick="clResetSort()">✕</button></span>`;
  chips += `<button class="cl-af-reset" onclick="clResetAll()">모두 초기화</button>`;
  bar.innerHTML = chips;
}

function clResetSort() {
  CLF.sort = 'created-desc';
  const sel = document.getElementById('clSortSelect');
  if(sel) sel.value = 'created-desc';
  clApplyFilter();
}

// ── List-view card variant ──
function buildCourseCardList(subj, idx) {
  const clr   = getSubjectColor(idx);
  const stats = _subjStats(subj);
  const cfg   = stCfg(stats.status);
  return `
  <div class="course-card" onclick="openCourseEditor('${subj.id}')">
    <div class="csc-accent" style="background:${clr.accent}"></div>
    <div class="csc-body">
      <div class="csc-top">
        ${subj.thumbDataUrl
          ? `<div class="csc-thumb"><img src="${subj.thumbDataUrl}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:6px"></div>`
          : `<div class="csc-icon" style="background:${clr.bg}">${clr.icon}</div>`}
        <div class="csc-info" style="flex:1;min-width:0">
          <div class="csc-name">${subj.label} ${subj.productCode ? `<span style="font-size:10px;font-weight:600;color:var(--c-gray-400);margin-left:4px">${subj.productCode}</span>` : ''}</div>
          <div class="csc-meta">
            ${subj.source==='batch' ? '<span class="csc-meta-item" style="color:#34C759;font-weight:700">⬇ 뉴드림스 수신</span>' : ''}
            <span class="csc-meta-item">${stats.topGroups.length}개 과정</span>
            <span class="csc-meta-item">${stats.leaves.length}개 콘텐츠</span>
            ${subj.descTitle ? `<span class="csc-meta-item" style="color:var(--c-gray-400)">${subj.descTitle}</span>` : ''}
          </div>
        </div>
        <div class="csc-list-prog" style="display:flex;align-items:center;gap:8px;width:150px;flex-shrink:0;margin:0 8px">
          <div class="csc-list-prog-bar" style="flex:1;height:5px;background:var(--c-gray-100);border-radius:3px;overflow:hidden">
            <div style="height:100%;border-radius:3px;background:${clr.accent};width:${stats.pct}%;transition:width .3s"></div>
          </div>
          <span style="font-size:10px;font-weight:700;color:${clr.accent};white-space:nowrap">${stats.pct}%</span>
        </div>
        <span style="font-size:10px;padding:3px 9px;border-radius:8px;font-weight:700;background:${cfg.bg};color:${cfg.dot};border:1px solid ${cfg.border};white-space:nowrap;margin-right:8px">${cfg.label}</span>
      </div>
      <div class="csc-footer" style="border:none;padding:0">
        <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();switchToCourseContent('${subj.id}')">등록 →</button>
        <button class="btn btn-primary btn-sm" onclick="event.stopPropagation();openCourseEditor('${subj.id}')">✏ 편집</button>
      </div>
    </div>
  </div>`;
}

function buildCourseCard(subj, idx) {
  const clr   = getSubjectColor(idx);
  const stats = _subjStats(subj);
  const { leaves, doneN, urgentN, inprogN, pct, status, typeMap, topGroups } = stats;
  const cfg = stCfg(status);

  return `
  <div class="course-card" onclick="openCourseEditor('${subj.id}')">
    <div class="csc-accent" style="background:${clr.accent}"></div>
    <div class="csc-body">
      <div class="csc-top">
        ${subj.thumbDataUrl
          ? `<div class="csc-thumb" style="background:${clr.bg}">
               <img src="${subj.thumbDataUrl}" alt="썸네일" style="width:100%;height:100%;object-fit:cover;border-radius:6px">
             </div>`
          : `<div class="csc-icon" style="background:${clr.bg}">${clr.icon}</div>`
        }
        <div class="csc-info">
          <div class="csc-name">${subj.label} ${subj.productCode ? `<span style="font-size:10px;font-weight:600;color:var(--c-gray-400);margin-left:4px">${subj.productCode}</span>` : ''}</div>
          <div class="csc-meta">
            ${subj.source==='batch' ? '<span class="csc-meta-item" style="color:#34C759;font-weight:700">⬇ 뉴드림스 수신</span>' : ''}
            <span class="csc-meta-item">${topGroups.length}개 과정</span>
            <span class="csc-meta-item">${leaves.length}개 콘텐츠</span>
            ${subj.thumbDataUrl ? '<span class="csc-meta-item" style="color:#34C759"> 썸네일 등록</span>' : '<span class="csc-meta-item" style="color:#FF9500"> 썸네일 없음</span>'}
          </div>
          ${subj.descTitle ? `<div style="font-size:11px;color:var(--c-gray-400);margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${subj.descTitle}</div>` : ''}
        </div>
        <span style="font-size:10px;padding:3px 9px;border-radius:8px;font-weight:700;background:${cfg.bg};color:${cfg.dot};border:1px solid ${cfg.border};white-space:nowrap">${cfg.label}</span>
      </div>
      <div class="csc-stats">
        <div class="csc-stat">
          <div class="csc-stat-num" style="color:#34C759">${doneN}</div>
          <div class="csc-stat-lbl">완료</div>
        </div>
        <div class="csc-stat">
          <div class="csc-stat-num" style="color:#FF9500">${inprogN}</div>
          <div class="csc-stat-lbl">진행 중</div>
        </div>
        <div class="csc-stat">
          <div class="csc-stat-num" style="color:#FF3B30">${urgentN}</div>
          <div class="csc-stat-lbl">미등록</div>
        </div>
      </div>
      <div class="csc-progress">
        <div class="csc-prog-row">
          <span class="csc-prog-label">전체 진행률</span>
          <span class="csc-prog-pct" style="color:${clr.accent}">${pct}%</span>
        </div>
        <div class="csc-prog-bar">
          <div class="csc-prog-fill" style="width:${pct}%;background:${clr.accent}"></div>
        </div>
      </div>
      ${Object.keys(typeMap).length ? `
      <div class="csc-leaf-types">
        ${Object.entries(typeMap).map(([t,c])=>{
          const m=CONTENT_TYPE_META[t]||{};
          return `<span class="csc-type-badge" style="background:${m.bg||'#F5F5F7'};color:${m.color||'#48484A'}">${m.icon||''} ${m.label||t} ${c}개</span>`;
        }).join('')}
      </div>` : ''}
      <div class="csc-footer">
        <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();switchToCourseContent('${subj.id}')">콘텐츠 등록 →</button>
        <button class="btn btn-primary btn-sm" onclick="event.stopPropagation();openCourseEditor('${subj.id}')">✏ 과정 편집</button>
      </div>
    </div>
  </div>`;
}

function buildNewCourseCard() {
  return `
  <div class="course-card-new" onclick="addNewCourse()">
    <div class="ccn-icon">＋</div>
    <div class="ccn-label">신규 과정 추가</div>
    <div class="ccn-sub">새로운 학습 과목·과정을 설계합니다</div>
  </div>`;
}

function addNewCourse() {
  const newId = 'node'+STATE.nid++;
  const order = getSubjects().length + 1;
  STATE.treeNodes.push({
    id:newId, pid:null, label:'새 과목', type:'group',
    expanded:true, regMode:'bulk', order, isSubject:true
  });
  markChanged();
  openCourseEditor(newId, true);
}

function openCourseEditor(subjectId, isNew=false) {
  STATE.currentSubjectId = subjectId;
  const subj = getNode(subjectId);
  // Update header
  const headerIcon  = document.getElementById('seHeaderIcon');
  const headerTitle = document.getElementById('seHeaderTitle');
  const idx = getSubjects().findIndex(s=>s.id===subjectId);
  const clr = getSubjectColor(idx>=0?idx:0);
  if(headerIcon)  headerIcon.textContent  = clr.icon;
  if(headerTitle) headerTitle.textContent = subj ? `${subj.label} — 학습 유형 설계` : '학습 유형 설계';
  doSwitch('structure');
  if(isNew) {
    STATE.selectedSENode = subjectId;
    renderSEPropsFor(subjectId);
    toast('새 과목이 추가되었습니다. 이름을 입력해 주세요.', 't-info', 2500);
  } else {
    // Auto-select the subject root node
    STATE.selectedSENode = subjectId;
    renderSEPropsFor(subjectId);
  }
}

function switchToCourseContent(subjectId) {
  STATE.currentSubjectId = subjectId;
  STATE.dashTab = 'work';
  doSwitch('content');
  _updateContentSubNav();
}

// ════════════════════════════════
//  ■ STRUCTURE EDITOR
// ════════════════════════════════
function markChanged() { STATE.hasChanges = true; updateSESaveStatus(); }
function updateSESaveStatus() {
  const s=document.getElementById('seSaveStatus'), b=document.getElementById('seSaveBtn');
  if(s) s.innerHTML = STATE.hasChanges
    ? '<span style="color:#FF9500;font-size:11px;font-weight:700">● 미저장</span>'
    : '<span style="color:#34C759;font-size:11px;font-weight:700">✓ 저장됨</span>';
  if(b) b.disabled = !STATE.hasChanges;
  updateHeaderCounts();
}
function updateHeaderCounts() {
  const tc = document.getElementById('totalNodeCount');
  const nc = document.getElementById('seNodeCount');
  const badge = document.getElementById('sbSubjectBadge');
  const clCnt = document.getElementById('clSubjectCount');
  const subjCount = getSubjects().length;
  // 현재 과목 하위 노드만 세기
  const subjectNodes = STATE.currentSubjectId
    ? [STATE.currentSubjectId, ...getAllDesc(STATE.currentSubjectId)].length
    : 0;
  if(tc) tc.textContent = subjectNodes;
  if(nc) nc.textContent = `${subjectNodes}개 노드`;
  if(badge) badge.textContent = subjCount;
  if(clCnt) clCnt.textContent = subjCount;
}
function saveStructure() {
  STATE.hasChanges = false;
  // 과목명이 바뀌었을 수 있으므로 헤더 갱신
  if(STATE.currentSubjectId) {
    const subj = getNode(STATE.currentSubjectId);
    const idx  = getSubjects().findIndex(s=>s.id===STATE.currentSubjectId);
    const clr  = getSubjectColor(idx>=0?idx:0);
    const h    = document.getElementById('seHeaderTitle');
    if(h && subj) h.textContent = `${subj.label} — 학습 과정 설계`;
    const hi   = document.getElementById('seHeaderIcon');
    if(hi) hi.textContent = clr.icon;
  }
  updateSESaveStatus();
  toast('저장되었습니다 ✓', 't-ok');
  renderSETree();
}
function initStructureView() {
  renderSETree();
  updateSESaveStatus();
  if(!STATE.selectedSENode) renderSEPropsEmpty();
  else renderSEPropsFor(STATE.selectedSENode);
}

// ── Tree Render (현재 과목만 표시) ──
function renderSETree() {
  const body = document.getElementById('seTreeBody');
  if(!body) return;
  if(!STATE.currentSubjectId) { body.innerHTML=''; updateHeaderCounts(); return; }
  const subj = getNode(STATE.currentSubjectId);
  if(!subj) { body.innerHTML=''; updateHeaderCounts(); return; }
  // 루트 과목 행 + 그 하위만 렌더
  body.innerHTML = buildSESubjectRow(subj) + (subj.expanded ? buildSERows(subj.id, 1) : '');
  updateHeaderCounts();
}
// 과목 최상위 행(삭제 불가, 접기 가능)
function buildSESubjectRow(node) {
  const isSel = STATE.selectedSENode === node.id;
  const kids  = getChildren(node.id);
  return `
  <div class="sn-row${isSel?' sel':''} root-node" id="snr-${node.id}"
    onclick="selectSENode('${node.id}')"
    ondblclick="startInlineEdit('${node.id}',event)">
    <div class="sn-indent" style="width:0px"></div>
    <div class="sn-drag" style="opacity:0;pointer-events:none">⋮⋮</div>
    <div class="sn-toggle" onclick="event.stopPropagation();toggleSENode('${node.id}')" style="visibility:${kids.length?'visible':'hidden'}">
      ${node.expanded?'▾':'▸'}
    </div>
    <div class="sn-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg></div>
    <div class="sn-label">${node.label}</div>
    ${node.productCode ? `<span style="font-size:9px;color:var(--c-gray-400);background:var(--c-gray-100);padding:1px 6px;border-radius:4px;font-weight:600;margin-left:2px">${node.productCode}</span>` : ''}
    <span class="sn-type-pill pill-subject">과목</span>
    ${node.source==='batch' ? '<span style="font-size:8px;color:#34C759;background:#F0FFF4;padding:1px 5px;border-radius:3px;font-weight:700;margin-left:2px">배치</span>' : ''}
    <div class="sn-actions">
      <button class="sn-act" onclick="event.stopPropagation();addChildNode('${node.id}')">＋ 하위 추가</button>
    </div>
  </div>`;
}
function buildSERows(pid, depth) {
  return getChildren(pid).map(node => {
    const d      = depth * 20;
    const isGrp  = node.type === 'group';
    const isLeaf = node.type === 'leaf';
    const isSel  = STATE.selectedSENode === node.id;
    const kids   = getChildren(node.id);
    const isSubj = node.isSubject;
    const hasKids= kids.length > 0;
    // 서브리프 = 리프의 자식 리프 → 더 이상 하위 추가 불가
    const isSub  = isLeaf && getNode(node.pid)?.type === 'leaf';
    // 리프 부모 = 자식이 있는 리프
    const isLeafP= isLeaf && hasKids;

    // 뱃지 결정
    let pillClass, pillLabel;
    if(isSubj)        { pillClass='pill-subject';    pillLabel='과목'; }
    else if(isGrp)    { pillClass='pill-group';      pillLabel='그룹'; }
    else if(isSub)    { pillClass='pill-sub-leaf';   pillLabel='서브리프'; }
    else if(isLeafP)  { pillClass='pill-leaf-parent';pillLabel='리프'; }
    else              { pillClass='pill-leaf';        pillLabel='리프'; }

    // 하위 추가 가능 여부: 그룹 O, 리프(서브리프 아닌 것) O, 서브리프 X
    const canAddChild = isGrp || (isLeaf && !isSub);

    return `
    <div class="sn-row${isSel?' sel':''}${isSubj?' root-node':''}" id="snr-${node.id}"
      onclick="selectSENode('${node.id}')"
      ondblclick="startInlineEdit('${node.id}',event)">
      <div class="sn-indent" style="width:${d}px"></div>
      <div class="sn-drag" title="드래그로 순서 변경">⋮⋮</div>
      <div class="sn-toggle" onclick="event.stopPropagation();toggleSENode('${node.id}')"
        style="visibility:${(isGrp||isLeafP)&&hasKids?'visible':'hidden'}">
        ${node.expanded ? '▾' : '▸'}
      </div>
      <div class="sn-icon">${getNodeIcon(node)}</div>
      <div class="sn-label">${node.label}</div>
      ${node.courseCode ? `<span style="font-size:9px;color:#0071E3;background:#E8F2FF;padding:1px 6px;border-radius:4px;font-weight:600;margin-left:2px">${node.courseCode}</span>` : ''}
      ${node.setCode ? `<span style="font-size:9px;color:#AF52DE;background:#F9F0FF;padding:1px 6px;border-radius:4px;font-weight:600;margin-left:2px">${node.setCode}</span>` : ''}
      ${node.typeCode ? `<span style="font-size:9px;color:#FF9500;background:#FFF8F0;padding:1px 6px;border-radius:4px;font-weight:600;margin-left:2px">${node.typeCode}</span>` : ''}
      <span class="sn-type-pill ${pillClass}">${pillLabel}</span>
      ${node.source==='batch' ? '<span style="font-size:8px;color:#34C759;background:#F0FFF4;padding:1px 5px;border-radius:3px;font-weight:700;margin-left:2px">배치</span>' : ''}
      <div class="sn-move">
        <button class="sn-mv-btn" onclick="event.stopPropagation();moveNode('${node.id}',-1)">▲</button>
        <button class="sn-mv-btn" onclick="event.stopPropagation();moveNode('${node.id}', 1)">▼</button>
      </div>
      <div class="sn-actions">
        ${canAddChild ? `<button class="sn-act" onclick="event.stopPropagation();addChildNode('${node.id}')">＋ 하위</button>` : ''}
        ${!isSubj && node.source!=='batch' ? `<button class="sn-act" onclick="event.stopPropagation();addSiblingNode('${node.id}')">＋ 형제</button>` : ''}
        ${node.source!=='batch' ? `<button class="sn-act sn-act-del" onclick="event.stopPropagation();confirmDeleteSENode('${node.id}')">✕</button>` : `<span style="font-size:9px;color:var(--c-gray-400);margin-left:4px" title="뉴드림스 수신 데이터는 삭제할 수 없습니다">🔒</span>`}
      </div>
    </div>
    ${(isGrp || isLeafP) && node.expanded ? buildSERows(node.id, depth+1) : ''}`;
  }).join('');
}

function startInlineEdit(id, event) {
  event.stopPropagation();
  const n = getNode(id); if(!n) return;
  const row = document.getElementById('snr-'+id);
  const lbl = row.querySelector('.sn-label');
  lbl.outerHTML = `<input class="sn-label-edit" id="ile-${id}" value="${n.label}" onclick="event.stopPropagation()" onblur="commitInlineEdit('${id}')" onkeydown="if(event.key==='Enter'||event.key==='Escape')this.blur()">`;
  const inp = document.getElementById('ile-'+id);
  if(inp){inp.focus();inp.select();}
}
function commitInlineEdit(id) {
  const inp = document.getElementById('ile-'+id);
  const n = getNode(id); if(!n) return;
  if(inp && inp.value.trim()) { n.label = inp.value.trim(); markChanged(); }
  renderSETree();
  if(STATE.selectedSENode === id) renderSEPropsFor(id);
}
function moveNode(id, dir) {
  const n = getNode(id); if(!n) return;
  const sibs = getChildren(n.pid).sort((a,b)=>a.order-b.order);
  const idx = sibs.findIndex(s=>s.id===id);
  const swapIdx = idx+dir;
  if(swapIdx<0||swapIdx>=sibs.length) return;
  [sibs[idx].order, sibs[swapIdx].order] = [sibs[swapIdx].order, sibs[idx].order];
  markChanged(); renderSETree();
}
function toggleSENode(id) { const n=getNode(id); if(n) n.expanded=!n.expanded; renderSETree(); }
function expandAllSE()   { STATE.treeNodes.filter(n=>n.type==='group'||(n.type==='leaf'&&getChildren(n.id).length>0)).forEach(n=>n.expanded=true);  renderSETree(); }
function collapseAllSE() { STATE.treeNodes.filter(n=>n.type==='group'||(n.type==='leaf'&&getChildren(n.id).length>0)).forEach(n=>n.expanded=false); renderSETree(); }

function selectSENode(id) {
  STATE.selectedSENode = id;
  renderSETree();
  renderSEPropsFor(id);
}
function renderSEPropsEmpty() {
  document.getElementById('sePropsPanel').innerHTML=`
  <div class="se-props-empty">
    <div class="se-props-empty-icon"></div>
    <div style="font-size:14px;font-weight:600;color:#48484A">항목을 선택하세요</div>
    <div style="font-size:12px;color:#AEAEB2;line-height:1.8">트리에서 클릭하면 속성을 편집할 수 있습니다.<br>더블클릭하면 이름을 바로 편집합니다.</div>
    <button class="btn btn-primary btn-sm" onclick="addChildNodeToSubject()">＋ 하위 항목 추가</button>
    <button class="btn btn-ghost btn-sm" onclick="switchMode('course-list')">← 과정 목록으로</button>
  </div>`;
}
function renderSEPropsFor(id) {
  const n = getNode(id); if(!n){renderSEPropsEmpty();return;}
  const path = getPath(id);
  const childCount = getChildren(id).length;

  // 과목 노드: 이름 + 리치텍스트 설명 에디터
  if(n.isSubject) {
    document.getElementById('sePropsPanel').innerHTML=`
    <div class="se-props-inner">
      <div class="se-props-hd">
        <div class="se-props-path">
          <span style="font-size:13px">${getNodeIcon(n)}</span>
          <span class="cur">과목 정보</span>
        </div>
        <div class="se-props-title">${n.label}</div>
      </div>
      <div class="se-props-body" style="padding:14px 16px;overflow-y:auto">

        <!-- 이름 -->
        <div class="sp-section">
          <div class="sp-section-title">기본 정보</div>
          <div class="sp-field">
            <label class="sp-label">과목명</label>
            <input class="sp-inp" id="spName" value="${n.label}" oninput="markChanged()" placeholder="과목 이름 입력">
          </div>
          ${n.productCode ? `
          <div class="sp-field">
            <label class="sp-label">상품 코드</label>
            <input class="sp-inp" value="${n.productCode}" readonly style="background:var(--c-gray-50);color:var(--c-gray-500);cursor:not-allowed">
            <div class="sp-info" style="margin-top:4px;color:#34C759;font-weight:600">⬇ 뉴드림스에서 배치 수신된 정보 (수정 불가)</div>
          </div>` : ''}
        </div>

        ${n.source==='batch' ? `
        <!-- 뉴드림스 연동 정보 -->
        <div class="sp-section">
          <div class="sp-section-title" style="color:#34C759">뉴드림스 연동 정보</div>
          <div style="background:#F0FFF4;border:1px solid #6EE7B7;border-radius:8px;padding:12px 14px;font-size:11px;line-height:1.8;color:#1B8A3E">
            <div style="font-weight:700;margin-bottom:4px">⬇ 배치 수신 데이터</div>
            <div>• 상품코드: <strong>${n.productCode||'-'}</strong></div>
            <div>• 하위 과정/세트 구조는 뉴드림스에서 자동 수신됩니다</div>
            <div>• 콘텐츠 등록은 세트 하위에서 유형별로 진행합니다</div>
            <div style="margin-top:6px;padding-top:6px;border-top:1px solid #A8E6B8;color:#1B8A3E;font-weight:600">
              등록 프로세스: 상품등록(외부) → 과정/세트 배치수신 → 유형별 콘텐츠 등록(CMS)
            </div>
          </div>
        </div>` : ''}

        <!-- 썸네일 -->
        <div class="sp-section">
          <div class="sp-section-title" style="display:flex;align-items:center;gap:8px">
            썸네일 이미지
            <span class="thumb-rule-badge">규칙 미정</span>
          </div>
          <div class="thumb-section">
            <!-- 미리보기 -->
            <div class="thumb-preview-wrap">
              <div class="thumb-preview" id="thumbPreview-${id}" onclick="thumbTrigger('${id}')">
                ${n.thumbDataUrl
                  ? `<img src="${n.thumbDataUrl}" alt="썸네일" id="thumbImg-${id}">`
                  : `<div class="thumb-preview-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" width="28" height="28"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg></div>
                     <div class="thumb-preview-label">클릭하여<br>업로드</div>`
                }
                <div class="thumb-overlay">
                  <div class="thumb-overlay-label">${n.thumbDataUrl ? '변경' : '＋ 업로드'}</div>
                </div>
              </div>
              <input type="file" class="thumb-input" id="thumbInput-${id}" accept="image/*" onchange="thumbOnChange('${id}',this)">
            </div>
            <!-- 정보 패널 -->
            <div class="thumb-info">
              <div class="thumb-info-title">표지 이미지</div>
              <div class="thumb-info-meta" id="thumbMeta-${id}">
                ${n.thumbFile
                  ? `${n.thumbFile.name}<br> ${n.thumbFile.w}×${n.thumbFile.h}px<br>${n.thumbFile.size}`
                  : `권장 비율: <strong>2:3</strong> (세로형)<br>권장 크기: <strong>400×600px</strong> 이상<br>형식: JPG · PNG · WebP<br><span style="color:var(--c-gray-300)">향후 규칙이 적용될 예정입니다</span>`
                }
              </div>
              <div class="thumb-size-warning" id="thumbWarn-${id}">이미지가 너무 작습니다 (최소 200×300px)</div>
              <div class="thumb-actions">
                ${n.thumbDataUrl
                  ? `<button class="btn btn-ghost btn-xs" onclick="thumbTrigger('${id}')">변경</button>
                     <button class="btn btn-ghost btn-xs" style="color:var(--c-red);border-color:var(--c-red-b)" onclick="thumbRemove('${id}')">✕ 제거</button>`
                  : `<button class="btn btn-primary btn-xs" onclick="thumbTrigger('${id}')">＋ 이미지 선택</button>`
                }
              </div>
            </div>
          </div>
        </div>

          <!-- 설명 에디터 -->
        <div class="sp-section">
          <div class="sp-section-title">과목 설명</div>

          <!-- 설명 제목 -->
          <div class="sp-field" style="margin-bottom:8px">
            <input class="rte-title-inp" id="rteDescTitle"
              value="${(n.descTitle||'').replace(/"/g,'&quot;')}"
              placeholder="설명 제목 (예: 강사 소개)"
              oninput="markChanged()">
          </div>

          <!-- 탭 -->
          <div class="rte-tabs">
            <button class="rte-tab on" id="rteTab-edit"    onmousedown="event.preventDefault();rteSetTab('edit','${id}')">✏ 편집</button>
            <button class="rte-tab"   id="rteTab-preview"  onmousedown="event.preventDefault();rteSetTab('preview','${id}')"> 미리보기</button>
            <button class="rte-tab"   id="rteTab-source"   onmousedown="event.preventDefault();rteSetTab('source','${id}')">‹/› HTML</button>
          </div>

          <!-- 툴바 (편집 탭에서만) -->
          <div class="rte-toolbar" id="rteToolbar">
            <button class="rte-tb-btn" id="rteBtnB" title="굵게 (Ctrl+B)"   onmousedown="event.preventDefault();rteExec('bold')"><b style="font-size:13px">B</b></button>
            <button class="rte-tb-btn" id="rteBtnI" title="기울임 (Ctrl+I)" onmousedown="event.preventDefault();rteExec('italic')"><i style="font-size:13px">I</i></button>
            <div class="rte-tb-sep"></div>
            <button class="rte-tb-btn rte-tb-btn-wide" title="대제목 H2" onmousedown="event.preventDefault();rteInsertBlock('h2')">H2</button>
            <button class="rte-tb-btn rte-tb-btn-wide" title="소제목 H3" onmousedown="event.preventDefault();rteInsertBlock('h3')">H3</button>
            <div class="rte-tb-sep"></div>
            <button class="rte-tb-btn" title="글머리 목록" onmousedown="event.preventDefault();rteExec('insertUnorderedList')"><span style="font-size:14px">≡</span></button>
            <button class="rte-tb-btn" title="번호 목록"   onmousedown="event.preventDefault();rteExec('insertOrderedList')"><span style="font-size:11px;font-weight:600">①</span></button>
            <div class="rte-tb-sep"></div>
            <button class="rte-tb-btn rte-tb-btn-wide" title="이미지 삽입" onmousedown="event.preventDefault();rteShowImgModal('${id}')"> 이미지</button>
            <button class="rte-tb-btn rte-tb-btn-wide" title="수식 삽입"   onmousedown="event.preventDefault();rteShowLatex('${id}')">∑ 수식</button>
            <button class="rte-tb-btn" title="구분선" onmousedown="event.preventDefault();rteExec('insertHorizontalRule')">—</button>
            <span class="rte-tb-hint">색상·크기는 개발자 적용</span>
          </div>

          <!-- 편집/미리보기/소스 영역 -->
          <div class="rte-pane" id="rtePane">
            <div class="rte-editor" id="rteEditor" contenteditable="true"
              data-placeholder="강사 소개, 과목 설명 등을 입력하세요&#8230;"
              oninput="markChanged();rteUpdateState()"
              onkeydown="rteKeyDown(event,'${id}')"
              onmouseup="rteUpdateState()" onkeyup="rteUpdateState()"
              onclick="rteImgClick(event)"
            >${n.descHtml||''}</div>
          </div>
          <div class="rte-char-count" id="rteCharCount"></div>
        </div>

        <!-- 이미지 삽입 모달 -->
        <div id="imgModal"   class="img-modal"   style="display:none"></div>
        <!-- LaTeX 모달 -->
        <div id="latexModal" class="latex-modal" style="display:none"></div>

        <!-- 경로 -->
        <div class="sp-section">
          <div class="sp-section-title">경로 · 정보</div>
          <div class="sp-field">
            <label class="sp-label">전체 경로</label>
            <div class="sp-path-display">${path}</div>
          </div>
          ${childCount ? `<div class="sp-field">
            <label class="sp-label">하위 항목</label>
            <div style="font-size:12px;color:#8E8E93">${childCount}개 직속 · ${getAllDesc(id).length}개 전체</div>
          </div>` : ''}
        </div>
      </div>
      <div class="se-props-footer">
        <button class="btn btn-ghost btn-sm" style="color:#FF3B30;border-color:#FFB3AE" onclick="confirmDeleteSENode('${id}')">과목 삭제</button>
        <div style="display:flex;gap:6px">
          <button class="btn btn-ghost btn-sm" onclick="selectSENode('${id}')">초기화</button>
          <button class="btn btn-primary btn-sm" onclick="applyProps('${id}')">✓ 적용</button>
        </div>
      </div>
    </div>`;
    _rteTab = 'edit';
    rteUpdateState();
    return;
  }

  // 일반 노드 (기존 UI)
  document.getElementById('sePropsPanel').innerHTML=`
  <div class="se-props-inner">
    <div class="se-props-hd">
      <div class="se-props-path">
        <span style="font-size:13px">${getNodeIcon(n)}</span>
        ${path.split(' › ').join(' <span style="color:#D1D1D6">›</span> ')}
      </div>
      <div class="se-props-title">${n.label}</div>
    </div>
    <div class="se-props-body">
      <div class="sp-section">
        <div class="sp-section-title">기본 정보</div>
        <div class="sp-field">
          <label class="sp-label">이름</label>
          <input class="sp-inp" id="spName" value="${n.label}" ${n.source==='batch'?'readonly style="background:var(--c-gray-50);color:var(--c-gray-500);cursor:not-allowed"':''} oninput="markChanged()" placeholder="항목 이름 입력">
          ${n.source==='batch'?'<div class="sp-info" style="color:#34C759;font-weight:600;margin-top:2px">🔒 뉴드림스 배치 수신 (수정 불가)</div>':''}
        </div>
        ${n.courseCode ? `
        <div class="sp-field">
          <label class="sp-label">과정 코드</label>
          <input class="sp-inp" value="${n.courseCode}" readonly style="background:#E8F2FF;color:#0071E3;font-weight:700;cursor:not-allowed;border-color:#B3D7FF">
        </div>
        <div class="sp-field">
          <label class="sp-label">과정명</label>
          <input class="sp-inp" value="${n.courseName||''}" readonly style="background:var(--c-gray-50);color:var(--c-gray-500);cursor:not-allowed">
        </div>` : ''}
        ${n.setCode ? `
        <div class="sp-field">
          <label class="sp-label">세트 코드</label>
          <input class="sp-inp" value="${n.setCode}" readonly style="background:#F9F0FF;color:#AF52DE;font-weight:700;cursor:not-allowed;border-color:#D9B3F0">
        </div>
        <div class="sp-field">
          <label class="sp-label">세트명</label>
          <input class="sp-inp" value="${n.setName||''}" readonly style="background:var(--c-gray-50);color:var(--c-gray-500);cursor:not-allowed">
        </div>` : ''}
        ${n.typeCode ? `
        <div class="sp-field">
          <label class="sp-label">템플릿 코드</label>
          <input class="sp-inp" value="${n.typeCode}" readonly style="background:#FFF8F0;color:#FF9500;font-weight:700;cursor:not-allowed;border-color:#FFD9A8">
        </div>` : ''}
        ${n.batchDate ? `
        <div class="sp-field">
          <label class="sp-label">배치 수신일</label>
          <div style="font-size:12px;color:#8E8E93">${n.batchDate}</div>
        </div>` : ''}
        <div class="sp-field">
          <label class="sp-label">노드 유형</label>
          <div class="sp-radio-group">
            <label class="sp-radio${n.type==='group'?' active':''}">
              <input type="radio" name="spType" value="group" ${n.type==='group'?'checked':''} ${n.source==='batch'?'disabled':''} onchange="onTypeChange()">
              분류 그룹
            </label>
            <label class="sp-radio${n.type==='leaf'?' active':''}">
              <input type="radio" name="spType" value="leaf" ${n.type==='leaf'?'checked':''} ${n.source==='batch'?'disabled':''} onchange="onTypeChange()">
              콘텐츠 리프
            </label>
          </div>
        </div>
      </div>
      <div class="sp-section" id="spCondSection">
        <div class="sp-section-title">${n.type==='group'?'등록 설정':'콘텐츠 설정'}</div>
        <div id="spCondFields">${buildCondFields(n)}</div>
      </div>
      <div class="sp-section">
        <div class="sp-section-title">경로 · 정보</div>
        <div class="sp-field">
          <label class="sp-label">전체 경로</label>
          <div class="sp-path-display">${path}</div>
        </div>
        ${childCount ? `
        <div class="sp-field">
          <label class="sp-label">하위 항목</label>
          <div style="font-size:12px;color:#8E8E93">${childCount}개 직속 자식 · ${getAllDesc(id).length}개 전체</div>
        </div>` : ''}
      </div>
    </div>
    <div class="se-props-footer">
      <button class="btn btn-ghost btn-sm" style="color:#FF3B30;border-color:#FFB3AE" onclick="confirmDeleteSENode('${id}')">삭제</button>
      <div style="display:flex;gap:6px">
        <button class="btn btn-ghost btn-sm" onclick="selectSENode('${id}')">초기화</button>
        <button class="btn btn-primary btn-sm" onclick="applyProps('${id}')">✓ 적용</button>
      </div>
    </div>
  </div>`;
}
function buildCondFields(n) {
  if(n.isSubject) return `<div style="font-size:12px;color:#8E8E93">과목 노드는 하위에 과정·세트 등을 추가하세요.</div>`;
  if(n.type==='group') return `
    <div class="sp-field">
      <label class="sp-label">등록 방식</label>
      <div class="sp-radio-group">
        <label class="sp-radio${(n.regMode||'bulk')==='bulk'?' active':''}">
          <input type="radio" name="spRegMode" value="bulk" ${(n.regMode||'bulk')==='bulk'?'checked':''} onchange="markChanged()">
           일괄 등록
        </label>
        <label class="sp-radio${n.regMode==='leaf'?' active':''}">
          <input type="radio" name="spRegMode" value="leaf" ${n.regMode==='leaf'?'checked':''} onchange="markChanged()">
          개별 등록
        </label>
      </div>
    </div>`;

  if(n.type==='leaf') {
    const hasKids = getChildren(n.id).length > 0;
    const isSub   = getNode(n.pid)?.type === 'leaf';

    // 서브리프 (리프의 자식) = 실제 콘텐츠 등록 단위
    if(isSub) {
      const cts=[{v:'song',l:'동요'},{v:'note',l:'해설'},{v:'video',l:'영상'},{v:'flash',l:'플래시카드'}];
      return `
        <div class="notice notice-blue" style="margin-bottom:10px">최하위 등록 단위입니다. 하위 항목을 더 추가할 수 없습니다.</div>
        <div class="sp-field">
          <label class="sp-label">콘텐츠 템플릿</label>
          <select class="sp-sel" id="spCT" onchange="markChanged()">
            ${cts.map(c=>`<option value="${c.v}"${n.contentType===c.v?' selected':''}>${c.l}</option>`).join('')}
          </select>
        </div>
        <div class="sp-field">
          <label class="sp-label">콘텐츠 수</label>
          <input type="number" class="sp-inp" id="spRounds" value="${n.rounds||6}" min="1" max="30" oninput="markChanged()">
        </div>
        <div class="sp-info"> 콘텐츠가 ${n.rounds||6}개의 순서로 구성됩니다.</div>`;
    }

    // 리프 부모 (하위가 있는 리프) = 하위 서브리프들의 컨테이너
    if(hasKids) {
      const subLeaves = getChildren(n.id);
      return `
        <div class="sp-info" style="margin-bottom:10px">
          이 리프는 하위 <strong>${subLeaves.length}개</strong>의 서브리프를 포함합니다.<br>
          실제 콘텐츠는 각 서브리프에 등록됩니다.
        </div>
        <div class="sp-field">
          <label class="sp-label">하위 서브리프</label>
          <div style="display:flex;flex-wrap:wrap;gap:5px;">
            ${subLeaves.map(sl=>`<span style="font-size:11px;padding:3px 9px;border-radius:8px;background:#FFF8F0;color:#B35C00;border:1px solid #FDBA74;font-weight:600">${getNodeIcon(sl)} ${sl.label}</span>`).join('')}
          </div>
        </div>`;
    }

    // 단독 리프 (자식 없는, 부모도 리프 아닌) = 콘텐츠 직접 등록 또는 하위 추가 가능
    const cts=[{v:'song',l:'동요'},{v:'note',l:'해설'},{v:'video',l:'영상'},{v:'flash',l:'플래시카드'}];
    return `
      <div class="notice notice-blue" style="margin-bottom:10px">
        콘텐츠를 직접 등록하거나, <strong>＋ 하위</strong> 버튼으로 서브리프를 추가할 수 있습니다.
      </div>
      <div class="sp-field">
        <label class="sp-label">콘텐츠 유형</label>
        <select class="sp-sel" id="spCT" onchange="markChanged()">
          ${cts.map(c=>`<option value="${c.v}"${n.contentType===c.v?' selected':''}>${c.l}</option>`).join('')}
        </select>
      </div>
      <div class="sp-field">
        <label class="sp-label">콘텐츠 수</label>
        <input type="number" class="sp-inp" id="spRounds" value="${n.rounds||6}" min="1" max="30" oninput="markChanged()">
      </div>
      <div class="sp-info"> 콘텐츠가 ${n.rounds||6}개의 순서로 구성됩니다.</div>`;
  }
  return '';
}
function onTypeChange() {
  document.querySelectorAll('[name=spType]').forEach(r=>{
    r.closest('.sp-radio').classList.toggle('active', r.checked);
  });
  const t = document.querySelector('[name=spType]:checked')?.value;
  const n = getNode(STATE.selectedSENode); if(!n||!t) return;
  n.type = t;
  if(t==='leaf' && !n.contentType) n.contentType = 'song';
  markChanged();
  const sect = document.getElementById('spCondSection');
  if(sect){
    sect.querySelector('.sp-section-title').textContent = t==='group'?'등록 설정':'콘텐츠 설정';
    document.getElementById('spCondFields').innerHTML = buildCondFields(n);
  }
}
function applyProps(id) {
  const n = getNode(id); if(!n) return;
  const nameEl = document.getElementById('spName');
  const typeEl = document.querySelector('[name=spType]:checked');
  if(nameEl) n.label = nameEl.value.trim() || n.label;

  // 과목 노드: 설명 저장 (편집 탭이면 clean HTML로, 아니면 이미 저장된 것 유지)
  if(n.isSubject) {
    rteSaveToNode(id);
  }

  if(typeEl && !n.isSubject) n.type = typeEl.value;
  if(n.type==='group' && !n.isSubject) {
    const rm = document.querySelector('[name=spRegMode]:checked');
    if(rm) n.regMode = rm.value;
  } else if(n.type==='leaf') {
    const ct = document.getElementById('spCT');
    const rd = document.getElementById('spRounds');
    if(ct) n.contentType = ct.value;
    if(rd) n.rounds = parseInt(rd.value) || 6;
  }
  markChanged(); renderSETree(); renderSEPropsFor(id);
  toast('적용되었습니다', 't-ok', 1400);
}

// ════════════════════════════════
//  ■ RICH TEXT EDITOR (RTE)
// ════════════════════════════════
let _rteTab = 'edit';          // 'edit' | 'preview' | 'source'
let _latexSavedRange = null;
let _latexTab = 'inline';
let _imgModalTab = 'upload';
let _imgSavedRange = null;

// ── exec helper ──
function rteExec(cmd, val) {
  const ed = document.getElementById('rteEditor');
  if(!ed) return;
  ed.focus();
  document.execCommand(cmd, false, val||null);
  rteUpdateState();
}

// ── insert semantic block (H2/H3) ──
function rteInsertBlock(tag) {
  const ed = document.getElementById('rteEditor');
  if(!ed) return;
  ed.focus();
  document.execCommand('formatBlock', false, tag);
  rteUpdateState();
}

// ── toolbar state refresh ──
function rteUpdateState() {
  const b = document.getElementById('rteBtnB');
  const i = document.getElementById('rteBtnI');
  try {
    if(b) b.classList.toggle('on', document.queryCommandState('bold'));
    if(i) i.classList.toggle('on', document.queryCommandState('italic'));
  } catch(e){}
  const ed  = document.getElementById('rteEditor');
  const cnt = document.getElementById('rteCharCount');
  if(ed && cnt) {
    const len = (ed.innerText||'').replace(/\s/g,'').length;
    cnt.textContent = len > 0 ? `${len}자` : '';
  }
}

// ── keyboard shortcuts ──
function rteKeyDown(e, id) {
  if((e.ctrlKey||e.metaKey) && e.key==='b') { e.preventDefault(); rteExec('bold'); }
  if((e.ctrlKey||e.metaKey) && e.key==='i') { e.preventDefault(); rteExec('italic'); }
  if(e.key==='Escape') { rteCloseLatex(); rteCloseImgModal(); }
}

// ── image click select ──
function rteImgClick(e) {
  const ed = document.getElementById('rteEditor');
  if(!ed) return;
  ed.querySelectorAll('img').forEach(img => img.classList.remove('rte-img-sel'));
  if(e.target.tagName === 'IMG') e.target.classList.add('rte-img-sel');
}

// ── get clean HTML (no inline color/font styles) ──
function rteGetCleanHtml() {
  const ed = document.getElementById('rteEditor');
  if(!ed) return '';
  const clone = ed.cloneNode(true);
  // Strip inline styles except on img (keep width)
  clone.querySelectorAll('*').forEach(el => {
    if(el.tagName === 'IMG') {
      // keep only width/height attrs if present
      el.removeAttribute('style');
    } else {
      el.removeAttribute('style');
      el.removeAttribute('color');
      el.removeAttribute('face');
      el.removeAttribute('size');
    }
    el.classList.remove('rte-img-sel');
  });
  // Replace <b> → <strong>, <i> → <em>
  clone.innerHTML = clone.innerHTML
    .replace(/<b(\s|>)/gi, '<strong$1')
    .replace(/<\/b>/gi,  '</strong>')
    .replace(/<i(\s|>)/gi,  '<em$1')
    .replace(/<\/i>/gi,  '</em>');
  // Trim empty wrappers
  let html = clone.innerHTML.trim();
  return html;
}

// ── format HTML source for display ──
function rtePrettyHtml(html) {
  // Very simple indent
  return html
    .replace(/></g, '>\n<')
    .replace(/^\s+|\s+$/gm, s => s.replace(/\n/g,'\n'))
    .trim();
}

// ── save current editor content to node ──
function rteSaveToNode(id) {
  const n = getNode(id); if(!n) return;
  const ed = document.getElementById('rteEditor');
  if(ed) n.descHtml = rteGetCleanHtml();
  const titleEl = document.getElementById('rteDescTitle');
  if(titleEl) n.descTitle = titleEl.value;
}

// ════ TAB SWITCHING ════
function rteSetTab(tab, id) {
  // Save editor content before switching away from edit
  if(_rteTab === 'edit') rteSaveToNode(id);
  _rteTab = tab;

  // Tab button states
  ['edit','preview','source'].forEach(t => {
    const btn = document.getElementById('rteTab-'+t);
    if(btn) btn.classList.toggle('on', t===tab);
  });

  const toolbar = document.getElementById('rteToolbar');
  const pane    = document.getElementById('rtePane');
  if(!pane) return;

  if(tab === 'edit') {
    if(toolbar) toolbar.style.display = '';
    const n = getNode(id);
    pane.innerHTML = `<div class="rte-editor" id="rteEditor" contenteditable="true"
      data-placeholder="강사 소개, 과목 설명 등을 입력하세요&#8230;"
      oninput="markChanged();rteUpdateState()"
      onkeydown="rteKeyDown(event,'${id}')"
      onmouseup="rteUpdateState()" onkeyup="rteUpdateState()"
      onclick="rteImgClick(event)"
    >${n?.descHtml||''}</div>`;
    setTimeout(()=>{ document.getElementById('rteEditor')?.focus(); rteUpdateState(); }, 30);

  } else if(tab === 'preview') {
    if(toolbar) toolbar.style.display = 'none';
    const n = getNode(id);
    const div = document.createElement('div');
    div.className = 'rte-preview-pane';
    div.innerHTML = n?.descHtml || '<span style="color:#AEAEB2;font-size:12px">내용 없음</span>';
    pane.innerHTML = '';
    pane.appendChild(div);
    if(window.renderMathInElement) {
      renderMathInElement(div, {
        delimiters:[{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false}],
        throwOnError:false
      });
    }

  } else if(tab === 'source') {
    if(toolbar) toolbar.style.display = 'none';
    const n = getNode(id);
    const html = n?.descHtml || '';
    const pretty = rtePrettyHtml(html);
    pane.innerHTML = `
      <div class="rte-source-copy-bar">
        <span>개발자에게 전달할 HTML</span>
        <button class="btn btn-ghost btn-xs" onmousedown="event.preventDefault();rteCopySource()"> 복사</button>
      </div>
      <pre class="rte-source-pane" id="rteSourcePre">${escHtml(pretty)}</pre>`;
  }
}

function rteCopySource() {
  const pre = document.getElementById('rteSourcePre');
  if(!pre) return;
  navigator.clipboard.writeText(pre.textContent).then(()=>{
    toast('HTML이 클립보드에 복사되었습니다', 't-ok', 1600);
  }).catch(()=>{
    // fallback
    const ta = document.createElement('textarea');
    ta.value = pre.textContent;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    toast('HTML 복사 완료', 't-ok', 1600);
  });
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ════ IMAGE MODAL ════
function rteShowImgModal(id) {
  // save selection
  const sel = window.getSelection();
  if(sel && sel.rangeCount) _imgSavedRange = sel.getRangeAt(0).cloneRange();

  const modal = document.getElementById('imgModal');
  if(!modal) return;

  // Position below toolbar
  const tb = document.getElementById('rteToolbar');
  if(tb) {
    const r = tb.getBoundingClientRect();
    modal.style.top  = (r.bottom + 6) + 'px';
    modal.style.left = Math.max(10, Math.min(r.left, window.innerWidth - 336)) + 'px';
  }
  modal.style.display = 'block';
  _renderImgModal(id);

  setTimeout(()=>{
    document.addEventListener('mousedown', _imgOutsideClose, {once:true});
  }, 50);
}

function _renderImgModal(id) {
  const modal = document.getElementById('imgModal');
  if(!modal) return;
  modal.innerHTML = `
    <div class="img-modal-title">
       이미지 삽입
      <button style="margin-left:auto;background:none;border:none;cursor:pointer;font-size:14px;color:#AEAEB2" onmousedown="event.preventDefault();rteCloseImgModal()">✕</button>
    </div>
    <div class="img-modal-tabs">
      <div class="im-tab${_imgModalTab==='upload'?' on':''}" onmousedown="event.preventDefault();_imgModalTab='upload';_renderImgModal('${id}')"> 파일 업로드</div>
      <div class="im-tab${_imgModalTab==='url'?' on':''}"    onmousedown="event.preventDefault();_imgModalTab='url';_renderImgModal('${id}')"> URL 입력</div>
    </div>

    ${_imgModalTab==='upload' ? `
      <div class="img-drop-zone" id="imgDropZone"
        onclick="document.getElementById('imgFileInput').click()"
        ondragover="event.preventDefault();this.classList.add('drag')"
        ondragleave="this.classList.remove('drag')"
        ondrop="event.preventDefault();this.classList.remove('drag');_imgHandleFile('${id}',event.dataTransfer.files[0])">
        <div class="img-drop-icon"></div>
        <div class="img-drop-label">클릭하거나 이미지를 드래그하세요</div>
        <div class="img-drop-sub">JPG · PNG · GIF · WebP</div>
      </div>
      <input type="file" id="imgFileInput" accept="image/*" style="display:none"
        onchange="_imgHandleFile('${id}',this.files[0])">
      <img class="img-preview-thumb" id="imgThumbPreview" src="" alt="미리보기">
    ` : `
      <input class="img-url-inp" id="imgUrlInput" placeholder="https://example.com/photo.jpg"
        oninput="_imgUrlPreview()">
      <img class="img-preview-thumb" id="imgThumbPreview" src="" alt="미리보기">
    `}

    <div style="margin-bottom:10px">
      <input class="img-alt-inp" id="imgAltInput" placeholder="대체 텍스트 (예: 홍길동 강사 사진) — 접근성 권장">
    </div>

    <div style="display:flex;gap:6px;margin-bottom:10px;align-items:center">
      <input class="img-size-inp" id="imgWidthInput" placeholder="너비 (예: 100%)" style="flex:1;border:1px solid var(--c-gray-200);border-radius:var(--radius-sm);padding:6px 8px;font-size:11px;outline:none">
      <span style="font-size:10px;color:var(--c-gray-400)">×</span>
      <input class="img-size-inp" id="imgHeightInput" placeholder="높이 (선택)" style="flex:1;border:1px solid var(--c-gray-200);border-radius:var(--radius-sm);padding:6px 8px;font-size:11px;outline:none">
    </div>
    <div style="font-size:10px;color:var(--c-gray-300);margin-bottom:10px">비워두면 원본 크기. 예: 100%, 320px</div>

    <div class="img-modal-btns">
      <button class="btn btn-ghost btn-sm" onmousedown="event.preventDefault();rteCloseImgModal()">취소</button>
      <button class="btn btn-primary btn-sm" id="imgInsertBtn" onmousedown="event.preventDefault();_imgInsert('${id}')" disabled>삽입</button>
    </div>`;
}

function _imgHandleFile(id, file) {
  if(!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = e => {
    _imgSrc = e.target.result;
    const prev = document.getElementById('imgThumbPreview');
    if(prev) { prev.src = e.target.result; prev.style.display='block'; }
    const btn = document.getElementById('imgInsertBtn');
    if(btn) btn.disabled = false;
  };
  reader.readAsDataURL(file);
}

let _imgSrc = '';

function _imgUrlPreview() {
  const inp = document.getElementById('imgUrlInput');
  const prev = document.getElementById('imgThumbPreview');
  const btn  = document.getElementById('imgInsertBtn');
  const url = inp?.value.trim();
  if(!url) { if(prev) prev.style.display='none'; if(btn) btn.disabled=true; return; }
  _imgSrc = url;
  if(prev) { prev.src=url; prev.style.display='block'; }
  if(btn) btn.disabled = false;
}

function _imgInsert(id) {
  const src = _imgModalTab==='url'
    ? (document.getElementById('imgUrlInput')?.value.trim()||'')
    : _imgSrc;
  if(!src) return;

  const alt    = document.getElementById('imgAltInput')?.value.trim() || '';
  const width  = document.getElementById('imgWidthInput')?.value.trim() || '';
  const height = document.getElementById('imgHeightInput')?.value.trim() || '';

  const attrs = [
    `src="${escHtmlAttr(src)}"`,
    alt    ? `alt="${escHtmlAttr(alt)}"` : '',
    width  ? `width="${escHtmlAttr(width)}"` : '',
    height ? `height="${escHtmlAttr(height)}"` : '',
  ].filter(Boolean).join(' ');

  const imgHtml = `<img ${attrs}>`;

  const editor = document.getElementById('rteEditor');
  if(!editor) { rteCloseImgModal(); return; }
  editor.focus();

  const sel = window.getSelection();
  if(_imgSavedRange) {
    sel.removeAllRanges();
    sel.addRange(_imgSavedRange);
  }
  document.execCommand('insertHTML', false, imgHtml);
  markChanged();
  rteCloseImgModal();
  rteUpdateState();
  // Save immediately
  rteSaveToNode(id);
}

function escHtmlAttr(str) {
  return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function rteCloseImgModal() {
  const m = document.getElementById('imgModal');
  if(m) m.style.display = 'none';
  _imgSrc = '';
}

function _imgOutsideClose(e) {
  const m = document.getElementById('imgModal');
  if(m && !m.contains(e.target) && !e.target.closest('.rte-toolbar')) rteCloseImgModal();
}

// ════ LATEX MODAL ════
const LATEX_SNIPPETS = {
  inline: [
    {label:'분수',    latex:'\\frac{a}{b}'},
    {label:'제곱근',  latex:'\\sqrt{x}'},
    {label:'거듭제곱', latex:'x^{n}'},
    {label:'아래첨자', latex:'x_{n}'},
    {label:'합계',    latex:'\\sum_{i=1}^{n}'},
    {label:'극한',    latex:'\\lim_{x \\to \\infty}'},
    {label:'적분',    latex:'\\int_{a}^{b}'},
    {label:'행렬',    latex:'\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}'},
    {label:'이항계수', latex:'\\binom{n}{k}'},
    {label:'절댓값',  latex:'\\left|x\\right|'},
  ],
  display: [
    {label:'2차방정식', latex:'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}'},
    {label:'오일러',   latex:'e^{i\\pi} + 1 = 0'},
    {label:'피타고라스',latex:'a^2 + b^2 = c^2'},
    {label:'정규분포', latex:'f(x)=\\frac{1}{\\sigma\\sqrt{2\\pi}}e^{-\\frac{(x-\\mu)^2}{2\\sigma^2}}'},
  ]
};

function rteShowLatex(id) {
  const sel = window.getSelection();
  if(sel && sel.rangeCount) _latexSavedRange = sel.getRangeAt(0).cloneRange();

  const modal = document.getElementById('latexModal');
  if(!modal) return;

  const tb = document.getElementById('rteToolbar');
  if(tb) {
    const r = tb.getBoundingClientRect();
    modal.style.top  = (r.bottom + 6) + 'px';
    modal.style.left = Math.max(10, Math.min(r.left, window.innerWidth - 336)) + 'px';
  }
  modal.style.display = 'block';
  _renderLatexModal(id);

  setTimeout(()=>{ document.addEventListener('mousedown', _latexOutsideClose, {once:true}); }, 50);
}

function _renderLatexModal(id) {
  const modal = document.getElementById('latexModal');
  const snips = LATEX_SNIPPETS[_latexTab];
  modal.innerHTML = `
    <div class="latex-modal-title">∑ 수식 삽입 (LaTeX)
      <button style="margin-left:auto;background:none;border:none;cursor:pointer;font-size:14px;color:#AEAEB2" onmousedown="event.preventDefault();rteCloseLatex()">✕</button>
    </div>
    <div class="latex-modal-tabs">
      <div class="lm-tab${_latexTab==='inline'?' on':''}" onmousedown="event.preventDefault();_latexTab='inline';_renderLatexModal('${id}')">인라인 $…$</div>
      <div class="lm-tab${_latexTab==='display'?' on':''}" onmousedown="event.preventDefault();_latexTab='display';_renderLatexModal('${id}')">블록 $$…$$</div>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px">
      ${snips.map(s=>`<button class="btn btn-ghost btn-xs" style="font-size:10px"
        onmousedown="event.preventDefault();_latexSetSnippet('${s.latex.replace(/\\/g,'\\\\').replace(/'/g,"\\'")}')">${s.label}</button>`).join('')}
    </div>
    <textarea class="latex-inp" id="latexInput"
      placeholder="${_latexTab==='inline'?'예: \\\\frac{a}{b}':'예: x = \\\\frac{-b \\\\pm \\\\sqrt{b^2-4ac}}{2a}'}"
      oninput="_latexLivePreview()" rows="2"></textarea>
    <div class="latex-preview-box" id="latexPreview"><span style="color:#AEAEB2;font-size:12px">미리보기</span></div>
    <div class="latex-modal-btns">
      <button class="btn btn-ghost btn-sm" onmousedown="event.preventDefault();rteCloseLatex()">취소</button>
      <button class="btn btn-primary btn-sm" onmousedown="event.preventDefault();rteInsertLatex('${id}')">삽입</button>
    </div>`;
}

function _latexSetSnippet(latex) {
  const inp = document.getElementById('latexInput');
  if(inp) { inp.value = latex; _latexLivePreview(); }
}

function _latexLivePreview() {
  const inp = document.getElementById('latexInput');
  const box = document.getElementById('latexPreview');
  if(!inp||!box) return;
  const raw = inp.value.trim();
  if(!raw) { box.innerHTML='<span style="color:#AEAEB2;font-size:12px">미리보기</span>'; return; }
  const wrapped = _latexTab==='display' ? `$$${raw}$$` : `$${raw}$`;
  box.textContent = wrapped;
  if(window.renderMathInElement) {
    try { renderMathInElement(box, {delimiters:[{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false}],throwOnError:false}); }
    catch(e) { box.textContent = '오류: ' + e.message; }
  }
}

function rteInsertLatex(id) {
  const inp = document.getElementById('latexInput');
  if(!inp) return;
  const raw = inp.value.trim();
  if(!raw) { rteCloseLatex(); return; }
  const wrapped = _latexTab==='display' ? ` $$${raw}$$ ` : ` $${raw}$ `;

  const editor = document.getElementById('rteEditor');
  if(!editor) { rteCloseLatex(); return; }
  editor.focus();
  const sel = window.getSelection();
  if(_latexSavedRange) { sel.removeAllRanges(); sel.addRange(_latexSavedRange); }
  document.execCommand('insertText', false, wrapped);
  markChanged();
  rteCloseLatex();
  rteSaveToNode(id);
  // Switch to preview to show rendered math
  rteSetTab('preview', id);
}

function rteCloseLatex() {
  const m = document.getElementById('latexModal');
  if(m) m.style.display = 'none';
}

function _latexOutsideClose(e) {
  const m = document.getElementById('latexModal');
  if(m && !m.contains(e.target) && !e.target.closest('.rte-toolbar')) rteCloseLatex();
}

//  ■ THUMBNAIL
// ════════════════════════════════
function thumbTrigger(id) {
  const inp = document.getElementById('thumbInput-' + id);
  if(inp) inp.click();
}

function thumbOnChange(id, input) {
  const file = input.files?.[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const dataUrl = e.target.result;
    // Check dimensions
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth, h = img.naturalHeight;
      const n = getNode(id); if(!n) return;

      // Size warning
      const warn = document.getElementById('thumbWarn-'+id);
      if(warn) warn.classList.toggle('show', w < 200 || h < 300);

      // Store on node
      n.thumbDataUrl = dataUrl;
      n.thumbFile = {
        name: file.name,
        size: _fmtSize(file.size),
        w, h
      };
      markChanged();
      _thumbRefreshUI(id);
    };
    img.src = dataUrl;
  };
  reader.readAsDataURL(file);
}

function thumbRemove(id) {
  const n = getNode(id); if(!n) return;
  n.thumbDataUrl = null;
  n.thumbFile = null;
  markChanged();
  _thumbRefreshUI(id);
}

function _thumbRefreshUI(id) {
  const n = getNode(id); if(!n) return;
  const preview = document.getElementById('thumbPreview-'+id);
  const meta    = document.getElementById('thumbMeta-'+id);
  const warn    = document.getElementById('thumbWarn-'+id);
  const actions = preview?.closest('.thumb-section')?.querySelector('.thumb-actions');

  if(!preview) return;

  if(n.thumbDataUrl) {
    // 이미지 있음
    let img = document.getElementById('thumbImg-'+id);
    if(!img) {
      preview.innerHTML = `<img src="${n.thumbDataUrl}" id="thumbImg-${id}" alt="썸네일" style="width:100%;height:100%;object-fit:cover;border-radius:6px;position:absolute;inset:0">
        <div class="thumb-overlay"><div class="thumb-overlay-label">변경</div></div>`;
    } else {
      img.src = n.thumbDataUrl;
    }
    if(meta && n.thumbFile) {
      meta.innerHTML = `${n.thumbFile.name}<br> ${n.thumbFile.w}×${n.thumbFile.h}px<br>${n.thumbFile.size}`;
    }
    if(actions) {
      actions.innerHTML = `<button class="btn btn-ghost btn-xs" onclick="thumbTrigger('${id}')">변경</button>
        <button class="btn btn-ghost btn-xs" style="color:var(--c-red);border-color:var(--c-red-b)" onclick="thumbRemove('${id}')">✕ 제거</button>`;
    }
  } else {
    // 이미지 없음
    preview.innerHTML = `<div class="thumb-preview-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" width="28" height="28"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg></div>
      <div class="thumb-preview-label">클릭하여<br>업로드</div>
      <div class="thumb-overlay"><div class="thumb-overlay-label">＋ 업로드</div></div>`;
    if(meta) meta.innerHTML = `권장 비율: <strong>2:3</strong> (세로형)<br>권장 크기: <strong>400×600px</strong> 이상<br>형식: JPG · PNG · WebP<br><span style="color:var(--c-gray-300)">향후 규칙이 적용될 예정입니다</span>`;
    if(warn) warn.classList.remove('show');
    if(actions) actions.innerHTML = `<button class="btn btn-primary btn-xs" onclick="thumbTrigger('${id}')">＋ 이미지 선택</button>`;
  }
}

function _fmtSize(bytes) {
  if(bytes < 1024) return bytes + 'B';
  if(bytes < 1024*1024) return (bytes/1024).toFixed(1) + 'KB';
  return (bytes/1024/1024).toFixed(1) + 'MB';
}

function addChildNodeToSubject() {
  // 툴바의 "＋ 하위 추가" 버튼 — 현재 선택 노드 또는 과목 루트에 추가
  const targetId = STATE.selectedSENode || STATE.currentSubjectId;
  const n = getNode(targetId);
  if(!n) { toast('노드를 선택하세요','t-warn'); return; }
  addChildNode(n.type==='group' ? targetId : n.pid);
}
function addRootNode() {
  // course-list 쪽 "신규 과정 추가"에서 쓰임 — addNewCourse() 로 대체됨
  addNewCourse();
}
function addChildNode(pid) {
  const parent = getNode(pid); if(!parent) return;
  if(!parent.expanded) parent.expanded = true;
  const newId = 'node'+STATE.nid++;
  // 부모가 리프이면 자식도 리프(서브리프), 아니면 그룹
  const isLeafParentNode = parent.type === 'leaf';
  STATE.treeNodes.push({
    id:newId, pid,
    label: isLeafParentNode ? '새 서브리프' : '새 항목',
    type: isLeafParentNode ? 'leaf' : 'group',
    contentType: isLeafParentNode ? (parent.contentType||'song') : undefined,
    rounds: isLeafParentNode ? (parent.rounds||6) : undefined,
    expanded: true,
    regMode: isLeafParentNode ? undefined : 'bulk',
    order: getChildren(pid).length+1
  });
  markChanged(); renderSETree(); selectSENode(newId);
  toast(isLeafParentNode ? '서브리프 추가됨' : '하위 항목 추가됨', 't-ok', 1400);
}
function addSiblingNode(id) {
  const n = getNode(id); if(!n) return;
  if(n.isSubject) { toast('신규 과목은 목록 화면에서 추가하세요','t-warn',2000); return; }
  const newId = 'node'+STATE.nid++;
  // 형제 노드가 리프(서브리프 포함)이면 같은 타입으로 생성
  const isLeafSibling = n.type === 'leaf';
  STATE.treeNodes.push({
    id:newId, pid:n.pid,
    label: isLeafSibling ? '새 서브리프' : '새 항목',
    type: isLeafSibling ? 'leaf' : 'group',
    contentType: isLeafSibling ? (n.contentType||'song') : undefined,
    rounds: isLeafSibling ? (n.rounds||6) : undefined,
    expanded: true,
    regMode: isLeafSibling ? undefined : 'bulk',
    order:(n.order||0)+0.5
  });
  getChildren(n.pid).sort((a,b)=>a.order-b.order).forEach((c,i)=>c.order=i+1);
  markChanged(); renderSETree(); selectSENode(newId);
  toast(isLeafSibling ? '서브리프 추가됨' : '형제 항목 추가됨', 't-ok', 1400);
}
function confirmDeleteSENode(id) {
  const n = getNode(id); if(!n) return;
  const desc = getAllDesc(id);
  const isRoot = n.isSubject;
  showConfirm(
    isRoot ? '과목 전체 삭제' : '항목 삭제',
    isRoot
      ? `"${n.label}" 과목 전체(하위 ${desc.length}개 포함)를 삭제합니다. 복구할 수 없습니다.`
      : `"${n.label}"${desc.length?` 및 하위 ${desc.length}개`:''}를 삭제합니다.`,
    ()=>deleteSENode(id),
    '삭제', 'btn-red'
  );
}
function deleteSENode(id) {
  const n = getNode(id);
  const isRoot = n?.isSubject;
  const toRemove = [id, ...getAllDesc(id)];
  STATE.treeNodes = STATE.treeNodes.filter(n=>!toRemove.includes(n.id));
  if(STATE.selectedSENode && toRemove.includes(STATE.selectedSENode)) {
    STATE.selectedSENode = null;
  }
  markChanged();
  toast('삭제되었습니다', 't-warn', 1400);
  if(isRoot) {
    // 과목 자체가 삭제되면 목록으로 이동
    STATE.hasChanges = false;
    STATE.currentSubjectId = null;
    doSwitch('course-list');
  } else {
    renderSETree();
    renderSEPropsEmpty();
  }
}

// ════════════════════════════════
//  ■ CONTENT TREE (Left panel)
// ════════════════════════════════
function buildCTPanel() {
  return `
  <div class="ct-panel">
    <div class="ct-hd">
      <span class="ct-hd-title">학습 유형</span>
      <button class="btn btn-ghost btn-xs btn-icon" onclick="ctExpandAll()" title="펼치기">⊞</button>
      <button class="btn btn-ghost btn-xs btn-icon" onclick="ctCollapseAll()" title="접기">⊟</button>
    </div>
    <div class="ct-body" id="ctBody">${buildCTRows(null,0)}</div>
  </div>`;
}
function buildCTRows(pid, depth) {
  return getChildren(pid).map(node => {
    const isLeaf     = node.type === 'leaf';
    const isTerminal = isLeaf && getChildren(node.id).length === 0; // 실제 등록 단위
    const isLeafP    = isLeaf && getChildren(node.id).length > 0;   // 리프 부모
    const isSel      = STATE.currentNode === node.id;
    const isSubj     = node.isSubject;
    const kids       = getChildren(node.id);

    // 진행률: 터미널 리프면 자신, 그 외는 하위 리프들 평균
    const st     = isTerminal ? getSt(node.id) : null;
    const pct    = st ? getPct(st) : getGroupPct(node.id);
    const barClr = st ? stCfg(st.status).bar : isSubj ? '#6366F1' : isLeafP ? '#FF9500' : '#818CF8';

    // 클릭 동작: 터미널 리프 → 'leaf', 나머지 → 'group'
    const clickMode = isTerminal ? 'leaf' : 'group';
    // 펼치기 토글 표시: 그룹이나 리프부모에만
    const canExpand = (!isLeaf || isLeafP) && kids.length > 0;

    return `
    <div class="ct-row${isSel?(isTerminal?' sel-l':' sel-g'):''}${isSubj?' root-row':''}"
      style="padding-left:${10+depth*14}px"
      onclick="ctSelectNode('${node.id}','${clickMode}')">
      <span class="ct-tog" onclick="event.stopPropagation();ctToggle('${node.id}')"
        style="visibility:${canExpand?'visible':'hidden'}">${node.expanded?'▾':'▸'}</span>
      <span style="font-size:${isSubj?14:13}px;width:18px;text-align:center;flex-shrink:0">${getNodeIcon(node)}</span>
      <span class="ct-lbl">${node.label}</span>
      <div class="ct-prog"><div class="ct-prog-fill" style="width:${pct}%;background:${barClr}"></div></div>
    </div>
    ${canExpand && node.expanded ? buildCTRows(node.id, depth+1) : ''}`;
  }).join('');
}
function ctToggle(id) { const n=getNode(id); if(n) n.expanded=!n.expanded; refreshCTBody(); }
function ctExpandAll()  {
  STATE.treeNodes.filter(n=>n.type==='group'||(n.type==='leaf'&&getChildren(n.id).length>0)).forEach(n=>n.expanded=true);
  refreshCTBody();
}
function ctCollapseAll(){
  STATE.treeNodes.filter(n=>n.type==='group'||(n.type==='leaf'&&getChildren(n.id).length>0)).forEach(n=>n.expanded=false);
  refreshCTBody();
}
function refreshCTBody() { const b=document.getElementById('ctBody'); if(b) b.innerHTML=buildCTRows(null,0); }
function ctSelectNode(id, mode) {
  STATE.currentNode = id;
  STATE.currentNodeMode = mode;
  STATE.currentStep = 1;
  STATE.selectedTpl = null;
  STATE.publishDone = false;
  STATE.flowMode = 'curriculum-first';
  refreshCTBody();
  // If we're already in step container (curriculum-first), just update content panel
  const existing = document.getElementById('stepbar');
  if(existing) { updateStepBar(); renderStep1(); }
  else renderStepContainer();
}

// ════════════════════════════════
//  ■ DASHBOARD
// ════════════════════════════════
function renderDashboard() {
  const allLeaves   = STATE.treeNodes.filter(n=>n.type==='leaf' && getChildren(n.id).length===0);
  const totalCount = document.getElementById('totalCount');

  const workLeaves   = allLeaves.filter(l=>WORK_STATUSES.includes(getSt(l.id).status));
  const reviewLeaves = allLeaves.filter(l=>REVIEW_STATUSES.includes(getSt(l.id).status));
  const liveLeaves   = allLeaves.filter(l=>LIVE_STATUSES.includes(getSt(l.id).status));
  const urgentN      = allLeaves.filter(l=>getSt(l.id).status==='urgent').length;

  if(totalCount) totalCount.textContent = allLeaves.length;

  // 사이드바 하위 메뉴 뱃지 업데이트
  const sbW = document.getElementById('sbBadgeWork');
  const sbR = document.getElementById('sbBadgeReview');
  const sbL = document.getElementById('sbBadgeLive');
  if(sbW) sbW.textContent = workLeaves.length;
  if(sbR) sbR.textContent = reviewLeaves.length;
  if(sbL) sbL.textContent = liveLeaves.length;

  // 사이드바 + 헤더 active 상태 동기화
  _updateContentSubNav();

  switch(STATE.dashTab) {
    case 'work':   renderWorkTab(workLeaves, urgentN); break;
    case 'review': renderReviewTab(reviewLeaves); break;
    case 'live':   renderLiveTab(liveLeaves); break;
  }
}

function setDashTab(tab) {
  STATE.dashTab = tab;
  STATE.workStatusFilter = 'all';
  renderDashboard();
  // 사이드바 하위 메뉴 active 동기화
  _updateContentSubNav();
}

// ── Work Tab ──
function renderWorkTab(workLeaves, urgentN) {
  // Count by status
  const statusCounts = {};
  WORK_STATUSES.forEach(s=>statusCounts[s]=0);
  workLeaves.forEach(l=>{
    const s = getSt(l.id).status;
    if(statusCounts[s] !== undefined) statusCounts[s]++;
  });

  let nextLeaf = null;
  for(const n of STATE.treeNodes) {
    if(n.type!=='leaf' || getChildren(n.id).length) continue;
    const s = getSt(n.id).status;
    if(s==='urgent'||s==='inprog') { nextLeaf=n; break; }
  }

  const doneTotal = statusCounts['done'];
  const subjects  = getSubjects();

  document.getElementById('content-sub').innerHTML = `
  <div style="display:flex;flex-direction:column;height:100%;overflow:hidden">
    <!-- 상태별 파이프라인 필터 -->
    <div class="status-pipeline">
      <div class="sp-step${STATE.workStatusFilter==='all'?' active':''}" onclick="setWorkFilter('all')" data-st="all">
        <span class="sp-dot" style="background:#AEAEB2"></span>전체
        <span class="sp-count">${workLeaves.length}</span>
      </div>
      <span class="sp-arr">›</span>
      <div class="sp-step${STATE.workStatusFilter==='urgent'?' active':''}" onclick="setWorkFilter('urgent')" data-st="urgent">
        <span class="sp-dot" style="background:#FF3B30"></span>미등록
        <span class="sp-count" style="background:#FFB3AE;color:#FF3B30">${statusCounts.urgent}</span>
      </div>
      <span class="sp-arr">›</span>
      <div class="sp-step${STATE.workStatusFilter==='idle'?' active':''}" onclick="setWorkFilter('idle')" data-st="idle">
        <span class="sp-dot" style="background:#AEAEB2"></span>미시작
        <span class="sp-count">${statusCounts.idle}</span>
      </div>
      <span class="sp-arr">›</span>
      <div class="sp-step${STATE.workStatusFilter==='inprog'?' active':''}" onclick="setWorkFilter('inprog')" data-st="inprog">
        <span class="sp-dot" style="background:#FF9500"></span>작업 중
        <span class="sp-count" style="background:#FEF9C3;color:#FF9500">${statusCounts.inprog}</span>
      </div>
      <span class="sp-arr">›</span>
      <div class="sp-step${STATE.workStatusFilter==='done'?' active':''}" onclick="setWorkFilter('done')" data-st="done">
        <span class="sp-dot" style="background:#0071E3"></span>업로드 완료
        <span class="sp-count" style="background:#E8F2FF;color:#0071E3">${statusCounts.done}</span>
      </div>
      <div style="flex:1"></div>
      ${doneTotal>0 ? `<button class="btn btn-sm btn-request-review" onclick="batchRequestReview()" style="margin:4px 0">
        완료된 ${doneTotal}건 일괄 검수요청
      </button>` : ''}
    </div>
    <!-- 모드 선택 -->
    <div class="flow-mode-section" style="padding:12px 20px 0">
      <div class="flow-mode-row">
        <div class="flow-mode-card fmc-a" onclick="startFlow('content-first')">
          <div class="fmc-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg></div>
          <div class="fmc-body">
            <div class="fmc-title">파일 먼저 올리기</div>
            <div class="fmc-desc">파일 업로드 후 커리큘럼 위치를 지정합니다.</div>
            <div class="fmc-steps">
              <span class="fmc-step">① 파일 업로드</span><span class="fmc-arrow">›</span>
              <span class="fmc-step">② 메타 입력</span><span class="fmc-arrow">›</span>
              <span class="fmc-step">③ 커리큘럼 맵핑</span><span class="fmc-arrow">›</span>
              <span class="fmc-step">④ 검수요청</span>
            </div>
          </div>
          <div class="fmc-badge">Content First</div>
        </div>
        <div class="flow-mode-card fmc-b" onclick="startFlow('curriculum-first')">
          <div class="fmc-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg></div>
          <div class="fmc-body">
            <div class="fmc-title">커리큘럼에서 시작</div>
            <div class="fmc-desc">위치 선택 후 파일 업로드 — 누락 없이 체계적으로.</div>
            <div class="fmc-steps">
              <span class="fmc-step">① 위치 선택</span><span class="fmc-arrow">›</span>
              <span class="fmc-step">② 템플릿</span><span class="fmc-arrow">›</span>
              <span class="fmc-step">③ 업로드</span><span class="fmc-arrow">›</span>
              <span class="fmc-step">④ 검수요청</span>
            </div>
          </div>
          <div class="fmc-badge">Curriculum First</div>
        </div>
      </div>
      <div style="display:flex;gap:8px;align-items:center;padding:8px 0 2px;flex-wrap:wrap">
        <span style="font-size:11px;color:#FF9500;cursor:pointer" onclick="setWorkFilter('urgent')">미등록 <strong>${statusCounts.urgent}</strong>개</span>
        <span style="font-size:11px;color:#FF9500;cursor:pointer" onclick="setWorkFilter('inprog')">작업중 <strong>${statusCounts.inprog}</strong>개</span>
        <span style="font-size:11px;color:#0071E3;cursor:pointer" onclick="setWorkFilter('done')">완료 <strong>${doneTotal}</strong>개 (검수요청 대기)</span>
        <select class="df-sel" id="dfSubjectSel" onchange="filterBySubject(this.value)" style="height:28px;font-size:11px;margin-left:auto">
          <option value="">전체 과목</option>
          ${subjects.map(s=>`<option value="${s.id}">${s.label}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="flow-divider">등록된 콘텐츠 · ${STATE.workStatusFilter==='all'?'전체':STATUS_CONFIG[STATE.workStatusFilter]?.label||STATE.workStatusFilter}</div>
    <div class="dash-wrap">
      ${nextLeaf && STATE.workStatusFilter==='all' ? buildNextActionBar(nextLeaf) : ''}
      ${buildDashCardSections()}
      <div style="height:20px"></div>
    </div>
  </div>`;
}

function setWorkFilter(f) {
  STATE.workStatusFilter = f;
  renderDashboard();
}

// ── Review Tab ──
function renderReviewTab(reviewLeaves) {
  const inReview  = reviewLeaves.filter(l=>getSt(l.id).status==='review');
  const reviewed  = reviewLeaves.filter(l=>getSt(l.id).status==='reviewed');

  if(reviewLeaves.length === 0) {
    document.getElementById('content-sub').innerHTML = `
    <div class="tab-empty-state">
      <div class="icon-box icon-box-lg ib-purple" style="margin-bottom:14px"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" width="22" height="22"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg></div>
      <div style="font-size:14px;font-weight:600;color:var(--c-gray-700);margin-bottom:6px">검수 중인 콘텐츠가 없습니다</div>
      <div style="font-size:12px;color:var(--c-gray-400);margin-bottom:16px">업로드 완료된 콘텐츠에서 검수요청을 보내면 여기에 표시됩니다</div>
      <button class="btn btn-ghost btn-sm" onclick="setDashTab('work')">← 작업 현황으로</button>
    </div>`;
    return;
  }

  document.getElementById('content-sub').innerHTML = `
  <div style="display:flex;flex-direction:column;height:100%;overflow:hidden">
    ${reviewed.length>0 ? `
    <div style="background:#F0FFF4;border-bottom:1px solid #A8E6B8;padding:8px 20px;display:flex;align-items:center;gap:10px;flex-shrink:0">
      <span style="width:20px;height:20px;background:#F0FFF4;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0"><svg viewBox="0 0 24 24" fill="none" stroke="#34C759" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="11" height="11"><polyline points="20 6 9 17 4 12"/></svg></span>
      <span style="font-size:12px;font-weight:700;color:#1B8A3E">검수 완료된 콘텐츠 ${reviewed.length}건이 서비스 적용을 기다리고 있습니다</span>
      <button class="btn-go-live" style="margin-left:auto;font-size:11px;padding:5px 14px" onclick="batchGoLive()">일괄 서비스 적용</button>
    </div>` : ''}
    <div class="dash-wrap">
      ${reviewed.length>0 ? `
        <div class="dash-phase-header">
          <span class="dash-phase-title">검수 완료</span>
          <span class="dash-phase-count" style="background:#F0FFF4;color:#1B8A3E">${reviewed.length}건</span>
          <span class="dash-phase-sub">— 서비스 적용 대기 중</span>
        </div>
        <div class="review-grid">${reviewed.map(l=>buildReviewCard(l)).join('')}</div>
      ` : ''}
      ${inReview.length>0 ? `
        <div class="dash-phase-header">
          <span class="dash-phase-title">검수요청 중</span>
          <span class="dash-phase-count" style="background:#F9F0FF;color:#AF52DE">${inReview.length}건</span>
          <span class="dash-phase-sub">— 검수자 확인 중</span>
        </div>
        <div class="review-grid">${inReview.map(l=>buildReviewCard(l)).join('')}</div>
      ` : ''}
      <div style="height:20px"></div>
    </div>
  </div>`;
}

// ── Live Tab ──
function renderLiveTab(liveLeaves) {
  if(liveLeaves.length === 0) {
    document.getElementById('content-sub').innerHTML = `
    <div class="tab-empty-state">
      <div class="icon-box icon-box-lg ib-green" style="margin-bottom:14px"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" width="22" height="22"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/></svg></div>
      <div style="font-size:14px;font-weight:600;color:var(--c-gray-700);margin-bottom:6px">아직 서비스 중인 콘텐츠가 없습니다</div>
      <div style="font-size:12px;color:var(--c-gray-400);margin-bottom:16px">검수 완료 후 서비스 적용을 하면 여기에 표시됩니다</div>
      <button class="btn btn-ghost btn-sm" onclick="setDashTab('review')">← 검수 현황으로</button>
    </div>`;
    return;
  }

  const subjects = getSubjects();
  const grouped  = {};
  liveLeaves.forEach(l=>{
    const subj = getRootSubject(l.id);
    const sid  = subj?.id || '_none';
    if(!grouped[sid]) grouped[sid]={subj, leaves:[]};
    grouped[sid].leaves.push(l);
  });

  document.getElementById('content-sub').innerHTML = `
  <div style="display:flex;flex-direction:column;height:100%;overflow:hidden">
    <div style="background:#F0FFF4;border-bottom:1px solid #A8E6B8;padding:10px 20px;display:flex;align-items:center;gap:12px;flex-shrink:0">
      <span style="width:24px;height:24px;background:#F0FFF4;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0"><svg viewBox="0 0 24 24" fill="none" stroke="#34C759" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12"><circle cx="12" cy="12" r="2" fill="#34C759"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49"/></svg></span>
      <div>
        <div style="font-size:13px;font-weight:600;color:#1B8A3E">서비스 중인 콘텐츠</div>
        <div style="font-size:11px;color:#34C759">총 ${liveLeaves.length}개 콘텐츠가 현재 서비스 중입니다</div>
      </div>
      <div style="margin-left:auto;display:flex;gap:8px">
        <select class="df-sel" style="height:30px;font-size:11px;border-color:#A8E6B8">
          <option>전체 과목</option>
          ${subjects.map(s=>`<option>${s.label}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="dash-wrap">
      ${Object.values(grouped).map(({subj, leaves})=>`
        <div class="dash-section">
          <div class="section-hd">
            <span style="width:18px;height:18px;display:inline-flex;align-items:center;justify-content:center;color:var(--c-primary)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg></span>
            <span class="section-title">${subj?.label||'기타'}</span>
            <span class="section-count">${leaves.length}개</span>
            <div class="section-divider"></div>
            <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:8px;background:#F0FFF4;color:#1B8A3E">● 서비스 중</span>
          </div>
          <div class="review-grid">${leaves.map(l=>buildLiveCard(l)).join('')}</div>
        </div>
      `).join('')}
      <div style="height:20px"></div>
    </div>
  </div>`;
}

function buildDashCardSections() {
  return getSubjects().map(subj => {
    let leaves = getLeaves(subj.id).filter(l=>{
      const phase = STATUS_CONFIG[getSt(l.id).status]?.phase;
      if(phase !== 'work') return false;
      if(STATE.workStatusFilter !== 'all' && getSt(l.id).status !== STATE.workStatusFilter) return false;
      return true;
    });
    if(!leaves.length) return '';
    return `
    <div class="dash-section">
      <div class="section-hd">
        <span style="width:18px;height:18px;display:inline-flex;align-items:center;justify-content:center;color:var(--c-gray-500)">${getNodeIcon(subj)}</span>
        <span class="section-title">${subj.label}</span>
        <span class="section-count">${leaves.length}개</span>
        <div class="section-divider"></div>
        <button class="btn btn-ghost btn-xs" onclick="ctSelectNode('${subj.id}','group')">편집</button>
      </div>
      <div class="card-grid">
        ${leaves.map(l => buildContentCard(l)).join('')}
      </div>
    </div>`;
  }).join('') || `<div style="padding:30px 20px;text-align:center;color:var(--c-gray-400);font-size:12px">선택한 상태의 콘텐츠가 없습니다</div>`;
}

function buildContentCard(leaf) {
  const st   = getSt(leaf.id);
  const cfg  = stCfg(st.status);
  const ct   = getCTMeta(leaf);
  const pct  = getPct(st);
  const path = getPath(leaf.id);
  const pathNodes = getPathNodes(leaf.id);
  const subj = pathNodes[0];
  const catPath = pathNodes.slice(1, -1).map(n=>n.label).join(' › ');
  const ai  = Math.floor(Math.random()*AUTHORS.length);
  const ti  = Math.floor(Math.random()*TEAMS.length);
  const ci  = Math.floor(Math.random()*TEAM_COLORS.length);
  const tags = ['#'+subj?.label, '#'+leaf.label, '#'+catPath.split(' › ').pop()].filter(Boolean);

  return `
  <div class="content-card" onclick="ctSelectNode('${leaf.id}','leaf')">
    <div class="cc-top">
      <div class="cc-badges">
        <span class="cc-type" style="background:${ct.bg};color:${ct.color}"><span style="width:12px;height:12px;display:inline-flex;align-items:center;justify-content:center">${ct.icon}</span>${ct.label}</span>
        <span class="cc-date">${new Date().toLocaleDateString('ko-KR',{month:'2-digit',day:'2-digit'})}</span>
      </div>
      <div class="cc-title">${path}</div>
      <div class="cc-meta">
        <span class="cc-meta-k">과목</span><span class="cc-meta-v">${subj?.label||'—'}</span>
        <span class="cc-meta-k">카테고리</span><span class="cc-meta-v">${catPath||'—'}</span>
      </div>
    </div>
    <div class="cc-bottom">
      <div class="cc-progress">
        <div class="cc-prog-row">
          <span class="cc-prog-label">업로드 ${st.uploaded}/${st.total} · 메타 ${st.metaDone}/${st.total}</span>
          <span class="cc-prog-pct" style="color:${cfg.dot}">${pct}%</span>
        </div>
        <div class="cc-prog-bar"><div class="cc-prog-fill" style="width:${pct}%;background:${cfg.bar}"></div></div>
      </div>
      <div class="cc-tags">${tags.map(t=>`<span class="cc-tag">${t}</span>`).join('')}</div>
      <div class="cc-footer">
        <div class="cc-author">
          <div class="cc-author-av" style="background:${TEAM_COLORS[ci]}">${AUTHORS[ai].slice(0,1)}</div>
          <span>${AUTHORS[ai]} · ${TEAMS[ti]}</span>
        </div>
        <div style="display:flex;gap:4px">
          ${st.status==='done' ? `<button class="btn-request-review" onclick="event.stopPropagation();openReviewModal('${leaf.id}')">검수 요청</button>` : ''}
          ${['idle','urgent','inprog'].includes(st.status) ? `<button class="cc-action ${cfg.btn}" onclick="event.stopPropagation();ctSelectNode('${leaf.id}','leaf')">${cfg.btnLabel}</button>` : ''}
        </div>
      </div>
    </div>
  </div>`;
}

// ════════════════════════════════
//  ■ FLOW ENTRY
// ════════════════════════════════
function startFlow(mode) {
  STATE.flowMode = mode;
  if(mode === 'content-first') {
    STATE.cfStep = 1;
    STATE.cfFiles = [];
    STATE.cfMeta  = {};
    STATE.cfMappedNode = null;
    STATE.cfTpl = null;
    renderCFContainer();
  } else {
    // curriculum-first: show CT panel, user picks node
    STATE.currentNode = null;
    STATE.currentStep = 1;
    STATE.selectedTpl = null;
    STATE.publishDone = false;
    renderStepContainer();
  }
}

// ════════════════════════════════
//  ■ FLOW B — CURRICULUM FIRST
// ════════════════════════════════
function renderStepContainer() {
  const node = STATE.currentNode ? getNode(STATE.currentNode) : null;
  document.getElementById('content-sub').innerHTML = `
  <div style="display:flex;flex-direction:column;height:100%;overflow:hidden">
    <div class="stepbar" id="stepbar">
      <span class="flow-badge fb-curr">커리큘럼 먼저</span>
      <div class="step act" onclick="tryGoStep(1)"><div class="sn2">1</div><span class="sl">위치 · 템플릿</span></div>
      <span class="sarr">›</span>
      <div class="step idle" onclick="tryGoStep(2)"><div class="sn2">2</div><span class="sl">파일 업로드</span></div>
      <span class="sarr">›</span>
      <div class="step idle" onclick="tryGoStep(3)"><div class="sn2">3</div><span class="sl">메타 입력</span></div>
      <span class="sarr">›</span>
      <div class="step idle" onclick="tryGoStep(4)"><div class="sn2">4</div><span class="sl">검토 · 게시</span></div>
      <div style="flex:1"></div>
      <button class="btn btn-ghost btn-xs" onclick="if(confirm('커리큘럼 먼저 방식을 취소하고 처음으로 돌아갈까요?'))backToDash()" style="color:var(--c-gray-400);font-size:10px">↩ 방식변경</button>
      <button class="btn btn-ghost btn-sm" onclick="backToDash()">← 현황으로</button>
    </div>
    <div class="cr-layout">
      ${buildCTPanel()}
      <div class="content-panel" id="contentPanel"></div>
    </div>
  </div>`;
  updateStepBar();
  renderStep1();
}

// ════════════════════════════════
//  ■ FLOW A — CONTENT FIRST
// ════════════════════════════════
function renderCFContainer() {
  document.getElementById('content-sub').innerHTML = `
  <div style="display:flex;flex-direction:column;height:100%;overflow:hidden">
    <div class="cf-stepbar" id="cfStepbar">
      <span class="flow-badge fb-cf">파일 먼저</span>
      <div class="cf-step act" id="cfStep1" onclick="cfGoStep(1)"><div class="csn">1</div><span class="csl">파일 업로드</span></div>
      <span class="cf-sarr">›</span>
      <div class="cf-step idle" id="cfStep2" onclick="cfGoStep(2)"><div class="csn">2</div><span class="csl">메타 입력</span></div>
      <span class="cf-sarr">›</span>
      <div class="cf-step idle" id="cfStep3" onclick="cfGoStep(3)"><div class="csn">3</div><span class="csl">커리큘럼 맵핑</span></div>
      <span class="cf-sarr">›</span>
      <div class="cf-step idle" id="cfStep4" onclick="cfGoStep(4)"><div class="csn">4</div><span class="csl">검토 · 게시</span></div>
      <div style="flex:1"></div>
      <button class="btn btn-ghost btn-xs" onclick="if(confirm('콘텐츠 먼저 방식을 취소하고 처음으로 돌아갈까요?'))backToDash()" style="color:var(--c-gray-400);font-size:10px">↩ 방식변경</button>
      <button class="btn btn-ghost btn-sm cf-back-btn" onclick="backToDash()">← 현황으로</button>
    </div>
    <div id="cfPanel" style="flex:1;display:flex;flex-direction:column;overflow:hidden"></div>
  </div>`;
  cfUpdateStepBar();
  cfRenderStep(STATE.cfStep);
}

function cfGoStep(n) {
  if(n > STATE.cfStep) {
    if(n >= 2 && STATE.cfFiles.length === 0) { toast('파일을 먼저 업로드하세요', 't-warn'); return; }
    if(n >= 4 && !STATE.cfMappedNode)        { toast('커리큘럼 위치를 먼저 선택하세요', 't-warn'); return; }
  }
  STATE.cfStep = n;
  cfUpdateStepBar();
  cfRenderStep(n);
}

function cfUpdateStepBar() {
  for(let i=1; i<=4; i++) {
    const el = document.getElementById('cfStep'+i);
    if(!el) return;
    el.className = 'cf-step';
    if(i < STATE.cfStep)        el.classList.add('done');
    else if(i === STATE.cfStep) el.classList.add('act');
    else                        el.classList.add('idle');
    const num = el.querySelector('.csn');
    if(num) num.textContent = i < STATE.cfStep ? '✓' : String(i);
  }
}

function cfRenderStep(n) {
  if(n===1)      cfRenderUpload();
  else if(n===2) cfRenderMeta();
  else if(n===3) cfRenderMapping();
  else           cfRenderPublish();
}

// ── CF Step 1: File Upload ──
const CF_FILE_TYPE_MAP = {
  'mp3':'song','wav':'song','ogg':'song',
  'pdf':'note','docx':'note',
  'mp4':'video','mov':'video',
  'png':'flash','jpg':'flash','jpeg':'flash','webp':'flash'
};
const CF_FILE_ICONS = {song:ICONS.music,note:ICONS.fileText,video:ICONS.video,flash:ICONS.zap,default:ICONS.folder};

function cfRenderUpload() {
  const files = STATE.cfFiles;
  const typeGroups = {};
  files.forEach(f=>{ if(!typeGroups[f.cfType]) typeGroups[f.cfType]=[]; typeGroups[f.cfType].push(f); });

  document.getElementById('cfPanel').innerHTML=`
  <div style="display:flex;flex-direction:column;height:100%;overflow:hidden">
    <div class="tab-body" style="overflow-y:auto"><div class="bpad">
      <div class="notice notice-blue">커리큘럼 위치는 나중에 지정합니다. 지금은 파일만 올리세요.</div>

      <!-- Drop zone -->
      <div class="upload-zone" id="cfDropZone"
        ondragenter="this.classList.add('drag-active');event.preventDefault()"
        ondragover="event.preventDefault()"
        ondragleave="this.classList.remove('drag-active')"
        ondrop="this.classList.remove('drag-active');event.preventDefault();cfAddDemoFiles()">
        <div class="upload-zone-inner">
          <div class="uz-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg></div>
          <div class="uz-title">파일을 드래그하거나 클릭하여 선택하세요</div>
          <div class="uz-sub">mp3 · pdf · mp4 · jpg 등 모든 콘텐츠 파일 지원</div>
          <div class="uz-btn" onclick="cfAddDemoFiles()">파일 선택하기</div>
        </div>
      </div>

      ${files.length > 0 ? `
        <div class="notice notice-green">✓ ${files.length}개 파일이 준비되었습니다.</div>
        ${Object.entries(typeGroups).map(([type, tFiles])=>`
          <div style="margin-bottom:12px">
            <div style="font-size:11px;font-weight:600;color:var(--c-gray-700);margin-bottom:6px">
              ${CF_FILE_ICONS[type]||''} ${(CONTENT_TYPE_META[type]||{label:type}).label} · ${tFiles.length}개
            </div>
            <div class="cf-file-list">
              ${tFiles.map(f=>`
              <div class="cf-file-row">
                <span class="cf-file-icon ico ico-sm">${CF_FILE_ICONS[f.cfType]||''}</span>
                <span class="cf-file-name">${f.name}</span>
                <span class="cf-file-size">${f.size}</span>
                <span class="cf-file-type" style="background:${(CONTENT_TYPE_META[f.cfType]||{}).bg||'#F5F5F7'};color:${(CONTENT_TYPE_META[f.cfType]||{}).color||'#48484A'}">${(CONTENT_TYPE_META[f.cfType]||{label:f.cfType}).label}</span>
                <button class="cf-file-del" onclick="cfRemoveFile(${f.id})">✕</button>
              </div>`).join('')}
            </div>
          </div>`).join('')}
      ` : ''}
    </div></div>

    <div class="footer-bar">
      <div class="fi">
        ${files.length > 0
          ? `<span>총 <strong>${files.length}개</strong> 파일</span>${Object.entries(typeGroups).map(([t,fs])=>`<span>${CF_FILE_ICONS[t]||''} ${fs.length}</span>`).join('')}`
          : '<span style="color:#FF9500">파일을 업로드하세요</span>'}
      </div>
      <button class="btn btn-primary btn-sm"
        onclick="${files.length>0?"cfGoStep(2)":"toast('파일을 먼저 업로드하세요','t-warn')"}"
        ${files.length===0?'disabled':''}>메타 입력 →</button>
    </div>
  </div>`;
}

function cfDetectType(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  return CF_FILE_TYPE_MAP[ext] || 'note';
}
function cfAddDemoFiles() {
  const demos = [
    {id:STATE.nextFid++,name:'NE2_동요_01.mp3',size:'4.2MB',cfType:'song',meta:{}},
    {id:STATE.nextFid++,name:'NE2_동요_02.mp3',size:'3.8MB',cfType:'song',meta:{}},
    {id:STATE.nextFid++,name:'NE2_해설지_01.pdf',size:'1.1MB',cfType:'note',meta:{}},
    {id:STATE.nextFid++,name:'NE2_강의영상_01.mp4',size:'24MB',cfType:'video',meta:{}},
  ];
  STATE.cfFiles = [...STATE.cfFiles, ...demos];
  toast(`${demos.length}개 파일이 추가되었습니다`, 't-ok', 1600);
  cfRenderUpload();
}

function cfRemoveFile(id) {
  STATE.cfFiles = STATE.cfFiles.filter(f=>f.id!==id);
  toast('파일 제거됨', 't-warn', 1200);
  cfRenderUpload();
}

// ── CF Step 2: Meta Input ──
function cfRenderMeta() {
  const files = STATE.cfFiles;
  const fields = [{id:'title',label:'제목',req:true,type:'text'},{id:'desc',label:'설명',req:false,type:'text'},{id:'tag',label:'태그',req:false,type:'text'}];
  const filled = files.filter(f=>f.meta&&f.meta.title).length;

  document.getElementById('cfPanel').innerHTML=`
  <div style="display:flex;flex-direction:column;height:100%;overflow:hidden">
    <div class="tab-body" style="overflow-y:auto"><div class="bpad">
      <div class="done-banner">
        <span style="width:28px;height:28px;background:var(--c-primary-l);border-radius:8px;display:inline-flex;align-items:center;justify-content:center"><svg viewBox="0 0 24 24" fill="none" stroke="var(--c-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg></span>
        <div>
          <div style="font-size:12px;font-weight:600;color:#1B8A3E">파일 ${files.length}개 업로드 완료</div>
          <div style="font-size:11px;color:#1B8A3E;margin-top:2px">메타 정보 ${filled}/${files.length} 입력됨</div>
        </div>
      </div>
      <div class="notice notice-blue">파일별 제목과 설명을 입력하세요. 커리큘럼 위치는 다음 단계에서 지정합니다.</div>
      <div class="meta-table">
        <div class="mt-hd-row" style="grid-template-columns:28px 180px 1fr 1fr 1fr 60px">
          ${['#','파일','제목 *','설명','태그','상태'].map(c=>`<div class="mt-hd-cell">${c}</div>`).join('')}
        </div>
        ${files.map((f,i)=>{
          if(!f.meta) f.meta={};
          const done = !!f.meta.title;
          return `<div class="mt-data-row${done?'':' unfilled'}" style="grid-template-columns:28px 180px 1fr 1fr 1fr 60px">
            <div class="mt-cell"><div class="ft-order" style="background:${done?'#34C759':'#FF9500'};width:22px;height:22px;font-size:9px">${i+1}</div></div>
            <div class="mt-cell" style="flex-direction:column;align-items:flex-start"><div class="ft-name" style="font-size:11px">${f.name}</div><div class="ft-size">${f.size}</div></div>
            <div class="mt-cell"><input class="meta-inp" value="${f.meta.title||''}" placeholder="제목 입력"
              oninput="cfUpdateMeta(${f.id},'title',this.value)"></div>
            <div class="mt-cell"><input class="meta-inp" value="${f.meta.desc||''}" placeholder="설명"
              oninput="cfUpdateMeta(${f.id},'desc',this.value)"></div>
            <div class="mt-cell"><input class="meta-inp" value="${f.meta.tag||''}" placeholder="태그, 쉼표 구분"
              oninput="cfUpdateMeta(${f.id},'tag',this.value)"></div>
            <div class="mt-cell"><span class="status-pill ${done?'sp-ok':'sp-warn'}">${done?'완료':'미입력'}</span></div>
          </div>`;
        }).join('')}
      </div>
    </div></div>
    <div class="footer-bar">
      <div class="fi">
        <span>총 <strong>${files.length}개</strong></span>
        <span>완료 <strong style="color:#34C759">${filled}</strong></span>
        <span>미입력 <strong style="color:#FF9500">${files.length-filled}</strong></span>
      </div>
      <div style="display:flex;gap:7px">
        <button class="btn btn-ghost btn-sm" onclick="cfGoStep(1)">← 파일 업로드</button>
        <button class="btn btn-primary btn-sm" onclick="cfGoStep(3)">커리큘럼 맵핑 →</button>
      </div>
    </div>
  </div>`;
}

function cfUpdateMeta(fileId, field, val) {
  const f = STATE.cfFiles.find(x=>x.id===fileId);
  if(f) { if(!f.meta) f.meta={}; f.meta[field]=val; }
}

// ── CF Step 3: Curriculum Mapping ──
function cfRenderMapping() {
  const mapped = STATE.cfMappedNode ? getNode(STATE.cfMappedNode) : null;
  const mappedPath = STATE.cfMappedNode ? getPath(STATE.cfMappedNode) : null;
  const subjects = getSubjects();

  document.getElementById('cfPanel').innerHTML=`
  <div style="display:flex;flex-direction:column;height:100%;overflow:hidden">
    <div class="cmap-layout">

      <!-- 왼쪽: 커리큘럼 트리 -->
      <div class="cmap-tree-panel">
        <div class="cmap-tree-hd">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
            <span style="font-size:10px;font-weight:600;color:var(--c-gray-500);text-transform:uppercase;letter-spacing:.04em">등록 위치 선택</span>
            <span style="font-size:10px;color:var(--c-gray-400)">(${STATE.cfFiles.length}개 파일 → 여기에 등록)</span>
          </div>
          <div class="cmap-search">
            <span style="color:var(--c-gray-400);display:inline-flex;align-items:center"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
            <input placeholder="노드 검색..." value="${STATE.cfMapSearch||''}"
              oninput="STATE.cfMapSearch=this.value;cfRenderMapping()">
          </div>
          <div class="cmap-filter-row">
            <div class="cmap-filter-chip${STATE.cfMapSubjectFilter==='all'?' on':''}" onclick="STATE.cfMapSubjectFilter='all';cfRenderMapping()">전체</div>
            ${subjects.map(s=>`<div class="cmap-filter-chip${STATE.cfMapSubjectFilter===s.id?' on':''}" onclick="STATE.cfMapSubjectFilter='${s.id}';cfRenderMapping()">${s.label}</div>`).join('')}
            <div class="cmap-filter-chip${STATE.cfMapSubjectFilter==='available'?' on':''}" onclick="STATE.cfMapSubjectFilter='available';cfRenderMapping()">빈 슬롯</div>
          </div>
        </div>
        <div class="cmap-tree-body">
          ${cfBuildMapTree(null, 0)}
        </div>
      </div>

      <!-- 오른쪽: 선택 결과 -->
      <div class="cmap-result">
        ${mapped ? `
          <div class="cmap-selected-box">
            <div class="cmap-breadcrumb">
              ${mappedPath.split(' > ').map((p,i,arr)=>`<span>${p}</span>${i<arr.length-1?'<span style="color:var(--c-gray-300)">›</span>':''}`).join('')}
            </div>
            <div class="cmap-selected-name">${mapped.label}</div>
            <div class="cmap-selected-meta">
              ${mapped.contentType ? `<span class="cmap-meta-pill">${(CONTENT_TYPE_META[mapped.contentType]||{}).icon||''} ${(CONTENT_TYPE_META[mapped.contentType]||{label:mapped.contentType}).label}</span>` : ''}
              ${mapped.rounds ? `<span class="cmap-meta-pill"> ${mapped.rounds}회차</span>` : ''}
              ${(()=>{ const st=getSt(mapped.id); const cfg=stCfg(st.status); return `<span class="cmap-meta-pill" style="background:${cfg.bg};color:${cfg.dot}">${cfg.label}</span>`; })()}
            </div>
            <div class="cmap-siblings">
              <div class="cmap-siblings-title">같은 그룹의 항목</div>
              ${(getChildren(getNode(STATE.cfMappedNode)?.pid||null)||[]).slice(0,8).map(sibling=>`
                <div class="cmap-sibling-row${sibling.id===STATE.cfMappedNode?' is-target':''}">
                  <span>${sibling.id===STATE.cfMappedNode?'▶':'  '}</span>
                  <span>${getNodeIcon(sibling)}</span>
                  <span>${sibling.label}${sibling.id===STATE.cfMappedNode?' ← 선택됨':''}</span>
                </div>`).join('')}
            </div>
            <div style="margin-top:12px">
              <div style="font-size:11px;font-weight:600;color:var(--c-gray-600);margin-bottom:6px">이 위치에 등록될 파일</div>
              ${STATE.cfFiles.slice(0,5).map(f=>`
                <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--c-gray-600);padding:3px 0;border-bottom:1px solid var(--c-gray-100)">
                  <span>${CF_FILE_ICONS[f.cfType]||''}</span>
                  <span style="flex:1">${f.meta?.title||f.name}</span>
                  <span style="color:var(--c-gray-400)">${f.size}</span>
                </div>`).join('')}
              ${STATE.cfFiles.length>5?`<div style="font-size:10px;color:var(--c-gray-400);padding:4px 0">+ ${STATE.cfFiles.length-5}개 더...</div>`:''}
            </div>
          </div>
        ` : `
          <div class="cmap-empty-box">
            <div style="width:44px;height:44px;background:var(--c-purple-l);border-radius:12px;display:flex;align-items:center;justify-content:center;margin:0 auto 10px"><svg viewBox="0 0 24 24" fill="none" stroke="var(--c-purple)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" width="22" height="22"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg></div>
            <div style="font-size:14px;font-weight:600;color:var(--c-gray-700);margin-bottom:6px">위치를 선택하세요</div>
            <div style="font-size:12px;color:var(--c-gray-400);line-height:1.7">왼쪽 커리큘럼 트리에서<br>콘텐츠를 등록할 위치를 클릭하세요</div>
          </div>
        `}
      </div>
    </div>

    <div class="footer-bar">
      <div class="fi">
        ${mapped
          ? `<span style="color:#34C759">✓ <strong>${mappedPath}</strong> 에 맵핑됨</span>`
          : '<span style="color:#FF9500">등록 위치를 선택하세요</span>'}
      </div>
      <div style="display:flex;gap:7px">
        <button class="btn btn-ghost btn-sm" onclick="cfGoStep(2)">← 메타 입력</button>
        <button class="btn btn-primary btn-sm" onclick="${mapped?"cfGoStep(4)":"toast('위치를 선택하세요','t-warn')"}"
          ${mapped?'':'disabled'}>검토 · 게시 →</button>
      </div>
    </div>
  </div>`;
}

function cfBuildMapTree(pid, depth) {
  return getChildren(pid).filter(node=>{
    const subjId = getRootSubject(node.id)?.id;
    if(STATE.cfMapSubjectFilter !== 'all' && STATE.cfMapSubjectFilter !== 'available' && subjId !== STATE.cfMapSubjectFilter) return false;
    if(STATE.cfMapSubjectFilter === 'available') {
      const st = getSt(node.id);
      if(node.type === 'leaf' && st.status !== 'urgent') return false;
    }
    if(STATE.cfMapSearch) {
      const q = STATE.cfMapSearch.toLowerCase();
      if(!node.label.toLowerCase().includes(q) && !getPath(node.id).toLowerCase().includes(q)) return false;
    }
    return true;
  }).map(node => {
    const isLeaf     = node.type === 'leaf';
    const isTerminal = isLeaf && getChildren(node.id).length === 0;
    const isSel      = STATE.cfMappedNode === node.id;
    const isSubj     = node.isSubject;
    const kids       = getChildren(node.id);
    const canExpand  = (!isLeaf || !isTerminal) && kids.length > 0;
    const st         = isTerminal ? getSt(node.id) : null;
    const stCls      = st ? `cmap-badge-${st.status}` : '';
    const stLbl      = st ? stCfg(st.status).label : '';
    const canMap     = isTerminal || (node.type === 'group');

    const isEmpty = st && st.status === 'urgent';
    return `
    <div class="cmap-node${isSel?' sel':''}${isSubj?' subj-node':''}${isEmpty?' cmap-empty':''}"
      style="padding-left:${10+depth*14}px"
      onclick="${canMap?`cfSelectMapNode('${node.id}')`:`cfToggleMapExpand('${node.id}')`}"
      title="${canMap?'클릭하여 이 위치에 등록':'펼치기'}">
      <span class="cmap-node-tog" onclick="event.stopPropagation();cfToggleMapExpand('${node.id}')"
        style="visibility:${canExpand?'visible':'hidden'}">${node.expanded?'▾':'▸'}</span>
      <span class="cmap-node-ico">${getNodeIcon(node)}</span>
      <span class="cmap-lbl">${node.label}</span>
      ${st ? `<span class="cmap-badge ${stCls}">${stLbl}</span>` : ''}
      ${canMap && !isSel ? `<span class="cmap-pick-btn">등록</span>` : ''}
      ${isSel ? `<span style="font-size:9px;color:var(--c-primary);font-weight:600;flex-shrink:0">✓선택</span>` : ''}
    </div>
    ${canExpand && node.expanded ? cfBuildMapTree(node.id, depth+1) : ''}`;
  }).join('');
}

function cfSelectMapNode(id) {
  STATE.cfMappedNode = id;
  cfRenderMapping();
}

function cfToggleMapExpand(id) {
  const n = getNode(id);
  if(n) { n.expanded = !n.expanded; cfRenderMapping(); }
}

// ── CF Step 4: Review & Publish ──
function cfRenderPublish() {
  const files   = STATE.cfFiles;
  const filled  = files.filter(f=>f.meta&&f.meta.title).length;
  const mapped  = STATE.cfMappedNode ? getNode(STATE.cfMappedNode) : null;
  const mapPath = STATE.cfMappedNode ? getPath(STATE.cfMappedNode) : null;

  const checks = [
    {pass:files.length>0,       label:'파일 업로드',      detail:files.length>0?`${files.length}개 파일`:'없음',  step:1},
    {pass:filled===files.length&&files.length>0, label:'메타 정보 입력', detail:`${filled}/${files.length}개`, step:2},
    {pass:!!STATE.cfMappedNode, label:'커리큘럼 위치 선택', detail:mapped?mapPath:'미선택',                      step:3},
  ];
  const allPass = checks.every(c=>c.pass);

  document.getElementById('cfPanel').innerHTML=`
  <div style="display:flex;flex-direction:column;height:100%;overflow:hidden">
    <div class="tab-body" style="overflow-y:auto"><div class="bpad">

      <div class="s4-summary-grid">
        <div class="s4-card${files.length>0?' ok':''}"><div class="s4-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg></div><div class="s4-num" style="color:#0071E3">${files.length}</div><div class="s4-lbl">총 파일</div></div>
        <div class="s4-card${filled===files.length&&files.length>0?' ok':' warn'}"><div class="s4-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg></div><div class="s4-num" style="color:${filled===files.length?'#34C759':'#FF9500'}">${filled}</div><div class="s4-lbl">메타 완료</div></div>
        <div class="s4-card${STATE.cfMappedNode?' ok':'err'}"><div class="s4-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg></div><div class="s4-num" style="color:${STATE.cfMappedNode?'#34C759':'#FF3B30'};font-size:12px">${mapped?mapped.label:'미선택'}</div><div class="s4-lbl">커리큘럼 위치</div></div>
        <div class="s4-card${allPass?' ok':' err'}"><div class="s4-ico">${allPass?'✓':'✕'}</div><div class="s4-num" style="color:${allPass?'#34C759':'#FF3B30'};font-size:18px">${allPass?'가능':'미완료'}</div><div class="s4-lbl">게시 상태</div></div>
      </div>

      <div class="checklist">
        <div class="cl-hd">${allPass?'<span style="color:#34C759">●</span>':'<span style="color:#FF9500">!</span>'} 게시 전 체크리스트
          <span style="font-size:10px;color:#AEAEB2;font-weight:400;margin-left:auto">${checks.filter(c=>c.pass).length}/${checks.length} 통과</span>
        </div>
        ${checks.map(c=>`<div class="cl-item">
          <span class="cl-ico" style="color:${c.pass?'#34C759':'#FF3B30'}">${c.pass?'✓':'✗'}</span>
          <span class="cl-main" style="color:${c.pass?'#48484A':'#FF3B30'}"><strong>${c.label}</strong> — ${c.detail}</span>
          ${!c.pass?`<span class="cl-action" onclick="cfGoStep(${c.step})">수정하기</span>`:''}
        </div>`).join('')}
      </div>

      <div class="pub-box">
        <h3>${allPass?'게시 준비 완료':'미완료 항목이 있습니다'}</h3>
        <p>${allPass
          ? `<strong>${mapPath}</strong>에 ${files.length}개 파일을 등록합니다.`
          : '위 체크리스트 항목을 먼저 해결해주세요.'}</p>
        <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
          <button class="btn btn-ghost btn-sm" onclick="cfGoStep(3)">← 맵핑 수정</button>
          <button class="btn btn-green btn-sm" onclick="cfConfirmPublish()" ${!allPass?'disabled':''}>✓ 게시하기</button>
        </div>
      </div>
    </div></div>

    <div class="footer-bar">
      <div class="fi">
        <span>파일 <strong>${files.length}개</strong></span>
        <span>메타 <strong style="color:${filled===files.length?'#34C759':'#FF9500'}">${filled}/${files.length}</strong></span>
        ${mapped ? `<span>위치: <strong>${mapped.label}</strong></span>` : ''}
      </div>
      <button class="btn btn-green btn-sm" onclick="cfConfirmPublish()" ${!allPass?'disabled':''}>✓ 게시하기</button>
    </div>
  </div>`;
}

function cfConfirmPublish() {
  const files   = STATE.cfFiles;
  const mapPath = STATE.cfMappedNode ? getPath(STATE.cfMappedNode) : '?';
  showConfirm('게시 확인',
    `"${mapPath}"에 ${files.length}개 파일을 등록할까요?`,
    () => {
      // Update node status
      if(STATE.cfMappedNode) {
        STATE.contentStatus[STATE.cfMappedNode] = {
          uploaded:files.length, total:files.length,
          metaDone:files.filter(f=>f.meta?.title).length,
          warnCount:0, status:'done', lastEdit:'방금 전'
        };
      }
      STATE.cfStep = 5;
      cfUpdateStepBar();
      cfRenderDone();
    }, '게시', 'btn-green');
}

function cfRenderDone() {
  const mapPath = STATE.cfMappedNode ? getPath(STATE.cfMappedNode) : '';
  const files   = STATE.cfFiles;
  document.getElementById('cfPanel').innerHTML=`
  <div style="flex:1;overflow-y:auto">
    <div class="done-wrap">
      <div class="done-emoji"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/><circle cx="12" cy="12" r="3" fill="#FFD9A8" stroke="none"/></svg></div>
      <div style="font-size:22px;font-weight:900">게시 완료!</div>
      <div style="font-size:12px;color:#8E8E93;line-height:1.9;text-align:center">
        <strong>${mapPath}</strong><br>
        ${files.length}개 파일이 서비스에 반영되었습니다.
      </div>
      <div style="display:flex;gap:9px;margin-top:6px;flex-wrap:wrap;justify-content:center">
        <button class="btn btn-ghost btn-sm" onclick="startFlow('content-first')">파일 더 올리기</button>
        <button class="btn btn-ghost btn-sm" onclick="startFlow('curriculum-first')">커리큘럼에서 이어서</button>
        <button class="btn btn-primary btn-sm" onclick="backToDash()">현황으로 ↩</button>
      </div>
    </div>
  </div>`;
  refreshCTBody();
  toast('게시 완료!', 't-ok', 3000);
}

// ════════════════════════════════
//  ■ STEP BAR
// ════════════════════════════════
function updateStepBar() {
  const steps = document.querySelectorAll('#stepbar .step');
  steps.forEach((s,i) => {
    s.classList.remove('act','done','idle');
    if(i+1<STATE.currentStep)      s.classList.add('done');
    else if(i+1===STATE.currentStep) s.classList.add('act');
    else                             s.classList.add('idle');
  });
}
function tryGoStep(n) {
  if(n > STATE.currentStep) {
    if(!STATE.currentNode) { toast('분류를 먼저 선택하세요','t-warn'); return; }
    if(n>=2 && !STATE.selectedTpl) { toast('템플릿을 먼저 선택하세요','t-warn'); return; }
  }
  goStep(n);
}
function goStep(n) {
  STATE.currentStep = n;
  updateStepBar();
  if(n===1) renderStep1();
  else if(n===2) renderStep2();
  else if(n===3) renderStep3();
  else renderStep4();
}
function backToDash() {
  STATE.currentNode=null; STATE.currentNodeMode=null;
  STATE.currentStep=1; STATE.selectedTpl=null;
  STATE.flowMode=null; STATE.publishDone=false;
  STATE.cfStep=1; STATE.cfFiles=[]; STATE.cfMappedNode=null; STATE.cfTpl=null;
  renderDashboard();
  _updateContentSubNav();
}

function _goNextUrgentNode() {
  // Find next urgent/idle leaf after current node
  const leaves = STATE.treeNodes.filter(n => n.type==='leaf' && !getChildren(n.id).length);
  const currentIdx = leaves.findIndex(l => l.id === STATE.currentNode);
  let next = null;
  for(let i = currentIdx+1; i < leaves.length; i++) {
    const st = getSt(leaves[i].id).status;
    if(st === 'urgent' || st === 'inprog') { next = leaves[i]; break; }
  }
  if(!next) {
    // wrap around
    for(let i = 0; i < currentIdx; i++) {
      const st = getSt(leaves[i].id).status;
      if(st === 'urgent' || st === 'inprog') { next = leaves[i]; break; }
    }
  }
  if(next) {
    ctSelectNode(next.id, 'leaf');
    toast(`다음: ${next.label}`, 't-info', 1800);
  } else {
    toast('모든 콘텐츠가 등록되었습니다!', 't-ok', 2500);
    backToDash();
  }
}

// ════════════════════════════════
//  ■ STEP 1: Template
// ════════════════════════════════
function renderStep1() {
  const node = getNode(STATE.currentNode);
  const path = STATE.currentNode ? getPath(STATE.currentNode) : '—';
  const modeBadge = STATE.currentNodeMode==='group'
    ? '<span class="mode-badge mb-bulk"> 세트 일괄 등록</span>'
    : '<span class="mode-badge mb-leaf">템플릿별 개별 등록</span>';

  // If no node selected in curriculum-first mode, show guide
  if(!STATE.currentNode && STATE.flowMode === 'curriculum-first') {
    document.getElementById('contentPanel').innerHTML=`
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px;text-align:center;background:var(--c-bg)">
      <div style="width:48px;height:48px;background:var(--c-primary-l);border-radius:14px;display:flex;align-items:center;justify-content:center;margin:0 auto 14px"><svg viewBox="0 0 24 24" fill="none" stroke="var(--c-primary)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" width="24" height="24"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg></div>
      <div style="font-size:15px;font-weight:600;color:var(--c-gray-800);margin-bottom:8px">왼쪽에서 등록 위치를 선택하세요</div>
      <div style="font-size:12px;color:var(--c-gray-400);line-height:1.8;max-width:280px">
        학습 과정 트리에서 콘텐츠를 등록할<br>
        <strong>리프 노드</strong> 또는 <strong>그룹</strong>을 클릭하세요.<br>
        리프 = 개별 등록 · 그룹 = 일괄 등록
      </div>
      <div style="margin-top:20px;padding:12px 18px;background:#fff;border:1px solid var(--c-gray-200);border-radius:var(--radius-lg);font-size:11px;color:var(--c-gray-500);text-align:left;width:100%;max-width:300px">
        <div style="font-weight:700;color:var(--c-gray-700);margin-bottom:8px">시작 방법</div>
        <div style="margin-bottom:4px">① 왼쪽 트리에서 노드 클릭</div>
        <div style="margin-bottom:4px">② 템플릿 선택 후 파일 업로드</div>
        <div style="margin-bottom:4px">③ 메타 입력 → 게시</div>
        <div style="margin-top:10px;padding-top:8px;border-top:1px solid var(--c-gray-100)">
          <button class="btn btn-ghost btn-sm" onclick="backToDash()" style="font-size:11px">↩ 방식 다시 선택</button>
        </div>
      </div>
    </div>`;
    return;
  }
  document.getElementById('contentPanel').innerHTML=`
  <div style="display:flex;flex-direction:column;height:100%;overflow:hidden">
    <div class="path-hd">
      <div class="bc"><span class="cur">${path}</span></div>
      ${modeBadge}
    </div>
    <div class="tab-body"><div class="bpad">
      <div class="notice notice-blue">등록할 Excel 업로드 양식을 선택하세요.</div>
      <div style="font-size:12px;font-weight:600;color:#48484A;margin-bottom:10px">기본 양식</div>
      <div class="tpl-grid">
        ${TEMPLATES.map(t=>`
        <div class="tpl-card${STATE.selectedTpl===t.id?' selected':''}" onclick="selectTpl('${t.id}')">
          <div class="tpl-check">✓</div>
          <div class="tpl-icon">${t.icon}</div>
          <div class="tpl-name">${t.name}</div>
          <div class="tpl-desc">${t.desc}</div>
          <div class="tpl-fields">${t.fields.map(f=>`<span class="tpl-field${f.req?' req':''}">${f.label}${f.req?' *':''}</span>`).join('')}</div>
        </div>`).join('')}
      </div>
      <div style="font-size:12px;font-weight:600;color:#48484A;margin-bottom:8px">직접 구성</div>
      <div class="custom-tpl-box">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
          <span style="font-size:12px;font-weight:600;flex:1">✏ 커스텀 양식</span>
          <button class="btn btn-sm${STATE.selectedTpl==='custom'?' btn-primary':' btn-ghost'}" onclick="selectTpl('custom')">${STATE.selectedTpl==='custom'?'✓ 선택됨':'이 양식 사용'}</button>
        </div>
        <div class="field-row">
          ${STATE.customFields.map(f=>`<span class="f-chip${f.req?' fc-req':' fc-opt'}">${f.label}${f.req?' *':''}${!f.req?`<button class="fc-del" onclick="delCF('${f.id}')">✕</button>`:''}</span>`).join('')}
          <input class="f-add-inp" placeholder="+ 필드 추가" id="cfi" onkeydown="if(event.key==='Enter')addCF()">
          <button class="btn btn-ghost btn-xs" onclick="addCF()">추가</button>
        </div>
      </div>
    </div></div>
    <div class="footer-bar">
      <div class="fi">${STATE.selectedTpl ? `선택: <strong>${STATE.selectedTpl==='custom'?'커스텀':TEMPLATES.find(t=>t.id===STATE.selectedTpl)?.name||''}</strong>` : '<span style="color:#FF9500">양식을 선택하세요</span>'}</div>
      <button class="btn btn-primary btn-sm" onclick="if(!STATE.selectedTpl){toast('양식 선택 필요','t-warn');return;}goStep(2)">파일 업로드 →</button>
    </div>
  </div>`;
}
function selectTpl(id) {
  STATE.selectedTpl = id;
  toast(`양식: ${id==='custom'?'커스텀':TEMPLATES.find(t=>t.id===id)?.name||id}`, 't-info', 1500);
  renderStep1();
}
function addCF() {
  const i = document.getElementById('cfi');
  const v = i?.value.trim(); if(!v) return;
  STATE.customFields.push({id:'fc'+Date.now(),label:v,req:false,type:'text'});
  i.value=''; renderStep1();
}
function delCF(id) { STATE.customFields=STATE.customFields.filter(f=>f.id!==id); renderStep1(); }

// ════════════════════════════════
//  ■ STEP 2: Upload
// ════════════════════════════════
function renderStep2() {
  if(STATE.currentNodeMode==='group') renderBulkUpload();
  else renderSingleUpload();
}

function renderBulkUpload() {
  const path = getPath(STATE.currentNode);
  const types  = [...new Set(STATE.bulkFiles.map(f=>f.type))];
  const wCnt   = STATE.bulkFiles.filter(f=>f.status==='warn'||!f.round||!f.set).length;
  const total  = STATE.bulkFiles.length;

  document.getElementById('contentPanel').innerHTML=`
  <div style="display:flex;flex-direction:column;height:100%;overflow:hidden">
    <div class="path-hd">
      <div class="bc"><span class="cur">${path}</span></div>
      <span class="mode-badge mb-bulk"> 일괄 등록</span>
      <button class="btn btn-ghost btn-sm" onclick="goStep(1)">← 템플릿</button>
    </div>
    <div class="tab-body" style="overflow-y:auto"><div class="bpad">
      <div class="upload-zone" id="bulkDropZone"
        ondragenter="this.classList.add('drag-active');event.preventDefault()"
        ondragover="event.preventDefault()"
        ondragleave="this.classList.remove('drag-active')"
        ondrop="this.classList.remove('drag-active');event.preventDefault();simulateBulkParse()">
        <div class="upload-zone-inner">
          <div class="uz-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg></div>
          <div class="uz-title">폴더 또는 파일 전체를 드롭하세요</div>
          <div class="uz-sub">파일명 규칙(유형_세트_순서)으로 자동 분류됩니다<br>mp3, pdf, mp4 지원</div>
          <div class="uz-btn" onclick="simulateBulkParse()">파일 선택하기</div>
        </div>
      </div>
      ${wCnt ? `<div class="notice notice-yellow">${wCnt}개 파일의 파일명이 인식되지 않았습니다.</div>` : ''}
      ${total>0 ? `<div class="notice notice-green">✓ ${total}개 파일이 파싱되었습니다.</div>` : ''}
      ${types.map(t=>{
        const tFiles=STATE.bulkFiles.filter(f=>f.type===t);
        const filledRounds=tFiles.filter(f=>f.round).map(f=>f.round);
        const meta=CONTENT_TYPE_META[t]||{};
        return `
        <div style="margin-bottom:10px">
          <div style="font-size:11px;font-weight:600;color:#48484A;margin-bottom:6px"> ${meta.label||t} 파일</div>
          <div class="round-slots">
            <span class="rs-label">순서 현황</span>
            ${ROUNDS.map(r=>`<div class="rs-slot${filledRounds.includes(r)?' filled':' empty'}">${r}</div>`).join('')}
          </div>
        </div>
        ${buildBulkFileTable(tFiles)}`;
      }).join('')}
    </div></div>
    <div class="upload-prog-bar"><div class="upload-prog-fill" id="progFill"></div></div>
    <div class="footer-bar">
      <div class="fi"><span>총 <strong>${total}개</strong></span>${wCnt?`<span style="color:#FF9500">${wCnt}개 확인필요</span>`:'<span style="color:#34C759">✓ 모두 정상</span>'}</div>
      <div style="display:flex;gap:7px">
        <button class="btn btn-ghost btn-sm" onclick="goStep(1)">← 이전</button>
        <button class="btn btn-primary btn-sm" onclick="goStep(3)">메타 정보 입력 →</button>
      </div>
    </div>
  </div>`;
}

function buildBulkFileTable(files) {
  if(!files.length) return `<div style="text-align:center;padding:14px;color:#AEAEB2;font-size:11px">파일 없음</div>`;
  const rows = files.map(f => {
    const hasIssue = !f.round || !f.set;
    const meta = CONTENT_TYPE_META[f.type]||{};
    const color = hasIssue?'#FF9500':f.status==='ok'?'#34C759':'#AEAEB2';
    return `<tr class="${hasIssue?'row-warn':''}">
      <td><div class="ft-order" style="background:${color}">${f.round||'?'}</div></td>
      <td><div class="ft-name">${meta.icon||''} ${f.name}</div><div class="ft-size">${f.size}</div></td>
      <td><select class="ft-sel${!f.set?' empty':''}" onchange="setBulkProp(${f.id},'set',this.value)">
        <option value="">세트 선택</option>
        ${SETS.map(s=>`<option${f.set===s?' selected':''}>${s}</option>`).join('')}
      </select></td>
      <td><select class="ft-sel${!f.round?' empty':''}" onchange="setBulkProp(${f.id},'round',this.value)">
        <option value="">순서 선택</option>
        ${ROUNDS.map(r=>`<option${f.round===r?' selected':''}>${r}번</option>`).join('')}
      </select></td>
      <td><div class="ft-status ${hasIssue?'warn':'ok'}"><span>${hasIssue?'! 확인필요':'✓ 준비'}</span></div></td>
      <td><button class="ft-del" onclick="deleteBulkFile(${f.id})">✕</button></td>
    </tr>`;
  }).join('');
  const meta = CONTENT_TYPE_META[files[0].type]||{};
  return `<div class="file-parse-result">
    <div class="fpr-hd">
      <div style="font-size:14px">${meta.icon||''}</div>
      <div class="fpr-title">${meta.label||files[0].type} 파일</div>
      <span class="fpr-badge ${files.some(f=>!f.round||!f.set)?'fpr-warn':'fpr-ok'}">${files.length}개</span>
    </div>
    <table class="file-table">
      <thead><tr><th>#</th><th>파일명</th><th>세트</th><th>순서</th><th>상태</th><th></th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

function renderSingleUpload() {
  const node = getNode(STATE.currentNode);
  const typeKey = node?.contentType || 'song';
  const meta = CONTENT_TYPE_META[typeKey]||{};
  const path = getPath(STATE.currentNode);
  const files = STATE.singleFiles[typeKey] || [];
  const wCnt = files.filter(f=>!f.round).length;
  const filledRounds = files.filter(f=>f.round).map(f=>f.round);

  document.getElementById('contentPanel').innerHTML=`
  <div style="display:flex;flex-direction:column;height:100%;overflow:hidden">
    <div class="path-hd">
      <div class="bc"><span class="cur">${path}</span></div>
      <span class="mode-badge mb-leaf">개별 등록</span>
      <button class="btn btn-ghost btn-sm" onclick="goStep(1)">← 템플릿</button>
    </div>
    <div class="tab-body" style="overflow-y:auto"><div class="bpad">
      <div class="upload-zone" id="singleDropZone"
        ondragenter="this.classList.add('drag-active');event.preventDefault()"
        ondragover="event.preventDefault()"
        ondragleave="this.classList.remove('drag-active')"
        ondrop="this.classList.remove('drag-active');event.preventDefault();addSingleDemo('${typeKey}')">
        <div class="upload-zone-inner">
          <div class="uz-icon" style="width:40px;height:40px">${meta.icon||''}</div>
          <div class="uz-title">${node?.label||''} 파일을 드래그하거나 클릭하세요</div>
          <div class="uz-sub">${(meta.ext||'파일')} 형식 지원</div>
          <div class="uz-btn" onclick="addSingleDemo('${typeKey}')">파일 선택하기</div>
        </div>
      </div>
      ${files.length>0?`<div class="notice notice-green">✓ ${files.length}개 파일 업로드됨</div>`:''}
      ${wCnt?`<div class="notice notice-yellow">${wCnt}개 파일의 순서가 미지정입니다.</div>`:''}
      <div class="round-slots">
        <span class="rs-label">순서 현황</span>
        ${ROUNDS.map(r=>`<div class="rs-slot${filledRounds.includes(r)?' filled':' empty'}">${r}</div>`).join('')}
      </div>
      ${buildSingleFileTable(typeKey, files)}
    </div></div>
    <div class="upload-prog-bar"><div class="upload-prog-fill" id="progFill"></div></div>
    <div class="footer-bar">
      <div class="fi"><span>총 <strong>${files.length}개</strong></span>${wCnt?`<span style="color:#FF9500">${wCnt}개</span>`:'<span style="color:#34C759">✓ 정상</span>'}</div>
      <div style="display:flex;gap:7px">
        <button class="btn btn-ghost btn-sm" onclick="goStep(1)">← 이전</button>
        <button class="btn btn-primary btn-sm" onclick="goStep(3)">메타 정보 입력 →</button>
      </div>
    </div>
  </div>`;
}

function buildSingleFileTable(typeKey, files) {
  if(!files.length) return `<div style="text-align:center;padding:24px;color:#AEAEB2;font-size:12px">위 드롭존에 파일을 업로드하세요.</div>`;
  const meta = CONTENT_TYPE_META[typeKey]||{};
  const rows = files.map(f => {
    const hasIssue = !f.round;
    const color = hasIssue?'#FF9500':'#34C759';
    return `<tr class="${hasIssue?'row-warn':''}">
      <td><div class="ft-order" style="background:${color}">${f.round||'?'}</div></td>
      <td><div class="ft-name">${meta.icon||''} ${f.name}</div><div class="ft-size">${f.title||''} ${f.size}</div></td>
      <td><select class="ft-sel${!f.round?' empty':''}" onchange="setSingleProp(${f.id},'${typeKey}','round',this.value)">
        <option value="">순서 선택</option>
        ${ROUNDS.map(r=>`<option${f.round===r?' selected':''}>${r}번</option>`).join('')}
      </select></td>
      <td><div class="ft-status ${hasIssue?'warn':'ok'}"><span>${hasIssue?'! 확인필요':'✓ 준비'}</span></div></td>
      <td><button class="ft-del" onclick="deleteSingleFile(${f.id},'${typeKey}')">✕</button></td>
    </tr>`;
  }).join('');
  return `<div class="file-parse-result">
    <div class="fpr-hd">
      <div class="fpr-title">${meta.icon||''} 업로드된 파일</div>
      <span class="fpr-badge ${files.some(f=>!f.round)?'fpr-warn':'fpr-ok'}">${files.length}개</span>
    </div>
    <table class="file-table">
      <thead><tr><th>#</th><th>파일명</th><th>순서</th><th>상태</th><th></th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

function setBulkProp(id, key, val) {
  const f = STATE.bulkFiles.find(x=>x.id===id);
  if(f) { f[key]=val; f.status=(f.round&&f.set)?'ok':'warn'; renderBulkUpload(); }
}
function setSingleProp(id, typeKey, key, val) {
  const f = (STATE.singleFiles[typeKey]||[]).find(x=>x.id===id);
  if(f) { f[key]=val; renderSingleUpload(); }
}
function deleteBulkFile(id) {
  STATE.bulkFiles = STATE.bulkFiles.filter(x=>x.id!==id);
  toast('파일 제거됨', 't-warn', 1400); renderBulkUpload();
}
function deleteSingleFile(id, typeKey) {
  STATE.singleFiles[typeKey] = (STATE.singleFiles[typeKey]||[]).filter(x=>x.id!==id);
  toast('파일 제거됨', 't-warn', 1400); renderSingleUpload();
}
function simulateBulkParse() {
  const zone = document.getElementById('bulkDropZone');
  if(!zone) return;
  zone.innerHTML = `<div class="uz-parsing"><svg class="uz-parse-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg><span class="uz-parse-text">파일 분석 중…</span></div>`;
  setTimeout(() => {
    STATE.bulkFiles.push({id:STATE.nextFid++,type:'note',name:`note_0${STATE.nextFid}.pdf`,size:'1.4MB',set:'1세트',round:String(STATE.bulkFiles.filter(f=>f.type==='note').length+1),status:'ok'});
    toast('1개 파일 추가됨', 't-ok', 1600);
    renderBulkUpload();
  }, 800);
}
function addSingleDemo(typeKey) {
  if(!STATE.singleFiles[typeKey]) STATE.singleFiles[typeKey]=[];
  const l = STATE.singleFiles[typeKey];
  const n = l.length+1;
  const ext = (CONTENT_TYPE_META[typeKey]||{}).ext||'bin';
  l.push({id:STATE.nextFid++,order:n,name:`file_${typeKey}_0${n}.${ext}`,size:`${(Math.random()*3+1).toFixed(1)}MB`,round:String(n),title:'',meta:{f1:'',f2:'',f3:'',f4:''}});
  toast('파일 추가됨', 't-ok', 1500);
  renderSingleUpload();
}

// ════════════════════════════════
//  ■ STEP 3: Meta
// ════════════════════════════════
function getActiveFields() {
  return STATE.selectedTpl==='custom'
    ? STATE.customFields
    : TEMPLATES.find(t=>t.id===STATE.selectedTpl)?.fields || STATE.customFields;
}
function getActiveFiles() {
  const node = getNode(STATE.currentNode);
  if(STATE.currentNodeMode==='group') return STATE.bulkFiles;
  const typeKey = node?.contentType || STATE.currentNode;
  return STATE.singleFiles[typeKey] || [];
}

function renderStep3() {
  const fields=getActiveFields(), files=getActiveFiles();
  const filled = files.filter(f=>f.meta&&f.meta[fields[0]?.id]).length;
  const tplName = STATE.selectedTpl==='custom'?'커스텀':TEMPLATES.find(t=>t.id===STATE.selectedTpl)?.name||'';
  const path = getPath(STATE.currentNode);
  const gridCols = `24px 170px ${fields.map(()=>'1fr').join(' ')} 60px 36px`;

  const headerCells = ['#','파일', ...fields.map(f=>`${f.label}${f.req?' *':''}`), '상태',''].map(c=>`<div class="mt-hd-cell">${c}</div>`).join('');
  const dataRows = files.map((f,i)=>{
    if(!f.meta) f.meta={};
    const done = f.meta[fields[0]?.id];
    const order = f.order||f.round||i+1;
    const cells = [
      `<div class="mt-cell"><div class="ft-order" style="background:${done?'#34C759':'#FF9500'};width:22px;height:22px;font-size:9px">${order}</div></div>`,
      `<div class="mt-cell" style="flex-direction:column;align-items:flex-start"><div class="ft-name" style="font-size:11px">${f.name}</div><div class="ft-size">${f.title||''} ${f.size}</div></div>`,
      ...fields.map(fd=>`<div class="mt-cell">${
        fd.type==='textarea' ? `<textarea class="meta-ta" rows="2" placeholder="${fd.label}">${f.meta[fd.id]||''}</textarea>`
        :fd.type==='select'  ? `<select class="meta-sel"><option value="">선택</option>${(fd.opts||[]).map(o=>`<option${f.meta[fd.id]===o?' selected':''}>${o}</option>`).join('')}</select>`
        : `<input class="meta-inp" value="${f.meta[fd.id]||''}" placeholder="${fd.label}">`
      }</div>`),
      `<div class="mt-cell"><span class="status-pill ${done?'sp-ok':'sp-warn'}">${done?'완료':'미입력'}</span></div>`,
      `<div class="mt-cell"><button class="detail-btn" onclick="openDetail(${i})">⋯</button></div>`,
    ].join('');
    return `<div class="mt-data-row${done?'':' unfilled'}" style="grid-template-columns:${gridCols}">${cells}</div>`;
  }).join('');

  document.getElementById('contentPanel').innerHTML=`
  <div style="display:flex;flex-direction:column;height:100%;overflow:hidden">
    <div class="path-hd">
      <div class="bc"><span class="cur">${path}</span></div>
      <span style="font-size:10px;background:#F9F0FF;color:#8944AB;padding:2px 9px;border-radius:10px;font-weight:700"> ${tplName}</span>
      <button class="btn btn-ghost btn-sm" onclick="goStep(2)">← 업로드</button>
      <button class="btn btn-green btn-sm" onclick="saveAllMeta()">✓ 전체 저장</button>
    </div>
    <div class="stabs">
      <div class="stab on" onclick="switchSubTab(this,'m-grid')">일괄 입력</div>
      <div class="stab" onclick="switchSubTab(this,'m-excel')">엑셀 업로드</div>
    </div>
    <div id="m-grid" class="tab-body" style="overflow-y:auto"><div class="bpad">
      <div class="done-banner">
        <span style="width:24px;height:24px;background:#F0FFF4;border-radius:50%;display:inline-flex;align-items:center;justify-content:center"><svg viewBox="0 0 24 24" fill="none" stroke="#34C759" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="12" height="12"><polyline points="20 6 9 17 4 12"/></svg></span>
        <div><div style="font-size:12px;font-weight:600;color:#1B8A3E">업로드 완료 — ${files.length}개 파일</div>
        <div style="font-size:11px;color:#1B8A3E;margin-top:2px">메타 정보 ${filled}/${files.length} 입력됨</div></div>
      </div>
      <div class="notice notice-blue">셀 클릭으로 직접 편집하거나 ⋯ 버튼으로 상세 입력합니다.</div>
      <div class="meta-table">
        <div class="mt-hd-row" style="grid-template-columns:${gridCols}">${headerCells}</div>
        ${dataRows||`<div style="padding:20px;text-align:center;color:#AEAEB2;font-size:12px">업로드된 파일이 없습니다</div>`}
      </div>
    </div></div>
    <div id="m-excel" class="tab-body" style="display:none"><div class="bpad">
      <div style="border:2px dashed #A8E6B8;border-radius:var(--radius-lg);background:var(--c-green-l);padding:28px;text-align:center;cursor:pointer">
        <div style="width:44px;height:44px;background:var(--c-gray-100);border-radius:12px;display:flex;align-items:center;justify-content:center;margin:0 auto 10px"><svg viewBox="0 0 24 24" fill="none" stroke="var(--c-gray-400)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" width="22" height="22"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></div>
        <div style="font-size:13px;font-weight:600;color:#34C759;margin-bottom:4px">엑셀 파일로 메타 일괄 입력</div>
        <button class="btn btn-green btn-sm" style="margin-top:10px" onclick="toast('템플릿 다운로드 준비중','t-info')">⬇ 템플릿 다운로드</button>
      </div>
    </div></div>
    <div class="upload-prog-bar"><div class="upload-prog-fill" id="progFill"></div></div>
    <div class="footer-bar">
      <div class="fi"><span>총 <strong>${files.length}개</strong></span><span>완료 <strong style="color:#34C759">${filled}</strong></span><span>미입력 <strong style="color:#FF9500">${files.length-filled}</strong></span></div>
      <div style="display:flex;gap:7px">
        <button class="btn btn-ghost btn-sm" onclick="goStep(2)">← 이전</button>
        <button class="btn btn-primary btn-sm" onclick="goStep(4)">검토·게시 →</button>
      </div>
    </div>
  </div>`;
}

function switchSubTab(el, id) {
  el.parentElement.querySelectorAll('.stab').forEach(t=>t.classList.remove('on'));
  el.classList.add('on');
  document.querySelectorAll('#m-grid,#m-excel').forEach(t=>t.style.display='none');
  const t = document.getElementById(id); if(t) t.style.display='block';
}
function saveAllMeta() {
  const fill = document.getElementById('progFill'); if(!fill) return;
  let p=0; const iv=setInterval(()=>{p+=8;fill.style.width=p+'%';if(p>=100){clearInterval(iv);toast('전체 저장 완료 ','t-ok');}},35);
}

// ── Detail Panel ──
function openDetail(idx) {
  STATE.dpIdx = idx; renderDP();
  document.getElementById('overlay').style.display='block';
  setTimeout(()=>document.getElementById('detailPanel').classList.add('open'),10);
}
function closeDetail() {
  document.getElementById('detailPanel').classList.remove('open');
  setTimeout(()=>document.getElementById('overlay').style.display='none', 250);
}
function navDp(d) {
  const files = getActiveFiles();
  STATE.dpIdx = Math.max(0, Math.min(files.length-1, STATE.dpIdx+d));
  renderDP();
}
function renderDP() {
  const files=getActiveFiles(), fields=getActiveFields(), f=files[STATE.dpIdx];
  if(!f) return;
  if(!f.meta) f.meta={};
  document.getElementById('dpTitle').textContent   = `${f.order||STATE.dpIdx+1}번 · ${f.title||f.name}`;
  document.getElementById('dpIdx').textContent     = `${STATE.dpIdx+1}/${files.length}`;
  document.getElementById('dpPath').textContent    = getPath(STATE.currentNode);
  document.getElementById('dpBody').innerHTML = `
    <div class="dp-file-card">
      <span style="font-size:22px">${getNodeIcon(getNode(STATE.currentNode))}</span>
      <div><div style="font-size:12px;font-weight:700">${f.name}</div><div style="font-size:10px;color:#AEAEB2;margin-top:2px">${f.size}</div></div>
    </div>
    ${fields.map(fd=>`<div class="dp-field">
      <div class="dp-lbl">${fd.label} ${fd.req?'<span class="req-tag">필수</span>':''}</div>
      ${fd.type==='textarea' ? `<textarea class="dp-ta" id="dp-${fd.id}" rows="3">${f.meta[fd.id]||''}</textarea>`
        :fd.type==='select' ? `<select class="dp-inp" id="dp-${fd.id}"><option value="">선택</option>${(fd.opts||[]).map(o=>`<option${f.meta[fd.id]===o?' selected':''}>${o}</option>`).join('')}</select>`
        : `<input class="dp-inp" id="dp-${fd.id}" value="${f.meta[fd.id]||''}" placeholder="${fd.label} 입력">`}
    </div>`).join('')}`;
}
function saveDp() {
  const files=getActiveFiles(), fields=getActiveFields(), f=files[STATE.dpIdx];
  if(!f) return;
  if(!f.meta) f.meta={};
  fields.forEach(fd=>{ const el=document.getElementById('dp-'+fd.id); if(el) f.meta[fd.id]=el.value; });
  toast('저장됨','t-ok',1400);
  if(STATE.dpIdx < files.length-1) navDp(1);
  else closeDetail();
  renderStep3();
}

// ════════════════════════════════
//  ■ STEP 4: Review & Publish
// ════════════════════════════════
function renderStep4() {
  if(STATE.publishDone) { renderPublishDone(); return; }
  const files=getActiveFiles(), fields=getActiveFields();
  const filled = files.filter(f=>f.meta&&f.meta[fields[0]?.id]).length;
  const warnF  = STATE.bulkFiles.filter(f=>!f.round||!f.set);
  const reqMissing = files.filter(f=>fields.filter(fd=>fd.req).some(fd=>!f.meta?.[fd.id]));
  const tplName = STATE.selectedTpl==='custom'?'커스텀':TEMPLATES.find(t=>t.id===STATE.selectedTpl)?.name||'';
  const total = files.length;
  const checks = [
    {pass:!!STATE.currentNode, label:'분류 선택', detail:STATE.currentNode?getPath(STATE.currentNode):'미선택', step:1},
    {pass:!!STATE.selectedTpl, label:'템플릿 선택', detail:STATE.selectedTpl?`${tplName}`:'미선택', step:1},
    {pass:total>0, label:'파일 업로드', detail:total>0?`${total}개`:'없음', step:2},
    {pass:warnF.length===0, label:'파일 인식 오류 없음', detail:warnF.length===0?'정상':`${warnF.length}개 오류`, step:2},
    {pass:filled===total&&total>0, label:'메타 정보 입력', detail:`${filled}/${total}개`, step:3},
  ];
  const allPass = checks.every(c=>c.pass);

  document.getElementById('contentPanel').innerHTML=`
  <div style="display:flex;flex-direction:column;height:100%;overflow:hidden">
    <div class="path-hd">
      <div class="bc"><span class="cur">검토 · 게시</span></div>
      <button class="btn btn-ghost btn-sm" onclick="goStep(3)">← 메타 수정</button>
    </div>
    <div class="tab-body" style="overflow-y:auto"><div class="bpad">
      <div class="s4-summary-grid">
        <div class="s4-card${total>0?' ok':''}"><div class="s4-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg></div><div class="s4-num" style="color:#0071E3">${total}</div><div class="s4-lbl">총 파일</div></div>
        <div class="s4-card${filled===total&&total>0?' ok':' warn'}"><div class="s4-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg></div><div class="s4-num" style="color:${filled===total&&total>0?'#34C759':'#FF9500'}">${filled}</div><div class="s4-lbl">메타 완료</div></div>
        <div class="s4-card${warnF.length===0?' ok':' warn'}"><div class="s4-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div><div class="s4-num" style="color:${warnF.length===0?'#34C759':'#FF9500'}">${warnF.length}</div><div class="s4-lbl">경고 항목</div></div>
        <div class="s4-card${allPass?' ok':' err'}"><div class="s4-ico">${allPass?'✓':'✕'}</div><div class="s4-num" style="color:${allPass?'#34C759':'#FF3B30'};font-size:18px">${allPass?'가능':'미완료'}</div><div class="s4-lbl">게시 상태</div></div>
      </div>
      <div class="checklist">
        <div class="cl-hd">${allPass?'<span style="color:#34C759">●</span>':'<span style="color:#FF9500">!</span>'} 게시 전 체크리스트
          <span style="font-size:10px;color:#AEAEB2;font-weight:400;margin-left:auto">${checks.filter(c=>c.pass).length}/${checks.length} 통과</span>
        </div>
        ${checks.map(c=>`<div class="cl-item">
          <span class="cl-ico">${c.pass?'✓':'✗'}</span>
          <span class="cl-main" style="color:${c.pass?'#48484A':'#FF3B30'}"><strong>${c.label}</strong> — ${c.detail}</span>
          ${!c.pass?`<span class="cl-action" onclick="goStep(${c.step})">수정하기</span>`:''}
        </div>`).join('')}
      </div>
      <div class="pub-box">
        <h3>${allPass?'게시 준비 완료':'미완료 항목이 있습니다'}</h3>
        <p>${allPass?`${tplName} 템플릿 · ${total}개 파일을 게시합니다.`:'위 체크리스트의 항목을 먼저 해결해 주세요.'}</p>
        <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
          <button class="btn btn-ghost btn-sm" onclick="goStep(3)">← 메타 수정</button>
          ${!allPass?`<button class="btn btn-ghost btn-sm" style="color:#FF9500;border-color:#FFD9A8" onclick="confirmPublish(true)">강제 게시</button>`:''}
          <button class="btn btn-green btn-sm" onclick="confirmPublish(false)"${!allPass?' disabled':''}>${allPass?'✓ 게시하기':'게시 불가'}</button>
        </div>
      </div>
    </div></div>
    <div class="footer-bar">
      <div class="fi"><span>파일 <strong>${total}개</strong></span><span>메타 <strong style="color:${filled===total&&total>0?'#34C759':'#FF9500'}">${filled}/${total}</strong></span></div>
      <button class="btn btn-green btn-sm" onclick="confirmPublish(false)"${!allPass?' disabled':''}>✓ 게시하기</button>
    </div>
  </div>`;
}
function confirmPublish(force) {
  const files = getActiveFiles();
  showConfirm('게시 확인',`${force?'미완료 항목이 있습니다. ':''}${files.length}개 파일을 게시할까요?`,
    () => {
      let p=0;
      const getBar = () => document.getElementById('progFill');
      const iv = setInterval(()=>{
        p+=5; const b=getBar(); if(b) b.style.width=p+'%';
        if(p>=100){ clearInterval(iv); setTimeout(()=>{ STATE.publishDone=true; renderPublishDone(); },200); }
      },30);
    }, '게시', 'btn-green');
}
function renderPublishDone() {
  const files=getActiveFiles();
  const tplName = STATE.selectedTpl==='custom'?'커스텀':TEMPLATES.find(t=>t.id===STATE.selectedTpl)?.name||'';
  const node=getNode(STATE.currentNode);
  if(node&&node.type==='leaf') {
    STATE.contentStatus[STATE.currentNode]={uploaded:files.length,total:files.length,metaDone:files.length,warnCount:0,status:'done',lastEdit:'방금 전'};
  }
  document.getElementById('contentPanel').innerHTML=`
  <div style="flex:1;overflow-y:auto">
    <div class="done-wrap">
      <div class="done-emoji"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/><circle cx="12" cy="12" r="3" fill="#FFD9A8" stroke="none"/></svg></div>
      <div style="font-size:22px;font-weight:900">게시 완료!</div>
      <div style="font-size:12px;color:#8E8E93;line-height:1.9">
        <strong>${getPath(STATE.currentNode)}</strong><br>
        ${tplName} 템플릿 · ${files.length}개 파일이 서비스에 반영되었습니다.
      </div>
      <div style="display:flex;gap:9px;margin-top:6px;flex-wrap:wrap;justify-content:center">
        <button class="btn btn-ghost btn-sm" onclick="STATE.publishDone=false;renderStep4()">← 검토 화면</button>
        <button class="btn btn-ghost btn-sm" onclick="_goNextUrgentNode()">다음 슬롯 →</button>
        <button class="btn btn-primary btn-sm" onclick="backToDash()">현황으로 ↩</button>
      </div>
    </div>
  </div>`;
  refreshCTBody();
  toast('게시 완료!', 't-ok', 3000);
}


// ════════════════════════════════
//  ■ REVIEW CARD (검수 탭)
// ════════════════════════════════
function buildReviewCard(leaf) {
  const st   = getSt(leaf.id);
  const cfg  = stCfg(st.status);
  const ct   = getCTMeta(leaf);
  const path = getPath(leaf.id);
  const subj = getRootSubject(leaf.id);

  const isReview   = st.status === 'review';
  const isReviewed = st.status === 'reviewed';

  const accentColor = isReviewed ? '#10B981' : '#AF52DE';

  return `
  <div class="review-card">
    <div class="rc-accent" style="background:${accentColor}"></div>
    <div class="rc-body">
      <div class="rc-top">
        <div class="rc-icon" style="background:${ct.bg}">${ct.icon}</div>
        <div class="rc-info">
          <div class="rc-title">${leaf.label}</div>
          <div class="rc-path">${path}</div>
        </div>
        <span class="rc-status-badge" style="background:${cfg.bg};color:${cfg.dot};border:1px solid ${cfg.border}">${cfg.label}</span>
      </div>
      <div class="rc-meta-row">
        <span class="rc-meta-pill">${subj?.label||'—'}</span>
        <span class="rc-meta-pill">${ct.icon} ${ct.label}</span>
        <span class="rc-meta-pill">${st.uploaded||0}개 파일</span>
        ${st.reviewer ? `<span class="rc-meta-pill" style="background:#F9F0FF;color:#AF52DE"> ${st.reviewer}</span>` : ''}
      </div>
      <div class="rc-timeline">
        ${st.requestedAt ? `<div class="rc-tl-row"><span class="rc-tl-dot" style="background:#AF52DE"></span>검수 요청됨 · ${st.requestedBy||'작업자'}<span class="rc-tl-time">${st.requestedAt}</span></div>` : ''}
        ${st.reviewedAt  ? `<div class="rc-tl-row"><span class="rc-tl-dot" style="background:#10B981"></span>검수 완료됨 · ${st.reviewer||'검수자'}<span class="rc-tl-time">${st.reviewedAt}</span></div>` : ''}
      </div>
      ${st.reviewNote ? `<div class="rc-note-box"><div class="rc-note-label">검수 메모</div>${st.reviewNote}</div>` : ''}
      <div class="rc-actions">
        <button class="btn btn-ghost btn-xs" onclick="ctSelectNode('${leaf.id}','leaf')">파일 보기</button>
        ${isReview   ? `<button class="btn-approve" onclick="openApproveModal('${leaf.id}')">검수 완료</button>` : ''}
        ${isReviewed ? `<button class="btn-go-live" onclick="openLiveModal('${leaf.id}')">서비스 적용</button>` : ''}
      </div>
    </div>
  </div>`;
}

// ════════════════════════════════
//  ■ LIVE CARD (서비스 중 탭)
// ════════════════════════════════
function buildLiveCard(leaf) {
  const st   = getSt(leaf.id);
  const ct   = getCTMeta(leaf);
  const path = getPath(leaf.id);
  const subj = getRootSubject(leaf.id);

  return `
  <div class="live-card">
    <div class="lc-accent"></div>
    <div class="lc-body">
      <div class="lc-top">
        <div class="rc-icon" style="background:${ct.bg};border-radius:10px;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">${ct.icon}</div>
        <div class="rc-info" style="flex:1;min-width:0">
          <div class="rc-title">${leaf.label}</div>
          <div class="rc-path">${path}</div>
        </div>
        <span class="lc-badge">LIVE</span>
      </div>
      <div class="lc-stats">
        <div class="lc-stat"><div class="lc-stat-num">${st.uploaded||0}</div><div class="lc-stat-label">파일</div></div>
        <div class="lc-stat"><div class="lc-stat-num">${st.metaDone||0}</div><div class="lc-stat-label">메타완료</div></div>
        <div class="lc-stat"><div class="lc-stat-num">${st.liveAt||'—'}</div><div class="lc-stat-label">서비스 적용일</div></div>
      </div>
      ${st.reviewedAt ? `<div class="rc-timeline"><div class="rc-tl-row"><span class="rc-tl-dot" style="background:#10B981"></span>검수완료 · ${st.reviewer||'—'}<span class="rc-tl-time">${st.reviewedAt}</span></div>${st.liveAt?`<div class="rc-tl-row"><span class="rc-tl-dot" style="background:#1B8A3E"></span>서비스 적용됨<span class="rc-tl-time">${st.liveAt}</span></div>`:''}</div>` : ''}
      <div class="lc-actions">
        <button class="btn-live-off" onclick="confirmTakeOffline('${leaf.id}')">서비스 중단</button>
        <button class="btn-revise"   onclick="reviseContent('${leaf.id}')">수정 재등록</button>
      </div>
    </div>
  </div>`;
}

// ════════════════════════════════
//  ■ STATUS TRANSITION ACTIONS
// ════════════════════════════════

// 검수 요청 모달
const REVIEWERS = [
  {name:'김검수',team:'QA팀',color:'#6366F1'},
  {name:'이리뷰',team:'교육검수팀',color:'#34C759'},
  {name:'박확인',team:'콘텐츠팀',color:'#FF9500'},
];
let _reviewTargetId  = null;
let _reviewerSel     = null;
let _approveTargetId = null;
let _liveTargetId    = null;
let _approveChecks   = [];

function openReviewModal(id) {
  _reviewTargetId = id;
  _reviewerSel    = null;
  const node = getNode(id);
  const path = getPath(id);
  const div  = document.createElement('div');
  div.id = 'reviewModalBg';
  div.className = 'review-modal-bg';
  div.onclick = e => { if(e.target===div) closeReviewModal(); };
  div.innerHTML = `
  <div class="review-modal">
    <h4>검수 요청</h4>
    <div style="background:var(--c-gray-50);border-radius:var(--radius);padding:10px 12px;margin-bottom:14px;font-size:11px;color:var(--c-gray-700)">
      <div style="font-weight:600;margin-bottom:2px">${node?.label||id}</div>
      <div style="color:var(--c-gray-400)">${path}</div>
    </div>
    <div class="rv-field">
      <div class="rv-label">검수자 선택 *</div>
      <div class="rv-reviewer-list">
        ${REVIEWERS.map((r,i)=>`
        <div class="rv-reviewer-item" id="rvr${i}" onclick="selectReviewer(${i})">
          <div class="rv-reviewer-av" style="background:${r.color}">${r.name[0]}</div>
          <span style="font-size:12px;font-weight:600">${r.name}</span>
          <span style="font-size:10px;color:var(--c-gray-400)">${r.team}</span>
        </div>`).join('')}
      </div>
    </div>
    <div class="rv-field">
      <div class="rv-label">요청 메모 (선택)</div>
      <textarea class="rv-input rv-textarea" id="rvNote" placeholder="검수 포인트나 주의사항을 적어주세요..."></textarea>
    </div>
    <div class="rv-modal-btns">
      <button class="btn btn-ghost btn-sm" onclick="closeReviewModal()">취소</button>
      <button class="btn btn-sm btn-request-review" onclick="submitReviewRequest()">검수 요청 전송</button>
    </div>
  </div>`;
  document.body.appendChild(div);
}

function selectReviewer(idx) {
  _reviewerSel = idx;
  document.querySelectorAll('.rv-reviewer-item').forEach((el,i)=>el.classList.toggle('sel',i===idx));
}

function submitReviewRequest() {
  if(_reviewerSel === null) { toast('검수자를 선택하세요', 't-warn'); return; }
  const r    = REVIEWERS[_reviewerSel];
  const note = document.getElementById('rvNote')?.value.trim();
  const now  = new Date().toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'});
  STATE.contentStatus[_reviewTargetId] = {
    ...getSt(_reviewTargetId),
    status:'review',
    reviewer: r.name,
    reviewerTeam: r.team,
    requestedBy: '나',
    requestedAt: now,
    reviewNote: note||null,
    lastEdit: '방금 전',
  };
  closeReviewModal();
  toast(`${r.name}에게 검수 요청을 전송했습니다 ✉`, 't-ok', 2500);
  refreshCTBody();
  setDashTab('review');
}

function closeReviewModal() {
  const el = document.getElementById('reviewModalBg');
  if(el) el.remove();
}

// 검수 완료 모달
const APPROVE_CHECKS = [
  '파일 재생/열람 정상 확인',
  '메타 정보(제목·설명) 정확성 확인',
  '저작권·라이선스 이상 없음',
  '교육과정 기준 내용 적합성 확인',
  '파일 용량 및 화질 기준 충족',
];

function openApproveModal(id) {
  _approveTargetId = id;
  _approveChecks = new Array(APPROVE_CHECKS.length).fill(false);
  const node = getNode(id);
  const st   = getSt(id);
  const div  = document.createElement('div');
  div.id = 'approveModalBg';
  div.className = 'review-modal-bg';
  div.onclick = e => { if(e.target===div) closeApproveModal(); };
  div.innerHTML = `
  <div class="approve-modal">
    <h4>검수 완료 처리</h4>
    <div style="background:#F9F0FF;border-radius:var(--radius);padding:10px 12px;margin-bottom:14px;font-size:11px;color:#8944AB">
      <div style="font-weight:600;margin-bottom:2px">${node?.label||id}</div>
      ${st.reviewer ? `<div style="color:#AF52DE">검수자: ${st.reviewer} (${st.reviewerTeam||''})</div>` : ''}
    </div>
    <div style="font-size:11px;font-weight:600;color:var(--c-gray-600);margin-bottom:6px">검수 체크리스트</div>
    <div class="am-checklist">
      ${APPROVE_CHECKS.map((c,i)=>`
      <label class="am-check-row">
        <input type="checkbox" id="amc${i}" onchange="toggleApproveCheck(${i})">
        <span>${c}</span>
      </label>`).join('')}
    </div>
    <div class="rv-field">
      <div class="rv-label">검수 메모 (선택)</div>
      <textarea class="rv-input rv-textarea" id="amNote" placeholder="특이사항 또는 수정 내용을 기록하세요..."></textarea>
    </div>
    <div id="amWarn" style="font-size:11px;color:#FF9500;display:none;margin-bottom:8px">항목을 체크해야 완료 처리가 가능합니다</div>
    <div class="rv-modal-btns">
      <button class="btn btn-ghost btn-sm" onclick="closeApproveModal()">취소</button>
      <button class="btn btn-sm btn-approve" onclick="submitApproval()">검수 완료 처리</button>
    </div>
  </div>`;
  document.body.appendChild(div);
}

function toggleApproveCheck(idx) {
  _approveChecks[idx] = document.getElementById('amc'+idx)?.checked || false;
}

function submitApproval() {
  const allChecked = _approveChecks.every(v=>v);
  const warn = document.getElementById('amWarn');
  if(!allChecked) { if(warn) warn.style.display='block'; toast('모든 항목을 체크하세요', 't-warn'); return; }
  const note = document.getElementById('amNote')?.value.trim();
  const now  = new Date().toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'});
  const st   = getSt(_approveTargetId);
  STATE.contentStatus[_approveTargetId] = {
    ...st,
    status: 'reviewed',
    reviewedAt: now,
    reviewNote: note||st.reviewNote||null,
    lastEdit: '방금 전',
  };
  closeApproveModal();
  toast('검수 완료! 서비스 적용 대기 중', 't-ok', 3000);
  refreshCTBody();
  renderDashboard();
}

function closeApproveModal() {
  const el = document.getElementById('approveModalBg');
  if(el) el.remove();
}

// 서비스 적용 모달
function openLiveModal(id) {
  _liveTargetId = id;
  const node = getNode(id);
  const st   = getSt(id);
  const path = getPath(id);
  const now  = new Date().toLocaleDateString('ko-KR',{year:'numeric',month:'2-digit',day:'2-digit'});
  const div  = document.createElement('div');
  div.id = 'liveModalBg';
  div.className = 'review-modal-bg';
  div.onclick = e => { if(e.target===div) closeLiveModal(); };
  div.innerHTML = `
  <div class="live-modal">
    <h4>서비스 적용</h4>
    <div class="lm-preview">
      <div class="lm-preview-title">적용 예정 정보</div>
      <div class="lm-preview-row"><span>콘텐츠</span><strong>${node?.label||id}</strong></div>
      <div class="lm-preview-row"><span>경로</span><span>${path}</span></div>
      <div class="lm-preview-row"><span>파일 수</span><strong>${st.uploaded||0}개</strong></div>
      <div class="lm-preview-row"><span>검수 완료</span><strong>${st.reviewer||'—'} · ${st.reviewedAt||'—'}</strong></div>
      <div class="lm-preview-row"><span>적용 예정일</span><strong>${now}</strong></div>
    </div>
    <div style="background:#FFF8F0;border:1px solid #FFD9A8;border-radius:var(--radius);padding:10px 12px;margin-bottom:14px;font-size:11px;color:#B35C00">
      서비스 적용 후 실제 학습자에게 콘텐츠가 노출됩니다. 신중하게 확인 후 진행해 주세요.
    </div>
    <div class="rv-field">
      <div class="rv-label">적용 메모 (선택)</div>
      <textarea class="rv-input rv-textarea" id="lmNote" placeholder="버전 정보 또는 특이사항을 기록하세요..."></textarea>
    </div>
    <div class="rv-modal-btns">
      <button class="btn btn-ghost btn-sm" onclick="closeLiveModal()">취소</button>
      <button class="btn-go-live" onclick="submitGoLive()">서비스 적용 확정</button>
    </div>
  </div>`;
  document.body.appendChild(div);
}

function submitGoLive() {
  const note = document.getElementById('lmNote')?.value.trim();
  const now  = new Date().toLocaleDateString('ko-KR',{month:'2-digit',day:'2-digit'});
  const st   = getSt(_liveTargetId);
  STATE.contentStatus[_liveTargetId] = {
    ...st,
    status: 'live',
    liveAt: now,
    liveNote: note||null,
    lastEdit: '방금 전',
  };
  closeLiveModal();
  toast('서비스 적용 완료! 콘텐츠가 서비스에 반영되었습니다', 't-ok', 3500);
  refreshCTBody();
  setDashTab('live');
}

function closeLiveModal() {
  const el = document.getElementById('liveModalBg');
  if(el) el.remove();
}

// 서비스 중단
function confirmTakeOffline(id) {
  const node = getNode(id);
  showConfirm('서비스 중단',
    `"${node?.label||id}" 콘텐츠를 서비스에서 내리겠습니까?\n중단 후에는 학습자에게 노출되지 않습니다.`,
    ()=>{
      STATE.contentStatus[id] = {...getSt(id), status:'done', liveAt:null, lastEdit:'방금 전'};
      refreshCTBody();
      toast('서비스 중단됨. 작업 현황으로 이동되었습니다.', 't-warn', 2500);
      setDashTab('work');
    }, '서비스 중단', 'btn-primary');
}

// 수정 재등록
function reviseContent(id) {
  showConfirm('수정 재등록',
    `서비스 중인 콘텐츠를 수정하려면 새 파일로 재등록이 필요합니다.\n기존 콘텐츠는 유지되며 수정본이 검수를 통과하면 교체됩니다.`,
    ()=>{
      STATE.currentNode = id;
      STATE.currentNodeMode = 'leaf';
      STATE.currentStep = 1;
      STATE.selectedTpl = null;
      STATE.publishDone = false;
      STATE.flowMode = 'curriculum-first';
      STATE.dashTab = 'work';
      renderStepContainer();
    }, '수정 등록 시작', 'btn-primary');
}

// 일괄 검수 요청
function batchRequestReview() {
  const doneLeaves = STATE.treeNodes.filter(n=>{
    if(n.type!=='leaf' || getChildren(n.id).length) return false;
    return getSt(n.id).status === 'done';
  });
  if(!doneLeaves.length) return;
  showConfirm('일괄 검수 요청',
    `업로드 완료된 ${doneLeaves.length}건을 모두 검수 요청 상태로 변경하겠습니까?`,
    ()=>{
      const now = new Date().toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'});
      doneLeaves.forEach(l=>{
        STATE.contentStatus[l.id] = {...getSt(l.id), status:'review', requestedBy:'나', requestedAt:now, reviewer:'김검수', reviewerTeam:'QA팀', lastEdit:'방금 전'};
      });
      toast(`${doneLeaves.length}건 검수요청 전송됨 ✉`, 't-ok', 2500);
      refreshCTBody();
      setDashTab('review');
    }, `${doneLeaves.length}건 일괄 요청`, 'btn-request-review');
}

// 일괄 서비스 적용
function batchGoLive() {
  const reviewedLeaves = STATE.treeNodes.filter(n=>{
    if(n.type!=='leaf' || getChildren(n.id).length) return false;
    return getSt(n.id).status === 'reviewed';
  });
  if(!reviewedLeaves.length) return;
  showConfirm('일괄 서비스 적용',
    `검수 완료된 ${reviewedLeaves.length}건을 모두 서비스 적용하겠습니까?\n실제 학습자에게 노출됩니다.`,
    ()=>{
      const now = new Date().toLocaleDateString('ko-KR',{month:'2-digit',day:'2-digit'});
      reviewedLeaves.forEach(l=>{
        STATE.contentStatus[l.id] = {...getSt(l.id), status:'live', liveAt:now, lastEdit:'방금 전'};
      });
      toast(`${reviewedLeaves.length}건 서비스 적용 완료!`, 't-ok', 3000);
      refreshCTBody();
      setDashTab('live');
    }, `${reviewedLeaves.length}건 서비스 적용`, 'btn-go-live');
}

// ═══ renderDashboardView (원본 라인 6615~6772) ═══
function renderDashboardView() {
  const allLeaves = STATE.treeNodes.filter(n=>n.type==='leaf' && getChildren(n.id).length===0);
  const counts = {
    total:    allLeaves.length,
    work:     allLeaves.filter(l=>['urgent','idle','inprog'].includes(getSt(l.id).status)).length,
    done:     allLeaves.filter(l=>getSt(l.id).status==='done').length,
    review:   allLeaves.filter(l=>getSt(l.id).status==='review').length,
    reviewed: allLeaves.filter(l=>getSt(l.id).status==='reviewed').length,
    live:     allLeaves.filter(l=>getSt(l.id).status==='live').length,
    urgent:   allLeaves.filter(l=>getSt(l.id).status==='urgent').length,
  };

  // Update sidebar badges
  _updateAllBadges(counts);

  const subjects = getSubjects();
  const recentItems = allLeaves.slice(-8).reverse();

  document.getElementById('dashContent').innerHTML = `
  <!-- KPI Cards -->
  <div class="kpi-grid">
    <div class="kpi-card kc-total" onclick="switchView('course-list')">
      <div class="kpi-icon" style="background:var(--c-gray-100)"><svg viewBox="0 0 24 24" fill="none" stroke="var(--c-gray-500)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg></div>
      <div class="kpi-num" style="color:var(--c-gray-800)">${counts.total}</div>
      <div class="kpi-label">전체 콘텐츠</div>
      <div class="kpi-delta">${subjects.length}개 과목 · ${getChildren(null).length>0?getSubjects().length:subjects.length}개 과정</div>
    </div>
    <div class="kpi-card kc-work" onclick="switchToContent('work')">
      <div class="kpi-icon" style="background:#FFF8F0"><svg viewBox="0 0 24 24" fill="none" stroke="#FF9500" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg></div>
      <div class="kpi-num" style="color:#FF9500">${counts.work + counts.done}</div>
      <div class="kpi-label">작업 / 업로드 완료</div>
      ${counts.urgent>0 ? `<div class="kpi-delta down">⚠ 미등록 ${counts.urgent}건</div>` : `<div class="kpi-delta up">정상</div>`}
    </div>
    <div class="kpi-card kc-review" onclick="switchView('review')">
      <div class="kpi-icon" style="background:var(--c-purple-l)"><svg viewBox="0 0 24 24" fill="none" stroke="var(--c-purple)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg></div>
      <div class="kpi-num" style="color:#AF52DE">${counts.review}</div>
      <div class="kpi-label">검수 진행 중</div>
      <div class="kpi-delta" style="color:#AF52DE">검수 요청됨</div>
    </div>
    <div class="kpi-card kc-reviewed" onclick="switchView('deploy')">
      <div class="kpi-icon" style="background:#F0FFF4"><svg viewBox="0 0 24 24" fill="none" stroke="#34C759" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
      <div class="kpi-num" style="color:#34C759">${counts.reviewed}</div>
      <div class="kpi-label">배포 대기 (검수완료)</div>
      ${counts.reviewed>0 ? `<div class="kpi-delta up">배포 가능</div>` : `<div class="kpi-delta">대기 없음</div>`}
    </div>
    <div class="kpi-card kc-live" onclick="switchToContent('live')">
      <div class="kpi-icon" style="background:#F0FFF4"><svg viewBox="0 0 24 24" fill="none" stroke="#1B8A3E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49"/></svg></div>
      <div class="kpi-num" style="color:#1B8A3E">${counts.live}</div>
      <div class="kpi-label">서비스 중</div>
      <div class="kpi-delta up">정상 운영 중</div>
    </div>
  </div>

  <!-- ★ 작업 진행 현황 파이프라인 -->
  <div class="pipeline-section">
    <div class="pipeline-title" style="display:flex;align-items:center;gap:8px">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;flex-shrink:0"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
      작업 진행 현황
      <button class="btn btn-ghost btn-xs" onclick="switchView('workflow')" style="margin-left:auto">진행 보드 →</button>
    </div>
    <div class="pipeline-flow" style="gap:6px">
      ${_buildWfPipelineStages()}
    </div>
  </div>

  <!-- 2-col bottom -->
  <div class="dash-2col">
    <!-- Recent Activity -->
    <div class="activity-card">
      <div class="activity-hd">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;color:var(--c-gray-500)"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <span class="activity-hd-title">최근 활동</span>
        <button class="btn btn-ghost btn-xs" onclick="switchToContent('work')">전체 보기</button>
      </div>
      <div class="activity-list">
        ${recentItems.length > 0 ? recentItems.map(l => {
          const st = getSt(l.id);
          const cfg = stCfg(st.status);
          return `<div class="activity-row" onclick="switchToContent(${['review','reviewed'].includes(st.status)?'\'review\'':'\'work\''})">
            <div class="act-dot" style="background:${cfg.dot}"></div>
            <div class="act-content">
              <div class="act-title">${l.label}</div>
              <div class="act-meta">${getPath(l.id)} · <span style="color:${cfg.dot};font-weight:700">${cfg.label}</span></div>
            </div>
            <div class="act-time">${st.lastEdit||'—'}</div>
          </div>`;
        }).join('') : '<div style="padding:24px;text-align:center;color:var(--c-gray-400);font-size:12px">아직 활동이 없습니다</div>'}
      </div>
    </div>

    <!-- Quick Actions -->
    <div>
      <div class="quick-card" style="margin-bottom:12px">
        <div class="quick-hd"><div class="quick-hd-title">빠른 작업</div></div>
        <div class="quick-actions">
          <div class="qa-btn" onclick="switchToContent('work');startFlow('content-first')">
            <div class="qa-icon" style="background:#E8F2FF"><svg viewBox="0 0 24 24" fill="none" stroke="var(--c-primary)" stroke-width="2"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg></div>
            <div>
              <div class="qa-label">파일 업로드 등록</div>
              <div class="qa-sub">파일 먼저 올리기 방식</div>
            </div>
          </div>
          <div class="qa-btn" onclick="switchToContent('work');startFlow('curriculum-first')">
            <div class="qa-icon" style="background:var(--c-primary-l)"><svg viewBox="0 0 24 24" fill="none" stroke="var(--c-primary)" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg></div>
            <div>
              <div class="qa-label">커리큘럼 기반 등록</div>
              <div class="qa-sub">위치 먼저 선택 방식</div>
            </div>
          </div>
          ${counts.done > 0 ? `
          <div class="qa-btn" onclick="batchRequestReview()">
            <div class="qa-icon" style="background:var(--c-purple-l)"><svg viewBox="0 0 24 24" fill="none" stroke="var(--c-purple)" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg></div>
            <div>
              <div class="qa-label">일괄 검수 요청</div>
              <div class="qa-sub">완료된 ${counts.done}건 검수 전송</div>
            </div>
          </div>` : ''}
          ${counts.reviewed > 0 ? `
          <div class="qa-btn" onclick="switchView('deploy')">
            <div class="qa-icon" style="background:#F0FFF4"><svg viewBox="0 0 24 24" fill="none" stroke="#34C759" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
            <div>
              <div class="qa-label">배포 실행</div>
              <div class="qa-sub">검수 완료 ${counts.reviewed}건 배포 대기</div>
            </div>
          </div>` : ''}
          <div class="qa-btn" onclick="switchView('course-list');addNewCourse()">
            <div class="qa-icon" style="background:#FEF9C3"><svg viewBox="0 0 24 24" fill="none" stroke="#FF9500" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></div>
            <div>
              <div class="qa-label">신규 과목 추가</div>
              <div class="qa-sub">학습 과정 구조 설계</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Urgent Items -->
      ${counts.urgent > 0 ? `
      <div class="urgent-section">
        <div class="urgent-hd">
          <svg viewBox="0 0 24 24" fill="none" stroke="#FF3B30" stroke-width="2" style="width:14px;height:14px;flex-shrink:0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span style="font-size:12px;font-weight:600;color:#FF3B30;flex:1">미등록 긴급 항목</span>
          <span style="font-size:10px;font-weight:700;background:#FFB3AE;color:#FF3B30;padding:2px 8px;border-radius:8px">${counts.urgent}건</span>
        </div>
        <div class="urgent-list">
          ${allLeaves.filter(l=>getSt(l.id).status==='urgent').slice(0,5).map(l=>`
          <div class="urgent-row" onclick="switchToContent('work');ctSelectNode('${l.id}','leaf')">
            <span style="font-size:16px;width:22px;flex-shrink:0">${(CONTENT_TYPE_META[l.contentType]||CONTENT_TYPE_META.song).icon}</span>
            <div style="flex:1;min-width:0">
              <div class="ur-name">${l.label}</div>
              <div class="ur-path">${getPath(l.id)}</div>
            </div>
            <span style="font-size:10px;font-weight:700;color:#FF3B30;white-space:nowrap">지금 시작 →</span>
          </div>`).join('')}
        </div>
      </div>` : ''}
    </div>
  </div>`;
}

// ═══ switchMode/toggleContentMenu/switchToContent (dup2) (원본 라인 6565~6610) ═══
function switchMode(mode) {
  if(mode === 'course-list') switchView('course-list');
  else if(mode === 'structure') {
    ALL_VIEWS.forEach(v => { const el=document.getElementById('view-'+v); if(el) el.style.display='none'; });
    const el = document.getElementById('view-structure');
    if(el) el.style.display = 'flex';
    STATE.currentMode = 'structure';
    initStructureView();
  }
  else if(mode === 'content') switchToContent(STATE.dashTab||'work');
}

// Content submenu toggle
function toggleContentMenu() {
  const item = document.getElementById('nav-content');
  const menu = document.getElementById('content-submenu');
  if(!menu) { switchToContent('work'); return; }
  const isExpanded = item.classList.contains('expanded');
  if(!isExpanded) {
    item.classList.add('expanded','active');
    menu.style.display = 'block';
    switchToContent('work');
  } else {
    // Already expanded, navigate to work tab
    switchToContent('work');
  }
}

function switchToContent(tab) {
  STATE.dashTab = tab || 'work';

  ALL_VIEWS.forEach(v => { const el=document.getElementById('view-'+v); if(el) el.style.display='none'; });
  const el = document.getElementById('view-content');
  if(el) el.style.display = 'flex';

  document.querySelectorAll('.sb-nav-item,.sb-nav-sub').forEach(el => el.classList.remove('active'));
  document.getElementById('nav-content')?.classList.add('active','expanded');
  document.getElementById('content-submenu') && (document.getElementById('content-submenu').style.display='block');
  document.getElementById('nav-content-'+tab)?.classList.add('active');

  STATE.currentMode = 'content';
  STATE.currentNode = null;
  STATE.currentStep = 1;
  _updateContentSubNav();
  renderDashboard();
}

// ═══ WO_STATUS_LABELS + renderWorkorderView + WO helpers (원본 라인 8094~8549) ═══
const WO_STATUS_LABELS = {
  'working':   '작업 중',
  'testing':   '테스트 중',
  'test-done': '배포 대기',
  'deployed':  '배포 완료',
};

function applyEnvUI() {
  const isSTG = ENV_STATE.current === 'stg';
  const u = ENV_STATE.currentUser;

  // Compact env switcher bar
  const stgBtn = document.getElementById('envBtnStg');
  const prdBtn = document.getElementById('envBtnPrd');
  const statusText = document.getElementById('envStatusText');
  const sbLabel = document.getElementById('sbEnvLabel');

  if(stgBtn) {
    stgBtn.style.background = isSTG ? '#FFF8F0' : '#fff';
    stgBtn.style.borderColor = isSTG ? '#FF9500' : '#E5E5EA';
    stgBtn.style.color = isSTG ? '#B35C00' : '#8E8E93';
  }
  if(prdBtn) {
    prdBtn.style.background = isSTG ? '#fff' : '#E8F2FF';
    prdBtn.style.borderColor = isSTG ? '#E5E5EA' : '#0071E3';
    prdBtn.style.color = isSTG ? '#8E8E93' : '#0055B8';
  }
  if(statusText) statusText.textContent = isSTG ? 'STAGING 작업 환경' : 'PRODUCTION 운영 환경';
  if(sbLabel) {
    sbLabel.textContent = isSTG ? 'STG' : 'PRD';
    sbLabel.style.background = isSTG ? 'rgba(245,158,11,.3)' : 'rgba(0,113,227,.3)';
    sbLabel.style.color = isSTG ? '#FFD9A8' : '#B3D7FF';
  }

  // User info
  const nameEl = document.getElementById('sbUserName');
  const roleEl = document.getElementById('sbUserRole');
  const badge  = document.getElementById('sbRoleBadge');
  const avatar = document.querySelector('.sb-avatar');
  const roleLabels = { worker:'작업자', reviewer:'검수자', admin:'시스템 관리자' };
  const roleClassMap = { worker:'worker', reviewer:'reviewer', admin:'admin' };
  if(nameEl) nameEl.textContent = u.name + ' 님';
  if(roleEl) roleEl.textContent = roleLabels[u.role];
  if(badge)  { badge.className = 'sb-role-badge ' + roleClassMap[u.role]; badge.textContent = u.role.toUpperCase(); }
  if(avatar) { avatar.textContent = u.initials; avatar.style.background = u.color; }
}

// 간편 환경 전환
function switchEnvTo(env) {
  ENV_STATE.current = env;
  applyEnvUI();
  toast(env === 'prd' ? 'PRD (운영) 환경으로 전환되었습니다' : 'STG (스테이징) 환경으로 전환되었습니다', 't-info', 1500);
}

function showEnvSwitch() {
  const u = ENV_STATE.currentUser;
  const isAdmin = u.role === 'admin';
  const overlay = document.createElement('div');
  overlay.className = 'wo-modal-overlay';
  overlay.innerHTML = `
    <div class="wo-modal" style="max-width:420px">
      <div class="wo-modal-title">환경 및 계정 전환</div>
      <div class="wo-modal-sub">데모용 계정·환경 전환입니다. 실 운영에서는 SSO 인증으로 관리됩니다.</div>

      <div class="wo-form-group">
        <label class="wo-form-label">사용자 계정</label>
        <select class="wo-form-input wo-form-select" id="envUserSelect">
          ${ENV_STATE.users.map(usr => `<option value="${usr.id}" ${usr.id===u.id?'selected':''}>${usr.name} (${usr.role==='worker'?'작업자':usr.role==='reviewer'?'검수자':'시스템 관리자'})</option>`).join('')}
        </select>
      </div>

      <div class="wo-form-group">
        <label class="wo-form-label">작업 환경</label>
        <div style="display:flex;gap:10px">
          <label style="flex:1;display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:8px;border:2px solid ${ENV_STATE.current==='stg'?'#FF9500':'var(--c-gray-200)'};cursor:pointer;background:${ENV_STATE.current==='stg'?'rgba(245,158,11,.06)':'#fff'}">
            <input type="radio" name="envRadio" value="stg" ${ENV_STATE.current==='stg'?'checked':''}>
            <div>
              <div style="font-size:13px;font-weight:700;color:#B35C00">STG</div>
              <div style="font-size:11px;color:var(--c-gray-400)">STAGING — 작업/테스트</div>
            </div>
          </label>
          <label style="flex:1;display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:8px;border:2px solid ${ENV_STATE.current==='prd'?'#0071E3':'var(--c-gray-200)'};cursor:pointer;background:${ENV_STATE.current==='prd'?'rgba(0,113,227,.06)':'#fff'}" id="prdEnvLabel">
            <input type="radio" name="envRadio" value="prd" ${ENV_STATE.current==='prd'?'checked':''} ${!isAdmin?'disabled':''}>
            <div>
              <div style="font-size:13px;font-weight:700;color:${isAdmin?'#0055B8':'var(--c-gray-300)'}">PRD</div>
              <div style="font-size:11px;color:var(--c-gray-400)">PRODUCTION — 관리자 전용</div>
            </div>
          </label>
        </div>
        ${!isAdmin?'<div style="font-size:11px;color:#FF3B30;margin-top:6px">⚠ PRD 환경은 관리자(ADMIN) 권한이 필요합니다</div>':''}
      </div>

      <div class="wo-modal-footer">
        <button class="wo-btn ghost" onclick="this.closest('.wo-modal-overlay').remove()">취소</button>
        <button class="wo-btn primary" onclick="applyEnvSwitch()">적용</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function applyEnvSwitch() {
  const userSel = document.getElementById('envUserSelect');
  const envRadio = document.querySelector('input[name=envRadio]:checked');
  if(!userSel || !envRadio) return;

  const newUser = ENV_STATE.users.find(u=>u.id===userSel.value);
  const newEnv  = envRadio.value;

  if(newEnv === 'prd' && newUser.role !== 'admin') {
    toast('PRD 환경은 ADMIN 권한이 필요합니다', 't-warn'); return;
  }

  ENV_STATE.currentUser = newUser;
  ENV_STATE.current = newEnv;

  document.querySelectorAll('.wo-modal-overlay').forEach(el=>el.remove());
  applyEnvUI();
  toast(`${newUser.name} (${newUser.role}) / ${newEnv.toUpperCase()} 환경으로 전환되었습니다`, 't-ok');

  // Re-render current view if deploy or workorder
  const activeView = document.querySelector('.ia-view[style*="flex"]');
  if(activeView && activeView.id === 'view-deploy') renderDeployView();
  if(activeView && activeView.id === 'view-workorder') renderWOList();
}

// ════════════════════════════════════════════════════════
//  ■ WORK ORDER VIEW
// ════════════════════════════════════════════════════════

function renderWorkorderView() {
  applyEnvUI();
  const counts = {
    all:       WO_STATE.orders.length,
    working:   WO_STATE.orders.filter(o=>o.status==='working').length,
    testing:   WO_STATE.orders.filter(o=>o.status==='testing').length,
    'test-done': WO_STATE.orders.filter(o=>o.status==='test-done').length,
    deployed:  WO_STATE.orders.filter(o=>o.status==='deployed').length,
  };
  document.getElementById('woCntAll').textContent     = counts.all;
  document.getElementById('woCntWorking').textContent = counts.working;
  document.getElementById('woCntTesting').textContent = counts.testing;
  document.getElementById('woCntDone').textContent    = counts['test-done'];
  document.getElementById('woCntDeployed').textContent= counts.deployed;

  // Sidebar badge: working + testing
  const sbWO = document.getElementById('sbBadgeWO');
  if(sbWO) sbWO.textContent = counts.working + counts.testing;

  renderWOList();
}

function setWOFilter(tab) {
  WO_STATE.filter = tab;
  document.querySelectorAll('.wo-ftab').forEach(el => el.classList.toggle('on', el.dataset.wotab === tab));
  renderWOList();
}

function renderWOList() {
  const list = document.getElementById('woList');
  if(!list) return;
  const u = ENV_STATE.currentUser;
  const isAdmin = u.role === 'admin';
  const filter = WO_STATE.filter;
  let orders = WO_STATE.orders;
  if(filter !== 'all') orders = orders.filter(o=>o.status===filter);

  if(!orders.length) {
    list.innerHTML = `<div style="text-align:center;padding:60px 20px;color:var(--c-gray-400)">
      <div style="font-size:32px;margin-bottom:8px">📋</div>
      <div style="font-size:14px;font-weight:600">해당 조건의 작업 번호가 없습니다</div>
    </div>`;
    return;
  }

  list.innerHTML = orders.map(wo => {
    const creator = ENV_STATE.users.find(u=>u.id===wo.creator);
    const tester  = wo.tester ? ENV_STATE.users.find(u=>u.id===wo.tester) : null;
    const statusActions = getWOActions(wo, u);
    return `
      <div class="wo-card">
        <div class="wo-card-header">
          <span class="wo-id">${wo.id}</span>
          <span class="wo-title">${wo.title}</span>
          <span class="wo-env-tag ${wo.env}">${wo.env.toUpperCase()}</span>
          <span class="wo-status-pill ${wo.status}">${WO_STATUS_LABELS[wo.status]}</span>
        </div>
        <div class="wo-card-body">
          <div class="wo-meta">
            <span>📅 생성 ${wo.createdAt}</span>
            <span>🔄 수정 ${wo.updatedAt}</span>
            <span>👤 ${creator ? creator.name : '알 수 없음'}</span>
            ${tester ? `<span>🧪 검증 ${tester.name}</span>` : ''}
            ${wo.deployedAt ? `<span>🚀 배포 ${wo.deployedAt} (${ENV_STATE.users.find(u=>u.id===wo.deployedBy)?.name||'-'})</span>` : ''}
          </div>
          <div class="wo-items-preview">
            ${wo.items.map(item=>`<span class="wo-item-chip">📄 ${item}</span>`).join('')}
          </div>
          ${wo.testNote ? `<div style="font-size:12px;color:var(--c-gray-500);background:var(--c-gray-50);padding:6px 10px;border-radius:6px;margin-bottom:10px">💬 ${wo.testNote}</div>` : ''}
          <div class="wo-card-actions">
            ${statusActions}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function getWOActions(wo, user) {
  const isAdmin    = user.role === 'admin';
  const isReviewer = user.role === 'reviewer' || isAdmin;
  const id = wo.id;

  const testBtn    = wo.testUrl ? `<button class="wo-btn ghost" onclick="openStgTest('${id}')">🧪 STG 테스트 URL</button>` : '';
  // 해답·해설 편집 버튼 — working 상태에서 항상 표시
  const answerBtn  = (wo.status === 'working' || wo.status === 'testing')
    ? `<button class="wo-btn primary" style="background:#0071E3;border-color:transparent" onclick="openAnswerEditor('${id}')">✏️ 해답·해설 편집</button>` : '';
  const toTestBtn  = (wo.status === 'working') ? `<button class="wo-btn stg-test" onclick="moveWOToTesting('${id}')">🧪 테스트 요청</button>` : '';
  const doneBtn    = (wo.status === 'testing' && isReviewer) ? `<button class="wo-btn success" onclick="markWOTestDone('${id}')">✅ 테스트 완료 처리</button>` : '';
  const deployBtn  = (wo.status === 'test-done' && isAdmin) ? `<button class="prd-deploy-btn" style="padding:6px 16px;font-size:13px" onclick="deployWOToPRD('${id}')">🚀 PRD 배포 실행</button>` : '';
  const lockBtn    = (wo.status === 'test-done' && !isAdmin) ? `<span class="prd-deploy-btn-admin-lock">🔒 PRD 배포 — 관리자 권한 필요</span>` : '';

  return [answerBtn, testBtn, toTestBtn, doneBtn, deployBtn, lockBtn].filter(Boolean).join('');
}

function openCreateWO() {
  const overlay = document.createElement('div');
  overlay.className = 'wo-modal-overlay';
  overlay.innerHTML = `
    <div class="wo-modal">
      <div class="wo-modal-title">새 작업 번호 생성</div>
      <div class="wo-modal-sub">STG 환경에서 진행할 작업을 하나의 번호로 묶어 관리합니다</div>

      <div class="wo-form-group">
        <label class="wo-form-label">작업 제목 *</label>
        <input class="wo-form-input" id="woNewTitle" placeholder="예) 영어 NE3 동요 업로드" />
      </div>
      <div class="wo-form-group">
        <label class="wo-form-label">담당 작업자</label>
        <select class="wo-form-input wo-form-select" id="woNewCreator">
          ${ENV_STATE.users.filter(u=>u.role==='worker').map(u=>`<option value="${u.id}">${u.name}</option>`).join('')}
        </select>
      </div>
      <div class="wo-form-group">
        <label class="wo-form-label">작업 항목 (콘텐츠 위치, 줄바꿈으로 구분)</label>
        <textarea class="wo-form-input" id="woNewItems" rows="3" placeholder="영어 > NE3 > 1세트 > 동요&#10;영어 > NE3 > 1세트 > 해설"></textarea>
      </div>
      <div class="wo-form-group">
        <label class="wo-form-label">비고</label>
        <input class="wo-form-input" id="woNewNote" placeholder="추가 안내사항" />
      </div>
      <div class="wo-modal-footer">
        <button class="wo-btn ghost" onclick="this.closest('.wo-modal-overlay').remove()">취소</button>
        <button class="wo-btn primary" onclick="createWO()">작업 번호 생성</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function createWO() {
  const title   = document.getElementById('woNewTitle')?.value?.trim();
  const creator = document.getElementById('woNewCreator')?.value;
  const itemsRaw= document.getElementById('woNewItems')?.value?.trim();
  if(!title) { toast('작업 제목을 입력하세요','t-warn'); return; }

  const now = new Date();
  const dateStr = `${String(now.getFullYear()).slice(2)}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')}`;
  const woId = `WO-${now.getFullYear()}-${String(++WO_STATE.woCounter).padStart(3,'0')}`;
  const items = itemsRaw ? itemsRaw.split('\n').filter(Boolean) : ['미지정'];

  WO_STATE.orders.unshift({
    id: woId, title, env: 'stg', status: 'working',
    items, creator: creator || 'u1', createdAt: dateStr, updatedAt: dateStr,
    tester: null, testUrl: `https://stg.cms.example.com/preview?wo=${woId}`, testNote: '',
    deployedBy: null, deployedAt: null,
  });

  document.querySelectorAll('.wo-modal-overlay').forEach(el=>el.remove());
  renderWorkorderView();
  toast(`${woId} 작업 번호가 생성되었습니다`, 't-ok');
}

function moveWOToTesting(id) {
  const wo = WO_STATE.orders.find(o=>o.id===id);
  if(!wo) return;
  wo.status = 'testing';
  wo.updatedAt = todayStr();
  renderWorkorderView();
  toast(`${id} — 테스트 단계로 이동되었습니다`, 't-info');
}

function markWOTestDone(id) {
  const wo = WO_STATE.orders.find(o=>o.id===id);
  if(!wo) return;
  openStgTestDialog(wo, () => {
    wo.status = 'test-done';
    wo.tester = ENV_STATE.currentUser.id;
    wo.updatedAt = todayStr();
    renderWorkorderView();
    // Update deploy view badge
    const sbD = document.getElementById('sbBadgeDeploy');
    if(sbD) sbD.textContent = parseInt(sbD.textContent||0)+1;
    toast(`${id} — 테스트 완료! 배포 대기 상태로 이동되었습니다 🎉`, 't-ok');
  });
}

function openStgTestDialog(wo, onConfirm) {
  const overlay = document.createElement('div');
  overlay.className = 'stg-test-dialog';
  overlay.innerHTML = `
    <div class="stg-test-box">
      <div class="stg-test-header">
        <div class="stg-test-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#34C759" stroke-width="2" width="20" height="20"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></div>
        <div>
          <div style="font-size:16px;font-weight:600;color:var(--c-gray-800)">STG 테스트 완료 처리</div>
          <div style="font-size:12px;color:var(--c-gray-400)">${wo.id} — ${wo.title}</div>
        </div>
      </div>
      <div class="stg-test-url">${wo.testUrl}</div>
      <div style="font-size:12px;color:var(--c-gray-500);margin-bottom:10px">위 STG 주소에서 다음 항목을 직접 확인하고 체크하세요:</div>
      <div class="stg-test-checklist">
        <label class="stg-test-check"><input type="checkbox" id="stc1"> 콘텐츠 재생/표시 정상</label>
        <label class="stg-test-check"><input type="checkbox" id="stc2"> 파일 누락 없음 (음원/이미지)</label>
        <label class="stg-test-check"><input type="checkbox" id="stc3"> 라운드별 데이터 일치</label>
        <label class="stg-test-check"><input type="checkbox" id="stc4"> 학습 흐름 이상 없음</label>
      </div>
      <div class="wo-form-group" style="margin-top:12px">
        <label class="wo-form-label">테스트 결과 메모</label>
        <input class="wo-form-input" id="stcNote" placeholder="특이사항이나 확인 내용을 입력하세요" value="${wo.testNote||''}"/>
      </div>
      <div class="wo-modal-footer">
        <button class="wo-btn ghost" onclick="this.closest('.stg-test-dialog').remove()">취소</button>
        <button class="wo-btn success" onclick="confirmStgTest('${wo.id}')">✅ 테스트 완료 확인</button>
      </div>
    </div>
  `;
  overlay._onConfirm = onConfirm;
  overlay._wo = wo;
  document.body.appendChild(overlay);
}

function confirmStgTest(woId) {
  const checks = ['stc1','stc2','stc3','stc4'].map(id=>document.getElementById(id)?.checked);
  const allChecked = checks.every(Boolean);
  if(!allChecked) { toast('모든 테스트 항목을 체크해주세요','t-warn'); return; }
  const note = document.getElementById('stcNote')?.value || '';
  const dialog = document.querySelector('.stg-test-dialog');
  if(dialog) {
    if(dialog._wo) dialog._wo.testNote = note;
    if(dialog._onConfirm) dialog._onConfirm();
    dialog.remove();
  }
}

function openStgTest(id) {
  const wo = WO_STATE.orders.find(o=>o.id===id);
  if(!wo || !wo.testUrl) return;
  showConfirm(
    'STG 테스트 URL',
    `<div style="font-size:13px;margin-bottom:8px">작업 번호 <strong>${id}</strong>의 STG 미리보기 주소입니다:</div>
     <div style="font-family:monospace;font-size:12px;background:var(--c-gray-50);padding:10px 14px;border-radius:8px;color:#0071E3;border:1px solid var(--c-gray-200);word-break:break-all">${wo.testUrl}</div>
     <div style="font-size:12px;color:var(--c-gray-400);margin-top:8px">실제 환경에서는 해당 URL로 이동됩니다</div>`,
    null, '확인', 'btn-primary'
  );
}

function deployWOToPRD(id) {
  const wo = WO_STATE.orders.find(o=>o.id===id);
  if(!wo) return;
  const u = ENV_STATE.currentUser;
  if(u.role !== 'admin') { toast('PRD 배포는 ADMIN 권한이 필요합니다', 't-warn'); return; }

  showConfirm(
    'PRD 배포 실행',
    `<div style="font-size:13px;color:var(--c-gray-700);margin-bottom:12px">
       아래 작업 번호를 <strong style="color:#0055B8">PRODUCTION 환경</strong>에 배포합니다.
     </div>
     <div style="background:rgba(0,113,227,.08);border:1px solid #B3D7FF;border-radius:8px;padding:12px 14px;margin-bottom:8px">
       <div style="font-size:13px;font-weight:600;color:#0055B8">${id}</div>
       <div style="font-size:13px;color:#0055B8">${wo.title}</div>
       <div style="font-size:11px;color:var(--c-gray-400);margin-top:6px">${wo.items.join(' · ')}</div>
     </div>
     <div style="font-size:12px;color:#FF3B30;font-weight:600">⚠ 이 작업은 실서비스에 즉시 반영됩니다. 신중하게 진행하세요.</div>`,
    () => {
      wo.status = 'deployed';
      wo.env = 'prd';
      wo.deployedBy = u.id;
      wo.deployedAt = todayStr();
      wo.updatedAt  = todayStr();
      // Add to deploy history
      DEPLOY_STATE.history.unshift({
        id: id, woTitle: wo.title,
        date: todayStr(), count: wo.items.length,
        result: 'ok', operator: u.name,
        systems: ['PRD-LMS'], duration: Math.floor(Math.random()*120+30)+'초',
      });
      renderWorkorderView();
      toast(`${id} — PRD 배포 완료! 🚀`, 't-ok');
    },
    '🚀 PRD 배포 실행', 'btn-primary'
  );
}

function todayStr() {
  const d = new Date();
  return `${String(d.getFullYear()).slice(2)}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
}

// ════════════════════════════════════════════════════════
//  ■ DEPLOY VIEW (STG→PRD Pipeline)
// ════════════════════════════════════════════════════════


function bulkDeployToPRD() {
  const checked = [...document.querySelectorAll('.prd-wo-check:checked')].map(el=>el.dataset.woid);
  const targets = checked.length > 0
    ? WO_STATE.orders.filter(o=>checked.includes(o.id))
    : WO_STATE.orders.filter(o=>o.status==='test-done');
  if(!targets.length) { toast('배포할 항목이 없습니다', 't-warn'); return; }
  const u = ENV_STATE.currentUser;

  showConfirm(
    'PRD 일괄 배포',
    `<div style="font-size:13px;color:var(--c-gray-700);margin-bottom:10px"><strong>${targets.length}건</strong>을 PRODUCTION에 배포합니다.</div>
     ${targets.map(wo=>`<div style="padding:4px 0;font-size:13px;color:#0055B8">• ${wo.id} — ${wo.title}</div>`).join('')}
     <div style="font-size:12px;color:#FF3B30;margin-top:12px;font-weight:600">⚠ 실서비스에 즉시 반영됩니다</div>`,
    () => {
      targets.forEach(wo => {
        wo.status = 'deployed'; wo.env = 'prd';
        wo.deployedBy = u.id; wo.deployedAt = todayStr(); wo.updatedAt = todayStr();
        DEPLOY_STATE.history.unshift({ id: wo.id, woTitle: wo.title, date: todayStr(), count: wo.items.length, result: 'ok', operator: u.name, systems: ['PRD-LMS'], duration: Math.floor(Math.random()*120+30)+'초' });
      });
      renderDeployView();
      toast(`${targets.length}건 PRD 배포 완료! 🚀`, 't-ok');
    },
    `🚀 ${targets.length}건 일괄 배포`, 'btn-primary'
  );
}

function renderDeployHistoryNew() {
  const tb = document.getElementById('deployHistTableBody');
  if(!tb) return;
  const hist = DEPLOY_STATE.history;
  if(!hist.length) { tb.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--c-gray-400)">배포 이력이 없습니다</td></tr>`; return; }
  tb.innerHTML = hist.map(h=>`
    <tr>
      <td style="font-weight:700;color:#0071E3">${h.id}</td>
      <td>${h.woTitle||'-'}</td>
      <td>${h.date}</td>
      <td><span class="deploy-hist-env-tag prd">PRD</span></td>
      <td>${h.operator}</td>
      <td><span class="deploy-hist-result ${h.result}">${h.result==='ok'?'성공':h.result==='partial'?'일부 실패':'실패'}</span></td>
    </tr>
  `).join('');
}

// ═══ openAnswerEditor (원본 라인 8594~8608) ═══
function openAnswerEditor(woId) {
  const wo = WO_STATE.orders.find(o=>o.id===woId);
  if(!wo) return;
  AE_STATE.woId = woId; AE_STATE.woTitle = wo.title; AE_STATE.dirty = false;
  if(!wo._answerPages) {
    let pg=1;
    wo._answerPages = wo.items.map(item => {
      const qs = [_makeQ(pg,1),_makeQ(pg,2),_makeQ(pg,3)];
      return {pageNum:pg++, label:item.split('>').pop().trim(), questions:qs};
    });
  }
  AE_STATE.pages = wo._answerPages;
  AE_STATE.currentPage = 0; AE_STATE.currentQIdx = 0;
  switchView('answer-editor');
}

// ═══ renderAnswerEditor (원본 라인 8610~8635) ═══
function renderAnswerEditor() {
  // page title
  const titleEl = document.getElementById('aePageTitle');
  if(titleEl) titleEl.textContent = '해답·해설 편집 — '+AE_STATE.woTitle;
  const allQs  = AE_STATE.pages.flatMap(p=>p.questions);
  const doneQs = allQs.filter(q=>q.done).length;
  const pct    = allQs.length ? Math.round(doneQs/allQs.length*100) : 0;
  const totalEl=document.getElementById('aeTotalQ'); if(totalEl) totalEl.textContent=allQs.length;
  const doneEl =document.getElementById('aeDoneQ');  if(doneEl)  doneEl.textContent=doneQs;

  // page nav
  const nav=document.getElementById('aePageNav');
  if(nav) nav.innerHTML=`
    <span style="font-size:11px;font-weight:600;color:var(--c-gray-500);margin-right:4px">쪽</span>
    ${AE_STATE.pages.map((p,i)=>{
      const pgDone=p.questions.every(q=>q.done);
      return `<button class="ae-page-tab ${i===AE_STATE.currentPage?'on':pgDone?'done':''}" onclick="aeSelectPage(${i})">${pgDone?'✓ ':''}${p.pageNum}쪽 <span style="font-size:10px;opacity:.7">${p.questions.length}문</span></button>`;
    }).join('')}
    <button class="ae-page-tab" onclick="aeAddPage()" style="border-style:dashed">+ 쪽 추가</button>
    <div style="flex:1;margin:0 12px;display:flex;align-items:center;gap:8px">
      <div class="ae-progress-bar"><div class="ae-progress-fill" style="width:${pct}%"></div></div>
      <span style="font-size:11px;color:var(--c-gray-400);white-space:nowrap">${doneQs}/${allQs.length} (${pct}%)</span>
    </div>
  `;
  renderAEQList(); renderAEEditor();
}

// ═══ aeSelectPage (원본 라인 8637~8638) ═══
function aeSelectPage(i) { AE_STATE.currentPage=i; AE_STATE.currentQIdx=0; renderAnswerEditor(); }
function aeSelectQ(i)    { AE_STATE.currentQIdx=i; renderAEQList(); renderAEEditor(); }

// ═══ aeAddPage (원본 라인 8640~8644) ═══
function aeAddPage() {
  const nextNum=(AE_STATE.pages[AE_STATE.pages.length-1]?.pageNum||0)+1;
  AE_STATE.pages.push({pageNum:nextNum,label:nextNum+'쪽',questions:[_makeQ(nextNum,1)]});
  AE_STATE.currentPage=AE_STATE.pages.length-1; AE_STATE.currentQIdx=0; renderAnswerEditor();
}

// ═══ aeAddQuestion (원본 라인 8646~8651) ═══
function aeAddQuestion() {
  const pg=AE_STATE.pages[AE_STATE.currentPage]; if(!pg) return;
  const nq=pg.questions.length+1;
  pg.questions.push(_makeQ(pg.pageNum,nq));
  AE_STATE.currentQIdx=pg.questions.length-1; renderAnswerEditor();
}

// ═══ aeDeleteQ (원본 라인 8653~8658) ═══
function aeDeleteQ(i) {
  const pg=AE_STATE.pages[AE_STATE.currentPage]; if(!pg||pg.questions.length<=1){toast('문항은 최소 1개 필요합니다','t-warn');return;}
  pg.questions.splice(i,1);
  AE_STATE.currentQIdx=Math.min(AE_STATE.currentQIdx,pg.questions.length-1);
  renderAnswerEditor();
}

// ═══ renderAEQList (원본 라인 8660~8675) ═══
function renderAEQList() {
  const list=document.getElementById('aeQList'); if(!list) return;
  const pg=AE_STATE.pages[AE_STATE.currentPage]; if(!pg){list.innerHTML='';return;}
  list.innerHTML=pg.questions.map((q,i)=>{
    const cls=i===AE_STATE.currentQIdx?'active':q.done?'done':(!q.answerContent&&q.hasScoring?'warn':'');
    const circle=['①','②','③','④','⑤'];
    const preview = q.answerType==='객관식'&&q.answerContent ? circle[q.answerContent-1]||'' :
                    q.answerType==='순서배열'&&Array.isArray(q.answerContent)&&q.answerContent.length ? q.answerContent.join('→') :
                    typeof q.answerContent==='string'&&q.answerContent ? q.answerContent.slice(0,8)+'…' : '';
    return `<div class="ae-q-item ${cls}" onclick="aeSelectQ(${i})">
      <span class="ae-q-num">${q.mainQ}</span>
      <span style="font-size:10px;opacity:.75;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${preview||q.answerType}</span>
      <span class="ae-q-status">${q.done?'✓':''}</span>
    </div>`;
  }).join('');
}

// ═══ renderAEEditor (원본 라인 8677~8834) ═══
function renderAEEditor() {
  const panel=document.getElementById('aeEditorPanel'); if(!panel) return;
  const pg=AE_STATE.pages[AE_STATE.currentPage];
  if(!pg){panel.innerHTML='<div style="padding:60px;text-align:center;color:var(--c-gray-400)">쪽을 선택하세요</div>';return;}
  const q=pg.questions[AE_STATE.currentQIdx];
  if(!q){panel.innerHTML='';return;}

  const circle=['①','②','③','④','⑤'];

  panel.innerHTML=`
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px">
    <span style="font-size:19px;font-weight:600;color:var(--c-gray-800)">${q.mainQ}번 문항</span>
    <span class="ae-domain-chip">${q.domain}</span>
    <span style="font-size:12px;padding:2px 8px;border-radius:4px;background:rgba(107,114,128,.1);color:var(--c-gray-500)">${q.qtype}</span>
    ${q.done?'<span class="ae-done-badge">✓ 완료</span>':''}
    <div style="margin-left:auto;display:flex;gap:6px">
      <button class="wo-btn ghost" style="font-size:12px" onclick="aePrevQ()">← 이전</button>
      <button class="wo-btn ghost" style="font-size:12px" onclick="aeNextQ()">다음 →</button>
      <button class="wo-btn danger" style="font-size:12px;padding:5px 10px" onclick="aeDeleteQ(${AE_STATE.currentQIdx})">삭제</button>
    </div>
  </div>

  <!-- ① 문항 기본 정보 -->
  <div class="ae-section" id="aeSection_meta">
    <div class="ae-section-header" onclick="toggleAeSection('meta')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      문항 기본 정보
      <span style="font-size:11px;font-weight:400;color:var(--c-gray-400);margin-left:4px">페이지 ${q.page} · 대문항 ${q.mainQ} · 소문항 ${q.subQ}</span>
      <span class="ae-toggle">▾</span>
    </div>
    <div class="ae-section-body">
      <div class="ae-meta-grid" style="margin-bottom:10px">
        <div class="ae-field">
          <label>컨텐츠 구분<span class="req">*</span></label>
          <select class="ae-input ae-select" onchange="aeSet('${q.id}','contentType',this.value)">
            ${CONTENT_TYPE_OPTS.map(o=>`<option ${q.contentType===o?'selected':''}>${o}</option>`).join('')}
          </select>
        </div>
        <div class="ae-field">
          <label>면구분</label>
          <select class="ae-input ae-select" onchange="aeSet('${q.id}','side',this.value)">
            ${SIDE_OPTIONS.map(o=>`<option ${q.side===o?'selected':''}>${o}</option>`).join('')}
          </select>
        </div>
        <div class="ae-field">
          <label>평가구분</label>
          <select class="ae-input ae-select" onchange="aeSet('${q.id}','evalType',this.value)">
            ${EVAL_OPTIONS.map(o=>`<option ${q.evalType===o?'selected':''}>${o}</option>`).join('')}
          </select>
        </div>
        <div class="ae-field">
          <label>대문항<span class="req">*</span></label>
          <input class="ae-input ${!q.mainQ?'required-empty':''}" value="${q.mainQ}" placeholder="001" onchange="aeSet('${q.id}','mainQ',this.value)">
        </div>
        <div class="ae-field">
          <label>소문항</label>
          <input class="ae-input" value="${q.subQ}" placeholder="000" onchange="aeSet('${q.id}','subQ',this.value)">
        </div>
        <div class="ae-field">
          <label>일차</label>
          <input class="ae-input" value="${q.day}" placeholder="예) 1" onchange="aeSet('${q.id}','day',this.value)">
        </div>
      </div>
      <div class="ae-meta-grid">
        <div class="ae-field">
          <label>영역</label>
          <select class="ae-input ae-select" onchange="aeSet('${q.id}','domain',this.value)">
            ${DOMAIN_OPTIONS.map(o=>`<option ${q.domain===o?'selected':''}>${o}</option>`).join('')}
          </select>
        </div>
        <div class="ae-field">
          <label>문항유형</label>
          <select class="ae-input ae-select" onchange="aeSet('${q.id}','qtype',this.value)">
            ${QTYPE_OPTIONS.map(o=>`<option ${q.qtype===o?'selected':''}>${o}</option>`).join('')}
          </select>
        </div>
        <div class="ae-field">
          <label>챕터</label>
          <input class="ae-input" value="${q.chapter}" placeholder="예) 3" onchange="aeSet('${q.id}','chapter',this.value)">
        </div>
      </div>
    </div>
  </div>

  <!-- ② 해답 (핵심) -->
  <div class="ae-section" id="aeSection_answer">
    <div class="ae-section-header" onclick="toggleAeSection('answer')" style="cursor:pointer">
      <svg viewBox="0 0 24 24" fill="none" stroke="#0071E3" stroke-width="2" width="14" height="14"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
      <span style="color:#0071E3;font-weight:700">해답 입력</span>
      ${q.answerContent!==null&&q.answerContent!==''&&!(Array.isArray(q.answerContent)&&!q.answerContent.length)
        ?'<span style="font-size:11px;font-weight:400;color:#34C759;margin-left:4px">✓ 입력됨</span>'
        :'<span style="font-size:11px;color:#FF3B30;margin-left:4px">미입력</span>'}
      <span class="ae-toggle">▾</span>
    </div>
    <div class="ae-section-body">
      <!-- 채점여부 토글 -->
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid var(--c-gray-100)">
        <span style="font-size:12px;font-weight:700;color:var(--c-gray-600)">채점 여부</span>
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px">
          <input type="radio" name="sc_${q.id}" ${q.hasScoring?'checked':''} onchange="aeSet('${q.id}','hasScoring',true)" style="accent-color:#0071E3"> 채점있음
        </label>
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px">
          <input type="radio" name="sc_${q.id}" ${!q.hasScoring?'checked':''} onchange="aeSet('${q.id}','hasScoring',false)" style="accent-color:#0071E3"> 채점없음
        </label>
      </div>

      <!-- 해답 형태 선택 -->
      <div style="font-size:12px;font-weight:700;color:var(--c-gray-500);margin-bottom:8px">해답 형태</div>
      <div class="ae-type-tabs">
        ${ANSWER_TYPE_OPTIONS.map(t=>{
          const icons={객관식:'① ② ③',순서배열:'①→②→③',단답형:'단 답',서술형:'서술',루브릭:'루브릭'};
          return `<button class="ae-type-tab ${q.answerType===t?'on':''}" onclick="aeSetAnswerType('${q.id}','${t}')">${icons[t]||t}</button>`;
        }).join('')}
      </div>

      <!-- 동적 해답 입력 UI -->
      <div id="aeAnswerInput_${q.id}">
        ${renderAnswerInputHTML(q)}
      </div>
    </div>
  </div>

  <!-- ③ 해설 -->
  <div class="ae-section" id="aeSection_commentary">
    <div class="ae-section-header" onclick="toggleAeSection('commentary')" style="cursor:pointer">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      해설
      ${q.commentaryText||q.commentaryFile?'<span style="font-size:11px;font-weight:400;color:#34C759;margin-left:4px">✓ 입력됨</span>':''}
      <span class="ae-toggle">▾</span>
    </div>
    <div class="ae-section-body">
      <div style="display:flex;gap:8px;margin-bottom:12px">
        ${['text','file','none'].map((t,i)=>{
          const lbl=['직접 입력','파일 첨부','해설 없음'][i];
          return `<button class="ae-commentary-opt ${q.commentaryType===t?'on':''}" onclick="aeSet('${q.id}','commentaryType','${t}');renderAEEditor()">${lbl}</button>`;
        }).join('')}
      </div>
      ${q.commentaryType==='text'
        ?`<textarea class="ae-textarea" placeholder="해설 내용을 입력하세요..." oninput="aeSet('${q.id}','commentaryText',this.value)">${q.commentaryText}</textarea>`
        :q.commentaryType==='file'
        ?`<div style="display:flex;gap:8px;align-items:center">
            <input class="ae-input" style="flex:1" placeholder="파일명" value="${q.commentaryFile}" onchange="aeSet('${q.id}','commentaryFile',this.value)">
            <button class="wo-btn ghost" onclick="toast('파일 업로드 — 실 연동 시 처리됩니다','t-info')">📎 파일 선택</button>
          </div>`
        :`<div style="padding:12px;background:var(--c-gray-50);border-radius:8px;font-size:13px;color:var(--c-gray-400);text-align:center">해설 없음</div>`}
    </div>
  </div>

  <!-- 저장/이동 -->
  <div class="ae-nav-bar">
    <button class="wo-btn ghost" onclick="aePrevQ()">← 이전 문항</button>
    <div style="display:flex;gap:8px">
      <button class="wo-btn ghost" onclick="aeSaveQ('${q.id}',false)">임시 저장</button>
      <button class="wo-btn primary" onclick="aeSaveQ('${q.id}',true)">저장 후 다음 →</button>
    </div>
  </div>
  `;
}

// ═══ aeSaveQ (원본 라인 8991~8999) ═══
function aeSaveQ(qId,goNext) {
  const q=_findQ(qId); if(!q) return;
  const hasAns=q.answerContent!==null&&q.answerContent!==''&&
    !(Array.isArray(q.answerContent)&&!q.answerContent.length);
  if(q.hasScoring&&!hasAns){toast('해답 내용을 입력하세요','t-warn');return;}
  q.done=true; AE_STATE.dirty=false;
  toast('저장 완료 ✓','t-ok');
  if(goNext) aeNextQ(); else renderAnswerEditor();
}

// ═══ aePrevQ (원본 라인 9012~9016) ═══
function aePrevQ() {
  if(AE_STATE.currentQIdx>0){AE_STATE.currentQIdx--;}
  else if(AE_STATE.currentPage>0){AE_STATE.currentPage--;AE_STATE.currentQIdx=AE_STATE.pages[AE_STATE.currentPage].questions.length-1;}
  renderAnswerEditor();
}

// ═══ aeNextQ (원본 라인 9017~9023) ═══
function aeNextQ() {
  const pg=AE_STATE.pages[AE_STATE.currentPage]; if(!pg) return;
  if(AE_STATE.currentQIdx<pg.questions.length-1){AE_STATE.currentQIdx++;}
  else if(AE_STATE.currentPage<AE_STATE.pages.length-1){AE_STATE.currentPage++;AE_STATE.currentQIdx=0;}
  else{toast('마지막 문항입니다','t-info');return;}
  renderAnswerEditor();
}

// ═══ toggleAeSection (원본 라인 9024~9028) ═══
function toggleAeSection(name) {
  const sec=document.getElementById('aeSection_'+name); if(!sec) return;
  sec.classList.toggle('collapsed');
  sec.querySelector('.ae-section-header')?.classList.toggle('collapsed');
}

// ═══ SERVICE_DIST block (원본 라인 12245~14778) ═══
const SERVICE_DIST_DATA = [
  {id:'sd1', title:'NE1 1세트 플래시카드', subject:'영어', subjectCode:'E', course:'NE1', set:'1세트', typeCode:'FLC', cmsStatus:'deployed', platforms:{n365:'deployed', growth:'deployed', lms:'pending'}},
  {id:'sd2', title:'NE1 1세트 핵심점검 본문', subject:'영어', subjectCode:'E', course:'NE1', set:'1세트', typeCode:'CBT', cmsStatus:'deployed', platforms:{n365:'deployed', growth:'pending', lms:'none'}},
  {id:'sd3', title:'NE1 2세트 웹콘텐츠', subject:'영어', subjectCode:'E', course:'NE1', set:'2세트', typeCode:'WEB', cmsStatus:'deployed', platforms:{n365:'deployed', growth:'deployed', lms:'deployed'}},
  {id:'sd4', title:'NE2 1세트 핵심점검 Cover', subject:'영어', subjectCode:'E', course:'NE2', set:'1세트', typeCode:'CCV', cmsStatus:'deployed', platforms:{n365:'pending', growth:'none', lms:'none'}},
  {id:'sd5', title:'기초수학 1세트 핵심점검', subject:'수학', subjectCode:'M', course:'기초수학', set:'1세트', typeCode:'CBT', cmsStatus:'reviewed', platforms:{n365:'none', growth:'none', lms:'none'}},
  {id:'sd6', title:'한글똑똑 1세트 해답지', subject:'한글똑똑', subjectCode:'LN', course:'한글똑똑1', set:'1세트', typeCode:'ANS', cmsStatus:'deployed', platforms:{n365:'deployed', growth:'deployed', lms:'pending'}},
  {id:'sd7', title:'놀이똑똑 동요', subject:'놀이똑똑', subjectCode:'BN', course:'놀이1', set:'1세트', typeCode:'VKS', cmsStatus:'deployed', platforms:{n365:'deployed', growth:'none', lms:'deployed'}},
  {id:'sd8', title:'한자 1세트 플래시카드', subject:'한자', subjectCode:'H', course:'한자1', set:'1세트', typeCode:'FLC', cmsStatus:'deployed', platforms:{n365:'pending', growth:'pending', lms:'none'}},
  {id:'sd9', title:'NE2 1세트 채점', subject:'영어', subjectCode:'E', course:'NE2', set:'1세트', typeCode:'AN2', cmsStatus:'reviewed', platforms:{n365:'none', growth:'none', lms:'none'}},
  {id:'sd10', title:'NE1 2세트 맞춤평가', subject:'영어', subjectCode:'E', course:'NE1', set:'2세트', typeCode:'EVA', cmsStatus:'deployed', platforms:{n365:'deployed', growth:'deployed', lms:'deployed'}},
];

const SD_FILTER = { platform:'all', status:'all', subject:'all' };

function sdTogglePlatform(itemId, platformId) {
  const item = SERVICE_DIST_DATA.find(i => i.id === itemId);
  if(!item) return;
  const cur = item.platforms[platformId];
  if(cur === 'none' || cur === 'pending') item.platforms[platformId] = 'deployed';
  else if(cur === 'deployed') item.platforms[platformId] = 'none';
  renderServiceDistView();
}

function sdSetFilter(key, val) { SD_FILTER[key] = val; renderServiceDistView(); }

// ═══════════════════════════════════════════════
//  ■ 과목 코드 관리 뷰
// ═══════════════════════════════════════════════

var CM_STATE = {
  search: '',
  filterGroup: 'all',    // all, registered, unregistered
  filterSystem: 'all',   // all, ND, NH, SJ, NH365
  sortBy: 'code',        // code, name, types
  selectedCode: null,
  page: 1,
  pageSize: 20,
  expandedCode: null,
};

// ── 학습관 별칭 (Display Name) 매핑 ──
// CMS 과목명과 학습관 서비스에서 보이는 이름이 다를 때 사용
// key: 과목코드, value: {nhName: 학습관표시명, note: 변경사유}
var SUBJECT_DISPLAY_NAMES = {
  AM:  {nhName:'중학교 1학년 수학', note:'학습관 서비스 레벨 기준 네이밍'},
  DAM: {nhName:'중학교 수학(심화)', note:'학습관 서비스 레벨 기준'},
  M:   {nhName:'초등 수학', note:'학습관 학년별 분류 기준'},
  E:   {nhName:'초등 영어', note:'학습관 학년별 분류 기준'},
  K:   {nhName:'초등 국어', note:'학습관 학년별 분류 기준'},
  MZ:  {nhName:'코어 수학(기본)', note:'학습관 난이도 기준 네이밍'},
  PDM1:{nhName:'초등 스코어수학 1단계', note:'학습관 단계별 네이밍'},
  DM1: {nhName:'중등 스코어수학 1단계', note:'학습관 단계별 네이밍'},
};

// ── 코드 등록/편집 팝업 state ──
var CM_EDIT_STATE = {
  isOpen: false,
  mode: 'add',        // 'add' | 'edit'
  code: '',
  courseName: '',
  nhName: '',
  nhNote: '',
  linkedSubjects: [],  // 서브 코드 목록
  editingCode: null,   // edit 모드일 때 원래 코드
};

// ── 코드 등록 팝업 열기 ──
function _cmOpenCodePopup(mode, code) {
  CM_EDIT_STATE.mode = mode || 'add';
  if(mode === 'edit' && code) {
    var cData = SUBJECT_COURSE_DATA[code] || {};
    var dn = SUBJECT_DISPLAY_NAMES[code] || {};
    var bundleInfo = _cmGetBundleInfo(code);
    var linked = [];
    if(bundleInfo.asHub.length > 0) {
      linked = bundleInfo.asHub[0].linkedSubjects.slice();
    }
    CM_EDIT_STATE.code = code;
    CM_EDIT_STATE.courseName = cData.courseName || (_SUBJECT_NAME_MAP[code] || '');
    CM_EDIT_STATE.nhName = dn.nhName || '';
    CM_EDIT_STATE.nhNote = dn.note || '';
    CM_EDIT_STATE.linkedSubjects = linked;
    CM_EDIT_STATE.editingCode = code;
  } else {
    CM_EDIT_STATE.code = '';
    CM_EDIT_STATE.courseName = '';
    CM_EDIT_STATE.nhName = '';
    CM_EDIT_STATE.nhNote = '';
    CM_EDIT_STATE.linkedSubjects = [];
    CM_EDIT_STATE.editingCode = null;
  }
  CM_EDIT_STATE.isOpen = true;
  _cmRenderCodePopup();
}

// ── 코드 등록 팝업 닫기 ──
function _cmCloseCodePopup() {
  CM_EDIT_STATE.isOpen = false;
  var el = document.getElementById('cmCodePopupOverlay');
  if(el) el.remove();
}

// ── 서브 코드 추가 입력 ──
function _cmAddLinkedSubject() {
  var inp = document.getElementById('cmNewSubCode');
  if(!inp) return;
  var val = inp.value.trim().toUpperCase();
  if(!val) return;
  if(CM_EDIT_STATE.linkedSubjects.indexOf(val) >= 0) { alert('이미 추가된 코드입니다.'); return; }
  if(val === CM_EDIT_STATE.code) { alert('메인 코드와 동일한 코드는 추가할 수 없습니다.'); return; }
  CM_EDIT_STATE.linkedSubjects.push(val);
  inp.value = '';
  _cmRenderCodePopup();
}

// ── 서브 코드 제거 ──
function _cmRemoveLinkedSubject(idx) {
  CM_EDIT_STATE.linkedSubjects.splice(idx, 1);
  _cmRenderCodePopup();
}

// ── 코드 등록 저장 ──
function _cmSaveCode() {
  var code = CM_EDIT_STATE.code.trim().toUpperCase();
  var cname = CM_EDIT_STATE.courseName.trim();
  if(!code) { alert('과목 코드를 입력해주세요.'); return; }
  if(!cname) { alert('과정명을 입력해주세요.'); return; }

  // SUBJECT_COURSE_DATA 업데이트
  if(!SUBJECT_COURSE_DATA[code]) {
    SUBJECT_COURSE_DATA[code] = {courseName: cname, courses:1, sets:10};
  } else {
    SUBJECT_COURSE_DATA[code].courseName = cname;
  }

  // _SUBJECT_NAME_MAP 업데이트
  _SUBJECT_NAME_MAP[code] = cname;

  // SUBJECT_TYPE_MAP에 없으면 추가
  if(!SUBJECT_TYPE_MAP[code]) {
    SUBJECT_TYPE_MAP[code] = {name: cname, children: CM_EDIT_STATE.linkedSubjects.slice(), types: []};
  } else {
    SUBJECT_TYPE_MAP[code].name = cname;
    SUBJECT_TYPE_MAP[code].children = CM_EDIT_STATE.linkedSubjects.slice();
  }

  // 학습관 별칭 저장
  var nhName = CM_EDIT_STATE.nhName.trim();
  if(nhName) {
    SUBJECT_DISPLAY_NAMES[code] = {nhName: nhName, note: CM_EDIT_STATE.nhNote.trim()};
  } else {
    delete SUBJECT_DISPLAY_NAMES[code];
  }

  // 서브 코드 번들 처리 (간단 시뮬)
  if(CM_EDIT_STATE.linkedSubjects.length > 0) {
    // linkedSubjects 이름 등록
    CM_EDIT_STATE.linkedSubjects.forEach(function(sc) {
      if(!_SUBJECT_NAME_MAP[sc]) _SUBJECT_NAME_MAP[sc] = sc;
    });
  }

  _cmCloseCodePopup();
  renderCodeManageView();
}

// ── 코드 등록/편집 팝업 렌더 ──
function _cmRenderCodePopup() {
  var old = document.getElementById('cmCodePopupOverlay');
  if(old) old.remove();

  var ov = document.createElement('div');
  ov.id = 'cmCodePopupOverlay';
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:10000;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(3px)';
  ov.onclick = function(e) { if(e.target === ov) _cmCloseCodePopup(); };

  var isEdit = CM_EDIT_STATE.mode === 'edit';
  var title = isEdit ? '과목 코드 편집' : '과목 코드 등록';

  var p = '';
  p += '<div style="background:#fff;border-radius:14px;width:540px;max-height:85vh;overflow-y:auto;box-shadow:0 25px 50px rgba(0,0,0,.18)">';

  // 헤더
  p += '<div style="padding:20px 24px 14px;border-bottom:1px solid #F5F5F7;display:flex;align-items:center;justify-content:space-between">';
  p += '<div style="font-size:16px;font-weight:600;color:#1D1D1F">' + title + '</div>';
  p += '<button onclick="_cmCloseCodePopup()" style="width:30px;height:30px;border:none;background:#F5F5F7;border-radius:8px;cursor:pointer;font-size:16px;color:#636366;display:flex;align-items:center;justify-content:center">&times;</button>';
  p += '</div>';

  // 본문
  p += '<div style="padding:20px 24px">';

  // 과목 코드
  p += '<div style="margin-bottom:16px">';
  p += '<label style="display:block;font-size:12px;font-weight:700;color:#48484A;margin-bottom:5px">과목 코드 <span style="color:#FF3B30">*</span></label>';
  p += '<input id="cmEditCode" type="text" value="' + (CM_EDIT_STATE.code || '') + '" ' + (isEdit ? 'disabled' : '') + ' oninput="CM_EDIT_STATE.code=this.value" placeholder="예: AM, DM1, QPA" style="width:100%;padding:9px 12px;border:1px solid #E5E5EA;border-radius:8px;font-size:13px;font-weight:700;font-family:monospace;outline:none;box-sizing:border-box;' + (isEdit ? 'background:#FAFAFA;color:#8E8E93' : '') + '">';
  p += '</div>';

  // 과정명 (CMS명)
  p += '<div style="margin-bottom:16px">';
  p += '<label style="display:block;font-size:12px;font-weight:700;color:#48484A;margin-bottom:5px">과정명 (CMS) <span style="color:#FF3B30">*</span></label>';
  p += '<input type="text" value="' + (CM_EDIT_STATE.courseName || '') + '" oninput="CM_EDIT_STATE.courseName=this.value" placeholder="예: 써밋스피드수학" style="width:100%;padding:9px 12px;border:1px solid #E5E5EA;border-radius:8px;font-size:13px;outline:none;box-sizing:border-box">';
  p += '</div>';

  // 구분선 + 학습관 별칭
  p += '<div style="border-top:1px dashed #E5E5EA;margin:20px 0 16px;padding-top:16px">';
  p += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:12px">';
  p += '<span style="font-size:13px;font-weight:700;color:#1D1D1F">학습관 서비스명</span>';
  p += '<span style="font-size:10px;padding:2px 8px;border-radius:4px;background:#F9F0FF;color:#AF52DE;font-weight:600">학습관 전용</span>';
  p += '</div>';
  p += '<div style="font-size:11px;color:#8E8E93;margin-bottom:10px">학습관에서 다른 이름으로 서비스될 경우 입력합니다. 미입력 시 CMS 과정명이 그대로 사용됩니다.</div>';

  p += '<div style="margin-bottom:10px">';
  p += '<label style="display:block;font-size:12px;font-weight:600;color:#48484A;margin-bottom:5px">학습관 표시명</label>';
  p += '<input type="text" value="' + (CM_EDIT_STATE.nhName || '') + '" oninput="CM_EDIT_STATE.nhName=this.value" placeholder="예: 중학교 1학년 수학" style="width:100%;padding:9px 12px;border:1px solid #E5E5EA;border-radius:8px;font-size:13px;outline:none;box-sizing:border-box">';
  p += '</div>';

  p += '<div style="margin-bottom:4px">';
  p += '<label style="display:block;font-size:12px;font-weight:600;color:#48484A;margin-bottom:5px">변경 사유</label>';
  p += '<input type="text" value="' + (CM_EDIT_STATE.nhNote || '') + '" oninput="CM_EDIT_STATE.nhNote=this.value" placeholder="예: 학습관 서비스 레벨 기준 네이밍" style="width:100%;padding:9px 12px;border:1px solid #E5E5EA;border-radius:8px;font-size:13px;outline:none;box-sizing:border-box">';
  p += '</div>';
  p += '</div>';

  // 구분선 + 서브 코드 연결
  p += '<div style="border-top:1px dashed #E5E5EA;margin:20px 0 16px;padding-top:16px">';
  p += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:12px">';
  p += '<span style="font-size:13px;font-weight:700;color:#1D1D1F">서브 코드 연결</span>';
  p += '<span style="font-size:10px;padding:2px 8px;border-radius:4px;background:#E8F2FF;color:#0071E3;font-weight:600">묶음</span>';
  p += '</div>';
  p += '<div style="font-size:11px;color:#8E8E93;margin-bottom:10px">이 메인 코드에 연결할 서브 과목 코드를 추가합니다. 콘텐츠 묶음(Hub→Spoke) 관계가 설정됩니다.</div>';

  // 서브 코드 목록
  if(CM_EDIT_STATE.linkedSubjects.length > 0) {
    p += '<div style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px">';
    CM_EDIT_STATE.linkedSubjects.forEach(function(sc, si) {
      var scName = _SUBJECT_NAME_MAP[sc] || sc;
      p += '<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:#FAFAFA;border-radius:8px;border:1px solid #E5E5EA">';
      p += '<span style="font-weight:600;font-family:monospace;font-size:13px;color:#0369A1;background:#E8F2FF;padding:2px 8px;border-radius:4px">' + sc + '</span>';
      p += '<span style="font-size:12px;color:#48484A;flex:1">' + scName + '</span>';
      p += '<button onclick="_cmRemoveLinkedSubject(' + si + ')" style="width:24px;height:24px;border:none;background:#FFB3AE;border-radius:6px;cursor:pointer;font-size:13px;color:#FF3B30;display:flex;align-items:center;justify-content:center">&times;</button>';
      p += '</div>';
    });
    p += '</div>';
  }

  // 서브 코드 추가 입력
  p += '<div style="display:flex;gap:6px">';
  p += '<input id="cmNewSubCode" type="text" placeholder="서브 코드 입력 (예: AMA)" onkeydown="if(event.key===\'Enter\'){event.preventDefault();_cmAddLinkedSubject();}" style="flex:1;padding:8px 12px;border:1px solid #E5E5EA;border-radius:8px;font-size:13px;font-family:monospace;font-weight:700;outline:none">';
  p += '<button onclick="_cmAddLinkedSubject()" style="padding:8px 16px;background:#0071E3;color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:500;cursor:pointer;white-space:nowrap">+ 추가</button>';
  p += '</div>';
  p += '</div>';

  p += '</div>';

  // 푸터
  p += '<div style="padding:14px 24px 20px;border-top:1px solid #F5F5F7;display:flex;gap:8px;justify-content:flex-end">';
  p += '<button onclick="_cmCloseCodePopup()" style="padding:9px 20px;border:1px solid #E5E5EA;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;background:#fff;color:#636366">취소</button>';
  p += '<button onclick="_cmSaveCode()" style="padding:9px 24px;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;background:#0071E3;color:#fff">' + (isEdit ? '저장' : '등록') + '</button>';
  p += '</div>';

  p += '</div>';

  ov.innerHTML = p;
  document.body.appendChild(ov);
}

function renderCodeManageView() {
  var root = document.getElementById('codeManageRoot');
  if(!root) return;

  var subjects = Object.entries(SUBJECT_TYPE_MAP);
  var q = CM_STATE.search.toLowerCase();

  // 필터링
  var filtered = subjects.filter(function(entry) {
    var code = entry[0];
    var cData = SUBJECT_COURSE_DATA[code] || {};
    var name = cData.courseName || (_SUBJECT_NAME_MAP[code] || code);
    var hasTypes = !!REGISTERED_WORK_TYPES[code] && REGISTERED_WORK_TYPES[code].length > 0;
    var regTypes = REGISTERED_WORK_TYPES[code] || [];

    // 텍스트 검색 (코드, 과정명, 유형명)
    if(q) {
      var match = code.toLowerCase().indexOf(q) >= 0 || name.toLowerCase().indexOf(q) >= 0;
      if(!match) {
        match = regTypes.some(function(rt) { return rt.name.toLowerCase().indexOf(q) >= 0; });
      }
      if(!match) return false;
    }
    // 상태 필터
    if(CM_STATE.filterGroup === 'registered' && !hasTypes) return false;
    if(CM_STATE.filterGroup === 'unregistered' && hasTypes) return false;
    // 시스템 필터
    if(CM_STATE.filterSystem !== 'all') {
      if(!hasTypes) return false;
      var hasSys = regTypes.some(function(rt) { return (rt.target || 'ND') === CM_STATE.filterSystem; });
      if(!hasSys) return false;
    }
    return true;
  });

  // 정렬
  filtered.sort(function(a, b) {
    if(CM_STATE.sortBy === 'name') {
      var na = (SUBJECT_COURSE_DATA[a[0]] || {}).courseName || a[0];
      var nb = (SUBJECT_COURSE_DATA[b[0]] || {}).courseName || b[0];
      return na.localeCompare(nb, 'ko');
    }
    if(CM_STATE.sortBy === 'types') {
      var la = (REGISTERED_WORK_TYPES[a[0]] || []).length;
      var lb = (REGISTERED_WORK_TYPES[b[0]] || []).length;
      return lb - la;
    }
    return a[0].localeCompare(b[0]);
  });

  // 페이징
  var totalPages = Math.max(1, Math.ceil(filtered.length / CM_STATE.pageSize));
  if(CM_STATE.page > totalPages) CM_STATE.page = totalPages;
  var startIdx = (CM_STATE.page - 1) * CM_STATE.pageSize;
  var pageItems = filtered.slice(startIdx, startIdx + CM_STATE.pageSize);

  var totalCount = subjects.length;
  var regCount = subjects.filter(function(e) { return REGISTERED_WORK_TYPES[e[0]] && REGISTERED_WORK_TYPES[e[0]].length > 0; }).length;
  var bundledCount = _cmCountBundledCodes();

  var h = '';
  h += '<div style="display:flex;flex-direction:column;height:100%;overflow:hidden">';

  // ── 헤더 ──
  h += '<div style="padding:16px 24px 14px;border-bottom:1px solid #E5E5EA;background:#fff;flex-shrink:0">';
  h += '<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">';
  h += '<div><div style="font-size:16px;font-weight:600;color:#1D1D1F;letter-spacing:-.02em">과목 코드 관리</div>';
  h += '<div style="font-size:12px;color:#8E8E93;margin-top:2px">전체 과목 코드 조회 · 콘텐츠 등록 현황 · 묶음 연결 · 고급 검색</div></div>';
  h += '<div style="margin-left:auto;display:flex;gap:6px;align-items:center">';
  h += '<span style="font-size:12px;padding:4px 10px;border-radius:6px;background:#F5F5F7;color:#48484A;font-weight:600">' + totalCount + '개 전체</span>';
  h += '<span style="font-size:12px;padding:4px 10px;border-radius:6px;background:#A8E6B8;color:#1B8A3E;font-weight:600">' + regCount + ' 등록</span>';
  h += '<span style="font-size:12px;padding:4px 10px;border-radius:6px;background:#E8F2FF;color:#3730A3;font-weight:600">' + bundledCount + ' 묶음</span>';
  h += '</div></div>';

  // ── 검색바 (고급) ──
  h += '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">';

  // 검색 인풋
  h += '<div style="flex:1;position:relative;min-width:260px;max-width:420px">';
  h += '<svg viewBox="0 0 24 24" fill="none" stroke="#8E8E93" stroke-width="2" style="position:absolute;left:11px;top:50%;transform:translateY(-50%);width:15px;height:15px;pointer-events:none"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';
  h += '<input id="cmSearchInput" type="text" placeholder="코드, 과정명, 템플릿명으로 검색" value="' + (CM_STATE.search || '') + '" oninput="CM_STATE.search=this.value;CM_STATE.page=1;renderCodeManageView()" style="width:100%;padding:8px 12px 8px 34px;border:1px solid #E5E5EA;border-radius:8px;font-size:13px;outline:none;transition:border-color .15s" onfocus="this.style.borderColor=\'#B3D7FF\'" onblur="this.style.borderColor=\'#E5E5EA\'">';
  h += '</div>';

  // 상태 필터
  h += '<div style="display:flex;gap:0;border:1px solid #E5E5EA;border-radius:8px;overflow:hidden">';
  var grps = [{v:'all',l:'전체'},{v:'registered',l:'등록됨'},{v:'unregistered',l:'미등록'}];
  grps.forEach(function(g) {
    var isOn = CM_STATE.filterGroup === g.v;
    h += '<button onclick="CM_STATE.filterGroup=\'' + g.v + '\';CM_STATE.page=1;renderCodeManageView()" style="padding:6px 12px;border:none;font-size:12px;font-weight:' + (isOn ? 700 : 500) + ';cursor:pointer;background:' + (isOn ? '#1D1D1F' : '#fff') + ';color:' + (isOn ? '#fff' : '#636366') + ';transition:all .12s">' + g.l + '</button>';
  });
  h += '</div>';

  // 시스템 필터
  h += '<select onchange="CM_STATE.filterSystem=this.value;CM_STATE.page=1;renderCodeManageView()" style="padding:6px 10px;border:1px solid #E5E5EA;border-radius:8px;font-size:12px;outline:none;cursor:pointer">';
  h += '<option value="all"' + (CM_STATE.filterSystem==='all'?' selected':'') + '>전체 시스템</option>';
  Object.keys(WC_SYSTEM_COLORS).forEach(function(sk) {
    h += '<option value="' + sk + '"' + (CM_STATE.filterSystem===sk?' selected':'') + '>' + WC_SYSTEM_COLORS[sk].label + '</option>';
  });
  h += '</select>';

  // 정렬
  h += '<select onchange="CM_STATE.sortBy=this.value;renderCodeManageView()" style="padding:6px 10px;border:1px solid #E5E5EA;border-radius:8px;font-size:12px;outline:none;cursor:pointer">';
  h += '<option value="code"' + (CM_STATE.sortBy==='code'?' selected':'') + '>코드순</option>';
  h += '<option value="name"' + (CM_STATE.sortBy==='name'?' selected':'') + '>과정명순</option>';
  h += '<option value="types"' + (CM_STATE.sortBy==='types'?' selected':'') + '>템플릿수순</option>';
  h += '</select>';

  h += '<span style="font-size:12px;color:#8E8E93">' + filtered.length + '건</span>';

  // 코드 등록 버튼
  h += '<button onclick="_cmOpenCodePopup(\'add\')" style="padding:7px 14px;background:#0071E3;color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:500;cursor:pointer;white-space:nowrap;display:flex;align-items:center;gap:4px"><span style="font-size:14px;line-height:1">+</span> 코드 등록</button>';
  h += '</div></div>';

  // ── 테이블 ──
  h += '<div style="flex:1;overflow-y:auto">';
  h += '<table style="width:100%;border-collapse:collapse;font-size:13px;table-layout:fixed">';
  h += '<colgroup><col style="width:25%"><col style="width:33%"><col style="width:27%"><col style="width:15%"></colgroup>';
  h += '<thead><tr style="background:#FAFAFA;border-bottom:2px solid #E5E5EA;position:sticky;top:0;z-index:1">';
  h += '<th style="padding:10px 16px;text-align:left;font-weight:700;color:#48484A">메인 코드</th>';
  h += '<th style="padding:10px 12px;text-align:left;font-weight:700;color:#48484A">서브 코드</th>';
  h += '<th style="padding:10px 12px;text-align:left;font-weight:700;color:#48484A">등록 템플릿</th>';
  h += '<th style="padding:10px 12px;text-align:center;font-weight:700;color:#48484A">상태</th>';
  h += '</tr></thead><tbody>';

  if(pageItems.length === 0) {
    h += '<tr><td colspan="4" style="padding:40px;text-align:center;color:#8E8E93">검색 결과가 없습니다</td></tr>';
  }

  pageItems.forEach(function(entry) {
    var code = entry[0];
    var cData = SUBJECT_COURSE_DATA[code] || {courseName: _SUBJECT_NAME_MAP[code] || code, courses:1, sets:10};
    var regTypes = REGISTERED_WORK_TYPES[code] || [];
    var hasTypes = regTypes.length > 0;
    var isExpanded = CM_STATE.expandedCode === code;
    var bundleInfo = _cmGetBundleInfo(code);

    // 메인 행
    h += '<tr style="border-bottom:1px solid #F5F5F7;background:' + (isExpanded ? '#F0F9FF' : '#fff') + ';cursor:pointer;transition:background .1s" onclick="CM_STATE.expandedCode=(CM_STATE.expandedCode===\'' + code + '\'?null:\'' + code + '\');renderCodeManageView()" onmouseenter="this.style.background=\'' + (isExpanded ? '#E0F2FE' : '#FAFAFA') + '\'" onmouseleave="this.style.background=\'' + (isExpanded ? '#F0F9FF' : '#fff') + '\'">';

    // 메인 코드 (코드 + 과정명 + 학습관명을 한 셀에)
    var dnInfo = SUBJECT_DISPLAY_NAMES[code];
    h += '<td style="padding:10px 16px;vertical-align:top;overflow:hidden">';
    h += '<div style="display:flex;align-items:center;gap:8px">';
    h += '<span style="font-weight:600;color:#1D1D1F;font-family:\'SF Mono\',SFMono-Regular,Consolas,monospace;font-size:13px;background:#F5F5F7;padding:2px 8px;border-radius:4px;letter-spacing:.5px;flex-shrink:0">' + code + '</span>';
    h += '</div>';
    h += '<div style="margin-top:4px;font-size:13px;color:#2C2C2E;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + cData.courseName + '</div>';
    if(dnInfo && dnInfo.nhName) {
      h += '<div style="margin-top:3px;font-size:11px;color:#AF52DE;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="학습관: ' + dnInfo.nhName + '">학습관: ' + dnInfo.nhName + '</div>';
    }
    h += '</td>';

    // 서브 코드 (연결된 과목 코드 + 과정명, 줄바꿈)
    h += '<td style="padding:10px 12px;vertical-align:top;overflow:hidden">';
    if(bundleInfo.asHub.length > 0) {
      var hubLinked = bundleInfo.asHub[0].linkedSubjects;
      h += '<div style="display:flex;flex-direction:column;gap:4px">';
      hubLinked.forEach(function(s) {
        var sName = _SUBJECT_NAME_MAP[s] || s;
        h += '<div style="display:flex;align-items:center;gap:6px;font-size:12px">';
        h += '<span style="font-weight:700;color:#0369A1;font-family:\'SF Mono\',SFMono-Regular,Consolas,monospace;background:#E8F2FF;padding:1px 6px;border-radius:3px;flex-shrink:0">' + s + '</span>';
        h += '<span style="color:#48484A;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + sName + '</span>';
        h += '</div>';
      });
      h += '</div>';
    } else if(bundleInfo.asSpoke.length > 0) {
      var hubCode = bundleInfo.asSpoke[0].masterSubject;
      var hubName = _SUBJECT_NAME_MAP[hubCode] || hubCode;
      h += '<div style="display:flex;align-items:center;gap:6px;font-size:12px">';
      h += '<span style="color:#8E8E93;font-size:11px">←</span>';
      h += '<span style="font-weight:700;color:#0369A1;font-family:\'SF Mono\',SFMono-Regular,Consolas,monospace;background:#E8F2FF;padding:1px 6px;border-radius:3px">' + hubCode + '</span>';
      h += '<span style="color:#48484A">' + hubName + '</span>';
      h += '</div>';
    } else {
      h += '<span style="font-size:12px;color:#D1D1D6">—</span>';
    }
    h += '</td>';

    // 콘텐츠 유형 뱃지
    h += '<td style="padding:8px 12px;vertical-align:top;overflow:hidden">';
    if(hasTypes) {
      h += '<div style="display:flex;flex-wrap:wrap;gap:4px">';
      regTypes.forEach(function(rt, ri) {
        var sys = WC_SYSTEM_COLORS[rt.target || 'ND'] || WC_SYSTEM_COLORS.ND;
        h += '<span onclick="event.stopPropagation();openWorkTypeAttrPopup(\'' + code + '\',' + ri + ')" style="font-size:10px;padding:3px 8px;border-radius:4px;background:' + sys.bg + ';color:' + sys.color + ';font-weight:600;border:1px solid ' + sys.border + ';cursor:pointer;white-space:nowrap;line-height:1.3">' + rt.typeCode + ' ' + (sys.label || '') + '</span>';
      });
      h += '</div>';
    } else {
      h += '<span style="font-size:11px;color:#D1D1D6">—</span>';
    }
    h += '</td>';

    // 상태
    h += '<td style="padding:10px 12px;text-align:center;vertical-align:top">';
    if(hasTypes) {
      h += '<span style="font-size:10px;padding:3px 10px;border-radius:10px;background:#A8E6B8;color:#1B8A3E;font-weight:700">등록됨</span>';
    } else {
      h += '<span style="font-size:10px;padding:3px 10px;border-radius:10px;background:#FFF8F0;color:#B35C00;font-weight:700">미등록</span>';
    }
    h += '</td>';

    h += '</tr>';

    // 확장 행 (디테일 패널)
    if(isExpanded) {
      h += '<tr style="background:#F0F9FF;border-bottom:2px solid #E8F2FF">';
      h += '<td colspan="4" style="padding:16px 24px">';

      // 묶음 연결 정보
      h += '<div style="margin-bottom:20px">';
      h += '<div style="font-size:12px;font-weight:700;color:#1D1D1F;margin-bottom:8px">묶음 연결 정보</div>';
      if(bundleInfo.asHub.length > 0) {
        var hub = bundleInfo.asHub[0];
        h += '<div style="font-size:12px;color:#2C2C2E;padding:8px 12px;background:#fff;border-radius:6px;border:1px solid #E8F2FF">';
        h += '<span style="font-weight:600">' + code + '</span> → ';
        var hubLinks = hub.linkedSubjects.map(function(s) { return '<span style="font-weight:600;color:#0369A1">' + s + '</span>'; }).join(', ');
        h += hubLinks;
        h += '</div>';
      } else if(bundleInfo.asSpoke.length > 0) {
        var spoke = bundleInfo.asSpoke[0];
        var spokeHub = spoke.masterSubject;
        h += '<div style="font-size:12px;color:#2C2C2E;padding:8px 12px;background:#fff;border-radius:6px;border:1px solid #E8F2FF">';
        h += '<span style="font-weight:600">' + code + '</span> ← <span style="font-weight:600;color:#0369A1">' + spokeHub + '</span>에 연결됨';
        h += '</div>';
      } else {
        h += '<div style="font-size:12px;color:#8E8E93;padding:8px 12px">독립 코드 (묶음 없음)</div>';
      }
      h += '</div>';

      // 등록 템플릿 상세 (Depth 구조 + 분할 정보)
      h += '<div style="margin-bottom:20px">';
      h += '<div style="font-size:12px;font-weight:700;color:#1D1D1F;margin-bottom:8px">\uB4F1\uB85D \uD15C\uD50C\uB9BF \uC0C1\uC138</div>';
      if(regTypes.length > 0) {
        h += '<div style="display:flex;flex-direction:column;gap:8px">';
        regTypes.forEach(function(rt, ri) {
          var sys = WC_SYSTEM_COLORS[rt.target || 'ND'] || WC_SYSTEM_COLORS.ND;
          var depthInfo = _wcGetLinkedDepth(rt);
          var _cmLabel = _getTypeLabel(rt.typeCode);
          var _cmSN = _getStructureName(rt.ltTypeId);
          var _curSrc = rt.currSrc || 'origin';
          var _csrcMap2 = {origin:{l:'\uC6D0\uBCF8',bg:'#E8F2FF',c:'#0055B8'},remix:{l:'\uC7AC\uAD6C\uC131',bg:'#FFF8F0',c:'#B35C00'},create:{l:'\uC790\uCCB4',bg:'#F9F0FF',c:'#8944AB'}};
          var _cs2 = _csrcMap2[_curSrc] || _csrcMap2.origin;

          h += '<div style="background:#fff;border-radius:8px;border:1px solid #E5E5EA;overflow:hidden">';
          // 헤더
          h += '<div style="display:flex;align-items:center;gap:6px;padding:8px 12px;border-bottom:1px solid #F5F5F7">';
          h += '<span style="padding:2px 8px;border-radius:4px;background:' + sys.bg + ';color:' + sys.color + ';font-weight:700;font-size:11px;border:1px solid ' + sys.border + '">' + sys.label + '</span>';
          h += '<span style="font-weight:700;font-size:12px;color:#1D1D1F">' + _cmLabel + '</span>';
          if(_cmSN) h += '<span style="color:#636366;font-size:11px">' + _cmSN + '</span>';
          h += '<span style="font-size:9px;padding:1px 5px;border-radius:3px;background:' + _cs2.bg + ';color:' + _cs2.c + ';font-weight:700">' + _cs2.l + '</span>';
          h += '</div>';
          // Depth 구조 + 분할 정보 바디
          h += '<div style="padding:8px 12px">';
          if(depthInfo && depthInfo.depthNames.length > 0) {
            h += '<div style="display:flex;align-items:center;gap:4px;margin-bottom:6px;flex-wrap:wrap">';
            h += '<span style="font-size:10px;font-weight:700;color:#0369A1">' + depthInfo.depthCount + '\uB2E8\uACC4:</span>';
            depthInfo.depthNames.forEach(function(dn, di) {
              if(di > 0) h += '<span style="font-size:9px;color:#8E8E93">\u203A</span>';
              h += '<span style="font-size:10px;padding:1px 6px;border-radius:3px;background:#F0F9FF;color:#0369A1;font-weight:600;border:1px solid #BAE6FD">' + dn + '</span>';
            });
            h += '</div>';
          }
          // 분할 현황
          var hasRanges = rt.setRanges && rt.setRanges.length > 0;
          var hasCurr = rt.customCurriculum && rt.customCurriculum.groups && rt.customCurriculum.groups.length > 0;
          if(hasRanges) {
            var _splitName3 = (depthInfo && depthInfo.depthNames[rt.splitDepth || 0]) || '\uC138\uD2B8';
            var _totalA = 0;
            rt.setRanges.forEach(function(r){ _totalA += (r.to - r.from + 1); });
            var rangeColors = ['#0071E3','#10B981','#FF9500','#FF3B30','#AF52DE','#EC4899','#14B8A6','#F97316'];
            // 시각화 바
            h += '<div style="display:flex;gap:1px;height:5px;border-radius:3px;overflow:hidden;margin-bottom:6px;background:#E5E5EA">';
            rt.setRanges.forEach(function(r, ri2) {
              var pct = ((r.to - r.from + 1) / _totalA * 100);
              h += '<div style="width:' + pct + '%;background:' + rangeColors[ri2 % rangeColors.length] + '" title="' + _splitName3 + ' ' + r.from + '~' + r.to + ' (' + r.assignee + ')"></div>';
            });
            h += '</div>';
            // 범위 목록
            h += '<div style="display:flex;flex-wrap:wrap;gap:4px">';
            rt.setRanges.forEach(function(r, ri2) {
              var rColor = rangeColors[ri2 % rangeColors.length];
              h += '<div style="display:flex;align-items:center;gap:4px;font-size:10px;padding:2px 6px;background:#FAFAFA;border-radius:4px;border:1px solid #E5E5EA">';
              h += '<span style="width:6px;height:6px;border-radius:2px;background:' + rColor + ';flex-shrink:0"></span>';
              h += '<span style="color:#48484A;font-weight:600">' + _splitName3 + ' ' + r.from + '~' + r.to + '</span>';
              h += '<span style="color:#8E8E93">(' + (r.to - r.from + 1) + '\uAC1C)</span>';
              h += '<span style="color:#636366;font-weight:600">' + r.assignee + '</span>';
              h += '</div>';
            });
            h += '</div>';
            h += '<div style="margin-top:4px;font-size:9px;color:#34C759;font-weight:600">\u2713 \uC804\uCCB4 ' + _totalA + ' ' + _splitName3 + ' \u00B7 ' + rt.setRanges.length + '\uBD84\uD560 \uD560\uB2F9</div>';
          } else if(hasCurr) {
            var _cc3 = rt.customCurriculum;
            var _totalU3 = 0;
            _cc3.groups.forEach(function(g){ _totalU3 += g.units.length; });
            h += '<div style="display:flex;flex-wrap:wrap;gap:4px">';
            _cc3.groups.forEach(function(g, gi) {
              h += '<div style="font-size:10px;padding:2px 6px;background:#FAFAFA;border-radius:4px;border:1px solid #E5E5EA;display:flex;align-items:center;gap:3px">';
              h += '<span style="color:#48484A;font-weight:600">' + g.name + '</span>';
              h += '<span style="color:#8E8E93">(' + g.units.length + (_cc3.unitName || '\uAC1C') + ')</span>';
              if(g.assignee) h += '<span style="color:#636366;font-weight:600">' + g.assignee + '</span>';
              h += '</div>';
            });
            h += '</div>';
            h += '<div style="margin-top:4px;font-size:9px;color:#34C759;font-weight:600">\u2713 ' + _cc3.groups.length + '\uADF8\uB8F9 \u00B7 \uCD1D ' + _totalU3 + ' ' + (_cc3.unitName || '\uB2E8\uC704') + '</div>';
          } else {
            h += '<div style="font-size:10px;color:#8E8E93">\uBD84\uD560 \uBBF8\uC124\uC815</div>';
          }
          h += '</div></div>';
        });
        h += '</div>';
      } else {
        h += '<div style="font-size:12px;color:#8E8E93">\uB4F1\uB85D\uB41C \uD15C\uD50C\uB9BF \uC5C6\uC74C</div>';
      }
      h += '</div>';

      // 연계 시스템
      h += '<div style="margin-bottom:20px">';
      h += '<div style="font-size:12px;font-weight:700;color:#1D1D1F;margin-bottom:8px">연계 시스템</div>';
      var linkedSys = [];
      bundleInfo.asHub.forEach(function(b) {
        linkedSys = linkedSys.concat(b.linkedSystems || []);
      });
      bundleInfo.asSpoke.forEach(function(b) {
        linkedSys = linkedSys.concat(b.linkedSystems || []);
      });
      linkedSys = linkedSys.filter(function(v, i, a) { return a.indexOf(v) === i; });
      if(linkedSys.length > 0) {
        h += '<div style="display:flex;flex-wrap:wrap;gap:6px">';
        linkedSys.forEach(function(sys) {
          h += '<span style="font-size:11px;padding:4px 10px;border-radius:4px;background:#F5F5F7;color:#48484A;font-weight:600;border:1px solid #E5E5EA">' + sys + '</span>';
        });
        h += '</div>';
      } else {
        h += '<div style="font-size:12px;color:#8E8E93">연계 시스템 없음</div>';
      }
      h += '</div>';

      // 학습관 별칭
      var _dn = SUBJECT_DISPLAY_NAMES[code];
      h += '<div style="margin-bottom:20px">';
      h += '<div style="font-size:12px;font-weight:700;color:#1D1D1F;margin-bottom:8px">학습관 서비스명</div>';
      if(_dn && _dn.nhName) {
        h += '<div style="padding:8px 12px;background:#F9F0FF;border-radius:6px;border:1px solid #D9B3F0;font-size:12px">';
        h += '<span style="color:#AF52DE;font-weight:700">' + _dn.nhName + '</span>';
        if(_dn.note) { h += '<span style="color:#AF52DE;margin-left:8px">(' + _dn.note + ')</span>'; }
        h += '</div>';
      } else {
        h += '<div style="font-size:12px;color:#8E8E93;padding:8px 12px">CMS 과정명과 동일 (별도 학습관명 미설정)</div>';
      }
      h += '</div>';

      // 관리 액션
      h += '<div>';
      h += '<div style="font-size:12px;font-weight:700;color:#1D1D1F;margin-bottom:8px">관리 액션</div>';
      h += '<div style="display:flex;gap:6px">';
      if(bundleInfo.asHub.length > 0 || bundleInfo.asSpoke.length === 0) {
        h += '<button onclick="event.stopPropagation();alert(\'[개발예정] 묶음 생성 기능\')" style="padding:6px 12px;border:1px solid #0071E3;border-radius:6px;background:#E8F2FF;color:#0071E3;font-size:12px;font-weight:600;cursor:pointer">묶음 생성</button>';
      }
      if(bundleInfo.asSpoke.length > 0) {
        h += '<button onclick="event.stopPropagation();alert(\'[개발예정] 묶음 해제 기능\')" style="padding:6px 12px;border:1px solid #FF3B30;border-radius:6px;background:#FFF2F1;color:#FF3B30;font-size:12px;font-weight:600;cursor:pointer">묶음 해제</button>';
      }
      h += '<button onclick="event.stopPropagation();openWorkTypeRegisterPopup(\'' + code + '\')" style="padding:6px 12px;border:1px solid #34C759;border-radius:6px;background:#F0FFF4;color:#34C759;font-size:12px;font-weight:600;cursor:pointer">+ 템플릿 등록</button>';
      h += '<button onclick="event.stopPropagation();_cmOpenCodePopup(\'edit\',\'' + code + '\')" style="padding:6px 12px;border:1px solid #636366;border-radius:6px;background:#FAFAFA;color:#48484A;font-size:12px;font-weight:600;cursor:pointer">코드 편집</button>';
      h += '</div>';
      h += '</div>';

      h += '</td>';
      h += '</tr>';
    }
  });

  h += '</tbody></table></div>';

  // ── 페이징 ──
  h += '<div style="padding:10px 24px;border-top:1px solid #E5E5EA;background:#fff;display:flex;align-items:center;justify-content:center;gap:6px;flex-shrink:0">';
  h += '<button onclick="CM_STATE.page=Math.max(1,CM_STATE.page-1);renderCodeManageView()" ' + (CM_STATE.page <= 1 ? 'disabled' : '') + ' style="padding:5px 12px;border:1px solid #E5E5EA;border-radius:6px;font-size:12px;cursor:pointer;background:#fff;color:' + (CM_STATE.page <= 1 ? '#D1D1D6' : '#48484A') + '">이전</button>';
  h += '<span style="font-size:12px;color:#636366;padding:0 8px">' + CM_STATE.page + ' / ' + totalPages + '</span>';
  h += '<button onclick="CM_STATE.page=Math.min(' + totalPages + ',CM_STATE.page+1);renderCodeManageView()" ' + (CM_STATE.page >= totalPages ? 'disabled' : '') + ' style="padding:5px 12px;border:1px solid #E5E5EA;border-radius:6px;font-size:12px;cursor:pointer;background:#fff;color:' + (CM_STATE.page >= totalPages ? '#D1D1D6' : '#48484A') + '">다음</button>';
  h += '</div>';

  h += '</div>';
  root.innerHTML = h;
}

// ─── Helper Functions for Code Manage View ───
function _cmGetBundleInfo(code) {
  var asHub = CONTENT_BUNDLES.filter(function(b) { return b.masterSubject === code; });
  var asSpoke = CONTENT_BUNDLES.filter(function(b) { return b.linkedSubjects.indexOf(code) >= 0; });
  return { asHub: asHub, asSpoke: asSpoke };
}

function _cmCountBundledCodes() {
  var bundledCodes = {};
  CONTENT_BUNDLES.forEach(function(b) {
    bundledCodes[b.masterSubject] = true;
    b.linkedSubjects.forEach(function(s) { bundledCodes[s] = true; });
  });
  return Object.keys(bundledCodes).length;
}

// ═══════════════════════════════════════════════
//  ■ 콘텐츠 유형 관리 뷰
// ═══════════════════════════════════════════════

// ═══ DB 필드 카탈로그 (시스템 관리자/개발자가 사전 정의) ═══
// 콘텐츠 유형에서 속성 추가 시 이 카탈로그에서 선택
// 새로운 필드가 필요하면 개발자 협의 후 여기에 추가
var DB_FIELD_CATALOG = [
  // ── 파일 관련 ──
  {key:'answer_file',   label:'정답 파일',         type:'file',   category:'파일', desc:'정답지 파일 업로드'},
  {key:'content_file',  label:'콘텐츠 파일',       type:'file',   category:'파일', desc:'메인 콘텐츠 파일 업로드'},
  {key:'content_zip',   label:'콘텐츠 파일(ZIP)',   type:'file',   category:'파일', desc:'ZIP 패키지 콘텐츠'},
  {key:'video_file',    label:'영상 파일',         type:'file',   category:'파일', desc:'학습 영상 파일'},
  {key:'thumbnail',     label:'미리보기 이미지',    type:'file',   category:'파일', desc:'대표 이미지 / 썸네일'},
  {key:'subtitle_file', label:'자막 파일',         type:'file',   category:'파일', desc:'영상 자막(SRT, VTT 등)'},
  {key:'question_file', label:'문제 파일',         type:'file',   category:'파일', desc:'평가 문제 파일'},
  // ── 학습 구조 ──
  {key:'day_number',    label:'학습일 번호',       type:'number', category:'학습 구조', desc:'Day 번호 (학습 진도)'},
  {key:'seq',           label:'순번',             type:'number', category:'학습 구조', desc:'정렬/배치 순번'},
  {key:'duration',      label:'재생 시간(초)',     type:'number', category:'학습 구조', desc:'콘텐츠 재생 시간'},
  {key:'time_limit',    label:'제한 시간(초)',     type:'number', category:'학습 구조', desc:'평가/활동 제한 시간'},
  // ── 분류/구분 ──
  {key:'detail_type',   label:'유형 구분',         type:'select', category:'분류', desc:'세부 유형 분류', options:['일반','특별']},
  {key:'difficulty',    label:'난이도',            type:'select', category:'분류', desc:'콘텐츠 난이도', options:['상','중','하']},
  {key:'file_format',   label:'파일 형식',         type:'select', category:'분류', desc:'제작 파일 형식', options:['SWF','HTML5','MP4','PDF']},
  {key:'resolution',    label:'화질',             type:'select', category:'분류', desc:'영상 화질', options:['720p','1080p','4K']},
  // ── 텍스트/경로 ──
  {key:'entry_url',     label:'시작 페이지 경로',   type:'text',   category:'경로/텍스트', desc:'웹 콘텐츠 진입점 URL'},
  {key:'answer_text',   label:'정답',             type:'text',   category:'경로/텍스트', desc:'정답 텍스트'},
  {key:'memo',          label:'비고',             type:'text',   category:'경로/텍스트', desc:'관리 메모, 비고'},
];

// ═══════════════════════════════════════════════════════
// ■ LT_FIELD_POOL: 필드 풀 (속성 + 양식 양쪽에서 참조)
// DB_FIELD_CATALOG 를 기반으로 카테고리별 정리 + 확장 필드
// ═══════════════════════════════════════════════════════
var LT_FIELD_POOL = [
  // ── 파일 관련 ──
  {key:'answer_file',   label:'\uC815\uB2F5 \uD30C\uC77C',         type:'file',   category:'\uD30C\uC77C', desc:'\uC815\uB2F5\uC9C0 \uD30C\uC77C \uC5C5\uB85C\uB4DC'},
  {key:'content_file',  label:'\uCF58\uD150\uCE20 \uD30C\uC77C',       type:'file',   category:'\uD30C\uC77C', desc:'\uBA54\uC778 \uCF58\uD150\uCE20 \uD30C\uC77C'},
  {key:'content_zip',   label:'\uCF58\uD150\uCE20 \uD30C\uC77C(ZIP)',   type:'file',   category:'\uD30C\uC77C', desc:'ZIP \uD328\uD0A4\uC9C0 \uCF58\uD150\uCE20'},
  {key:'video_file',    label:'\uC601\uC0C1 \uD30C\uC77C',         type:'file',   category:'\uD30C\uC77C', desc:'\uD559\uC2B5 \uC601\uC0C1 \uD30C\uC77C'},
  {key:'thumbnail',     label:'\uBBF8\uB9AC\uBCF4\uAE30 \uC774\uBBF8\uC9C0',    type:'file',   category:'\uD30C\uC77C', desc:'\uB300\uD45C \uC774\uBBF8\uC9C0 / \uC378\uB124\uC77C'},
  {key:'subtitle_file', label:'\uC790\uB9C9 \uD30C\uC77C',         type:'file',   category:'\uD30C\uC77C', desc:'\uC601\uC0C1 \uC790\uB9C9(SRT, VTT)'},
  {key:'question_file', label:'\uBB38\uC81C \uD30C\uC77C',         type:'file',   category:'\uD30C\uC77C', desc:'\uD3C9\uAC00 \uBB38\uC81C \uD30C\uC77C'},
  {key:'audio_file',    label:'\uC624\uB514\uC624 \uD30C\uC77C',       type:'file',   category:'\uD30C\uC77C', desc:'\uC74C\uC131/\uC624\uB514\uC624 \uCF58\uD150\uCE20'},
  // ── 학습 구조 ──
  {key:'day_number',    label:'\uD559\uC2B5\uC77C \uBC88\uD638',       type:'number', category:'\uD559\uC2B5 \uAD6C\uC870', desc:'Day \uBC88\uD638 (\uD559\uC2B5 \uC9C4\uB3C4)'},
  {key:'seq',           label:'\uC21C\uBC88',             type:'number', category:'\uD559\uC2B5 \uAD6C\uC870', desc:'\uC815\uB82C/\uBC30\uCE58 \uC21C\uBC88'},
  {key:'duration',      label:'\uC7AC\uC0DD \uC2DC\uAC04(\uCD08)',     type:'number', category:'\uD559\uC2B5 \uAD6C\uC870', desc:'\uCF58\uD150\uCE20 \uC7AC\uC0DD \uC2DC\uAC04'},
  {key:'time_limit',    label:'\uC81C\uD55C \uC2DC\uAC04(\uCD08)',     type:'number', category:'\uD559\uC2B5 \uAD6C\uC870', desc:'\uD3C9\uAC00/\uD65C\uB3D9 \uC81C\uD55C \uC2DC\uAC04'},
  {key:'page',          label:'\uD398\uC774\uC9C0',           type:'text',   category:'\uD559\uC2B5 \uAD6C\uC870', desc:'\uD398\uC774\uC9C0 \uBC88\uD638'},
  // ── 문항 구조 ──
  {key:'mainQ',         label:'\uB300\uBB38\uD56D',           type:'text',   category:'\uBB38\uD56D \uAD6C\uC870', desc:'\uB300\uBB38\uD56D \uBC88\uD638'},
  {key:'subQ',          label:'\uC18C\uBB38\uD56D',           type:'text',   category:'\uBB38\uD56D \uAD6C\uC870', desc:'\uC18C\uBB38\uD56D \uBC88\uD638'},
  {key:'contentType',   label:'\uCE74\uD14C\uACE0\uB9AC \uAD6C\uBD84',     type:'select', category:'\uBB38\uD56D \uAD6C\uC870', desc:'\uD574\uB2F5/\uBB38\uC81C/\uD3C9\uAC00 \uAD6C\uBD84', options:['\uD574\uB2F5','\uBB38\uC81C','\uD3C9\uAC00']},
  {key:'answerForm',    label:'\uD574\uB2F5 \uD615\uD0DC',       type:'select', category:'\uBB38\uD56D \uAD6C\uC870', desc:'\uD14D\uC2A4\uD2B8/\uC774\uBBF8\uC9C0/\uD63C\uD569', options:['\uD14D\uC2A4\uD2B8','\uC774\uBBF8\uC9C0','\uD63C\uD569']},
  {key:'answer',        label:'\uD574\uB2F5 \uB0B4\uC6A9',       type:'textarea',category:'\uBB38\uD56D \uAD6C\uC870', desc:'\uC815\uB2F5 \uD14D\uC2A4\uD2B8'},
  {key:'explain',       label:'\uD574\uC124 \uB0B4\uC6A9',       type:'textarea',category:'\uBB38\uD56D \uAD6C\uC870', desc:'\uD574\uC124 \uD14D\uC2A4\uD2B8'},
  // ── 분류/구분 ──
  {key:'detail_type',   label:'\uC720\uD615 \uAD6C\uBD84',         type:'select', category:'\uBD84\uB958', desc:'\uC138\uBD80 \uC720\uD615 \uBD84\uB958', options:['\uC77C\uBC18','\uD2B9\uBCC4']},
  {key:'difficulty',    label:'\uB09C\uC774\uB3C4',            type:'select', category:'\uBD84\uB958', desc:'\uCF58\uD150\uCE20 \uB09C\uC774\uB3C4', options:['\uC0C1','\uC911','\uD558']},
  {key:'scoring',       label:'\uCC44\uC810 \uC5EC\uBD80',       type:'select', category:'\uBD84\uB958', desc:'\uCC44\uC810 \uC874\uC7AC \uC5EC\uBD80', options:['\uCC44\uC810\uC788\uC74C','\uCC44\uC810\uC5C6\uC74C']},
  {key:'area',          label:'\uC601\uC5ED',             type:'select', category:'\uBD84\uB958', desc:'\uD559\uC2B5 \uC601\uC5ED \uAD6C\uBD84', options:['\uC77D\uAE30','\uC4F0\uAE30','\uB4E3\uAE30','\uB9D0\uD558\uAE30']},
  {key:'day',           label:'\uC77C\uCC28',             type:'text',   category:'\uBD84\uB958', desc:'\uC77C\uCC28 \uAD6C\uBD84'},
  {key:'file_format',   label:'\uD30C\uC77C \uD615\uC2DD',         type:'select', category:'\uBD84\uB958', desc:'\uC81C\uC791 \uD30C\uC77C \uD615\uC2DD', options:['SWF','HTML5','MP4','PDF']},
  {key:'resolution',    label:'\uD654\uC9C8',             type:'select', category:'\uBD84\uB958', desc:'\uC601\uC0C1 \uD654\uC9C8', options:['720p','1080p','4K']},
  // ── 영상강의 전용 ──
  {key:'contentName',   label:'\uCF58\uD150\uCE20\uBA85',         type:'text',   category:'\uC601\uC0C1\uAC15\uC758', desc:'\uCF58\uD150\uCE20 \uC81C\uBAA9'},
  {key:'title',         label:'\uC601\uC0C1 \uC81C\uBAA9',       type:'text',   category:'\uC601\uC0C1\uAC15\uC758', desc:'\uC601\uC0C1 \uC81C\uBAA9'},
  {key:'description',   label:'\uAC15\uC758 \uC124\uBA85',       type:'textarea',category:'\uC601\uC0C1\uAC15\uC758', desc:'\uAC15\uC758 \uC124\uBA85 \uD14D\uC2A4\uD2B8'},
  {key:'drmType',       label:'DRM \uC720\uD615',       type:'select', category:'\uC601\uC0C1\uAC15\uC758', desc:'DRM \uBCF4\uD638 \uC720\uD615', options:['Pallycon','Widevine','None']},
  {key:'serviceType',   label:'\uC11C\uBE44\uC2A4 \uAD6C\uBD84',     type:'select', category:'\uC601\uC0C1\uAC15\uC758', desc:'\uC11C\uBE44\uC2A4 \uAD6C\uBD84', options:['\uBB34\uB8CC','\uC720\uB8CC','\uCCB4\uD5D8\uD310']},
  {key:'fileName',      label:'\uD30C\uC77C\uBA85',           type:'text',   category:'\uC601\uC0C1\uAC15\uC758', desc:'\uD30C\uC77C\uBA85 (\uC790\uB3D9)'},
  {key:'contentLength', label:'\uC7AC\uC0DD\uC2DC\uAC04',         type:'text',   category:'\uC601\uC0C1\uAC15\uC758', desc:'\uC7AC\uC0DD \uC2DC\uAC04'},
  {key:'fileSize',      label:'\uD30C\uC77C\uD06C\uAE30',         type:'text',   category:'\uC601\uC0C1\uAC15\uC758', desc:'\uD30C\uC77C \uD06C\uAE30'},
  // ── 경로/텍스트 ──
  {key:'entry_url',     label:'\uC2DC\uC791 \uD398\uC774\uC9C0 \uACBD\uB85C',   type:'text',   category:'\uACBD\uB85C/\uD14D\uC2A4\uD2B8', desc:'\uC6F9 \uCF58\uD150\uCE20 \uC9C4\uC785\uC810 URL'},
  {key:'answer_text',   label:'\uC815\uB2F5',             type:'text',   category:'\uACBD\uB85C/\uD14D\uC2A4\uD2B8', desc:'\uC815\uB2F5 \uD14D\uC2A4\uD2B8'},
  {key:'memo',          label:'\uBE44\uACE0',             type:'text',   category:'\uACBD\uB85C/\uD14D\uC2A4\uD2B8', desc:'\uAD00\uB9AC \uBA54\uBAA8'},
  // ── 플래시카드 ──
  {key:'front',         label:'\uC55E\uBA74 \uB0B4\uC6A9',       type:'textarea',category:'\uD50C\uB798\uC2DC\uCE74\uB4DC', desc:'\uCE74\uB4DC \uC55E\uBA74'},
  {key:'back',          label:'\uB4B7\uBA74 \uB0B4\uC6A9',       type:'textarea',category:'\uD50C\uB798\uC2DC\uCE74\uB4DC', desc:'\uCE74\uB4DC \uB4B7\uBA74'},
  {key:'image',         label:'\uC774\uBBF8\uC9C0 \uD30C\uC77C',     type:'file',   category:'\uD50C\uB798\uC2DC\uCE74\uB4DC', desc:'\uCE74\uB4DC \uC774\uBBF8\uC9C0'},
  {key:'category',      label:'\uCE74\uD14C\uACE0\uB9AC',         type:'select', category:'\uD50C\uB798\uC2DC\uCE74\uB4DC', desc:'\uCE74\uB4DC \uBD84\uB958', options:['\uB2E8\uC5B4','\uBB38\uC7A5','\uBB38\uBC95']},
  // ── 핵심점검 ──
  {key:'section',       label:'\uC139\uC158',             type:'text',   category:'\uD575\uC2EC\uC810\uAC80', desc:'\uC139\uC158 \uAD6C\uBD84'},
  {key:'content',       label:'\uBCF8\uBB38',             type:'textarea',category:'\uD575\uC2EC\uC810\uAC80', desc:'\uBCF8\uBB38 \uCF58\uD150\uCE20'},
  {key:'keyword',       label:'\uD575\uC2EC\uC5B4',           type:'text',   category:'\uD575\uC2EC\uC810\uAC80', desc:'\uD575\uC2EC \uD0A4\uC6CC\uB4DC'},
  {key:'importance',    label:'\uC911\uC694\uB3C4',            type:'select', category:'\uD575\uC2EC\uC810\uAC80', desc:'\uCF58\uD150\uCE20 \uC911\uC694\uB3C4', options:['\uC0C1','\uC911','\uD558']},
];

// LT_FIELD_POOL 카테고리 목록 추출
function _ltGetFieldCategories() {
  var cats = [];
  LT_FIELD_POOL.forEach(function(f) {
    if(cats.indexOf(f.category) < 0) cats.push(f.category);
  });
  return cats;
}

var LT_STATE = {
  types: [
    // \u2500\u2500 ANS (\uC815\uB2F5\u00B7\uD574\uC124) \u2500\u2500
    {id:'LT-ANS-ND', targetSystems:['ND'], name:'\uC815\uB2F5\u00B7\uD574\uC124 (\uB274\uB4DC\uB9BC\uC2A4)', typeCode:'ANS',
      desc:'\uB274\uB4DC\uB9BC\uC2A4 \uC11C\uBE44\uC2A4\uC6A9 \uC815\uB2F5 \uBC0F \uD574\uC124 \uCF58\uD150\uCE20 (DB\uD615)', color:'#0071E3',
      subject:'수학', grade:'전학년', curriculum:'2022 개정',
      depths:[
        {id:'d1',name:'\uCEE4\uB9AC\uD058\uB7FC\uBA85',subName:'\uCEE4\uB9AC\uD058\uB7FC \uB2E8\uC704',groupCount:1,fields:['detail_type'],children:[
          {id:'d1-1',name:'\uACFC\uC815',subName:'\uD559\uAE30\uBCC4 \uACFC\uC815',groupCount:8,fields:['seq'],children:[
            {id:'d1-1-1',name:'\uC138\uD2B8',subName:'\uC6D4\uBCC4 \uC138\uD2B8',groupCount:80,fields:['day_number'],children:[
              {id:'d1-1-1-1',name:'\uD559\uC2B5\uC77C',subName:'\uC77C\uBCC4 \uD559\uC2B5',groupCount:400,fields:['answer_file','answer_text','memo'],children:[]}
            ]}
          ]}
        ]}
      ],
      attrs:[
        {key:'answer_file',label:'정답 파일',required:true,type:'file'},
        {key:'detail_type',label:'유형 구분',required:true,type:'select',options:['일반','특별']},
        {key:'day_number',label:'학습일 번호',required:true,type:'number'},
        {key:'seq',label:'순번',required:false,type:'number'},
        {key:'memo',label:'비고',required:false,type:'text'},
      ]},
    {id:'LT-ANS-NH', targetSystems:['NH'], name:'\uC815\uB2F5\u00B7\uD574\uC124 (\uD559\uC2B5\uAD00)', typeCode:'ANS',
      desc:'\uD559\uC2B5\uAD00 \uC11C\uBE44\uC2A4\uC6A9 \uC815\uB2F5 \uBC0F \uD574\uC124 \uCF58\uD150\uCE20 (DB\uD615)', color:'#AF52DE',
      subject:'수학', grade:'전학년', curriculum:'2022 개정',
      depths:[
        {id:'d2',name:'\uCEE4\uB9AC\uD058\uB7FC\uBA85',subName:'\uCEE4\uB9AC\uD058\uB7FC \uB2E8\uC704',groupCount:1,fields:['detail_type'],children:[
          {id:'d2-1',name:'\uACFC\uC815',subName:'\uD559\uAE30\uBCC4',groupCount:8,fields:['seq'],children:[
            {id:'d2-1-1',name:'\uC138\uD2B8',subName:'\uC6D4\uBCC4',groupCount:80,fields:['day_number'],children:[
              {id:'d2-1-1-1',name:'\uD559\uC2B5\uC77C',subName:'\uC77C\uBCC4',groupCount:400,fields:['answer_file','answer_text','memo'],children:[]}
            ]}
          ]}
        ]}
      ],
      attrs:[
        {key:'answer_file',label:'정답 파일',required:true,type:'file'},
        {key:'detail_type',label:'유형 구분',required:true,type:'select',options:['일반','특별']},
        {key:'day_number',label:'학습일 번호',required:true,type:'number'},
        {key:'seq',label:'순번',required:false,type:'number'},
        {key:'memo',label:'비고',required:false,type:'text'},
      ]},
    // \u2500\u2500 AN2 (\uC790\uB3D9\uCC44\uC810) \u2500\u2500
    {id:'LT-AN2-ND', targetSystems:['ND'], name:'\uC790\uB3D9\uCC44\uC810 (\uB274\uB4DC\uB9BC\uC2A4)', typeCode:'AN2',
      desc:'\uB274\uB4DC\uB9BC\uC2A4 \uC11C\uBE44\uC2A4\uC6A9 \uC790\uB3D9\uCC44\uC810 \uB370\uC774\uD130 (DB\uD615)', color:'#0055B8',
      subject:'영어', grade:'전학년', curriculum:'2022 개정',
      depths:[
        {id:'d3',name:'\uCEE4\uB9AC\uD058\uB7FC\uBA85',groupCount:1,children:[
          {id:'d3-1',name:'\uACFC\uC815',groupCount:6,children:[
            {id:'d3-1-1',name:'\uC138\uD2B8',groupCount:60,children:[
              {id:'d3-1-1-1',name:'\uD559\uC2B5\uC77C',groupCount:300,children:[]}
            ]}
          ]}
        ]}
      ],
      attrs:[
        {key:'answer_file',label:'\uC815\uB2F5 \uD30C\uC77C',required:true,type:'file'},
        {key:'detail_type',label:'\uC720\uD615 \uAD6C\uBD84',required:true,type:'select',options:['\uC77C\uBC18','\uD2B9\uBCC4']},
        {key:'day_number',label:'\uD559\uC2B5\uC77C \uBC88\uD638',required:true,type:'number'},
        {key:'seq',label:'\uC21C\uBC88',required:false,type:'number'},
        {key:'memo',label:'\uBE44\uACE0',required:false,type:'text'},
      ]},
    {id:'LT-AN2-SJ', targetSystems:['SJ'], name:'\uC790\uB3D9\uCC44\uC810 (\uC131\uC7A5\uD310)', typeCode:'AN2',
      desc:'\uC131\uC7A5\uD310 \uC11C\uBE44\uC2A4\uC6A9 \uC790\uB3D9\uCC44\uC810 \uB370\uC774\uD130 (DB\uD615)', color:'#1B8A3E',
      subject:'\uC218\uD559', grade:'\uC804\uD559\uB144', curriculum:'2022 \uAC1C\uC815',
      depths:[
        {id:'d3b',name:'\uCEE4\uB9AC\uD058\uB7FC\uBA85',groupCount:1,children:[
          {id:'d3b-1',name:'\uACFC\uC815',groupCount:4,children:[
            {id:'d3b-1-1',name:'\uC138\uD2B8',groupCount:40,children:[
              {id:'d3b-1-1-1',name:'\uD559\uC2B5\uC77C',groupCount:200,children:[]}
            ]}
          ]}
        ]}
      ],
      attrs:[
        {key:'answer_file',label:'정답 파일',required:true,type:'file'},
        {key:'detail_type',label:'유형 구분',required:true,type:'select',options:['일반','특별']},
        {key:'day_number',label:'학습일 번호',required:true,type:'number'},
        {key:'seq',label:'순번',required:false,type:'number'},
        {key:'memo',label:'비고',required:false,type:'text'},
      ]},
    // \u2500\u2500 FLC (\uD50C\uB798\uC2DC\uCE74\uB4DC) \u2500\u2500
    {id:'LT-FLC-ND', targetSystems:['ND'], name:'\uD50C\uB798\uC2DC\uCE74\uB4DC (\uB274\uB4DC\uB9BC\uC2A4)', typeCode:'FLC',
      desc:'\uB274\uB4DC\uB9BC\uC2A4 \uC11C\uBE44\uC2A4\uC6A9 \uC778\uD130\uB799\uD2F0\uBE0C \uD559\uC2B5 \uCE74\uB4DC (FILE\uD615)', color:'#0891B2',
      subject:'영어', grade:'초등 3~4', curriculum:'2022 개정',
      depths:[
        {id:'d4',name:'커리큘럼명',groupCount:1,children:[
          {id:'d4-1',name:'과정',groupCount:6,children:[
            {id:'d4-1-1',name:'세트',groupCount:60,children:[]}
          ]}
        ]}
      ],
      attrs:[
        {key:'content_file',label:'콘텐츠 파일',required:true,type:'file'},
        {key:'file_format',label:'파일 형식',required:true,type:'select',options:['SWF','HTML5']},
        {key:'duration',label:'재생 시간(초)',required:false,type:'number'},
        {key:'memo',label:'비고',required:false,type:'text'},
      ]},
    // \u2500\u2500 CBT (\uD575\uC2EC\uC810\uAC80) \u2500\u2500
    {id:'LT-CBT-ND', targetSystems:['ND'], name:'\uD575\uC2EC\uC810\uAC80 (\uB274\uB4DC\uB9BC\uC2A4)', typeCode:'CBT',
      desc:'\uB274\uB4DC\uB9BC\uC2A4 \uC11C\uBE44\uC2A4\uC6A9 \uD575\uC2EC\uC810\uAC80 \uBCF8\uBB38 \uCF58\uD150\uCE20', color:'#AF52DE',
      subject:'수학', grade:'초등 3~4', curriculum:'2022 개정',
      depths:[
        {id:'d5',name:'커리큘럼명',groupCount:1,children:[
          {id:'d5-1',name:'과정',groupCount:8,children:[
            {id:'d5-1-1',name:'세트',groupCount:80,children:[
              {id:'d5-1-1-1',name:'문항',groupCount:400,children:[]}
            ]}
          ]}
        ]}
      ],
      attrs:[
        {key:'question_file',label:'문제 파일',required:true,type:'file'},
        {key:'answer_text',label:'정답',required:true,type:'text'},
        {key:'difficulty',label:'난이도',required:false,type:'select',options:['상','중','하']},
        {key:'time_limit',label:'제한 시간(초)',required:false,type:'number'},
      ]},
    {id:'LT-CBT-SJ', targetSystems:['SJ'], name:'\uD575\uC2EC\uC810\uAC80 (\uC131\uC7A5\uD310)', typeCode:'CBT',
      desc:'\uC131\uC7A5\uD310 \uC11C\uBE44\uC2A4\uC6A9 \uD575\uC2EC\uC810\uAC80 \uBCF8\uBB38 \uCF58\uD150\uCE20', color:'#FF9500',
      subject:'수학', grade:'중등 1', curriculum:'2022 개정',
      depths:[
        {id:'d5b',name:'커리큘럼명',groupCount:1,children:[
          {id:'d5b-1',name:'과정',groupCount:4,children:[
            {id:'d5b-1-1',name:'세트',groupCount:40,children:[
              {id:'d5b-1-1-1',name:'문항',groupCount:200,children:[]}
            ]}
          ]}
        ]}
      ],
      attrs:[
        {key:'question_file',label:'문제 파일',required:true,type:'file'},
        {key:'answer_text',label:'정답',required:true,type:'text'},
        {key:'difficulty',label:'난이도',required:false,type:'select',options:['상','중','하']},
        {key:'time_limit',label:'제한 시간(초)',required:false,type:'number'},
      ]},
    // \u2500\u2500 WEB (\uC6F9 \uD559\uC2B5\uCF58\uD150\uCE20) \u2500\u2500
    {id:'LT-WEB-ND', targetSystems:['ND'], name:'\uC6F9 \uD559\uC2B5\uCF58\uD150\uCE20 (\uB274\uB4DC\uB9BC\uC2A4)', typeCode:'WEB',
      desc:'\uB274\uB4DC\uB9BC\uC2A4 \uC11C\uBE44\uC2A4\uC6A9 HTML/ZIP \uAE30\uBC18 \uC6F9 \uD559\uC2B5 \uCF58\uD150\uCE20 (FILE\uD615)', color:'#34C759',
      subject:'영어', grade:'초등 5~6', curriculum:'2022 개정',
      depths:[
        {id:'d6',name:'커리큘럼명',groupCount:1,children:[
          {id:'d6-1',name:'과정',groupCount:6,children:[]}
        ]}
      ],
      attrs:[
        {key:'content_zip',label:'콘텐츠 파일(ZIP)',required:true,type:'file'},
        {key:'entry_url',label:'시작 페이지 경로',required:true,type:'text'},
        {key:'memo',label:'비고',required:false,type:'text'},
      ]},
    // \u2500\u2500 STDG (\uD559\uC2B5\uC548\uB0B4\u00B7\uD480\uC774) \u2500\u2500
    {id:'LT-STDG-NH', targetSystems:['NH'], name:'\uD559\uC2B5\uC548\uB0B4\u00B7\uD480\uC774 (\uD559\uC2B5\uAD00)', typeCode:'STDG',
      desc:'\uD559\uC2B5\uAD00 \uC11C\uBE44\uC2A4\uC6A9 \uD559\uC2B5\uC548\uB0B4 \uBC0F \uD480\uC774 \uCF58\uD150\uCE20 (DB\uD615)', color:'#0369A1',
      subject:'국어', grade:'전학년', curriculum:'2022 개정',
      depths:[
        {id:'d7',name:'커리큘럼명',groupCount:1,children:[
          {id:'d7-1',name:'과정',groupCount:5,children:[
            {id:'d7-1-1',name:'세트',groupCount:50,children:[
              {id:'d7-1-1-1',name:'학습일',groupCount:250,children:[]}
            ]}
          ]}
        ]}
      ],
      attrs:[
        {key:'content_file',label:'학습안내 파일',required:true,type:'file'},
        {key:'detail_type',label:'유형 구분',required:true,type:'select',options:['일반','특별']},
        {key:'day_number',label:'학습일 번호',required:true,type:'number'},
        {key:'seq',label:'순번',required:false,type:'number'},
        {key:'memo',label:'비고',required:false,type:'text'},
      ]},
    // \u2500\u2500 VKS (\uB3D9\uC694 \uCF58\uD150\uCE20) \u2500\u2500
    {id:'LT-VKS-ND', targetSystems:['ND'], name:'\uB3D9\uC694 \uCF58\uD150\uCE20 (\uB274\uB4DC\uB9BC\uC2A4)', typeCode:'VKS',
      desc:'\uB274\uB4DC\uB9BC\uC2A4 \uC11C\uBE44\uC2A4\uC6A9 \uB3D9\uC694 \uC74C\uC6D0/\uC601\uC0C1 \uCF58\uD150\uCE20 (FILE\uD615)', color:'#9333EA',
      subject:'한글똑똒', grade:'유아', curriculum:'해당없음',
      depths:[
        {id:'d8',name:'커리큘럼명',groupCount:1,children:[
          {id:'d8-1',name:'과정',groupCount:3,children:[
            {id:'d8-1-1',name:'차시',groupCount:36,children:[]}
          ]}
        ]}
      ],
      attrs:[
        {key:'video_file',label:'음원/영상 파일',required:true,type:'file'},
        {key:'thumbnail',label:'미리보기 이미지',required:true,type:'file'},
        {key:'duration',label:'재생 시간(초)',required:true,type:'number'},
        {key:'memo',label:'비고',required:false,type:'text'},
      ]},
  ],
  search: '',
  editingId: 'LT-ANS-ND',
  editTab: 'step1', // 'step1' | 'step2' | 'step3'
};

function renderLearningTypeView() {
  var root = document.getElementById('learningTypeRoot');
  if(!root) return;

  var types = LT_STATE.types;
  var q = LT_STATE.search.toLowerCase();
  var filtered = q ? types.filter(function(t) {
    return t.name.toLowerCase().indexOf(q) >= 0 || t.typeCode.toLowerCase().indexOf(q) >= 0;
  }) : types;

  // typeCode 기준 그룹화 (서비스별 분리 제거 → 유형별 통합)
  var typeGroups = {};
  var typeGroupOrder = [];
  filtered.forEach(function(t) {
    var gc = t.typeCode || 'ETC';
    if(!typeGroups[gc]) {
      typeGroups[gc] = {code:gc, label:(CONTENT_TYPES[gc] ? CONTENT_TYPES[gc].label : gc), items:[]};
      typeGroupOrder.push(gc);
    }
    typeGroups[gc].items.push(t);
  });

  var h = '';
  h += '<div style="display:flex;height:100%;overflow:hidden">';

  // ══════ 좌측: 템플릿 유형 + 구조 목록 ══════
  h += '<div style="width:280px;border-right:1px solid #E5E5EA;background:#fff;display:flex;flex-direction:column;flex-shrink:0">';
  h += '<div style="padding:16px 16px 12px;border-bottom:1px solid #E5E5EA">';
  h += '<div style="font-size:15px;font-weight:600;color:#1D1D1F;margin-bottom:2px">\uCF58\uD150\uCE20 \uD15C\uD50C\uB9BF</div>';
  h += '<div style="font-size:11px;color:#8E8E93">\uC720\uD615\uBCC4 \uAD6C\uC870 \uBAA9\uB85D \uBC0F \uC0DD\uC131 \uAD00\uB9AC</div>';
  h += '</div>';
  h += '<div style="padding:8px 12px;display:flex;gap:6px;border-bottom:1px solid #F5F5F7">';
  h += '<input type="text" placeholder="\uD15C\uD50C\uB9BF \uAC80\uC0C9" value="' + (LT_STATE.search || '') + '" oninput="LT_STATE.search=this.value;renderLearningTypeView()" style="flex:1;padding:7px 10px;border:1px solid #E5E5EA;border-radius:7px;font-size:12px;outline:none">';
  h += '</div>';
  h += '<div style="flex:1;overflow-y:auto;padding:6px 8px">';

  // 유형별 아코디언
  typeGroupOrder.forEach(function(gc) {
    var group = typeGroups[gc];
    var isGroupActive = LT_STATE._activeGroup === gc;
    var hasActive = group.items.some(function(t){ return t.id === LT_STATE.editingId; });
    if(!LT_STATE._activeGroup && hasActive) { LT_STATE._activeGroup = gc; isGroupActive = true; }

    // 유형 헤더 (정답·해설, 자동채점 등)
    h += '<div style="margin-bottom:6px">';
    h += '<div onclick="LT_STATE._activeGroup=LT_STATE._activeGroup===\'' + gc + '\'?null:\'' + gc + '\';renderLearningTypeView()" style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;cursor:pointer;background:' + (isGroupActive ? '#F0F9FF' : 'transparent') + ';border:1px solid ' + (isGroupActive ? '#BAE6FD' : 'transparent') + ';transition:all .1s" onmouseenter="if(!' + isGroupActive + ')this.style.background=\'#FAFAFA\'" onmouseleave="if(!' + isGroupActive + ')this.style.background=\'' + (isGroupActive ? '#F0F9FF' : 'transparent') + '\'">';
    h += '<svg viewBox="0 0 24 24" fill="none" stroke="#636366" stroke-width="2" style="width:12px;height:12px;flex-shrink:0;transition:transform .15s;transform:rotate(' + (isGroupActive ? '90' : '0') + 'deg)"><polyline points="9 18 15 12 9 6"/></svg>';
    h += '<span style="font-size:13px;font-weight:700;color:#1D1D1F;flex:1">' + group.label + '</span>';
    h += '<span style="font-size:9px;padding:1px 6px;border-radius:3px;background:#F5F5F7;color:#636366;font-weight:600;font-family:monospace">' + gc + '</span>';
    h += '<span style="font-size:9px;padding:1px 6px;border-radius:980px;background:#E0F2FE;color:#0284C7;font-weight:700">' + group.items.length + '</span>';
    h += '</div>';

    // 구조 목록 (펼침)
    if(isGroupActive) {
      h += '<div style="padding:4px 0 4px 16px">';

      // 구조 리스트
      group.items.forEach(function(t, ti) {
        var isActive = LT_STATE.editingId === t.id;
        var depthCount = _ltCountDepth(t.depths);
        var flatInfo = _ltGetDepthFlatInfo(t.depths);
        var totalFields = 0;
        flatInfo.forEach(function(fi){ totalFields += (fi.fields ? fi.fields.length : 0); });
        // 사용 중 여부 (REGISTERED_WORK_TYPES에서 참조)
        var isInUse = false;
        Object.keys(REGISTERED_WORK_TYPES).forEach(function(k) {
          (REGISTERED_WORK_TYPES[k] || []).forEach(function(rt) { if(rt.ltTypeId === t.id) isInUse = true; });
        });

        h += '<div onclick="LT_STATE.editingId=\'' + t.id + '\';LT_STATE.editTab=\'step1\';renderLearningTypeView()" style="padding:8px 10px;border-radius:6px;cursor:pointer;margin-bottom:2px;border-left:2.5px solid ' + (isActive ? (t.color || '#0071E3') : 'transparent') + ';background:' + (isActive ? '#FAFAFA' : 'transparent') + ';transition:all .1s" onmouseenter="this.style.background=\'' + (isActive ? '#FAFAFA' : '#FAFAFA') + '\'" onmouseleave="this.style.background=\'' + (isActive ? '#FAFAFA' : 'transparent') + '\'">';

        // 제목 행 (구조명 - 사용자 정의 또는 기본값)
        var structLabel = t.structureName || (t.subject || '') + (t.grade ? ' ' + t.grade : '') || '\uBBF8\uC9C0\uC815';
        h += '<div style="display:flex;align-items:center;gap:5px;margin-bottom:2px">';
        h += '<div style="width:5px;height:5px;border-radius:50%;background:' + (t.color || '#8E8E93') + ';flex-shrink:0"></div>';
        h += '<span style="font-size:12px;font-weight:' + (isActive ? '700' : '500') + ';color:#1D1D1F;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + structLabel + '</span>';
        if(isInUse) h += '<span style="font-size:8px;padding:1px 5px;border-radius:3px;background:#F0FFF4;color:#34C759;font-weight:700">\uC0AC\uC6A9\uC911</span>';
        h += '</div>';

        // 메타 행
        h += '<div style="display:flex;gap:4px;padding-left:10px;flex-wrap:wrap">';
        h += '<span style="font-size:9px;color:#8E8E93;font-weight:500">' + depthCount + 'D \u00B7 ' + totalFields + '\uD544\uB4DC</span>';
        if(t.subject) h += '<span style="font-size:9px;color:#8E8E93;font-weight:500">\u00B7 ' + t.subject + '</span>';
        h += '</div>';

        h += '</div>';
      });

      // + 추가 버튼
      h += '<div onclick="_ltAddStructure(\'' + gc + '\')" style="display:flex;align-items:center;gap:5px;padding:6px 10px;border-radius:6px;cursor:pointer;color:#0071E3;transition:all .1s;margin-top:2px" onmouseenter="this.style.background=\'#F0F9FF\'" onmouseleave="this.style.background=\'transparent\'">';
      h += '<svg viewBox="0 0 24 24" fill="none" stroke="#0071E3" stroke-width="2" style="width:12px;height:12px"><path d="M12 5v14m-7-7h14"/></svg>';
      h += '<span style="font-size:11px;font-weight:600">+ \uAD6C\uC870 \uCD94\uAC00</span>';
      h += '</div>';

      h += '</div>';
    }
    h += '</div>';
  });

  // 새 유형 추가
  h += '<div style="padding:8px 0;border-top:1px solid #F5F5F7;margin-top:4px">';
  h += '<div onclick="_ltAddNewType()" style="display:flex;align-items:center;gap:6px;padding:8px 10px;border-radius:8px;cursor:pointer;transition:all .1s" onmouseenter="this.style.background=\'#FAFAFA\'" onmouseleave="this.style.background=\'transparent\'">';
  h += '<svg viewBox="0 0 24 24" fill="none" stroke="#8E8E93" stroke-width="2" style="width:14px;height:14px"><path d="M12 5v14m-7-7h14"/></svg>';
  h += '<span style="font-size:11px;font-weight:600;color:#636366">\uC0C8 \uD15C\uD50C\uB9BF \uC720\uD615</span>';
  h += '</div></div>';

  if(typeGroupOrder.length === 0) h += '<div style="text-align:center;padding:30px;color:#8E8E93;font-size:12px">\uB4F1\uB85D\uB41C \uD15C\uD50C\uB9BF\uC774 \uC5C6\uC2B5\uB2C8\uB2E4</div>';
  h += '</div></div>';

  // ══════ 우측: 편집 영역 ══════
  var editType = LT_STATE.editingId ? types.find(function(t){ return t.id === LT_STATE.editingId; }) : null;

  h += '<div style="flex:1;display:flex;flex-direction:column;overflow:hidden;background:#FAFAFA">';

  if(!editType) {
    h += '<div style="display:flex;align-items:center;justify-content:center;flex:1;color:#8E8E93">';
    h += '<div style="text-align:center"><svg viewBox="0 0 24 24" fill="none" stroke="#D1D1D6" stroke-width="1.5" style="width:48px;height:48px;margin:0 auto 12px"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>';
    h += '<div style="font-size:14px;font-weight:600;margin-bottom:4px">콘텐츠 템플릿을 선택하세요</div>';
    h += '<div style="font-size:12px">좌측 목록에서 템플릿을 선택하거나 신규 템플릿을 생성합니다</div></div></div>';
  } else {
    // ── 편집 상단 바 ──
    h += '<div style="padding:14px 20px;background:#fff;border-bottom:1px solid #E5E5EA;display:flex;align-items:center;gap:10px;flex-shrink:0">';
    h += '<div style="width:8px;height:8px;border-radius:50%;background:' + (editType.color || '#8E8E93') + '"></div>';
    h += '<span style="font-size:15px;font-weight:600;color:#1D1D1F">' + editType.name + '</span>';
    h += '<span style="font-size:10px;padding:2px 8px;border-radius:4px;background:#F5F5F7;color:#636366;font-weight:600;font-family:monospace">' + editType.id + '</span>';
    h += '<div style="flex:1"></div>';
    // 탭 전환
    h += '<div style="display:flex;gap:0;border:1px solid #E5E5EA;border-radius:8px;overflow:hidden">';
    var tabs = [{v:'step1',l:'1. 단계 정의'},{v:'step2',l:'2. 필드 배정'},{v:'step3',l:'3. 저장 · 관리'}];
    tabs.forEach(function(tab) {
      var isOn = LT_STATE.editTab === tab.v;
      h += '<button onclick="LT_STATE.editTab=\'' + tab.v + '\';renderLearningTypeView()" style="padding:6px 14px;border:none;font-size:12px;font-weight:' + (isOn ? 700 : 500) + ';cursor:pointer;background:' + (isOn ? '#1D1D1F' : '#fff') + ';color:' + (isOn ? '#fff' : '#636366') + ';transition:all .12s">' + tab.l + '</button>';
    });
    h += '</div>';
    var editInUse = false;
    Object.keys(REGISTERED_WORK_TYPES).forEach(function(k) {
      (REGISTERED_WORK_TYPES[k] || []).forEach(function(rt) { if(rt.ltTypeId === editType.id) editInUse = true; });
    });
    if(editInUse) {
      h += '<span style="font-size:10px;padding:3px 8px;border-radius:4px;background:#FFF8F0;color:#B35C00;font-weight:600">\uC0AC\uC6A9\uC911 \u00B7 \uC218\uC815\uC8FC\uC758</span>';
      h += '<button onclick="_ltDeleteType(\'' + editType.id + '\')" style="padding:5px 10px;border:1px solid #E5E5EA;border-radius:6px;background:#FAFAFA;color:#D1D1D6;font-size:11px;font-weight:600;cursor:not-allowed" title="\uC0AC\uC6A9 \uC911\uC778 \uD15C\uD50C\uB9BF\uC740 \uC0AD\uC81C\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4">\uC0AD\uC81C</button>';
    } else {
      h += '<button onclick="_ltDeleteType(\'' + editType.id + '\')" style="padding:5px 10px;border:1px solid #FFB3AE;border-radius:6px;background:#fff;color:#FF3B30;font-size:11px;font-weight:600;cursor:pointer">\uC0AD\uC81C</button>';
    }
    h += '</div>';

    // ── 탭 콘텐츠 ──
    h += '<div style="flex:1;overflow-y:auto;padding:20px">';

    if(LT_STATE.editTab === 'step1') {
      h += _ltRenderStep1(editType);
    } else if(LT_STATE.editTab === 'step2') {
      h += _ltRenderStep2(editType);
    } else {
      h += _ltRenderStep3(editType);
    }

    h += '</div>';
  }
  h += '</div></div>';
  root.innerHTML = h;
}

// ── Depth 수 세기 (트리 순회) ──
function _ltCountDepth(depths) {
  var max = 0;
  function walk(nodes, level) {
    if(!nodes || nodes.length === 0) { if(level > max) max = level; return; }
    nodes.forEach(function(n) { walk(n.children || [], level + 1); });
  }
  walk(depths, 0);
  return max;
}

// Depth 구조의 이름 체인 추출 (첫 번째 경로 기준)
function _ltGetDepthNames(depths) {
  var names = [];
  function walk(nodes) {
    if(!nodes || nodes.length === 0) return;
    names.push(nodes[0].name);
    if(nodes[0].children && nodes[0].children.length > 0) walk(nodes[0].children);
  }
  walk(depths);
  return names;
}

// ══ 1단계: Depth 정의 (N개 관리, 그룹 수, 보조명) ══
function _ltRenderStep1(t) {
  var h = '';
  var depthNames = _ltGetDepthNames(t.depths);
  var depthCount = _ltCountDepth(t.depths);
  var flatInfo = _ltGetDepthFlatInfo(t.depths);

  // ── 구조 기본정보 ──
  h += '<div style="background:#fff;border-radius:12px;border:1px solid #E5E5EA;overflow:hidden;margin-bottom:16px">';
  h += '<div style="padding:14px 18px;border-bottom:1px solid #F5F5F7;display:flex;align-items:center;gap:8px">';
  h += '<svg viewBox="0 0 24 24" fill="none" stroke="#0071E3" stroke-width="2" style="width:16px;height:16px;flex-shrink:0"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';
  h += '<span style="font-size:13px;font-weight:600;color:#1D1D1F">\uAD6C\uC870 \uAE30\uBCF8\uC815\uBCF4</span>';
  h += '<span style="font-size:10px;color:#8E8E93">\uC88C\uCE21 \uBAA9\uB85D\uC5D0 \uD45C\uC2DC\uB420 \uAD6C\uC870\uBA85\uC744 \uC785\uB825\uD558\uC138\uC694</span>';
  h += '</div>';
  h += '<div style="padding:16px 18px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">';
  // 구조명
  h += '<div style="grid-column:1/4">';
  h += '<label style="font-size:11px;font-weight:700;color:#48484A;display:block;margin-bottom:4px">\uAD6C\uC870\uBA85 <span style="color:#FF3B30">*</span></label>';
  h += '<input type="text" value="' + (t.structureName || '').replace(/"/g,'&quot;') + '" placeholder="\uC608: \uC218\uD559 \uC804\uD559\uB144 4\uB2E8\uACC4, \uC601\uC5B4 \uC911\uB4F11-1 \uB4F1" onchange="_ltUpdateField(\'' + t.id + '\',\'structureName\',this.value);renderLearningTypeView()" style="width:100%;padding:8px 12px;border:1px solid #E5E5EA;border-radius:8px;font-size:13px;outline:none;box-sizing:border-box" onfocus="this.style.borderColor=\'#0071E3\'" onblur="this.style.borderColor=\'#E5E5EA\'">';
  h += '</div>';
  // 대상 과목
  h += '<div>';
  h += '<label style="font-size:11px;font-weight:700;color:#48484A;display:block;margin-bottom:4px">\uB300\uC0C1 \uACFC\uBAA9</label>';
  h += '<input type="text" value="' + (t.subject || '').replace(/"/g,'&quot;') + '" placeholder="\uC608: \uC218\uD559" onchange="_ltUpdateField(\'' + t.id + '\',\'subject\',this.value)" style="width:100%;padding:8px 12px;border:1px solid #E5E5EA;border-radius:8px;font-size:12px;outline:none;box-sizing:border-box" onfocus="this.style.borderColor=\'#0071E3\'" onblur="this.style.borderColor=\'#E5E5EA\'">';
  h += '</div>';
  // 학년/대상
  h += '<div>';
  h += '<label style="font-size:11px;font-weight:700;color:#48484A;display:block;margin-bottom:4px">\uD559\uB144/\uB300\uC0C1</label>';
  h += '<input type="text" value="' + (t.grade || '').replace(/"/g,'&quot;') + '" placeholder="\uC608: \uC804\uD559\uB144" onchange="_ltUpdateField(\'' + t.id + '\',\'grade\',this.value)" style="width:100%;padding:8px 12px;border:1px solid #E5E5EA;border-radius:8px;font-size:12px;outline:none;box-sizing:border-box" onfocus="this.style.borderColor=\'#0071E3\'" onblur="this.style.borderColor=\'#E5E5EA\'">';
  h += '</div>';
  // 교육과정
  h += '<div>';
  h += '<label style="font-size:11px;font-weight:700;color:#48484A;display:block;margin-bottom:4px">\uAD50\uC721\uACFC\uC815</label>';
  h += '<input type="text" value="' + (t.curriculum || '').replace(/"/g,'&quot;') + '" placeholder="\uC608: 2022 \uAC1C\uC815" onchange="_ltUpdateField(\'' + t.id + '\',\'curriculum\',this.value)" style="width:100%;padding:8px 12px;border:1px solid #E5E5EA;border-radius:8px;font-size:12px;outline:none;box-sizing:border-box" onfocus="this.style.borderColor=\'#0071E3\'" onblur="this.style.borderColor=\'#E5E5EA\'">';
  h += '</div>';
  // 연계 시스템 (멀티 선택)
  h += '<div style="grid-column:1/4;margin-top:4px">';
  h += '<label style="font-size:11px;font-weight:700;color:#48484A;display:block;margin-bottom:6px">\uC5F0\uACC4 \uC2DC\uC2A4\uD15C <span style="color:#FF3B30">*</span></label>';
  var _tSystems = t.targetSystems || [];
  var _allSys = Object.keys(WC_SYSTEM_COLORS);
  h += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px">';
  _allSys.forEach(function(sk) {
    var sys = WC_SYSTEM_COLORS[sk];
    var isOn = _tSystems.indexOf(sk) >= 0;
    h += '<button onclick="_ltToggleTargetSystem(\'' + t.id + '\',\'' + sk + '\')" style="padding:5px 14px;border-radius:6px;font-size:12px;font-weight:500;cursor:pointer;transition:all .12s;border:1px solid ' + (isOn ? sys.color : '#E5E5EA') + ';background:' + (isOn ? sys.bg : '#fff') + ';color:' + (isOn ? sys.color : '#8E8E93') + '">' + sys.label + '</button>';
  });
  h += '</div>';
  // 주의사항
  if(_tSystems.length > 1) {
    h += '<div style="display:flex;align-items:flex-start;gap:6px;padding:6px 10px;background:#FFF8F0;border-radius:6px;border:1px solid #FFD9A8">';
    h += '<span style="font-size:12px;flex-shrink:0;margin-top:1px">\u26A0\uFE0F</span>';
    h += '<span style="font-size:10px;color:#B35C00;font-weight:600;line-height:1.4">\uCF58\uD150\uCE20\uAC00 \uB3D9\uC77C\uD558\uC9C0 \uC54A\uC744 \uACBD\uC6B0 \uD558\uB098\uC758 \uC2DC\uC2A4\uD15C\uB9CC \uC120\uD0DD\uD558\uC138\uC694! \uC2DC\uC2A4\uD15C\uBCC4\uB85C \uBCC4\uB3C4 \uAD6C\uC870\uB97C \uB9CC\uB4E4\uC5B4\uC57C \uD569\uB2C8\uB2E4.</span>';
    h += '</div>';
  } else if(_tSystems.length === 0) {
    h += '<div style="font-size:10px;color:#8E8E93">\uBC30\uD3EC\uD560 \uC2DC\uC2A4\uD15C\uC744 1\uAC1C \uC774\uC0C1 \uC120\uD0DD\uD558\uC138\uC694</div>';
  }
  h += '</div>';
  h += '</div></div>';

  // ── 빠른 생성 (기존 depth 있으면 접힌 상태) ──
  var hasExistingDepth = depthCount > 0 && flatInfo.length > 0 && flatInfo.some(function(fi){ return fi.fields && fi.fields.length > 0; });
  var quickGenCollapsed = hasExistingDepth && !LT_STATE._quickGenOpen;
  h += '<div style="background:#fff;border-radius:12px;border:1px solid ' + (quickGenCollapsed ? '#F5F5F7' : '#E5E5EA') + ';overflow:hidden;margin-bottom:16px">';
  h += '<div onclick="LT_STATE._quickGenOpen=!LT_STATE._quickGenOpen;renderLearningTypeView()" style="padding:' + (quickGenCollapsed ? '10px 18px' : '14px 18px') + ';' + (quickGenCollapsed ? '' : 'border-bottom:1px solid #F5F5F7;') + 'display:flex;align-items:center;gap:8px;cursor:pointer" onmouseenter="this.style.background=\'#FAFAFA\'" onmouseleave="this.style.background=\'transparent\'">';
  h += '<svg viewBox="0 0 24 24" fill="none" stroke="' + (quickGenCollapsed ? '#8E8E93' : '#0071E3') + '" stroke-width="2" style="width:' + (quickGenCollapsed ? '12' : '16') + 'px;height:' + (quickGenCollapsed ? '12' : '16') + 'px;flex-shrink:0;transition:transform .15s;transform:rotate(' + (quickGenCollapsed ? '0' : '90') + 'deg)"><polyline points="9 18 15 12 9 6"/></svg>';
  if(quickGenCollapsed) {
    h += '<span style="font-size:11px;font-weight:600;color:#8E8E93">\uB2E8\uACC4 \uAD6C\uC870 \uBE60\uB978 \uC0DD\uC131</span>';
    h += '<div style="flex:1"></div>';
    h += '<span style="font-size:10px;color:#D1D1D6">\uD074\uB9AD\uD558\uC5EC \uD3BC\uCE58\uAE30</span>';
  } else {
    h += '<span style="font-size:13px;font-weight:600;color:#1D1D1F">\uB2E8\uACC4 \uAD6C\uC870 \uC790\uB3D9 \uC0DD\uC131</span>';
    h += '<span style="font-size:10px;color:#8E8E93">\uB2E8\uACC4 \uC218\uB97C \uC785\uB825\uD558\uBA74 \uAD6C\uC870\uAC00 \uC790\uB3D9 \uC0DD\uC131\uB429\uB2C8\uB2E4</span>';
    h += '<div style="flex:1"></div>';
    h += '<span style="font-size:11px;color:#8E8E93">\uD604\uC7AC: <strong style="color:#1D1D1F">' + depthCount + '</strong> Depth</span>';
  }
  h += '</div>';
  if(!quickGenCollapsed) {
  h += '<div style="padding:16px 18px">';
  h += '<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">';
  h += '<label style="font-size:12px;font-weight:700;color:#48484A;white-space:nowrap">\uB2E8\uACC4 \uC218</label>';
  h += '<input id="ltDepthCountInput" type="number" min="1" max="8" value="' + (depthCount || 4) + '" style="width:72px;padding:8px 12px;border:1px solid #E5E5EA;border-radius:8px;font-size:14px;font-weight:700;text-align:center;outline:none" onfocus="this.style.borderColor=\'#0071E3\'" onblur="this.style.borderColor=\'#E5E5EA\'">';
  h += '<button onclick="_ltGenerateDepths(\'' + t.id + '\')" style="padding:8px 18px;border:none;border-radius:8px;background:#0071E3;color:#fff;font-size:12px;font-weight:500;cursor:pointer">\uAD6C\uC870 \uC0DD\uC131</button>';
  if(hasExistingDepth) h += '<span style="font-size:10px;color:#FF9500;margin-left:8px">\u26A0 \uAE30\uC874 Depth\uAC00 \uCD08\uAE30\uD654\uB429\uB2C8\uB2E4</span>';
  h += '</div>';
  // 프리셋
  h += '<div style="display:flex;gap:6px;flex-wrap:wrap">';
  var presets = [
    {n:3, label:'\uCEE4\uB9AC\uD058\uB7FC\uBA85 \u203A \uACFC\uC815 \u203A \uC138\uD2B8'},
    {n:4, label:'\uCEE4\uB9AC\uD058\uB7FC\uBA85 \u203A \uACFC\uC815 \u203A \uC138\uD2B8 \u203A \uD559\uC2B5\uC77C'},
    {n:5, label:'\uCEE4\uB9AC\uD058\uB7FC\uBA85 \u203A \uACFC\uC815 \u203A \uB2E8\uC6D0 \u203A \uC138\uD2B8 \u203A \uD559\uC2B5\uC77C'},
    {n:4, label:'\uCEE4\uB9AC\uD058\uB7FC\uBA85 \u203A \uCD9C\uD310\uC0AC \u203A \uAC15\uC88C \u203A \uAC15'},
  ];
  presets.forEach(function(pr, pi) {
    h += '<button onclick="_ltApplyPreset(\'' + t.id + '\',' + pi + ')" style="padding:5px 12px;border:1px solid #E5E5EA;border-radius:6px;background:#FAFAFA;color:#48484A;font-size:10px;font-weight:600;cursor:pointer;transition:all .1s" onmouseenter="this.style.borderColor=\'#0071E3\';this.style.color=\'#0071E3\'" onmouseleave="this.style.borderColor=\'#E5E5EA\';this.style.color=\'#48484A\'">' + pr.label + '</button>';
  });
  h += '</div></div>';
  }
  h += '</div>';

  // ── Depth 목록 (상세 편집) ──
  h += '<div style="background:#fff;border-radius:12px;border:1px solid #E5E5EA;overflow:hidden">';
  h += '<div style="padding:14px 18px;border-bottom:1px solid #F5F5F7;display:flex;align-items:center;gap:8px">';
  h += '<span style="font-size:13px;font-weight:600;color:#1D1D1F">\uB2E8\uACC4 \uBAA9\uB85D</span>';
  h += '<span style="font-size:10px;color:#8E8E93">\uB2E8\uACC4\uBA85, \uBCF4\uC870\uBA85, \uADF8\uB8F9 \uC218\uB97C \uC815\uC758\uD569\uB2C8\uB2E4</span>';
  h += '</div>';
  h += '<div style="padding:0">';

  var depthColors = ['#0071E3','#AF52DE','#34C759','#FF9500','#FF3B30','#0891B2','#BE185D','#0071E3'];
  if(flatInfo.length === 0) {
    h += '<div style="padding:32px;text-align:center;color:#8E8E93;font-size:12px">\uC704 \uBE60\uB978 \uC0DD\uC131\uC73C\uB85C \uB2E8\uACC4 \uAD6C\uC870\uB97C \uB9CC\uB4E4\uC5B4\uC8FC\uC138\uC694</div>';
  } else {
    // 테이블 헤더
    h += '<div style="display:grid;grid-template-columns:40px 1.2fr 1.2fr 100px 60px;gap:0;padding:8px 18px;background:#FAFAFA;border-bottom:1px solid #F5F5F7;font-size:9px;font-weight:700;color:#8E8E93;text-transform:uppercase;letter-spacing:.06em">';
    h += '<div>\uB2E8\uACC4</div><div>\uB2E8\uACC4\uBA85</div><div>\uBCF4\uC870\uBA85</div><div style="text-align:center">\uADF8\uB8F9 \uC218</div><div style="text-align:center">\uD544\uB4DC</div>';
    h += '</div>';

    flatInfo.forEach(function(fi, idx) {
      var dc = depthColors[fi.level % depthColors.length];
      var isLast = idx === flatInfo.length - 1;
      h += '<div style="display:grid;grid-template-columns:40px 1.2fr 1.2fr 100px 60px;gap:0;padding:10px 18px;align-items:center;border-bottom:' + (isLast ? 'none' : '1px solid #F5F5F7') + ';transition:background .1s" onmouseenter="this.style.background=\'#FAFAFA\'" onmouseleave="this.style.background=\'transparent\'">';

      // Depth 번호
      h += '<div style="display:flex;align-items:center;gap:4px">';
      h += '<div style="width:24px;height:24px;border-radius:6px;background:' + dc + '12;display:flex;align-items:center;justify-content:center"><span style="font-size:11px;font-weight:600;color:' + dc + '">' + (fi.level + 1) + '</span></div>';
      h += '</div>';

      // Depth명
      h += '<div><input type="text" value="' + fi.name + '" onchange="_ltTreeRenameLevel(\'' + t.id + '\',' + fi.level + ',this.value)" style="width:100%;padding:6px 10px;border:1px solid transparent;border-radius:6px;font-size:13px;font-weight:700;color:#1D1D1F;outline:none;background:transparent;transition:all .12s;box-sizing:border-box" onfocus="this.style.borderColor=\'' + dc + '\';this.style.background=\'#fff\'" onblur="this.style.borderColor=\'transparent\';this.style.background=\'transparent\'" placeholder="\uB2E8\uACC4 ' + (fi.level + 1) + ' \uC774\uB984"></div>';

      // 보조명
      h += '<div><input type="text" value="' + (fi.subName || '') + '" onchange="_ltSetDepthProp(\'' + t.id + '\',' + fi.level + ',\'subName\',this.value)" style="width:100%;padding:6px 10px;border:1px solid transparent;border-radius:6px;font-size:12px;color:#636366;outline:none;background:transparent;transition:all .12s;box-sizing:border-box" onfocus="this.style.borderColor=\'#D1D1D6\';this.style.background=\'#fff\'" onblur="this.style.borderColor=\'transparent\';this.style.background=\'transparent\'" placeholder="\uBCF4\uC870\uBA85 \uC785\uB825"></div>';

      // 그룹 수
      h += '<div style="text-align:center"><input type="number" min="1" max="999" value="' + (fi.groupCount || 1) + '" onchange="_ltSetDepthProp(\'' + t.id + '\',' + fi.level + ',\'groupCount\',parseInt(this.value)||1)" style="width:64px;padding:5px 8px;border:1px solid #E5E5EA;border-radius:6px;font-size:12px;font-weight:600;text-align:center;outline:none" onfocus="this.style.borderColor=\'' + dc + '\'" onblur="this.style.borderColor=\'#E5E5EA\'"></div>';

      // 필드 수
      var fCount = fi.fields ? fi.fields.length : 0;
      h += '<div style="text-align:center"><span style="font-size:10px;padding:2px 8px;border-radius:980px;background:' + (fCount > 0 ? '#F0FFF4' : '#FFF8F0') + ';color:' + (fCount > 0 ? '#34C759' : '#B35C00') + ';font-weight:700">' + fCount + '</span></div>';

      h += '</div>';
    });
  }
  h += '</div>';

  // 미리보기
  h += '<div style="padding:14px 18px;border-top:1px solid #F5F5F7;background:#FAFAFA">';
  h += '<div style="font-size:10px;font-weight:700;color:#8E8E93;margin-bottom:8px">\uAD6C\uC870 \uBBF8\uB9AC\uBCF4\uAE30</div>';
  h += '<div style="display:flex;align-items:center;gap:0;flex-wrap:wrap">';
  flatInfo.forEach(function(fi, idx) {
    if(idx > 0) h += '<svg viewBox="0 0 24 24" fill="none" stroke="#D1D1D6" stroke-width="2" style="width:16px;height:16px;flex-shrink:0"><polyline points="9 18 15 12 9 6"/></svg>';
    var bgColors = ['#E8F2FF','#F9F0FF','#F0FFF4','#FFF8F0','#FFF1F2','#F0F9FF'];
    var borderColors = ['#B3D7FF','#D9B3F0','#A8E6B8','#FFD9A8','#FECDD3','#BAE6FD'];
    var ci = fi.level % bgColors.length;
    h += '<div style="background:' + bgColors[ci] + ';border:1px solid ' + borderColors[ci] + ';border-radius:8px;padding:6px 14px;text-align:center">';
    h += '<div style="font-size:8px;color:#8E8E93;font-weight:600">\uB2E8\uACC4 ' + (fi.level + 1) + '</div>';
    h += '<div style="font-size:12px;font-weight:700;color:#1D1D1F">' + fi.name + '</div>';
    if(fi.subName) h += '<div style="font-size:9px;color:#636366">' + fi.subName + '</div>';
    h += '<div style="font-size:9px;color:#8E8E93;margin-top:1px">' + (fi.groupCount || 1) + '\uAC1C \uADF8\uB8F9</div>';
    h += '</div>';
  });
  h += '</div></div>';

  h += '</div>';

  // 다음 단계 버튼
  if(depthCount > 0) {
    h += '<div style="margin-top:16px;display:flex;justify-content:flex-end">';
    h += '<button onclick="LT_STATE.editTab=\'step2\';renderLearningTypeView()" style="padding:10px 24px;border:none;border-radius:8px;background:#0071E3;color:#fff;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px">';
    h += '2\uB2E8\uACC4: \uD544\uB4DC \uBC30\uC815 \u2192';
    h += '</button></div>';
  }

  return h;
}

// Depth 트리에서 flat 정보 추출 (name, subName, groupCount, fields, level)
function _ltGetDepthFlatInfo(depths) {
  var result = [];
  function walk(nodes, level) {
    if(!nodes || nodes.length === 0) return;
    nodes.forEach(function(n) {
      result.push({name:n.name, subName:n.subName||'', groupCount:n.groupCount||1, fields:n.fields||[], level:level, id:n.id});
      walk(n.children, level + 1);
    });
  }
  walk(depths, 0);
  return result;
}

// Depth 속성(subName, groupCount) 설정
function _ltSetDepthProp(typeId, level, prop, value) {
  var t = LT_STATE.types.find(function(x){ return x.id === typeId; });
  if(!t) return;
  function walkSet(nodes, curLevel) {
    if(!nodes) return;
    nodes.forEach(function(n) {
      if(curLevel === level) n[prop] = value;
      walkSet(n.children, curLevel + 1);
    });
  }
  walkSet(t.depths, 0);
}


function _ltFlattenDepths(nodes, result, level) {
  if(!nodes) return;
  nodes.forEach(function(n) {
    result.push({name:n.name, level:level, id:n.id});
    _ltFlattenDepths(n.children, result, level + 1);
  });
}

function _ltRenderTreeNodes(typeId, nodes, depth) {
  if(!nodes || nodes.length === 0) return '';
  var h = '';
  nodes.forEach(function(node, ni) {
    var indent = depth * 28;
    var hasChildren = node.children && node.children.length > 0;
    var depthColors = ['#0071E3','#AF52DE','#34C759','#FF9500','#FF3B30','#0891B2'];
    var dc = depthColors[depth % depthColors.length];

    // 노드 행 (트리 에디터 스타일)
    h += '<div style="display:flex;align-items:center;gap:0;padding:5px 12px 5px ' + (16 + indent) + 'px;transition:background .1s" onmouseenter="this.style.background=\'#FAFAFA\'" onmouseleave="this.style.background=\'transparent\'">';

    // 연결선 + 아이콘
    if(depth > 0) {
      h += '<div style="width:16px;height:16px;display:flex;align-items:center;justify-content:center;color:#D1D1D6;font-size:10px;flex-shrink:0">└</div>';
    }

    // Depth 표시
    h += '<div style="min-width:52px;display:flex;align-items:center;gap:4px;flex-shrink:0">';
    h += '<div style="width:6px;height:6px;border-radius:50%;background:' + dc + '"></div>';
    h += '<span style="font-size:9px;font-weight:700;color:' + dc + '">\uB2E8\uACC4 ' + (depth + 1) + '</span>';
    h += '</div>';

    // 이름 편집
    h += '<input type="text" value="' + node.name + '" onchange="_ltTreeRename(\'' + typeId + '\',\'' + node.id + '\',this.value)" style="flex:1;padding:5px 10px;border:1px solid #E5E5EA;border-radius:6px;font-size:13px;font-weight:600;outline:none;max-width:240px;transition:border-color .15s" onfocus="this.style.borderColor=\'' + dc + '\'" onblur="this.style.borderColor=\'#E5E5EA\'">';

    // 액션 버튼들
    h += '<div style="display:flex;gap:4px;margin-left:8px">';
    h += '<button onclick="_ltTreeAddChild(\'' + typeId + '\',\'' + node.id + '\')" style="padding:3px 8px;border:1px solid #B3D7FF;border-radius:5px;background:#E8F2FF;color:#0071E3;font-size:10px;font-weight:700;cursor:pointer" title="하위 단계 추가">+ 하위</button>';
    if(depth > 0 || (nodes.length > 1 && depth === 0)) {
      h += '<button onclick="_ltTreeRemove(\'' + typeId + '\',\'' + node.id + '\')" style="padding:3px 6px;border:1px solid #FFB3AE;border-radius:5px;background:#fff;color:#FF3B30;font-size:10px;cursor:pointer" title="삭제">×</button>';
    }
    if(ni > 0) {
      h += '<button onclick="_ltTreeMove(\'' + typeId + '\',\'' + node.id + '\',-1)" style="padding:2px 5px;border:1px solid #E5E5EA;border-radius:4px;background:#fff;color:#636366;font-size:9px;cursor:pointer">▲</button>';
    }
    if(ni < nodes.length - 1) {
      h += '<button onclick="_ltTreeMove(\'' + typeId + '\',\'' + node.id + '\',1)" style="padding:2px 5px;border:1px solid #E5E5EA;border-radius:4px;background:#fff;color:#636366;font-size:9px;cursor:pointer">▼</button>';
    }
    h += '</div></div>';

    // 재귀: 자식 노드
    if(hasChildren) {
      h += _ltRenderTreeNodes(typeId, node.children, depth + 1);
    }
  });
  return h;
}

// ══ 2단계: Depth별 필드 배정 ══
function _ltRenderStep2(t) {
  var h = '';
  var flatInfo = _ltGetDepthFlatInfo(t.depths);
  var depthColors = ['#0071E3','#AF52DE','#34C759','#FF9500','#FF3B30','#0891B2','#BE185D','#0071E3'];

  // 현재 선택된 Depth (편집 대상)
  if(!LT_STATE._activeDepth && flatInfo.length > 0) LT_STATE._activeDepth = flatInfo[flatInfo.length - 1].level;
  var activeLevel = LT_STATE._activeDepth || 0;

  h += '<div style="display:flex;gap:16px;height:100%">';

  // ── 좌측: Depth 선택 ──
  h += '<div style="width:200px;background:#fff;border-radius:12px;border:1px solid #E5E5EA;display:flex;flex-direction:column;flex-shrink:0">';
  h += '<div style="padding:12px 14px;border-bottom:1px solid #F5F5F7">';
  h += '<div style="font-size:12px;font-weight:600;color:#1D1D1F">\uB2E8\uACC4 \uC120\uD0DD</div>';
  h += '<div style="font-size:9px;color:#8E8E93;margin-top:2px">\uD544\uB4DC\uB97C \uBC30\uC815\uD560 \uB2E8\uACC4\uB97C \uC120\uD0DD\uD558\uC138\uC694</div>';
  h += '</div>';
  h += '<div style="flex:1;overflow-y:auto;padding:6px">';
  flatInfo.forEach(function(fi) {
    var dc = depthColors[fi.level % depthColors.length];
    var isActive = fi.level === activeLevel;
    var fCount = fi.fields ? fi.fields.length : 0;
    h += '<div onclick="LT_STATE._activeDepth=' + fi.level + ';renderLearningTypeView()" style="padding:10px 12px;border-radius:8px;cursor:pointer;margin-bottom:3px;border-left:3px solid ' + (isActive ? dc : 'transparent') + ';background:' + (isActive ? dc + '08' : 'transparent') + ';transition:all .1s">';
    h += '<div style="display:flex;align-items:center;gap:6px">';
    h += '<div style="width:22px;height:22px;border-radius:6px;background:' + dc + '15;display:flex;align-items:center;justify-content:center"><span style="font-size:10px;font-weight:600;color:' + dc + '">' + (fi.level + 1) + '</span></div>';
    h += '<div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:' + (isActive ? '700' : '500') + ';color:' + (isActive ? '#1D1D1F' : '#636366') + '">' + fi.name + '</div>';
    if(fi.subName) h += '<div style="font-size:9px;color:#8E8E93">' + fi.subName + '</div>';
    h += '</div>';
    h += '<span style="font-size:9px;padding:2px 6px;border-radius:980px;background:' + (fCount > 0 ? '#F0FFF4' : '#F5F5F7') + ';color:' + (fCount > 0 ? '#34C759' : '#8E8E93') + ';font-weight:700">' + fCount + '</span>';
    h += '</div></div>';
  });
  h += '</div></div>';

  // ── 우측: 필드 배정 영역 ──
  var activeFI = flatInfo.find(function(fi){ return fi.level === activeLevel; });
  var assignedKeys = activeFI && activeFI.fields ? activeFI.fields : [];

  h += '<div style="flex:1;display:flex;flex-direction:column;gap:12px">';

  // 헤더
  var adc = depthColors[activeLevel % depthColors.length];
  h += '<div style="background:#fff;border-radius:12px;border:1px solid #E5E5EA;padding:14px 18px;display:flex;align-items:center;gap:10px">';
  h += '<div style="width:32px;height:32px;border-radius:8px;background:' + adc + '15;display:flex;align-items:center;justify-content:center"><span style="font-size:14px;font-weight:600;color:' + adc + '">' + (activeLevel + 1) + '</span></div>';
  h += '<div><div style="font-size:14px;font-weight:700;color:#1D1D1F">' + (activeFI ? activeFI.name : '') + '</div>';
  h += '<div style="font-size:11px;color:#8E8E93">\uC774 \uB2E8\uACC4\uC5D0\uC11C \uC785\uB825\uD560 \uD544\uB4DC\uB97C \uC120\uD0DD\uD569\uB2C8\uB2E4 \u2014 \uC120\uD0DD\uB41C \uD544\uB4DC\uAC00 \uC791\uC5C5\uC790\uC758 \uC785\uB825 \uC591\uC2DD\uC774 \uB429\uB2C8\uB2E4</div>';
  h += '</div></div>';

  // 배정된 필드
  h += '<div style="background:#fff;border-radius:12px;border:1px solid #E5E5EA;overflow:hidden">';
  h += '<div style="padding:10px 14px;border-bottom:1px solid #F5F5F7;display:flex;align-items:center;gap:6px;background:' + adc + '08">';
  h += '<span style="font-size:11px;font-weight:700;color:' + adc + '">\uBC30\uC815\uB41C \uD544\uB4DC (' + assignedKeys.length + ')</span>';
  h += '</div>';
  if(assignedKeys.length > 0) {
    h += '<div style="padding:8px">';
    assignedKeys.forEach(function(key, ki) {
      var poolField = LT_FIELD_POOL.find(function(pf){ return pf.key === key; });
      var label = poolField ? poolField.label : key;
      var ftype = poolField ? poolField.type : 'text';
      var fdesc = poolField ? poolField.desc : '';
      h += '<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:#fff;border-radius:6px;margin-bottom:3px;border:1px solid #F5F5F7;transition:border-color .1s" onmouseenter="this.style.borderColor=\'#D1D1D6\'" onmouseleave="this.style.borderColor=\'#F5F5F7\'">';
      h += '<span style="font-size:12px;font-weight:700;color:#1D1D1F;min-width:100px">' + label + '</span>';
      h += '<span style="font-size:9px;padding:1px 6px;border-radius:3px;background:#F5F5F7;color:#636366;font-weight:600">' + ftype + '</span>';
      h += '<span style="font-size:9px;color:#8E8E93;flex:1">' + fdesc + '</span>';
      h += '<button onclick="_ltRemoveDepthField(\'' + t.id + '\',' + activeLevel + ',\'' + key + '\')" style="width:20px;height:20px;border:none;border-radius:4px;background:transparent;color:#D1D1D6;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px;transition:all .1s" onmouseenter="this.style.background=\'#FFB3AE\';this.style.color=\'#FF3B30\'" onmouseleave="this.style.background=\'transparent\';this.style.color=\'#D1D1D6\'">\u00D7</button>';
      h += '</div>';
    });
    h += '</div>';
  } else {
    h += '<div style="padding:20px;text-align:center;color:#8E8E93;font-size:11px">\uC544\uB798 \uD544\uB4DC \uD480\uC5D0\uC11C \uD074\uB9AD\uD558\uC5EC \uCD94\uAC00\uD558\uC138\uC694</div>';
  }
  h += '</div>';

  // 필드 풀 (추가 가능한 필드)
  h += '<div style="background:#fff;border-radius:12px;border:1px solid #E5E5EA;overflow:hidden;flex:1">';
  h += '<div style="padding:10px 14px;border-bottom:1px solid #F5F5F7;display:flex;align-items:center;gap:6px">';
  h += '<span style="font-size:11px;font-weight:700;color:#48484A">\uD544\uB4DC \uD480</span>';
  h += '<span style="font-size:9px;color:#8E8E93">\uD074\uB9AD\uD558\uBA74 \uC704 \uB2E8\uACC4\uC5D0 \uCD94\uAC00\uB429\uB2C8\uB2E4</span>';
  h += '</div>';
  h += '<div style="padding:8px;display:flex;flex-wrap:wrap;gap:4px;max-height:280px;overflow-y:auto">';
  var cats = _ltGetFieldCategories();
  cats.forEach(function(cat) {
    var catFields = LT_FIELD_POOL.filter(function(pf){ return pf.category === cat; });
    var avail = catFields.filter(function(pf){ return assignedKeys.indexOf(pf.key) < 0; });
    if(avail.length === 0) return;
    h += '<div style="width:100%;font-size:9px;font-weight:700;color:#8E8E93;text-transform:uppercase;letter-spacing:.06em;padding:4px 6px;margin-top:4px">' + cat + '</div>';
    avail.forEach(function(pf) {
      h += '<span onclick="_ltAddDepthField(\'' + t.id + '\',' + activeLevel + ',\'' + pf.key + '\')" style="font-size:10px;padding:4px 10px;border-radius:5px;background:#FAFAFA;color:#48484A;cursor:pointer;border:1px solid #E5E5EA;font-weight:600;transition:all .1s" onmouseenter="this.style.borderColor=\'#0071E3\';this.style.color=\'#0071E3\';this.style.background=\'#F0F9FF\'" onmouseleave="this.style.borderColor=\'#E5E5EA\';this.style.color=\'#48484A\';this.style.background=\'#FAFAFA\'">+ ' + pf.label + '</span>';
    });
  });
  h += '</div></div>';

  h += '</div></div>';

  // 네비게이션
  h += '<div style="margin-top:16px;display:flex;justify-content:space-between">';
  h += '<button onclick="LT_STATE.editTab=\'step1\';renderLearningTypeView()" style="padding:10px 20px;border:1px solid #E5E5EA;border-radius:8px;background:#fff;color:#636366;font-size:13px;font-weight:600;cursor:pointer">\u2190 1\uB2E8\uACC4: \uB2E8\uACC4 \uAD6C\uC870 \uC815\uC758</button>';
  h += '<button onclick="LT_STATE.editTab=\'step3\';renderLearningTypeView()" style="padding:10px 24px;border:none;border-radius:8px;background:#0071E3;color:#fff;font-size:13px;font-weight:700;cursor:pointer">3\uB2E8\uACC4: \uC800\uC7A5 \u00B7 \uAD00\uB9AC \u2192</button>';
  h += '</div>';

  return h;
}

// Depth에 필드 추가
function _ltAddDepthField(typeId, level, fieldKey) {
  var t = LT_STATE.types.find(function(x){ return x.id === typeId; });
  if(!t) return;
  function walkAdd(nodes, curLevel) {
    if(!nodes) return;
    nodes.forEach(function(n) {
      if(curLevel === level) {
        if(!n.fields) n.fields = [];
        if(n.fields.indexOf(fieldKey) < 0) n.fields.push(fieldKey);
      }
      walkAdd(n.children, curLevel + 1);
    });
  }
  walkAdd(t.depths, 0);
  renderLearningTypeView();
}

// Depth에서 필드 제거
function _ltRemoveDepthField(typeId, level, fieldKey) {
  var t = LT_STATE.types.find(function(x){ return x.id === typeId; });
  if(!t) return;
  function walkRemove(nodes, curLevel) {
    if(!nodes) return;
    nodes.forEach(function(n) {
      if(curLevel === level && n.fields) {
        var idx = n.fields.indexOf(fieldKey);
        if(idx >= 0) n.fields.splice(idx, 1);
      }
      walkRemove(n.children, curLevel + 1);
    });
  }
  walkRemove(t.depths, 0);
  renderLearningTypeView();
}


function _ltAttrEditRow(typeId, attr) {
  var h = '';
  h += '<div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:#fff;border-radius:8px;margin-bottom:4px;border:1px solid #F5F5F7;transition:border-color .1s" onmouseenter="this.style.borderColor=\'#D1D1D6\'" onmouseleave="this.style.borderColor=\'#F5F5F7\'">';

  // 라벨 (DB 카탈로그 기반은 읽기 전용, 수동 추가분은 편집 가능)
  var isCatalogField = DB_FIELD_CATALOG.some(function(f){ return f.key === attr.key; });
  if(isCatalogField) {
    h += '<span style="width:120px;padding:4px 8px;font-size:12px;font-weight:700;color:#1D1D1F">' + attr.label + '</span>';
  } else {
    h += '<input type="text" value="' + attr.label + '" onchange="_ltUpdateAttrField(\'' + typeId + '\',\'' + attr.key + '\',\'label\',this.value)" style="width:120px;padding:4px 8px;border:1px solid transparent;border-radius:4px;font-size:12px;font-weight:700;color:#1D1D1F;outline:none;background:transparent;transition:border-color .1s" onfocus="this.style.borderColor=\'#B3D7FF\';this.style.background=\'#fff\'" onblur="this.style.borderColor=\'transparent\';this.style.background=\'transparent\'">';
  }

  // 키
  h += '<span style="font-size:10px;font-family:monospace;color:#8E8E93;min-width:60px">' + attr.key + '</span>';

  // 타입 선택
  h += '<select onchange="_ltUpdateAttrField(\'' + typeId + '\',\'' + attr.key + '\',\'type\',this.value)" style="padding:3px 8px;border:1px solid #E5E5EA;border-radius:4px;font-size:10px;outline:none;cursor:pointer;background:#FAFAFA;color:#48484A">';
  var attrTypes = ['text','number','file','select','textarea','date'];
  attrTypes.forEach(function(at) {
    h += '<option value="' + at + '"' + (attr.type === at ? ' selected' : '') + '>' + at + '</option>';
  });
  h += '</select>';

  h += '<div style="flex:1"></div>';

  // 필수/선택 토글
  h += '<button onclick="_ltToggleRequired(\'' + typeId + '\',\'' + attr.key + '\')" style="padding:3px 10px;border:1px solid ' + (attr.required ? '#FFD9A8' : '#E5E5EA') + ';border-radius:5px;background:' + (attr.required ? '#FFF8F0' : '#fff') + ';color:' + (attr.required ? '#B35C00' : '#8E8E93') + ';font-size:10px;font-weight:700;cursor:pointer;transition:all .12s">' + (attr.required ? '필수' : '선택') + '</button>';

  // 삭제
  h += '<button onclick="_ltRemoveAttr(\'' + typeId + '\',\'' + attr.key + '\')" style="padding:3px 7px;border:1px solid #FFB3AE;border-radius:5px;background:#fff;color:#FF3B30;font-size:10px;cursor:pointer">×</button>';
  h += '</div>';
  return h;
}

// ══ 3단계: 기본정보 + 저장 + 목록 관리 ══
function _ltRenderStep3(t) {
  var h = '';
  var flatInfo = _ltGetDepthFlatInfo(t.depths);
  var depthCount = _ltCountDepth(t.depths);

  // ── 기본 정보 카드 ──
  h += '<div style="background:#fff;border-radius:12px;border:1px solid #E5E5EA;padding:20px;max-width:600px;margin-bottom:16px">';
  h += '<div style="font-size:14px;font-weight:600;color:#1D1D1F;margin-bottom:16px">\uD15C\uD50C\uB9BF \uAE30\uBCF8 \uC815\uBCF4</div>';

  // 템플릿명 + 코드
  h += '<div style="display:flex;gap:12px;margin-bottom:14px">';
  h += '<div style="flex:2"><label style="font-size:11px;font-weight:700;color:#48484A;display:block;margin-bottom:4px">\uD15C\uD50C\uB9BF\uBA85</label>';
  h += '<input type="text" value="' + t.name + '" onchange="_ltUpdateField(\'' + t.id + '\',\'name\',this.value)" style="width:100%;padding:9px 12px;border:1px solid #E5E5EA;border-radius:8px;font-size:14px;font-weight:700;outline:none;box-sizing:border-box" placeholder="\uC608: \uC815\uB2F5\u00B7\uD574\uC124 (\uB274\uB4DC\uB9BC\uC2A4)">';
  h += '</div>';
  h += '<div style="flex:1"><label style="font-size:11px;font-weight:700;color:#48484A;display:block;margin-bottom:4px">\uD15C\uD50C\uB9BF \uCF54\uB4DC</label>';
  h += '<select onchange="_ltUpdateField(\'' + t.id + '\',\'typeCode\',this.value)" style="width:100%;padding:9px 12px;border:1px solid #E5E5EA;border-radius:8px;font-size:13px;outline:none;background:#fff;font-family:monospace;box-sizing:border-box">';
  h += '<option value=""' + (!t.typeCode ? ' selected' : '') + '>\uC120\uD0DD</option>';
  Object.keys(CONTENT_TYPES).forEach(function(tc) {
    h += '<option value="' + tc + '"' + (t.typeCode === tc ? ' selected' : '') + '>' + tc + ' \u2014 ' + CONTENT_TYPES[tc].label + '</option>';
  });
  h += '</select></div></div>';

  h += '<div style="margin-bottom:14px"><label style="font-size:11px;font-weight:700;color:#48484A;display:block;margin-bottom:4px">\uC124\uBA85</label>';
  h += '<textarea onchange="_ltUpdateField(\'' + t.id + '\',\'desc\',this.value)" rows="2" style="width:100%;padding:9px 12px;border:1px solid #E5E5EA;border-radius:8px;font-size:13px;outline:none;resize:vertical;box-sizing:border-box">' + t.desc + '</textarea></div>';

  // 과목/학년/교육과정
  h += '<div style="display:flex;gap:12px;margin-bottom:14px">';
  h += '<div style="flex:1"><label style="font-size:11px;font-weight:700;color:#48484A;display:block;margin-bottom:4px">\uACFC\uBAA9</label>';
  h += '<select onchange="_ltUpdateField(\'' + t.id + '\',\'subject\',this.value)" style="width:100%;padding:9px 12px;border:1px solid #E5E5EA;border-radius:8px;font-size:13px;outline:none;background:#fff;box-sizing:border-box">';
  h += '<option value="">\uC120\uD0DD</option>';
  ['\uC218\uD559','\uC601\uC5B4','\uAD6D\uC5B4','\uD55C\uC790','\uACFC\uD559','\uC0AC\uD68C','\uC77C\uBCF8\uC5B4','\uD55C\uAD6D\uC0AC','\uB3C5\uC11C','\uC0AC\uACE0\uB825\uC218\uD559','\uCF54\uC5B4\uC218\uD559','\uC804\uACFC\uBAA9'].forEach(function(ss) {
    h += '<option value="' + ss + '"' + (t.subject === ss ? ' selected' : '') + '>' + ss + '</option>';
  });
  h += '</select></div>';
  h += '<div style="flex:1"><label style="font-size:11px;font-weight:700;color:#48484A;display:block;margin-bottom:4px">\uD559\uB144</label>';
  h += '<select onchange="_ltUpdateField(\'' + t.id + '\',\'grade\',this.value)" style="width:100%;padding:9px 12px;border:1px solid #E5E5EA;border-radius:8px;font-size:13px;outline:none;background:#fff;box-sizing:border-box">';
  h += '<option value="">\uC120\uD0DD</option>';
  ['\uC720\uC544','\uCD08\uB4F1 1~2','\uCD08\uB4F1 3~4','\uCD08\uB4F1 5~6','\uC911\uB4F1 1','\uC911\uB4F1 2','\uC911\uB4F1 3','\uACE0\uB4F1','\uC804\uD559\uB144'].forEach(function(g) {
    h += '<option value="' + g + '"' + (t.grade === g ? ' selected' : '') + '>' + g + '</option>';
  });
  h += '</select></div></div>';

  // 대표 색상
  h += '<div style="margin-bottom:14px"><label style="font-size:11px;font-weight:700;color:#48484A;display:block;margin-bottom:4px">\uB300\uD45C \uC0C9\uC0C1</label>';
  h += '<div style="display:flex;gap:6px;flex-wrap:wrap">';
  ['#0071E3','#AF52DE','#FF3B30','#34C759','#FF9500','#0891B2','#BE185D','#0071E3'].forEach(function(c) {
    h += '<div onclick="_ltUpdateField(\'' + t.id + '\',\'color\',\'' + c + '\')" style="width:28px;height:28px;border-radius:6px;background:' + c + ';cursor:pointer;border:2.5px solid ' + (t.color === c ? '#1D1D1F' : 'transparent') + '"></div>';
  });
  h += '</div></div>';

  h += '</div>';

  // ── 완성된 템플릿 요약 카드 ──
  h += '<div style="background:#fff;border-radius:12px;border:1px solid #34C759;padding:18px 20px;max-width:600px;margin-bottom:16px">';
  h += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">';
  h += '<svg viewBox="0 0 24 24" fill="none" stroke="#34C759" stroke-width="2" style="width:18px;height:18px"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';
  h += '<span style="font-size:14px;font-weight:600;color:#34C759">\uD15C\uD50C\uB9BF \uC694\uC57D</span>';
  h += '</div>';

  // Depth 구조 + 필드 매핑 시각화
  h += '<div style="margin-bottom:12px">';
  var depthColors = ['#0071E3','#AF52DE','#34C759','#FF9500','#FF3B30','#0891B2'];
  flatInfo.forEach(function(fi, idx) {
    var dc = depthColors[fi.level % depthColors.length];
    var isLast = idx === flatInfo.length - 1;
    h += '<div style="display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-bottom:' + (isLast ? 'none' : '1px solid #F5F5F7') + '">';
    h += '<div style="width:28px;height:28px;border-radius:6px;background:' + dc + '12;display:flex;align-items:center;justify-content:center;flex-shrink:0"><span style="font-size:11px;font-weight:600;color:' + dc + '">' + (fi.level + 1) + '</span></div>';
    h += '<div style="flex:1;min-width:0">';
    h += '<div style="font-size:12px;font-weight:700;color:#1D1D1F">' + fi.name;
    if(fi.subName) h += ' <span style="font-weight:400;color:#8E8E93">(' + fi.subName + ')</span>';
    h += '</div>';
    h += '<div style="font-size:10px;color:#636366;margin-top:2px">' + (fi.groupCount || 1) + '\uAC1C \uADF8\uB8F9</div>';
    if(fi.fields && fi.fields.length > 0) {
      h += '<div style="display:flex;flex-wrap:wrap;gap:3px;margin-top:4px">';
      fi.fields.forEach(function(fk) {
        var pf = LT_FIELD_POOL.find(function(p){ return p.key === fk; });
        h += '<span style="font-size:9px;padding:2px 7px;border-radius:4px;background:#F5F5F7;color:#48484A;font-weight:600;border:1px solid #E5E5EA">' + (pf ? pf.label : fk) + '</span>';
      });
      h += '</div>';
    }
    h += '</div></div>';
  });
  h += '</div>';

  // 총계
  var totalFields = 0;
  flatInfo.forEach(function(fi){ totalFields += (fi.fields ? fi.fields.length : 0); });
  h += '<div style="padding:8px 12px;background:#F0FFF4;border-radius:6px;border:1px solid #A8E6B8;font-size:11px;color:#1B8A3E;font-weight:600">';
  h += '\u2713 ' + depthCount + '\uB2E8\uACC4 \uAD6C\uC870 \u00B7 \uCD1D \uC785\uB825 \uD56D\uBAA9 ' + totalFields + '\uAC1C \u00B7 ';
  h += (t.name || '\uBBF8\uC785\uB825');
  h += '</div></div>';

  // 저장 / 복제
  h += '<div style="display:flex;gap:8px;max-width:600px">';
  h += '<button onclick="LT_STATE.editTab=\'step2\';renderLearningTypeView()" style="padding:10px 20px;border:1px solid #E5E5EA;border-radius:8px;background:#fff;color:#636366;font-size:13px;font-weight:600;cursor:pointer">\u2190 2\uB2E8\uACC4</button>';
  h += '<div style="flex:1"></div>';
  h += '<button onclick="_ltSaveAsNew(\'' + t.id + '\')" style="padding:10px 18px;border:1px solid #0071E3;border-radius:8px;background:#E8F2FF;color:#0055B8;font-size:12px;font-weight:500;cursor:pointer">\uBCF5\uC81C \uC800\uC7A5</button>';
  h += '<button onclick="toast(\'\uD15C\uD50C\uB9BF\uC774 \uC800\uC7A5\uB418\uC5C8\uC2B5\uB2C8\uB2E4\',\'t-ok\')" style="padding:10px 24px;border:none;border-radius:8px;background:#34C759;color:#fff;font-size:13px;font-weight:700;cursor:pointer">\u2713 \uC800\uC7A5</button>';
  h += '</div>';

  return h;
}


// ── 새 이름으로 저장 (복제) ──
function _ltSaveAsNew(typeId) {
  var src = LT_STATE.types.find(function(t){ return t.id === typeId; });
  if(!src) return;
  var newName = prompt('새 유형 이름을 입력하세요:', src.name + ' (복사본)');
  if(!newName || !newName.trim()) return;
  var newId = 'LT' + String(LT_STATE.types.length + 1).padStart(3, '0') + '_' + Date.now();
  var clone = JSON.parse(JSON.stringify(src));
  clone.id = newId;
  clone.name = newName.trim();
  // 새 depth ID 부여 (충돌 방지)
  _ltRegenIds(clone.depths);
  // 새 attr key 부여
  clone.attrs.forEach(function(a) {
    a.key = a.key + '_' + Date.now() + Math.random().toString(36).substr(2, 4);
  });
  LT_STATE.types.push(clone);
  LT_STATE.editingId = newId;
  LT_STATE.editTab = 'info';
  renderLearningTypeView();
  toast('새 유형 "' + newName.trim() + '"이(가) 생성되었습니다', 't-ok');
}

function _ltRegenIds(nodes) {
  if(!nodes) return;
  nodes.forEach(function(n) {
    n.id = 'dn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    if(n.children) _ltRegenIds(n.children);
  });
}

// ── 트리 조작 함수들 ──
function _ltFindNodeInTree(nodes, nodeId) {
  for(var i = 0; i < nodes.length; i++) {
    if(nodes[i].id === nodeId) return {parent:nodes, index:i, node:nodes[i]};
    if(nodes[i].children) {
      var found = _ltFindNodeInTree(nodes[i].children, nodeId);
      if(found) return found;
    }
  }
  return null;
}

function _ltTreeRename(typeId, nodeId, value) {
  var t = LT_STATE.types.find(function(t){ return t.id === typeId; });
  if(!t) return;
  var found = _ltFindNodeInTree(t.depths, nodeId);
  if(found) { found.node.name = value; renderLearningTypeView(); }
}

function _ltTreeAddChild(typeId, nodeId) {
  var t = LT_STATE.types.find(function(t){ return t.id === typeId; });
  if(!t) return;
  var found = _ltFindNodeInTree(t.depths, nodeId);
  if(!found) return;
  if(!found.node.children) found.node.children = [];
  var newId = 'dn_' + Date.now();
  found.node.children.push({id:newId, name:'새 단계', children:[]});
  renderLearningTypeView();
}

function _ltTreeRemove(typeId, nodeId) {
  var t = LT_STATE.types.find(function(t){ return t.id === typeId; });
  if(!t) return;
  var found = _ltFindNodeInTree(t.depths, nodeId);
  if(found && found.parent.length > 1) {
    found.parent.splice(found.index, 1);
    renderLearningTypeView();
  } else if(found && found.parent.length === 1) {
    toast('최소 1개의 루트 단계가 필요합니다','t-warn');
  }
}

function _ltTreeMove(typeId, nodeId, dir) {
  var t = LT_STATE.types.find(function(t){ return t.id === typeId; });
  if(!t) return;
  var found = _ltFindNodeInTree(t.depths, nodeId);
  if(!found) return;
  var arr = found.parent;
  var idx = found.index;
  var newIdx = idx + dir;
  if(newIdx < 0 || newIdx >= arr.length) return;
  var tmp = arr[idx]; arr[idx] = arr[newIdx]; arr[newIdx] = tmp;
  renderLearningTypeView();
}

// ── LT 유틸리티 함수들 ──

// 새 템플릿 유형 추가 (좌측 하단 "새 템플릿 유형" 버튼)
function _ltAddNewType() {
  var newCode = 'NEW' + Date.now().toString(36).toUpperCase().slice(-3);
  var newId = 'LT-' + newCode + '-' + Date.now().toString(36);
  var rootDepthId = 'dn_' + Date.now();
  LT_STATE.types.push({
    id: newId, name: '\uC2E0\uADDC \uD15C\uD50C\uB9BF', typeCode: newCode,
    desc: '\uC11C\uBE44\uC2A4 \uC2DC\uC2A4\uD15C + \uCF58\uD150\uCE20 \uD15C\uD50C\uB9BF\uC744 \uC785\uB825\uD558\uC138\uC694', color:'#0071E3',
    subject:'', grade:'', curriculum:'',
    depths: [{id:rootDepthId, name:'\uB2E8\uACC4 1', subName:'', groupCount:1, fields:[], children:[]}],
    attrs: [],
  });
  LT_STATE.editingId = newId;
  LT_STATE._activeGroup = newCode;
  LT_STATE.editTab = 'step1';
  renderLearningTypeView();
  toast('\uC2E0\uADDC \uD15C\uD50C\uB9BF \uC720\uD615\uC774 \uC0DD\uC131\uB418\uC5C8\uC2B5\uB2C8\uB2E4','t-ok');
}

// 기존 유형 그룹에 새 구조 추가 (좌측 "+ 구조 추가" 버튼)
function _ltAddStructure(typeCode) {
  // 해당 typeCode의 기존 구조들 참조하여 기본값 추출
  var existing = LT_STATE.types.filter(function(t){ return t.typeCode === typeCode; });
  var baseType = existing.length > 0 ? existing[0] : null;
  var labelInfo = (typeof CONTENT_TYPES !== 'undefined' && CONTENT_TYPES[typeCode]) ? CONTENT_TYPES[typeCode].label : typeCode;

  var newId = 'LT-' + typeCode + '-' + Date.now().toString(36);
  var rootDepthId = 'dn_' + Date.now();

  // 기존 구조의 depth 골격을 복제 (필드는 비우고 구조만)
  var clonedDepths;
  if(baseType && baseType.depths && baseType.depths.length > 0) {
    clonedDepths = _ltCloneDepthSkeleton(baseType.depths);
  } else {
    clonedDepths = [{id: rootDepthId, name:'\uB2E8\uACC4 1', subName:'', groupCount:1, fields:[], children:[]}];
  }

  LT_STATE.types.push({
    id: newId, name: labelInfo + ' (\uC2E0\uADDC)', typeCode: typeCode,
    desc: labelInfo + ' \uC720\uD615\uC758 \uC0C8 \uAD6C\uC870', color: baseType ? (baseType.color || '#0071E3') : '#0071E3',
    subject:'', grade:'', curriculum:'',
    depths: clonedDepths,
    attrs: baseType ? JSON.parse(JSON.stringify(baseType.attrs || [])) : [],
  });
  LT_STATE.editingId = newId;
  LT_STATE._activeGroup = typeCode;
  LT_STATE.editTab = 'step1';
  renderLearningTypeView();
  toast('\uC0C8 \uAD6C\uC870\uAC00 \uCD94\uAC00\uB418\uC5C8\uC2B5\uB2C8\uB2E4','t-ok');
}

// depth 골격 복제 (id 재생성, fields 비움)
function _ltCloneDepthSkeleton(nodes) {
  return nodes.map(function(n) {
    var newNode = {
      id: 'dn_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,6),
      name: n.name,
      subName: n.subName || '',
      groupCount: n.groupCount || 1,
      fields: [],
      children: n.children ? _ltCloneDepthSkeleton(n.children) : []
    };
    return newNode;
  });
}

// 유형 삭제 (사용 중 보호)
function _ltDeleteType(typeId) {
  // 사용 중 여부 확인
  var isInUse = false;
  Object.keys(REGISTERED_WORK_TYPES).forEach(function(k) {
    (REGISTERED_WORK_TYPES[k] || []).forEach(function(rt) {
      if(rt.ltTypeId === typeId) isInUse = true;
    });
  });
  if(isInUse) {
    toast('\uC0AC\uC6A9 \uC911\uC778 \uD15C\uD50C\uB9BF\uC740 \uC0AD\uC81C\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uBA3C\uC800 \uC791\uC5C5 \uC124\uC815\uC5D0\uC11C \uD574\uC81C\uD574 \uC8FC\uC138\uC694.','t-err');
    return;
  }
  if(!confirm('\uC774 \uAD6C\uC870\uB97C \uC0AD\uC81C\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?')) return;
  LT_STATE.types = LT_STATE.types.filter(function(t){ return t.id !== typeId; });
  if(LT_STATE.editingId === typeId) LT_STATE.editingId = null;
  renderLearningTypeView();
  toast('\uAD6C\uC870\uAC00 \uC0AD\uC81C\uB418\uC5C8\uC2B5\uB2C8\uB2E4','t-ok');
}

function _ltUpdateField(typeId, field, value) {
  var t = LT_STATE.types.find(function(t){ return t.id === typeId; });
  if(t) { t[field] = value; renderLearningTypeView(); }
}

function _ltToggleTargetSystem(typeId, sysKey) {
  var t = LT_STATE.types.find(function(t){ return t.id === typeId; });
  if(!t) return;
  if(!t.targetSystems) t.targetSystems = [];
  var idx = t.targetSystems.indexOf(sysKey);
  if(idx >= 0) {
    t.targetSystems.splice(idx, 1);
  } else {
    t.targetSystems.push(sysKey);
  }
  renderLearningTypeView();
}

function _ltAddAttr(typeId) {
  var t = LT_STATE.types.find(function(t){ return t.id === typeId; });
  if(!t) return;
  var key = 'field_' + Date.now();
  t.attrs.push({key:key, label:'새 속성', required:false, type:'text'});
  LT_STATE.editTab = 'attrs';
  renderLearningTypeView();
}

// ── DB 필드 카탈로그 팝업 ──
function _ltOpenFieldCatalog(typeId) {
  var t = LT_STATE.types.find(function(t){ return t.id === typeId; });
  if(!t) return;
  // 이미 추가된 필드 키 목록
  var usedKeys = t.attrs.map(function(a){ return a.key; });

  var overlay = document.createElement('div');
  overlay.id = 'lt-field-catalog-overlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(15,23,42,.45);z-index:9999;display:flex;align-items:center;justify-content:center;animation:fadeIn .15s';
  overlay.onclick = function(e) { if(e.target === overlay) document.body.removeChild(overlay); };

  var popup = document.createElement('div');
  popup.style.cssText = 'background:#fff;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.18);width:520px;max-height:80vh;display:flex;flex-direction:column;overflow:hidden';

  var h = '';
  h += '<div style="padding:18px 20px;border-bottom:1px solid #E5E5EA;display:flex;align-items:center;gap:10px">';
  h += '<svg viewBox="0 0 24 24" fill="none" stroke="#0071E3" stroke-width="2" style="width:20px;height:20px;flex-shrink:0"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>';
  h += '<div><div style="font-size:15px;font-weight:600;color:#1D1D1F">DB 필드 카탈로그</div>';
  h += '<div style="font-size:11px;color:#8E8E93">정의된 필드를 선택하여 속성에 추가합니다 · 목록에 없는 필드는 개발자 협의 후 추가</div></div>';
  h += '<div style="flex:1"></div>';
  h += '<button onclick="document.body.removeChild(document.getElementById(\'lt-field-catalog-overlay\'))" style="padding:4px 10px;border:1px solid #E5E5EA;border-radius:6px;background:#fff;color:#636366;font-size:18px;cursor:pointer;line-height:1">&times;</button>';
  h += '</div>';

  h += '<div style="flex:1;overflow-y:auto;padding:16px 20px">';

  // 카테고리별 그룹핑
  var categories = {};
  DB_FIELD_CATALOG.forEach(function(f) {
    if(!categories[f.category]) categories[f.category] = [];
    categories[f.category].push(f);
  });

  Object.keys(categories).forEach(function(cat) {
    h += '<div style="margin-bottom:14px">';
    h += '<div style="font-size:11px;font-weight:700;color:#636366;margin-bottom:6px;padding:4px 8px;background:#FAFAFA;border-radius:4px">' + cat + '</div>';

    categories[cat].forEach(function(f) {
      var isUsed = usedKeys.indexOf(f.key) >= 0;
      var typeIcon = f.type === 'file' ? '📎' : f.type === 'number' ? '#' : f.type === 'select' ? '▾' : '✎';
      h += '<div style="display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:8px;margin-bottom:3px;border:1px solid ' + (isUsed ? '#E5E5EA' : '#F5F5F7') + ';background:' + (isUsed ? '#FAFAFA' : '#fff') + ';opacity:' + (isUsed ? '.5' : '1') + ';transition:all .1s' + (isUsed ? '' : ';cursor:pointer') + '"' + (isUsed ? '' : ' onmouseenter="this.style.borderColor=\'#B3D7FF\';this.style.background=\'#E8F2FF\'" onmouseleave="this.style.borderColor=\'#F5F5F7\';this.style.background=\'#fff\'" onclick="_ltAddFromCatalog(\'' + typeId + '\',\'' + f.key + '\')"') + '>';
      h += '<span style="font-size:14px;width:22px;text-align:center;flex-shrink:0">' + typeIcon + '</span>';
      h += '<div style="flex:1;min-width:0">';
      h += '<div style="font-size:12px;font-weight:700;color:' + (isUsed ? '#8E8E93' : '#1D1D1F') + '">' + f.label + '</div>';
      h += '<div style="font-size:10px;color:#8E8E93;margin-top:1px">' + f.desc + '</div>';
      h += '</div>';
      h += '<span style="font-size:9px;padding:2px 6px;border-radius:3px;background:#F5F5F7;color:#636366;font-weight:600;flex-shrink:0">' + f.type + '</span>';
      if(isUsed) {
        h += '<span style="font-size:9px;padding:2px 6px;border-radius:3px;background:#E8F2FF;color:#0055B8;font-weight:600;flex-shrink:0">추가됨</span>';
      }
      h += '</div>';
    });
    h += '</div>';
  });

  h += '<div style="padding:12px;background:#FFF8F0;border-radius:8px;border:1px solid #FEF08A;margin-top:8px">';
  h += '<div style="font-size:11px;color:#B35C00;font-weight:600">필요한 필드가 없나요?</div>';
  h += '<div style="font-size:10px;color:#A16207;margin-top:2px">시스템 관리자 또는 개발자에게 신규 필드 추가를 요청하세요.</div>';
  h += '</div>';

  h += '</div>';
  popup.innerHTML = h;
  overlay.appendChild(popup);
  document.body.appendChild(overlay);
}

function _ltAddFromCatalog(typeId, fieldKey) {
  var t = LT_STATE.types.find(function(t){ return t.id === typeId; });
  if(!t) return;
  // 이미 추가된 필드인지 체크
  if(t.attrs.some(function(a){ return a.key === fieldKey; })) {
    toast('이미 추가된 필드입니다','t-warn');
    return;
  }
  var field = DB_FIELD_CATALOG.find(function(f){ return f.key === fieldKey; });
  if(!field) return;

  var newAttr = {key:field.key, label:field.label, required:false, type:field.type};
  if(field.options) newAttr.options = field.options.slice();
  t.attrs.push(newAttr);

  // 팝업 닫고 새로고침
  var ov = document.getElementById('lt-field-catalog-overlay');
  if(ov) document.body.removeChild(ov);
  LT_STATE.editTab = 'attrs';
  renderLearningTypeView();
  toast('"' + field.label + '" 필드가 추가되었습니다','t-ok');
}

function _ltUpdateAttrField(typeId, attrKey, field, value) {
  var t = LT_STATE.types.find(function(t){ return t.id === typeId; });
  if(!t) return;
  var a = t.attrs.find(function(a){ return a.key === attrKey; });
  if(a) { a[field] = value; }
}

function _ltToggleRequired(typeId, attrKey) {
  var t = LT_STATE.types.find(function(t){ return t.id === typeId; });
  if(t) {
    var a = t.attrs.find(function(a){ return a.key === attrKey; });
    if(a) { a.required = !a.required; renderLearningTypeView(); }
  }
}

function _ltRemoveAttr(typeId, attrKey) {
  var t = LT_STATE.types.find(function(t){ return t.id === typeId; });
  if(t) {
    t.attrs = t.attrs.filter(function(a){ return a.key !== attrKey; });
    renderLearningTypeView();
  }
}

// ═══════════════════════════════════════════════
//  ■ 콘텐츠 콘텐츠 묶음 관리 뷰
// ═══════════════════════════════════════════════
function renderBundleHubView() {
  const el = document.getElementById('bundleHubContent');
  if(!el) return;
  const S = BUNDLE_HUB_STATE;

  let bundles = [...CONTENT_BUNDLES];
  if(S.search) {
    const q = S.search.toLowerCase();
    bundles = bundles.filter(b => b.name.toLowerCase().includes(q) || b.masterSubjectName.toLowerCase().includes(q) || b.masterSubject.toLowerCase().includes(q));
  }
  if(S.filterStatus !== 'all') bundles = bundles.filter(b => b.status === S.filterStatus);
  if(S.filterSyncMode !== 'all') bundles = bundles.filter(b => b.syncMode === S.filterSyncMode);

  const totalBundles = CONTENT_BUNDLES.length;
  const activeBundles = CONTENT_BUNDLES.filter(b => b.status === 'active').length;
  const totalLinked = CONTENT_BUNDLES.reduce((a,b) => a + b.linkedSubjects.length, 0);
  const autoItems = STATE.workflowItems.filter(i => i.bundleRole === 'spoke').length;
  const totalSystems = new Set(CONTENT_BUNDLES.flatMap(b => b.linkedSystems || [])).size;

  el.innerHTML = '<div style="padding:20px;max-width:1200px;margin:0 auto">'
    + _bhBanner(totalBundles, totalLinked, autoItems, totalSystems)
    + _bhFilters(S)
    + '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:14px">'
    + (bundles.length === 0
        ? '<div style="text-align:center;padding:30px;color:var(--c-gray-400);font-size:12px;background:#fff;border:1px solid var(--c-gray-200);border-radius:10px;grid-column:1/-1">조건에 맞는 묶음이 없습니다</div>'
        : bundles.map(b => _bhCard(b, S)).join(''))
    + '</div>'
    + '</div>';
}

// ── 콘텐츠 묶음 관리 서브 렌더 함수들 (template literal 중첩 방지) ──

function _bhBanner(totalBundles, totalLinked, autoItems, totalSystems) {
  // 설정 완료된 메인코드 수
  var configuredMainCodes = Object.keys(REGISTERED_WORK_TYPES).filter(function(k) {
    return REGISTERED_WORK_TYPES[k] && REGISTERED_WORK_TYPES[k].length > 0;
  }).length;
  var totalSubjectCodes = Object.keys(SUBJECT_TYPE_MAP).length;
  var unbundledCodes = totalSubjectCodes - configuredMainCodes;

  return '<div style="display:flex;flex-direction:column;gap:12px;margin-bottom:16px;padding:16px 20px;background:#FFF8F0;border:1px solid #FFD9A8;border-radius:10px">'
    + '<div style="display:flex;align-items:center;gap:10px">'
    + '<span style="font-size:11px;padding:3px 10px;border-radius:5px;background:#FFF8F0;color:#B35C00;font-weight:600;border:1px solid #FFD9A8;font-family:monospace">MAIN</span>'
    + '<span style="color:#FF9500;font-weight:600">\u2501\u2501\u25B6</span>'
    + '<span style="font-size:11px;padding:3px 10px;border-radius:5px;background:#E8F2FF;color:#0055B8;font-weight:600;border:1px solid #B3D7FF;font-family:monospace">SUB \u00D7N</span>'
    + '<span style="font-size:12px;color:#78350F;font-weight:600;margin-left:8px">설정 완료된 메인코드에 미등록 코드를 묶어 운영</span>'
    + '</div>'
    + '<div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#78350F;padding:8px 12px;background:rgba(255,255,255,.5);border-radius:6px">'
    + '<svg viewBox="0 0 24 24" fill="none" stroke="#B35C00" stroke-width="2" style="width:14px;height:14px;flex-shrink:0"><path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
    + '<span><strong>' + configuredMainCodes + '</strong>개 메인코드 설정됨 · <strong>' + unbundledCodes + '</strong>개 미등록 코드 묶음 대상</span>'
    + '</div>'
    + '<div style="display:flex;gap:14px">'
    + '<div style="text-align:center"><span style="font-size:18px;font-weight:600;color:#FF9500">' + totalBundles + '</span><div style="font-size:9px;color:#B35C00">\uBB36\uC74C</div></div>'
    + '<div style="text-align:center"><span style="font-size:18px;font-weight:600;color:#0071E3">' + totalLinked + '</span><div style="font-size:9px;color:#0055B8">\uC5F0\uACB0</div></div>'
    + '<div style="text-align:center"><span style="font-size:18px;font-weight:600;color:#AF52DE">' + autoItems + '</span><div style="font-size:9px;color:#8944AB">\uC790\uB3D9\uC0DD\uC131</div></div>'
    + '<div style="text-align:center"><span style="font-size:18px;font-weight:600;color:#34C759">' + totalSystems + '</span><div style="font-size:9px;color:#1B8A3E">\uC5F0\uACC4</div></div>'
    + '</div></div>';
}

function _bhFilters(S) {
  var h = '<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;flex-wrap:wrap">';
  h += '<input type="text" placeholder="\uD83D\uDD0D \uACFC\uBAA9\uCF54\uB4DC\u00B7\uC774\uB984 \uAC80\uC0C9" value="' + S.search + '" oninput="BUNDLE_HUB_STATE.search=this.value;renderBundleHubView()" style="flex:1;min-width:160px;padding:6px 10px;border:1px solid var(--c-gray-200);border-radius:6px;font-size:11px;outline:none">';
  h += '<select onchange="BUNDLE_HUB_STATE.filterStatus=this.value;renderBundleHubView()" style="padding:5px 8px;border:1px solid var(--c-gray-200);border-radius:6px;font-size:10px;outline:none;cursor:pointer">';
  h += '<option value="all"' + (S.filterStatus==='all'?' selected':'') + '>\uC804\uCCB4</option>';
  h += '<option value="active"' + (S.filterStatus==='active'?' selected':'') + '>\uD65C\uC131</option>';
  h += '<option value="paused"' + (S.filterStatus==='paused'?' selected':'') + '>\uC815\uC9C0</option></select>';
  h += '<select onchange="BUNDLE_HUB_STATE.filterSyncMode=this.value;renderBundleHubView()" style="padding:5px 8px;border:1px solid var(--c-gray-200);border-radius:6px;font-size:10px;outline:none;cursor:pointer">';
  h += '<option value="all"' + (S.filterSyncMode==='all'?' selected':'') + '>\uBAA8\uB4E0 \uBAA8\uB4DC</option>';
  h += '<option value="full"' + (S.filterSyncMode==='full'?' selected':'') + '>\uC644\uC804\uB3D9\uAE30\uD654</option>';
  h += '<option value="override"' + (S.filterSyncMode==='override'?' selected':'') + '>\uAC1C\uBCC4\uC218\uC815</option></select>';
  h += '<button onclick="bundleOpenCreate()" style="padding:6px 14px;border:none;border-radius:6px;background:#FF9500;color:#fff;font-size:11px;font-weight:500;cursor:pointer">\uFF0B \uC0C8 \uBB36\uC74C</button>';
  h += '</div>';
  return h;
}

function _bhCard(b, S) {
  var typeInfo = getTypeInfo(b.typeCode);
  var wfItems = STATE.workflowItems.filter(function(i){ return i.bundleId === b.id; });
  var hubCnt = wfItems.filter(function(i){ return i.bundleRole==='hub'; }).length;
  var spokeCnt = wfItems.filter(function(i){ return i.bundleRole==='spoke'; }).length;
  var isExpanded = S.expandedBundleId === b.id;
  var isPaused = b.status === 'paused';
  var isEditingSys = S.editingSystemsId === b.id;
  var systems = b.linkedSystems || [];

  // border color similar to kanban cards
  var borderColor = '#FFD9A8';
  var borderLeft = '#FF9500';

  var h = '<div style="background:#fff;border:1px solid ' + (isExpanded ? '#FF9500' : 'var(--c-gray-200)') + ';border-radius:10px;border-left:3px solid ' + borderLeft + ';transition:all .15s;overflow:hidden'
    + (isPaused ? ';opacity:.55' : '')
    + (isExpanded ? ';box-shadow:0 2px 12px rgba(245,158,11,.1)' : '')
    + '" onmouseenter="this.style.boxShadow=\'0 2px 8px rgba(0,0,0,.07)\'" onmouseleave="this.style.boxShadow=\'' + (isExpanded?'0 2px 12px rgba(245,158,11,.1)':'') + '\'">';

  // ── 카드 상단: 과정명 + 과목코드 배지 ──
  h += '<div style="padding:10px 12px 0;cursor:pointer" onclick="BUNDLE_HUB_STATE.expandedBundleId=BUNDLE_HUB_STATE.expandedBundleId===\'' + b.id + '\'?null:\'' + b.id + '\';renderBundleHubView()">';

  // ① 묶음명 + 유형배지 + 상태
  h += '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:6px;margin-bottom:7px">';
  h += '<div style="font-size:12px;font-weight:600;color:#202124;line-height:1.4;min-width:0">' + b.name + '</div>';
  h += '<div style="display:flex;gap:4px;flex-shrink:0;align-items:center">';
  h += '<span style="font-size:9px;padding:2px 8px;border-radius:4px;background:' + typeInfo.bg + ';color:' + typeInfo.color + ';font-weight:700;border:1px solid ' + (typeInfo.border||typeInfo.bg) + '">' + typeInfo.icon + ' ' + typeInfo.label + '</span>';
  h += '<span style="font-size:8px;padding:2px 6px;border-radius:4px;background:' + (b.syncMode==='full'?'#E8F2FF':'#FFF8F0') + ';color:' + (b.syncMode==='full'?'#0055B8':'#B35C00') + ';font-weight:700">' + (b.syncMode==='full'?'\uD83D\uDD12\uB3D9\uAE30\uD654':'\u270F\uAC1C\uBCC4') + '</span>';
  if(isPaused) h += '<span style="font-size:8px;padding:2px 6px;border-radius:4px;background:#FFF2F1;color:#FF3B30;font-weight:700">\u23F8\uC815\uC9C0</span>';
  h += '</div></div>';

  // ② 연결과목 (Hub→Spoke 매핑) — 칸반 카드와 동일 패턴
  h += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:7px;padding:6px 8px;background:#FAFAFA;border:1px solid #E5E5EA;border-radius:6px">';
  h += '<div style="display:flex;flex-direction:column;gap:2px;flex-shrink:0;align-items:center">';
  h += '<span style="font-size:11px;padding:2px 8px;border-radius:4px;background:var(--c-primary);color:#fff;font-weight:600;font-family:\'SF Mono\',Menlo,monospace;letter-spacing:.06em">' + b.masterSubject + '</span>';
  h += '<span style="font-size:7px;font-weight:600;color:var(--c-primary)">Main</span>';
  h += '</div>';
  h += '<div style="flex:1;display:flex;align-items:center;gap:0;min-width:24px">';
  h += '<div style="flex:1;height:1px;background:var(--c-gray-300)"></div>';
  h += '<span style="font-size:9px;color:#FF9500;font-weight:600;padding:0 2px">\u25B6</span>';
  h += '</div>';
  h += '<div style="display:flex;gap:3px;flex-wrap:wrap">';
  b.linkedSubjects.forEach(function(lc){
    var sn = _SUBJECT_NAME_MAP[lc] || lc;
    h += '<span style="font-size:9px;padding:2px 7px;border-radius:4px;background:#2C2C2E;color:#fff;font-weight:700;font-family:\'SF Mono\',Menlo,monospace" title="' + sn + '">' + lc + '</span>';
  });
  h += '</div></div>';

  // ③ 커리큘럼 연계 시스템 — 선택·편집 가능
  h += '<div style="margin-bottom:7px">';
  h += '<div style="font-size:9px;color:var(--c-gray-500);font-weight:600;margin-bottom:4px;display:flex;align-items:center;gap:6px">';
  h += '\uCEE4\uB9AC\uD058\uB7FC \uC5F0\uACC4 \uC2DC\uC2A4\uD15C :';
  h += '<button onclick="event.stopPropagation();_bhToggleSysEdit(\'' + b.id + '\')" style="font-size:8px;padding:1px 6px;border-radius:3px;border:1px solid ' + (isEditingSys?'#FF9500':'var(--c-gray-200)') + ';background:' + (isEditingSys?'#FFF8F0':'#fff') + ';color:' + (isEditingSys?'#B35C00':'var(--c-gray-500)') + ';cursor:pointer;font-weight:600">' + (isEditingSys?'\u2714 \uC644\uB8CC':'\u270F \uD3B8\uC9D1') + '</button>';
  h += '</div>';

  if(isEditingSys) {
    // 편집 모드: 전체 시스템 목록을 체크박스로 표시
    h += '<div style="display:flex;gap:4px;flex-wrap:wrap;padding:6px 8px;background:#FFF8F0;border:1px solid #FFD9A8;border-radius:6px">';
    AVAILABLE_SYSTEMS.forEach(function(sys){
      var isOn = systems.indexOf(sys) >= 0;
      h += '<label style="display:flex;align-items:center;gap:3px;font-size:9px;padding:3px 8px;border-radius:4px;background:' + (isOn?'#F0FFF4':'#F5F5F7') + ';border:1px solid ' + (isOn?'#6EE7B7':'var(--c-gray-200)') + ';cursor:pointer;font-weight:' + (isOn?'700':'500') + ';color:' + (isOn?'#1B8A3E':'var(--c-gray-500)') + '">';
      h += '<input type="checkbox" ' + (isOn?'checked':'') + ' onchange="event.stopPropagation();_bhToggleSystem(\'' + b.id + '\',\'' + sys + '\')" style="margin:0;width:12px;height:12px;accent-color:#34C759">';
      h += sys + '</label>';
    });
    h += '</div>';
  } else {
    // 읽기 모드
    if(systems.length > 0) {
      h += '<div style="display:flex;gap:4px;flex-wrap:wrap">';
      systems.forEach(function(sys){
        h += '<span style="font-size:9px;padding:2px 8px;border-radius:4px;background:#E8F5E9;color:#2E7D32;font-weight:600;border:1px solid #A5D6A7">' + sys + '</span>';
      });
      h += '</div>';
    } else {
      h += '<span style="font-size:9px;color:#FF9500;font-weight:600">\u26A0 \uC5F0\uACC4 \uC2DC\uC2A4\uD15C \uBBF8\uC124\uC815</span>';
    }
  }
  h += '</div>';

  // ④ 진행률 & 통계
  var totalWf = wfItems.length;
  var doneWf = wfItems.filter(function(i){ return i.phase==='deploy'; }).length;
  var pctWf = totalWf > 0 ? Math.round(doneWf / totalWf * 100) : 0;
  var prgColor = pctWf === 100 ? '#34C759' : pctWf > 0 ? '#FF9500' : '#E5E5EA';

  h += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">';
  h += '<div style="flex:1;height:3px;border-radius:2px;background:#F5F5F7;overflow:hidden">';
  h += '<div style="height:100%;width:' + pctWf + '%;background:' + prgColor + ';border-radius:2px;transition:width .3s"></div></div>';
  h += '<span style="font-size:8px;font-weight:700;color:' + (prgColor==='#E5E5EA'?'var(--c-gray-400)':prgColor) + ';min-width:28px;text-align:right">' + pctWf + '%</span>';
  h += '<span style="font-size:8px;padding:1px 5px;border-radius:4px;background:#FFF8F0;color:#B35C00;font-weight:700;border:1px solid #FFD9A8">M' + hubCnt + ' \u00B7 S' + spokeCnt + '</span>';
  h += '</div>';

  // ⑤ 하단: 담당자 + 액션
  h += '<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0 8px;border-top:1px solid #F1F3F4">';
  h += '<span style="font-size:9px;color:var(--c-gray-400)">' + b.createdAt + ' \u00B7 ' + b.createdBy + '</span>';
  h += '<div style="display:flex;gap:4px;align-items:center">';
  h += '<button onclick="event.stopPropagation();bundleToggleStatus(\'' + b.id + '\')" style="font-size:8px;padding:2px 8px;border-radius:4px;border:1px solid ' + (isPaused?'#6EE7B7':'#FFB3AE') + ';background:' + (isPaused?'#F0FFF4':'#FFF2F1') + ';color:' + (isPaused?'#34C759':'#FF3B30') + ';font-weight:700;cursor:pointer">' + (isPaused?'\u25B6 \uD65C\uC131\uD654':'\u23F8 \uC815\uC9C0') + '</button>';
  h += '<button onclick="event.stopPropagation();bundleToggleSync(\'' + b.id + '\')" style="font-size:8px;padding:2px 8px;border-radius:4px;border:1px solid #B3D7FF;background:#E8F2FF;color:#0071E3;font-weight:700;cursor:pointer">' + (b.syncMode==='full'?'\u2192 \uAC1C\uBCC4\uC218\uC815':'\u2192 \uB3D9\uAE30\uD654') + '</button>';
  h += '<span style="font-size:12px;color:var(--c-gray-300);transform:rotate(' + (isExpanded?180:0) + 'deg);transition:transform .2s;display:inline-block">\u25BE</span>';
  h += '</div></div>';

  h += '</div>'; // end card upper area

  // ⑥ 확장 영역: 칸반 아이템 상세
  if(isExpanded) {
    h += '<div style="padding:10px 12px;background:var(--c-gray-50);border-top:1px solid var(--c-gray-100)">';
    h += '<div style="font-size:10px;font-weight:600;color:var(--c-gray-600);margin-bottom:8px;display:flex;align-items:center;gap:6px">';
    h += '\uD83D\uDCCB \uCE78\uBC18 \uC544\uC774\uD15C ' + totalWf + '\uAC74';
    h += '<span style="font-size:9px;color:var(--c-gray-400);flex:1;font-weight:400">' + b.description + '</span>';
    h += '</div>';
    if(totalWf === 0) {
      h += '<div style="text-align:center;padding:14px;color:var(--c-gray-400);font-size:11px">\uCE78\uBC18\uC5D0\uC11C \uC791\uC5C5 \uB4F1\uB85D \uC2DC \uC790\uB3D9\uC73C\uB85C \uBB36\uC74C \uC801\uC6A9</div>';
    } else {
      h += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:5px">';
      wfItems.forEach(function(wi){
        var wP = WF_PHASES.find(function(p){ return p.id===wi.phase; }) || WF_PHASES[0];
        var isH = wi.bundleRole==='hub';
        h += '<div style="background:#fff;border:1px solid var(--c-gray-200);border-radius:6px;padding:6px 8px;border-left:3px solid ' + (isH?'var(--c-primary)':'#636366') + '">';
        h += '<div style="display:flex;align-items:center;gap:4px">';
        h += '<span style="font-size:7px;padding:1px 4px;border-radius:2px;background:' + (isH?'var(--c-primary-l)':'#F5F5F7') + ';color:' + (isH?'var(--c-primary)':'#48484A') + ';font-weight:600;font-family:monospace">' + (isH?'MAIN':'SUB') + '</span>';
        h += '<span style="font-size:9px;font-weight:700;color:var(--c-gray-700);flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + wi.title + '</span>';
        h += '<span style="font-size:7px;padding:1px 5px;border-radius:3px;background:' + wP.bg + ';color:' + wP.color + ';font-weight:700">' + wP.label + '</span>';
        h += '</div></div>';
      });
      h += '</div>';
    }
    h += '</div>';
  }

  h += '</div>'; // end card root
  return h;
}

// 연계 시스템 편집 모드 토글
function _bhToggleSysEdit(bundleId) {
  if(BUNDLE_HUB_STATE.editingSystemsId === bundleId) {
    BUNDLE_HUB_STATE.editingSystemsId = null;
  } else {
    BUNDLE_HUB_STATE.editingSystemsId = bundleId;
    // 편집 시 해당 카드는 자동 확장
    BUNDLE_HUB_STATE.expandedBundleId = bundleId;
  }
  renderBundleHubView();
}

// 연계 시스템 토글 (개별 체크박스)
function _bhToggleSystem(bundleId, systemName) {
  var b = CONTENT_BUNDLES.find(function(x){ return x.id === bundleId; });
  if(!b) return;
  if(!b.linkedSystems) b.linkedSystems = [];
  var idx = b.linkedSystems.indexOf(systemName);
  if(idx >= 0) {
    b.linkedSystems.splice(idx, 1);
    toast('\uD83D\uDD17 "' + b.name + '" \u2190 ' + systemName + ' \uC5F0\uACB0 \uD574\uC81C', 't-info');
  } else {
    b.linkedSystems.push(systemName);
    toast('\uD83D\uDD17 "' + b.name + '" \u2192 ' + systemName + ' \uC5F0\uACB0', 't-ok');
  }
  renderBundleHubView();
}

// 묶음 상태 토글
function bundleToggleStatus(bundleId) {
  const b = CONTENT_BUNDLES.find(x => x.id === bundleId);
  if(!b) return;
  b.status = b.status === 'active' ? 'paused' : 'active';
  toast(`📦 "${b.name}" ${b.status==='active'?'활성화':'일시정지'}됨`, 't-ok');
  renderBundleHubView();
}

// 동기화 모드 토글
function bundleToggleSync(bundleId) {
  const b = CONTENT_BUNDLES.find(x => x.id === bundleId);
  if(!b) return;
  b.syncMode = b.syncMode === 'full' ? 'override' : 'full';
  toast(`📦 "${b.name}" → ${b.syncMode==='full'?'완전동기화':'개별수정 허용'} 모드`, 't-ok');
  renderBundleHubView();
}

// AI 추천에서 빠르게 묶음 생성
function bundleQuickCreate(masterCode, typeCode, linkedCodesStr) {
  const masterName = SUBJECT_TYPE_MAP[masterCode]?.name || masterCode;
  const typeLabel = getTypeLabel(typeCode);
  const linkedCodes = linkedCodesStr.split(',');
  const newId = 'bnd' + (Date.now()).toString(36);
  CONTENT_BUNDLES.push({
    id: newId,
    name: `${masterName} ${typeLabel} 묶음`,
    masterSubject: masterCode,
    masterSubjectName: masterName,
    typeCode: typeCode,
    typeName: typeLabel,
    linkedSubjects: linkedCodes,
    linkedSystems: ['뉴드림스'],  // 기본 시스템
    syncMode: 'full',
    status: 'active',
    createdAt: new Date().toISOString().slice(0,10),
    createdBy: '관리자',
    description: `[${masterName}] ${masterCode} ${typeLabel} → ${linkedCodes.map(c=>(_SUBJECT_NAME_MAP[c]||c)).join('·')} 자동 적용`
  });
  toast(`📦 새 묶음 생성: [${masterName}] ${masterCode} ${typeLabel}`, 't-ok');
  BUNDLE_HUB_STATE.expandedBundleId = newId;
  renderBundleHubView();
}

// 새 묶음 만들기 모달
function bundleOpenCreate() {
  const subjectKeys = Object.keys(SUBJECT_TYPE_MAP);
  showConfirm(
    '📦 새 콘텐츠 묶음 만들기',
    `<div style="font-size:12px;color:var(--c-gray-600);margin-bottom:14px">
      Main Code에서 등록한 콘텐츠가 Sub Code에 자동으로 적용됩니다.
    </div>
    <div style="display:flex;flex-direction:column;gap:10px">
      <div>
        <div style="font-size:10px;font-weight:600;color:var(--c-gray-500);margin-bottom:3px">묶음 이름 *</div>
        <input id="bndName" type="text" placeholder="예: 수학 계열 채점 묶음" style="width:100%;padding:6px 8px;border:1px solid var(--c-gray-200);border-radius:6px;font-size:11px;outline:none;box-sizing:border-box">
      </div>
      <div style="display:flex;gap:8px">
        <div style="flex:1">
          <div style="font-size:10px;font-weight:600;color:var(--c-gray-500);margin-bottom:3px">Main Code *</div>
          <select id="bndMaster" style="width:100%;padding:6px 8px;border:1px solid var(--c-gray-200);border-radius:6px;font-size:11px;outline:none" onchange="bndUpdateLinked()">
            <option value="">선택</option>
            ${subjectKeys.map(sk => `<option value="${sk}">${SUBJECT_TYPE_MAP[sk].name} (${sk})</option>`).join('')}
          </select>
        </div>
        <div style="flex:1">
          <div style="font-size:10px;font-weight:600;color:var(--c-gray-500);margin-bottom:3px">콘텐츠 템플릿 *</div>
          <select id="bndType" style="width:100%;padding:6px 8px;border:1px solid var(--c-gray-200);border-radius:6px;font-size:11px;outline:none">
            <option value="">유형 선택</option>
            ${Object.values(CONTENT_TYPES).map(t => `<option value="${t.code}">${t.icon} ${t.label} [${t.code}]</option>`).join('')}
          </select>
        </div>
      </div>
      <div>
        <div style="font-size:10px;font-weight:600;color:var(--c-gray-500);margin-bottom:3px">Sub Code — 체크하세요</div>
        <div id="bndLinkedList" style="display:flex;flex-wrap:wrap;gap:6px;padding:8px;background:var(--c-gray-50);border-radius:8px;border:1px solid var(--c-gray-200);min-height:36px">
          <span style="font-size:11px;color:var(--c-gray-400)">먼저 대표 과목을 선택하면 children 과목이 자동 표시됩니다</span>
        </div>
      </div>
      <div>
        <div style="font-size:10px;font-weight:600;color:var(--c-gray-500);margin-bottom:3px">동기화 모드</div>
        <select id="bndSync" style="width:100%;padding:6px 8px;border:1px solid var(--c-gray-200);border-radius:6px;font-size:11px;outline:none">
          <option value="full">🔒 완전 동기화 — Main 변경 시 Sub도 자동 반영</option>
          <option value="override">✏ 개별 수정 허용 — Sub에서 내용 수정 가능</option>
        </select>
      </div>
      <div>
        <div style="font-size:10px;font-weight:600;color:var(--c-gray-500);margin-bottom:3px">커리큘럼 연계 시스템</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;padding:8px;background:var(--c-gray-50);border-radius:8px;border:1px solid var(--c-gray-200)">
          ${AVAILABLE_SYSTEMS.map(sys => `<label style="display:flex;align-items:center;gap:3px;font-size:10px;padding:3px 8px;border-radius:4px;background:#E8F5E9;border:1px solid #A5D6A7;cursor:pointer">
            <input type="checkbox" class="bnd-sys-cb" value="${sys}" checked style="margin:0;width:12px;height:12px;accent-color:#34C759">
            <span style="font-weight:600;color:#2E7D32">${sys}</span>
          </label>`).join('')}
        </div>
      </div>
      <div>
        <div style="font-size:10px;font-weight:600;color:var(--c-gray-500);margin-bottom:3px">설명</div>
        <input id="bndDesc" type="text" placeholder="이 묶음의 목적을 간략히 입력" style="width:100%;padding:6px 8px;border:1px solid var(--c-gray-200);border-radius:6px;font-size:11px;outline:none;box-sizing:border-box">
      </div>
    </div>`,
    () => { bundleSubmitCreate(); },
    '📦 묶음 생성',
    '취소'
  );
}

function bndUpdateLinked() {
  const masterCode = document.getElementById('bndMaster')?.value;
  const container = document.getElementById('bndLinkedList');
  if(!container || !masterCode) return;
  const master = SUBJECT_TYPE_MAP[masterCode];
  if(!master) { container.innerHTML = '<span style="font-size:11px;color:var(--c-gray-400)">해당 과목에 children이 없습니다. 아래 전체 과목에서 수동 선택하세요.</span>'; return; }
  const allSubjects = Object.entries(SUBJECT_TYPE_MAP).filter(([k]) => k !== masterCode);
  const childrenSet = new Set(master.children || []);
  container.innerHTML = allSubjects.map(([code, info]) => {
    const isChild = childrenSet.has(code);
    return `<label style="display:flex;align-items:center;gap:4px;font-size:10px;padding:3px 8px;border-radius:4px;background:${isChild?'#FFF8F0':'var(--c-gray-50)'};border:1px solid ${isChild?'#FFD9A8':'var(--c-gray-200)'};cursor:pointer">
      <input type="checkbox" class="bnd-linked-cb" value="${code}" ${isChild?'checked':''} style="margin:0">
      <span style="font-weight:${isChild?'700':'400'};color:${isChild?'#B35C00':'var(--c-gray-600)'}">${info.name} <strong style="font-family:monospace">(${code})</strong></span>
    </label>`;
  }).join('');
}

function bundleSubmitCreate() {
  const name = document.getElementById('bndName')?.value?.trim();
  const masterCode = document.getElementById('bndMaster')?.value;
  const typeCode = document.getElementById('bndType')?.value;
  const syncMode = document.getElementById('bndSync')?.value || 'full';
  const desc = document.getElementById('bndDesc')?.value?.trim() || '';
  if(!name || !masterCode || !typeCode) { toast('묶음 이름, 대표 과목, 콘텐츠 템플릿은 필수입니다', 't-warn'); return; }
  const linkedCodes = [...document.querySelectorAll('.bnd-linked-cb:checked')].map(cb => cb.value);
  if(linkedCodes.length === 0) { toast('연결 과목을 최소 1개 선택하세요', 't-warn'); return; }
  const linkedSystems = [...document.querySelectorAll('.bnd-sys-cb:checked')].map(cb => cb.value);
  const masterName = SUBJECT_TYPE_MAP[masterCode]?.name || masterCode;
  const newId = 'bnd' + (Date.now()).toString(36);
  CONTENT_BUNDLES.push({
    id: newId, name, masterSubject: masterCode, masterSubjectName: masterName,
    typeCode, typeName: getTypeLabel(typeCode), linkedSubjects: linkedCodes,
    linkedSystems: linkedSystems,
    syncMode, status: 'active',
    createdAt: new Date().toISOString().slice(0,10), createdBy: '관리자',
    description: desc || `[${masterName}] ${masterCode} ${getTypeLabel(typeCode)} → ${linkedCodes.map(c=>'['+(_SUBJECT_NAME_MAP[c]||c)+'] '+c).join(' · ')} 자동 적용`
  });
  toast(`📦 새 묶음 생성 완료: ${name}`, 't-ok');
  BUNDLE_HUB_STATE.expandedBundleId = newId;
  renderBundleHubView();
}

function renderServiceDistView() {
  const wrap = document.getElementById('serviceDistContent');
  if(!wrap) return;

  const allItems = SERVICE_DIST_DATA;
  const subjectMap = new Map();
  allItems.forEach(i => { if(!subjectMap.has(i.subject)) subjectMap.set(i.subject, i.subjectCode || i.subject); });
  const subjects = [...subjectMap.entries()].sort((a,b) => a[0].localeCompare(b[0]));
  const statusLabels = {deployed:'배포완료', pending:'대기중', none:'미등록', reviewed:'검수완료'};
  const statusColors = {deployed:{color:'#34C759',bg:'#F0FFF4',border:'#A8E6B8'}, pending:{color:'#FF9500',bg:'#FFF8F0',border:'#FFD9A8'}, none:{color:'#AEAEB2',bg:'#F5F5F7',border:'#E5E5EA'}, reviewed:{color:'#AF52DE',bg:'#F9F0FF',border:'#D9B3F0'}};

  // 필터 적용
  let items = [...allItems];
  if(SD_FILTER.subject !== 'all') items = items.filter(i => i.subject === SD_FILTER.subject);
  if(SD_FILTER.status !== 'all') {
    items = items.filter(i => {
      if(SD_FILTER.status === 'all-deployed') return SERVICE_PLATFORMS.every(p => i.platforms[p.id] === 'deployed');
      if(SD_FILTER.status === 'partial') return SERVICE_PLATFORMS.some(p => i.platforms[p.id] === 'deployed') && SERVICE_PLATFORMS.some(p => i.platforms[p.id] !== 'deployed');
      if(SD_FILTER.status === 'not-deployed') return SERVICE_PLATFORMS.every(p => i.platforms[p.id] !== 'deployed');
      return true;
    });
  }
  if(SD_FILTER.platform !== 'all') {
    items = items.filter(i => i.platforms[SD_FILTER.platform] === 'deployed' || i.platforms[SD_FILTER.platform] === 'pending');
  }

  // 통계
  const totalDeployed = allItems.filter(i => i.cmsStatus === 'deployed').length;
  const allPlatformDone = allItems.filter(i => SERVICE_PLATFORMS.every(p => i.platforms[p.id] === 'deployed')).length;
  const platformStats = SERVICE_PLATFORMS.map(p => ({
    ...p,
    deployed: allItems.filter(i => i.platforms[p.id] === 'deployed').length,
    pending: allItems.filter(i => i.platforms[p.id] === 'pending').length,
    none: allItems.filter(i => i.platforms[p.id] === 'none' || !i.platforms[p.id]).length,
  }));

  wrap.innerHTML = `
  <div style="display:flex;flex-direction:column;height:100%;overflow:hidden">
    <!-- 연계 시스템 안내 -->
    <div style="flex-shrink:0;padding:12px 20px;background:linear-gradient(135deg,#E8F2FF,#F0FFF4);border-bottom:1px solid #BAE6FD">
      <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="width:6px;height:6px;border-radius:50%;background:#34C759"></span>
          <span style="font-size:11px;font-weight:700;color:#1B8A3E">뉴드림스</span>
          <span style="font-size:10px;color:#8E8E93">기본 연계 (배치 수신)</span>
        </div>
        <span style="color:#D1D1D6">│</span>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${AVAILABLE_SYSTEMS.filter(s=>s!=='뉴드림스').map(s => '<span style="font-size:10px;padding:2px 8px;border-radius:4px;background:#fff;border:1px solid #E5E5EA;color:#48484A;font-weight:600">' + s + '</span>').join('')}
        </div>
        <span style="font-size:10px;color:#8E8E93;margin-left:auto">배치 처리 현황을 시각적으로 확인하고, 플랫폼별 배포 상태를 관리합니다</span>
      </div>
    </div>
    <!-- 플랫폼 요약 카드 -->
    <div style="flex-shrink:0;padding:16px 20px;border-bottom:1px solid var(--c-gray-200);background:#fff">
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:14px">
        <!-- CMS 전체 -->
        <div style="background:linear-gradient(135deg,#0071E3,#AF52DE);border-radius:12px;padding:14px 16px;color:#fff">
          <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;opacity:.7">CMS 배포 완료</div>
          <div style="font-size:26px;font-weight:600;margin-top:2px">${totalDeployed}<span style="font-size:12px;font-weight:600;opacity:.6;margin-left:4px">/ ${allItems.length}</span></div>
          <div style="font-size:10px;opacity:.6;margin-top:2px">전체 플랫폼 완료: ${allPlatformDone}건</div>
        </div>
        ${platformStats.map(p => `
        <div style="background:${p.bg};border:1px solid ${p.border};border-radius:12px;padding:14px 16px;cursor:pointer;transition:all .15s${SD_FILTER.platform===p.id?';box-shadow:0 0 0 2px '+p.color:''}"
             onclick="sdSetFilter('platform','${SD_FILTER.platform===p.id?'all':p.id}')">
          <div style="display:flex;align-items:center;gap:6px">
            <span style="font-size:16px">${p.icon}</span>
            <span style="font-size:11px;font-weight:600;color:${p.color}">${p.name}</span>
          </div>
          <div style="font-size:24px;font-weight:600;color:${p.color};margin-top:4px">${p.deployed}<span style="font-size:11px;font-weight:600;color:${p.color};opacity:.5;margin-left:3px">배포</span></div>
          <div style="display:flex;gap:8px;margin-top:4px">
            <span style="font-size:9px;color:#FF9500;font-weight:700">${p.pending} 대기</span>
            <span style="font-size:9px;color:#AEAEB2;font-weight:600">${p.none} 미등록</span>
          </div>
        </div>`).join('')}
      </div>

      <!-- 필터 -->
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <div style="display:flex;align-items:center;gap:6px">
          <span style="font-size:10px;font-weight:700;color:var(--c-gray-400)">과목</span>
          <select onchange="sdSetFilter('subject',this.value)" style="padding:5px 8px;border:1px solid var(--c-gray-200);border-radius:6px;font-size:11px;outline:none;background:#fff;cursor:pointer">
            <option value="all">전체</option>
            ${subjects.map(([name,code]) => `<option value="${name}" ${SD_FILTER.subject===name?'selected':''}>${name} (${code})</option>`).join('')}
          </select>
        </div>
        <div style="display:flex;align-items:center;gap:6px">
          <span style="font-size:10px;font-weight:700;color:var(--c-gray-400)">상태</span>
          <select onchange="sdSetFilter('status',this.value)" style="padding:5px 8px;border:1px solid var(--c-gray-200);border-radius:6px;font-size:11px;outline:none;background:#fff;cursor:pointer">
            <option value="all" ${SD_FILTER.status==='all'?'selected':''}>전체</option>
            <option value="all-deployed" ${SD_FILTER.status==='all-deployed'?'selected':''}>✅ 전 플랫폼 완료</option>
            <option value="partial" ${SD_FILTER.status==='partial'?'selected':''}>⚠ 일부만 배포</option>
            <option value="not-deployed" ${SD_FILTER.status==='not-deployed'?'selected':''}>❌ 미배포</option>
          </select>
        </div>
        ${(SD_FILTER.subject!=='all'||SD_FILTER.status!=='all'||SD_FILTER.platform!=='all') ? `<button onclick="SD_FILTER.subject='all';SD_FILTER.status='all';SD_FILTER.platform='all';renderServiceDistView()" style="font-size:10px;padding:4px 10px;border-radius:6px;border:1px solid var(--c-primary-b);background:var(--c-primary-l);color:var(--c-primary);font-weight:700;cursor:pointer">초기화</button><span style="font-size:10px;color:var(--c-gray-400)">${items.length}건 표시</span>` : ''}
      </div>
    </div>

    <!-- 콘텐츠 목록 -->
    <div style="flex:1;overflow-y:auto;padding:16px 20px">
      <div style="display:flex;flex-direction:column;gap:8px">
        ${items.map(item => {
          const typeInfo = getTypeInfo(item.typeCode);
          const allDone = SERVICE_PLATFORMS.every(p => item.platforms[p.id] === 'deployed');
          const hasAny = SERVICE_PLATFORMS.some(p => item.platforms[p.id] === 'deployed');
          const cmsC = statusColors[item.cmsStatus] || statusColors.none;

          return `
          <div style="background:#fff;border:1px solid ${allDone?'#A8E6B8':hasAny?'#FFD9A8':'var(--c-gray-200)'};border-radius:10px;padding:14px 16px;transition:all .15s"
               onmouseenter="this.style.boxShadow='0 2px 8px rgba(0,0,0,.06)'" onmouseleave="this.style.boxShadow=''">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
              <!-- 콘텐츠 정보 -->
              <div style="flex:1;min-width:0">
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
                  <span style="font-size:12px;font-weight:600;color:var(--c-gray-800)">${item.title}</span>
                  ${allDone ? '<span style="font-size:9px;padding:2px 6px;border-radius:4px;background:#F0FFF4;color:#34C759;font-weight:700;border:1px solid #A8E6B8">✓ 전체 완료</span>' : ''}
                </div>
                <div style="display:flex;gap:4px;flex-wrap:wrap">
                  ${fmtSubjectBadge(item.subjectCode || item.subject, item.subject)}
                  <span style="font-size:9px;padding:2px 6px;border-radius:4px;background:var(--c-gray-100);color:var(--c-gray-500);font-weight:600">${item.course} ${item.set}</span>
                  <span style="font-size:9px;padding:2px 6px;border-radius:4px;background:${typeInfo.bg};color:${typeInfo.color};font-weight:700">${typeInfo.icon} ${item.typeCode}</span>
                  <span style="font-size:9px;padding:2px 6px;border-radius:4px;background:${cmsC.bg};color:${cmsC.color};font-weight:700;border:1px solid ${cmsC.border}">CMS: ${statusLabels[item.cmsStatus]}</span>
                </div>
              </div>
            </div>
            <!-- 플랫폼별 배포 상태 -->
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
              ${SERVICE_PLATFORMS.map(p => {
                const st = item.platforms[p.id] || 'none';
                const sc = statusColors[st];
                const canDeploy = item.cmsStatus === 'deployed';
                return `
                <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:8px;background:${sc.bg};border:1px solid ${sc.border};${canDeploy?'cursor:pointer':'opacity:.7'};transition:all .15s"
                     ${canDeploy ? `onclick="sdTogglePlatform('${item.id}','${p.id}')" onmouseenter="this.style.transform='translateY(-1px)';this.style.boxShadow='0 2px 6px rgba(0,0,0,.08)'" onmouseleave="this.style.transform='';this.style.boxShadow=''"` : ''}>
                  <span style="font-size:14px">${p.icon}</span>
                  <div style="flex:1;min-width:0">
                    <div style="font-size:10px;font-weight:600;color:${p.color}">${p.name}</div>
                    <div style="font-size:9px;font-weight:700;color:${sc.color};margin-top:1px">${st==='deployed'?'✓ 등록완료':st==='pending'?'⏳ 대기중':'— 미등록'}</div>
                  </div>
                  ${canDeploy ? `<span style="font-size:12px;color:${st==='deployed'?'#34C759':'var(--c-gray-300)'}">${st==='deployed'?'✅':'○'}</span>` : ''}
                </div>`;
              }).join('')}
            </div>
          </div>`;
        }).join('')}
      </div>

      ${items.length === 0 ? `<div style="padding:60px;text-align:center"><div style="font-size:36px;margin-bottom:12px">📋</div><div style="font-size:14px;font-weight:700;color:var(--c-gray-500)">해당 조건의 콘텐츠가 없습니다</div></div>` : ''}
    </div>
  </div>`;
}

// ═══ Code Management (CM_STATE ~ helpers) (원본 라인 12275~12908) ═══
var CM_STATE = {
  search: '',
  filterGroup: 'all',    // all, registered, unregistered
  filterSystem: 'all',   // all, ND, NH, SJ, NH365
  sortBy: 'code',        // code, name, types
  selectedCode: null,
  page: 1,
  pageSize: 20,
  expandedCode: null,
};

// ── 학습관 별칭 (Display Name) 매핑 ──
// CMS 과목명과 학습관 서비스에서 보이는 이름이 다를 때 사용
// key: 과목코드, value: {nhName: 학습관표시명, note: 변경사유}
var SUBJECT_DISPLAY_NAMES = {
  AM:  {nhName:'중학교 1학년 수학', note:'학습관 서비스 레벨 기준 네이밍'},
  DAM: {nhName:'중학교 수학(심화)', note:'학습관 서비스 레벨 기준'},
  M:   {nhName:'초등 수학', note:'학습관 학년별 분류 기준'},
  E:   {nhName:'초등 영어', note:'학습관 학년별 분류 기준'},
  K:   {nhName:'초등 국어', note:'학습관 학년별 분류 기준'},
  MZ:  {nhName:'코어 수학(기본)', note:'학습관 난이도 기준 네이밍'},
  PDM1:{nhName:'초등 스코어수학 1단계', note:'학습관 단계별 네이밍'},
  DM1: {nhName:'중등 스코어수학 1단계', note:'학습관 단계별 네이밍'},
};

// ── 코드 등록/편집 팝업 state ──
var CM_EDIT_STATE = {
  isOpen: false,
  mode: 'add',        // 'add' | 'edit'
  code: '',
  courseName: '',
  nhName: '',
  nhNote: '',
  linkedSubjects: [],  // 서브 코드 목록
  editingCode: null,   // edit 모드일 때 원래 코드
};

// ── 코드 등록 팝업 열기 ──
function _cmOpenCodePopup(mode, code) {
  CM_EDIT_STATE.mode = mode || 'add';
  if(mode === 'edit' && code) {
    var cData = SUBJECT_COURSE_DATA[code] || {};
    var dn = SUBJECT_DISPLAY_NAMES[code] || {};
    var bundleInfo = _cmGetBundleInfo(code);
    var linked = [];
    if(bundleInfo.asHub.length > 0) {
      linked = bundleInfo.asHub[0].linkedSubjects.slice();
    }
    CM_EDIT_STATE.code = code;
    CM_EDIT_STATE.courseName = cData.courseName || (_SUBJECT_NAME_MAP[code] || '');
    CM_EDIT_STATE.nhName = dn.nhName || '';
    CM_EDIT_STATE.nhNote = dn.note || '';
    CM_EDIT_STATE.linkedSubjects = linked;
    CM_EDIT_STATE.editingCode = code;
  } else {
    CM_EDIT_STATE.code = '';
    CM_EDIT_STATE.courseName = '';
    CM_EDIT_STATE.nhName = '';
    CM_EDIT_STATE.nhNote = '';
    CM_EDIT_STATE.linkedSubjects = [];
    CM_EDIT_STATE.editingCode = null;
  }
  CM_EDIT_STATE.isOpen = true;
  _cmRenderCodePopup();
}

// ── 코드 등록 팝업 닫기 ──
function _cmCloseCodePopup() {
  CM_EDIT_STATE.isOpen = false;
  var el = document.getElementById('cmCodePopupOverlay');
  if(el) el.remove();
}

// ── 서브 코드 추가 입력 ──
function _cmAddLinkedSubject() {
  var inp = document.getElementById('cmNewSubCode');
  if(!inp) return;
  var val = inp.value.trim().toUpperCase();
  if(!val) return;
  if(CM_EDIT_STATE.linkedSubjects.indexOf(val) >= 0) { alert('이미 추가된 코드입니다.'); return; }
  if(val === CM_EDIT_STATE.code) { alert('메인 코드와 동일한 코드는 추가할 수 없습니다.'); return; }
  CM_EDIT_STATE.linkedSubjects.push(val);
  inp.value = '';
  _cmRenderCodePopup();
}

// ── 서브 코드 제거 ──
function _cmRemoveLinkedSubject(idx) {
  CM_EDIT_STATE.linkedSubjects.splice(idx, 1);
  _cmRenderCodePopup();
}

// ── 코드 등록 저장 ──
function _cmSaveCode() {
  var code = CM_EDIT_STATE.code.trim().toUpperCase();
  var cname = CM_EDIT_STATE.courseName.trim();
  if(!code) { alert('과목 코드를 입력해주세요.'); return; }
  if(!cname) { alert('과정명을 입력해주세요.'); return; }

  // SUBJECT_COURSE_DATA 업데이트
  if(!SUBJECT_COURSE_DATA[code]) {
    SUBJECT_COURSE_DATA[code] = {courseName: cname, courses:1, sets:10};
  } else {
    SUBJECT_COURSE_DATA[code].courseName = cname;
  }

  // _SUBJECT_NAME_MAP 업데이트
  _SUBJECT_NAME_MAP[code] = cname;

  // SUBJECT_TYPE_MAP에 없으면 추가
  if(!SUBJECT_TYPE_MAP[code]) {
    SUBJECT_TYPE_MAP[code] = {name: cname, children: CM_EDIT_STATE.linkedSubjects.slice(), types: []};
  } else {
    SUBJECT_TYPE_MAP[code].name = cname;
    SUBJECT_TYPE_MAP[code].children = CM_EDIT_STATE.linkedSubjects.slice();
  }

  // 학습관 별칭 저장
  var nhName = CM_EDIT_STATE.nhName.trim();
  if(nhName) {
    SUBJECT_DISPLAY_NAMES[code] = {nhName: nhName, note: CM_EDIT_STATE.nhNote.trim()};
  } else {
    delete SUBJECT_DISPLAY_NAMES[code];
  }

  // 서브 코드 번들 처리 (간단 시뮬)
  if(CM_EDIT_STATE.linkedSubjects.length > 0) {
    // linkedSubjects 이름 등록
    CM_EDIT_STATE.linkedSubjects.forEach(function(sc) {
      if(!_SUBJECT_NAME_MAP[sc]) _SUBJECT_NAME_MAP[sc] = sc;
    });
  }

  _cmCloseCodePopup();
  renderCodeManageView();
}

// ── 코드 등록/편집 팝업 렌더 ──
function _cmRenderCodePopup() {
  var old = document.getElementById('cmCodePopupOverlay');
  if(old) old.remove();

  var ov = document.createElement('div');
  ov.id = 'cmCodePopupOverlay';
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:10000;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(3px)';
  ov.onclick = function(e) { if(e.target === ov) _cmCloseCodePopup(); };

  var isEdit = CM_EDIT_STATE.mode === 'edit';
  var title = isEdit ? '과목 코드 편집' : '과목 코드 등록';

  var p = '';
  p += '<div style="background:#fff;border-radius:14px;width:540px;max-height:85vh;overflow-y:auto;box-shadow:0 25px 50px rgba(0,0,0,.18)">';

  // 헤더
  p += '<div style="padding:20px 24px 14px;border-bottom:1px solid #F5F5F7;display:flex;align-items:center;justify-content:space-between">';
  p += '<div style="font-size:16px;font-weight:600;color:#1D1D1F">' + title + '</div>';
  p += '<button onclick="_cmCloseCodePopup()" style="width:30px;height:30px;border:none;background:#F5F5F7;border-radius:8px;cursor:pointer;font-size:16px;color:#636366;display:flex;align-items:center;justify-content:center">&times;</button>';
  p += '</div>';

  // 본문
  p += '<div style="padding:20px 24px">';

  // 과목 코드
  p += '<div style="margin-bottom:16px">';
  p += '<label style="display:block;font-size:12px;font-weight:700;color:#48484A;margin-bottom:5px">과목 코드 <span style="color:#FF3B30">*</span></label>';
  p += '<input id="cmEditCode" type="text" value="' + (CM_EDIT_STATE.code || '') + '" ' + (isEdit ? 'disabled' : '') + ' oninput="CM_EDIT_STATE.code=this.value" placeholder="예: AM, DM1, QPA" style="width:100%;padding:9px 12px;border:1px solid #E5E5EA;border-radius:8px;font-size:13px;font-weight:700;font-family:monospace;outline:none;box-sizing:border-box;' + (isEdit ? 'background:#FAFAFA;color:#8E8E93' : '') + '">';
  p += '</div>';

  // 과정명 (CMS명)
  p += '<div style="margin-bottom:16px">';
  p += '<label style="display:block;font-size:12px;font-weight:700;color:#48484A;margin-bottom:5px">과정명 (CMS) <span style="color:#FF3B30">*</span></label>';
  p += '<input type="text" value="' + (CM_EDIT_STATE.courseName || '') + '" oninput="CM_EDIT_STATE.courseName=this.value" placeholder="예: 써밋스피드수학" style="width:100%;padding:9px 12px;border:1px solid #E5E5EA;border-radius:8px;font-size:13px;outline:none;box-sizing:border-box">';
  p += '</div>';

  // 구분선 + 학습관 별칭
  p += '<div style="border-top:1px dashed #E5E5EA;margin:20px 0 16px;padding-top:16px">';
  p += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:12px">';
  p += '<span style="font-size:13px;font-weight:700;color:#1D1D1F">학습관 서비스명</span>';
  p += '<span style="font-size:10px;padding:2px 8px;border-radius:4px;background:#F9F0FF;color:#AF52DE;font-weight:600">학습관 전용</span>';
  p += '</div>';
  p += '<div style="font-size:11px;color:#8E8E93;margin-bottom:10px">학습관에서 다른 이름으로 서비스될 경우 입력합니다. 미입력 시 CMS 과정명이 그대로 사용됩니다.</div>';

  p += '<div style="margin-bottom:10px">';
  p += '<label style="display:block;font-size:12px;font-weight:600;color:#48484A;margin-bottom:5px">학습관 표시명</label>';
  p += '<input type="text" value="' + (CM_EDIT_STATE.nhName || '') + '" oninput="CM_EDIT_STATE.nhName=this.value" placeholder="예: 중학교 1학년 수학" style="width:100%;padding:9px 12px;border:1px solid #E5E5EA;border-radius:8px;font-size:13px;outline:none;box-sizing:border-box">';
  p += '</div>';

  p += '<div style="margin-bottom:4px">';
  p += '<label style="display:block;font-size:12px;font-weight:600;color:#48484A;margin-bottom:5px">변경 사유</label>';
  p += '<input type="text" value="' + (CM_EDIT_STATE.nhNote || '') + '" oninput="CM_EDIT_STATE.nhNote=this.value" placeholder="예: 학습관 서비스 레벨 기준 네이밍" style="width:100%;padding:9px 12px;border:1px solid #E5E5EA;border-radius:8px;font-size:13px;outline:none;box-sizing:border-box">';
  p += '</div>';
  p += '</div>';

  // 구분선 + 서브 코드 연결
  p += '<div style="border-top:1px dashed #E5E5EA;margin:20px 0 16px;padding-top:16px">';
  p += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:12px">';
  p += '<span style="font-size:13px;font-weight:700;color:#1D1D1F">서브 코드 연결</span>';
  p += '<span style="font-size:10px;padding:2px 8px;border-radius:4px;background:#E8F2FF;color:#0071E3;font-weight:600">묶음</span>';
  p += '</div>';
  p += '<div style="font-size:11px;color:#8E8E93;margin-bottom:10px">이 메인 코드에 연결할 서브 과목 코드를 추가합니다. 콘텐츠 묶음(Hub→Spoke) 관계가 설정됩니다.</div>';

  // 서브 코드 목록
  if(CM_EDIT_STATE.linkedSubjects.length > 0) {
    p += '<div style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px">';
    CM_EDIT_STATE.linkedSubjects.forEach(function(sc, si) {
      var scName = _SUBJECT_NAME_MAP[sc] || sc;
      p += '<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:#FAFAFA;border-radius:8px;border:1px solid #E5E5EA">';
      p += '<span style="font-weight:600;font-family:monospace;font-size:13px;color:#0369A1;background:#E8F2FF;padding:2px 8px;border-radius:4px">' + sc + '</span>';
      p += '<span style="font-size:12px;color:#48484A;flex:1">' + scName + '</span>';
      p += '<button onclick="_cmRemoveLinkedSubject(' + si + ')" style="width:24px;height:24px;border:none;background:#FFB3AE;border-radius:6px;cursor:pointer;font-size:13px;color:#FF3B30;display:flex;align-items:center;justify-content:center">&times;</button>';
      p += '</div>';
    });
    p += '</div>';
  }

  // 서브 코드 추가 입력
  p += '<div style="display:flex;gap:6px">';
  p += '<input id="cmNewSubCode" type="text" placeholder="서브 코드 입력 (예: AMA)" onkeydown="if(event.key===\'Enter\'){event.preventDefault();_cmAddLinkedSubject();}" style="flex:1;padding:8px 12px;border:1px solid #E5E5EA;border-radius:8px;font-size:13px;font-family:monospace;font-weight:700;outline:none">';
  p += '<button onclick="_cmAddLinkedSubject()" style="padding:8px 16px;background:#0071E3;color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:500;cursor:pointer;white-space:nowrap">+ 추가</button>';
  p += '</div>';
  p += '</div>';

  p += '</div>';

  // 푸터
  p += '<div style="padding:14px 24px 20px;border-top:1px solid #F5F5F7;display:flex;gap:8px;justify-content:flex-end">';
  p += '<button onclick="_cmCloseCodePopup()" style="padding:9px 20px;border:1px solid #E5E5EA;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;background:#fff;color:#636366">취소</button>';
  p += '<button onclick="_cmSaveCode()" style="padding:9px 24px;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;background:#0071E3;color:#fff">' + (isEdit ? '저장' : '등록') + '</button>';
  p += '</div>';

  p += '</div>';

  ov.innerHTML = p;
  document.body.appendChild(ov);
}

function renderCodeManageView() {
  var root = document.getElementById('codeManageRoot');
  if(!root) return;

  var subjects = Object.entries(SUBJECT_TYPE_MAP);
  var q = CM_STATE.search.toLowerCase();

  // 필터링
  var filtered = subjects.filter(function(entry) {
    var code = entry[0];
    var cData = SUBJECT_COURSE_DATA[code] || {};
    var name = cData.courseName || (_SUBJECT_NAME_MAP[code] || code);
    var hasTypes = !!REGISTERED_WORK_TYPES[code] && REGISTERED_WORK_TYPES[code].length > 0;
    var regTypes = REGISTERED_WORK_TYPES[code] || [];

    // 텍스트 검색 (코드, 과정명, 유형명)
    if(q) {
      var match = code.toLowerCase().indexOf(q) >= 0 || name.toLowerCase().indexOf(q) >= 0;
      if(!match) {
        match = regTypes.some(function(rt) { return rt.name.toLowerCase().indexOf(q) >= 0; });
      }
      if(!match) return false;
    }
    // 상태 필터
    if(CM_STATE.filterGroup === 'registered' && !hasTypes) return false;
    if(CM_STATE.filterGroup === 'unregistered' && hasTypes) return false;
    // 시스템 필터
    if(CM_STATE.filterSystem !== 'all') {
      if(!hasTypes) return false;
      var hasSys = regTypes.some(function(rt) { return (rt.target || 'ND') === CM_STATE.filterSystem; });
      if(!hasSys) return false;
    }
    return true;
  });

  // 정렬
  filtered.sort(function(a, b) {
    if(CM_STATE.sortBy === 'name') {
      var na = (SUBJECT_COURSE_DATA[a[0]] || {}).courseName || a[0];
      var nb = (SUBJECT_COURSE_DATA[b[0]] || {}).courseName || b[0];
      return na.localeCompare(nb, 'ko');
    }
    if(CM_STATE.sortBy === 'types') {
      var la = (REGISTERED_WORK_TYPES[a[0]] || []).length;
      var lb = (REGISTERED_WORK_TYPES[b[0]] || []).length;
      return lb - la;
    }
    return a[0].localeCompare(b[0]);
  });

  // 페이징
  var totalPages = Math.max(1, Math.ceil(filtered.length / CM_STATE.pageSize));
  if(CM_STATE.page > totalPages) CM_STATE.page = totalPages;
  var startIdx = (CM_STATE.page - 1) * CM_STATE.pageSize;
  var pageItems = filtered.slice(startIdx, startIdx + CM_STATE.pageSize);

  var totalCount = subjects.length;
  var regCount = subjects.filter(function(e) { return REGISTERED_WORK_TYPES[e[0]] && REGISTERED_WORK_TYPES[e[0]].length > 0; }).length;
  var bundledCount = _cmCountBundledCodes();

  var h = '';
  h += '<div style="display:flex;flex-direction:column;height:100%;overflow:hidden">';

  // ── 헤더 ──
  h += '<div style="padding:16px 24px 14px;border-bottom:1px solid #E5E5EA;background:#fff;flex-shrink:0">';
  h += '<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">';
  h += '<div><div style="font-size:16px;font-weight:600;color:#1D1D1F;letter-spacing:-.02em">과목 코드 관리</div>';
  h += '<div style="font-size:12px;color:#8E8E93;margin-top:2px">전체 과목 코드 조회 · 콘텐츠 등록 현황 · 묶음 연결 · 고급 검색</div></div>';
  h += '<div style="margin-left:auto;display:flex;gap:6px;align-items:center">';
  h += '<span style="font-size:12px;padding:4px 10px;border-radius:6px;background:#F5F5F7;color:#48484A;font-weight:600">' + totalCount + '개 전체</span>';
  h += '<span style="font-size:12px;padding:4px 10px;border-radius:6px;background:#A8E6B8;color:#1B8A3E;font-weight:600">' + regCount + ' 등록</span>';
  h += '<span style="font-size:12px;padding:4px 10px;border-radius:6px;background:#E8F2FF;color:#3730A3;font-weight:600">' + bundledCount + ' 묶음</span>';
  h += '</div></div>';

  // ── 검색바 (고급) ──
  h += '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">';

  // 검색 인풋
  h += '<div style="flex:1;position:relative;min-width:260px;max-width:420px">';
  h += '<svg viewBox="0 0 24 24" fill="none" stroke="#8E8E93" stroke-width="2" style="position:absolute;left:11px;top:50%;transform:translateY(-50%);width:15px;height:15px;pointer-events:none"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';
  h += '<input id="cmSearchInput" type="text" placeholder="코드, 과정명, 템플릿명으로 검색" value="' + (CM_STATE.search || '') + '" oninput="CM_STATE.search=this.value;CM_STATE.page=1;renderCodeManageView()" style="width:100%;padding:8px 12px 8px 34px;border:1px solid #E5E5EA;border-radius:8px;font-size:13px;outline:none;transition:border-color .15s" onfocus="this.style.borderColor=\'#B3D7FF\'" onblur="this.style.borderColor=\'#E5E5EA\'">';
  h += '</div>';

  // 상태 필터
  h += '<div style="display:flex;gap:0;border:1px solid #E5E5EA;border-radius:8px;overflow:hidden">';
  var grps = [{v:'all',l:'전체'},{v:'registered',l:'등록됨'},{v:'unregistered',l:'미등록'}];
  grps.forEach(function(g) {
    var isOn = CM_STATE.filterGroup === g.v;
    h += '<button onclick="CM_STATE.filterGroup=\'' + g.v + '\';CM_STATE.page=1;renderCodeManageView()" style="padding:6px 12px;border:none;font-size:12px;font-weight:' + (isOn ? 700 : 500) + ';cursor:pointer;background:' + (isOn ? '#1D1D1F' : '#fff') + ';color:' + (isOn ? '#fff' : '#636366') + ';transition:all .12s">' + g.l + '</button>';
  });
  h += '</div>';

  // 시스템 필터
  h += '<select onchange="CM_STATE.filterSystem=this.value;CM_STATE.page=1;renderCodeManageView()" style="padding:6px 10px;border:1px solid #E5E5EA;border-radius:8px;font-size:12px;outline:none;cursor:pointer">';
  h += '<option value="all"' + (CM_STATE.filterSystem==='all'?' selected':'') + '>전체 시스템</option>';
  Object.keys(WC_SYSTEM_COLORS).forEach(function(sk) {
    h += '<option value="' + sk + '"' + (CM_STATE.filterSystem===sk?' selected':'') + '>' + WC_SYSTEM_COLORS[sk].label + '</option>';
  });
  h += '</select>';

  // 정렬
  h += '<select onchange="CM_STATE.sortBy=this.value;renderCodeManageView()" style="padding:6px 10px;border:1px solid #E5E5EA;border-radius:8px;font-size:12px;outline:none;cursor:pointer">';
  h += '<option value="code"' + (CM_STATE.sortBy==='code'?' selected':'') + '>코드순</option>';
  h += '<option value="name"' + (CM_STATE.sortBy==='name'?' selected':'') + '>과정명순</option>';
  h += '<option value="types"' + (CM_STATE.sortBy==='types'?' selected':'') + '>템플릿수순</option>';
  h += '</select>';

  h += '<span style="font-size:12px;color:#8E8E93">' + filtered.length + '건</span>';

  // 코드 등록 버튼
  h += '<button onclick="_cmOpenCodePopup(\'add\')" style="padding:7px 14px;background:#0071E3;color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:500;cursor:pointer;white-space:nowrap;display:flex;align-items:center;gap:4px"><span style="font-size:14px;line-height:1">+</span> 코드 등록</button>';
  h += '</div></div>';

  // ── 테이블 ──
  h += '<div style="flex:1;overflow-y:auto">';
  h += '<table style="width:100%;border-collapse:collapse;font-size:13px;table-layout:fixed">';
  h += '<colgroup><col style="width:25%"><col style="width:33%"><col style="width:27%"><col style="width:15%"></colgroup>';
  h += '<thead><tr style="background:#FAFAFA;border-bottom:2px solid #E5E5EA;position:sticky;top:0;z-index:1">';
  h += '<th style="padding:10px 16px;text-align:left;font-weight:700;color:#48484A">메인 코드</th>';
  h += '<th style="padding:10px 12px;text-align:left;font-weight:700;color:#48484A">서브 코드</th>';
  h += '<th style="padding:10px 12px;text-align:left;font-weight:700;color:#48484A">등록 템플릿</th>';
  h += '<th style="padding:10px 12px;text-align:center;font-weight:700;color:#48484A">상태</th>';
  h += '</tr></thead><tbody>';

  if(pageItems.length === 0) {
    h += '<tr><td colspan="4" style="padding:40px;text-align:center;color:#8E8E93">검색 결과가 없습니다</td></tr>';
  }

  pageItems.forEach(function(entry) {
    var code = entry[0];
    var cData = SUBJECT_COURSE_DATA[code] || {courseName: _SUBJECT_NAME_MAP[code] || code, courses:1, sets:10};
    var regTypes = REGISTERED_WORK_TYPES[code] || [];
    var hasTypes = regTypes.length > 0;
    var isExpanded = CM_STATE.expandedCode === code;
    var bundleInfo = _cmGetBundleInfo(code);

    // 메인 행
    h += '<tr style="border-bottom:1px solid #F5F5F7;background:' + (isExpanded ? '#F0F9FF' : '#fff') + ';cursor:pointer;transition:background .1s" onclick="CM_STATE.expandedCode=(CM_STATE.expandedCode===\'' + code + '\'?null:\'' + code + '\');renderCodeManageView()" onmouseenter="this.style.background=\'' + (isExpanded ? '#E0F2FE' : '#FAFAFA') + '\'" onmouseleave="this.style.background=\'' + (isExpanded ? '#F0F9FF' : '#fff') + '\'">';

    // 메인 코드 (코드 + 과정명 + 학습관명을 한 셀에)
    var dnInfo = SUBJECT_DISPLAY_NAMES[code];
    h += '<td style="padding:10px 16px;vertical-align:top;overflow:hidden">';
    h += '<div style="display:flex;align-items:center;gap:8px">';
    h += '<span style="font-weight:600;color:#1D1D1F;font-family:\'SF Mono\',SFMono-Regular,Consolas,monospace;font-size:13px;background:#F5F5F7;padding:2px 8px;border-radius:4px;letter-spacing:.5px;flex-shrink:0">' + code + '</span>';
    h += '</div>';
    h += '<div style="margin-top:4px;font-size:13px;color:#2C2C2E;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + cData.courseName + '</div>';
    if(dnInfo && dnInfo.nhName) {
      h += '<div style="margin-top:3px;font-size:11px;color:#AF52DE;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="학습관: ' + dnInfo.nhName + '">학습관: ' + dnInfo.nhName + '</div>';
    }
    h += '</td>';

    // 서브 코드 (연결된 과목 코드 + 과정명, 줄바꿈)
    h += '<td style="padding:10px 12px;vertical-align:top;overflow:hidden">';
    if(bundleInfo.asHub.length > 0) {
      var hubLinked = bundleInfo.asHub[0].linkedSubjects;
      h += '<div style="display:flex;flex-direction:column;gap:4px">';
      hubLinked.forEach(function(s) {
        var sName = _SUBJECT_NAME_MAP[s] || s;
        h += '<div style="display:flex;align-items:center;gap:6px;font-size:12px">';
        h += '<span style="font-weight:700;color:#0369A1;font-family:\'SF Mono\',SFMono-Regular,Consolas,monospace;background:#E8F2FF;padding:1px 6px;border-radius:3px;flex-shrink:0">' + s + '</span>';
        h += '<span style="color:#48484A;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + sName + '</span>';
        h += '</div>';
      });
      h += '</div>';
    } else if(bundleInfo.asSpoke.length > 0) {
      var hubCode = bundleInfo.asSpoke[0].masterSubject;
      var hubName = _SUBJECT_NAME_MAP[hubCode] || hubCode;
      h += '<div style="display:flex;align-items:center;gap:6px;font-size:12px">';
      h += '<span style="color:#8E8E93;font-size:11px">←</span>';
      h += '<span style="font-weight:700;color:#0369A1;font-family:\'SF Mono\',SFMono-Regular,Consolas,monospace;background:#E8F2FF;padding:1px 6px;border-radius:3px">' + hubCode + '</span>';
      h += '<span style="color:#48484A">' + hubName + '</span>';
      h += '</div>';
    } else {
      h += '<span style="font-size:12px;color:#D1D1D6">—</span>';
    }
    h += '</td>';

    // 콘텐츠 유형 뱃지
    h += '<td style="padding:8px 12px;vertical-align:top;overflow:hidden">';
    if(hasTypes) {
      h += '<div style="display:flex;flex-wrap:wrap;gap:4px">';
      regTypes.forEach(function(rt, ri) {
        var sys = WC_SYSTEM_COLORS[rt.target || 'ND'] || WC_SYSTEM_COLORS.ND;
        h += '<span onclick="event.stopPropagation();openWorkTypeAttrPopup(\'' + code + '\',' + ri + ')" style="font-size:10px;padding:3px 8px;border-radius:4px;background:' + sys.bg + ';color:' + sys.color + ';font-weight:600;border:1px solid ' + sys.border + ';cursor:pointer;white-space:nowrap;line-height:1.3">' + rt.typeCode + ' ' + (sys.label || '') + '</span>';
      });
      h += '</div>';
    } else {
      h += '<span style="font-size:11px;color:#D1D1D6">—</span>';
    }
    h += '</td>';

    // 상태
    h += '<td style="padding:10px 12px;text-align:center;vertical-align:top">';
    if(hasTypes) {
      h += '<span style="font-size:10px;padding:3px 10px;border-radius:10px;background:#A8E6B8;color:#1B8A3E;font-weight:700">등록됨</span>';
    } else {
      h += '<span style="font-size:10px;padding:3px 10px;border-radius:10px;background:#FFF8F0;color:#B35C00;font-weight:700">미등록</span>';
    }
    h += '</td>';

    h += '</tr>';

    // 확장 행 (디테일 패널)
    if(isExpanded) {
      h += '<tr style="background:#F0F9FF;border-bottom:2px solid #E8F2FF">';
      h += '<td colspan="4" style="padding:16px 24px">';

      // 묶음 연결 정보
      h += '<div style="margin-bottom:20px">';
      h += '<div style="font-size:12px;font-weight:700;color:#1D1D1F;margin-bottom:8px">묶음 연결 정보</div>';
      if(bundleInfo.asHub.length > 0) {
        var hub = bundleInfo.asHub[0];
        h += '<div style="font-size:12px;color:#2C2C2E;padding:8px 12px;background:#fff;border-radius:6px;border:1px solid #E8F2FF">';
        h += '<span style="font-weight:600">' + code + '</span> → ';
        var hubLinks = hub.linkedSubjects.map(function(s) { return '<span style="font-weight:600;color:#0369A1">' + s + '</span>'; }).join(', ');
        h += hubLinks;
        h += '</div>';
      } else if(bundleInfo.asSpoke.length > 0) {
        var spoke = bundleInfo.asSpoke[0];
        var spokeHub = spoke.masterSubject;
        h += '<div style="font-size:12px;color:#2C2C2E;padding:8px 12px;background:#fff;border-radius:6px;border:1px solid #E8F2FF">';
        h += '<span style="font-weight:600">' + code + '</span> ← <span style="font-weight:600;color:#0369A1">' + spokeHub + '</span>에 연결됨';
        h += '</div>';
      } else {
        h += '<div style="font-size:12px;color:#8E8E93;padding:8px 12px">독립 코드 (묶음 없음)</div>';
      }
      h += '</div>';

      // 등록 템플릿 상세 (Depth 구조 + 분할 정보)
      h += '<div style="margin-bottom:20px">';
      h += '<div style="font-size:12px;font-weight:700;color:#1D1D1F;margin-bottom:8px">\uB4F1\uB85D \uD15C\uD50C\uB9BF \uC0C1\uC138</div>';
      if(regTypes.length > 0) {
        h += '<div style="display:flex;flex-direction:column;gap:8px">';
        regTypes.forEach(function(rt, ri) {
          var sys = WC_SYSTEM_COLORS[rt.target || 'ND'] || WC_SYSTEM_COLORS.ND;
          var depthInfo = _wcGetLinkedDepth(rt);
          var _cmLabel = _getTypeLabel(rt.typeCode);
          var _cmSN = _getStructureName(rt.ltTypeId);
          var _curSrc = rt.currSrc || 'origin';
          var _csrcMap2 = {origin:{l:'\uC6D0\uBCF8',bg:'#E8F2FF',c:'#0055B8'},remix:{l:'\uC7AC\uAD6C\uC131',bg:'#FFF8F0',c:'#B35C00'},create:{l:'\uC790\uCCB4',bg:'#F9F0FF',c:'#8944AB'}};
          var _cs2 = _csrcMap2[_curSrc] || _csrcMap2.origin;

          h += '<div style="background:#fff;border-radius:8px;border:1px solid #E5E5EA;overflow:hidden">';
          // 헤더
          h += '<div style="display:flex;align-items:center;gap:6px;padding:8px 12px;border-bottom:1px solid #F5F5F7">';
          h += '<span style="padding:2px 8px;border-radius:4px;background:' + sys.bg + ';color:' + sys.color + ';font-weight:700;font-size:11px;border:1px solid ' + sys.border + '">' + sys.label + '</span>';
          h += '<span style="font-weight:700;font-size:12px;color:#1D1D1F">' + _cmLabel + '</span>';
          if(_cmSN) h += '<span style="color:#636366;font-size:11px">' + _cmSN + '</span>';
          h += '<span style="font-size:9px;padding:1px 5px;border-radius:3px;background:' + _cs2.bg + ';color:' + _cs2.c + ';font-weight:700">' + _cs2.l + '</span>';
          h += '</div>';
          // Depth 구조 + 분할 정보 바디
          h += '<div style="padding:8px 12px">';
          if(depthInfo && depthInfo.depthNames.length > 0) {
            h += '<div style="display:flex;align-items:center;gap:4px;margin-bottom:6px;flex-wrap:wrap">';
            h += '<span style="font-size:10px;font-weight:700;color:#0369A1">' + depthInfo.depthCount + '\uB2E8\uACC4:</span>';
            depthInfo.depthNames.forEach(function(dn, di) {
              if(di > 0) h += '<span style="font-size:9px;color:#8E8E93">\u203A</span>';
              h += '<span style="font-size:10px;padding:1px 6px;border-radius:3px;background:#F0F9FF;color:#0369A1;font-weight:600;border:1px solid #BAE6FD">' + dn + '</span>';
            });
            h += '</div>';
          }
          // 분할 현황
          var hasRanges = rt.setRanges && rt.setRanges.length > 0;
          var hasCurr = rt.customCurriculum && rt.customCurriculum.groups && rt.customCurriculum.groups.length > 0;
          if(hasRanges) {
            var _splitName3 = (depthInfo && depthInfo.depthNames[rt.splitDepth || 0]) || '\uC138\uD2B8';
            var _totalA = 0;
            rt.setRanges.forEach(function(r){ _totalA += (r.to - r.from + 1); });
            var rangeColors = ['#0071E3','#10B981','#FF9500','#FF3B30','#AF52DE','#EC4899','#14B8A6','#F97316'];
            // 시각화 바
            h += '<div style="display:flex;gap:1px;height:5px;border-radius:3px;overflow:hidden;margin-bottom:6px;background:#E5E5EA">';
            rt.setRanges.forEach(function(r, ri2) {
              var pct = ((r.to - r.from + 1) / _totalA * 100);
              h += '<div style="width:' + pct + '%;background:' + rangeColors[ri2 % rangeColors.length] + '" title="' + _splitName3 + ' ' + r.from + '~' + r.to + ' (' + r.assignee + ')"></div>';
            });
            h += '</div>';
            // 범위 목록
            h += '<div style="display:flex;flex-wrap:wrap;gap:4px">';
            rt.setRanges.forEach(function(r, ri2) {
              var rColor = rangeColors[ri2 % rangeColors.length];
              h += '<div style="display:flex;align-items:center;gap:4px;font-size:10px;padding:2px 6px;background:#FAFAFA;border-radius:4px;border:1px solid #E5E5EA">';
              h += '<span style="width:6px;height:6px;border-radius:2px;background:' + rColor + ';flex-shrink:0"></span>';
              h += '<span style="color:#48484A;font-weight:600">' + _splitName3 + ' ' + r.from + '~' + r.to + '</span>';
              h += '<span style="color:#8E8E93">(' + (r.to - r.from + 1) + '\uAC1C)</span>';
              h += '<span style="color:#636366;font-weight:600">' + r.assignee + '</span>';
              h += '</div>';
            });
            h += '</div>';
            h += '<div style="margin-top:4px;font-size:9px;color:#34C759;font-weight:600">\u2713 \uC804\uCCB4 ' + _totalA + ' ' + _splitName3 + ' \u00B7 ' + rt.setRanges.length + '\uBD84\uD560 \uD560\uB2F9</div>';
          } else if(hasCurr) {
            var _cc3 = rt.customCurriculum;
            var _totalU3 = 0;
            _cc3.groups.forEach(function(g){ _totalU3 += g.units.length; });
            h += '<div style="display:flex;flex-wrap:wrap;gap:4px">';
            _cc3.groups.forEach(function(g, gi) {
              h += '<div style="font-size:10px;padding:2px 6px;background:#FAFAFA;border-radius:4px;border:1px solid #E5E5EA;display:flex;align-items:center;gap:3px">';
              h += '<span style="color:#48484A;font-weight:600">' + g.name + '</span>';
              h += '<span style="color:#8E8E93">(' + g.units.length + (_cc3.unitName || '\uAC1C') + ')</span>';
              if(g.assignee) h += '<span style="color:#636366;font-weight:600">' + g.assignee + '</span>';
              h += '</div>';
            });
            h += '</div>';
            h += '<div style="margin-top:4px;font-size:9px;color:#34C759;font-weight:600">\u2713 ' + _cc3.groups.length + '\uADF8\uB8F9 \u00B7 \uCD1D ' + _totalU3 + ' ' + (_cc3.unitName || '\uB2E8\uC704') + '</div>';
          } else {
            h += '<div style="font-size:10px;color:#8E8E93">\uBD84\uD560 \uBBF8\uC124\uC815</div>';
          }
          h += '</div></div>';
        });
        h += '</div>';
      } else {
        h += '<div style="font-size:12px;color:#8E8E93">\uB4F1\uB85D\uB41C \uD15C\uD50C\uB9BF \uC5C6\uC74C</div>';
      }
      h += '</div>';

      // 연계 시스템
      h += '<div style="margin-bottom:20px">';
      h += '<div style="font-size:12px;font-weight:700;color:#1D1D1F;margin-bottom:8px">연계 시스템</div>';
      var linkedSys = [];
      bundleInfo.asHub.forEach(function(b) {
        linkedSys = linkedSys.concat(b.linkedSystems || []);
      });
      bundleInfo.asSpoke.forEach(function(b) {
        linkedSys = linkedSys.concat(b.linkedSystems || []);
      });
      linkedSys = linkedSys.filter(function(v, i, a) { return a.indexOf(v) === i; });
      if(linkedSys.length > 0) {
        h += '<div style="display:flex;flex-wrap:wrap;gap:6px">';
        linkedSys.forEach(function(sys) {
          h += '<span style="font-size:11px;padding:4px 10px;border-radius:4px;background:#F5F5F7;color:#48484A;font-weight:600;border:1px solid #E5E5EA">' + sys + '</span>';
        });
        h += '</div>';
      } else {
        h += '<div style="font-size:12px;color:#8E8E93">연계 시스템 없음</div>';
      }
      h += '</div>';

      // 학습관 별칭
      var _dn = SUBJECT_DISPLAY_NAMES[code];
      h += '<div style="margin-bottom:20px">';
      h += '<div style="font-size:12px;font-weight:700;color:#1D1D1F;margin-bottom:8px">학습관 서비스명</div>';
      if(_dn && _dn.nhName) {
        h += '<div style="padding:8px 12px;background:#F9F0FF;border-radius:6px;border:1px solid #D9B3F0;font-size:12px">';
        h += '<span style="color:#AF52DE;font-weight:700">' + _dn.nhName + '</span>';
        if(_dn.note) { h += '<span style="color:#AF52DE;margin-left:8px">(' + _dn.note + ')</span>'; }
        h += '</div>';
      } else {
        h += '<div style="font-size:12px;color:#8E8E93;padding:8px 12px">CMS 과정명과 동일 (별도 학습관명 미설정)</div>';
      }
      h += '</div>';

      // 관리 액션
      h += '<div>';
      h += '<div style="font-size:12px;font-weight:700;color:#1D1D1F;margin-bottom:8px">관리 액션</div>';
      h += '<div style="display:flex;gap:6px">';
      if(bundleInfo.asHub.length > 0 || bundleInfo.asSpoke.length === 0) {
        h += '<button onclick="event.stopPropagation();alert(\'[개발예정] 묶음 생성 기능\')" style="padding:6px 12px;border:1px solid #0071E3;border-radius:6px;background:#E8F2FF;color:#0071E3;font-size:12px;font-weight:600;cursor:pointer">묶음 생성</button>';
      }
      if(bundleInfo.asSpoke.length > 0) {
        h += '<button onclick="event.stopPropagation();alert(\'[개발예정] 묶음 해제 기능\')" style="padding:6px 12px;border:1px solid #FF3B30;border-radius:6px;background:#FFF2F1;color:#FF3B30;font-size:12px;font-weight:600;cursor:pointer">묶음 해제</button>';
      }
      h += '<button onclick="event.stopPropagation();openWorkTypeRegisterPopup(\'' + code + '\')" style="padding:6px 12px;border:1px solid #34C759;border-radius:6px;background:#F0FFF4;color:#34C759;font-size:12px;font-weight:600;cursor:pointer">+ 템플릿 등록</button>';
      h += '<button onclick="event.stopPropagation();_cmOpenCodePopup(\'edit\',\'' + code + '\')" style="padding:6px 12px;border:1px solid #636366;border-radius:6px;background:#FAFAFA;color:#48484A;font-size:12px;font-weight:600;cursor:pointer">코드 편집</button>';
      h += '</div>';
      h += '</div>';

      h += '</td>';
      h += '</tr>';
    }
  });

  h += '</tbody></table></div>';

  // ── 페이징 ──
  h += '<div style="padding:10px 24px;border-top:1px solid #E5E5EA;background:#fff;display:flex;align-items:center;justify-content:center;gap:6px;flex-shrink:0">';
  h += '<button onclick="CM_STATE.page=Math.max(1,CM_STATE.page-1);renderCodeManageView()" ' + (CM_STATE.page <= 1 ? 'disabled' : '') + ' style="padding:5px 12px;border:1px solid #E5E5EA;border-radius:6px;font-size:12px;cursor:pointer;background:#fff;color:' + (CM_STATE.page <= 1 ? '#D1D1D6' : '#48484A') + '">이전</button>';
  h += '<span style="font-size:12px;color:#636366;padding:0 8px">' + CM_STATE.page + ' / ' + totalPages + '</span>';
  h += '<button onclick="CM_STATE.page=Math.min(' + totalPages + ',CM_STATE.page+1);renderCodeManageView()" ' + (CM_STATE.page >= totalPages ? 'disabled' : '') + ' style="padding:5px 12px;border:1px solid #E5E5EA;border-radius:6px;font-size:12px;cursor:pointer;background:#fff;color:' + (CM_STATE.page >= totalPages ? '#D1D1D6' : '#48484A') + '">다음</button>';
  h += '</div>';

  h += '</div>';
  root.innerHTML = h;
}

// ─── Helper Functions for Code Manage View ───
function _cmGetBundleInfo(code) {
  var asHub = CONTENT_BUNDLES.filter(function(b) { return b.masterSubject === code; });
  var asSpoke = CONTENT_BUNDLES.filter(function(b) { return b.linkedSubjects.indexOf(code) >= 0; });
  return { asHub: asHub, asSpoke: asSpoke };
}

function _cmCountBundledCodes() {
  var bundledCodes = {};
  CONTENT_BUNDLES.forEach(function(b) {
    bundledCodes[b.masterSubject] = true;
    b.linkedSubjects.forEach(function(s) { bundledCodes[s] = true; });
  });
  return Object.keys(bundledCodes).length;
}

// ═══ renderLearningTypeView (원본 라인 13202~13363) ═══
function renderLearningTypeView() {
  var root = document.getElementById('learningTypeRoot');
  if(!root) return;

  var types = LT_STATE.types;
  var q = LT_STATE.search.toLowerCase();
  var filtered = q ? types.filter(function(t) {
    return t.name.toLowerCase().indexOf(q) >= 0 || t.typeCode.toLowerCase().indexOf(q) >= 0;
  }) : types;

  // typeCode 기준 그룹화 (서비스별 분리 제거 → 유형별 통합)
  var typeGroups = {};
  var typeGroupOrder = [];
  filtered.forEach(function(t) {
    var gc = t.typeCode || 'ETC';
    if(!typeGroups[gc]) {
      typeGroups[gc] = {code:gc, label:(CONTENT_TYPES[gc] ? CONTENT_TYPES[gc].label : gc), items:[]};
      typeGroupOrder.push(gc);
    }
    typeGroups[gc].items.push(t);
  });

  var h = '';
  h += '<div style="display:flex;height:100%;overflow:hidden">';

  // ══════ 좌측: 템플릿 유형 + 구조 목록 ══════
  h += '<div style="width:280px;border-right:1px solid #E5E5EA;background:#fff;display:flex;flex-direction:column;flex-shrink:0">';
  h += '<div style="padding:16px 16px 12px;border-bottom:1px solid #E5E5EA">';
  h += '<div style="font-size:15px;font-weight:600;color:#1D1D1F;margin-bottom:2px">\uCF58\uD150\uCE20 \uD15C\uD50C\uB9BF</div>';
  h += '<div style="font-size:11px;color:#8E8E93">\uC720\uD615\uBCC4 \uAD6C\uC870 \uBAA9\uB85D \uBC0F \uC0DD\uC131 \uAD00\uB9AC</div>';
  h += '</div>';
  h += '<div style="padding:8px 12px;display:flex;gap:6px;border-bottom:1px solid #F5F5F7">';
  h += '<input type="text" placeholder="\uD15C\uD50C\uB9BF \uAC80\uC0C9" value="' + (LT_STATE.search || '') + '" oninput="LT_STATE.search=this.value;renderLearningTypeView()" style="flex:1;padding:7px 10px;border:1px solid #E5E5EA;border-radius:7px;font-size:12px;outline:none">';
  h += '</div>';
  h += '<div style="flex:1;overflow-y:auto;padding:6px 8px">';

  // 유형별 아코디언
  typeGroupOrder.forEach(function(gc) {
    var group = typeGroups[gc];
    var isGroupActive = LT_STATE._activeGroup === gc;
    var hasActive = group.items.some(function(t){ return t.id === LT_STATE.editingId; });
    if(!LT_STATE._activeGroup && hasActive) { LT_STATE._activeGroup = gc; isGroupActive = true; }

    // 유형 헤더 (정답·해설, 자동채점 등)
    h += '<div style="margin-bottom:6px">';
    h += '<div onclick="LT_STATE._activeGroup=LT_STATE._activeGroup===\'' + gc + '\'?null:\'' + gc + '\';renderLearningTypeView()" style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;cursor:pointer;background:' + (isGroupActive ? '#F0F9FF' : 'transparent') + ';border:1px solid ' + (isGroupActive ? '#BAE6FD' : 'transparent') + ';transition:all .1s" onmouseenter="if(!' + isGroupActive + ')this.style.background=\'#FAFAFA\'" onmouseleave="if(!' + isGroupActive + ')this.style.background=\'' + (isGroupActive ? '#F0F9FF' : 'transparent') + '\'">';
    h += '<svg viewBox="0 0 24 24" fill="none" stroke="#636366" stroke-width="2" style="width:12px;height:12px;flex-shrink:0;transition:transform .15s;transform:rotate(' + (isGroupActive ? '90' : '0') + 'deg)"><polyline points="9 18 15 12 9 6"/></svg>';
    h += '<span style="font-size:13px;font-weight:700;color:#1D1D1F;flex:1">' + group.label + '</span>';
    h += '<span style="font-size:9px;padding:1px 6px;border-radius:3px;background:#F5F5F7;color:#636366;font-weight:600;font-family:monospace">' + gc + '</span>';
    h += '<span style="font-size:9px;padding:1px 6px;border-radius:980px;background:#E0F2FE;color:#0284C7;font-weight:700">' + group.items.length + '</span>';
    h += '</div>';

    // 구조 목록 (펼침)
    if(isGroupActive) {
      h += '<div style="padding:4px 0 4px 16px">';

      // 구조 리스트
      group.items.forEach(function(t, ti) {
        var isActive = LT_STATE.editingId === t.id;
        var depthCount = _ltCountDepth(t.depths);
        var flatInfo = _ltGetDepthFlatInfo(t.depths);
        var totalFields = 0;
        flatInfo.forEach(function(fi){ totalFields += (fi.fields ? fi.fields.length : 0); });
        // 사용 중 여부 (REGISTERED_WORK_TYPES에서 참조)
        var isInUse = false;
        Object.keys(REGISTERED_WORK_TYPES).forEach(function(k) {
          (REGISTERED_WORK_TYPES[k] || []).forEach(function(rt) { if(rt.ltTypeId === t.id) isInUse = true; });
        });

        h += '<div onclick="LT_STATE.editingId=\'' + t.id + '\';LT_STATE.editTab=\'step1\';renderLearningTypeView()" style="padding:8px 10px;border-radius:6px;cursor:pointer;margin-bottom:2px;border-left:2.5px solid ' + (isActive ? (t.color || '#0071E3') : 'transparent') + ';background:' + (isActive ? '#FAFAFA' : 'transparent') + ';transition:all .1s" onmouseenter="this.style.background=\'' + (isActive ? '#FAFAFA' : '#FAFAFA') + '\'" onmouseleave="this.style.background=\'' + (isActive ? '#FAFAFA' : 'transparent') + '\'">';

        // 제목 행 (구조명 - 사용자 정의 또는 기본값)
        var structLabel = t.structureName || (t.subject || '') + (t.grade ? ' ' + t.grade : '') || '\uBBF8\uC9C0\uC815';
        h += '<div style="display:flex;align-items:center;gap:5px;margin-bottom:2px">';
        h += '<div style="width:5px;height:5px;border-radius:50%;background:' + (t.color || '#8E8E93') + ';flex-shrink:0"></div>';
        h += '<span style="font-size:12px;font-weight:' + (isActive ? '700' : '500') + ';color:#1D1D1F;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + structLabel + '</span>';
        if(isInUse) h += '<span style="font-size:8px;padding:1px 5px;border-radius:3px;background:#F0FFF4;color:#34C759;font-weight:700">\uC0AC\uC6A9\uC911</span>';
        h += '</div>';

        // 메타 행
        h += '<div style="display:flex;gap:4px;padding-left:10px;flex-wrap:wrap">';
        h += '<span style="font-size:9px;color:#8E8E93;font-weight:500">' + depthCount + 'D \u00B7 ' + totalFields + '\uD544\uB4DC</span>';
        if(t.subject) h += '<span style="font-size:9px;color:#8E8E93;font-weight:500">\u00B7 ' + t.subject + '</span>';
        h += '</div>';

        h += '</div>';
      });

      // + 추가 버튼
      h += '<div onclick="_ltAddStructure(\'' + gc + '\')" style="display:flex;align-items:center;gap:5px;padding:6px 10px;border-radius:6px;cursor:pointer;color:#0071E3;transition:all .1s;margin-top:2px" onmouseenter="this.style.background=\'#F0F9FF\'" onmouseleave="this.style.background=\'transparent\'">';
      h += '<svg viewBox="0 0 24 24" fill="none" stroke="#0071E3" stroke-width="2" style="width:12px;height:12px"><path d="M12 5v14m-7-7h14"/></svg>';
      h += '<span style="font-size:11px;font-weight:600">+ \uAD6C\uC870 \uCD94\uAC00</span>';
      h += '</div>';

      h += '</div>';
    }
    h += '</div>';
  });

  // 새 유형 추가
  h += '<div style="padding:8px 0;border-top:1px solid #F5F5F7;margin-top:4px">';
  h += '<div onclick="_ltAddNewType()" style="display:flex;align-items:center;gap:6px;padding:8px 10px;border-radius:8px;cursor:pointer;transition:all .1s" onmouseenter="this.style.background=\'#FAFAFA\'" onmouseleave="this.style.background=\'transparent\'">';
  h += '<svg viewBox="0 0 24 24" fill="none" stroke="#8E8E93" stroke-width="2" style="width:14px;height:14px"><path d="M12 5v14m-7-7h14"/></svg>';
  h += '<span style="font-size:11px;font-weight:600;color:#636366">\uC0C8 \uD15C\uD50C\uB9BF \uC720\uD615</span>';
  h += '</div></div>';

  if(typeGroupOrder.length === 0) h += '<div style="text-align:center;padding:30px;color:#8E8E93;font-size:12px">\uB4F1\uB85D\uB41C \uD15C\uD50C\uB9BF\uC774 \uC5C6\uC2B5\uB2C8\uB2E4</div>';
  h += '</div></div>';

  // ══════ 우측: 편집 영역 ══════
  var editType = LT_STATE.editingId ? types.find(function(t){ return t.id === LT_STATE.editingId; }) : null;

  h += '<div style="flex:1;display:flex;flex-direction:column;overflow:hidden;background:#FAFAFA">';

  if(!editType) {
    h += '<div style="display:flex;align-items:center;justify-content:center;flex:1;color:#8E8E93">';
    h += '<div style="text-align:center"><svg viewBox="0 0 24 24" fill="none" stroke="#D1D1D6" stroke-width="1.5" style="width:48px;height:48px;margin:0 auto 12px"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>';
    h += '<div style="font-size:14px;font-weight:600;margin-bottom:4px">콘텐츠 템플릿을 선택하세요</div>';
    h += '<div style="font-size:12px">좌측 목록에서 템플릿을 선택하거나 신규 템플릿을 생성합니다</div></div></div>';
  } else {
    // ── 편집 상단 바 ──
    h += '<div style="padding:14px 20px;background:#fff;border-bottom:1px solid #E5E5EA;display:flex;align-items:center;gap:10px;flex-shrink:0">';
    h += '<div style="width:8px;height:8px;border-radius:50%;background:' + (editType.color || '#8E8E93') + '"></div>';
    h += '<span style="font-size:15px;font-weight:600;color:#1D1D1F">' + editType.name + '</span>';
    h += '<span style="font-size:10px;padding:2px 8px;border-radius:4px;background:#F5F5F7;color:#636366;font-weight:600;font-family:monospace">' + editType.id + '</span>';
    h += '<div style="flex:1"></div>';
    // 탭 전환
    h += '<div style="display:flex;gap:0;border:1px solid #E5E5EA;border-radius:8px;overflow:hidden">';
    var tabs = [{v:'step1',l:'1. 단계 정의'},{v:'step2',l:'2. 필드 배정'},{v:'step3',l:'3. 저장 · 관리'}];
    tabs.forEach(function(tab) {
      var isOn = LT_STATE.editTab === tab.v;
      h += '<button onclick="LT_STATE.editTab=\'' + tab.v + '\';renderLearningTypeView()" style="padding:6px 14px;border:none;font-size:12px;font-weight:' + (isOn ? 700 : 500) + ';cursor:pointer;background:' + (isOn ? '#1D1D1F' : '#fff') + ';color:' + (isOn ? '#fff' : '#636366') + ';transition:all .12s">' + tab.l + '</button>';
    });
    h += '</div>';
    var editInUse = false;
    Object.keys(REGISTERED_WORK_TYPES).forEach(function(k) {
      (REGISTERED_WORK_TYPES[k] || []).forEach(function(rt) { if(rt.ltTypeId === editType.id) editInUse = true; });
    });
    if(editInUse) {
      h += '<span style="font-size:10px;padding:3px 8px;border-radius:4px;background:#FFF8F0;color:#B35C00;font-weight:600">\uC0AC\uC6A9\uC911 \u00B7 \uC218\uC815\uC8FC\uC758</span>';
      h += '<button onclick="_ltDeleteType(\'' + editType.id + '\')" style="padding:5px 10px;border:1px solid #E5E5EA;border-radius:6px;background:#FAFAFA;color:#D1D1D6;font-size:11px;font-weight:600;cursor:not-allowed" title="\uC0AC\uC6A9 \uC911\uC778 \uD15C\uD50C\uB9BF\uC740 \uC0AD\uC81C\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4">\uC0AD\uC81C</button>';
    } else {
      h += '<button onclick="_ltDeleteType(\'' + editType.id + '\')" style="padding:5px 10px;border:1px solid #FFB3AE;border-radius:6px;background:#fff;color:#FF3B30;font-size:11px;font-weight:600;cursor:pointer">\uC0AD\uC81C</button>';
    }
    h += '</div>';

    // ── 탭 콘텐츠 ──
    h += '<div style="flex:1;overflow-y:auto;padding:20px">';

    if(LT_STATE.editTab === 'step1') {
      h += _ltRenderStep1(editType);
    } else if(LT_STATE.editTab === 'step2') {
      h += _ltRenderStep2(editType);
    } else {
      h += _ltRenderStep3(editType);
    }

    h += '</div>';
  }
  h += '</div></div>';
  root.innerHTML = h;
}

// ═══ _ltRenderStep1 (원본 라인 13389~13561) ═══
function _ltRenderStep1(t) {
  var h = '';
  var depthNames = _ltGetDepthNames(t.depths);
  var depthCount = _ltCountDepth(t.depths);
  var flatInfo = _ltGetDepthFlatInfo(t.depths);

  // ── 구조 기본정보 ──
  h += '<div style="background:#fff;border-radius:12px;border:1px solid #E5E5EA;overflow:hidden;margin-bottom:16px">';
  h += '<div style="padding:14px 18px;border-bottom:1px solid #F5F5F7;display:flex;align-items:center;gap:8px">';
  h += '<svg viewBox="0 0 24 24" fill="none" stroke="#0071E3" stroke-width="2" style="width:16px;height:16px;flex-shrink:0"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';
  h += '<span style="font-size:13px;font-weight:600;color:#1D1D1F">\uAD6C\uC870 \uAE30\uBCF8\uC815\uBCF4</span>';
  h += '<span style="font-size:10px;color:#8E8E93">\uC88C\uCE21 \uBAA9\uB85D\uC5D0 \uD45C\uC2DC\uB420 \uAD6C\uC870\uBA85\uC744 \uC785\uB825\uD558\uC138\uC694</span>';
  h += '</div>';
  h += '<div style="padding:16px 18px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">';
  // 구조명
  h += '<div style="grid-column:1/4">';
  h += '<label style="font-size:11px;font-weight:700;color:#48484A;display:block;margin-bottom:4px">\uAD6C\uC870\uBA85 <span style="color:#FF3B30">*</span></label>';
  h += '<input type="text" value="' + (t.structureName || '').replace(/"/g,'&quot;') + '" placeholder="\uC608: \uC218\uD559 \uC804\uD559\uB144 4\uB2E8\uACC4, \uC601\uC5B4 \uC911\uB4F11-1 \uB4F1" onchange="_ltUpdateField(\'' + t.id + '\',\'structureName\',this.value);renderLearningTypeView()" style="width:100%;padding:8px 12px;border:1px solid #E5E5EA;border-radius:8px;font-size:13px;outline:none;box-sizing:border-box" onfocus="this.style.borderColor=\'#0071E3\'" onblur="this.style.borderColor=\'#E5E5EA\'">';
  h += '</div>';
  // 대상 과목
  h += '<div>';
  h += '<label style="font-size:11px;font-weight:700;color:#48484A;display:block;margin-bottom:4px">\uB300\uC0C1 \uACFC\uBAA9</label>';
  h += '<input type="text" value="' + (t.subject || '').replace(/"/g,'&quot;') + '" placeholder="\uC608: \uC218\uD559" onchange="_ltUpdateField(\'' + t.id + '\',\'subject\',this.value)" style="width:100%;padding:8px 12px;border:1px solid #E5E5EA;border-radius:8px;font-size:12px;outline:none;box-sizing:border-box" onfocus="this.style.borderColor=\'#0071E3\'" onblur="this.style.borderColor=\'#E5E5EA\'">';
  h += '</div>';
  // 학년/대상
  h += '<div>';
  h += '<label style="font-size:11px;font-weight:700;color:#48484A;display:block;margin-bottom:4px">\uD559\uB144/\uB300\uC0C1</label>';
  h += '<input type="text" value="' + (t.grade || '').replace(/"/g,'&quot;') + '" placeholder="\uC608: \uC804\uD559\uB144" onchange="_ltUpdateField(\'' + t.id + '\',\'grade\',this.value)" style="width:100%;padding:8px 12px;border:1px solid #E5E5EA;border-radius:8px;font-size:12px;outline:none;box-sizing:border-box" onfocus="this.style.borderColor=\'#0071E3\'" onblur="this.style.borderColor=\'#E5E5EA\'">';
  h += '</div>';
  // 교육과정
  h += '<div>';
  h += '<label style="font-size:11px;font-weight:700;color:#48484A;display:block;margin-bottom:4px">\uAD50\uC721\uACFC\uC815</label>';
  h += '<input type="text" value="' + (t.curriculum || '').replace(/"/g,'&quot;') + '" placeholder="\uC608: 2022 \uAC1C\uC815" onchange="_ltUpdateField(\'' + t.id + '\',\'curriculum\',this.value)" style="width:100%;padding:8px 12px;border:1px solid #E5E5EA;border-radius:8px;font-size:12px;outline:none;box-sizing:border-box" onfocus="this.style.borderColor=\'#0071E3\'" onblur="this.style.borderColor=\'#E5E5EA\'">';
  h += '</div>';
  // 연계 시스템 (멀티 선택)
  h += '<div style="grid-column:1/4;margin-top:4px">';
  h += '<label style="font-size:11px;font-weight:700;color:#48484A;display:block;margin-bottom:6px">\uC5F0\uACC4 \uC2DC\uC2A4\uD15C <span style="color:#FF3B30">*</span></label>';
  var _tSystems = t.targetSystems || [];
  var _allSys = Object.keys(WC_SYSTEM_COLORS);
  h += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px">';
  _allSys.forEach(function(sk) {
    var sys = WC_SYSTEM_COLORS[sk];
    var isOn = _tSystems.indexOf(sk) >= 0;
    h += '<button onclick="_ltToggleTargetSystem(\'' + t.id + '\',\'' + sk + '\')" style="padding:5px 14px;border-radius:6px;font-size:12px;font-weight:500;cursor:pointer;transition:all .12s;border:1px solid ' + (isOn ? sys.color : '#E5E5EA') + ';background:' + (isOn ? sys.bg : '#fff') + ';color:' + (isOn ? sys.color : '#8E8E93') + '">' + sys.label + '</button>';
  });
  h += '</div>';
  // 주의사항
  if(_tSystems.length > 1) {
    h += '<div style="display:flex;align-items:flex-start;gap:6px;padding:6px 10px;background:#FFF8F0;border-radius:6px;border:1px solid #FFD9A8">';
    h += '<span style="font-size:12px;flex-shrink:0;margin-top:1px">\u26A0\uFE0F</span>';
    h += '<span style="font-size:10px;color:#B35C00;font-weight:600;line-height:1.4">\uCF58\uD150\uCE20\uAC00 \uB3D9\uC77C\uD558\uC9C0 \uC54A\uC744 \uACBD\uC6B0 \uD558\uB098\uC758 \uC2DC\uC2A4\uD15C\uB9CC \uC120\uD0DD\uD558\uC138\uC694! \uC2DC\uC2A4\uD15C\uBCC4\uB85C \uBCC4\uB3C4 \uAD6C\uC870\uB97C \uB9CC\uB4E4\uC5B4\uC57C \uD569\uB2C8\uB2E4.</span>';
    h += '</div>';
  } else if(_tSystems.length === 0) {
    h += '<div style="font-size:10px;color:#8E8E93">\uBC30\uD3EC\uD560 \uC2DC\uC2A4\uD15C\uC744 1\uAC1C \uC774\uC0C1 \uC120\uD0DD\uD558\uC138\uC694</div>';
  }
  h += '</div>';
  h += '</div></div>';

  // ── 빠른 생성 (기존 depth 있으면 접힌 상태) ──
  var hasExistingDepth = depthCount > 0 && flatInfo.length > 0 && flatInfo.some(function(fi){ return fi.fields && fi.fields.length > 0; });
  var quickGenCollapsed = hasExistingDepth && !LT_STATE._quickGenOpen;
  h += '<div style="background:#fff;border-radius:12px;border:1px solid ' + (quickGenCollapsed ? '#F5F5F7' : '#E5E5EA') + ';overflow:hidden;margin-bottom:16px">';
  h += '<div onclick="LT_STATE._quickGenOpen=!LT_STATE._quickGenOpen;renderLearningTypeView()" style="padding:' + (quickGenCollapsed ? '10px 18px' : '14px 18px') + ';' + (quickGenCollapsed ? '' : 'border-bottom:1px solid #F5F5F7;') + 'display:flex;align-items:center;gap:8px;cursor:pointer" onmouseenter="this.style.background=\'#FAFAFA\'" onmouseleave="this.style.background=\'transparent\'">';
  h += '<svg viewBox="0 0 24 24" fill="none" stroke="' + (quickGenCollapsed ? '#8E8E93' : '#0071E3') + '" stroke-width="2" style="width:' + (quickGenCollapsed ? '12' : '16') + 'px;height:' + (quickGenCollapsed ? '12' : '16') + 'px;flex-shrink:0;transition:transform .15s;transform:rotate(' + (quickGenCollapsed ? '0' : '90') + 'deg)"><polyline points="9 18 15 12 9 6"/></svg>';
  if(quickGenCollapsed) {
    h += '<span style="font-size:11px;font-weight:600;color:#8E8E93">\uB2E8\uACC4 \uAD6C\uC870 \uBE60\uB978 \uC0DD\uC131</span>';
    h += '<div style="flex:1"></div>';
    h += '<span style="font-size:10px;color:#D1D1D6">\uD074\uB9AD\uD558\uC5EC \uD3BC\uCE58\uAE30</span>';
  } else {
    h += '<span style="font-size:13px;font-weight:600;color:#1D1D1F">\uB2E8\uACC4 \uAD6C\uC870 \uC790\uB3D9 \uC0DD\uC131</span>';
    h += '<span style="font-size:10px;color:#8E8E93">\uB2E8\uACC4 \uC218\uB97C \uC785\uB825\uD558\uBA74 \uAD6C\uC870\uAC00 \uC790\uB3D9 \uC0DD\uC131\uB429\uB2C8\uB2E4</span>';
    h += '<div style="flex:1"></div>';
    h += '<span style="font-size:11px;color:#8E8E93">\uD604\uC7AC: <strong style="color:#1D1D1F">' + depthCount + '</strong> Depth</span>';
  }
  h += '</div>';
  if(!quickGenCollapsed) {
  h += '<div style="padding:16px 18px">';
  h += '<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">';
  h += '<label style="font-size:12px;font-weight:700;color:#48484A;white-space:nowrap">\uB2E8\uACC4 \uC218</label>';
  h += '<input id="ltDepthCountInput" type="number" min="1" max="8" value="' + (depthCount || 4) + '" style="width:72px;padding:8px 12px;border:1px solid #E5E5EA;border-radius:8px;font-size:14px;font-weight:700;text-align:center;outline:none" onfocus="this.style.borderColor=\'#0071E3\'" onblur="this.style.borderColor=\'#E5E5EA\'">';
  h += '<button onclick="_ltGenerateDepths(\'' + t.id + '\')" style="padding:8px 18px;border:none;border-radius:8px;background:#0071E3;color:#fff;font-size:12px;font-weight:500;cursor:pointer">\uAD6C\uC870 \uC0DD\uC131</button>';
  if(hasExistingDepth) h += '<span style="font-size:10px;color:#FF9500;margin-left:8px">\u26A0 \uAE30\uC874 Depth\uAC00 \uCD08\uAE30\uD654\uB429\uB2C8\uB2E4</span>';
  h += '</div>';
  // 프리셋
  h += '<div style="display:flex;gap:6px;flex-wrap:wrap">';
  var presets = [
    {n:3, label:'\uCEE4\uB9AC\uD058\uB7FC\uBA85 \u203A \uACFC\uC815 \u203A \uC138\uD2B8'},
    {n:4, label:'\uCEE4\uB9AC\uD058\uB7FC\uBA85 \u203A \uACFC\uC815 \u203A \uC138\uD2B8 \u203A \uD559\uC2B5\uC77C'},
    {n:5, label:'\uCEE4\uB9AC\uD058\uB7FC\uBA85 \u203A \uACFC\uC815 \u203A \uB2E8\uC6D0 \u203A \uC138\uD2B8 \u203A \uD559\uC2B5\uC77C'},
    {n:4, label:'\uCEE4\uB9AC\uD058\uB7FC\uBA85 \u203A \uCD9C\uD310\uC0AC \u203A \uAC15\uC88C \u203A \uAC15'},
  ];
  presets.forEach(function(pr, pi) {
    h += '<button onclick="_ltApplyPreset(\'' + t.id + '\',' + pi + ')" style="padding:5px 12px;border:1px solid #E5E5EA;border-radius:6px;background:#FAFAFA;color:#48484A;font-size:10px;font-weight:600;cursor:pointer;transition:all .1s" onmouseenter="this.style.borderColor=\'#0071E3\';this.style.color=\'#0071E3\'" onmouseleave="this.style.borderColor=\'#E5E5EA\';this.style.color=\'#48484A\'">' + pr.label + '</button>';
  });
  h += '</div></div>';
  }
  h += '</div>';

  // ── Depth 목록 (상세 편집) ──
  h += '<div style="background:#fff;border-radius:12px;border:1px solid #E5E5EA;overflow:hidden">';
  h += '<div style="padding:14px 18px;border-bottom:1px solid #F5F5F7;display:flex;align-items:center;gap:8px">';
  h += '<span style="font-size:13px;font-weight:600;color:#1D1D1F">\uB2E8\uACC4 \uBAA9\uB85D</span>';
  h += '<span style="font-size:10px;color:#8E8E93">\uB2E8\uACC4\uBA85, \uBCF4\uC870\uBA85, \uADF8\uB8F9 \uC218\uB97C \uC815\uC758\uD569\uB2C8\uB2E4</span>';
  h += '</div>';
  h += '<div style="padding:0">';

  var depthColors = ['#0071E3','#AF52DE','#34C759','#FF9500','#FF3B30','#0891B2','#BE185D','#0071E3'];
  if(flatInfo.length === 0) {
    h += '<div style="padding:32px;text-align:center;color:#8E8E93;font-size:12px">\uC704 \uBE60\uB978 \uC0DD\uC131\uC73C\uB85C \uB2E8\uACC4 \uAD6C\uC870\uB97C \uB9CC\uB4E4\uC5B4\uC8FC\uC138\uC694</div>';
  } else {
    // 테이블 헤더
    h += '<div style="display:grid;grid-template-columns:40px 1.2fr 1.2fr 100px 60px;gap:0;padding:8px 18px;background:#FAFAFA;border-bottom:1px solid #F5F5F7;font-size:9px;font-weight:700;color:#8E8E93;text-transform:uppercase;letter-spacing:.06em">';
    h += '<div>\uB2E8\uACC4</div><div>\uB2E8\uACC4\uBA85</div><div>\uBCF4\uC870\uBA85</div><div style="text-align:center">\uADF8\uB8F9 \uC218</div><div style="text-align:center">\uD544\uB4DC</div>';
    h += '</div>';

    flatInfo.forEach(function(fi, idx) {
      var dc = depthColors[fi.level % depthColors.length];
      var isLast = idx === flatInfo.length - 1;
      h += '<div style="display:grid;grid-template-columns:40px 1.2fr 1.2fr 100px 60px;gap:0;padding:10px 18px;align-items:center;border-bottom:' + (isLast ? 'none' : '1px solid #F5F5F7') + ';transition:background .1s" onmouseenter="this.style.background=\'#FAFAFA\'" onmouseleave="this.style.background=\'transparent\'">';

      // Depth 번호
      h += '<div style="display:flex;align-items:center;gap:4px">';
      h += '<div style="width:24px;height:24px;border-radius:6px;background:' + dc + '12;display:flex;align-items:center;justify-content:center"><span style="font-size:11px;font-weight:600;color:' + dc + '">' + (fi.level + 1) + '</span></div>';
      h += '</div>';

      // Depth명
      h += '<div><input type="text" value="' + fi.name + '" onchange="_ltTreeRenameLevel(\'' + t.id + '\',' + fi.level + ',this.value)" style="width:100%;padding:6px 10px;border:1px solid transparent;border-radius:6px;font-size:13px;font-weight:700;color:#1D1D1F;outline:none;background:transparent;transition:all .12s;box-sizing:border-box" onfocus="this.style.borderColor=\'' + dc + '\';this.style.background=\'#fff\'" onblur="this.style.borderColor=\'transparent\';this.style.background=\'transparent\'" placeholder="\uB2E8\uACC4 ' + (fi.level + 1) + ' \uC774\uB984"></div>';

      // 보조명
      h += '<div><input type="text" value="' + (fi.subName || '') + '" onchange="_ltSetDepthProp(\'' + t.id + '\',' + fi.level + ',\'subName\',this.value)" style="width:100%;padding:6px 10px;border:1px solid transparent;border-radius:6px;font-size:12px;color:#636366;outline:none;background:transparent;transition:all .12s;box-sizing:border-box" onfocus="this.style.borderColor=\'#D1D1D6\';this.style.background=\'#fff\'" onblur="this.style.borderColor=\'transparent\';this.style.background=\'transparent\'" placeholder="\uBCF4\uC870\uBA85 \uC785\uB825"></div>';

      // 그룹 수
      h += '<div style="text-align:center"><input type="number" min="1" max="999" value="' + (fi.groupCount || 1) + '" onchange="_ltSetDepthProp(\'' + t.id + '\',' + fi.level + ',\'groupCount\',parseInt(this.value)||1)" style="width:64px;padding:5px 8px;border:1px solid #E5E5EA;border-radius:6px;font-size:12px;font-weight:600;text-align:center;outline:none" onfocus="this.style.borderColor=\'' + dc + '\'" onblur="this.style.borderColor=\'#E5E5EA\'"></div>';

      // 필드 수
      var fCount = fi.fields ? fi.fields.length : 0;
      h += '<div style="text-align:center"><span style="font-size:10px;padding:2px 8px;border-radius:980px;background:' + (fCount > 0 ? '#F0FFF4' : '#FFF8F0') + ';color:' + (fCount > 0 ? '#34C759' : '#B35C00') + ';font-weight:700">' + fCount + '</span></div>';

      h += '</div>';
    });
  }
  h += '</div>';

  // 미리보기
  h += '<div style="padding:14px 18px;border-top:1px solid #F5F5F7;background:#FAFAFA">';
  h += '<div style="font-size:10px;font-weight:700;color:#8E8E93;margin-bottom:8px">\uAD6C\uC870 \uBBF8\uB9AC\uBCF4\uAE30</div>';
  h += '<div style="display:flex;align-items:center;gap:0;flex-wrap:wrap">';
  flatInfo.forEach(function(fi, idx) {
    if(idx > 0) h += '<svg viewBox="0 0 24 24" fill="none" stroke="#D1D1D6" stroke-width="2" style="width:16px;height:16px;flex-shrink:0"><polyline points="9 18 15 12 9 6"/></svg>';
    var bgColors = ['#E8F2FF','#F9F0FF','#F0FFF4','#FFF8F0','#FFF1F2','#F0F9FF'];
    var borderColors = ['#B3D7FF','#D9B3F0','#A8E6B8','#FFD9A8','#FECDD3','#BAE6FD'];
    var ci = fi.level % bgColors.length;
    h += '<div style="background:' + bgColors[ci] + ';border:1px solid ' + borderColors[ci] + ';border-radius:8px;padding:6px 14px;text-align:center">';
    h += '<div style="font-size:8px;color:#8E8E93;font-weight:600">\uB2E8\uACC4 ' + (fi.level + 1) + '</div>';
    h += '<div style="font-size:12px;font-weight:700;color:#1D1D1F">' + fi.name + '</div>';
    if(fi.subName) h += '<div style="font-size:9px;color:#636366">' + fi.subName + '</div>';
    h += '<div style="font-size:9px;color:#8E8E93;margin-top:1px">' + (fi.groupCount || 1) + '\uAC1C \uADF8\uB8F9</div>';
    h += '</div>';
  });
  h += '</div></div>';

  h += '</div>';

  // 다음 단계 버튼
  if(depthCount > 0) {
    h += '<div style="margin-top:16px;display:flex;justify-content:flex-end">';
    h += '<button onclick="LT_STATE.editTab=\'step2\';renderLearningTypeView()" style="padding:10px 24px;border:none;border-radius:8px;background:#0071E3;color:#fff;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px">';
    h += '2\uB2E8\uACC4: \uD544\uB4DC \uBC30\uC815 \u2192';
    h += '</button></div>';
  }

  return h;
}

// ═══ _ltSetDepthProp (원본 라인 13578~13589) ═══
function _ltSetDepthProp(typeId, level, prop, value) {
  var t = LT_STATE.types.find(function(x){ return x.id === typeId; });
  if(!t) return;
  function walkSet(nodes, curLevel) {
    if(!nodes) return;
    nodes.forEach(function(n) {
      if(curLevel === level) n[prop] = value;
      walkSet(n.children, curLevel + 1);
    });
  }
  walkSet(t.depths, 0);
}

// ═══ _ltRenderTreeNodes (원본 라인 13600~13646) ═══
function _ltRenderTreeNodes(typeId, nodes, depth) {
  if(!nodes || nodes.length === 0) return '';
  var h = '';
  nodes.forEach(function(node, ni) {
    var indent = depth * 28;
    var hasChildren = node.children && node.children.length > 0;
    var depthColors = ['#0071E3','#AF52DE','#34C759','#FF9500','#FF3B30','#0891B2'];
    var dc = depthColors[depth % depthColors.length];

    // 노드 행 (트리 에디터 스타일)
    h += '<div style="display:flex;align-items:center;gap:0;padding:5px 12px 5px ' + (16 + indent) + 'px;transition:background .1s" onmouseenter="this.style.background=\'#FAFAFA\'" onmouseleave="this.style.background=\'transparent\'">';

    // 연결선 + 아이콘
    if(depth > 0) {
      h += '<div style="width:16px;height:16px;display:flex;align-items:center;justify-content:center;color:#D1D1D6;font-size:10px;flex-shrink:0">└</div>';
    }

    // Depth 표시
    h += '<div style="min-width:52px;display:flex;align-items:center;gap:4px;flex-shrink:0">';
    h += '<div style="width:6px;height:6px;border-radius:50%;background:' + dc + '"></div>';
    h += '<span style="font-size:9px;font-weight:700;color:' + dc + '">\uB2E8\uACC4 ' + (depth + 1) + '</span>';
    h += '</div>';

    // 이름 편집
    h += '<input type="text" value="' + node.name + '" onchange="_ltTreeRename(\'' + typeId + '\',\'' + node.id + '\',this.value)" style="flex:1;padding:5px 10px;border:1px solid #E5E5EA;border-radius:6px;font-size:13px;font-weight:600;outline:none;max-width:240px;transition:border-color .15s" onfocus="this.style.borderColor=\'' + dc + '\'" onblur="this.style.borderColor=\'#E5E5EA\'">';

    // 액션 버튼들
    h += '<div style="display:flex;gap:4px;margin-left:8px">';
    h += '<button onclick="_ltTreeAddChild(\'' + typeId + '\',\'' + node.id + '\')" style="padding:3px 8px;border:1px solid #B3D7FF;border-radius:5px;background:#E8F2FF;color:#0071E3;font-size:10px;font-weight:700;cursor:pointer" title="하위 단계 추가">+ 하위</button>';
    if(depth > 0 || (nodes.length > 1 && depth === 0)) {
      h += '<button onclick="_ltTreeRemove(\'' + typeId + '\',\'' + node.id + '\')" style="padding:3px 6px;border:1px solid #FFB3AE;border-radius:5px;background:#fff;color:#FF3B30;font-size:10px;cursor:pointer" title="삭제">×</button>';
    }
    if(ni > 0) {
      h += '<button onclick="_ltTreeMove(\'' + typeId + '\',\'' + node.id + '\',-1)" style="padding:2px 5px;border:1px solid #E5E5EA;border-radius:4px;background:#fff;color:#636366;font-size:9px;cursor:pointer">▲</button>';
    }
    if(ni < nodes.length - 1) {
      h += '<button onclick="_ltTreeMove(\'' + typeId + '\',\'' + node.id + '\',1)" style="padding:2px 5px;border:1px solid #E5E5EA;border-radius:4px;background:#fff;color:#636366;font-size:9px;cursor:pointer">▼</button>';
    }
    h += '</div></div>';

    // 재귀: 자식 노드
    if(hasChildren) {
      h += _ltRenderTreeNodes(typeId, node.children, depth + 1);
    }
  });
  return h;
}

// ═══ _ltRenderStep2 (원본 라인 13649~13749) ═══
function _ltRenderStep2(t) {
  var h = '';
  var flatInfo = _ltGetDepthFlatInfo(t.depths);
  var depthColors = ['#0071E3','#AF52DE','#34C759','#FF9500','#FF3B30','#0891B2','#BE185D','#0071E3'];

  // 현재 선택된 Depth (편집 대상)
  if(!LT_STATE._activeDepth && flatInfo.length > 0) LT_STATE._activeDepth = flatInfo[flatInfo.length - 1].level;
  var activeLevel = LT_STATE._activeDepth || 0;

  h += '<div style="display:flex;gap:16px;height:100%">';

  // ── 좌측: Depth 선택 ──
  h += '<div style="width:200px;background:#fff;border-radius:12px;border:1px solid #E5E5EA;display:flex;flex-direction:column;flex-shrink:0">';
  h += '<div style="padding:12px 14px;border-bottom:1px solid #F5F5F7">';
  h += '<div style="font-size:12px;font-weight:600;color:#1D1D1F">\uB2E8\uACC4 \uC120\uD0DD</div>';
  h += '<div style="font-size:9px;color:#8E8E93;margin-top:2px">\uD544\uB4DC\uB97C \uBC30\uC815\uD560 \uB2E8\uACC4\uB97C \uC120\uD0DD\uD558\uC138\uC694</div>';
  h += '</div>';
  h += '<div style="flex:1;overflow-y:auto;padding:6px">';
  flatInfo.forEach(function(fi) {
    var dc = depthColors[fi.level % depthColors.length];
    var isActive = fi.level === activeLevel;
    var fCount = fi.fields ? fi.fields.length : 0;
    h += '<div onclick="LT_STATE._activeDepth=' + fi.level + ';renderLearningTypeView()" style="padding:10px 12px;border-radius:8px;cursor:pointer;margin-bottom:3px;border-left:3px solid ' + (isActive ? dc : 'transparent') + ';background:' + (isActive ? dc + '08' : 'transparent') + ';transition:all .1s">';
    h += '<div style="display:flex;align-items:center;gap:6px">';
    h += '<div style="width:22px;height:22px;border-radius:6px;background:' + dc + '15;display:flex;align-items:center;justify-content:center"><span style="font-size:10px;font-weight:600;color:' + dc + '">' + (fi.level + 1) + '</span></div>';
    h += '<div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:' + (isActive ? '700' : '500') + ';color:' + (isActive ? '#1D1D1F' : '#636366') + '">' + fi.name + '</div>';
    if(fi.subName) h += '<div style="font-size:9px;color:#8E8E93">' + fi.subName + '</div>';
    h += '</div>';
    h += '<span style="font-size:9px;padding:2px 6px;border-radius:980px;background:' + (fCount > 0 ? '#F0FFF4' : '#F5F5F7') + ';color:' + (fCount > 0 ? '#34C759' : '#8E8E93') + ';font-weight:700">' + fCount + '</span>';
    h += '</div></div>';
  });
  h += '</div></div>';

  // ── 우측: 필드 배정 영역 ──
  var activeFI = flatInfo.find(function(fi){ return fi.level === activeLevel; });
  var assignedKeys = activeFI && activeFI.fields ? activeFI.fields : [];

  h += '<div style="flex:1;display:flex;flex-direction:column;gap:12px">';

  // 헤더
  var adc = depthColors[activeLevel % depthColors.length];
  h += '<div style="background:#fff;border-radius:12px;border:1px solid #E5E5EA;padding:14px 18px;display:flex;align-items:center;gap:10px">';
  h += '<div style="width:32px;height:32px;border-radius:8px;background:' + adc + '15;display:flex;align-items:center;justify-content:center"><span style="font-size:14px;font-weight:600;color:' + adc + '">' + (activeLevel + 1) + '</span></div>';
  h += '<div><div style="font-size:14px;font-weight:700;color:#1D1D1F">' + (activeFI ? activeFI.name : '') + '</div>';
  h += '<div style="font-size:11px;color:#8E8E93">\uC774 \uB2E8\uACC4\uC5D0\uC11C \uC785\uB825\uD560 \uD544\uB4DC\uB97C \uC120\uD0DD\uD569\uB2C8\uB2E4 \u2014 \uC120\uD0DD\uB41C \uD544\uB4DC\uAC00 \uC791\uC5C5\uC790\uC758 \uC785\uB825 \uC591\uC2DD\uC774 \uB429\uB2C8\uB2E4</div>';
  h += '</div></div>';

  // 배정된 필드
  h += '<div style="background:#fff;border-radius:12px;border:1px solid #E5E5EA;overflow:hidden">';
  h += '<div style="padding:10px 14px;border-bottom:1px solid #F5F5F7;display:flex;align-items:center;gap:6px;background:' + adc + '08">';
  h += '<span style="font-size:11px;font-weight:700;color:' + adc + '">\uBC30\uC815\uB41C \uD544\uB4DC (' + assignedKeys.length + ')</span>';
  h += '</div>';
  if(assignedKeys.length > 0) {
    h += '<div style="padding:8px">';
    assignedKeys.forEach(function(key, ki) {
      var poolField = LT_FIELD_POOL.find(function(pf){ return pf.key === key; });
      var label = poolField ? poolField.label : key;
      var ftype = poolField ? poolField.type : 'text';
      var fdesc = poolField ? poolField.desc : '';
      h += '<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:#fff;border-radius:6px;margin-bottom:3px;border:1px solid #F5F5F7;transition:border-color .1s" onmouseenter="this.style.borderColor=\'#D1D1D6\'" onmouseleave="this.style.borderColor=\'#F5F5F7\'">';
      h += '<span style="font-size:12px;font-weight:700;color:#1D1D1F;min-width:100px">' + label + '</span>';
      h += '<span style="font-size:9px;padding:1px 6px;border-radius:3px;background:#F5F5F7;color:#636366;font-weight:600">' + ftype + '</span>';
      h += '<span style="font-size:9px;color:#8E8E93;flex:1">' + fdesc + '</span>';
      h += '<button onclick="_ltRemoveDepthField(\'' + t.id + '\',' + activeLevel + ',\'' + key + '\')" style="width:20px;height:20px;border:none;border-radius:4px;background:transparent;color:#D1D1D6;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px;transition:all .1s" onmouseenter="this.style.background=\'#FFB3AE\';this.style.color=\'#FF3B30\'" onmouseleave="this.style.background=\'transparent\';this.style.color=\'#D1D1D6\'">\u00D7</button>';
      h += '</div>';
    });
    h += '</div>';
  } else {
    h += '<div style="padding:20px;text-align:center;color:#8E8E93;font-size:11px">\uC544\uB798 \uD544\uB4DC \uD480\uC5D0\uC11C \uD074\uB9AD\uD558\uC5EC \uCD94\uAC00\uD558\uC138\uC694</div>';
  }
  h += '</div>';

  // 필드 풀 (추가 가능한 필드)
  h += '<div style="background:#fff;border-radius:12px;border:1px solid #E5E5EA;overflow:hidden;flex:1">';
  h += '<div style="padding:10px 14px;border-bottom:1px solid #F5F5F7;display:flex;align-items:center;gap:6px">';
  h += '<span style="font-size:11px;font-weight:700;color:#48484A">\uD544\uB4DC \uD480</span>';
  h += '<span style="font-size:9px;color:#8E8E93">\uD074\uB9AD\uD558\uBA74 \uC704 \uB2E8\uACC4\uC5D0 \uCD94\uAC00\uB429\uB2C8\uB2E4</span>';
  h += '</div>';
  h += '<div style="padding:8px;display:flex;flex-wrap:wrap;gap:4px;max-height:280px;overflow-y:auto">';
  var cats = _ltGetFieldCategories();
  cats.forEach(function(cat) {
    var catFields = LT_FIELD_POOL.filter(function(pf){ return pf.category === cat; });
    var avail = catFields.filter(function(pf){ return assignedKeys.indexOf(pf.key) < 0; });
    if(avail.length === 0) return;
    h += '<div style="width:100%;font-size:9px;font-weight:700;color:#8E8E93;text-transform:uppercase;letter-spacing:.06em;padding:4px 6px;margin-top:4px">' + cat + '</div>';
    avail.forEach(function(pf) {
      h += '<span onclick="_ltAddDepthField(\'' + t.id + '\',' + activeLevel + ',\'' + pf.key + '\')" style="font-size:10px;padding:4px 10px;border-radius:5px;background:#FAFAFA;color:#48484A;cursor:pointer;border:1px solid #E5E5EA;font-weight:600;transition:all .1s" onmouseenter="this.style.borderColor=\'#0071E3\';this.style.color=\'#0071E3\';this.style.background=\'#F0F9FF\'" onmouseleave="this.style.borderColor=\'#E5E5EA\';this.style.color=\'#48484A\';this.style.background=\'#FAFAFA\'">+ ' + pf.label + '</span>';
    });
  });
  h += '</div></div>';

  h += '</div></div>';

  // 네비게이션
  h += '<div style="margin-top:16px;display:flex;justify-content:space-between">';
  h += '<button onclick="LT_STATE.editTab=\'step1\';renderLearningTypeView()" style="padding:10px 20px;border:1px solid #E5E5EA;border-radius:8px;background:#fff;color:#636366;font-size:13px;font-weight:600;cursor:pointer">\u2190 1\uB2E8\uACC4: \uB2E8\uACC4 \uAD6C\uC870 \uC815\uC758</button>';
  h += '<button onclick="LT_STATE.editTab=\'step3\';renderLearningTypeView()" style="padding:10px 24px;border:none;border-radius:8px;background:#0071E3;color:#fff;font-size:13px;font-weight:700;cursor:pointer">3\uB2E8\uACC4: \uC800\uC7A5 \u00B7 \uAD00\uB9AC \u2192</button>';
  h += '</div>';

  return h;
}

// ═══ _ltAddDepthField (원본 라인 13752~13767) ═══
function _ltAddDepthField(typeId, level, fieldKey) {
  var t = LT_STATE.types.find(function(x){ return x.id === typeId; });
  if(!t) return;
  function walkAdd(nodes, curLevel) {
    if(!nodes) return;
    nodes.forEach(function(n) {
      if(curLevel === level) {
        if(!n.fields) n.fields = [];
        if(n.fields.indexOf(fieldKey) < 0) n.fields.push(fieldKey);
      }
      walkAdd(n.children, curLevel + 1);
    });
  }
  walkAdd(t.depths, 0);
  renderLearningTypeView();
}

// ═══ _ltRemoveDepthField (원본 라인 13770~13785) ═══
function _ltRemoveDepthField(typeId, level, fieldKey) {
  var t = LT_STATE.types.find(function(x){ return x.id === typeId; });
  if(!t) return;
  function walkRemove(nodes, curLevel) {
    if(!nodes) return;
    nodes.forEach(function(n) {
      if(curLevel === level && n.fields) {
        var idx = n.fields.indexOf(fieldKey);
        if(idx >= 0) n.fields.splice(idx, 1);
      }
      walkRemove(n.children, curLevel + 1);
    });
  }
  walkRemove(t.depths, 0);
  renderLearningTypeView();
}

// ═══ _ltAttrEditRow (원본 라인 13788~13820) ═══
function _ltAttrEditRow(typeId, attr) {
  var h = '';
  h += '<div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:#fff;border-radius:8px;margin-bottom:4px;border:1px solid #F5F5F7;transition:border-color .1s" onmouseenter="this.style.borderColor=\'#D1D1D6\'" onmouseleave="this.style.borderColor=\'#F5F5F7\'">';

  // 라벨 (DB 카탈로그 기반은 읽기 전용, 수동 추가분은 편집 가능)
  var isCatalogField = DB_FIELD_CATALOG.some(function(f){ return f.key === attr.key; });
  if(isCatalogField) {
    h += '<span style="width:120px;padding:4px 8px;font-size:12px;font-weight:700;color:#1D1D1F">' + attr.label + '</span>';
  } else {
    h += '<input type="text" value="' + attr.label + '" onchange="_ltUpdateAttrField(\'' + typeId + '\',\'' + attr.key + '\',\'label\',this.value)" style="width:120px;padding:4px 8px;border:1px solid transparent;border-radius:4px;font-size:12px;font-weight:700;color:#1D1D1F;outline:none;background:transparent;transition:border-color .1s" onfocus="this.style.borderColor=\'#B3D7FF\';this.style.background=\'#fff\'" onblur="this.style.borderColor=\'transparent\';this.style.background=\'transparent\'">';
  }

  // 키
  h += '<span style="font-size:10px;font-family:monospace;color:#8E8E93;min-width:60px">' + attr.key + '</span>';

  // 타입 선택
  h += '<select onchange="_ltUpdateAttrField(\'' + typeId + '\',\'' + attr.key + '\',\'type\',this.value)" style="padding:3px 8px;border:1px solid #E5E5EA;border-radius:4px;font-size:10px;outline:none;cursor:pointer;background:#FAFAFA;color:#48484A">';
  var attrTypes = ['text','number','file','select','textarea','date'];
  attrTypes.forEach(function(at) {
    h += '<option value="' + at + '"' + (attr.type === at ? ' selected' : '') + '>' + at + '</option>';
  });
  h += '</select>';

  h += '<div style="flex:1"></div>';

  // 필수/선택 토글
  h += '<button onclick="_ltToggleRequired(\'' + typeId + '\',\'' + attr.key + '\')" style="padding:3px 10px;border:1px solid ' + (attr.required ? '#FFD9A8' : '#E5E5EA') + ';border-radius:5px;background:' + (attr.required ? '#FFF8F0' : '#fff') + ';color:' + (attr.required ? '#B35C00' : '#8E8E93') + ';font-size:10px;font-weight:700;cursor:pointer;transition:all .12s">' + (attr.required ? '필수' : '선택') + '</button>';

  // 삭제
  h += '<button onclick="_ltRemoveAttr(\'' + typeId + '\',\'' + attr.key + '\')" style="padding:3px 7px;border:1px solid #FFB3AE;border-radius:5px;background:#fff;color:#FF3B30;font-size:10px;cursor:pointer">×</button>';
  h += '</div>';
  return h;
}

// ═══ _ltRenderStep3 (원본 라인 13823~13924) ═══
function _ltRenderStep3(t) {
  var h = '';
  var flatInfo = _ltGetDepthFlatInfo(t.depths);
  var depthCount = _ltCountDepth(t.depths);

  // ── 기본 정보 카드 ──
  h += '<div style="background:#fff;border-radius:12px;border:1px solid #E5E5EA;padding:20px;max-width:600px;margin-bottom:16px">';
  h += '<div style="font-size:14px;font-weight:600;color:#1D1D1F;margin-bottom:16px">\uD15C\uD50C\uB9BF \uAE30\uBCF8 \uC815\uBCF4</div>';

  // 템플릿명 + 코드
  h += '<div style="display:flex;gap:12px;margin-bottom:14px">';
  h += '<div style="flex:2"><label style="font-size:11px;font-weight:700;color:#48484A;display:block;margin-bottom:4px">\uD15C\uD50C\uB9BF\uBA85</label>';
  h += '<input type="text" value="' + t.name + '" onchange="_ltUpdateField(\'' + t.id + '\',\'name\',this.value)" style="width:100%;padding:9px 12px;border:1px solid #E5E5EA;border-radius:8px;font-size:14px;font-weight:700;outline:none;box-sizing:border-box" placeholder="\uC608: \uC815\uB2F5\u00B7\uD574\uC124 (\uB274\uB4DC\uB9BC\uC2A4)">';
  h += '</div>';
  h += '<div style="flex:1"><label style="font-size:11px;font-weight:700;color:#48484A;display:block;margin-bottom:4px">\uD15C\uD50C\uB9BF \uCF54\uB4DC</label>';
  h += '<select onchange="_ltUpdateField(\'' + t.id + '\',\'typeCode\',this.value)" style="width:100%;padding:9px 12px;border:1px solid #E5E5EA;border-radius:8px;font-size:13px;outline:none;background:#fff;font-family:monospace;box-sizing:border-box">';
  h += '<option value=""' + (!t.typeCode ? ' selected' : '') + '>\uC120\uD0DD</option>';
  Object.keys(CONTENT_TYPES).forEach(function(tc) {
    h += '<option value="' + tc + '"' + (t.typeCode === tc ? ' selected' : '') + '>' + tc + ' \u2014 ' + CONTENT_TYPES[tc].label + '</option>';
  });
  h += '</select></div></div>';

  h += '<div style="margin-bottom:14px"><label style="font-size:11px;font-weight:700;color:#48484A;display:block;margin-bottom:4px">\uC124\uBA85</label>';
  h += '<textarea onchange="_ltUpdateField(\'' + t.id + '\',\'desc\',this.value)" rows="2" style="width:100%;padding:9px 12px;border:1px solid #E5E5EA;border-radius:8px;font-size:13px;outline:none;resize:vertical;box-sizing:border-box">' + t.desc + '</textarea></div>';

  // 과목/학년/교육과정
  h += '<div style="display:flex;gap:12px;margin-bottom:14px">';
  h += '<div style="flex:1"><label style="font-size:11px;font-weight:700;color:#48484A;display:block;margin-bottom:4px">\uACFC\uBAA9</label>';
  h += '<select onchange="_ltUpdateField(\'' + t.id + '\',\'subject\',this.value)" style="width:100%;padding:9px 12px;border:1px solid #E5E5EA;border-radius:8px;font-size:13px;outline:none;background:#fff;box-sizing:border-box">';
  h += '<option value="">\uC120\uD0DD</option>';
  ['\uC218\uD559','\uC601\uC5B4','\uAD6D\uC5B4','\uD55C\uC790','\uACFC\uD559','\uC0AC\uD68C','\uC77C\uBCF8\uC5B4','\uD55C\uAD6D\uC0AC','\uB3C5\uC11C','\uC0AC\uACE0\uB825\uC218\uD559','\uCF54\uC5B4\uC218\uD559','\uC804\uACFC\uBAA9'].forEach(function(ss) {
    h += '<option value="' + ss + '"' + (t.subject === ss ? ' selected' : '') + '>' + ss + '</option>';
  });
  h += '</select></div>';
  h += '<div style="flex:1"><label style="font-size:11px;font-weight:700;color:#48484A;display:block;margin-bottom:4px">\uD559\uB144</label>';
  h += '<select onchange="_ltUpdateField(\'' + t.id + '\',\'grade\',this.value)" style="width:100%;padding:9px 12px;border:1px solid #E5E5EA;border-radius:8px;font-size:13px;outline:none;background:#fff;box-sizing:border-box">';
  h += '<option value="">\uC120\uD0DD</option>';
  ['\uC720\uC544','\uCD08\uB4F1 1~2','\uCD08\uB4F1 3~4','\uCD08\uB4F1 5~6','\uC911\uB4F1 1','\uC911\uB4F1 2','\uC911\uB4F1 3','\uACE0\uB4F1','\uC804\uD559\uB144'].forEach(function(g) {
    h += '<option value="' + g + '"' + (t.grade === g ? ' selected' : '') + '>' + g + '</option>';
  });
  h += '</select></div></div>';

  // 대표 색상
  h += '<div style="margin-bottom:14px"><label style="font-size:11px;font-weight:700;color:#48484A;display:block;margin-bottom:4px">\uB300\uD45C \uC0C9\uC0C1</label>';
  h += '<div style="display:flex;gap:6px;flex-wrap:wrap">';
  ['#0071E3','#AF52DE','#FF3B30','#34C759','#FF9500','#0891B2','#BE185D','#0071E3'].forEach(function(c) {
    h += '<div onclick="_ltUpdateField(\'' + t.id + '\',\'color\',\'' + c + '\')" style="width:28px;height:28px;border-radius:6px;background:' + c + ';cursor:pointer;border:2.5px solid ' + (t.color === c ? '#1D1D1F' : 'transparent') + '"></div>';
  });
  h += '</div></div>';

  h += '</div>';

  // ── 완성된 템플릿 요약 카드 ──
  h += '<div style="background:#fff;border-radius:12px;border:1px solid #34C759;padding:18px 20px;max-width:600px;margin-bottom:16px">';
  h += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">';
  h += '<svg viewBox="0 0 24 24" fill="none" stroke="#34C759" stroke-width="2" style="width:18px;height:18px"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';
  h += '<span style="font-size:14px;font-weight:600;color:#34C759">\uD15C\uD50C\uB9BF \uC694\uC57D</span>';
  h += '</div>';

  // Depth 구조 + 필드 매핑 시각화
  h += '<div style="margin-bottom:12px">';
  var depthColors = ['#0071E3','#AF52DE','#34C759','#FF9500','#FF3B30','#0891B2'];
  flatInfo.forEach(function(fi, idx) {
    var dc = depthColors[fi.level % depthColors.length];
    var isLast = idx === flatInfo.length - 1;
    h += '<div style="display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-bottom:' + (isLast ? 'none' : '1px solid #F5F5F7') + '">';
    h += '<div style="width:28px;height:28px;border-radius:6px;background:' + dc + '12;display:flex;align-items:center;justify-content:center;flex-shrink:0"><span style="font-size:11px;font-weight:600;color:' + dc + '">' + (fi.level + 1) + '</span></div>';
    h += '<div style="flex:1;min-width:0">';
    h += '<div style="font-size:12px;font-weight:700;color:#1D1D1F">' + fi.name;
    if(fi.subName) h += ' <span style="font-weight:400;color:#8E8E93">(' + fi.subName + ')</span>';
    h += '</div>';
    h += '<div style="font-size:10px;color:#636366;margin-top:2px">' + (fi.groupCount || 1) + '\uAC1C \uADF8\uB8F9</div>';
    if(fi.fields && fi.fields.length > 0) {
      h += '<div style="display:flex;flex-wrap:wrap;gap:3px;margin-top:4px">';
      fi.fields.forEach(function(fk) {
        var pf = LT_FIELD_POOL.find(function(p){ return p.key === fk; });
        h += '<span style="font-size:9px;padding:2px 7px;border-radius:4px;background:#F5F5F7;color:#48484A;font-weight:600;border:1px solid #E5E5EA">' + (pf ? pf.label : fk) + '</span>';
      });
      h += '</div>';
    }
    h += '</div></div>';
  });
  h += '</div>';

  // 총계
  var totalFields = 0;
  flatInfo.forEach(function(fi){ totalFields += (fi.fields ? fi.fields.length : 0); });
  h += '<div style="padding:8px 12px;background:#F0FFF4;border-radius:6px;border:1px solid #A8E6B8;font-size:11px;color:#1B8A3E;font-weight:600">';
  h += '\u2713 ' + depthCount + '\uB2E8\uACC4 \uAD6C\uC870 \u00B7 \uCD1D \uC785\uB825 \uD56D\uBAA9 ' + totalFields + '\uAC1C \u00B7 ';
  h += (t.name || '\uBBF8\uC785\uB825');
  h += '</div></div>';

  // 저장 / 복제
  h += '<div style="display:flex;gap:8px;max-width:600px">';
  h += '<button onclick="LT_STATE.editTab=\'step2\';renderLearningTypeView()" style="padding:10px 20px;border:1px solid #E5E5EA;border-radius:8px;background:#fff;color:#636366;font-size:13px;font-weight:600;cursor:pointer">\u2190 2\uB2E8\uACC4</button>';
  h += '<div style="flex:1"></div>';
  h += '<button onclick="_ltSaveAsNew(\'' + t.id + '\')" style="padding:10px 18px;border:1px solid #0071E3;border-radius:8px;background:#E8F2FF;color:#0055B8;font-size:12px;font-weight:500;cursor:pointer">\uBCF5\uC81C \uC800\uC7A5</button>';
  h += '<button onclick="toast(\'\uD15C\uD50C\uB9BF\uC774 \uC800\uC7A5\uB418\uC5C8\uC2B5\uB2C8\uB2E4\',\'t-ok\')" style="padding:10px 24px;border:none;border-radius:8px;background:#34C759;color:#fff;font-size:13px;font-weight:700;cursor:pointer">\u2713 \uC800\uC7A5</button>';
  h += '</div>';

  return h;
}

// ═══ _ltSaveAsNew (원본 라인 13928~13948) ═══
function _ltSaveAsNew(typeId) {
  var src = LT_STATE.types.find(function(t){ return t.id === typeId; });
  if(!src) return;
  var newName = prompt('새 유형 이름을 입력하세요:', src.name + ' (복사본)');
  if(!newName || !newName.trim()) return;
  var newId = 'LT' + String(LT_STATE.types.length + 1).padStart(3, '0') + '_' + Date.now();
  var clone = JSON.parse(JSON.stringify(src));
  clone.id = newId;
  clone.name = newName.trim();
  // 새 depth ID 부여 (충돌 방지)
  _ltRegenIds(clone.depths);
  // 새 attr key 부여
  clone.attrs.forEach(function(a) {
    a.key = a.key + '_' + Date.now() + Math.random().toString(36).substr(2, 4);
  });
  LT_STATE.types.push(clone);
  LT_STATE.editingId = newId;
  LT_STATE.editTab = 'info';
  renderLearningTypeView();
  toast('새 유형 "' + newName.trim() + '"이(가) 생성되었습니다', 't-ok');
}

// ═══ _ltRegenIds (원본 라인 13950~13956) ═══
function _ltRegenIds(nodes) {
  if(!nodes) return;
  nodes.forEach(function(n) {
    n.id = 'dn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    if(n.children) _ltRegenIds(n.children);
  });
}

// ═══ _ltFindNodeInTree (원본 라인 13959~13968) ═══
function _ltFindNodeInTree(nodes, nodeId) {
  for(var i = 0; i < nodes.length; i++) {
    if(nodes[i].id === nodeId) return {parent:nodes, index:i, node:nodes[i]};
    if(nodes[i].children) {
      var found = _ltFindNodeInTree(nodes[i].children, nodeId);
      if(found) return found;
    }
  }
  return null;
}

// ═══ _ltTreeRename (원본 라인 13970~13975) ═══
function _ltTreeRename(typeId, nodeId, value) {
  var t = LT_STATE.types.find(function(t){ return t.id === typeId; });
  if(!t) return;
  var found = _ltFindNodeInTree(t.depths, nodeId);
  if(found) { found.node.name = value; renderLearningTypeView(); }
}

// ═══ _ltTreeAddChild (원본 라인 13977~13986) ═══
function _ltTreeAddChild(typeId, nodeId) {
  var t = LT_STATE.types.find(function(t){ return t.id === typeId; });
  if(!t) return;
  var found = _ltFindNodeInTree(t.depths, nodeId);
  if(!found) return;
  if(!found.node.children) found.node.children = [];
  var newId = 'dn_' + Date.now();
  found.node.children.push({id:newId, name:'새 단계', children:[]});
  renderLearningTypeView();
}

// ═══ _ltTreeRemove (원본 라인 13988~13998) ═══
function _ltTreeRemove(typeId, nodeId) {
  var t = LT_STATE.types.find(function(t){ return t.id === typeId; });
  if(!t) return;
  var found = _ltFindNodeInTree(t.depths, nodeId);
  if(found && found.parent.length > 1) {
    found.parent.splice(found.index, 1);
    renderLearningTypeView();
  } else if(found && found.parent.length === 1) {
    toast('최소 1개의 루트 단계가 필요합니다','t-warn');
  }
}

// ═══ _ltTreeMove (원본 라인 14000~14011) ═══
function _ltTreeMove(typeId, nodeId, dir) {
  var t = LT_STATE.types.find(function(t){ return t.id === typeId; });
  if(!t) return;
  var found = _ltFindNodeInTree(t.depths, nodeId);
  if(!found) return;
  var arr = found.parent;
  var idx = found.index;
  var newIdx = idx + dir;
  if(newIdx < 0 || newIdx >= arr.length) return;
  var tmp = arr[idx]; arr[idx] = arr[newIdx]; arr[newIdx] = tmp;
  renderLearningTypeView();
}

// ═══ _ltAddNewType (원본 라인 14016~14032) ═══
function _ltAddNewType() {
  var newCode = 'NEW' + Date.now().toString(36).toUpperCase().slice(-3);
  var newId = 'LT-' + newCode + '-' + Date.now().toString(36);
  var rootDepthId = 'dn_' + Date.now();
  LT_STATE.types.push({
    id: newId, name: '\uC2E0\uADDC \uD15C\uD50C\uB9BF', typeCode: newCode,
    desc: '\uC11C\uBE44\uC2A4 \uC2DC\uC2A4\uD15C + \uCF58\uD150\uCE20 \uD15C\uD50C\uB9BF\uC744 \uC785\uB825\uD558\uC138\uC694', color:'#0071E3',
    subject:'', grade:'', curriculum:'',
    depths: [{id:rootDepthId, name:'\uB2E8\uACC4 1', subName:'', groupCount:1, fields:[], children:[]}],
    attrs: [],
  });
  LT_STATE.editingId = newId;
  LT_STATE._activeGroup = newCode;
  LT_STATE.editTab = 'step1';
  renderLearningTypeView();
  toast('\uC2E0\uADDC \uD15C\uD50C\uB9BF \uC720\uD615\uC774 \uC0DD\uC131\uB418\uC5C8\uC2B5\uB2C8\uB2E4','t-ok');
}

// ═══ _ltAddStructure (원본 라인 14035~14064) ═══
function _ltAddStructure(typeCode) {
  // 해당 typeCode의 기존 구조들 참조하여 기본값 추출
  var existing = LT_STATE.types.filter(function(t){ return t.typeCode === typeCode; });
  var baseType = existing.length > 0 ? existing[0] : null;
  var labelInfo = (typeof CONTENT_TYPES !== 'undefined' && CONTENT_TYPES[typeCode]) ? CONTENT_TYPES[typeCode].label : typeCode;

  var newId = 'LT-' + typeCode + '-' + Date.now().toString(36);
  var rootDepthId = 'dn_' + Date.now();

  // 기존 구조의 depth 골격을 복제 (필드는 비우고 구조만)
  var clonedDepths;
  if(baseType && baseType.depths && baseType.depths.length > 0) {
    clonedDepths = _ltCloneDepthSkeleton(baseType.depths);
  } else {
    clonedDepths = [{id: rootDepthId, name:'\uB2E8\uACC4 1', subName:'', groupCount:1, fields:[], children:[]}];
  }

  LT_STATE.types.push({
    id: newId, name: labelInfo + ' (\uC2E0\uADDC)', typeCode: typeCode,
    desc: labelInfo + ' \uC720\uD615\uC758 \uC0C8 \uAD6C\uC870', color: baseType ? (baseType.color || '#0071E3') : '#0071E3',
    subject:'', grade:'', curriculum:'',
    depths: clonedDepths,
    attrs: baseType ? JSON.parse(JSON.stringify(baseType.attrs || [])) : [],
  });
  LT_STATE.editingId = newId;
  LT_STATE._activeGroup = typeCode;
  LT_STATE.editTab = 'step1';
  renderLearningTypeView();
  toast('\uC0C8 \uAD6C\uC870\uAC00 \uCD94\uAC00\uB418\uC5C8\uC2B5\uB2C8\uB2E4','t-ok');
}

// ═══ _ltCloneDepthSkeleton (원본 라인 14067~14079) ═══
function _ltCloneDepthSkeleton(nodes) {
  return nodes.map(function(n) {
    var newNode = {
      id: 'dn_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,6),
      name: n.name,
      subName: n.subName || '',
      groupCount: n.groupCount || 1,
      fields: [],
      children: n.children ? _ltCloneDepthSkeleton(n.children) : []
    };
    return newNode;
  });
}

// ═══ _ltDeleteType (원본 라인 14082~14099) ═══
function _ltDeleteType(typeId) {
  // 사용 중 여부 확인
  var isInUse = false;
  Object.keys(REGISTERED_WORK_TYPES).forEach(function(k) {
    (REGISTERED_WORK_TYPES[k] || []).forEach(function(rt) {
      if(rt.ltTypeId === typeId) isInUse = true;
    });
  });
  if(isInUse) {
    toast('\uC0AC\uC6A9 \uC911\uC778 \uD15C\uD50C\uB9BF\uC740 \uC0AD\uC81C\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uBA3C\uC800 \uC791\uC5C5 \uC124\uC815\uC5D0\uC11C \uD574\uC81C\uD574 \uC8FC\uC138\uC694.','t-err');
    return;
  }
  if(!confirm('\uC774 \uAD6C\uC870\uB97C \uC0AD\uC81C\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?')) return;
  LT_STATE.types = LT_STATE.types.filter(function(t){ return t.id !== typeId; });
  if(LT_STATE.editingId === typeId) LT_STATE.editingId = null;
  renderLearningTypeView();
  toast('\uAD6C\uC870\uAC00 \uC0AD\uC81C\uB418\uC5C8\uC2B5\uB2C8\uB2E4','t-ok');
}

// ═══ _ltUpdateField (원본 라인 14101~14104) ═══
function _ltUpdateField(typeId, field, value) {
  var t = LT_STATE.types.find(function(t){ return t.id === typeId; });
  if(t) { t[field] = value; renderLearningTypeView(); }
}

// ═══ _ltToggleTargetSystem (원본 라인 14106~14117) ═══
function _ltToggleTargetSystem(typeId, sysKey) {
  var t = LT_STATE.types.find(function(t){ return t.id === typeId; });
  if(!t) return;
  if(!t.targetSystems) t.targetSystems = [];
  var idx = t.targetSystems.indexOf(sysKey);
  if(idx >= 0) {
    t.targetSystems.splice(idx, 1);
  } else {
    t.targetSystems.push(sysKey);
  }
  renderLearningTypeView();
}

// ═══ _ltAddAttr (원본 라인 14119~14126) ═══
function _ltAddAttr(typeId) {
  var t = LT_STATE.types.find(function(t){ return t.id === typeId; });
  if(!t) return;
  var key = 'field_' + Date.now();
  t.attrs.push({key:key, label:'새 속성', required:false, type:'text'});
  LT_STATE.editTab = 'attrs';
  renderLearningTypeView();
}

// ═══ _ltRemoveAttr (원본 라인 14232~14238) ═══
function _ltRemoveAttr(typeId, attrKey) {
  var t = LT_STATE.types.find(function(t){ return t.id === typeId; });
  if(t) {
    t.attrs = t.attrs.filter(function(a){ return a.key !== attrKey; });
    renderLearningTypeView();
  }
}

// ═══ findBundleForItem (원본 라인 9339~9345) ═══
function findBundleForItem(subjectCode, typeCode) {
  return CONTENT_BUNDLES.find(b =>
    b.status === 'active' &&
    b.typeCode === typeCode &&
    (b.masterSubject === subjectCode || b.linkedSubjects.includes(subjectCode))
  );
}

// ═══ bundleMoveAllNext (원본 라인 9399~9408) ═══
function bundleMoveAllNext(bundleId, currentPhase) {
  const items = STATE.workflowItems.filter(i => i.bundleId === bundleId && i.phase === currentPhase);
  if(items.length === 0) return;
  const idx = WF_PHASES.findIndex(p => p.id === currentPhase);
  if(idx >= WF_PHASES.length - 1) return;
  const nextPhase = WF_PHASES[idx + 1];
  items.forEach(i => { i.phase = nextPhase.id; });
  toast(`📦 묶음 일괄 이동: ${items.length}건 → ${nextPhase.label}`, 't-ok');
  renderWorkflowView();
}

// ═══ Bundle Hub (state + view + helpers) (원본 라인 9330~14625) ═══
const BUNDLE_HUB_STATE = {
  search: '',
  filterStatus: 'all',     // all | active | paused
  filterSyncMode: 'all',   // all | full | override
  expandedBundleId: null,
  editingSystemsId: null,   // 연계시스템 편집 중인 묶음 ID
};

// 특정 과목+유형이 속한 묶음 찾기
function findBundleForItem(subjectCode, typeCode) {
  return CONTENT_BUNDLES.find(b =>
    b.status === 'active' &&
    b.typeCode === typeCode &&
    (b.masterSubject === subjectCode || b.linkedSubjects.includes(subjectCode))
  );
}

// 묶음의 대표(Hub) 아이템인지 판별
function isBundleMaster(subjectCode, typeCode) {
  const b = findBundleForItem(subjectCode, typeCode);
  return b && b.masterSubject === subjectCode;
}

// 묶음의 연결(Spoke) 아이템인지 판별
function isBundleSpoke(subjectCode, typeCode) {
  const b = findBundleForItem(subjectCode, typeCode);
  return b && b.linkedSubjects.includes(subjectCode);
}

// 같은 묶음에 속한 모든 워크플로우 아이템 찾기
function findBundleSiblings(itemId) {
  const item = STATE.workflowItems.find(i => i.id === itemId);
  if(!item || !item.bundleId) return [];
  return STATE.workflowItems.filter(i => i.bundleId === item.bundleId && i.id !== itemId);
}

// 묶음의 Hub에서 등록 시 Spoke 아이템 자동 생성
function bundleAutoReplicate(masterItem) {
  const bundle = CONTENT_BUNDLES.find(b => b.id === masterItem.bundleId);
  if(!bundle) return;
  const newItems = [];
  bundle.linkedSubjects.forEach(spokeCode => {
    const spokeName = SUBJECT_TYPE_MAP[spokeCode]?.name || spokeCode;
    const existingSpoke = STATE.workflowItems.find(i =>
      i.bundleId === bundle.id && i.subjectCode === spokeCode && i.typeCode === masterItem.typeCode
      && i.course === masterItem.course && i.set === masterItem.set
    );
    if(existingSpoke) return; // 이미 존재하면 패스
    const newId = 'wf' + (Date.now() + Math.random()).toString(36).slice(0,8);
    newItems.push({
      ...masterItem,
      id: newId,
      subject: spokeName,
      subjectCode: spokeCode,
      title: masterItem.title.replace(bundle.masterSubjectName, spokeName),
      bundleId: bundle.id,
      bundleRole: 'spoke',
      bundleMasterItemId: masterItem.id,
      source: masterItem.source,
    });
  });
  STATE.workflowItems.push(...newItems);
  if(newItems.length > 0) {
    toast(`📦 묶음 자동 복제: ${newItems.length}건 생성 (${bundle.name})`, 't-ok');
  }
  return newItems;
}

// 묶음 일괄 단계 이동
function bundleMoveAllNext(bundleId, currentPhase) {
  const items = STATE.workflowItems.filter(i => i.bundleId === bundleId && i.phase === currentPhase);
  if(items.length === 0) return;
  const idx = WF_PHASES.findIndex(p => p.id === currentPhase);
  if(idx >= WF_PHASES.length - 1) return;
  const nextPhase = WF_PHASES[idx + 1];
  items.forEach(i => { i.phase = nextPhase.id; });
  toast(`📦 묶음 일괄 이동: ${items.length}건 → ${nextPhase.label}`, 't-ok');
  renderWorkflowView();
}

// 과목코드로 사용 가능한 유형 목록 조회 헬퍼
function getTypesForSubject(subjectCode) {
  const map = SUBJECT_TYPE_MAP[subjectCode];
  if(!map) return Object.keys(CONTENT_TYPES);
  return map.types;
}
function getTypeLabel(typeCode) {
  return CONTENT_TYPES[typeCode]?.label || typeCode;
}
function getTypeInfo(typeCode) {
  return CONTENT_TYPES[typeCode] || {code:typeCode, label:typeCode, group:'기타', icon:'📄', color:'#8E8E93', bg:'#F5F5F7'};
}

// ════════════════════════════════
//  ■ 콘텐츠 유형 분류 (칸반 카드에서도 사용)
// ════════════════════════════════
const DB_TYPES = ['ANS','AN2','AN3','EVA','EXP','STDG','CBT','CCV','CGL'];
const FILE_TYPES = ['VKS','VOT','VPV','VRV','VSO','FLC','ACT','QSTN','RDC','WEB'];

// ════════════════════════════════
//  ■ WORKFLOW KANBAN (표준 프로세스 6단계 칸반보드)
// ════════════════════════════════
// 표준 프로세스 4단계 (코드수신·묶음처리는 설정→운영마스터 전용)
const WF_PHASES = [
  {id:'assign',   label:'\uC791\uC5C5\uC790 \uBC30\uBD84',     icon:'\u25C9', color:'#0071E3', bg:'#E8F2FF', border:'#B3D7FF', desc:'\uB2F4\uB2F9 \uC791\uC5C5\uC790 \uBC30\uC815 \u00B7 \uC791\uC5C5 \uBC94\uC704 \uD655\uC778'},
  {id:'register', label:'\uCF58\uD150\uCE20 \uB4F1\uB85D',     icon:'\u270E', color:'#FF9500', bg:'#FFF8F0', border:'#FFD9A8', desc:'\uD30C\uC77C \uC5C5\uB85C\uB4DC \u00B7 \uBA54\uD0C0 \uB4F1\uB85D \u00B7 \uCEE4\uB9AC\uD058\uB7FC \uB9E4\uCE6D'},
  {id:'review',   label:'\uAC80\uC218 \u00B7 STG',     icon:'\u2714', color:'#AF52DE', bg:'#F9F0FF', border:'#D9B3F0', desc:'\uCF58\uD150\uCE20 \uAC80\uC218 \uBC0F STG \uBC30\uD3EC'},
  {id:'deploy',   label:'PRD \uBC30\uD3EC',       icon:'\u25B6', color:'#1B8A3E', bg:'#F0FFF4', border:'#A8E6B8', desc:'\uAC80\uC218 \uC644\uB8CC \uD6C4 PRD \uC11C\uBE44\uC2A4 \uBC30\uD3EC'},
];

const WF_PRIORITY_STYLE = {
  high:   {label:'긴급', color:'#FF3B30', bg:'#FFF2F1', border:'#FFB3AE'},
  normal: {label:'보통', color:'#8E8E93', bg:'#FAFAFA', border:'#E5E5EA'},
  low:    {label:'낮음', color:'#AEAEB2', bg:'#FAFAFA', border:'#E5E5EA'},
};

function _getWfCounts() {
  _syncWiToWorkflow();
  const items = STATE.workflowItems || [];
  const counts = {};
  WF_PHASES.forEach(p => counts[p.id] = items.filter(i => i.phase === p.id).length);
  counts.total = items.length;
  counts.unassign = items.filter(i => !i.assignee).length;
  return counts;
}

// 대시보드 파이프라인 스테퍼 빌더
function _buildWfPipelineStages() {
  const counts = _getWfCounts();
  return WF_PHASES.map((p, i) => {
    const cnt = counts[p.id] || 0;
    return `
    <div style="flex:1;background:${p.bg};border:1px solid ${p.border};border-radius:10px;padding:12px 14px;cursor:pointer;transition:all .15s;position:relative${STATE.wfActiveStep===p.id?';box-shadow:0 0 0 3px '+p.color+'33':''}"
         onclick="switchView('workflow');STATE.wfActiveStep='${p.id}';renderWorkflowView()"
         onmouseenter="this.style.transform='translateY(-2px)';this.style.boxShadow='0 4px 12px ${p.color}22'"
         onmouseleave="this.style.transform='';this.style.boxShadow='${STATE.wfActiveStep===p.id?'0 0 0 3px '+p.color+'33':''}'">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
        <span style="width:22px;height:22px;border-radius:50%;background:${p.color};display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;color:#fff">${i+1}</span>
        <span style="font-size:11px;font-weight:700;color:${p.color}">${p.label}</span>
      </div>
      <div style="font-size:24px;font-weight:900;color:${p.color};line-height:1">${cnt}</div>
      <div style="font-size:10px;color:${p.color};opacity:.7;margin-top:2px">건 대기</div>
    </div>
    ${i < WF_PHASES.length-1 ? '<div style="font-size:20px;color:var(--c-gray-300);flex-shrink:0;display:flex;align-items:center">›</div>' : ''}`;
  }).join('');
}

// ── 워크플로우 뷰 모드 & 필터 상태 ──
let WF_VIEW_MODE = 'kanban'; // 'kanban' | 'list'
const WF_FILTER = { assignee: 'all', subject: 'all', priority: 'all', typeCode: 'all', bundle: 'all' };

function setWfViewMode(mode) {
  WF_VIEW_MODE = mode;
  // 탭 스타일 업데이트
  const kTab = document.getElementById('wfTabKanban');
  const lTab = document.getElementById('wfTabList');
  if(kTab) { kTab.style.background = mode==='kanban'?'#fff':'transparent'; kTab.style.color = mode==='kanban'?'var(--c-primary)':'var(--c-gray-400)'; }
  if(lTab) { lTab.style.background = mode==='list'?'#fff':'transparent'; lTab.style.color = mode==='list'?'var(--c-primary)':'var(--c-gray-400)'; }
  renderWorkflowView();
}

function _getWfAssignees() {
  const items = STATE.workflowItems || [];
  const set = new Set(items.filter(i=>i.assignee).map(i=>i.assignee));
  return [...set].sort();
}
function _getWfSubjects() {
  const items = STATE.workflowItems || [];
  const map = new Map();
  items.forEach(i => { if(i.subjectCode && !map.has(i.subjectCode)) map.set(i.subjectCode, i.subject); });
  return [...map.entries()].sort((a,b) => a[1].localeCompare(b[1])); // [[code,name],...]
}
// v7: \ucee4\ub9ac\ud058\ub7fc \uc911\uc2ec \ud544\ud130\uc6a9 \uace0\uc720 \ucee4\ub9ac\ud058\ub7fc \ubaa9\ub85d \ucd94\ucd9c
// item.curriculumId \u2192 CURRICULUM_DATA, \uc5c6\uc73c\uba74 _crResolveFormSpec\uc73c\ub85c \uc720\ucd94
function _getWfCurriculums() {
  var items = STATE.workflowItems || [];
  var map = new Map();
  items.forEach(function(i){
    var cur = null;
    if(i.curriculumId) {
      cur = (typeof CURRICULUM_DATA !== 'undefined' ? CURRICULUM_DATA : []).find(function(c){ return c.id === i.curriculumId; });
    }
    if(!cur && typeof _crResolveFormSpec === 'function') {
      var spec = _crResolveFormSpec(i);
      if(spec && spec.curriculum) cur = spec.curriculum;
    }
    if(cur && !map.has(cur.id)) map.set(cur.id, cur.name || cur.id);
  });
  return Array.from(map.entries()).sort(function(a,b){ return (a[1]||'').localeCompare(b[1]||''); });
}
function _getWfTypes() {
  var items = STATE.workflowItems || [];
  var set = new Set();
  items.forEach(function(i) {
    if(i.typeCode) set.add(i.typeCode);
  });
  return Array.from(set).sort();
}
function setWfFilter(key, val) {
  WF_FILTER[key] = val;
  renderWorkflowView();
}

function _filterWfItems(items) {
  return items.filter(i => {
    if(WF_FILTER.assignee !== 'all') {
      if(WF_FILTER.assignee === 'unassigned' && i.assignee) return false;
      if(WF_FILTER.assignee !== 'unassigned' && i.assignee !== WF_FILTER.assignee) return false;
    }
    if(WF_FILTER.subject !== 'all' && i.subjectCode !== WF_FILTER.subject) return false;
    if(WF_FILTER.priority !== 'all' && i.priority !== WF_FILTER.priority) return false;
    if(WF_FILTER.typeCode !== 'all') {
      if(i.typeCode !== WF_FILTER.typeCode) return false;
    }
    if(WF_FILTER.bundle !== 'all') {
      if(WF_FILTER.bundle === 'bundled' && !i.bundleId) return false;
      if(WF_FILTER.bundle === 'unbundled' && i.bundleId) return false;
      if(WF_FILTER.bundle !== 'bundled' && WF_FILTER.bundle !== 'unbundled' && i.bundleId !== WF_FILTER.bundle) return false;
    }
    return true;
  });
}

// ── 데이터 흐름 브릿지: WORK_ITEMS_V7 → STATE.workflowItems ──
function _syncWiToWorkflow() {
  var result = [];
  (WORK_ITEMS_V7 || []).forEach(function(wi) {
    var fm = FORM_TEMPLATES.find(function(f){ return f.id === wi.formId; });
    var targetSys = 'ND';
    if(fm && fm.targetSystems && fm.targetSystems.length > 0) {
      targetSys = fm.targetSystems[0] === 'ALL' ? 'ND' : fm.targetSystems[0];
    }
    result.push({
      id: wi.id,
      templateName: wi.formName || '',
      typeCode: wi.depthType || '',
      target: targetSys,
      ltTypeId: '',
      curriculumId: wi.curriculumId || null,
      subject: wi.boundLabel || '',
      subjectCode: wi.boundCode || '',
      course: wi.currName || '',
      phase: wi.phase || 'register',
      assignee: wi.assignee || null,
      priority: wi.priority || 'normal',
      createdAt: '2026-04-01',
      source: 'manual',
      setProgress: _wiGenSetProgress(wi),
      doneCount: wi.doneSets || 0,
      totalCount: wi.totalSets || 0,
      formId: wi.formId,
      rangeFrom: wi.rangeFrom,
      rangeTo: wi.rangeTo
    });
  });
  STATE.workflowItems = result;
}

function _wiGenSetProgress(wi) {
  var arr = [];
  var from = wi.rangeFrom || 1;
  var to = wi.rangeTo || 0;
  var done = wi.doneSets || 0;
  var total = wi.totalSets || 0;
  var setsToShow = Math.min(total, 10);
  for(var s = 0; s < setsToShow; s++) {
    var setNum = from + Math.floor(s * (to - from + 1) / setsToShow);
    var st = s < done ? 'done' : (s === done && done < total ? 'inprog' : 'idle');
    arr.push({set: setNum + '\uC138\uD2B8', status: st});
  }
  return arr;
}

function renderWorkflowView() {
  _syncWiToWorkflow();
  const root = document.getElementById('wfKanbanWrap');
  if(!root) return;

  const allItems = STATE.workflowItems || [];
  const filtered = _filterWfItems(allItems);

  // Update header counts
  var _wfCurSet = new Set();
  allItems.forEach(function(i){ if(i.curriculumId) _wfCurSet.add(i.curriculumId); else _wfCurSet.add('_' + (i.subjectCode||'') + '_' + (i.course||'')); });
  var curCountEl = document.getElementById('wfCurCount');
  const totalEl = document.getElementById('wfTotalCount');
  const unassEl = document.getElementById('wfUnassignCount');
  if(curCountEl) curCountEl.textContent = _wfCurSet.size;
  if(totalEl) totalEl.textContent = allItems.length;
  if(unassEl) unassEl.textContent = allItems.filter(i=>!i.assignee).length;

  // Render kanban or list
  if(WF_VIEW_MODE === 'list') {
    root.innerHTML = _wfRenderList(filtered, allItems);
  } else {
    root.innerHTML = _wfRenderKanban(filtered);
  }
  return;
}

// ════════════════════════════════
//  ■ 콘텐츠 작업 설정 (WORK CONFIG VIEW)
// ════════════════════════════════
const WC_STATE = {
  searchQuery: '',
  filterStatus: 'all',
  selectedCode: null,
  expandedTemplate: null,
  selectedCurId: null,    // 커리큘럼 찾기 → 선택된 커리큘럼
  findOpen: false,        // 찾기 드롭다운 열림
  filterSubject: 'all',   // 과목 필터
  filterSystem: 'all',    // 시스템 필터
  filterWork: 'all',      // 작업상태 필터 (all/active/none)
};

// 과목코드별 과정 데이터
const SUBJECT_COURSE_DATA = {
  M:{courseName:'수학',courses:8,sets:80}, E:{courseName:'영어',courses:6,sets:60},
  K:{courseName:'국어',courses:5,sets:50}, H:{courseName:'한자',courses:4,sets:40},
  SO:{courseName:'과학',courses:4,sets:40}, LN:{courseName:'한글똑똑',courses:3,sets:36},
  AN:{courseName:'영어똑똑',courses:3,sets:36}, DN:{courseName:'수학똑똑',courses:3,sets:30},
  NJ:{courseName:'일본어',courses:2,sets:24}, NSO:{courseName:'사회',courses:4,sets:40},
  QR:{courseName:'눈높이창의독서프리미엄',courses:2,sets:24}, PMA:{courseName:'스쿨수학',courses:3,sets:30},
  BN:{courseName:'놀이똑똑',courses:2,sets:24}, CK:{courseName:'눈높이영역국어',courses:2,sets:20},
  HN:{courseName:'한자똑똑',courses:4,sets:40}, NSH:{courseName:'중등사회역사',courses:3,sets:30},
  IL:{courseName:'아이리스닝',courses:2,sets:24}, IG:{courseName:'아이그래머',courses:2,sets:20},
  HK:{courseName:'눈높이한국사',courses:3,sets:30}, EKA:{courseName:'스쿨국어A',courses:2,sets:20},
  PDM1:{courseName:'써밋스코어수학 초등1',courses:2,sets:20}, DM1:{courseName:'써밋스코어수학 중등1',courses:2,sets:20},
  AM:{courseName:'써밋스피드수학',courses:3,sets:30}, DAM:{courseName:'써밋스피드중등수학',courses:2,sets:24},
  MZ:{courseName:'코어 수학',courses:4,sets:40}, QPA:{courseName:'사고력수학플러스A',courses:2,sets:24},
  RED2:{courseName:'눈높이리더스영어2',courses:2,sets:20}, BA2:{courseName:'눈높이리클원2',courses:2,sets:24},
  AQ:{courseName:'눈높이사고력코딩1(병행)',courses:2,sets:20},
};

// \uB4F1\uB85D\uB41C \uCF58\uD150\uCE20 \uD15C\uD50C\uB9BF \u2014 \uD0C0\uAE43 \uC2DC\uC2A4\uD15C \uAE30\uBC18 \uD30C\uC2A4\uD154 \uCEEC\uB7EC \uC801\uC6A9
// target: ND=\uB274\uB4DC\uB9BC\uC2A4, NH=\uB208\uB192\uC774, SJ=\uC131\uC7A5\uD310, NH365=\uB208\uB192\uC774365
const WC_SYSTEM_COLORS = {
  ND:    {bg:'#E8F2FF', color:'#0055B8', border:'#B3D7FF', label:'뉴드림스'},
  NH:    {bg:'#F9F0FF', color:'#8944AB', border:'#D9B3F0', label:'학습관'},
  SJ:    {bg:'#F0FFF4', color:'#1B8A3E', border:'#A8E6B8', label:'성장판'},
  NH365: {bg:'#FFF8F0', color:'#B35C00', border:'#FFD9A8', label:'눈높이365'},
};

// ══════ 중앙 라벨 헬퍼 (모든 뷰에서 통일 사용) ══════
// rt (REGISTERED_WORK_TYPES 항목) → 표시 라벨
function _getTypeLabel(typeCode) {
  return (CONTENT_TYPES[typeCode] ? CONTENT_TYPES[typeCode].label : typeCode) || typeCode;
}
// rt → 구조명 (LT_STATE.types에서 조회)
function _getStructureName(ltTypeId) {
  if(!ltTypeId) return '';
  var lt = LT_STATE.types.find(function(t){ return t.id === ltTypeId; });
  if(!lt) return '';
  return lt.structureName || lt.subject || '';
}
// rt → 풀 라벨 (유형 라벨 + 구조명)
function _getRtDisplayLabel(rt) {
  var label = _getTypeLabel(rt.typeCode);
  var sn = _getStructureName(rt.ltTypeId);
  return sn ? label + ' \u00B7 ' + sn : label;
}
// item (WF_ITEM) → 풀 라벨
function _getWfDisplayLabel(item) {
  var label = _getTypeLabel(item.typeCode);
  var sn = _getStructureName(item.ltTypeId);
  return sn ? label + ' \u00B7 ' + sn : label;
}
// item (WF_ITEM) → target 시스템 라벨
function _getTargetLabel(target) {
  var sys = WC_SYSTEM_COLORS[target || 'ND'] || WC_SYSTEM_COLORS.ND;
  return sys.label;
}

function _wcDetectSystem(name) {
  if(name.indexOf('눈높이365') >= 0 || name.indexOf('눈높이 365') >= 0) return 'NH365';
  if(name.indexOf('눈높이') >= 0 || name.indexOf('학습관') >= 0) return 'NH';
  if(name.indexOf('성장판') >= 0) return 'SJ';
  return 'ND';
}

var REGISTERED_WORK_TYPES = {
  // \u2500\u2500 \uC218\uD559(M) \u2500\u2500
  M: [
    {name:'\uC815\uB2F5\u00B7\uD574\uC124 (\uB274\uB4DC\uB9BC\uC2A4)', typeCode:'ANS', target:'ND', ltTypeId:'LT-ANS-ND', formId:'FORM-ANS-A', assignee:'\uD64D\uAE38\uB3D9', splitDepth:2, setRanges:[{from:1,to:20,assignee:'\uD64D\uAE38\uB3D9'},{from:21,to:40,assignee:'\uAE40\uCCA0\uC218'},{from:41,to:60,assignee:'\uBC15\uC601\uD76C'},{from:61,to:80,assignee:'\uC774\uC9C0\uC740'}]},
    {name:'\uC815\uB2F5\u00B7\uD574\uC124 (\uD559\uC2B5\uAD00)', typeCode:'ANS', target:'NH', ltTypeId:'LT-ANS-NH', formId:'FORM-ANS-B', assignee:'\uD64D\uAE38\uB3D9', currSrc:'remix', splitDepth:2, setRanges:[{from:1,to:40,assignee:'\uD64D\uAE38\uB3D9'},{from:41,to:80,assignee:'\uD64D\uAE38\uB3D9'}]},
    {name:'\uC790\uB3D9\uCC44\uC810 (\uC131\uC7A5\uD310)', typeCode:'AN2', target:'SJ', ltTypeId:'LT-AN2-SJ', assignee:'\uAE40\uCCA0\uC218'},
    {name:'\uD575\uC2EC\uC810\uAC80 (\uB274\uB4DC\uB9BC\uC2A4)', typeCode:'CBT', target:'ND', ltTypeId:'LT-CBT-ND', assignee:'\uAE40\uCCA0\uC218'},
    {name:'\uB208\uB192\uC774 \uB0B4\uC2E0\uC644\uACF5 \uC601\uC0C1\uAC15\uC758', typeCode:'STDG', target:'NH', ltTypeId:'LT-STDG-NH', formId:'FORM-STDG-NH', assignee:'\uD64D\uAE38\uB3D9', currSrc:'remix',
      customCurriculum:{
        label:'\uCD9C\uD310\uC0AC\uBCC4 \uAC15\uC88C \uCEE4\uB9AC\uD058\uB7FC',
        unitName:'\uAC15',
        groups:[
          {name:'\uCC9C\uC7AC \uC9111-1', units:['OT','1\uAC15','2\uAC15','3\uAC15','4\uAC15','5\uAC15','6\uAC15','7\uAC15','8\uAC15','9\uAC15','10\uAC15'], assignee:'\uD64D\uAE38\uB3D9'},
          {name:'\uBBF8\uB798\uC5D4 \uC9111-1', units:['OT','1\uAC15','2\uAC15','3\uAC15','4\uAC15','5\uAC15','6\uAC15','7\uAC15','8\uAC15'], assignee:'\uC774\uC601\uD76C'},
          {name:'\uBE44\uC0C1 \uC9111-1', units:['OT','1\uAC15','2\uAC15','3\uAC15','4\uAC15','5\uAC15','6\uAC15','7\uAC15'], assignee:'\uAE40\uCCA0\uC218'},
        ]
      }
    },
  ],
  // \u2500\u2500 \uC601\uC5B4(E) \u2500\u2500
  E: [
    {name:'\uC790\uB3D9\uCC44\uC810 (\uB274\uB4DC\uB9BC\uC2A4)', typeCode:'AN2', target:'ND', ltTypeId:'LT-AN2-ND', assignee:'\uBC15\uC601\uD76C', splitDepth:2, setRanges:[{from:1,to:30,assignee:'\uBC15\uC601\uD76C'},{from:31,to:60,assignee:'\uAE40\uCCA0\uC218'}]},
    {name:'\uD50C\uB798\uC2DC\uCE74\uB4DC (\uB274\uB4DC\uB9BC\uC2A4)', typeCode:'FLC', target:'ND', ltTypeId:'LT-FLC-ND', assignee:'홍길동'},
    {name:'\uC6F9 \uD559\uC2B5\uCF58\uD150\uCE20 (\uB274\uB4DC\uB9BC\uC2A4)', typeCode:'WEB', target:'ND', ltTypeId:'LT-WEB-ND', assignee:'이지은'},
  ],
  // \u2500\u2500 \uAD6D\uC5B4(K) \u2500\u2500
  K: [
    {name:'\uC815\uB2F5\u00B7\uD574\uC124 (\uB274\uB4DC\uB9BC\uC2A4)', typeCode:'ANS', target:'ND', ltTypeId:'LT-ANS-ND', assignee:'홍길동'},
    {name:'\uD559\uC2B5\uC548\uB0B4\u00B7\uD480\uC774 (\uD559\uC2B5\uAD00)', typeCode:'STDG', target:'NH', ltTypeId:'LT-STDG-NH', assignee:null, currSrc:'create'},
  ],
  // \u2500\u2500 \uD55C\uC790(H) \u2500\u2500
  H: [
    {name:'\uC790\uB3D9\uCC44\uC810 (\uB274\uB4DC\uB9BC\uC2A4)', typeCode:'AN2', target:'ND', ltTypeId:'LT-AN2-ND', assignee:'박영희'},
    {name:'\uD50C\uB798\uC2DC\uCE74\uB4DC (\uB274\uB4DC\uB9BC\uC2A4)', typeCode:'FLC', target:'ND', ltTypeId:'LT-FLC-ND', assignee:'홍길동'},
    {name:'\uD559\uC2B5\uC548\uB0B4\u00B7\uD480\uC774 (\uD559\uC2B5\uAD00)', typeCode:'STDG', target:'NH', ltTypeId:'LT-STDG-NH', assignee:null},
  ],
  // \u2500\u2500 \uD55C\uAE00\uB618\uB618(\uLN) \u2500\u2500
  LN: [
    {name:'\uC815\uB2F5\u00B7\uD574\uC124 (\uB274\uB4DC\uB9BC\uC2A4)', typeCode:'ANS', target:'ND', ltTypeId:'LT-ANS-ND', assignee:'홍길동'},
    {name:'\uB3D9\uC694 \uCF58\uD150\uCE20 (\uB274\uB4DC\uB9BC\uC2A4)', typeCode:'VKS', target:'ND', ltTypeId:'LT-VKS-ND', assignee:'이지은'},
    {name:'\uC6F9 \uD559\uC2B5\uCF58\uD150\uCE20 (\uB274\uB4DC\uB9BC\uC2A4)', typeCode:'WEB', target:'ND', ltTypeId:'LT-WEB-ND', assignee:'이지은'},
  ],
  // \u2500\u2500 \uCF54\uC5B4\uC218\uD559(MZ) \u2500\u2500
  MZ: [
    {name:'\uC790\uB3D9\uCC44\uC810 (\uB274\uB4DC\uB9BC\uC2A4)', typeCode:'AN2', target:'ND', ltTypeId:'LT-AN2-ND', assignee:'박영희'},
    {name:'\uD575\uC2EC\uC810\uAC80 (\uC131\uC7A5\uD310)', typeCode:'CBT', target:'SJ', ltTypeId:'LT-CBT-SJ', assignee:'김철수'},
    {name:'\uD559\uC2B5\uC548\uB0B4\u00B7\uD480\uC774 (\uD559\uC2B5\uAD00)', typeCode:'STDG', target:'NH', ltTypeId:'LT-STDG-NH', assignee:null},
  ],
  // \u2500\u2500 \uD55C\uC790\uB618\uB618(HN) \u2500\u2500
  HN: [
    {name:'\uD50C\uB798\uC2DC\uCE74\uB4DC (\uB274\uB4DC\uB9BC\uC2A4)', typeCode:'FLC', target:'ND', ltTypeId:'LT-FLC-ND', assignee:'홍길동'},
    {name:'\uB3D9\uC694 \uCF58\uD150\uCE20 (\uB274\uB4DC\uB9BC\uC2A4)', typeCode:'VKS', target:'ND', ltTypeId:'LT-VKS-ND', assignee:'이지은'},
  ],
};

// ── 속성 필드 정의 (필수/선택 구분) ──
// required: 시스템 관리자가 지정하는 필수 속성
// optional: 운영자가 선택적으로 설정 가능한 속성
var WC_ATTR_SCHEMA = {
  required: [
    {key:'curriculumSource', label:'\uCEE4\uB9AC\uD058\uB7FC \uC18C\uC2A4', type:'select', options:['\uC6D0\uBCF8 \uD65C\uC6A9 (\uC678\uBD80 \uAD6C\uC870 \uADF8\uB300\uB85C)','\uC7AC\uAD6C\uC131 (\uACFC\uBAA9\uCF54\uB4DC \uCC38\uC870, \uCEE4\uB9AC\uD058\uB7FC \uC790\uCCB4 \uD3B8\uC9D1)','\uC790\uCCB4 \uC0DD\uC131 (\uB3C5\uB9BD \uCF58\uD150\uCE20)'], desc:'\uC678\uBD80 \uCEE4\uB9AC\uD058\uB7FC\uC744 \uADF8\uB300\uB85C \uC4F8\uC9C0, \uCC38\uC870\uB9CC \uD558\uACE0 \uC7AC\uAD6C\uC131\uD560\uC9C0, \uC644\uC804\uD788 \uC0C8\uB85C \uB9CC\uB4E4\uC9C0 \uACB0\uC815'},
    {key:'contentSource', label:'\uCF58\uD150\uCE20 \uC785\uB825 \uBC29\uC2DD', type:'select', options:['\uACFC\uBAA9 > \uACFC\uC815 > \uC138\uD2B8 \uAD6C\uC870','\uCF58\uD150\uCE20 \uD15C\uD50C\uB9BF \uC9C1\uC811 \uB4F1\uB85D'], desc:'\uCF58\uD150\uCE20 \uB370\uC774\uD130\uB97C \uC5B4\uB5A4 \uACBD\uB85C\uB85C \uB4F1\uB85D\uD560\uC9C0 \uACB0\uC815\uD569\uB2C8\uB2E4'},
    {key:'distTarget', label:'\uBC30\uD3EC \uB300\uC0C1', type:'select', options:['\uB0B4\uBD80 \uC11C\uBE44\uC2A4 (\uB274\uB4DC\uB9BC\uC2A4/\uD559\uC2B5\uAD00/\uC131\uC7A5\uD310)','\uC678\uBD80 \uC81C\uACF5 (\uD310\uB9E4/\uC81C\uD734)','\uB0B4\uBD80+\uC678\uBD80 \uBCD1\uD589'], desc:'\uB9CC\uB4E0 \uCF58\uD150\uCE20\uB97C \uC5B4\uB514\uB85C \uBC30\uD3EC\uD560\uC9C0 \uACB0\uC815'},
    {key:'detailTypes', label:'세부 구분 목록', type:'tags', desc:'콘텐츠 등록 시 선택 가능한 세부 구분 (쉼표로 구분)'},
    {key:'dayRange', label:'학습일 범위', type:'text', placeholder:'예: 1~30', desc:'등록 가능한 학습일 번호 범위'},
    {key:'fileAccept', label:'허용 파일 형식', type:'text', placeholder:'예: .xlsx,.csv,.pdf', desc:'업로드 가능한 파일 확장자'},
    {key:'requiredFields', label:'필수 입력 항목', type:'chips', options:['파일','정답','비고','유형 구분','학습일 번호','순번'], desc:'콘텐츠 등록 시 반드시 입력해야 하는 항목'},
  ],
  optional: [
    {key:'seqStart', label:'시작 순번', type:'number', placeholder:'1', desc:'자동 순번 부여 시 시작 번호'},
    {key:'autoFields', label:'자동 생성 항목', type:'chips', options:['유형 구분','학습일 번호','순번','파일','정답','비고'], desc:'시스템이 자동으로 값을 채워주는 항목'},
    {key:'namingRule', label:'파일 이름 규칙', type:'text', placeholder:'예: {과목코드}_{학습일}_{순번}.xlsx', desc:'파일명 자동 생성 패턴'},
    {key:'maxFileSize', label:'최대 파일 크기 (MB)', type:'number', placeholder:'50', desc:'업로드 파일 크기 제한'},
    {key:'customMemo', label:'운영 메모', type:'textarea', placeholder:'운영 참고사항을 입력하세요', desc:'내부 운영 참고용 메모'},
  ],
};

// 시스템 관리자 필수값 잠금 상태 (true=관리자가 설정 완료, 편집 불가)
var WC_ADMIN_LOCKS = {};

function _wcGetDefaultAttrs(typeCode) {
  return {
    curriculumSource: '\uC6D0\uBCF8 \uD65C\uC6A9 (\uC678\uBD80 \uAD6C\uC870 \uADF8\uB300\uB85C)',
    contentSource: '\uACFC\uBAA9 > \uACFC\uC815 > \uC138\uD2B8 \uAD6C\uC870',
    distTarget: '\uB0B4\uBD80 \uC11C\uBE44\uC2A4 (\uB274\uB4DC\uB9BC\uC2A4/\uD559\uC2B5\uAD00/\uC131\uC7A5\uD310)',
    detailTypes: ['\uC77C\uBC18','\uD2B9\uBCC4'],
    dayRange: '1~30',
    fileAccept: typeCode === 'FLC' ? '.swf,.html' : typeCode === 'WEB' ? '.html,.zip' : '.xlsx,.csv',
    requiredFields: typeCode.startsWith('AN') ? ['정답','파일'] : ['파일'],
    seqStart: 1,
    autoFields: ['유형 구분','학습일 번호','순번'],
    namingRule: '',
    maxFileSize: 50,
    customMemo: '',
  };
}

// \u2500\u2500 \uD15C\uD50C\uB9BF \uC18D\uC131 \uC124\uC815 \uD31D\uC5C5 \u2500\u2500
function openWorkTypeAttrPopup(code, rtIdx) {
  var regTypes = REGISTERED_WORK_TYPES[code] || [];
  var rt = regTypes[rtIdx];
  if(!rt) return;
  var sys = WC_SYSTEM_COLORS[rt.target || 'ND'] || WC_SYSTEM_COLORS.ND;
  var typeInfo = CONTENT_TYPES[rt.typeCode] || {code:rt.typeCode, label:rt.typeCode};

  // 속성 lazy init
  if(!rt.attrs) rt.attrs = _wcGetDefaultAttrs(rt.typeCode);
  var a = rt.attrs;
  var lockKey = code + '_' + rtIdx;
  var locks = WC_ADMIN_LOCKS[lockKey] || {};

  var overlay = document.createElement('div');
  overlay.id = 'wcAttrOverlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(15,23,42,.45);z-index:9999;display:flex;align-items:center;justify-content:center;animation:fadeIn .15s ease';
  overlay.onclick = function(e) { if(e.target === overlay) overlay.remove(); };

  var p = '';
  p += '<div style="background:#fff;border-radius:14px;width:620px;max-height:88vh;overflow:hidden;box-shadow:0 25px 50px rgba(0,0,0,.18);display:flex;flex-direction:column" onclick="event.stopPropagation()">';

  // ── 팝업 헤더 ──
  p += '<div style="padding:20px 24px 16px;border-bottom:1px solid #F5F5F7;flex-shrink:0">';
  p += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">';
  p += '<span style="font-size:11px;padding:3px 10px;border-radius:5px;background:' + sys.bg + ';color:' + sys.color + ';font-weight:700;border:1px solid ' + sys.border + '">' + sys.label + '</span>';
  p += '<span style="font-size:11px;padding:3px 8px;border-radius:5px;background:#F5F5F7;color:#48484A;font-weight:600">' + typeInfo.code + '</span>';
  p += '<span style="font-size:10px;color:#8E8E93;margin-left:auto">과목코드: ' + code + '</span>';
  p += '</div>';
  var _popCtLabel = _getTypeLabel(rt.typeCode);
  var _popStructName = _getStructureName(rt.ltTypeId);
  p += '<div style="font-size:17px;font-weight:600;color:#1D1D1F">' + _popCtLabel + (_popStructName ? ' <span style="font-size:13px;font-weight:500;color:#636366">\u00B7 ' + _popStructName + '</span>' : '') + '</div>';
  // 담당자 표시/변경
  p += '<div style="display:flex;align-items:center;gap:8px;margin-top:8px">';
  p += '<span style="font-size:11px;font-weight:600;color:#636366">담당자:</span>';
  if(rt.assignee) {
    var aInit = rt.assignee.charAt(0);
    p += '<span style="display:inline-flex;align-items:center;gap:5px;padding:3px 10px 3px 4px;background:#E8F2FF;border:1px solid #B3D7FF;border-radius:14px">';
    p += '<span style="width:20px;height:20px;border-radius:50%;background:#0071E3;color:#fff;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center">' + aInit + '</span>';
    p += '<span style="font-size:12px;font-weight:600;color:#0055B8">' + rt.assignee + '</span>';
    p += '</span>';
  } else {
    p += '<span style="font-size:11px;color:#FF9500;font-weight:600">미지정</span>';
  }
  p += '<button onclick="_wcAssignWorker(\'' + code + '\',' + rtIdx + ')" style="margin-left:4px;font-size:10px;padding:3px 8px;border:1px solid #E5E5EA;border-radius:5px;background:#fff;color:#6366F1;cursor:pointer;font-weight:600">변경</button>';
  p += '</div>';
  // 연결된 콘텐츠 템플릿 상세 표시
  var linkedLT = rt.ltTypeId ? LT_STATE.types.find(function(t){ return t.id === rt.ltTypeId; }) : null;
  if(linkedLT) {
    p += '<div style="margin-top:8px;padding:10px 12px;background:#F0F9FF;border-radius:8px;border:1px solid #BAE6FD">';
    // 유형 헤더
    p += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">';
    p += '<div style="width:6px;height:6px;border-radius:50%;background:' + (linkedLT.color || '#0071E3') + '"></div>';
    var _ltCtLabel = CONTENT_TYPES[linkedLT.typeCode] ? CONTENT_TYPES[linkedLT.typeCode].label : linkedLT.name;
    var _ltSN = linkedLT.structureName || linkedLT.subject || '';
    p += '<span style="font-size:11px;font-weight:700;color:#0369A1">\uCF58\uD150\uCE20 \uD15C\uD50C\uB9BF: ' + _ltCtLabel + (_ltSN ? ' \u00B7 ' + _ltSN : '') + '</span>';
    if(linkedLT.typeCode) p += '<span style="font-size:9px;padding:1px 5px;border-radius:3px;background:#E8F2FF;color:#0055B8;font-weight:600">' + linkedLT.typeCode + '</span>';
    p += '</div>';
    // Depth 구조
    p += '<div style="display:flex;gap:4px;align-items:center;margin-bottom:4px">';
    p += '<span style="font-size:9px;font-weight:600;color:#636366">단계 구조:</span>';
    var depthNames = _ltGetDepthNames(linkedLT.depths);
    depthNames.forEach(function(dn, i) {
      if(i > 0) p += '<span style="font-size:9px;color:#8E8E93">→</span>';
      p += '<span style="font-size:9px;padding:1px 5px;border-radius:3px;background:#fff;color:#48484A;font-weight:600;border:1px solid #E5E5EA">' + dn + '</span>';
    });
    p += '</div>';
    // 속성 요약
    var reqC = linkedLT.attrs.filter(function(a){return a.required;}).length;
    var optC = linkedLT.attrs.length - reqC;
    p += '<div style="display:flex;gap:6px;align-items:center">';
    p += '<span style="font-size:9px;font-weight:600;color:#636366">등록 속성:</span>';
    p += '<span style="font-size:9px;padding:1px 5px;border-radius:3px;background:#FFF8F0;color:#B35C00;font-weight:600">필수 ' + reqC + '</span>';
    p += '<span style="font-size:9px;padding:1px 5px;border-radius:3px;background:#F5F5F7;color:#636366;font-weight:600">선택 ' + optC + '</span>';
    // 속성 이름 나열
    p += '<span style="font-size:9px;color:#8E8E93">(';
    linkedLT.attrs.forEach(function(a, i) {
      if(i > 0) p += ', ';
      p += a.label;
    });
    p += ')</span>';
    p += '</div>';
    // 과목/학년/교육과정
    if(linkedLT.subject || linkedLT.grade || linkedLT.curriculum) {
      p += '<div style="display:flex;gap:6px;align-items:center;margin-top:4px">';
      if(linkedLT.subject) p += '<span style="font-size:9px;padding:1px 5px;border-radius:3px;background:#F0FFF4;color:#1B8A3E;font-weight:600">' + linkedLT.subject + '</span>';
      if(linkedLT.grade) p += '<span style="font-size:9px;padding:1px 5px;border-radius:3px;background:#F0F9FF;color:#0369A1;font-weight:600">' + linkedLT.grade + '</span>';
      if(linkedLT.curriculum) p += '<span style="font-size:9px;padding:1px 5px;border-radius:3px;background:#FFF8F0;color:#B35C00;font-weight:600">' + linkedLT.curriculum + '</span>';
      p += '</div>';
    }
    p += '</div>';
  }
  p += '<div style="font-size:12px;color:#636366;margin-top:3px">\uD15C\uD50C\uB9BF \uC18D\uC131\uC744 \uC124\uC815\uD569\uB2C8\uB2E4. \uD544\uC218 \uD56D\uBAA9\uC740 \uC2DC\uC2A4\uD15C \uAD00\uB9AC\uC790\uAC00 \uC9C0\uC815\uD569\uB2C8\uB2E4.</div>';
  p += '</div>';

  // ── 팝업 본문 ──
  p += '<div style="padding:0;overflow-y:auto;flex:1">';

  // ━━ 입력 양식 배정 ━━
  p += '<div style="padding:16px 24px 14px;border-bottom:1px solid #E0F2FE;background:#F0F9FF">';
  p += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:10px">';
  p += '<svg viewBox="0 0 24 24" fill="none" stroke="#0284C7" stroke-width="2" style="width:14px;height:14px;flex-shrink:0"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>';
  p += '<span style="font-size:12px;font-weight:600;color:#0369A1;letter-spacing:.03em">\uC785\uB825 \uC591\uC2DD</span>';
  p += '</div>';
  var availForms = getFormsForType(rt.typeCode);
  var currentFormId = rt.formId || '';
  if(availForms.length > 0) {
    p += '<div style="display:flex;gap:6px;flex-wrap:wrap">';
    availForms.forEach(function(form) {
      var isSelected = currentFormId === form.id;
      var allReq = form.fields.every(function(f){ return f.required; });
      p += '<div onclick="event.stopPropagation();_wcSelectForm(\'' + code + '\',' + rtIdx + ',\'' + form.id + '\')" style="padding:8px 14px;border-radius:8px;border:1px solid ' + (isSelected ? '#0071E3' : '#E5E5EA') + ';background:' + (isSelected ? '#E8F2FF' : '#fff') + ';cursor:pointer;transition:all .12s;min-width:120px">';
      p += '<div style="font-size:12px;font-weight:' + (isSelected ? '700' : '500') + ';color:' + (isSelected ? '#0071E3' : '#1D1D1F') + '">' + form.name + '</div>';
      p += '<div style="font-size:10px;color:#8E8E93;margin-top:2px">\uD544\uB4DC ' + form.fields.length + '\uAC1C';
      if(allReq) p += ' \u00B7 <span style="color:#34C759">\uC804\uCCB4 \uD544\uC218</span>';
      p += '</div></div>';
    });
    p += '</div>';
    if(availForms.length >= 2) {
      var hasItemForm = rt.itemFormMap && Object.keys(rt.itemFormMap).length > 0;
      p += '<div style="margin-top:10px;padding:8px 12px;background:#fff;border-radius:8px;border:1px solid #E5E5EA">';
      p += '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:11px;color:#48484A">';
      p += '<input type="checkbox" ' + (hasItemForm ? 'checked' : '') + ' onchange="_wcToggleItemFormMap(\'' + code + '\',' + rtIdx + ',this.checked)" style="accent-color:#0071E3">';
      p += '<span>\uBB38\uD56D \uB2E8\uC704 \uC591\uC2DD \uBC30\uC815 \uC0AC\uC6A9</span>';
      p += '</label>';
      if(hasItemForm) {
        p += '<div style="margin-top:6px;font-size:10px;color:#8E8E93">\uBB38\uD56D\uBCC4\uB85C \uB2E4\uB978 \uC591\uC2DD\uC744 \uC801\uC6A9\uD569\uB2C8\uB2E4.</div>';
      }
      p += '</div>';
    }
  } else {
    p += '<div style="font-size:11px;color:#8E8E93;padding:4px 0">\uC0AC\uC6A9 \uAC00\uB2A5\uD55C \uC591\uC2DD\uC774 \uC5C6\uC2B5\uB2C8\uB2E4. \uCF58\uD150\uCE20 \uD15C\uD50C\uB9BF \uAD00\uB9AC\uC5D0\uC11C \uC591\uC2DD\uC744 \uBA3C\uC800 \uC0DD\uC131\uD558\uC138\uC694.</div>';
  }
  p += '</div>';

  // ━━ 필수 속성 영역 ━━
  p += '<div style="padding:18px 24px 14px;background:#FEFCE8;border-bottom:1px solid #FEF08A">';
  p += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:14px">';
  p += '<svg viewBox="0 0 24 24" fill="none" stroke="#CA8A04" stroke-width="2" style="width:14px;height:14px;flex-shrink:0"><path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
  p += '<span style="font-size:12px;font-weight:600;color:#854D0E;letter-spacing:.03em">\uD544\uC218 \uC18D\uC131</span>';
  p += '<span style="font-size:10px;color:#A16207;margin-left:4px">\uC2DC\uC2A4\uD15C \uAD00\uB9AC\uC790 \uC9C0\uC815</span>';
  p += '</div>';

  WC_ATTR_SCHEMA.required.forEach(function(field) {
    var val = a[field.key];
    var isLocked = !!locks[field.key];
    p += '<div style="margin-bottom:14px">';
    p += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px">';
    p += '<label style="font-size:12px;font-weight:700;color:#48484A">' + field.label + '</label>';
    p += '<span style="font-size:9px;padding:1px 6px;border-radius:3px;background:#FFF8F0;color:#B35C00;font-weight:700">필수</span>';
    if(isLocked) p += '<svg viewBox="0 0 24 24" fill="none" stroke="#8E8E93" stroke-width="2" style="width:12px;height:12px;margin-left:auto" title="관리자 잠금"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>';
    p += '</div>';

    if(field.type === 'select') {
      p += '<select id="wcA_' + field.key + '" ' + (isLocked ? 'disabled' : '') + ' style="width:100%;padding:9px 12px;border:1px solid ' + (isLocked ? '#F5F5F7' : '#E5E5EA') + ';border-radius:8px;font-size:13px;outline:none;background:' + (isLocked ? '#FAFAFA' : '#fff') + ';color:' + (isLocked ? '#8E8E93' : '#1D1D1F') + '">';
      field.options.forEach(function(opt) {
        p += '<option' + (val === opt ? ' selected' : '') + '>' + opt + '</option>';
      });
      p += '</select>';
    } else if(field.type === 'tags') {
      var tagVal = Array.isArray(val) ? val.join(', ') : (val || '');
      p += '<input id="wcA_' + field.key + '" type="text" value="' + tagVal + '" ' + (isLocked ? 'disabled' : '') + ' style="width:100%;padding:9px 12px;border:1px solid ' + (isLocked ? '#F5F5F7' : '#E5E5EA') + ';border-radius:8px;font-size:13px;outline:none;background:' + (isLocked ? '#FAFAFA' : '#fff') + '" placeholder="쉼표로 구분">';
    } else if(field.type === 'chips') {
      p += '<div style="display:flex;flex-wrap:wrap;gap:5px">';
      var curArr = Array.isArray(val) ? val : [];
      field.options.forEach(function(opt) {
        var isOn = curArr.indexOf(opt) >= 0;
        p += '<label style="display:flex;align-items:center;gap:4px;font-size:12px;color:#48484A;cursor:' + (isLocked ? 'not-allowed' : 'pointer') + ';padding:5px 10px;border-radius:6px;background:' + (isOn ? '#FFF8F0' : '#FAFAFA') + ';border:1px solid ' + (isOn ? '#FFD9A8' : '#E5E5EA') + ';opacity:' + (isLocked ? '.6' : '1') + '">';
        p += '<input type="checkbox" data-req-chip="' + field.key + '" value="' + opt + '" ' + (isOn ? 'checked' : '') + ' ' + (isLocked ? 'disabled' : '') + ' style="accent-color:#CA8A04"> ' + opt;
        p += '</label>';
      });
      p += '</div>';
    } else {
      p += '<input id="wcA_' + field.key + '" type="' + (field.type || 'text') + '" value="' + (val || '') + '" ' + (isLocked ? 'disabled' : '') + ' style="width:100%;padding:9px 12px;border:1px solid ' + (isLocked ? '#F5F5F7' : '#E5E5EA') + ';border-radius:8px;font-size:13px;outline:none;background:' + (isLocked ? '#FAFAFA' : '#fff') + '" placeholder="' + (field.placeholder || '') + '">';
    }
    if(field.desc) p += '<div style="font-size:10px;color:#8E8E93;margin-top:3px">' + field.desc + '</div>';
    p += '</div>';
  });
  p += '</div>';

  // ━━ 선택 속성 영역 ━━
  p += '<div style="padding:18px 24px 14px">';
  p += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:14px">';
  p += '<svg viewBox="0 0 24 24" fill="none" stroke="#636366" stroke-width="2" style="width:14px;height:14px;flex-shrink:0"><path d="M12 6v6l4 2"/><circle cx="12" cy="12" r="10"/></svg>';
  p += '<span style="font-size:12px;font-weight:600;color:#48484A;letter-spacing:.03em">선택 속성</span>';
  p += '<span style="font-size:10px;color:#8E8E93;margin-left:4px">운영자 설정 가능</span>';
  p += '</div>';

  WC_ATTR_SCHEMA.optional.forEach(function(field) {
    var val = a[field.key];
    p += '<div style="margin-bottom:14px">';
    p += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px">';
    p += '<label style="font-size:12px;font-weight:700;color:#48484A">' + field.label + '</label>';
    p += '<span style="font-size:9px;padding:1px 6px;border-radius:3px;background:#F5F5F7;color:#636366;font-weight:600">선택</span>';
    p += '</div>';

    if(field.type === 'chips') {
      p += '<div style="display:flex;flex-wrap:wrap;gap:5px">';
      var curArr = Array.isArray(val) ? val : [];
      field.options.forEach(function(opt) {
        var isOn = curArr.indexOf(opt) >= 0;
        p += '<label style="display:flex;align-items:center;gap:4px;font-size:12px;color:#48484A;cursor:pointer;padding:5px 10px;border-radius:6px;background:' + (isOn ? '#E8F2FF' : '#FAFAFA') + ';border:1px solid ' + (isOn ? '#B3D7FF' : '#E5E5EA') + '">';
        p += '<input type="checkbox" data-opt-chip="' + field.key + '" value="' + opt + '" ' + (isOn ? 'checked' : '') + ' style="accent-color:#0071E3"> ' + opt;
        p += '</label>';
      });
      p += '</div>';
    } else if(field.type === 'textarea') {
      p += '<textarea id="wcA_' + field.key + '" rows="2" style="width:100%;padding:9px 12px;border:1px solid #E5E5EA;border-radius:8px;font-size:13px;outline:none;resize:vertical" placeholder="' + (field.placeholder || '') + '">' + (val || '') + '</textarea>';
    } else {
      p += '<input id="wcA_' + field.key + '" type="' + (field.type || 'text') + '" value="' + (val || '') + '" style="width:100%;padding:9px 12px;border:1px solid #E5E5EA;border-radius:8px;font-size:13px;outline:none" placeholder="' + (field.placeholder || '') + '">';
    }
    if(field.desc) p += '<div style="font-size:10px;color:#8E8E93;margin-top:3px">' + field.desc + '</div>';
    p += '</div>';
  });
  p += '</div>';

  p += '</div>';

  // ── 팝업 하단 버튼 ──
  p += '<div style="padding:14px 24px;border-top:1px solid #F5F5F7;display:flex;gap:8px;align-items:center;background:#FAFAFA;flex-shrink:0">';
  p += '<button onclick="_wcToggleAdminLock(\'' + code + '\',' + rtIdx + ')" style="padding:7px 14px;border:1px solid #E5E5EA;border-radius:8px;background:#fff;font-size:11px;font-weight:600;color:#8E8E93;cursor:pointer" title="시스템 관리자 잠금 토글">';
  p += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px;vertical-align:middle;margin-right:3px"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>관리자 잠금</button>';
  p += '<div style="flex:1"></div>';
  p += '<button onclick="document.getElementById(\'wcAttrOverlay\').remove()" style="padding:9px 18px;border:1px solid #E5E5EA;border-radius:8px;background:#fff;font-size:13px;font-weight:600;color:#636366;cursor:pointer">취소</button>';
  p += '<button onclick="_wcSaveAttr(\'' + code + '\',' + rtIdx + ')" style="padding:9px 18px;border:none;border-radius:8px;background:#1D1D1F;font-size:13px;font-weight:700;color:#fff;cursor:pointer">저장</button>';
  p += '</div></div>';

  overlay.innerHTML = p;
  document.body.appendChild(overlay);
}

function _wcToggleAdminLock(code, rtIdx) {
  var lockKey = code + '_' + rtIdx;
  if(!WC_ADMIN_LOCKS[lockKey]) {
    // 현재 필수 필드 모두 잠금
    WC_ADMIN_LOCKS[lockKey] = {};
    WC_ATTR_SCHEMA.required.forEach(function(f) { WC_ADMIN_LOCKS[lockKey][f.key] = true; });
    toast('필수 속성이 관리자 잠금되었습니다','t-ok');
  } else {
    delete WC_ADMIN_LOCKS[lockKey];
    toast('관리자 잠금이 해제되었습니다','t-info');
  }
  document.getElementById('wcAttrOverlay').remove();
  openWorkTypeAttrPopup(code, rtIdx);
}


// ── Depth 기반 총 카운트 헬퍼 ──
// groupCount = 해당 depth 레벨의 전체 작업 가능 수량 (예: 과정 8개, 세트 80개)
// splitLevel: 분할 기준 depth 인덱스 (0=첫번째 depth, 1=두번째...)
// fallback: depth 정보 없거나 groupCount 미설정 시 SUBJECT_COURSE_DATA.sets 사용
function _wcGetDepthTotal(rt, code, splitLevel) {
  var depthInfo = _wcGetLinkedDepth(rt);
  if(depthInfo && depthInfo.flatInfo && depthInfo.flatInfo.length > 0) {
    var level = (splitLevel !== undefined && splitLevel !== null) ? splitLevel : (rt.splitDepth || 0);
    if(depthInfo.flatInfo[level] && depthInfo.flatInfo[level].groupCount) {
      return {
        total: depthInfo.flatInfo[level].groupCount,
        name: depthInfo.flatInfo[level].name || '\uC138\uD2B8',
        source: 'depth'
      };
    }
  }
  // 폴백: SUBJECT_COURSE_DATA
  var cData = SUBJECT_COURSE_DATA[code] || {};
  return {
    total: cData.sets || 0,
    name: '\uC138\uD2B8',
    source: 'legacy'
  };
}

// ── 작업 설정 ↔ 템플릿 Depth 연결 ──
function _wcGetLinkedDepth(rt) {
  if(!rt || !rt.ltTypeId) return null;
  var lt = LT_STATE.types.find(function(t){ return t.id === rt.ltTypeId; });
  if(!lt) return null;
  return {
    typeId: lt.id,
    typeName: lt.name,
    structureName: lt.structureName || lt.subject || '',
    depthNames: _ltGetDepthNames(lt.depths),
    depthCount: _ltCountDepth(lt.depths),
    flatInfo: _ltGetDepthFlatInfo(lt.depths),
    depths: lt.depths
  };
}

// 분할 기준 Depth 설정
function _wcSetSplitDepth(code, rtIdx, depthLevel) {
  var rt = (REGISTERED_WORK_TYPES[code] || [])[rtIdx];
  if(!rt) return;
  rt.splitDepth = depthLevel;
  renderWorkConfigView();
}

// Depth 기반 범위 추가 (Depth groupCount 기반)
function _wcAddDepthRange(code, rtIdx) {
  var rt = (REGISTERED_WORK_TYPES[code] || [])[rtIdx];
  if(!rt) return;
  var splitLevel = rt.splitDepth || 0;
  var dtInfo = _wcGetDepthTotal(rt, code, splitLevel);
  var levelName = dtInfo.name;
  var totalSets = dtInfo.total;
  if(!rt.setRanges) rt.setRanges = [];

  var lastTo = 0;
  rt.setRanges.forEach(function(r){ if(r.to > lastTo) lastTo = r.to; });
  var newFrom = lastTo + 1;
  var newTo = Math.min(newFrom + 19, totalSets);
  if(newFrom > totalSets) {
    toast('\uC804\uCCB4 ' + levelName + '\uC774(\uAC00) \uC774\uBBF8 \uD560\uB2F9\uB418\uC5C8\uC2B5\uB2C8\uB2E4', 't-warn');
    return;
  }

  var name = prompt('\uB2F4\uB2F9\uC790 \uC774\uB984\uC744 \uC785\uB825\uD558\uC138\uC694 (' + levelName + ' ' + newFrom + '~' + newTo + '):');
  if(!name) return;

  rt.setRanges.push({from: newFrom, to: newTo, assignee: name.trim(), depthLevel: splitLevel});
  toast(levelName + ' ' + newFrom + '~' + newTo + ' \uBC94\uC704 \uCD94\uAC00\uB428', 't-ok');
  renderWorkConfigView();
}

// Depth 기반 커리큘럼 자동 구조 생성 (재구성/자체생성)
function _wcInitDepthCurriculum(code, rtIdx) {
  var rt = (REGISTERED_WORK_TYPES[code] || [])[rtIdx];
  if(!rt) return;
  var depthInfo = _wcGetLinkedDepth(rt);
  if(!depthInfo || depthInfo.depthCount < 2) {
    toast('\uC5F0\uACB0\uB41C \uD15C\uD50C\uB9BF\uC758 \uB2E8\uACC4 \uAD6C\uC870\uAC00 2\uB2E8\uACC4 \uC774\uC0C1\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4', 't-warn');
    return;
  }
  // Depth 마지막 레벨을 단위(unit)로, 그 위를 그룹으로 설정
  var unitName = depthInfo.depthNames[depthInfo.depthCount - 1] || '\uB2E8\uC704';
  var groupLevel = depthInfo.depthNames.length >= 2 ? depthInfo.depthNames[depthInfo.depthCount - 2] : '\uADF8\uB8F9';
  var depthLabel = depthInfo.depthNames.slice(0, -1).join(' \u203A ');

  if(!rt.customCurriculum) {
    rt.customCurriculum = {
      label: depthLabel + ' \uAE30\uBC18 \uCEE4\uB9AC\uD058\uB7FC',
      unitName: unitName,
      depthRef: depthInfo.depthNames,
      groups: [
        {name: groupLevel + ' 1', units: [unitName + ' 1', unitName + ' 2', unitName + ' 3'], assignee: rt.assignee || ''}
      ]
    };
  } else {
    rt.customCurriculum.depthRef = depthInfo.depthNames;
    rt.customCurriculum.unitName = unitName;
    rt.customCurriculum.label = depthLabel + ' \uAE30\uBC18 \uCEE4\uB9AC\uD058\uB7FC';
  }
  toast('\uB2E8\uACC4 \uAD6C\uC870 \uAE30\uBC18 \uCEE4\uB9AC\uD058\uB7FC\uC774 \uC0DD\uC131\uB418\uC5C8\uC2B5\uB2C8\uB2E4', 't-ok');
  renderWorkConfigView();
}

// ── 템플릿 활성/비활성 토글 (카드에서 클릭) ──
// ── 세트 범위 분할 패널 토글 ──
function _wcToggleRangePanel(templateKey) {
  WC_STATE.expandedTemplate = (WC_STATE.expandedTemplate === templateKey) ? null : templateKey;
  renderWorkConfigView();
}

// ── 세트 범위 추가 ──
function _wcAddRange(code, rtIdx) {
  var rt = (REGISTERED_WORK_TYPES[code] || [])[rtIdx];
  if(!rt) return;
  var dtInfoR = _wcGetDepthTotal(rt, code);
  var totalSets = dtInfoR.total;
  if(!rt.setRanges) rt.setRanges = [];

  // 마지막 범위의 다음 세트부터 시작
  var lastTo = 0;
  rt.setRanges.forEach(function(r){ if(r.to > lastTo) lastTo = r.to; });
  var newFrom = lastTo + 1;
  var newTo = Math.min(newFrom + 19, totalSets);
  if(newFrom > totalSets) {
    toast('\uC804\uCCB4 \uC138\uD2B8\uAC00 \uC774\uBBF8 \uD560\uB2F9\uB418\uC5C8\uC2B5\uB2C8\uB2E4', 't-warn');
    return;
  }

  var name = prompt('\uB2F4\uB2F9\uC790 \uC774\uB984\uC744 \uC785\uB825\uD558\uC138\uC694 (' + newFrom + '~' + newTo + '\uC138\uD2B8):');
  if(!name) return;

  rt.setRanges.push({from: newFrom, to: newTo, assignee: name.trim()});
  toast(newFrom + '~' + newTo + '\uC138\uD2B8 \uBC94\uC704 \uCD94\uAC00\uB428', 't-ok');
  renderWorkConfigView();
}

// ── 세트 범위 제거 ──
function _wcRemoveRange(code, rtIdx, rangeIdx) {
  var rt = (REGISTERED_WORK_TYPES[code] || [])[rtIdx];
  if(!rt || !rt.setRanges) return;
  var removed = rt.setRanges.splice(rangeIdx, 1)[0];
  toast(removed.from + '~' + removed.to + '\uC138\uD2B8 \uBC94\uC704 \uC0AD\uC81C\uB428', 't-warn');
  renderWorkConfigView();
}

// ── 세트 범위 담당자 지정 ──
function _wcAssignRangeWorker(code, rtIdx, rangeIdx) {
  var rt = (REGISTERED_WORK_TYPES[code] || [])[rtIdx];
  if(!rt || !rt.setRanges) return;
  var rng = rt.setRanges[rangeIdx];
  if(!rng) return;
  var name = prompt(rng.from + '~' + rng.to + '\uC138\uD2B8 \uB2F4\uB2F9\uC790 \uC774\uB984:');
  if(!name) return;
  rng.assignee = name.trim();
  toast('\uB2F4\uB2F9\uC790 \uC9C0\uC815 \uC644\uB8CC', 't-ok');
  renderWorkConfigView();
}

function _wcToggleTemplate(code, rtIdx) {
  var regTypes = REGISTERED_WORK_TYPES[code] || [];
  var rt = regTypes[rtIdx];
  if(!rt) return;
  rt.disabled = !rt.disabled;
  renderWorkConfigView();
  toast(_getRtDisplayLabel(rt) + (rt.disabled ? ' \uC81C\uC678\uB428' : ' \uC120\uD0DD\uB428'), 't-ok');
}

// ── 카드 전체 담당자 일괄 지정 팝업 ──
function _wcBulkAssignWorker(code) {
  var regTypes = REGISTERED_WORK_TYPES[code] || [];
  var activeTypes = regTypes.filter(function(rt){ return !rt.disabled; });
  if(activeTypes.length === 0) { toast('활성 템플릿이 없습니다','t-warn'); return; }

  // 기존 담당자 목록 수집
  var allWorkers = [];
  Object.keys(REGISTERED_WORK_TYPES).forEach(function(k) {
    REGISTERED_WORK_TYPES[k].forEach(function(r) {
      if(r.assignee && allWorkers.indexOf(r.assignee) < 0) allWorkers.push(r.assignee);
    });
  });
  (STATE.workflowItems || []).forEach(function(i) {
    if(i.assignee && allWorkers.indexOf(i.assignee) < 0) allWorkers.push(i.assignee);
  });
  allWorkers.sort();

  var cData = SUBJECT_COURSE_DATA[code] || {courseName: _SUBJECT_NAME_MAP[code] || code};

  var overlay = document.createElement('div');
  overlay.id = 'wcBulkAssignOverlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(15,23,42,.45);z-index:9999;display:flex;align-items:center;justify-content:center;animation:fadeIn .15s ease';
  overlay.onclick = function(e) { if(e.target === overlay) overlay.remove(); };

  var p = '';
  p += '<div style="background:#fff;border-radius:14px;width:480px;max-height:80vh;box-shadow:0 25px 50px rgba(0,0,0,.18);overflow:hidden;display:flex;flex-direction:column" onclick="event.stopPropagation()">';

  // 헤더
  p += '<div style="padding:18px 22px 14px;border-bottom:1px solid #F5F5F7">';
  p += '<div style="font-size:16px;font-weight:600;color:#1D1D1F">담당자 지정</div>';
  p += '<div style="font-size:11px;color:#8E8E93;margin-top:3px">' + code + ' · ' + cData.courseName + '</div>';
  p += '</div>';

  // 적용 대상 템플릿
  p += '<div style="padding:14px 22px 8px">';
  p += '<div style="font-size:10px;font-weight:700;color:#636366;margin-bottom:8px;text-transform:uppercase;letter-spacing:.06em">적용 대상 템플릿 (활성 ' + activeTypes.length + '개)</div>';
  p += '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:12px">';
  regTypes.forEach(function(rt, idx) {
    var sys = WC_SYSTEM_COLORS[rt.target || 'ND'] || WC_SYSTEM_COLORS.ND;
    var isActive = !rt.disabled;
    p += '<label style="display:flex;align-items:center;gap:5px;padding:4px 10px;border-radius:5px;background:' + (isActive ? sys.bg : '#FAFAFA') + ';border:1px solid ' + (isActive ? sys.border : '#E5E5EA') + ';cursor:pointer;opacity:' + (isActive ? '1' : '.5') + '">';
    p += '<input type="checkbox" data-ba-idx="' + idx + '"' + (isActive ? ' checked' : '') + ' style="accent-color:' + sys.color + ';width:12px;height:12px">';
    p += '<span style="font-size:11px;font-weight:600;color:' + (isActive ? '#1D1D1F' : '#8E8E93') + '">' + _getTypeLabel(rt.typeCode) + '</span>';
    p += '<span style="font-size:8px;padding:1px 4px;border-radius:3px;background:' + sys.bg + ';color:' + sys.color + ';font-weight:700">' + sys.label + '</span>';
    if(rt.assignee) p += '<span style="font-size:9px;color:#8E8E93;margin-left:2px">(' + rt.assignee + ')</span>';
    p += '</label>';
  });
  p += '</div>';

  // 기존 담당자 빠른 선택
  p += '<div style="font-size:10px;font-weight:700;color:#636366;margin-bottom:6px">기존 담당자 선택</div>';
  p += '<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:12px">';
  if(allWorkers.length > 0) {
    allWorkers.forEach(function(w) {
      var init = w.charAt(0);
      p += '<button onclick="document.getElementById(\'wcBulkAssignInput\').value=\'' + w + '\'" style="display:inline-flex;align-items:center;gap:5px;padding:6px 12px;border:1px solid #E8F2FF;border-radius:8px;background:#FAFAFE;font-size:12px;font-weight:600;color:#0071E3;cursor:pointer;transition:all .12s" onmouseenter="this.style.background=\'#E8F2FF\';this.style.borderColor=\'#818CF8\'" onmouseleave="this.style.background=\'#FAFAFE\';this.style.borderColor=\'#E8F2FF\'">';
      p += '<span style="width:22px;height:22px;border-radius:50%;background:#6366F1;color:#fff;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center">' + init + '</span>';
      p += w + '</button>';
    });
  } else {
    p += '<span style="font-size:11px;color:#8E8E93">등록된 담당자가 없습니다</span>';
  }
  p += '</div>';

  // 직접 입력
  p += '<div style="font-size:10px;font-weight:700;color:#636366;margin-bottom:4px">직접 입력</div>';
  p += '<input id="wcBulkAssignInput" type="text" placeholder="담당자 이름 입력" style="width:100%;padding:10px 14px;border:1px solid #E5E5EA;border-radius:8px;font-size:13px;outline:none;box-sizing:border-box;transition:border-color .15s" onfocus="this.style.borderColor=\'#818CF8\'" onblur="this.style.borderColor=\'#E5E5EA\'">';
  p += '</div>';

  // 하단 버튼
  p += '<div style="padding:14px 22px;border-top:1px solid #F5F5F7;display:flex;gap:8px;justify-content:flex-end;background:#FAFAFA">';
  p += '<button onclick="document.getElementById(\'wcBulkAssignOverlay\').remove()" style="padding:9px 18px;border:1px solid #E5E5EA;border-radius:8px;background:#fff;font-size:13px;font-weight:600;color:#636366;cursor:pointer">\uCDE8\uC18C</button>';
  p += '<button onclick="_wcSaveBulkAssign(\'' + code + '\')" style="padding:9px 18px;border:none;border-radius:8px;background:#0071E3;font-size:13px;font-weight:700;color:#fff;cursor:pointer;transition:background .12s" onmouseenter="this.style.background=\'#4338CA\'" onmouseleave="this.style.background=\'#0071E3\'">\uB2F4\uB2F9\uC790 \uC801\uC6A9</button>';
  p += '</div></div>';

  overlay.innerHTML = p;
  document.body.appendChild(overlay);
}

function _wcSaveBulkAssign(code) {
  var input = document.getElementById('wcBulkAssignInput');
  var name = input ? input.value.trim() : '';
  if(!name) { toast('담당자 이름을 입력하세요','t-warn'); return; }

  var regTypes = REGISTERED_WORK_TYPES[code] || [];
  var cbs = document.querySelectorAll('#wcBulkAssignOverlay input[data-ba-idx]');
  var count = 0;
  cbs.forEach(function(cb) {
    if(cb.checked) {
      var idx = parseInt(cb.getAttribute('data-ba-idx'));
      if(regTypes[idx]) {
        regTypes[idx].assignee = name;
        count++;
      }
    }
  });
  document.getElementById('wcBulkAssignOverlay').remove();
  toast(count + '개 템플릿에 \'' + name + '\' 담당자 지정 완료', 't-ok');
  renderWorkConfigView();
}

function _wcSaveAttr(code, rtIdx) {
  var rt = (REGISTERED_WORK_TYPES[code] || [])[rtIdx];
  if(!rt || !rt.attrs) { document.getElementById('wcAttrOverlay').remove(); return; }
  var a = rt.attrs;

  // 필수 + 선택 텍스트/셀렉트/넘버 필드
  WC_ATTR_SCHEMA.required.concat(WC_ATTR_SCHEMA.optional).forEach(function(field) {
    if(field.type === 'chips') return; // chips는 별도 처리
    var el = document.getElementById('wcA_' + field.key);
    if(!el) return;
    if(field.type === 'tags') {
      a[field.key] = el.value.split(',').map(function(s){ return s.trim(); }).filter(Boolean);
    } else if(field.type === 'number') {
      a[field.key] = parseInt(el.value) || 0;
    } else {
      a[field.key] = el.value;
    }
  });

  // 필수 chips
  WC_ATTR_SCHEMA.required.filter(function(f){return f.type==='chips';}).forEach(function(field) {
    var arr = [];
    document.querySelectorAll('#wcAttrOverlay input[data-req-chip="' + field.key + '"]:checked').forEach(function(cb){ arr.push(cb.value); });
    a[field.key] = arr;
  });

  // 선택 chips
  WC_ATTR_SCHEMA.optional.filter(function(f){return f.type==='chips';}).forEach(function(field) {
    var arr = [];
    document.querySelectorAll('#wcAttrOverlay input[data-opt-chip="' + field.key + '"]:checked').forEach(function(cb){ arr.push(cb.value); });
    a[field.key] = arr;
  });

  document.getElementById('wcAttrOverlay').remove();
  toast('속성이 저장되었습니다','t-ok');
  renderWorkConfigView();
}

// ── 유형 등록 팝업 ──
function openWorkTypeRegisterPopup(code) {
  var cData = SUBJECT_COURSE_DATA[code] || {courseName: _SUBJECT_NAME_MAP[code] || code};
  var existing = REGISTERED_WORK_TYPES[code] || [];
  var existingIds = existing.map(function(r){ return r.ltTypeId || ''; });

  // 콘텐츠 템플릿 관리(LT_STATE)에서 미등록 템플릿만 후보로 표시
  var allTemplates = LT_STATE.types || [];
  var candidates = allTemplates.filter(function(t) {
    return existingIds.indexOf(t.id) < 0;
  });

  // 시스템별 그룹핑: 템플릿 이름에서 시스템 추론
  var sysKeys = Object.keys(WC_SYSTEM_COLORS);

  var overlay = document.createElement('div');
  overlay.id = 'wcRegOverlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(15,23,42,.45);z-index:9999;display:flex;align-items:center;justify-content:center;animation:fadeIn .15s ease';
  overlay.onclick = function(e) { if(e.target === overlay) overlay.remove(); };

  var p = '';
  p += '<div style="background:#fff;border-radius:14px;width:640px;max-height:85vh;overflow:hidden;box-shadow:0 25px 50px rgba(0,0,0,.18);display:flex;flex-direction:column" onclick="event.stopPropagation()">';

  // \uD5E4\uB354
  p += '<div style="padding:20px 24px 16px;border-bottom:1px solid #F5F5F7">';
  p += '<div style="font-size:17px;font-weight:600;color:#1D1D1F">\uD15C\uD50C\uB9BF \uC120\uD0DD</div>';
  p += '<div style="font-size:12px;color:#8E8E93;margin-top:3px">' + code + ' \u00B7 ' + cData.courseName + ' \u2014 \uCF58\uD150\uCE20 \uD15C\uD50C\uB9BF \uAD00\uB9AC\uC5D0\uC11C \uC815\uC758\uB41C \uD15C\uD50C\uB9BF\uC744 \uC120\uD0DD\uD558\uC138\uC694</div>';
  p += '</div>';

  // \uD15C\uD50C\uB9BF \uBAA9\uB85D (typeCode\uBCC4 \uADF8\uB8F9 + target \uBC30\uC9C0)
  p += '<div style="padding:16px 24px;overflow-y:auto;flex:1;max-height:50vh">';
  if(candidates.length === 0) {
    p += '<div style="text-align:center;padding:30px 0;color:#8E8E93;font-size:13px">\uC120\uD0DD \uAC00\uB2A5\uD55C \uD15C\uD50C\uB9BF\uC774 \uC5C6\uC2B5\uB2C8\uB2E4</div>';
  } else {
    // typeCode \uAE30\uC900 \uADF8\uB8F9\uD654
    var tcGroups = {};
    var tcOrder = [];
    candidates.forEach(function(t) {
      var tc = t.typeCode || 'ETC';
      if(!tcGroups[tc]) { tcGroups[tc] = []; tcOrder.push(tc); }
      tcGroups[tc].push(t);
    });
    tcOrder.forEach(function(tc) {
      var ctInfo = CONTENT_TYPES[tc] || {label: tc, icon: '', color: '#48484A', bg: '#F5F5F7'};
      var items = tcGroups[tc];
      p += '<div style="margin-bottom:16px">';
      p += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;padding:4px 0">';
      p += '<span style="font-size:12px;font-weight:600;color:#1D1D1F">' + ctInfo.label + '</span>';
      p += '<span style="font-size:9px;padding:1px 5px;border-radius:3px;background:#F5F5F7;color:#636366;font-weight:700;font-family:monospace">' + tc + '</span>';
      p += '<span style="font-size:10px;color:#8E8E93">' + items.length + '\uAC1C \uAD6C\uC870</span>';
      p += '</div>';
      p += '<div style="display:flex;flex-direction:column;gap:6px">';
      items.forEach(function(t) {
        var tSys = WC_SYSTEM_COLORS[t.target || 'ND'] || WC_SYSTEM_COLORS.ND;
        var reqC = t.attrs ? t.attrs.filter(function(a){return a.required;}).length : 0;
        var optC = t.attrs ? t.attrs.length - reqC : 0;
        var depthNames = _ltGetDepthNames(t.depths);
        var depthCount = _ltCountDepth(t.depths);
        var structLabel = t.structureName || t.subject || '';
        p += '<label style="display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:10px;background:#FAFAFA;border:1px solid #E5E5EA;cursor:pointer;transition:all .12s" onmouseenter="this.style.borderColor=\'#B3D7FF\';this.style.background=\'#F0F9FF\'" onmouseleave="this.style.borderColor=\'#E5E5EA\';this.style.background=\'#FAFAFA\'">';
        p += '<input type="checkbox" data-wt-id="' + t.id + '" data-wt-name="' + (ctInfo.label || t.name) + '" data-wt-tc="' + t.typeCode + '" data-wt-tg="' + (t.target || 'ND') + '" style="accent-color:#0071E3;flex-shrink:0;width:16px;height:16px">';
        p += '<div style="flex:1;min-width:0">';
        // \uC81C\uBAA9\uD589: \uAD6C\uC870\uBA85 + target \uBC30\uC9C0
        p += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">';
        if(structLabel) {
          p += '<span style="font-size:13px;font-weight:700;color:#1D1D1F">' + structLabel + '</span>';
        } else {
          p += '<span style="font-size:13px;font-weight:700;color:#8E8E93;font-style:italic">\uAD6C\uC870\uBA85 \uBBF8\uC9C0\uC815</span>';
        }
        p += '<span style="font-size:8px;padding:2px 6px;border-radius:4px;background:' + tSys.bg + ';color:' + tSys.color + ';font-weight:700;border:1px solid ' + tSys.border + '">' + tSys.label + '</span>';
        p += '</div>';
        // Depth + \uD544\uB4DC \uC815\uBCF4
        p += '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">';
        p += '<span style="font-size:9px;color:#636366;font-weight:500">' + depthCount + 'D: ' + depthNames.join(' \u2192 ') + '</span>';
        if(reqC > 0) p += '<span style="font-size:8px;padding:1px 5px;border-radius:3px;background:#FFF8F0;color:#B35C00;font-weight:600">\uD544\uC218 ' + reqC + '</span>';
        if(optC > 0) p += '<span style="font-size:8px;padding:1px 5px;border-radius:3px;background:#F5F5F7;color:#636366;font-weight:600">\uC120\uD0DD ' + optC + '</span>';
        p += '</div></div>';
        p += '</label>';
      });
      p += '</div></div>';
    });
  }
  p += '</div>';

  // \uD558\uB2E8 \uBC84\uD2BC
  p += '<div style="padding:14px 24px;border-top:1px solid #F5F5F7;display:flex;gap:8px;justify-content:flex-end;background:#FAFAFA">';
  p += '<button onclick="document.getElementById(\'wcRegOverlay\').remove()" style="padding:9px 18px;border:1px solid #E5E5EA;border-radius:8px;background:#fff;font-size:13px;font-weight:600;color:#636366;cursor:pointer">\uCDE8\uC18C</button>';
  p += '<button onclick="_wcRegisterSelected(\'' + code + '\')" style="padding:9px 18px;border:none;border-radius:8px;background:#1D1D1F;font-size:13px;font-weight:700;color:#fff;cursor:pointer">\uC120\uD0DD \uD15C\uD50C\uB9BF \uC801\uC6A9</button>';
  p += '</div></div>';

  overlay.innerHTML = p;
  document.body.appendChild(overlay);
}

function _wcRegisterSelected(code) {
  var cbs = document.querySelectorAll('#wcRegOverlay input[data-wt-name]:checked');
  if(cbs.length === 0) { toast('\uC120\uD0DD\uD560 \uD15C\uD50C\uB9BF\uC744 \uC120\uD0DD\uD558\uC138\uC694','t-warn'); return; }
  if(!REGISTERED_WORK_TYPES[code]) REGISTERED_WORK_TYPES[code] = [];
  cbs.forEach(function(cb) {
    REGISTERED_WORK_TYPES[code].push({
      name: cb.getAttribute('data-wt-name'),
      typeCode: cb.getAttribute('data-wt-tc'),
      target: cb.getAttribute('data-wt-tg'),
      ltTypeId: cb.getAttribute('data-wt-id'),
    });
  });
  document.getElementById('wcRegOverlay').remove();
  toast(cbs.length + '\uAC1C \uD15C\uD50C\uB9BF\uC774 \uC801\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4','t-ok');
  renderWorkConfigView();
}

// \u2500\u2500 \uD15C\uD50C\uB9BF \uC81C\uC678 \uD31D\uC5C5 \u2500\u2500
function openWorkTypeExcludePopup(code) {
  var regTypes = REGISTERED_WORK_TYPES[code] || [];
  if(regTypes.length === 0) return;
  var cData = SUBJECT_COURSE_DATA[code] || {courseName: _SUBJECT_NAME_MAP[code] || code};

  var overlay = document.createElement('div');
  overlay.id = 'wcExclOverlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(15,23,42,.45);z-index:9999;display:flex;align-items:center;justify-content:center;animation:fadeIn .15s ease';
  overlay.onclick = function(e) { if(e.target === overlay) overlay.remove(); };

  var p = '';
  p += '<div style="background:#fff;border-radius:14px;width:520px;max-height:85vh;overflow:hidden;box-shadow:0 25px 50px rgba(0,0,0,.18);display:flex;flex-direction:column" onclick="event.stopPropagation()">';

  p += '<div style="padding:20px 24px 16px;border-bottom:1px solid #F5F5F7">';
  p += '<div style="font-size:17px;font-weight:600;color:#1D1D1F">\uD15C\uD50C\uB9BF \uC81C\uC678</div>';
  p += '<div style="font-size:12px;color:#8E8E93;margin-top:3px">' + code + ' \u00B7 ' + cData.courseName + ' \u2014 \uC81C\uC678\uD560 \uD15C\uD50C\uB9BF\uC744 \uC120\uD0DD\uD558\uC138\uC694</div>';
  p += '</div>';

  p += '<div style="padding:16px 24px;overflow-y:auto;flex:1">';
  p += '<div style="display:flex;flex-direction:column;gap:5px">';
  regTypes.forEach(function(rt, idx) {
    var sys = WC_SYSTEM_COLORS[rt.target || 'ND'] || WC_SYSTEM_COLORS.ND;
    p += '<label style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:8px;background:' + sys.bg + ';border:1px solid ' + sys.border + ';cursor:pointer;transition:all .1s">';
    p += '<input type="checkbox" data-excl-idx="' + idx + '" style="accent-color:#FF3B30">';
    var _exCtLabel = _getTypeLabel(rt.typeCode);
    var _exStructName = _getStructureName(rt.ltTypeId);
    p += '<span style="font-size:13px;font-weight:600;color:#1D1D1F">' + _exCtLabel + '</span>';
    p += '<span style="font-size:9px;padding:1px 5px;border-radius:3px;background:' + sys.bg + ';color:' + sys.color + ';font-weight:700;border:1px solid ' + sys.border + '">' + sys.label + '</span>';
    if(_exStructName) p += '<span style="font-size:10px;color:#636366;font-weight:500">' + _exStructName + '</span>';
    p += '<span style="font-size:10px;color:#8E8E93;margin-left:auto;font-family:monospace">' + rt.typeCode + '</span>';
    p += '</label>';
  });
  p += '</div></div>';

  p += '<div style="padding:14px 24px;border-top:1px solid #F5F5F7;display:flex;gap:8px;justify-content:flex-end;background:#FAFAFA">';
  p += '<button onclick="document.getElementById(\'wcExclOverlay\').remove()" style="padding:9px 18px;border:1px solid #E5E5EA;border-radius:8px;background:#fff;font-size:13px;font-weight:600;color:#636366;cursor:pointer">취소</button>';
  p += '<button onclick="_wcExcludeSelected(\'' + code + '\')" style="padding:9px 18px;border:none;border-radius:8px;background:#FF3B30;font-size:13px;font-weight:700;color:#fff;cursor:pointer">\uC120\uD0DD \uD15C\uD50C\uB9BF \uC81C\uC678</button>';
  p += '</div></div>';

  overlay.innerHTML = p;
  document.body.appendChild(overlay);
}

function _wcExcludeSelected(code) {
  var cbs = document.querySelectorAll('#wcExclOverlay input[data-excl-idx]:checked');
  if(cbs.length === 0) { toast('\uC81C\uC678\uD560 \uD15C\uD50C\uB9BF\uC744 \uC120\uD0DD\uD558\uC138\uC694','t-warn'); return; }
  var idxs = [];
  cbs.forEach(function(cb) { idxs.push(parseInt(cb.getAttribute('data-excl-idx'))); });
  idxs.sort(function(a,b){ return b - a; }); // 역순 제거
  idxs.forEach(function(i) { REGISTERED_WORK_TYPES[code].splice(i, 1); });
  if(REGISTERED_WORK_TYPES[code].length === 0) delete REGISTERED_WORK_TYPES[code];
  document.getElementById('wcExclOverlay').remove();
  toast(idxs.length + '\uAC1C \uD15C\uD50C\uB9BF\uC774 \uC81C\uC678\uB418\uC5C8\uC2B5\uB2C8\uB2E4','t-ok');
  renderWorkConfigView();
}

// \u2500\u2500 \uD15C\uD50C\uB9BF\uBCC4 \uB2F4\uB2F9\uC790 \uC9C0\uC815 \uD31D\uC5C5 \u2500\u2500
function _wcAssignWorker(code, rtIdx) {
  var regTypes = REGISTERED_WORK_TYPES[code] || [];
  var rt = regTypes[rtIdx];
  if(!rt) return;

  // \uAE30\uC874 \uB2F4\uB2F9\uC790 \uBAA9\uB85D \uC218\uC9D1
  var allWorkers = [];
  Object.keys(REGISTERED_WORK_TYPES).forEach(function(k) {
    REGISTERED_WORK_TYPES[k].forEach(function(r) {
      if(r.assignee && allWorkers.indexOf(r.assignee) < 0) allWorkers.push(r.assignee);
    });
  });
  // workflowItems\uC758 assignee\uB3C4 \uCD94\uAC00
  (STATE.workflowItems || []).forEach(function(i) {
    if(i.assignee && allWorkers.indexOf(i.assignee) < 0) allWorkers.push(i.assignee);
  });
  allWorkers.sort();

  var sys = WC_SYSTEM_COLORS[rt.target] || WC_SYSTEM_COLORS.ND;
  var overlay = document.createElement('div');
  overlay.id = 'wcAssignOverlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(15,23,42,.45);z-index:9999;display:flex;align-items:center;justify-content:center;animation:fadeIn .15s ease';
  overlay.onclick = function(e) { if(e.target === overlay) overlay.remove(); };

  var p = '';
  p += '<div style="background:#fff;border-radius:14px;width:400px;box-shadow:0 25px 50px rgba(0,0,0,.18);overflow:hidden" onclick="event.stopPropagation()">';
  p += '<div style="padding:18px 22px 14px;border-bottom:1px solid #F5F5F7">';
  p += '<div style="font-size:15px;font-weight:600;color:#1D1D1F">\uB2F4\uB2F9\uC790 \uC9C0\uC815</div>';
  p += '<div style="font-size:11px;color:#8E8E93;margin-top:3px">' + _getRtDisplayLabel(rt) + ' \u00B7 ' + code + '</div>';
  p += '</div>';
  p += '<div style="padding:14px 22px">';
  p += '<div style="font-size:10px;font-weight:600;color:var(--c-gray-500);margin-bottom:6px">\uAE30\uC874 \uB2F4\uB2F9\uC790 \uC120\uD0DD</div>';
  p += '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:12px">';
  allWorkers.forEach(function(w) {
    p += '<button onclick="document.getElementById(\'wcAssignInput\').value=\'' + w + '\'" style="padding:5px 12px;border:1px solid #E8F2FF;border-radius:6px;background:#FAFAFA;font-size:12px;font-weight:600;color:#0071E3;cursor:pointer;transition:all .1s" onmouseenter="this.style.background=\'#E8F2FF\'" onmouseleave="this.style.background=\'#FAFAFA\'">' + w + '</button>';
  });
  if(allWorkers.length === 0) p += '<span style="font-size:11px;color:#8E8E93">\uB4F1\uB85D\uB41C \uB2F4\uB2F9\uC790\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4</span>';
  p += '</div>';
  p += '<div style="font-size:10px;font-weight:600;color:var(--c-gray-500);margin-bottom:4px">\uC9C1\uC811 \uC785\uB825</div>';
  p += '<input id="wcAssignInput" type="text" placeholder="\uB2F4\uB2F9\uC790 \uC774\uB984" value="' + (rt.assignee || '') + '" style="width:100%;padding:8px 12px;border:1px solid #E5E5EA;border-radius:7px;font-size:13px;outline:none;box-sizing:border-box" onfocus="this.style.borderColor=\'#B3D7FF\'" onblur="this.style.borderColor=\'#E5E5EA\'">';
  p += '</div>';
  p += '<div style="padding:12px 22px;border-top:1px solid #F5F5F7;display:flex;gap:8px;justify-content:flex-end;background:#FAFAFA">';
  p += '<button onclick="document.getElementById(\'wcAssignOverlay\').remove()" style="padding:8px 16px;border:1px solid #E5E5EA;border-radius:7px;background:#fff;font-size:12px;font-weight:600;color:#636366;cursor:pointer">\uCDE8\uC18C</button>';
  p += '<button onclick="_wcSaveAssignee(\'' + code + '\',' + rtIdx + ')" style="padding:8px 16px;border:none;border-radius:7px;background:#1D1D1F;font-size:12px;font-weight:700;color:#fff;cursor:pointer">\uC800\uC7A5</button>';
  p += '</div></div>';

  overlay.innerHTML = p;
  document.body.appendChild(overlay);
}

function _wcSaveAssignee(code, rtIdx) {
  var input = document.getElementById('wcAssignInput');
  var name = input ? input.value.trim() : '';
  var regTypes = REGISTERED_WORK_TYPES[code] || [];
  if(regTypes[rtIdx]) {
    regTypes[rtIdx].assignee = name || null;
  }
  var el = document.getElementById('wcAssignOverlay');
  if(el) el.remove();
  toast(name ? '\'' + name + '\' \uB2F4\uB2F9\uC790 \uC9C0\uC815 \uC644\uB8CC' : '\uB2F4\uB2F9\uC790 \uD574\uC81C', 't-ok');
  renderWorkConfigView();
}


// ═══════════════════════════════════════
//  v7: CURRICULUM DATA & SERVICE BIND
// ═══════════════════════════════════════
var CURRICULUM_DATA = [
  {id:'CUR-001', name:'수학 기초 과정', desc:'뉴드림스 수학 기초 커리큘럼',
   team:'수학팀', creator:'홍길동', subject:'수학', grade:'초1~3', eduCurriculum:'2022 개정', targetSystems:['ND'],
   depths:[
     {name:'커리큘럼명',count:1},
     {name:'과정',count:8},
     {name:'세트',count:80, forms:[{formId:'FORM-ANS-A',label:'해답지',boundCodes:['M'],bindConfig:{'M':{mode:'full'}}},{formId:'FORM-AN2-A',label:'자동채점',boundCodes:['M'],bindConfig:{'M':{mode:'full'}}},{formId:'FORM-CBT-A',label:'핵심점검',boundCodes:['M'],bindConfig:{'M':{mode:'full'}}}]},
     {name:'콘텐츠',count:null}
   ],
   splitDepth:2, status:'active', createdAt:'2026-01-15', updatedAt:'2026-04-20',
   totalSets:80},
  {id:'CUR-002', name:'영어 회화 과정', desc:'뉴드림스 영어 회화 커리큘럼',
   team:'영어팀', creator:'김철수', subject:'영어', grade:'초1~3', eduCurriculum:'2022 개정', targetSystems:['ND'],
   depths:[
     {name:'커리큘럼명',count:1},
     {name:'과정',count:6},
     {name:'세트',count:60, forms:[{formId:'FORM-FLC-A',label:'플래시카드',boundCodes:['E','ET1','E2T'],bindConfig:{'E':{mode:'full'},'ET1':{mode:'full'},'E2T':{mode:'partial',depthRanges:[null,{from:1,to:4},null,null]}}},{formId:'FORM-AN2-A',label:'자동채점',boundCodes:['E'],bindConfig:{'E':{mode:'full'}}}]},
     {name:'콘텐츠',count:null}
   ],
   splitDepth:2, status:'active', createdAt:'2026-01-20', updatedAt:'2026-04-18',
   totalSets:60},
  {id:'CUR-003', name:'내신완공 영상강의', desc:'눈높이 내신완공 출판사별 강좌',
   team:'영어팀', creator:'이영희', subject:'영어', grade:'중1', eduCurriculum:'2022 개정', targetSystems:['NH'],
   depths:[
     {name:'출판사',count:5},
     {name:'강좌',count:5, forms:[{formId:'FORM-STDG-NH',label:'영상강의',boundCodes:[],bindConfig:{}}]},
     {name:'콘텐츠',count:null}
   ],
   splitDepth:1, status:'active', createdAt:'2026-02-01', updatedAt:'2026-04-15',
   totalSets:50},
  {id:'CUR-004', name:'국어 기초 과정', desc:'국어 기초 커리큘럼',
   team:'국어팀', creator:'홍길동', subject:'국어', grade:'초1~3', eduCurriculum:'', targetSystems:['ND','SJ'],
   depths:[
     {name:'커리큘럼명',count:1},
     {name:'과정',count:5},
     {name:'세트',count:50, forms:[{formId:'FORM-ANS-A',label:'해답지',boundCodes:[],bindConfig:{}},{formId:'FORM-EVA-A',label:'평가',boundCodes:[],bindConfig:{}}]},
     {name:'콘텐츠',count:null}
   ],
   splitDepth:2, status:'draft', createdAt:'2026-03-10', updatedAt:'2026-04-10',
   totalSets:50},
  {id:'CUR-005', name:'수학 심화 과정', desc:'수학 심화 커리큘럼',
   team:'수학팀', creator:'홍길동', subject:'수학', grade:'초4~6', eduCurriculum:'2022 개정', targetSystems:['ND'],
   depths:[{name:'커리큘럼명',count:1},{name:'과정',count:10},{name:'세트',count:100},{name:'콘텐츠',count:null}],
   splitDepth:2, status:'active', createdAt:'2026-02-05', updatedAt:'2026-04-22',
   totalSets:100},
  {id:'CUR-006', name:'영어 파닉스 과정', desc:'파닉스 영어 커리큘럼',
   team:'영어팀', creator:'김철수', subject:'영어', grade:'초1~2', eduCurriculum:'', targetSystems:['ND'],
   depths:[{name:'커리큘럼명',count:1},{name:'과정',count:4},{name:'세트',count:40},{name:'콘텐츠',count:null}],
   splitDepth:2, status:'active', createdAt:'2026-02-12', updatedAt:'2026-04-20',
   totalSets:40},
  {id:'CUR-007', name:'과학 기초 과정', desc:'과학 기초 커리큘럼',
   team:'과학팀', creator:'박지수', subject:'과학', grade:'초3~4', eduCurriculum:'2022 개정', targetSystems:['ND'],
   depths:[{name:'커리큘럼명',count:1},{name:'과정',count:6},{name:'세트',count:60},{name:'콘텐츠',count:null}],
   splitDepth:2, status:'draft', createdAt:'2026-03-20', updatedAt:'2026-04-25',
   totalSets:60},
  {id:'CUR-008', name:'사회 탐구 과정', desc:'사회 탐구 커리큘럼',
   team:'사회팀', creator:'박지수', subject:'사회', grade:'초5~6', eduCurriculum:'2022 개정', targetSystems:['SJ'],
   depths:[{name:'커리큘럼명',count:1},{name:'학년',count:4},{name:'단원',count:32},{name:'콘텐츠',count:null}],
   splitDepth:2, status:'active', createdAt:'2026-01-28', updatedAt:'2026-04-18',
   totalSets:32},
  {id:'CUR-009', name:'수학 중등 1학년', desc:'중등 수학 1학년 커리큘럼',
   team:'수학팀', creator:'이영희', subject:'수학', grade:'중1', eduCurriculum:'2022 개정', targetSystems:['ND','NH'],
   depths:[{name:'커리큘럼명',count:1},{name:'학기',count:2},{name:'세트',count:24},{name:'콘텐츠',count:null}],
   splitDepth:2, status:'active', createdAt:'2026-02-20', updatedAt:'2026-04-22',
   totalSets:24},
  {id:'CUR-010', name:'영어 중등 2학년', desc:'중등 영어 2학년 커리큘럼',
   team:'영어팀', creator:'김철수', subject:'영어', grade:'중2', eduCurriculum:'2022 개정', targetSystems:['ND'],
   depths:[{name:'커리큘럼명',count:1},{name:'학기',count:2},{name:'세트',count:20},{name:'콘텐츠',count:null}],
   splitDepth:2, status:'draft', createdAt:'2026-04-01', updatedAt:'2026-04-27',
   totalSets:20},
  {id:'CUR-011', name:'국어 중등 1학년', desc:'중등 국어 1학년',
   team:'국어팀', creator:'홍길동', subject:'국어', grade:'중1', eduCurriculum:'2022 개정', targetSystems:['ND'],
   depths:[{name:'커리큘럼명',count:1},{name:'학기',count:2},{name:'세트',count:20},{name:'콘텐츠',count:null}],
   splitDepth:2, status:'active', createdAt:'2026-03-01', updatedAt:'2026-04-20',
   totalSets:20},
  {id:'CUR-012', name:'과학 실험 과정', desc:'과학 실험 커리큘럼',
   team:'과학팀', creator:'박지수', subject:'과학', grade:'중2~3', eduCurriculum:'', targetSystems:['ND'],
   depths:[{name:'커리큘럼명',count:1},{name:'실험',count:8},{name:'세트',count:40},{name:'콘텐츠',count:null}],
   splitDepth:2, status:'draft', createdAt:'2026-04-15', updatedAt:'2026-04-27',
   totalSets:40},
];

var FORM_TEMPLATES = [
  {id:'FORM-ANS-A', name:'\uC815\uB2F5\xB7\uD574\uC124 \uC785\uB825 \uC591\uC2DD', code:'ANS-A', targetSystems:['ALL'], fieldCount:5,
   fields:['\uBB38\uD56D\uBC88\uD638','\uC815\uB2F5','\uBC30\uC810','\uD574\uC124','\uBE44\uACE0'],
   fieldDefs:[{poolKey:'mainQ',title:'\uBB38\uD56D\uBC88\uD638',required:true},{poolKey:'answer_text',title:'\uC815\uB2F5',required:true},{poolKey:'scoring',title:'\uBC30\uC810',required:true},{poolKey:'explain',title:'\uD574\uC124',required:false},{poolKey:'memo',title:'\uBE44\uACE0',required:false}],
   status:'active', usedIn:2,
   updatedAt:'2026-04-12', author:'\uD64D\uAE38\uB3D9'},
  {id:'FORM-AN2-A', name:'\uC790\uB3D9\uCC44\uC810 \uC785\uB825 \uC591\uC2DD', code:'AN2-A', targetSystems:['ALL'], fieldCount:4,
   fields:['\uBB38\uD56D\uBC88\uD638','\uC815\uB2F5','\uBC30\uC810','\uB09C\uC774\uB3C4'], status:'active', usedIn:2,
   updatedAt:'2026-04-10', author:'\uAE40\uCCA0\uC218'},
  {id:'FORM-AN3-A', name:'\uC11C\uC220\uD615 \uCC44\uC810 \uC591\uC2DD', code:'AN3-A', targetSystems:['ALL'], fieldCount:6,
   fields:['\uBB38\uD56D','\uD0A4\uC6CC\uB4DC','\ubaa8\ubc94\ub2f5\uc548','\ubd80\ubd84\uc810\uc218','\ucc44\uc810\uae30\uc900','\ubd84\ub7c9\uc81c\ud55c'], status:'active', usedIn:1,
   updatedAt:'2026-04-08', author:'\uC774\uC601\uD76C'},
  {id:'FORM-FLC-A', name:'\uD50C\uB798\uC2DC\uCE74\uB4DC \uC785\uB825 \uC591\uC2DD', code:'FLC-A', targetSystems:['ND'], fieldCount:4,
   fields:['\uC55E\uBA74','\uB4B7\uBA74','\uC774\uBBF8\uC9C0','\uC74C\uC131'], status:'active', usedIn:1,
   updatedAt:'2026-04-05', author:'\uD64D\uAE38\uB3D9'},
  {id:'FORM-STDG-NH', name:'\uC601\uC0C1\uAC15\uC758 \uC785\uB825 \uC591\uC2DD', code:'STDG-NH', targetSystems:['NH'], fieldCount:6,
   fields:['\uAC15\uC758\uBA85','\uC601\uC0C1\uD30C\uC77C','\uAC15\uC758\uC2DC\uAC04','\uC378\uB124\uC77C','DRM','\uBE44\uACE0'], status:'active', usedIn:1,
   updatedAt:'2026-04-03', author:'\uAE40\uCCA0\uC218'},
  {id:'FORM-CBT-A', name:'\uD575\uC2EC\uC810\uAC80 \uC785\uB825 \uC591\uC2DD', code:'CBT-A', targetSystems:['ALL'], fieldCount:5,
   fields:['\uBB38\uD56D','\uBCF4\uAE30','\uC815\uB2F5','\uD574\uC124','\uB09C\uC774\uB3C4'], status:'active', usedIn:0,
   updatedAt:'2026-03-30', author:'\uC774\uC601\uD76C'},
  {id:'FORM-EVA-A', name:'\ud3c9\uac00 \ubb38\uc81c\uc9c0 \uc591\uc2dd', code:'EVA-A', targetSystems:['SJ'], fieldCount:5,
   fields:['\ud3c9\uac00\uba85','\ubb38\ud56d\uc9d1','\ubc30\uc810\ubc30\ubd84','\uc81c\ud55c\uc2dc\uac04','\ucc44\uc810\ubc29\uc2dd'], status:'draft', usedIn:0,
   updatedAt:'2026-03-28', author:'\uD64D\uAE38\uB3D9'},
  {id:'FORM-WEB-A', name:'\uC6F9 \uD559\uC2B5\uCF58\uD150\uCE20 \uC591\uC2DD', code:'WEB-A', targetSystems:['ETC'], fieldCount:3,
   fields:['\uD398\uC774\uC9C0\uBA85','HTML\uCF58\uD150\uCE20','\uCCA8\uBD80\uD30C\uC77C'], status:'draft', usedIn:0,
   updatedAt:'2026-03-25', author:'\uAE40\uCCA0\uC218'},
];

var BIND_STATE = {
  search: '',
  filterStatus: 'all',  // all | bound | unbound
  filterSystem: 'all',  // all | ND | NH | SJ | NH365
  selectedCurId: null,
  expandedBindKey: null, // 'CUR-001::M' format — expanded partial bind detail
  _showInfo: false      // collapsible info panel
};
var BIND_MODAL = { curId: null, search: '', category: 'all' };

// ═══ Form Editor State ═══
var FM_EDIT_STATE = {
  active: false,          // true when editor is open
  editId: null,           // null=new, 'FORM-xxx'=editing existing
  name: '',
  code: '',
  status: 'active',
  targetSystems: ['ALL'],
  fieldDefs: [],          // [{poolKey:'answer_text', title:'정답', required:true, _uid:1}, ...]
  poolFilter: 'all',      // category filter for field pool
  poolSearch: '',
  _uidCounter: 0,
};

// v8: Work items (type-as-depth) - curriculum-based (no subject code dependency)
// ═══ Work-config detail modal ═══
function _wcOpenDetail(curId) {
  WC_STATE.selectedCurId = curId;
  WC_ADD_STATE.active = false;
  _wcRenderDetailModal();
}

function _wcCloseDetail() {
  WC_STATE.selectedCurId = null;
  var ov = document.getElementById('wcDetailOverlay');
  if(ov) ov.remove();
}

function _wcRenderDetailModal() {
  var curId = WC_STATE.selectedCurId;
  if(!curId) return;
  var cur = (CURRICULUM_DATA||[]).find(function(c){ return c.id === curId; });
  if(!cur) return;
  var workItems = WORK_ITEMS_V7 || [];
  var curItems = workItems.filter(function(wi){ return wi.curriculumId === cur.id; });
  var totalDone = 0; var totalAll = 0;
  curItems.forEach(function(wi){ totalDone += wi.doneSets; totalAll += wi.totalSets; });
  var overallPct = totalAll > 0 ? Math.round(totalDone / totalAll * 100) : 0;
  var _svcMap = {};
  (SVC_CURRICULA||[]).forEach(function(sc){ _svcMap[sc.name] = sc; });
  var _svcCur = _svcMap[cur.name] || null;

  var overlay = document.getElementById('wcDetailOverlay');
  if(!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'wcDetailOverlay';
    document.body.appendChild(overlay);
  }

  var h = '';
  h += '<div onclick="_wcCloseDetail()" style="position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:9999;display:flex;align-items:center;justify-content:center">';
  h += '<div onclick="event.stopPropagation()" style="width:520px;max-height:80vh;background:#fff;border-radius:16px;box-shadow:0 25px 50px rgba(0,0,0,.25);display:flex;flex-direction:column;overflow:hidden">';

  // ── Modal Header ──
  h += '<div style="padding:20px 24px 12px;flex-shrink:0">';
  h += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">';
  h += '<span style="font-size:16px;font-weight:700;color:#1D1D1F;flex:1">' + cur.name + '</span>';
  if(cur.status === 'draft') h += '<span style="font-size:9px;padding:2px 7px;border-radius:5px;background:#FFF8F0;color:#B35C00;font-weight:600;border:1px solid #FFD9A8">\uCD08\uC548</span>';
  h += '<button onclick="_wcCloseDetail()" style="border:none;background:none;color:#8E8E93;font-size:18px;cursor:pointer;padding:0 4px">\u00D7</button>';
  h += '</div>';
  // Depth hierarchy
  if(cur.depths && cur.depths.length > 1) {
    h += '<div style="display:flex;align-items:center;gap:0;flex-wrap:wrap;margin-bottom:4px">';
    cur.depths.forEach(function(d, di) {
      if(di === 0) return;
      if(di > 1) h += '<span style="font-size:8px;color:#D1D1D6;margin:0 2px">\u203A</span>';
      var isSplit = (cur.splitDepth !== undefined && di === cur.splitDepth);
      h += '<span style="font-size:9px;padding:1px 5px;border-radius:3px;font-weight:' + (isSplit ? '700' : '500') + ';' + (isSplit ? 'background:#1D1D1F;color:#fff' : 'color:#8E8E93') + '">' + d.name;
      if(d.count !== null && d.count !== undefined) h += ' ' + d.count;
      h += '</span>';
    });
    h += '</div>';
  }
  // Overall progress
  if(curItems.length > 0) {
    h += '<div style="display:flex;align-items:center;gap:8px;margin-top:6px">';
    h += '<span style="font-size:10px;font-weight:600;color:#48484A">\uC804\uCCB4 \uC9C4\uD589\uB960</span>';
    h += '<div style="flex:1;height:4px;background:#E5E5EA;border-radius:2px;overflow:hidden"><div style="width:' + overallPct + '%;height:100%;background:' + (overallPct === 100 ? '#34C759' : '#0071E3') + ';border-radius:2px"></div></div>';
    h += '<span style="font-size:11px;font-weight:700;color:' + (overallPct === 100 ? '#34C759' : '#0071E3') + '">' + overallPct + '%</span>';
    h += '</div>';
  }
  h += '</div>';

  // ── Scrollable body ──
  h += '<div style="flex:1;overflow-y:auto;padding:0 24px 16px">';

  // Assignee rows — 2-line pattern with system color bar
  if(curItems.length > 0) {
    h += '<div style="font-size:10px;font-weight:600;color:#8E8E93;margin-bottom:6px">\uC791\uC5C5 \uBC30\uC815 (' + curItems.length + '\uAC74)</div>';
    h += '<div style="display:flex;flex-direction:column;gap:3px;margin-bottom:12px">';
    curItems.forEach(function(wi) {
      var pct = wi.totalSets > 0 ? Math.round(wi.doneSets / wi.totalSets * 100) : 0;
      var pc = wi.status === 'done' ? '#34C759' : wi.status === 'inprog' ? '#FF9500' : '#E5E5EA';
      var _mFm = FORM_TEMPLATES.find(function(f){ return f.id === wi.formId; });
      var _mSysColor = '#E5E5EA';
      if(_mFm && _mFm.targetSystems && _mFm.targetSystems.length > 0) {
        var _mSk = _mFm.targetSystems[0] === 'ALL' ? 'ND' : _mFm.targetSystems[0];
        var _mSc = WC_SYSTEM_COLORS[_mSk] || {color:'#48484A'};
        _mSysColor = _mSc.color;
      }
      h += '<div style="background:#FAFAFA;border:1px solid #F0F0F2;border-radius:6px;padding:6px 8px;border-left:3px solid ' + _mSysColor + '">';
      h += '<div style="display:flex;align-items:center;gap:5px;margin-bottom:2px">';
      h += '<span style="font-size:11px;font-weight:600;color:#1D1D1F;flex:1">' + (wi.formName||'') + '</span>';
      h += '<span style="font-size:9px;padding:1px 5px;border-radius:3px;background:#F5F5F7;color:#636366;font-weight:600">' + wi.rangeFrom + '~' + wi.rangeTo + '</span>';
      h += '<span style="font-size:9px;color:#8E8E93;flex-shrink:0">' + wi.doneSets + '/' + wi.totalSets + '</span>';
      h += '</div>';
      h += '<div style="display:flex;align-items:center;gap:6px">';
      h += '<div style="flex:1;height:3px;border-radius:2px;background:#E5E5EA;overflow:hidden">';
      h += '<div style="height:100%;width:' + pct + '%;background:' + pc + ';border-radius:2px"></div></div>';
      h += '<span style="font-size:9px;color:#636366;flex-shrink:0">' + (wi.assignee||'\uBBF8\uC9C0\uC815') + '</span>';
      h += '</div>';
      h += '</div>';
    });
    h += '</div>';
  }

  // Add work panel or button
  if(WC_ADD_STATE.active && WC_ADD_STATE.curId === cur.id) {
    h += _wcRenderAddPanel(cur);
  } else {
    h += '<div style="text-align:center;padding:4px 0 8px">';
    h += '<button onclick="_wcStartAdd(\'' + cur.id + '\');_wcRenderDetailModal()" style="padding:8px 24px;border:1px dashed #B3D7FF;border-radius:8px;background:#F0F9FF;font-size:11px;font-weight:600;color:#0071E3;cursor:pointer;transition:background .12s" onmouseenter="this.style.background=\'#E8F2FF\'" onmouseleave="this.style.background=\'#F0F9FF\'">+ \uC791\uC5C5 \uBC30\uC815</button>';
    h += '</div>';
  }

  h += '</div>';

  // ── Modal Footer ──
  h += '<div style="padding:10px 24px 16px;border-top:1px solid #F5F5F7;display:flex;align-items:center;gap:10px;flex-shrink:0">';
  if(_svcCur) {
    h += '<button onclick="_wcCloseDetail();switchView(\'service-content\')" style="padding:6px 14px;border:1px solid #E5E5EA;border-radius:8px;background:#fff;font-size:11px;font-weight:600;color:#636366;cursor:pointer">\uC11C\uBE44\uC2A4 \uD604\uD669</button>';
  }
  h += '<button onclick="_wcCloseDetail();_jumpToCurriculum(\'' + cur.id + '\')" style="padding:6px 14px;border:1px solid #E5E5EA;border-radius:8px;background:#fff;font-size:11px;font-weight:600;color:#636366;cursor:pointer">\uCEE4\uB9AC\uD058\uB7FC \uAD00\uB9AC</button>';
  h += '<span style="flex:1"></span>';
  h += '<button onclick="_wcCloseDetail()" style="padding:6px 18px;border:none;border-radius:8px;background:#0071E3;color:#fff;font-size:11px;font-weight:600;cursor:pointer">\uB2EB\uAE30</button>';
  h += '</div>';

  h += '</div></div>';
  overlay.innerHTML = h;
}

var WC_ADD_STATE = {
  active: false,
  curId: null,
  formId: null,
  formLabel: '',
  formTypeCode: '',
  rangeFrom: 1,
  rangeTo: 0,
  assignee: '',
};
var WC_ADD_COUNTER = 9;

// ── 외부 수신 데이터 (뉴드림스 상품admin 배치 동기화) ──
var BATCH_RECEIVE_DATA = [
  {id:'BR-001', productCode:'ND-M-2026', productName:'\uB274\uB4DC\uB9BC\uC2A4 \uC218\uD559 \uAE30\uCD08', subjectCode:'M', subjectName:'\uC218\uD559',
   hasProgress:true, syncDate:'2026-04-20',
   courses:[
     {code:'C-M01', name:'\uAE30\uCD08\uC218\uD559 1\uACFC\uC815', sets:10},
     {code:'C-M02', name:'\uAE30\uCD08\uC218\uD559 2\uACFC\uC815', sets:10},
     {code:'C-M03', name:'\uAE30\uCD08\uC218\uD559 3\uACFC\uC815', sets:10},
     {code:'C-M04', name:'\uAE30\uCD08\uC218\uD559 4\uACFC\uC815', sets:10},
     {code:'C-M05', name:'\uAE30\uCD08\uC218\uD559 5\uACFC\uC815', sets:10},
     {code:'C-M06', name:'\uAE30\uCD08\uC218\uD559 6\uACFC\uC815', sets:10},
     {code:'C-M07', name:'\uAE30\uCD08\uC218\uD559 7\uACFC\uC815', sets:10},
     {code:'C-M08', name:'\uAE30\uCD08\uC218\uD559 8\uACFC\uC815', sets:10}
   ],
   totalSets:80, status:'linked', linkedCurId:'CUR-001'},
  {id:'BR-002', productCode:'ND-E-2026', productName:'\uB274\uB4DC\uB9BC\uC2A4 \uC601\uC5B4 \uD68C\uD654', subjectCode:'E', subjectName:'\uC601\uC5B4',
   hasProgress:true, syncDate:'2026-04-22',
   courses:[
     {code:'C-E01', name:'\uD68C\uD654 1\uACFC\uC815', sets:10},
     {code:'C-E02', name:'\uD68C\uD654 2\uACFC\uC815', sets:10},
     {code:'C-E03', name:'\uD68C\uD654 3\uACFC\uC815', sets:10},
     {code:'C-E04', name:'\uD68C\uD654 4\uACFC\uC815', sets:10},
     {code:'C-E05', name:'\uD68C\uD654 5\uACFC\uC815', sets:10},
     {code:'C-E06', name:'\uD68C\uD654 6\uACFC\uC815', sets:10}
   ],
   totalSets:60, status:'linked', linkedCurId:'CUR-002'},
  {id:'BR-003', productCode:'ND-K-2026', productName:'\uB274\uB4DC\uB9BC\uC2A4 \uAD6D\uC5B4 \uAE30\uCD08', subjectCode:'K', subjectName:'\uAD6D\uC5B4',
   hasProgress:true, syncDate:'2026-04-25',
   courses:[
     {code:'C-K01', name:'\uAD6D\uC5B4 1\uACFC\uC815', sets:10},
     {code:'C-K02', name:'\uAD6D\uC5B4 2\uACFC\uC815', sets:10},
     {code:'C-K03', name:'\uAD6D\uC5B4 3\uACFC\uC815', sets:10},
     {code:'C-K04', name:'\uAD6D\uC5B4 4\uACFC\uC815', sets:10},
     {code:'C-K05', name:'\uAD6D\uC5B4 5\uACFC\uC815', sets:10}
   ],
   totalSets:50, status:'pending', linkedCurId:null},
  {id:'BR-004', productCode:'ND-MV-2026', productName:'\uB274\uB4DC\uB9BC\uC2A4 \uC218\uD559 \uC2EC\uD654', subjectCode:'MV', subjectName:'\uC218\uD559(\uC2EC\uD654)',
   hasProgress:false, syncDate:'2026-04-26',
   courses:[], totalSets:0, status:'pending', linkedCurId:null},
  {id:'BR-005', productCode:'NH-M-2026A', productName:'\uB208\uB192\uC774 \uC218\uD559 \uBCC0\uD615A', subjectCode:'M', subjectName:'\uC218\uD559',
   hasProgress:false, syncDate:'2026-04-27',
   courses:[], totalSets:0, status:'bound', linkedCurId:'CUR-001'},
];
var BATCH_STATE = {search:'', filterStatus:'all'};

var WORK_ITEMS_V7 = [
  {id:'WI-001', curriculumId:'CUR-001', depthType:'ANS', formId:'FORM-ANS-A', formName:'\uC815\uB2F5\xB7\uD574\uC124',
   currName:'\uC218\uD559 \uAE30\uCD08 \uACFC\uC815', assignee:'\uD64D\uAE38\uB3D9', rangeFrom:1, rangeTo:40,
   totalSets:40, doneSets:28, status:'inprog', phase:'register', priority:'normal', boundCode:'M', boundLabel:'\uC218\uD559'},
  {id:'WI-002', curriculumId:'CUR-001', depthType:'ANS', formId:'FORM-ANS-A', formName:'\uC815\uB2F5\xB7\uD574\uC124',
   currName:'\uC218\uD559 \uAE30\uCD08 \uACFC\uC815', assignee:'\uAE40\uCCA0\uC218', rangeFrom:41, rangeTo:80,
   totalSets:40, doneSets:40, status:'done', phase:'review', priority:'normal', boundCode:'M', boundLabel:'\uC218\uD559'},
  {id:'WI-003', curriculumId:'CUR-001', depthType:'AN2', formId:'FORM-AN2-A', formName:'\uC790\uB3D9\uCC44\uC810',
   currName:'\uC218\uD559 \uAE30\uCD08 \uACFC\uC815', assignee:'\uC774\uC601\uD76C', rangeFrom:1, rangeTo:80,
   totalSets:80, doneSets:55, status:'inprog', phase:'register', priority:'high', boundCode:'M', boundLabel:'\uC218\uD559'},
  {id:'WI-004', curriculumId:'CUR-002', depthType:'FLC', formId:'FORM-FLC-A', formName:'\uD50C\uB798\uC2DC\uCE74\uB4DC',
   currName:'\uC601\uC5B4 \uD68C\uD654 \uACFC\uC815', assignee:'\uD64D\uAE38\uB3D9', rangeFrom:1, rangeTo:60,
   totalSets:60, doneSets:45, status:'inprog', phase:'register', priority:'normal', boundCode:'E', boundLabel:'\uC601\uC5B4'},
  {id:'WI-005', curriculumId:'CUR-003', depthType:'STDG', formId:'FORM-STDG-NH', formName:'\uC601\uC0C1\uAC15\uC758',
   currName:'\uB0B4\uC2E0\uC644\uACF5 \uC601\uC0C1\uAC15\uC758', assignee:'\uD64D\uAE38\uB3D9', rangeFrom:1, rangeTo:25,
   totalSets:25, doneSets:10, status:'inprog', phase:'register', priority:'normal', boundCode:null, boundLabel:null},
  {id:'WI-007', curriculumId:'CUR-001', depthType:'CBT', formId:'FORM-CBT-A', formName:'\uD575\uC2EC\uC810\uAC80',
   currName:'\uC218\uD559 \uAE30\uCD08 \uACFC\uC815', assignee:'\uD64D\uAE38\uB3D9', rangeFrom:1, rangeTo:80,
   totalSets:80, doneSets:80, status:'done', phase:'deploy', priority:'normal', boundCode:'M', boundLabel:'\uC218\uD559'},
  {id:'WI-008', curriculumId:'CUR-002', depthType:'CBT', formId:'FORM-CBT-A', formName:'\uD575\uC2EC\uC810\uAC80',
   currName:'\uC601\uC5B4 \uD68C\uD654 \uACFC\uC815', assignee:'\uAE40\uCCA0\uC218', rangeFrom:1, rangeTo:60,
   totalSets:60, doneSets:60, status:'done', phase:'deploy', priority:'normal', boundCode:'E', boundLabel:'\uC601\uC5B4'},
  {id:'WI-006', curriculumId:'CUR-003', depthType:'STDG', formId:'FORM-STDG-NH', formName:'\uC601\uC0C1\uAC15\uC758',
   currName:'\uB0B4\uC2E0\uC644\uACF5 \uC601\uC0C1\uAC15\uC758', assignee:'\uC774\uC601\uD76C', rangeFrom:26, rangeTo:50,
   totalSets:25, doneSets:0, status:'idle', phase:'assign', priority:'normal', boundCode:null, boundLabel:null},
];



// ── Work-Config: 작업 배정 등록 ──
function _wcStartAdd(curId) {
  var cur = CURRICULUM_DATA.find(function(c){ return c.id === curId; });
  if(!cur) return;
  var forms = _curGetAllForms(cur);
  WC_ADD_STATE.active = true;
  WC_ADD_STATE.curId = curId;
  // 양식 1개면 자동선택
  if(forms.length === 1) {
    WC_ADD_STATE.formId = forms[0].formId;
    WC_ADD_STATE.formLabel = forms[0].label || '';
    WC_ADD_STATE.formTypeCode = forms[0].typeCode || '';
  } else {
    WC_ADD_STATE.formId = null;
    WC_ADD_STATE.formLabel = '';
    WC_ADD_STATE.formTypeCode = '';
  }
  WC_ADD_STATE.rangeFrom = 1;
  WC_ADD_STATE.rangeTo = cur.totalSets || 0;
  WC_ADD_STATE.assignee = '';
  renderWorkConfigView();
}

function _wcAddSelectForm(curId, formId) {
  var cur = CURRICULUM_DATA.find(function(c){ return c.id === curId; });
  if(!cur) return;
  var forms = _curGetAllForms(cur);
  var f = forms.find(function(x){ return x.formId === formId; });
  if(!f) return;
  WC_ADD_STATE.formId = formId;
  WC_ADD_STATE.formLabel = f.label || '';
  WC_ADD_STATE.formTypeCode = f.typeCode || '';
  renderWorkConfigView();
}

function _wcAddCancel() {
  WC_ADD_STATE.active = false;
  WC_ADD_STATE.curId = null;
  renderWorkConfigView();
}

function _wcAddConfirm() {
  if(!WC_ADD_STATE.formId || !WC_ADD_STATE.assignee) {
    alert('\uC591\uC2DD\uACFC \uB2F4\uB2F9\uC790\uB97C \uBAA8\uB450 \uC9C0\uC815\uD574\uC8FC\uC138\uC694.');
    return;
  }
  if(WC_ADD_STATE.rangeFrom > WC_ADD_STATE.rangeTo || WC_ADD_STATE.rangeFrom < 1) {
    alert('\uBC94\uC704\uB97C \uD655\uC778\uD574\uC8FC\uC138\uC694.');
    return;
  }
  var cur = CURRICULUM_DATA.find(function(c){ return c.id === WC_ADD_STATE.curId; });
  if(!cur) return;
  WC_ADD_COUNTER++;
  var newId = 'WI-' + String(WC_ADD_COUNTER).padStart(3, '0');
  var totalSets = WC_ADD_STATE.rangeTo - WC_ADD_STATE.rangeFrom + 1;
  // 바인딩 코드 (첫 번째 코드)
  var forms = _curGetAllForms(cur);
  var selF = forms.find(function(x){ return x.formId === WC_ADD_STATE.formId; });
  var bc = (selF && selF.boundCodes && selF.boundCodes.length) ? selF.boundCodes[0] : null;
  var bcLabel = bc && SUBJECT_COURSE_DATA[bc] ? SUBJECT_COURSE_DATA[bc].courseName : null;

  WORK_ITEMS_V7.push({
    id: newId,
    curriculumId: WC_ADD_STATE.curId,
    depthType: WC_ADD_STATE.formTypeCode || '',
    formId: WC_ADD_STATE.formId,
    formName: WC_ADD_STATE.formLabel,
    currName: cur.name,
    assignee: WC_ADD_STATE.assignee,
    rangeFrom: WC_ADD_STATE.rangeFrom,
    rangeTo: WC_ADD_STATE.rangeTo,
    totalSets: totalSets,
    doneSets: 0,
    status: 'idle',
    phase: 'assign',
    priority: 'normal',
    boundCode: bc,
    boundLabel: bcLabel
  });
  _syncWiToWorkflow();

  WC_ADD_STATE.active = false;
  WC_ADD_STATE.curId = null;
  renderWorkConfigView();
}

function _wcRenderAddPanel(cur) {
  var forms = _curGetAllForms(cur);
  var maxSets = cur.totalSets || 80;
  var h = '';
  h += '<div style="border-top:1px solid #B3D7FF;background:#F0F9FF;padding:14px 18px">';
  h += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">';
  h += '<span style="font-size:12px;font-weight:700;color:#0071E3">\uC0C8 \uC791\uC5C5 \uBC30\uC815</span>';
  h += '<button onclick="_wcAddCancel()" style="font-size:11px;padding:3px 10px;border:1px solid #E5E5EA;border-radius:5px;background:#fff;color:#636366;cursor:pointer">\uCDE8\uC18C</button>';
  h += '</div>';

  // ① 양식 선택
  h += '<div style="margin-bottom:10px">';
  h += '<div style="font-size:10px;font-weight:600;color:#636366;margin-bottom:5px">\u2460 \uC591\uC2DD \uC120\uD0DD</div>';
  h += '<div style="display:flex;gap:4px;flex-wrap:wrap">';
  forms.forEach(function(f) {
    var sel = WC_ADD_STATE.formId === f.formId;
    h += '<button onclick="_wcAddSelectForm(\'' + cur.id + '\',\'' + f.formId + '\')" style="font-size:11px;padding:5px 12px;border-radius:6px;border:1px solid ' + (sel ? '#0071E3' : '#E5E5EA') + ';background:' + (sel ? '#0071E3' : '#fff') + ';color:' + (sel ? '#fff' : '#48484A') + ';font-weight:' + (sel ? '700' : '500') + ';cursor:pointer;transition:all .12s">' + (f.label || f.formId) + '</button>';
  });
  h += '</div></div>';

  // ② 범위 지정
  h += '<div style="margin-bottom:10px;display:flex;gap:10px;align-items:center">';
  h += '<div style="font-size:10px;font-weight:600;color:#636366;min-width:60px">\u2461 \uBC94\uC704</div>';
  h += '<input type="number" value="' + WC_ADD_STATE.rangeFrom + '" min="1" max="' + maxSets + '" onchange="WC_ADD_STATE.rangeFrom=parseInt(this.value)||1" style="width:70px;padding:5px 8px;border:1px solid #E5E5EA;border-radius:6px;font-size:12px;text-align:center">';
  h += '<span style="font-size:11px;color:#8E8E93">~</span>';
  h += '<input type="number" value="' + WC_ADD_STATE.rangeTo + '" min="1" max="' + maxSets + '" onchange="WC_ADD_STATE.rangeTo=parseInt(this.value)||1" style="width:70px;padding:5px 8px;border:1px solid #E5E5EA;border-radius:6px;font-size:12px;text-align:center">';
  h += '<span style="font-size:10px;color:#8E8E93">(\uC804\uCCB4 ' + maxSets + ')</span>';
  h += '</div>';

  // ③ 담당자
  h += '<div style="margin-bottom:12px;display:flex;gap:10px;align-items:center">';
  h += '<div style="font-size:10px;font-weight:600;color:#636366;min-width:60px">\u2462 \uB2F4\uB2F9\uC790</div>';
  h += '<input type="text" value="' + (WC_ADD_STATE.assignee || '') + '" placeholder="\uC774\uB984 \uC785\uB825" oninput="WC_ADD_STATE.assignee=this.value" style="width:120px;padding:5px 10px;border:1px solid #E5E5EA;border-radius:6px;font-size:12px">';
  h += '</div>';

  // 확인 버튼
  h += '<div style="display:flex;justify-content:flex-end">';
  h += '<button onclick="_wcAddConfirm()" style="padding:6px 20px;border:none;border-radius:7px;background:#0071E3;color:#fff;font-size:12px;font-weight:700;cursor:pointer;transition:opacity .12s" onmouseenter="this.style.opacity=\'.85\'" onmouseleave="this.style.opacity=\'1\'">\uC791\uC5C5 \uC0DD\uC131</button>';
  h += '</div>';
  h += '</div>';
  return h;
}

function renderWorkConfigView() {
  var root = document.getElementById('wcRoot');
  if(!root) return;

  var curricula = CURRICULUM_DATA || [];
  var workItems = WORK_ITEMS_V7 || [];
  var selCurId = WC_STATE.selectedCurId;
  var findOpen = WC_STATE.findOpen;
  var q = WC_STATE.searchQuery ? WC_STATE.searchQuery.toLowerCase() : '';

  // 서비스 중 버전 매핑
  var _svcMap = {};
  (SVC_CURRICULA || []).forEach(function(sc) { _svcMap[sc.name] = sc; });

  // 진행 중인 작업이 있는 커리큘럼
  var activeCurs = [];
  curricula.forEach(function(c) {
    var wi = workItems.filter(function(w){ return w.curriculumId === c.id; });
    if(wi.length > 0) activeCurs.push({cur:c, items:wi});
  });

  var h = '';
  h += '<div style="display:flex;flex-direction:column;height:100%;overflow:hidden">';

  h += _renderStepIndicator('work-config');

  // ══ Compact Header ══
  h += '<div style="padding:12px 24px;border-bottom:1px solid #E5E5EA;background:#fff;flex-shrink:0">';

  // Row 1: title + stats
  h += '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">';
  h += '<div style="font-size:15px;font-weight:600;color:#1D1D1F;letter-spacing:-.02em">\uC791\uC5C5 \uC124\uC815</div>';
  h += '<div style="font-size:11px;color:#8E8E93">\uCEE4\uB9AC\uD058\uB7FC\uC744 \uCC3E\uC544 \uC791\uC5C5\uC744 \uBC30\uC815\uD569\uB2C8\uB2E4</div>';
  h += '<div style="margin-left:auto;display:flex;gap:6px;align-items:center">';
  h += '<span style="font-size:11px;padding:3px 8px;border-radius:5px;background:#F5F5F7;color:#48484A;font-weight:600">' + curricula.length + '\uAC1C \uCEE4\uB9AC\uD058\uB7FC</span>';
  h += '<span style="font-size:11px;padding:3px 8px;border-radius:5px;background:#E8F2FF;color:#0071E3;font-weight:600;border:1px solid #B3D7FF">' + activeCurs.length + ' \uC791\uC5C5 \uC9C4\uD589</span>';
  h += '</div></div>';

  // Row 2: search + filter dropdowns
  h += '<div style="display:flex;align-items:center;gap:8px">';

  // 검색 입력
  h += '<div style="flex:1;position:relative">';
  h += '<svg viewBox="0 0 24 24" fill="none" stroke="#AEAEB2" stroke-width="2" style="width:14px;height:14px;position:absolute;left:10px;top:50%;transform:translateY(-50%)"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';
  h += '<input type="text" placeholder="\uCEE4\uB9AC\uD058\uB7FC\uBA85, \uC591\uC2DD\uBA85 \uAC80\uC0C9..." value="' + (WC_STATE.searchQuery||'') + '" oninput="WC_STATE.searchQuery=this.value;renderWorkConfigView()" style="width:100%;padding:7px 12px 7px 32px;border:1px solid #E5E5EA;border-radius:8px;font-size:12px;outline:none;box-sizing:border-box;transition:border-color .15s" onfocus="this.style.borderColor=\'#0071E3\'" onblur="this.style.borderColor=\'#E5E5EA\'">';
  h += '</div>';

  // 과목 필터
  var _wcSubjects = {};
  curricula.forEach(function(c) {
    _getCurBoundCodes(c).forEach(function(bc) {
      var scd = SUBJECT_COURSE_DATA[bc];
      if(scd) _wcSubjects[bc] = scd.courseName;
    });
  });
  h += '<div style="display:flex;align-items:center;gap:4px">';
  h += '<span style="font-size:11px;color:#8E8E93;font-weight:500;white-space:nowrap">\uACFC\uBAA9</span>';
  h += '<select onchange="WC_STATE.filterSubject=this.value;renderWorkConfigView()" style="padding:6px 24px 6px 8px;border:1px solid #E5E5EA;border-radius:7px;font-size:11px;color:#1D1D1F;background:#fff;outline:none;cursor:pointer;appearance:auto;min-width:80px">';
  h += '<option value="all"' + (WC_STATE.filterSubject==='all'?' selected':'') + '>\uC804\uCCB4</option>';
  Object.keys(_wcSubjects).forEach(function(k) {
    h += '<option value="' + k + '"' + (WC_STATE.filterSubject===k?' selected':'') + '>' + k + ' ' + _wcSubjects[k] + '</option>';
  });
  h += '</select></div>';

  // 시스템 필터
  h += '<div style="display:flex;align-items:center;gap:4px">';
  h += '<span style="font-size:11px;color:#8E8E93;font-weight:500;white-space:nowrap">\uC2DC\uC2A4\uD15C</span>';
  h += '<select onchange="WC_STATE.filterSystem=this.value;renderWorkConfigView()" style="padding:6px 24px 6px 8px;border:1px solid #E5E5EA;border-radius:7px;font-size:11px;color:#1D1D1F;background:#fff;outline:none;cursor:pointer;appearance:auto;min-width:80px">';
  h += '<option value="all"' + (WC_STATE.filterSystem==='all'?' selected':'') + '>\uC804\uCCB4</option>';
  ['ND','NH','SJ','NH365'].forEach(function(sk) {
    var sc = WC_SYSTEM_COLORS[sk] || {label:sk};
    h += '<option value="' + sk + '"' + (WC_STATE.filterSystem===sk?' selected':'') + '>' + sc.label + '</option>';
  });
  h += '</select></div>';

  // 작업 상태 필터
  h += '<div style="display:flex;align-items:center;gap:4px">';
  h += '<span style="font-size:11px;color:#8E8E93;font-weight:500;white-space:nowrap">\uC0C1\uD0DC</span>';
  h += '<select onchange="WC_STATE.filterWork=this.value;renderWorkConfigView()" style="padding:6px 24px 6px 8px;border:1px solid #E5E5EA;border-radius:7px;font-size:11px;color:#1D1D1F;background:#fff;outline:none;cursor:pointer;appearance:auto;min-width:80px">';
  h += '<option value="all"' + (WC_STATE.filterWork==='all'?' selected':'') + '>\uC804\uCCB4</option>';
  h += '<option value="active"' + (WC_STATE.filterWork==='active'?' selected':'') + '>\uC791\uC5C5 \uC9C4\uD589</option>';
  h += '<option value="none"' + (WC_STATE.filterWork==='none'?' selected':'') + '>\uBBF8\uBC30\uC815</option>';
  h += '</select></div>';

  h += '</div>';

  // Row 3: 선택된 필터 칩 (활성 필터가 있을 때만)
  var _hasFilter = WC_STATE.filterSubject !== 'all' || WC_STATE.filterSystem !== 'all' || WC_STATE.filterWork !== 'all' || (WC_STATE.searchQuery && WC_STATE.searchQuery.length > 0);
  if(_hasFilter) {
    h += '<div style="display:flex;align-items:center;gap:6px;margin-top:8px">';
    h += '<span style="font-size:11px;font-weight:600;color:#48484A">\uC120\uD0DD\uB41C \uD544\uD130</span>';
    h += '<span onclick="WC_STATE.filterSubject=\'all\';WC_STATE.filterSystem=\'all\';WC_STATE.filterWork=\'all\';WC_STATE.searchQuery=\'\';renderWorkConfigView()" style="font-size:10px;color:#8E8E93;cursor:pointer;text-decoration:underline">\uCD08\uAE30\uD654</span>';
    if(WC_STATE.searchQuery) {
      h += '<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:980px;background:#F5F5F7;border:1px solid #E5E5EA;font-size:10px;color:#636366">\uAC80\uC0C9: ' + WC_STATE.searchQuery + ' <span onclick="event.stopPropagation();WC_STATE.searchQuery=\'\';renderWorkConfigView()" style="cursor:pointer;color:#AEAEB2;font-weight:700">\u00D7</span></span>';
    }
    if(WC_STATE.filterSubject !== 'all') {
      var _fsl = _wcSubjects[WC_STATE.filterSubject] || WC_STATE.filterSubject;
      h += '<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:980px;background:#F5F5F7;border:1px solid #E5E5EA;font-size:10px;color:#636366">\uACFC\uBAA9: ' + WC_STATE.filterSubject + ' ' + _fsl + ' <span onclick="event.stopPropagation();WC_STATE.filterSubject=\'all\';renderWorkConfigView()" style="cursor:pointer;color:#AEAEB2;font-weight:700">\u00D7</span></span>';
    }
    if(WC_STATE.filterSystem !== 'all') {
      var _fsc = WC_SYSTEM_COLORS[WC_STATE.filterSystem] || {label:WC_STATE.filterSystem};
      h += '<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:980px;background:#F5F5F7;border:1px solid #E5E5EA;font-size:10px;color:#636366">\uC2DC\uC2A4\uD15C: ' + _fsc.label + ' <span onclick="event.stopPropagation();WC_STATE.filterSystem=\'all\';renderWorkConfigView()" style="cursor:pointer;color:#AEAEB2;font-weight:700">\u00D7</span></span>';
    }
    if(WC_STATE.filterWork !== 'all') {
      var _fwl = WC_STATE.filterWork === 'active' ? '\uC791\uC5C5 \uC9C4\uD589' : '\uBBF8\uBC30\uC815';
      h += '<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:980px;background:#F5F5F7;border:1px solid #E5E5EA;font-size:10px;color:#636366">\uC0C1\uD0DC: ' + _fwl + ' <span onclick="event.stopPropagation();WC_STATE.filterWork=\'all\';renderWorkConfigView()" style="cursor:pointer;color:#AEAEB2;font-weight:700">\u00D7</span></span>';
    }
    h += '</div>';
  }

  h += '</div>'; // close header

  // ══ Main content ══
  h += '<div style="flex:1;overflow-y:auto;padding:20px 24px">';

  // ══ 필터 적용된 커리큘럼 카드 목록 ══
  var _wcFiltered = curricula.filter(function(c) {
    // 커리큘럼 상태 게이트: active만 표시
    if(c.status !== 'active') return false;
    // 텍스트 검색
    if(q) {
      var match = c.name.toLowerCase().indexOf(q) >= 0 || c.id.toLowerCase().indexOf(q) >= 0;
      _curGetAllForms(c).forEach(function(f) { if((f.label||'').toLowerCase().indexOf(q) >= 0) match = true; });
      if(!match) return false;
    }
    // 과목 필터
    if(WC_STATE.filterSubject !== 'all') {
      if(_getCurBoundCodes(c).indexOf(WC_STATE.filterSubject) < 0) return false;
    }
    // 시스템 필터
    if(WC_STATE.filterSystem !== 'all') {
      var _hasSys = false;
      _curGetAllForms(c).forEach(function(fb) {
        var fm = FORM_TEMPLATES.find(function(f){ return f.id === fb.formId; });
        if(fm && fm.targetSystems && fm.targetSystems.indexOf(WC_STATE.filterSystem) >= 0) _hasSys = true;
      });
      if(!_hasSys) return false;
    }
    // 작업 상태 필터
    if(WC_STATE.filterWork !== 'all') {
      var _cWi = workItems.filter(function(w){ return w.curriculumId === c.id; });
      if(WC_STATE.filterWork === 'active' && _cWi.length === 0) return false;
      if(WC_STATE.filterWork === 'none' && _cWi.length > 0) return false;
    }
    return true;
  });

  if(_wcFiltered.length > 0) {
    h += '<div style="margin-bottom:12px;display:flex;align-items:center;gap:8px">';
    h += '<span style="font-size:12px;font-weight:600;color:#1D1D1F">' + _wcFiltered.length + '\uAC1C \uCEE4\uB9AC\uD058\uB7FC</span>';
    if(_wcFiltered.length < curricula.length) h += '<span style="font-size:11px;color:#8E8E93">/ \uC804\uCCB4 ' + curricula.length + '</span>';
    h += '</div>';
    h += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;align-items:start">';
    _wcFiltered.forEach(function(c) {
      var isSel = c.id === selCurId;
      var cItems = workItems.filter(function(w){ return w.curriculumId === c.id; });
      var tDone = 0; var tAll = 0;
      cItems.forEach(function(w){ tDone += w.doneSets; tAll += w.totalSets; });
      var pct = tAll > 0 ? Math.round(tDone / tAll * 100) : 0;
      var allDone = cItems.length > 0 && cItems.every(function(w){ return w.status === 'done'; });
      var borderColor = allDone ? '#A8E6B8' : pct > 0 ? '#B3D7FF' : '#E5E5EA';

      h += '<div onclick="_wcOpenDetail(\'' + c.id + '\')" style="';
      h += 'background:#fff;border-radius:12px;border:1px solid ' + borderColor + ';';
      h += 'overflow:hidden;cursor:pointer;transition:all .15s" ';
      h += 'onmouseenter="this.style.boxShadow=\'0 2px 12px rgba(0,0,0,.06)\'" ';
      h += 'onmouseleave="this.style.boxShadow=\'none\'">';

      h += _renderCurCardTop(c, {workItems: workItems, svcMap: _svcMap});

      h += '</div>';
    });
    h += '</div>';
    h += '</div>';
  }

  h += '</div>';  // close scroll container
  h += _renderStepCta('work-config');
  h += '</div>';  // close flex-col
  root.innerHTML = h;
}

// ═══ 공용 커리큘럼 카드 상단 헬퍼 (모든 뷰에서 재사용) ═══
function _renderCurCardTop(cur, opts) {
  if(!opts) opts = {};
  var workItems = opts.workItems || [];
  var _svcMap = opts.svcMap || {};
  var curItems = workItems.filter(function(wi){ return wi.curriculumId === cur.id; });
  var _svcCur = _svcMap[cur.name] || null;
  var _wcAllForms = _curGetAllForms(cur);

  var totalDone = 0; var totalAll = 0;
  curItems.forEach(function(wi){ totalDone += wi.doneSets; totalAll += wi.totalSets; });
  var overallPct = totalAll > 0 ? Math.round(totalDone / totalAll * 100) : 0;
  var prgColor = overallPct === 100 ? '#34C759' : overallPct > 0 ? '#FF9500' : '#E5E5EA';

  var h = '';
  h += '<div style="padding:10px 14px 8px">';
  h += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">';
  h += '<span style="font-size:13px;font-weight:600;color:#1D1D1F;flex:1">' + cur.name + '</span>';
  h += '<span style="font-size:9px;padding:2px 6px;border-radius:4px;background:' + (cur.status === 'active' ? '#F0FFF4;color:#1B8A3E;border:1px solid #A8E6B8' : '#FFF8F0;color:#B35C00;border:1px solid #FFD9A8') + ';font-weight:600">' + (cur.status === 'active' ? '\uD65C\uC131' : '\uCD08\uC548') + '</span>';
  if(_svcCur) {
    h += '<span style="font-size:9px;padding:2px 6px;border-radius:4px;background:#F0FFF4;color:#1B8A3E;font-weight:600;border:1px solid #A8E6B8">' + _svcCur.currentVersion + '</span>';
  }
  h += '</div>';

  // 과목 · 학년 라인
  var _metaParts = [];
  if(cur.subject) _metaParts.push(cur.subject);
  if(cur.grade) _metaParts.push(cur.grade);
  if(_metaParts.length > 0) {
    h += '<div style="display:flex;align-items:center;gap:4px;margin-bottom:4px">';
    _metaParts.forEach(function(mp) {
      h += '<span style="font-size:10px;padding:1px 6px;border-radius:4px;background:#F5F5F7;color:#636366;font-weight:500">' + mp + '</span>';
    });
    if(cur.eduCurriculum) h += '<span style="font-size:9px;color:#AEAEB2">' + cur.eduCurriculum + '</span>';
    h += '</div>';
  }

  if(cur.depths && cur.depths.length > 1) {
    h += '<div style="font-size:9px;color:#8E8E93;line-height:1.4;margin-bottom:6px">';
    var parts = [];
    for(var di = 1; di < cur.depths.length; di++) {
      var d = cur.depths[di];
      if(d.count === null || d.count === undefined) continue;
      var isSplit = (cur.splitDepth !== undefined && di === cur.splitDepth);
      if(isSplit) {
        parts.push('<span style="background:#1D1D1F;color:#fff;padding:1px 5px;border-radius:3px;font-weight:600">' + d.name + ' ' + d.count + '</span>');
      } else {
        parts.push(d.name + ' ' + d.count);
      }
    }
    h += parts.join(' <span style="color:#D1D1D6">\u203A</span> ');
    h += '</div>';
  }

  if(curItems.length > 0) {
    h += '<div style="display:flex;align-items:center;gap:6px">';
    h += '<div style="flex:1;height:3px;border-radius:2px;background:#F5F5F7;overflow:hidden">';
    h += '<div style="height:100%;width:' + overallPct + '%;background:' + prgColor + ';border-radius:2px"></div></div>';
    h += '<span style="font-size:9px;font-weight:600;color:' + (prgColor === '#E5E5EA' ? '#D1D1D6' : prgColor) + '">' + overallPct + '%</span>';
    h += '</div>';
  }
  h += '</div>';

  if(_wcAllForms.length > 0) {
    h += '<div style="padding:0 8px 8px;display:flex;flex-direction:column;gap:3px">';
    _wcAllForms.forEach(function(fb) {
      var fm = FORM_TEMPLATES.find(function(f){ return f.id === fb.formId; });
      var fName = fb.label || (fm ? fm.name : '?');
      var fItems = curItems.filter(function(wi){ return wi.formId === fb.formId; });
      var fDone = 0; var fTotal = 0;
      fItems.forEach(function(wi){ fDone += wi.doneSets; fTotal += wi.totalSets; });
      var fPct = fTotal > 0 ? Math.round(fDone / fTotal * 100) : 0;
      var fSt = fItems.length === 0 ? 'none' : (fItems.every(function(w){ return w.status === 'done'; }) ? 'done' : 'inprog');
      var pc = fSt === 'done' ? '#34C759' : fSt === 'inprog' ? '#FF9500' : '#E5E5EA';

      var sysColor = '#E5E5EA';
      if(fm && fm.targetSystems && fm.targetSystems.length > 0) {
        var sk = fm.targetSystems[0] === 'ALL' ? 'ND' : fm.targetSystems[0];
        var sc = WC_SYSTEM_COLORS[sk] || {color:'#48484A'};
        sysColor = sc.color;
      }

      h += '<div style="background:#FAFAFA;border:1px solid #F0F0F2;border-radius:6px;padding:6px 8px;border-left:3px solid ' + sysColor + '">';
      h += '<div style="display:flex;align-items:center;gap:5px;margin-bottom:2px">';
      h += '<span style="font-size:11px;font-weight:600;color:#1D1D1F;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + fName + '</span>';
      if(fSt === 'none') {
        h += '<span style="font-size:9px;color:#AEAEB2">\uBBF8\uBC30\uC815</span>';
      } else {
        h += '<span style="font-size:9px;color:#8E8E93;flex-shrink:0">' + fDone + '/' + fTotal + '</span>';
      }
      h += '</div>';
      if(fSt !== 'none') {
        h += '<div style="display:flex;align-items:center;gap:6px">';
        h += '<div style="flex:1;height:3px;border-radius:2px;background:#E5E5EA;overflow:hidden">';
        h += '<div style="height:100%;width:' + fPct + '%;background:' + pc + ';border-radius:2px"></div></div>';
        var _names = {};
        fItems.forEach(function(wi){ _names[wi.assignee || '?'] = true; });
        var nameList = Object.keys(_names);
        h += '<span style="font-size:9px;color:#636366;flex-shrink:0">' + nameList.join(', ') + '</span>';
        h += '</div>';
      }
      h += '</div>';
    });
    h += '</div>';
  }

  return h;
}


// (6-step process functions — used internally by work-config view)
function processGoToStep(step) {
  PROCESS_STATE.currentStep = step;
  renderWorkConfigView();
}

function processNextStep() {
  if(PROCESS_STATE.currentStep < 6) {
    PROCESS_STATE.currentStep++;
    renderWorkConfigView();
  }
}
function processPrevStep() {
  if(PROCESS_STATE.currentStep > 1) {
    PROCESS_STATE.currentStep--;
    renderWorkConfigView();
  }
}

function renderProcessStep(step) {
  const el = document.getElementById('processStepContent');
  if(!el) return;

  switch(step) {
    case 1: el.innerHTML = _renderStep1_Code(); break;
    case 2: el.innerHTML = _renderStep2_Organize(); break;
    case 3: el.innerHTML = _renderStep3_Select(); break;
    case 4: el.innerHTML = _renderStep4_Customize(); break;
    case 5: el.innerHTML = _renderStep5_Assign(); break;
    case 6: el.innerHTML = _renderStep6_Register(); break;
  }
}

// ── STEP 1: 코드 (과목코드 수신/선택) ──
function _renderStep1_Code() {
  const PS = PROCESS_STATE;
  const subjects = Object.entries(SUBJECT_TYPE_MAP);
  const selCode = PS.selectedSubjectCode;
  const selInfo = selCode ? SUBJECT_TYPE_MAP[selCode] : null;
  const selName = selCode ? (_SUBJECT_NAME_MAP[selCode] || selCode) : '';

  // 과목별 작업 현황 집계
  function getSubjectWorkSummary(code) {
    const wts = getWorkTypes(code);
    const total = wts.length;
    const configured = wts.filter(w => w.status !== 'idle').length;
    const done = wts.filter(w => w.status === 'done' || w.status === 'live').length;
    return {total, configured, done};
  }

  return '<div style="padding:24px">' +
    '<div style="display:flex;align-items:center;gap:10px;margin-bottom:20px">' +
      '<span style="font-size:22px">📋</span>' +
      '<div>' +
        '<div style="font-size:16px;font-weight:600;color:#1D1D1F">STEP 1 — 과목 코드 선택</div>' +
        '<div style="font-size:13px;color:#636366;margin-top:3px">배치 수신 또는 직접 등록된 과목 코드를 선택하세요</div>' +
      '</div>' +
    '</div>' +

    // 과목 코드 그리드
    '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px;margin-bottom:24px">' +
      subjects.map(function(entry) {
        var code = entry[0];
        var info = entry[1];
        var name = _SUBJECT_NAME_MAP[code] || code;
        var isSel = code === selCode;
        var summary = getSubjectWorkSummary(code);
        var systems = [];
        var wts = getWorkTypes(code);
        wts.forEach(function(w) { if(systems.indexOf(w.systemId) < 0) systems.push(w.systemId); });
        var pct = summary.total > 0 ? Math.round(summary.done / summary.total * 100) : 0;

        return '<div onclick="PROCESS_STATE.selectedSubjectCode=\'' + code + '\';renderWorkflowView()" ' +
          'style="padding:14px 16px;border-radius:10px;border:2px solid ' + (isSel ? '#0071E3' : '#E5E5EA') +
          ';background:' + (isSel ? '#E8F2FF' : '#fff') + ';cursor:pointer;transition:all .15s" ' +
          'onmouseenter="if(!' + isSel + ')this.style.borderColor=\'#B3D7FF\'" onmouseleave="if(!' + isSel + ')this.style.borderColor=\'#E5E5EA\'">' +
          '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">' +
            '<div style="width:38px;height:38px;border-radius:8px;background:' + (isSel ? '#0071E3' : '#F5F5F7') +
            ';display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:600;color:' + (isSel ? '#fff' : '#48484A') + '">' + code + '</div>' +
            '<div style="flex:1;min-width:0">' +
              '<div style="font-size:14px;font-weight:700;color:#1D1D1F;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + name + '</div>' +
              '<div style="font-size:11px;color:#8E8E93;margin-top:1px">' + info.types.length + '개 콘텐츠 템플릿 · ' + systems.length + '개 시스템</div>' +
            '</div>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">' +
            systems.map(function(sid) {
              var sys = LINKED_SYSTEMS[sid];
              return '<span style="font-size:10px;padding:2px 7px;border-radius:4px;background:' + sys.bg + ';color:' + sys.color + ';font-weight:600">' + sys.icon + ' ' + sys.name + '</span>';
            }).join('') +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:8px">' +
            '<div style="flex:1;height:4px;background:#E5E5EA;border-radius:2px;overflow:hidden"><div style="height:100%;width:' + pct + '%;background:' + (pct === 100 ? '#34C759' : '#0071E3') + ';border-radius:2px;transition:width .3s"></div></div>' +
            '<span style="font-size:11px;font-weight:700;color:' + (pct === 100 ? '#34C759' : '#636366') + '">' + pct + '%</span>' +
          '</div>' +
        '</div>';
      }).join('') +
    '</div>' +

    // 선택된 과목 상세
    (selCode ? (
      '<div style="background:#FAFAFA;border-radius:10px;padding:18px 20px;border:1px solid #E5E5EA">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">' +
          '<div style="font-size:14px;font-weight:700;color:#1D1D1F">선택됨: <span style="color:#0071E3">[' + selName + '] ' + selCode + '</span></div>' +
          '<button class="btn btn-primary btn-sm" onclick="processNextStep()" style="font-size:13px;padding:8px 20px">다음: 템플릿 정리 →</button>' +
        '</div>' +
        '<div style="font-size:12px;color:#636366">' +
          '등록된 콘텐츠 템플릿: ' + selInfo.types.map(function(t) {
            var ct = CONTENT_TYPES[t];
            return '<span style="display:inline-flex;align-items:center;gap:3px;padding:3px 8px;border-radius:5px;background:#fff;border:1px solid #E5E5EA;font-size:11px;font-weight:600;margin:2px">' + (ct ? ct.icon : '') + ' ' + (ct ? ct.label : t) + ' [' + t + ']</span>';
          }).join('') +
        '</div>' +
        (selInfo.children && selInfo.children.length > 0 ?
          '<div style="font-size:11px;color:#8E8E93;margin-top:8px">하위 과목: ' + selInfo.children.map(function(c) { return (_CHILD_NAMES[c] || c) + ' (' + c + ')'; }).join(', ') + '</div>' : '') +
      '</div>'
    ) : '<div style="text-align:center;padding:40px;color:#8E8E93;font-size:14px">과목 코드를 선택하면 다음 단계로 진행할 수 있습니다</div>') +
  '</div>';
}

// ── STEP 2: 코드 유형정리 ──
function _renderStep2_Organize() {
  var PS = PROCESS_STATE;
  var code = PS.selectedSubjectCode;
  if(!code) return '<div style="padding:40px;text-align:center;color:#8E8E93">먼저 STEP 1에서 과목 코드를 선택하세요</div>';

  var name = _SUBJECT_NAME_MAP[code] || code;
  var wts = getWorkTypes(code);

  // 시스템별 그룹핑
  var bySystem = {};
  wts.forEach(function(w) {
    if(!bySystem[w.systemId]) bySystem[w.systemId] = [];
    bySystem[w.systemId].push(w);
  });

  var html = '<div style="padding:24px">';
  html += '<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">';
  html += '<span style="font-size:22px">🗂</span>';
  html += '<div>';
  html += '<div style="font-size:16px;font-weight:600;color:#1D1D1F">STEP 2 — 작업 유형 정리</div>';
  html += '<div style="font-size:13px;color:#636366;margin-top:3px">[' + name + '] ' + code + '의 시스템별 작업 유형을 확인합니다</div>';
  html += '</div>';
  html += '<button class="btn btn-ghost btn-sm" onclick="processPrevStep()" style="margin-left:auto">← 이전</button>';
  html += '<button class="btn btn-primary btn-sm" onclick="processNextStep()">다음 →</button>';
  html += '</div>';

  html += '<div style="margin-top:16px;display:flex;flex-direction:column;gap:14px">';

  Object.entries(bySystem).forEach(function(entry) {
    var sysId = entry[0];
    var sysWts = entry[1];
    var sys = LINKED_SYSTEMS[sysId];

    html += '<div style="background:#fff;border-radius:10px;border:1px solid #E5E5EA;overflow:hidden">';
    html += '<div style="padding:14px 18px;background:' + sys.bg + ';border-bottom:1px solid #E5E5EA;display:flex;align-items:center;gap:8px">';
    html += '<span style="font-size:16px">' + sys.icon + '</span>';
    html += '<span style="font-size:14px;font-weight:700;color:' + sys.color + '">' + sys.name + '</span>';
    html += '<span style="font-size:12px;color:#8E8E93;margin-left:auto">' + sysWts.length + '개 작업 유형</span>';
    html += '</div>';

    html += '<div style="padding:12px 16px;display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px">';
    sysWts.forEach(function(w) {
      var ct = CONTENT_TYPES[w.typeCode];
      var stColor = w.status === 'live' ? '#34C759' : w.status === 'done' ? '#0071E3' : w.status === 'inprog' ? '#FF9500' : '#8E8E93';
      var stLabel = w.status === 'live' ? '서비스중' : w.status === 'done' ? '완료' : w.status === 'inprog' ? '작업중' : '대기';
      html += '<div style="display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:8px;background:#FAFAFA;border:1px solid #E5E5EA">';
      html += '<span style="font-size:16px">' + (ct ? ct.icon : '📄') + '</span>';
      html += '<div style="flex:1;min-width:0">';
      html += '<div style="font-size:13px;font-weight:600;color:#1D1D1F;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + (ct ? ct.label : w.typeCode) + '</div>';
      html += '<div style="font-size:10px;color:#8E8E93">[' + w.typeCode + '] ' + (ct ? ct.group : '') + '</div>';
      html += '</div>';
      html += '<span style="font-size:10px;padding:2px 6px;border-radius:3px;background:' + stColor + '1a;color:' + stColor + ';font-weight:700">' + stLabel + '</span>';
      html += '</div>';
    });
    html += '</div></div>';
  });

  html += '</div></div>';
  return html;
}

// ── STEP 3: 선택 ──
function _renderStep3_Select() {
  var PS = PROCESS_STATE;
  var code = PS.selectedSubjectCode;
  if(!code) return '<div style="padding:40px;text-align:center;color:#8E8E93">먼저 STEP 1에서 과목 코드를 선택하세요</div>';

  var name = _SUBJECT_NAME_MAP[code] || code;
  var wts = getWorkTypes(code);
  var selected = PS.selectedWorkTypes;

  var html = '<div style="padding:24px">';
  html += '<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">';
  html += '<span style="font-size:22px">✅</span>';
  html += '<div>';
  html += '<div style="font-size:16px;font-weight:600;color:#1D1D1F">STEP 3 — 작업 유형 선택</div>';
  html += '<div style="font-size:13px;color:#636366;margin-top:3px">이번에 작업할 유형을 선택하세요 (복수 선택 가능)</div>';
  html += '</div>';
  html += '<span style="margin-left:auto;font-size:13px;font-weight:700;color:#0071E3">' + selected.length + '개 선택됨</span>';
  html += '<button class="btn btn-ghost btn-sm" onclick="processPrevStep()">← 이전</button>';
  html += '<button class="btn btn-primary btn-sm" onclick="processNextStep()"' + (selected.length === 0 ? ' disabled style="opacity:.5;pointer-events:none"' : '') + '>다음 →</button>';
  html += '</div>';

  // 전체선택/해제
  html += '<div style="margin:12px 0;display:flex;gap:8px">';
  html += '<button class="btn btn-ghost btn-xs" onclick="PROCESS_STATE.selectedWorkTypes=getWorkTypes(\'' + code + '\').map(function(w){return w.id});renderWorkflowView()">전체 선택</button>';
  html += '<button class="btn btn-ghost btn-xs" onclick="PROCESS_STATE.selectedWorkTypes=[];renderWorkflowView()">전체 해제</button>';
  html += '</div>';

  html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:8px">';
  wts.forEach(function(w) {
    var isSel = selected.indexOf(w.id) >= 0;
    var sys = LINKED_SYSTEMS[w.systemId];
    var ct = CONTENT_TYPES[w.typeCode];
    html += '<div onclick="toggleWorkTypeSelection(\'' + w.id + '\')" style="display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:8px;border:2px solid ' + (isSel ? '#0071E3' : '#E5E5EA') + ';background:' + (isSel ? '#E8F2FF' : '#fff') + ';cursor:pointer;transition:all .12s">';
    html += '<div style="width:22px;height:22px;border-radius:5px;border:2px solid ' + (isSel ? '#0071E3' : '#D1D1D6') + ';background:' + (isSel ? '#0071E3' : '#fff') + ';display:flex;align-items:center;justify-content:center;flex-shrink:0">';
    if(isSel) html += '<svg viewBox="0 0 24 24" style="width:14px;height:14px" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>';
    html += '</div>';
    html += '<span style="font-size:16px;flex-shrink:0">' + (ct ? ct.icon : '📄') + '</span>';
    html += '<div style="flex:1;min-width:0">';
    html += '<div style="font-size:13px;font-weight:600;color:#1D1D1F">' + w.displayName + '</div>';
    html += '<div style="font-size:10px;color:#8E8E93">[' + w.typeCode + '] ' + (ct ? ct.group : '') + '</div>';
    html += '</div>';
    html += '<span style="font-size:10px;padding:2px 7px;border-radius:4px;background:' + sys.bg + ';color:' + sys.color + ';font-weight:600">' + sys.icon + '</span>';
    html += '</div>';
  });
  html += '</div></div>';
  return html;
}

function toggleWorkTypeSelection(wtId) {
  var sel = PROCESS_STATE.selectedWorkTypes;
  var idx = sel.indexOf(wtId);
  if(idx >= 0) sel.splice(idx, 1);
  else sel.push(wtId);
  renderWorkflowView();
}

// ── STEP 4: 유형 속성 커스텀 ──
function _renderStep4_Customize() {
  var PS = PROCESS_STATE;
  var selected = PS.selectedWorkTypes;
  if(selected.length === 0) return '<div style="padding:40px;text-align:center;color:#8E8E93">STEP 3에서 작업 유형을 선택하세요</div>';

  var activeWtId = PS.selectedWorkTypeId || selected[0];
  var activeWt = getWorkType(activeWtId);

  var html = '<div style="display:flex;height:100%">';

  // Left: 선택된 유형 목록
  html += '<div style="width:220px;border-right:1px solid #E5E5EA;overflow-y:auto;background:#FAFAFA">';
  html += '<div style="padding:14px 16px;border-bottom:1px solid #E5E5EA">';
  html += '<div style="font-size:12px;font-weight:700;color:#636366;text-transform:uppercase;letter-spacing:.05em">선택된 유형</div>';
  html += '</div>';
  selected.forEach(function(wtId) {
    var w = getWorkType(wtId);
    if(!w) return;
    var isActive = wtId === activeWtId;
    var ct = CONTENT_TYPES[w.typeCode];
    html += '<div onclick="PROCESS_STATE.selectedWorkTypeId=\'' + wtId + '\';renderProcessStep(4)" style="padding:10px 14px;cursor:pointer;background:' + (isActive ? '#E8F2FF' : 'transparent') + ';border-left:3px solid ' + (isActive ? '#0071E3' : 'transparent') + ';transition:all .1s">';
    html += '<div style="font-size:12px;font-weight:' + (isActive ? 700 : 500) + ';color:' + (isActive ? '#1D1D1F' : '#636366') + '">' + (ct ? ct.icon : '') + ' ' + w.displayName + '</div>';
    html += '<div style="font-size:10px;color:#8E8E93;margin-top:2px">[' + w.typeCode + ']</div>';
    html += '</div>';
  });
  html += '</div>';

  // Right: 속성 커스텀 영역
  html += '<div style="flex:1;overflow-y:auto;padding:20px 24px">';
  html += '<div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">';
  html += '<span style="font-size:20px">⚙</span>';
  html += '<div style="flex:1"><div style="font-size:15px;font-weight:600;color:#1D1D1F">STEP 4 — ' + (activeWt ? activeWt.displayName : '') + ' 속성 커스텀</div>';
  html += '<div style="font-size:12px;color:#636366;margin-top:2px">콘텐츠 등록 시 표시될 필드와 속성을 설정합니다</div></div>';
  html += '<button class="btn btn-ghost btn-sm" onclick="processPrevStep()">← 이전</button>';
  html += '<button class="btn btn-primary btn-sm" onclick="processNextStep()">다음 →</button>';
  html += '</div>';

  if(activeWt) {
    var fields = activeWt.customAttrs.fields;

    // 필드 테이블
    html += '<div style="background:#fff;border-radius:10px;border:1px solid #E5E5EA;overflow:hidden;margin-bottom:16px">';
    html += '<div style="padding:12px 16px;background:#FAFAFA;border-bottom:1px solid #E5E5EA;font-size:13px;font-weight:700;color:#1D1D1F">📝 입력 필드 설정</div>';
    html += '<table style="width:100%;border-collapse:collapse">';
    html += '<thead><tr style="background:#FAFAFA">';
    html += '<th style="padding:10px 14px;text-align:left;font-size:12px;font-weight:600;color:#636366;border-bottom:1px solid #E5E5EA">활성</th>';
    html += '<th style="padding:10px 14px;text-align:left;font-size:12px;font-weight:600;color:#636366;border-bottom:1px solid #E5E5EA">필드명</th>';
    html += '<th style="padding:10px 14px;text-align:left;font-size:12px;font-weight:600;color:#636366;border-bottom:1px solid #E5E5EA">키</th>';
    html += '<th style="padding:10px 14px;text-align:left;font-size:12px;font-weight:600;color:#636366;border-bottom:1px solid #E5E5EA">너비</th>';
    html += '<th style="padding:10px 14px;text-align:left;font-size:12px;font-weight:600;color:#636366;border-bottom:1px solid #E5E5EA">필수</th>';
    html += '</tr></thead><tbody>';

    fields.forEach(function(f, fi) {
      var isEnabled = f.enabled !== false;
      var isReq = (activeWt.customAttrs.requiredFields || []).indexOf(f.key) >= 0;
      html += '<tr style="border-bottom:1px solid #F5F5F7">';
      html += '<td style="padding:8px 14px"><input type="checkbox" ' + (isEnabled ? 'checked' : '') + ' onchange="toggleFieldEnabled(\'' + activeWtId + '\',' + fi + ',this.checked)" style="cursor:pointer"></td>';
      html += '<td style="padding:8px 14px;font-size:13px;font-weight:600;color:#1D1D1F">' + f.label + '</td>';
      html += '<td style="padding:8px 14px;font-size:12px;color:#8E8E93;font-family:var(--font-mono)">' + f.key + '</td>';
      html += '<td style="padding:8px 14px;font-size:12px;color:#636366">' + (f.w || 'auto') + 'px</td>';
      html += '<td style="padding:8px 14px">' + (isReq ? '<span style="font-size:11px;padding:2px 6px;border-radius:3px;background:#FFF2F1;color:#FF3B30;font-weight:700">필수</span>' : '<span style="font-size:11px;color:#8E8E93">선택</span>') + '</td>';
      html += '</tr>';
    });

    html += '</tbody></table></div>';

    // 자동 필드
    html += '<div style="background:#fff;border-radius:10px;border:1px solid #E5E5EA;padding:14px 18px;margin-bottom:16px">';
    html += '<div style="font-size:13px;font-weight:700;color:#1D1D1F;margin-bottom:8px">🔄 자동 채움 필드</div>';
    html += '<div style="display:flex;flex-wrap:wrap;gap:6px">';
    (activeWt.customAttrs.autoFields || []).forEach(function(af) {
      html += '<span style="font-size:12px;padding:4px 10px;border-radius:6px;background:#F0FFF4;color:#34C759;border:1px solid #A8E6B8;font-weight:600">' + af + ' (자동)</span>';
    });
    html += '</div></div>';

    // 시스템 연계 정보
    var sys = LINKED_SYSTEMS[activeWt.systemId];
    html += '<div style="background:' + sys.bg + ';border-radius:10px;border:1px solid #E5E5EA;padding:14px 18px">';
    html += '<div style="font-size:13px;font-weight:700;color:' + sys.color + ';margin-bottom:4px">' + sys.icon + ' 연계 시스템: ' + sys.name + '</div>';
    html += '<div style="font-size:12px;color:#636366">이 작업 유형의 결과물은 <strong>' + sys.name + '</strong>에 자동으로 제공됩니다</div>';
    html += '</div>';
  }

  html += '</div></div>';
  return html;
}

function toggleFieldEnabled(wtId, fieldIdx, enabled) {
  var w = getWorkType(wtId);
  if(w && w.customAttrs.fields[fieldIdx]) {
    w.customAttrs.fields[fieldIdx].enabled = enabled;
    renderProcessStep(4);
  }
}

// ── STEP 5: 작업 배분 ──
function _renderStep5_Assign() {
  var PS = PROCESS_STATE;
  var selected = PS.selectedWorkTypes;
  if(selected.length === 0) return '<div style="padding:40px;text-align:center;color:#8E8E93">STEP 3에서 작업 유형을 선택하세요</div>';

  var html = '<div style="padding:24px">';
  html += '<div style="display:flex;align-items:center;gap:10px;margin-bottom:20px">';
  html += '<span style="font-size:22px">👥</span>';
  html += '<div style="flex:1"><div style="font-size:16px;font-weight:600;color:#1D1D1F">STEP 5 — 작업 배분</div>';
  html += '<div style="font-size:13px;color:#636366;margin-top:3px">선택한 작업 유형별로 담당자를 배정합니다</div></div>';
  html += '<button class="btn btn-ghost btn-sm" onclick="processPrevStep()">← 이전</button>';
  html += '<button class="btn btn-primary btn-sm" onclick="processNextStep()">다음: 콘텐츠 등록 →</button>';
  html += '</div>';

  html += '<div style="background:#fff;border-radius:10px;border:1px solid #E5E5EA;overflow:hidden">';
  html += '<table style="width:100%;border-collapse:collapse">';
  html += '<thead><tr style="background:#FAFAFA">';
  html += '<th style="padding:12px 16px;text-align:left;font-size:12px;font-weight:600;color:#636366;border-bottom:1px solid #E5E5EA">작업 유형</th>';
  html += '<th style="padding:12px 16px;text-align:left;font-size:12px;font-weight:600;color:#636366;border-bottom:1px solid #E5E5EA">연계 시스템</th>';
  html += '<th style="padding:12px 16px;text-align:left;font-size:12px;font-weight:600;color:#636366;border-bottom:1px solid #E5E5EA">담당자</th>';
  html += '<th style="padding:12px 16px;text-align:left;font-size:12px;font-weight:600;color:#636366;border-bottom:1px solid #E5E5EA">우선순위</th>';
  html += '<th style="padding:12px 16px;text-align:left;font-size:12px;font-weight:600;color:#636366;border-bottom:1px solid #E5E5EA">마감일</th>';
  html += '</tr></thead><tbody>';

  selected.forEach(function(wtId) {
    var w = getWorkType(wtId);
    if(!w) return;
    var ct = CONTENT_TYPES[w.typeCode];
    var sys = LINKED_SYSTEMS[w.systemId];
    var assign = PS.assignments[wtId] || {};

    html += '<tr style="border-bottom:1px solid #F5F5F7">';
    html += '<td style="padding:10px 16px"><div style="display:flex;align-items:center;gap:8px"><span style="font-size:15px">' + (ct ? ct.icon : '') + '</span><span style="font-size:13px;font-weight:600;color:#1D1D1F">' + (ct ? ct.label : w.typeCode) + ' [' + w.typeCode + ']</span></div></td>';
    html += '<td style="padding:10px 16px"><span style="font-size:12px;padding:3px 8px;border-radius:5px;background:' + sys.bg + ';color:' + sys.color + ';font-weight:600">' + sys.icon + ' ' + sys.name + '</span></td>';
    html += '<td style="padding:10px 16px"><select onchange="setAssignment(\'' + wtId + '\',\'assignee\',this.value)" style="padding:6px 10px;border:1px solid #E5E5EA;border-radius:6px;font-size:12px;background:#fff;min-width:120px">';
    html += '<option value="">미배정</option>';
    AUTHORS.forEach(function(a) { html += '<option value="' + a + '"' + (assign.assignee === a ? ' selected' : '') + '>' + a + '</option>'; });
    html += '</select></td>';
    html += '<td style="padding:10px 16px"><select onchange="setAssignment(\'' + wtId + '\',\'priority\',this.value)" style="padding:6px 10px;border:1px solid #E5E5EA;border-radius:6px;font-size:12px;background:#fff">';
    ['normal','high','low'].forEach(function(p) {
      var pl = p === 'high' ? '🔴 높음' : p === 'low' ? '🔵 낮음' : '⚪ 보통';
      html += '<option value="' + p + '"' + ((assign.priority || 'normal') === p ? ' selected' : '') + '>' + pl + '</option>';
    });
    html += '</select></td>';
    html += '<td style="padding:10px 16px"><input type="date" value="' + (assign.deadline || '') + '" onchange="setAssignment(\'' + wtId + '\',\'deadline\',this.value)" style="padding:6px 10px;border:1px solid #E5E5EA;border-radius:6px;font-size:12px;background:#fff"></td>';
    html += '</tr>';
  });

  html += '</tbody></table></div></div>';
  return html;
}

function setAssignment(wtId, key, value) {
  if(!PROCESS_STATE.assignments[wtId]) PROCESS_STATE.assignments[wtId] = {};
  PROCESS_STATE.assignments[wtId][key] = value;
}

// ── STEP 6: 콘텐츠 등록 ──
function _renderStep6_Register() {
  var PS = PROCESS_STATE;
  var selected = PS.selectedWorkTypes;
  if(selected.length === 0) return '<div style="padding:40px;text-align:center;color:#8E8E93">STEP 3에서 작업 유형을 선택하세요</div>';

  var activeWtId = PS.selectedWorkTypeId || selected[0];
  var activeWt = getWorkType(activeWtId);

  var html = '<div style="display:flex;height:100%">';

  // Left: 작업 유형 목록
  html += '<div style="width:220px;border-right:1px solid #E5E5EA;overflow-y:auto;background:#FAFAFA">';
  html += '<div style="padding:14px 16px;border-bottom:1px solid #E5E5EA">';
  html += '<div style="font-size:12px;font-weight:700;color:#636366;text-transform:uppercase;letter-spacing:.05em">작업 목록</div>';
  html += '</div>';
  selected.forEach(function(wtId) {
    var w = getWorkType(wtId);
    if(!w) return;
    var isActive = wtId === activeWtId;
    var ct = CONTENT_TYPES[w.typeCode];
    var stColor = w.status === 'done' ? '#34C759' : w.status === 'inprog' ? '#FF9500' : '#8E8E93';
    html += '<div onclick="PROCESS_STATE.selectedWorkTypeId=\'' + wtId + '\';renderProcessStep(6)" style="padding:10px 14px;cursor:pointer;background:' + (isActive ? '#E8F2FF' : 'transparent') + ';border-left:3px solid ' + (isActive ? '#0071E3' : 'transparent') + ';transition:all .1s">';
    html += '<div style="display:flex;align-items:center;gap:6px">';
    html += '<span style="width:6px;height:6px;border-radius:50%;background:' + stColor + ';flex-shrink:0"></span>';
    html += '<span style="font-size:12px;font-weight:' + (isActive ? 700 : 500) + ';color:' + (isActive ? '#1D1D1F' : '#636366') + '">' + (ct ? ct.icon : '') + ' ' + w.displayName + '</span>';
    html += '</div>';
    html += '<div style="font-size:10px;color:#8E8E93;margin-top:2px;padding-left:12px">[' + w.typeCode + ']</div>';
    html += '</div>';
  });
  html += '</div>';

  // Right: 콘텐츠 등록 영역
  html += '<div style="flex:1;overflow-y:auto;padding:20px 24px">';
  html += '<div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">';
  html += '<span style="font-size:20px">📝</span>';
  html += '<div style="flex:1"><div style="font-size:15px;font-weight:600;color:#1D1D1F">STEP 6 — 콘텐츠 등록</div>';
  html += '<div style="font-size:12px;color:#636366;margin-top:2px">' + (activeWt ? activeWt.displayName + ' — 커스텀된 속성만 표시됩니다' : '') + '</div></div>';
  html += '<button class="btn btn-ghost btn-sm" onclick="processPrevStep()">← 이전</button>';
  html += '<button class="btn btn-primary btn-sm" onclick="toast(\'콘텐츠가 저장되었습니다\',\'t-ok\')">💾 저장</button>';
  html += '</div>';

  if(activeWt) {
    var enabledFields = (activeWt.customAttrs.fields || []).filter(function(f) { return f.enabled !== false; });
    var sys = LINKED_SYSTEMS[activeWt.systemId];

    // 연계 시스템 배지
    html += '<div style="margin-bottom:14px;display:flex;gap:8px;align-items:center">';
    html += '<span style="font-size:12px;padding:4px 10px;border-radius:6px;background:' + sys.bg + ';color:' + sys.color + ';font-weight:700">' + sys.icon + ' ' + sys.name + ' → 자동 제공</span>';
    var assign = PS.assignments[activeWt.id] || {};
    if(assign.assignee) html += '<span style="font-size:12px;padding:4px 10px;border-radius:6px;background:#FAFAFA;color:#48484A;border:1px solid #E5E5EA;font-weight:600">👤 ' + assign.assignee + '</span>';
    html += '</div>';

    // 자동 필드 표시
    if(activeWt.customAttrs.autoFields && activeWt.customAttrs.autoFields.length > 0) {
      html += '<div style="background:#F0FFF4;border-radius:8px;padding:10px 14px;margin-bottom:14px;font-size:12px;color:#34C759">';
      html += '<strong>자동 채움:</strong> ' + activeWt.customAttrs.autoFields.join(', ') + ' (시스템에서 자동 입력)';
      html += '</div>';
    }

    // 데이터 입력 그리드 (커스텀된 필드만)
    html += '<div style="background:#fff;border-radius:10px;border:1px solid #E5E5EA;overflow:hidden">';
    html += '<div style="overflow-x:auto">';
    html += '<table style="width:100%;border-collapse:collapse;min-width:600px">';
    html += '<thead><tr style="background:#FAFAFA">';
    html += '<th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:600;color:#636366;border-bottom:1px solid #E5E5EA;width:40px">#</th>';
    enabledFields.forEach(function(f) {
      var isReq = (activeWt.customAttrs.requiredFields || []).indexOf(f.key) >= 0;
      html += '<th style="padding:10px 12px;text-align:left;font-size:12px;font-weight:600;color:#1D1D1F;border-bottom:1px solid #E5E5EA;min-width:' + (f.w || 120) + 'px">' + f.label + (isReq ? ' <span style="color:#FF3B30">*</span>' : '') + '</th>';
    });
    html += '</tr></thead><tbody>';

    // 샘플 행 5개
    for(var r = 1; r <= 5; r++) {
      html += '<tr style="border-bottom:1px solid #F5F5F7">';
      html += '<td style="padding:8px 12px;text-align:center;font-size:12px;color:#8E8E93;font-weight:600">' + r + '</td>';
      enabledFields.forEach(function(f) {
        html += '<td style="padding:4px 6px;border-bottom:1px solid #F5F5F7"><input type="text" style="width:100%;padding:7px 10px;border:1px solid #E5E5EA;border-radius:5px;font-size:13px;outline:none;transition:border-color .15s" onfocus="this.style.borderColor=\'#0071E3\'" onblur="this.style.borderColor=\'#E5E5EA\'" placeholder="' + f.label + '"></td>';
      });
      html += '</tr>';
    }

    html += '</tbody></table></div>';
    html += '<div style="padding:10px 14px;border-top:1px solid #E5E5EA;display:flex;gap:8px">';
    html += '<button class="btn btn-ghost btn-xs" onclick="toast(\'행이 추가되었습니다\',\'t-ok\')">+ 행 추가</button>';
    html += '<button class="btn btn-ghost btn-xs" onclick="toast(\'엑셀에서 붙여넣기\',\'t-info\')">📋 엑셀 붙여넣기</button>';
    html += '<button class="btn btn-ghost btn-xs" onclick="toast(\'템플릿 다운로드\',\'t-info\')">📥 템플릿 다운로드</button>';
    html += '</div></div>';
  }

  html += '</div></div>';
  return html;
}

// ── 칸반 뷰 렌더 ──
function _wfRenderKanban(items) {
  var h = '<div style="flex:1;display:flex;overflow-x:auto;overflow-y:hidden">';
  WF_PHASES.forEach(function(phase) {
    var phaseItems = items.filter(function(i){ return i.phase === phase.id; });
    var curGroups = _wfGroupByCurriculum(phaseItems);
    var curCount = curGroups.length;
    h += '<div style="flex:1;min-width:260px;max-width:420px;display:flex;flex-direction:column;border-right:1px solid var(--c-gray-100);overflow:hidden">';
    // Column header
    h += '<div style="padding:12px 12px 10px;border-bottom:2px solid ' + phase.color + ';background:' + phase.bg + ';flex-shrink:0">';
    h += '<div style="display:flex;align-items:center;gap:8px">';
    h += '<span style="width:8px;height:8px;border-radius:50%;background:' + phase.color + ';flex-shrink:0"></span>';
    h += '<span style="font-size:13px;font-weight:600;color:var(--c-gray-700)">' + phase.label + '</span>';
    h += '<span style="font-size:11px;font-weight:600;color:#fff;background:' + phase.color + ';padding:1px 8px;border-radius:10px;min-width:18px;text-align:center">' + curCount + '</span>';
    h += '<span style="font-size:10px;color:var(--c-gray-400)">' + phaseItems.length + '\uAC74</span>';
    h += '</div></div>';
    // Column body
    h += '<div style="flex:1;overflow-y:auto;padding:8px;display:flex;flex-direction:column;gap:8px;background:var(--c-gray-50)">';
    if(curGroups.length > 0) {
      curGroups.forEach(function(g){ h += _buildWfCurCard(g, phase); });
    } else {
      h += '<div style="padding:24px 12px;text-align:center;color:var(--c-gray-300);font-size:11px">\uC774 \uB2E8\uACC4\uC5D0 \uB300\uAE30 \uC911\uC778<br>\uD56D\uBAA9\uC774 \uC5C6\uC2B5\uB2C8\uB2E4</div>';
    }
    h += '</div></div>';
  });
  h += '</div>';
  return h;
}

// Group workflow items by curriculum
function _wfGroupByCurriculum(items) {
  var map = {};
  var order = [];
  items.forEach(function(item) {
    var key = item.curriculumId || '_none_' + (item.subjectCode || '') + '_' + (item.course || '');
    if(!map[key]) {
      map[key] = {curId: item.curriculumId || null, items: [], curName: '', depths: [], cur: null};
      order.push(key);
      if(item.curriculumId) {
        var cur = (typeof CURRICULUM_DATA !== 'undefined' ? CURRICULUM_DATA : []).find(function(c){ return c.id === item.curriculumId; });
        if(cur) { map[key].curName = cur.name; map[key].depths = cur.depths || []; map[key].cur = cur; }
      }
      if(!map[key].curName) map[key].curName = (item.subject || '') + ' ' + (item.course || '');
    }
    map[key].items.push(item);
  });
  return order.map(function(k){ return map[k]; });
}

// Build curriculum card for kanban
function _buildWfCurCard(group, phase) {
  var curName = group.curName || '\uBBF8\uBD84\uB958';
  var items = group.items;
  var totalDone = 0, totalAll = 0;
  items.forEach(function(it){ totalDone += (it.doneCount || 0); totalAll += (it.totalCount || 0); });
  var overallPct = totalAll > 0 ? Math.round(totalDone / totalAll * 100) : 0;
  var prgColor = overallPct === 100 ? '#34C759' : overallPct > 0 ? '#FF9500' : '#E5E5EA';

  // Depth hierarchy (skip depth[0])
  var depthHtml = '';
  if(group.depths && group.depths.length > 1) {
    var parts = [];
    for(var di = 1; di < group.depths.length; di++) {
      var d = group.depths[di];
      if(d.count === null || d.count === undefined) continue;
      var splitIdx = group.cur ? group.cur.splitDepth : -1;
      if(di === splitIdx) {
        parts.push('<span style="background:#1D1D1F;color:#fff;padding:1px 5px;border-radius:3px;font-weight:600">' + d.name + ' ' + d.count + '</span>');
      } else {
        parts.push(d.name + ' ' + d.count);
      }
    }
    if(parts.length > 0) depthHtml = parts.join(' <span style="color:#D1D1D6">\u203A</span> ');
  }

  var h = '';
  h += '<div style="background:#fff;border:1px solid var(--c-gray-200);border-radius:8px;overflow:hidden;transition:box-shadow .15s"';
  h += ' onmouseenter="this.style.boxShadow=\'0 2px 8px rgba(0,0,0,.06)\'" onmouseleave="this.style.boxShadow=\'\'">';
  // Card header
  h += '<div style="padding:10px 12px 8px">';
  h += '<div style="font-size:13px;font-weight:600;color:#1D1D1F;line-height:1.3;margin-bottom:2px">' + curName + '</div>';
  if(depthHtml) h += '<div style="font-size:9px;color:#8E8E93;line-height:1.4;margin-bottom:6px">' + depthHtml + '</div>';
  h += '<div style="display:flex;align-items:center;gap:6px">';
  h += '<div style="flex:1;height:3px;border-radius:2px;background:#F5F5F7;overflow:hidden">';
  h += '<div style="height:100%;width:' + overallPct + '%;background:' + prgColor + ';border-radius:2px"></div></div>';
  h += '<span style="font-size:9px;font-weight:600;color:' + (prgColor === '#E5E5EA' ? '#D1D1D6' : prgColor) + '">' + overallPct + '%</span>';
  h += '</div></div>';

  // Per-form rows
  h += '<div style="padding:0 8px 8px;display:flex;flex-direction:column;gap:3px">';
  items.forEach(function(item) {
    var sys = WC_SYSTEM_COLORS[item.target] || WC_SYSTEM_COLORS.ND;
    var formName = item.templateName || _getTypeLabel(item.typeCode) || '';
    var done = item.doneCount || 0;
    var total = item.totalCount || 0;
    var pct = total > 0 ? Math.round(done / total * 100) : 0;
    var pc = pct === 100 ? '#34C759' : pct > 0 ? '#FF9500' : '#E5E5EA';
    var pri = WF_PRIORITY_STYLE[item.priority] || WF_PRIORITY_STYLE.normal;

    h += '<div style="background:#FAFAFA;border:1px solid #F0F0F2;border-radius:6px;padding:6px 8px;border-left:3px solid ' + sys.color + ';cursor:pointer" onclick="wfToggleCard(\'' + item.id + '\')">';
    // Line 1: form name + priority + done/total
    h += '<div style="display:flex;align-items:center;gap:5px;margin-bottom:2px">';
    h += '<span style="font-size:11px;font-weight:600;color:#1D1D1F;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + formName + '</span>';
    if(pri.label === '\uAE34\uAE09') h += '<span style="font-size:7px;padding:1px 4px;border-radius:3px;background:#FFF2F1;color:#FF3B30;font-weight:700">\uAE34\uAE09</span>';
    h += '<span style="font-size:9px;color:#8E8E93;font-weight:500;flex-shrink:0">' + done + '/' + total + '</span>';
    h += '</div>';
    // Line 2: progress bar + assignee + action
    h += '<div style="display:flex;align-items:center;gap:6px">';
    h += '<div style="flex:1;height:3px;border-radius:2px;background:#E5E5EA;overflow:hidden">';
    h += '<div style="height:100%;width:' + pct + '%;background:' + pc + ';border-radius:2px"></div></div>';
    if(item.assignee) {
      h += '<span style="font-size:9px;color:#636366;font-weight:500;flex-shrink:0">' + item.assignee + '</span>';
    } else {
      h += '<span style="font-size:8px;color:#FF9500;font-weight:600;flex-shrink:0">\u26A0 \uBBF8\uBC30\uC815</span>';
    }
    h += '<button style="font-size:8px;padding:1px 6px;border-radius:4px;border:1px solid ' + phase.border + ';background:' + phase.bg + ';color:' + phase.color + ';font-weight:600;cursor:pointer;flex-shrink:0" onclick="event.stopPropagation();_wfGoToMenu(\'' + phase.id + '\')">' + _wfNextLabel(phase.id) + ' ›</button>';
    h += '</div>';

    // Expanded detail (set progress)
    if(STATE._wfExpandedCard === item.id) {
      var setProgress = item.setProgress || [];
      h += '<div style="margin-top:5px;padding-top:5px;border-top:1px solid #E5E5EA;display:flex;flex-wrap:wrap;gap:3px">';
      setProgress.forEach(function(sp) {
        var sc = sp.status === 'done' ? '#34C759' : sp.status === 'inprog' ? '#FF9500' : '#D1D1D6';
        var si = sp.status === 'done' ? '\u2713' : sp.status === 'inprog' ? '\u25CF' : '\u25CB';
        h += '<span style="font-size:8px;padding:2px 5px;border-radius:3px;background:#fff;border:1px solid #E5E5EA;color:' + sc + ';font-weight:600">' + si + ' ' + sp.set + '</span>';
      });
      h += '</div>';
    }

    h += '</div>';
  });
  h += '</div></div>';
  return h;
}

// \u2500\u2500 \ub9ac\uc2a4\ud2b8 \ubdf0 \ub80c\ub354 \u2500\u2500
function _wfRenderList(items, allItems) {
  var curGroups = _wfGroupByCurriculum(items);
  var h = '<div style="flex:1;overflow:auto;padding:16px 20px;display:flex;flex-direction:column;gap:10px">';

  if(curGroups.length === 0) {
    h += '<div style="padding:40px;text-align:center;color:var(--c-gray-400);font-size:12px">\uD45C\uC2DC\uD560 \uD56D\uBAA9\uC774 \uC5C6\uC2B5\uB2C8\uB2E4</div>';
  } else {
    curGroups.forEach(function(group) {
      var curName = group.curName || '\uBBF8\uBD84\uB958';
      var totalDone = 0, totalAll = 0;
      group.items.forEach(function(it){ totalDone += (it.doneCount || 0); totalAll += (it.totalCount || 0); });
      var overallPct = totalAll > 0 ? Math.round(totalDone / totalAll * 100) : 0;
      var prgColor = overallPct === 100 ? '#34C759' : overallPct > 0 ? '#FF9500' : '#E5E5EA';

      var depthHtml = '';
      if(group.depths && group.depths.length > 1) {
        var parts = [];
        for(var di = 1; di < group.depths.length; di++) {
          var d = group.depths[di];
          if(d.count === null || d.count === undefined) continue;
          var splitIdx = group.cur ? group.cur.splitDepth : -1;
          if(di === splitIdx) {
            parts.push('<span style="background:#1D1D1F;color:#fff;padding:1px 5px;border-radius:3px;font-weight:600">' + d.name + ' ' + d.count + '</span>');
          } else {
            parts.push(d.name + ' ' + d.count);
          }
        }
        if(parts.length > 0) depthHtml = parts.join(' <span style="color:#D1D1D6">\u203A</span> ');
      }

      h += '<div style="background:#fff;border:1px solid var(--c-gray-200);border-radius:8px;overflow:hidden">';
      h += '<div style="padding:10px 14px;border-bottom:1px solid #F0F0F2;display:flex;align-items:center;gap:10px">';
      h += '<div style="flex:1">';
      h += '<div style="font-size:13px;font-weight:600;color:#1D1D1F">' + curName + '</div>';
      if(depthHtml) h += '<div style="font-size:9px;color:#8E8E93;margin-top:2px">' + depthHtml + '</div>';
      h += '</div>';
      h += '<div style="display:flex;align-items:center;gap:6px;min-width:120px">';
      h += '<div style="flex:1;height:3px;border-radius:2px;background:#F5F5F7;overflow:hidden">';
      h += '<div style="height:100%;width:' + overallPct + '%;background:' + prgColor + ';border-radius:2px"></div></div>';
      h += '<span style="font-size:10px;font-weight:600;color:' + (prgColor === '#E5E5EA' ? '#D1D1D6' : prgColor) + '">' + overallPct + '%</span>';
      h += '</div>';
      h += '<span style="font-size:10px;color:#8E8E93">' + group.items.length + '\uAC74</span>';
      h += '</div>';

      h += '<div style="padding:6px 8px;display:flex;flex-direction:column;gap:3px">';
      group.items.forEach(function(item) {
        var sys = WC_SYSTEM_COLORS[item.target] || WC_SYSTEM_COLORS.ND;
        var phase = WF_PHASES.find(function(p){ return p.id === item.phase; }) || WF_PHASES[0];
        var pri = WF_PRIORITY_STYLE[item.priority] || WF_PRIORITY_STYLE.normal;
        var formName = item.templateName || _getTypeLabel(item.typeCode) || '';
        var done = item.doneCount || 0;
        var total = item.totalCount || 0;
        var pct = total > 0 ? Math.round(done / total * 100) : 0;
        var pc = pct === 100 ? '#34C759' : pct > 0 ? '#FF9500' : '#E5E5EA';

        h += '<div style="background:#FAFAFA;border:1px solid #F0F0F2;border-radius:6px;padding:6px 10px;border-left:3px solid ' + sys.color + '">';
        h += '<div style="display:flex;align-items:center;gap:5px;margin-bottom:2px">';
        h += '<span style="font-size:11px;font-weight:600;color:#1D1D1F;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + formName + '</span>';
        h += '<span style="font-size:8px;padding:1px 6px;border-radius:3px;background:' + phase.bg + ';color:' + phase.color + ';font-weight:600;border:1px solid ' + phase.border + ';flex-shrink:0">' + phase.label + '</span>';
        if(pri.label === '\uAE34\uAE09') h += '<span style="font-size:7px;padding:1px 4px;border-radius:3px;background:#FFF2F1;color:#FF3B30;font-weight:700">\uAE34\uAE09</span>';
        h += '</div>';
        h += '<div style="display:flex;align-items:center;gap:6px">';
        h += '<div style="flex:1;height:3px;border-radius:2px;background:#E5E5EA;overflow:hidden">';
        h += '<div style="height:100%;width:' + pct + '%;background:' + pc + ';border-radius:2px"></div></div>';
        h += '<span style="font-size:9px;color:#636366;font-weight:500;flex-shrink:0">' + done + '/' + total + '</span>';
        if(item.assignee) {
          h += '<span style="font-size:9px;color:#636366;flex-shrink:0">' + item.assignee + '</span>';
        } else {
          h += '<span style="font-size:8px;color:#FF9500;font-weight:600;flex-shrink:0">\u26A0 \uBBF8\uBC30\uC815</span>';
        }
        h += '<button style="font-size:8px;padding:1px 6px;border-radius:4px;border:1px solid ' + phase.border + ';background:' + phase.bg + ';color:' + phase.color + ';font-weight:600;cursor:pointer;flex-shrink:0" onclick="_wfGoToMenu(\'' + phase.id + '\')">' + _wfNextLabel(phase.id) + ' ›</button>';
        h += '</div>';
        h += '</div>';
      });
      h += '</div></div>';
    });
  }

  h += '</div>';
  return h;
}


// 카드 펼치기/접기
function wfToggleCard(itemId) {
  STATE._wfExpandedCard = STATE._wfExpandedCard === itemId ? null : itemId;
  renderWorkflowView();
}

function _wfNextLabel(phaseId) {
  const map = {assign:'작업설정', register:'콘텐츠등록', review:'검수관리', deploy:'배포관리'};
  return map[phaseId] || '바로가기';
}

function _wfGoToMenu(phaseId) {
  var viewMap = {assign:'work-config', register:'content-register', review:'review-main', deploy:'deploy'};
  var view = viewMap[phaseId] || 'work-config';
  if(view === 'review-main') { switchIAView('review-main'); } else { switchView(view); }
}

function wfMoveNext(itemId) {
  const item = STATE.workflowItems.find(i => i.id === itemId);
  var _wiSrc = (WORK_ITEMS_V7||[]).find(function(w){ return w.id === itemId; });
  if(!item) return;
  const idx = WF_PHASES.findIndex(p => p.id === item.phase);
  if(idx < WF_PHASES.length - 1) {
    const nextPhase = WF_PHASES[idx + 1];
    item.phase = nextPhase.id;
    if(_wiSrc) _wiSrc.phase = nextPhase.id;
    toast('"' + _getWfDisplayLabel(item) + '" \u2192 ' + nextPhase.label + '\uB85C \uC774\uB3D9', 't-ok');
    // assign → register 전환 시: 바로 등록 화면으로 이동할지 확인
    if(WF_PHASES[idx].id === 'assign' && nextPhase.id === 'register') {
      renderWorkflowView();
      var _moveLabel = _getWfDisplayLabel(item);
      setTimeout(function() {
        showConfirm('\uB4F1\uB85D \uC791\uC5C5 \uC2DC\uC791', '<div style="font-size:12px;color:var(--c-gray-600)">"' + _moveLabel + '" \uB4F1\uB85D \uD654\uBA74\uC73C\uB85C \uBC14\uB85C \uC774\uB3D9\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?<br><span style="font-size:11px;color:var(--c-gray-400);margin-top:4px;display:block">\uD15C\uD50C\uB9BF \uAE30\uC900\uC73C\uB85C \uC138\uD2B8\uBCC4 \uCF58\uD150\uCE20\uB97C \uB4F1\uB85D\uD569\uB2C8\uB2E4.</span></div>',
          function() { switchToContentRegister(item.id); }, '\uB4F1\uB85D \uD654\uBA74 \uC774\uB3D9', 'btn-primary');
      }, 300);
    } else {
      renderWorkflowView();
    }
  } else {
    toast('"' + _getWfDisplayLabel(item) + '" \uC791\uC5C5 \uC644\uB8CC!', 't-ok');
    STATE.workflowItems = STATE.workflowItems.filter(i => i.id !== itemId);
    renderWorkflowView();
  }
}

// ── 직접 등록 모달 ──
function wfOpenManualRegister() {
  const subjectKeys = Object.keys(SUBJECT_TYPE_MAP);
  showConfirm(
    '✏ 커리큘럼 직접 등록',
    `<div style="font-size:12px;color:var(--c-gray-600);margin-bottom:14px">
      뉴드림스를 거치지 않고 CMS에서 직접 과정·세트 코드를 입력하여 커리큘럼을 등록합니다.
      <span style="color:var(--c-gray-400);font-size:11px;display:block;margin-top:4px">등록 후 동일한 작업 흐름(작업자 배분 → 등록 → 검수 → 배포)을 따릅니다.</span>
    </div>
    <div style="display:flex;flex-direction:column;gap:10px">
      <div style="display:flex;gap:8px">
        <div style="flex:1">
          <div style="font-size:10px;font-weight:600;color:var(--c-gray-500);margin-bottom:3px">과목 *</div>
          <select id="mrSubject" style="width:100%;padding:6px 8px;border:1px solid var(--c-gray-200);border-radius:6px;font-size:11px;outline:none" onchange="document.getElementById('mrTypeCode').innerHTML='<option value=\\'\\'>템플릿 선택</option>'+getTypesForSubject(this.value.split('|')[0]).map(t=>'<option value=\\''+t+'\\'>'+(CONTENT_TYPES[t]?.icon||'')+' '+getTypeLabel(t)+' ['+t+']</option>').join('')">
            <option value="">과목 선택</option>
            ${subjectKeys.map(sk => `<option value="${sk}|${SUBJECT_TYPE_MAP[sk].name}">${SUBJECT_TYPE_MAP[sk].name} (${sk})</option>`).join('')}
          </select>
        </div>
        <div style="flex:1">
          <div style="font-size:10px;font-weight:600;color:var(--c-gray-500);margin-bottom:3px">콘텐츠 템플릿 *</div>
          <select id="mrTypeCode" style="width:100%;padding:6px 8px;border:1px solid var(--c-gray-200);border-radius:6px;font-size:11px;outline:none">
            <option value="">과목을 먼저 선택하세요</option>
          </select>
        </div>
      </div>
      <div style="display:flex;gap:8px">
        <div style="flex:1">
          <div style="font-size:10px;font-weight:600;color:var(--c-gray-500);margin-bottom:3px">과정코드 *</div>
          <input id="mrCourseCode" placeholder="예: C-SP-ENG-01" style="width:100%;padding:6px 8px;border:1px solid var(--c-gray-200);border-radius:6px;font-size:11px;outline:none;box-sizing:border-box">
        </div>
        <div style="flex:1">
          <div style="font-size:10px;font-weight:600;color:var(--c-gray-500);margin-bottom:3px">과정명</div>
          <input id="mrCourseName" placeholder="예: 특별 영어과정" style="width:100%;padding:6px 8px;border:1px solid var(--c-gray-200);border-radius:6px;font-size:11px;outline:none;box-sizing:border-box">
        </div>
      </div>
      <div style="display:flex;gap:8px">
        <div style="flex:1">
          <div style="font-size:10px;font-weight:600;color:var(--c-gray-500);margin-bottom:3px">세트코드 *</div>
          <input id="mrSetCode" placeholder="예: S-SP-01" style="width:100%;padding:6px 8px;border:1px solid var(--c-gray-200);border-radius:6px;font-size:11px;outline:none;box-sizing:border-box">
        </div>
        <div style="flex:1">
          <div style="font-size:10px;font-weight:600;color:var(--c-gray-500);margin-bottom:3px">세트명</div>
          <input id="mrSetName" placeholder="예: 1세트" style="width:100%;padding:6px 8px;border:1px solid var(--c-gray-200);border-radius:6px;font-size:11px;outline:none;box-sizing:border-box">
        </div>
      </div>
      <div>
        <div style="font-size:10px;font-weight:600;color:var(--c-gray-500);margin-bottom:3px">우선순위</div>
        <select id="mrPriority" style="width:100%;padding:6px 8px;border:1px solid var(--c-gray-200);border-radius:6px;font-size:11px;outline:none">
          <option value="normal">보통</option>
          <option value="high">긴급</option>
          <option value="low">낮음</option>
        </select>
      </div>
    </div>`,
    () => { wfSubmitManualRegister(); }
  );
}

function wfSubmitManualRegister() {
  var subjectVal = document.getElementById('mrSubject') ? document.getElementById('mrSubject').value : '';
  var parts = subjectVal.split('|');
  var subjectCode = parts[0] || '';
  var subjectName = parts[1] || '';
  var typeCode = document.getElementById('mrTypeCode') ? document.getElementById('mrTypeCode').value : '';
  var courseCode = (document.getElementById('mrCourseCode') ? document.getElementById('mrCourseCode').value : '').trim();
  var courseName = (document.getElementById('mrCourseName') ? document.getElementById('mrCourseName').value : '').trim() || courseCode;
  var setName = (document.getElementById('mrSetName') ? document.getElementById('mrSetName').value : '').trim() || '1\uC138\uD2B8';
  var priority = document.getElementById('mrPriority') ? document.getElementById('mrPriority').value : 'normal';

  if(!subjectCode || !typeCode || !courseCode) {
    toast('\uD544\uC218 \uD56D\uBAA9\uC744 \uBAA8\uB450 \uC785\uB825\uD574\uC8FC\uC138\uC694', 't-warn', 2000);
    return;
  }

  var typeInfo = CONTENT_TYPES[typeCode] || {};
  var nextId = 'wfm' + Date.now();
  var today = new Date().toISOString().split('T')[0];
  var isDbType = (typeof DB_TYPES !== 'undefined' && DB_TYPES.indexOf(typeCode) >= 0);
  var targetSys = isDbType ? 'hub' : 'ND';

  // 템플릿 단위 카드 생성
  STATE.workflowItems.push({
    id: nextId,
    templateName: typeInfo.label || typeCode,
    typeCode: typeCode,
    target: targetSys,
    subject: subjectName || subjectCode,
    subjectCode: subjectCode,
    course: courseName,
    phase: 'assign',
    assignee: null,
    priority: priority,
    createdAt: today,
    source: 'manual',
    setProgress: [{set: setName, status: 'idle'}],
    doneCount: 0,
    totalCount: 1
  });

  toast('\uC9C1\uC811 \uB4F1\uB85D \uC644\uB8CC \u2014 \uC791\uC5C5 \uC9C4\uD589 \uBCF4\uB4DC\uC5D0 \uCD94\uAC00\uB428', 't-ok', 2000);
  renderWorkflowView();
}

function wfCardAction(itemId, phaseId) {
  const item = STATE.workflowItems.find(i => i.id === itemId);
  if(!item) return;
  // 단계별로 적절한 화면으로 연결
  if(phaseId === 'receive') switchView('batch-receive');
  else if(phaseId === 'register' && item.nodeId) switchToCourseContent(getRootSubject(item.nodeId)?.id);
  else if(phaseId === 'review') switchView('review');
  else if(phaseId === 'deploy') switchView('deploy');
  else toast('"' + _getWfDisplayLabel(item) + '" \uC0C1\uC138 \uC815\uBCF4', 't-info');
}

// ════════════════════════════════
//  ■ SERVICE DISTRIBUTION VIEW (플랫폼 배포 현황)
// ════════════════════════════════
const SERVICE_PLATFORMS = [
  {id:'n365',   name:'눈높이365', icon:'📘', color:'#0071E3', bg:'#E8F2FF', border:'#B3D7FF', desc:'눈높이 365 학습 서비스'},
  {id:'growth', name:'성장판',    icon:'📊', color:'#34C759', bg:'#F0FFF4', border:'#A8E6B8', desc:'성장판 학습 관리 플랫폼'},
  {id:'lms',    name:'학습관',    icon:'🏫', color:'#FF9500', bg:'#FFF8F0', border:'#FFD9A8', desc:'학습관 서비스 플랫폼'},
];

// 콘텐츠별 플랫폼 배포 상태 샘플
const SERVICE_DIST_DATA = [
  {id:'sd1', title:'NE1 1세트 플래시카드', subject:'영어', subjectCode:'E', course:'NE1', set:'1세트', typeCode:'FLC', cmsStatus:'deployed', platforms:{n365:'deployed', growth:'deployed', lms:'pending'}},
  {id:'sd2', title:'NE1 1세트 핵심점검 본문', subject:'영어', subjectCode:'E', course:'NE1', set:'1세트', typeCode:'CBT', cmsStatus:'deployed', platforms:{n365:'deployed', growth:'pending', lms:'none'}},
  {id:'sd3', title:'NE1 2세트 웹콘텐츠', subject:'영어', subjectCode:'E', course:'NE1', set:'2세트', typeCode:'WEB', cmsStatus:'deployed', platforms:{n365:'deployed', growth:'deployed', lms:'deployed'}},
  {id:'sd4', title:'NE2 1세트 핵심점검 Cover', subject:'영어', subjectCode:'E', course:'NE2', set:'1세트', typeCode:'CCV', cmsStatus:'deployed', platforms:{n365:'pending', growth:'none', lms:'none'}},
  {id:'sd5', title:'기초수학 1세트 핵심점검', subject:'수학', subjectCode:'M', course:'기초수학', set:'1세트', typeCode:'CBT', cmsStatus:'reviewed', platforms:{n365:'none', growth:'none', lms:'none'}},
  {id:'sd6', title:'한글똑똑 1세트 해답지', subject:'한글똑똑', subjectCode:'LN', course:'한글똑똑1', set:'1세트', typeCode:'ANS', cmsStatus:'deployed', platforms:{n365:'deployed', growth:'deployed', lms:'pending'}},
  {id:'sd7', title:'놀이똑똑 동요', subject:'놀이똑똑', subjectCode:'BN', course:'놀이1', set:'1세트', typeCode:'VKS', cmsStatus:'deployed', platforms:{n365:'deployed', growth:'none', lms:'deployed'}},
  {id:'sd8', title:'한자 1세트 플래시카드', subject:'한자', subjectCode:'H', course:'한자1', set:'1세트', typeCode:'FLC', cmsStatus:'deployed', platforms:{n365:'pending', growth:'pending', lms:'none'}},
  {id:'sd9', title:'NE2 1세트 채점', subject:'영어', subjectCode:'E', course:'NE2', set:'1세트', typeCode:'AN2', cmsStatus:'reviewed', platforms:{n365:'none', growth:'none', lms:'none'}},
  {id:'sd10', title:'NE1 2세트 맞춤평가', subject:'영어', subjectCode:'E', course:'NE1', set:'2세트', typeCode:'EVA', cmsStatus:'deployed', platforms:{n365:'deployed', growth:'deployed', lms:'deployed'}},
];

const SD_FILTER = { platform:'all', status:'all', subject:'all' };

function sdTogglePlatform(itemId, platformId) {
  const item = SERVICE_DIST_DATA.find(i => i.id === itemId);
  if(!item) return;
  const cur = item.platforms[platformId];
  if(cur === 'none' || cur === 'pending') item.platforms[platformId] = 'deployed';
  else if(cur === 'deployed') item.platforms[platformId] = 'none';
  renderServiceDistView();
}

function sdSetFilter(key, val) { SD_FILTER[key] = val; renderServiceDistView(); }

// ═══════════════════════════════════════════════
//  ■ 과목 코드 관리 뷰
// ═══════════════════════════════════════════════

var CM_STATE = {
  search: '',
  filterGroup: 'all',    // all, registered, unregistered
  filterSystem: 'all',   // all, ND, NH, SJ, NH365
  sortBy: 'code',        // code, name, types
  selectedCode: null,
  page: 1,
  pageSize: 20,
  expandedCode: null,
};

// ── 학습관 별칭 (Display Name) 매핑 ──
// CMS 과목명과 학습관 서비스에서 보이는 이름이 다를 때 사용
// key: 과목코드, value: {nhName: 학습관표시명, note: 변경사유}
var SUBJECT_DISPLAY_NAMES = {
  AM:  {nhName:'중학교 1학년 수학', note:'학습관 서비스 레벨 기준 네이밍'},
  DAM: {nhName:'중학교 수학(심화)', note:'학습관 서비스 레벨 기준'},
  M:   {nhName:'초등 수학', note:'학습관 학년별 분류 기준'},
  E:   {nhName:'초등 영어', note:'학습관 학년별 분류 기준'},
  K:   {nhName:'초등 국어', note:'학습관 학년별 분류 기준'},
  MZ:  {nhName:'코어 수학(기본)', note:'학습관 난이도 기준 네이밍'},
  PDM1:{nhName:'초등 스코어수학 1단계', note:'학습관 단계별 네이밍'},
  DM1: {nhName:'중등 스코어수학 1단계', note:'학습관 단계별 네이밍'},
};

// ── 코드 등록/편집 팝업 state ──
var CM_EDIT_STATE = {
  isOpen: false,
  mode: 'add',        // 'add' | 'edit'
  code: '',
  courseName: '',
  nhName: '',
  nhNote: '',
  linkedSubjects: [],  // 서브 코드 목록
  editingCode: null,   // edit 모드일 때 원래 코드
};

// ── 코드 등록 팝업 열기 ──
function _cmOpenCodePopup(mode, code) {
  CM_EDIT_STATE.mode = mode || 'add';
  if(mode === 'edit' && code) {
    var cData = SUBJECT_COURSE_DATA[code] || {};
    var dn = SUBJECT_DISPLAY_NAMES[code] || {};
    var bundleInfo = _cmGetBundleInfo(code);
    var linked = [];
    if(bundleInfo.asHub.length > 0) {
      linked = bundleInfo.asHub[0].linkedSubjects.slice();
    }
    CM_EDIT_STATE.code = code;
    CM_EDIT_STATE.courseName = cData.courseName || (_SUBJECT_NAME_MAP[code] || '');
    CM_EDIT_STATE.nhName = dn.nhName || '';
    CM_EDIT_STATE.nhNote = dn.note || '';
    CM_EDIT_STATE.linkedSubjects = linked;
    CM_EDIT_STATE.editingCode = code;
  } else {
    CM_EDIT_STATE.code = '';
    CM_EDIT_STATE.courseName = '';
    CM_EDIT_STATE.nhName = '';
    CM_EDIT_STATE.nhNote = '';
    CM_EDIT_STATE.linkedSubjects = [];
    CM_EDIT_STATE.editingCode = null;
  }
  CM_EDIT_STATE.isOpen = true;
  _cmRenderCodePopup();
}

// ── 코드 등록 팝업 닫기 ──
function _cmCloseCodePopup() {
  CM_EDIT_STATE.isOpen = false;
  var el = document.getElementById('cmCodePopupOverlay');
  if(el) el.remove();
}

// ── 서브 코드 추가 입력 ──
function _cmAddLinkedSubject() {
  var inp = document.getElementById('cmNewSubCode');
  if(!inp) return;
  var val = inp.value.trim().toUpperCase();
  if(!val) return;
  if(CM_EDIT_STATE.linkedSubjects.indexOf(val) >= 0) { alert('이미 추가된 코드입니다.'); return; }
  if(val === CM_EDIT_STATE.code) { alert('메인 코드와 동일한 코드는 추가할 수 없습니다.'); return; }
  CM_EDIT_STATE.linkedSubjects.push(val);
  inp.value = '';
  _cmRenderCodePopup();
}

// ── 서브 코드 제거 ──
function _cmRemoveLinkedSubject(idx) {
  CM_EDIT_STATE.linkedSubjects.splice(idx, 1);
  _cmRenderCodePopup();
}

// ── 코드 등록 저장 ──
function _cmSaveCode() {
  var code = CM_EDIT_STATE.code.trim().toUpperCase();
  var cname = CM_EDIT_STATE.courseName.trim();
  if(!code) { alert('과목 코드를 입력해주세요.'); return; }
  if(!cname) { alert('과정명을 입력해주세요.'); return; }

  // SUBJECT_COURSE_DATA 업데이트
  if(!SUBJECT_COURSE_DATA[code]) {
    SUBJECT_COURSE_DATA[code] = {courseName: cname, courses:1, sets:10};
  } else {
    SUBJECT_COURSE_DATA[code].courseName = cname;
  }

  // _SUBJECT_NAME_MAP 업데이트
  _SUBJECT_NAME_MAP[code] = cname;

  // SUBJECT_TYPE_MAP에 없으면 추가
  if(!SUBJECT_TYPE_MAP[code]) {
    SUBJECT_TYPE_MAP[code] = {name: cname, children: CM_EDIT_STATE.linkedSubjects.slice(), types: []};
  } else {
    SUBJECT_TYPE_MAP[code].name = cname;
    SUBJECT_TYPE_MAP[code].children = CM_EDIT_STATE.linkedSubjects.slice();
  }

  // 학습관 별칭 저장
  var nhName = CM_EDIT_STATE.nhName.trim();
  if(nhName) {
    SUBJECT_DISPLAY_NAMES[code] = {nhName: nhName, note: CM_EDIT_STATE.nhNote.trim()};
  } else {
    delete SUBJECT_DISPLAY_NAMES[code];
  }

  // 서브 코드 번들 처리 (간단 시뮬)
  if(CM_EDIT_STATE.linkedSubjects.length > 0) {
    // linkedSubjects 이름 등록
    CM_EDIT_STATE.linkedSubjects.forEach(function(sc) {
      if(!_SUBJECT_NAME_MAP[sc]) _SUBJECT_NAME_MAP[sc] = sc;
    });
  }

  _cmCloseCodePopup();
  renderCodeManageView();
}

// ── 코드 등록/편집 팝업 렌더 ──
function _cmRenderCodePopup() {
  var old = document.getElementById('cmCodePopupOverlay');
  if(old) old.remove();

  var ov = document.createElement('div');
  ov.id = 'cmCodePopupOverlay';
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:10000;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(3px)';
  ov.onclick = function(e) { if(e.target === ov) _cmCloseCodePopup(); };

  var isEdit = CM_EDIT_STATE.mode === 'edit';
  var title = isEdit ? '과목 코드 편집' : '과목 코드 등록';

  var p = '';
  p += '<div style="background:#fff;border-radius:14px;width:540px;max-height:85vh;overflow-y:auto;box-shadow:0 25px 50px rgba(0,0,0,.18)">';

  // 헤더
  p += '<div style="padding:20px 24px 14px;border-bottom:1px solid #F5F5F7;display:flex;align-items:center;justify-content:space-between">';
  p += '<div style="font-size:16px;font-weight:600;color:#1D1D1F">' + title + '</div>';
  p += '<button onclick="_cmCloseCodePopup()" style="width:30px;height:30px;border:none;background:#F5F5F7;border-radius:8px;cursor:pointer;font-size:16px;color:#636366;display:flex;align-items:center;justify-content:center">&times;</button>';
  p += '</div>';

  // 본문
  p += '<div style="padding:20px 24px">';

  // 과목 코드
  p += '<div style="margin-bottom:16px">';
  p += '<label style="display:block;font-size:12px;font-weight:700;color:#48484A;margin-bottom:5px">과목 코드 <span style="color:#FF3B30">*</span></label>';
  p += '<input id="cmEditCode" type="text" value="' + (CM_EDIT_STATE.code || '') + '" ' + (isEdit ? 'disabled' : '') + ' oninput="CM_EDIT_STATE.code=this.value" placeholder="예: AM, DM1, QPA" style="width:100%;padding:9px 12px;border:1px solid #E5E5EA;border-radius:8px;font-size:13px;font-weight:700;font-family:monospace;outline:none;box-sizing:border-box;' + (isEdit ? 'background:#FAFAFA;color:#8E8E93' : '') + '">';
  p += '</div>';

  // 과정명 (CMS명)
  p += '<div style="margin-bottom:16px">';
  p += '<label style="display:block;font-size:12px;font-weight:700;color:#48484A;margin-bottom:5px">과정명 (CMS) <span style="color:#FF3B30">*</span></label>';
  p += '<input type="text" value="' + (CM_EDIT_STATE.courseName || '') + '" oninput="CM_EDIT_STATE.courseName=this.value" placeholder="예: 써밋스피드수학" style="width:100%;padding:9px 12px;border:1px solid #E5E5EA;border-radius:8px;font-size:13px;outline:none;box-sizing:border-box">';
  p += '</div>';

  // 구분선 + 학습관 별칭
  p += '<div style="border-top:1px dashed #E5E5EA;margin:20px 0 16px;padding-top:16px">';
  p += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:12px">';
  p += '<span style="font-size:13px;font-weight:700;color:#1D1D1F">학습관 서비스명</span>';
  p += '<span style="font-size:10px;padding:2px 8px;border-radius:4px;background:#F9F0FF;color:#AF52DE;font-weight:600">학습관 전용</span>';
  p += '</div>';
  p += '<div style="font-size:11px;color:#8E8E93;margin-bottom:10px">학습관에서 다른 이름으로 서비스될 경우 입력합니다. 미입력 시 CMS 과정명이 그대로 사용됩니다.</div>';

  p += '<div style="margin-bottom:10px">';
  p += '<label style="display:block;font-size:12px;font-weight:600;color:#48484A;margin-bottom:5px">학습관 표시명</label>';
  p += '<input type="text" value="' + (CM_EDIT_STATE.nhName || '') + '" oninput="CM_EDIT_STATE.nhName=this.value" placeholder="예: 중학교 1학년 수학" style="width:100%;padding:9px 12px;border:1px solid #E5E5EA;border-radius:8px;font-size:13px;outline:none;box-sizing:border-box">';
  p += '</div>';

  p += '<div style="margin-bottom:4px">';
  p += '<label style="display:block;font-size:12px;font-weight:600;color:#48484A;margin-bottom:5px">변경 사유</label>';
  p += '<input type="text" value="' + (CM_EDIT_STATE.nhNote || '') + '" oninput="CM_EDIT_STATE.nhNote=this.value" placeholder="예: 학습관 서비스 레벨 기준 네이밍" style="width:100%;padding:9px 12px;border:1px solid #E5E5EA;border-radius:8px;font-size:13px;outline:none;box-sizing:border-box">';
  p += '</div>';
  p += '</div>';

  // 구분선 + 서브 코드 연결
  p += '<div style="border-top:1px dashed #E5E5EA;margin:20px 0 16px;padding-top:16px">';
  p += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:12px">';
  p += '<span style="font-size:13px;font-weight:700;color:#1D1D1F">서브 코드 연결</span>';
  p += '<span style="font-size:10px;padding:2px 8px;border-radius:4px;background:#E8F2FF;color:#0071E3;font-weight:600">묶음</span>';
  p += '</div>';
  p += '<div style="font-size:11px;color:#8E8E93;margin-bottom:10px">이 메인 코드에 연결할 서브 과목 코드를 추가합니다. 콘텐츠 묶음(Hub→Spoke) 관계가 설정됩니다.</div>';

  // 서브 코드 목록
  if(CM_EDIT_STATE.linkedSubjects.length > 0) {
    p += '<div style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px">';
    CM_EDIT_STATE.linkedSubjects.forEach(function(sc, si) {
      var scName = _SUBJECT_NAME_MAP[sc] || sc;
      p += '<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:#FAFAFA;border-radius:8px;border:1px solid #E5E5EA">';
      p += '<span style="font-weight:600;font-family:monospace;font-size:13px;color:#0369A1;background:#E8F2FF;padding:2px 8px;border-radius:4px">' + sc + '</span>';
      p += '<span style="font-size:12px;color:#48484A;flex:1">' + scName + '</span>';
      p += '<button onclick="_cmRemoveLinkedSubject(' + si + ')" style="width:24px;height:24px;border:none;background:#FFB3AE;border-radius:6px;cursor:pointer;font-size:13px;color:#FF3B30;display:flex;align-items:center;justify-content:center">&times;</button>';
      p += '</div>';
    });
    p += '</div>';
  }

  // 서브 코드 추가 입력
  p += '<div style="display:flex;gap:6px">';
  p += '<input id="cmNewSubCode" type="text" placeholder="서브 코드 입력 (예: AMA)" onkeydown="if(event.key===\'Enter\'){event.preventDefault();_cmAddLinkedSubject();}" style="flex:1;padding:8px 12px;border:1px solid #E5E5EA;border-radius:8px;font-size:13px;font-family:monospace;font-weight:700;outline:none">';
  p += '<button onclick="_cmAddLinkedSubject()" style="padding:8px 16px;background:#0071E3;color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:500;cursor:pointer;white-space:nowrap">+ 추가</button>';
  p += '</div>';
  p += '</div>';

  p += '</div>';

  // 푸터
  p += '<div style="padding:14px 24px 20px;border-top:1px solid #F5F5F7;display:flex;gap:8px;justify-content:flex-end">';
  p += '<button onclick="_cmCloseCodePopup()" style="padding:9px 20px;border:1px solid #E5E5EA;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;background:#fff;color:#636366">취소</button>';
  p += '<button onclick="_cmSaveCode()" style="padding:9px 24px;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;background:#0071E3;color:#fff">' + (isEdit ? '저장' : '등록') + '</button>';
  p += '</div>';

  p += '</div>';

  ov.innerHTML = p;
  document.body.appendChild(ov);
}

function renderCodeManageView() {
  var root = document.getElementById('codeManageRoot');
  if(!root) return;

  var subjects = Object.entries(SUBJECT_TYPE_MAP);
  var q = CM_STATE.search.toLowerCase();

  // 필터링
  var filtered = subjects.filter(function(entry) {
    var code = entry[0];
    var cData = SUBJECT_COURSE_DATA[code] || {};
    var name = cData.courseName || (_SUBJECT_NAME_MAP[code] || code);
    var hasTypes = !!REGISTERED_WORK_TYPES[code] && REGISTERED_WORK_TYPES[code].length > 0;
    var regTypes = REGISTERED_WORK_TYPES[code] || [];

    // 텍스트 검색 (코드, 과정명, 유형명)
    if(q) {
      var match = code.toLowerCase().indexOf(q) >= 0 || name.toLowerCase().indexOf(q) >= 0;
      if(!match) {
        match = regTypes.some(function(rt) { return rt.name.toLowerCase().indexOf(q) >= 0; });
      }
      if(!match) return false;
    }
    // 상태 필터
    if(CM_STATE.filterGroup === 'registered' && !hasTypes) return false;
    if(CM_STATE.filterGroup === 'unregistered' && hasTypes) return false;
    // 시스템 필터
    if(CM_STATE.filterSystem !== 'all') {
      if(!hasTypes) return false;
      var hasSys = regTypes.some(function(rt) { return (rt.target || 'ND') === CM_STATE.filterSystem; });
      if(!hasSys) return false;
    }
    return true;
  });

  // 정렬
  filtered.sort(function(a, b) {
    if(CM_STATE.sortBy === 'name') {
      var na = (SUBJECT_COURSE_DATA[a[0]] || {}).courseName || a[0];
      var nb = (SUBJECT_COURSE_DATA[b[0]] || {}).courseName || b[0];
      return na.localeCompare(nb, 'ko');
    }
    if(CM_STATE.sortBy === 'types') {
      var la = (REGISTERED_WORK_TYPES[a[0]] || []).length;
      var lb = (REGISTERED_WORK_TYPES[b[0]] || []).length;
      return lb - la;
    }
    return a[0].localeCompare(b[0]);
  });

  // 페이징
  var totalPages = Math.max(1, Math.ceil(filtered.length / CM_STATE.pageSize));
  if(CM_STATE.page > totalPages) CM_STATE.page = totalPages;
  var startIdx = (CM_STATE.page - 1) * CM_STATE.pageSize;
  var pageItems = filtered.slice(startIdx, startIdx + CM_STATE.pageSize);

  var totalCount = subjects.length;
  var regCount = subjects.filter(function(e) { return REGISTERED_WORK_TYPES[e[0]] && REGISTERED_WORK_TYPES[e[0]].length > 0; }).length;
  var bundledCount = _cmCountBundledCodes();

  var h = '';
  h += '<div style="display:flex;flex-direction:column;height:100%;overflow:hidden">';

  // ── 헤더 ──
  h += '<div style="padding:16px 24px 14px;border-bottom:1px solid #E5E5EA;background:#fff;flex-shrink:0">';
  h += '<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">';
  h += '<div><div style="font-size:16px;font-weight:600;color:#1D1D1F;letter-spacing:-.02em">과목 코드 관리</div>';
  h += '<div style="font-size:12px;color:#8E8E93;margin-top:2px">전체 과목 코드 조회 · 콘텐츠 등록 현황 · 묶음 연결 · 고급 검색</div></div>';
  h += '<div style="margin-left:auto;display:flex;gap:6px;align-items:center">';
  h += '<span style="font-size:12px;padding:4px 10px;border-radius:6px;background:#F5F5F7;color:#48484A;font-weight:600">' + totalCount + '개 전체</span>';
  h += '<span style="font-size:12px;padding:4px 10px;border-radius:6px;background:#A8E6B8;color:#1B8A3E;font-weight:600">' + regCount + ' 등록</span>';
  h += '<span style="font-size:12px;padding:4px 10px;border-radius:6px;background:#E8F2FF;color:#3730A3;font-weight:600">' + bundledCount + ' 묶음</span>';
  h += '</div></div>';

  // ── 검색바 (고급) ──
  h += '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">';

  // 검색 인풋
  h += '<div style="flex:1;position:relative;min-width:260px;max-width:420px">';
  h += '<svg viewBox="0 0 24 24" fill="none" stroke="#8E8E93" stroke-width="2" style="position:absolute;left:11px;top:50%;transform:translateY(-50%);width:15px;height:15px;pointer-events:none"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';
  h += '<input id="cmSearchInput" type="text" placeholder="코드, 과정명, 템플릿명으로 검색" value="' + (CM_STATE.search || '') + '" oninput="CM_STATE.search=this.value;CM_STATE.page=1;renderCodeManageView()" style="width:100%;padding:8px 12px 8px 34px;border:1px solid #E5E5EA;border-radius:8px;font-size:13px;outline:none;transition:border-color .15s" onfocus="this.style.borderColor=\'#B3D7FF\'" onblur="this.style.borderColor=\'#E5E5EA\'">';
  h += '</div>';

  // 상태 필터
  h += '<div style="display:flex;gap:0;border:1px solid #E5E5EA;border-radius:8px;overflow:hidden">';
  var grps = [{v:'all',l:'전체'},{v:'registered',l:'등록됨'},{v:'unregistered',l:'미등록'}];
  grps.forEach(function(g) {
    var isOn = CM_STATE.filterGroup === g.v;
    h += '<button onclick="CM_STATE.filterGroup=\'' + g.v + '\';CM_STATE.page=1;renderCodeManageView()" style="padding:6px 12px;border:none;font-size:12px;font-weight:' + (isOn ? 700 : 500) + ';cursor:pointer;background:' + (isOn ? '#1D1D1F' : '#fff') + ';color:' + (isOn ? '#fff' : '#636366') + ';transition:all .12s">' + g.l + '</button>';
  });
  h += '</div>';

  // 시스템 필터
  h += '<select onchange="CM_STATE.filterSystem=this.value;CM_STATE.page=1;renderCodeManageView()" style="padding:6px 10px;border:1px solid #E5E5EA;border-radius:8px;font-size:12px;outline:none;cursor:pointer">';
  h += '<option value="all"' + (CM_STATE.filterSystem==='all'?' selected':'') + '>전체 시스템</option>';
  Object.keys(WC_SYSTEM_COLORS).forEach(function(sk) {
    h += '<option value="' + sk + '"' + (CM_STATE.filterSystem===sk?' selected':'') + '>' + WC_SYSTEM_COLORS[sk].label + '</option>';
  });
  h += '</select>';

  // 정렬
  h += '<select onchange="CM_STATE.sortBy=this.value;renderCodeManageView()" style="padding:6px 10px;border:1px solid #E5E5EA;border-radius:8px;font-size:12px;outline:none;cursor:pointer">';
  h += '<option value="code"' + (CM_STATE.sortBy==='code'?' selected':'') + '>코드순</option>';
  h += '<option value="name"' + (CM_STATE.sortBy==='name'?' selected':'') + '>과정명순</option>';
  h += '<option value="types"' + (CM_STATE.sortBy==='types'?' selected':'') + '>템플릿수순</option>';
  h += '</select>';

  h += '<span style="font-size:12px;color:#8E8E93">' + filtered.length + '건</span>';

  // 코드 등록 버튼
  h += '<button onclick="_cmOpenCodePopup(\'add\')" style="padding:7px 14px;background:#0071E3;color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:500;cursor:pointer;white-space:nowrap;display:flex;align-items:center;gap:4px"><span style="font-size:14px;line-height:1">+</span> 코드 등록</button>';
  h += '</div></div>';

  // ── 테이블 ──
  h += '<div style="flex:1;overflow-y:auto">';
  h += '<table style="width:100%;border-collapse:collapse;font-size:13px;table-layout:fixed">';
  h += '<colgroup><col style="width:25%"><col style="width:33%"><col style="width:27%"><col style="width:15%"></colgroup>';
  h += '<thead><tr style="background:#FAFAFA;border-bottom:2px solid #E5E5EA;position:sticky;top:0;z-index:1">';
  h += '<th style="padding:10px 16px;text-align:left;font-weight:700;color:#48484A">메인 코드</th>';
  h += '<th style="padding:10px 12px;text-align:left;font-weight:700;color:#48484A">서브 코드</th>';
  h += '<th style="padding:10px 12px;text-align:left;font-weight:700;color:#48484A">등록 템플릿</th>';
  h += '<th style="padding:10px 12px;text-align:center;font-weight:700;color:#48484A">상태</th>';
  h += '</tr></thead><tbody>';

  if(pageItems.length === 0) {
    h += '<tr><td colspan="4" style="padding:40px;text-align:center;color:#8E8E93">검색 결과가 없습니다</td></tr>';
  }

  pageItems.forEach(function(entry) {
    var code = entry[0];
    var cData = SUBJECT_COURSE_DATA[code] || {courseName: _SUBJECT_NAME_MAP[code] || code, courses:1, sets:10};
    var regTypes = REGISTERED_WORK_TYPES[code] || [];
    var hasTypes = regTypes.length > 0;
    var isExpanded = CM_STATE.expandedCode === code;
    var bundleInfo = _cmGetBundleInfo(code);

    // 메인 행
    h += '<tr style="border-bottom:1px solid #F5F5F7;background:' + (isExpanded ? '#F0F9FF' : '#fff') + ';cursor:pointer;transition:background .1s" onclick="CM_STATE.expandedCode=(CM_STATE.expandedCode===\'' + code + '\'?null:\'' + code + '\');renderCodeManageView()" onmouseenter="this.style.background=\'' + (isExpanded ? '#E0F2FE' : '#FAFAFA') + '\'" onmouseleave="this.style.background=\'' + (isExpanded ? '#F0F9FF' : '#fff') + '\'">';

    // 메인 코드 (코드 + 과정명 + 학습관명을 한 셀에)
    var dnInfo = SUBJECT_DISPLAY_NAMES[code];
    h += '<td style="padding:10px 16px;vertical-align:top;overflow:hidden">';
    h += '<div style="display:flex;align-items:center;gap:8px">';
    h += '<span style="font-weight:600;color:#1D1D1F;font-family:\'SF Mono\',SFMono-Regular,Consolas,monospace;font-size:13px;background:#F5F5F7;padding:2px 8px;border-radius:4px;letter-spacing:.5px;flex-shrink:0">' + code + '</span>';
    h += '</div>';
    h += '<div style="margin-top:4px;font-size:13px;color:#2C2C2E;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + cData.courseName + '</div>';
    if(dnInfo && dnInfo.nhName) {
      h += '<div style="margin-top:3px;font-size:11px;color:#AF52DE;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="학습관: ' + dnInfo.nhName + '">학습관: ' + dnInfo.nhName + '</div>';
    }
    h += '</td>';

    // 서브 코드 (연결된 과목 코드 + 과정명, 줄바꿈)
    h += '<td style="padding:10px 12px;vertical-align:top;overflow:hidden">';
    if(bundleInfo.asHub.length > 0) {
      var hubLinked = bundleInfo.asHub[0].linkedSubjects;
      h += '<div style="display:flex;flex-direction:column;gap:4px">';
      hubLinked.forEach(function(s) {
        var sName = _SUBJECT_NAME_MAP[s] || s;
        h += '<div style="display:flex;align-items:center;gap:6px;font-size:12px">';
        h += '<span style="font-weight:700;color:#0369A1;font-family:\'SF Mono\',SFMono-Regular,Consolas,monospace;background:#E8F2FF;padding:1px 6px;border-radius:3px;flex-shrink:0">' + s + '</span>';
        h += '<span style="color:#48484A;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + sName + '</span>';
        h += '</div>';
      });
      h += '</div>';
    } else if(bundleInfo.asSpoke.length > 0) {
      var hubCode = bundleInfo.asSpoke[0].masterSubject;
      var hubName = _SUBJECT_NAME_MAP[hubCode] || hubCode;
      h += '<div style="display:flex;align-items:center;gap:6px;font-size:12px">';
      h += '<span style="color:#8E8E93;font-size:11px">←</span>';
      h += '<span style="font-weight:700;color:#0369A1;font-family:\'SF Mono\',SFMono-Regular,Consolas,monospace;background:#E8F2FF;padding:1px 6px;border-radius:3px">' + hubCode + '</span>';
      h += '<span style="color:#48484A">' + hubName + '</span>';
      h += '</div>';
    } else {
      h += '<span style="font-size:12px;color:#D1D1D6">—</span>';
    }
    h += '</td>';

    // 콘텐츠 유형 뱃지
    h += '<td style="padding:8px 12px;vertical-align:top;overflow:hidden">';
    if(hasTypes) {
      h += '<div style="display:flex;flex-wrap:wrap;gap:4px">';
      regTypes.forEach(function(rt, ri) {
        var sys = WC_SYSTEM_COLORS[rt.target || 'ND'] || WC_SYSTEM_COLORS.ND;
        h += '<span onclick="event.stopPropagation();openWorkTypeAttrPopup(\'' + code + '\',' + ri + ')" style="font-size:10px;padding:3px 8px;border-radius:4px;background:' + sys.bg + ';color:' + sys.color + ';font-weight:600;border:1px solid ' + sys.border + ';cursor:pointer;white-space:nowrap;line-height:1.3">' + rt.typeCode + ' ' + (sys.label || '') + '</span>';
      });
      h += '</div>';
    } else {
      h += '<span style="font-size:11px;color:#D1D1D6">—</span>';
    }
    h += '</td>';

    // 상태
    h += '<td style="padding:10px 12px;text-align:center;vertical-align:top">';
    if(hasTypes) {
      h += '<span style="font-size:10px;padding:3px 10px;border-radius:10px;background:#A8E6B8;color:#1B8A3E;font-weight:700">등록됨</span>';
    } else {
      h += '<span style="font-size:10px;padding:3px 10px;border-radius:10px;background:#FFF8F0;color:#B35C00;font-weight:700">미등록</span>';
    }
    h += '</td>';

    h += '</tr>';

    // 확장 행 (디테일 패널)
    if(isExpanded) {
      h += '<tr style="background:#F0F9FF;border-bottom:2px solid #E8F2FF">';
      h += '<td colspan="4" style="padding:16px 24px">';

      // 묶음 연결 정보
      h += '<div style="margin-bottom:20px">';
      h += '<div style="font-size:12px;font-weight:700;color:#1D1D1F;margin-bottom:8px">묶음 연결 정보</div>';
      if(bundleInfo.asHub.length > 0) {
        var hub = bundleInfo.asHub[0];
        h += '<div style="font-size:12px;color:#2C2C2E;padding:8px 12px;background:#fff;border-radius:6px;border:1px solid #E8F2FF">';
        h += '<span style="font-weight:600">' + code + '</span> → ';
        var hubLinks = hub.linkedSubjects.map(function(s) { return '<span style="font-weight:600;color:#0369A1">' + s + '</span>'; }).join(', ');
        h += hubLinks;
        h += '</div>';
      } else if(bundleInfo.asSpoke.length > 0) {
        var spoke = bundleInfo.asSpoke[0];
        var spokeHub = spoke.masterSubject;
        h += '<div style="font-size:12px;color:#2C2C2E;padding:8px 12px;background:#fff;border-radius:6px;border:1px solid #E8F2FF">';
        h += '<span style="font-weight:600">' + code + '</span> ← <span style="font-weight:600;color:#0369A1">' + spokeHub + '</span>에 연결됨';
        h += '</div>';
      } else {
        h += '<div style="font-size:12px;color:#8E8E93;padding:8px 12px">독립 코드 (묶음 없음)</div>';
      }
      h += '</div>';

      // 등록 템플릿 상세 (Depth 구조 + 분할 정보)
      h += '<div style="margin-bottom:20px">';
      h += '<div style="font-size:12px;font-weight:700;color:#1D1D1F;margin-bottom:8px">\uB4F1\uB85D \uD15C\uD50C\uB9BF \uC0C1\uC138</div>';
      if(regTypes.length > 0) {
        h += '<div style="display:flex;flex-direction:column;gap:8px">';
        regTypes.forEach(function(rt, ri) {
          var sys = WC_SYSTEM_COLORS[rt.target || 'ND'] || WC_SYSTEM_COLORS.ND;
          var depthInfo = _wcGetLinkedDepth(rt);
          var _cmLabel = _getTypeLabel(rt.typeCode);
          var _cmSN = _getStructureName(rt.ltTypeId);
          var _curSrc = rt.currSrc || 'origin';
          var _csrcMap2 = {origin:{l:'\uC6D0\uBCF8',bg:'#E8F2FF',c:'#0055B8'},remix:{l:'\uC7AC\uAD6C\uC131',bg:'#FFF8F0',c:'#B35C00'},create:{l:'\uC790\uCCB4',bg:'#F9F0FF',c:'#8944AB'}};
          var _cs2 = _csrcMap2[_curSrc] || _csrcMap2.origin;

          h += '<div style="background:#fff;border-radius:8px;border:1px solid #E5E5EA;overflow:hidden">';
          // 헤더
          h += '<div style="display:flex;align-items:center;gap:6px;padding:8px 12px;border-bottom:1px solid #F5F5F7">';
          h += '<span style="padding:2px 8px;border-radius:4px;background:' + sys.bg + ';color:' + sys.color + ';font-weight:700;font-size:11px;border:1px solid ' + sys.border + '">' + sys.label + '</span>';
          h += '<span style="font-weight:700;font-size:12px;color:#1D1D1F">' + _cmLabel + '</span>';
          if(_cmSN) h += '<span style="color:#636366;font-size:11px">' + _cmSN + '</span>';
          h += '<span style="font-size:9px;padding:1px 5px;border-radius:3px;background:' + _cs2.bg + ';color:' + _cs2.c + ';font-weight:700">' + _cs2.l + '</span>';
          h += '</div>';
          // Depth 구조 + 분할 정보 바디
          h += '<div style="padding:8px 12px">';
          if(depthInfo && depthInfo.depthNames.length > 0) {
            h += '<div style="display:flex;align-items:center;gap:4px;margin-bottom:6px;flex-wrap:wrap">';
            h += '<span style="font-size:10px;font-weight:700;color:#0369A1">' + depthInfo.depthCount + '\uB2E8\uACC4:</span>';
            depthInfo.depthNames.forEach(function(dn, di) {
              if(di > 0) h += '<span style="font-size:9px;color:#8E8E93">\u203A</span>';
              h += '<span style="font-size:10px;padding:1px 6px;border-radius:3px;background:#F0F9FF;color:#0369A1;font-weight:600;border:1px solid #BAE6FD">' + dn + '</span>';
            });
            h += '</div>';
          }
          // 분할 현황
          var hasRanges = rt.setRanges && rt.setRanges.length > 0;
          var hasCurr = rt.customCurriculum && rt.customCurriculum.groups && rt.customCurriculum.groups.length > 0;
          if(hasRanges) {
            var _splitName3 = (depthInfo && depthInfo.depthNames[rt.splitDepth || 0]) || '\uC138\uD2B8';
            var _totalA = 0;
            rt.setRanges.forEach(function(r){ _totalA += (r.to - r.from + 1); });
            var rangeColors = ['#0071E3','#10B981','#FF9500','#FF3B30','#AF52DE','#EC4899','#14B8A6','#F97316'];
            // 시각화 바
            h += '<div style="display:flex;gap:1px;height:5px;border-radius:3px;overflow:hidden;margin-bottom:6px;background:#E5E5EA">';
            rt.setRanges.forEach(function(r, ri2) {
              var pct = ((r.to - r.from + 1) / _totalA * 100);
              h += '<div style="width:' + pct + '%;background:' + rangeColors[ri2 % rangeColors.length] + '" title="' + _splitName3 + ' ' + r.from + '~' + r.to + ' (' + r.assignee + ')"></div>';
            });
            h += '</div>';
            // 범위 목록
            h += '<div style="display:flex;flex-wrap:wrap;gap:4px">';
            rt.setRanges.forEach(function(r, ri2) {
              var rColor = rangeColors[ri2 % rangeColors.length];
              h += '<div style="display:flex;align-items:center;gap:4px;font-size:10px;padding:2px 6px;background:#FAFAFA;border-radius:4px;border:1px solid #E5E5EA">';
              h += '<span style="width:6px;height:6px;border-radius:2px;background:' + rColor + ';flex-shrink:0"></span>';
              h += '<span style="color:#48484A;font-weight:600">' + _splitName3 + ' ' + r.from + '~' + r.to + '</span>';
              h += '<span style="color:#8E8E93">(' + (r.to - r.from + 1) + '\uAC1C)</span>';
              h += '<span style="color:#636366;font-weight:600">' + r.assignee + '</span>';
              h += '</div>';
            });
            h += '</div>';
            h += '<div style="margin-top:4px;font-size:9px;color:#34C759;font-weight:600">\u2713 \uC804\uCCB4 ' + _totalA + ' ' + _splitName3 + ' \u00B7 ' + rt.setRanges.length + '\uBD84\uD560 \uD560\uB2F9</div>';
          } else if(hasCurr) {
            var _cc3 = rt.customCurriculum;
            var _totalU3 = 0;
            _cc3.groups.forEach(function(g){ _totalU3 += g.units.length; });
            h += '<div style="display:flex;flex-wrap:wrap;gap:4px">';
            _cc3.groups.forEach(function(g, gi) {
              h += '<div style="font-size:10px;padding:2px 6px;background:#FAFAFA;border-radius:4px;border:1px solid #E5E5EA;display:flex;align-items:center;gap:3px">';
              h += '<span style="color:#48484A;font-weight:600">' + g.name + '</span>';
              h += '<span style="color:#8E8E93">(' + g.units.length + (_cc3.unitName || '\uAC1C') + ')</span>';
              if(g.assignee) h += '<span style="color:#636366;font-weight:600">' + g.assignee + '</span>';
              h += '</div>';
            });
            h += '</div>';
            h += '<div style="margin-top:4px;font-size:9px;color:#34C759;font-weight:600">\u2713 ' + _cc3.groups.length + '\uADF8\uB8F9 \u00B7 \uCD1D ' + _totalU3 + ' ' + (_cc3.unitName || '\uB2E8\uC704') + '</div>';
          } else {
            h += '<div style="font-size:10px;color:#8E8E93">\uBD84\uD560 \uBBF8\uC124\uC815</div>';
          }
          h += '</div></div>';
        });
        h += '</div>';
      } else {
        h += '<div style="font-size:12px;color:#8E8E93">\uB4F1\uB85D\uB41C \uD15C\uD50C\uB9BF \uC5C6\uC74C</div>';
      }
      h += '</div>';

      // 연계 시스템
      h += '<div style="margin-bottom:20px">';
      h += '<div style="font-size:12px;font-weight:700;color:#1D1D1F;margin-bottom:8px">연계 시스템</div>';
      var linkedSys = [];
      bundleInfo.asHub.forEach(function(b) {
        linkedSys = linkedSys.concat(b.linkedSystems || []);
      });
      bundleInfo.asSpoke.forEach(function(b) {
        linkedSys = linkedSys.concat(b.linkedSystems || []);
      });
      linkedSys = linkedSys.filter(function(v, i, a) { return a.indexOf(v) === i; });
      if(linkedSys.length > 0) {
        h += '<div style="display:flex;flex-wrap:wrap;gap:6px">';
        linkedSys.forEach(function(sys) {
          h += '<span style="font-size:11px;padding:4px 10px;border-radius:4px;background:#F5F5F7;color:#48484A;font-weight:600;border:1px solid #E5E5EA">' + sys + '</span>';
        });
        h += '</div>';
      } else {
        h += '<div style="font-size:12px;color:#8E8E93">연계 시스템 없음</div>';
      }
      h += '</div>';

      // 학습관 별칭
      var _dn = SUBJECT_DISPLAY_NAMES[code];
      h += '<div style="margin-bottom:20px">';
      h += '<div style="font-size:12px;font-weight:700;color:#1D1D1F;margin-bottom:8px">학습관 서비스명</div>';
      if(_dn && _dn.nhName) {
        h += '<div style="padding:8px 12px;background:#F9F0FF;border-radius:6px;border:1px solid #D9B3F0;font-size:12px">';
        h += '<span style="color:#AF52DE;font-weight:700">' + _dn.nhName + '</span>';
        if(_dn.note) { h += '<span style="color:#AF52DE;margin-left:8px">(' + _dn.note + ')</span>'; }
        h += '</div>';
      } else {
        h += '<div style="font-size:12px;color:#8E8E93;padding:8px 12px">CMS 과정명과 동일 (별도 학습관명 미설정)</div>';
      }
      h += '</div>';

      // 관리 액션
      h += '<div>';
      h += '<div style="font-size:12px;font-weight:700;color:#1D1D1F;margin-bottom:8px">관리 액션</div>';
      h += '<div style="display:flex;gap:6px">';
      if(bundleInfo.asHub.length > 0 || bundleInfo.asSpoke.length === 0) {
        h += '<button onclick="event.stopPropagation();alert(\'[개발예정] 묶음 생성 기능\')" style="padding:6px 12px;border:1px solid #0071E3;border-radius:6px;background:#E8F2FF;color:#0071E3;font-size:12px;font-weight:600;cursor:pointer">묶음 생성</button>';
      }
      if(bundleInfo.asSpoke.length > 0) {
        h += '<button onclick="event.stopPropagation();alert(\'[개발예정] 묶음 해제 기능\')" style="padding:6px 12px;border:1px solid #FF3B30;border-radius:6px;background:#FFF2F1;color:#FF3B30;font-size:12px;font-weight:600;cursor:pointer">묶음 해제</button>';
      }
      h += '<button onclick="event.stopPropagation();openWorkTypeRegisterPopup(\'' + code + '\')" style="padding:6px 12px;border:1px solid #34C759;border-radius:6px;background:#F0FFF4;color:#34C759;font-size:12px;font-weight:600;cursor:pointer">+ 템플릿 등록</button>';
      h += '<button onclick="event.stopPropagation();_cmOpenCodePopup(\'edit\',\'' + code + '\')" style="padding:6px 12px;border:1px solid #636366;border-radius:6px;background:#FAFAFA;color:#48484A;font-size:12px;font-weight:600;cursor:pointer">코드 편집</button>';
      h += '</div>';
      h += '</div>';

      h += '</td>';
      h += '</tr>';
    }
  });

  h += '</tbody></table></div>';

  // ── 페이징 ──
  h += '<div style="padding:10px 24px;border-top:1px solid #E5E5EA;background:#fff;display:flex;align-items:center;justify-content:center;gap:6px;flex-shrink:0">';
  h += '<button onclick="CM_STATE.page=Math.max(1,CM_STATE.page-1);renderCodeManageView()" ' + (CM_STATE.page <= 1 ? 'disabled' : '') + ' style="padding:5px 12px;border:1px solid #E5E5EA;border-radius:6px;font-size:12px;cursor:pointer;background:#fff;color:' + (CM_STATE.page <= 1 ? '#D1D1D6' : '#48484A') + '">이전</button>';
  h += '<span style="font-size:12px;color:#636366;padding:0 8px">' + CM_STATE.page + ' / ' + totalPages + '</span>';
  h += '<button onclick="CM_STATE.page=Math.min(' + totalPages + ',CM_STATE.page+1);renderCodeManageView()" ' + (CM_STATE.page >= totalPages ? 'disabled' : '') + ' style="padding:5px 12px;border:1px solid #E5E5EA;border-radius:6px;font-size:12px;cursor:pointer;background:#fff;color:' + (CM_STATE.page >= totalPages ? '#D1D1D6' : '#48484A') + '">다음</button>';
  h += '</div>';

  h += '</div>';
  root.innerHTML = h;
}

// ─── Helper Functions for Code Manage View ───
function _cmGetBundleInfo(code) {
  var asHub = CONTENT_BUNDLES.filter(function(b) { return b.masterSubject === code; });
  var asSpoke = CONTENT_BUNDLES.filter(function(b) { return b.linkedSubjects.indexOf(code) >= 0; });
  return { asHub: asHub, asSpoke: asSpoke };
}

function _cmCountBundledCodes() {
  var bundledCodes = {};
  CONTENT_BUNDLES.forEach(function(b) {
    bundledCodes[b.masterSubject] = true;
    b.linkedSubjects.forEach(function(s) { bundledCodes[s] = true; });
  });
  return Object.keys(bundledCodes).length;
}

// ═══════════════════════════════════════════════
//  ■ 콘텐츠 유형 관리 뷰
// ═══════════════════════════════════════════════

// ═══ DB 필드 카탈로그 (시스템 관리자/개발자가 사전 정의) ═══
// 콘텐츠 유형에서 속성 추가 시 이 카탈로그에서 선택
// 새로운 필드가 필요하면 개발자 협의 후 여기에 추가
var DB_FIELD_CATALOG = [
  // ── 파일 관련 ──
  {key:'answer_file',   label:'정답 파일',         type:'file',   category:'파일', desc:'정답지 파일 업로드'},
  {key:'content_file',  label:'콘텐츠 파일',       type:'file',   category:'파일', desc:'메인 콘텐츠 파일 업로드'},
  {key:'content_zip',   label:'콘텐츠 파일(ZIP)',   type:'file',   category:'파일', desc:'ZIP 패키지 콘텐츠'},
  {key:'video_file',    label:'영상 파일',         type:'file',   category:'파일', desc:'학습 영상 파일'},
  {key:'thumbnail',     label:'미리보기 이미지',    type:'file',   category:'파일', desc:'대표 이미지 / 썸네일'},
  {key:'subtitle_file', label:'자막 파일',         type:'file',   category:'파일', desc:'영상 자막(SRT, VTT 등)'},
  {key:'question_file', label:'문제 파일',         type:'file',   category:'파일', desc:'평가 문제 파일'},
  // ── 학습 구조 ──
  {key:'day_number',    label:'학습일 번호',       type:'number', category:'학습 구조', desc:'Day 번호 (학습 진도)'},
  {key:'seq',           label:'순번',             type:'number', category:'학습 구조', desc:'정렬/배치 순번'},
  {key:'duration',      label:'재생 시간(초)',     type:'number', category:'학습 구조', desc:'콘텐츠 재생 시간'},
  {key:'time_limit',    label:'제한 시간(초)',     type:'number', category:'학습 구조', desc:'평가/활동 제한 시간'},
  // ── 분류/구분 ──
  {key:'detail_type',   label:'유형 구분',         type:'select', category:'분류', desc:'세부 유형 분류', options:['일반','특별']},
  {key:'difficulty',    label:'난이도',            type:'select', category:'분류', desc:'콘텐츠 난이도', options:['상','중','하']},
  {key:'file_format',   label:'파일 형식',         type:'select', category:'분류', desc:'제작 파일 형식', options:['SWF','HTML5','MP4','PDF']},
  {key:'resolution',    label:'화질',             type:'select', category:'분류', desc:'영상 화질', options:['720p','1080p','4K']},
  // ── 텍스트/경로 ──
  {key:'entry_url',     label:'시작 페이지 경로',   type:'text',   category:'경로/텍스트', desc:'웹 콘텐츠 진입점 URL'},
  {key:'answer_text',   label:'정답',             type:'text',   category:'경로/텍스트', desc:'정답 텍스트'},
  {key:'memo',          label:'비고',             type:'text',   category:'경로/텍스트', desc:'관리 메모, 비고'},
];

// ═══════════════════════════════════════════════════════
// ■ LT_FIELD_POOL: 필드 풀 (속성 + 양식 양쪽에서 참조)
// DB_FIELD_CATALOG 를 기반으로 카테고리별 정리 + 확장 필드
// ═══════════════════════════════════════════════════════
var LT_FIELD_POOL = [
  // ── 파일 관련 ──
  {key:'answer_file',   label:'\uC815\uB2F5 \uD30C\uC77C',         type:'file',   category:'\uD30C\uC77C', desc:'\uC815\uB2F5\uC9C0 \uD30C\uC77C \uC5C5\uB85C\uB4DC'},
  {key:'content_file',  label:'\uCF58\uD150\uCE20 \uD30C\uC77C',       type:'file',   category:'\uD30C\uC77C', desc:'\uBA54\uC778 \uCF58\uD150\uCE20 \uD30C\uC77C'},
  {key:'content_zip',   label:'\uCF58\uD150\uCE20 \uD30C\uC77C(ZIP)',   type:'file',   category:'\uD30C\uC77C', desc:'ZIP \uD328\uD0A4\uC9C0 \uCF58\uD150\uCE20'},
  {key:'video_file',    label:'\uC601\uC0C1 \uD30C\uC77C',         type:'file',   category:'\uD30C\uC77C', desc:'\uD559\uC2B5 \uC601\uC0C1 \uD30C\uC77C'},
  {key:'thumbnail',     label:'\uBBF8\uB9AC\uBCF4\uAE30 \uC774\uBBF8\uC9C0',    type:'file',   category:'\uD30C\uC77C', desc:'\uB300\uD45C \uC774\uBBF8\uC9C0 / \uC378\uB124\uC77C'},
  {key:'subtitle_file', label:'\uC790\uB9C9 \uD30C\uC77C',         type:'file',   category:'\uD30C\uC77C', desc:'\uC601\uC0C1 \uC790\uB9C9(SRT, VTT)'},
  {key:'question_file', label:'\uBB38\uC81C \uD30C\uC77C',         type:'file',   category:'\uD30C\uC77C', desc:'\uD3C9\uAC00 \uBB38\uC81C \uD30C\uC77C'},
  {key:'audio_file',    label:'\uC624\uB514\uC624 \uD30C\uC77C',       type:'file',   category:'\uD30C\uC77C', desc:'\uC74C\uC131/\uC624\uB514\uC624 \uCF58\uD150\uCE20'},
  // ── 학습 구조 ──
  {key:'day_number',    label:'\uD559\uC2B5\uC77C \uBC88\uD638',       type:'number', category:'\uD559\uC2B5 \uAD6C\uC870', desc:'Day \uBC88\uD638 (\uD559\uC2B5 \uC9C4\uB3C4)'},
  {key:'seq',           label:'\uC21C\uBC88',             type:'number', category:'\uD559\uC2B5 \uAD6C\uC870', desc:'\uC815\uB82C/\uBC30\uCE58 \uC21C\uBC88'},
  {key:'duration',      label:'\uC7AC\uC0DD \uC2DC\uAC04(\uCD08)',     type:'number', category:'\uD559\uC2B5 \uAD6C\uC870', desc:'\uCF58\uD150\uCE20 \uC7AC\uC0DD \uC2DC\uAC04'},
  {key:'time_limit',    label:'\uC81C\uD55C \uC2DC\uAC04(\uCD08)',     type:'number', category:'\uD559\uC2B5 \uAD6C\uC870', desc:'\uD3C9\uAC00/\uD65C\uB3D9 \uC81C\uD55C \uC2DC\uAC04'},
  {key:'page',          label:'\uD398\uC774\uC9C0',           type:'text',   category:'\uD559\uC2B5 \uAD6C\uC870', desc:'\uD398\uC774\uC9C0 \uBC88\uD638'},
  // ── 문항 구조 ──
  {key:'mainQ',         label:'\uB300\uBB38\uD56D',           type:'text',   category:'\uBB38\uD56D \uAD6C\uC870', desc:'\uB300\uBB38\uD56D \uBC88\uD638'},
  {key:'subQ',          label:'\uC18C\uBB38\uD56D',           type:'text',   category:'\uBB38\uD56D \uAD6C\uC870', desc:'\uC18C\uBB38\uD56D \uBC88\uD638'},
  {key:'contentType',   label:'\uCE74\uD14C\uACE0\uB9AC \uAD6C\uBD84',     type:'select', category:'\uBB38\uD56D \uAD6C\uC870', desc:'\uD574\uB2F5/\uBB38\uC81C/\uD3C9\uAC00 \uAD6C\uBD84', options:['\uD574\uB2F5','\uBB38\uC81C','\uD3C9\uAC00']},
  {key:'answerForm',    label:'\uD574\uB2F5 \uD615\uD0DC',       type:'select', category:'\uBB38\uD56D \uAD6C\uC870', desc:'\uD14D\uC2A4\uD2B8/\uC774\uBBF8\uC9C0/\uD63C\uD569', options:['\uD14D\uC2A4\uD2B8','\uC774\uBBF8\uC9C0','\uD63C\uD569']},
  {key:'answer',        label:'\uD574\uB2F5 \uB0B4\uC6A9',       type:'textarea',category:'\uBB38\uD56D \uAD6C\uC870', desc:'\uC815\uB2F5 \uD14D\uC2A4\uD2B8'},
  {key:'explain',       label:'\uD574\uC124 \uB0B4\uC6A9',       type:'textarea',category:'\uBB38\uD56D \uAD6C\uC870', desc:'\uD574\uC124 \uD14D\uC2A4\uD2B8'},
  // ── 분류/구분 ──
  {key:'detail_type',   label:'\uC720\uD615 \uAD6C\uBD84',         type:'select', category:'\uBD84\uB958', desc:'\uC138\uBD80 \uC720\uD615 \uBD84\uB958', options:['\uC77C\uBC18','\uD2B9\uBCC4']},
  {key:'difficulty',    label:'\uB09C\uC774\uB3C4',            type:'select', category:'\uBD84\uB958', desc:'\uCF58\uD150\uCE20 \uB09C\uC774\uB3C4', options:['\uC0C1','\uC911','\uD558']},
  {key:'scoring',       label:'\uCC44\uC810 \uC5EC\uBD80',       type:'select', category:'\uBD84\uB958', desc:'\uCC44\uC810 \uC874\uC7AC \uC5EC\uBD80', options:['\uCC44\uC810\uC788\uC74C','\uCC44\uC810\uC5C6\uC74C']},
  {key:'area',          label:'\uC601\uC5ED',             type:'select', category:'\uBD84\uB958', desc:'\uD559\uC2B5 \uC601\uC5ED \uAD6C\uBD84', options:['\uC77D\uAE30','\uC4F0\uAE30','\uB4E3\uAE30','\uB9D0\uD558\uAE30']},
  {key:'day',           label:'\uC77C\uCC28',             type:'text',   category:'\uBD84\uB958', desc:'\uC77C\uCC28 \uAD6C\uBD84'},
  {key:'file_format',   label:'\uD30C\uC77C \uD615\uC2DD',         type:'select', category:'\uBD84\uB958', desc:'\uC81C\uC791 \uD30C\uC77C \uD615\uC2DD', options:['SWF','HTML5','MP4','PDF']},
  {key:'resolution',    label:'\uD654\uC9C8',             type:'select', category:'\uBD84\uB958', desc:'\uC601\uC0C1 \uD654\uC9C8', options:['720p','1080p','4K']},
  // ── 영상강의 전용 ──
  {key:'contentName',   label:'\uCF58\uD150\uCE20\uBA85',         type:'text',   category:'\uC601\uC0C1\uAC15\uC758', desc:'\uCF58\uD150\uCE20 \uC81C\uBAA9'},
  {key:'title',         label:'\uC601\uC0C1 \uC81C\uBAA9',       type:'text',   category:'\uC601\uC0C1\uAC15\uC758', desc:'\uC601\uC0C1 \uC81C\uBAA9'},
  {key:'description',   label:'\uAC15\uC758 \uC124\uBA85',       type:'textarea',category:'\uC601\uC0C1\uAC15\uC758', desc:'\uAC15\uC758 \uC124\uBA85 \uD14D\uC2A4\uD2B8'},
  {key:'drmType',       label:'DRM \uC720\uD615',       type:'select', category:'\uC601\uC0C1\uAC15\uC758', desc:'DRM \uBCF4\uD638 \uC720\uD615', options:['Pallycon','Widevine','None']},
  {key:'serviceType',   label:'\uC11C\uBE44\uC2A4 \uAD6C\uBD84',     type:'select', category:'\uC601\uC0C1\uAC15\uC758', desc:'\uC11C\uBE44\uC2A4 \uAD6C\uBD84', options:['\uBB34\uB8CC','\uC720\uB8CC','\uCCB4\uD5D8\uD310']},
  {key:'fileName',      label:'\uD30C\uC77C\uBA85',           type:'text',   category:'\uC601\uC0C1\uAC15\uC758', desc:'\uD30C\uC77C\uBA85 (\uC790\uB3D9)'},
  {key:'contentLength', label:'\uC7AC\uC0DD\uC2DC\uAC04',         type:'text',   category:'\uC601\uC0C1\uAC15\uC758', desc:'\uC7AC\uC0DD \uC2DC\uAC04'},
  {key:'fileSize',      label:'\uD30C\uC77C\uD06C\uAE30',         type:'text',   category:'\uC601\uC0C1\uAC15\uC758', desc:'\uD30C\uC77C \uD06C\uAE30'},
  // ── 경로/텍스트 ──
  {key:'entry_url',     label:'\uC2DC\uC791 \uD398\uC774\uC9C0 \uACBD\uB85C',   type:'text',   category:'\uACBD\uB85C/\uD14D\uC2A4\uD2B8', desc:'\uC6F9 \uCF58\uD150\uCE20 \uC9C4\uC785\uC810 URL'},
  {key:'answer_text',   label:'\uC815\uB2F5',             type:'text',   category:'\uACBD\uB85C/\uD14D\uC2A4\uD2B8', desc:'\uC815\uB2F5 \uD14D\uC2A4\uD2B8'},
  {key:'memo',          label:'\uBE44\uACE0',             type:'text',   category:'\uACBD\uB85C/\uD14D\uC2A4\uD2B8', desc:'\uAD00\uB9AC \uBA54\uBAA8'},
  // ── 플래시카드 ──
  {key:'front',         label:'\uC55E\uBA74 \uB0B4\uC6A9',       type:'textarea',category:'\uD50C\uB798\uC2DC\uCE74\uB4DC', desc:'\uCE74\uB4DC \uC55E\uBA74'},
  {key:'back',          label:'\uB4B7\uBA74 \uB0B4\uC6A9',       type:'textarea',category:'\uD50C\uB798\uC2DC\uCE74\uB4DC', desc:'\uCE74\uB4DC \uB4B7\uBA74'},
  {key:'image',         label:'\uC774\uBBF8\uC9C0 \uD30C\uC77C',     type:'file',   category:'\uD50C\uB798\uC2DC\uCE74\uB4DC', desc:'\uCE74\uB4DC \uC774\uBBF8\uC9C0'},
  {key:'category',      label:'\uCE74\uD14C\uACE0\uB9AC',         type:'select', category:'\uD50C\uB798\uC2DC\uCE74\uB4DC', desc:'\uCE74\uB4DC \uBD84\uB958', options:['\uB2E8\uC5B4','\uBB38\uC7A5','\uBB38\uBC95']},
  // ── 핵심점검 ──
  {key:'section',       label:'\uC139\uC158',             type:'text',   category:'\uD575\uC2EC\uC810\uAC80', desc:'\uC139\uC158 \uAD6C\uBD84'},
  {key:'content',       label:'\uBCF8\uBB38',             type:'textarea',category:'\uD575\uC2EC\uC810\uAC80', desc:'\uBCF8\uBB38 \uCF58\uD150\uCE20'},
  {key:'keyword',       label:'\uD575\uC2EC\uC5B4',           type:'text',   category:'\uD575\uC2EC\uC810\uAC80', desc:'\uD575\uC2EC \uD0A4\uC6CC\uB4DC'},
  {key:'importance',    label:'\uC911\uC694\uB3C4',            type:'select', category:'\uD575\uC2EC\uC810\uAC80', desc:'\uCF58\uD150\uCE20 \uC911\uC694\uB3C4', options:['\uC0C1','\uC911','\uD558']},
];

// LT_FIELD_POOL 카테고리 목록 추출
function _ltGetFieldCategories() {
  var cats = [];
  LT_FIELD_POOL.forEach(function(f) {
    if(cats.indexOf(f.category) < 0) cats.push(f.category);
  });
  return cats;
}

var LT_STATE = {
  types: [
    // \u2500\u2500 ANS (\uC815\uB2F5\u00B7\uD574\uC124) \u2500\u2500
    {id:'LT-ANS-ND', targetSystems:['ND'], name:'\uC815\uB2F5\u00B7\uD574\uC124 (\uB274\uB4DC\uB9BC\uC2A4)', typeCode:'ANS',
      desc:'\uB274\uB4DC\uB9BC\uC2A4 \uC11C\uBE44\uC2A4\uC6A9 \uC815\uB2F5 \uBC0F \uD574\uC124 \uCF58\uD150\uCE20 (DB\uD615)', color:'#0071E3',
      subject:'수학', grade:'전학년', curriculum:'2022 개정',
      depths:[
        {id:'d1',name:'\uCEE4\uB9AC\uD058\uB7FC\uBA85',subName:'\uCEE4\uB9AC\uD058\uB7FC \uB2E8\uC704',groupCount:1,fields:['detail_type'],children:[
          {id:'d1-1',name:'\uACFC\uC815',subName:'\uD559\uAE30\uBCC4 \uACFC\uC815',groupCount:8,fields:['seq'],children:[
            {id:'d1-1-1',name:'\uC138\uD2B8',subName:'\uC6D4\uBCC4 \uC138\uD2B8',groupCount:80,fields:['day_number'],children:[
              {id:'d1-1-1-1',name:'\uD559\uC2B5\uC77C',subName:'\uC77C\uBCC4 \uD559\uC2B5',groupCount:400,fields:['answer_file','answer_text','memo'],children:[]}
            ]}
          ]}
        ]}
      ],
      attrs:[
        {key:'answer_file',label:'정답 파일',required:true,type:'file'},
        {key:'detail_type',label:'유형 구분',required:true,type:'select',options:['일반','특별']},
        {key:'day_number',label:'학습일 번호',required:true,type:'number'},
        {key:'seq',label:'순번',required:false,type:'number'},
        {key:'memo',label:'비고',required:false,type:'text'},
      ]},
    {id:'LT-ANS-NH', targetSystems:['NH'], name:'\uC815\uB2F5\u00B7\uD574\uC124 (\uD559\uC2B5\uAD00)', typeCode:'ANS',
      desc:'\uD559\uC2B5\uAD00 \uC11C\uBE44\uC2A4\uC6A9 \uC815\uB2F5 \uBC0F \uD574\uC124 \uCF58\uD150\uCE20 (DB\uD615)', color:'#AF52DE',
      subject:'수학', grade:'전학년', curriculum:'2022 개정',
      depths:[
        {id:'d2',name:'\uCEE4\uB9AC\uD058\uB7FC\uBA85',subName:'\uCEE4\uB9AC\uD058\uB7FC \uB2E8\uC704',groupCount:1,fields:['detail_type'],children:[
          {id:'d2-1',name:'\uACFC\uC815',subName:'\uD559\uAE30\uBCC4',groupCount:8,fields:['seq'],children:[
            {id:'d2-1-1',name:'\uC138\uD2B8',subName:'\uC6D4\uBCC4',groupCount:80,fields:['day_number'],children:[
              {id:'d2-1-1-1',name:'\uD559\uC2B5\uC77C',subName:'\uC77C\uBCC4',groupCount:400,fields:['answer_file','answer_text','memo'],children:[]}
            ]}
          ]}
        ]}
      ],
      attrs:[
        {key:'answer_file',label:'정답 파일',required:true,type:'file'},
        {key:'detail_type',label:'유형 구분',required:true,type:'select',options:['일반','특별']},
        {key:'day_number',label:'학습일 번호',required:true,type:'number'},
        {key:'seq',label:'순번',required:false,type:'number'},
        {key:'memo',label:'비고',required:false,type:'text'},
      ]},
    // \u2500\u2500 AN2 (\uC790\uB3D9\uCC44\uC810) \u2500\u2500
    {id:'LT-AN2-ND', targetSystems:['ND'], name:'\uC790\uB3D9\uCC44\uC810 (\uB274\uB4DC\uB9BC\uC2A4)', typeCode:'AN2',
      desc:'\uB274\uB4DC\uB9BC\uC2A4 \uC11C\uBE44\uC2A4\uC6A9 \uC790\uB3D9\uCC44\uC810 \uB370\uC774\uD130 (DB\uD615)', color:'#0055B8',
      subject:'영어', grade:'전학년', curriculum:'2022 개정',
      depths:[
        {id:'d3',name:'\uCEE4\uB9AC\uD058\uB7FC\uBA85',groupCount:1,children:[
          {id:'d3-1',name:'\uACFC\uC815',groupCount:6,children:[
            {id:'d3-1-1',name:'\uC138\uD2B8',groupCount:60,children:[
              {id:'d3-1-1-1',name:'\uD559\uC2B5\uC77C',groupCount:300,children:[]}
            ]}
          ]}
        ]}
      ],
      attrs:[
        {key:'answer_file',label:'\uC815\uB2F5 \uD30C\uC77C',required:true,type:'file'},
        {key:'detail_type',label:'\uC720\uD615 \uAD6C\uBD84',required:true,type:'select',options:['\uC77C\uBC18','\uD2B9\uBCC4']},
        {key:'day_number',label:'\uD559\uC2B5\uC77C \uBC88\uD638',required:true,type:'number'},
        {key:'seq',label:'\uC21C\uBC88',required:false,type:'number'},
        {key:'memo',label:'\uBE44\uACE0',required:false,type:'text'},
      ]},
    {id:'LT-AN2-SJ', targetSystems:['SJ'], name:'\uC790\uB3D9\uCC44\uC810 (\uC131\uC7A5\uD310)', typeCode:'AN2',
      desc:'\uC131\uC7A5\uD310 \uC11C\uBE44\uC2A4\uC6A9 \uC790\uB3D9\uCC44\uC810 \uB370\uC774\uD130 (DB\uD615)', color:'#1B8A3E',
      subject:'\uC218\uD559', grade:'\uC804\uD559\uB144', curriculum:'2022 \uAC1C\uC815',
      depths:[
        {id:'d3b',name:'\uCEE4\uB9AC\uD058\uB7FC\uBA85',groupCount:1,children:[
          {id:'d3b-1',name:'\uACFC\uC815',groupCount:4,children:[
            {id:'d3b-1-1',name:'\uC138\uD2B8',groupCount:40,children:[
              {id:'d3b-1-1-1',name:'\uD559\uC2B5\uC77C',groupCount:200,children:[]}
            ]}
          ]}
        ]}
      ],
      attrs:[
        {key:'answer_file',label:'정답 파일',required:true,type:'file'},
        {key:'detail_type',label:'유형 구분',required:true,type:'select',options:['일반','특별']},
        {key:'day_number',label:'학습일 번호',required:true,type:'number'},
        {key:'seq',label:'순번',required:false,type:'number'},
        {key:'memo',label:'비고',required:false,type:'text'},
      ]},
    // \u2500\u2500 FLC (\uD50C\uB798\uC2DC\uCE74\uB4DC) \u2500\u2500
    {id:'LT-FLC-ND', targetSystems:['ND'], name:'\uD50C\uB798\uC2DC\uCE74\uB4DC (\uB274\uB4DC\uB9BC\uC2A4)', typeCode:'FLC',
      desc:'\uB274\uB4DC\uB9BC\uC2A4 \uC11C\uBE44\uC2A4\uC6A9 \uC778\uD130\uB799\uD2F0\uBE0C \uD559\uC2B5 \uCE74\uB4DC (FILE\uD615)', color:'#0891B2',
      subject:'영어', grade:'초등 3~4', curriculum:'2022 개정',
      depths:[
        {id:'d4',name:'커리큘럼명',groupCount:1,children:[
          {id:'d4-1',name:'과정',groupCount:6,children:[
            {id:'d4-1-1',name:'세트',groupCount:60,children:[]}
          ]}
        ]}
      ],
      attrs:[
        {key:'content_file',label:'콘텐츠 파일',required:true,type:'file'},
        {key:'file_format',label:'파일 형식',required:true,type:'select',options:['SWF','HTML5']},
        {key:'duration',label:'재생 시간(초)',required:false,type:'number'},
        {key:'memo',label:'비고',required:false,type:'text'},
      ]},
    // \u2500\u2500 CBT (\uD575\uC2EC\uC810\uAC80) \u2500\u2500
    {id:'LT-CBT-ND', targetSystems:['ND'], name:'\uD575\uC2EC\uC810\uAC80 (\uB274\uB4DC\uB9BC\uC2A4)', typeCode:'CBT',
      desc:'\uB274\uB4DC\uB9BC\uC2A4 \uC11C\uBE44\uC2A4\uC6A9 \uD575\uC2EC\uC810\uAC80 \uBCF8\uBB38 \uCF58\uD150\uCE20', color:'#AF52DE',
      subject:'수학', grade:'초등 3~4', curriculum:'2022 개정',
      depths:[
        {id:'d5',name:'커리큘럼명',groupCount:1,children:[
          {id:'d5-1',name:'과정',groupCount:8,children:[
            {id:'d5-1-1',name:'세트',groupCount:80,children:[
              {id:'d5-1-1-1',name:'문항',groupCount:400,children:[]}
            ]}
          ]}
        ]}
      ],
      attrs:[
        {key:'question_file',label:'문제 파일',required:true,type:'file'},
        {key:'answer_text',label:'정답',required:true,type:'text'},
        {key:'difficulty',label:'난이도',required:false,type:'select',options:['상','중','하']},
        {key:'time_limit',label:'제한 시간(초)',required:false,type:'number'},
      ]},
    {id:'LT-CBT-SJ', targetSystems:['SJ'], name:'\uD575\uC2EC\uC810\uAC80 (\uC131\uC7A5\uD310)', typeCode:'CBT',
      desc:'\uC131\uC7A5\uD310 \uC11C\uBE44\uC2A4\uC6A9 \uD575\uC2EC\uC810\uAC80 \uBCF8\uBB38 \uCF58\uD150\uCE20', color:'#FF9500',
      subject:'수학', grade:'중등 1', curriculum:'2022 개정',
      depths:[
        {id:'d5b',name:'커리큘럼명',groupCount:1,children:[
          {id:'d5b-1',name:'과정',groupCount:4,children:[
            {id:'d5b-1-1',name:'세트',groupCount:40,children:[
              {id:'d5b-1-1-1',name:'문항',groupCount:200,children:[]}
            ]}
          ]}
        ]}
      ],
      attrs:[
        {key:'question_file',label:'문제 파일',required:true,type:'file'},
        {key:'answer_text',label:'정답',required:true,type:'text'},
        {key:'difficulty',label:'난이도',required:false,type:'select',options:['상','중','하']},
        {key:'time_limit',label:'제한 시간(초)',required:false,type:'number'},
      ]},
    // \u2500\u2500 WEB (\uC6F9 \uD559\uC2B5\uCF58\uD150\uCE20) \u2500\u2500
    {id:'LT-WEB-ND', targetSystems:['ND'], name:'\uC6F9 \uD559\uC2B5\uCF58\uD150\uCE20 (\uB274\uB4DC\uB9BC\uC2A4)', typeCode:'WEB',
      desc:'\uB274\uB4DC\uB9BC\uC2A4 \uC11C\uBE44\uC2A4\uC6A9 HTML/ZIP \uAE30\uBC18 \uC6F9 \uD559\uC2B5 \uCF58\uD150\uCE20 (FILE\uD615)', color:'#34C759',
      subject:'영어', grade:'초등 5~6', curriculum:'2022 개정',
      depths:[
        {id:'d6',name:'커리큘럼명',groupCount:1,children:[
          {id:'d6-1',name:'과정',groupCount:6,children:[]}
        ]}
      ],
      attrs:[
        {key:'content_zip',label:'콘텐츠 파일(ZIP)',required:true,type:'file'},
        {key:'entry_url',label:'시작 페이지 경로',required:true,type:'text'},
        {key:'memo',label:'비고',required:false,type:'text'},
      ]},
    // \u2500\u2500 STDG (\uD559\uC2B5\uC548\uB0B4\u00B7\uD480\uC774) \u2500\u2500
    {id:'LT-STDG-NH', targetSystems:['NH'], name:'\uD559\uC2B5\uC548\uB0B4\u00B7\uD480\uC774 (\uD559\uC2B5\uAD00)', typeCode:'STDG',
      desc:'\uD559\uC2B5\uAD00 \uC11C\uBE44\uC2A4\uC6A9 \uD559\uC2B5\uC548\uB0B4 \uBC0F \uD480\uC774 \uCF58\uD150\uCE20 (DB\uD615)', color:'#0369A1',
      subject:'국어', grade:'전학년', curriculum:'2022 개정',
      depths:[
        {id:'d7',name:'커리큘럼명',groupCount:1,children:[
          {id:'d7-1',name:'과정',groupCount:5,children:[
            {id:'d7-1-1',name:'세트',groupCount:50,children:[
              {id:'d7-1-1-1',name:'학습일',groupCount:250,children:[]}
            ]}
          ]}
        ]}
      ],
      attrs:[
        {key:'content_file',label:'학습안내 파일',required:true,type:'file'},
        {key:'detail_type',label:'유형 구분',required:true,type:'select',options:['일반','특별']},
        {key:'day_number',label:'학습일 번호',required:true,type:'number'},
        {key:'seq',label:'순번',required:false,type:'number'},
        {key:'memo',label:'비고',required:false,type:'text'},
      ]},
    // \u2500\u2500 VKS (\uB3D9\uC694 \uCF58\uD150\uCE20) \u2500\u2500
    {id:'LT-VKS-ND', targetSystems:['ND'], name:'\uB3D9\uC694 \uCF58\uD150\uCE20 (\uB274\uB4DC\uB9BC\uC2A4)', typeCode:'VKS',
      desc:'\uB274\uB4DC\uB9BC\uC2A4 \uC11C\uBE44\uC2A4\uC6A9 \uB3D9\uC694 \uC74C\uC6D0/\uC601\uC0C1 \uCF58\uD150\uCE20 (FILE\uD615)', color:'#9333EA',
      subject:'한글똑똒', grade:'유아', curriculum:'해당없음',
      depths:[
        {id:'d8',name:'커리큘럼명',groupCount:1,children:[
          {id:'d8-1',name:'과정',groupCount:3,children:[
            {id:'d8-1-1',name:'차시',groupCount:36,children:[]}
          ]}
        ]}
      ],
      attrs:[
        {key:'video_file',label:'음원/영상 파일',required:true,type:'file'},
        {key:'thumbnail',label:'미리보기 이미지',required:true,type:'file'},
        {key:'duration',label:'재생 시간(초)',required:true,type:'number'},
        {key:'memo',label:'비고',required:false,type:'text'},
      ]},
  ],
  search: '',
  editingId: 'LT-ANS-ND',
  editTab: 'step1', // 'step1' | 'step2' | 'step3'
};

function renderLearningTypeView() {
  var root = document.getElementById('learningTypeRoot');
  if(!root) return;

  var types = LT_STATE.types;
  var q = LT_STATE.search.toLowerCase();
  var filtered = q ? types.filter(function(t) {
    return t.name.toLowerCase().indexOf(q) >= 0 || t.typeCode.toLowerCase().indexOf(q) >= 0;
  }) : types;

  // typeCode 기준 그룹화 (서비스별 분리 제거 → 유형별 통합)
  var typeGroups = {};
  var typeGroupOrder = [];
  filtered.forEach(function(t) {
    var gc = t.typeCode || 'ETC';
    if(!typeGroups[gc]) {
      typeGroups[gc] = {code:gc, label:(CONTENT_TYPES[gc] ? CONTENT_TYPES[gc].label : gc), items:[]};
      typeGroupOrder.push(gc);
    }
    typeGroups[gc].items.push(t);
  });

  var h = '';
  h += '<div style="display:flex;height:100%;overflow:hidden">';

  // ══════ 좌측: 템플릿 유형 + 구조 목록 ══════
  h += '<div style="width:280px;border-right:1px solid #E5E5EA;background:#fff;display:flex;flex-direction:column;flex-shrink:0">';
  h += '<div style="padding:16px 16px 12px;border-bottom:1px solid #E5E5EA">';
  h += '<div style="font-size:15px;font-weight:600;color:#1D1D1F;margin-bottom:2px">\uCF58\uD150\uCE20 \uD15C\uD50C\uB9BF</div>';
  h += '<div style="font-size:11px;color:#8E8E93">\uC720\uD615\uBCC4 \uAD6C\uC870 \uBAA9\uB85D \uBC0F \uC0DD\uC131 \uAD00\uB9AC</div>';
  h += '</div>';
  h += '<div style="padding:8px 12px;display:flex;gap:6px;border-bottom:1px solid #F5F5F7">';
  h += '<input type="text" placeholder="\uD15C\uD50C\uB9BF \uAC80\uC0C9" value="' + (LT_STATE.search || '') + '" oninput="LT_STATE.search=this.value;renderLearningTypeView()" style="flex:1;padding:7px 10px;border:1px solid #E5E5EA;border-radius:7px;font-size:12px;outline:none">';
  h += '</div>';
  h += '<div style="flex:1;overflow-y:auto;padding:6px 8px">';

  // 유형별 아코디언
  typeGroupOrder.forEach(function(gc) {
    var group = typeGroups[gc];
    var isGroupActive = LT_STATE._activeGroup === gc;
    var hasActive = group.items.some(function(t){ return t.id === LT_STATE.editingId; });
    if(!LT_STATE._activeGroup && hasActive) { LT_STATE._activeGroup = gc; isGroupActive = true; }

    // 유형 헤더 (정답·해설, 자동채점 등)
    h += '<div style="margin-bottom:6px">';
    h += '<div onclick="LT_STATE._activeGroup=LT_STATE._activeGroup===\'' + gc + '\'?null:\'' + gc + '\';renderLearningTypeView()" style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;cursor:pointer;background:' + (isGroupActive ? '#F0F9FF' : 'transparent') + ';border:1px solid ' + (isGroupActive ? '#BAE6FD' : 'transparent') + ';transition:all .1s" onmouseenter="if(!' + isGroupActive + ')this.style.background=\'#FAFAFA\'" onmouseleave="if(!' + isGroupActive + ')this.style.background=\'' + (isGroupActive ? '#F0F9FF' : 'transparent') + '\'">';
    h += '<svg viewBox="0 0 24 24" fill="none" stroke="#636366" stroke-width="2" style="width:12px;height:12px;flex-shrink:0;transition:transform .15s;transform:rotate(' + (isGroupActive ? '90' : '0') + 'deg)"><polyline points="9 18 15 12 9 6"/></svg>';
    h += '<span style="font-size:13px;font-weight:700;color:#1D1D1F;flex:1">' + group.label + '</span>';
    h += '<span style="font-size:9px;padding:1px 6px;border-radius:3px;background:#F5F5F7;color:#636366;font-weight:600;font-family:monospace">' + gc + '</span>';
    h += '<span style="font-size:9px;padding:1px 6px;border-radius:980px;background:#E0F2FE;color:#0284C7;font-weight:700">' + group.items.length + '</span>';
    h += '</div>';

    // 구조 목록 (펼침)
    if(isGroupActive) {
      h += '<div style="padding:4px 0 4px 16px">';

      // 구조 리스트
      group.items.forEach(function(t, ti) {
        var isActive = LT_STATE.editingId === t.id;
        var depthCount = _ltCountDepth(t.depths);
        var flatInfo = _ltGetDepthFlatInfo(t.depths);
        var totalFields = 0;
        flatInfo.forEach(function(fi){ totalFields += (fi.fields ? fi.fields.length : 0); });
        // 사용 중 여부 (REGISTERED_WORK_TYPES에서 참조)
        var isInUse = false;
        Object.keys(REGISTERED_WORK_TYPES).forEach(function(k) {
          (REGISTERED_WORK_TYPES[k] || []).forEach(function(rt) { if(rt.ltTypeId === t.id) isInUse = true; });
        });

        h += '<div onclick="LT_STATE.editingId=\'' + t.id + '\';LT_STATE.editTab=\'step1\';renderLearningTypeView()" style="padding:8px 10px;border-radius:6px;cursor:pointer;margin-bottom:2px;border-left:2.5px solid ' + (isActive ? (t.color || '#0071E3') : 'transparent') + ';background:' + (isActive ? '#FAFAFA' : 'transparent') + ';transition:all .1s" onmouseenter="this.style.background=\'' + (isActive ? '#FAFAFA' : '#FAFAFA') + '\'" onmouseleave="this.style.background=\'' + (isActive ? '#FAFAFA' : 'transparent') + '\'">';

        // 제목 행 (구조명 - 사용자 정의 또는 기본값)
        var structLabel = t.structureName || (t.subject || '') + (t.grade ? ' ' + t.grade : '') || '\uBBF8\uC9C0\uC815';
        h += '<div style="display:flex;align-items:center;gap:5px;margin-bottom:2px">';
        h += '<div style="width:5px;height:5px;border-radius:50%;background:' + (t.color || '#8E8E93') + ';flex-shrink:0"></div>';
        h += '<span style="font-size:12px;font-weight:' + (isActive ? '700' : '500') + ';color:#1D1D1F;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + structLabel + '</span>';
        if(isInUse) h += '<span style="font-size:8px;padding:1px 5px;border-radius:3px;background:#F0FFF4;color:#34C759;font-weight:700">\uC0AC\uC6A9\uC911</span>';
        h += '</div>';

        // 메타 행
        h += '<div style="display:flex;gap:4px;padding-left:10px;flex-wrap:wrap">';
        h += '<span style="font-size:9px;color:#8E8E93;font-weight:500">' + depthCount + 'D \u00B7 ' + totalFields + '\uD544\uB4DC</span>';
        if(t.subject) h += '<span style="font-size:9px;color:#8E8E93;font-weight:500">\u00B7 ' + t.subject + '</span>';
        h += '</div>';

        h += '</div>';
      });

      // + 추가 버튼
      h += '<div onclick="_ltAddStructure(\'' + gc + '\')" style="display:flex;align-items:center;gap:5px;padding:6px 10px;border-radius:6px;cursor:pointer;color:#0071E3;transition:all .1s;margin-top:2px" onmouseenter="this.style.background=\'#F0F9FF\'" onmouseleave="this.style.background=\'transparent\'">';
      h += '<svg viewBox="0 0 24 24" fill="none" stroke="#0071E3" stroke-width="2" style="width:12px;height:12px"><path d="M12 5v14m-7-7h14"/></svg>';
      h += '<span style="font-size:11px;font-weight:600">+ \uAD6C\uC870 \uCD94\uAC00</span>';
      h += '</div>';

      h += '</div>';
    }
    h += '</div>';
  });

  // 새 유형 추가
  h += '<div style="padding:8px 0;border-top:1px solid #F5F5F7;margin-top:4px">';
  h += '<div onclick="_ltAddNewType()" style="display:flex;align-items:center;gap:6px;padding:8px 10px;border-radius:8px;cursor:pointer;transition:all .1s" onmouseenter="this.style.background=\'#FAFAFA\'" onmouseleave="this.style.background=\'transparent\'">';
  h += '<svg viewBox="0 0 24 24" fill="none" stroke="#8E8E93" stroke-width="2" style="width:14px;height:14px"><path d="M12 5v14m-7-7h14"/></svg>';
  h += '<span style="font-size:11px;font-weight:600;color:#636366">\uC0C8 \uD15C\uD50C\uB9BF \uC720\uD615</span>';
  h += '</div></div>';

  if(typeGroupOrder.length === 0) h += '<div style="text-align:center;padding:30px;color:#8E8E93;font-size:12px">\uB4F1\uB85D\uB41C \uD15C\uD50C\uB9BF\uC774 \uC5C6\uC2B5\uB2C8\uB2E4</div>';
  h += '</div></div>';

  // ══════ 우측: 편집 영역 ══════
  var editType = LT_STATE.editingId ? types.find(function(t){ return t.id === LT_STATE.editingId; }) : null;

  h += '<div style="flex:1;display:flex;flex-direction:column;overflow:hidden;background:#FAFAFA">';

  if(!editType) {
    h += '<div style="display:flex;align-items:center;justify-content:center;flex:1;color:#8E8E93">';
    h += '<div style="text-align:center"><svg viewBox="0 0 24 24" fill="none" stroke="#D1D1D6" stroke-width="1.5" style="width:48px;height:48px;margin:0 auto 12px"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>';
    h += '<div style="font-size:14px;font-weight:600;margin-bottom:4px">콘텐츠 템플릿을 선택하세요</div>';
    h += '<div style="font-size:12px">좌측 목록에서 템플릿을 선택하거나 신규 템플릿을 생성합니다</div></div></div>';
  } else {
    // ── 편집 상단 바 ──
    h += '<div style="padding:14px 20px;background:#fff;border-bottom:1px solid #E5E5EA;display:flex;align-items:center;gap:10px;flex-shrink:0">';
    h += '<div style="width:8px;height:8px;border-radius:50%;background:' + (editType.color || '#8E8E93') + '"></div>';
    h += '<span style="font-size:15px;font-weight:600;color:#1D1D1F">' + editType.name + '</span>';
    h += '<span style="font-size:10px;padding:2px 8px;border-radius:4px;background:#F5F5F7;color:#636366;font-weight:600;font-family:monospace">' + editType.id + '</span>';
    h += '<div style="flex:1"></div>';
    // 탭 전환
    h += '<div style="display:flex;gap:0;border:1px solid #E5E5EA;border-radius:8px;overflow:hidden">';
    var tabs = [{v:'step1',l:'1. 단계 정의'},{v:'step2',l:'2. 필드 배정'},{v:'step3',l:'3. 저장 · 관리'}];
    tabs.forEach(function(tab) {
      var isOn = LT_STATE.editTab === tab.v;
      h += '<button onclick="LT_STATE.editTab=\'' + tab.v + '\';renderLearningTypeView()" style="padding:6px 14px;border:none;font-size:12px;font-weight:' + (isOn ? 700 : 500) + ';cursor:pointer;background:' + (isOn ? '#1D1D1F' : '#fff') + ';color:' + (isOn ? '#fff' : '#636366') + ';transition:all .12s">' + tab.l + '</button>';
    });
    h += '</div>';
    var editInUse = false;
    Object.keys(REGISTERED_WORK_TYPES).forEach(function(k) {
      (REGISTERED_WORK_TYPES[k] || []).forEach(function(rt) { if(rt.ltTypeId === editType.id) editInUse = true; });
    });
    if(editInUse) {
      h += '<span style="font-size:10px;padding:3px 8px;border-radius:4px;background:#FFF8F0;color:#B35C00;font-weight:600">\uC0AC\uC6A9\uC911 \u00B7 \uC218\uC815\uC8FC\uC758</span>';
      h += '<button onclick="_ltDeleteType(\'' + editType.id + '\')" style="padding:5px 10px;border:1px solid #E5E5EA;border-radius:6px;background:#FAFAFA;color:#D1D1D6;font-size:11px;font-weight:600;cursor:not-allowed" title="\uC0AC\uC6A9 \uC911\uC778 \uD15C\uD50C\uB9BF\uC740 \uC0AD\uC81C\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4">\uC0AD\uC81C</button>';
    } else {
      h += '<button onclick="_ltDeleteType(\'' + editType.id + '\')" style="padding:5px 10px;border:1px solid #FFB3AE;border-radius:6px;background:#fff;color:#FF3B30;font-size:11px;font-weight:600;cursor:pointer">\uC0AD\uC81C</button>';
    }
    h += '</div>';

    // ── 탭 콘텐츠 ──
    h += '<div style="flex:1;overflow-y:auto;padding:20px">';

    if(LT_STATE.editTab === 'step1') {
      h += _ltRenderStep1(editType);
    } else if(LT_STATE.editTab === 'step2') {
      h += _ltRenderStep2(editType);
    } else {
      h += _ltRenderStep3(editType);
    }

    h += '</div>';
  }
  h += '</div></div>';
  root.innerHTML = h;
}

// ── Depth 수 세기 (트리 순회) ──
function _ltCountDepth(depths) {
  var max = 0;
  function walk(nodes, level) {
    if(!nodes || nodes.length === 0) { if(level > max) max = level; return; }
    nodes.forEach(function(n) { walk(n.children || [], level + 1); });
  }
  walk(depths, 0);
  return max;
}

// Depth 구조의 이름 체인 추출 (첫 번째 경로 기준)
function _ltGetDepthNames(depths) {
  var names = [];
  function walk(nodes) {
    if(!nodes || nodes.length === 0) return;
    names.push(nodes[0].name);
    if(nodes[0].children && nodes[0].children.length > 0) walk(nodes[0].children);
  }
  walk(depths);
  return names;
}

// ══ 1단계: Depth 정의 (N개 관리, 그룹 수, 보조명) ══
function _ltRenderStep1(t) {
  var h = '';
  var depthNames = _ltGetDepthNames(t.depths);
  var depthCount = _ltCountDepth(t.depths);
  var flatInfo = _ltGetDepthFlatInfo(t.depths);

  // ── 구조 기본정보 ──
  h += '<div style="background:#fff;border-radius:12px;border:1px solid #E5E5EA;overflow:hidden;margin-bottom:16px">';
  h += '<div style="padding:14px 18px;border-bottom:1px solid #F5F5F7;display:flex;align-items:center;gap:8px">';
  h += '<svg viewBox="0 0 24 24" fill="none" stroke="#0071E3" stroke-width="2" style="width:16px;height:16px;flex-shrink:0"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';
  h += '<span style="font-size:13px;font-weight:600;color:#1D1D1F">\uAD6C\uC870 \uAE30\uBCF8\uC815\uBCF4</span>';
  h += '<span style="font-size:10px;color:#8E8E93">\uC88C\uCE21 \uBAA9\uB85D\uC5D0 \uD45C\uC2DC\uB420 \uAD6C\uC870\uBA85\uC744 \uC785\uB825\uD558\uC138\uC694</span>';
  h += '</div>';
  h += '<div style="padding:16px 18px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">';
  // 구조명
  h += '<div style="grid-column:1/4">';
  h += '<label style="font-size:11px;font-weight:700;color:#48484A;display:block;margin-bottom:4px">\uAD6C\uC870\uBA85 <span style="color:#FF3B30">*</span></label>';
  h += '<input type="text" value="' + (t.structureName || '').replace(/"/g,'&quot;') + '" placeholder="\uC608: \uC218\uD559 \uC804\uD559\uB144 4\uB2E8\uACC4, \uC601\uC5B4 \uC911\uB4F11-1 \uB4F1" onchange="_ltUpdateField(\'' + t.id + '\',\'structureName\',this.value);renderLearningTypeView()" style="width:100%;padding:8px 12px;border:1px solid #E5E5EA;border-radius:8px;font-size:13px;outline:none;box-sizing:border-box" onfocus="this.style.borderColor=\'#0071E3\'" onblur="this.style.borderColor=\'#E5E5EA\'">';
  h += '</div>';
  // 대상 과목
  h += '<div>';
  h += '<label style="font-size:11px;font-weight:700;color:#48484A;display:block;margin-bottom:4px">\uB300\uC0C1 \uACFC\uBAA9</label>';
  h += '<input type="text" value="' + (t.subject || '').replace(/"/g,'&quot;') + '" placeholder="\uC608: \uC218\uD559" onchange="_ltUpdateField(\'' + t.id + '\',\'subject\',this.value)" style="width:100%;padding:8px 12px;border:1px solid #E5E5EA;border-radius:8px;font-size:12px;outline:none;box-sizing:border-box" onfocus="this.style.borderColor=\'#0071E3\'" onblur="this.style.borderColor=\'#E5E5EA\'">';
  h += '</div>';
  // 학년/대상
  h += '<div>';
  h += '<label style="font-size:11px;font-weight:700;color:#48484A;display:block;margin-bottom:4px">\uD559\uB144/\uB300\uC0C1</label>';
  h += '<input type="text" value="' + (t.grade || '').replace(/"/g,'&quot;') + '" placeholder="\uC608: \uC804\uD559\uB144" onchange="_ltUpdateField(\'' + t.id + '\',\'grade\',this.value)" style="width:100%;padding:8px 12px;border:1px solid #E5E5EA;border-radius:8px;font-size:12px;outline:none;box-sizing:border-box" onfocus="this.style.borderColor=\'#0071E3\'" onblur="this.style.borderColor=\'#E5E5EA\'">';
  h += '</div>';
  // 교육과정
  h += '<div>';
  h += '<label style="font-size:11px;font-weight:700;color:#48484A;display:block;margin-bottom:4px">\uAD50\uC721\uACFC\uC815</label>';
  h += '<input type="text" value="' + (t.curriculum || '').replace(/"/g,'&quot;') + '" placeholder="\uC608: 2022 \uAC1C\uC815" onchange="_ltUpdateField(\'' + t.id + '\',\'curriculum\',this.value)" style="width:100%;padding:8px 12px;border:1px solid #E5E5EA;border-radius:8px;font-size:12px;outline:none;box-sizing:border-box" onfocus="this.style.borderColor=\'#0071E3\'" onblur="this.style.borderColor=\'#E5E5EA\'">';
  h += '</div>';
  // 연계 시스템 (멀티 선택)
  h += '<div style="grid-column:1/4;margin-top:4px">';
  h += '<label style="font-size:11px;font-weight:700;color:#48484A;display:block;margin-bottom:6px">\uC5F0\uACC4 \uC2DC\uC2A4\uD15C <span style="color:#FF3B30">*</span></label>';
  var _tSystems = t.targetSystems || [];
  var _allSys = Object.keys(WC_SYSTEM_COLORS);
  h += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px">';
  _allSys.forEach(function(sk) {
    var sys = WC_SYSTEM_COLORS[sk];
    var isOn = _tSystems.indexOf(sk) >= 0;
    h += '<button onclick="_ltToggleTargetSystem(\'' + t.id + '\',\'' + sk + '\')" style="padding:5px 14px;border-radius:6px;font-size:12px;font-weight:500;cursor:pointer;transition:all .12s;border:1px solid ' + (isOn ? sys.color : '#E5E5EA') + ';background:' + (isOn ? sys.bg : '#fff') + ';color:' + (isOn ? sys.color : '#8E8E93') + '">' + sys.label + '</button>';
  });
  h += '</div>';
  // 주의사항
  if(_tSystems.length > 1) {
    h += '<div style="display:flex;align-items:flex-start;gap:6px;padding:6px 10px;background:#FFF8F0;border-radius:6px;border:1px solid #FFD9A8">';
    h += '<span style="font-size:12px;flex-shrink:0;margin-top:1px">\u26A0\uFE0F</span>';
    h += '<span style="font-size:10px;color:#B35C00;font-weight:600;line-height:1.4">\uCF58\uD150\uCE20\uAC00 \uB3D9\uC77C\uD558\uC9C0 \uC54A\uC744 \uACBD\uC6B0 \uD558\uB098\uC758 \uC2DC\uC2A4\uD15C\uB9CC \uC120\uD0DD\uD558\uC138\uC694! \uC2DC\uC2A4\uD15C\uBCC4\uB85C \uBCC4\uB3C4 \uAD6C\uC870\uB97C \uB9CC\uB4E4\uC5B4\uC57C \uD569\uB2C8\uB2E4.</span>';
    h += '</div>';
  } else if(_tSystems.length === 0) {
    h += '<div style="font-size:10px;color:#8E8E93">\uBC30\uD3EC\uD560 \uC2DC\uC2A4\uD15C\uC744 1\uAC1C \uC774\uC0C1 \uC120\uD0DD\uD558\uC138\uC694</div>';
  }
  h += '</div>';
  h += '</div></div>';

  // ── 빠른 생성 (기존 depth 있으면 접힌 상태) ──
  var hasExistingDepth = depthCount > 0 && flatInfo.length > 0 && flatInfo.some(function(fi){ return fi.fields && fi.fields.length > 0; });
  var quickGenCollapsed = hasExistingDepth && !LT_STATE._quickGenOpen;
  h += '<div style="background:#fff;border-radius:12px;border:1px solid ' + (quickGenCollapsed ? '#F5F5F7' : '#E5E5EA') + ';overflow:hidden;margin-bottom:16px">';
  h += '<div onclick="LT_STATE._quickGenOpen=!LT_STATE._quickGenOpen;renderLearningTypeView()" style="padding:' + (quickGenCollapsed ? '10px 18px' : '14px 18px') + ';' + (quickGenCollapsed ? '' : 'border-bottom:1px solid #F5F5F7;') + 'display:flex;align-items:center;gap:8px;cursor:pointer" onmouseenter="this.style.background=\'#FAFAFA\'" onmouseleave="this.style.background=\'transparent\'">';
  h += '<svg viewBox="0 0 24 24" fill="none" stroke="' + (quickGenCollapsed ? '#8E8E93' : '#0071E3') + '" stroke-width="2" style="width:' + (quickGenCollapsed ? '12' : '16') + 'px;height:' + (quickGenCollapsed ? '12' : '16') + 'px;flex-shrink:0;transition:transform .15s;transform:rotate(' + (quickGenCollapsed ? '0' : '90') + 'deg)"><polyline points="9 18 15 12 9 6"/></svg>';
  if(quickGenCollapsed) {
    h += '<span style="font-size:11px;font-weight:600;color:#8E8E93">\uB2E8\uACC4 \uAD6C\uC870 \uBE60\uB978 \uC0DD\uC131</span>';
    h += '<div style="flex:1"></div>';
    h += '<span style="font-size:10px;color:#D1D1D6">\uD074\uB9AD\uD558\uC5EC \uD3BC\uCE58\uAE30</span>';
  } else {
    h += '<span style="font-size:13px;font-weight:600;color:#1D1D1F">\uB2E8\uACC4 \uAD6C\uC870 \uC790\uB3D9 \uC0DD\uC131</span>';
    h += '<span style="font-size:10px;color:#8E8E93">\uB2E8\uACC4 \uC218\uB97C \uC785\uB825\uD558\uBA74 \uAD6C\uC870\uAC00 \uC790\uB3D9 \uC0DD\uC131\uB429\uB2C8\uB2E4</span>';
    h += '<div style="flex:1"></div>';
    h += '<span style="font-size:11px;color:#8E8E93">\uD604\uC7AC: <strong style="color:#1D1D1F">' + depthCount + '</strong> Depth</span>';
  }
  h += '</div>';
  if(!quickGenCollapsed) {
  h += '<div style="padding:16px 18px">';
  h += '<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">';
  h += '<label style="font-size:12px;font-weight:700;color:#48484A;white-space:nowrap">\uB2E8\uACC4 \uC218</label>';
  h += '<input id="ltDepthCountInput" type="number" min="1" max="8" value="' + (depthCount || 4) + '" style="width:72px;padding:8px 12px;border:1px solid #E5E5EA;border-radius:8px;font-size:14px;font-weight:700;text-align:center;outline:none" onfocus="this.style.borderColor=\'#0071E3\'" onblur="this.style.borderColor=\'#E5E5EA\'">';
  h += '<button onclick="_ltGenerateDepths(\'' + t.id + '\')" style="padding:8px 18px;border:none;border-radius:8px;background:#0071E3;color:#fff;font-size:12px;font-weight:500;cursor:pointer">\uAD6C\uC870 \uC0DD\uC131</button>';
  if(hasExistingDepth) h += '<span style="font-size:10px;color:#FF9500;margin-left:8px">\u26A0 \uAE30\uC874 Depth\uAC00 \uCD08\uAE30\uD654\uB429\uB2C8\uB2E4</span>';
  h += '</div>';
  // 프리셋
  h += '<div style="display:flex;gap:6px;flex-wrap:wrap">';
  var presets = [
    {n:3, label:'\uCEE4\uB9AC\uD058\uB7FC\uBA85 \u203A \uACFC\uC815 \u203A \uC138\uD2B8'},
    {n:4, label:'\uCEE4\uB9AC\uD058\uB7FC\uBA85 \u203A \uACFC\uC815 \u203A \uC138\uD2B8 \u203A \uD559\uC2B5\uC77C'},
    {n:5, label:'\uCEE4\uB9AC\uD058\uB7FC\uBA85 \u203A \uACFC\uC815 \u203A \uB2E8\uC6D0 \u203A \uC138\uD2B8 \u203A \uD559\uC2B5\uC77C'},
    {n:4, label:'\uCEE4\uB9AC\uD058\uB7FC\uBA85 \u203A \uCD9C\uD310\uC0AC \u203A \uAC15\uC88C \u203A \uAC15'},
  ];
  presets.forEach(function(pr, pi) {
    h += '<button onclick="_ltApplyPreset(\'' + t.id + '\',' + pi + ')" style="padding:5px 12px;border:1px solid #E5E5EA;border-radius:6px;background:#FAFAFA;color:#48484A;font-size:10px;font-weight:600;cursor:pointer;transition:all .1s" onmouseenter="this.style.borderColor=\'#0071E3\';this.style.color=\'#0071E3\'" onmouseleave="this.style.borderColor=\'#E5E5EA\';this.style.color=\'#48484A\'">' + pr.label + '</button>';
  });
  h += '</div></div>';
  }
  h += '</div>';

  // ── Depth 목록 (상세 편집) ──
  h += '<div style="background:#fff;border-radius:12px;border:1px solid #E5E5EA;overflow:hidden">';
  h += '<div style="padding:14px 18px;border-bottom:1px solid #F5F5F7;display:flex;align-items:center;gap:8px">';
  h += '<span style="font-size:13px;font-weight:600;color:#1D1D1F">\uB2E8\uACC4 \uBAA9\uB85D</span>';
  h += '<span style="font-size:10px;color:#8E8E93">\uB2E8\uACC4\uBA85, \uBCF4\uC870\uBA85, \uADF8\uB8F9 \uC218\uB97C \uC815\uC758\uD569\uB2C8\uB2E4</span>';
  h += '</div>';
  h += '<div style="padding:0">';

  var depthColors = ['#0071E3','#AF52DE','#34C759','#FF9500','#FF3B30','#0891B2','#BE185D','#0071E3'];
  if(flatInfo.length === 0) {
    h += '<div style="padding:32px;text-align:center;color:#8E8E93;font-size:12px">\uC704 \uBE60\uB978 \uC0DD\uC131\uC73C\uB85C \uB2E8\uACC4 \uAD6C\uC870\uB97C \uB9CC\uB4E4\uC5B4\uC8FC\uC138\uC694</div>';
  } else {
    // 테이블 헤더
    h += '<div style="display:grid;grid-template-columns:40px 1.2fr 1.2fr 100px 60px;gap:0;padding:8px 18px;background:#FAFAFA;border-bottom:1px solid #F5F5F7;font-size:9px;font-weight:700;color:#8E8E93;text-transform:uppercase;letter-spacing:.06em">';
    h += '<div>\uB2E8\uACC4</div><div>\uB2E8\uACC4\uBA85</div><div>\uBCF4\uC870\uBA85</div><div style="text-align:center">\uADF8\uB8F9 \uC218</div><div style="text-align:center">\uD544\uB4DC</div>';
    h += '</div>';

    flatInfo.forEach(function(fi, idx) {
      var dc = depthColors[fi.level % depthColors.length];
      var isLast = idx === flatInfo.length - 1;
      h += '<div style="display:grid;grid-template-columns:40px 1.2fr 1.2fr 100px 60px;gap:0;padding:10px 18px;align-items:center;border-bottom:' + (isLast ? 'none' : '1px solid #F5F5F7') + ';transition:background .1s" onmouseenter="this.style.background=\'#FAFAFA\'" onmouseleave="this.style.background=\'transparent\'">';

      // Depth 번호
      h += '<div style="display:flex;align-items:center;gap:4px">';
      h += '<div style="width:24px;height:24px;border-radius:6px;background:' + dc + '12;display:flex;align-items:center;justify-content:center"><span style="font-size:11px;font-weight:600;color:' + dc + '">' + (fi.level + 1) + '</span></div>';
      h += '</div>';

      // Depth명
      h += '<div><input type="text" value="' + fi.name + '" onchange="_ltTreeRenameLevel(\'' + t.id + '\',' + fi.level + ',this.value)" style="width:100%;padding:6px 10px;border:1px solid transparent;border-radius:6px;font-size:13px;font-weight:700;color:#1D1D1F;outline:none;background:transparent;transition:all .12s;box-sizing:border-box" onfocus="this.style.borderColor=\'' + dc + '\';this.style.background=\'#fff\'" onblur="this.style.borderColor=\'transparent\';this.style.background=\'transparent\'" placeholder="\uB2E8\uACC4 ' + (fi.level + 1) + ' \uC774\uB984"></div>';

      // 보조명
      h += '<div><input type="text" value="' + (fi.subName || '') + '" onchange="_ltSetDepthProp(\'' + t.id + '\',' + fi.level + ',\'subName\',this.value)" style="width:100%;padding:6px 10px;border:1px solid transparent;border-radius:6px;font-size:12px;color:#636366;outline:none;background:transparent;transition:all .12s;box-sizing:border-box" onfocus="this.style.borderColor=\'#D1D1D6\';this.style.background=\'#fff\'" onblur="this.style.borderColor=\'transparent\';this.style.background=\'transparent\'" placeholder="\uBCF4\uC870\uBA85 \uC785\uB825"></div>';

      // 그룹 수
      h += '<div style="text-align:center"><input type="number" min="1" max="999" value="' + (fi.groupCount || 1) + '" onchange="_ltSetDepthProp(\'' + t.id + '\',' + fi.level + ',\'groupCount\',parseInt(this.value)||1)" style="width:64px;padding:5px 8px;border:1px solid #E5E5EA;border-radius:6px;font-size:12px;font-weight:600;text-align:center;outline:none" onfocus="this.style.borderColor=\'' + dc + '\'" onblur="this.style.borderColor=\'#E5E5EA\'"></div>';

      // 필드 수
      var fCount = fi.fields ? fi.fields.length : 0;
      h += '<div style="text-align:center"><span style="font-size:10px;padding:2px 8px;border-radius:980px;background:' + (fCount > 0 ? '#F0FFF4' : '#FFF8F0') + ';color:' + (fCount > 0 ? '#34C759' : '#B35C00') + ';font-weight:700">' + fCount + '</span></div>';

      h += '</div>';
    });
  }
  h += '</div>';

  // 미리보기
  h += '<div style="padding:14px 18px;border-top:1px solid #F5F5F7;background:#FAFAFA">';
  h += '<div style="font-size:10px;font-weight:700;color:#8E8E93;margin-bottom:8px">\uAD6C\uC870 \uBBF8\uB9AC\uBCF4\uAE30</div>';
  h += '<div style="display:flex;align-items:center;gap:0;flex-wrap:wrap">';
  flatInfo.forEach(function(fi, idx) {
    if(idx > 0) h += '<svg viewBox="0 0 24 24" fill="none" stroke="#D1D1D6" stroke-width="2" style="width:16px;height:16px;flex-shrink:0"><polyline points="9 18 15 12 9 6"/></svg>';
    var bgColors = ['#E8F2FF','#F9F0FF','#F0FFF4','#FFF8F0','#FFF1F2','#F0F9FF'];
    var borderColors = ['#B3D7FF','#D9B3F0','#A8E6B8','#FFD9A8','#FECDD3','#BAE6FD'];
    var ci = fi.level % bgColors.length;
    h += '<div style="background:' + bgColors[ci] + ';border:1px solid ' + borderColors[ci] + ';border-radius:8px;padding:6px 14px;text-align:center">';
    h += '<div style="font-size:8px;color:#8E8E93;font-weight:600">\uB2E8\uACC4 ' + (fi.level + 1) + '</div>';
    h += '<div style="font-size:12px;font-weight:700;color:#1D1D1F">' + fi.name + '</div>';
    if(fi.subName) h += '<div style="font-size:9px;color:#636366">' + fi.subName + '</div>';
    h += '<div style="font-size:9px;color:#8E8E93;margin-top:1px">' + (fi.groupCount || 1) + '\uAC1C \uADF8\uB8F9</div>';
    h += '</div>';
  });
  h += '</div></div>';

  h += '</div>';

  // 다음 단계 버튼
  if(depthCount > 0) {
    h += '<div style="margin-top:16px;display:flex;justify-content:flex-end">';
    h += '<button onclick="LT_STATE.editTab=\'step2\';renderLearningTypeView()" style="padding:10px 24px;border:none;border-radius:8px;background:#0071E3;color:#fff;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px">';
    h += '2\uB2E8\uACC4: \uD544\uB4DC \uBC30\uC815 \u2192';
    h += '</button></div>';
  }

  return h;
}

// Depth 트리에서 flat 정보 추출 (name, subName, groupCount, fields, level)
function _ltGetDepthFlatInfo(depths) {
  var result = [];
  function walk(nodes, level) {
    if(!nodes || nodes.length === 0) return;
    nodes.forEach(function(n) {
      result.push({name:n.name, subName:n.subName||'', groupCount:n.groupCount||1, fields:n.fields||[], level:level, id:n.id});
      walk(n.children, level + 1);
    });
  }
  walk(depths, 0);
  return result;
}

// Depth 속성(subName, groupCount) 설정
function _ltSetDepthProp(typeId, level, prop, value) {
  var t = LT_STATE.types.find(function(x){ return x.id === typeId; });
  if(!t) return;
  function walkSet(nodes, curLevel) {
    if(!nodes) return;
    nodes.forEach(function(n) {
      if(curLevel === level) n[prop] = value;
      walkSet(n.children, curLevel + 1);
    });
  }
  walkSet(t.depths, 0);
}


function _ltFlattenDepths(nodes, result, level) {
  if(!nodes) return;
  nodes.forEach(function(n) {
    result.push({name:n.name, level:level, id:n.id});
    _ltFlattenDepths(n.children, result, level + 1);
  });
}

function _ltRenderTreeNodes(typeId, nodes, depth) {
  if(!nodes || nodes.length === 0) return '';
  var h = '';
  nodes.forEach(function(node, ni) {
    var indent = depth * 28;
    var hasChildren = node.children && node.children.length > 0;
    var depthColors = ['#0071E3','#AF52DE','#34C759','#FF9500','#FF3B30','#0891B2'];
    var dc = depthColors[depth % depthColors.length];

    // 노드 행 (트리 에디터 스타일)
    h += '<div style="display:flex;align-items:center;gap:0;padding:5px 12px 5px ' + (16 + indent) + 'px;transition:background .1s" onmouseenter="this.style.background=\'#FAFAFA\'" onmouseleave="this.style.background=\'transparent\'">';

    // 연결선 + 아이콘
    if(depth > 0) {
      h += '<div style="width:16px;height:16px;display:flex;align-items:center;justify-content:center;color:#D1D1D6;font-size:10px;flex-shrink:0">└</div>';
    }

    // Depth 표시
    h += '<div style="min-width:52px;display:flex;align-items:center;gap:4px;flex-shrink:0">';
    h += '<div style="width:6px;height:6px;border-radius:50%;background:' + dc + '"></div>';
    h += '<span style="font-size:9px;font-weight:700;color:' + dc + '">\uB2E8\uACC4 ' + (depth + 1) + '</span>';
    h += '</div>';

    // 이름 편집
    h += '<input type="text" value="' + node.name + '" onchange="_ltTreeRename(\'' + typeId + '\',\'' + node.id + '\',this.value)" style="flex:1;padding:5px 10px;border:1px solid #E5E5EA;border-radius:6px;font-size:13px;font-weight:600;outline:none;max-width:240px;transition:border-color .15s" onfocus="this.style.borderColor=\'' + dc + '\'" onblur="this.style.borderColor=\'#E5E5EA\'">';

    // 액션 버튼들
    h += '<div style="display:flex;gap:4px;margin-left:8px">';
    h += '<button onclick="_ltTreeAddChild(\'' + typeId + '\',\'' + node.id + '\')" style="padding:3px 8px;border:1px solid #B3D7FF;border-radius:5px;background:#E8F2FF;color:#0071E3;font-size:10px;font-weight:700;cursor:pointer" title="하위 단계 추가">+ 하위</button>';
    if(depth > 0 || (nodes.length > 1 && depth === 0)) {
      h += '<button onclick="_ltTreeRemove(\'' + typeId + '\',\'' + node.id + '\')" style="padding:3px 6px;border:1px solid #FFB3AE;border-radius:5px;background:#fff;color:#FF3B30;font-size:10px;cursor:pointer" title="삭제">×</button>';
    }
    if(ni > 0) {
      h += '<button onclick="_ltTreeMove(\'' + typeId + '\',\'' + node.id + '\',-1)" style="padding:2px 5px;border:1px solid #E5E5EA;border-radius:4px;background:#fff;color:#636366;font-size:9px;cursor:pointer">▲</button>';
    }
    if(ni < nodes.length - 1) {
      h += '<button onclick="_ltTreeMove(\'' + typeId + '\',\'' + node.id + '\',1)" style="padding:2px 5px;border:1px solid #E5E5EA;border-radius:4px;background:#fff;color:#636366;font-size:9px;cursor:pointer">▼</button>';
    }
    h += '</div></div>';

    // 재귀: 자식 노드
    if(hasChildren) {
      h += _ltRenderTreeNodes(typeId, node.children, depth + 1);
    }
  });
  return h;
}

// ══ 2단계: Depth별 필드 배정 ══
function _ltRenderStep2(t) {
  var h = '';
  var flatInfo = _ltGetDepthFlatInfo(t.depths);
  var depthColors = ['#0071E3','#AF52DE','#34C759','#FF9500','#FF3B30','#0891B2','#BE185D','#0071E3'];

  // 현재 선택된 Depth (편집 대상)
  if(!LT_STATE._activeDepth && flatInfo.length > 0) LT_STATE._activeDepth = flatInfo[flatInfo.length - 1].level;
  var activeLevel = LT_STATE._activeDepth || 0;

  h += '<div style="display:flex;gap:16px;height:100%">';

  // ── 좌측: Depth 선택 ──
  h += '<div style="width:200px;background:#fff;border-radius:12px;border:1px solid #E5E5EA;display:flex;flex-direction:column;flex-shrink:0">';
  h += '<div style="padding:12px 14px;border-bottom:1px solid #F5F5F7">';
  h += '<div style="font-size:12px;font-weight:600;color:#1D1D1F">\uB2E8\uACC4 \uC120\uD0DD</div>';
  h += '<div style="font-size:9px;color:#8E8E93;margin-top:2px">\uD544\uB4DC\uB97C \uBC30\uC815\uD560 \uB2E8\uACC4\uB97C \uC120\uD0DD\uD558\uC138\uC694</div>';
  h += '</div>';
  h += '<div style="flex:1;overflow-y:auto;padding:6px">';
  flatInfo.forEach(function(fi) {
    var dc = depthColors[fi.level % depthColors.length];
    var isActive = fi.level === activeLevel;
    var fCount = fi.fields ? fi.fields.length : 0;
    h += '<div onclick="LT_STATE._activeDepth=' + fi.level + ';renderLearningTypeView()" style="padding:10px 12px;border-radius:8px;cursor:pointer;margin-bottom:3px;border-left:3px solid ' + (isActive ? dc : 'transparent') + ';background:' + (isActive ? dc + '08' : 'transparent') + ';transition:all .1s">';
    h += '<div style="display:flex;align-items:center;gap:6px">';
    h += '<div style="width:22px;height:22px;border-radius:6px;background:' + dc + '15;display:flex;align-items:center;justify-content:center"><span style="font-size:10px;font-weight:600;color:' + dc + '">' + (fi.level + 1) + '</span></div>';
    h += '<div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:' + (isActive ? '700' : '500') + ';color:' + (isActive ? '#1D1D1F' : '#636366') + '">' + fi.name + '</div>';
    if(fi.subName) h += '<div style="font-size:9px;color:#8E8E93">' + fi.subName + '</div>';
    h += '</div>';
    h += '<span style="font-size:9px;padding:2px 6px;border-radius:980px;background:' + (fCount > 0 ? '#F0FFF4' : '#F5F5F7') + ';color:' + (fCount > 0 ? '#34C759' : '#8E8E93') + ';font-weight:700">' + fCount + '</span>';
    h += '</div></div>';
  });
  h += '</div></div>';

  // ── 우측: 필드 배정 영역 ──
  var activeFI = flatInfo.find(function(fi){ return fi.level === activeLevel; });
  var assignedKeys = activeFI && activeFI.fields ? activeFI.fields : [];

  h += '<div style="flex:1;display:flex;flex-direction:column;gap:12px">';

  // 헤더
  var adc = depthColors[activeLevel % depthColors.length];
  h += '<div style="background:#fff;border-radius:12px;border:1px solid #E5E5EA;padding:14px 18px;display:flex;align-items:center;gap:10px">';
  h += '<div style="width:32px;height:32px;border-radius:8px;background:' + adc + '15;display:flex;align-items:center;justify-content:center"><span style="font-size:14px;font-weight:600;color:' + adc + '">' + (activeLevel + 1) + '</span></div>';
  h += '<div><div style="font-size:14px;font-weight:700;color:#1D1D1F">' + (activeFI ? activeFI.name : '') + '</div>';
  h += '<div style="font-size:11px;color:#8E8E93">\uC774 \uB2E8\uACC4\uC5D0\uC11C \uC785\uB825\uD560 \uD544\uB4DC\uB97C \uC120\uD0DD\uD569\uB2C8\uB2E4 \u2014 \uC120\uD0DD\uB41C \uD544\uB4DC\uAC00 \uC791\uC5C5\uC790\uC758 \uC785\uB825 \uC591\uC2DD\uC774 \uB429\uB2C8\uB2E4</div>';
  h += '</div></div>';

  // 배정된 필드
  h += '<div style="background:#fff;border-radius:12px;border:1px solid #E5E5EA;overflow:hidden">';
  h += '<div style="padding:10px 14px;border-bottom:1px solid #F5F5F7;display:flex;align-items:center;gap:6px;background:' + adc + '08">';
  h += '<span style="font-size:11px;font-weight:700;color:' + adc + '">\uBC30\uC815\uB41C \uD544\uB4DC (' + assignedKeys.length + ')</span>';
  h += '</div>';
  if(assignedKeys.length > 0) {
    h += '<div style="padding:8px">';
    assignedKeys.forEach(function(key, ki) {
      var poolField = LT_FIELD_POOL.find(function(pf){ return pf.key === key; });
      var label = poolField ? poolField.label : key;
      var ftype = poolField ? poolField.type : 'text';
      var fdesc = poolField ? poolField.desc : '';
      h += '<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:#fff;border-radius:6px;margin-bottom:3px;border:1px solid #F5F5F7;transition:border-color .1s" onmouseenter="this.style.borderColor=\'#D1D1D6\'" onmouseleave="this.style.borderColor=\'#F5F5F7\'">';
      h += '<span style="font-size:12px;font-weight:700;color:#1D1D1F;min-width:100px">' + label + '</span>';
      h += '<span style="font-size:9px;padding:1px 6px;border-radius:3px;background:#F5F5F7;color:#636366;font-weight:600">' + ftype + '</span>';
      h += '<span style="font-size:9px;color:#8E8E93;flex:1">' + fdesc + '</span>';
      h += '<button onclick="_ltRemoveDepthField(\'' + t.id + '\',' + activeLevel + ',\'' + key + '\')" style="width:20px;height:20px;border:none;border-radius:4px;background:transparent;color:#D1D1D6;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px;transition:all .1s" onmouseenter="this.style.background=\'#FFB3AE\';this.style.color=\'#FF3B30\'" onmouseleave="this.style.background=\'transparent\';this.style.color=\'#D1D1D6\'">\u00D7</button>';
      h += '</div>';
    });
    h += '</div>';
  } else {
    h += '<div style="padding:20px;text-align:center;color:#8E8E93;font-size:11px">\uC544\uB798 \uD544\uB4DC \uD480\uC5D0\uC11C \uD074\uB9AD\uD558\uC5EC \uCD94\uAC00\uD558\uC138\uC694</div>';
  }
  h += '</div>';

  // 필드 풀 (추가 가능한 필드)
  h += '<div style="background:#fff;border-radius:12px;border:1px solid #E5E5EA;overflow:hidden;flex:1">';
  h += '<div style="padding:10px 14px;border-bottom:1px solid #F5F5F7;display:flex;align-items:center;gap:6px">';
  h += '<span style="font-size:11px;font-weight:700;color:#48484A">\uD544\uB4DC \uD480</span>';
  h += '<span style="font-size:9px;color:#8E8E93">\uD074\uB9AD\uD558\uBA74 \uC704 \uB2E8\uACC4\uC5D0 \uCD94\uAC00\uB429\uB2C8\uB2E4</span>';
  h += '</div>';
  h += '<div style="padding:8px;display:flex;flex-wrap:wrap;gap:4px;max-height:280px;overflow-y:auto">';
  var cats = _ltGetFieldCategories();
  cats.forEach(function(cat) {
    var catFields = LT_FIELD_POOL.filter(function(pf){ return pf.category === cat; });
    var avail = catFields.filter(function(pf){ return assignedKeys.indexOf(pf.key) < 0; });
    if(avail.length === 0) return;
    h += '<div style="width:100%;font-size:9px;font-weight:700;color:#8E8E93;text-transform:uppercase;letter-spacing:.06em;padding:4px 6px;margin-top:4px">' + cat + '</div>';
    avail.forEach(function(pf) {
      h += '<span onclick="_ltAddDepthField(\'' + t.id + '\',' + activeLevel + ',\'' + pf.key + '\')" style="font-size:10px;padding:4px 10px;border-radius:5px;background:#FAFAFA;color:#48484A;cursor:pointer;border:1px solid #E5E5EA;font-weight:600;transition:all .1s" onmouseenter="this.style.borderColor=\'#0071E3\';this.style.color=\'#0071E3\';this.style.background=\'#F0F9FF\'" onmouseleave="this.style.borderColor=\'#E5E5EA\';this.style.color=\'#48484A\';this.style.background=\'#FAFAFA\'">+ ' + pf.label + '</span>';
    });
  });
  h += '</div></div>';

  h += '</div></div>';

  // 네비게이션
  h += '<div style="margin-top:16px;display:flex;justify-content:space-between">';
  h += '<button onclick="LT_STATE.editTab=\'step1\';renderLearningTypeView()" style="padding:10px 20px;border:1px solid #E5E5EA;border-radius:8px;background:#fff;color:#636366;font-size:13px;font-weight:600;cursor:pointer">\u2190 1\uB2E8\uACC4: \uB2E8\uACC4 \uAD6C\uC870 \uC815\uC758</button>';
  h += '<button onclick="LT_STATE.editTab=\'step3\';renderLearningTypeView()" style="padding:10px 24px;border:none;border-radius:8px;background:#0071E3;color:#fff;font-size:13px;font-weight:700;cursor:pointer">3\uB2E8\uACC4: \uC800\uC7A5 \u00B7 \uAD00\uB9AC \u2192</button>';
  h += '</div>';

  return h;
}

// Depth에 필드 추가
function _ltAddDepthField(typeId, level, fieldKey) {
  var t = LT_STATE.types.find(function(x){ return x.id === typeId; });
  if(!t) return;
  function walkAdd(nodes, curLevel) {
    if(!nodes) return;
    nodes.forEach(function(n) {
      if(curLevel === level) {
        if(!n.fields) n.fields = [];
        if(n.fields.indexOf(fieldKey) < 0) n.fields.push(fieldKey);
      }
      walkAdd(n.children, curLevel + 1);
    });
  }
  walkAdd(t.depths, 0);
  renderLearningTypeView();
}

// Depth에서 필드 제거
function _ltRemoveDepthField(typeId, level, fieldKey) {
  var t = LT_STATE.types.find(function(x){ return x.id === typeId; });
  if(!t) return;
  function walkRemove(nodes, curLevel) {
    if(!nodes) return;
    nodes.forEach(function(n) {
      if(curLevel === level && n.fields) {
        var idx = n.fields.indexOf(fieldKey);
        if(idx >= 0) n.fields.splice(idx, 1);
      }
      walkRemove(n.children, curLevel + 1);
    });
  }
  walkRemove(t.depths, 0);
  renderLearningTypeView();
}


function _ltAttrEditRow(typeId, attr) {
  var h = '';
  h += '<div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:#fff;border-radius:8px;margin-bottom:4px;border:1px solid #F5F5F7;transition:border-color .1s" onmouseenter="this.style.borderColor=\'#D1D1D6\'" onmouseleave="this.style.borderColor=\'#F5F5F7\'">';

  // 라벨 (DB 카탈로그 기반은 읽기 전용, 수동 추가분은 편집 가능)
  var isCatalogField = DB_FIELD_CATALOG.some(function(f){ return f.key === attr.key; });
  if(isCatalogField) {
    h += '<span style="width:120px;padding:4px 8px;font-size:12px;font-weight:700;color:#1D1D1F">' + attr.label + '</span>';
  } else {
    h += '<input type="text" value="' + attr.label + '" onchange="_ltUpdateAttrField(\'' + typeId + '\',\'' + attr.key + '\',\'label\',this.value)" style="width:120px;padding:4px 8px;border:1px solid transparent;border-radius:4px;font-size:12px;font-weight:700;color:#1D1D1F;outline:none;background:transparent;transition:border-color .1s" onfocus="this.style.borderColor=\'#B3D7FF\';this.style.background=\'#fff\'" onblur="this.style.borderColor=\'transparent\';this.style.background=\'transparent\'">';
  }

  // 키
  h += '<span style="font-size:10px;font-family:monospace;color:#8E8E93;min-width:60px">' + attr.key + '</span>';

  // 타입 선택
  h += '<select onchange="_ltUpdateAttrField(\'' + typeId + '\',\'' + attr.key + '\',\'type\',this.value)" style="padding:3px 8px;border:1px solid #E5E5EA;border-radius:4px;font-size:10px;outline:none;cursor:pointer;background:#FAFAFA;color:#48484A">';
  var attrTypes = ['text','number','file','select','textarea','date'];
  attrTypes.forEach(function(at) {
    h += '<option value="' + at + '"' + (attr.type === at ? ' selected' : '') + '>' + at + '</option>';
  });
  h += '</select>';

  h += '<div style="flex:1"></div>';

  // 필수/선택 토글
  h += '<button onclick="_ltToggleRequired(\'' + typeId + '\',\'' + attr.key + '\')" style="padding:3px 10px;border:1px solid ' + (attr.required ? '#FFD9A8' : '#E5E5EA') + ';border-radius:5px;background:' + (attr.required ? '#FFF8F0' : '#fff') + ';color:' + (attr.required ? '#B35C00' : '#8E8E93') + ';font-size:10px;font-weight:700;cursor:pointer;transition:all .12s">' + (attr.required ? '필수' : '선택') + '</button>';

  // 삭제
  h += '<button onclick="_ltRemoveAttr(\'' + typeId + '\',\'' + attr.key + '\')" style="padding:3px 7px;border:1px solid #FFB3AE;border-radius:5px;background:#fff;color:#FF3B30;font-size:10px;cursor:pointer">×</button>';
  h += '</div>';
  return h;
}

// ══ 3단계: 기본정보 + 저장 + 목록 관리 ══
function _ltRenderStep3(t) {
  var h = '';
  var flatInfo = _ltGetDepthFlatInfo(t.depths);
  var depthCount = _ltCountDepth(t.depths);

  // ── 기본 정보 카드 ──
  h += '<div style="background:#fff;border-radius:12px;border:1px solid #E5E5EA;padding:20px;max-width:600px;margin-bottom:16px">';
  h += '<div style="font-size:14px;font-weight:600;color:#1D1D1F;margin-bottom:16px">\uD15C\uD50C\uB9BF \uAE30\uBCF8 \uC815\uBCF4</div>';

  // 템플릿명 + 코드
  h += '<div style="display:flex;gap:12px;margin-bottom:14px">';
  h += '<div style="flex:2"><label style="font-size:11px;font-weight:700;color:#48484A;display:block;margin-bottom:4px">\uD15C\uD50C\uB9BF\uBA85</label>';
  h += '<input type="text" value="' + t.name + '" onchange="_ltUpdateField(\'' + t.id + '\',\'name\',this.value)" style="width:100%;padding:9px 12px;border:1px solid #E5E5EA;border-radius:8px;font-size:14px;font-weight:700;outline:none;box-sizing:border-box" placeholder="\uC608: \uC815\uB2F5\u00B7\uD574\uC124 (\uB274\uB4DC\uB9BC\uC2A4)">';
  h += '</div>';
  h += '<div style="flex:1"><label style="font-size:11px;font-weight:700;color:#48484A;display:block;margin-bottom:4px">\uD15C\uD50C\uB9BF \uCF54\uB4DC</label>';
  h += '<select onchange="_ltUpdateField(\'' + t.id + '\',\'typeCode\',this.value)" style="width:100%;padding:9px 12px;border:1px solid #E5E5EA;border-radius:8px;font-size:13px;outline:none;background:#fff;font-family:monospace;box-sizing:border-box">';
  h += '<option value=""' + (!t.typeCode ? ' selected' : '') + '>\uC120\uD0DD</option>';
  Object.keys(CONTENT_TYPES).forEach(function(tc) {
    h += '<option value="' + tc + '"' + (t.typeCode === tc ? ' selected' : '') + '>' + tc + ' \u2014 ' + CONTENT_TYPES[tc].label + '</option>';
  });
  h += '</select></div></div>';

  h += '<div style="margin-bottom:14px"><label style="font-size:11px;font-weight:700;color:#48484A;display:block;margin-bottom:4px">\uC124\uBA85</label>';
  h += '<textarea onchange="_ltUpdateField(\'' + t.id + '\',\'desc\',this.value)" rows="2" style="width:100%;padding:9px 12px;border:1px solid #E5E5EA;border-radius:8px;font-size:13px;outline:none;resize:vertical;box-sizing:border-box">' + t.desc + '</textarea></div>';

  // 과목/학년/교육과정
  h += '<div style="display:flex;gap:12px;margin-bottom:14px">';
  h += '<div style="flex:1"><label style="font-size:11px;font-weight:700;color:#48484A;display:block;margin-bottom:4px">\uACFC\uBAA9</label>';
  h += '<select onchange="_ltUpdateField(\'' + t.id + '\',\'subject\',this.value)" style="width:100%;padding:9px 12px;border:1px solid #E5E5EA;border-radius:8px;font-size:13px;outline:none;background:#fff;box-sizing:border-box">';
  h += '<option value="">\uC120\uD0DD</option>';
  ['\uC218\uD559','\uC601\uC5B4','\uAD6D\uC5B4','\uD55C\uC790','\uACFC\uD559','\uC0AC\uD68C','\uC77C\uBCF8\uC5B4','\uD55C\uAD6D\uC0AC','\uB3C5\uC11C','\uC0AC\uACE0\uB825\uC218\uD559','\uCF54\uC5B4\uC218\uD559','\uC804\uACFC\uBAA9'].forEach(function(ss) {
    h += '<option value="' + ss + '"' + (t.subject === ss ? ' selected' : '') + '>' + ss + '</option>';
  });
  h += '</select></div>';
  h += '<div style="flex:1"><label style="font-size:11px;font-weight:700;color:#48484A;display:block;margin-bottom:4px">\uD559\uB144</label>';
  h += '<select onchange="_ltUpdateField(\'' + t.id + '\',\'grade\',this.value)" style="width:100%;padding:9px 12px;border:1px solid #E5E5EA;border-radius:8px;font-size:13px;outline:none;background:#fff;box-sizing:border-box">';
  h += '<option value="">\uC120\uD0DD</option>';
  ['\uC720\uC544','\uCD08\uB4F1 1~2','\uCD08\uB4F1 3~4','\uCD08\uB4F1 5~6','\uC911\uB4F1 1','\uC911\uB4F1 2','\uC911\uB4F1 3','\uACE0\uB4F1','\uC804\uD559\uB144'].forEach(function(g) {
    h += '<option value="' + g + '"' + (t.grade === g ? ' selected' : '') + '>' + g + '</option>';
  });
  h += '</select></div></div>';

  // 대표 색상
  h += '<div style="margin-bottom:14px"><label style="font-size:11px;font-weight:700;color:#48484A;display:block;margin-bottom:4px">\uB300\uD45C \uC0C9\uC0C1</label>';
  h += '<div style="display:flex;gap:6px;flex-wrap:wrap">';
  ['#0071E3','#AF52DE','#FF3B30','#34C759','#FF9500','#0891B2','#BE185D','#0071E3'].forEach(function(c) {
    h += '<div onclick="_ltUpdateField(\'' + t.id + '\',\'color\',\'' + c + '\')" style="width:28px;height:28px;border-radius:6px;background:' + c + ';cursor:pointer;border:2.5px solid ' + (t.color === c ? '#1D1D1F' : 'transparent') + '"></div>';
  });
  h += '</div></div>';

  h += '</div>';

  // ── 완성된 템플릿 요약 카드 ──
  h += '<div style="background:#fff;border-radius:12px;border:1px solid #34C759;padding:18px 20px;max-width:600px;margin-bottom:16px">';
  h += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">';
  h += '<svg viewBox="0 0 24 24" fill="none" stroke="#34C759" stroke-width="2" style="width:18px;height:18px"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';
  h += '<span style="font-size:14px;font-weight:600;color:#34C759">\uD15C\uD50C\uB9BF \uC694\uC57D</span>';
  h += '</div>';

  // Depth 구조 + 필드 매핑 시각화
  h += '<div style="margin-bottom:12px">';
  var depthColors = ['#0071E3','#AF52DE','#34C759','#FF9500','#FF3B30','#0891B2'];
  flatInfo.forEach(function(fi, idx) {
    var dc = depthColors[fi.level % depthColors.length];
    var isLast = idx === flatInfo.length - 1;
    h += '<div style="display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-bottom:' + (isLast ? 'none' : '1px solid #F5F5F7') + '">';
    h += '<div style="width:28px;height:28px;border-radius:6px;background:' + dc + '12;display:flex;align-items:center;justify-content:center;flex-shrink:0"><span style="font-size:11px;font-weight:600;color:' + dc + '">' + (fi.level + 1) + '</span></div>';
    h += '<div style="flex:1;min-width:0">';
    h += '<div style="font-size:12px;font-weight:700;color:#1D1D1F">' + fi.name;
    if(fi.subName) h += ' <span style="font-weight:400;color:#8E8E93">(' + fi.subName + ')</span>';
    h += '</div>';
    h += '<div style="font-size:10px;color:#636366;margin-top:2px">' + (fi.groupCount || 1) + '\uAC1C \uADF8\uB8F9</div>';
    if(fi.fields && fi.fields.length > 0) {
      h += '<div style="display:flex;flex-wrap:wrap;gap:3px;margin-top:4px">';
      fi.fields.forEach(function(fk) {
        var pf = LT_FIELD_POOL.find(function(p){ return p.key === fk; });
        h += '<span style="font-size:9px;padding:2px 7px;border-radius:4px;background:#F5F5F7;color:#48484A;font-weight:600;border:1px solid #E5E5EA">' + (pf ? pf.label : fk) + '</span>';
      });
      h += '</div>';
    }
    h += '</div></div>';
  });
  h += '</div>';

  // 총계
  var totalFields = 0;
  flatInfo.forEach(function(fi){ totalFields += (fi.fields ? fi.fields.length : 0); });
  h += '<div style="padding:8px 12px;background:#F0FFF4;border-radius:6px;border:1px solid #A8E6B8;font-size:11px;color:#1B8A3E;font-weight:600">';
  h += '\u2713 ' + depthCount + '\uB2E8\uACC4 \uAD6C\uC870 \u00B7 \uCD1D \uC785\uB825 \uD56D\uBAA9 ' + totalFields + '\uAC1C \u00B7 ';
  h += (t.name || '\uBBF8\uC785\uB825');
  h += '</div></div>';

  // 저장 / 복제
  h += '<div style="display:flex;gap:8px;max-width:600px">';
  h += '<button onclick="LT_STATE.editTab=\'step2\';renderLearningTypeView()" style="padding:10px 20px;border:1px solid #E5E5EA;border-radius:8px;background:#fff;color:#636366;font-size:13px;font-weight:600;cursor:pointer">\u2190 2\uB2E8\uACC4</button>';
  h += '<div style="flex:1"></div>';
  h += '<button onclick="_ltSaveAsNew(\'' + t.id + '\')" style="padding:10px 18px;border:1px solid #0071E3;border-radius:8px;background:#E8F2FF;color:#0055B8;font-size:12px;font-weight:500;cursor:pointer">\uBCF5\uC81C \uC800\uC7A5</button>';
  h += '<button onclick="toast(\'\uD15C\uD50C\uB9BF\uC774 \uC800\uC7A5\uB418\uC5C8\uC2B5\uB2C8\uB2E4\',\'t-ok\')" style="padding:10px 24px;border:none;border-radius:8px;background:#34C759;color:#fff;font-size:13px;font-weight:700;cursor:pointer">\u2713 \uC800\uC7A5</button>';
  h += '</div>';

  return h;
}


// ── 새 이름으로 저장 (복제) ──
function _ltSaveAsNew(typeId) {
  var src = LT_STATE.types.find(function(t){ return t.id === typeId; });
  if(!src) return;
  var newName = prompt('새 유형 이름을 입력하세요:', src.name + ' (복사본)');
  if(!newName || !newName.trim()) return;
  var newId = 'LT' + String(LT_STATE.types.length + 1).padStart(3, '0') + '_' + Date.now();
  var clone = JSON.parse(JSON.stringify(src));
  clone.id = newId;
  clone.name = newName.trim();
  // 새 depth ID 부여 (충돌 방지)
  _ltRegenIds(clone.depths);
  // 새 attr key 부여
  clone.attrs.forEach(function(a) {
    a.key = a.key + '_' + Date.now() + Math.random().toString(36).substr(2, 4);
  });
  LT_STATE.types.push(clone);
  LT_STATE.editingId = newId;
  LT_STATE.editTab = 'info';
  renderLearningTypeView();
  toast('새 유형 "' + newName.trim() + '"이(가) 생성되었습니다', 't-ok');
}

function _ltRegenIds(nodes) {
  if(!nodes) return;
  nodes.forEach(function(n) {
    n.id = 'dn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    if(n.children) _ltRegenIds(n.children);
  });
}

// ── 트리 조작 함수들 ──
function _ltFindNodeInTree(nodes, nodeId) {
  for(var i = 0; i < nodes.length; i++) {
    if(nodes[i].id === nodeId) return {parent:nodes, index:i, node:nodes[i]};
    if(nodes[i].children) {
      var found = _ltFindNodeInTree(nodes[i].children, nodeId);
      if(found) return found;
    }
  }
  return null;
}

function _ltTreeRename(typeId, nodeId, value) {
  var t = LT_STATE.types.find(function(t){ return t.id === typeId; });
  if(!t) return;
  var found = _ltFindNodeInTree(t.depths, nodeId);
  if(found) { found.node.name = value; renderLearningTypeView(); }
}

function _ltTreeAddChild(typeId, nodeId) {
  var t = LT_STATE.types.find(function(t){ return t.id === typeId; });
  if(!t) return;
  var found = _ltFindNodeInTree(t.depths, nodeId);
  if(!found) return;
  if(!found.node.children) found.node.children = [];
  var newId = 'dn_' + Date.now();
  found.node.children.push({id:newId, name:'새 단계', children:[]});
  renderLearningTypeView();
}

function _ltTreeRemove(typeId, nodeId) {
  var t = LT_STATE.types.find(function(t){ return t.id === typeId; });
  if(!t) return;
  var found = _ltFindNodeInTree(t.depths, nodeId);
  if(found && found.parent.length > 1) {
    found.parent.splice(found.index, 1);
    renderLearningTypeView();
  } else if(found && found.parent.length === 1) {
    toast('최소 1개의 루트 단계가 필요합니다','t-warn');
  }
}

function _ltTreeMove(typeId, nodeId, dir) {
  var t = LT_STATE.types.find(function(t){ return t.id === typeId; });
  if(!t) return;
  var found = _ltFindNodeInTree(t.depths, nodeId);
  if(!found) return;
  var arr = found.parent;
  var idx = found.index;
  var newIdx = idx + dir;
  if(newIdx < 0 || newIdx >= arr.length) return;
  var tmp = arr[idx]; arr[idx] = arr[newIdx]; arr[newIdx] = tmp;
  renderLearningTypeView();
}

// ── LT 유틸리티 함수들 ──

// 새 템플릿 유형 추가 (좌측 하단 "새 템플릿 유형" 버튼)
function _ltAddNewType() {
  var newCode = 'NEW' + Date.now().toString(36).toUpperCase().slice(-3);
  var newId = 'LT-' + newCode + '-' + Date.now().toString(36);
  var rootDepthId = 'dn_' + Date.now();
  LT_STATE.types.push({
    id: newId, name: '\uC2E0\uADDC \uD15C\uD50C\uB9BF', typeCode: newCode,
    desc: '\uC11C\uBE44\uC2A4 \uC2DC\uC2A4\uD15C + \uCF58\uD150\uCE20 \uD15C\uD50C\uB9BF\uC744 \uC785\uB825\uD558\uC138\uC694', color:'#0071E3',
    subject:'', grade:'', curriculum:'',
    depths: [{id:rootDepthId, name:'\uB2E8\uACC4 1', subName:'', groupCount:1, fields:[], children:[]}],
    attrs: [],
  });
  LT_STATE.editingId = newId;
  LT_STATE._activeGroup = newCode;
  LT_STATE.editTab = 'step1';
  renderLearningTypeView();
  toast('\uC2E0\uADDC \uD15C\uD50C\uB9BF \uC720\uD615\uC774 \uC0DD\uC131\uB418\uC5C8\uC2B5\uB2C8\uB2E4','t-ok');
}

// 기존 유형 그룹에 새 구조 추가 (좌측 "+ 구조 추가" 버튼)
function _ltAddStructure(typeCode) {
  // 해당 typeCode의 기존 구조들 참조하여 기본값 추출
  var existing = LT_STATE.types.filter(function(t){ return t.typeCode === typeCode; });
  var baseType = existing.length > 0 ? existing[0] : null;
  var labelInfo = (typeof CONTENT_TYPES !== 'undefined' && CONTENT_TYPES[typeCode]) ? CONTENT_TYPES[typeCode].label : typeCode;

  var newId = 'LT-' + typeCode + '-' + Date.now().toString(36);
  var rootDepthId = 'dn_' + Date.now();

  // 기존 구조의 depth 골격을 복제 (필드는 비우고 구조만)
  var clonedDepths;
  if(baseType && baseType.depths && baseType.depths.length > 0) {
    clonedDepths = _ltCloneDepthSkeleton(baseType.depths);
  } else {
    clonedDepths = [{id: rootDepthId, name:'\uB2E8\uACC4 1', subName:'', groupCount:1, fields:[], children:[]}];
  }

  LT_STATE.types.push({
    id: newId, name: labelInfo + ' (\uC2E0\uADDC)', typeCode: typeCode,
    desc: labelInfo + ' \uC720\uD615\uC758 \uC0C8 \uAD6C\uC870', color: baseType ? (baseType.color || '#0071E3') : '#0071E3',
    subject:'', grade:'', curriculum:'',
    depths: clonedDepths,
    attrs: baseType ? JSON.parse(JSON.stringify(baseType.attrs || [])) : [],
  });
  LT_STATE.editingId = newId;
  LT_STATE._activeGroup = typeCode;
  LT_STATE.editTab = 'step1';
  renderLearningTypeView();
  toast('\uC0C8 \uAD6C\uC870\uAC00 \uCD94\uAC00\uB418\uC5C8\uC2B5\uB2C8\uB2E4','t-ok');
}

// depth 골격 복제 (id 재생성, fields 비움)
function _ltCloneDepthSkeleton(nodes) {
  return nodes.map(function(n) {
    var newNode = {
      id: 'dn_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,6),
      name: n.name,
      subName: n.subName || '',
      groupCount: n.groupCount || 1,
      fields: [],
      children: n.children ? _ltCloneDepthSkeleton(n.children) : []
    };
    return newNode;
  });
}

// 유형 삭제 (사용 중 보호)
function _ltDeleteType(typeId) {
  // 사용 중 여부 확인
  var isInUse = false;
  Object.keys(REGISTERED_WORK_TYPES).forEach(function(k) {
    (REGISTERED_WORK_TYPES[k] || []).forEach(function(rt) {
      if(rt.ltTypeId === typeId) isInUse = true;
    });
  });
  if(isInUse) {
    toast('\uC0AC\uC6A9 \uC911\uC778 \uD15C\uD50C\uB9BF\uC740 \uC0AD\uC81C\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uBA3C\uC800 \uC791\uC5C5 \uC124\uC815\uC5D0\uC11C \uD574\uC81C\uD574 \uC8FC\uC138\uC694.','t-err');
    return;
  }
  if(!confirm('\uC774 \uAD6C\uC870\uB97C \uC0AD\uC81C\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?')) return;
  LT_STATE.types = LT_STATE.types.filter(function(t){ return t.id !== typeId; });
  if(LT_STATE.editingId === typeId) LT_STATE.editingId = null;
  renderLearningTypeView();
  toast('\uAD6C\uC870\uAC00 \uC0AD\uC81C\uB418\uC5C8\uC2B5\uB2C8\uB2E4','t-ok');
}

function _ltUpdateField(typeId, field, value) {
  var t = LT_STATE.types.find(function(t){ return t.id === typeId; });
  if(t) { t[field] = value; renderLearningTypeView(); }
}

function _ltToggleTargetSystem(typeId, sysKey) {
  var t = LT_STATE.types.find(function(t){ return t.id === typeId; });
  if(!t) return;
  if(!t.targetSystems) t.targetSystems = [];
  var idx = t.targetSystems.indexOf(sysKey);
  if(idx >= 0) {
    t.targetSystems.splice(idx, 1);
  } else {
    t.targetSystems.push(sysKey);
  }
  renderLearningTypeView();
}

function _ltAddAttr(typeId) {
  var t = LT_STATE.types.find(function(t){ return t.id === typeId; });
  if(!t) return;
  var key = 'field_' + Date.now();
  t.attrs.push({key:key, label:'새 속성', required:false, type:'text'});
  LT_STATE.editTab = 'attrs';
  renderLearningTypeView();
}

// ── DB 필드 카탈로그 팝업 ──
function _ltOpenFieldCatalog(typeId) {
  var t = LT_STATE.types.find(function(t){ return t.id === typeId; });
  if(!t) return;
  // 이미 추가된 필드 키 목록
  var usedKeys = t.attrs.map(function(a){ return a.key; });

  var overlay = document.createElement('div');
  overlay.id = 'lt-field-catalog-overlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(15,23,42,.45);z-index:9999;display:flex;align-items:center;justify-content:center;animation:fadeIn .15s';
  overlay.onclick = function(e) { if(e.target === overlay) document.body.removeChild(overlay); };

  var popup = document.createElement('div');
  popup.style.cssText = 'background:#fff;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.18);width:520px;max-height:80vh;display:flex;flex-direction:column;overflow:hidden';

  var h = '';
  h += '<div style="padding:18px 20px;border-bottom:1px solid #E5E5EA;display:flex;align-items:center;gap:10px">';
  h += '<svg viewBox="0 0 24 24" fill="none" stroke="#0071E3" stroke-width="2" style="width:20px;height:20px;flex-shrink:0"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>';
  h += '<div><div style="font-size:15px;font-weight:600;color:#1D1D1F">DB 필드 카탈로그</div>';
  h += '<div style="font-size:11px;color:#8E8E93">정의된 필드를 선택하여 속성에 추가합니다 · 목록에 없는 필드는 개발자 협의 후 추가</div></div>';
  h += '<div style="flex:1"></div>';
  h += '<button onclick="document.body.removeChild(document.getElementById(\'lt-field-catalog-overlay\'))" style="padding:4px 10px;border:1px solid #E5E5EA;border-radius:6px;background:#fff;color:#636366;font-size:18px;cursor:pointer;line-height:1">&times;</button>';
  h += '</div>';

  h += '<div style="flex:1;overflow-y:auto;padding:16px 20px">';

  // 카테고리별 그룹핑
  var categories = {};
  DB_FIELD_CATALOG.forEach(function(f) {
    if(!categories[f.category]) categories[f.category] = [];
    categories[f.category].push(f);
  });

  Object.keys(categories).forEach(function(cat) {
    h += '<div style="margin-bottom:14px">';
    h += '<div style="font-size:11px;font-weight:700;color:#636366;margin-bottom:6px;padding:4px 8px;background:#FAFAFA;border-radius:4px">' + cat + '</div>';

    categories[cat].forEach(function(f) {
      var isUsed = usedKeys.indexOf(f.key) >= 0;
      var typeIcon = f.type === 'file' ? '📎' : f.type === 'number' ? '#' : f.type === 'select' ? '▾' : '✎';
      h += '<div style="display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:8px;margin-bottom:3px;border:1px solid ' + (isUsed ? '#E5E5EA' : '#F5F5F7') + ';background:' + (isUsed ? '#FAFAFA' : '#fff') + ';opacity:' + (isUsed ? '.5' : '1') + ';transition:all .1s' + (isUsed ? '' : ';cursor:pointer') + '"' + (isUsed ? '' : ' onmouseenter="this.style.borderColor=\'#B3D7FF\';this.style.background=\'#E8F2FF\'" onmouseleave="this.style.borderColor=\'#F5F5F7\';this.style.background=\'#fff\'" onclick="_ltAddFromCatalog(\'' + typeId + '\',\'' + f.key + '\')"') + '>';
      h += '<span style="font-size:14px;width:22px;text-align:center;flex-shrink:0">' + typeIcon + '</span>';
      h += '<div style="flex:1;min-width:0">';
      h += '<div style="font-size:12px;font-weight:700;color:' + (isUsed ? '#8E8E93' : '#1D1D1F') + '">' + f.label + '</div>';
      h += '<div style="font-size:10px;color:#8E8E93;margin-top:1px">' + f.desc + '</div>';
      h += '</div>';
      h += '<span style="font-size:9px;padding:2px 6px;border-radius:3px;background:#F5F5F7;color:#636366;font-weight:600;flex-shrink:0">' + f.type + '</span>';
      if(isUsed) {
        h += '<span style="font-size:9px;padding:2px 6px;border-radius:3px;background:#E8F2FF;color:#0055B8;font-weight:600;flex-shrink:0">추가됨</span>';
      }
      h += '</div>';
    });
    h += '</div>';
  });

  h += '<div style="padding:12px;background:#FFF8F0;border-radius:8px;border:1px solid #FEF08A;margin-top:8px">';
  h += '<div style="font-size:11px;color:#B35C00;font-weight:600">필요한 필드가 없나요?</div>';
  h += '<div style="font-size:10px;color:#A16207;margin-top:2px">시스템 관리자 또는 개발자에게 신규 필드 추가를 요청하세요.</div>';
  h += '</div>';

  h += '</div>';
  popup.innerHTML = h;
  overlay.appendChild(popup);
  document.body.appendChild(overlay);
}

function _ltAddFromCatalog(typeId, fieldKey) {
  var t = LT_STATE.types.find(function(t){ return t.id === typeId; });
  if(!t) return;
  // 이미 추가된 필드인지 체크
  if(t.attrs.some(function(a){ return a.key === fieldKey; })) {
    toast('이미 추가된 필드입니다','t-warn');
    return;
  }
  var field = DB_FIELD_CATALOG.find(function(f){ return f.key === fieldKey; });
  if(!field) return;

  var newAttr = {key:field.key, label:field.label, required:false, type:field.type};
  if(field.options) newAttr.options = field.options.slice();
  t.attrs.push(newAttr);

  // 팝업 닫고 새로고침
  var ov = document.getElementById('lt-field-catalog-overlay');
  if(ov) document.body.removeChild(ov);
  LT_STATE.editTab = 'attrs';
  renderLearningTypeView();
  toast('"' + field.label + '" 필드가 추가되었습니다','t-ok');
}

function _ltUpdateAttrField(typeId, attrKey, field, value) {
  var t = LT_STATE.types.find(function(t){ return t.id === typeId; });
  if(!t) return;
  var a = t.attrs.find(function(a){ return a.key === attrKey; });
  if(a) { a[field] = value; }
}

function _ltToggleRequired(typeId, attrKey) {
  var t = LT_STATE.types.find(function(t){ return t.id === typeId; });
  if(t) {
    var a = t.attrs.find(function(a){ return a.key === attrKey; });
    if(a) { a.required = !a.required; renderLearningTypeView(); }
  }
}

function _ltRemoveAttr(typeId, attrKey) {
  var t = LT_STATE.types.find(function(t){ return t.id === typeId; });
  if(t) {
    t.attrs = t.attrs.filter(function(a){ return a.key !== attrKey; });
    renderLearningTypeView();
  }
}

// ═══════════════════════════════════════════════
//  ■ 콘텐츠 콘텐츠 묶음 관리 뷰
// ═══════════════════════════════════════════════
function renderBundleHubView() {
  const el = document.getElementById('bundleHubContent');
  if(!el) return;
  const S = BUNDLE_HUB_STATE;

  let bundles = [...CONTENT_BUNDLES];
  if(S.search) {
    const q = S.search.toLowerCase();
    bundles = bundles.filter(b => b.name.toLowerCase().includes(q) || b.masterSubjectName.toLowerCase().includes(q) || b.masterSubject.toLowerCase().includes(q));
  }
  if(S.filterStatus !== 'all') bundles = bundles.filter(b => b.status === S.filterStatus);
  if(S.filterSyncMode !== 'all') bundles = bundles.filter(b => b.syncMode === S.filterSyncMode);

  const totalBundles = CONTENT_BUNDLES.length;
  const activeBundles = CONTENT_BUNDLES.filter(b => b.status === 'active').length;
  const totalLinked = CONTENT_BUNDLES.reduce((a,b) => a + b.linkedSubjects.length, 0);
  const autoItems = STATE.workflowItems.filter(i => i.bundleRole === 'spoke').length;
  const totalSystems = new Set(CONTENT_BUNDLES.flatMap(b => b.linkedSystems || [])).size;

  el.innerHTML = '<div style="padding:20px;max-width:1200px;margin:0 auto">'
    + _bhBanner(totalBundles, totalLinked, autoItems, totalSystems)
    + _bhFilters(S)
    + '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:14px">'
    + (bundles.length === 0
        ? '<div style="text-align:center;padding:30px;color:var(--c-gray-400);font-size:12px;background:#fff;border:1px solid var(--c-gray-200);border-radius:10px;grid-column:1/-1">조건에 맞는 묶음이 없습니다</div>'
        : bundles.map(b => _bhCard(b, S)).join(''))
    + '</div>'
    + '</div>';
}

// ── 콘텐츠 묶음 관리 서브 렌더 함수들 (template literal 중첩 방지) ──

function _bhBanner(totalBundles, totalLinked, autoItems, totalSystems) {
  // 설정 완료된 메인코드 수
  var configuredMainCodes = Object.keys(REGISTERED_WORK_TYPES).filter(function(k) {
    return REGISTERED_WORK_TYPES[k] && REGISTERED_WORK_TYPES[k].length > 0;
  }).length;
  var totalSubjectCodes = Object.keys(SUBJECT_TYPE_MAP).length;
  var unbundledCodes = totalSubjectCodes - configuredMainCodes;

  return '<div style="display:flex;flex-direction:column;gap:12px;margin-bottom:16px;padding:16px 20px;background:#FFF8F0;border:1px solid #FFD9A8;border-radius:10px">'
    + '<div style="display:flex;align-items:center;gap:10px">'
    + '<span style="font-size:11px;padding:3px 10px;border-radius:5px;background:#FFF8F0;color:#B35C00;font-weight:600;border:1px solid #FFD9A8;font-family:monospace">MAIN</span>'
    + '<span style="color:#FF9500;font-weight:600">\u2501\u2501\u25B6</span>'
    + '<span style="font-size:11px;padding:3px 10px;border-radius:5px;background:#E8F2FF;color:#0055B8;font-weight:600;border:1px solid #B3D7FF;font-family:monospace">SUB \u00D7N</span>'
    + '<span style="font-size:12px;color:#78350F;font-weight:600;margin-left:8px">설정 완료된 메인코드에 미등록 코드를 묶어 운영</span>'
    + '</div>'
    + '<div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#78350F;padding:8px 12px;background:rgba(255,255,255,.5);border-radius:6px">'
    + '<svg viewBox="0 0 24 24" fill="none" stroke="#B35C00" stroke-width="2" style="width:14px;height:14px;flex-shrink:0"><path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
    + '<span><strong>' + configuredMainCodes + '</strong>개 메인코드 설정됨 · <strong>' + unbundledCodes + '</strong>개 미등록 코드 묶음 대상</span>'
    + '</div>'
    + '<div style="display:flex;gap:14px">'
    + '<div style="text-align:center"><span style="font-size:18px;font-weight:600;color:#FF9500">' + totalBundles + '</span><div style="font-size:9px;color:#B35C00">\uBB36\uC74C</div></div>'
    + '<div style="text-align:center"><span style="font-size:18px;font-weight:600;color:#0071E3">' + totalLinked + '</span><div style="font-size:9px;color:#0055B8">\uC5F0\uACB0</div></div>'
    + '<div style="text-align:center"><span style="font-size:18px;font-weight:600;color:#AF52DE">' + autoItems + '</span><div style="font-size:9px;color:#8944AB">\uC790\uB3D9\uC0DD\uC131</div></div>'
    + '<div style="text-align:center"><span style="font-size:18px;font-weight:600;color:#34C759">' + totalSystems + '</span><div style="font-size:9px;color:#1B8A3E">\uC5F0\uACC4</div></div>'
    + '</div></div>';
}

function _bhFilters(S) {
  var h = '<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;flex-wrap:wrap">';
  h += '<input type="text" placeholder="\uD83D\uDD0D \uACFC\uBAA9\uCF54\uB4DC\u00B7\uC774\uB984 \uAC80\uC0C9" value="' + S.search + '" oninput="BUNDLE_HUB_STATE.search=this.value;renderBundleHubView()" style="flex:1;min-width:160px;padding:6px 10px;border:1px solid var(--c-gray-200);border-radius:6px;font-size:11px;outline:none">';
  h += '<select onchange="BUNDLE_HUB_STATE.filterStatus=this.value;renderBundleHubView()" style="padding:5px 8px;border:1px solid var(--c-gray-200);border-radius:6px;font-size:10px;outline:none;cursor:pointer">';
  h += '<option value="all"' + (S.filterStatus==='all'?' selected':'') + '>\uC804\uCCB4</option>';
  h += '<option value="active"' + (S.filterStatus==='active'?' selected':'') + '>\uD65C\uC131</option>';
  h += '<option value="paused"' + (S.filterStatus==='paused'?' selected':'') + '>\uC815\uC9C0</option></select>';
  h += '<select onchange="BUNDLE_HUB_STATE.filterSyncMode=this.value;renderBundleHubView()" style="padding:5px 8px;border:1px solid var(--c-gray-200);border-radius:6px;font-size:10px;outline:none;cursor:pointer">';
  h += '<option value="all"' + (S.filterSyncMode==='all'?' selected':'') + '>\uBAA8\uB4E0 \uBAA8\uB4DC</option>';
  h += '<option value="full"' + (S.filterSyncMode==='full'?' selected':'') + '>\uC644\uC804\uB3D9\uAE30\uD654</option>';
  h += '<option value="override"' + (S.filterSyncMode==='override'?' selected':'') + '>\uAC1C\uBCC4\uC218\uC815</option></select>';
  h += '<button onclick="bundleOpenCreate()" style="padding:6px 14px;border:none;border-radius:6px;background:#FF9500;color:#fff;font-size:11px;font-weight:500;cursor:pointer">\uFF0B \uC0C8 \uBB36\uC74C</button>';
  h += '</div>';
  return h;
}

function _bhCard(b, S) {
  var typeInfo = getTypeInfo(b.typeCode);
  var wfItems = STATE.workflowItems.filter(function(i){ return i.bundleId === b.id; });
  var hubCnt = wfItems.filter(function(i){ return i.bundleRole==='hub'; }).length;
  var spokeCnt = wfItems.filter(function(i){ return i.bundleRole==='spoke'; }).length;
  var isExpanded = S.expandedBundleId === b.id;
  var isPaused = b.status === 'paused';
  var isEditingSys = S.editingSystemsId === b.id;
  var systems = b.linkedSystems || [];

  // border color similar to kanban cards
  var borderColor = '#FFD9A8';
  var borderLeft = '#FF9500';

  var h = '<div style="background:#fff;border:1px solid ' + (isExpanded ? '#FF9500' : 'var(--c-gray-200)') + ';border-radius:10px;border-left:3px solid ' + borderLeft + ';transition:all .15s;overflow:hidden'
    + (isPaused ? ';opacity:.55' : '')
    + (isExpanded ? ';box-shadow:0 2px 12px rgba(245,158,11,.1)' : '')
    + '" onmouseenter="this.style.boxShadow=\'0 2px 8px rgba(0,0,0,.07)\'" onmouseleave="this.style.boxShadow=\'' + (isExpanded?'0 2px 12px rgba(245,158,11,.1)':'') + '\'">';

  // ── 카드 상단: 과정명 + 과목코드 배지 ──
  h += '<div style="padding:10px 12px 0;cursor:pointer" onclick="BUNDLE_HUB_STATE.expandedBundleId=BUNDLE_HUB_STATE.expandedBundleId===\'' + b.id + '\'?null:\'' + b.id + '\';renderBundleHubView()">';

  // ① 묶음명 + 유형배지 + 상태
  h += '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:6px;margin-bottom:7px">';
  h += '<div style="font-size:12px;font-weight:600;color:#202124;line-height:1.4;min-width:0">' + b.name + '</div>';
  h += '<div style="display:flex;gap:4px;flex-shrink:0;align-items:center">';
  h += '<span style="font-size:9px;padding:2px 8px;border-radius:4px;background:' + typeInfo.bg + ';color:' + typeInfo.color + ';font-weight:700;border:1px solid ' + (typeInfo.border||typeInfo.bg) + '">' + typeInfo.icon + ' ' + typeInfo.label + '</span>';
  h += '<span style="font-size:8px;padding:2px 6px;border-radius:4px;background:' + (b.syncMode==='full'?'#E8F2FF':'#FFF8F0') + ';color:' + (b.syncMode==='full'?'#0055B8':'#B35C00') + ';font-weight:700">' + (b.syncMode==='full'?'\uD83D\uDD12\uB3D9\uAE30\uD654':'\u270F\uAC1C\uBCC4') + '</span>';
  if(isPaused) h += '<span style="font-size:8px;padding:2px 6px;border-radius:4px;background:#FFF2F1;color:#FF3B30;font-weight:700">\u23F8\uC815\uC9C0</span>';
  h += '</div></div>';

  // ② 연결과목 (Hub→Spoke 매핑) — 칸반 카드와 동일 패턴
  h += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:7px;padding:6px 8px;background:#FAFAFA;border:1px solid #E5E5EA;border-radius:6px">';
  h += '<div style="display:flex;flex-direction:column;gap:2px;flex-shrink:0;align-items:center">';
  h += '<span style="font-size:11px;padding:2px 8px;border-radius:4px;background:var(--c-primary);color:#fff;font-weight:600;font-family:\'SF Mono\',Menlo,monospace;letter-spacing:.06em">' + b.masterSubject + '</span>';
  h += '<span style="font-size:7px;font-weight:600;color:var(--c-primary)">Main</span>';
  h += '</div>';
  h += '<div style="flex:1;display:flex;align-items:center;gap:0;min-width:24px">';
  h += '<div style="flex:1;height:1px;background:var(--c-gray-300)"></div>';
  h += '<span style="font-size:9px;color:#FF9500;font-weight:600;padding:0 2px">\u25B6</span>';
  h += '</div>';
  h += '<div style="display:flex;gap:3px;flex-wrap:wrap">';
  b.linkedSubjects.forEach(function(lc){
    var sn = _SUBJECT_NAME_MAP[lc] || lc;
    h += '<span style="font-size:9px;padding:2px 7px;border-radius:4px;background:#2C2C2E;color:#fff;font-weight:700;font-family:\'SF Mono\',Menlo,monospace" title="' + sn + '">' + lc + '</span>';
  });
  h += '</div></div>';

  // ③ 커리큘럼 연계 시스템 — 선택·편집 가능
  h += '<div style="margin-bottom:7px">';
  h += '<div style="font-size:9px;color:var(--c-gray-500);font-weight:600;margin-bottom:4px;display:flex;align-items:center;gap:6px">';
  h += '\uCEE4\uB9AC\uD058\uB7FC \uC5F0\uACC4 \uC2DC\uC2A4\uD15C :';
  h += '<button onclick="event.stopPropagation();_bhToggleSysEdit(\'' + b.id + '\')" style="font-size:8px;padding:1px 6px;border-radius:3px;border:1px solid ' + (isEditingSys?'#FF9500':'var(--c-gray-200)') + ';background:' + (isEditingSys?'#FFF8F0':'#fff') + ';color:' + (isEditingSys?'#B35C00':'var(--c-gray-500)') + ';cursor:pointer;font-weight:600">' + (isEditingSys?'\u2714 \uC644\uB8CC':'\u270F \uD3B8\uC9D1') + '</button>';
  h += '</div>';

  if(isEditingSys) {
    // 편집 모드: 전체 시스템 목록을 체크박스로 표시
    h += '<div style="display:flex;gap:4px;flex-wrap:wrap;padding:6px 8px;background:#FFF8F0;border:1px solid #FFD9A8;border-radius:6px">';
    AVAILABLE_SYSTEMS.forEach(function(sys){
      var isOn = systems.indexOf(sys) >= 0;
      h += '<label style="display:flex;align-items:center;gap:3px;font-size:9px;padding:3px 8px;border-radius:4px;background:' + (isOn?'#F0FFF4':'#F5F5F7') + ';border:1px solid ' + (isOn?'#6EE7B7':'var(--c-gray-200)') + ';cursor:pointer;font-weight:' + (isOn?'700':'500') + ';color:' + (isOn?'#1B8A3E':'var(--c-gray-500)') + '">';
      h += '<input type="checkbox" ' + (isOn?'checked':'') + ' onchange="event.stopPropagation();_bhToggleSystem(\'' + b.id + '\',\'' + sys + '\')" style="margin:0;width:12px;height:12px;accent-color:#34C759">';
      h += sys + '</label>';
    });
    h += '</div>';
  } else {
    // 읽기 모드
    if(systems.length > 0) {
      h += '<div style="display:flex;gap:4px;flex-wrap:wrap">';
      systems.forEach(function(sys){
        h += '<span style="font-size:9px;padding:2px 8px;border-radius:4px;background:#E8F5E9;color:#2E7D32;font-weight:600;border:1px solid #A5D6A7">' + sys + '</span>';
      });
      h += '</div>';
    } else {
      h += '<span style="font-size:9px;color:#FF9500;font-weight:600">\u26A0 \uC5F0\uACC4 \uC2DC\uC2A4\uD15C \uBBF8\uC124\uC815</span>';
    }
  }
  h += '</div>';

  // ④ 진행률 & 통계
  var totalWf = wfItems.length;
  var doneWf = wfItems.filter(function(i){ return i.phase==='deploy'; }).length;
  var pctWf = totalWf > 0 ? Math.round(doneWf / totalWf * 100) : 0;
  var prgColor = pctWf === 100 ? '#34C759' : pctWf > 0 ? '#FF9500' : '#E5E5EA';

  h += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">';
  h += '<div style="flex:1;height:3px;border-radius:2px;background:#F5F5F7;overflow:hidden">';
  h += '<div style="height:100%;width:' + pctWf + '%;background:' + prgColor + ';border-radius:2px;transition:width .3s"></div></div>';
  h += '<span style="font-size:8px;font-weight:700;color:' + (prgColor==='#E5E5EA'?'var(--c-gray-400)':prgColor) + ';min-width:28px;text-align:right">' + pctWf + '%</span>';
  h += '<span style="font-size:8px;padding:1px 5px;border-radius:4px;background:#FFF8F0;color:#B35C00;font-weight:700;border:1px solid #FFD9A8">M' + hubCnt + ' \u00B7 S' + spokeCnt + '</span>';
  h += '</div>';

  // ⑤ 하단: 담당자 + 액션
  h += '<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0 8px;border-top:1px solid #F1F3F4">';
  h += '<span style="font-size:9px;color:var(--c-gray-400)">' + b.createdAt + ' \u00B7 ' + b.createdBy + '</span>';
  h += '<div style="display:flex;gap:4px;align-items:center">';
  h += '<button onclick="event.stopPropagation();bundleToggleStatus(\'' + b.id + '\')" style="font-size:8px;padding:2px 8px;border-radius:4px;border:1px solid ' + (isPaused?'#6EE7B7':'#FFB3AE') + ';background:' + (isPaused?'#F0FFF4':'#FFF2F1') + ';color:' + (isPaused?'#34C759':'#FF3B30') + ';font-weight:700;cursor:pointer">' + (isPaused?'\u25B6 \uD65C\uC131\uD654':'\u23F8 \uC815\uC9C0') + '</button>';
  h += '<button onclick="event.stopPropagation();bundleToggleSync(\'' + b.id + '\')" style="font-size:8px;padding:2px 8px;border-radius:4px;border:1px solid #B3D7FF;background:#E8F2FF;color:#0071E3;font-weight:700;cursor:pointer">' + (b.syncMode==='full'?'\u2192 \uAC1C\uBCC4\uC218\uC815':'\u2192 \uB3D9\uAE30\uD654') + '</button>';
  h += '<span style="font-size:12px;color:var(--c-gray-300);transform:rotate(' + (isExpanded?180:0) + 'deg);transition:transform .2s;display:inline-block">\u25BE</span>';
  h += '</div></div>';

  h += '</div>'; // end card upper area

  // ⑥ 확장 영역: 칸반 아이템 상세
  if(isExpanded) {
    h += '<div style="padding:10px 12px;background:var(--c-gray-50);border-top:1px solid var(--c-gray-100)">';
    h += '<div style="font-size:10px;font-weight:600;color:var(--c-gray-600);margin-bottom:8px;display:flex;align-items:center;gap:6px">';
    h += '\uD83D\uDCCB \uCE78\uBC18 \uC544\uC774\uD15C ' + totalWf + '\uAC74';
    h += '<span style="font-size:9px;color:var(--c-gray-400);flex:1;font-weight:400">' + b.description + '</span>';
    h += '</div>';
    if(totalWf === 0) {
      h += '<div style="text-align:center;padding:14px;color:var(--c-gray-400);font-size:11px">\uCE78\uBC18\uC5D0\uC11C \uC791\uC5C5 \uB4F1\uB85D \uC2DC \uC790\uB3D9\uC73C\uB85C \uBB36\uC74C \uC801\uC6A9</div>';
    } else {
      h += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:5px">';
      wfItems.forEach(function(wi){
        var wP = WF_PHASES.find(function(p){ return p.id===wi.phase; }) || WF_PHASES[0];
        var isH = wi.bundleRole==='hub';
        h += '<div style="background:#fff;border:1px solid var(--c-gray-200);border-radius:6px;padding:6px 8px;border-left:3px solid ' + (isH?'var(--c-primary)':'#636366') + '">';
        h += '<div style="display:flex;align-items:center;gap:4px">';
        h += '<span style="font-size:7px;padding:1px 4px;border-radius:2px;background:' + (isH?'var(--c-primary-l)':'#F5F5F7') + ';color:' + (isH?'var(--c-primary)':'#48484A') + ';font-weight:600;font-family:monospace">' + (isH?'MAIN':'SUB') + '</span>';
        h += '<span style="font-size:9px;font-weight:700;color:var(--c-gray-700);flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + wi.title + '</span>';
        h += '<span style="font-size:7px;padding:1px 5px;border-radius:3px;background:' + wP.bg + ';color:' + wP.color + ';font-weight:700">' + wP.label + '</span>';
        h += '</div></div>';
      });
      h += '</div>';
    }
    h += '</div>';
  }

  h += '</div>'; // end card root
  return h;
}

// 연계 시스템 편집 모드 토글
function _bhToggleSysEdit(bundleId) {
  if(BUNDLE_HUB_STATE.editingSystemsId === bundleId) {
    BUNDLE_HUB_STATE.editingSystemsId = null;
  } else {
    BUNDLE_HUB_STATE.editingSystemsId = bundleId;
    // 편집 시 해당 카드는 자동 확장
    BUNDLE_HUB_STATE.expandedBundleId = bundleId;
  }
  renderBundleHubView();
}

// 연계 시스템 토글 (개별 체크박스)
function _bhToggleSystem(bundleId, systemName) {
  var b = CONTENT_BUNDLES.find(function(x){ return x.id === bundleId; });
  if(!b) return;
  if(!b.linkedSystems) b.linkedSystems = [];
  var idx = b.linkedSystems.indexOf(systemName);
  if(idx >= 0) {
    b.linkedSystems.splice(idx, 1);
    toast('\uD83D\uDD17 "' + b.name + '" \u2190 ' + systemName + ' \uC5F0\uACB0 \uD574\uC81C', 't-info');
  } else {
    b.linkedSystems.push(systemName);
    toast('\uD83D\uDD17 "' + b.name + '" \u2192 ' + systemName + ' \uC5F0\uACB0', 't-ok');
  }
  renderBundleHubView();
}

// 묶음 상태 토글
function bundleToggleStatus(bundleId) {
  const b = CONTENT_BUNDLES.find(x => x.id === bundleId);
  if(!b) return;
  b.status = b.status === 'active' ? 'paused' : 'active';
  toast(`📦 "${b.name}" ${b.status==='active'?'활성화':'일시정지'}됨`, 't-ok');
  renderBundleHubView();
}

// 동기화 모드 토글
function bundleToggleSync(bundleId) {
  const b = CONTENT_BUNDLES.find(x => x.id === bundleId);
  if(!b) return;
  b.syncMode = b.syncMode === 'full' ? 'override' : 'full';
  toast(`📦 "${b.name}" → ${b.syncMode==='full'?'완전동기화':'개별수정 허용'} 모드`, 't-ok');
  renderBundleHubView();
}

// AI 추천에서 빠르게 묶음 생성
function bundleQuickCreate(masterCode, typeCode, linkedCodesStr) {
  const masterName = SUBJECT_TYPE_MAP[masterCode]?.name || masterCode;
  const typeLabel = getTypeLabel(typeCode);
  const linkedCodes = linkedCodesStr.split(',');
  const newId = 'bnd' + (Date.now()).toString(36);
  CONTENT_BUNDLES.push({
    id: newId,
    name: `${masterName} ${typeLabel} 묶음`,
    masterSubject: masterCode,
    masterSubjectName: masterName,
    typeCode: typeCode,
    typeName: typeLabel,
    linkedSubjects: linkedCodes,
    linkedSystems: ['뉴드림스'],  // 기본 시스템
    syncMode: 'full',
    status: 'active',
    createdAt: new Date().toISOString().slice(0,10),
    createdBy: '관리자',
    description: `[${masterName}] ${masterCode} ${typeLabel} → ${linkedCodes.map(c=>(_SUBJECT_NAME_MAP[c]||c)).join('·')} 자동 적용`
  });
  toast(`📦 새 묶음 생성: [${masterName}] ${masterCode} ${typeLabel}`, 't-ok');
  BUNDLE_HUB_STATE.expandedBundleId = newId;
  renderBundleHubView();
}

// 새 묶음 만들기 모달
function bundleOpenCreate() {
  const subjectKeys = Object.keys(SUBJECT_TYPE_MAP);
  showConfirm(
    '📦 새 콘텐츠 묶음 만들기',
    `<div style="font-size:12px;color:var(--c-gray-600);margin-bottom:14px">
      Main Code에서 등록한 콘텐츠가 Sub Code에 자동으로 적용됩니다.
    </div>
    <div style="display:flex;flex-direction:column;gap:10px">
      <div>
        <div style="font-size:10px;font-weight:600;color:var(--c-gray-500);margin-bottom:3px">묶음 이름 *</div>
        <input id="bndName" type="text" placeholder="예: 수학 계열 채점 묶음" style="width:100%;padding:6px 8px;border:1px solid var(--c-gray-200);border-radius:6px;font-size:11px;outline:none;box-sizing:border-box">
      </div>
      <div style="display:flex;gap:8px">
        <div style="flex:1">
          <div style="font-size:10px;font-weight:600;color:var(--c-gray-500);margin-bottom:3px">Main Code *</div>
          <select id="bndMaster" style="width:100%;padding:6px 8px;border:1px solid var(--c-gray-200);border-radius:6px;font-size:11px;outline:none" onchange="bndUpdateLinked()">
            <option value="">선택</option>
            ${subjectKeys.map(sk => `<option value="${sk}">${SUBJECT_TYPE_MAP[sk].name} (${sk})</option>`).join('')}
          </select>
        </div>
        <div style="flex:1">
          <div style="font-size:10px;font-weight:600;color:var(--c-gray-500);margin-bottom:3px">콘텐츠 템플릿 *</div>
          <select id="bndType" style="width:100%;padding:6px 8px;border:1px solid var(--c-gray-200);border-radius:6px;font-size:11px;outline:none">
            <option value="">유형 선택</option>
            ${Object.values(CONTENT_TYPES).map(t => `<option value="${t.code}">${t.icon} ${t.label} [${t.code}]</option>`).join('')}
          </select>
        </div>
      </div>
      <div>
        <div style="font-size:10px;font-weight:600;color:var(--c-gray-500);margin-bottom:3px">Sub Code — 체크하세요</div>
        <div id="bndLinkedList" style="display:flex;flex-wrap:wrap;gap:6px;padding:8px;background:var(--c-gray-50);border-radius:8px;border:1px solid var(--c-gray-200);min-height:36px">
          <span style="font-size:11px;color:var(--c-gray-400)">먼저 대표 과목을 선택하면 children 과목이 자동 표시됩니다</span>
        </div>
      </div>
      <div>
        <div style="font-size:10px;font-weight:600;color:var(--c-gray-500);margin-bottom:3px">동기화 모드</div>
        <select id="bndSync" style="width:100%;padding:6px 8px;border:1px solid var(--c-gray-200);border-radius:6px;font-size:11px;outline:none">
          <option value="full">🔒 완전 동기화 — Main 변경 시 Sub도 자동 반영</option>
          <option value="override">✏ 개별 수정 허용 — Sub에서 내용 수정 가능</option>
        </select>
      </div>
      <div>
        <div style="font-size:10px;font-weight:600;color:var(--c-gray-500);margin-bottom:3px">커리큘럼 연계 시스템</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;padding:8px;background:var(--c-gray-50);border-radius:8px;border:1px solid var(--c-gray-200)">
          ${AVAILABLE_SYSTEMS.map(sys => `<label style="display:flex;align-items:center;gap:3px;font-size:10px;padding:3px 8px;border-radius:4px;background:#E8F5E9;border:1px solid #A5D6A7;cursor:pointer">
            <input type="checkbox" class="bnd-sys-cb" value="${sys}" checked style="margin:0;width:12px;height:12px;accent-color:#34C759">
            <span style="font-weight:600;color:#2E7D32">${sys}</span>
          </label>`).join('')}
        </div>
      </div>
      <div>
        <div style="font-size:10px;font-weight:600;color:var(--c-gray-500);margin-bottom:3px">설명</div>
        <input id="bndDesc" type="text" placeholder="이 묶음의 목적을 간략히 입력" style="width:100%;padding:6px 8px;border:1px solid var(--c-gray-200);border-radius:6px;font-size:11px;outline:none;box-sizing:border-box">
      </div>
    </div>`,
    () => { bundleSubmitCreate(); },
    '📦 묶음 생성',
    '취소'
  );
}

function bndUpdateLinked() {
  const masterCode = document.getElementById('bndMaster')?.value;
  const container = document.getElementById('bndLinkedList');
  if(!container || !masterCode) return;
  const master = SUBJECT_TYPE_MAP[masterCode];
  if(!master) { container.innerHTML = '<span style="font-size:11px;color:var(--c-gray-400)">해당 과목에 children이 없습니다. 아래 전체 과목에서 수동 선택하세요.</span>'; return; }
  const allSubjects = Object.entries(SUBJECT_TYPE_MAP).filter(([k]) => k !== masterCode);
  const childrenSet = new Set(master.children || []);
  container.innerHTML = allSubjects.map(([code, info]) => {
    const isChild = childrenSet.has(code);
    return `<label style="display:flex;align-items:center;gap:4px;font-size:10px;padding:3px 8px;border-radius:4px;background:${isChild?'#FFF8F0':'var(--c-gray-50)'};border:1px solid ${isChild?'#FFD9A8':'var(--c-gray-200)'};cursor:pointer">
      <input type="checkbox" class="bnd-linked-cb" value="${code}" ${isChild?'checked':''} style="margin:0">
      <span style="font-weight:${isChild?'700':'400'};color:${isChild?'#B35C00':'var(--c-gray-600)'}">${info.name} <strong style="font-family:monospace">(${code})</strong></span>
    </label>`;
  }).join('');
}

function bundleSubmitCreate() {
  const name = document.getElementById('bndName')?.value?.trim();
  const masterCode = document.getElementById('bndMaster')?.value;
  const typeCode = document.getElementById('bndType')?.value;
  const syncMode = document.getElementById('bndSync')?.value || 'full';
  const desc = document.getElementById('bndDesc')?.value?.trim() || '';
  if(!name || !masterCode || !typeCode) { toast('묶음 이름, 대표 과목, 콘텐츠 템플릿은 필수입니다', 't-warn'); return; }
  const linkedCodes = [...document.querySelectorAll('.bnd-linked-cb:checked')].map(cb => cb.value);
  if(linkedCodes.length === 0) { toast('연결 과목을 최소 1개 선택하세요', 't-warn'); return; }
  const linkedSystems = [...document.querySelectorAll('.bnd-sys-cb:checked')].map(cb => cb.value);
  const masterName = SUBJECT_TYPE_MAP[masterCode]?.name || masterCode;
  const newId = 'bnd' + (Date.now()).toString(36);
  CONTENT_BUNDLES.push({
    id: newId, name, masterSubject: masterCode, masterSubjectName: masterName,
    typeCode, typeName: getTypeLabel(typeCode), linkedSubjects: linkedCodes,
    linkedSystems: linkedSystems,
    syncMode, status: 'active',
    createdAt: new Date().toISOString().slice(0,10), createdBy: '관리자',
    description: desc || `[${masterName}] ${masterCode} ${getTypeLabel(typeCode)} → ${linkedCodes.map(c=>'['+(_SUBJECT_NAME_MAP[c]||c)+'] '+c).join(' · ')} 자동 적용`
  });
  toast(`📦 새 묶음 생성 완료: ${name}`, 't-ok');
  BUNDLE_HUB_STATE.expandedBundleId = newId;
  renderBundleHubView();
}

// ═══ Type Mapping (TM_STATE + view) (원본 라인 14783~14956) ═══
const TM_STATE = { search:'', filterType:'all', expandedCard:null };

function tmToggleType(subjectCode, typeCode) {
  const s = SUBJECT_TYPE_MAP[subjectCode];
  if(!s) return;
  const idx = s.types.indexOf(typeCode);
  if(idx >= 0) s.types.splice(idx, 1);
  else s.types.push(typeCode);
  renderTypeMappingView();
  toast(idx >= 0 ? `${typeCode} 템플릿 제거됨` : `${typeCode} 템플릿 추가됨`, idx >= 0 ? 't-warn' : 't-ok', 1200);
}

function tmSetSearch(val) { TM_STATE.search = val.toLowerCase(); renderTypeMappingView(); }
function tmSetFilterType(val) { TM_STATE.filterType = val; renderTypeMappingView(); }
function tmExpandCard(sk) {
  TM_STATE.expandedCard = TM_STATE.expandedCard === sk ? null : sk;
  renderTypeMappingView();
}

function renderTypeMappingView() {
  const wrap = document.getElementById('typeMappingContent');
  if(!wrap) return;

  const typeKeys = Object.keys(CONTENT_TYPES);
  const subjectKeys = Object.keys(SUBJECT_TYPE_MAP);
  const totalMappings = subjectKeys.reduce((a,k)=>a+SUBJECT_TYPE_MAP[k].types.length,0);

  // 유형을 그룹별로 정리
  const typeGroups = {};
  typeKeys.forEach(k => { const g = CONTENT_TYPES[k].group; if(!typeGroups[g]) typeGroups[g] = []; typeGroups[g].push(k); });
  const groupNames = Object.keys(typeGroups);

  // 필터링
  let filtered = subjectKeys;
  if(TM_STATE.search) {
    filtered = filtered.filter(sk => {
      const s = SUBJECT_TYPE_MAP[sk];
      return sk.toLowerCase().includes(TM_STATE.search) || s.name.toLowerCase().includes(TM_STATE.search) || s.children.some(c => c.toLowerCase().includes(TM_STATE.search));
    });
  }
  if(TM_STATE.filterType !== 'all') {
    filtered = filtered.filter(sk => SUBJECT_TYPE_MAP[sk].types.includes(TM_STATE.filterType));
  }

  wrap.innerHTML = `
  <div style="display:flex;flex-direction:column;height:100%;overflow:hidden">
    <!-- ─── 상단 요약 + 검색/필터 바 ─── -->
    <div style="flex-shrink:0;padding:16px 20px;border-bottom:1px solid var(--c-gray-200);background:#fff">
      <!-- 요약 칩 -->
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap">
        <span style="font-size:11px;font-weight:700;padding:4px 12px;border-radius:8px;background:#E8F2FF;color:#0071E3;border:1px solid #B3D7FF">${typeKeys.length}종 유형</span>
        <span style="font-size:11px;font-weight:700;padding:4px 12px;border-radius:8px;background:#F0FFF4;color:#34C759;border:1px solid #A8E6B8">${subjectKeys.length}개 과목</span>
        <span style="font-size:11px;font-weight:700;padding:4px 12px;border-radius:8px;background:#FFF8F0;color:#FF9500;border:1px solid #FFD9A8">${totalMappings}건 연결</span>
        ${filtered.length !== subjectKeys.length ? `<span style="font-size:11px;font-weight:700;padding:4px 12px;border-radius:8px;background:#FFF2F1;color:#FF3B30;border:1px solid #FFB3AE">${filtered.length}건 표시 중</span>` : ''}
      </div>
      <!-- 검색 + 유형 필터 -->
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;row-gap:8px">
        <div style="flex:1;min-width:200px;position:relative">
          <input type="text" placeholder="과목명 또는 코드로 검색..." value="${TM_STATE.search}"
                 oninput="tmSetSearch(this.value)"
                 style="width:100%;padding:7px 12px 7px 32px;border:1px solid var(--c-gray-200);border-radius:8px;font-size:12px;outline:none;background:#fff;color:var(--c-gray-700);box-sizing:border-box">
          <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:13px;color:var(--c-gray-400)">🔍</span>
        </div>
        <div style="display:flex;align-items:center;gap:6px">
          <span style="font-size:10px;font-weight:700;color:var(--c-gray-400)">유형 필터</span>
          <select onchange="tmSetFilterType(this.value)" style="padding:6px 10px;border:1px solid var(--c-gray-200);border-radius:8px;font-size:11px;outline:none;background:#fff;cursor:pointer;color:var(--c-gray-700)">
            <option value="all" ${TM_STATE.filterType==='all'?'selected':''}>전체 유형</option>
            ${groupNames.map(g => `<optgroup label="${g}">${typeGroups[g].map(t => {
              const info = CONTENT_TYPES[t];
              return `<option value="${t}" ${TM_STATE.filterType===t?'selected':''}>${info.icon} ${info.label} [${t}]</option>`;
            }).join('')}</optgroup>`).join('')}
          </select>
        </div>
        ${(TM_STATE.search || TM_STATE.filterType !== 'all') ? `
        <button onclick="TM_STATE.search='';TM_STATE.filterType='all';renderTypeMappingView()"
                style="font-size:10px;padding:5px 12px;border-radius:8px;border:1px solid var(--c-primary-b);background:var(--c-primary-l);color:var(--c-primary);font-weight:700;cursor:pointer">초기화</button>` : ''}
      </div>
    </div>

    <!-- ─── 과목 카드 그리드 ─── -->
    <div style="flex:1;overflow-y:auto;padding:16px 20px">
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:12px">
        ${filtered.map(sk => {
          const s = SUBJECT_TYPE_MAP[sk];
          const isExpanded = TM_STATE.expandedCard === sk;
          const activeTypes = s.types;
          const inactiveTypes = typeKeys.filter(t => !s.types.includes(t));

          return `
          <div style="background:#fff;border:1px solid ${isExpanded?'var(--c-primary)':'var(--c-gray-200)'};border-radius:12px;overflow:hidden;transition:all .2s;${isExpanded?'box-shadow:0 4px 16px rgba(79,70,229,.12)':''}">
            <!-- 카드 헤더 -->
            <div style="padding:12px 16px;display:flex;align-items:center;gap:10px;cursor:pointer;border-bottom:1px solid ${isExpanded?'var(--c-primary-b)':'var(--c-gray-100)'};background:${isExpanded?'var(--c-primary-l)':'#FAFAFA'}"
                 onclick="tmExpandCard('${sk}')">
              <div style="width:38px;height:38px;border-radius:10px;background:var(--c-primary);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;font-family:monospace;flex-shrink:0">${sk}</div>
              <div style="flex:1;min-width:0">
                <div style="display:flex;align-items:center;gap:6px">
                  <span style="font-size:12px;font-weight:600;color:var(--c-gray-500)">${s.name}</span>
                  <span style="font-size:14px;font-weight:900;color:var(--c-primary);font-family:'SF Mono',Menlo,monospace;letter-spacing:.04em">${sk}</span>
                </div>
                <div style="font-size:10px;color:var(--c-gray-400);margin-top:1px">
                  ${s.children.length > 0 ? `하위: ${s.children.map(c=>{const cn=_SUBJECT_NAME_MAP[c]||c;return '<span style="color:var(--c-gray-400)">['+cn+']</span> <strong style="color:#0071E3;font-family:monospace">'+c+'</strong>';}).join(' · ')}` : '단독 과목'}
                  · <strong style="color:var(--c-primary)">${activeTypes.length}</strong>개 유형
                </div>
              </div>
              <span style="font-size:16px;color:var(--c-gray-400);transition:transform .2s;transform:rotate(${isExpanded?'180':'0'}deg)">▾</span>
            </div>

            <!-- 사용 중인 유형 태그 (항상 표시) -->
            <div style="padding:10px 16px ${isExpanded?'4px':'10px'}">
              <div style="display:flex;flex-wrap:wrap;gap:4px">
                ${activeTypes.map(t => {
                  const info = CONTENT_TYPES[t];
                  return `<span style="font-size:10px;font-weight:700;padding:3px 8px;border-radius:6px;background:${info.bg};color:${info.color};border:1px solid ${info.color}30;display:inline-flex;align-items:center;gap:3px;cursor:${isExpanded?'pointer':'default'};transition:all .15s${isExpanded?';position:relative':''}"
                    ${isExpanded ? `onclick="event.stopPropagation();tmToggleType('${sk}','${t}')" onmouseenter="this.style.opacity='0.7';this.style.textDecoration='line-through'" onmouseleave="this.style.opacity='1';this.style.textDecoration='none'" title="${info.label} — 클릭하면 제거"` : `title="${info.label}"`}
                    >${info.icon} ${t}</span>`;
                }).join('')}
                ${activeTypes.length === 0 ? `<span style="font-size:10px;color:var(--c-gray-300);font-style:italic">등록된 유형 없음</span>` : ''}
              </div>
            </div>

            <!-- 확장 영역: 추가 가능한 템플릿 -->
            ${isExpanded ? `
            <div style="padding:4px 16px 14px;border-top:1px dashed var(--c-gray-200);margin-top:4px">
              <div style="font-size:9px;font-weight:700;color:var(--c-gray-400);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px;margin-top:8px">+ 템플릿 추가 (클릭)</div>
              <div style="display:flex;flex-wrap:wrap;gap:4px">
                ${inactiveTypes.length > 0 ? inactiveTypes.map(t => {
                  const info = CONTENT_TYPES[t];
                  return `<span style="font-size:10px;font-weight:600;padding:3px 8px;border-radius:6px;background:var(--c-gray-50);color:var(--c-gray-400);border:1px dashed var(--c-gray-300);display:inline-flex;align-items:center;gap:3px;cursor:pointer;transition:all .15s"
                    onclick="event.stopPropagation();tmToggleType('${sk}','${t}')"
                    onmouseenter="this.style.background='${info.bg}';this.style.color='${info.color}';this.style.borderColor='${info.color}';this.style.borderStyle='solid'"
                    onmouseleave="this.style.background='var(--c-gray-50)';this.style.color='var(--c-gray-400)';this.style.borderColor='var(--c-gray-300)';this.style.borderStyle='dashed'"
                    title="${info.label}">${info.icon} ${t}</span>`;
                }).join('') : `<span style="font-size:10px;color:var(--c-gray-300);font-style:italic">모든 유형이 이미 추가되어 있습니다</span>`}
              </div>
            </div>` : ''}
          </div>`;
        }).join('')}
      </div>

      ${filtered.length === 0 ? `
      <div style="padding:60px 20px;text-align:center">
        <div style="font-size:36px;margin-bottom:12px">🔍</div>
        <div style="font-size:14px;font-weight:700;color:var(--c-gray-500)">검색 결과가 없습니다</div>
        <div style="font-size:12px;color:var(--c-gray-400);margin-top:4px">검색어나 필터를 변경해 보세요</div>
      </div>` : ''}

      <!-- 하단 범례 (접이식) -->
      <details style="margin-top:20px;background:#fff;border:1px solid var(--c-gray-200);border-radius:10px;overflow:hidden">
        <summary style="padding:12px 16px;font-size:12px;font-weight:700;color:var(--c-gray-600);cursor:pointer;user-select:none;list-style:none;display:flex;align-items:center;gap:6px">
          <span style="font-size:14px">📋</span> 전체 유형 코드 범례 (${typeKeys.length}종)
          <span style="margin-left:auto;font-size:10px;color:var(--c-gray-400)">클릭하여 펼치기</span>
        </summary>
        <div style="padding:12px 16px;border-top:1px solid var(--c-gray-100);display:flex;flex-wrap:wrap;gap:16px">
          ${groupNames.map(g => `
          <div style="min-width:130px">
            <div style="font-size:9px;font-weight:700;color:var(--c-gray-400);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px;border-bottom:1px solid var(--c-gray-100);padding-bottom:4px">${g}</div>
            <div style="display:flex;flex-direction:column;gap:3px">
              ${typeGroups[g].map(t => {
                const info = CONTENT_TYPES[t];
                const usedBy = subjectKeys.filter(sk => SUBJECT_TYPE_MAP[sk].types.includes(t)).length;
                return `<div style="display:flex;align-items:center;gap:6px">
                  <span style="font-size:11px;width:14px;text-align:center">${info.icon}</span>
                  <span style="font-size:10px;font-weight:700;color:${info.color};background:${info.bg};padding:1px 6px;border-radius:4px;font-family:monospace">${t}</span>
                  <span style="font-size:10px;color:var(--c-gray-600);flex:1">${info.label}</span>
                  <span style="font-size:9px;color:var(--c-gray-400)">${usedBy}개 과목</span>
                </div>`;
              }).join('')}
            </div>
          </div>`).join('')}
        </div>
      </details>
    </div>
  </div>`;
}

// ═══ renderLiveContentView (원본 라인 15103~15162) ═══
function renderLiveContentView() {
  const deployed = WO_STATE.orders.filter(o => o.status === 'deployed');
  const countEl = document.getElementById('liveContentCount');
  if(countEl) countEl.textContent = deployed.length;

  const sbD = document.getElementById('sbBadgeDeployed');
  if(sbD) sbD.textContent = deployed.length;

  const body = document.getElementById('liveContentBody');
  if(!body) return;

  const search = (document.getElementById('liveSearchInput')?.value || '').toLowerCase();
  const filtered = deployed.filter(wo =>
    wo.title.toLowerCase().includes(search) || wo.id.toLowerCase().includes(search)
  );

  if(!filtered.length) {
    body.innerHTML = `
      <div style="text-align:center;padding:60px;color:var(--c-gray-400)">
        <div style="font-size:40px;margin-bottom:12px">📡</div>
        <div style="font-size:15px;font-weight:700;color:var(--c-gray-600);margin-bottom:6px">서비스 중인 콘텐츠가 없습니다</div>
        <div style="font-size:13px">검수 완료 후 배포된 콘텐츠가 여기에 표시됩니다</div>
      </div>`;
    return;
  }

  body.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px">
      ${filtered.map(wo => {
        const deployer = ENV_STATE.users.find(u => u.id === wo.deployedBy);
        return `
          <div style="background:#fff;border:1px solid var(--c-gray-200);border-radius:12px;overflow:hidden;transition:box-shadow .2s" onmouseenter="this.style.boxShadow='0 4px 16px rgba(0,0,0,.08)'" onmouseleave="this.style.boxShadow=''">
            <div style="background:linear-gradient(135deg,rgba(5,150,105,.06),rgba(0,113,227,.04));padding:14px 16px;border-bottom:1px solid var(--c-gray-100);display:flex;align-items:center;gap:8px">
              <span style="font-size:11px;font-weight:600;color:#0055B8;background:rgba(0,113,227,.1);padding:2px 8px;border-radius:4px">${wo.id}</span>
              <span style="font-size:13px;font-weight:700;color:var(--c-gray-800);flex:1">${wo.title}</span>
              <span class="env-pill prd" style="font-size:9px;padding:1px 6px">PRD</span>
            </div>
            <div style="padding:14px 16px">
              <div style="display:flex;gap:16px;font-size:12px;color:var(--c-gray-500);margin-bottom:10px">
                <span>🚀 배포일 ${wo.deployedAt || '-'}</span>
                <span>👤 ${deployer?.name || '-'}</span>
              </div>
              <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">
                ${wo.items.map(item => `<span style="font-size:11px;padding:3px 8px;background:rgba(5,150,105,.08);color:#1B8A3E;border-radius:12px;border:1px solid rgba(5,150,105,.2)">${item}</span>`).join('')}
              </div>
              <div style="display:flex;align-items:center;gap:8px">
                <span style="display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:600;color:#34C759">
                  <span style="width:7px;height:7px;border-radius:50%;background:#34C759;animation:env-pulse 2s infinite"></span>
                  서비스 중
                </span>
                <button class="wo-btn ghost" style="margin-left:auto;font-size:11px;padding:4px 10px" onclick="toast('STG 비교 기능은 준비 중입니다','t-info')">버전 비교</button>
                <button class="wo-btn ghost" style="font-size:11px;padding:4px 10px" onclick="toast('${wo.id} 배포 상세 이력을 표시합니다','t-info')">이력 보기</button>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}
