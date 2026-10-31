/**
 * Đổi bản ghi giọng nói thành WAV PCM 16 bit, một kênh, 16 kHz.
 *
 * Trình duyệt ghi ra định dạng nén của riêng nó (webm/opus trên Chrome,
 * mp4/aac trên Safari) mà dịch vụ AI không nhận hết. WAV thì nơi nào cũng
 * nhận, và 16 kHz một kênh là đủ cho giọng nói: câu 10 giây chỉ ~320 kB.
 *
 * Các hàm ở đây là hàm thuần trên mảng số để kiểm thử được không cần trình duyệt.
 */

export const SPEECH_SAMPLE_RATE = 16000;

/**
 * Gộp các kênh về một rồi hạ tần số lấy mẫu. Hạ tần số bằng cách lấy trung
 * bình các mẫu rơi vào mỗi ô — vừa đơn giản vừa lọc bớt răng cưa, đủ cho giọng nói.
 */
export function downmixResample(
  channels: readonly Float32Array[],
  fromRate: number,
  toRate: number = SPEECH_SAMPLE_RATE,
): Float32Array {
  if (channels.length === 0 || fromRate <= 0) return new Float32Array(0);
  const length = channels[0].length;
  const mono = new Float32Array(length);
  for (const channel of channels) {
    for (let i = 0; i < length; i += 1) mono[i] += (channel[i] ?? 0) / channels.length;
  }
  if (fromRate === toRate) return mono;

  const ratio = fromRate / toRate;
  const outLength = Math.floor(length / ratio);
  const out = new Float32Array(outLength);
  for (let i = 0; i < outLength; i += 1) {
    const start = i * ratio;
    const end = Math.min(length, (i + 1) * ratio);
    if (ratio <= 1) {
      // Nâng tần số: nội suy tuyến tính giữa hai mẫu kề nhau.
      const left = Math.floor(start);
      const right = Math.min(length - 1, left + 1);
      const t = start - left;
      out[i] = mono[left] * (1 - t) + mono[right] * t;
      continue;
    }
    let sum = 0;
    let count = 0;
    for (let j = Math.floor(start); j < Math.ceil(end); j += 1) {
      sum += mono[j];
      count += 1;
    }
    out[i] = count === 0 ? 0 : sum / count;
  }
  return out;
}

/** Đóng gói mẫu [-1, 1] thành tệp WAV PCM 16 bit một kênh. */
export function encodeWav(samples: Float32Array, sampleRate: number = SPEECH_SAMPLE_RATE): ArrayBuffer {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeText = (offset: number, text: string): void => {
    for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i));
  };
  writeText(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeText(8, 'WAVE');
  writeText(12, 'fmt ');
  view.setUint32(16, 16, true); // cỡ khối fmt
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // một kênh
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte mỗi giây
  view.setUint16(32, 2, true); // byte mỗi mẫu
  view.setUint16(34, 16, true); // bit mỗi mẫu
  writeText(36, 'data');
  view.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i += 1) {
    const value = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, value < 0 ? value * 0x8000 : value * 0x7fff, true);
  }
  return buffer;
}

/** Mã hoá base64 theo từng khúc, để mảng lớn không làm tràn ngăn xếp `String.fromCharCode`. */
export function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const CHUNK = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

/** Độ lớn trung bình (RMS) của bản ghi, để nhận ra bản ghi gần như im lặng. */
export function rms(samples: Float32Array): number {
  if (samples.length === 0) return 0;
  let sum = 0;
  for (const value of samples) sum += value * value;
  return Math.sqrt(sum / samples.length);
}
