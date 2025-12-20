/**
 * Resampler Audio Worklet Processor
 * 브라우저 기본 샘플레이트 → 16kHz 리샘플링
 * Stereo → Mono 변환
 */
class ResamplerProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.isRecording = false;
    this.targetSampleRate = 16000;
    this.inputSampleRate = sampleRate;
    this.resampleRatio = 1;
    this.resampleBuffer = [];
    this.lastSample = 0;
    this.fractionalIndex = 0;
    this.port.onmessage = this.handleMessage.bind(this);
  }

  handleMessage(event) {
    const { type, targetSampleRate } = event.data;
    switch (type) {
      case 'START':
        this.isRecording = true;
        this.targetSampleRate = targetSampleRate || 16000;
        this.resampleRatio = this.inputSampleRate / this.targetSampleRate;
        this.resampleBuffer = [];
        this.lastSample = 0;
        this.fractionalIndex = 0;
        break;
      case 'STOP':
        this.isRecording = false;
        break;
      case 'GET_SAMPLES':
        const samples = new Float32Array(this.resampleBuffer);
        this.port.postMessage({ type: 'SAMPLES', samples }, [samples.buffer]);
        this.resampleBuffer = [];
        break;
    }
  }

  process(inputs) {
    if (!this.isRecording) return true;
    const input = inputs[0];
    if (!input || input.length === 0) return true;

    // Stereo to Mono (average channels)
    let monoData;
    if (input.length > 1) {
      const length = input[0].length;
      monoData = new Float32Array(length);
      for (let i = 0; i < length; i++) {
        monoData[i] = (input[0][i] + input[1][i]) / 2;
      }
    } else {
      monoData = input[0];
    }

    // Resample with linear interpolation
    for (let i = 0; i < monoData.length; i++) {
      const currentSample = monoData[i];
      while (this.fractionalIndex < 1) {
        const interpolated =
          this.lastSample +
          (currentSample - this.lastSample) * this.fractionalIndex;
        this.resampleBuffer.push(interpolated);
        this.fractionalIndex += this.resampleRatio;
      }
      this.fractionalIndex -= 1;
      this.lastSample = currentSample;
    }

    return true;
  }
}

registerProcessor('resampler-processor', ResamplerProcessor);
