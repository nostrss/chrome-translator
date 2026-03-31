import { useRef, useCallback } from 'react';
import { WebSocketService } from '@/services/WebSocketService';
import { AudioRecorderService } from '@/services/AudioRecorderService';
import { useRecorderStore } from '@/stores/useRecorderStore';
import { useTranslationStore } from '@/stores/useTranslationStore';
import type { TranslationMode } from '@/types/websocket';

const WS_URL = import.meta.env.VITE_WS_URL;

export function useRecorder() {
  const wsRef = useRef<WebSocketService | null>(null);
  const micRef = useRef<AudioRecorderService | null>(null);

  const { status, error, setStatus, setSessionId, setError, reset } = useRecorderStore();
  const {
    setInterimTranscript,
    setInterimTranslation,
    addFinalSegment,
    updateFinalTranslation,
    clear,
  } = useTranslationStore();

  const cleanup = useCallback(() => {
    micRef.current?.stop();
    wsRef.current?.disconnect();
    micRef.current = null;
    wsRef.current = null;
  }, []);

  const start = useCallback(
    (sourceLanguage: string, targetLanguage: string, translationMode: TranslationMode) => {
      cleanup();
      setStatus('CONNECTING');

      const ws = new WebSocketService();
      const mic = new AudioRecorderService();
      wsRef.current = ws;
      micRef.current = mic;

      mic.onAudioChunk = (base64) => {
        ws.sendAudio(base64);
      };

      ws.setCallbacks({
        onConnected: (sessionId) => {
          setSessionId(sessionId);
          setStatus('CONNECTED');
          ws.startSpeech(sourceLanguage, targetLanguage, translationMode);
        },
        onSpeechStarted: async () => {
          try {
            setStatus('RECORDING');
            await mic.start();
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Tab capture failed';
            setError({ code: 'INTERNAL_ERROR', message });
            cleanup();
            setStatus('STOPPED');
          }
        },
        onSpeechResult: (transcript, isFinal) => {
          if (isFinal) {
            addFinalSegment(transcript);
          } else {
            setInterimTranscript(transcript);
          }
        },
        onTranslationResult: (original, translated, isFinal) => {
          if (isFinal) {
            updateFinalTranslation(original, translated);
          } else {
            setInterimTranslation(original, translated);
          }
        },
        onSpeechStopped: () => {
          setStatus('STOPPED');
        },
        onError: (code, message) => {
          setError({ code, message });
          if (code === 'VAD_TIMEOUT' || code === 'SESSION_TIMEOUT') {
            cleanup();
            setStatus('STOPPED');
          }
        },
        onDisconnected: () => {
          mic.stop();
          if (useRecorderStore.getState().status !== 'STOPPED') {
            setStatus('IDLE');
          }
        },
      });

      ws.connect(WS_URL);
    },
    [cleanup, setStatus, setSessionId, setError, setInterimTranscript, setInterimTranslation, addFinalSegment, updateFinalTranslation],
  );

  const stop = useCallback(() => {
    micRef.current?.stop();
    wsRef.current?.stopSpeech();
  }, []);

  return { status, error, start, stop, reset, clear };
}
