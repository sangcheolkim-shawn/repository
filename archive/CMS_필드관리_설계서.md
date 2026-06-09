# CMS 운영자 필드 관리 설계서

## 1. 설계 목표

운영자가 **설정 메뉴**에서 과목별 입력 필드를 직접 제어할 수 있게 한다.
신규 과목 추가 시 필수 필드만 컴팩트하게 구성하고,
특정 과목에서만 쓰는 필드/모듈은 필요할 때만 불러와서 사용한다.

**핵심 효과**: 콘텐츠 등록 시 불필요한 빈 칸 제거 → 작업 시간 단축

---

## 2. 현재 구조 분석

### 과목 · 유형 · 필드 3계층

```
과목 (29개)                유형 (19개)              필드 (유형별 고정)
───────────              ─────────              ──────────────
[E] 영어           →     AN2, CBT, FLC...  →   문항번호, 정답, 배점...
[M] 수학           →     ANS, AN2, CBT...  →   문항번호, 정답, 해설...
[LN] 한글똑똑      →     ANS, EXP, VKS...  →   파일업로드(.mp3)...
[BN] 놀이똑똑      →     VKS, VOT          →   파일업로드(.mp3)...
```

### 현재 문제점
1. `SUBJECT_TYPE_MAP`: 과목→유형 매핑이 코드에 하드코딩
2. `DB_COLUMNS`: 유형별 컬럼이 코드에 하드코딩
3. 새 과목 추가 시 코드 수정 필요
4. 모든 유형의 모든 필드가 동일하게 표시 → 불필요한 필드가 화면을 차지

---

## 3. 새로운 3계층 모델

```
┌──────────────────────────────────────────────────────────┐
│                    설정 > 필드 관리                        │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Layer 1: 글로벌 필드 풀 (Global Field Pool)              │
│  ─────────────────────────────────────                   │
│  모든 유형에서 사용 가능한 필드 전체 목록                     │
│  운영자가 필드를 추가/수정/삭제                              │
│                                                          │
│  예) 문항번호, 정답, 배점, 해설, 난이도, 핵심어,             │
│      학습목표, 재생시간, 페이지수, 앞면텍스트...              │
│                                                          │
│  Layer 2: 유형 기본 필드셋 (Type Default FieldSet)         │
│  ─────────────────────────────────────                   │
│  각 유형(AN2, CBT 등)이 기본적으로 사용하는 필드 조합         │
│  글로벌 풀에서 끌어와서 구성                                 │
│                                                          │
│  예) AN2 기본셋 = [문항번호*, 정답*, 배점*, 비고]           │
│      CBT 기본셋 = [섹션*, 본문*, 핵심어]                   │
│                                                          │
│  Layer 3: 과목 커스텀 (Subject Override)                   │
│  ─────────────────────────────────────                   │
│  특정 과목에서 유형 기본셋을 그대로 쓰거나,                   │
│  필드를 추가/제거/필수↔선택 변경                             │
│                                                          │
│  예) [E] 영어의 AN2 = 기본셋 + [언어 선택*]               │
│      [M] 수학의 AN2 = 기본셋 - [비고] (비고 불필요)        │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 4. 데이터 구조

```javascript
// ═══ Layer 1: 글로벌 필드 풀 ═══
const FIELD_POOL = {
  no:       { key:'no',       label:'문항번호',   type:'number',   w:70,  category:'공통'   },
  answer:   { key:'answer',   label:'정답',       type:'text',     w:70,  category:'평가'   },
  score:    { key:'score',    label:'배점',       type:'number',   w:60,  category:'평가'   },
  note:     { key:'note',     label:'비고',       type:'text',     w:200, category:'공통'   },
  explain:  { key:'explain',  label:'해설',       type:'textarea', w:300, category:'평가'   },
  level:    { key:'level',    label:'난이도',     type:'select',   w:80,  category:'평가',
              opts:['쉬움','보통','어려움'] },
  section:  { key:'section',  label:'섹션',       type:'text',     w:100, category:'핵심점검' },
  content:  { key:'content',  label:'본문',       type:'textarea', w:400, category:'핵심점검' },
  keyword:  { key:'keyword',  label:'핵심어',     type:'text',     w:150, category:'핵심점검' },
  title:    { key:'title',    label:'제목',       type:'text',     w:200, category:'공통'   },
  desc:     { key:'desc',     label:'설명',       type:'textarea', w:300, category:'공통'   },
  image:    { key:'image',    label:'이미지 경로', type:'file',     w:200, category:'미디어' },
  front:    { key:'front',    label:'앞면텍스트',  type:'text',     w:200, category:'카드'   },
  back:     { key:'back',     label:'뒷면텍스트',  type:'text',     w:200, category:'카드'   },
  goal:     { key:'goal',     label:'학습목표',   type:'textarea', w:300, category:'교육'   },
  criteria: { key:'criteria', label:'달성기준',   type:'text',     w:250, category:'교육'   },
  weight:   { key:'weight',   label:'비중',       type:'number',   w:80,  category:'교육'   },
  step:     { key:'step',     label:'단계',       type:'text',     w:80,  category:'해설'   },
  concept:  { key:'concept',  label:'개념',       type:'text',     w:200, category:'해설'   },
  guide:    { key:'guide',    label:'학습안내',   type:'textarea', w:250, category:'해설'   },
  question: { key:'question', label:'문제',       type:'textarea', w:250, category:'평가'   },
  lang:     { key:'lang',     label:'언어',       type:'select',   w:70,  category:'공통',
              opts:['KO','EN','JP','CN'] },
  duration: { key:'duration', label:'재생시간',   type:'text',     w:80,  category:'미디어' },
  file:     { key:'file',     label:'파일명',     type:'file',     w:200, category:'미디어' },
  // 운영자가 추가한 커스텀 필드 예시
  tag:      { key:'tag',      label:'태그',       type:'text',     w:150, category:'운영',  custom:true },
  memo:     { key:'memo',     label:'작업메모',   type:'textarea', w:300, category:'운영',  custom:true },
};

// ═══ Layer 2: 유형 기본 필드셋 ═══
const TYPE_FIELDSETS = {
  AN2:  { fields: ['no','answer','score','note'],               required: ['no','answer','score'] },
  AN3:  { fields: ['no','answer','score','level'],              required: ['no','answer','score'] },
  ANS:  { fields: ['no','answer','explain'],                    required: ['no','answer']         },
  CBT:  { fields: ['section','content','keyword'],              required: ['section','content']    },
  CCV:  { fields: ['title','desc','image'],                     required: ['title']                },
  CGL:  { fields: ['goal','criteria','weight'],                 required: ['goal']                 },
  EVA:  { fields: ['no','question','answer','score'],           required: ['no','answer']          },
  EXP:  { fields: ['step','concept','explain'],                 required: ['step','concept']       },
  STDG: { fields: ['step','content','guide'],                   required: ['step','content']       },
  // 파일 유형은 필드가 적음 (주로 파일 업로드 + 메타)
  FLC:  { fields: ['front','back','image'],                     required: ['front','back']         },
  VKS:  { fields: ['file','duration','lang'],                   required: ['file']                 },
  VOT:  { fields: ['file','duration'],                          required: ['file']                 },
  VPV:  { fields: ['file','duration'],                          required: ['file']                 },
  VRV:  { fields: ['file','duration'],                          required: ['file']                 },
  VSO:  { fields: ['file','duration','lang'],                   required: ['file']                 },
  WEB:  { fields: ['title','file'],                             required: ['file']                 },
  RDC:  { fields: ['title','content','file'],                   required: ['title','file']         },
  ACT:  { fields: ['title','content','file'],                   required: ['title']                },
};

// ═══ Layer 3: 과목 커스텀 (오버라이드) ═══
// 과목이 유형 기본셋에서 필드를 추가/제거/필수변경할 때만 기록
// 기록이 없으면 = 기본셋 그대로 사용
const SUBJECT_OVERRIDES = {
  E: {  // 영어
    AN2: { addFields: ['lang'], addRequired: ['lang'] },   // 언어 필드 추가 (필수)
    FLC: { addFields: ['lang'], addRequired: [] },          // 언어 필드 추가 (선택)
  },
  M: {  // 수학
    AN2: { removeFields: ['note'] },   // 비고 필드 제거
  },
  LN: { // 한글똑똑
    ANS: { addFields: ['tag'], addRequired: [] },  // 운영 태그 추가
  },
};

// ═══ 런타임: 최종 필드 계산 ═══
function getFieldsForSubjectType(subjectCode, typeCode) {
  const base = TYPE_FIELDSETS[typeCode];
  if (!base) return { fields: [], required: [] };

  let fields = [...base.fields];
  let required = [...base.required];

  const override = SUBJECT_OVERRIDES[subjectCode]?.[typeCode];
  if (override) {
    if (override.addFields)    fields = [...fields, ...override.addFields];
    if (override.removeFields) fields = fields.filter(f => !override.removeFields.includes(f));
    if (override.addRequired)  required = [...required, ...override.addRequired];
    if (override.removeRequired) required = required.filter(f => !override.removeRequired.includes(f));
  }

  return {
    fields: fields.map(key => ({
      ...FIELD_POOL[key],
      required: required.includes(key)
    })),
    required
  };
}
```

---

## 5. 설정 UI 구조

### 설정 > 필드 관리 (3개 탭)

```
┌─────────────────────────────────────────────────────────┐
│  ⚙️ 설정                                                │
├──────┬──────────────────────────────────────────────────┤
│      │  [글로벌 필드 풀]  [유형 기본셋]  [과목 커스텀]     │
│ 메뉴 ├──────────────────────────────────────────────────┤
│      │                                                  │
│ 연동  │  (탭별 내용)                                     │
│ 필드  │                                                  │
│ 권한  │                                                  │
│ 감사  │                                                  │
│      │                                                  │
└──────┴──────────────────────────────────────────────────┘
```

### 탭 1: 글로벌 필드 풀
- 전체 필드 목록 CRUD
- 카테고리별 그룹핑 (공통, 평가, 핵심점검, 미디어, 해설, 카드, 교육, 운영)
- 커스텀 필드 추가 기능

### 탭 2: 유형 기본 필드셋
- 유형 선택 → 해당 유형의 기본 필드 구성
- 글로벌 풀에서 드래그 또는 체크박스로 필드 추가/제거
- 필수/선택 토글

### 탭 3: 과목 커스텀
- 과목 선택 → 해당 과목이 사용하는 유형 목록
- 유형별로 "기본셋 그대로" 또는 "커스텀" 선택
- 커스텀 시: 필드 추가/제거/필수변경

---

## 6. 콘텐츠 등록 화면에 미치는 변화

### Before
```
[AN2 채점] 영어 NE1 / 1세트
┌────────────────────────────────────┐
│ 문항번호 │ 정답 │ 배점 │ 비고      │  ← 4개 컬럼 (유형 기본)
│ 1       │     │     │           │
│ ...     │     │     │           │
└────────────────────────────────────┘
→ 언어 정보가 필요한데 없음
→ 비고는 불필요한데 공간 차지
```

### After (과목 커스텀 적용)
```
[AN2 채점] 영어 NE1 / 1세트
┌──────────────────────────────────────┐
│ 문항번호* │ 정답* │ 배점* │ 언어*     │  ← 영어는 비고 대신 언어
│ 1        │      │      │ [EN ▼]    │
│ ...      │      │      │           │
└──────────────────────────────────────┘
→ 필수 필드만 콤팩트하게
→ 과목에 맞는 필드만 표시
```

### 수학의 경우
```
[AN2 채점] 수학 기초수학 / 1세트
┌─────────────────────────┐
│ 문항번호* │ 정답* │ 배점* │  ← 수학은 비고 제거 (3컬럼만)
│ 1        │      │      │
│ ...      │      │      │
└─────────────────────────┘
→ 더 콤팩트
```

---

## 7. 모듈 개념: 파일 업로드 + 내용 채우기

유형을 2가지 작업 모듈로 분리:

| 모듈 | 대상 유형 | 작업 내용 |
|------|----------|----------|
| **DB 입력 모듈** | AN2, AN3, ANS, EVA, EXP, STDG, CBT, CCV, CGL | 그리드에 데이터 입력 (엑셀 임포트 가능) |
| **파일 업로드 모듈** | VKS, VOT, VPV, VRV, VSO, FLC, ACT, WEB, RDC | 파일 드래그&드롭 + 최소 메타 |

과목에서 사용하는 유형만 해당 모듈이 활성화:
- 놀이똑똑(BN): VKS, VOT만 사용 → **파일 업로드 모듈만** 표시
- 수학(M): ANS, AN2, AN3, CBT, STDG → **DB 입력 모듈만** 표시
- 영어(E): AN2, CBT, FLC, WEB 등 혼합 → **두 모듈 모두** 표시

---

## 8. 작업 시간 단축 효과

| 현재 | 개선 후 | 단축 효과 |
|------|---------|----------|
| 모든 유형에 동일한 빈 폼 표시 | 과목별 필요한 필드만 표시 | 입력 항목 20~40% 감소 |
| 신규 과목은 코드 수정 필요 | 설정 화면에서 즉시 구성 | 개발 의존도 제거 |
| 파일+DB 구분 없이 혼합 | 모듈별 특화 UI | 작업 동선 단순화 |
| 전 과목 동일 워크플로우 | 과목별 커스텀 가능 | 불필요한 단계 스킵 |
