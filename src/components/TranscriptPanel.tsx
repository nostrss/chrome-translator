import { useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useTranslationStore } from '@/stores/useTranslationStore';

export function TranscriptPanel() {
  const { segments, interimTranscript, interimTranslation } = useTranslationStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);

  const checkIfNearBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 40;
    isNearBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  }, []);

  useEffect(() => {
    if (isNearBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [segments.length, interimTranscript]);

  const isEmpty = segments.length === 0 && !interimTranscript;

  if (isEmpty) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Transcription will appear here.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      onScroll={checkIfNearBottom}
      className="flex flex-1 flex-col gap-2 overflow-y-auto"
    >
      {segments.map((segment, i) => (
        <Card key={i}>
          <CardContent className="space-y-2 p-3">
            <p className="text-sm">{segment.transcript}</p>
            {segment.translation && (
              <>
                <Separator />
                <p className="text-sm text-muted-foreground">{segment.translation}</p>
              </>
            )}
          </CardContent>
        </Card>
      ))}

      {interimTranscript && (
        <Card className="border-dashed">
          <CardContent className="space-y-2 p-3">
            <p className="text-sm text-muted-foreground">{interimTranscript}</p>
            {interimTranslation && (
              <>
                <Separator />
                <p className="text-sm text-muted-foreground/70">{interimTranslation}</p>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
