# Tab Translator

브라우저 탭의 음성을 실시간으로 인식하고 번역하는 Chrome 확장 프로그램입니다.

## 주요 기능

- 탭 오디오 실시간 캡처 및 음성 인식(STT)
- 다국어 실시간 번역 (무료/유료 모델 선택 가능)
- Chrome Side Panel UI
- OpenRouter API 키를 통한 유료 모델 지원

## 기술 스택

| 영역 | 기술 |
|------|------|
| UI | React 19, TypeScript 5.8, Tailwind CSS 3.4 |
| 상태 관리 | Zustand 5, TanStack React Query 5 |
| 빌드 | Vite 6, @crxjs/vite-plugin |
| 오디오 | Web Audio API, AudioWorklet (16kHz 리샘플링) |
| 통신 | WebSocket (실시간 스트리밍), REST API |
| 테스트 | Vitest, React Testing Library |
| 확장 프로그램 | Chrome Manifest V3 |

## 프로젝트 구조

```
src/
├── background/          # Chrome 백그라운드 서비스 워커
├── sidepanel/           # Side Panel 진입점 (App.tsx)
├── components/          # React 컴포넌트
│   ├── ui/              # 기본 UI 컴포넌트 (Button, Card 등)
│   ├── ModelSelector    # 번역 모델 선택 (Free/Fast/Premium)
│   ├── LanguageSelector # 번역 대상 언어 선택
│   ├── RecordButton     # 녹음 시작/중지
│   ├── TranscriptPanel  # 번역 결과 표시
│   ├── SettingsPanel    # API 키 관리
│   └── ErrorAlert       # 에러 표시
├── hooks/               # 커스텀 훅
│   ├── useRecorder      # 녹음 흐름 제어
│   ├── useModels        # 모델 목록 조회
│   └── useLanguages     # 언어 목록 조회
├── services/            # 서비스 레이어
│   ├── AudioRecorderService  # 탭 오디오 캡처 및 리샘플링
│   ├── WebSocketService      # WebSocket 통신
│   ├── api                   # REST API 호출
│   └── chromeMessaging       # Chrome 메시지 패싱
├── stores/              # Zustand 스토어
│   ├── useRecorderStore      # 녹음 상태 (status, sessionId, error)
│   └── useTranslationStore   # 번역 세그먼트 관리
└── types/               # TypeScript 타입 정의
```

## 데이터 흐름

```
브라우저 탭 오디오
  → Chrome tabCapture API
  → AudioRecorderService (AudioWorklet 16kHz 리샘플링)
  → WebSocket 스트리밍
  → 백엔드 서버 (STT + 번역)
  → WebSocket 응답
  → Zustand 스토어
  → TranscriptPanel UI 업데이트
```

## 시작하기

### 사전 준비

- Node.js 18+
- pnpm

### 설치

```bash
pnpm install
```

### 환경 변수

`.env` 파일에서 백엔드 엔드포인트를 설정합니다:

```env
VITE_API_URL=https://stt-translator-2kz3uzazsa-du.a.run.app
VITE_WS_URL=wss://stt-translator-2kz3uzazsa-du.a.run.app
```

### 개발

```bash
pnpm dev
```

빌드된 확장 프로그램을 Chrome에 로드하려면:

1. `chrome://extensions` 접속
2. "개발자 모드" 활성화
3. "압축해제된 확장 프로그램을 로드합니다" 클릭
4. `dist` 폴더 선택

### 빌드

```bash
pnpm build
```

### 테스트

```bash
pnpm test              # 테스트 실행
pnpm test:watch        # 워치 모드
pnpm test:coverage     # 커버리지 리포트
```

### 린트 및 타입 체크

```bash
pnpm lint
pnpm typecheck
```

## 번역 모델

모델 목록은 서버에서 동적으로 가져오며, 세 가지 등급으로 분류됩니다:

| 등급 | 설명 | API 키 |
|------|------|--------|
| Free | 무료 모델 | 불필요 |
| Fast | 빠른 유료 모델 | OpenRouter 키 필요 |
| Premium | 고품질 유료 모델 | OpenRouter 키 필요 |

유료 모델을 사용하려면 Settings 탭에서 [OpenRouter](https://openrouter.ai) API 키를 등록하세요.
