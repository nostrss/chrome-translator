import { Observable, Subject, from, of, interval } from 'rxjs';
import { map, switchMap, takeUntil, catchError } from 'rxjs/operators';
import type { Result } from '@/shared/fp';
import { ok, err, isOk } from '@/shared/fp';
import { requestTabCapture, getCurrentTabId } from '@/shared/messaging';

/**
 * Audio Recorder Service
 * Side Panel에서 동작하며 tabCapture API를 통해 탭 오디오를 녹음
 */
export class AudioRecorderService {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private stopSubject = new Subject<void>();
  private samplesBuffer: Float32Array[] = [];
  private isWorkletReady = false;

  // 실시간 오디오 청크 스트림
  private audioChunkSubject = new Subject<Float32Array>();
  readonly audioChunks$ = this.audioChunkSubject.asObservable();

  private readonly TARGET_SAMPLE_RATE = 16000;

  /**
   * 녹음 시작
   */
  startRecording(): Observable<Result<Error, void>> {
    return getCurrentTabId().pipe(
      switchMap((tabIdResult) => {
        if (!isOk(tabIdResult)) {
          return of(err(tabIdResult.error));
        }
        return requestTabCapture(tabIdResult.value);
      }),
      switchMap((captureResult) => {
        if (!isOk(captureResult)) {
          return of(err(captureResult.error));
        }

        const response = captureResult.value;
        if (!response.success) {
          return of(err(new Error(response.error)));
        }

        return from(this.initializeAudio(response.streamId));
      }),
      catchError((error) =>
        of(err(error instanceof Error ? error : new Error(String(error))))
      )
    );
  }

  /**
   * 오디오 초기화 및 녹음 시작
   */
  private async initializeAudio(streamId: string): Promise<Result<Error, void>> {
    try {
      // MediaStream 획득 (getUserMedia with tabCapture streamId)
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          mandatory: {
            chromeMediaSource: 'tab',
            chromeMediaSourceId: streamId,
          },
        } as MediaTrackConstraints,
        video: false,
      });

      // AudioContext 생성 (브라우저 기본 샘플레이트 사용)
      this.audioContext = new AudioContext();

      // Worklet 등록 (chrome.runtime.getURL 사용)
      const workletUrl = chrome.runtime.getURL('worklets/resampler-processor.js');
      await this.audioContext.audioWorklet.addModule(workletUrl);

      // Source Node 생성
      this.sourceNode = this.audioContext.createMediaStreamSource(
        this.mediaStream
      );

      // Worklet Node 생성
      this.workletNode = new AudioWorkletNode(
        this.audioContext,
        'resampler-processor'
      );

      // 샘플 수신 핸들러
      this.workletNode.port.onmessage = (event) => {
        if (event.data.type === 'SAMPLES') {
          this.samplesBuffer.push(event.data.samples);
        } else if (event.data.type === 'AUDIO_CHUNK') {
          // 실시간 오디오 청크 emit
          this.audioChunkSubject.next(event.data.samples);
        }
      };

      // 연결: Source -> Worklet (녹음용)
      this.sourceNode.connect(this.workletNode);
      // 연결: Source -> Destination (재생용 - 녹음 중에도 소리가 들림)
      this.sourceNode.connect(this.audioContext.destination);

      // 녹음 시작 메시지
      this.workletNode.port.postMessage({
        type: 'START',
        targetSampleRate: this.TARGET_SAMPLE_RATE,
      });

      this.isWorkletReady = true;
      this.samplesBuffer = [];

      return ok(undefined);
    } catch (error) {
      this.cleanup();
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * 녹음 정지
   */
  stopRecording(): Observable<Result<Error, void>> {
    if (!this.workletNode || !this.isWorkletReady) {
      return of(err(new Error('Recorder is not active')));
    }

    return new Observable<Result<Error, void>>((subscriber) => {
      // 정지 메시지 전송
      this.workletNode!.port.postMessage({ type: 'STOP' });

      // 약간의 지연 후 정리
      setTimeout(() => {
        try {
          this.cleanup();
          subscriber.next(ok(undefined));
          subscriber.complete();
        } catch (error) {
          subscriber.next(
            err(error instanceof Error ? error : new Error(String(error)))
          );
          subscriber.complete();
        }
      }, 100);
    });
  }

  /**
   * 경과 시간 Observable (매초 emit)
   */
  getElapsedTime$(startTime: number): Observable<number> {
    return interval(1000).pipe(
      map(() => Math.floor((Date.now() - startTime) / 1000)),
      takeUntil(this.stopSubject)
    );
  }

  /**
   * 리소스 정리
   */
  private cleanup(): void {
    this.stopSubject.next();

    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.isWorkletReady = false;
    this.samplesBuffer = [];
  }
}

// 싱글톤 인스턴스
let recorderInstance: AudioRecorderService | null = null;

export const getAudioRecorderService = (): AudioRecorderService => {
  if (!recorderInstance) {
    recorderInstance = new AudioRecorderService();
  }
  return recorderInstance;
};
