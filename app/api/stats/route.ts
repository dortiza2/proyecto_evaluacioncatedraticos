import { NextResponse } from "next/server";

export async function GET() {
  // Datos simulados de estadísticas agregadas por catedrático
  const stats = [
    {
      teacher_id: 1,
      name: "Juan Pérez",
      course: "Álgebra Lineal",
      average: 8.12,
      grades: [8.0, 7.9, 9.1, 7.5],
      count: 12,
    },
    {
      teacher_id: 2,
      name: "María López",
      course: "Programación I",
      average: 7.60,
      grades: [7.5, 7.8, 7.1],
      count: 9,
    },
    {
      teacher_id: 3,
      name: "Carlos García",
      course: null, // curso no disponible
      average: 6.90,
      grades: null, // detalle no disponible
      count: 7,
    },
    {
      teacher_id: 4,
      name: "Ana Martínez",
      course: "Bases de Datos",
      average: 8.80,
      grades: [8.8, 8.9, 8.7, 8.6],
      count: 15,
    },
  ];
  return NextResponse.json(stats);
}