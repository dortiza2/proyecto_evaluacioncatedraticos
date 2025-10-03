import { NextResponse } from "next/server";

export async function GET() {
  // Datos simulados de estadísticas agregadas por catedrático
  const stats = [
    { teacher_id: 1, name: "Juan Pérez", average: 8.1, count: 12 },
    { teacher_id: 2, name: "María López", average: 7.6, count: 9 },
    { teacher_id: 3, name: "Carlos García", average: 6.9, count: 7 },
    { teacher_id: 4, name: "Ana Martínez", average: 8.8, count: 15 },
  ];
  return NextResponse.json(stats);
}