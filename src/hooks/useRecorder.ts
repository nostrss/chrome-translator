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
    upsertTranscript,
    upsertTranslation,
    setTargetLanguage,
    clear,
  } = useTranslationStore();

  const cleanup = useCallback(() => {
    micRef.current?.stop();
    wsRef.current?.disconnect();
    micRef.current = null;
    wsRef.current = null;
  }, []);

  const start = useCallback(
    (targetLanguage: string, translationMode: TranslationMode, apiKeys?: { openrouterKey?: string }) => {
      cleanup();
      setStatus('CONNECTING');
      setTargetLanguage(targetLanguage);

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
          ws.startSpeech(targetLanguage, translationMode, apiKeys);
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
        onSpeechResult: (segmentId, transcript, isFinal, detectedLanguage) => {
          upsertTranscript(segmentId, transcript, isFinal, detectedLanguage);
        },
        onTranslationResult: (segmentId, _original, translated, isFinal) => {
          upsertTranslation(segmentId, translated, isFinal);
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
    [cleanup, setStatus, setSessionId, setError, setTargetLanguage, upsertTranscript, upsertTranslation],
  );

  const stop = useCallback(() => {
    micRef.current?.stop();
    wsRef.current?.stopSpeech();
  }, []);

  return { status, error, start, stop, reset, clear };
}
