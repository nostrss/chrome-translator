import { useQuery } from '@tanstack/react-query';
import { fetchTranslationLanguages } from '@/services/api';

export function useTranslationLanguages(query?: string) {
  return useQuery({
    queryKey: ['languages', 'translation', query],
    queryFn: () => fetchTranslationLanguages(query),
    staleTime: 10 * 60 * 1000,
  });
}
