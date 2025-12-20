import { combineEpics } from 'redux-observable';
import { recorderEpics } from '@/features/recorder/intent/recorderEpic';

export const rootEpic = combineEpics(...recorderEpics);
