import { useAppDispatch, useAppSelector } from '@/store';
import { recorderActions } from '@/features/recorder/model/recorderSlice';
import {
  selectCanStartRecording,
  selectCanStopRecording,
  selectIsProcessing,
} from '@/features/recorder/model/recorderSelectors';

export const RecordButton = () => {
  const dispatch = useAppDispatch();
  const canStart = useAppSelector(selectCanStartRecording);
  const canStop = useAppSelector(selectCanStopRecording);
  const isProcessing = useAppSelector(selectIsProcessing);

  const handleClick = () => {
    if (canStart) {
      dispatch(recorderActions.startRecording());
    } else if (canStop) {
      dispatch(recorderActions.stopRecording());
    }
  };

  const buttonText = isProcessing
    ? 'Processing...'
    : canStop
      ? 'Stop Recording'
      : 'Start Recording';

  const buttonStyle = canStop
    ? 'bg-red-500 hover:bg-red-600'
    : 'bg-indigo-500 hover:bg-indigo-600';

  return (
    <button
      onClick={handleClick}
      disabled={isProcessing}
      className={`
        w-full py-4 px-6 rounded-xl font-semibold text-white
        transition-all duration-200 transform
        ${buttonStyle}
        ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'}
        disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center justify-center gap-3
      `}
    >
      {isProcessing ? (
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
      ) : canStop ? (
        <div className="w-5 h-5 bg-white rounded-sm" />
      ) : (
        <div className="w-5 h-5 bg-white rounded-full" />
      )}
      {buttonText}
    </button>
  );
};
