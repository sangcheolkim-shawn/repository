# CMS 고도화 Master

> AI 에이전트 프로젝트 컨텍스트. 파일명 변경 금지.

## 프로젝트 개요

대교(Daekyo) CMS 고도화 프로젝트. 단일 HTML 인터랙티브 프로토타입 기반, 실제 개발 연계.

- **담당자**: Shawn / 김상철 (sangcheol.kim@daekyo.co.kr, 플랫폼기획팀)
- **역할**: PM + 기획자 병행
- **단계**: 🔵 실제 구현 (프로토타입 V9.9+, 개발 진행 중)
- **프로토타입**: `cms_stg_prd_v9.9.html` (~1.76MB) — 최신본
- **릴리즈**: `cms_stg_prd_release_v1.5.html` (2026-06-15)

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
├── cms_stg_prd_v9.9.html           ← 최신 프로토타입
├── cms_stg_prd_release_v1.5.html   ← Release (개발팀 전달)
├── CLAUDE.md                      ← 이 파일
├── DESIGN.md                      ← 디자인 시스템
├── CMS_Operation_Protocol.html    ← 운영 프로토콜
├── CMS_Wireframe_Descriptions.html ← 화면설계서 어노테이션
├── CMS_VersionUp_Deploy_Flow.html ← 버전업 배포·코드승계 흐름 (매뉴얼 템플릿)
├── tasks/
│   ├── todo.md                    ← 진행·대기 작업
│   ├── demo-scenarios.md          ← 뷰별 데모 시나리오
│   ├── lessons.md                 ← 교훈 기록
│   ├── workflow.md                ← 워크플로우 설계
│   └── weekly-report-template.md  ← 주간보고 규칙
└── archive/                       ← 이전 버전·패치·다이어그램·스크린샷
```

---

## 상설 규칙

### 버전 동기화
변경 시 5곳 일괄 갱신: ①배포 파일명 ②HTML 내부 버전 ③CLAUDE.md ④Confluence 소통 허브 ⑤tasks/todo.md

### 용어 규칙: Temp → 편집버전
문서·UI·소통에서 "Temp" 단독 사용 금지 → **Temp(편집버전)** 또는 **편집버전** 표기. 코드 내부 상태값은 그대로 유지.

### 화면설계서 동기화
UI 변경 시: ①CMS_Wireframe_Descriptions.html ②Figma Description 패널 ③Confluence 기능 명세

### 웹 매뉴얼 제작 방침
모든 기능 확정 후 HTML 웹 매뉴얼 제작 예정. 형식: 풀스크린 CMS 레이아웃(사이드바+메인) 기반, 화면 흐름으로 설명. 템플릿: `CMS_VersionUp_Deploy_Flow.html`. 이미지 캡쳐 방식 사용 안 함 — HTML/CSS로 화면을 직접 재현.

### 주간보고
매주 금요일. 상세 규칙은 `tasks/weekly-report-template.md` 참조.

### 배포 워크플로우
1. 편집 → 2. JS 검증: `node --check` → 3. 양쪽 배포: `cms_stg_prd_v9.9.html` + `cms_stg_prd_release_v1.5.html`

### 변경 관리 프로토콜 ⚠️
변경 전: 영향받는 뷰 목록 파악 → 큰 변경은 Shawn 승인 후 진행.
변경 후: `tasks/demo-scenarios.md` 체크리스트 점검 → 결과 보고.

---

## 에이전트 역할 (세션별 단계 운영)

### 현재 세션: 기획 확정 단계
| 역할 | 담당 | 트리거 |
|------|------|--------|
| PM | Jira·일정·개발팀 소통 | 이슈·진행상황 요청 |
| 기획자 | 산출물·Confluence·요구사항 확정 | 문서·명세·화면 흐름 요청 |
| UI 프로토타이퍼 | HTML/JS/CSS 프로토타입 구현 | 기획 확정 후 화면 구현 요청 |
| 검증자 | JS 검증·UI 일관성 점검 | 구현 완료 후 자동 |

### 고도화 세션 2: UX 점검 + 프론트엔드 완성
| 역할 | 담당 | 트리거 |
|------|------|--------|
| UI/UX 전문가 | 사용성 분석·정보 구조·인터랙션 설계 | 기획 확정 후 최종 리뷰 |
| 프론트엔드 개발자 | 컴포넌트 설계·상태 관리·성능 최적화 | 구현 방향·기술 설계 요청 |

> **정책**: 기획이 확정되지 않은 상태에서 UX 최적화에 시간을 쓰지 않는다. 기획 확정 → UX 점검 → 프론트엔드 순서를 지킨다.

---

## 코딩 컨벤션

- **helper 내 백틱 금지** → 문자열 연결(`+`) 사용
- **한글 = 유니코드 이스케이프** (Python patch 시)
- **변수: `var`** (helper 내부), 상위 상수는 `const`
- **CSS: 인라인 style**, CSS 변수(`var(--c-*)`) 사용
- **함수명**: `render{View}View()`, `_render{Section}()`, `_{prefix}{Action}()`

---

## 뷰 & 네비게이션 (13개 활성 뷰)

```
workflow → work-config → content-register → review → deploy
→ service-bind → cur-receive → service-content → form-manage
→ curriculum → scoring-sim → batch-receive → settings
```

---

## 핵심 데이터 구조

| 데이터 | 역할 | DB 테이블 |
|--------|------|-----------|
| **WORK_ITEMS_V7** | 단일 진실 소스 (phase: assign→register→review→deploy) | `ncm_work_assignments` |
| **CURRICULUM_DATA** | 커리큘럼 정의 (depths[], forms[], splitDepth, status, team) | `ncm_curricula` |
| **FORM_TEMPLATES** | 입력 양식 (fields[], targetSystems[]) | `ncm_form_templates` |
| **SVC_CURRICULA** | 서비스 중 커리큘럼 | `ncm_service_curricula` |
| **CUR_RECEIVE_DATA** | 커리큘럼 수신 (linkedCurId 기준 그룹핑) | `ncm_cur_receives` |
| **BATCH_RECEIVE_DATA** | 상품(배치) 수신 현황 (brand, contentType, linkedCurIds[]) | `ncm_batch_receives` |
| **DEPLOY_STATE** | 배포 관리 | `ncm_deploy_*` |

**흐름**: CURRICULUM_DATA → WORK_ITEMS_V7 → `_syncWiToWorkflow()` → 칸반/등록/검수/배포
**수신**: CUR_RECEIVE_DATA → 영향분석 → 편집버전 생성 → 검수 → 배포
**상품**: BATCH_RECEIVE_DATA → 상품·수신 관리 탭 (brand별 그룹, 커리큘럼 다대다 연결)

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

`_jumpToForm` / `_jumpToCurriculum` / `_jumpToWorkConfig` — 뷰 간 점프
`_syncWiToWorkflow()` — 데이터 브릿지
`_crOpenDetail` / `_crBackToList` — 수신 상세 뷰 진입/복귀
`_crCreateTemp(curId, newVer)` — 편집버전 생성
`_curTreeSetFormLabel(nodeId, formId, value)` — 트리 노드별 양식 라벨

---

## 변경 이력

상세: `archive/CHANGELOG.md`. 현재: **V9.9+ + Release v1.5 (2026-06-15)**

---

## 주의사항

- 대형 변경 시 Python patch 스크립트 권장
- `switchView('service-dist')` → `deploy` 리다이렉트 (레거시 호환)
- 기획 변경 시에만 프로토타입 수정
- 설계 문서는 개발팀 관리, 문의는 Jira 이슈로
