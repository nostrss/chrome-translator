import type { Language, Model } from '@/types/websocket';

const API_URL = import.meta.env.VITE_API_URL;

interface LanguagesResponse {
  languages: Language[];
}

interface ModelsResponse {
  models: Model[];
}

export async function fetchTranslationLanguages(query?: string): Promise<Language[]> {
  const url = new URL(`${API_URL}/api/languages/translation`);
  if (query) url.searchParams.set('q', query);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Failed to fetch translation languages: ${res.status}`);

  const { languages }: LanguagesResponse = await res.json();
  return languages;
}

export async function fetchModels(): Promise<Model[]> {
  const res = await fetch(`${API_URL}/api/translate/models`);
  if (!res.ok) throw new Error(`Failed to fetch models: ${res.status}`);

  const { models }: ModelsResponse = await res.json();
  return models;
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/health`);
    return res.ok;
  } catch {
    return false;
  }
}
