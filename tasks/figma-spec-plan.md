# Figma SPEC 작업 계획 — 화면변경 페이지

## 파일 정보
- **Figma URL**: https://www.figma.com/design/R2iyj2atgZ5xfYi5cfkHPZ/26_CMS-RENEWAL-_-PROJECT?node-id=1097-2
- **fileKey**: R2iyj2atgZ5xfYi5cfkHPZ
- **페이지**: 화면변경 (nodeId: 1097:2)
- **현재 상태**: ✅ SPEC 4장 완료 (2026-06-05)

## 작업 결과 (2026-06-05)

| SPEC | 프레임 nodeId | 모달 nodeId |
|------|--------------|------------|
| SPEC_VA_커리큘럼편집_활성 | 1178:4 | 1182:2 (POP01~03) |
| SPEC_VB_커리큘럼편집_Temp | 1186:2 | 1190:2 (POP04~05) |
| SPEC_VC_서비스콘텐츠_상세 | 1191:2 | 1195:2 (POP06~07) |
| SPEC_VD_커리큘럼수신 | 1196:2 | 1200:35 (POP08) |

- 구조: 와이어프레임(좌) + Description 어노테이션 테이블(우), 번호 마커 = Confluence 명세 번호 대응
- Confluence 화면설계 페이지(2790621309)에 Figma 링크 표 추가 (v2)
- Figma 캔버스에 참조 문서 링크 카드 생성 (1201:2, 개발팀 전달용)

## 만들 SPEC (4장)

### SPEC-A: 커리큘럼 편집 — 활성 상태
- 진입: 목록→활성 클릭 / 서비스 콘텐츠→구조변경
- 헤더: 커리큘럼명 + v3 + 활성 + ✓서비스중
- 버튼: [레이블 수정] [구조 변경 → v4 Temp 생성]
- 네비게이션 배너 (서비스 콘텐츠에서 진입 시)
- 기본정보: 과목/학년/교육과정/설명
- 안내 배너: "서비스 중 — Temp 생성. 영향 없음."
- 트리 에디터 (읽기 전용)
- Alert: "레이블 수정 모드로 전환합니다"
- Confirm: "v4 Temp 작업을 생성합니다. 계속하시겠습니까?"
- Confirm (Temp 존재): "이미 Temp가 존재합니다. 기존 Temp를 열겠습니까?"

### SPEC-B: 커리큘럼 편집 — Temp 상태
- 진입: SPEC-A Temp생성 / 목록→Temp / SPEC-C Temp편집계속 / SPEC-D 버전업
- 헤더: 커리큘럼명 + v4 Temp + ← v3에서 복제
- 버튼: [편집] [검수 요청] [Temp 삭제]
- 워크플로우 스텝: [✓편집] — [2.검수요청] — [3.검수] — [4.배포]
- 변경 요약: v3 대비 자동계산 (과정 8→9, 세트 80→90)
- 트리 에디터 (편집 가능)
- Alert: "검수 요청을 보냅니다"
- Confirm: "커리큘럼을 삭제하시겠습니까?"

### SPEC-C: 서비스 콘텐츠 상세
- 진입: 서비스 콘텐츠 목록 → 카드 클릭
- 헤더: 커리큘럼명 + v3 + 배포일 + 과목/학년
- 3단계 가이드: ①구조설정(필요시) → ②콘텐츠작업 → ③검수·배포
- 구조 설정 (조건부):
  - Temp 없음: "현재 구조: 과정8·세트80·양식3종" + 텍스트링크
  - Temp 있음: "v4 Temp 진행 중" 알림 + [Temp 편집 계속]
- 콘텐츠 작업: 양식 체크박스 테이블 + 영향 안내 패널
- 배포 이력 + [이전 버전으로 되돌리기]
- Confirm: "N건 콘텐츠 수정 작업 생성. 서비스 영향 없음. 계속?"
- Alert: "선택한 시점으로 롤백됩니다"

### SPEC-D: 커리큘럼 수신 (신규)
- 메뉴 위치: 서비스 연결 관리 → 과목코드연결과 서비스콘텐츠 사이
- 필터: [전체N] [버전업필요N] [최신N]
- 수신 카드: 과목코드 + 상태배지 + 수신일 + 출처
- 연결 정보: "수학 기초 과정 v3" + diff (과정 8→9)
- 버튼: [확인 후 v4 버전업 →]
- Confirm: "v4 Temp 작업을 생성합니다. 계속?"

## 네이밍 컨벤션
- SPEC_VA_커리큘럼편집_활성
- SPEC_VB_커리큘럼편집_Temp
- SPEC_VC_서비스콘텐츠_상세
- SPEC_VD_커리큘럼수신

## 참조
- Confluence 화면설계 페이지: https://daekyo.atlassian.net/wiki/spaces/NDCM/pages/2790621309
- 설계 문서: https://daekyo.atlassian.net/wiki/spaces/NDCM/pages/2785673476
- 와이어프레임 스킬: /sessions/lucid-busy-hamilton/mnt/.claude/skills/wireframe-analysis/SKILL.md
