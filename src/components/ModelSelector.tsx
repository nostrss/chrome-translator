import type { TranslationMode, Model } from '@/types/websocket';

interface ModelSelectorProps {
  models: Model[];
  value: TranslationMode;
  onChange: (mode: TranslationMode) => void;
  disabled?: boolean;
  hasApiKey: boolean;
  isLoading?: boolean;
}

export function ModelSelector({
  models,
  value,
  onChange,
  disabled,
  hasApiKey,
  isLoading,
}: ModelSelectorProps) {
  const free = models.filter((m) => m.isFree);
  const fast = models.filter((m) => !m.isFree && m.category === 'fast');
  const premium = models.filter((m) => m.category === 'premium');

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium">Model</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || isLoading}
        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? (
          <option>Loading...</option>
        ) : (
          <>
            <optgroup label="Free">
              {free.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Fast (API key required)">
              {fast.map((m) => (
                <option key={m.id} value={m.id} disabled={!hasApiKey}>
                  {m.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Premium (API key required)">
              {premium.map((m) => (
                <option key={m.id} value={m.id} disabled={!hasApiKey}>
                  {m.name}
                </option>
              ))}
            </optgroup>
          </>
        )}
      </select>
    </div>
  );
}
