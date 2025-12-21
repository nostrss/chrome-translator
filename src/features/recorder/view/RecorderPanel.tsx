import { useAppSelector } from '@/store';
import { selectError, selectStatus } from '@/features/recorder/model/recorderSelectors';
import { RecordButton } from './RecordButton';
import { RecordingStatus } from './RecordingStatus';
import { AudioPlayer } from './AudioPlayer';
import { LanguageDropdown } from './LanguageDropdown';

export const RecorderPanel = () => {
  const error = useAppSelector(selectError);
  const status = useAppSelector(selectStatus);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
      <div className="max-w-md mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-600 mb-2">
            Tab Audio Recorder
          </h1>
          <p className="text-gray-500 text-sm">
            Record audio from the current browser tab
          </p>
        </header>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <LanguageDropdown />
          <RecordButton />
          <RecordingStatus />

          {status === 'completed' && <AudioPlayer />}

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
