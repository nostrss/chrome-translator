import type { Result } from '@/shared/utils';
import { ok, err, isOk } from '@/shared/utils';
import { requestTabCapture, getCurrentTabId } from '@/chrome/messaging';

type AudioChunkHandler = (samples: Float32Array) => void

/**
 * Audio Recorder Service
 * Side Panel에서 동작하며 tabCapture API를 통해 탭 오디오를 녹음
 */
export class AudioRecorderService {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private samplesBuffer: Float32Array[] = [];
  private isWorkletReady = false;
  private elapsedTimeInterval: ReturnType<typeof setInterval> | null = null;

  // 콜백 기반 핸들러
  private audioChunkHandlers = new Set<AudioChunkHandler>();

  private readonly TARGET_SAMPLE_RATE = 16000;

  /**
   * 오디오 청크 핸들러 등록
   */
  onAudioChunk(handler: AudioChunkHandler): () => void {
    this.audioChunkHandlers.add(handler);
    return () => this.audioChunkHandlers.delete(handler);
  }

  /**
   * 녹음 시작
   */
  async startRecording(): Promise<Result<Error, void>> {
    try {
      const tabIdResult = await getCurrentTabId();
      if (!isOk(tabIdResult)) {
        return err(tabIdResult.error);
      }

      const captureResult = await requestTabCapture(tabIdResult.value);
      if (!isOk(captureResult)) {
        return err(captureResult.error);
      }

      const response = captureResult.value;
      if (!response.success) {
        return err(new Error(response.error));
      }

      return await this.initializeAudio(response.streamId);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
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
          // 실시간 오디오 청크를 핸들러들에게 전달
          this.audioChunkHandlers.forEach(handler => handler(event.data.samples));
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
  stopRecording(): Promise<Result<Error, void>> {
    return new Promise((resolve) => {
      if (!this.workletNode || !this.isWorkletReady) {
        resolve(err(new Error('Recorder is not active')));
        return;
      }

      // 정지 메시지 전송
      this.workletNode.port.postMessage({ type: 'STOP' });

      // 약간의 지연 후 정리
      setTimeout(() => {
        try {
          this.cleanup();
          resolve(ok(undefined));
        } catch (error) {
          resolve(err(error instanceof Error ? error : new Error(String(error))));
        }
      }, 100);
    });
  }

  /**
   * 경과 시간 콜백 시작 (매초 호출)
   */
  startElapsedTimeUpdates(startTime: number, onUpdate: (seconds: number) => void): () => void {
    this.stopElapsedTimeUpdates();

    this.elapsedTimeInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      onUpdate(elapsed);
    }, 1000);

    return () => this.stopElapsedTimeUpdates();
  }

  /**
   * 경과 시간 업데이트 중지
   */
  stopElapsedTimeUpdates(): void {
    if (this.elapsedTimeInterval) {
      clearInterval(this.elapsedTimeInterval);
      this.elapsedTimeInterval = null;
    }
  }

  /**
   * 리소스 정리
   */
  private cleanup(): void {
    this.stopElapsedTimeUpdates();

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

  /**
   * 모든 핸들러 제거
   */
  removeAllHandlers(): void {
    this.audioChunkHandlers.clear();
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
