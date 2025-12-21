import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { recorderActions } from '@/features/recorder/model/recorderSlice';
import {
  selectLanguages,
  selectSelectedLanguage,
  selectIsLanguagesLoading,
  selectLanguagesError,
  selectCanSelectLanguage,
} from '@/features/recorder/model/recorderSelectors';

export const LanguageDropdown = () => {
  const dispatch = useAppDispatch();
  const languages = useAppSelector(selectLanguages);
  const selectedLanguage = useAppSelector(selectSelectedLanguage);
  const isLoading = useAppSelector(selectIsLanguagesLoading);
  const error = useAppSelector(selectLanguagesError);
  const canSelect = useAppSelector(selectCanSelectLanguage);

  useEffect(() => {
    if (languages.length === 0) {
      dispatch(recorderActions.fetchLanguages());
    }
  }, [dispatch, languages.length]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(recorderActions.selectLanguage(e.target.value));
  };

  const handleRetry = () => {
    dispatch(recorderActions.fetchLanguages());
  };

  if (isLoading) {
    return (
      <div className="mb-4 flex items-center gap-2 text-gray-500 text-sm">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500" />
        Loading languages...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-4 flex items-center gap-2 text-red-500 text-sm">
        <span>Failed to load languages</span>
        <button
          onClick={handleRetry}
          className="text-indigo-500 hover:text-indigo-700 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <label
        htmlFor="language-select"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        STT Language
      </label>
      <select
        id="language-select"
        value={selectedLanguage ?? ''}
        onChange={handleChange}
        disabled={!canSelect}
        className={`
          w-full px-3 py-2 rounded-lg border border-gray-300
          bg-white text-gray-700
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
          ${!canSelect ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'cursor-pointer'}
          transition-all duration-200
        `}
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.nativeName} ({lang.name})
          </option>
        ))}
      </select>
    </div>
  );
};
