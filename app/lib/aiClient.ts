'use client';

export type BatchAIResult = {
  index: number;
  text: string;
  sentiment?: string; // e.g., 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'
  score_hint?: number; // 0..1
  reasons?: string;
  palabras_clave?: string[];
};

export async function analyzeComments(comments: string[]): Promise<{ results: BatchAIResult[] }>
{
  const base = process.env.NEXT_PUBLIC_API_URL || '';
  if (!base) throw new Error('AI base URL missing');
  const res = await fetch(`${base}/api/ai/sentiment-batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ comments, lang: 'es' })
  });
  if (!res.ok) throw new Error(`AI ${res.status}`);
  return res.json();
}