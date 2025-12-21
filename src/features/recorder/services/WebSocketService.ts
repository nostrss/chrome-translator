import { Observable } from 'rxjs';
import type { Result } from '@/shared/fp';
import { ok, err } from '@/shared/fp';

/**
 * WebSocket Service
 * 녹음 시작 시 서버와 WebSocket 연결을 관리
 */
export class WebSocketService {
  private socket: WebSocket | null = null;
  private readonly connectionTimeout = 5000;

  /**
   * WebSocket 서버에 연결
   */
  connect(url: string): Observable<Result<Error, void>> {
    return new Observable<Result<Error, void>>((subscriber) => {
      // 이미 연결되어 있으면 성공 반환
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        subscriber.next(ok(undefined));
        subscriber.complete();
        return;
      }

      // 기존 연결 정리
      this.disconnect();

      try {
        this.socket = new WebSocket(url);

        const timeoutId = setTimeout(() => {
          if (this.socket?.readyState !== WebSocket.OPEN) {
            this.socket?.close();
            subscriber.next(err(new Error('WebSocket 연결 타임아웃')));
            subscriber.complete();
          }
        }, this.connectionTimeout);

        this.socket.onopen = () => {
          clearTimeout(timeoutId);
          subscriber.next(ok(undefined));
          subscriber.complete();
        };

        this.socket.onerror = () => {
          clearTimeout(timeoutId);
          subscriber.next(err(new Error('WebSocket 연결 에러')));
          subscriber.complete();
        };

        this.socket.onclose = () => {
          console.log('[WebSocket] 연결 종료');
        };

        this.socket.onmessage = (event) => {
          console.log('[WebSocket] 메시지 수신:', event.data);
        };
      } catch (error) {
        subscriber.next(err(error instanceof Error ? error : new Error(String(error))));
        subscriber.complete();
      }
    });
  }

  /**
   * 메시지 전송
   */
  send(message: object): Result<Error, void> {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return err(new Error('WebSocket이 연결되어 있지 않습니다'));
    }

    try {
      this.socket.send(JSON.stringify(message));
      return ok(undefined);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * 연결 해제
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  /**
   * 연결 상태 확인
   */
  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}

// 싱글톤 인스턴스
let wsInstance: WebSocketService | null = null;

export const getWebSocketService = (): WebSocketService => {
  if (!wsInstance) {
    wsInstance = new WebSocketService();
  }
  return wsInstance;
};
