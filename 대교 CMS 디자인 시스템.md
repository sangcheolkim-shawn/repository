# 대교 CMS 디자인 시스템

> 차분하고 정돈된 업무 환경 — 단일 블루 중심의 색 체계, 절제된 상태 색, 일관된 여백과 타이포그래피로 복잡한 콘텐츠 운영 업무를 명확하게 정리합니다.

문서 버전: **v2.0** · 기준 프로토타입: `cms_stg_prd_v9.9.html` · 갱신: 2026-06-18
적용 범위: **전체 화면 13종(메인 네비) + 숨은/서브 페이지 + 모달·에디터·팝업 전수**

> v2.0 변경 요약: v1.0의 6개 화면 → 실제 프로토타입 기준 전체 화면·모달·랜딩·숨은 페이지를 빠짐없이 인벤토리화. 기능 누락 없이 모달/에디터/확인 다이얼로그까지 분류 정리.

---

## 1. 디자인 원칙

1. **단일 블루 중심** — 화면 전체를 하나의 블루 패밀리(액센트 + 딥 네이비)로 통일해 시선 분산을 없앤다.
2. **절제된 상태 색** — 상태 색(앰버·바이올렛·그린·레드·슬레이트)은 8px 점과 작은 라벨에만 사용한다. 카드 배경은 항상 화이트.
3. **적당한 여백** — 정보 밀도와 가독성의 균형. 카드 패딩 16~20px, 섹션 간격 16~24px.
4. **클릭 절감** — 카드·행에 인라인 퀵액션(다음 단계 / 검수 승인 / 배포)을 배치해 화면 이동을 줄인다.
5. **부드러운 보더 · 미세 섀도** — 무거운 그림자 대신 1px 보더 + 미세한 그림자로 면을 구분한다.
6. **맥락 유지 네비게이션** — 화면 간 점프 시 진입 출처를 기억하고 "← 돌아가기"로 복귀 (예: 서비스 콘텐츠 ↔ 커리큘럼 편집).

---

## 2. 컬러

### 2.1 테마 (액센트 팔레트, 4종 선택)

상단 우측 팔레트에서 전환. 모든 화면의 액센트·사이드바·진행률·버튼이 함께 바뀐다.

| 테마 | Primary | Deep | Navy(사이드바) | Tint |
|------|---------|------|----------------|------|
| **그래파이트**(기본) | `#3D6E9E` | `#284C70` | `#222A35` | `#EEF3F8` |
| 인디고 | `#4A57C0` | `#313C93` | `#1A1E3C` | `#EFF0FB` |
| 틸 그린 | `#0E8884` | `#085C59` | `#10302E` | `#E7F5F4` |
| 클래식 블루 | `#2C6BD4` | `#1E4A98` | `#15233F` | `#EFF4FC` |

> 참고: 현행 프로토타입(v9.9)의 동작 액센트는 `#0071E3`(시스템 블루)로 구현되어 있으며, 테마 토큰 적용 시 위 팔레트로 교체된다.

### 2.2 중성 (그레이) — 테마 무관 고정

| 토큰 | 값 | 용도 |
|------|-----|------|
| Ink | `#1A2233` | 제목·강조 텍스트 |
| Text | `#3F4A5C` | 본문 텍스트 |
| Muted | `#7C8699` | 보조 텍스트 |
| Faint | `#A8B0BE` | 비활성·캡션 |
| Background | `#F4F6FA` | 페이지 배경 |
| Surface | `#FFFFFF` | 카드·패널 |
| Border | `#E7EBF2` | 기본 보더 |
| Border-strong | `#D7DDE8` | 강조 보더 |

### 2.3 상태 색 — 점·라벨에만 절제 사용

| 상태 | 색 | Tint |
|------|-----|------|
| 미시작 | Slate `#94A0B2` | — |
| 작업 중 | Amber `#C0820F` | `#FAF2DF` |
| 업로드 완료 | Primary(테마) | Tint(테마) |
| 검수 요청 | Violet `#7858C6` | `#EFEBFA` |
| 검수 완료 · 서비스 중 | Green `#1F9D5B` | `#E9F6EF` |
| 긴급 · 반려 | Red `#D54A3D` | `#FBEBE9` |

### 2.4 타겟 시스템 색 (서비스 구분)

| 코드 | 라벨 | 색 |
|------|------|-----|
| ND | 뉴드림스 | `#0055B8` |
| NH | 눈높이 | `#8944AB` |
| SJ | 성장판 | `#1B8A3E` |
| NH365 | 눈높이365 | `#B35C00` |

---

## 3. 타이포그래피

**서체: Pretendard** (fallback: -apple-system, Segoe UI, sans-serif)

| 역할 | 크기 / 굵기 | 비고 |
|------|-------------|------|
| 페이지 타이틀 | 22 / 800 | letter-spacing -0.4px |
| 섹션 제목 | 16 / 700 | |
| 카드 제목 · 본문 강조 | 14 / 600 | |
| 본문 | 13 / 400 | 기본 정보 |
| 캡션 · 보조 라벨 | 11.5 / 500 | |
| 마이크로 라벨 | 11 / 700 | 대문자 + tracking, 섹션 라벨 |

---

## 4. 스페이싱 · 형태

- **기준 단위**: 4px (사용 값: 8 / 12 / 16 / 20 / 24 / 32)
- **카드 패딩**: 16~20px · **섹션 간격**: 16~24px · **페이지 패딩**: 22~28px
- **반경(Radius)**: 컨트롤 6px(`--r-sm`), 카드 8px(`--r`), 큰 패널 12px(`--r-lg`), 칩/배지 6~9px
- **그림자**:
  - 카드: `0 1px 2px rgba(20,30,50,.04)`
  - 호버: `0 4px 14px rgba(20,30,50,.08)`
  - 떠 있는 패널/토스트: `0 10px 30px rgba(20,30,50,.12)`
  - 모달 오버레이: 반투명 백드롭 + 중앙 패널(radius 12px, 떠 있는 섀도)

---

## 5. 컴포넌트

### 버튼
| 종류 | 스타일 |
|------|--------|
| Primary | 배경 Primary, 흰 텍스트, 높이 38~42px, radius 8px |
| Ghost | 흰 배경, 1px 보더, Text 색 |
| Subtle | Tint 배경, Primary 텍스트, Tint 보더 |
| Danger | Red Tint 배경, Red 텍스트 |

### 배지 · 칩
- 둥근 모서리(6~9px), 11.5px / 600, Tint 배경 + 해당 색 텍스트
- 예: `STEP 02`(Primary), `활성`(Green), `검수 요청`(Violet), `긴급`(Red), `보통`(보더형), `편집버전`(Amber)

### 진행률 바
- 높이 5~8px, 배경 `#F4F6FA`, 채움 Primary(또는 Primary 그라데이션), radius 5px
- 항상 `완료/전체 · 퍼센트` 라벨과 함께 표기

### 상태 표시
- 7~9px 원형 점 + 상태 라벨(해당 상태 색). 카드 배경은 변경하지 않음.

### 사이드바
- 딥 네이비 배경, 섹션 라벨(마이크로), 항목 9px 패딩
- 활성 항목: 액센트 반투명 배경 + 밝은 아이콘 + 흰 텍스트
- 우측 카운트 배지 · 로고 클릭 시 GNB 접기(아이콘 전용 모드) 토글

### 상단바 (60px)
- 좌: 페이지 아이콘 + 타이틀 + 설명(말줄임)
- 우: 검색 → 테마 팔레트 → 환경(STG/PRD) → 알림

### 트리 에디터
- 커리큘럼 구조(과정 › 세트) 표현. 상태별 모드: 읽기 전용 / 편집 가능
- 노드별 인라인 액션(↑ ↓ ✎ ✕), 노드 별칭(양식별 라벨) 지원

### 모달 · 다이얼로그 (공통 규격)
- 백드롭 + 중앙 패널(radius 12px), 헤더(타이틀 16/700) + 본문 + 우측 정렬 버튼 영역
- 종류: **Alert**(단일 확인) / **Confirm**(취소·실행 2버튼) / **Form/Editor**(입력) / **Detail**(상세 패널) / **Toast**(자동 소멸)

---

## 6. 워크플로우 — 표준 프로세스

프로토타입의 워크플로우 스텝 정의(`WORKFLOW_STEPS`) 기준 7단계, 3개 그룹.

| STEP | 단계 | 그룹 | 연결 화면 |
|------|------|------|-----------|
| ① | 입력 양식 | 제작 준비 | form-manage |
| ② | 커리큘럼 | 제작 준비 | curriculum |
| ③ | 작업 설정 | 콘텐츠 제작 | work-config |
| ④ | 콘텐츠 등록 | 콘텐츠 제작 | content-register |
| ⑤ | 검수 | 검수·배포 | review |
| ⑥ | 코드 연결 | 검수·배포 | service-bind |
| ⑦ | 배포 | 검수·배포 | deploy |

> 글로벌 Step Indicator는 v9에서 비활성화(향후 매뉴얼/온보딩용 재활용 예정). 단계 위계는 모두 블루 톤 번호로 통일.

---

## 7. 화면 인벤토리 (메인 네비게이션)

사이드바 6개 섹션 · 활성 화면 13종. (괄호: 내부 view id / render 함수)

### 7.0 진입 · 랜딩
- **작업 진행 보드** (`workflow` / `renderWorkflowView`) — **앱 기본 진입 화면(랜딩)**. 파이프라인 요약 + Kanban/목록 토글, 카드 인라인 "다음 단계" 액션.
- 별도 **대시보드 요약 레이어**(`#view-dashboard`) — "오늘 할 일", 검수 대기/중/완료, 배포 대기/스케줄/완료 카운트 카드. (요약 진입용)

### 7.1 콘텐츠 작업
- **작업 설정** (`work-config` / `renderWorkConfigView`) — 작업 유형·범위 설정, 담당 배정. 상세 모달·작업유형 팝업.
- **콘텐츠 등록** (`content-register` / `renderContentRegisterView`) — 과목 필터 + 작업 리스트 / 우측 상세 패널(메타·진행률·업로드), 풀스크린 등록 모드.

### 7.2 검수 & 배포
- **검수 관리** (`review` / `renderReviewView`, IA: `review-main`) — 검수 대기 카드(미리보기 / 반려 / 검수 승인).
- **배포 관리** (`deploy` / `renderDeployView`) — 배포 대기·서비스 중 구분, 환경(STG/PRD) 배너 + 1클릭 배포.

### 7.3 서비스 연결 관리
- **과목코드 연결** (`service-bind` / `renderServiceBindView`) — 커리큘럼↔과목코드 매핑 + 외부 동기화.
- **커리큘럼 동기화** (`cur-receive` / `renderCurReceiveView`) — 외부 수신 커리큘럼 확인 → 버전업(편집버전 생성). (= "커리큘럼 수신")
- **서비스 콘텐츠 관리** (`service-content` / `renderServiceContentView`) — 서비스 중 콘텐츠 상세, 3단계 가이드(구조설정→콘텐츠작업→배포), 배포 이력·롤백.

### 7.4 양식 관리
- **입력 양식 관리** (`form-manage` / `renderFormManageView`) — 유형별 양식 템플릿 카드(필드 수·적용 시스템·버전), 양식 에디터.
- **커리큘럼 관리** (`curriculum` / `renderCurriculumView`) — 커리큘럼 빌더/트리 에디터, 상태별(활성·편집버전·초안) 헤더 UI, 노드 별칭.

### 7.5 채점 시뮬레이션
- **채점 시뮬레이션 관리** (`scoring-sim` / `renderScoringSimView`) — 채점 규칙 시뮬레이션·검증.

### 7.6 설정
- **시스템 관리** (`settings` / `renderSettingsView`) — 서브탭: **사용자 관리**(`members`) · **공지 관리**(`notice`).
- **상품/배치 수신** (`batch-receive` / `renderBatchReceiveView`) — 외부 상품(배치) 수신 현황. 설정 그룹에서 진입.

---

## 8. 숨은 / 서브 페이지 (메인 네비 미노출 — 점프·딥링크로 진입)

| 화면 | view id / render | 진입 경로 | 용도 |
|------|------------------|-----------|------|
| 대시보드 요약 | `dashboard` / `renderDashboardView` | 내부 라우팅 | 오늘 할 일·검수·배포 카운트 요약 |
| 과정 목록 | `course-list` | 커리큘럼/빌더 내부 | 커리큘럼 과정 목록·빌더 진입 |
| 답안 에디터 | `answer-editor` / `renderAnswerEditor` | 콘텐츠 등록 → 답안 편집 | 문항 답안 인라인 편집 |
| 작업 지시서 | `workorder` / `renderWorkorderView` | 작업 설정 → 지시 생성 | 작업 지시(WO) 발행·확인 |
| 번들 허브 | `renderBundleHubView` | 바인딩/번들 흐름 | 콘텐츠 번들 묶음 관리 |
| 라이브 콘텐츠 | `renderLiveContentView` | 검수/배포 흐름 | 서비스 중(라이브) 콘텐츠 뷰 |
| 템플릿(학습관 유형) | `learning-type` / `renderLearningTypeView` | 관리 메뉴 | 학습관별 유형·필드 카탈로그 |
| 과목 코드 관리 | `code-manage` / `renderCodeManageView` | 관리 메뉴 | 과목 코드 정의·선택 |
| 유형 매핑 | `renderTypeMappingView` | 양식/유형 흐름 | 유형↔양식 매핑 |
| 서비스 배포(레거시) | `service-dist` / `renderServiceDistView` | `switchView('service-dist')` | **`deploy`로 리다이렉트(레거시 호환)** |

---

## 9. 모달 · 에디터 · 팝업 전수 인벤토리

공통 규격은 §5(모달·다이얼로그) 참조. 기능 누락 방지를 위해 동작별로 분류.

### 9.1 검수 (Review)
- **검수 상세** — `openReviewModal` / `openReviewDetail` / `closeReviewModal`
- **반려 사유 입력** — `_rvShowRejectModal` → `_rvConfirmReject` (Confirm)
- **미디어 미리보기** — `_rvRenderMediaModal` / `_rvShowMedia`

### 9.2 배포 · 환경 (Deploy / Env)
- **검수 승인** — `openApproveModal` / `closeApproveModal`
- **배포 확정(게시)** — `cfConfirmPublish` (Confirm)
- **STG 테스트** — `openStgTest` / `openStgTestDialog`
- **환경 전환(STG↔PRD)** — `showEnvSwitch`
- **라이브 콘텐츠 상세** — `openLiveModal` / `closeLiveModal`

### 9.3 콘텐츠 등록 · 작업 설정
- **수신/작업 상세** — `_crOpenDetail` · **작업 설정 상세** — `_wcOpenDetail` / `_wcRenderDetailModal`
- **양식 작업 진입** — `_crOpenFormWork` · **배정 가이드** — `_crShowAssignGuide` · **신규 등록** — `_crShowNewRegister`
- **덮어쓰기 확인** — `_crFsShowOverwriteModal` → `_crFsConfirmOverwrite` (Confirm)
- **작업 추가 확인 / 토스트** — `_wcAddConfirm` / `_wcShowToast`

### 9.4 작업 유형 · 작업 지시
- **작업유형 등록** — `openWorkTypeRegisterPopup`
- **작업유형 속성** — `openWorkTypeAttrPopup` · **작업유형 제외** — `openWorkTypeExcludePopup`
- **작업 지시 생성** — `openCreateWO`

### 9.5 커리큘럼 (빌더 · 트리)
- **구조 가져오기** — `_curRenderImportModal` · **일괄 처리** — `_curRenderBulkModal`
- **노드 별칭(양식별 라벨) 편집** — `_curOpenAliasEditor` / `_curRenderAliasEditor` / `_curCloseAliasEditor`
- **노드 메뉴** — `_curShowNodeMenu` · **빌더 메타/유형 팝업** — `_curBuilderMetaPopup` / `_curBuilderTypePopup`
- **커리큘럼 에디터** — `_curRenderEditor` · **삭제 확인** — `_crConfirmDelete` (Confirm)

### 9.6 입력 양식 · 콘텐츠 입력기
- **양식 에디터** — `_fmRenderEditor` · **필드 카탈로그** — `_ltOpenFieldCatalog`
- **답안 에디터** — `openAnswerEditor` / `renderAnswerEditor` / `renderAEEditor` / `crAeRenderInlineEditor` / `_renderInlineAnswerEditor`
- **과정 편집기** — `openCourseEditor`
- **이미지 삽입** — `_renderImgModal` / `rteShowImgModal` / `rteCloseImgModal`
- **수식(LaTeX) 삽입** — `_renderLatexModal`
- **배치/DB/파일 에디터** — `_renderBatchEditor` / `_renderDbEditor` / `_renderFileEditor`

### 9.7 코드 · 번들 바인딩
- **코드 선택 팝업** — `_cmOpenCodePopup` / `_cmRenderCodePopup` / `_cmCloseCodePopup` · **코드 선택기** — `_showCodeSelector`
- **바인딩 모달** — `_bindRenderModal` / `_bindOpenModal` / `_bindCloseModal`
- **부분 바인딩 모달** — `_bindOpenPartialModal` / `_bindClosePartialModal`
- **번들 처리** — `_bpRenderModal` → `_bpConfirm` (Confirm)

### 9.8 공지 (Notice)
- **팝업 공지** — `_showNoticePopup` / `_checkAndShowNoticePopup` / `_noticeClosePopup`
- **공지 미리보기** — `_noticePreviewPopup` · **공지 상세** — `showNoticeDetail`
- **공지 작성/저장** — `openCreateNotice` / `saveNotice` / `renderNoticeTab`

### 9.9 공통
- **확인 다이얼로그** — `showConfirm` / `closeConfirm` (범용 Alert·Confirm)
- **토스트** — `_wcShowToast` 등 (자동 소멸 알림)

---

## 10. 네비게이션 흐름 (Cross-link Jump)

화면 간 점프는 출처 컨텍스트(`SVC_NAV_CONTEXT`)를 보존하고 "← 돌아가기"로 복귀한다.

```
작업 진행 보드(랜딩)
  ├─ 파이프라인 단계 클릭 → 작업 설정 / 콘텐츠 등록 / 검수 / 배포
  └─ 카드 "다음 단계" → 해당 단계 화면

서비스 콘텐츠 관리 (service-content)
  ├─ "구조 변경이 필요한 경우 →" ─→ 커리큘럼 관리(편집)  [컨텍스트 저장]
  │        └─ "← 돌아가기" ─→ 서비스 콘텐츠 복귀
  └─ "편집버전 계속" ─→ 커리큘럼 관리(편집버전)

커리큘럼 동기화 (cur-receive)
  └─ "확인 후 버전업 →" ─→ 커리큘럼 관리(편집버전 생성)

크로스링크 헬퍼: _jumpToForm(formId) · _jumpToCurriculum(curId) · _jumpToWorkConfig
레거시: switchView('service-dist') → deploy 리다이렉트
```

---

## 11. 토큰 참고 (CSS 변수)

루트 요소에 정의된 커스텀 프로퍼티로, 테마 전환 시 액센트 토큰만 교체된다.

```
--blue / --blue-h / --blue-d        액센트 · 호버 · 딥
--blue-50 / --blue-100 / --blue-200 틴트 단계
--navy / --navy-2                   사이드바 네이비
--ink / --txt / --muted / --faint   텍스트 위계
--bg / --surface / --bd / --bd2     배경 · 면 · 보더
--ok / --warn / --vio / --red / --slate (+ *-50 틴트)  상태 색
--r-sm / --r / --r-lg               반경
```

---

## 부록 A. 화면 ↔ render 함수 ↔ DB 매핑 (요약)

| 화면 | render 함수 | 핵심 데이터 / 테이블 |
|------|-------------|----------------------|
| 작업 진행 보드 | renderWorkflowView | WORK_ITEMS_V7 / `ncm_work_assignments` |
| 작업 설정 | renderWorkConfigView | WORK_ITEMS_V7 |
| 콘텐츠 등록 | renderContentRegisterView | WORK_ITEMS_V7 |
| 검수 관리 | renderReviewView | WORK_ITEMS_V7 (review phase) |
| 배포 관리 | renderDeployView | DEPLOY_STATE / `ncm_deploy_*` |
| 과목코드 연결 | renderServiceBindView | (바인딩) |
| 커리큘럼 동기화 | renderCurReceiveView | CUR_RECEIVE_DATA / `ncm_cur_receives` |
| 서비스 콘텐츠 관리 | renderServiceContentView | SVC_CURRICULA / `ncm_service_curricula` |
| 입력 양식 관리 | renderFormManageView | FORM_TEMPLATES / `ncm_form_templates` |
| 커리큘럼 관리 | renderCurriculumView | CURRICULUM_DATA / `ncm_curricula` |
| 채점 시뮬레이션 | renderScoringSimView | (시뮬레이션) |
| 시스템 관리 | renderSettingsView | (members / notice) |
| 상품/배치 수신 | renderBatchReceiveView | BATCH_RECEIVE_DATA / `ncm_batch_receives` |
