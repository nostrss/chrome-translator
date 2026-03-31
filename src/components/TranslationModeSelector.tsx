import { Button } from '@/components/ui/button';
import type { TranslationMode } from '@/types/websocket';

interface TranslationModeSelectorProps {
  value: TranslationMode;
  onChange: (mode: TranslationMode) => void;
  disabled?: boolean;
}

export function TranslationModeSelector({
  value,
  onChange,
  disabled,
}: TranslationModeSelectorProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium">Translation Mode</label>
      <div className="flex gap-1">
        <Button
          variant={value === 'standard' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange('standard')}
          disabled={disabled}
          className="flex-1"
        >
          Standard
        </Button>
        <Button
          variant={value === 'advanced' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange('advanced')}
          disabled={disabled}
          className="flex-1"
        >
          Advanced
        </Button>
      </div>
    </div>
  );
}
