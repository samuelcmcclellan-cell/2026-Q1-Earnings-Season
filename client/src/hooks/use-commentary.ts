import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';

export interface CommentaryEntry {
  id: number;
  company_id: number;
  fiscal_quarter: string;
  quote_text: string;
  theme_tags: string;
  sentiment: string;
  source: string | null;
  ticker: string;
  name: string;
  sector: string;
}

export function useCommentary(filters?: { theme?: string; limit?: number }) {
  const params = new URLSearchParams();
  if (filters?.theme) params.set('theme', filters.theme);
  if (filters?.limit) params.set('limit', String(filters.limit));
  const qs = params.toString();

  return useQuery({
    queryKey: ['commentary', qs],
    queryFn: () => apiFetch<CommentaryEntry[]>(`/api/commentary${qs ? '?' + qs : ''}`),
  });
}
