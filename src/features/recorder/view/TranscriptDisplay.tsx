import { useAppSelector } from '@/store';
import {
  selectTranscriptEntries,
  selectInterimTranscript,
  selectHasTranscript,
  selectIsRecording,
} from '@/features/recorder/model/recorderSelectors';

export const TranscriptDisplay = () => {
  const entries = useAppSelector(selectTranscriptEntries);
  const interimText = useAppSelector(selectInterimTranscript);
  const hasTranscript = useAppSelector(selectHasTranscript);
  const isRecording = useAppSelector(selectIsRecording);

  if (!hasTranscript && !isRecording) {
    return null;
  }

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">Transcript</h3>

      <div className="max-h-48 overflow-y-auto">
        {entries.length > 0 && (
          <div className="space-y-1">
            {entries.map((entry) => (
              <p key={entry.id} className="text-sm text-gray-800 leading-relaxed">
                {entry.text}
              </p>
            ))}
          </div>
        )}

        {interimText && (
          <p className="text-sm text-gray-500 italic mt-1 animate-pulse">
            {interimText}
          </p>
        )}

        {!hasTranscript && isRecording && (
          <p className="text-sm text-gray-400 italic">Listening for speech...</p>
        )}
      </div>
    </div>
  );
};
