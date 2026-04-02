import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ModelSelector } from '@/components/ModelSelector';
import { RecordButton } from '@/components/RecordButton';
import { ErrorAlert } from '@/components/ErrorAlert';
import { TranscriptPanel } from '@/components/TranscriptPanel';
import { SettingsPanel } from '@/components/SettingsPanel';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useRecorder } from '@/hooks/useRecorder';
import { useTranslationLanguages } from '@/hooks/useLanguages';
import { useModels, getDefaultModel } from '@/hooks/useModels';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

const API_KEY_STORAGE_KEY = 'openrouter_api_key';

function SidePanel() {
  const [activeTab, setActiveTab] = useState<'translate' | 'settings'>('translate');
  const [targetLanguage, setTargetLanguage] = useState('en-US');
  const [translationMode, setTranslationMode] = useState('');
  const [apiKey, setApiKey] = useState<string | null>(
    () => localStorage.getItem(API_KEY_STORAGE_KEY),
  );
  const [initialized, setInitialized] = useState(false);

  const { status, error, start, stop, reset } = useRecorder();
  const { data: translationLanguages, isLoading: transLoading } = useTranslationLanguages();
  const { data: models, isLoading: modelsLoading } = useModels();

  useEffect(() => {
    if (!initialized && translationLanguages?.length) {
      const browserLang = navigator.language;
      const prefix = browserLang.split('-')[0];
      const match = translationLanguages.find(
        (l) => l.code === browserLang || l.code.startsWith(prefix),
      );
      if (match) setTargetLanguage(match.code);
      setInitialized(true);
    }
  }, [translationLanguages, initialized]);

  useEffect(() => {
    if (!models?.length) return;
    const isValid = models.some((m) => m.id === translationMode);
    if (!isValid) {
      setTranslationMode(getDefaultModel(models) ?? '');
    }
  }, [models, translationMode]);

  const isActive = status === 'CONNECTING' || status === 'CONNECTED' || status === 'RECORDING';

  const handleStart = () => {
    const apiKeys = apiKey ? { openrouterKey: apiKey } : undefined;
    start(targetLanguage, translationMode, apiKeys);
  };

  const handleDismissError = () => {
    reset();
  };

  const handleSaveApiKey = (key: string) => {
    localStorage.setItem(API_KEY_STORAGE_KEY, key);
    setApiKey(key);
  };

  const handleRemoveApiKey = () => {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    setApiKey(null);
    const currentModel = models?.find((m) => m.id === translationMode);
    if (currentModel && !currentModel.isFree) {
      setTranslationMode(getDefaultModel(models ?? []) ?? '');
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <div className="flex border-b">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setActiveTab('translate')}
          className={`flex-1 rounded-none ${activeTab === 'translate' ? 'border-b-2 border-primary font-semibold' : ''}`}
        >
          Translate
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setActiveTab('settings')}
          className={`flex-1 rounded-none ${activeTab === 'settings' ? 'border-b-2 border-primary font-semibold' : ''}`}
        >
          Settings
        </Button>
      </div>

      {activeTab === 'translate' ? (
        <div className="flex flex-1 flex-col overflow-hidden p-4">
          <div className="flex flex-col gap-3 pb-4">
            <LanguageSelector
              label="Translation Language"
              languages={translationLanguages ?? []}
              value={targetLanguage}
              onChange={setTargetLanguage}
              isLoading={transLoading}
              disabled={isActive}
            />
            <ModelSelector
              models={models ?? []}
              value={translationMode}
              onChange={setTranslationMode}
              disabled={isActive}
              hasApiKey={!!apiKey}
              isLoading={modelsLoading}
            />
            <RecordButton status={status} onStart={handleStart} onStop={stop} />
          </div>

          {error && (
            <div className="pb-3">
              <ErrorAlert code={error.code} message={error.message} onDismiss={handleDismissError} />
            </div>
          )}

          <Separator />

          <div className="flex min-h-0 flex-1 flex-col pt-3">
            <TranscriptPanel />
          </div>
        </div>
      ) : (
        <SettingsPanel apiKey={apiKey} onSave={handleSaveApiKey} onRemove={handleRemoveApiKey} disabled={isActive} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SidePanel />
    </QueryClientProvider>
  );
}
