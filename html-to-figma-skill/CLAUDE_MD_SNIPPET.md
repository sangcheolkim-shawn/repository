# CLAUDE.md에 추가할 와이어프레임 규칙 스니펫

> 아래 내용을 프로젝트의 CLAUDE.md에 복사하여 붙여넣는다.
> 화면명, 색상 토큰, Description 컬럼은 프로젝트에 맞게 커스터마이즈한다.

---

## 와이어프레임 규칙

### 레이아웃 구조
- 와이어프레임(좌, 1440×900) + Description 어노테이션 패널(우, 1360×높이가변)
- Description 패널 x 좌표 = 와이어프레임 x + 1440 + 70 (간격 70px)
- SECTION 노드로 메뉴별 그룹 구성, SECTION 간 수직 간격 500px 이상

### 네이밍 컨벤션

| 유형 | 패턴 | 예시 |
|------|------|------|
| 메인 화면 | `SPEC_NN_화면명` | `SPEC_01_대시보드` |
| 상세/편집 | `SPEC_NN-D_화면명_상세` | `SPEC_03-D_편집기` |
| 빈 상태 | `SPEC_EMPTYNN_화면명` | `SPEC_EMPTY01_대시보드` |
| 모달/팝업 | `SPEC_POPNN_팝업명` | `SPEC_POP01_등록팝업` |
| Description | `Desc_유형명` | `Desc_Main`, `Desc_Modal` |

### 어노테이션 규칙
- 배지: 24px 빨간 원(#E53935), 2px 흰색 스트로크, Inter Bold 11px 흰색 번호
- Description 테이블 컬럼: #, 객체명, 유형, 사용자 동작, 동작 결과 및 규칙, 비고
- 배지 번호와 Description 행 번호 1:1 대응 필수

### 디자인 토큰 참조
- 색상은 DESIGN.md의 CSS 변수(var(--c-*)) 사용
- 하드코딩 금지, 프로토타입과 동일 색상 체계 유지
