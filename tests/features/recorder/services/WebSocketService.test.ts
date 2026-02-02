import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WebSocketService, getWebSocketService } from '@/features/recorder/services/WebSocketService';
import { isOk, isErr } from '@/shared/fp';

describe('WebSocketService', () => {
  let service: WebSocketService;
  let mockWebSocket: {
    readyState: number;
    send: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
    onopen: (() => void) | null;
    onerror: (() => void) | null;
    onclose: ((event: { code: number; reason: string; wasClean: boolean }) => void) | null;
    onmessage: ((event: { data: string }) => void) | null;
  };

  // WebSocket 상수 정의
  const WS_CONNECTING = 0;
  const WS_OPEN = 1;

  beforeEach(() => {
    // Mock WebSocket 먼저 설정
    mockWebSocket = {
      readyState: WS_CONNECTING,
      send: vi.fn(),
      close: vi.fn(),
      onopen: null,
      onerror: null,
      onclose: null,
      onmessage: null,
    };

    const MockWebSocket = vi.fn(() => mockWebSocket);
    // WebSocket 상수 추가
    Object.assign(MockWebSocket, {
      CONNECTING: WS_CONNECTING,
      OPEN: WS_OPEN,
      CLOSING: 2,
      CLOSED: 3,
    });

    vi.stubGlobal('WebSocket', MockWebSocket);

    // 새 인스턴스 생성 (싱글톤 우회)
    service = new WebSocketService();
  });

  afterEach(() => {
    service.disconnect();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  describe('connect', () => {
    it('should resolve with ok result on successful connection', async () => {
      const connectPromise = service.connect('ws://localhost:3000');

      // Simulate WebSocket open
      mockWebSocket.readyState = WS_OPEN;
      mockWebSocket.onopen?.();

      const result = await connectPromise;
      expect(isOk(result)).toBe(true);
    });

    it('should resolve with error result on connection failure', async () => {
      const connectPromise = service.connect('ws://localhost:3000');

      // Simulate WebSocket error
      mockWebSocket.onerror?.();

      const result = await connectPromise;
      expect(isErr(result)).toBe(true);
    });

    it('should resolve with error result on connection timeout', async () => {
      vi.useFakeTimers();

      const connectPromise = service.connect('ws://localhost:3000');

      // Advance time past timeout (5000ms)
      vi.advanceTimersByTime(5100);

      const result = await connectPromise;
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.message).toContain('타임아웃');
      }

      vi.useRealTimers();
    });

    it('should reuse existing connection if already open', async () => {
      // First connection
      const firstConnectPromise = service.connect('ws://localhost:3000');
      mockWebSocket.readyState = WS_OPEN;
      mockWebSocket.onopen?.();
      await firstConnectPromise;

      // Second connection attempt
      const result = await service.connect('ws://localhost:3000');

      expect(isOk(result)).toBe(true);
      // WebSocket constructor should only be called once
      expect(vi.mocked(WebSocket)).toHaveBeenCalledTimes(1);
    });
  });

  describe('send methods', () => {
    it('should send connect message when connected', async () => {
      const connectPromise = service.connect('ws://localhost:3000');
      mockWebSocket.readyState = WS_OPEN;
      mockWebSocket.onopen?.();
      await connectPromise;

      const result = service.sendConnect();

      expect(isOk(result)).toBe(true);
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({ event: 'connect' })
      );
    });

    it('should return error when not connected', () => {
      const result = service.sendConnect();

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.message).toContain('연결되어 있지 않습니다');
      }
    });
  });

  describe('disconnect', () => {
    it('should close WebSocket and clear reference', async () => {
      // Connect first
      const connectPromise = service.connect('ws://localhost:3000');
      mockWebSocket.readyState = WS_OPEN;
      mockWebSocket.onopen?.();
      await connectPromise;

      // Now disconnect
      service.disconnect();

      expect(mockWebSocket.close).toHaveBeenCalled();
      expect(service.isConnected()).toBe(false);
    });

    it('should do nothing if not connected', () => {
      // Should not throw
      expect(() => service.disconnect()).not.toThrow();
    });
  });

  describe('isConnected', () => {
    it('should return false when not connected', () => {
      expect(service.isConnected()).toBe(false);
    });

    it('should return true when connected', async () => {
      const connectPromise = service.connect('ws://localhost:3000');
      mockWebSocket.readyState = WS_OPEN;
      mockWebSocket.onopen?.();
      await connectPromise;

      expect(service.isConnected()).toBe(true);
    });
  });

  describe('onMessage and onClose handlers', () => {
    it('should call message handlers when message received', async () => {
      const connectPromise = service.connect('ws://localhost:3000');
      mockWebSocket.readyState = WS_OPEN;
      mockWebSocket.onopen?.();
      await connectPromise;

      const handler = vi.fn();
      service.onMessage(handler);

      // Simulate receiving a message
      mockWebSocket.onmessage?.({ data: JSON.stringify({ event: 'connected', data: { sessionId: 'test' } }) });

      expect(handler).toHaveBeenCalledWith({ event: 'connected', data: { sessionId: 'test' } });
    });

    it('should allow unsubscribing from message handlers', async () => {
      const connectPromise = service.connect('ws://localhost:3000');
      mockWebSocket.readyState = WS_OPEN;
      mockWebSocket.onopen?.();
      await connectPromise;

      const handler = vi.fn();
      const unsubscribe = service.onMessage(handler);

      // Unsubscribe
      unsubscribe();

      // Simulate receiving a message
      mockWebSocket.onmessage?.({ data: JSON.stringify({ event: 'connected', data: { sessionId: 'test' } }) });

      expect(handler).not.toHaveBeenCalled();
    });

    it('should call close handlers when connection closes', async () => {
      const connectPromise = service.connect('ws://localhost:3000');
      mockWebSocket.readyState = WS_OPEN;
      mockWebSocket.onopen?.();
      await connectPromise;

      const handler = vi.fn();
      service.onClose(handler);

      // Simulate connection close
      mockWebSocket.onclose?.({ code: 1000, reason: 'Normal closure', wasClean: true });

      expect(handler).toHaveBeenCalledWith({ code: 1000, reason: 'Normal closure', wasClean: true });
    });
  });

  describe('waitFor methods', () => {
    it('should resolve when expected event is received', async () => {
      const connectPromise = service.connect('ws://localhost:3000');
      mockWebSocket.readyState = WS_OPEN;
      mockWebSocket.onopen?.();
      await connectPromise;

      const waitPromise = service.waitForConnected();

      // Simulate receiving connected event
      mockWebSocket.onmessage?.({ data: JSON.stringify({ event: 'connected', data: { sessionId: 'test123' } }) });

      const result = await waitPromise;
      expect(result.event).toBe('connected');
      expect(result.data.sessionId).toBe('test123');
    });

    it('should reject on timeout', async () => {
      vi.useFakeTimers();

      const connectPromise = service.connect('ws://localhost:3000');
      mockWebSocket.readyState = WS_OPEN;
      mockWebSocket.onopen?.();
      await connectPromise;

      const waitPromise = service.waitForConnected(1000);

      // Advance time past timeout
      vi.advanceTimersByTime(1100);

      await expect(waitPromise).rejects.toThrow('타임아웃');

      vi.useRealTimers();
    });
  });

  describe('getWebSocketService (singleton)', () => {
    it('should return the same instance', () => {
      const instance1 = getWebSocketService();
      const instance2 = getWebSocketService();

      expect(instance1).toBe(instance2);
    });
  });
});
