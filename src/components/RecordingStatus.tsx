import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import type { RecorderStatus } from '@/stores/useRecorderStore';

interface RecordingStatusProps {
  status: RecorderStatus;
}

export function RecordingStatus({ status }: RecordingStatusProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (status !== 'RECORDING') {
      setElapsed(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [status]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (status === 'IDLE') return null;

  const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
    CONNECTING: { label: 'Connecting...', variant: 'secondary' },
    CONNECTED: { label: 'Connected', variant: 'secondary' },
    RECORDING: { label: `Recording · ${formatTime(elapsed)}`, variant: 'destructive' },
    STOPPED: { label: 'Stopped', variant: 'default' },
  };

  const { label, variant } = config[status] ?? { label: status, variant: 'default' as const };

  return (
    <div className="flex items-center justify-center">
      <Badge variant={variant}>{label}</Badge>
    </div>
  );
}
