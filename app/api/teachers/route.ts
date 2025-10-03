import { NextResponse } from "next/server";

export async function GET() {
  const teachers = [
    { id: 1, full_name: "Juan Pérez" },
    { id: 2, full_name: "María Gómez" },
    { id: 3, full_name: "Luis Rodríguez" },
    { id: 4, full_name: "Ana Martínez" },
  ];
  return NextResponse.json(teachers);
}