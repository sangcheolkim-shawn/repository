# CMS 고도화 Master

> AI 에이전트 프로젝트 컨텍스트. 파일명 변경 금지.

## 프로젝트 개요

대교(Daekyo) CMS 고도화 프로젝트. 단일 HTML 인터랙티브 프로토타입 기반, 실제 개발 연계.

- **담당자**: Shawn / 김상철 (sangcheol.kim@daekyo.co.kr, 플랫폼기획팀)
- **역할**: PM + 기획자 병행
- **단계**: 🔵 실제 구현 (프로토타입 V9, 개발 진행 중)
- **프로토타입**: `cms_stg_prd_v9.html` (~1.7MB) — 최신본
- **릴리즈**: `cms_stg_prd_release_v1.5.html` (2026-06-09)

---

## 협업 채널

| 항목 | 값 |
|------|-----|
| **Jira** | CMS 프로젝트 |
| **Confluence** | NDCM (뉴드림스 CMS Admin) |
| **소통 허브** | [링크](https://daekyo.atlassian.net/wiki/spaces/NDCM/pages/2508062842) |
| **요구사항정의서** | [V9](https://daekyo.atlassian.net/wiki/spaces/NDCM/pages/2725675198) (84건, 13모듈) |
| **메뉴별 기능 명세** | [링크](https://daekyo.atlassian.net/wiki/spaces/NDCM/pages/2627305649) |

**협업 정책**: 설계 문서는 개발팀이 Confluence에서 직접 관리. 기획→개발 문의는 댓글 또는 Jira 이슈로.

---

## 핵심 파일 구조

```
mnt/Prototype/
├── cms_stg_prd_v9.html             ← 최신 프로토타입
├── cms_stg_prd_release_v1.5.html   ← Release (개발팀 전달)
├── DESIGN.md                      ← 디자인 시스템
├── CLAUDE.md                      ← 이 파일
├── tasks/
│   ├── workflow.md                ← 워크플로우 설계
│   ├── lessons.md                 ← 교훈 기록
│   └── weekly-report-template.md  ← 주간보고 규칙
└── archive/
    ├── CHANGELOG.md               ← 버전별 변경 이력
    └── ...                        ← 이전 버전·스크린샷·뷰
```

---

## 상설 규칙

### 버전 동기화
변경 시 5곳 일괄 갱신: ①배포 파일명 ②HTML 내부 버전 ③CLAUDE.md ④Confluence 소통 허브 ⑤tasks/todo.md

### 용어 규칙: Temp → 편집버전
- **정의**: 커리큘럼의 `status:'temp'`는 서비스 중인 활성 커리큘럼의 수정 작업본을 의미
- **표기**: 문서·UI·소통에서 "Temp" 단독 사용 금지 → **Temp(편집버전)** 또는 **편집버전**으로 표기
- **코드**: 내부 상태값(`status:'temp'`, 변수명 `_isTemp`, `_crCreateTemp` 등)은 그대로 유지
- **소통**: 개발팀·기획 간 커뮤니케이션은 **"편집버전"**으로 통일 (2026-06-09 PI 회의 결정)

### 화면설계서 동기화
UI 변경 시: ①CMS_Wireframe_Descriptions.html ②Figma Description 패널 ③Confluence 기능 명세

### 주간보고
매주 금요일. 상세 규칙은 `tasks/weekly-report-template.md` 참조.

### 배포 워크플로우
1. 편집 → 2. JS 검증: `node --check` → 3. 배포: `cp` to `mnt/Prototype/`
4. 양쪽 모두 배포: `cms_stg_prd_v9.html` + `cms_stg_prd_release_v1.5.html`

---

## 에이전트 역할 (4가지 모드 전환)

| 역할 | 담당 | 트리거 |
|------|------|--------|
| PM | Jira·일정·개발팀 소통 | 이슈·진행상황 요청 |
| 기획자 | 산출물·Confluence·요구사항 | 문서·명세 요청 |
| UI 프로토타이퍼 | HTML/JS/CSS 구현 | 화면 구현·수정 요청 |
| 검증자 | JS 검증·UI 일관성 점검 | 구현 완료 후 자동 |

---

## 코딩 컨벤션

- **helper 내 백틱 금지** → 문자열 연결(`+`) 사용
- **한글 = 유니코드 이스케이프** (Python patch 시)
- **변수: `var`** (helper 내부), 상위 상수는 `const`
- **CSS: 인라인 style**, CSS 변수(`var(--c-*)`) 사용
- **함수명**: `render{View}View()`, `_render{Section}()`, `_{prefix}{Action}()`

---

## 뷰 & 네비게이션 (13개 활성 뷰, v9)

```
workflow(작업진행보드) → work-config(작업설정) → content-register(콘텐츠등록)
→ review(검수) → deploy(배포) → service-bind(과목코드연결)
→ cur-receive(커리큘럼수신) → service-content(서비스콘텐츠) → form-manage(입력양식)
→ curriculum(커리큘럼) → scoring-sim(채점시뮬레이션) → batch-receive(외부수신)
→ settings(시스템관리)
```

---

## 핵심 데이터 구조 (요약)

| 데이터 | 역할 | 주요 필드 | DB 테이블 |
|--------|------|-----------|-----------|
| **WORK_ITEMS_V7** | 단일 진실 소스 | id, curriculumId, formId, phase(assign→register→review→deploy), status | `ncm_work_assignments` |
| **CURRICULUM_DATA** | 커리큘럼 정의 | id, name, depths[], forms[], splitDepth, status(draft/active) | `ncm_curricula` |
| **FORM_TEMPLATES** | 입력 양식 | id, name, code, fields[], status | `ncm_form_templates` |
| **DEPLOY_STATE** | 배포 관리 | schedules[], history[] | `ncm_deploy_*` |
| **SVC_CURRICULA** | 서비스 중 커리큘럼 | forms[{target, version, status}] | `ncm_service_curricula` |
| **BATCH_RECEIVE_DATA** | 외부 수신 | productCode, subjectCode, hasProgress | `ncm_batch_receives` |
| **CUR_RECEIVE_DATA** | 커리큘럼 수신 | subjectCode, linkedCurId, detectedVer, diffDetail[], status(detected/holding/synced/rejected/unlinked) — 목록은 linkedCurId 기준 커리큘럼 그룹핑 | `ncm_cur_receives` |

**데이터 흐름**: CURRICULUM_DATA(draft→active) → WORK_ITEMS_V7 → `_syncWiToWorkflow()` → 칸반/등록/검수/배포
**수신 흐름**: CUR_RECEIVE_DATA(detected) → 영향분석 → Temp(편집버전) 생성 → 검수 → 배포

---

## 콘텐츠 독립성 아키텍처

- 콘텐츠는 과목코드와 **완전 독립**, 연결을 통해 서비스 매핑
- **5단계**: ①양식 정의 → ②커리큘럼 설계 → ③콘텐츠 제작 → ④과목코드 연결 → ⑤배포
- **양식 = 시스템 전달 단위**: 동일 콘텐츠도 대상 시스템별 별도 양식
- **유형코드 자동 파생**: 양식 선택 시 typeCode 생성, UI 비노출, 레거시 호환
- **양식 레벨 연결**: 같은 커리큘럼 내 양식마다 다른 과목코드 세트 가능

---

## 타겟 시스템

| 코드 | 라벨 | 색상 |
|------|------|------|
| ND | 뉴드림스 | #0055B8 |
| NH | 눈높이 | #8944AB |
| SJ | 성장판 | #1B8A3E |
| NH365 | 눈높이365 | #B35C00 |

---

## 핵심 헬퍼

- `_renderCurCardTop(cur)` — 공용 카드 상단
- `_jumpToForm(formId)` / `_jumpToCurriculum(curId)` / `_jumpToWorkConfig(curId)` — 뷰 간 점프
- `_syncWiToWorkflow()` — 데이터 브릿지
- `_getCurBoundCodes(cur)` / `_isCurBound(cur)` — 연결 상태 판정
- `_crGetPipelineCounts()` — 서비스 파이프라인 집계 (코드연결→수신→콘텐츠→배포)
- `_crOpenDetail(crId)` / `_crBackToList()` — 커리큘럼 수신 상세 뷰 진입/복귀
- `_crCreateTemp(curId, newVer)` — 수신 뷰에서 Temp(편집버전) 생성 → 커리큘럼 편집기로 이동

---

## DB 네이밍

`ncm_` prefix. 주요: `ncm_form_templates`, `ncm_curricula`, `ncm_curriculum_depths`, `ncm_work_assignments`, `ncm_content_bindings`, `ncm_service_curricula`, `ncm_form_deliveries`, `ncm_deploy_*`, `ncm_batch_receives`, `ncm_cur_receives`

---

## 변경 이력

상세 이력은 `archive/CHANGELOG.md` 참조. 현재: **V9 + Release v1.5 (2026-06-09)**

---

## 주의사항

- 대형 변경 시 Python patch 스크립트 권장
- `switchView('service-dist')` → `deploy` 리다이렉트 (레거시 호환)
- V9 — 기획 변경 시에만 프로토타입 수정
- 설계 문서는 개발팀 관리, 문의는 Jira 이슈로
