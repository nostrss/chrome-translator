import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import type { ErrorCode } from '@/types/websocket';

const ERROR_MESSAGES: Record<ErrorCode, string> = {
  INVALID_MESSAGE: 'Invalid message format. Please try again.',
  UNKNOWN_EVENT: 'Unknown event received from server.',
  SESSION_NOT_FOUND: 'Session not found. Please reconnect.',
  SESSION_ALREADY_ACTIVE: 'A session is already active.',
  ORIGIN_REJECTED: 'Connection rejected. Contact the server administrator.',
  TOO_MANY_SESSIONS: 'Too many active sessions. Close other tabs and retry.',
  PAYLOAD_TOO_LARGE: 'Audio chunk too large. Reduce chunk size.',
  VAD_TIMEOUT: 'No speech detected for 30 seconds. Connection closed.',
  SESSION_TIMEOUT: 'Session expired after 30 minutes. Please reconnect.',
  STT_ERROR: 'Speech recognition error. Please try again.',
  TRANSLATION_ERROR: 'Translation error. Speech recognition continues.',
  INTERNAL_ERROR: 'Server error. Please try again later.',
};

interface ErrorAlertProps {
  code: ErrorCode;
  message: string;
  onDismiss?: () => void;
}

export function ErrorAlert({ code, message, onDismiss }: ErrorAlertProps) {
  return (
    <Alert variant="destructive" className="relative">
      <AlertTitle>{code}</AlertTitle>
      <AlertDescription>{ERROR_MESSAGES[code] ?? message}</AlertDescription>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute right-2 top-2 text-destructive hover:opacity-70"
          aria-label="Dismiss"
        >
          ✕
        </button>
      )}
    </Alert>
  );
}
