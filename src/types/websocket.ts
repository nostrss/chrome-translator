// ─── Client → Server ───

export type ClientEvent = 'connect' | 'start_speech' | 'audio_chunk' | 'stop_speech';

export interface ClientMessage<T = unknown> {
  event: ClientEvent;
  data?: T;
}

export interface StartSpeechData {
  languageCode?: string;
  targetLanguageCode?: string;
  translationMode?: 'standard' | 'advanced';
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
  transcript: string;
  isFinal: boolean;
  timestamp: number;
}

export interface TranslationResultData {
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
  | 'INTERNAL_ERROR';

// ─── Common ───

export interface Language {
  code: string;
  name: string;
  nativeName: string;
}

export type TranslationMode = 'standard' | 'advanced';
