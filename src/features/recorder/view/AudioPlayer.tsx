import { useRef, useEffect, useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { recorderActions } from '@/features/recorder/model/recorderSlice';
import {
  selectAudio,
  selectAudioDuration,
  selectHasRecordedAudio,
} from '@/features/recorder/model/recorderSelectors';
import { AudioRecorderService } from '@/features/recorder/services/AudioRecorderService';

export const AudioPlayer = () => {
  const dispatch = useAppDispatch();
  const audio = useAppSelector(selectAudio);
  const duration = useAppSelector(selectAudioDuration);
  const hasAudio = useAppSelector(selectHasRecordedAudio);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    const handleEnded = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audioEl.addEventListener('ended', handleEnded);
    audioEl.addEventListener('play', handlePlay);
    audioEl.addEventListener('pause', handlePause);

    return () => {
      audioEl.removeEventListener('ended', handleEnded);
      audioEl.removeEventListener('play', handlePlay);
      audioEl.removeEventListener('pause', handlePause);
    };
  }, [audio]);

  const handlePlayPause = useCallback(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    if (isPlaying) {
      audioEl.pause();
    } else {
      audioEl.play();
    }
  }, [isPlaying]);

  const handleDownload = useCallback(() => {
    if (!audio) return;

    const link = document.createElement('a');
    link.href = audio.url;
    link.download = `recording-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [audio]);

  const handleNewRecording = useCallback(() => {
    if (audio?.url) {
      AudioRecorderService.revokeAudioUrl(audio.url);
    }
    dispatch(recorderActions.resetRecorder());
  }, [audio, dispatch]);

  if (!hasAudio || !audio) {
    return null;
  }

  return (
    <div className="mt-6 p-4 bg-gray-50 rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-600">
          Recording completed
        </span>
        <span className="text-sm text-gray-500">Duration: {duration}</span>
      </div>

      <audio ref={audioRef} src={audio.url} className="hidden" />

      <div className="flex gap-3">
        {/* Play/Pause Button */}
        <button
          onClick={handlePlayPause}
          className="flex-1 py-3 px-4 bg-indigo-500 hover:bg-indigo-600
                     text-white rounded-lg font-medium transition-colors
                     flex items-center justify-center gap-2"
        >
          {isPlaying ? (
            <>
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              Pause
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clipRule="evenodd"
                />
              </svg>
              Play
            </>
          )}
        </button>

        {/* Download Button */}
        <button
          onClick={handleDownload}
          className="flex-1 py-3 px-4 bg-green-500 hover:bg-green-600
                     text-white rounded-lg font-medium transition-colors
                     flex items-center justify-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Download
        </button>
      </div>

      {/* New Recording Button */}
      <button
        onClick={handleNewRecording}
        className="w-full mt-3 py-2 px-4 bg-gray-200 hover:bg-gray-300
                   text-gray-700 rounded-lg font-medium transition-colors"
      >
        New Recording
      </button>
    </div>
  );
};
