'use client';

export type Label = 'POSITIVO' | 'NEGATIVO' | 'NEUTRO';
export type SentimentResult = {
  label: Label;
  positive: number;
  neutral: number;
  negative: number;
  reason?: string;
};

const POS = ['excelente','bueno','bien','claro','ameno','aprendí','aprendi','genial','recomiendo','puntual','domina'];
const NEG = ['malo','mal','pésimo','pesimo','confuso','difícil','dificil','aburrido','tarde','impuntual','no entiende','regular'];

function extractReason(text: string) {
  const t = ` ${text.toLowerCase()} `;
  const hit = (bag: string[]) => bag.filter(w => t.includes(` ${w} `));
  const pos = hit(POS); const neg = hit(NEG);
  if (pos.length && !neg.length) return `Palabras: ${[...new Set(pos)].slice(0,3).join(', ')}`;
  if (neg.length && !pos.length) return `Palabras: ${[...new Set(neg)].slice(0,3).join(', ')}`;
  if (pos.length && neg.length) return `Mixto (${[...new Set(pos.concat(neg))].slice(0,3).join(', ')})`;
  return undefined;
}

function fallback(text: string): SentimentResult {
  const r = extractReason(text) ?? undefined;
  const hasPos = r && POS.some(p => r.toLowerCase().includes(p));
  const hasNeg = r && NEG.some(n => r.toLowerCase().includes(n));
  if (hasPos && !hasNeg) return { label:'POSITIVO', positive:0.7, neutral:0.25, negative:0.05, reason:r };
  if (hasNeg && !hasPos) return { label:'NEGATIVO', positive:0.1, neutral:0.2, negative:0.7, reason:r };
  return { label:'NEUTRO', positive:0.33, neutral:0.34, negative:0.33, reason:r };
}

function toLabel(p: number): Label {
  if (p > 0.66) return 'POSITIVO';
  if (p < 0.33) return 'NEGATIVO';
  return 'NEUTRO';
}

export async function analyzeSentimentViaAPI(api: (p:string)=>string, text: string): Promise<SentimentResult> {
  // Hotfix: no llamar Azure; usar backend propio si se requiere análisis por comentario (no batch)
  try {
    const res = await fetch(api('/ai/sentiment/simple'), {
      method:'POST', headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ text })
    });
    if (!res.ok) return fallback(text);
    const data:any = await res.json();
    const positive = data?.scores?.positive ?? data?.confidenceScores?.positive ?? 0.33;
    const neutral  = data?.scores?.neutral  ?? data?.confidenceScores?.neutral  ?? 0.34;
    const negative = data?.scores?.negative ?? data?.confidenceScores?.negative ?? 0.33;
    const raw = (data?.label ?? data?.sentiment ?? toLabel(positive)).toString().toUpperCase();
    const label:Label = raw==='POSITIVE'?'POSITIVO': raw==='NEGATIVE'?'NEGATIVO': raw==='NEUTRAL'?'NEUTRO': toLabel(positive);
    const reason = data?.reason ?? extractReason(text);
    return { label, positive, neutral, negative, reason };
  } catch {
    return fallback(text);
  }
}