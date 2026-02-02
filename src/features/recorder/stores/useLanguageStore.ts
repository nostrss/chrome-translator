import { create } from 'zustand'
import type { Language, LanguagesStatus } from '../model/types'

interface LanguageState {
  languages: readonly Language[]
  selectedLanguage: string | null
  targetLanguage: string | null
  languagesStatus: LanguagesStatus
  languagesError: string | null
}

interface LanguageActions {
  setLanguages: (languages: Language[]) => void
  selectLanguage: (code: string) => void
  selectTargetLanguage: (code: string) => void
  setLoading: () => void
  setError: (error: string) => void
  reset: () => void
}

interface LanguageDerived {
  isLoading: () => boolean
  isLoaded: () => boolean
  canSelectLanguage: (recorderStatus: string) => boolean
}

type LanguageStore = LanguageState & LanguageActions & LanguageDerived

const initialState: LanguageState = {
  languages: [],
  selectedLanguage: null,
  targetLanguage: null,
  languagesStatus: 'idle',
  languagesError: null,
}

export const useLanguageStore = create<LanguageStore>((set, get) => ({
  ...initialState,

  // Actions
  setLanguages: (languages) => {
    const state = get()

    // 첫 로드 시 기본 언어 선택 (en-US 또는 첫 번째)
    let selectedLanguage = state.selectedLanguage
    if (languages.length > 0 && !selectedLanguage) {
      const defaultLang = languages.find((l) => l.code === 'en-US') ?? languages[0]
      selectedLanguage = defaultLang?.code ?? null
    }

    // 첫 로드 시 번역 대상 기본 언어 선택 (브라우저 언어 → en-US → 첫 번째)
    let targetLanguage = state.targetLanguage
    if (languages.length > 0 && !targetLanguage) {
      const browserLang = navigator.language

      // 1. 정확히 일치하는 언어 찾기
      let defaultTargetLang = languages.find((l) => l.code === browserLang)

      // 2. 없으면 언어 코드 prefix로 찾기 (ko-KR → ko로 시작하는 언어)
      if (!defaultTargetLang) {
        const langPrefix = browserLang.split('-')[0] ?? browserLang
        defaultTargetLang = languages.find((l) =>
          l.code.toLowerCase().startsWith(langPrefix.toLowerCase())
        )
      }

      // 3. 없으면 en-US로 폴백
      if (!defaultTargetLang) {
        defaultTargetLang = languages.find((l) => l.code === 'en-US')
      }

      // 4. en-US도 없으면 첫 번째 언어
      if (!defaultTargetLang) {
        defaultTargetLang = languages[0]
      }

      targetLanguage = defaultTargetLang?.code ?? null
    }

    set({
      languages,
      languagesStatus: 'loaded',
      languagesError: null,
      selectedLanguage,
      targetLanguage,
    })
  },

  selectLanguage: (code) => set({
    selectedLanguage: code,
  }),

  selectTargetLanguage: (code) => set({
    targetLanguage: code,
  }),

  setLoading: () => set({
    languagesStatus: 'loading',
    languagesError: null,
  }),

  setError: (error) => set({
    languagesStatus: 'error',
    languagesError: error,
  }),

  reset: () => set(initialState),

  // Derived
  isLoading: () => get().languagesStatus === 'loading',

  isLoaded: () => get().languagesStatus === 'loaded',

  canSelectLanguage: (recorderStatus) => {
    const state = get()
    const isIdleState = recorderStatus === 'idle' || recorderStatus === 'completed' || recorderStatus === 'error'
    return isIdleState && state.languagesStatus === 'loaded'
  },
}))
