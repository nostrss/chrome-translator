import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RecorderState, RecordedAudio, Language } from './types';

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
};

export const recorderSlice = createSlice({
  name: 'recorder',
  initialState,
  reducers: {
    /**
     * 녹음 시작 Intent
     */
    startRecording: (state) => {
      state.status = 'requesting';
      state.error = null;
      state.audio = null;
    },

    /**
     * 녹음 실제 시작됨 (Epic에서 호출)
     */
    recordingStarted: (state) => {
      state.status = 'recording';
      state.recordingStartTime = Date.now();
      state.elapsedTime = 0;
    },

    /**
     * 경과 시간 업데이트 (매초 Epic에서 호출)
     */
    updateElapsedTime: (state, action: PayloadAction<number>) => {
      state.elapsedTime = action.payload;
    },

    /**
     * 녹음 정지 Intent
     */
    stopRecording: (state) => {
      state.status = 'stopping';
    },

    /**
     * 녹음 완료 (Epic에서 호출)
     */
    recordingCompleted: (state, action: PayloadAction<RecordedAudio>) => {
      state.status = 'completed';
      state.audio = action.payload;
      state.recordingStartTime = null;
    },

    /**
     * 에러 발생
     */
    recordingError: (state, action: PayloadAction<string>) => {
      state.status = 'error';
      state.error = action.payload;
      state.recordingStartTime = null;
    },

    /**
     * 상태 초기화 (새 녹음 준비)
     */
    resetRecorder: (state) => {
      state.status = 'idle';
      state.recordingStartTime = null;
      state.elapsedTime = 0;
      state.audio = null;
      state.error = null;
      state.webSocketStatus = 'disconnected';
      state.sttStatus = 'idle';
      state.sessionId = null;
    },

    /**
     * WebSocket 연결 시작
     */
    webSocketConnecting: (state) => {
      state.webSocketStatus = 'connecting';
    },

    /**
     * WebSocket 연결 성공
     */
    webSocketConnected: (state) => {
      state.webSocketStatus = 'connected';
    },

    /**
     * WebSocket 연결 해제
     */
    webSocketDisconnected: (state) => {
      state.webSocketStatus = 'disconnected';
    },

    /**
     * WebSocket 연결 에러
     */
    webSocketError: (state) => {
      state.webSocketStatus = 'error';
    },

    /**
     * STT 연결 완료 (sessionId 수신)
     */
    sttConnected: (state, action: PayloadAction<string>) => {
      state.sessionId = action.payload;
    },

    /**
     * STT 시작 중
     */
    sttStarting: (state) => {
      state.sttStatus = 'starting';
    },

    /**
     * STT 시작됨
     */
    sttStarted: (state) => {
      state.sttStatus = 'active';
    },

    /**
     * STT 정지 중
     */
    sttStopping: (state) => {
      state.sttStatus = 'stopping';
    },

    /**
     * STT 정지됨
     */
    sttStopped: (state) => {
      state.sttStatus = 'stopped';
    },

    /**
     * STT 에러
     */
    sttError: (state, action: PayloadAction<string>) => {
      state.sttStatus = 'idle';
      state.error = action.payload;
    },

    /**
     * 언어 목록 로드 시작
     */
    fetchLanguages: (state) => {
      state.languagesStatus = 'loading';
      state.languagesError = null;
    },

    /**
     * 언어 목록 로드 성공
     */
    fetchLanguagesSuccess: (state, action: PayloadAction<Language[]>) => {
      state.languagesStatus = 'loaded';
      state.languages = action.payload;
      // 첫 로드 시 기본 언어 선택 (en-US 또는 첫 번째)
      if (action.payload.length > 0 && !state.selectedLanguage) {
        const defaultLang =
          action.payload.find((l) => l.code === 'en-US') ?? action.payload[0];
        state.selectedLanguage = defaultLang?.code ?? null;
      }
    },

    /**
     * 언어 목록 로드 실패
     */
    fetchLanguagesFailure: (state, action: PayloadAction<string>) => {
      state.languagesStatus = 'error';
      state.languagesError = action.payload;
    },

    /**
     * 언어 선택
     */
    selectLanguage: (state, action: PayloadAction<string>) => {
      state.selectedLanguage = action.payload;
    },
  },
});

export const recorderActions = recorderSlice.actions;
export const recorderReducer = recorderSlice.reducer;

export type RecorderAction = ReturnType<
  (typeof recorderActions)[keyof typeof recorderActions]
>;
