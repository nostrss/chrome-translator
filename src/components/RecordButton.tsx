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

  return (
    <Button
      variant={isRecording ? 'destructive' : 'default'}
      size="lg"
      className="w-full"
      onClick={isRecording ? onStop : onStart}
      disabled={isConnecting}
    >
      {isConnecting && 'Connecting...'}
      {isRecording && 'Stop Recording'}
      {(status === 'IDLE' || status === 'STOPPED') && 'Start Recording'}
    </Button>
  );
}
