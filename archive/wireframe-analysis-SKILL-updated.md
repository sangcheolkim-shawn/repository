---
name: wireframe-analysis
description: |
  Figma 와이어프레임 생성 및 CMS 화면설계 문서 작성 지원 스킬.
  Figma Plugin API(use_figma)를 사용하여 프로토타입 HTML의 render 함수를 분석하고,
  네이티브 Figma 객체로 와이어프레임을 직접 생성하는 방법론을 포함한다.
  
  다음 상황에서 반드시 이 스킬을 사용할 것:
  - 와이어프레임, 화면설계서, UI 스펙 문서 작성 요청
  - Figma 템플릿 분석, 프레임 구조 설계
  - 프로토타입 → 와이어프레임 변환 작업
  - Figma Plugin API로 네이티브 객체 생성
  - 어노테이션(Annotation) 테이블 작성
  - 화면 인벤토리, 화면 목록 정리
  - "SPEC", "화면설계", "와이어프레임", "피그마 템플릿" 관련 요청
---

# CMS 와이어프레임 작업 스킬

## 목적

CMS 고도화 프로젝트(Jira CMS-85)의 와이어프레임 작업을 지원한다.
프로토타입(cms_stg_prd_v8.5.html)을 Figma 와이어프레임 문서로 변환하는 과정에서,
사내 템플릿 패턴과 학습된 베스트 프랙티스를 적용한다.

---

## Figma Plugin API 기반 와이어프레임 생성 방법론

### 개요

프로토타입 HTML의 render 함수를 분석하여, `use_figma` (Figma Plugin API)로 네이티브 Figma 객체를 직접 생성하는 방식. 스크린샷 이미지 삽입보다 편집 가능하고 확장성이 높음.

### 필수 도구

- **Figma MCP**: `mcp__1312aea8-1ee8-4311-988f-7e108761206f__use_figma`
- **프로토타입 HTML**: render 함수에서 레이아웃/데이터 구조 파악
- **DESIGN.md**: 색상·타이포 기준 참조

### 공용 코드 패턴

```javascript
// ═══ 색상 팔레트 ═══
var cSB={r:0.13,g:0.15,b:0.19};   // 사이드바 다크
var cW={r:1,g:1,b:1};              // 흰색
var cBg={r:0.96,g:0.965,b:0.97};   // 배경
var cBd={r:0.88,g:0.89,b:0.91};    // 보더
var cAcc={r:0,g:0.443,b:0.89};     // 파란 강조 (#0071E3)
var cG={r:0.55,g:0.57,b:0.6};      // 회색 텍스트
var cTD={r:0.11,g:0.11,b:0.12};    // 다크 텍스트
var cTW={r:0.92,g:0.93,b:0.95};    // 화이트 텍스트 (사이드바용)
var cLG={r:0.93,g:0.94,b:0.95};    // 라이트 그레이

// ═══ 헬퍼 함수 ═══
// 사각형 생성
function R(p,x,y,w,h,f,o) {
  var r = figma.createRectangle();
  r.x=x; r.y=y; r.resize(w,h);
  r.fills=[{type:'SOLID',color:f||cW}];
  if(o) {
    if(o.r) r.cornerRadius=o.r;
    if(o.s) { r.strokes=[{type:'SOLID',color:o.s}]; r.strokeWeight=o.sw||1; }
    if(o.o!==undefined) r.opacity=o.o;
  }
  p.appendChild(r); return r;
}

// 텍스트 생성 (async — 폰트 로딩 필수)
async function T(p,x,y,t,s,c,st) {
  var txt = figma.createText();
  await figma.loadFontAsync({family:"Inter",style:st||"Regular"});
  txt.fontName={family:"Inter",style:st||"Regular"};
  txt.fontSize=s;
  txt.characters=String(t);
  txt.fills=[{type:'SOLID',color:c||cTD}];
  txt.x=x; txt.y=y;
  p.appendChild(txt); return txt;
}

// 사이드바 (모든 메인 뷰 공용)
async function drawSidebar(node, activeLabel) {
  R(node,0,0,220,900,cSB);
  await T(node,20,18,"DAEKYO CMS",14,cTW,"Bold");
  var menuItems=[
    {l:"작업 진행 보드",y:62},
    {l:"콘텐츠 작업",y:96,grp:true},{l:"작업 설정",y:116},{l:"콘텐츠 등록",y:146},
    {l:"검수 & 배포",y:184,grp:true},{l:"검수 관리",y:204},{l:"배포 관리",y:234},
    {l:"서비스 연결 관리",y:272,grp:true},{l:"과목코드 연결",y:292},{l:"서비스 콘텐츠 관리",y:322},
    {l:"양식 관리",y:360,grp:true},{l:"입력 양식 관리",y:380},{l:"커리큘럼 관리",y:410},
    {l:"채점 시뮬레이션",y:448,grp:true},{l:"채점 시뮬레이션 관리",y:468},
    {l:"설정",y:506,grp:true},{l:"시스템 관리",y:526}
  ];
  for(var i=0;i<menuItems.length;i++){
    var m=menuItems[i];
    var isActive = (m.l === activeLabel);
    if(isActive) R(node,8,m.y-4,204,28,{r:0.2,g:0.23,b:0.28},{r:6});
    await T(node,m.grp?16:32,m.y,m.l,m.grp?10:12,
      m.grp?{r:0.44,g:0.46,b:0.5}:isActive?cW:cTW,
      m.grp?"Bold":isActive?"Semi Bold":"Regular");
  }
}
```

### 프레임 크기 규격

| 유형 | 크기 | 용도 |
|------|------|------|
| 메인 SPEC | 1440×900 | 사이드바(W=220) + 헤더(H=56) + 콘텐츠 |
| 상세/편집 | 1440×900 | 풀스크린 편집기/뷰어 |
| 모달/팝업 | 720×500 | 반투명 오버레이 + 중앙 카드 |
| 빈 상태 | 720×500 | 아이콘 + 안내 메시지 + CTA |
| Description | 1360×300~380 | 어노테이션 테이블 |

### 작업 순서 (권장)

1. **Cover + IA** — 프로젝트 개요 + 메뉴 구조도 + 프로세스 흐름도
2. **12개 메인 SPEC** — 각 뷰의 render 함수를 읽고 주요 UI 요소 배치
3. **12개 빈 상태 + 9개 모달** — 일관된 패턴으로 배치 생산
4. **9개 상세/편집 뷰** — 가장 복잡, 드릴다운 화면별 구조 파악 필요

### 주의사항

- **폰트**: Inter, 스타일명은 `"Semi Bold"` (공백 있음, `"SemiBold"` 아님)
- **반환값**: `use_figma`는 반환값을 캡처할 수 없음 — `figma.notify()`로 디버깅
- **기존 프레임 채우기**: `node.children.forEach(c => c.remove())` 후 새로 그리기
- **페이지 이동**: `dstPage.appendChild(child)` — `[...srcPage.children]` 배열 복사 후 루프 필수
- **Section 생성**: `figma.createSection()`, Frame은 `figma.createFrame()`
- **노드 접근**: `figma.getNodeById("ID")` — ID 형식은 `"763:73"` (콜론 구분)

### 타겟 시스템 색상 (배지용)

```javascript
// 뉴드림스(ND)
{bg:{r:0.91,g:0.95,b:1}, color:{r:0,g:0.34,b:0.72}, border:{r:0.7,g:0.84,b:1}}
// 눈높이(NH)
{bg:{r:0.98,g:0.94,b:1}, color:{r:0.54,g:0.27,b:0.67}, border:{r:0.85,g:0.7,b:0.94}}
// 성장판(SJ)
{bg:{r:0.94,g:1,b:0.96}, color:{r:0.09,g:0.54,b:0.24}, border:{r:0.66,g:0.9,b:0.72}}
// 눈높이365(NH365)
{bg:{r:1,g:0.97,b:0.94}, color:{r:0.7,g:0.36,b:0}, border:{r:1,g:0.85,b:0.66}}
```

---

## 학습된 사내 템플릿 패턴

### 분석된 샘플 2건

#### 샘플 ① 스마트코칭 리그오브매스 자동화 PJ

- **Figma URL**: `figma.com/design/NWpJqpnd8RfG1FsiiywSpY`
- **파일 구조**: 메뉴별 그룹핑 → 화면 흐름 순서로 배치
- **그룹 헤더**: 노란색 라벨로 메뉴 그룹명 표시 (예: "리그목록관리")
- **네이밍 컨벤션** (체계적):
  - `SPEC_01_화면명` — 메인 화면
  - `SPEC_EMPTY01_화면명_빈화면` — 빈 상태(Empty State)
  - `SPEC_POP03_팝업명` — 모달/팝업
- **레이아웃**: 와이어프레임(좌) + Description 어노테이션 패널(우)
- **어노테이션**: 화면 위 객체에 번호 부여 → 우측 테이블에서 각 객체의 타입과 동작 설명

#### 샘플 ② 써밋 중등교과 수행평가 내재화

- **Figma URL**: `figma.com/design/g6zcAHHSuaQDTVq4a2BsKj`
- **파일 구조**: 대분류 분리 (✅ 제품 / ✅ CMS)
- **레이아웃**: 동일 — 와이어프레임(좌) + Description 패널(우)
- **어노테이션**: 번호 아이콘 인스턴스 + Header/Text + Body 구조

### 공통 패턴 (두 샘플 모두)

1. **IA 페이지 별도 운영**: 전체 화면 구조를 IA(정보 구조도)로 먼저 정의
2. **와이어프레임 + Description 좌우 배치**: 모든 화면에서 동일한 2컬럼 구조
3. **번호 기반 객체 어노테이션**: 화면 위 번호 → 우측 패널에서 상세 설명
4. **모달/팝업/빈 화면 별도 프레임**: 메인 화면과 분리하여 독립 프레임으로 관리
5. **화면 흐름 순서 배치**: 사용자 동선에 따라 프레임 순서 배열

---

## CMS 와이어프레임 적용 구조

### 네이밍 컨벤션

| 유형 | 패턴 | 예시 |
|------|------|------|
| 메인 화면 | `SPEC_NN_화면명` | `SPEC_01_작업진행보드` |
| 상세/편집 | `SPEC_NN-D_화면명_상세` | `SPEC_03-D_콘텐츠등록_편집기` |
| 빈 상태 | `SPEC_EMPTYNN_화면명` | `SPEC_EMPTY01_작업진행보드` |
| 모달/팝업 | `SPEC_POPNN_팝업명` | `SPEC_POP01_작업배정팝업` |
| 트리편집기 | `SPEC_NN-T_화면명_트리` | `SPEC_09-T_트리편집기` |

### 어노테이션 테이블 구조

| # | 객체명 | 타입 | 인터랙션 | 조건/규칙 | 비고 |
|---|--------|------|----------|-----------|------|
| 1 | 검색 필터 | Dropdown | 클릭 시 옵션 펼침 | 과목/학년/상태 필터 | 복수 선택 가능 |
| 2 | 커리큘럼 카드 | Card | 클릭 시 상세 확장 | 데이터 있을 때만 표시 | 공용 헬퍼 사용 |

---

## 화면 인벤토리 (v8.5 기준 — 42개 프레임, 전부 완료)

| 뷰 | 메인 | 상세/편집 | 모달 | 빈 상태 | 소계 |
|----|------|-----------|------|---------|------|
| workflow (작업 진행 보드) | 1 | — | 1 | 1 | 3 |
| work-config (작업 설정) | 1 | 1 | 1 | 1 | 4 |
| content-register (콘텐츠 등록) | 1 | 1 | — | 1 | 3 |
| review (검수 관리) | 1 | 1 | 1 | 1 | 4 |
| deploy (배포 관리) | 1 | — | 1 | 1 | 3 |
| service-bind (과목코드 연결) | 1 | 1 | 1 | 1 | 4 |
| service-content (서비스 콘텐츠) | 1 | 1 | — | 1 | 3 |
| form-manage (입력 양식) | 1 | 1 | 1 | 1 | 4 |
| curriculum (커리큘럼) | 1 | 2 | 1 | 1 | 5 |
| scoring-sim (채점 시뮬레이션) | 1 | 1 | — | 1 | 3 |
| batch-receive (외부 수신) | 1 | — | 1 | 1 | 3 |
| settings (시스템 관리) | 1 | — | 1 | 1 | 3 |
| **합계** | **12** | **9** | **9** | **12** | **42** |

---

## 작업 진행 상태

- **현재 단계**: ✅ 완료 (42개 프레임 전부 생성)
- **Figma 파일**: `R2iyj2atgZ5xfYi5cfkHPZ` — 페이지 `744:4` ("26년 CMS 리뉴얼 설계서")

---

## 참고 리소스

- **프로토타입**: `cms_stg_prd_v8.5.html` (~795KB, 12개 활성 뷰)
- **Jira 이슈**: CMS-85 (와이어프레임 작업)
- **CLAUDE.md**: 프로젝트 전체 컨텍스트
- **DESIGN.md**: 디자인 시스템 (색상, 타이포, 컴포넌트)
- **Figma MCP 도구**: `mcp__1312aea8-1ee8-4311-988f-7e108761206f__use_figma`
