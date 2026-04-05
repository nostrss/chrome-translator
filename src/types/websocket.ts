// ─── Client → Server ───

export type ClientEvent = 'connect' | 'start_speech' | 'audio_chunk' | 'stop_speech';

export interface ClientMessage<T = unknown> {
  event: ClientEvent;
  data?: T;
}

export interface StartSpeechData {
  targetLanguageCode?: string;
  translationMode?: TranslationMode;
  apiKeys?: { openrouterKey?: string };
  sampleRateHertz?: number;
}

export interface AudioChunkData {
  audio: string;
}

// ─── Server → Client ───

export type ServerEvent =
  | 'connected'
  | 'speech_started'
  | 'speech_result'
  | 'speech_stopped'
  | 'translation_result'
  | 'error';

export interface ServerMessage<T = unknown> {
  event: ServerEvent;
  data?: T;
  success: boolean;
  error?: { code: ErrorCode; message: string };
}

export interface ConnectedData {
  sessionId: string;
  message: string;
  timestamp: number;
}

export interface SpeechResultData {
  segmentId: string;
  transcript: string;
  isFinal: boolean;
  detectedLanguage: string;
  timestamp: number;
}

export interface TranslationResultData {
  segmentId: string;
  originalText: string;
  translatedText: string;
  isFinal: boolean;
  timestamp: number;
}

export type ErrorCode =
  | 'INVALID_MESSAGE'
  | 'UNKNOWN_EVENT'
  | 'SESSION_NOT_FOUND'
  | 'SESSION_ALREADY_ACTIVE'
  | 'ORIGIN_REJECTED'
  | 'TOO_MANY_SESSIONS'
  | 'PAYLOAD_TOO_LARGE'
  | 'VAD_TIMEOUT'
  | 'SESSION_TIMEOUT'
  | 'STT_ERROR'
  | 'TRANSLATION_ERROR'
  | 'INTERNAL_ERROR'
  | 'API_KEY_REQUIRED'
  | 'API_KEY_INVALID'
  | 'API_KEY_NO_BILLING'
  | 'API_KEY_NO_PERMISSION'
  | 'API_RATE_LIMITED'
  | 'API_QUOTA_EXCEEDED'
  | 'API_PROVIDER_ERROR';

// ─── Common ───

export interface Language {
  code: string;
  name: string;
  nativeName: string;
}

export type TranslationMode = string;

export interface Model {
  id: TranslationMode;
  name: string;
  provider: string;
  category: 'fast' | 'premium';
  isFree: boolean;
  requiredKeyType: string[] | null;
}
