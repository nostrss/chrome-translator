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
