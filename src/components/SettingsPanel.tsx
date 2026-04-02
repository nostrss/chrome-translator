import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface SettingsPanelProps {
  apiKey: string | null;
  onSave: (key: string) => void;
  onRemove: () => void;
  disabled?: boolean;
}

function maskKey(key: string): string {
  if (key.length <= 8) return '••••••••';
  return `${key.slice(0, 5)}...${key.slice(-4)}`;
}

export function SettingsPanel({ apiKey, onSave, onRemove, disabled }: SettingsPanelProps) {
  const [input, setInput] = useState('');

  const handleSave = () => {
    const trimmed = input.trim();
    if (trimmed) {
      onSave(trimmed);
      setInput('');
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">OpenRouter API Key</label>
        <p className="text-xs text-muted-foreground">
          Required for paid models. Get your key at openrouter.ai
        </p>

        {apiKey ? (
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-md border border-input bg-muted px-3 py-2 text-sm">
              {maskKey(apiKey)}
            </code>
            <Button variant="destructive" size="sm" onClick={onRemove} disabled={disabled}>
              Remove
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <input
              type="password"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="sk-or-..."
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
              }}
            />
            <Button size="sm" onClick={handleSave} disabled={!input.trim()}>
              Save
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
