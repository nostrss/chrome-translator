import { combineReducers } from '@reduxjs/toolkit';
import { recorderReducer } from '@/features/recorder/model/recorderSlice';

export const rootReducer = combineReducers({
  recorder: recorderReducer,
});
