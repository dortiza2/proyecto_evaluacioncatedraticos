"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./Form.module.css";
const API_URL = process.env.NEXT_PUBLIC_API_URL as string;
if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL no configurada");

type Teacher = { id: string; name: string };

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
      try {
        setError("");
        const endpoint = `${API_URL}/v1/teachers`;
        const res = await fetch(endpoint, { cache: "no-store" });
        if (!res.ok) throw new Error("No se pudo cargar la lista de catedráticos");
        const data: Teacher[] = await res.json();
        setTeachers(data);
      } catch (e: any) {
        setError(e.message || "Error al cargar docentes");
      }
    }
    loadTeachers();
  }, []);

  function setStar(field: keyof Scores, value: number) {
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
    if (values.some((v) => v < 1 || v > 5)) return "Todas las calificaciones deben ser entre 1 y 5";
    if (!comment || comment.trim().length < 5) return "El comentario debe tener al menos 5 caracteres";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    const message = validate();
    if (message) {
      setError(message);
      return;
    }
    setLoading(true);
    try {
      const payload = {
        teacher_id: teacherId,
        ...scores,
        comment: (comment ?? "").trim() || undefined,
        fingerprint,
      };
      const endpoint = `${API_URL}/v1/evaluations`;
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

  function StarRating({
    label,
    field,
    value,
  }: {
    label: string;
    field: keyof Scores;
    value: number;
  }) {
    return (
      <div className={styles.formRow}>
        <label className={styles.label}>{label}</label>
        <div className={styles.stars} role="radiogroup" aria-label={label}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={value === n}
              aria-label={`${label} ${n} estrellas`}
              className={`${styles.starButton} ${n <= value ? styles.starSelected : ""}`}
              onClick={() => setStar(field, n)}
            >
              ★
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
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <StarRating label="Manejo del tema" field="manejo_tema" value={scores.manejo_tema} />
              <StarRating label="Claridad al explicar" field="claridad" value={scores.claridad} />
              <StarRating label="Dominio de la clase" field="dominio" value={scores.dominio} />
              <StarRating label="Interacción con estudiantes" field="interaccion" value={scores.interaccion} />
              <StarRating label="Uso de recursos" field="recursos" value={scores.recursos} />

              <div className={styles.formRow}>
                <label htmlFor="comment" className={styles.label}>
                  Comentario (obligatorio)
                </label>
                <textarea
                  id="comment"
                  className={styles.textarea}
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Comparte tu experiencia (mínimo 5 caracteres)"
                  required
                  minLength={5}
                />
              </div>

              <div className={styles.actions}>
                <button className={styles.btnPrimary} type="submit" disabled={loading}>
                  {loading ? "Enviando..." : "Enviar"}
                </button>
                <button className={styles.btnGhost} type="button" onClick={resetForm}>
                  Limpiar
                </button>
              </div>

              <p className={styles.averageText}>
                Promedio: {(
                  (scores.manejo_tema +
                    scores.claridad +
                    scores.dominio +
                    scores.interaccion +
                    scores.recursos) /
                  5
                ).toFixed(1)}
              </p>

              {error && <p className={styles.error}>{error}</p>}
              {success && <p className={styles.success}>{success}</p>}

              <p className={styles.footerNote}>
                Nota: Se puede enviar un fingerprint anónimo para mejorar la integridad del sistema.
              </p>
            </div>
          </form>

          <aside className={styles.section} aria-label="Resumen de evaluación">
            <h2 className={styles.summaryTitle}>Resumen</h2>
            <p className={styles.summaryItem}>
              Catedrático: {teacherId ? teachers.find((t) => t.id === teacherId)?.name : "No seleccionado"}
            </p>
            <p className={styles.summaryItem}>
              Promedio: {(
                (scores.manejo_tema +
                  scores.claridad +
                  scores.dominio +
                  scores.interaccion +
                  scores.recursos) /
                5
              ).toFixed(1)}
            </p>
            <p className={styles.summaryItem}>
              Comentario: {comment ? comment : "(Vacío)"}
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}