/**
 * Chrome Extension 메시지 타입 정의
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

export type ExtensionMessage = RequestTabCaptureMessage;
export type ExtensionResponse = TabCaptureResponse;
