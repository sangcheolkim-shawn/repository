# DESIGN.md — Daekyo CMS Prototype (Apple Style)

> AI 에이전트가 이 파일을 읽고, CMS 프로토타입과 **동일한 시각 언어**로 일관된 UI를 생성하도록 한다.
> 형식 참조: [awesome-design-md](https://github.com/VoltAgent/awesome-design-md)
> 디자인 기반: Apple Human Interface Guidelines 적응형 — 관리 도구(Admin Tool) 밀도로 재해석

---

## 1. Visual Theme & Atmosphere

### Design Philosophy
- **Apple HIG 적응형** — Apple의 절제된 미학을 교육 CMS 관리 도구 밀도로 재해석
- **단일 액센트 컬러** — Apple Blue(`#0071E3`)만을 인터랙티브 요소에 사용, 나머지는 중립 톤
- **글래스 모피즘 사이드바** — 반투명 다크 배경 + backdrop-filter blur로 Apple 내비게이션 언어 적용
- **그림자 최소주의** — 대부분의 요소는 그림자 없음, 필요시 하나의 부드러운 확산 그림자만 사용
- **테두리 최소화** — 카드와 컨테이너는 테두리 대신 배경색 대비로 영역 구분
- **타이트한 타이포그래피** — 모든 크기에서 음수 letter-spacing 적용, 압축되고 효율적인 텍스트

### Personality
- 정제되고 절제된 (every pixel counts)
- 기능 중심이되, 시각적으로 프리미엄한 느낌
- 한국어 UI 기본 (SF Pro → Pretendard 폴백)

---

## 2. Color Palette & Roles

### Brand / Interactive

| Token | Hex | Role |
|-------|-----|------|
| `--c-primary` | `#0071E3` | 주요 CTA, 활성 상태, 포커스 링 (Apple Blue) |
| `--c-primary-h` | `#0077ED` | 주요 버튼 호버 (밝아짐) |
| `--c-primary-l` | `#E8F2FF` | 선택/활성 배경, 배지 |
| `--c-primary-b` | `#B3D7FF` | 포커스 링, 테두리 |

### Semantic Colors

| Token | Hex | Role |
|-------|-----|------|
| `--c-green` | `#34C759` | 성공, 완료, 승인 (Apple Green) |
| `--c-green-l` | `#F0FFF4` | 성공 연한 배경 |
| `--c-green-b` | `#A8E6B8` | 성공 테두리 |
| `--c-amber` | `#FF9500` | 경고, 진행중 (Apple Orange) |
| `--c-amber-l` | `#FFF8F0` | 경고 연한 배경 |
| `--c-amber-b` | `#FFD9A8` | 경고 테두리 |
| `--c-red` | `#FF3B30` | 오류, 삭제, 긴급 (Apple Red) |
| `--c-red-l` | `#FFF2F1` | 오류 연한 배경 |
| `--c-red-b` | `#FFB3AE` | 오류 테두리 |
| `--c-purple` | `#AF52DE` | 검수, 특수 상태 (Apple Purple) |
| `--c-purple-l` | `#F9F0FF` | 퍼플 연한 배경 |
| `--c-purple-b` | `#D9B3F0` | 퍼플 테두리 |

### Neutral Scale (Apple Gray)

| Token | Hex | Role |
|-------|-----|------|
| `--c-gray-50` | `#FAFAFA` | 호버 배경, 대체 행 |
| `--c-gray-100` | `#F5F5F7` | 섹션 배경 (Apple Light Gray) |
| `--c-gray-150` | `#ECECF0` | 카드 내부 구분 |
| `--c-gray-200` | `#E5E5EA` | 기본 구분선 (Apple Separator) |
| `--c-gray-300` | `#D1D1D6` | 호버 테두리 |
| `--c-gray-400` | `#AEAEB2` | 보조 텍스트, 비활성 아이콘 |
| `--c-gray-500` | `#8E8E93` | 라벨, 설명 (Apple Secondary Label) |
| `--c-gray-600` | `#636366` | 기본 텍스트 보조 |
| `--c-gray-700` | `#48484A` | 입력 텍스트 |
| `--c-gray-800` | `#2C2C2E` | 강조 텍스트 |
| `--c-gray-900` | `#1D1D1F` | 본문 텍스트 (Apple Near Black) |

### Surface Colors

| Token | Hex | Role |
|-------|-----|------|
| `--c-bg` | `#F5F5F7` | 페이지 배경 (Apple Light Gray) |
| `--c-surface` | `#FFFFFF` | 카드, 패널 배경 |
| `--sb-bg` | `rgba(44,44,46,.96)` | 사이드바 배경 (반투명 다크 + blur) |

### Target System Colors (서비스 플랫폼 구분)

| Key | Background | Text | Border | Label |
|-----|-----------|------|--------|-------|
| ND | `#E8F2FF` | `#0055B8` | `#B3D7FF` | 뉴드림스 |
| NH | `#F9F0FF` | `#8944AB` | `#D9B3F0` | 눈높이 |
| SJ | `#F0FFF4` | `#1B8A3E` | `#A8E6B8` | 성장판 |
| NH365 | `#FFF8F0` | `#B35C00` | `#FFD9A8` | 눈높이365 |

---

## 3. Typography Rules

### Font Stack
```css
--font-sans: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Pretendard', 'Noto Sans KR', 'Helvetica Neue', sans-serif;
--font-mono: 'SF Mono', 'JetBrains Mono', 'Fira Code', monospace;
```

### Type Scale

| Element | Size | Weight | Color | Letter-spacing | Line-height | Notes |
|---------|------|--------|-------|----------------|-------------|-------|
| Body | 14px | 400 | `--c-gray-900` | -0.15px | 1.47 | SF Pro Text 영역 |
| Page Header Title | 15px | 600 | `--c-gray-900` | -0.24px | 1.2 | 세미볼드, 타이트 |
| Card Title | 16px | 600 | `--c-gray-900` | -0.32px | 1.19 | — |
| Section Title | 14px | 600 | `--c-gray-900` | -0.15px | 1.2 | — |
| Section Label | 11px | 600 | `--c-gray-400` | 0.06em | 1.3 | uppercase |
| Sidebar Nav | 13px | 400 (500 active) | `--sb-text` | -0.08px | 1.3 | — |
| Button | 13px | 400 | inherit | normal | 1.0 | Apple 버튼은 light weight |
| Button XS/SM | 11px | 500 | inherit | normal | 1.0 | — |
| Badge | 11px | 500 | contextual | normal | 1.0 | — |
| Meta/Caption | 12px | 400 | `--c-gray-500` | -0.12px | 1.33 | — |
| Stat Number | 20px | 600 | contextual | -0.3px | 1.0 | — |
| Input | 13px | 400 | `--c-gray-700` | -0.08px | 1.47 | — |
| Table Header | 11px | 600 | `--c-gray-400` | 0.02em | 1.3 | uppercase |
| Table Cell | 13px | 400 | `--c-gray-900` | -0.08px | 1.47 | — |

### Font Weight Map (Apple 절제)
- 300: 대형 장식 텍스트 (거의 사용하지 않음)
- 400: 본문, 버튼, 입력, 네비게이션 — **기본값**
- 500: 활성 네비게이션, 배지, 강조 캡션
- 600: 제목, 섹션 헤더, 통계 수치 — **최대 일반 사용**
- 700: 극히 드물게, 특수 강조에만

---

## 4. Component Stylings

### Buttons

```
Base:     padding: 7px 14px | radius: 8px | font: 13px/400 | gap: 5px
XS:       padding: 4px 10px | font: 11px
SM:       padding: 6px 12px | font: 11px
Icon:     30×30px | center-aligned | radius: 8px

Variants:
  Primary:  bg #0071E3 → hover #0077ED (밝아짐) | text #fff | border: none
  Ghost:    bg #FFFFFF | border: 1px solid #E5E5EA → hover #D1D1D6 | text #636366
  Green:    bg #34C759 → hover #30B350 | text #fff
  Red:      bg #FF3B30 → hover #E6352B | text #fff
  Disabled: opacity 0.3 | cursor: not-allowed

Focus:    outline: 2px solid #0071E3 | outline-offset: 2px
Transition: all .2s ease
```

### Cards

```
Standard Card:
  bg: #fff | border: none | radius: 12px
  shadow: none (기본) → hover: 0 4px 24px rgba(0,0,0,.08)

Kanban Card:
  bg: #fff | border: none | radius: 10px
  shadow: 0 1px 3px rgba(0,0,0,.06)
  border-left: 3px solid [phase-color]
  hover: shadow 0 4px 16px rgba(0,0,0,.1)

New/Empty Card:
  border: 2px dashed #B3D7FF | radius: 12px | bg: transparent
  hover: bg #E8F2FF
```

### Badges

```
Base:     padding: 3px 8px | radius: 6px | font: 11px/500 | letter-spacing: normal
Variants:
  Blue:   bg #E8F2FF | text #0055B8
  Green:  bg #F0FFF4 | text #1B8A3E
  Amber:  bg #FFF8F0 | text #B35C00
  Red:    bg #FFF2F1 | text #D32F2F
  Purple: bg #F9F0FF | text #8944AB
  Gray:   bg #F5F5F7 | text #8E8E93

System Badge: font: 11px/500 | padding: 3px 8px | radius: 6px | per target system colors
```

### Chips (Filter)

```
Default:  padding: 5px 12px | radius: 980px (pill) | font: 12px/400
          border: 1px solid #E5E5EA | bg: #FAFAFA | text: #636366
Hover:    bg: #F5F5F7 | border-color: #D1D1D6
Active:   bg: #1D1D1F | border-color: #1D1D1F | text: #fff
```

### Inputs

```
Text Input:
  border: 1px solid #E5E5EA | radius: 8px | padding: 8px 12px | font: 13px
  bg: #FFFFFF
  focus: border-color #0071E3 | box-shadow: 0 0 0 3px rgba(0,113,227,.15)
  placeholder: #AEAEB2

Search Input (wrapped):
  wrapper: bg #F5F5F7 | radius: 10px | padding: 8px 12px | border: none
  icon: #AEAEB2 (left)
  focus-within: bg #FFFFFF | box-shadow: 0 0 0 3px rgba(0,113,227,.15)

Select:
  border: 1px solid #E5E5EA | radius: 8px | padding: 8px 12px | font: 13px
  focus: border-color #0071E3

Label: font: 12px/500 | color: #636366 | margin-bottom: 5px
```

### Tables

```
Container: bg #fff | radius: 12px | overflow: hidden | border: none
           shadow: 0 1px 3px rgba(0,0,0,.04)
Header:   bg #F5F5F7 | font: 11px/600 | color: #8E8E93 | uppercase
          padding: 10px 14px | border-bottom: none
Cell:     font: 13px | padding: 10px 14px | color: #1D1D1F
          border-bottom: 1px solid #F5F5F7 (매우 연한 구분)
Row Hover: bg #FAFAFA
Stripe:   없음 — Apple은 교대 배경을 사용하지 않음 (호버로 구분)
```

### Modals

```
Backdrop:  bg: rgba(0,0,0,.4) | backdrop-filter: blur(20px) saturate(180%)
Container: bg: #fff | radius: 14px | padding: 24px
           shadow: 0 24px 48px rgba(0,0,0,.12)
           width: 400–480px | max-width: 90vw
Title:     font: 17px/600 | letter-spacing: -0.37px
Body Text: font: 13px | color: #636366 | line-height: 1.47
Actions:   flex | gap: 8px | justify: flex-end
```

### Notices (Alert Strip)

```
Base:     radius: 10px | padding: 12px 14px | border: none
Blue:     bg #E8F2FF | text #0055B8
Yellow:   bg #FFF8F0 | text #B35C00
Green:    bg #F0FFF4 | text #1B8A3E
```

### Progress Bar

```
Track:  height: 4px | bg: #E5E5EA | radius: 2px
Fill:   radius: 2px | transition: width .3s ease
Colors: 100% → #34C759 | >0% → #FF9500 | 0% → #E5E5EA
```

---

## 5. Layout Principles

### Spacing Scale (8px 기반)
- 2px, 4px, 6px, 8px, 10px, 12px, 14px, 16px, 20px, 24px, 32px, 48px
- 컴포넌트 gap: 6–12px
- 패널 패딩: 14–20px
- 섹션 간 마진: 16–24px

### App Shell Layout

```
┌──────────────────────────────────────────────────┐
│ App Shell (flex, height: 100vh)                   │
│ ┌──────────┬────────────────────────────────────┐ │
│ │ Sidebar  │  Main Area                         │ │
│ │ 228px    │  flex: 1                           │ │
│ │ glass    │  ┌──────────────────────────────┐  │ │
│ │ dark     │  │ Page Header (52px)           │  │ │
│ │          │  ├──────────────────────────────┤  │ │
│ │          │  │ Content Area (flex: 1)       │  │ │
│ │          │  │ overflow-y: auto             │  │ │
│ │          │  └──────────────────────────────┘  │ │
│ └──────────┴────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

### Sidebar (Glass Morphism)
- Width: 228px, fixed
- Background: `rgba(30,30,32,.92)` + `backdrop-filter: saturate(180%) blur(20px)`
- Nav item: padding 8px 10px, gap 9px, radius 8px
- Active: `rgba(0,113,227,.2)` 배경 + 좌측 3px 블루 바
- Section label: 11px, weight 600, color `rgba(255,255,255,.35)`

### Grid Systems
- Card Grid: `repeat(auto-fill, minmax(300px, 1fr))`, gap 16px
- Stat Grid: `repeat(3, 1fr)`, gap 10px
- Filter Bar: flex-wrap, gap 8px

### Whitespace Philosophy
- Apple 스타일의 여유로운 간격 — 하지만 관리 도구 밀도를 유지
- 카드 내 패딩 16–20px, 섹션 간 16–24px
- 테두리 대신 **배경색 대비**로 영역 구분 (카드 #fff vs 배경 #F5F5F7)

---

## 6. Depth & Elevation

### Shadow System (극도로 절제)

| Level | Value | Usage |
|-------|-------|-------|
| None (기본) | — | 대부분의 카드, 컨테이너 — Apple은 그림자를 거의 안 씀 |
| Subtle | `0 1px 3px rgba(0,0,0,.04)` | 테이블 컨테이너, 미세 상승 |
| Medium | `0 4px 24px rgba(0,0,0,.08)` | 카드 호버, 플로팅 요소 |
| Large | `0 24px 48px rgba(0,0,0,.12)` | 모달, 드롭다운 |
| Glass | `backdrop-filter: saturate(180%) blur(20px)` | 사이드바, 모달 배경 |

### Radius System

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-xs` | `4px` | 내부 소형 요소 |
| `--radius-sm` | `6px` | 배지, 태그 |
| `--radius` | `8px` | 버튼, 입력, 기본 카드 내부 |
| `--radius-lg` | `10px` | 검색 바, 알림 |
| `--radius-xl` | `12px` | 카드, 테이블 컨테이너 |
| `--radius-2xl` | `14px` | 모달 |
| `--radius-pill` | `980px` | 칩, 필터 pill |

### Depth Philosophy
Apple은 그림자를 극도로 아끼며, 대부분의 깊이 표현을 **배경색 대비**와 **글래스 효과**로 대체한다.
- 카드는 `#FFFFFF` on `#F5F5F7` — 배경 대비만으로 영역 구분
- 호버 시에만 미세한 그림자 등장
- 사이드바의 translucent glass가 가장 눈에 띄는 깊이 요소

---

## 7. Do's and Don'ts

### Do's
- ✅ 인터랙티브 요소에는 **오직 Apple Blue(`#0071E3`)**만 사용 — 단일 액센트 원칙
- ✅ 모든 텍스트 크기에서 음수 letter-spacing 적용 (-0.08px ~ -0.37px)
- ✅ font-weight는 400(기본)과 600(강조)을 주로 사용 — 700은 극히 드물게
- ✅ 카드와 컨테이너는 **테두리 없이** 배경색 대비로 구분
- ✅ 필터 칩은 980px radius pill 형태
- ✅ 사이드바에 글래스 모피즘(반투명 + blur) 적용
- ✅ 포커스 링은 `outline: 2px solid #0071E3; outline-offset: 2px`
- ✅ 상태 색상(성공/경고/오류)은 Apple 시스템 컬러 사용
- ✅ transition은 `.2s ease` 기본 — Apple의 부드러운 애니메이션

### Don'ts
- ❌ 추가 액센트 컬러 도입 금지 — 전체 색상 예산은 블루 하나에 집중
- ❌ 무거운 그림자나 다중 레이어 그림자 사용 금지 — 하나의 부드러운 확산 그림자 또는 없음
- ❌ 카드/컨테이너에 테두리 사용 자제 — 테두리 대신 배경색 대비
- ❌ font-weight 800, 900 사용 금지 — Apple은 최대 700, 일반적으로 600까지
- ❌ 배경에 텍스처, 패턴, 그래디언트 사용 금지 — 솔리드 컬러만
- ❌ 순수 검정(#000)을 텍스트에 사용 금지 — #1D1D1F(Near Black) 사용
- ❌ 넓은 letter-spacing 사용 금지 — Apple 폰트는 항상 타이트하게
- ❌ 아이콘에 filled 스타일 사용 금지 — stroke 기반, 가벼운 선

---

## 8. Responsive Behavior

### Current Strategy
- **데스크톱 전용 프로토타입** — 최소 너비 ~1200px
- 사이드바 228px 고정, 메인 영역 flex: 1
- 카드 그리드: auto-fill, minmax(300px, 1fr)

### Breakpoint Hints (향후)
| Breakpoint | Behavior |
|-----------|----------|
| ≥1440px | 전체 레이아웃, 3–4열 |
| 1024–1439px | 2–3열 |
| 768–1023px | 사이드바 축소, 2열 |
| <768px | 사이드바 오버레이, 1열 |

### Touch Targets
- 버튼 최소 크기: 30×30px (Icon 버튼)
- 네비게이션: 최소 높이 36px
- 필터 칩: 최소 높이 28px

### Scrollbar
```css
::-webkit-scrollbar { width: 8px; height: 8px }
::-webkit-scrollbar-track { background: transparent }
::-webkit-scrollbar-thumb { background: rgba(0,0,0,.15); border-radius: 4px }
::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,.3) }
```

---

## 9. Agent Prompt Guide

### Quick Color Reference
```
Primary:  #0071E3 (interactive) → light: #E8F2FF  → border: #B3D7FF
Green:    #34C759 (success)     → light: #F0FFF4  → border: #A8E6B8
Amber:    #FF9500 (warning)     → light: #FFF8F0  → border: #FFD9A8
Red:      #FF3B30 (danger)      → light: #FFF2F1  → border: #FFB3AE
Purple:   #AF52DE (review)      → light: #F9F0FF  → border: #D9B3F0

Background: #F5F5F7   Surface: #FFFFFF   Sidebar: rgba(30,30,32,.92)
Text: #1D1D1F → #2C2C2E → #48484A → #636366 → #8E8E93 → #AEAEB2
Border: #E5E5EA (default) → #D1D1D6 (hover)
```

### Reusable Prompts

**새 뷰/페이지를 만들 때:**
> "DESIGN.md의 Apple 스타일 팔레트를 따라서 [뷰 이름]을 만들어줘.
> 배경 #F5F5F7, 카드는 #fff에 테두리 없이 radius 12px.
> 인터랙티브 요소는 오직 #0071E3만 사용. 그림자는 최소화."

**카드 컴포넌트를 만들 때:**
> "bg #fff, 테두리 없음, radius 12px의 카드를 만들어줘.
> 그림자도 기본 없음. 호버 시에만 0 4px 24px rgba(0,0,0,.08).
> 내부 패딩 16–20px. 제목은 16px weight 600 letter-spacing -0.32px."

**테이블을 만들 때:**
> "테이블 컨테이너: bg #fff, radius 12px, shadow 0 1px 3px rgba(0,0,0,.04).
> 헤더: bg #F5F5F7, 11px/600 uppercase #8E8E93, padding 10px 14px.
> 셀: 13px/400, border-bottom 1px solid #F5F5F7. 호버 bg #FAFAFA."

**타겟 시스템 배지를 표시할 때:**
> "ND: bg #E8F2FF text #0055B8 border #B3D7FF,
> NH: bg #F9F0FF text #8944AB border #D9B3F0,
> SJ: bg #F0FFF4 text #1B8A3E border #A8E6B8,
> NH365: bg #FFF8F0 text #B35C00 border #FFD9A8.
> radius 6px, font 11px/500."

**모달을 만들 때:**
> "backdrop rgba(0,0,0,.4) + backdrop-filter blur(20px) saturate(180%).
> 모달 bg #fff radius 14px padding 24px shadow 0 24px 48px rgba(0,0,0,.12).
> 제목 17px/600, 본문 13px/400 color #636366."

---

## Appendix: CSS Variable Declaration

```css
:root {
  /* Brand (Apple Blue) */
  --c-primary: #0071E3;
  --c-primary-h: #0077ED;
  --c-primary-l: #E8F2FF;
  --c-primary-b: #B3D7FF;

  /* Semantic (Apple System Colors) */
  --c-green: #34C759;
  --c-green-l: #F0FFF4;
  --c-green-b: #A8E6B8;
  --c-amber: #FF9500;
  --c-amber-l: #FFF8F0;
  --c-amber-b: #FFD9A8;
  --c-red: #FF3B30;
  --c-red-l: #FFF2F1;
  --c-red-b: #FFB3AE;
  --c-purple: #AF52DE;
  --c-purple-l: #F9F0FF;
  --c-purple-b: #D9B3F0;

  /* Neutral (Apple Gray) */
  --c-gray-50: #FAFAFA;
  --c-gray-100: #F5F5F7;
  --c-gray-150: #ECECF0;
  --c-gray-200: #E5E5EA;
  --c-gray-300: #D1D1D6;
  --c-gray-400: #AEAEB2;
  --c-gray-500: #8E8E93;
  --c-gray-600: #636366;
  --c-gray-700: #48484A;
  --c-gray-800: #2C2C2E;
  --c-gray-900: #1D1D1F;

  /* Surface */
  --c-bg: #F5F5F7;
  --c-surface: #FFFFFF;
  --sb-bg: rgba(44,44,46,.96);
  --sb-hover: rgba(255,255,255,.08);
  --sb-text: rgba(255,255,255,.85);
  --sb-text-muted: rgba(255,255,255,.55);

  /* Radius */
  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius: 8px;
  --radius-lg: 10px;
  --radius-xl: 12px;
  --radius-2xl: 14px;
  --radius-pill: 980px;

  /* Shadow (극도로 절제) */
  --shadow-xs: none;
  --shadow-sm: 0 1px 3px rgba(0,0,0,.04);
  --shadow: 0 4px 24px rgba(0,0,0,.08);
  --shadow-lg: 0 24px 48px rgba(0,0,0,.12);

  /* Typography */
  --font-sans: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Pretendard', 'Noto Sans KR', 'Helvetica Neue', sans-serif;
  --font-mono: 'SF Mono', 'JetBrains Mono', 'Fira Code', monospace;
}
```
