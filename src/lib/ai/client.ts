import type { SentimentBatchResponse } from './types';

const API = process.env.NEXT_PUBLIC_API_URL;

export async function analyzeComments(comments: string[], lang: 'es'|'en' = 'es'): Promise<SentimentBatchResponse> {
  if (!API) throw new Error('NEXT_PUBLIC_API_URL no configurado');
  const res = await fetch(`${API}/api/ai/sentiment-batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ comments, lang })
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = typeof (data as any)?.error === 'string' ? (data as any).error : `HTTP ${res.status}`;
    throw new Error(`AI error: ${msg}`);
  }
  return data as SentimentBatchResponse;
}