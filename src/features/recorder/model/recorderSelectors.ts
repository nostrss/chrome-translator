import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/store';

// Base selectors
export const selectRecorderState = (state: RootState) => state.recorder;
export const selectStatus = (state: RootState) => state.recorder.status;
export const selectElapsedTime = (state: RootState) => state.recorder.elapsedTime;
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

export const selectFormattedElapsedTime = createSelector(
  [selectElapsedTime],
  (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
);

// WebSocket selectors
export const selectIsWebSocketConnected = createSelector(
  [selectWebSocketStatus],
  (status) => status === 'connected'
);

export const selectIsWebSocketConnecting = createSelector(
  [selectWebSocketStatus],
  (status) => status === 'connecting'
);

// Language selectors
export const selectLanguages = (state: RootState) => state.recorder.languages;
export const selectLanguagesStatus = (state: RootState) =>
  state.recorder.languagesStatus;
export const selectSelectedLanguage = (state: RootState) =>
  state.recorder.selectedLanguage;
export const selectTargetLanguage = (state: RootState) =>
  state.recorder.targetLanguage;
export const selectLanguagesError = (state: RootState) =>
  state.recorder.languagesError;

export const selectIsLanguagesLoading = createSelector(
  [selectLanguagesStatus],
  (status) => status === 'loading'
);

export const selectIsLanguagesLoaded = createSelector(
  [selectLanguagesStatus],
  (status) => status === 'loaded'
);

export const selectCanSelectLanguage = createSelector(
  [selectStatus, selectLanguagesStatus],
  (recStatus, langStatus) =>
    (recStatus === 'idle' || recStatus === 'completed' || recStatus === 'error') &&
    langStatus === 'loaded'
);

export const selectCanSelectTargetLanguage = createSelector(
  [selectStatus, selectLanguagesStatus],
  (recStatus, langStatus) =>
    (recStatus === 'idle' || recStatus === 'completed' || recStatus === 'error') &&
    langStatus === 'loaded'
);

// Transcript selectors
export const selectTranscript = (state: RootState) => state.recorder.transcript;

export const selectTranscriptEntries = (state: RootState) =>
  state.recorder.transcript.entries;

export const selectInterimTranscript = (state: RootState) =>
  state.recorder.transcript.interimText;

export const selectHasTranscript = createSelector(
  [selectTranscriptEntries, selectInterimTranscript],
  (entries, interim) => entries.length > 0 || interim.length > 0
);

// Translation selectors
export const selectTranslation = (state: RootState) => state.recorder.translation;

export const selectTranslationEntries = (state: RootState) =>
  state.recorder.translation.entries;

export const selectHasTranslation = createSelector(
  [selectTranslationEntries],
  (entries) => entries.length > 0
);

export const selectHasInterimTranslation = createSelector(
  [selectTranslationEntries],
  (entries) => entries.some((entry) => !entry.isFinal)
);
