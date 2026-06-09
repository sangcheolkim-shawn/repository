---
name: html-to-figma
description: |
  HTML 프로토타입을 Figma 와이어프레임으로 변환하는 스킬.
  프로토타입의 render 함수를 분석하여 Figma Plugin API로 
  벡터 객체를 직접 생성한다. (이미지 대비 토큰 90% 절감)

  다음 상황에서 이 스킬을 사용할 것:
  - 와이어프레임, 화면설계서, UI 스펙 문서 작성 요청
  - Figma 템플릿 분석, 프레임 구조 설계
  - 프로토타입 → 와이어프레임 변환 작업
  - 어노테이션(Annotation) 테이블 작성
  - 화면 인벤토리, 화면 목록 정리
  - "SPEC", "화면설계", "와이어프레임", "피그마 템플릿" 관련 요청
---

# HTML → Figma 와이어프레임 변환 스킬

## 변환 파이프라인 (4단계)

### STEP 1: HTML 분석
프로토타입 HTML 파일의 render 함수를 읽고 UI 구조를 분석한다.
- 레이아웃 구조 (사이드바, 헤더, 콘텐츠 영역, 필터 바)
- 컴포넌트 패턴 (카드, 테이블, 폼, 모달)
- 데이터 바인딩 (목데이터 구조, 상태값)
- DESIGN.md 참조하여 색상 토큰 매핑

### STEP 2: Figma API 코드 생성
분석된 구조를 Figma Plugin API JavaScript로 변환한다.
**반드시 공용 헬퍼를 정의하여 재사용**한다 (토큰 60% 절감):

```javascript
// === 공용 헬퍼 — 매 use_figma 호출 시 상단에 선언 ===
await figma.loadFontAsync({family:'Noto Sans KR', style:'Regular'});
await figma.loadFontAsync({family:'Noto Sans KR', style:'Bold'});
await figma.loadFontAsync({family:'Inter', style:'Bold'});

function R(p,x,y,w,h,fill){
  var r=figma.createRectangle();
  r.x=x; r.y=y; r.resize(w,h);
  r.fills=[{type:'SOLID',color:fill}];
  p.appendChild(r); return r;
}
function T(p,x,y,txt,sz,clr,style){
  var t=figma.createText();
  t.x=x; t.y=y; t.characters=txt;
  t.fontSize=sz;
  t.fills=[{type:'SOLID',color:clr}];
  if(style) t.fontName={family:'Noto Sans KR',style:style};
  p.appendChild(t); return t;
}

// === 색상 팔레트 (프로젝트의 DESIGN.md에 맞게 교체) ===
var cW={r:1,g:1,b:1};
var cBg={r:0.96,g:0.97,b:0.98};
var cBd={r:0.88,g:0.88,b:0.88};
var cAcc={r:0,g:0.4,b:1};
var cG={r:0.6,g:0.6,b:0.6};
var cSB={r:0.16,g:0.18,b:0.24};
var cDk={r:0.13,g:0.13,b:0.13};
```

### STEP 3: use_figma 실행
생성된 코드를 `use_figma` 도구로 실행한다.
- **한 번에 최대 10개 논리 연산** (프레임 생성+속성+부모 배치 = 1연산)
- 복잡한 화면은 2~3개씩 나누어 호출
- 반드시 `return { createdNodeIds: [...] }` 로 생성된 노드 ID 반환

### STEP 4: 검증 및 보정
`get_screenshot`로 결과를 시각적으로 확인하고 보정한다.
- 좌표/크기 오류는 코드만으로 확인 불가 → **반드시 스크린샷 검증**
- 배지 번호 ↔ Description 행 번호 1:1 대응 확인

---

## 레이아웃 규칙

### 프레임 구조
- **와이어프레임**: 1440×900, SECTION 내 좌측
- **Description 패널**: 1360×높이가변, 와이어프레임 우측 (x = 와이어프레임_x + 1510)
- **SECTION 간 수직 간격**: 500px 이상
- **모달/빈화면**: 720×500, 메인 프레임 아래 y+1100

### 네이밍 컨벤션

| 유형 | 패턴 | 예시 |
|------|------|------|
| 메인 화면 | `SPEC_NN_화면명` | `SPEC_01_대시보드` |
| 상세/편집 | `SPEC_NN-D_화면명_상세` | `SPEC_03-D_편집기` |
| 빈 상태 | `SPEC_EMPTYNN_화면명` | `SPEC_EMPTY01_대시보드` |
| 모달/팝업 | `SPEC_POPNN_팝업명` | `SPEC_POP01_등록팝업` |
| Description | `Desc_유형명` | `Desc_Main`, `Desc_Modal` |

### 어노테이션 규칙
- **배지**: 24px 빨간 원(#E53935), 2px 흰색 스트로크, Inter Bold 11px 흰색 번호
- **Description 테이블 6컬럼**: #, 객체명, 유형, 사용자 동작, 동작 결과 및 규칙, 비고
- 배지 번호와 Description 행 번호 **1:1 대응 필수**

---

## Figma Plugin API 주의사항

| 항목 | 규칙 |
|------|------|
| 폰트 로딩 | Text 노드 전 반드시 `await figma.loadFontAsync()` |
| 페이지 전환 | `await figma.setCurrentPageAsync(page)` 사용 (동기 setter 불가) |
| 코드 길이 | `use_figma` 코드 필드 50,000자 제한 → 분할 호출 |
| 색상 범위 | 0~1 (0~255 아님). `{r:1,g:0,b:0}` = 빨강 |
| fills/strokes | 읽기전용 배열 → 복사 후 수정, 재할당 |
| return 필수 | 생성/수정된 노드 ID를 반드시 return |
| 에러 시 | 즉시 재시도 금지. 에러 메시지 읽고 수정 후 재시도 |
| Section.children | 빈 배열 반환 → `page.findAll()`로 하위 노드 탐색 |
| figma.notify | 미지원 — 사용 금지 |

---

## 작업 순서 (권장)

1. **구조 생성** — SECTION 노드로 메뉴별 그룹, 빈 프레임 배치
2. **메인 화면** — render 함수 분석 → 벡터 객체 생성 (2~3개씩)
3. **부속 화면** — 상세/모달/빈화면 추가
4. **배지 + Description** — 번호 배지 부착, 어노테이션 테이블 작성
5. **Common Rules** — 공통 패턴 (Alert, Toast, Empty) 별도 SECTION 분리
6. **검증** — 체크리스트 점검 + 전체 스크린샷

---

## 완성도 체크리스트

- [ ] SECTION 수 = 메뉴 수 + Common Rules
- [ ] 각 SECTION에 SPEC_NN_ 메인 프레임 (1440×900) 존재
- [ ] 상세/모달/빈화면 프레임 완비 (화면 인벤토리 대비)
- [ ] 모든 화면에 Description 패널 배치
- [ ] Description 테이블에 실제 데이터 존재 (빈 패널 방지)
- [ ] 넘버링 배지 전체 화면에 부착
- [ ] 배지 번호 ↔ Description 행 번호 1:1 대응
- [ ] 네이밍 컨벤션 준수 (SPEC_NN_, SPEC_POPNN_, Desc_)

---

## 사내 템플릿 공통 패턴 (학습 결과)

사내 기존 와이어프레임 샘플 분석으로 도출된 공통 패턴:

1. **IA 페이지 별도 운영** — 전체 화면 구조를 정보 구조도(IA)로 먼저 정의
2. **와이어프레임 + Description 좌우 배치** — 모든 화면에서 동일한 2컬럼 구조
3. **번호 기반 객체 어노테이션** — 화면 위 번호 → 우측 패널에서 상세 설명
4. **모달/팝업/빈 화면 별도 프레임** — 메인 화면과 분리하여 독립 프레임으로 관리
5. **화면 흐름 순서 배치** — 사용자 동선에 따라 프레임 순서 배열
6. **그룹 헤더** — 노란색 라벨로 메뉴 그룹명 표시

### 참조 샘플
- 샘플 ① `figma.com/design/NWpJqpnd8RfG1FsiiywSpY` — 체계적 네이밍 (SPEC_NN_ 패턴)
- 샘플 ② `figma.com/design/g6zcAHHSuaQDTVq4a2BsKj` — IA + 상태 흐름도 포함
