/**
 * Recorder Feature Types
 * MVI 패턴의 Model 레이어 타입 정의
 */

/**
 * 녹음 상태
 */
export type RecordingStatus =
  | 'idle'
  | 'requesting'
  | 'recording'
  | 'stopping'
  | 'completed'
  | 'error';

/**
 * WebSocket 연결 상태
 */
export type WebSocketStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error';

/**
 * STT 세션 상태
 */
export type SttStatus =
  | 'idle'
  | 'starting'
  | 'active'
  | 'stopping'
  | 'stopped';

/**
 * 언어 정보
 */
export interface Language {
  readonly code: string;
  readonly name: string;
  readonly nativeName: string;
}

/**
 * 언어 목록 로딩 상태
 */
export type LanguagesStatus = 'idle' | 'loading' | 'loaded' | 'error';

// ============================================
// API Response Types
// ============================================

/**
 * API 응답 타입 (공통)
 */
export interface ApiResponse<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: {
    readonly code: string;
    readonly message: string;
  };
}

/**
 * 언어 목록 API 응답 데이터
 */
export interface LanguagesData {
  readonly languages: Language[];
  readonly count: number;
}

// ============================================
// WebSocket Message Types (Client → Server)
// ============================================

export interface WsConnectMessage {
  readonly event: 'connect';
}

export interface WsStartSpeechMessage {
  readonly event: 'start_speech';
  readonly data?: {
    readonly language: string;
  };
}

export interface WsAudioChunkMessage {
  readonly event: 'audio_chunk';
  readonly data: {
    readonly audio: string; // BASE64 encoded Int16 PCM
  };
}

export interface WsStopSpeechMessage {
  readonly event: 'stop_speech';
}

export type WsClientMessage =
  | WsConnectMessage
  | WsStartSpeechMessage
  | WsAudioChunkMessage
  | WsStopSpeechMessage;

// ============================================
// WebSocket Message Types (Server → Client)
// ============================================

export interface WsConnectedMessage {
  readonly event: 'connected';
  readonly data: {
    readonly sessionId: string;
  };
}

export interface WsSpeechStartedMessage {
  readonly event: 'speech_started';
}

export interface WsSpeechStoppedMessage {
  readonly event: 'speech_stopped';
}

/**
 * STT 음성 인식 결과
 */
export interface WsSpeechResultMessage {
  readonly event: 'speech_result';
  readonly data: {
    readonly transcript: string;
    readonly isFinal: boolean;
  };
}

export interface WsErrorMessage {
  readonly event: 'error';
  readonly success: false;
  readonly error: string;
}

export type WsServerMessage =
  | WsConnectedMessage
  | WsSpeechStartedMessage
  | WsSpeechStoppedMessage
  | WsSpeechResultMessage
  | WsErrorMessage;

/**
 * 녹음된 오디오 데이터
 */
export interface RecordedAudio {
  readonly blob: Blob;
  readonly url: string;
  readonly duration: number;
  readonly sampleRate: number;
  readonly channels: number;
  readonly createdAt: number;
}

/**
 * 최종 확정된 Transcript 항목
 */
export interface TranscriptEntry {
  readonly id: string;
  readonly text: string;
  readonly timestamp: number;
}

/**
 * Transcript 상태
 */
export interface TranscriptState {
  readonly entries: readonly TranscriptEntry[];
  readonly interimText: string;
}

/**
 * Recorder 상태 (readonly로 불변성 보장)
 */
export interface RecorderState {
  readonly status: RecordingStatus;
  readonly recordingStartTime: number | null;
  readonly elapsedTime: number;
  readonly audio: RecordedAudio | null;
  readonly error: string | null;
  readonly webSocketStatus: WebSocketStatus;
  readonly sttStatus: SttStatus;
  readonly sessionId: string | null;
  readonly languages: readonly Language[];
  readonly languagesStatus: LanguagesStatus;
  readonly selectedLanguage: string | null;
  readonly languagesError: string | null;
  readonly transcript: TranscriptState;
}

/**
 * Chrome 메시지 타입
 */
export interface RequestTabCaptureMessage {
  readonly type: 'REQUEST_TAB_CAPTURE';
  readonly tabId: number;
}

export interface TabCaptureSuccessResponse {
  readonly type: 'TAB_CAPTURE_RESPONSE';
  readonly success: true;
  readonly streamId: string;
}

export interface TabCaptureErrorResponse {
  readonly type: 'TAB_CAPTURE_RESPONSE';
  readonly success: false;
  readonly error: string;
}

export type TabCaptureResponse =
  | TabCaptureSuccessResponse
  | TabCaptureErrorResponse;

export type ChromeMessage = RequestTabCaptureMessage;
export type ChromeResponse = TabCaptureResponse;
