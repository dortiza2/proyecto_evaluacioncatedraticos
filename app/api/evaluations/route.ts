import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const {
    teacher_id,
    manejo_tema,
    claridad,
    dominio_clase,
    interaccion,
    uso_recursos,
    comment,
  } = body || {};

  const inRange = (n: any) => typeof n === "number" && n >= 1 && n <= 10;
  const valid =
    !!teacher_id &&
    inRange(manejo_tema) &&
    inRange(claridad) &&
    inRange(dominio_clase) &&
    inRange(interaccion) &&
    inRange(uso_recursos) &&
    typeof comment === "string" && comment.trim().length >= 5 && comment.trim().length <= 300;

  if (!valid) {
    return NextResponse.json({ ok: false, error: "Datos inválidos" }, { status: 400 });
  }
  // Simulación: devolvemos ok
  return NextResponse.json({ ok: true });
}