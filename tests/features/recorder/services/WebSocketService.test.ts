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
    onclose: (() => void) | null;
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
    it('should emit ok result on successful connection', () => {
      return new Promise<void>((done) => {
        service.connect('ws://localhost:3000').subscribe((result) => {
          expect(isOk(result)).toBe(true);
          done();
        });

        // Simulate WebSocket open
        mockWebSocket.readyState = WS_OPEN;
        mockWebSocket.onopen?.();
      });
    });

    it('should emit error result on connection failure', () => {
      return new Promise<void>((done) => {
        service.connect('ws://localhost:3000').subscribe((result) => {
          expect(isErr(result)).toBe(true);
          done();
        });

        // Simulate WebSocket error
        mockWebSocket.onerror?.();
      });
    });

    it('should emit error result on connection timeout', () => {
      vi.useFakeTimers();

      return new Promise<void>((done) => {
        service.connect('ws://localhost:3000').subscribe((result) => {
          expect(isErr(result)).toBe(true);
          if (isErr(result)) {
            expect(result.error.message).toContain('타임아웃');
          }
          done();
        });

        // Advance time past timeout (5000ms)
        vi.advanceTimersByTime(5100);
        vi.useRealTimers();
      });
    });

    it('should reuse existing connection if already open', () => {
      return new Promise<void>((done) => {
        // First connection
        service.connect('ws://localhost:3000').subscribe(() => {
          // Second connection attempt
          service.connect('ws://localhost:3000').subscribe((result) => {
            expect(isOk(result)).toBe(true);
            // WebSocket constructor should only be called once
            expect(vi.mocked(WebSocket)).toHaveBeenCalledTimes(1);
            done();
          });
        });

        // Simulate successful connection
        mockWebSocket.readyState = WS_OPEN;
        mockWebSocket.onopen?.();
      });
    });
  });

  describe('send methods', () => {
    it('should send connect message when connected', () => {
      return new Promise<void>((done) => {
        service.connect('ws://localhost:3000').subscribe(() => {
          const result = service.sendConnect();

          expect(isOk(result)).toBe(true);
          expect(mockWebSocket.send).toHaveBeenCalledWith(
            JSON.stringify({ event: 'connect' })
          );
          done();
        });

        mockWebSocket.readyState = WS_OPEN;
        mockWebSocket.onopen?.();
      });
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
      const connectPromise = new Promise<void>((resolve) => {
        service.connect('ws://localhost:3000').subscribe(() => {
          resolve();
        });

        // Schedule mock connection after subscription
        setTimeout(() => {
          mockWebSocket.readyState = WS_OPEN;
          mockWebSocket.onopen?.();
        }, 0);
      });

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

    it('should return true when connected', () => {
      return new Promise<void>((done) => {
        service.connect('ws://localhost:3000').subscribe(() => {
          expect(service.isConnected()).toBe(true);
          done();
        });

        mockWebSocket.readyState = WS_OPEN;
        mockWebSocket.onopen?.();
      });
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
