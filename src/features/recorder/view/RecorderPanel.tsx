import { useAppSelector } from '@/store';
import { selectError } from '@/features/recorder/model/recorderSelectors';
import { RecordButton } from './RecordButton';
import { RecordingStatus } from './RecordingStatus';
import { LanguageDropdown } from './LanguageDropdown';
import { TargetLanguageDropdown } from './TargetLanguageDropdown';
import { TranscriptDisplay } from './TranscriptDisplay';

export const RecorderPanel = () => {
  const error = useAppSelector(selectError);

  return (
    <div className="h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4 flex flex-col">
      <div className="max-w-md mx-auto w-full flex flex-col flex-1 min-h-0">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-600 mb-2">
            Tab Audio Recorder
          </h1>
          <p className="text-gray-500 text-sm">
            Record audio from the current browser tab
          </p>
        </header>

        <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col flex-1 min-h-0">
          <LanguageDropdown />
          <TargetLanguageDropdown />
          <RecordButton />
          <RecordingStatus />
          <TranscriptDisplay />

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              <strong>Error:</strong> {error}
            </div>
          )}
        </div>

        <footer className="text-center mt-6 text-xs text-gray-400">
          <p>Audio is resampled to 16kHz mono WAV format</p>
        </footer>
      </div>
    </div>
  );
};
