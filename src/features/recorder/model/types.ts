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

// ============================================
// WebSocket Message Types (Client → Server)
// ============================================

export interface WsConnectMessage {
  readonly event: 'connect';
}

export interface WsStartSpeechMessage {
  readonly event: 'start_speech';
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

export interface WsErrorMessage {
  readonly event: 'error';
  readonly success: false;
  readonly error: string;
}

export type WsServerMessage =
  | WsConnectedMessage
  | WsSpeechStartedMessage
  | WsSpeechStoppedMessage
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
