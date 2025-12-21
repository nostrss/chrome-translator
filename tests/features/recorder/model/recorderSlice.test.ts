import { describe, it, expect } from 'vitest';
import {
  recorderReducer,
  recorderActions,
} from '@/features/recorder/model/recorderSlice';
import type { RecorderState, Language } from '@/features/recorder/model/types';

describe('recorderSlice', () => {
  const initialState: RecorderState = {
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
    languagesError: null,
    transcript: {
      entries: [],
      interimText: '',
    },
  };

  describe('webSocketConnecting', () => {
    it('should set webSocketStatus to connecting', () => {
      const state = recorderReducer(
        initialState,
        recorderActions.webSocketConnecting()
      );

      expect(state.webSocketStatus).toBe('connecting');
    });
  });

  describe('webSocketConnected', () => {
    it('should set webSocketStatus to connected', () => {
      const connectingState: RecorderState = {
        ...initialState,
        webSocketStatus: 'connecting',
      };

      const state = recorderReducer(
        connectingState,
        recorderActions.webSocketConnected()
      );

      expect(state.webSocketStatus).toBe('connected');
    });
  });

  describe('webSocketDisconnected', () => {
    it('should set webSocketStatus to disconnected', () => {
      const connectedState: RecorderState = {
        ...initialState,
        webSocketStatus: 'connected',
      };

      const state = recorderReducer(
        connectedState,
        recorderActions.webSocketDisconnected()
      );

      expect(state.webSocketStatus).toBe('disconnected');
    });
  });

  describe('webSocketError', () => {
    it('should set webSocketStatus to error', () => {
      const connectingState: RecorderState = {
        ...initialState,
        webSocketStatus: 'connecting',
      };

      const state = recorderReducer(
        connectingState,
        recorderActions.webSocketError()
      );

      expect(state.webSocketStatus).toBe('error');
    });
  });

  describe('resetRecorder', () => {
    it('should reset webSocketStatus to disconnected', () => {
      const modifiedState: RecorderState = {
        status: 'recording',
        recordingStartTime: Date.now(),
        elapsedTime: 100,
        audio: null,
        error: 'some error',
        webSocketStatus: 'connected',
        sttStatus: 'active',
        sessionId: 'test-session',
        languages: [],
        languagesStatus: 'idle',
        selectedLanguage: null,
        languagesError: null,
        transcript: {
          entries: [{ id: '1', text: 'test', timestamp: Date.now() }],
          interimText: 'partial',
        },
      };

      const state = recorderReducer(
        modifiedState,
        recorderActions.resetRecorder()
      );

      expect(state.webSocketStatus).toBe('disconnected');
      expect(state.status).toBe('idle');
      expect(state.recordingStartTime).toBeNull();
      expect(state.elapsedTime).toBe(0);
      expect(state.error).toBeNull();
    });
  });

  describe('startRecording', () => {
    it('should not affect webSocketStatus', () => {
      const state = recorderReducer(
        initialState,
        recorderActions.startRecording()
      );

      expect(state.webSocketStatus).toBe('disconnected');
      expect(state.status).toBe('requesting');
    });
  });

  // ============================================
  // Language Actions
  // ============================================

  const mockLanguages: Language[] = [
    { code: 'en-US', name: 'English', nativeName: 'English' },
    { code: 'ko-KR', name: 'Korean', nativeName: '한국어' },
    { code: 'ja-JP', name: 'Japanese', nativeName: '日本語' },
  ];

  describe('fetchLanguages', () => {
    it('should set languagesStatus to loading', () => {
      const state = recorderReducer(
        initialState,
        recorderActions.fetchLanguages()
      );

      expect(state.languagesStatus).toBe('loading');
    });

    it('should clear languagesError', () => {
      const stateWithError: RecorderState = {
        ...initialState,
        languagesError: 'previous error',
      };

      const state = recorderReducer(
        stateWithError,
        recorderActions.fetchLanguages()
      );

      expect(state.languagesError).toBeNull();
    });
  });

  describe('fetchLanguagesSuccess', () => {
    it('should set languagesStatus to loaded', () => {
      const loadingState: RecorderState = {
        ...initialState,
        languagesStatus: 'loading',
      };

      const state = recorderReducer(
        loadingState,
        recorderActions.fetchLanguagesSuccess(mockLanguages)
      );

      expect(state.languagesStatus).toBe('loaded');
    });

    it('should store languages array', () => {
      const state = recorderReducer(
        initialState,
        recorderActions.fetchLanguagesSuccess(mockLanguages)
      );

      expect(state.languages).toEqual(mockLanguages);
      expect(state.languages).toHaveLength(3);
    });

    it('should set default language to en-US if available', () => {
      const state = recorderReducer(
        initialState,
        recorderActions.fetchLanguagesSuccess(mockLanguages)
      );

      expect(state.selectedLanguage).toBe('en-US');
    });

    it('should set first language as default if en-US not available', () => {
      const languagesWithoutEnUS: Language[] = [
        { code: 'ko-KR', name: 'Korean', nativeName: '한국어' },
        { code: 'ja-JP', name: 'Japanese', nativeName: '日本語' },
      ];

      const state = recorderReducer(
        initialState,
        recorderActions.fetchLanguagesSuccess(languagesWithoutEnUS)
      );

      expect(state.selectedLanguage).toBe('ko-KR');
    });

    it('should not override existing selectedLanguage', () => {
      const stateWithSelection: RecorderState = {
        ...initialState,
        selectedLanguage: 'ja-JP',
      };

      const state = recorderReducer(
        stateWithSelection,
        recorderActions.fetchLanguagesSuccess(mockLanguages)
      );

      expect(state.selectedLanguage).toBe('ja-JP');
    });
  });

  describe('fetchLanguagesFailure', () => {
    it('should set languagesStatus to error', () => {
      const loadingState: RecorderState = {
        ...initialState,
        languagesStatus: 'loading',
      };

      const state = recorderReducer(
        loadingState,
        recorderActions.fetchLanguagesFailure('Network error')
      );

      expect(state.languagesStatus).toBe('error');
    });

    it('should store error message', () => {
      const state = recorderReducer(
        initialState,
        recorderActions.fetchLanguagesFailure('Failed to fetch')
      );

      expect(state.languagesError).toBe('Failed to fetch');
    });
  });

  describe('selectLanguage', () => {
    it('should update selectedLanguage', () => {
      const stateWithLanguages: RecorderState = {
        ...initialState,
        languages: mockLanguages,
        languagesStatus: 'loaded',
        selectedLanguage: 'en-US',
      };

      const state = recorderReducer(
        stateWithLanguages,
        recorderActions.selectLanguage('ko-KR')
      );

      expect(state.selectedLanguage).toBe('ko-KR');
    });
  });
});
