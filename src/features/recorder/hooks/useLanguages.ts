import { useCallback, useEffect } from 'react'
import { useLanguageStore } from '../stores/useLanguageStore'
import { useRecorderStore } from '../stores/useRecorderStore'
import type { ApiResponse, LanguagesData } from '../types'

export const useLanguages = () => {
  const {
    languages,
    selectedLanguage,
    targetLanguage,
    languagesStatus,
    languagesError,
    setLanguages,
    selectLanguage,
    selectTargetLanguage,
    setLoading,
    setError,
    isLoading,
    isLoaded,
    canSelectLanguage,
  } = useLanguageStore()

  const recorderStatus = useRecorderStore((state) => state.status)

  // Fetch languages
  const fetchLanguages = useCallback(async () => {
    const { languagesStatus: currentStatus } = useLanguageStore.getState()
    if (currentStatus === 'loading') {
      return
    }

    setLoading()

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/languages`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = (await response.json()) as ApiResponse<LanguagesData>

      if (!result.success || !result.data) {
        throw new Error(result.error?.message ?? 'Failed to fetch languages')
      }

      setLanguages(result.data.languages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch languages')
    }
  }, [setLoading, setLanguages, setError])

  // Auto-fetch languages on mount if not loaded
  useEffect(() => {
    if (languages.length === 0 && languagesStatus === 'idle') {
      fetchLanguages()
    }
  }, [languages.length, languagesStatus, fetchLanguages])

  return {
    // State
    languages,
    selectedLanguage,
    targetLanguage,
    languagesError,

    // Actions
    fetchLanguages,
    selectLanguage,
    selectTargetLanguage,

    // Derived
    isLoading: isLoading(),
    isLoaded: isLoaded(),
    canSelectLanguage: canSelectLanguage(recorderStatus),
  }
}
