import { describe, it, expect, beforeEach } from 'vitest';
import { useTranslationStore } from '@/stores/useTranslationStore';

describe('useTranslationStore', () => {
  beforeEach(() => {
    useTranslationStore.getState().clear();
    useTranslationStore.getState().setTargetLanguage('en');
  });

  it('adds new segment on first upsertTranscript', () => {
    useTranslationStore.getState().upsertTranscript('seg-0', 'hello', false, 'ko');

    const state = useTranslationStore.getState();
    expect(state.segments).toHaveLength(1);
    expect(state.segments[0].segmentId).toBe('seg-0');
    expect(state.segments[0].transcript).toBe('hello');
    expect(state.segments[0].isFinal).toBe(false);
  });

  it('overwrites transcript for same segmentId', () => {
    useTranslationStore.getState().upsertTranscript('seg-0', 'hel', false, 'ko');
    useTranslationStore.getState().upsertTranscript('seg-0', 'hello world', false, 'ko');

    const state = useTranslationStore.getState();
    expect(state.segments).toHaveLength(1);
    expect(state.segments[0].transcript).toBe('hello world');
  });

  it('creates new line for different segmentId', () => {
    useTranslationStore.getState().upsertTranscript('seg-0', 'first', true, 'ko');
    useTranslationStore.getState().upsertTranscript('seg-1', 'second', false, 'ko');

    const state = useTranslationStore.getState();
    expect(state.segments).toHaveLength(2);
    expect(state.segments[0].transcript).toBe('first');
    expect(state.segments[1].transcript).toBe('second');
  });

  it('marks segment as final when isFinal is true and language differs from target', () => {
    useTranslationStore.getState().upsertTranscript('seg-0', 'hello', false, 'ko');
    useTranslationStore.getState().upsertTranscript('seg-0', 'hello world', true, 'ko');

    const state = useTranslationStore.getState();
    expect(state.segments[0].isFinal).toBe(false);
    expect(state.segments[0].transcript).toBe('hello world');
  });

  it('marks segment as final when detectedLanguage matches targetLanguage', () => {
    useTranslationStore.getState().upsertTranscript('seg-0', 'hello', false, 'en');
    useTranslationStore.getState().upsertTranscript('seg-0', 'hello world', true, 'en');

    const state = useTranslationStore.getState();
    expect(state.segments[0].isFinal).toBe(true);
    expect(state.segments[0].transcript).toBe('hello world');
  });

  it('upserts translation by segmentId', () => {
    useTranslationStore.getState().upsertTranscript('seg-0', '안녕하세요', true, 'ko');
    useTranslationStore.getState().upsertTranslation('seg-0', 'Hello', true);

    const state = useTranslationStore.getState();
    expect(state.segments[0].translation).toBe('Hello');
  });

  it('updates translation for correct segment among multiple', () => {
    useTranslationStore.getState().upsertTranscript('seg-0', 'First', true, 'ko');
    useTranslationStore.getState().upsertTranscript('seg-1', 'Second', true, 'ko');
    useTranslationStore.getState().upsertTranslation('seg-0', '첫 번째', true);

    const state = useTranslationStore.getState();
    expect(state.segments[0].translation).toBe('첫 번째');
    expect(state.segments[1].translation).toBe('');
  });

  it('ignores upsertTranslation if segmentId not found', () => {
    useTranslationStore.getState().upsertTranscript('seg-0', 'test', true, 'ko');
    useTranslationStore.getState().upsertTranslation('seg-unknown', 'translated', true);

    const state = useTranslationStore.getState();
    expect(state.segments[0].translation).toBe('');
  });

  it('clears all state', () => {
    useTranslationStore.getState().upsertTranscript('seg-0', 'test', true, 'ko');
    useTranslationStore.getState().upsertTranslation('seg-0', 'translated', true);
    useTranslationStore.getState().clear();

    const state = useTranslationStore.getState();
    expect(state.segments).toHaveLength(0);
  });
});
