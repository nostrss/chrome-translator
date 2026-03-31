import { useQuery } from '@tanstack/react-query';
import { fetchSttLanguages, fetchTranslationLanguages } from '@/services/api';

export function useSttLanguages(query?: string) {
  return useQuery({
    queryKey: ['languages', 'stt', query],
    queryFn: () => fetchSttLanguages(query),
    staleTime: 10 * 60 * 1000,
  });
}

export function useTranslationLanguages(query?: string) {
  return useQuery({
    queryKey: ['languages', 'translation', query],
    queryFn: () => fetchTranslationLanguages(query),
    staleTime: 10 * 60 * 1000,
  });
}
