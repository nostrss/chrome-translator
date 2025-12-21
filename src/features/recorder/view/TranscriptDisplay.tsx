import { useRef, useEffect } from 'react';
import { useAppSelector } from '@/store';
import {
  selectTranslationEntries,
  selectInterimTranslation,
  selectHasTranslation,
  selectIsRecording,
} from '@/features/recorder/model/recorderSelectors';

export const TranscriptDisplay = () => {
  const entries = useAppSelector(selectTranslationEntries);
  const interimText = useAppSelector(selectInterimTranslation);
  const hasTranslation = useAppSelector(selectHasTranslation);
  const isRecording = useAppSelector(selectIsRecording);

  const scrollRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      isAtBottomRef.current = scrollTop + clientHeight >= scrollHeight - 10;
    }
  };

  useEffect(() => {
    if (scrollRef.current && isAtBottomRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries, interimText]);

  if (!hasTranslation && !isRecording) {
    return null;
  }

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 flex-1 flex flex-col min-h-0">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">Translation</h3>

      <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto">
        {entries.length > 0 && (
          <div className="space-y-1">
            {entries.map((text, index) => (
              <p key={index} className="text-sm text-gray-800 leading-relaxed">
                {text}
              </p>
            ))}
          </div>
        )}

        {interimText && (
          <p className="text-sm text-gray-500 italic mt-1 animate-pulse">
            {interimText}
          </p>
        )}

        {!hasTranslation && isRecording && (
          <p className="text-sm text-gray-400 italic">Waiting for translation...</p>
        )}
      </div>
    </div>
  );
};
