import { format, parseISO } from 'date-fns';

export function formatCurrency(n: number | null): string {
  if (n === null || n === undefined) return '--';
  const abs = Math.abs(n);
  if (abs >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toLocaleString()}`;
}

export function formatPct(n: number | null, decimals = 1): string {
  if (n === null || n === undefined) return '--';
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(decimals)}%`;
}

export function formatEps(n: number | null): string {
  if (n === null || n === undefined) return '--';
  return `$${n.toFixed(2)}`;
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '--';
  try {
    return format(parseISO(dateStr), 'MMM d');
  } catch {
    return dateStr;
  }
}

export function formatDateFull(dateStr: string | null): string {
  if (!dateStr) return '--';
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy');
  } catch {
    return dateStr;
  }
}

export function classifyResult(actual: number | null, estimate: number | null): 'beat' | 'miss' | 'meet' | 'pending' {
  if (actual === null || actual === undefined || estimate === null || estimate === undefined) return 'pending';
  const diff = ((actual - estimate) / Math.abs(estimate || 1)) * 100;
  if (diff > 0.5) return 'beat';
  if (diff < -0.5) return 'miss';
  return 'meet';
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
