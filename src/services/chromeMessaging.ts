import type { TabCaptureResponse, RequestTabCaptureMessage } from '@/types/chrome';

function sendMessage<T>(message: unknown): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response: T) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}

export function requestTabCapture(tabId: number): Promise<TabCaptureResponse> {
  const message: RequestTabCaptureMessage = { type: 'REQUEST_TAB_CAPTURE', tabId };
  return sendMessage<TabCaptureResponse>(message);
}

export function getCurrentTabId(): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else if (tabs[0]?.id) {
        resolve(tabs[0].id);
      } else {
        reject(new Error('No active tab found'));
      }
    });
  });
}
