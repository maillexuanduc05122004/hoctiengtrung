/**
 * Đổi bản ghi sang WAV 16 kHz một kênh: đúng phần đầu tệp, đúng số mẫu sau
 * khi hạ tần số, và base64 đọc ngược lại được.
 */
import { describe, expect, it } from 'vitest';
import { downmixResample, encodeWav, rms, toBase64 } from './wav.ts';

describe('downmixResample', () => {
  it('gộp hai kênh thành trung bình', () => {
    const left = new Float32Array([1, 1, 0]);
    const right = new Float32Array([0, -1, 0]);
    expect([...downmixResample([left, right], 16000, 16000)]).toEqual([0.5, 0, 0]);
  });

  it('48 kHz xuống 16 kHz: một phần ba số mẫu, mỗi mẫu là trung bình ba mẫu gốc', () => {
    const input = new Float32Array([0, 0.3, 0.6, 0.9, 0.9, 0.9]);
    const out = downmixResample([input], 48000, 16000);
    expect(out.length).toBe(2);
    expect(out[0]).toBeCloseTo(0.3);
    expect(out[1]).toBeCloseTo(0.9);
  });

  it('không có kênh nào thì trả mảng rỗng', () => {
    expect(downmixResample([], 48000).length).toBe(0);
  });
});

describe('encodeWav', () => {
  it('viết đúng phần đầu WAV PCM 16 bit một kênh và kẹp mẫu vượt ngưỡng', () => {
    const buffer = encodeWav(new Float32Array([0, 1, -1, 2]), 16000);
    const view = new DataView(buffer);
    const text = (offset: number) =>
      String.fromCharCode(...new Uint8Array(buffer.slice(offset, offset + 4)));
    expect(buffer.byteLength).toBe(44 + 8);
    expect(text(0)).toBe('RIFF');
    expect(text(8)).toBe('WAVE');
    expect(text(36)).toBe('data');
    expect(view.getUint16(22, true)).toBe(1);
    expect(view.getUint32(24, true)).toBe(16000);
    expect(view.getInt16(46, true)).toBe(0x7fff);
    expect(view.getInt16(48, true)).toBe(-0x8000);
    expect(view.getInt16(50, true)).toBe(0x7fff);
  });
});

describe('toBase64 và rms', () => {
  it('base64 giải mã ngược ra đúng byte', () => {
    const bytes = new Uint8Array([0, 1, 2, 250, 255]);
    expect([...Uint8Array.from(atob(toBase64(bytes.buffer)), (c) => c.charCodeAt(0))]).toEqual([
      0, 1, 2, 250, 255,
    ]);
  });

  it('im lặng là 0, tín hiệu đều là biên độ của nó', () => {
    expect(rms(new Float32Array(10))).toBe(0);
    expect(rms(new Float32Array([0.5, -0.5]))).toBeCloseTo(0.5);
  });
});
