import { create } from 'zustand'
import type { TranslationEntry } from '../model/types'

interface TranslationState {
  entries: readonly TranslationEntry[]
}

interface TranslationActions {
  updateTranslation: (entry: TranslationEntry) => void
  clear: () => void
}

interface TranslationDerived {
  hasTranslation: () => boolean
  hasInterimTranslation: () => boolean
}

type TranslationStore = TranslationState & TranslationActions & TranslationDerived

const initialState: TranslationState = {
  entries: [],
}

export const useTranslationStore = create<TranslationStore>((set, get) => ({
  ...initialState,

  // Actions
  updateTranslation: (entry) => set((state) => {
    const existingIndex = state.entries.findIndex(
      (e) => e.chatId === entry.chatId
    )

    if (existingIndex >= 0) {
      // 기존 항목 업데이트
      const newEntries = [...state.entries]
      newEntries[existingIndex] = entry
      return { entries: newEntries }
    } else {
      // 새 항목 추가
      return { entries: [...state.entries, entry] }
    }
  }),

  clear: () => set(initialState),

  // Derived
  hasTranslation: () => get().entries.length > 0,

  hasInterimTranslation: () => get().entries.some((entry) => !entry.isFinal),
}))
