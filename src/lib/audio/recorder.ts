/**
 * Ghi âm giọng người học bằng MediaRecorder rồi đổi sang WAV để gửi đi chấm.
 *
 * Chỉ xin quyền micro khi người học bấm nút ghi âm, và trả micro lại cho hệ
 * thống ngay khi dừng (tắt mọi track), để biểu tượng micro của trình duyệt
 * không sáng mãi.
 */
import { SPEECH_SAMPLE_RATE, downmixResample, encodeWav, rms, toBase64 } from './wav.ts';

declare global {
  interface Window {
    /** Safari cũ chỉ có bản tiền tố. */
    webkitAudioContext?: typeof AudioContext;
  }
}

/** Ưu tiên định dạng nén tốt; trình duyệt nào không có thì để nó tự chọn. */
const PREFERRED_TYPES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];

export function isRecordingSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.MediaRecorder !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices?.getUserMedia === 'function'
  );
}

/** Câu báo lỗi tiếng Việt cho các lỗi xin micro thường gặp. */
export function describeMicError(error: unknown): string {
  const name = typeof error === 'object' && error !== null ? (error as { name?: unknown }).name : undefined;
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return 'Trang chưa được cấp quyền dùng micro. Bấm biểu tượng ổ khoá cạnh địa chỉ trang để cho phép rồi thử lại.';
  }
  if (name === 'NotFoundError' || name === 'OverconstrainedError') {
    return 'Không tìm thấy micro. Hãy cắm tai nghe có micro hoặc kiểm tra thiết bị thu âm.';
  }
  if (name === 'NotReadableError') {
    return 'Micro đang bị ứng dụng khác dùng. Tắt ứng dụng đó rồi thử lại.';
  }
  return 'Không mở được micro. Hãy thử lại sau vài giây.';
}

export interface VoiceRecorder {
  /** Xin micro và bắt đầu ghi. Ném lỗi khi không mở được micro. */
  start(): Promise<void>;
  /** Dừng và trả về bản ghi. */
  stop(): Promise<Blob>;
  /** Bỏ bản đang ghi, trả micro. */
  cancel(): void;
}

export function createVoiceRecorder(): VoiceRecorder {
  let stream: MediaStream | null = null;
  let recorder: MediaRecorder | null = null;
  let chunks: Blob[] = [];

  const release = (): void => {
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
  };

  return {
    async start(): Promise<void> {
      if (recorder !== null) return;
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
      });
      const mimeType = PREFERRED_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
      try {
        recorder = new MediaRecorder(stream, mimeType === undefined ? undefined : { mimeType });
      } catch (error) {
        release();
        throw error;
      }
      chunks = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      recorder.start();
    },

    stop(): Promise<Blob> {
      const active = recorder;
      if (active === null) return Promise.resolve(new Blob());
      return new Promise((resolve) => {
        const finish = (): void => {
          const type = active.mimeType || chunks[0]?.type || 'audio/webm';
          resolve(new Blob(chunks, { type }));
          chunks = [];
          release();
        };
        recorder = null;
        if (active.state === 'inactive') {
          finish();
          return;
        }
        active.onstop = finish;
        active.stop();
      });
    },

    cancel(): void {
      const active = recorder;
      recorder = null;
      chunks = [];
      if (active !== null && active.state !== 'inactive') {
        active.onstop = null;
        active.stop();
      }
      release();
    },
  };
}

export interface WavRecording {
  base64: string;
  mimeType: 'audio/wav';
  seconds: number;
  /** RMS của bản ghi; quá nhỏ nghĩa là gần như im lặng. */
  level: number;
}

/** Giải mã bản ghi của trình duyệt rồi đổi sang WAV 16 kHz một kênh. */
export async function recordingToWav(blob: Blob): Promise<WavRecording> {
  const Context = window.AudioContext ?? window.webkitAudioContext;
  if (Context === undefined) throw new Error('Trình duyệt này không xử lý được âm thanh ghi âm.');
  const context = new Context();
  try {
    const decoded = await context.decodeAudioData(await blob.arrayBuffer());
    const channels: Float32Array[] = [];
    for (let i = 0; i < decoded.numberOfChannels; i += 1) channels.push(decoded.getChannelData(i));
    const samples = downmixResample(channels, decoded.sampleRate, SPEECH_SAMPLE_RATE);
    return {
      base64: toBase64(encodeWav(samples, SPEECH_SAMPLE_RATE)),
      mimeType: 'audio/wav',
      seconds: samples.length / SPEECH_SAMPLE_RATE,
      level: rms(samples),
    };
  } finally {
    void context.close().catch(() => undefined);
  }
}
