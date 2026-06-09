# TODO — CMS 프로토타입 프로젝트

> 현재 진행 중인 작업과 완료된 작업을 추적한다.

---

## 진행 중

- [x] 커리큘럼 수신(cur-receive) 뷰 프로토타입 구현 (2026-06-08)
  - 사이드바·HTML 컨테이너·ALL_VIEWS·NAV_MAP·switchView 등록
  - CUR_RECEIVE_DATA 8건 (detected/holding/synced/rejected/unlinked)
  - 목록 뷰: 파이프라인 헤더, 필터 탭(5종), 코드 중심 카드
  - 상세 뷰: 1페이지 통합 (배너+Diff+코드선택+3액션: Temp생성/보류/반려)

---

## 대기 중 / 향후 작업

- [ ] 커리큘럼 빌더 ↔ 트리 편집기 연계 검증 (빌더 구조 → 트리 노드 동기화, count 정합성)
- [ ] 전체 워크플로우 시나리오 테스트 (양식 → 커리큘럼 → 작업설정 → 등록 → 검수 → 배포)
- [ ] v8 릴리스 노트 작성 (v7 → v8 주요 변경사항 정리)
- [ ] Confluence 정책 문서 갱신 (양식 레벨 바인딩, 콘텐츠 독립성 등 v8 반영)
- [ ] 대시보드 뷰 기획서 작성 (Confluence)
- [ ] Git/GitHub Pages 연동 (환경 제약으로 보류 중, 로컬에서 재시도 예정)

### 폐기된 항목
- [~] ~~Step Indicator를 검수·배포 구간에 주입~~ → Task #23에서 Step Indicator 전체 제거 완료 (2026-04-22)
- [~] ~~bundle-hub 스텁 해소~~ → 전체 뷰 점검 결과 이미 구현 완료 상태 확인 (2026-04-28)

---

## 완료된 작업

### 2026-04-28 — v8.5 트리 편집기 CRUD + 문서 정리
- [x] 트리 편집기 완전 운영 모드: 노드 추가/삭제/이동/이름 편집
- [x] CRUD 헬퍼 함수: _curAddChild, _curAddSibling, _curDeleteNode, _curMoveNodeUp/Down, _curAddRootNode
- [x] 컨텍스트 메뉴 (···): 같은 레벨 추가, 위로/아래로 이동, 삭제
- [x] 빈 상태 CTA + 하단 "최상위 항목 추가" 버튼
- [x] 헤더 노드 카운트 배지
- [x] CLAUDE.md 변경 이력 #43 추가
- [x] todo.md 정리 (폐기 항목 처리, 최근 작업 반영)

### 2026-04-27 — v8.4 커리큘럼 속성 + 상태 게이트 + 데이터 흐름
- [x] CURRICULUM_DATA에 subject/grade/eduCurriculum 3개 필드 추가
- [x] 커리큘럼 리스트: 팀 → 과목/학년 컬럼 교체, 필터/정렬/검색 전환
- [x] 공용 카드 헬퍼 + 검수/배포 카드에 과목/학년 배지 추가
- [x] 새 커리큘럼: 별도 템플릿 선택 화면(CUR_MODE='select') 도입
- [x] 커리큘럼 상태 게이트: draft → active 전환 + 작업설정 이동 버튼
- [x] WORK_ITEMS_V7 → 칸반 보드 데이터 흐름 통합 (_syncWiToWorkflow)
- [x] batch-receive 뷰 v8 전면 재구현
- [x] 12뷰 감사: 과목/학년 정합성 교차 점검

### 2026-04-20 — v9 커리큘럼+양식 구조 분리
- [x] 아키텍처 설계: typeNodes depth 편입 → forms 배열 분리 결정
- [x] CURRICULUM_DATA: depths에서 typeNodes 제거, forms 배열 추가
- [x] CUR_TEMPLATES: suggestedTypes → suggestedForms 전환
- [x] CUR_BUILDER: typeNodes → forms 상태 전환
- [x] 헬퍼 함수: _curBuilderAddType/RemoveType/UpdateType → Form 계열 전환
- [x] _crGetAddableTypes, _crTypeMatchStatus: forms 기반 전환
- [x] _crResolveFormSpec: typeNodes → forms 기반 양식 해석
- [x] _curRenderBuilder: ③ 유형 노드 → ③ 양식 연결 UI 전환
- [x] _curRenderList: 카드 유형 배지 → cur.forms 기반 전환
- [x] _curRenderEditor: 시각화 패널 → activeCur.forms 기반 전환
- [x] typeNodes/isTypeLevel 참조 0건 확인
- [x] JS 문법 검증 통과 + 배포 + CLAUDE.md 동기화

### 2026-04-20 — v8.3 커리큘럼 UI 폴리싱
- [x] 빌더 ③ 유형 노드: + 추가/× 삭제 버튼 제거, 읽기 전용 배지 전환
- [x] 빌더 depth 행: 유형 레벨에 typeNode 미니 배지 추가
- [x] 리스트 카드: 유형·양식 배지 영역 강화 (보라색 섹션)
- [x] 콘텐츠 등록: depthType 필터 드롭다운 + 필터 로직 추가
- [x] JS 문법 검증 통과 + 배포

### 2026-04-20 — v8.2 depthType UI + typeNodes 정합성
- [x] _crGetAddableTypes: SUBJECT_TYPE_MAP → 커리큘럼 typeNodes 기반 전환
- [x] _crTypeMatchStatus: SUBJECT_TYPE_MAP → 커리큘럼 typeNodes 기반 전환
- [x] crInlineToggleType: typeNodes 편집 안내 메시지 + 레거시 동기화
- [x] 양식 셀 depthType 배지 강화 (보라색 ✧ 유형명 + 코드)
- [x] DEV annotation v8 typeNodes 기반 갱신
- [x] formIds 잔존 참조 0건 확인
- [x] JS 문법 검증 통과 + 배포

### 2026-04-17 — v8.1 커리큘럼 관리 3-Screen UX
- [x] CUR_MODE / CUR_TEMPLATES(5종) / CUR_BUILDER 상태 + 헬퍼 함수 삽입
- [x] renderCurriculumView → 디스패처 + _curRenderList + _curRenderBuilder + _curRenderEditor 분리
- [x] 리스트 뷰: 템플릿 갤러리 + 커리큘럼 카드(depth pills, 유형 배지, 바인딩, 액션)
- [x] 스마트 빌더: 2단 레이아웃(좌측 편집 + 우측 미리보기), 빠른 생성
- [x] 트리 편집기: 기존 탭·검색·정보 바 유지 + 뒤로가기 버튼
- [x] JS 문법 검증 통과 + 배포

### 2026-04-17 — v8 유형코드 Depth 편입
- [x] 유형코드 Depth 편입 정책 분석 및 Confluence 협의 요청 페이지 작성
- [x] 개발자 설명 자료 HTML 작성 (cms_architecture_explain.html)
- [x] CURRICULUM_DATA typeNodes 구조 전환 (depths[] 내 4D 유형 노드)
- [x] work-config 카드 — 4D 유형 배지, typeNodes 기반 양식 표시
- [x] curriculum/service-bind/content-register 뷰 typeNodes 전환
- [x] JS 문법 검증 통과 + 배포

### 2026-04-16 — v7.2 부분 바인딩 + 양식 편집기
- [x] 과목코드 부분 바인딩 UI (bindConfig, depth 레벨별 범위 토글)
- [x] 입력 양식 편집기 (FM_EDIT_STATE, 필드 풀 브라우저, 중복 필드 타이틀 변형)

### 2026-04-16 — v7.1 페이지별 디테일 보강
- [x] Step Indicator 공용 헬퍼 + 뷰 간 상호 링크 헬퍼
- [x] FORM_TEMPLATES 8개로 확장 + 메타 필드 추가
- [x] work-config 카드 미바인딩 chip → service-bind 점프

### 2026-04-17 — 프로젝트 중간 정리
- [x] 전체 프로젝트 감사 (산출물 정합성, 코드 검증, 문서 동기화)
- [x] DESIGN.md/CLAUDE.md 동기화 + archive/ 폴더 정리

### 2026-04-03 — v7 콘텐츠 독립성 아키텍처
- [x] 입력 양식 관리/커리큘럼 관리/과목코드 바인딩 뷰 신규 구현
- [x] Work-config 커리큘럼 전환 + 콘텐츠 등록 3탭 필터
- [x] 전 뷰 개발자 annotation + 사이드바 메뉴 재구성

### 2026-04-03 — Apple 디자인 + 워크플로우 체계 + Confluence 기획서
- [x] DESIGN.md 생성 + CSS 변수 Apple 팔레트 교체
- [x] tasks/ 디렉토리 (workflow.md, lessons.md, todo.md) 생성
- [x] Confluence 기획서 12개 메뉴 완성
