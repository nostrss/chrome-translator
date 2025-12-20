import type {
  RequestTabCaptureMessage,
  TabCaptureResponse,
} from '@/shared/messaging/types';

// 툴바 아이콘 클릭 시 Side Panel 열기
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.sidePanel.open({ tabId: tab.id });
  }
});

// 메시지 핸들러
chrome.runtime.onMessage.addListener(
  (
    message: RequestTabCaptureMessage,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: TabCaptureResponse) => void
  ) => {
    if (message.type === 'REQUEST_TAB_CAPTURE') {
      handleTabCaptureRequest(message.tabId, sendResponse);
      return true; // 비동기 응답을 위해 true 반환
    }
    return false;
  }
);

/**
 * 탭 캡처 스트림 ID 요청 처리
 */
async function handleTabCaptureRequest(
  tabId: number,
  sendResponse: (response: TabCaptureResponse) => void
): Promise<void> {
  try {
    const streamId = await chrome.tabCapture.getMediaStreamId({
      targetTabId: tabId,
    });

    sendResponse({
      type: 'TAB_CAPTURE_RESPONSE',
      success: true,
      streamId,
    });
  } catch (error) {
    console.error('[Service Worker] Tab capture error:', error);
    sendResponse({
      type: 'TAB_CAPTURE_RESPONSE',
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to capture tab audio',
    });
  }
}
