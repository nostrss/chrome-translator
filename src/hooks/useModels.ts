import { useQuery } from '@tanstack/react-query';
import { fetchModels } from '@/services/api';
import type { Model } from '@/types/websocket';

export function getDefaultModel(models: Model[]): string | undefined {
  return models.find((m) => m.isFree)?.id ?? models[0]?.id;
}

export function useModels() {
  return useQuery({
    queryKey: ['models'],
    queryFn: fetchModels,
    staleTime: 10 * 60 * 1000,
  });
}
