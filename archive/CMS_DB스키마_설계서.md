# CMS DB 스키마 설계서 — 정형 + 비정형 하이브리드 모델

## 1. 현재 구조의 DB 문제점

### 문제 1: 고정 컬럼 방식의 한계
현재 `DB_COLUMNS`에서 유형마다 컬럼을 하드코딩하고 있다.
운영자가 필드를 자유 추가/삭제하면, 전통적인 RDBMS에서는 **ALTER TABLE** 이 필요하다.

```
현재 방식 (위험)
┌──────────────────────────────────────────────┐
│ content_an2 테이블                            │
├──────┬────────┬───────┬──────┬───────────────┤
│  no  │ answer │ score │ note │ ???새컬럼???   │
├──────┼────────┼───────┼──────┼───────────────┤
│  1   │  ③    │  5    │      │               │
└──────┴────────┴───────┴──────┴───────────────┘
→ 운영자가 '언어' 필드 추가 시 ALTER TABLE 필요
→ 유형 19개 × 과목별 커스텀 = 테이블/컬럼 폭발
```

### 문제 2: 비정형 데이터 저장 불가
메모, 태그, 작업 히스토리, 참고 링크 등 비정형 데이터를 저장할 구조가 없다.

### 문제 3: 과목별 오버라이드 시 데이터 정합성
같은 AN2 유형인데 영어는 4컬럼, 수학은 3컬럼이면,
하나의 테이블로 관리할 수 없다.

---

## 2. 해결: 하이브리드 스키마

**핵심 전략**: 고정 구조(정형)와 유연 구조(비정형)를 분리하되, JSON 컬럼으로 연결한다.

```
┌──────────────────────────────────────────────────────────┐
│                    하이브리드 DB 모델                      │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  [정형 테이블]              [유연 저장소]                  │
│  ─────────────            ─────────────                  │
│  subjects                 content_data (JSONB)           │
│  courses                  context_notes (메모)            │
│  sets                     context_tags (태그)             │
│  content_items            context_links (링크)            │
│  field_definitions        field_values (EAV + JSONB)     │
│  type_fieldsets                                          │
│  subject_overrides                                       │
│                                                          │
│  [메타 테이블]                                            │
│  ─────────────                                           │
│  field_pool (글로벌 필드 정의)                             │
│  type_fieldsets (유형 기본 필드셋)                         │
│  subject_field_overrides (과목 커스텀)                     │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 3. 테이블 설계

### 3-1. 고정 구조 테이블 (변경 없음)

```sql
-- 과목
CREATE TABLE subjects (
  code        VARCHAR(10) PRIMARY KEY,   -- 'E', 'M', 'LN'
  name        VARCHAR(50) NOT NULL,       -- '영어', '수학'
  parent_code VARCHAR(10),                -- children 관계
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- 과정 (뉴드림스 배치 수신)
CREATE TABLE courses (
  id           SERIAL PRIMARY KEY,
  course_code  VARCHAR(20) UNIQUE,         -- 'C-NE1'
  course_name  VARCHAR(100),               -- 'New English 1'
  subject_code VARCHAR(10) REFERENCES subjects(code),
  source       VARCHAR(10) DEFAULT 'batch', -- 'batch' | 'manual'
  batch_date   DATE,
  created_at   TIMESTAMP DEFAULT NOW()
);

-- 세트 (뉴드림스 배치 수신)
CREATE TABLE sets (
  id          SERIAL PRIMARY KEY,
  set_code    VARCHAR(20) UNIQUE,          -- 'S-NE1-01'
  set_name    VARCHAR(100),
  course_id   INT REFERENCES courses(id),
  sort_order  INT DEFAULT 0,
  source      VARCHAR(10) DEFAULT 'batch'
);

-- 콘텐츠 아이템 (세트 × 유형 교차)
CREATE TABLE content_items (
  id          SERIAL PRIMARY KEY,
  set_id      INT REFERENCES sets(id),
  type_code   VARCHAR(10) NOT NULL,         -- 'AN2', 'FLC', 'VKS'
  status      VARCHAR(10) DEFAULT 'idle',   -- idle/inprog/done/review/reviewed/live
  assignee    VARCHAR(50),
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW(),
  UNIQUE(set_id, type_code)
);
```

### 3-2. 유연 구조: JSONB 기반 콘텐츠 데이터

```sql
-- ★ 핵심: 실제 콘텐츠 데이터를 JSONB로 저장
CREATE TABLE content_data (
  id              SERIAL PRIMARY KEY,
  content_item_id INT REFERENCES content_items(id),
  row_index       INT NOT NULL,              -- 행 번호 (문항번호 등)

  -- 정형 데이터 (JSONB)
  field_values    JSONB NOT NULL DEFAULT '{}',
  /*
    예시:
    AN2: {"no": "1", "answer": "③", "score": "5", "note": ""}
    FLC: {"front": "apple", "back": "사과", "image": "apple.jpg"}

    영어 AN2 (과목 커스텀 적용):
    {"no": "1", "answer": "③", "score": "5", "lang": "EN"}

    수학 AN2 (비고 제거):
    {"no": "1", "answer": "③", "score": "5"}
  */

  -- 파일 유형인 경우
  file_path       VARCHAR(500),
  file_size       BIGINT,
  file_type       VARCHAR(50),

  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW(),

  UNIQUE(content_item_id, row_index)
);

-- JSONB 검색을 위한 GIN 인덱스
CREATE INDEX idx_content_data_fields ON content_data USING GIN (field_values);
```

**왜 JSONB인가?**
- 운영자가 필드를 추가/삭제해도 ALTER TABLE 불필요
- 과목마다 다른 필드 조합을 하나의 테이블에 저장
- PostgreSQL GIN 인덱스로 JSONB 내부 검색 가능
- 필드 값의 유효성 검증은 애플리케이션 레이어에서 처리

### 3-3. 필드 관리 메타 테이블

```sql
-- 글로벌 필드 풀
CREATE TABLE field_pool (
  key         VARCHAR(30) PRIMARY KEY,     -- 'no', 'answer', 'score'
  label       VARCHAR(50) NOT NULL,         -- '문항번호', '정답'
  field_type  VARCHAR(20) NOT NULL,         -- 'text', 'number', 'select', 'textarea', 'file'
  category    VARCHAR(20),                  -- '공통', '평가', '핵심점검'
  options     JSONB,                        -- select 유형일 때 선택지
  is_custom   BOOLEAN DEFAULT FALSE,        -- 운영자 커스텀 필드 여부
  created_at  TIMESTAMP DEFAULT NOW()
);

-- 유형 기본 필드셋
CREATE TABLE type_fieldsets (
  type_code   VARCHAR(10),                  -- 'AN2'
  field_key   VARCHAR(30) REFERENCES field_pool(key),
  is_required BOOLEAN DEFAULT FALSE,
  sort_order  INT DEFAULT 0,
  PRIMARY KEY (type_code, field_key)
);

-- 과목 오버라이드
CREATE TABLE subject_field_overrides (
  subject_code VARCHAR(10) REFERENCES subjects(code),
  type_code    VARCHAR(10),
  field_key    VARCHAR(30) REFERENCES field_pool(key),
  action       VARCHAR(10) NOT NULL,         -- 'add', 'remove', 'set_required', 'set_optional'
  sort_order   INT DEFAULT 0,
  PRIMARY KEY (subject_code, type_code, field_key)
);
```

### 3-4. 비정형 컨텍스트 테이블

```sql
-- 자유 메모 (시간순 축적)
CREATE TABLE context_notes (
  id              SERIAL PRIMARY KEY,
  content_item_id INT REFERENCES content_items(id),
  text            TEXT NOT NULL,
  author          VARCHAR(50),
  is_pinned       BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_notes_item ON context_notes(content_item_id);
CREATE INDEX idx_notes_text ON context_notes USING GIN (to_tsvector('korean', text));

-- 태그 (다대다)
CREATE TABLE context_tags (
  id              SERIAL PRIMARY KEY,
  content_item_id INT REFERENCES content_items(id),
  tag             VARCHAR(50) NOT NULL,
  created_by      VARCHAR(50),
  created_at      TIMESTAMP DEFAULT NOW(),
  UNIQUE(content_item_id, tag)
);
CREATE INDEX idx_tags_tag ON context_tags(tag);

-- 참고 링크
CREATE TABLE context_links (
  id              SERIAL PRIMARY KEY,
  content_item_id INT REFERENCES content_items(id),
  label           VARCHAR(200),
  url             VARCHAR(500),
  created_by      VARCHAR(50),
  created_at      TIMESTAMP DEFAULT NOW()
);
```

---

## 4. 데이터 흐름 예시

### 운영자가 [영어] AN2에 '언어' 필드 추가할 때

```
1. subject_field_overrides 에 INSERT:
   (subject_code='E', type_code='AN2', field_key='lang', action='add')

2. 이미 저장된 content_data 에는 영향 없음
   (JSONB라서 기존 행에 "lang" 키가 없을 뿐)

3. 새로 입력하는 행부터 "lang" 값이 포함됨:
   {"no": "1", "answer": "③", "score": "5", "lang": "EN"}

4. 기존 데이터 마이그레이션이 필요하면:
   UPDATE content_data
   SET field_values = field_values || '{"lang": ""}'
   WHERE content_item_id IN (영어 과목의 AN2 아이템들);
```

### 비정형 컨텍스트 검색

```sql
-- '이미지교체' 태그가 붙은 모든 콘텐츠 찾기
SELECT ci.*, ct.tag
FROM content_items ci
JOIN context_tags ct ON ci.id = ct.content_item_id
WHERE ct.tag = '이미지교체';

-- 메모에서 '해상도' 텍스트 검색
SELECT ci.*, cn.text
FROM content_items ci
JOIN context_notes cn ON ci.id = cn.content_item_id
WHERE cn.text ILIKE '%해상도%';

-- 특정 필드 값으로 검색 (JSONB)
SELECT * FROM content_data
WHERE field_values->>'answer' = '③';

-- 언어가 EN인 콘텐츠만 조회
SELECT * FROM content_data
WHERE field_values->>'lang' = 'EN';
```

---

## 5. 필드 해석 런타임 로직

```javascript
// API 응답 시: content_item에 대해 필드 정의 + 실제 값을 함께 반환
async function getContentItemWithFields(contentItemId) {
  const item = await db.query('SELECT * FROM content_items WHERE id=$1', [contentItemId]);
  const course = await getCourse(item.set_id);
  const subjectCode = course.subject_code;
  const typeCode = item.type_code;

  // 1. 유형 기본 필드셋 조회
  const baseFields = await db.query(
    'SELECT * FROM type_fieldsets WHERE type_code=$1 ORDER BY sort_order', [typeCode]
  );

  // 2. 과목 오버라이드 조회
  const overrides = await db.query(
    'SELECT * FROM subject_field_overrides WHERE subject_code=$1 AND type_code=$2',
    [subjectCode, typeCode]
  );

  // 3. 필드 목록 계산 (기본셋 + 오버라이드 적용)
  let fields = baseFields.rows.map(f => ({...f}));
  for (const ov of overrides.rows) {
    if (ov.action === 'add') fields.push({field_key: ov.field_key, is_required: false});
    if (ov.action === 'remove') fields = fields.filter(f => f.field_key !== ov.field_key);
    if (ov.action === 'set_required') {
      const f = fields.find(f => f.field_key === ov.field_key);
      if (f) f.is_required = true;
    }
  }

  // 4. 실제 데이터 조회
  const data = await db.query(
    'SELECT * FROM content_data WHERE content_item_id=$1 ORDER BY row_index', [contentItemId]
  );

  // 5. 컨텍스트 조회
  const notes = await db.query(
    'SELECT * FROM context_notes WHERE content_item_id=$1 ORDER BY is_pinned DESC, created_at DESC',
    [contentItemId]
  );
  const tags = await db.query(
    'SELECT tag FROM context_tags WHERE content_item_id=$1', [contentItemId]
  );

  return {
    item,
    fieldDefinitions: fields,    // UI가 이걸로 폼 렌더링
    data: data.rows,             // JSONB 값들
    context: {
      notes: notes.rows,
      tags: tags.rows.map(r => r.tag),
    }
  };
}
```

---

## 6. 데이터 검증 전략

JSONB는 스키마 검증이 없으므로, 애플리케이션 레이어에서 검증한다.

```javascript
// 저장 시 검증
function validateContentData(fieldDefinitions, rowData) {
  const errors = [];

  for (const field of fieldDefinitions) {
    const value = rowData[field.field_key];

    // 필수 필드 체크
    if (field.is_required && (!value || value.trim() === '')) {
      errors.push({ field: field.field_key, msg: `${field.label}은(는) 필수입니다` });
    }

    // 타입 체크
    if (value && field.field_type === 'number' && isNaN(value)) {
      errors.push({ field: field.field_key, msg: `${field.label}은(는) 숫자여야 합니다` });
    }

    // select 옵션 체크
    if (value && field.options && !field.options.includes(value)) {
      errors.push({ field: field.field_key, msg: `${field.label}: 유효하지 않은 값` });
    }
  }

  // 미정의 필드가 있는지 체크 (허용하되 경고)
  const definedKeys = fieldDefinitions.map(f => f.field_key);
  const extraKeys = Object.keys(rowData).filter(k => !definedKeys.includes(k));
  if (extraKeys.length > 0) {
    // 경고만 (삭제하지 않음 — 과거 데이터 보존)
    console.warn('정의되지 않은 필드:', extraKeys);
  }

  return errors;
}
```

---

## 7. 전체 ERD 요약

```
subjects ─────┐
              │
courses ──────┤ (정형: 고정 구조)
              │
sets ─────────┤
              │
content_items ┼────── content_data (JSONB: 유연한 필드 값)
              │
              ├────── context_notes (비정형: 자유 메모)
              ├────── context_tags  (비정형: 태그)
              └────── context_links (비정형: 참고 링크)

field_pool ───────── type_fieldsets ───── subject_field_overrides
(글로벌 필드 정의)   (유형 기본셋)          (과목 커스텀)
```

**정형 데이터**: subjects → courses → sets → content_items (RDBMS 관계)
**유연 데이터**: content_data.field_values (JSONB, 필드 자유 구성)
**비정형 데이터**: context_notes/tags/links (텍스트 검색 가능)
**메타 데이터**: field_pool → type_fieldsets → subject_overrides (필드 정의 관리)
