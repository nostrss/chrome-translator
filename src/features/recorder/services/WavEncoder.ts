/**
 * WAV Encoder
 * PCM 데이터를 WAV 파일로 인코딩
 * - 16-bit signed integer PCM
 * - 지정된 샘플레이트 (16000Hz)
 * - Mono 채널
 */

export interface WavEncoderOptions {
  readonly sampleRate: number;
  readonly channels: number;
}

const DEFAULT_OPTIONS: WavEncoderOptions = {
  sampleRate: 16000,
  channels: 1,
};

/**
 * DataView에 문자열 쓰기
 */
const writeString = (view: DataView, offset: number, str: string): void => {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
};

/**
 * Float32Array PCM 데이터를 WAV Blob으로 변환
 */
export const encodeWav = (
  samples: Float32Array,
  options: WavEncoderOptions = DEFAULT_OPTIONS
): Blob => {
  const { sampleRate, channels } = options;
  const bytesPerSample = 2; // 16-bit
  const blockAlign = channels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;
  const bufferSize = 44 + dataSize; // WAV header is 44 bytes

  const buffer = new ArrayBuffer(bufferSize);
  const view = new DataView(buffer);

  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, bufferSize - 8, true); // ChunkSize
  writeString(view, 8, 'WAVE');

  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
  view.setUint16(22, channels, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, byteRate, true); // ByteRate
  view.setUint16(32, blockAlign, true); // BlockAlign
  view.setUint16(34, bytesPerSample * 8, true); // BitsPerSample

  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true); // Subchunk2Size

  // PCM samples (convert float32 to int16)
  const offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const sample = Math.max(-1, Math.min(1, samples[i] ?? 0));
    const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    view.setInt16(offset + i * 2, int16, true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
};

/**
 * 샘플 수에서 재생 시간 계산 (초)
 */
export const calculateDuration = (
  sampleCount: number,
  sampleRate: number
): number => sampleCount / sampleRate;
