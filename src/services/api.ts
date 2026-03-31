import type { Language } from '@/types/websocket';

const API_URL = import.meta.env.VITE_API_URL;

interface LanguagesResponse {
  languages: Language[];
}

export async function fetchSttLanguages(query?: string): Promise<Language[]> {
  const url = new URL(`${API_URL}/api/languages/stt`);
  if (query) url.searchParams.set('q', query);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Failed to fetch STT languages: ${res.status}`);

  const { languages }: LanguagesResponse = await res.json();
  return languages;
}

export async function fetchTranslationLanguages(query?: string): Promise<Language[]> {
  const url = new URL(`${API_URL}/api/languages/translation`);
  if (query) url.searchParams.set('q', query);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Failed to fetch translation languages: ${res.status}`);

  const { languages }: LanguagesResponse = await res.json();
  return languages;
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/health`);
    return res.ok;
  } catch {
    return false;
  }
}
