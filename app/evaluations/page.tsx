"use client";

import { useEffect, useMemo, useState } from "react";
import { analyzeSentimentViaAPI, type SentimentResult } from '@/app/lib/sentiment';
import styles from "./Form.module.css";

// 1) Configuración Next: evitar contacto con BACK en build
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

// 2) Base de API + helpers de fetch seguros
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
const API = (p: string) => `${API_BASE}/v1${p}`;
// Helper alterno pedido en prompt
const api = (p: string) => `${API_BASE}/v1${p}`;

async function safeGet<T>(
  path: string,
  fallback: T
): Promise<{ ok: boolean; data: T; offline: boolean }> {
  if (!API_BASE) return { ok: false, data: fallback, offline: true };
  const attempt = async () => {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), 4000);
    try {
      const res = await fetch(API(path), { cache: "no-store", signal: ctrl.signal });
      clearTimeout(id);
      if (!res.ok) return { ok: false, data: fallback, offline: true };
      const data = (await res.json()) as T;
      return { ok: true, data, offline: false };
    } catch {
      clearTimeout(id);
      throw new Error("network");
    }
  };
  try {
    return await attempt();
  } catch {
    // pequeño backoff para cold start del backend
    await new Promise((r) => setTimeout(r, 1200));
    try {
      return await attempt();
    } catch {
      return { ok: false, data: fallback, offline: true };
    }
  }
}

async function safePost(
  path: string,
  body: any
): Promise<{ ok: boolean; offline: boolean; status?: number }> {
  if (!API_BASE) return { ok: false, offline: true };
  try {
    const res = await fetch(API(path), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    return { ok: res.ok, offline: false, status: res.status };
  } catch {
    return { ok: false, offline: true };
  }
}

type Teacher = { id: string; name: string };

// Tipos para tablas según backend (blindando tipos numéricos)
// Tipos para tablas según prompt
type StatRow = { teacher: string; materia: string | null; promedio: number; calificaciones: number };
type CommentRow = { teacher: string; comment: string; promedio: number; created_at: string };

// Utilidades numéricas para evitar errores de toFixed()
// Utilidades de número (por si se usan en otra parte)
const num = (x: any): number => {
  const n = typeof x === 'number' ? x : parseFloat(String(x ?? ''));
  return Number.isFinite(n) ? n : 0;
};
const fmt2 = (x: any) => Number(num(x)).toFixed(2);

type Scores = {
  manejo_tema: number;
  claridad: number;
  dominio: number;
  interaccion: number;
  recursos: number;
};

const initialScores: Scores = {
  manejo_tema: 0,
  claridad: 0,
  dominio: 0,
  interaccion: 0,
  recursos: 0,
};

export default function EvaluationFormPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [teacherId, setTeacherId] = useState<string>("");
  const [scores, setScores] = useState<Scores>(initialScores);
  const [comment, setComment] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  // Se evita mostrar mensajes de "modo offline" en UI; se mantiene lógica segura
  const [offline] = useState<boolean>(!API_BASE);
  const [showStats, setShowStats] = useState<boolean>(false);
  const [showComments, setShowComments] = useState<boolean>(false);
  const [stats, setStats] = useState<StatRow[] | null>(null);
  const [comments, setComments] = useState<CommentRow[] | null>(null);
  const [refreshKey, setRefreshKey] = useState(0); // para recargar tras enviar
  const [enriched, setEnriched] = useState<Record<number, SentimentResult>>({});
  const [enriching, setEnriching] = useState(false);

  // Fingerprint opcional y simple (no invasivo)
  const fingerprint = useMemo(() => {
    try {
      const data = [
        navigator.userAgent,
        Intl.DateTimeFormat().resolvedOptions().timeZone,
        screen.width + "x" + screen.height,
      ].join("|");
      return btoa(unescape(encodeURIComponent(data))).slice(0, 48);
    } catch {
      return undefined;
    }
  }, []);

  useEffect(() => {
    async function loadTeachers() {
      setError("");
      const r = await safeGet<Array<{ id: number; nombre_catedratico: string }>>("/teachers", []);
      if (!r.ok) {
        setTeachers([]);
        return;
      }
      setTeachers(
        r.data.map((t) => ({ id: String(t.id), name: t.nombre_catedratico }))
      );
    }
    loadTeachers();
  }, []);

  // Cargar estadísticas y comentarios reales (arrays directos del backend), refrescando por refreshKey
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // con reintento simple para cold start
        const fetchStats = async () => {
          try {
            const r = await fetch(api('/stats'), { cache: 'no-store' });
            if (!r.ok) throw new Error('bad');
            return await r.json();
          } catch {
            await new Promise((r) => setTimeout(r, 1200));
            const r2 = await fetch(api('/stats'), { cache: 'no-store' });
            if (!r2.ok) throw new Error('bad');
            return await r2.json();
          }
        };
        const data = await fetchStats();
        if (!alive) return;
        setStats(Array.isArray(data) ? data.map((d: any) => ({
          teacher: d.teacher,
          materia: d.materia ?? null,
          promedio: Number(d.promedio),
          calificaciones: Number(d.calificaciones),
        })) : []);
      } catch {
        if (!alive) return;
        setStats([]);
      }

      try {
        const fetchComments = async () => {
          try {
            const r2 = await fetch(api('/comments'), { cache: 'no-store' });
            if (!r2.ok) throw new Error('bad');
            return await r2.json();
          } catch {
            await new Promise((r) => setTimeout(r, 1200));
            const r3 = await fetch(api('/comments'), { cache: 'no-store' });
            if (!r3.ok) throw new Error('bad');
            return await r3.json();
          }
        };
        const data2 = await fetchComments();
        if (!alive) return;
        setComments(Array.isArray(data2) ? data2.map((d: any) => ({
          teacher: d.teacher,
          comment: d.comment,
          promedio: Number(d.promedio),
          created_at: d.created_at,
        })) : []);
      } catch {
        if (!alive) return;
        setComments([]);
      }
    })();
    return () => { alive = false; };
  }, [refreshKey]);

  // Enriquecer comentarios con sentimiento llamando al util
  useEffect(() => {
    if (!comments || !comments.length) { setEnriched({}); return; }
    let alive = true; setEnriching(true);
    (async () => {
      const out: Record<number, SentimentResult> = {};
      const queue = comments.map((row, idx) => ({ idx, text: (row as any).comentario ?? row.comment ?? '' }));
      let i = 0;
      const run = async () => {
        while (i < queue.length && alive) {
          const current = i++;
          const { idx, text } = queue[current];
          out[idx] = await analyzeSentimentViaAPI(api, text);
          if (!alive) return;
          setEnriched(prev => ({ ...prev, [idx]: out[idx] }));
          await new Promise(r => setTimeout(r, 60));
        }
      };
      await Promise.all([run(), run()]);
      if (alive) setEnriching(false);
    })();
    return () => { alive = false; };
  }, [comments]);

  // Abrir secciones desde el navbar usando hash y hacer scroll
  useEffect(() => {
    function handleHash() {
      const hash = typeof window !== 'undefined' ? window.location.hash : '';
      if (hash === '#stats') {
        setShowStats(true);
        setShowComments(false);
        setTimeout(() => {
          const el = document.getElementById('stats');
          el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 0);
      } else if (hash === '#comments') {
        setShowComments(true);
        setShowStats(false);
        setTimeout(() => {
          const el = document.getElementById('comments');
          el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 0);
      }
    }
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  function setScore(field: keyof Scores, value: number) {
    setScores((prev) => ({ ...prev, [field]: value }));
  }

  function resetForm() {
    setTeacherId("");
    setScores(initialScores);
    setComment("");
    setError("");
    setSuccess("");
  }

  function validate(): string | null {
    if (!teacherId) return "Selecciona un catedrático";
    const values = Object.values(scores);
    if (values.some((v) => v < 1 || v > 10)) return "Todas las calificaciones deben ser entre 1 y 10";
    if (comment && comment.trim().length > 0 && comment.trim().length < 5) return "El comentario debe tener al menos 5 caracteres si lo ingresas";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    // No se muestran banners/alerts de backend caído en producción
    const message = validate();
    if (message) {
      setError(message);
      return;
    }
    setLoading(true);
    try {
      const average = (
        (scores.manejo_tema + scores.claridad + scores.dominio + scores.interaccion + scores.recursos) / 5
      );
      const average_state = average >= 8 ? "EXCELENTE" : average >= 5 ? "BUENO" : "DEBE_MEJORAR";
      const payload = {
        teacher_id: teacherId,
        ...scores,
        comment: (comment ?? "").trim() || undefined,
        average,
        average_state,
        fingerprint,
      };
      const r = await safePost("/evaluations", payload);
      if (!r.ok) {
        setError("Error al enviar la evaluación");
        return;
      }
      
      // éxito
      setSuccess("¡Evaluación enviada! Gracias por tu aporte anónimo.");
      resetForm();
      // Forzar refresh de comentarios/estadísticas tras envío
      setRefreshKey((k) => k + 1);
    } catch {
      setError("Error al enviar la evaluación");
    } finally {
      setLoading(false);
    }
  }

  function rangeClass(n: number) {
    if (n >= 8) return styles.scoreGreen;
    if (n >= 5) return styles.scoreYellow;
    if (n >= 1) return styles.scoreRed;
    return "";
  }

  function ScoreRow({ label, field, value }: { label: string; field: keyof Scores; value: number }) {
    return (
      <div className={styles.formRow}>
        <label className={styles.label}>{label}</label>
        <div className={styles.scores} role="radiogroup" aria-label={label}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={value === n}
              aria-label={`${label} ${n}`}
              className={`${styles.scoreBtn} ${value === n ? `${styles.scoreSelected} ${rangeClass(n)}` : ""}`}
              onClick={() => setScore(field, n)}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <div className={styles.grid}>
          <form onSubmit={handleSubmit}>
            <h1 className={styles.title}>Evaluación de Catedrático</h1>
            <p className={styles.subtitle}>Responde con sinceridad. Tu evaluación es anónima.</p>

            <div className={styles.section}>
              {/* Mensajes de backend caído removidos según prompt */}

              <div className={styles.formRow}>
                <label htmlFor="teacher" className={styles.label}>
                  Catedrático
                </label>
                <select
                  id="teacher"
                  className={styles.select}
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  required
                >
                  <option value="" disabled>
                    Selecciona un catedrático
                  </option>
                  {teachers.length === 0 ? (
                    <option value="" disabled>
                      {"Sin datos"}
                    </option>
                  ) : (
                    teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <ScoreRow label="Manejo del tema" field="manejo_tema" value={scores.manejo_tema} />
              <ScoreRow label="Claridad al explicar" field="claridad" value={scores.claridad} />
              <ScoreRow label="Dominio de la clase" field="dominio" value={scores.dominio} />
              <ScoreRow label="Interacción con estudiantes" field="interaccion" value={scores.interaccion} />
              <ScoreRow label="Uso de recursos" field="recursos" value={scores.recursos} />

              <div className={styles.formRow}>
                <label htmlFor="comment" className={styles.label}>
                  Comentario (opcional)
                </label>
                <textarea
                  id="comment"
                  className={styles.textarea}
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Comparte tu experiencia (mínimo 5 caracteres si lo incluyes)"
                />
              </div>

              <div className={styles.actions}>
                <button className={styles.btnPrimary} type="submit" disabled={loading || offline}>
                  {loading ? "Enviando..." : "Enviar"}
                </button>
                <button className={styles.btnGhost} type="button" onClick={resetForm}>
                  Limpiar
                </button>
                <button className={styles.btnSecondary} type="button" onClick={() => { setShowStats((s) => !s); setShowComments(false); }}>
                  Estadísticas
                </button>
                <button className={styles.btnSecondary} type="button" onClick={() => { setShowComments((s) => !s); setShowStats(false); }}>
                  Comentarios
                </button>
              </div>

              {/* Promedio superior eliminado; se mantiene sólo en el bloque de Resumen */}

              {error && <p className={styles.error}>{error}</p>}
              {success && <p className={styles.success}>{success}</p>}

              {/* Nota de fingerprint eliminada */}

              {/* Resumen debajo de los botones */}
              <div className={styles.section} aria-label="Resumen de evaluación" style={{marginTop:12}}>
                <h2 className={styles.summaryTitle}>Resumen</h2>
                <p className={styles.summaryItem}>
                  Catedrático: {teacherId ? teachers.find((t) => t.id === teacherId)?.name : "No seleccionado"}
                </p>
                {(() => {
                  const avg = (
                    (scores.manejo_tema + scores.claridad + scores.dominio + scores.interaccion + scores.recursos) / 5
                  );
                  const avgClass = avg >= 8 ? styles.avgGreen : avg >= 5 ? styles.avgYellow : styles.avgRed;
                  const label = avg >= 8 ? "EXCELENTE" : avg >= 5 ? "BUENO PERO PUEDE MEJORAR" : "DEBE MEJORAR";
                  return (
                    <p className={`${styles.summaryItem} ${avgClass}`}>
                      Promedio: {avg.toFixed(2)} — Estado: {label}
                    </p>
                  );
                })()}
                <p className={styles.summaryItem}>
                  Comentario: {comment ? comment : "(Vacío)"}
                </p>
              </div>

              {(showStats || showComments) && (
                <div className={styles.tablesWrapper}>
                  {showStats && (
                    <div id="stats">
                      <h3 className={styles.tableTitle}>Estadísticas</h3>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th className={styles.th}>Catedrático</th>
                            <th className={styles.th}>Materia</th>
                            <th className={styles.th}>Promedio</th>
                            <th className={styles.th}>Calificaciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats && stats.length > 0 ? stats.map((s, i) => (
                            <tr key={i}>
                              <td className={styles.td}>{s.teacher}</td>
                              <td className={styles.td}>{s.materia ?? '—'}</td>
                              <td className={styles.td}><span className={`${styles.badge}`}>{Number(s.promedio).toFixed(2)}</span></td>
                              <td className={styles.td}>{s.calificaciones}</td>
                            </tr>
                          )) : (
                            <tr><td className={styles.td} colSpan={4}>Sin datos.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {showComments && (
                    <div id="comments">
                      <h3 className="text-xl font-semibold mb-2">Comentarios</h3>
                      <div className="text-sm text-muted-foreground mb-2">
                        {enriching ? 'Analizando sentimientos…' : (comments?.length ? '' : 'Sin comentarios.')}
                      </div>
                      <div className="overflow-x-auto rounded-md border">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-muted">
                              <th className="p-2 text-left">Fecha</th>
                              <th className="p-2 text-left">Comentario</th>
                              <th className="p-2 text-left">Sentimiento</th>
                              <th className="p-2 text-left">% Positivo</th>
                              <th className="p-2 text-left">Motivo</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(comments ?? []).map((row: any, idx: number) => {
                              const ai = enriched[idx];
                              const fecha = new Date(row.creado_en ?? row.fecha ?? row.created_at ?? Date.now());
                              const pct = ai ? Math.round((ai.positive ?? 0) * 10000) / 100 : 0;
                              const label = ai?.label ?? 'NEUTRO';
                              const motivo = ai?.reason ?? '—';
                              return (
                                <tr key={idx} className="border-t">
                                  <td className="p-2 whitespace-nowrap">{fecha.toLocaleString()}</td>
                                  <td className="p-2 max-w-[48rem]">{row.comment ?? row.comentario}</td>
                                  <td className="p-2">
                                    <span className={label==='POSITIVO' ? 'text-green-600 font-medium' : label==='NEGATIVO' ? 'text-red-600 font-medium' : 'text-foreground'}>
                                      {label}
                                    </span>
                                  </td>
                                  <td className="p-2">{pct.toFixed(2)}%</td>
                                  <td className="p-2">{motivo}</td>
                                </tr>
                              );
                            })}
                            {(!comments || comments.length===0) && (
                              <tr><td className="p-3 text-center text-muted-foreground" colSpan={5}>Sin comentarios.</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </form>

          {/* Resumen lateral eliminado; el resumen ahora se muestra debajo de los botones */}
        </div>
      </div>
    </main>
  );
}