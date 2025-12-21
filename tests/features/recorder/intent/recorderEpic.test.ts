import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Subject } from 'rxjs';
import { toArray } from 'rxjs/operators';
import { recorderActions } from '@/features/recorder/model/recorderSlice';
import type { Language } from '@/features/recorder/model/types';
import type { RootState } from '@/store';
import type { RootAction } from '@/store/types';

// Epic을 직접 테스트하기 위해 모듈을 동적으로 import
// fetchLanguagesEpic만 테스트

describe('fetchLanguagesEpic', () => {
  const mockLanguages: Language[] = [
    { code: 'en-US', name: 'English', nativeName: 'English' },
    { code: 'ko-KR', name: 'Korean', nativeName: '한국어' },
  ];

  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  const createMockState = (): RootState => ({
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
      languagesError: null,
    },
  });

  it('should emit fetchLanguagesSuccess on successful API call', async () => {
    // Mock fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockLanguages),
    });

    // Dynamic import to get the epic after fetch is mocked
    const { recorderEpics } = await import(
      '@/features/recorder/intent/recorderEpic'
    );
    const fetchLanguagesEpic = recorderEpics[0];

    const action$ = new Subject<RootAction>();
    const state$ = new Subject<RootState>();

    const outputActions: RootAction[] = [];

    // Subscribe to epic output
    const subscription = fetchLanguagesEpic(
      action$ as never,
      state$ as never,
      undefined
    ).subscribe((action: RootAction) => {
      outputActions.push(action);
    });

    // Emit initial state
    state$.next(createMockState());

    // Emit fetchLanguages action
    action$.next(recorderActions.fetchLanguages());

    // Wait for async operations
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(outputActions).toHaveLength(1);
    expect(outputActions[0].type).toBe('recorder/fetchLanguagesSuccess');
    expect((outputActions[0] as ReturnType<typeof recorderActions.fetchLanguagesSuccess>).payload).toEqual(mockLanguages);

    subscription.unsubscribe();
  });

  it('should emit fetchLanguagesFailure on network error', async () => {
    // Mock fetch to reject
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    // Dynamic import
    const { recorderEpics } = await import(
      '@/features/recorder/intent/recorderEpic'
    );
    const fetchLanguagesEpic = recorderEpics[0];

    const action$ = new Subject<RootAction>();
    const state$ = new Subject<RootState>();

    const outputActions: RootAction[] = [];

    const subscription = fetchLanguagesEpic(
      action$ as never,
      state$ as never,
      undefined
    ).subscribe((action: RootAction) => {
      outputActions.push(action);
    });

    state$.next(createMockState());
    action$.next(recorderActions.fetchLanguages());

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(outputActions).toHaveLength(1);
    expect(outputActions[0].type).toBe('recorder/fetchLanguagesFailure');
    expect((outputActions[0] as ReturnType<typeof recorderActions.fetchLanguagesFailure>).payload).toBe('Network error');

    subscription.unsubscribe();
  });

  it('should emit fetchLanguagesFailure on HTTP error', async () => {
    // Mock fetch with HTTP error
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    const { recorderEpics } = await import(
      '@/features/recorder/intent/recorderEpic'
    );
    const fetchLanguagesEpic = recorderEpics[0];

    const action$ = new Subject<RootAction>();
    const state$ = new Subject<RootState>();

    const outputActions: RootAction[] = [];

    const subscription = fetchLanguagesEpic(
      action$ as never,
      state$ as never,
      undefined
    ).subscribe((action: RootAction) => {
      outputActions.push(action);
    });

    state$.next(createMockState());
    action$.next(recorderActions.fetchLanguages());

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(outputActions).toHaveLength(1);
    expect(outputActions[0].type).toBe('recorder/fetchLanguagesFailure');
    expect((outputActions[0] as ReturnType<typeof recorderActions.fetchLanguagesFailure>).payload).toContain('500');

    subscription.unsubscribe();
  });

  it('should emit fetchLanguagesFailure on JSON parse error', async () => {
    // Mock fetch with invalid JSON
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.reject(new Error('Invalid JSON')),
    });

    const { recorderEpics } = await import(
      '@/features/recorder/intent/recorderEpic'
    );
    const fetchLanguagesEpic = recorderEpics[0];

    const action$ = new Subject<RootAction>();
    const state$ = new Subject<RootState>();

    const outputActions: RootAction[] = [];

    const subscription = fetchLanguagesEpic(
      action$ as never,
      state$ as never,
      undefined
    ).subscribe((action: RootAction) => {
      outputActions.push(action);
    });

    state$.next(createMockState());
    action$.next(recorderActions.fetchLanguages());

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(outputActions).toHaveLength(1);
    expect(outputActions[0].type).toBe('recorder/fetchLanguagesFailure');

    subscription.unsubscribe();
  });
});
