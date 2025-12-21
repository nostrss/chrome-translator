import { Observable, Subject } from 'rxjs'
import { filter, take } from 'rxjs/operators'
import type { Result } from '@/shared/fp'
import { ok, err } from '@/shared/fp'
import type {
  WsServerMessage,
  WsClientMessage,
  WsConnectedMessage,
  WsSpeechStartedMessage,
  WsSpeechStoppedMessage,
} from '../model/types'

/**
 * WebSocket Service
 * 녹음 시작 시 서버와 WebSocket 연결을 관리
 */
export class WebSocketService {
  private socket: WebSocket | null = null
  private readonly connectionTimeout = 5000
  private messageSubject = new Subject<WsServerMessage>()

  /**
   * 서버 메시지 스트림
   */
  readonly messages$ = this.messageSubject.asObservable()

  /**
   * WebSocket 서버에 연결
   */
  connect(url: string): Observable<Result<Error, void>> {
    return new Observable<Result<Error, void>>(subscriber => {
      // 이미 연결되어 있으면 성공 반환
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        subscriber.next(ok(undefined))
        subscriber.complete()
        return
      }

      // 기존 연결 정리
      this.disconnect()

      try {
        this.socket = new WebSocket(url)

        const timeoutId = setTimeout(() => {
          if (this.socket?.readyState !== WebSocket.OPEN) {
            this.socket?.close()
            subscriber.next(err(new Error('WebSocket 연결 타임아웃')))
            subscriber.complete()
          }
        }, this.connectionTimeout)

        this.socket.onopen = () => {
          clearTimeout(timeoutId)
          subscriber.next(ok(undefined))
          subscriber.complete()
        }

        this.socket.onerror = () => {
          clearTimeout(timeoutId)
          subscriber.next(err(new Error('WebSocket 연결 에러')))
          subscriber.complete()
        }

        this.socket.onclose = () => {
          console.log('[WebSocket] 연결 종료')
        }

        // 서버 메시지 파싱 및 emit
        this.socket.onmessage = event => {
          try {
            const message = JSON.parse(event.data) as WsServerMessage
            console.log('[WebSocket] 메시지 수신:', message)
            this.messageSubject.next(message)
          } catch (e) {
            console.error('[WebSocket] 메시지 파싱 실패:', event.data)
          }
        }
      } catch (error) {
        subscriber.next(
          err(error instanceof Error ? error : new Error(String(error)))
        )
        subscriber.complete()
      }
    })
  }

  /**
   * 특정 이벤트 타입 대기
   */
  waitFor<T extends WsServerMessage['event']>(
    eventType: T
  ): Observable<Extract<WsServerMessage, { event: T }>> {
    return this.messages$.pipe(
      filter(
        (msg): msg is Extract<WsServerMessage, { event: T }> =>
          msg.event === eventType
      ),
      take(1)
    )
  }

  /**
   * 'connected' 이벤트 대기
   */
  waitForConnected(): Observable<WsConnectedMessage> {
    return this.waitFor('connected')
  }

  /**
   * 'speech_started' 이벤트 대기
   */
  waitForSpeechStarted(): Observable<WsSpeechStartedMessage> {
    return this.waitFor('speech_started')
  }

  /**
   * 'speech_stopped' 이벤트 대기
   */
  waitForSpeechStopped(): Observable<WsSpeechStoppedMessage> {
    return this.waitFor('speech_stopped')
  }

  /**
   * connect 메시지 전송
   */
  sendConnect(): Result<Error, void> {
    return this.send({ event: 'connect' })
  }

  /**
   * start_speech 메시지 전송
   */
  sendStartSpeech(language?: string): Result<Error, void> {
    return this.send(
      language
        ? { event: 'start_speech', data: { language } }
        : { event: 'start_speech' }
    )
  }

  /**
   * audio_chunk 메시지 전송
   */
  sendAudioChunk(base64Audio: string): Result<Error, void> {
    return this.send({
      event: 'audio_chunk',
      data: { audio: base64Audio },
    })
  }

  /**
   * stop_speech 메시지 전송
   */
  sendStopSpeech(): Result<Error, void> {
    return this.send({ event: 'stop_speech' })
  }

  /**
   * 메시지 전송 (내부용)
   */
  private send(message: WsClientMessage): Result<Error, void> {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return err(new Error('WebSocket이 연결되어 있지 않습니다'))
    }

    try {
      const jsonMessage = JSON.stringify(message)
      this.socket.send(jsonMessage)
      return ok(undefined)
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * 연결 해제
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.close()
      this.socket = null
    }
  }

  /**
   * 연결 상태 확인
   */
  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN
  }
}

// ============================================
// Audio Encoding Utilities
// ============================================

/**
 * Float32 → Int16 변환
 */
export const floatToInt16 = (float32Array: Float32Array): Int16Array => {
  const int16Array = new Int16Array(float32Array.length)
  for (let i = 0; i < float32Array.length; i++) {
    const rawSample = float32Array[i] ?? 0
    const sample = Math.max(-1, Math.min(1, rawSample))
    int16Array[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff
  }
  return int16Array
}

/**
 * Int16 → BASE64 인코딩
 */
export const int16ToBase64 = (int16Array: Int16Array): string => {
  const bytes = new Uint8Array(int16Array.buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i] ?? 0)
  }
  return btoa(binary)
}

/**
 * Float32 샘플을 BASE64 인코딩된 Int16 PCM으로 변환
 */
export const encodeAudioChunk = (float32Samples: Float32Array): string => {
  const int16Samples = floatToInt16(float32Samples)
  return int16ToBase64(int16Samples)
}

// 싱글톤 인스턴스
let wsInstance: WebSocketService | null = null

export const getWebSocketService = (): WebSocketService => {
  if (!wsInstance) {
    wsInstance = new WebSocketService()
  }
  return wsInstance
}
