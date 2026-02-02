# MVI 아키텍처 리팩토링 가이드

> Redux + redux-observable (RxJS)에서 Zustand로의 마이그레이션

## 목차

1. [현재 아키텍처 분석](#1-현재-아키텍처-분석)
2. [권장 접근법: Zustand](#2-권장-접근법-zustand)
3. [새로운 디렉토리 구조](#3-새로운-디렉토리-구조)
4. [코드 변환 예시](#4-코드-변환-예시)
5. [마이그레이션 로드맵](#5-마이그레이션-로드맵)
6. [예상 결과물](#6-예상-결과물)
7. [Best Practices 적용 항목](#7-best-practices-적용-항목)

---

## 1. 현재 아키텍처 분석

### 1.1 MVI 패턴 구조

현재 프로젝트는 **Model-View-Intent** 패턴을 구현한 React + Redux + RxJS 아키텍처를 사용합니다.

```
View (React) → dispatch(action) → Intent (Epic) → Model (Redux State) → View
```

#### 레이어 구조

| 레이어 | 위치 | 역할 |
|--------|------|------|
| **Model** | `features/recorder/model/` | 상태 정의, 리듀서, 셀렉터 |
| **View** | `features/recorder/view/` | React 컴포넌트 |
| **Intent** | `features/recorder/intent/` | Redux-Observable Epic (사이드 이펙트) |
| **Services** | `features/recorder/services/` | WebSocket, AudioRecorder 등 외부 서비스 |

#### 현재 디렉토리 구조

```
src/features/recorder/
├── model/
│   ├── types.ts              # TypeScript 타입 정의 (263줄)
│   ├── recorderSlice.ts      # Redux Slice (315줄)
│   └── recorderSelectors.ts  # 메모이제이션된 셀렉터 (116줄)
├── intent/
│   └── recorderEpic.ts       # RxJS Epic 배열 (602줄)
├── services/
│   ├── WebSocketService.ts   # WebSocket 관리 (250줄)
│   ├── AudioRecorderService.ts # 오디오 녹음 (197줄)
│   └── WavEncoder.ts         # 오디오 인코딩
├── view/
│   ├── RecorderPanel.tsx     # 메인 UI
│   ├── RecordButton.tsx      # 녹음 버튼
│   ├── RecordingStatus.tsx   # 녹음 상태
│   ├── LanguageDropdown.tsx  # 언어 선택
│   ├── TargetLanguageDropdown.tsx
│   └── TranscriptDisplay.tsx # 번역 결과
└── index.ts
```

### 1.2 문제점 분석

#### A. Epic 복잡성

`recorderEpic.ts`는 602줄로, 13개의 Epic이 복잡한 RxJS 연산자 체인으로 구성되어 있습니다.

**startRecordingEpic 예시 (높은 복잡도):**

```typescript
// 현재: 다단계 중첩된 RxJS 연산자
export const startRecordingEpic: RecorderEpic = (action$, state$) =>
  action$.pipe(
    ofType(startRecording.type),
    withLatestFrom(state$),
    switchMap(([, state]) => {
      const selectedLanguage = selectSelectedLanguage(state)
      const targetLanguage = selectTargetLanguage(state)

      return concat(
        of(webSocketConnecting()),
        from(wsService.connect(WS_URL)).pipe(
          switchMap((connectResult) => {
            if (connectResult.isErr) {
              return of(recordingError(connectResult.error.message))
            }

            wsService.sendConnect(selectedLanguage.code, targetLanguage.code)

            return race(
              wsService.waitForConnected().pipe(
                switchMap(() => {
                  // 4단계 더 중첩...
                }),
              ),
              timer(5000).pipe(
                switchMap(() => of(recordingError('Connection timeout'))),
              ),
            )
          }),
        ),
      )
    }),
  )
```

**문제점:**
- 7단계까지 중첩된 `switchMap`, `concat`, `race` 연산자
- 데이터 흐름을 추적하기 어려움
- 디버깅 시 콜스택이 깊어짐

#### B. 과도한 보일러플레이트

| 항목 | 개수 | 설명 |
|------|------|------|
| **액션** | 27개 | 상태 변경마다 별도 액션 필요 |
| **셀렉터** | 22개 | 각 상태 조각마다 셀렉터 정의 |
| **Epic** | 13개 | 사이드 이펙트별 Epic 분리 |

**recorderSlice.ts의 액션 목록:**

```typescript
// 녹음 제어 (6개)
startRecording, recordingStarted, stopRecording,
recordingCompleted, recordingError, resetRecorder

// WebSocket 연결 (4개)
webSocketConnecting, webSocketConnected,
webSocketDisconnected, webSocketError

// STT 세션 (6개)
sttConnected, sttStarting, sttStarted,
sttStopping, sttStopped, sttError

// 언어 관리 (5개)
fetchLanguages, fetchLanguagesSuccess, fetchLanguagesFailure,
selectLanguage, selectTargetLanguage

// Transcript & Translation (5개)
updateInterimTranscript, addFinalTranscript, clearTranscript,
updateTranslation, clearTranslation

// 기타 (1개)
updateElapsedTime
```

#### C. RxJS 학습 곡선

RxJS의 주요 진입 장벽:

1. **Observable 개념**: 동기/비동기 스트림의 통합 모델
2. **연산자 암기**: `switchMap`, `mergeMap`, `concatMap`, `exhaustMap`의 차이
3. **구독 관리**: `takeUntil`, `unsubscribe` 패턴
4. **에러 처리**: `catchError`, `retry`, `retryWhen` 조합
5. **테스트**: 마블 다이어그램, TestScheduler 이해

### 1.3 현재 코드 통계

| 항목 | 값 |
|------|-----|
| **전체 라인 수** | 2,193줄 |
| **Model 레이어** | 694줄 |
| **Intent 레이어** | 602줄 |
| **Services** | 447줄 |
| **총 액션 수** | 27개 |
| **총 셀렉터 수** | 22개 |
| **총 Epic 수** | 13개 |
| **의존성** | redux, @reduxjs/toolkit, redux-observable, rxjs |

---

## 2. 권장 접근법: Zustand

### 2.1 Zustand 소개

[Zustand](https://github.com/pmndrs/zustand)는 간결하고 확장 가능한 상태 관리 라이브러리입니다.

**핵심 특징:**
- **미니멀 API**: `create()` 함수 하나로 스토어 생성
- **보일러플레이트 없음**: 액션 타입, 리듀서, 셀렉터 불필요
- **번들 크기**: ~2KB (gzipped)
- **TypeScript 지원**: 내장 타입 추론

### 2.2 Redux 대비 장점

#### 보일러플레이트 80% 감소

**Before (Redux):**

```typescript
// types.ts
interface RecorderState { status: RecordingStatus; /* ... */ }

// recorderSlice.ts
const recorderSlice = createSlice({
  name: 'recorder',
  initialState,
  reducers: {
    startRecording: (state) => { state.status = 'starting' },
    recordingStarted: (state) => { state.status = 'recording' },
    stopRecording: (state) => { state.status = 'stopping' },
    // 24개 더...
  },
})
export const { startRecording, recordingStarted, /* ... */ } = recorderSlice.actions

// recorderSelectors.ts
export const selectStatus = (state: RootState) => state.recorder.status
export const selectIsRecording = createSelector(
  [selectStatus],
  (status) => status === 'recording'
)
// 20개 더...

// recorderEpic.ts (602줄의 Epic 코드...)
```

**After (Zustand):**

```typescript
// useRecorderStore.ts
interface RecorderStore {
  status: RecordingStatus
  startRecording: () => Promise<void>
  stopRecording: () => Promise<void>
}

export const useRecorderStore = create<RecorderStore>((set, get) => ({
  status: 'idle',

  startRecording: async () => {
    set({ status: 'starting' })
    await connectWebSocket()
    set({ status: 'recording' })
  },

  stopRecording: async () => {
    set({ status: 'stopping' })
    await disconnectWebSocket()
    set({ status: 'idle' })
  },
}))
```

#### RxJS 의존성 제거

- **제거되는 의존성**: `rxjs`, `redux-observable`
- **번들 크기 절감**: ~30KB (gzipped)
- **학습 곡선 완화**: Observable 대신 익숙한 Promise/async-await 사용

#### 직관적인 비동기 처리

```typescript
// Zustand: async/await로 직관적인 흐름
startRecording: async () => {
  set({ status: 'connecting' })

  try {
    await wsService.connect()
    await wsService.sendConnect(language, targetLanguage)
    await wsService.waitForConnected()

    set({ status: 'starting_stt' })
    await audioService.startRecording()
    wsService.sendStartSpeech()
    await wsService.waitForSpeechStarted()

    set({ status: 'recording', startTime: Date.now() })
  } catch (error) {
    set({ status: 'error', error: error.message })
  }
}
```

---

## 3. 새로운 디렉토리 구조

```
src/features/recorder/
├── stores/
│   ├── useRecorderStore.ts      # 녹음 상태 관리 (status, error, elapsedTime)
│   ├── useLanguageStore.ts      # 언어 목록 관리 (languages, selected)
│   └── useTranslationStore.ts   # 번역 결과 관리 (transcript, translation)
├── services/
│   ├── webSocketService.ts      # Promise 기반으로 단순화
│   └── audioRecorderService.ts  # Promise 기반으로 단순화
├── hooks/
│   └── useRecorder.ts           # 녹음 로직 통합 훅 (스토어 + 서비스 조합)
├── view/
│   ├── RecorderPanel.tsx
│   ├── RecordButton.tsx
│   ├── RecordingStatus.tsx
│   ├── LanguageDropdown.tsx
│   ├── TargetLanguageDropdown.tsx
│   └── TranscriptDisplay.tsx
└── index.ts
```

### 3.1 스토어 분리 전략

| 스토어 | 책임 | 상태 |
|--------|------|------|
| **useRecorderStore** | 녹음 제어 | status, error, elapsedTime, startTime |
| **useLanguageStore** | 언어 관리 | languages, selectedLanguage, targetLanguage |
| **useTranslationStore** | 번역 결과 | transcript, interimTranscript, translation |

**분리 이유:**
1. **단일 책임 원칙**: 각 스토어가 명확한 도메인 담당
2. **선택적 구독**: 필요한 상태만 구독하여 불필요한 리렌더링 방지
3. **테스트 용이성**: 독립적인 스토어 단위 테스트 가능

---

## 4. 코드 변환 예시

### 4.1 recorderSlice.ts → useRecorderStore.ts

**Before (Redux Slice):**

```typescript
// model/recorderSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface RecorderState {
  status: RecordingStatus
  webSocketStatus: WebSocketStatus
  sttStatus: SttStatus
  error: string | null
  elapsedTime: number
}

const initialState: RecorderState = {
  status: 'idle',
  webSocketStatus: 'disconnected',
  sttStatus: 'idle',
  error: null,
  elapsedTime: 0,
}

const recorderSlice = createSlice({
  name: 'recorder',
  initialState,
  reducers: {
    startRecording: (state) => {
      state.status = 'starting'
      state.error = null
    },
    recordingStarted: (state) => {
      state.status = 'recording'
    },
    stopRecording: (state) => {
      state.status = 'stopping'
    },
    recordingCompleted: (state) => {
      state.status = 'idle'
      state.elapsedTime = 0
    },
    recordingError: (state, action: PayloadAction<string>) => {
      state.status = 'error'
      state.error = action.payload
    },
    webSocketConnecting: (state) => {
      state.webSocketStatus = 'connecting'
    },
    webSocketConnected: (state) => {
      state.webSocketStatus = 'connected'
    },
    webSocketDisconnected: (state) => {
      state.webSocketStatus = 'disconnected'
    },
    updateElapsedTime: (state, action: PayloadAction<number>) => {
      state.elapsedTime = action.payload
    },
    // ... 18개 더
  },
})

export const {
  startRecording,
  recordingStarted,
  stopRecording,
  recordingCompleted,
  recordingError,
  webSocketConnecting,
  webSocketConnected,
  webSocketDisconnected,
  updateElapsedTime,
  // ... 18개 더
} = recorderSlice.actions

export default recorderSlice.reducer
```

**After (Zustand Store):**

```typescript
// stores/useRecorderStore.ts
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

type RecordingStatus = 'idle' | 'connecting' | 'recording' | 'stopping' | 'error'

interface RecorderState {
  // 상태
  status: RecordingStatus
  error: string | null
  startTime: number | null

  // 파생 상태 (getter)
  isRecording: () => boolean
  canStartRecording: () => boolean
  canStopRecording: () => boolean
  getElapsedTime: () => number

  // 액션
  setConnecting: () => void
  setRecording: () => void
  setStopping: () => void
  setIdle: () => void
  setError: (error: string) => void
  reset: () => void
}

const initialState = {
  status: 'idle' as RecordingStatus,
  error: null,
  startTime: null,
}

export const useRecorderStore = create<RecorderState>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // 파생 상태
    isRecording: () => get().status === 'recording',
    canStartRecording: () => get().status === 'idle' || get().status === 'error',
    canStopRecording: () => get().status === 'recording',
    getElapsedTime: () => {
      const { startTime } = get()
      return startTime ? Math.floor((Date.now() - startTime) / 1000) : 0
    },

    // 액션
    setConnecting: () => set({ status: 'connecting', error: null }),
    setRecording: () => set({ status: 'recording', startTime: Date.now() }),
    setStopping: () => set({ status: 'stopping' }),
    setIdle: () => set({ status: 'idle', startTime: null }),
    setError: (error) => set({ status: 'error', error }),
    reset: () => set(initialState),
  }))
)

// 컴포넌트 외부에서 상태 접근 (서비스, 훅에서 사용)
export const recorderStore = useRecorderStore
```

### 4.2 recorderEpic.ts → useRecorder.ts

**Before (Redux-Observable Epic):**

```typescript
// intent/recorderEpic.ts (602줄 중 일부)
import { Epic } from 'redux-observable'
import { from, of, concat, race, timer } from 'rxjs'
import { switchMap, withLatestFrom, catchError, tap, takeUntil, filter } from 'rxjs/operators'

export const startRecordingEpic: RecorderEpic = (action$, state$) =>
  action$.pipe(
    ofType(startRecording.type),
    withLatestFrom(state$),
    switchMap(([, state]) => {
      const selectedLanguage = selectSelectedLanguage(state)
      const targetLanguage = selectTargetLanguage(state)

      return concat(
        of(webSocketConnecting()),
        from(wsService.connect(WS_URL)).pipe(
          switchMap((connectResult) => {
            if (connectResult.isErr) {
              return of(recordingError(connectResult.error.message))
            }

            wsService.sendConnect(selectedLanguage.code, targetLanguage.code)

            return race(
              wsService.waitForConnected().pipe(
                switchMap(() => {
                  return concat(
                    of(webSocketConnected()),
                    of(sttStarting()),
                    from(audioRecorderService.startRecording()).pipe(
                      switchMap((audioResult) => {
                        if (audioResult.isErr) {
                          return of(recordingError(audioResult.error.message))
                        }

                        wsService.sendStartSpeech()

                        return race(
                          wsService.waitForSpeechStarted().pipe(
                            switchMap(() =>
                              concat(of(sttStarted()), of(recordingStarted()))
                            ),
                          ),
                          timer(5000).pipe(
                            switchMap(() =>
                              of(recordingError('Speech start timeout'))
                            ),
                          ),
                        )
                      }),
                    ),
                  )
                }),
              ),
              timer(5000).pipe(
                switchMap(() => of(recordingError('Connection timeout'))),
              ),
            )
          }),
          catchError((error) => of(recordingError(error.message))),
        ),
      )
    }),
  )

export const streamAudioChunksEpic: RecorderEpic = (action$) =>
  action$.pipe(
    ofType(recordingStarted.type),
    switchMap(() =>
      audioRecorderService.audioChunks$.pipe(
        tap((chunk) => wsService.sendAudioChunk(chunk)),
        takeUntil(action$.pipe(ofType(stopRecording.type))),
      )
    ),
    ignoreElements(),
  )

// ... 11개 Epic 더
```

**After (Custom Hook):**

```typescript
// hooks/useRecorder.ts
import { useCallback, useEffect, useRef } from 'react'
import { useRecorderStore } from '../stores/useRecorderStore'
import { useLanguageStore } from '../stores/useLanguageStore'
import { useTranslationStore } from '../stores/useTranslationStore'
import { webSocketService } from '../services/webSocketService'
import { audioRecorderService } from '../services/audioRecorderService'

const WS_URL = import.meta.env.VITE_WS_URL
const CONNECTION_TIMEOUT = 5000

export function useRecorder() {
  const intervalRef = useRef<number | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // 스토어에서 상태와 액션 가져오기
  const {
    status,
    error,
    setConnecting,
    setRecording,
    setStopping,
    setIdle,
    setError
  } = useRecorderStore()

  const { selectedLanguage, targetLanguage } = useLanguageStore()
  const { addTranscript, setInterimTranscript, addTranslation, clear } = useTranslationStore()

  // 파생 상태
  const isRecording = status === 'recording'
  const canStartRecording = status === 'idle' || status === 'error'
  const canStopRecording = status === 'recording'
  const elapsedTime = useRecorderStore((state) => state.getElapsedTime())

  // 녹음 시작
  const startRecording = useCallback(async () => {
    if (!canStartRecording) return

    abortControllerRef.current = new AbortController()
    const { signal } = abortControllerRef.current

    try {
      setConnecting()
      clear() // 이전 번역 결과 초기화

      // 1. WebSocket 연결
      await webSocketService.connect(WS_URL)
      if (signal.aborted) throw new Error('Aborted')

      // 2. 서버에 연결 요청 (언어 설정 포함)
      webSocketService.sendConnect(selectedLanguage.code, targetLanguage.code)
      await withTimeout(
        webSocketService.waitForConnected(),
        CONNECTION_TIMEOUT,
        'Connection timeout'
      )
      if (signal.aborted) throw new Error('Aborted')

      // 3. 오디오 녹음 시작
      await audioRecorderService.startRecording()
      if (signal.aborted) throw new Error('Aborted')

      // 4. STT 세션 시작
      webSocketService.sendStartSpeech()
      await withTimeout(
        webSocketService.waitForSpeechStarted(),
        CONNECTION_TIMEOUT,
        'Speech start timeout'
      )
      if (signal.aborted) throw new Error('Aborted')

      // 5. 녹음 상태로 전환
      setRecording()

      // 6. 오디오 스트리밍 시작
      audioRecorderService.onAudioChunk((chunk) => {
        if (!signal.aborted) {
          webSocketService.sendAudioChunk(chunk)
        }
      })

    } catch (error) {
      if (error.message !== 'Aborted') {
        setError(error.message)
        await cleanup()
      }
    }
  }, [canStartRecording, selectedLanguage, targetLanguage, setConnecting, setRecording, setError, clear])

  // 녹음 중지
  const stopRecording = useCallback(async () => {
    if (!canStopRecording) return

    abortControllerRef.current?.abort()

    try {
      setStopping()

      // 1. STT 세션 종료 요청
      webSocketService.sendStopSpeech()
      await withTimeout(
        webSocketService.waitForSpeechStopped(),
        CONNECTION_TIMEOUT,
        'Speech stop timeout'
      )

      // 2. 오디오 녹음 중지
      audioRecorderService.stopRecording()

      // 3. WebSocket 연결 해제
      webSocketService.disconnect()

      setIdle()
    } catch (error) {
      // 타임아웃이어도 정리는 수행
      await cleanup()
      setIdle()
    }
  }, [canStopRecording, setStopping, setIdle])

  // 정리 함수
  const cleanup = useCallback(async () => {
    audioRecorderService.stopRecording()
    webSocketService.disconnect()
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // WebSocket 메시지 핸들러
  useEffect(() => {
    const unsubscribe = webSocketService.onMessage((message) => {
      switch (message.type) {
        case 'transcript':
          if (message.is_final) {
            addTranscript(message.text)
          } else {
            setInterimTranscript(message.text)
          }
          break
        case 'translation':
          addTranslation(message.text)
          break
        case 'error':
          setError(message.message)
          cleanup()
          break
      }
    })

    return unsubscribe
  }, [addTranscript, setInterimTranscript, addTranslation, setError, cleanup])

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
      cleanup()
    }
  }, [cleanup])

  return {
    // 상태
    status,
    error,
    isRecording,
    canStartRecording,
    canStopRecording,
    elapsedTime,

    // 액션
    startRecording,
    stopRecording,
  }
}

// 유틸리티: Promise에 타임아웃 적용
function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(message)), ms)
    ),
  ])
}
```

### 4.3 recorderSelectors.ts → Zustand computed values

**Before (Reselect Selectors):**

```typescript
// model/recorderSelectors.ts
import { createSelector } from '@reduxjs/toolkit'
import { RootState } from '@/store'

// 기본 셀렉터
export const selectRecorderState = (state: RootState) => state.recorder
export const selectStatus = (state: RootState) => state.recorder.status
export const selectElapsedTime = (state: RootState) => state.recorder.elapsedTime
export const selectError = (state: RootState) => state.recorder.error
export const selectWebSocketStatus = (state: RootState) => state.recorder.webSocketStatus

// 파생 셀렉터
export const selectIsRecording = createSelector(
  [selectStatus],
  (status) => status === 'recording'
)

export const selectIsProcessing = createSelector(
  [selectStatus],
  (status) => status === 'starting' || status === 'stopping'
)

export const selectCanStartRecording = createSelector(
  [selectStatus],
  (status) => status === 'idle' || status === 'error'
)

export const selectCanStopRecording = createSelector(
  [selectStatus],
  (status) => status === 'recording'
)

export const selectFormattedElapsedTime = createSelector(
  [selectElapsedTime],
  (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
)

export const selectIsWebSocketConnected = createSelector(
  [selectWebSocketStatus],
  (status) => status === 'connected'
)

// ... 16개 더
```

**After (Zustand inline selectors):**

```typescript
// stores/useRecorderStore.ts에 통합
export const useRecorderStore = create<RecorderState>()((set, get) => ({
  // ... 상태와 액션

  // 파생 상태는 getter 메서드로 제공
  isRecording: () => get().status === 'recording',
  isProcessing: () => ['connecting', 'stopping'].includes(get().status),
  canStartRecording: () => ['idle', 'error'].includes(get().status),
  canStopRecording: () => get().status === 'recording',

  getFormattedElapsedTime: () => {
    const seconds = get().getElapsedTime()
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  },
}))

// 컴포넌트에서 사용
function RecordingStatus() {
  // 방법 1: 전체 상태 구독 (간단한 경우)
  const formattedTime = useRecorderStore((state) => state.getFormattedElapsedTime())

  // 방법 2: 원시 상태만 구독하고 렌더 시점에 계산 (최적화)
  const startTime = useRecorderStore((state) => state.startTime)
  const formattedTime = useMemo(() => {
    if (!startTime) return '00:00'
    const seconds = Math.floor((Date.now() - startTime) / 1000)
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [startTime])

  return <span>{formattedTime}</span>
}
```

### 4.4 WebSocketService.ts → Promise 기반으로 단순화

**Before (Observable 기반):**

```typescript
// services/WebSocketService.ts
import { Subject, Observable, firstValueFrom, filter, timeout } from 'rxjs'

export class WebSocketService {
  private socket: WebSocket | null = null
  private messageSubject = new Subject<WsServerMessage>()
  private closeSubject = new Subject<CloseEvent>()

  async connect(url: string): Promise<Result<Error, void>> {
    return new Promise((resolve) => {
      this.socket = new WebSocket(url)

      this.socket.onopen = () => resolve(ok(undefined))
      this.socket.onerror = () => resolve(err(new Error('Connection failed')))

      this.socket.onmessage = (event) => {
        const message = JSON.parse(event.data) as WsServerMessage
        this.messageSubject.next(message)
      }

      this.socket.onclose = (event) => {
        this.closeSubject.next(event)
      }
    })
  }

  // Observable로 특정 메시지 대기
  waitForConnected(): Observable<WsServerMessage> {
    return this.messageSubject.pipe(
      filter((msg) => msg.type === 'connected'),
      timeout(5000),
    )
  }

  waitForSpeechStarted(): Observable<WsServerMessage> {
    return this.messageSubject.pipe(
      filter((msg) => msg.type === 'speech_started'),
      timeout(5000),
    )
  }

  // ... 여러 Observable 메서드들
}
```

**After (Promise 기반):**

```typescript
// services/webSocketService.ts
type MessageHandler = (message: WsServerMessage) => void
type CloseHandler = (event: CloseEvent) => void

class WebSocketService {
  private socket: WebSocket | null = null
  private messageHandlers = new Set<MessageHandler>()
  private closeHandlers = new Set<CloseHandler>()
  private pendingResolvers = new Map<string, (value: WsServerMessage) => void>()

  async connect(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = new WebSocket(url)

      this.socket.onopen = () => resolve()
      this.socket.onerror = () => reject(new Error('Connection failed'))

      this.socket.onmessage = (event) => {
        const message = JSON.parse(event.data) as WsServerMessage

        // 대기 중인 Promise 해결
        const resolver = this.pendingResolvers.get(message.type)
        if (resolver) {
          resolver(message)
          this.pendingResolvers.delete(message.type)
        }

        // 등록된 핸들러에 알림
        this.messageHandlers.forEach((handler) => handler(message))
      }

      this.socket.onclose = (event) => {
        this.closeHandlers.forEach((handler) => handler(event))
      }
    })
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close()
      this.socket = null
    }
    this.pendingResolvers.clear()
  }

  // Promise로 특정 메시지 대기
  waitForConnected(): Promise<WsServerMessage> {
    return this.waitForMessage('connected')
  }

  waitForSpeechStarted(): Promise<WsServerMessage> {
    return this.waitForMessage('speech_started')
  }

  waitForSpeechStopped(): Promise<WsServerMessage> {
    return this.waitForMessage('speech_stopped')
  }

  private waitForMessage(type: string): Promise<WsServerMessage> {
    return new Promise((resolve) => {
      this.pendingResolvers.set(type, resolve)
    })
  }

  // 메시지 전송
  sendConnect(sourceLanguage: string, targetLanguage: string): void {
    this.send({ type: 'connect', source_language: sourceLanguage, target_language: targetLanguage })
  }

  sendStartSpeech(): void {
    this.send({ type: 'start_speech' })
  }

  sendAudioChunk(chunk: Float32Array): void {
    this.send({ type: 'audio_chunk', data: encodeAudioChunk(chunk) })
  }

  sendStopSpeech(): void {
    this.send({ type: 'stop_speech' })
  }

  private send(message: WsClientMessage): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message))
    }
  }

  // 메시지 구독
  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler)
    return () => this.messageHandlers.delete(handler)
  }

  onClose(handler: CloseHandler): () => void {
    this.closeHandlers.add(handler)
    return () => this.closeHandlers.delete(handler)
  }
}

export const webSocketService = new WebSocketService()
```

---

## 5. 마이그레이션 로드맵

### Phase 1: Zustand 설치 및 기반 설정

**작업 내용:**
1. Zustand 의존성 설치
2. 스토어 디렉토리 구조 생성
3. 기본 스토어 타입 정의

```bash
npm install zustand
```

**새로운 파일:**
- `src/features/recorder/stores/useRecorderStore.ts`
- `src/features/recorder/stores/useLanguageStore.ts`
- `src/features/recorder/stores/useTranslationStore.ts`

### Phase 2: 서비스 레이어 리팩토링

**작업 내용:**
1. WebSocketService를 Promise 기반으로 변환
2. AudioRecorderService를 콜백 기반으로 변환
3. RxJS Subject를 일반 콜백 패턴으로 교체

**수정 파일:**
- `src/features/recorder/services/WebSocketService.ts`
- `src/features/recorder/services/AudioRecorderService.ts`

### Phase 3: Zustand 스토어 구현

**작업 내용:**
1. useRecorderStore 구현 (녹음 상태)
2. useLanguageStore 구현 (언어 관리)
3. useTranslationStore 구현 (번역 결과)

**새로운 파일:**
- 위에서 생성한 스토어 파일들에 로직 추가

### Phase 4: 커스텀 훅 구현

**작업 내용:**
1. useRecorder 훅 구현 (녹음 시작/중지 로직)
2. useLanguages 훅 구현 (언어 목록 조회)
3. useTranscript 훅 구현 (번역 결과 구독)

**새로운 파일:**
- `src/features/recorder/hooks/useRecorder.ts`
- `src/features/recorder/hooks/useLanguages.ts`
- `src/features/recorder/hooks/useTranscript.ts`

### Phase 5: 뷰 컴포넌트 마이그레이션

**작업 내용:**
1. RecordButton: useAppDispatch → useRecorder
2. RecordingStatus: useAppSelector → useRecorderStore
3. LanguageDropdown: useAppSelector → useLanguageStore
4. TranscriptDisplay: useAppSelector → useTranslationStore

**수정 파일:**
- `src/features/recorder/view/*.tsx`

### Phase 6: Redux, RxJS 제거 및 정리

**작업 내용:**
1. Redux 관련 파일 삭제
2. Redux Provider 제거
3. 의존성 제거
4. 불필요한 타입 정리

**삭제 파일:**
- `src/features/recorder/model/recorderSlice.ts`
- `src/features/recorder/model/recorderSelectors.ts`
- `src/features/recorder/intent/recorderEpic.ts`
- `src/store/index.ts`

**의존성 제거:**
```bash
npm uninstall redux @reduxjs/toolkit redux-observable rxjs
```

---

## 6. 예상 결과물

### 6.1 코드량 비교표

| 항목 | Before (Redux + RxJS) | After (Zustand) | 감소율 |
|------|----------------------|-----------------|--------|
| **상태 관리** | 315줄 (recorderSlice) | ~80줄 (3개 스토어) | **75%** |
| **사이드 이펙트** | 602줄 (recorderEpic) | ~150줄 (useRecorder) | **75%** |
| **셀렉터** | 116줄 (recorderSelectors) | 0줄 (스토어에 통합) | **100%** |
| **서비스** | 447줄 | ~300줄 | **33%** |
| **총 코드량** | ~2,200줄 | ~750줄 | **66%** |

### 6.2 의존성 변화

**제거되는 의존성:**
- `redux` (~7KB gzipped)
- `@reduxjs/toolkit` (~12KB gzipped)
- `redux-observable` (~5KB gzipped)
- `rxjs` (~30KB gzipped)

**추가되는 의존성:**
- `zustand` (~2KB gzipped)

**번들 크기 절감:** ~52KB gzipped

### 6.3 복잡도 감소

| 지표 | Before | After |
|------|--------|-------|
| **액션 타입 수** | 27개 | 0개 (메서드로 대체) |
| **셀렉터 수** | 22개 | 0개 (inline selector) |
| **Epic 수** | 13개 | 0개 (async 함수로 대체) |
| **RxJS 연산자 사용** | 15종 | 0종 |
| **중첩 깊이 (최대)** | 7단계 | 2단계 |

---

## 7. Best Practices 적용 항목

### 7.1 rerender-defer-reads

**원칙:** 콜백에서만 사용하는 상태는 구독하지 않는다.

**적용:**

```typescript
// Before: 불필요한 구독
function RecordButton() {
  const status = useAppSelector(selectStatus)
  const dispatch = useAppDispatch()

  const handleClick = () => {
    if (status === 'idle') {
      dispatch(startRecording())
    }
  }

  return <button onClick={handleClick}>Record</button>
}

// After: 콜백 내에서만 상태 확인
function RecordButton() {
  const startRecording = useRecorderStore((state) => state.startRecording)

  const handleClick = () => {
    // 콜백 내에서 상태 확인
    const canStart = useRecorderStore.getState().canStartRecording()
    if (canStart) {
      startRecording()
    }
  }

  return <button onClick={handleClick}>Record</button>
}
```

### 7.2 bundle-barrel-imports

**원칙:** 배럴 파일(index.ts)에서 전체 import 대신 직접 import를 사용한다.

**적용:**

```typescript
// Before: 배럴 import (트리 쉐이킹 방해)
import { useRecorderStore, useLanguageStore, useTranslationStore } from '../stores'

// After: 직접 import
import { useRecorderStore } from '../stores/useRecorderStore'
import { useLanguageStore } from '../stores/useLanguageStore'
```

### 7.3 rerender-derived-state

**원칙:** 파생 상태는 렌더 시점에 계산하고, 상태로 저장하지 않는다.

**적용:**

```typescript
// Before: 파생 상태를 Redux에 저장
const recorderSlice = createSlice({
  // ...
  reducers: {
    updateElapsedTime: (state, action) => {
      state.elapsedTime = action.payload
      // 파생 상태도 함께 업데이트
      state.formattedTime = formatTime(action.payload)
    }
  }
})

// After: 렌더 시점에 계산
function RecordingStatus() {
  const startTime = useRecorderStore((state) => state.startTime)

  // 렌더 시점에 계산
  const formattedTime = useMemo(() => {
    if (!startTime) return '00:00'
    const seconds = Math.floor((Date.now() - startTime) / 1000)
    return formatTime(seconds)
  }, [startTime])

  return <span>{formattedTime}</span>
}
```

### 7.4 js-set-map-lookups

**원칙:** O(1) 조회를 위해 배열 대신 Map/Set을 사용한다.

**적용:**

```typescript
// Before: 배열에서 언어 검색
const languages = useAppSelector(selectLanguages)
const findLanguage = (code: string) =>
  languages.find((lang) => lang.code === code)

// After: Map으로 O(1) 조회
interface LanguageState {
  languageMap: Map<string, Language>
  // ...
}

const useLanguageStore = create<LanguageState>()((set, get) => ({
  languageMap: new Map(),

  setLanguages: (languages: Language[]) => {
    const map = new Map(languages.map((lang) => [lang.code, lang]))
    set({ languageMap: map })
  },

  getLanguage: (code: string) => get().languageMap.get(code),
}))
```

---

## 결론

Redux + redux-observable (RxJS) 아키텍처에서 Zustand로의 마이그레이션을 통해:

1. **코드량 66% 감소**: 2,200줄 → 750줄
2. **번들 크기 52KB 절감**: RxJS, Redux 의존성 제거
3. **학습 곡선 완화**: RxJS Observable → async/await
4. **유지보수성 향상**: 선형적인 코드 흐름, 디버깅 용이

이 가이드를 따라 단계적으로 마이그레이션을 진행하면, 기존 기능을 유지하면서 더 간결하고 유지보수하기 쉬운 코드베이스를 구축할 수 있습니다.
