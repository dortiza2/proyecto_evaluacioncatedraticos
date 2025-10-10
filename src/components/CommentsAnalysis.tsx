'use client';

import { useState } from 'react';
import { analyzeComments } from '@/src/lib/ai/client';
import { pct, sentimentBadgeClass } from '@/src/lib/ai/utils';
import type { SentimentItem } from '@/src/lib/ai/types';

type Props = {
  comments: string[]; // Arr de comentarios ya listos (texto plano)
};

export default function CommentsAnalysis({ comments }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [results, setResults] = useState<SentimentItem[] | null>(null);

  async function run() {
    try {
      setLoading(true);
      setError(null);
      setResults(null);
      if (!Array.isArray(comments) || comments.length === 0) {
        setError('No hay comentarios para analizar.');
        setLoading(false);
        return;
      }
      const data = await analyzeComments(comments, 'es');
      setResults(data.results ?? []);
    } catch (e: any) {
      setError(e?.message || 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <button
          onClick={run}
          disabled={loading}
          className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-white hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? 'Analizando…' : 'Analizar comentarios'}
        </button>
        <span className="text-sm opacity-70">Proveedor: APILayer</span>
      </div>

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 p-2 text-sm text-red-800">
          <span>{error}</span>
        </div>
      )}

      {!error && results && results.length === 0 && (
        <div className="rounded-md border border-blue-300 bg-blue-50 p-2 text-sm text-blue-800">
          <span>Sin resultados.</span>
        </div>
      )}

      {results && results.length > 0 && (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left">#</th>
                <th className="p-2 text-left">Comentario</th>
                <th className="p-2 text-left">Sentimiento</th>
                <th className="p-2 text-left">% Positivo</th>
                <th className="p-2 text-left">Motivo</th>
                <th className="p-2 text-left">Palabras clave</th>
              </tr>
            </thead>
            <tbody>
              {results.map(r => (
                <tr key={r.index}>
                  <td className="p-2">{r.index + 1}</td>
                  <td className="p-2">{r.text}</td>
                  <td className="p-2">
                    <span className={sentimentBadgeClass(r.sentiment)}>
                      {r.sentiment.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-2">{pct(r.score_hint)}</td>
                  <td className="p-2">{r.reasons || '—'}</td>
                  <td className="p-2">{(r.palabras_clave || []).join(', ') || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}