import { describe, it, expect, beforeEach } from 'vitest';
import { useTranslationStore } from '@/stores/useTranslationStore';

describe('useTranslationStore', () => {
  beforeEach(() => {
    useTranslationStore.getState().clear();
  });

  it('sets interim transcript', () => {
    useTranslationStore.getState().setInterimTranscript('hello');
    expect(useTranslationStore.getState().interimTranscript).toBe('hello');
  });

  it('adds final segment and clears interim', () => {
    useTranslationStore.getState().setInterimTranscript('hello world');
    useTranslationStore.getState().addFinalSegment('hello world');

    const state = useTranslationStore.getState();
    expect(state.interimTranscript).toBe('');
    expect(state.segments).toHaveLength(1);
    expect(state.segments[0].transcript).toBe('hello world');
    expect(state.segments[0].translation).toBe('');
  });

  it('updates final translation on last segment', () => {
    useTranslationStore.getState().addFinalSegment('안녕하세요');
    useTranslationStore.getState().updateFinalTranslation('안녕하세요', 'Hello');

    const state = useTranslationStore.getState();
    expect(state.segments[0].translation).toBe('Hello');
  });

  it('matches translation to correct segment by originalText', () => {
    useTranslationStore.getState().addFinalSegment('First sentence');
    useTranslationStore.getState().addFinalSegment('Second sentence');
    useTranslationStore.getState().updateFinalTranslation('First sentence', '첫 번째 문장');

    const state = useTranslationStore.getState();
    expect(state.segments[0].translation).toBe('첫 번째 문장');
    expect(state.segments[1].translation).toBe('');
  });

  it('falls back to last segment when originalText not found', () => {
    useTranslationStore.getState().addFinalSegment('Some text');
    useTranslationStore.getState().updateFinalTranslation('Unknown text', 'Fallback');

    const state = useTranslationStore.getState();
    expect(state.segments[0].translation).toBe('Fallback');
  });

  it('clears all state', () => {
    useTranslationStore.getState().addFinalSegment('test');
    useTranslationStore.getState().setInterimTranscript('interim');
    useTranslationStore.getState().clear();

    const state = useTranslationStore.getState();
    expect(state.segments).toHaveLength(0);
    expect(state.interimTranscript).toBe('');
    expect(state.interimTranslation).toBe('');
  });
});
