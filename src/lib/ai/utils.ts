import type { SentimentItem } from './types';

export function pct(v: number | null): string {
  if (typeof v !== 'number') return '—';
  return `${(v * 100).toFixed(2)}%`;
}

export function sentimentBadgeClass(s: string): string {
  const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold';
  if (s === 'positivo') return `${base} bg-green-100 text-green-800`;
  if (s === 'negativo') return `${base} bg-red-100 text-red-800`;
  return `${base} bg-yellow-100 text-yellow-800`;
}

export function mapCommentsFromSource(rows: any[]): string[] {
  // Ajusta este mapper a tu fuente real (DB/estado).
  // Debe devolver solo el arreglo de string de comentarios.
  return rows
    .map(r => String(r?.comentario ?? r?.comment ?? '').trim())
    .filter(Boolean);
}