import { create } from 'zustand';

export interface TranslationSegment {
  segmentId: string;
  transcript: string;
  translation: string;
  detectedLanguage: string;
  isFinal: boolean;
  timestamp: number;
}

interface TranslationState {
  segments: TranslationSegment[];
  targetLanguage: string;
  setTargetLanguage: (lang: string) => void;
  upsertTranscript: (segmentId: string, transcript: string, isFinal: boolean, detectedLanguage: string) => void;
  upsertTranslation: (segmentId: string, translatedText: string, isFinal: boolean) => void;
  clear: () => void;
}

export const useTranslationStore = create<TranslationState>((set) => ({
  segments: [],
  targetLanguage: '',

  setTargetLanguage: (lang) => set({ targetLanguage: lang }),

  upsertTranscript: (segmentId, transcript, isFinal, detectedLanguage) =>
    set((state) => {
      const segments = [...state.segments];
      const sameLanguage = detectedLanguage === state.targetLanguage;
      const index = segments.findIndex((s) => s.segmentId === segmentId);
      if (index !== -1) {
        segments[index] = {
          ...segments[index],
          transcript,
          detectedLanguage,
          ...(sameLanguage && { isFinal }),
        };
      } else {
        segments.push({
          segmentId,
          transcript,
          translation: '',
          detectedLanguage,
          isFinal: sameLanguage ? isFinal : false,
          timestamp: Date.now(),
        });
      }
      return { segments };
    }),

  upsertTranslation: (segmentId, translatedText, isFinal) =>
    set((state) => {
      const segments = [...state.segments];
      const index = segments.findIndex((s) => s.segmentId === segmentId);
      if (index !== -1) {
        segments[index] = {
          ...segments[index],
          translation: translatedText,
          isFinal,
        };
      }
      return { segments };
    }),

  clear: () => set({ segments: [] }),
}));
