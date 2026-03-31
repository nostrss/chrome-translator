import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebSocketService } from '@/services/WebSocketService';

class MockWebSocket {
  static OPEN = 1;
  readyState = MockWebSocket.OPEN;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: ((err: unknown) => void) | null = null;

  sent: string[] = [];

  constructor(_url: string) {
    setTimeout(() => this.onopen?.(), 0);
  }

  send(data: string) {
    this.sent.push(data);
  }

  close() {
    this.onclose?.();
  }

  simulateMessage(data: unknown) {
    this.onmessage?.({ data: JSON.stringify(data) });
  }
}

describe('WebSocketService', () => {
  let service: WebSocketService;
  let mockWs: MockWebSocket;

  beforeEach(() => {
    service = new WebSocketService();
    vi.stubGlobal('WebSocket', class extends MockWebSocket {
      constructor(url: string) {
        super(url);
        mockWs = this;
      }
    });
  });

  it('sends connect event on open', async () => {
    service.connect('ws://localhost:8080');
    await vi.waitFor(() => {
      expect(mockWs.sent).toContainEqual(JSON.stringify({ event: 'connect' }));
    });
  });

  it('calls onConnected callback', async () => {
    const onConnected = vi.fn();
    service.setCallbacks({ onConnected });
    service.connect('ws://localhost:8080');

    await vi.waitFor(() => {
      mockWs.simulateMessage({
        event: 'connected',
        success: true,
        data: { sessionId: 'abc', message: 'ok', timestamp: 1 },
      });
      expect(onConnected).toHaveBeenCalledWith('abc');
    });
  });

  it('calls onSpeechResult callback', async () => {
    const onSpeechResult = vi.fn();
    service.setCallbacks({ onSpeechResult });
    service.connect('ws://localhost:8080');

    await vi.waitFor(() => {
      mockWs.simulateMessage({
        event: 'speech_result',
        success: true,
        data: { transcript: 'hello', isFinal: true, timestamp: 1 },
      });
      expect(onSpeechResult).toHaveBeenCalledWith('hello', true);
    });
  });

  it('calls onError callback', async () => {
    const onError = vi.fn();
    service.setCallbacks({ onError });
    service.connect('ws://localhost:8080');

    await vi.waitFor(() => {
      mockWs.simulateMessage({
        event: 'error',
        success: false,
        error: { code: 'VAD_TIMEOUT', message: 'No speech' },
      });
      expect(onError).toHaveBeenCalledWith('VAD_TIMEOUT', 'No speech');
    });
  });

  it('sends start_speech with correct data', async () => {
    service.connect('ws://localhost:8080');
    await vi.waitFor(() => expect(mockWs).toBeDefined());

    service.startSpeech('ko-KR', 'en-US', 'standard');

    const sent = mockWs.sent.map((s) => JSON.parse(s));
    expect(sent).toContainEqual({
      event: 'start_speech',
      data: { languageCode: 'ko-KR', targetLanguageCode: 'en-US', translationMode: 'standard' },
    });
  });
});
