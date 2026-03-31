# Frontend Integration Guide

실시간 음성 인식(STT) + 번역 서버 연동 가이드

## 서버 정보

| 항목 | 값 |
|------|-----|
| 프로토콜 | WebSocket (ws/wss) |
| 기본 포트 | 8080 |
| WebSocket 경로 | `/` |
| REST API 경로 | `/api/*`, `/health` |

---

## 1. 지원 언어 목록 조회 (REST API)

음성 인식 시작 전, 사용자에게 언어 선택 UI를 제공하기 위해 사용합니다.

### STT 지원 언어

```
GET /api/languages/stt
GET /api/languages/stt?q=korean    # 검색 필터
```

### 번역 지원 언어

```
GET /api/languages/translation
GET /api/languages/translation?q=english   # 검색 필터
```

### 응답 형식

```json
{
  "languages": [
    { "code": "ko", "name": "Korean", "nativeName": "한국어" },
    { "code": "en", "name": "English", "nativeName": "English" }
  ]
}
```

### 사용 예시 (TypeScript)

```typescript
interface Language {
  code: string;
  name: string;
  nativeName: string;
}

async function fetchSttLanguages(query?: string): Promise<Language[]> {
  const url = query
    ? `/api/languages/stt?q=${encodeURIComponent(query)}`
    : '/api/languages/stt';
  const res = await fetch(url);
  const { languages } = await res.json();
  return languages;
}

async function fetchTranslationLanguages(query?: string): Promise<Language[]> {
  const url = query
    ? `/api/languages/translation?q=${encodeURIComponent(query)}`
    : '/api/languages/translation';
  const res = await fetch(url);
  const { languages } = await res.json();
  return languages;
}
```

> Rate Limit: 30 req/min per IP

---

## 2. WebSocket 통신

### 2.1 연결 흐름

```
[연결] → [connect] → [start_speech] → [audio_chunk 반복] → [stop_speech] → [연결 종료]
```

### 2.2 TypeScript 타입 정의

프론트엔드에서 사용할 타입을 먼저 정의합니다.

```typescript
// ─── 클라이언트 → 서버 ───

type ClientEvent = 'connect' | 'start_speech' | 'audio_chunk' | 'stop_speech';

interface ClientMessage<T = unknown> {
  event: ClientEvent;
  data?: T;
}

interface StartSpeechData {
  languageCode?: string;         // 발화 언어 (기본: 'ko-KR')
  targetLanguageCode?: string;   // 번역 대상 언어 (미입력 시 번역 비활성화)
  translationMode?: 'standard' | 'advanced'; // 기본: 'standard'
  sampleRateHertz?: number;      // 기본: 16000
}

interface AudioChunkData {
  audio: string; // Base64 인코딩된 PCM 오디오
}

// ─── 서버 → 클라이언트 ───

type ServerEvent =
  | 'connected'
  | 'speech_started'
  | 'speech_result'
  | 'speech_stopped'
  | 'translation_result'
  | 'error';

interface ServerMessage<T = unknown> {
  event: ServerEvent;
  data?: T;
  success: boolean;
  error?: { code: ErrorCode; message: string };
}

interface ConnectedData {
  sessionId: string;
  message: string;
  timestamp: number;
}

interface SpeechResultData {
  transcript: string;
  isFinal: boolean;     // false: 중간결과, true: 문장 완성
  timestamp: number;
}

interface TranslationResultData {
  originalText: string;
  translatedText: string;
  isFinal: boolean;     // false: 실시간 번역, true: 최종 번역
  timestamp: number;
}

type ErrorCode =
  | 'INVALID_MESSAGE'
  | 'UNKNOWN_EVENT'
  | 'SESSION_NOT_FOUND'
  | 'SESSION_ALREADY_ACTIVE'
  | 'ORIGIN_REJECTED'
  | 'TOO_MANY_SESSIONS'
  | 'PAYLOAD_TOO_LARGE'
  | 'VAD_TIMEOUT'
  | 'SESSION_TIMEOUT'
  | 'STT_ERROR'
  | 'TRANSLATION_ERROR'
  | 'INTERNAL_ERROR';
```

### 2.3 WebSocket 연결 및 이벤트 처리

```typescript
class SpeechClient {
  private ws: WebSocket | null = null;
  private sessionId: string | null = null;

  // 콜백
  onConnected?: (sessionId: string) => void;
  onSpeechStarted?: () => void;
  onSpeechResult?: (transcript: string, isFinal: boolean) => void;
  onTranslationResult?: (original: string, translated: string, isFinal: boolean) => void;
  onSpeechStopped?: () => void;
  onError?: (code: ErrorCode, message: string) => void;
  onDisconnected?: () => void;

  connect(serverUrl: string) {
    this.ws = new WebSocket(serverUrl);

    this.ws.onopen = () => {
      this.send({ event: 'connect' });
    };

    this.ws.onmessage = (event) => {
      const msg: ServerMessage = JSON.parse(event.data as string);
      this.handleMessage(msg);
    };

    this.ws.onclose = () => {
      this.sessionId = null;
      this.onDisconnected?.();
    };

    this.ws.onerror = (err) => {
      console.error('WebSocket 에러:', err);
    };
  }

  private handleMessage(msg: ServerMessage) {
    switch (msg.event) {
      case 'connected': {
        const data = msg.data as ConnectedData;
        this.sessionId = data.sessionId;
        this.onConnected?.(data.sessionId);
        break;
      }
      case 'speech_started':
        this.onSpeechStarted?.();
        break;

      case 'speech_result': {
        const data = msg.data as SpeechResultData;
        this.onSpeechResult?.(data.transcript, data.isFinal);
        break;
      }
      case 'translation_result': {
        const data = msg.data as TranslationResultData;
        this.onTranslationResult?.(data.originalText, data.translatedText, data.isFinal);
        break;
      }
      case 'speech_stopped':
        this.onSpeechStopped?.();
        break;

      case 'error': {
        const { code, message } = msg.error!;
        this.onError?.(code as ErrorCode, message);
        break;
      }
    }
  }

  /**
   * 음성 인식 시작
   * @param languageCode 발화 언어 (예: 'ko-KR', 'en-US')
   * @param targetLanguageCode 번역 대상 언어 (미입력 시 번역 안 함)
   * @param translationMode 'standard'(Gemini) 또는 'advanced'(Cloud Translation LLM)
   */
  startSpeech(
    languageCode = 'ko-KR',
    targetLanguageCode?: string,
    translationMode: 'standard' | 'advanced' = 'standard',
  ) {
    this.send({
      event: 'start_speech',
      data: { languageCode, targetLanguageCode, translationMode },
    });
  }

  /** Base64 인코딩된 PCM 오디오 청크 전송 (최대 64KB) */
  sendAudio(base64Audio: string) {
    this.send({ event: 'audio_chunk', data: { audio: base64Audio } });
  }

  /** 음성 인식 종료 */
  stopSpeech() {
    this.send({ event: 'stop_speech' });
  }

  /** WebSocket 연결 종료 */
  disconnect() {
    this.ws?.close();
    this.ws = null;
  }

  private send(msg: ClientMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }
}
```

---

## 3. 마이크 녹음 (브라우저)

마이크에서 PCM 오디오를 캡처하여 서버로 전송하는 코드입니다.

```typescript
class MicRecorder {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;

  onAudioChunk?: (base64: string) => void;

  async start(sampleRate = 16000) {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });

    this.audioContext = new AudioContext({ sampleRate });
    const source = this.audioContext.createMediaStreamSource(this.stream);
    this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => {
      const float32 = e.inputBuffer.getChannelData(0);
      const pcm16 = this.float32ToPcm16(float32);
      const base64 = this.arrayBufferToBase64(pcm16.buffer);
      this.onAudioChunk?.(base64);
    };

    source.connect(this.processor);
    this.processor.connect(this.audioContext.destination);
  }

  stop() {
    this.processor?.disconnect();
    this.stream?.getTracks().forEach((t) => t.stop());
    this.audioContext?.close();
    this.processor = null;
    this.stream = null;
    this.audioContext = null;
  }

  private float32ToPcm16(float32: Float32Array): Int16Array {
    const pcm16 = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
      pcm16[i] = Math.max(-32768, Math.min(32767, float32[i] * 32768));
    }
    return pcm16;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}
```

---

## 4. 전체 통합 예제

```typescript
const client = new SpeechClient();
const mic = new MicRecorder();

// 1. 콜백 설정
client.onConnected = (sessionId) => {
  console.log('연결 완료:', sessionId);
};

client.onSpeechStarted = () => {
  console.log('음성 인식 시작됨');
};

client.onSpeechResult = (transcript, isFinal) => {
  if (isFinal) {
    // 문장 완성 → 자막 확정
    appendFinalTranscript(transcript);
  } else {
    // 중간 결과 → 실시간 자막 업데이트 (덮어쓰기)
    updateInterimTranscript(transcript);
  }
};

client.onTranslationResult = (original, translated, isFinal) => {
  if (isFinal) {
    // 최종 번역 (Gemini/Cloud Translation LLM) → 번역 확정
    appendFinalTranslation(original, translated);
  } else {
    // 실시간 번역 (Soniox 내장) → 번역 업데이트 (덮어쓰기)
    updateInterimTranslation(original, translated);
  }
};

client.onError = (code, message) => {
  console.error(`[${code}] ${message}`);

  if (code === 'VAD_TIMEOUT' || code === 'SESSION_TIMEOUT') {
    // 서버가 연결을 종료함 → UI에 알림 표시
    showNotification(message);
    mic.stop();
  }
};

client.onDisconnected = () => {
  mic.stop();
  console.log('연결 종료');
};

// 2. 마이크 → 서버 연결
mic.onAudioChunk = (base64) => {
  client.sendAudio(base64);
};

// 3. 녹음 시작 버튼
async function onStartClick() {
  client.connect('wss://your-server-url');

  // connected 이벤트 수신 후 음성 인식 시작
  client.onConnected = async (sessionId) => {
    client.startSpeech('ko-KR', 'en-US', 'standard');
    await mic.start(16000);
  };
}

// 4. 녹음 종료 버튼
function onStopClick() {
  mic.stop();
  client.stopSpeech();
  // 필요시: client.disconnect();
}
```

---

## 5. UI 구현 가이드

### 자막 렌더링 패턴

```
┌─────────────────────────────────────┐
│  [확정된 문장 1]                      │  ← isFinal: true (누적)
│  [확정된 문장 2]                      │
│  [현재 인식 중인 텍스트...]            │  ← isFinal: false (덮어쓰기)
├─────────────────────────────────────┤
│  [확정된 번역 1]                      │  ← isFinal: true (누적)
│  [확정된 번역 2]                      │
│  [현재 번역 중...]                    │  ← isFinal: false (덮어쓰기)
└─────────────────────────────────────┘
```

**핵심 규칙:**
- `isFinal: false` 결과는 매번 **덮어쓰기** (같은 문장이 계속 업데이트됨)
- `isFinal: true` 결과가 오면 **확정** 후 다음 줄로 이동
- `speech_result`의 `isFinal: true`와 `translation_result`의 `isFinal: true`는 같은 문장에 대한 것

### 상태 관리

```
IDLE → CONNECTING → CONNECTED → RECORDING → STOPPED
                                    ↑          |
                                    └──────────┘ (재시작 가능)
```

| 상태 | 설명 | UI |
|------|------|-----|
| IDLE | 초기 상태 | "시작" 버튼 활성화 |
| CONNECTING | WebSocket 연결 중 | 로딩 표시 |
| CONNECTED | 연결 완료, `connected` 수신 | - |
| RECORDING | `speech_started` 수신, 오디오 전송 중 | "중지" 버튼, 마이크 애니메이션 |
| STOPPED | `speech_stopped` 수신 | "시작" 버튼 활성화 |

---

## 6. 에러 처리

| 에러 코드 | 대응 방법 |
|-----------|-----------|
| `ORIGIN_REJECTED` | 서버 관리자에게 Origin 등록 요청 |
| `TOO_MANY_SESSIONS` | 다른 탭/기기에서 열린 세션 종료 후 재시도 |
| `PAYLOAD_TOO_LARGE` | 오디오 청크 크기를 64KB 이하로 조정 |
| `VAD_TIMEOUT` | 30초간 무음 → 서버가 연결 종료. 사용자에게 알림 후 재연결 유도 |
| `SESSION_TIMEOUT` | 30분 세션 만료 → 재연결 필요 |
| `SESSION_NOT_FOUND` | `connect` 이벤트를 먼저 전송했는지 확인 |
| `STT_ERROR` | 서버 측 STT 오류. 재연결 시도 |
| `TRANSLATION_ERROR` | 번역 오류 (음성 인식은 계속됨). 무시 가능 |
| `INTERNAL_ERROR` | 서버 내부 오류. 재연결 시도 |

---

## 7. 오디오 요구사항

| 항목 | 값 |
|------|-----|
| 인코딩 | LINEAR16 (PCM) |
| 샘플레이트 | 16000 Hz (권장) |
| 채널 | 1 (모노) |
| 청크 크기 | 최대 64KB |
| WAV 헤더 | 포함해도 됨 (서버에서 자동 제거) |

---

## 8. 주의사항

1. **이벤트 순서를 지켜주세요**: `connect` → `start_speech` → `audio_chunk` → `stop_speech`
2. **`connect` 이벤트 필수**: WebSocket 연결 후 반드시 `connect` 이벤트를 먼저 보내야 합니다
3. **번역 없이 STT만 사용**: `targetLanguageCode`를 생략하면 `translation_result` 이벤트가 발생하지 않습니다
4. **같은 언어 입력 시 번역 skip**: `languageCode`와 `targetLanguageCode`의 언어가 같으면 번역이 비활성화됩니다
5. **재연결 시 새 세션**: WebSocket 재연결 시 `connect`부터 다시 시작해야 합니다
6. **IP당 최대 3개 동시 세션**: 초과 시 `TOO_MANY_SESSIONS` 에러
7. **HTTPS 환경에서는 `wss://` 사용**: 브라우저 보안 정책상 HTTPS 페이지에서 `ws://`는 차단됩니다
