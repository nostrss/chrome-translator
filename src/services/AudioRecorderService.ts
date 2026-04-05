import { requestTabCapture, getCurrentTabId } from '@/services/chromeMessaging';

export class AudioRecorderService {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private workletNode: AudioWorkletNode | null = null;

  onAudioChunk?: (base64: string) => void;

  private readonly TARGET_SAMPLE_RATE = 16000;

  async start() {
    const tabId = await getCurrentTabId();
    const response = await requestTabCapture(tabId);

    if (!response.success) {
      throw new Error(response.error);
    }

    await this.initializeAudio(response.streamId);
  }

  private async initializeAudio(streamId: string) {
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: 'tab',
          chromeMediaSourceId: streamId,
        },
      } as MediaTrackConstraints,
      video: false,
    });

    this.audioContext = new AudioContext();

    const workletUrl = chrome.runtime.getURL('worklets/resampler-processor.js');
    await this.audioContext.audioWorklet.addModule(workletUrl);

    this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);

    this.workletNode = new AudioWorkletNode(this.audioContext, 'resampler-processor');

    this.workletNode.port.onmessage = (event) => {
      if (event.data.type === 'AUDIO_CHUNK') {
        const float32: Float32Array = event.data.samples;
        const pcm16 = this.float32ToPcm16(float32);
        const base64 = this.arrayBufferToBase64(pcm16.buffer as ArrayBuffer);
        this.onAudioChunk?.(base64);
      }
    };

    this.sourceNode.connect(this.workletNode);
    this.sourceNode.connect(this.audioContext.destination);

    this.workletNode.port.postMessage({
      type: 'START',
      targetSampleRate: this.TARGET_SAMPLE_RATE,
    });
  }

  stop() {
    if (this.workletNode) {
      this.workletNode.port.postMessage({ type: 'STOP' });
      this.workletNode.disconnect();
      this.workletNode = null;
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  private float32ToPcm16(float32: Float32Array): Int16Array {
    const pcm16 = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
      pcm16[i] = Math.max(-32768, Math.min(32767, float32[i] * 32768));
    }
    return pcm16;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}
