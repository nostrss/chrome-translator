import { create } from 'zustand';

export interface TranslationSegment {
  transcript: string;
  translation: string;
  timestamp: number;
}

interface TranslationState {
  interimTranscript: string;
  interimTranslation: string;
  segments: TranslationSegment[];
  setInterimTranscript: (text: string) => void;
  setInterimTranslation: (original: string, translated: string) => void;
  addFinalSegment: (transcript: string) => void;
  updateFinalTranslation: (original: string, translated: string) => void;
  clear: () => void;
}

export const useTranslationStore = create<TranslationState>((set) => ({
  interimTranscript: '',
  interimTranslation: '',
  segments: [],

  setInterimTranscript: (text) => set({ interimTranscript: text }),

  setInterimTranslation: (_original, translated) => set({ interimTranslation: translated }),

  addFinalSegment: (transcript) =>
    set((state) => ({
      interimTranscript: '',
      segments: [
        ...state.segments,
        { transcript, translation: '', timestamp: Date.now() },
      ],
    })),

  updateFinalTranslation: (original, translated) =>
    set((state) => {
      const segments = [...state.segments];
      const index = segments.findLastIndex((s) => s.transcript === original);
      const target = index !== -1 ? index : segments.length - 1;
      if (target >= 0) {
        segments[target] = { ...segments[target], translation: translated };
      }
      return { segments, interimTranslation: '' };
    }),

  clear: () => set({ interimTranscript: '', interimTranslation: '', segments: [] }),
}));
