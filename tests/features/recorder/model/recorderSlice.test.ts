import { describe, it, expect } from 'vitest';
import {
  recorderReducer,
  recorderActions,
} from '@/features/recorder/model/recorderSlice';
import type { RecorderState } from '@/features/recorder/model/types';

describe('recorderSlice', () => {
  const initialState: RecorderState = {
    status: 'idle',
    recordingStartTime: null,
    elapsedTime: 0,
    audio: null,
    error: null,
    webSocketStatus: 'disconnected',
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
});
