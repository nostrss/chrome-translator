import { useAppDispatch, useAppSelector } from '@/store'
import { recorderActions } from '@/features/recorder/model/recorderSlice'
import {
  selectLanguages,
  selectTargetLanguage,
  selectIsLanguagesLoading,
  selectLanguagesError,
  selectCanSelectTargetLanguage,
} from '@/features/recorder/model/recorderSelectors'

export const TargetLanguageDropdown = () => {
  const dispatch = useAppDispatch()
  const languages = useAppSelector(selectLanguages)
  const targetLanguage = useAppSelector(selectTargetLanguage)
  const isLoading = useAppSelector(selectIsLanguagesLoading)
  const error = useAppSelector(selectLanguagesError)
  const canSelect = useAppSelector(selectCanSelectTargetLanguage)

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(recorderActions.selectTargetLanguage(e.target.value))
  }

  if (isLoading) {
    return (
      <div className='mb-4 flex items-center gap-2 text-gray-500 text-sm'>
        <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500' />
        Loading languages...
      </div>
    )
  }

  if (error) {
    return (
      <div className='mb-4 text-gray-400 text-sm'>
        Target language unavailable
      </div>
    )
  }

  return (
    <div className='mb-4'>
      <label
        htmlFor='target-language-select'
        className='block text-sm font-medium text-gray-700 mb-1'
      >
        Translation Language
      </label>
      <select
        id='target-language-select'
        value={targetLanguage ?? ''}
        onChange={handleChange}
        disabled={!canSelect}
        className={`
          w-full px-3 py-2 rounded-lg border border-gray-300
          bg-white text-gray-700
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
          ${
            !canSelect
              ? 'opacity-50 cursor-not-allowed bg-gray-100'
              : 'cursor-pointer'
          }
          transition-all duration-200
        `}
      >
        {languages.map(lang => (
          <option key={lang.code} value={lang.code}>
            {lang.nativeName} ({lang.name})
          </option>
        ))}
      </select>
    </div>
  )
}
