import type { Result } from '@/shared/utils';
import { ok, err } from '@/shared/utils';
import type { TabCaptureResponse, RequestTabCaptureMessage } from './types';

/**
 * Service Worker로 메시지를 보내고 응답을 Promise로 받음
 */
export const sendMessage = <T>(message: unknown): Promise<Result<Error, T>> =>
  new Promise<Result<Error, T>>((resolve) => {
    chrome.runtime.sendMessage(message, (response: T) => {
      if (chrome.runtime.lastError) {
        resolve(err(new Error(chrome.runtime.lastError.message)));
      } else {
        resolve(ok(response));
      }
    });
  });

/**
 * 탭 캡처 스트림 ID 요청
 */
export const requestTabCapture = (
  tabId: number
): Promise<Result<Error, TabCaptureResponse>> => {
  const message: RequestTabCaptureMessage = {
    type: 'REQUEST_TAB_CAPTURE',
    tabId,
  };
  return sendMessage<TabCaptureResponse>(message);
};

/**
 * 현재 활성 탭 ID 가져오기
 */
export const getCurrentTabId = (): Promise<Result<Error, number>> =>
  new Promise<Result<Error, number>>((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) {
        resolve(err(new Error(chrome.runtime.lastError.message)));
      } else if (tabs[0]?.id) {
        resolve(ok(tabs[0].id));
      } else {
        resolve(err(new Error('No active tab found')));
      }
    });
  });
