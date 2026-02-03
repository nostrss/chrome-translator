import { useCallback, useEffect, useRef } from 'react'
import { useRecorderStore } from '../stores/useRecorderStore'
import { useLanguageStore } from '../stores/useLanguageStore'
import { useTranslationStore } from '../stores/useTranslationStore'
import { getWebSocketService, encodeAudioChunk } from '../services/WebSocketService'
import { getAudioRecorderService } from '../services/AudioRecorderService'
import { isOk } from '@/shared/utils'
import type {
  WsTranslationResultMessage,
  WsVoiceActivityMessage,
} from '../types'

export const useRecorder = () => {
  const {
    status,
    error,
    elapsedTime,
    sessionId,
    setConnecting,
    setRecording,
    setStopping,
    setCompleted,
    setError,
    updateElapsedTime,
    reset,
    isRecording,
    canStartRecording,
    canStopRecording,
    isProcessing,
    getFormattedElapsedTime,
  } = useRecorderStore()

  const { selectedLanguage, targetLanguage } = useLanguageStore()
  const { updateTranslation, clear: clearTranslation } = useTranslationStore()

  // Refs for cleanup
  const cleanupRef = useRef<(() => void)[]>([])
  const isStoppingRef = useRef(false)

  // Cleanup function
  const cleanup = useCallback(() => {
    cleanupRef.current.forEach((fn) => fn())
    cleanupRef.current = []

    const wsService = getWebSocketService()
    const recorder = getAudioRecorderService()

    wsService.removeAllHandlers()
    recorder.removeAllHandlers()
    recorder.stopElapsedTimeUpdates()
    wsService.disconnect()
  }, [])

  // Stop recording flow
  const stopRecordingFlow = useCallback(async (errorMessage?: string) => {
    if (isStoppingRef.current) return
    isStoppingRef.current = true

    const wsService = getWebSocketService()
    const recorder = getAudioRecorderService()

    setStopping()

    try {
      // 1. stop_speech 전송
      wsService.sendStopSpeech()

      // 2. speech_stopped 대기 (2초 타임아웃, 실패해도 진행)
      try {
        await wsService.waitForSpeechStopped(2000)
      } catch {
        // 타임아웃 무시
      }

      // 3. 오디오 녹음 중지
      await recorder.stopRecording()

      // 4. 정리
      cleanup()

      // 5. 상태 업데이트
      if (errorMessage) {
        setError(errorMessage)
      } else {
        setCompleted()
      }
    } catch (err) {
      cleanup()
      setError(err instanceof Error ? err.message : 'Failed to stop recording')
    } finally {
      isStoppingRef.current = false
    }
  }, [cleanup, setCompleted, setError, setStopping])

  // Start recording
  const startRecording = useCallback(async () => {
    if (!canStartRecording()) return

    const wsService = getWebSocketService()
    const recorder = getAudioRecorderService()

    // 초기화
    reset()
    clearTranslation()
    setConnecting()
    isStoppingRef.current = false

    try {
      // 1. WebSocket 연결
      const wsResult = await wsService.connect(import.meta.env.VITE_WS_URL)
      if (!isOk(wsResult)) {
        throw new Error('WebSocket 연결 실패')
      }

      // 2. connect 메시지 전송
      const sendResult = wsService.sendConnect()
      if (!isOk(sendResult)) {
        throw new Error('connect 메시지 전송 실패')
      }

      // 3. connected 응답 대기
      const connectedResponse = await wsService.waitForConnected()
      const newSessionId = connectedResponse.data.sessionId

      // 4. 오디오 녹음 시작
      const recordResult = await recorder.startRecording()
      if (!isOk(recordResult)) {
        throw new Error(recordResult.error.message)
      }

      // 5. start_speech 메시지 전송
      const speechResult = wsService.sendStartSpeech(
        selectedLanguage ?? undefined,
        targetLanguage ?? undefined
      )
      if (!isOk(speechResult)) {
        throw new Error('start_speech 메시지 전송 실패')
      }

      // 6. speech_started 응답 대기
      await wsService.waitForSpeechStarted()

      // 7. 녹음 상태로 전환
      setRecording(newSessionId)

      // 8. 오디오 청크 스트리밍 설정
      const unsubAudio = recorder.onAudioChunk((samples) => {
        const base64Audio = encodeAudioChunk(samples)
        const result = wsService.sendAudioChunk(base64Audio)
        if (!isOk(result)) {
          console.warn('[AudioChunk] 전송 실패:', result.error.message)
        }
      })
      cleanupRef.current.push(unsubAudio)

      // 9. 경과 시간 업데이트 시작
      const startTime = Date.now()
      const stopElapsed = recorder.startElapsedTimeUpdates(startTime, updateElapsedTime)
      cleanupRef.current.push(stopElapsed)

      // 10. 메시지 핸들러 설정
      const unsubMessage = wsService.onMessage((message) => {
        // Translation result 처리
        if (message.event === 'translation_result') {
          const msg = message as WsTranslationResultMessage
          updateTranslation({
            chatId: msg.data.chatId,
            originalText: msg.data.originalText,
            translatedText: msg.data.translatedText,
            isFinal: msg.data.isFinal,
            model: msg.data.model,
            timestamp: msg.data.timestamp,
          })
        }

        // 에러 처리
        if (message.event === 'error') {
          const errorMsg = 'error' in message ? message.error : 'Unknown server error'
          stopRecordingFlow(errorMsg as string)
        }

        // Voice activity timeout 처리
        if (message.event === 'voice_activity') {
          const msg = message as WsVoiceActivityMessage
          if (msg.data.type === 'timeout') {
            stopRecordingFlow()
          }
        }
      })
      cleanupRef.current.push(unsubMessage)

      // 11. WebSocket close 핸들러 설정
      const unsubClose = wsService.onClose(() => {
        const currentStatus = useRecorderStore.getState().status

        // 이미 stopping이면 무시
        if (currentStatus === 'stopping') return

        // 녹음 중이면 정상 종료
        if (currentStatus === 'recording' || currentStatus === 'requesting') {
          stopRecordingFlow()
        }
      })
      cleanupRef.current.push(unsubClose)

    } catch (err) {
      console.error('[Recorder Error]', err)
      cleanup()
      setError(err instanceof Error ? err.message : 'Failed to start recording')
    }
  }, [
    canStartRecording,
    reset,
    clearTranslation,
    setConnecting,
    setRecording,
    setError,
    selectedLanguage,
    targetLanguage,
    updateElapsedTime,
    updateTranslation,
    stopRecordingFlow,
    cleanup,
  ])

  // Stop recording
  const stopRecording = useCallback(async () => {
    if (!canStopRecording()) return
    await stopRecordingFlow()
  }, [canStopRecording, stopRecordingFlow])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  return {
    // State
    status,
    error,
    elapsedTime,
    sessionId,

    // Actions
    startRecording,
    stopRecording,
    reset,

    // Derived
    isRecording: isRecording(),
    canStartRecording: canStartRecording(),
    canStopRecording: canStopRecording(),
    isProcessing: isProcessing(),
    formattedElapsedTime: getFormattedElapsedTime(),
  }
}
