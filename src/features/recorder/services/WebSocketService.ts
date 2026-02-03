import type { Result } from '@/shared/utils'
import { ok, err } from '@/shared/utils'
import type {
  WsServerMessage,
  WsClientMessage,
  WsConnectedMessage,
  WsSpeechStartedMessage,
  WsSpeechStoppedMessage,
} from '../types'

type MessageHandler = (message: WsServerMessage) => void
type CloseHandler = (event: { code: number; reason: string; wasClean: boolean }) => void

interface PendingResolver<T> {
  resolve: (value: T) => void
  reject: (error: Error) => void
  timeoutId: ReturnType<typeof setTimeout>
}

/**
 * WebSocket Service
 * 녹음 시작 시 서버와 WebSocket 연결을 관리
 */
export class WebSocketService {
  private socket: WebSocket | null = null
  private readonly connectionTimeout = 5000

  // 콜백 기반 핸들러
  private messageHandlers = new Set<MessageHandler>()
  private closeHandlers = new Set<CloseHandler>()

  // Promise 기반 이벤트 대기
  private pendingResolvers = new Map<string, PendingResolver<WsServerMessage>>()

  /**
   * 메시지 핸들러 등록
   */
  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler)
    return () => this.messageHandlers.delete(handler)
  }

  /**
   * 연결 종료 핸들러 등록
   */
  onClose(handler: CloseHandler): () => void {
    this.closeHandlers.add(handler)
    return () => this.closeHandlers.delete(handler)
  }

  /**
   * WebSocket 서버에 연결
   */
  connect(url: string): Promise<Result<Error, void>> {
    return new Promise<Result<Error, void>>((resolve) => {
      // 이미 연결되어 있으면 성공 반환
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        resolve(ok(undefined))
        return
      }

      // 기존 연결 정리
      this.disconnect()

      try {
        this.socket = new WebSocket(url)

        const timeoutId = setTimeout(() => {
          if (this.socket?.readyState !== WebSocket.OPEN) {
            this.socket?.close()
            resolve(err(new Error('WebSocket 연결 타임아웃')))
          }
        }, this.connectionTimeout)

        this.socket.onopen = () => {
          clearTimeout(timeoutId)
          resolve(ok(undefined))
        }

        this.socket.onerror = () => {
          clearTimeout(timeoutId)
          resolve(err(new Error('WebSocket 연결 에러')))
        }

        this.socket.onclose = (event) => {
          console.log('[WebSocket] 연결 종료', { code: event.code, reason: event.reason, wasClean: event.wasClean })
          const closeEvent = {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean,
          }
          this.closeHandlers.forEach(handler => handler(closeEvent))
        }

        // 서버 메시지 파싱 및 emit
        this.socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as WsServerMessage
            console.log('[WebSocket] 메시지 수신:', message)

            // 등록된 모든 핸들러에 메시지 전달
            this.messageHandlers.forEach(handler => handler(message))

            // pending resolver 확인 및 resolve
            const resolver = this.pendingResolvers.get(message.event)
            if (resolver) {
              clearTimeout(resolver.timeoutId)
              this.pendingResolvers.delete(message.event)
              resolver.resolve(message)
            }
          } catch (e) {
            console.error('[WebSocket] 메시지 파싱 실패:', event.data)
          }
        }
      } catch (error) {
        resolve(err(error instanceof Error ? error : new Error(String(error))))
      }
    })
  }

  /**
   * 특정 이벤트 타입 대기 (Promise 기반)
   */
  waitFor<T extends WsServerMessage['event']>(
    eventType: T,
    timeoutMs = 5000
  ): Promise<Extract<WsServerMessage, { event: T }>> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pendingResolvers.delete(eventType)
        reject(new Error(`${eventType} 응답 타임아웃`))
      }, timeoutMs)

      this.pendingResolvers.set(eventType, {
        resolve: resolve as (value: WsServerMessage) => void,
        reject,
        timeoutId,
      })
    })
  }

  /**
   * 'connected' 이벤트 대기
   */
  waitForConnected(timeoutMs = 5000): Promise<WsConnectedMessage> {
    return this.waitFor('connected', timeoutMs)
  }

  /**
   * 'speech_started' 이벤트 대기
   */
  waitForSpeechStarted(timeoutMs = 5000): Promise<WsSpeechStartedMessage> {
    return this.waitFor('speech_started', timeoutMs)
  }

  /**
   * 'speech_stopped' 이벤트 대기
   */
  waitForSpeechStopped(timeoutMs = 5000): Promise<WsSpeechStoppedMessage> {
    return this.waitFor('speech_stopped', timeoutMs)
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
  sendStartSpeech(languageCode?: string, targetLanguageCode?: string): Result<Error, void> {
    return this.send(
      languageCode && targetLanguageCode
        ? { event: 'start_speech', data: { languageCode, targetLanguageCode } }
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
    // pending resolvers 정리
    this.pendingResolvers.forEach((resolver) => {
      clearTimeout(resolver.timeoutId)
      resolver.reject(new Error('WebSocket disconnected'))
    })
    this.pendingResolvers.clear()

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

  /**
   * 모든 핸들러 제거
   */
  removeAllHandlers(): void {
    this.messageHandlers.clear()
    this.closeHandlers.clear()
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
