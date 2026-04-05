import type {
  ClientMessage,
  ServerMessage,
  ConnectedData,
  SpeechResultData,
  TranslationResultData,
  ErrorCode,
  TranslationMode,
} from '@/types/websocket';

export interface WebSocketCallbacks {
  onConnected?: (sessionId: string) => void;
  onSpeechStarted?: () => void;
  onSpeechResult?: (segmentId: string, transcript: string, isFinal: boolean, detectedLanguage: string) => void;
  onTranslationResult?: (segmentId: string, original: string, translated: string, isFinal: boolean) => void;
  onSpeechStopped?: () => void;
  onError?: (code: ErrorCode, message: string) => void;
  onDisconnected?: () => void;
}

export class WebSocketService {
  private ws: WebSocket | null = null;
  private callbacks: WebSocketCallbacks = {};

  setCallbacks(callbacks: WebSocketCallbacks) {
    this.callbacks = callbacks;
  }

  connect(serverUrl: string) {
    this.ws = new WebSocket(serverUrl);

    this.ws.onopen = () => {
      this.send({ event: 'connect' });
    };

    this.ws.onmessage = (event) => {
      const msg: ServerMessage = JSON.parse(event.data as string);
      this.handleMessage(msg);
    };

    this.ws.onclose = () => {
      this.callbacks.onDisconnected?.();
    };

    this.ws.onerror = (err) => {
      console.error('WebSocket error:', err);
    };
  }

  private handleMessage(msg: ServerMessage) {
    switch (msg.event) {
      case 'connected': {
        const data = msg.data as ConnectedData;
        this.callbacks.onConnected?.(data.sessionId);
        break;
      }
      case 'speech_started':
        this.callbacks.onSpeechStarted?.();
        break;
      case 'speech_result': {
        const data = msg.data as SpeechResultData;
        this.callbacks.onSpeechResult?.(data.segmentId, data.transcript, data.isFinal, data.detectedLanguage);
        break;
      }
      case 'translation_result': {
        const data = msg.data as TranslationResultData;
        this.callbacks.onTranslationResult?.(data.segmentId, data.originalText, data.translatedText, data.isFinal);
        break;
      }
      case 'speech_stopped':
        this.callbacks.onSpeechStopped?.();
        break;
      case 'error': {
        const { code, message } = msg.error!;
        this.callbacks.onError?.(code as ErrorCode, message);
        break;
      }
    }
  }

  startSpeech(
    targetLanguageCode: string,
    translationMode: TranslationMode,
    apiKeys?: { openrouterKey?: string },
  ) {
    this.send({
      event: 'start_speech',
      data: { targetLanguageCode, translationMode, apiKeys },
    });
  }

  sendAudio(base64Audio: string) {
    this.send({ event: 'audio_chunk', data: { audio: base64Audio } });
  }

  stopSpeech() {
    this.send({ event: 'stop_speech' });
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private send(msg: ClientMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }
}
