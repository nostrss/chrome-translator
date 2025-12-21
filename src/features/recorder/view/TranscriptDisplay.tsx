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

  if (!hasTranslation && !isRecording) {
    return null;
  }

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">Translation</h3>

      <div className="max-h-48 overflow-y-auto">
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
