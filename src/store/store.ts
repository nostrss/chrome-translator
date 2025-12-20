import { configureStore } from '@reduxjs/toolkit';
import { createEpicMiddleware } from 'redux-observable';
import { rootReducer } from './rootReducer';
import { rootEpic } from './rootEpic';
import type { RootAction } from './types';

export type RootState = ReturnType<typeof rootReducer>;

const epicMiddleware = createEpicMiddleware<RootAction, RootAction, RootState>();

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      thunk: false,
      serializableCheck: {
        // Blob, MediaStream 등 직렬화 불가능한 객체 무시
        ignoredActions: ['recorder/recordingCompleted'],
        ignoredPaths: ['recorder.audio.blob'],
      },
    }).concat(epicMiddleware),
  devTools: import.meta.env.DEV,
});

epicMiddleware.run(rootEpic);

export type AppDispatch = typeof store.dispatch;
