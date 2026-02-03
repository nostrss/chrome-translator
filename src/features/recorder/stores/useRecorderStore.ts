import { create } from 'zustand'
import type { RecordingStatus } from '../types'

interface RecorderState {
  status: RecordingStatus
  error: string | null
  startTime: number | null
  elapsedTime: number
  sessionId: string | null
}

interface RecorderActions {
  setConnecting: () => void
  setRecording: (sessionId: string) => void
  setStopping: () => void
  setCompleted: () => void
  setIdle: () => void
  setError: (error: string) => void
  updateElapsedTime: (seconds: number) => void
  reset: () => void
}

interface RecorderDerived {
  isRecording: () => boolean
  canStartRecording: () => boolean
  canStopRecording: () => boolean
  isProcessing: () => boolean
  getFormattedElapsedTime: () => string
}

type RecorderStore = RecorderState & RecorderActions & RecorderDerived

const initialState: RecorderState = {
  status: 'idle',
  error: null,
  startTime: null,
  elapsedTime: 0,
  sessionId: null,
}

export const useRecorderStore = create<RecorderStore>((set, get) => ({
  ...initialState,

  // Actions
  setConnecting: () => set({
    status: 'requesting',
    error: null,
  }),

  setRecording: (sessionId) => set({
    status: 'recording',
    startTime: Date.now(),
    elapsedTime: 0,
    sessionId,
    error: null,
  }),

  setStopping: () => set({
    status: 'stopping',
  }),

  setCompleted: () => set({
    status: 'completed',
    startTime: null,
  }),

  setIdle: () => set({
    status: 'idle',
  }),

  setError: (error) => set({
    status: 'error',
    error,
    startTime: null,
  }),

  updateElapsedTime: (seconds) => set({
    elapsedTime: seconds,
  }),

  reset: () => set(initialState),

  // Derived
  isRecording: () => get().status === 'recording',

  canStartRecording: () => {
    const status = get().status
    return status === 'idle' || status === 'completed' || status === 'error'
  },

  canStopRecording: () => get().status === 'recording',

  isProcessing: () => {
    const status = get().status
    return status === 'requesting' || status === 'stopping'
  },

  getFormattedElapsedTime: () => {
    const seconds = get().elapsedTime
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  },
}))
