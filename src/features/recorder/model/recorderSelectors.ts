import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/store';

// Base selectors
export const selectRecorderState = (state: RootState) => state.recorder;
export const selectStatus = (state: RootState) => state.recorder.status;
export const selectElapsedTime = (state: RootState) => state.recorder.elapsedTime;
export const selectAudio = (state: RootState) => state.recorder.audio;
export const selectError = (state: RootState) => state.recorder.error;
export const selectWebSocketStatus = (state: RootState) =>
  state.recorder.webSocketStatus;

// Derived selectors
export const selectIsRecording = createSelector(
  [selectStatus],
  (status) => status === 'recording'
);

export const selectIsProcessing = createSelector(
  [selectStatus],
  (status) => status === 'requesting' || status === 'stopping'
);

export const selectCanStartRecording = createSelector(
  [selectStatus],
  (status) => status === 'idle' || status === 'completed' || status === 'error'
);

export const selectCanStopRecording = createSelector(
  [selectStatus],
  (status) => status === 'recording'
);

export const selectHasRecordedAudio = createSelector(
  [selectAudio],
  (audio) => audio !== null
);

export const selectFormattedElapsedTime = createSelector(
  [selectElapsedTime],
  (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
);

export const selectAudioDuration = createSelector([selectAudio], (audio) => {
  if (!audio) return '00:00';
  const mins = Math.floor(audio.duration / 60);
  const secs = Math.floor(audio.duration % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
});

// WebSocket selectors
export const selectIsWebSocketConnected = createSelector(
  [selectWebSocketStatus],
  (status) => status === 'connected'
);

export const selectIsWebSocketConnecting = createSelector(
  [selectWebSocketStatus],
  (status) => status === 'connecting'
);
