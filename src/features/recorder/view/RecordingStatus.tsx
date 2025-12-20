import { useAppSelector } from '@/store';
import {
  selectIsRecording,
  selectFormattedElapsedTime,
  selectStatus,
} from '@/features/recorder/model/recorderSelectors';

export const RecordingStatus = () => {
  const isRecording = useAppSelector(selectIsRecording);
  const elapsedTime = useAppSelector(selectFormattedElapsedTime);
  const status = useAppSelector(selectStatus);

  if (status === 'idle') {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Click the button to start recording tab audio</p>
      </div>
    );
  }

  if (status === 'requesting') {
    return (
      <div className="text-center py-8">
        <div className="animate-pulse text-indigo-500">
          Requesting permission...
        </div>
      </div>
    );
  }

  if (isRecording) {
    return (
      <div className="text-center py-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
          <span className="text-red-500 font-semibold">Recording</span>
        </div>
        <div className="text-4xl font-mono font-bold text-gray-800">
          {elapsedTime}
        </div>
      </div>
    );
  }

  if (status === 'stopping') {
    return (
      <div className="text-center py-8">
        <div className="animate-pulse text-indigo-500">
          Processing audio...
        </div>
      </div>
    );
  }

  return null;
};
