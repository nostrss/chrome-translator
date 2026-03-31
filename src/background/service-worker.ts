import type { RequestTabCaptureMessage, TabCaptureResponse } from '@/types/chrome';

chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.sidePanel.open({ tabId: tab.id });
  }
});

chrome.runtime.onMessage.addListener(
  (
    message: RequestTabCaptureMessage,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: TabCaptureResponse) => void,
  ) => {
    if (message.type === 'REQUEST_TAB_CAPTURE') {
      handleTabCaptureRequest(message.tabId, sendResponse);
      return true;
    }
    return false;
  },
);

async function handleTabCaptureRequest(
  tabId: number,
  sendResponse: (response: TabCaptureResponse) => void,
): Promise<void> {
  try {
    const streamId = await new Promise<string>((resolve, reject) => {
      chrome.tabCapture.getMediaStreamId({ targetTabId: tabId }, (id) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(id);
        }
      });
    });
    sendResponse({ type: 'TAB_CAPTURE_RESPONSE', success: true, streamId });
  } catch (error) {
    sendResponse({
      type: 'TAB_CAPTURE_RESPONSE',
      success: false,
      error: error instanceof Error ? error.message : 'Failed to capture tab audio',
    });
  }
}
