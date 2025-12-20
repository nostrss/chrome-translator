// Model exports
export * from './model/types';
export {
  recorderActions,
  recorderReducer,
  type RecorderAction,
} from './model/recorderSlice';
export * from './model/recorderSelectors';

// Intent exports
export { recorderEpics } from './intent/recorderEpic';

// View exports
export { RecorderPanel } from './view/RecorderPanel';
export { RecordButton } from './view/RecordButton';
export { RecordingStatus } from './view/RecordingStatus';
export { AudioPlayer } from './view/AudioPlayer';

// Service exports
export {
  getAudioRecorderService,
  AudioRecorderService,
} from './services/AudioRecorderService';
