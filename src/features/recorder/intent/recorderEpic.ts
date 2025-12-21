import { type Epic, ofType } from 'redux-observable';
import {
  switchMap,
  map,
  catchError,
  takeUntil,
  tap,
  ignoreElements,
  filter,
} from 'rxjs/operators';
import { of, concat } from 'rxjs';
import type { RootState } from '@/store';
import type { RootAction } from '@/store/types';
import { recorderActions } from '@/features/recorder/model/recorderSlice';
import { getAudioRecorderService } from '@/features/recorder/services/AudioRecorderService';
import { getWebSocketService } from '@/features/recorder/services/WebSocketService';
import { isOk } from '@/shared/fp';

type RecorderEpic = Epic<RootAction, RootAction, RootState>;

/**
 * Epic: 녹음 시작
 * Triggers on: startRecording
 * Flow: WebSocket 연결 → connect 메시지 전송 → 녹음 시작
 * Emits: webSocketConnecting, webSocketConnected, recordingStarted or recordingError
 */
const startRecordingEpic: RecorderEpic = (action$) =>
  action$.pipe(
    ofType(recorderActions.startRecording.type),
    switchMap(() => {
      const wsService = getWebSocketService();
      const recorder = getAudioRecorderService();

      return concat(
        // 1. WebSocket 연결 시작 상태
        of(recorderActions.webSocketConnecting()),
        // 2. WebSocket 연결 및 녹음 시작
        wsService.connect('ws://localhost:3000').pipe(
          switchMap((wsResult) => {
            if (!isOk(wsResult)) {
              return of(recorderActions.recordingError('WebSocket 연결 실패'));
            }

            // 3. connect 메시지 전송
            wsService.send({ event: 'connect', requestId: 'req-001' });

            // 4. 녹음 시작
            return concat(
              of(recorderActions.webSocketConnected()),
              recorder.startRecording().pipe(
                switchMap((result) => {
                  if (isOk(result)) {
                    return of(recorderActions.recordingStarted());
                  } else {
                    return of(recorderActions.recordingError(result.error.message));
                  }
                })
              )
            );
          }),
          catchError((error) =>
            of(
              recorderActions.recordingError(
                error instanceof Error ? error.message : 'Failed to start recording'
              )
            )
          )
        )
      );
    })
  );

/**
 * Epic: 경과 시간 업데이트
 * Triggers on: recordingStarted
 * Emits: updateElapsedTime every second
 * Stops on: stopRecording or recordingError
 */
const elapsedTimeEpic: RecorderEpic = (action$) =>
  action$.pipe(
    ofType(recorderActions.recordingStarted.type),
    switchMap(() => {
      const startTime = Date.now();
      const recorder = getAudioRecorderService();

      return recorder.getElapsedTime$(startTime).pipe(
        map((elapsed) => recorderActions.updateElapsedTime(elapsed)),
        takeUntil(
          action$.pipe(
            filter(
              (action) =>
                action.type === recorderActions.stopRecording.type ||
                action.type === recorderActions.recordingError.type
            )
          )
        )
      );
    })
  );

/**
 * Epic: 녹음 정지 및 WAV 생성
 * Triggers on: stopRecording
 * Emits: recordingCompleted or recordingError
 */
const stopRecordingEpic: RecorderEpic = (action$) =>
  action$.pipe(
    ofType(recorderActions.stopRecording.type),
    switchMap(() => {
      const recorder = getAudioRecorderService();

      return recorder.stopRecording().pipe(
        map((result) => {
          if (isOk(result)) {
            return recorderActions.recordingCompleted(result.value);
          } else {
            return recorderActions.recordingError(result.error.message);
          }
        }),
        catchError((error) =>
          of(
            recorderActions.recordingError(
              error instanceof Error ? error.message : 'Failed to stop recording'
            )
          )
        )
      );
    })
  );

/**
 * Epic: 에러 로깅
 */
const errorLoggingEpic: RecorderEpic = (action$) =>
  action$.pipe(
    ofType(recorderActions.recordingError.type),
    tap((action) => {
      console.error('[Recorder Error]', (action as { payload: string }).payload);
    }),
    ignoreElements()
  );

/**
 * Epic: WebSocket 연결 해제
 * Triggers on: stopRecording, recordingError, recordingCompleted
 * 녹음 종료 시 WebSocket 연결을 해제
 */
const webSocketDisconnectEpic: RecorderEpic = (action$) =>
  action$.pipe(
    ofType(
      recorderActions.stopRecording.type,
      recorderActions.recordingError.type,
      recorderActions.recordingCompleted.type
    ),
    tap(() => {
      const wsService = getWebSocketService();
      wsService.disconnect();
    }),
    map(() => recorderActions.webSocketDisconnected())
  );

// Export all epics as array
export const recorderEpics = [
  startRecordingEpic,
  elapsedTimeEpic,
  stopRecordingEpic,
  errorLoggingEpic,
  webSocketDisconnectEpic,
];
