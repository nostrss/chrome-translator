# Chrome Translator

실시간 음성 녹음 및 번역을 위한 Chrome Extension입니다.

## 주요 기능

- Side Panel에서 실시간 음성 녹음
- WebSocket을 통한 오디오 스트리밍
- 실시간 번역 결과 표시
- 다국어 지원 (소스/타겟 언어 선택)

## 시작하기

### 사전 요구사항

- Node.js 18+
- pnpm (권장) 또는 npm

### 설치

```bash
# 의존성 설치
pnpm install

# 환경 변수 설정
cp .env.example .env
# .env 파일에서 API/WebSocket URL 설정
```

### 개발

```bash
# 개발 서버 시작
pnpm run dev
```

Chrome에서 확장 프로그램 로드:
1. `chrome://extensions` 접속
2. "개발자 모드" 활성화
3. "압축해제된 확장 프로그램을 로드합니다" 클릭
4. `dist` 폴더 선택

### 빌드

```bash
# 프로덕션 빌드
pnpm run build
```

## 환경 변수

| 변수 | 설명 |
|------|------|
| `VITE_API_URL` | 번역 API 서버 URL |
| `VITE_WS_URL` | WebSocket 서버 URL |

## 프로젝트 구조

```
src/
├── background/          # Service Worker
├── sidepanel/           # Side Panel 진입점
├── features/
│   └── recorder/        # 녹음/번역 기능
│       ├── model/       # 상태 관리 (Redux)
│       ├── intent/      # 사이드 이펙트 (Epic)
│       ├── view/        # React 컴포넌트
│       └── services/    # WebSocket, AudioRecorder
├── store/               # Redux 스토어 설정
└── shared/              # 공통 유틸리티
```

## 스크립트

```bash
pnpm run dev          # 개발 서버
pnpm run build        # 프로덕션 빌드
pnpm run test         # 테스트 실행
pnpm run lint         # ESLint
pnpm run typecheck    # 타입 체크
```

## 기술 스택

- **Frontend**: React 19, TypeScript
- **상태 관리**: Redux Toolkit, redux-observable (RxJS)
- **빌드**: Vite, CRXJS
- **스타일**: Tailwind CSS
- **테스트**: Vitest

## 라이선스

MIT
