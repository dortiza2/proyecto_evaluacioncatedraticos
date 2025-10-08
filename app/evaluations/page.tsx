"use client";

import { useEffect, useMemo, useState } from "react";
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
  try {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(API(path), { cache: "no-store", signal: ctrl.signal });
    clearTimeout(id);
    if (!res.ok) return { ok: false, data: fallback, offline: true };
    const data = (await res.json()) as T;
    return { ok: true, data, offline: false };
  } catch {
    return { ok: false, data: fallback, offline: true };
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
type StatRow = {
  docente: string;
  materia: string;
  promedio: number | string;
  calificaciones: number | string;
};
type CommentRow = {
  docente: string;
  comentario: string;
  promedio: number | string;
  creado_en: string;
};

// Utilidades numéricas para evitar errores de toFixed()
const num = (x: any): number => {
  const n = typeof x === 'number' ? x : parseFloat(String(x ?? ''));
  return Number.isFinite(n) ? n : 0;
};
const fmt2 = (x: any) => num(x).toFixed(2);

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
  const [offline, setOffline] = useState<boolean>(!API_BASE);
  const [showStats, setShowStats] = useState<boolean>(false);
  const [showComments, setShowComments] = useState<boolean>(false);
  const [stats, setStats] = useState<StatRow[] | null>(null);
  const [comments, setComments] = useState<CommentRow[] | null>(null);
  const [isBackendDown, setIsBackendDown] = useState(false);

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
      setOffline(r.offline);
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

  // Cargar estadísticas y comentarios reales (arrays directos del backend)
  useEffect(() => {
    let alive = true;
    async function loadStats() {
      try {
        const r = await fetch(api('/stats'), { cache: 'no-store' });
        if (!r.ok) throw new Error('stats');
        const j = await r.json();
        if (!alive) return;
        setStats(Array.isArray(j) ? j : []);
        setIsBackendDown(false);
      } catch {
        if (!alive) return;
        setStats([]);
        setIsBackendDown(true);
      }
    }
    async function loadComments() {
      try {
        const r = await fetch(api('/comments'), { cache: 'no-store' });
        if (!r.ok) throw new Error('comments');
        const j = await r.json();
        if (!alive) return;
        setComments(Array.isArray(j) ? j : []);
      } catch {
        if (!alive) return;
        setComments([]);
      }
    }
    loadStats();
    loadComments();
    return () => { alive = false; };
  }, []);

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
    if (offline) {
      alert("Backend no disponible");
      return;
    }
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
        alert("Backend no disponible");
        return;
      }
      
      // éxito
      setSuccess("¡Evaluación enviada! Gracias por tu aporte anónimo.");
      resetForm();
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
              {isBackendDown && (<div className="rounded border p-2 bg-yellow-50" style={{marginBottom:12, color:'#111'}}>
                El backend no está disponible actualmente.
              </div>)}

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
                      {offline ? "Sin conexión al backend" : "Sin datos"}
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
                      {isBackendDown && (
                        <div className="rounded border p-2 bg-yellow-50" style={{marginBottom:12, color:'#111'}}>
                          El backend no está disponible temporalmente.
                        </div>
                      )}
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
                          {(stats ?? []).map((s, i) => (
                            <tr key={i}>
                              <td className={styles.td}>{s.docente}</td>
                              <td className={styles.td}>{s.materia}</td>
                              <td className={styles.td}><span className={`${styles.badge}`}>{fmt2(s.promedio)}</span></td>
                              <td className={styles.td}>{num(s.calificaciones)}</td>
                            </tr>
                          ))}
                          {stats && stats.length === 0 && (
                            <tr><td className={styles.td} colSpan={4}>Sin datos.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {showComments && (
                    <div id="comments">
                      <h3 className={styles.tableTitle}>Comentarios</h3>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th className={styles.th}>Catedrático</th>
                            <th className={styles.th}>Comentario</th>
                            <th className={styles.th}>Promedio</th>
                            <th className={styles.th}>Fecha</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(comments ?? []).map((c, i) => (
                            <tr key={i}>
                              <td className={styles.td}>{c.docente}</td>
                              <td className={styles.td}>{c.comentario}</td>
                              <td className={styles.td}><span className={`${styles.badge}`}>{fmt2(c.promedio)}</span></td>
                              <td className={styles.td}>{new Date(c.creado_en).toLocaleString()}</td>
                            </tr>
                          ))}
                          {comments && comments.length === 0 && (
                            <tr><td className={styles.td} colSpan={4}>Sin comentarios.</td></tr>
                          )}
                        </tbody>
                      </table>
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