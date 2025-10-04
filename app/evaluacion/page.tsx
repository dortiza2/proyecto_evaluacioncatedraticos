"use client";

import React, { useEffect, useMemo, useState, FormEvent } from "react";
import styles from "./Form.module.css";

type Teacher = { id: number | string; full_name?: string; name?: string; materia?: string; curso?: string };

type Scores = {
  manejo_tema: number;
  claridad: number;
  dominio_clase: number;
  interaccion: number;
  uso_recursos: number;
};

const initialScores: Scores = {
  manejo_tema: 0,
  claridad: 0,
  dominio_clase: 0,
  interaccion: 0,
  uso_recursos: 0,
};

type Category = "red" | "amber" | "green";

function toCategory(score: number): Category {
  if (score <= 4) return "red";
  if (score <= 7) return "amber";
  return "green";
}

function majority(categories: Category[]): Category {
  const count: Record<Category, number> = { red: 0, amber: 0, green: 0 };
  for (const c of categories) count[c]++;
  if (count.red >= count.amber && count.red >= count.green) return "red";
  if (count.amber >= count.red && count.amber >= count.green) return "amber";
  return "green";
}

function truncate(text: string, max = 120): string {
  if (!text) return "";
  return text.length > max ? text.slice(0, max) + "..." : text;
}

export default function EvaluacionPage() {
  // CONEXIÓN API-FRONTEND (CAMBIAR EN PRODUCCIÓN)
  // Archivo: formulario/app/evaluacion/page.tsx
  // Línea aproximada: 46 (definición de `API_URL`)
  // Configuración actual: `process.env.NEXT_PUBLIC_API_URL`
  // Reemplazar con: URL de producción del API (ej. `https://api.tu-dominio.com`) al desplegar
  // Nota: También ajustar credenciales/CORS en `api/server.js` para producción
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [teacherId, setTeacherId] = useState<string | number>("");
  const [scores, setScores] = useState<Scores>(initialScores);
  const [comment, setComment] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [showStats, setShowStats] = useState(false);
  type StatRow = { teacher_id: number | string; name?: string; course?: string | null; average?: number | null; grades?: number[] | null; count?: number | null };
  const [stats, setStats] = useState<StatRow[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string>("");
  // Por anonimato, no mostramos evaluaciones recientes ni comentarios/fecha
  

  

  const fingerprint_sha1 = useMemo(() => {
    try {
      const msg = [
        navigator.userAgent,
        Intl.DateTimeFormat().resolvedOptions().timeZone,
        screen.width + "x" + screen.height,
      ].join("|");
      const buffer = new TextEncoder().encode(msg);
      return btoa(String.fromCharCode(...buffer)).slice(0, 40);
    } catch {
      return undefined;
    }
  }, []);

  useEffect(() => {
    async function loadTeachers() {
      setError("");
      try {
        if (!API_URL || !/^https?:\/\//.test(API_URL)) {
          throw new Error("Configura NEXT_PUBLIC_API_URL para cargar catedráticos");
        }
        const res = await fetch(`${API_URL}/teachers`, { cache: "no-store" });
        if (!res.ok) throw new Error("No se pudo cargar catedráticos");
        const data: Teacher[] = await res.json();
        setTeachers(data);
      } catch (e: any) {
        setError(e.message || "Error al cargar catedráticos");
      }
    }
    loadTeachers();
  }, [API_URL]);

  useEffect(() => {
    async function loadStats() {
      if (!showStats) return;
      setStatsError("");
      setStatsLoading(true);
      try {
        if (!API_URL || !/^https?:\/\//.test(API_URL)) {
          throw new Error("Configura NEXT_PUBLIC_API_URL para cargar estadísticas");
        }
        const res = await fetch(`${API_URL}/stats`, { cache: "no-store" });
        if (!res.ok) throw new Error("No se pudo cargar estadísticas");
        const data: StatRow[] = await res.json();
        setStats(data);
      } catch (e: any) {
        setStatsError(e.message || "Error al cargar estadísticas");
      } finally {
        setStatsLoading(false);
      }
    }
    loadStats();
  }, [showStats, API_URL]);


  function setScore(field: keyof Scores, value: number) {
    setScores((prev) => ({ ...prev, [field]: value }));
  }

  function validate(): string | null {
    if (!teacherId) return "Selecciona un catedrático";
    const values = Object.values(scores);
    if (values.some((v) => v < 1 || v > 10)) return "Por favor, contesta los 5 aspectos solicitados con un número del 1 al 10";
    return null;
  }

  function resetForm() {
    setTeacherId("");
    setScores(initialScores);
    setComment("");
    setError("");
    setSuccess("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }
    setLoading(true);
    try {
      if (!API_URL || !/^https?:\/\//.test(API_URL)) {
        throw new Error("Configura NEXT_PUBLIC_API_URL para enviar evaluaciones");
      }
      const endpoint = `${API_URL}/evaluations`;
      const payload = {
        teacher_id: typeof teacherId === "string" ? Number(teacherId) : teacherId,
        manejo_tema: scores.manejo_tema,
        claridad: scores.claridad,
        dominio_clase: scores.dominio_clase,
        interaccion: scores.interaccion,
        uso_recursos: scores.uso_recursos,
        comment: comment.trim(),
        fingerprint_sha1,
      };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("No se pudo enviar la evaluación");
      setSuccess("¡Evaluación enviada! Gracias por tu aporte anónimo.");
      resetForm();
    } catch (e: any) {
      setError(e.message || "Error al enviar la evaluación");
    } finally {
      setLoading(false);
    }
  }

  type ScoreButtonsProps = { label: string; field: keyof Scores; value: number };
  const ScoreButtons = ({ label, field, value }: ScoreButtonsProps) => {
    const selectedClasses = (n: number) => {
      if (value !== n) return "";
      const cat = toCategory(n);
      const color = cat === "red" ? styles.red : cat === "amber" ? styles.amber : styles.green;
      return `${color} ${styles.active}`;
    };
    return (
      <div className={styles.formRow}>
        <label className={styles.label}>{label}</label>
        <div className={styles.scale} role="radiogroup" aria-label={label}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={value === n}
              aria-label={`${label}: ${n}`}
              className={`${styles.btn} ${selectedClasses(n)}`}
              onClick={() => setScore(field, n)}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const avg = useMemo(() => {
    const s = scores;
    const total = s.manejo_tema + s.claridad + s.dominio_clase + s.interaccion + s.uso_recursos;
    return (total / 5 || 0).toFixed(2);
  }, [scores]);

  const majorityState = useMemo(() => {
    const cats = [
      toCategory(scores.manejo_tema),
      toCategory(scores.claridad),
      toCategory(scores.dominio_clase),
      toCategory(scores.interaccion),
      toCategory(scores.uso_recursos),
    ];
    const m = majority(cats);
    if (m === "red") return "PUEDE MEJORAR";
    if (m === "amber") return "BUEN TRABAJO";
    return "EXCELENTE CATEDRÁTICO";
  }, [scores]);

  function teacherDisplayName(t: Teacher) {
    const base = t.full_name || t.name || String(t.id);
    const mat = t.materia ? ` — ${t.materia}` : "";
    const cur = t.curso ? ` (${t.curso})` : "";
    return `${base}${mat}${cur}`;
  }

  const statusClass = useMemo(() => {
    const cats = [
      toCategory(scores.manejo_tema),
      toCategory(scores.claridad),
      toCategory(scores.dominio_clase),
      toCategory(scores.interaccion),
      toCategory(scores.uso_recursos),
    ];
    const m = majority(cats);
    return m === "red" ? styles.statusRed : m === "amber" ? styles.statusAmber : styles.statusGreen;
  }, [scores]);

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>Evaluación de Catedrático</h1>
        <p className={styles.muted}>Responde con sinceridad. Tu evaluación es anónima.</p>

        <form onSubmit={handleSubmit}>
          <div className={styles.formRow}>
            <label htmlFor="teacher" className={styles.label}>Catedrático</label>
            <select
              id="teacher"
              className={styles.select}
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              required
            >
              <option value="" disabled>Selecciona un catedrático</option>
              {teachers.map((t) => (
                <option key={String(t.id)} value={String(t.id)}>{teacherDisplayName(t)}</option>
              ))}
            </select>
          </div>

          <ScoreButtons label="Manejo del tema" field="manejo_tema" value={scores.manejo_tema} />
          <ScoreButtons label="Claridad al explicar" field="claridad" value={scores.claridad} />
          <ScoreButtons label="Dominio de la clase" field="dominio_clase" value={scores.dominio_clase} />
          <ScoreButtons label="Interacción con estudiantes" field="interaccion" value={scores.interaccion} />
          <ScoreButtons label="Uso de recursos" field="uso_recursos" value={scores.uso_recursos} />

          <div className={styles.formRow}>
            <label htmlFor="comment" className={styles.label}>Comentario (opcional)</label>
            <textarea
              id="comment"
              className={styles.textarea}
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Comparte tu experiencia (opcional)"
              maxLength={300}
            />
          </div>

          <div className={styles.actions}>
            <button className={styles.primary} type="submit" disabled={loading}>{loading ? "Enviando..." : "Enviar"}</button>
            <button className={styles.secondary} type="button" onClick={resetForm}>Limpiar</button>
            <button className={styles.secondary} type="button" onClick={() => setShowStats((v) => !v)}>Estadísticas</button>
            {/* Evaluaciones recientes removidas por anonimato */}
          </div>

          {error && <p className={styles.error}>{error}</p>}
          {success && <p className={styles.success}>{success}</p>}
        </form>

        <div className={styles.summary} aria-label="Resumen de evaluación">
          <h2 className={styles.summaryTitle}>Resumen</h2>
          <p className={styles.summaryItem}>Catedrático: {teacherId ? teacherDisplayName(teachers.find((t) => String(t.id) === String(teacherId)) || { id: "-" }) : "No seleccionado"}</p>
          <p className={styles.summaryItem}>Promedio: {avg}</p>
          <p className={`${styles.summaryItem} ${statusClass}`}>Estado: {majorityState}</p>
          {/* Comentario removido por anonimato */}
        </div>

        {showStats && (
          <div className={styles.stats} aria-label="Estadísticas de catedráticos">
            <h2 className={styles.summaryTitle}>Estadísticas</h2>
            {statsError && <p className={styles.error}>{statsError}</p>}
            {statsLoading ? (
              <p className={styles.muted}>Cargando estadísticas...</p>
            ) : (
              <table className={styles.statsTable}>
                <thead>
                  <tr>
                    <th>Catedrático</th>
                    <th>Materia</th>
                    <th>Promedio</th>
                    <th>Calificaciones</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((row) => (
                    <tr key={String(row.teacher_id)}>
                      <td>{row.name || "N/A"}</td>
                      <td>{row.course || "N/A"}</td>
                      <td>{typeof row.average === "number" ? Number(row.average).toFixed(2) : "N/A"}</td>
                      <td>{typeof row.count === "number" ? row.count : "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Sección de evaluaciones recientes eliminada por anonimato */}
      </div>
    </div>
  );
}