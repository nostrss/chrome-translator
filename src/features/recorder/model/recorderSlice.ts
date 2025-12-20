import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RecorderState, RecordedAudio } from './types';

const initialState: RecorderState = {
  status: 'idle',
  recordingStartTime: null,
  elapsedTime: 0,
  audio: null,
  error: null,
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
    },
  },
});

export const recorderActions = recorderSlice.actions;
export const recorderReducer = recorderSlice.reducer;

export type RecorderAction = ReturnType<
  (typeof recorderActions)[keyof typeof recorderActions]
>;
