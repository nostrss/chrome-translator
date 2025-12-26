import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { LanguageDropdown } from '@/features/recorder/view/LanguageDropdown';
import { recorderReducer } from '@/features/recorder/model/recorderSlice';
import type { RecorderState, Language } from '@/features/recorder/model/types';

const mockLanguages: Language[] = [
  { code: 'en-US', name: 'English', nativeName: 'English' },
  { code: 'ko-KR', name: 'Korean', nativeName: '한국어' },
  { code: 'ja-JP', name: 'Japanese', nativeName: '日本語' },
];

const createMockStore = (recorderState: Partial<RecorderState> = {}) => {
  const defaultState: RecorderState = {
    status: 'idle',
    recordingStartTime: null,
    elapsedTime: 0,
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
    },
    ...recorderState,
  };

  return configureStore({
    reducer: {
      recorder: recorderReducer,
    },
    preloadedState: {
      recorder: defaultState,
    },
  });
};

const renderWithStore = (
  recorderState: Partial<RecorderState> = {},
  store = createMockStore(recorderState)
) => {
  return {
    ...render(
      <Provider store={store}>
        <LanguageDropdown />
      </Provider>
    ),
    store,
  };
};

describe('LanguageDropdown', () => {
  describe('초기 로드', () => {
    it('should dispatch fetchLanguages on mount when languages empty', () => {
      const store = createMockStore({ languages: [] });
      const dispatchSpy = vi.spyOn(store, 'dispatch');

      renderWithStore({}, store);

      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'recorder/fetchLanguages' })
      );
    });

    it('should not dispatch fetchLanguages if languages already loaded', () => {
      const store = createMockStore({
        languages: mockLanguages,
        languagesStatus: 'loaded',
      });
      const dispatchSpy = vi.spyOn(store, 'dispatch');

      renderWithStore({}, store);

      expect(dispatchSpy).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: 'recorder/fetchLanguages' })
      );
    });
  });

  describe('로딩 상태', () => {
    it('should show loading spinner when loading', () => {
      renderWithStore({
        languagesStatus: 'loading',
      });

      expect(screen.getByText('Loading languages...')).toBeInTheDocument();
    });
  });

  describe('에러 상태', () => {
    it('should show error message when error', () => {
      // languages에 값을 넣어서 useEffect가 fetchLanguages를 호출하지 않도록 함
      renderWithStore({
        languages: mockLanguages,
        languagesStatus: 'error',
        languagesError: 'Network error',
      });

      expect(screen.getByText('Failed to load languages')).toBeInTheDocument();
    });

    it('should dispatch fetchLanguages on retry click', () => {
      const store = createMockStore({
        languages: mockLanguages,
        languagesStatus: 'error',
        languagesError: 'Network error',
      });
      const dispatchSpy = vi.spyOn(store, 'dispatch');

      renderWithStore({}, store);

      // Clear initial dispatch calls
      dispatchSpy.mockClear();

      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);

      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'recorder/fetchLanguages' })
      );
    });
  });

  describe('정상 상태', () => {
    it('should render select with languages', () => {
      renderWithStore({
        languages: mockLanguages,
        languagesStatus: 'loaded',
        selectedLanguage: 'en-US',
      });

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });

    it('should show nativeName and name for each option', () => {
      renderWithStore({
        languages: mockLanguages,
        languagesStatus: 'loaded',
        selectedLanguage: 'en-US',
      });

      expect(screen.getByText('English (English)')).toBeInTheDocument();
      expect(screen.getByText('한국어 (Korean)')).toBeInTheDocument();
      expect(screen.getByText('日本語 (Japanese)')).toBeInTheDocument();
    });

    it('should have correct selected value', () => {
      renderWithStore({
        languages: mockLanguages,
        languagesStatus: 'loaded',
        selectedLanguage: 'ko-KR',
      });

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('ko-KR');
    });

    it('should show Tab Speech Language label', () => {
      renderWithStore({
        languages: mockLanguages,
        languagesStatus: 'loaded',
        selectedLanguage: 'en-US',
      });

      expect(screen.getByText('Tab Speech Language')).toBeInTheDocument();
    });
  });

  describe('상호작용', () => {
    it('should dispatch selectLanguage on change', () => {
      const store = createMockStore({
        languages: mockLanguages,
        languagesStatus: 'loaded',
        selectedLanguage: 'en-US',
      });
      const dispatchSpy = vi.spyOn(store, 'dispatch');

      renderWithStore({}, store);

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'ko-KR' } });

      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'recorder/selectLanguage',
          payload: 'ko-KR',
        })
      );
    });

    it('should be disabled when canSelect is false (recording)', () => {
      renderWithStore({
        status: 'recording',
        languages: mockLanguages,
        languagesStatus: 'loaded',
        selectedLanguage: 'en-US',
      });

      const select = screen.getByRole('combobox');
      expect(select).toBeDisabled();
    });

    it('should be enabled when canSelect is true (idle)', () => {
      renderWithStore({
        status: 'idle',
        languages: mockLanguages,
        languagesStatus: 'loaded',
        selectedLanguage: 'en-US',
      });

      const select = screen.getByRole('combobox');
      expect(select).not.toBeDisabled();
    });

    it('should be disabled when languages not loaded', () => {
      renderWithStore({
        status: 'idle',
        languages: mockLanguages,
        languagesStatus: 'loading',
        selectedLanguage: null,
      });

      // Loading 상태에서는 select가 렌더링되지 않음
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    });
  });
});
