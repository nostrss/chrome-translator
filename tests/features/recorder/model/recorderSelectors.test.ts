import { describe, it, expect } from 'vitest';
import type { RootState } from '@/store';
import type { RecorderState } from '@/features/recorder/model/types';
import {
  selectWebSocketStatus,
  selectIsWebSocketConnected,
  selectIsWebSocketConnecting,
  selectLanguages,
  selectLanguagesStatus,
  selectSelectedLanguage,
  selectLanguagesError,
  selectIsLanguagesLoading,
  selectIsLanguagesLoaded,
  selectCanSelectLanguage,
} from '@/features/recorder/model/recorderSelectors';
import type { Language } from '@/features/recorder/model/types';

describe('recorderSelectors (WebSocket)', () => {
  const createMockState = (
    overrides: Partial<RecorderState> = {}
  ): RootState => ({
    recorder: {
      status: 'idle',
      recordingStartTime: null,
      elapsedTime: 0,
      audio: null,
      error: null,
      webSocketStatus: 'disconnected',
      sttStatus: 'idle',
      sessionId: null,
      languages: [],
      languagesStatus: 'idle',
      selectedLanguage: null,
      targetLanguage: null,
      languagesError: null,
      transcript: {
        entries: [],
        interimText: '',
      },
      ...overrides,
    },
  });

  describe('selectWebSocketStatus', () => {
    it('should return webSocketStatus', () => {
      const state = createMockState({ webSocketStatus: 'connected' });

      expect(selectWebSocketStatus(state)).toBe('connected');
    });

    it('should return disconnected by default', () => {
      const state = createMockState();

      expect(selectWebSocketStatus(state)).toBe('disconnected');
    });
  });

  describe('selectIsWebSocketConnected', () => {
    it('should return true when status is connected', () => {
      const state = createMockState({ webSocketStatus: 'connected' });

      expect(selectIsWebSocketConnected(state)).toBe(true);
    });

    it('should return false when status is disconnected', () => {
      const state = createMockState({ webSocketStatus: 'disconnected' });

      expect(selectIsWebSocketConnected(state)).toBe(false);
    });

    it('should return false when status is connecting', () => {
      const state = createMockState({ webSocketStatus: 'connecting' });

      expect(selectIsWebSocketConnected(state)).toBe(false);
    });

    it('should return false when status is error', () => {
      const state = createMockState({ webSocketStatus: 'error' });

      expect(selectIsWebSocketConnected(state)).toBe(false);
    });
  });

  describe('selectIsWebSocketConnecting', () => {
    it('should return true when status is connecting', () => {
      const state = createMockState({ webSocketStatus: 'connecting' });

      expect(selectIsWebSocketConnecting(state)).toBe(true);
    });

    it('should return false when status is connected', () => {
      const state = createMockState({ webSocketStatus: 'connected' });

      expect(selectIsWebSocketConnecting(state)).toBe(false);
    });

    it('should return false when status is disconnected', () => {
      const state = createMockState({ webSocketStatus: 'disconnected' });

      expect(selectIsWebSocketConnecting(state)).toBe(false);
    });

    it('should return false when status is error', () => {
      const state = createMockState({ webSocketStatus: 'error' });

      expect(selectIsWebSocketConnecting(state)).toBe(false);
    });
  });
});

// ============================================
// Language Selectors
// ============================================

describe('recorderSelectors (Language)', () => {
  const mockLanguages: Language[] = [
    { code: 'en-US', name: 'English', nativeName: 'English' },
    { code: 'ko-KR', name: 'Korean', nativeName: '한국어' },
  ];

  const createMockState = (
    overrides: Partial<RecorderState> = {}
  ): RootState => ({
    recorder: {
      status: 'idle',
      recordingStartTime: null,
      elapsedTime: 0,
      audio: null,
      error: null,
      webSocketStatus: 'disconnected',
      sttStatus: 'idle',
      sessionId: null,
      languages: [],
      languagesStatus: 'idle',
      selectedLanguage: null,
      targetLanguage: null,
      languagesError: null,
      transcript: {
        entries: [],
        interimText: '',
      },
      ...overrides,
    },
  });

  describe('selectLanguages', () => {
    it('should return languages array', () => {
      const state = createMockState({ languages: mockLanguages });

      expect(selectLanguages(state)).toEqual(mockLanguages);
    });

    it('should return empty array by default', () => {
      const state = createMockState();

      expect(selectLanguages(state)).toEqual([]);
    });
  });

  describe('selectLanguagesStatus', () => {
    it('should return languagesStatus', () => {
      const state = createMockState({ languagesStatus: 'loaded' });

      expect(selectLanguagesStatus(state)).toBe('loaded');
    });
  });

  describe('selectSelectedLanguage', () => {
    it('should return selectedLanguage', () => {
      const state = createMockState({ selectedLanguage: 'ko-KR' });

      expect(selectSelectedLanguage(state)).toBe('ko-KR');
    });

    it('should return null by default', () => {
      const state = createMockState();

      expect(selectSelectedLanguage(state)).toBeNull();
    });
  });

  describe('selectLanguagesError', () => {
    it('should return languagesError', () => {
      const state = createMockState({ languagesError: 'Network error' });

      expect(selectLanguagesError(state)).toBe('Network error');
    });
  });

  describe('selectIsLanguagesLoading', () => {
    it('should return true when status is loading', () => {
      const state = createMockState({ languagesStatus: 'loading' });

      expect(selectIsLanguagesLoading(state)).toBe(true);
    });

    it('should return false when status is not loading', () => {
      const state = createMockState({ languagesStatus: 'loaded' });

      expect(selectIsLanguagesLoading(state)).toBe(false);
    });
  });

  describe('selectIsLanguagesLoaded', () => {
    it('should return true when status is loaded', () => {
      const state = createMockState({ languagesStatus: 'loaded' });

      expect(selectIsLanguagesLoaded(state)).toBe(true);
    });

    it('should return false when status is not loaded', () => {
      const state = createMockState({ languagesStatus: 'idle' });

      expect(selectIsLanguagesLoaded(state)).toBe(false);
    });
  });

  describe('selectCanSelectLanguage', () => {
    it('should return true when idle and languages loaded', () => {
      const state = createMockState({
        status: 'idle',
        languagesStatus: 'loaded',
      });

      expect(selectCanSelectLanguage(state)).toBe(true);
    });

    it('should return true when completed and languages loaded', () => {
      const state = createMockState({
        status: 'completed',
        languagesStatus: 'loaded',
      });

      expect(selectCanSelectLanguage(state)).toBe(true);
    });

    it('should return true when error and languages loaded', () => {
      const state = createMockState({
        status: 'error',
        languagesStatus: 'loaded',
      });

      expect(selectCanSelectLanguage(state)).toBe(true);
    });

    it('should return false when recording', () => {
      const state = createMockState({
        status: 'recording',
        languagesStatus: 'loaded',
      });

      expect(selectCanSelectLanguage(state)).toBe(false);
    });

    it('should return false when languages not loaded', () => {
      const state = createMockState({
        status: 'idle',
        languagesStatus: 'idle',
      });

      expect(selectCanSelectLanguage(state)).toBe(false);
    });

    it('should return false when languages loading', () => {
      const state = createMockState({
        status: 'idle',
        languagesStatus: 'loading',
      });

      expect(selectCanSelectLanguage(state)).toBe(false);
    });
  });
});
