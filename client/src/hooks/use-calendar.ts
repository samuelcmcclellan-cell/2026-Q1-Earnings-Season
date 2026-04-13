import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import type { EarningsEntry } from './use-earnings';

interface CalendarResponse {
  from: string;
  to: string;
  entries: EarningsEntry[];
}

export function useCalendar(from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const qs = params.toString();

  return useQuery({
    queryKey: ['calendar', from, to],
    queryFn: () => apiFetch<CalendarResponse>(`/api/calendar${qs ? '?' + qs : ''}`),
  });
}

export function useCalendarWeek(weekOf: string) {
  return useQuery({
    queryKey: ['calendar', 'week', weekOf],
    queryFn: () => apiFetch<CalendarResponse>(`/api/calendar/week/${weekOf}`),
  });
}

export function useUpcomingEarnings(days = 14) {
  return useQuery({
    queryKey: ['calendar', 'upcoming', days],
    queryFn: () => apiFetch<EarningsEntry[]>(`/api/calendar/upcoming?days=${days}`),
  });
}
