# DESIGN.md — Daekyo CMS Prototype (Graphite Design System)

> AI 에이전트가 이 파일을 읽고, CMS 프로토타입과 **동일한 시각 언어**로 일관된 UI를 생성하도록 한다.
> 디자인 기반: **단일 블루 중심(Graphite)** — 차분하고 정돈된 업무 환경. 4종 테마 팔레트 전환 지원.
> 기준: 공유용 디자인 시스템 샘플(`대교 CMS (공유용)`) 토큰 + `cms_stg_prd_v9.9.html` :root.
> 문서 버전: **v2.0** (2026-06-18 — Apple Style v1 → Graphite v2 전면 개정)

---

## 1. Visual Theme & Atmosphere

### Design Philosophy
- **단일 블루 중심(Graphite)** — 화면 전체를 하나의 블루 패밀리(액센트 `#3D6E9E` + 딥 네이비 `#284C70`)로 통일해 시선 분산을 없앤다. 인터랙티브 요소는 액센트 하나로 집중.
- **절제된 상태 색** — 상태 색(앰버·바이올렛·그린·레드·슬레이트)은 **점·라벨·배지에만** 사용. 카드 배경은 항상 화이트.
- **네이비 사이드바** — 딥 네이비(`#222A35`) 솔리드 배경 + 액센트 반투명 활성 표시.
- **부드러운 보더 · 미세 섀도** — 무거운 그림자 대신 **1px 보더 + 미세 그림자**로 면을 구분 (Apple식 테두리 제거와 반대 — 보더를 적극 사용).
- **적당한 여백** — 정보 밀도와 가독성의 균형. 카드 패딩 16~20px, 섹션 간격 16~24px.
- **타이트한 타이포그래피** — 음수 letter-spacing, Pretendard 우선.

### Personality
- 차분하고 정돈된 (calm & organized)
- 기능 중심이되 신뢰감 있는 업무 도구
- 한국어 UI 기본 (Pretendard 우선)

### 테마 팔레트 (4종 전환)
상단 우측 팔레트 점에서 전환. 액센트·사이드바·진행률·버튼이 함께 바뀐다. 액센트 토큰만 교체되고 중성·상태색은 고정.

| 테마 | accent | hover(h) | deep(d) | t50 | t100 | t200 | navy | navy2 |
|------|--------|----------|---------|-----|------|------|------|-------|
| **graphite**(기본) | `#3D6E9E` | `#335E88` | `#284C70` | `#EEF3F8` | `#DBE5EF` | `#BACEE0` | `#222A35` | `#2C3744` |
| indigo | `#4A57C0` | `#3D49AC` | `#313C93` | `#EFF0FB` | `#E0E2F6` | `#C6CAEE` | `#1A1E3C` | `#24294E` |
| teal | `#0E8884` | `#0B716D` | `#085C59` | `#E7F5F4` | `#D0EEEC` | `#A6DEDB` | `#10302E` | `#173F3C` |
| classic | `#2C6BD4` | `#2560C0` | `#1E4A98` | `#EFF4FC` | `#DCE9FA` | `#BFD5F2` | `#15233F` | `#1E2D4A` |

---

## 2. Color Palette & Roles

### Brand / Interactive (graphite 기본값 — 테마 전환 시 교체)

| Token | Hex | Role |
|-------|-----|------|
| `--c-primary` | `#3D6E9E` | 주요 CTA, 활성 상태, 포커스 링 |
| `--c-primary-h` | `#335E88` | 주요 버튼 호버 (어두워짐) |
| `--c-primary-d` | `#284C70` | 딥 액센트, 그라데이션 종단 |
| `--c-primary-l` | `#EEF3F8` | 선택/활성 배경, 배지 틴트 (t50) |
| `--c-primary-b` | `#BACEE0` | 포커스 링, 테두리 (t200) |

### Semantic Colors (테마 무관 고정 — 절제 사용)

| Token | Hex | Tint(50) | Role |
|-------|-----|----------|------|
| `--c-green` (`--ok`) | `#1F9D5B` | `#E9F6EF` | 성공, 완료·승인, 서비스 중 |
| `--c-amber` (`--warn`) | `#C0820F` | `#FAF2DF` | 경고, 작업 중 |
| `--c-purple` (`--vio`) | `#7858C6` | `#EFEBFA` | 검수 요청, 특수 상태 |
| `--c-red` (`--red`) | `#D54A3D` | `#FBEBE9` | 오류, 삭제, 긴급·반려 |
| `--slate` | `#94A0B2` | — | 미시작·비활성 |

### Neutral Scale (blue-tinted — 테마 무관 고정)

| Token | Hex | Role |
|-------|-----|------|
| `--ink` (`--c-gray-900`) | `#1A2233` | 제목·강조 텍스트 (Near Black) |
| `--txt` (`--c-gray-700`) | `#3F4A5C` | 본문 텍스트 |
| `--c-gray-600` | `#545E6E` | 본문 보조 |
| `--muted` (`--c-gray-500`) | `#7C8699` | 라벨·설명 |
| `--faint` (`--c-gray-400`) | `#A8B0BE` | 보조·비활성·캡션 |
| `--c-gray-300` (`--bd2`) | `#D7DDE8` | 강조 보더, 호버 보더 |
| `--c-gray-200` (`--bd`) | `#E7EBF2` | 기본 구분선·보더 |
| `--c-gray-150` | `#EDF0F5` | 카드 내부 구분 |
| `--c-gray-100` (`--bg`) | `#F4F6FA` | 페이지 배경 |
| `--c-gray-50` | `#F8FAFC` | 호버 배경, 대체 행 |

### Surface Colors

| Token | Hex | Role |
|-------|-----|------|
| `--c-bg` | `#F4F6FA` | 페이지 배경 |
| `--c-surface` | `#FFFFFF` | 카드, 패널 배경 |
| `--sb-bg` | `rgba(34,42,53,.96)` | 사이드바 배경 (딥 네이비 `#222A35`) |
| `--sb-hover` | `rgba(255,255,255,.08)` | 사이드바 항목 호버 |
| `--sb-text` | `rgba(255,255,255,.85)` | 사이드바 텍스트 |

### Target System Colors (서비스 플랫폼 구분 — 고정)

텍스트 색은 유지, 틴트 배경은 새 상태 틴트로 정렬.

| Key | Background | Text | Border | Label |
|-----|-----------|------|--------|-------|
| ND | `#EEF3F8` | `#0055B8` | `#BACEE0` | 뉴드림스 |
| NH | `#EFEBFA` | `#8944AB` | `#CFC2EC` | 눈높이 |
| SJ | `#E9F6EF` | `#1B8A3E` | `#B5DFC6` | 성장판 |
| NH365 | `#FAF2DF` | `#B35C00` | `#EBD3A8` | 눈높이365 |

---

## 3. Typography Rules

### Font Stack
```css
--font-sans: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Noto Sans KR', 'Segoe UI', sans-serif;
--font-mono: 'SF Mono', 'JetBrains Mono', 'Fira Code', monospace;
```

### Type Scale

| Element | Size | Weight | Color | Letter-spacing | Notes |
|---------|------|--------|-------|----------------|-------|
| Page Title | 22px | 800 | `--ink` | -0.4px | 페이지 대제목 |
| Section Title | 16px | 700 | `--ink` | -0.2px | 섹션 헤더 |
| Card Title · 강조 본문 | 14px | 600 | `--ink` | -0.2px | — |
| Body | 13px | 400 | `--txt` | -0.08px | 기본 정보 |
| Caption · 보조 라벨 | 11.5px | 500 | `--muted` | normal | — |
| Micro Label | 11px | 700 | `--muted` | 0.06em | uppercase 섹션 라벨 |
| Stat Number | 20px | 700 | contextual | -0.3px | — |

### Font Weight Map
- 400: 본문, 버튼, 입력, 네비게이션 — **기본값**
- 500: 활성 네비게이션, 캡션 강조
- 600: 카드 제목, 강조 본문, 배지
- 700: 섹션 제목, 통계 수치, 마이크로 라벨
- 800: 페이지 대제목만

---

## 4. Component Stylings

### Buttons
```
Base:    padding 8px 14px | radius 8px | font 13px/600 | gap 5px
SM:      padding 6px 12px | font 12px
Icon:    30×30px | radius 8px

Variants:
  Primary: bg var(--c-primary) → hover var(--c-primary-h) | text #fff | border none
  Ghost:   bg #fff | 1px solid var(--bd) → hover var(--bd2) | text var(--txt)
  Subtle:  bg var(--c-primary-l) | text var(--c-primary) | 1px solid var(--c-primary-l)
  Danger:  bg var(--c-red-50) | text var(--c-red)

Focus:   outline 2px solid var(--c-primary) | outline-offset 2px
```

### Cards
```
Standard: bg #fff | 1px solid var(--bd) | radius 8px(--r) | shadow 0 1px 2px rgba(20,30,50,.04)
          hover: shadow 0 4px 14px rgba(20,30,50,.08)
Kanban:   bg #fff | 1px solid var(--bd) | radius 8px | (선택적) 좌측 3px 액센트 바
큰 패널:   radius 12px(--r-lg)
```
> Apple v1과 달리 **카드에 1px 보더를 사용**한다 (배경 대비만으로 구분하지 않음).

### Badges · Chips
```
Base:   padding 3px 8px | radius 6px | font 11.5px/600
Variants (Tint 배경 + 해당 색 텍스트):
  Accent: bg var(--c-primary-l) text var(--c-primary)   예) STEP 02, v3
  Green:  bg var(--c-green-l)  text var(--c-green)       예) 활성, 서비스 중
  Violet: bg var(--c-purple-l) text var(--c-purple)      예) 검수 요청
  Amber:  bg var(--c-amber-l)  text var(--c-amber)       예) 작업 중, 편집버전
  Red:    bg var(--c-red-l)    text var(--c-red)         예) 긴급, 반려
Filter Chip:
  Default: pill | 1px solid var(--bd) | bg #fff | text var(--muted)
  Active:  bg var(--c-primary) | text #fff   (또는 var(--ink) 다크 pill)
```

### Progress Bar
```
Track: height 5~8px | bg var(--bg) | radius 5px
Fill:  radius 5px | bg var(--c-primary) 또는 그라데이션
       linear-gradient(90deg, var(--c-primary-h), var(--c-primary))
항상 '완료/전체 · 퍼센트' 라벨과 함께 표기.
```

### 상태 표시 (Status Dot)
```
7~9px 원형 점 + 상태 라벨(해당 상태 색). 카드 배경은 변경하지 않음.
미시작 slate · 작업중 amber · 검수요청 violet · 검수완료/서비스중 green · 긴급/반려 red
```

### Sidebar
```
딥 네이비 bg(#222A35) | width 가변 | 섹션 라벨(마이크로 11/700, 흰색 .55~.88 불투명)
Nav item: padding 8px 10px | gap 9px | radius 6px
Active:   bg var(--c-primary) 반투명 pill (rgba 액센트 .20) + 밝은 아이콘/텍스트
          우측 카운트 배지 (활성: 액센트 틴트)
로고:      네이비 라운드 사각 + 액센트 내부 사각 + 흰 라인 (viewBox 0 0 100 100)
하단:      사용자 프로필(아바타+이름+팀) + 환경 전환
```

### 상단바 / 환경 리본
```
좌: 페이지 아이콘 + 타이틀 + 설명(말줄임)
우: 검색(⌘K) → 테마 팔레트(4색 점) → 환경(STG/PRD 세그먼트) → 알림
환경 배지: STG bg var(--c-amber-l) text #B35C00 / PRD 중립
```

### Modals
```
Backdrop:  rgba(0,0,0,.4)
Container: bg #fff | radius 12px(--r-lg) | padding 20~24px
           shadow 0 10px 30px rgba(20,30,50,.12)
           width 380~480px
Title:     16px/700 | 본문 13px/400 var(--muted)
Actions:   flex | gap 8px | justify flex-end
유형:       Alert(단일확인) / Confirm(취소·실행) / Form·Editor / Detail / Toast
```

---

## 5. Layout Principles

### Spacing Scale (4px 기반)
- 8 / 12 / 16 / 20 / 24 / 32
- 컴포넌트 gap 6~12px · 패널 패딩 14~20px · 섹션 마진 16~24px · 페이지 패딩 22~28px

### App Shell
```
Sidebar(네이비, 가변) + Main Area(flex:1)
Main: [환경 리본] → [화면별 Page Header] → [Content Area, overflow-y:auto]
```

### Grid
- Card Grid: `repeat(auto-fill, minmax(300px, 1fr))`, gap 16px
- Stat/STEP Grid: `repeat(4, 1fr)` 또는 `repeat(3, 1fr)`, gap 10~16px

---

## 6. Depth & Elevation

### Shadow System
| Level | Value | Usage |
|-------|-------|-------|
| Card | `0 1px 2px rgba(20,30,50,.04)` | 기본 카드 |
| Hover | `0 4px 14px rgba(20,30,50,.08)` | 카드 호버 |
| Float | `0 10px 30px rgba(20,30,50,.12)` | 모달·토스트·드롭다운 |

### Radius System
| Token | Value | Usage |
|-------|-------|-------|
| `--r-sm` | 6px | 컨트롤·배지·칩 |
| `--r` | 8px | 버튼·입력·카드 |
| `--r-lg` | 12px | 큰 패널·모달 |

### Depth Philosophy
면 구분은 **1px 보더 + 미세 그림자**로 한다 (글래스/블러 제거). 사이드바는 솔리드 네이비.

---

## 7. Do's and Don'ts

### Do's
- ✅ 인터랙티브 요소는 **액센트(테마) 하나**로 집중 — 단일 블루 원칙
- ✅ 색상은 `var(--c-*)` 토큰으로 라우팅 — 하드코딩 hex 지양 (테마 전환 위해 필수)
- ✅ 카드·컨테이너에 **1px 보더** 사용 (`var(--bd)`)
- ✅ 상태색은 **점·라벨·배지에만** 절제 사용, 카드 배경은 화이트 유지
- ✅ 사이드바는 딥 네이비 솔리드, 활성 항목은 액센트 반투명 pill
- ✅ Pretendard 우선, 음수 letter-spacing
- ✅ 진행률 바는 항상 라벨과 함께

### Don'ts
- ❌ Apple Blue `#0071E3` 및 Apple 시스템 컬러(`#34C759`/`#FF9500`/`#FF3B30`/`#AF52DE`) 사용 금지 → 그래파이트/절제 상태색으로 대체
- ❌ 글래스 모피즘(backdrop blur) 사이드바 금지 → 솔리드 네이비
- ❌ 색상 하드코딩 금지(테마 전환 깨짐) → 변수 사용
- ❌ 무거운/다중 그림자 금지
- ❌ 순수 검정(#000) 텍스트 금지 → `--ink #1A2233`
- ❌ 추가 액센트 컬러 도입 금지

---

## 8. Agent Prompt Guide

### Quick Color Reference (graphite 기본)
```
Primary:  #3D6E9E  → hover #335E88  → deep #284C70  → tint #EEF3F8  → border #BACEE0
Green:    #1F9D5B  → tint #E9F6EF      Amber:  #C0820F  → tint #FAF2DF
Violet:   #7858C6  → tint #EFEBFA      Red:    #D54A3D  → tint #FBEBE9
Slate:    #94A0B2

Background #F4F6FA · Surface #FFFFFF · Sidebar 네이비 #222A35
Text: #1A2233(ink) → #3F4A5C(txt) → #7C8699(muted) → #A8B0BE(faint)
Border: #E7EBF2(기본) → #D7DDE8(강조)
테마 전환: graphite / indigo #4A57C0 / teal #0E8884 / classic #2C6BD4
```

### Reusable Prompt — 새 뷰
> "DESIGN.md의 Graphite 팔레트를 따라 [뷰]를 만들어줘. 배경 #F4F6FA, 카드는 #fff에 1px solid #E7EBF2 보더 radius 8px. 인터랙티브 요소는 var(--c-primary). 상태색은 점·배지에만. 색은 모두 var(--c-*) 토큰 사용."

---

## Appendix: CSS Variable Declaration (graphite 기본)

```css
:root {
  /* Brand (Graphite — 테마 전환 시 교체) */
  --c-primary: #3D6E9E;
  --c-primary-h: #335E88;
  --c-primary-d: #284C70;
  --c-primary-l: #EEF3F8;
  --c-primary-b: #BACEE0;

  /* Semantic (절제 상태색 — 고정) */
  --c-green: #1F9D5B;  --c-green-l: #E9F6EF;  --c-green-b: #B5DFC6;
  --c-amber: #C0820F;  --c-amber-l: #FAF2DF;  --c-amber-b: #EBD3A8;
  --c-red:   #D54A3D;  --c-red-l:   #FBEBE9;  --c-red-b:   #EFC4BF;
  --c-purple:#7858C6;  --c-purple-l:#EFEBFA;  --c-purple-b:#CFC2EC;
  --slate:   #94A0B2;

  /* Neutral (blue-tinted — 고정) */
  --c-gray-50:  #F8FAFC;
  --c-gray-100: #F4F6FA;
  --c-gray-150: #EDF0F5;
  --c-gray-200: #E7EBF2;
  --c-gray-300: #D7DDE8;
  --c-gray-400: #A8B0BE;
  --c-gray-500: #7C8699;
  --c-gray-600: #545E6E;
  --c-gray-700: #3F4A5C;
  --c-gray-900: #1A2233;

  /* Surface */
  --c-bg: #F4F6FA;
  --c-surface: #FFFFFF;
  --sb-bg: rgba(34,42,53,.96);
  --sb-hover: rgba(255,255,255,.08);
  --sb-text: rgba(255,255,255,.85);
  --sb-text-muted: rgba(255,255,255,.55);

  /* Radius */
  --radius-xs: 4px;  --radius-sm: 6px;  --radius: 8px;
  --radius-lg: 10px; --radius-xl: 12px; --radius-2xl: 14px; --radius-pill: 980px;

  /* Shadow */
  --shadow-xs: none;
  --shadow-sm: 0 1px 2px rgba(20,30,50,.04);
  --shadow:    0 4px 14px rgba(20,30,50,.08);
  --shadow-lg: 0 10px 30px rgba(20,30,50,.12);

  /* Typography */
  --font-sans: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Noto Sans KR', 'Segoe UI', sans-serif;
  --font-mono: 'SF Mono', 'JetBrains Mono', 'Fira Code', monospace;
}
```
