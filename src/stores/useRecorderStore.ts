import { create } from 'zustand';
import type { ErrorCode } from '@/types/websocket';

export type RecorderStatus = 'IDLE' | 'CONNECTING' | 'CONNECTED' | 'RECORDING' | 'STOPPED';

interface RecorderState {
  status: RecorderStatus;
  sessionId: string | null;
  error: { code: ErrorCode; message: string } | null;
  setStatus: (status: RecorderStatus) => void;
  setSessionId: (sessionId: string | null) => void;
  setError: (error: { code: ErrorCode; message: string } | null) => void;
  reset: () => void;
}

export const useRecorderStore = create<RecorderState>((set) => ({
  status: 'IDLE',
  sessionId: null,
  error: null,
  setStatus: (status) => set({ status, error: status === 'CONNECTING' ? null : undefined }),
  setSessionId: (sessionId) => set({ sessionId }),
  setError: (error) => set({ error }),
  reset: () => set({ status: 'IDLE', sessionId: null, error: null }),
}));
