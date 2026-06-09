#!/usr/bin/env python3
"""커리큘럼 빌더 → 한 화면 리디자인
기존 3단계 카드 → 에디터와 동일한 플랫 단일 화면
"""

FILE = '/sessions/lucid-busy-hamilton/mnt/Prototype/cms_stg_prd_release_v1.1.html'

with open(FILE, 'r', encoding='utf-8') as f:
    src = f.read()

# Find the builder function boundaries
start_marker = "// ═══ CURRICULUM BUILDER (Single-Page Form) ═══\nfunction _curRenderBuilder() {"
end_marker = "\n  // Import modal overlay\n  h += _curRenderImportModal();\n  h += _curRenderBulkModal();\n\n  return h;\n}"

start_idx = src.find(start_marker)
end_idx = src.find(end_marker, start_idx)

if start_idx < 0:
    print("ERROR: Builder start not found")
    exit(1)
if end_idx < 0:
    print("ERROR: Builder end not found")
    exit(1)

end_idx += len(end_marker)

print(f"Builder function: chars {start_idx}..{end_idx} ({end_idx-start_idx} chars)")

# Build the new builder function
new_builder = r"""// ═══ CURRICULUM BUILDER (Single-Screen — 에디터와 동일 철학) ═══
function _curRenderBuilder() {
  var h = '';
  var isEdit = CUR_BUILDER.isEditing;
  var isClone = !isEdit && !!CUR_BUILDER.editingCurId;
  var title = isEdit ? '편집' : (isClone ? '복제' : '만들기');
  var depthColors = ['#0071E3','#8944AB','#FF9500','#FF3B30','#1B8A3E'];

  h += '<div style="display:flex;flex-direction:column;height:100%;overflow:hidden;background:var(--c-bg,#F5F5F7)">';

  // ── Header: 뒤로가기 + 이름 인라인 + 저장 ──
  h += '<div style="padding:10px 24px;flex-shrink:0;background:#fff;border-bottom:1px solid #E5E5EA;display:flex;align-items:center;gap:10px">';
  h += '<button onclick="_curSetMode(\'list\')" style="width:30px;height:30px;border:1px solid #E5E5EA;border-radius:8px;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0" onmouseenter="this.style.borderColor=\'#34C759\'" onmouseleave="this.style.borderColor=\'#E5E5EA\'">';
  h += '<svg viewBox="0 0 24 24" fill="none" stroke="#636366" stroke-width="2" style="width:14px;height:14px"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg></button>';
  h += '<input type="text" value="' + (CUR_BUILDER.name||'') + '" oninput="CUR_BUILDER.name=this.value" placeholder="커리큘럼 이름을 입력하세요" style="flex:1;font-size:16px;font-weight:700;color:#1D1D1F;border:none;outline:none;padding:6px 0;background:transparent;border-bottom:2px solid transparent" onfocus="this.style.borderBottomColor=\'#34C759\'" onblur="this.style.borderBottomColor=\'transparent\'">';
  h += '<div style="display:flex;gap:6px;flex-shrink:0">';
  h += '<button onclick="_curBuilderSave()" style="padding:7px 16px;border:1px solid #E5E5EA;border-radius:8px;background:#fff;font-size:12px;font-weight:600;color:#636366;cursor:pointer">저장</button>';
  h += '<button onclick="_curBuilderGoToTree()" style="padding:7px 16px;border:none;border-radius:8px;background:#34C759;color:#fff;font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:4px">';
  h += '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" style="width:13px;height:13px"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>저장 후 상세 편집</button>';
  h += '</div></div>';

  // ── 기본 정보 (에디터와 동일한 인라인 필드) ──
  h += '<div style="padding:12px 24px;background:#fff;border-bottom:1px solid #E5E5EA;flex-shrink:0">';
  h += '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end">';
  // 과목
  h += '<div style="min-width:100px"><div style="font-size:9px;font-weight:600;color:#8E8E93;margin-bottom:3px">과목 <span style="color:#FF3B30">*</span></div>';
  h += '<input type="text" value="' + (CUR_BUILDER.subject||'') + '" oninput="CUR_BUILDER.subject=this.value" placeholder="수학, 영어" style="width:100%;padding:6px 10px;border:1px solid #E5E5EA;border-radius:6px;font-size:12px;outline:none;box-sizing:border-box" onfocus="this.style.borderColor=\'#34C759\'" onblur="this.style.borderColor=\'#E5E5EA\'"></div>';
  // 학년
  h += '<div style="min-width:100px"><div style="font-size:9px;font-weight:600;color:#8E8E93;margin-bottom:3px">학년 <span style="color:#FF3B30">*</span></div>';
  h += '<input type="text" value="' + (CUR_BUILDER.grade||'') + '" oninput="CUR_BUILDER.grade=this.value" placeholder="초1~3" style="width:100%;padding:6px 10px;border:1px solid #E5E5EA;border-radius:6px;font-size:12px;outline:none;box-sizing:border-box" onfocus="this.style.borderColor=\'#34C759\'" onblur="this.style.borderColor=\'#E5E5EA\'"></div>';
  // 교육과정
  h += '<div style="min-width:120px"><div style="font-size:9px;font-weight:600;color:#8E8E93;margin-bottom:3px">교육과정</div>';
  h += '<input type="text" value="' + (CUR_BUILDER.eduCurriculum||'') + '" oninput="CUR_BUILDER.eduCurriculum=this.value" placeholder="2022 개정" style="width:100%;padding:6px 10px;border:1px solid #E5E5EA;border-radius:6px;font-size:12px;outline:none;box-sizing:border-box" onfocus="this.style.borderColor=\'#34C759\'" onblur="this.style.borderColor=\'#E5E5EA\'"></div>';
  // 설명
  h += '<div style="flex:1;min-width:150px"><div style="font-size:9px;font-weight:600;color:#8E8E93;margin-bottom:3px">설명</div>';
  h += '<input type="text" value="' + (CUR_BUILDER.desc||'') + '" oninput="CUR_BUILDER.desc=this.value" placeholder="간단한 설명" style="width:100%;padding:6px 10px;border:1px solid #E5E5EA;border-radius:6px;font-size:12px;outline:none;box-sizing:border-box" onfocus="this.style.borderColor=\'#34C759\'" onblur="this.style.borderColor=\'#E5E5EA\'"></div>';
  h += '</div></div>';

  // ── 단계 구조 흐름도 (에디터 depth flow와 동일) ──
  if(CUR_BUILDER.depths.length > 0) {
    h += '<div style="padding:10px 24px;background:#FAFAFA;border-bottom:1px solid #E5E5EA;flex-shrink:0">';
    h += '<div style="display:flex;align-items:center;gap:0;flex-wrap:wrap">';
    CUR_BUILDER.depths.forEach(function(d, i) {
      var clr = depthColors[i % 5];
      var isSplit = CUR_BUILDER.splitDepth === i;
      if(i > 0) {
        h += '<div style="display:flex;align-items:center;margin:0 3px"><svg viewBox="0 0 16 16" fill="none" style="width:14px;height:14px"><path d="M5 3l6 5-6 5" stroke="#D1D1D6" stroke-width="2" fill="none"/></svg></div>';
      }
      h += '<div style="padding:4px 10px;border-radius:6px;' + (isSplit ? 'background:#E8F2FF;border:1px solid #B3D7FF' : 'background:#F5F5F7;border:1px solid #E5E5EA') + ';display:flex;align-items:center;gap:4px">';
      h += '<span style="font-size:11px;font-weight:' + (isSplit?'700':'500') + ';color:' + (isSplit?'#0055B8':'#48484A') + '">' + (d.name || '단계') + '</span>';
      if(d.count !== null && d.count > 0) {
        h += '<span style="font-size:10px;color:' + (isSplit?'#0071E3':'#8E8E93') + '">' + d.count + '</span>';
      }
      if(isSplit) h += '<span style="font-size:8px;padding:1px 4px;border-radius:3px;background:#0055B8;color:#fff;font-weight:700;margin-left:2px">분할</span>';
      h += '</div>';
    });
    h += '</div></div>';
  }

  // ── Scrollable body ──
  h += '<div style="flex:1;overflow-y:auto;padding:16px 24px 40px">';

  // ── 트리 구조 (가져오기/생성) ──
  h += '<div style="margin-bottom:16px">';
  h += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">';
  h += '<svg viewBox="0 0 16 16" fill="none" stroke="#8944AB" stroke-width="1.5" style="width:14px;height:14px;flex-shrink:0"><polygon points="8 1 1 5 8 9 15 5 8 1"/><polyline points="1 11 8 15 15 11"/></svg>';
  h += '<span style="font-size:12px;font-weight:600;color:#1D1D1F">트리 구조</span>';
  h += '<div style="flex:1"></div>';
  h += '<button onclick="_curImportOpen()" style="padding:5px 12px;border:1px solid #D9B3F0;border-radius:6px;background:#FDFAFF;font-size:10px;font-weight:600;color:#8944AB;cursor:pointer;display:flex;align-items:center;gap:4px" onmouseenter="this.style.background=\'#F9F0FF\'" onmouseleave="this.style.background=\'#FDFAFF\'">';
  h += '<svg viewBox="0 0 24 24" fill="none" stroke="#8944AB" stroke-width="2" style="width:11px;height:11px"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>가져오기</button>';
  h += '<button onclick="_curBulkOpen()" style="padding:5px 12px;border:1px solid #B3D7FF;border-radius:6px;background:#F0F8FF;font-size:10px;font-weight:600;color:#0071E3;cursor:pointer;display:flex;align-items:center;gap:4px" onmouseenter="this.style.background=\'#E8F2FF\'" onmouseleave="this.style.background=\'#F0F8FF\'">';
  h += '<svg viewBox="0 0 24 24" fill="none" stroke="#0071E3" stroke-width="2" style="width:11px;height:11px"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>균등 배분</button>';
  h += '</div>';

  // Tree preview
  var _treeNodes = CUR_BUILDER.importedTreeNodes;
  if(_treeNodes && _treeNodes.length > 0) {
    var _treeStats = {courses:0, sets:0};
    var _countTreeStats = function(arr, depth) {
      arr.forEach(function(n) {
        if(depth === 2) _treeStats.courses++;
        if(depth === 3) _treeStats.sets++;
        if(n.children) _countTreeStats(n.children, depth+1);
      });
    };
    _countTreeStats(_treeNodes, 1);

    h += '<div style="padding:8px 12px;border-radius:8px;background:#F0FFF4;border:1px solid #A8E6B8;margin-bottom:10px;display:flex;align-items:center;gap:8px">';
    h += '<svg viewBox="0 0 24 24" fill="none" stroke="#34C759" stroke-width="2" style="width:14px;height:14px;flex-shrink:0"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';
    h += '<span style="font-size:11px;font-weight:600;color:#1B8A3E">과정 ' + _treeStats.courses + '개 \xB7 세트 ' + _treeStats.sets + '개</span>';
    h += '<button onclick="CUR_BUILDER.importedTreeNodes=null;renderCurriculumView()" style="margin-left:auto;padding:3px 8px;border:1px solid #E5E5EA;border-radius:5px;background:#fff;font-size:9px;font-weight:600;color:#636366;cursor:pointer">초기화</button>';
    h += '</div>';

    h += '<div style="border:1px solid #E5E5EA;border-radius:8px;overflow:hidden;max-height:200px;overflow-y:auto">';
    _treeNodes.forEach(function(root) {
      h += '<div style="padding:6px 12px;background:#FAFAFA;border-bottom:1px solid #E5E5EA;display:flex;align-items:center;gap:6px">';
      h += '<svg viewBox="0 0 16 16" fill="none" stroke="#8944AB" stroke-width="1.5" style="width:11px;height:11px"><polygon points="8 1 1 5 8 9 15 5 8 1"/><polyline points="1 11 8 15 15 11"/></svg>';
      h += '<span style="font-size:11px;font-weight:600;color:#1D1D1F">' + root.name + '</span>';
      h += '</div>';
      if(root.children) {
        root.children.forEach(function(course, ci) {
          var setCount = course.children ? course.children.length : 0;
          h += '<div style="padding:5px 12px 5px 24px;border-bottom:1px solid #F0F0F2;display:flex;align-items:center;gap:6px">';
          h += '<div style="width:3px;height:3px;border-radius:2px;background:#8944AB;flex-shrink:0"></div>';
          h += '<span style="font-size:10px;color:#48484A;flex:1">' + course.name + '</span>';
          h += '<span style="font-size:9px;padding:1px 6px;border-radius:8px;background:#E8F2FF;color:#0071E3;font-weight:600">' + setCount + '</span>';
          h += '</div>';
        });
      }
    });
    h += '</div>';
  } else {
    h += '<div style="padding:28px 16px;border:2px dashed #E5E5EA;border-radius:8px;text-align:center;background:#FAFAFA">';
    h += '<div style="font-size:12px;font-weight:600;color:#8E8E93;margin-bottom:4px">구조가 아직 없습니다</div>';
    h += '<div style="font-size:10px;color:#AEAEB2;line-height:1.5">우측 버튼으로 과목 구조를 가져오거나 균등 배분으로 생성하세요</div>';
    h += '</div>';
  }
  h += '</div>';

  // ── 양식 연결 + 분할 기준 (에디터 depth-level chip과 동일) ──
  h += '<div style="margin-bottom:16px">';
  h += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">';
  h += '<svg viewBox="0 0 16 16" fill="none" stroke="#0071E3" stroke-width="1.5" style="width:14px;height:14px;flex-shrink:0"><rect x="2" y="1" width="12" height="14" rx="2"/><line x1="5" y1="5" x2="11" y2="5"/><line x1="5" y1="8" x2="9" y2="8"/></svg>';
  h += '<span style="font-size:12px;font-weight:600;color:#1D1D1F">단계 및 양식 설정</span>';
  h += '<button onclick="_curBuilderAddDepth()" style="margin-left:auto;padding:4px 10px;border:1px solid #B3D7FF;border-radius:6px;background:#F0F8FF;font-size:10px;font-weight:600;color:#0071E3;cursor:pointer" onmouseenter="this.style.background=\'#E8F2FF\'" onmouseleave="this.style.background=\'#F0F8FF\'">+ 단계 추가</button>';
  h += '</div>';

  if(CUR_BUILDER.depths.length === 0) {
    h += '<div style="padding:24px;border:2px dashed #E5E5EA;border-radius:8px;text-align:center;background:#FAFAFA">';
    h += '<div style="font-size:12px;font-weight:600;color:#8E8E93">단계가 없습니다</div>';
    h += '<div style="font-size:10px;color:#AEAEB2;margin-top:4px">트리 구조 가져오기 또는 "+ 단계 추가"를 사용하세요</div>';
    h += '</div>';
  } else {
    CUR_BUILDER.depths.forEach(function(d, i) {
      var clr = depthColors[i % 5];
      var isContent = d.count === null;
      var dForms = d.forms || [];
      var dMeta = d.metaSchema || [];
      var isSplit = CUR_BUILDER.splitDepth === i;

      h += '<div style="margin-bottom:8px;border-radius:8px;border:1px solid ' + (isSplit ? '#34C759' : '#E5E5EA') + ';background:#fff;overflow:hidden' + (isSplit ? ';box-shadow:0 0 0 2px rgba(52,199,89,.12)' : '') + '">';

      // Depth header
      h += '<div style="display:flex;align-items:center;gap:8px;padding:8px 12px">';
      h += '<div style="width:3px;height:24px;border-radius:2px;background:' + clr + ';flex-shrink:0"></div>';

      if(isContent) {
        h += '<span style="font-size:11px;font-weight:600;color:#8E8E93;flex:1">콘텐츠 (자동)</span>';
      } else {
        h += '<input type="text" value="' + (d.name||'') + '" placeholder="단계명" oninput="_curBuilderUpdateDepth(' + i + ',\'name\',this.value)" style="flex:2;padding:5px 8px;border:1px solid #E5E5EA;border-radius:5px;font-size:11px;font-weight:600;outline:none;box-sizing:border-box" onfocus="this.style.borderColor=\'' + clr + '\'" onblur="this.style.borderColor=\'#E5E5EA\'">';
        h += '<span style="font-size:10px;color:#8E8E93">\xD7</span>';
        h += '<input type="number" value="' + (d.count||0) + '" min="1" oninput="_curBuilderUpdateDepth(' + i + ',\'count\',this.value)" style="width:50px;padding:5px 6px;border:1px solid #E5E5EA;border-radius:5px;font-size:11px;outline:none;box-sizing:border-box;text-align:center" onfocus="this.style.borderColor=\'' + clr + '\'" onblur="this.style.borderColor=\'#E5E5EA\'">';
        h += '<button onclick="CUR_BUILDER.splitDepth=' + i + ';renderCurriculumView()" style="padding:3px 7px;border:1px solid ' + (isSplit?'#34C759':'#E5E5EA') + ';border-radius:4px;background:' + (isSplit?'#F0FFF4':'#fff') + ';font-size:9px;font-weight:700;color:' + (isSplit?'#1B8A3E':'#8E8E93') + ';cursor:pointer;white-space:nowrap">' + (isSplit ? '✓ 분할' : '분할') + '</button>';
        h += '<button onclick="_curBuilderRemoveDepth(' + i + ')" style="width:20px;height:20px;border:none;border-radius:4px;background:transparent;cursor:pointer;color:#D1D1D6;font-size:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0" onmouseenter="this.style.color=\'#FF3B30\'" onmouseleave="this.style.color=\'#D1D1D6\'">\xD7</button>';
      }
      h += '</div>';

      // Meta tags
      if(!isContent && dMeta.length > 0) {
        h += '<div style="padding:4px 12px 8px;border-top:1px solid #F0F0F2">';
        dMeta.forEach(function(ms, mi) {
          h += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">';
          h += '<span style="font-size:9px;color:#B35C00;font-weight:600;min-width:45px">추가정보</span>';
          h += '<input type="text" value="' + (ms.label||'') + '" placeholder="항목명" oninput="_curMetaUpdateField(' + i + ',' + mi + ',\'label\',this.value)" style="width:70px;padding:4px 6px;border:1px solid #E5E5EA;border-radius:4px;font-size:10px;outline:none;box-sizing:border-box" onfocus="this.style.borderColor=\'#FF9500\'" onblur="this.style.borderColor=\'#E5E5EA\'">';
          if(ms.type==='select') {
            h += '<input type="text" value="' + (ms.options?ms.options.join(', '):'') + '" placeholder="값을 쉼표로 구분" oninput="_curMetaUpdateField(' + i + ',' + mi + ',\'options\',this.value)" style="flex:1;padding:4px 6px;border:1px solid #E5E5EA;border-radius:4px;font-size:10px;outline:none;box-sizing:border-box;color:#8944AB" onfocus="this.style.borderColor=\'#8944AB\'" onblur="this.style.borderColor=\'#E5E5EA\'">';
          } else {
            h += '<span style="font-size:9px;color:#AEAEB2;flex:1">자유 입력</span>';
          }
          h += '<button onclick="_curMetaRemoveField(' + i + ',' + mi + ')" style="width:16px;height:16px;border:none;border-radius:4px;background:transparent;cursor:pointer;color:#D1D1D6;font-size:11px;display:flex;align-items:center;justify-content:center;flex-shrink:0" onmouseenter="this.style.color=\'#FF3B30\'" onmouseleave="this.style.color=\'#D1D1D6\'">\xD7</button>';
          h += '</div>';
        });
        h += '</div>';
      }

      // Forms as chips
      if(dForms.length > 0) {
        h += '<div style="padding:4px 12px 8px;border-top:1px solid #F0F0F2;display:flex;flex-wrap:wrap;gap:4px;align-items:center">';
        h += '<span style="font-size:9px;color:#0055B8;font-weight:600;margin-right:2px">양식</span>';
        dForms.forEach(function(fb, fi) {
          var fm = (FORM_TEMPLATES||[]).find(function(f){return f.id===fb.formId;});
          h += '<span style="display:inline-flex;align-items:center;gap:3px;padding:2px 7px;border-radius:4px;background:#E8F2FF;border:1px solid #B3D7FF;font-size:10px;font-weight:600;color:#0055B8">';
          h += (fm ? fm.name : fb.label || '?');
          h += '<span onclick="_curBuilderRemoveFormFromDepth(' + i + ',' + fi + ')" style="cursor:pointer;color:#B3D7FF;font-size:10px" onmouseenter="this.style.color=\'#FF3B30\'" onmouseleave="this.style.color=\'#B3D7FF\'">\xD7</span>';
          h += '</span>';
        });
        h += '</div>';
      }

      // Action bar
      if(!isContent) {
        h += '<div style="display:flex;gap:0;border-top:1px solid #F0F0F2">';
        h += '<button onclick="_curFormPopupOpen(' + i + ')" style="flex:1;padding:6px 0;border:none;border-right:1px solid #F0F0F2;background:transparent;font-size:10px;font-weight:600;color:#0071E3;cursor:pointer" onmouseenter="this.style.background=\'#E8F2FF\'" onmouseleave="this.style.background=\'transparent\'">+ 양식</button>';
        h += '<button onclick="_curMetaAddField(' + i + ',\'select\')" style="flex:1;padding:6px 0;border:none;background:transparent;font-size:10px;font-weight:600;color:#B35C00;cursor:pointer" onmouseenter="this.style.background=\'#FFF8F0\'" onmouseleave="this.style.background=\'transparent\'">+ 추가정보</button>';
        h += '</div>';
      }

      // Form search popup
      if(CUR_FORM_POPUP.open && CUR_FORM_POPUP.depthIdx === i) {
        var _pq = (CUR_FORM_POPUP.query || '').toLowerCase();
        h += '<div style="padding:8px 12px;border-top:1px solid #E5E5EA;background:#FAFAFA">';
        h += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">';
        h += '<svg viewBox="0 0 24 24" fill="none" stroke="#8E8E93" stroke-width="2" style="width:12px;height:12px;flex-shrink:0"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';
        h += '<input type="text" placeholder="양식명 검색..." value="' + (CUR_FORM_POPUP.query||'') + '" oninput="_curFormPopupSearch(this.value)" style="flex:1;padding:5px 8px;border:1px solid #E5E5EA;border-radius:5px;font-size:11px;outline:none;box-sizing:border-box" onfocus="this.style.borderColor=\'#0071E3\'" onblur="this.style.borderColor=\'#E5E5EA\'">';
        h += '<button onclick="_curFormPopupClose()" style="width:20px;height:20px;border:none;border-radius:4px;background:#E5E5EA;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:12px;color:#8E8E93">\xD7</button>';
        h += '</div>';
        h += '<div style="max-height:160px;overflow-y:auto;display:flex;flex-direction:column;gap:2px">';
        var _existIds = dForms.map(function(f){return f.formId;});
        (FORM_TEMPLATES||[]).forEach(function(ft) {
          var _name = ft.name.toLowerCase();
          var _code = (ft.code||'').toLowerCase();
          if(_pq && _name.indexOf(_pq) === -1 && _code.indexOf(_pq) === -1) return;
          var _added = _existIds.indexOf(ft.id) >= 0;
          h += '<div style="display:flex;align-items:center;gap:6px;padding:5px 8px;border-radius:5px;background:' + (_added?'#F0FFF4':'#fff') + ';border:1px solid ' + (_added?'#A8E6B8':'#E5E5EA') + ';cursor:' + (_added?'default':'pointer') + '" ' + (_added?'':'onclick="_curFormPopupSelect(\'' + ft.id + '\')"') + '>';
          h += '<span style="font-size:10px;font-weight:600;color:' + (_added?'#1B8A3E':'#1D1D1F') + ';flex:1">' + ft.name + '</span>';
          h += '<span style="font-size:9px;color:#8E8E93">' + (ft.code||'') + '</span>';
          if(_added) h += '<span style="font-size:9px;color:#34C759;font-weight:700">✓</span>';
          h += '</div>';
        });
        h += '</div>';
        h += '</div>';
      }

      h += '</div>'; // depth card
    });
  }

  h += '</div>'; // 양식 연결 section
  h += '</div>'; // body scroll
  h += '</div>'; // root

  // Import modal overlay
  h += _curRenderImportModal();
  h += _curRenderBulkModal();

  return h;
}"""

src = src[:start_idx] + new_builder + src[end_idx:]

print(f"Builder replaced: {end_idx - start_idx} chars -> {len(new_builder)} chars")

with open(FILE, 'w', encoding='utf-8') as f:
    f.write(src)

print("Patch complete!")
