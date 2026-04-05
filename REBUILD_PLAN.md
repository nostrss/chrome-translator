# Chrome Translator Extension - 전체 재구축 플랜

## Context

기존 Chrome 확장프로그램(Tab Translator)을 완전히 삭제하고 새로 구축한다.
실시간 음성 인식(STT) + 번역 기능을 제공하는 Chrome Side Panel 확장프로그램이며,
백엔드 서버 스펙은 `FRONTEND_INTEGRATION.md`에 정의되어 있다.

## 기술 스택

| 항목 | 선택 |
|------|------|
| UI | React 19 + Tailwind CSS 4 + shadcn/ui |
| 상태관리 | Zustand |
| 서버 상태 | TanStack Query (언어 목록 등 REST API) |
| 테스트 | Vitest + React Testing Library |
| 빌드 | Vite + @crxjs/vite-plugin |
| 패키지 매니저 | pnpm |
| 언어 | TypeScript (strict) |

## 디렉토리 구조

```
chrome-translator/
├── public/
│   ├── icons/                    # 확장프로그램 아이콘
│   └── worklets/
│       └── resampler-processor.js
├── src/
│   ├── background/
│   │   └── service-worker.ts     # Chrome tabCapture 핸들러
│   ├── sidepanel/
│   │   ├── index.html            # Side Panel 엔트리 HTML
│   │   ├── main.tsx              # React 엔트리포인트
│   │   └── index.css             # Tailwind 글로벌 스타일
│   ├── components/
│   │   ├── ui/                   # shadcn/ui 컴포넌트
│   │   ├── LanguageSelector.tsx  # 언어 선택 드롭다운
│   │   ├── RecordButton.tsx      # 녹음 시작/중지 버튼
│   │   ├── RecordingStatus.tsx   # 녹음 상태 표시
│   │   └── TranscriptPanel.tsx   # 자막/번역 결과 표시
│   ├── hooks/
│   │   ├── useRecorder.ts        # 녹음 + WebSocket 통합 훅
│   │   └── useLanguages.ts       # TanStack Query 언어 목록 훅
│   ├── services/
│   │   ├── WebSocketService.ts   # WebSocket 클라이언트
│   │   ├── AudioRecorderService.ts # Web Audio API 마이크 캡처
│   │   └── api.ts                # REST API 클라이언트 (언어 목록)
│   ├── stores/
│   │   ├── useRecorderStore.ts   # 녹음 상태 (Zustand)
│   │   └── useTranslationStore.ts # 번역 결과 (Zustand)
│   ├── types/
│   │   ├── websocket.ts          # WebSocket 메시지 타입
│   │   └── chrome.ts             # Chrome 메시징 타입
│   └── lib/
│       └── utils.ts              # shadcn/ui cn() 유틸리티
├── tests/
│   ├── setup.ts
│   ├── services/
│   │   └── WebSocketService.test.ts
│   └── hooks/
│       └── useLanguages.test.ts
├── manifest.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── components.json               # shadcn/ui 설정
├── package.json
└── .env.example
```

## 구현 단계

### Step 1: 프로젝트 초기화
- 기존 소스 파일 전부 삭제 (FRONTEND_INTEGRATION.md, REBUILD_PLAN.md, manifest.json 보존)
- `manifest.json`은 기존 것을 유지 (경로만 새 구조에 맞게 조정)
- `package.json` 새로 작성, 의존성 설치
- Vite + CRXJS + TypeScript + Tailwind + PostCSS 설정
- shadcn/ui 초기 설정 (`components.json`, `lib/utils.ts`)
- `.env.example` 작성

### Step 2: Chrome Extension 기반 구조
- `src/background/service-worker.ts` — Side Panel 열기 + tabCapture
- `src/sidepanel/index.html` + `main.tsx` — React 앱 마운트
- 빌드 확인 (pnpm dev로 Chrome에 로드 가능한 상태)

### Step 3: 타입 정의
- `src/types/websocket.ts` — 서버 스펙 기반 WebSocket 메시지 타입 전체 정의
  - ClientEvent: `connect`, `start_speech`, `audio_chunk`, `stop_speech`
  - ServerEvent: `connected`, `speech_started`, `speech_result`, `speech_stopped`, `translation_result`, `error`
  - StartSpeechData: `languageCode`, `targetLanguageCode`, `translationMode` (`standard` | `advanced`)
  - ErrorCode: 12개 에러 코드 (`VAD_TIMEOUT`, `SESSION_TIMEOUT`, `TOO_MANY_SESSIONS` 등)
- `src/types/chrome.ts` — Chrome 메시징 타입

### Step 4: 서비스 레이어
- `src/services/api.ts` — REST API 클라이언트
  - `fetchSttLanguages(query?)` — `GET /api/languages/stt`
  - `fetchTranslationLanguages(query?)` — `GET /api/languages/translation`
  - `checkHealth()` — `GET /health` (서버 상태 확인)
- `src/services/WebSocketService.ts` — WebSocket 클라이언트
  - 이벤트 순서: `connect` → `start_speech` → `audio_chunk` 반복 → `stop_speech`
  - 에러 핸들링: 12개 에러 코드별 분기 처리
  - 재연결 로직: `VAD_TIMEOUT`, `SESSION_TIMEOUT` 시 자동 정리 + 재연결 유도
- `src/services/AudioRecorderService.ts` — 마이크 캡처
  - PCM 16bit, 16kHz, 모노
  - Float32 → Int16 변환, Base64 인코딩
  - 청크 크기 64KB 이하 보장

### Step 5: 상태 관리
- `src/stores/useRecorderStore.ts` — 녹음 상태
  - 상태: IDLE → CONNECTING → CONNECTED → RECORDING → STOPPED
  - STOPPED → RECORDING 재시작 지원
  - sessionId, error 정보 포함
- `src/stores/useTranslationStore.ts` — 번역 결과
  - `interimTranscript` / `interimTranslation`: 실시간 덮어쓰기
  - `finalSegments[]`: 확정된 원문+번역 쌍 누적
  - `clear()`: 결과 초기화

### Step 6: Hooks
- `src/hooks/useLanguages.ts` — TanStack Query
  - `useSttLanguages(query?)` — STT 지원 언어 목록 (별도 API)
  - `useTranslationLanguages(query?)` — 번역 지원 언어 목록 (별도 API)
  - staleTime 설정으로 Rate Limit (30 req/min) 대응
- `src/hooks/useRecorder.ts` — WebSocket + AudioRecorder + Store 통합
  - `start(sourceLanguage, targetLanguage, translationMode)` — 연결 + 녹음 시작
  - `stop()` — 녹음 중지
  - 에러 발생 시 Store 업데이트 + 리소스 정리

### Step 7: UI 컴포넌트
- shadcn/ui 기본 컴포넌트 설치 (Button, Select, Card, ScrollArea, Badge, Separator, Alert 등)
- `LanguageSelector` — 소스(STT) / 타겟(Translation) 언어를 각각 별도 API에서 로드
- `TranslationModeSelector` — `standard` / `advanced` 번역 모드 선택 (토글 or Select)
- `RecordButton` — 녹음 시작/중지, STOPPED에서 재시작 지원
- `RecordingStatus` — 현재 상태 표시 (연결중, 녹음중, 경과 시간)
- `TranscriptPanel` — 실시간 자막 + 번역 표시 (interim 덮어쓰기, final 누적)
- `ErrorAlert` — 에러 발생 시 사용자 안내 (에러 코드별 메시지)

### Step 8: 테스트
- WebSocketService 단위 테스트 (연결, 메시지 송수신, 에러 핸들링)
- useLanguages 훅 테스트 (STT/번역 언어 분리 확인)
- 컴포넌트 렌더링 테스트
- Store 테스트 (상태 전이, segment 누적)

### Step 9: 마무리
- 아이콘 생성/배치
- .env.example 문서화
- 빌드 + Chrome 로드 테스트

## UI 디자인

### 레이아웃 (Side Panel ~400px 고정 너비)

```
┌──────────────────────────────┐
│  Tab Translator         v2.0 │  ← 헤더 (앱 이름 + 상태 뱃지)
├──────────────────────────────┤
│                              │
│  Source Language              │
│  ┌────────────────────────┐  │  ← 소스 언어 Select
│  │ Korean            ▾    │  │
│  └────────────────────────┘  │
│                              │
│  Target Language              │
│  ┌────────────────────────┐  │  ← 타겟 언어 Select
│  │ English            ▾   │  │
│  └────────────────────────┘  │
│                              │
│  Translation Mode             │
│  ┌─────────┐ ┌────────────┐  │  ← 번역 모드 토글
│  │Standard │ │  Advanced  │  │
│  └─────────┘ └────────────┘  │
│                              │
│       ┌──────────────┐       │
│       │  ● Recording │       │  ← 녹음 버튼 (토글)
│       └──────────────┘       │
│                              │
│  ● Connected · 00:32         │  ← 상태 표시 (연결/녹음중/시간)
├──────────────────────────────┤
│  ⚠ VAD_TIMEOUT: 30초간...    │  ← 에러 Alert (발생 시에만)
├──────────────────────────────┤
│                              │
│  ┌────────────────────────┐  │
│  │ 안녕하세요, 오늘 회의를  │  │  ← 원문 (interim: 흐린 색)
│  │ 시작하겠습니다.         │  │
│  │                        │  │
│  │ Hello, let's start     │  │  ← 번역 (구분선 아래)
│  │ today's meeting.       │  │
│  ├────────────────────────┤  │
│  │ 첫 번째 안건은...       │  │  ← 다음 세그먼트
│  │                        │  │
│  │ The first agenda is... │  │
│  ├────────────────────────┤  │
│  │ ...                    │  │  ← 자동 스크롤 (최신이 아래)
│  └────────────────────────┘  │
│                              │
└──────────────────────────────┘
```

### 영역 구성

| 영역 | 설명 |
|------|------|
| **헤더** (최상단) | 앱 이름 + 연결 상태 Badge (Connected/Disconnected) |
| **컨트롤 영역** (상단) | 언어 Select 2개 + 녹음 Button + 상태 표시 |
| **자막 영역** (하단, 스크롤) | 원문 + 번역이 Card 단위로 누적. interim은 마지막 카드에서 실시간 덮어쓰기, final 확정 시 새 카드 추가 |

### 상태별 UI 변화

| 상태 | 녹음 버튼 | 상태 텍스트 | 자막 영역 |
|------|-----------|-------------|-----------|
| IDLE | `Start` (기본) | — | 비어있음 or 안내 문구 |
| CONNECTING | `...` (disabled) | "Connecting..." | — |
| RECORDING | `Stop` (빨간색) | "● Recording · 00:32" | 실시간 업데이트 |
| STOPPED | `Start` (기본) | "Stopped" | 결과 유지 |

### shadcn/ui 컴포넌트 매핑

| UI 요소 | shadcn 컴포넌트 | 비고 |
|---------|----------------|------|
| 언어 드롭다운 | `Select` | STT 언어 / 번역 언어 각각 별도 |
| 번역 모드 | `Button` (group) | Standard / Advanced 토글 |
| 녹음 버튼 | `Button` | variant 변경으로 상태 표현 |
| 상태 뱃지 | `Badge` | Connected/Disconnected/Recording |
| 에러 알림 | `Alert` | 에러 발생 시 코드별 안내 메시지 |
| 자막 세그먼트 | `Card` | 원문 + 번역 한 쌍 |
| 자막 스크롤 | `ScrollArea` | 자동 스크롤, 최신이 하단 |
| 영역 구분 | `Separator` | 컨트롤/자막 영역 구분 |

### 스타일 규칙

- 모든 UI 텍스트(라벨, 버튼, 안내 문구, 에러 메시지)는 **영어**로 통일
- interim 텍스트: `text-muted-foreground` (흐린 색)으로 구분
- final 텍스트: `text-foreground` (기본 색)
- 다크모드: shadcn 기본 테마 CSS variables 활용
- 녹음 중 버튼: `variant="destructive"` (빨간색)

## 핵심 설정

### manifest.json (기존 유지, 경로 변경 완료)
- `side_panel.default_path`: `src/chrome/sidepanel/sidepanel.html` → `src/sidepanel/index.html`
- `background.service_worker`: `src/chrome/background/service-worker.ts` → `src/background/service-worker.ts`

### 환경변수 (.env.example)
```
VITE_API_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080
```

## 검증 방법

1. `pnpm dev` → Chrome에서 확장프로그램 로드 → Side Panel 열림 확인
2. 언어 선택 드롭다운에 서버에서 받은 언어 목록 표시 확인
3. 녹음 버튼 클릭 → WebSocket 연결 → 마이크 캡처 → 실시간 자막 표시
4. 번역 결과 실시간 표시 (interim 덮어쓰기, final 누적)
5. `pnpm test` → 전체 테스트 통과
6. `pnpm build` → 프로덕션 빌드 성공
