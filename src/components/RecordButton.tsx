import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { RecorderStatus } from '@/stores/useRecorderStore';

interface RecordButtonProps {
  status: RecorderStatus;
  onStart: () => void;
  onStop: () => void;
}

export function RecordButton({ status, onStart, onStop }: RecordButtonProps) {
  const isRecording = status === 'RECORDING';
  const isConnecting = status === 'CONNECTING' || status === 'CONNECTED';

  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isRecording) {
      setElapsed(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <Button
      variant={isRecording ? 'destructive' : 'default'}
      size="lg"
      className="w-full"
      onClick={isRecording ? onStop : onStart}
      disabled={isConnecting}
    >
      {isConnecting && 'Connecting...'}
      {isRecording && `Stop · ${formatTime(elapsed)}`}
      {(status === 'IDLE' || status === 'STOPPED') && 'Start Recording'}
    </Button>
  );
}
