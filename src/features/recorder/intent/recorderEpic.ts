import { type Epic, ofType } from 'redux-observable';
import {
  switchMap,
  map,
  catchError,
  takeUntil,
  tap,
  ignoreElements,
  filter,
  withLatestFrom,
} from 'rxjs/operators';
import { of, concat, race, timer, from } from 'rxjs';
import type {
  ApiResponse,
  LanguagesData,
} from '@/features/recorder/model/types';
import type { RootState } from '@/store';
import type { RootAction } from '@/store/types';
import { recorderActions } from '@/features/recorder/model/recorderSlice';
import { getAudioRecorderService } from '@/features/recorder/services/AudioRecorderService';
import {
  getWebSocketService,
  encodeAudioChunk,
} from '@/features/recorder/services/WebSocketService';
import { isOk } from '@/shared/fp';

type RecorderEpic = Epic<RootAction, RootAction, RootState>;

/**
 * Epic: 녹음 시작
 * Flow:
 * 1. WebSocket 연결
 * 2. connect 메시지 전송 → connected 응답 대기
 * 3. 오디오 녹음 시작
 * 4. start_speech 메시지 전송 (선택된 언어 포함) → speech_started 응답 대기
 */
const startRecordingEpic: RecorderEpic = (action$, state$) =>
  action$.pipe(
    ofType(recorderActions.startRecording.type),
    withLatestFrom(state$),
    switchMap(([, state]) => {
      const wsService = getWebSocketService();
      const recorder = getAudioRecorderService();
      const selectedLanguage = state.recorder.selectedLanguage;

      return concat(
        // 1. WebSocket 연결 시작 상태
        of(recorderActions.webSocketConnecting()),

        // 2. WebSocket 연결 및 프로토콜 실행
        wsService.connect('ws://localhost:3000').pipe(
          switchMap((wsResult) => {
            if (!isOk(wsResult)) {
              return of(recorderActions.recordingError('WebSocket 연결 실패'));
            }

            // 3. connect 메시지 전송
            const sendResult = wsService.sendConnect();
            if (!isOk(sendResult)) {
              return of(recorderActions.recordingError('connect 메시지 전송 실패'));
            }

            // 4. connected 응답 대기 (5초 타임아웃)
            return race(
              wsService.waitForConnected(),
              timer(5000).pipe(
                map(() => ({ event: 'timeout' as const }))
              )
            ).pipe(
              switchMap((response) => {
                if (response.event === 'timeout') {
                  return of(recorderActions.recordingError('connected 응답 타임아웃'));
                }

                const sessionId = response.data.sessionId;

                return concat(
                  of(recorderActions.webSocketConnected()),
                  of(recorderActions.sttConnected(sessionId)),

                  // 5. 오디오 녹음 시작
                  recorder.startRecording().pipe(
                    switchMap((result) => {
                      if (!isOk(result)) {
                        return of(recorderActions.recordingError(result.error.message));
                      }

                      // 6. start_speech 메시지 전송
                      return concat(
                        of(recorderActions.sttStarting()),

                        // start_speech 메시지 전송 (동기적으로, 선택된 언어 포함)
                        of(null).pipe(
                          tap(() => {
                            const speechResult = wsService.sendStartSpeech(
                              selectedLanguage ?? undefined
                            );
                            if (!isOk(speechResult)) {
                              throw new Error('start_speech 메시지 전송 실패');
                            }
                          }),
                          ignoreElements()
                        ),

                        // 7. speech_started 응답 대기 (5초 타임아웃)
                        race(
                          wsService.waitForSpeechStarted(),
                          timer(5000).pipe(
                            map(() => ({ event: 'timeout' as const }))
                          )
                        ).pipe(
                          switchMap((speechResponse) => {
                            if (speechResponse.event === 'timeout') {
                              return of(recorderActions.recordingError('speech_started 응답 타임아웃'));
                            }

                            return concat(
                              of(recorderActions.sttStarted()),
                              of(recorderActions.recordingStarted())
                            );
                          }),
                          catchError((error) =>
                            of(recorderActions.recordingError(
                              error instanceof Error ? error.message : 'start_speech 실패'
                            ))
                          )
                        )
                      );
                    })
                  )
                );
              })
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
 * Epic: 오디오 청크 스트리밍
 * sttStarted 시 시작, audioChunks$ 구독하여 WebSocket으로 전송
 */
const streamAudioChunksEpic: RecorderEpic = (action$) =>
  action$.pipe(
    ofType(recorderActions.sttStarted.type),
    switchMap(() => {
      const recorder = getAudioRecorderService();
      const wsService = getWebSocketService();

      return recorder.audioChunks$.pipe(
        tap((float32Samples) => {
          // Float32 → Int16 → BASE64 변환 후 전송
          const base64Audio = encodeAudioChunk(float32Samples);
          const result = wsService.sendAudioChunk(base64Audio);
          if (!isOk(result)) {
            console.warn('[AudioChunk] 전송 실패:', result.error.message);
          }
        }),
        ignoreElements(),
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
 * Epic: 녹음 정지
 * Flow:
 * 1. stop_speech 메시지 전송 → speech_stopped 응답 대기
 * 2. 오디오 녹음 정지 및 WAV 생성
 */
const stopRecordingEpic: RecorderEpic = (action$) =>
  action$.pipe(
    ofType(recorderActions.stopRecording.type),
    switchMap(() => {
      const wsService = getWebSocketService();
      const recorder = getAudioRecorderService();

      return concat(
        of(recorderActions.sttStopping()),

        // stop_speech 메시지 전송
        of(null).pipe(
          tap(() => wsService.sendStopSpeech()),
          ignoreElements()
        ),

        // speech_stopped 응답 대기 (5초 타임아웃, 타임아웃 시에도 진행)
        race(
          wsService.waitForSpeechStopped(),
          timer(5000).pipe(
            map(() => ({ event: 'speech_stopped' as const }))
          )
        ).pipe(
          switchMap(() =>
            concat(
              of(recorderActions.sttStopped()),

              // 녹음 정지 및 WAV 생성
              recorder.stopRecording().pipe(
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
              )
            )
          )
        )
      );
    })
  );

/**
 * Epic: 서버 에러 이벤트 처리
 */
const serverErrorEpic: RecorderEpic = (action$) =>
  action$.pipe(
    ofType(recorderActions.webSocketConnected.type),
    switchMap(() => {
      const wsService = getWebSocketService();

      return wsService.messages$.pipe(
        filter((msg) => msg.event === 'error'),
        map((errorMsg) => {
          if (errorMsg.event === 'error') {
            return recorderActions.recordingError(errorMsg.error);
          }
          return recorderActions.recordingError('Unknown server error');
        }),
        takeUntil(
          action$.pipe(
            filter(
              (action) =>
                action.type === recorderActions.webSocketDisconnected.type
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

/**
 * Epic: 언어 목록 로드
 * API 호출하여 언어 목록 가져오기
 */
const fetchLanguagesEpic: RecorderEpic = (action$) =>
  action$.pipe(
    ofType(recorderActions.fetchLanguages.type),
    switchMap(() =>
      from(fetch('http://localhost:3000/api/languages')).pipe(
        switchMap((response) => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          return from(response.json() as Promise<ApiResponse<LanguagesData>>);
        }),
        switchMap((result) => {
          if (!result.success || !result.data) {
            throw new Error(
              result.error?.message ?? 'Failed to fetch languages'
            );
          }
          return of(result.data.languages);
        }),
        map((languages) => recorderActions.fetchLanguagesSuccess(languages)),
        catchError((error) =>
          of(
            recorderActions.fetchLanguagesFailure(
              error instanceof Error ? error.message : 'Failed to fetch languages'
            )
          )
        )
      )
    )
  );

// Export all epics as array
export const recorderEpics = [
  fetchLanguagesEpic,
  startRecordingEpic,
  streamAudioChunksEpic,
  stopRecordingEpic,
  serverErrorEpic,
  elapsedTimeEpic,
  errorLoggingEpic,
  webSocketDisconnectEpic,
];
