import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Subject } from 'rxjs';
import { recorderActions } from '@/features/recorder/model/recorderSlice';
import type { Language, ApiResponse, LanguagesData } from '@/features/recorder/model/types';
import type { RootState } from '@/store';
import type { RootAction } from '@/store/types';

// Epic을 직접 테스트하기 위해 모듈을 동적으로 import
// fetchLanguagesEpic만 테스트

describe('fetchLanguagesEpic', () => {
  const mockLanguages: Language[] = [
    { code: 'en-US', name: 'English', nativeName: 'English' },
    { code: 'ko-KR', name: 'Korean', nativeName: '한국어' },
  ];

  const mockApiResponse: ApiResponse<LanguagesData> = {
    success: true,
    data: {
      languages: mockLanguages,
      count: 2,
    },
  };

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
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
      targetLanguage: null,
      languagesError: null,
      transcript: {
        entries: [],
        interimText: '',
      },
      translation: {
        entries: [],
        interimText: '',
      },
    },
  });

  it('should emit fetchLanguagesSuccess on successful API call', async () => {
    // Mock fetch with API response format
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockApiResponse),
    } as Response);

    // Dynamic import to get the epic after fetch is mocked
    const { recorderEpics } = await import(
      '@/features/recorder/intent/recorderEpic'
    );
    const fetchLanguagesEpic = recorderEpics[0]!;

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
    expect(outputActions[0]?.type).toBe('recorder/fetchLanguagesSuccess');
    expect(
      (outputActions[0] as ReturnType<typeof recorderActions.fetchLanguagesSuccess>)?.payload
    ).toEqual(mockLanguages);

    subscription.unsubscribe();
  });

  it('should emit fetchLanguagesFailure on network error', async () => {
    // Mock fetch to reject
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

    // Dynamic import
    const { recorderEpics } = await import(
      '@/features/recorder/intent/recorderEpic'
    );
    const fetchLanguagesEpic = recorderEpics[0]!;

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
    expect(outputActions[0]?.type).toBe('recorder/fetchLanguagesFailure');
    expect(
      (outputActions[0] as ReturnType<typeof recorderActions.fetchLanguagesFailure>)?.payload
    ).toBe('Network error');

    subscription.unsubscribe();
  });

  it('should emit fetchLanguagesFailure on HTTP error', async () => {
    // Mock fetch with HTTP error
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as Response);

    const { recorderEpics } = await import(
      '@/features/recorder/intent/recorderEpic'
    );
    const fetchLanguagesEpic = recorderEpics[0]!;

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
    expect(outputActions[0]?.type).toBe('recorder/fetchLanguagesFailure');
    expect(
      (outputActions[0] as ReturnType<typeof recorderActions.fetchLanguagesFailure>)?.payload
    ).toContain('500');

    subscription.unsubscribe();
  });

  it('should emit fetchLanguagesFailure on API error response', async () => {
    // Mock fetch with API error response
    const errorResponse: ApiResponse<LanguagesData> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '언어 목록을 가져오는 데 실패했습니다.',
      },
    };

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(errorResponse),
    } as Response);

    const { recorderEpics } = await import(
      '@/features/recorder/intent/recorderEpic'
    );
    const fetchLanguagesEpic = recorderEpics[0]!;

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
    expect(outputActions[0]?.type).toBe('recorder/fetchLanguagesFailure');
    expect(
      (outputActions[0] as ReturnType<typeof recorderActions.fetchLanguagesFailure>)?.payload
    ).toBe('언어 목록을 가져오는 데 실패했습니다.');

    subscription.unsubscribe();
  });
});
