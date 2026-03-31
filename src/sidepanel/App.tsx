import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageSelector } from '@/components/LanguageSelector';
import { TranslationModeSelector } from '@/components/TranslationModeSelector';
import { RecordButton } from '@/components/RecordButton';
import { RecordingStatus } from '@/components/RecordingStatus';
import { ErrorAlert } from '@/components/ErrorAlert';
import { TranscriptPanel } from '@/components/TranscriptPanel';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useRecorder } from '@/hooks/useRecorder';
import { useSttLanguages, useTranslationLanguages } from '@/hooks/useLanguages';
import type { TranslationMode } from '@/types/websocket';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

function SidePanel() {
  const [sourceLanguage, setSourceLanguage] = useState('ko-KR');
  const [targetLanguage, setTargetLanguage] = useState('en-US');
  const [translationMode, setTranslationMode] = useState<TranslationMode>('standard');

  const { status, error, start, stop, reset } = useRecorder();
  const { data: sttLanguages, isLoading: sttLoading } = useSttLanguages();
  const { data: translationLanguages, isLoading: transLoading } = useTranslationLanguages();

  const isActive = status === 'CONNECTING' || status === 'CONNECTED' || status === 'RECORDING';

  const handleStart = () => {
    start(sourceLanguage, targetLanguage, translationMode);
  };

  const handleDismissError = () => {
    reset();
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden p-4">
      <header className="flex items-center justify-between pb-4">
        <h1 className="text-lg font-semibold">Tab Translator</h1>
        <Badge variant={isActive ? 'default' : 'secondary'}>
          {isActive ? 'Connected' : 'Disconnected'}
        </Badge>
      </header>

      <div className="flex flex-col gap-3 pb-4">
        <LanguageSelector
          label="Source Language"
          languages={sttLanguages ?? []}
          value={sourceLanguage}
          onChange={setSourceLanguage}
          isLoading={sttLoading}
          disabled={isActive}
        />
        <LanguageSelector
          label="Target Language"
          languages={translationLanguages ?? []}
          value={targetLanguage}
          onChange={setTargetLanguage}
          isLoading={transLoading}
          disabled={isActive}
        />
        <TranslationModeSelector
          value={translationMode}
          onChange={setTranslationMode}
          disabled={isActive}
        />
        <RecordButton status={status} onStart={handleStart} onStop={stop} />
        <RecordingStatus status={status} />
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
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SidePanel />
    </QueryClientProvider>
  );
}
