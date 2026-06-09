# 주간보고 작성 규칙 (상설 — 2026-05-22 확정)

> CLAUDE.md에서 분리됨 (2026-05-29). weekly-report 스킬 사용 시 이 파일 참조.

매주 금요일 주간보고는 **지난주 형식**(`[CMS] 주간보고 2026-05-12`, pageId 2732818553)을 그대로 따른다.
표준 페이지: `[CMS] 주간보고 2026-05-18` (pageId 2754838548)

**페이지 위치**: 개인 스페이스 (spaceId 580911232), 상위 페이지 "CMS 주간 업무보고" (pageId 2732228921)
**제목 형식**: `[CMS] 주간보고 YYYY-MM-DD` (해당 주 월요일 날짜)

**구조 (반드시 준수)**:
```
H1: CMS 주간 업무보고 — YYYY년 M월 D일 (월) 기준

H2: 금주 완료
  [고도화 프로젝트]
    CMS-72 E0 프로토타입 완성 (인라인 스마트 링크)
      · 하위 이슈 + 설명 + 상태 배지
        · 세부 작업 (sub-bullet)
    CMS-73 E1 기반 구축
  [기획 및 정책 설계]
    · 개별 이슈 + 완료 배지 + 날짜
  [Confluence 산출물 업데이트]
    · 페이지 링크 + 신규/갱신 + 날짜

---HR---

H2: 차주 계획
  [고도화 프로젝트]
    CMS-72 E0 + CMS-73 E1 (각 에픽별 진행/예정 이슈)
    후속 에픽 러프 일정 (CMS-74~78)
  [개선] 현 시스템 운영 관련 개선

---HR---

H2: 이슈 및 특이사항
  · 신규 발굴, PENDING, 결정 필요 사항

H2: 다음 주 포커스 (번호 리스트, 3~4개)
```

**HTML 작성 규칙**:
- Jira 이슈 = **인라인 스마트 링크**: `<a href="https://daekyo.atlassian.net/browse/CMS-XX" data-card-appearance="inline">https://daekyo.atlassian.net/browse/CMS-XX</a>`
- 상태 배지: `<span data-type="status" data-color="...">라벨</span>`
  - 완료/DONE → green / IN PROGRESS → blue / TESTING → yellow / PENDING → red / Backlog → neutral / Ready for Release → purple
- 날짜: `<time datetime="YYYY-MM-DD">May 19, 2026</time>`
- Confluence 페이지 = 일반 `<a href>` (스마트 링크 X)
- 카테고리 헤더: `<p><strong>[카테고리명]</strong></p>`

**금지**: 3컬럼 비교 테이블, 패널 매크로(panel-info/note/warning), H3 이하 헤더 남발
