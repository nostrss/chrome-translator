import type { Language } from '@/types/websocket';

interface LanguageSelectorProps {
  label: string;
  languages: Language[];
  value: string;
  onChange: (code: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function LanguageSelector({
  label,
  languages,
  value,
  onChange,
  isLoading,
  disabled,
}: LanguageSelectorProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || isLoading}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? (
          <option>Loading...</option>
        ) : (
          languages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name} ({lang.nativeName})
            </option>
          ))
        )}
      </select>
    </div>
  );
}
