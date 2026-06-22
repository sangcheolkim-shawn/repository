# 교훈 기록 (Lessons Learned)

> 수정을 받을 때마다 이 파일에 패턴을 기록한다.
> 구버전 교훈(L1~L18)은 `archive/lessons-archive.md`에 보관.

---

## 품질 체크리스트 (모든 작업 완료 전 실행)

### 필수 검증 (매번)
- [ ] JS syntax check: `node --check`
- [ ] jsdom 런타임 테스트: `node test_views2.js` → 12개 뷰 OK
- [ ] 배포: `cms_stg_prd_v8.5.html` + `release_v1.1.html` 양쪽
- [ ] 유니코드 정확성: `큘`(큘) vs `큐`(큐) 주의

### 구조 변경 시
- [ ] CLAUDE.md 동기화, ALL_VIEWS 배열 일치, switchView 연결, IIFE 잔존 확인

### UI 변경 시
- [ ] DESIGN.md 준수, WC_SYSTEM_COLORS 일관성, 빈 상태 UI, 뷰 전환 상태 유지
- [ ] **데모 시나리오 점검**: `tasks/demo-scenarios.md` 해당 뷰 체크리스트 실행 (L24)
- [ ] **영향 뷰 점검**: 변경 영향 매트릭스 확인 → 관련 뷰 점프·데이터 정합성 확인
- [ ] **사전 알림**: 레이아웃/정보구조 변경 시 Shawn에게 변경 범위·영향 보고 (L24)

### 데이터 변경 시
- [ ] ncm_ prefix, 콘텐츠 독립성 원칙, 기존 render 함수 교차 점검

---

## 현행 교훈 (L19~L23)

### L19: Figma Plugin API로 네이티브 와이어프레임 생성 방법론
- 공용 헬퍼(`R`, `T`, `drawSidebar`), 공용 색상 팔레트
- Inter 스타일 "Semi Bold" (공백 있음), `figma.notify()` 사용 금지
- Section = `figma.createSection()`, 페이지 간 이동 = `dstPage.appendChild(child)`

### L20: Figma Plugin API 코드 패턴
- `use_figma` 파라미터: `code` + `description` (NOT `javaScript`)
- 폰트 로드 필수: `await figma.loadFontAsync()`
- `figma.currentPage` 리셋됨 → 매 호출마다 `setCurrentPageAsync()` 필요

### L21: 프레임 유형별 크기 규격
- 메인: 1440×900, 모달/빈상태: 720×500, Description: 1360×300~380

### L22: 페이지 간 프레임 이동
- `[...srcPage.children]` 배열 복사 후 루프 필수 (직접 순회 시 인덱스 꼬임)

### L23: 화면설계서 V2 표준 확정 (2026-05-29)
- 섹션 헤더 높이 **38px** (Shawn 직접 조정, 절대 변경 금지)
- SPEC 프레임 #484848, 모든 텍스트 순수 흰색 #FFFFFF

### L24: 프로토타입 변경 관리 필수 (2026-06-10, PI 회의 교훈)
- **배경**: 과목코드 연결·커리큘럼 수신·빌더 뷰가 이전 대비 크게 변경되어 회의 데모 실패
- **원인**: UI 변경 후 샘플 데이터/시나리오가 새 UI에 맞게 갱신되지 않음 + 사전 영향 알림 없음
- **대책**:
  1. 레이아웃·정보구조 변경 시 **사전 알림 + Shawn 승인** 후 진행
  2. 변경 후 `tasks/demo-scenarios.md` 체크리스트 필수 실행
  3. 영향받는 다른 뷰 목록 파악 후 점프 연결 동작 확인
  4. 변경 범위가 클 때 "이 변경은 기존 대비 N개 영역이 달라집니다" 경고 출력
- **참조**: CLAUDE.md "변경 관리 프로토콜" 섹션, `tasks/demo-scenarios.md`
- Number 컴포넌트는 `importComponentByKeyAsync(key)` 필수
- Description 패널 배경 투명
- 전체 사양은 wireframe-analysis 스킬 "V2 표준 템플릿" 섹션 참조
