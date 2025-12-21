import { describe, it, expect } from 'vitest';
import type { RootState } from '@/store';
import type { RecorderState } from '@/features/recorder/model/types';
import {
  selectWebSocketStatus,
  selectIsWebSocketConnected,
  selectIsWebSocketConnecting,
} from '@/features/recorder/model/recorderSelectors';

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
