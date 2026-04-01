import { useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslationStore } from '@/stores/useTranslationStore';

export function TranscriptPanel() {
  const { segments } = useTranslationStore();
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
  }, [segments]);

  if (segments.length === 0) {
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
      {segments.map((segment) => (
        <Card key={segment.segmentId} className={segment.isFinal ? '' : 'border-dashed'}>
          <CardContent className="p-3">
            <p className={`text-sm ${segment.isFinal ? '' : 'text-muted-foreground'}`}>
              {segment.translation || segment.transcript}
            </p>
          </CardContent>
        </Card>
      ))}

      <div ref={bottomRef} />
    </div>
  );
}
