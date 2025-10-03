import { NextResponse } from "next/server";

export async function GET() {
  const teachers = [
    { id: 1, name: "Juan Pérez" },
    { id: 2, name: "María López" },
    { id: 3, name: "Carlos García" },
    { id: 4, name: "Ana Martínez" },
  ];
  return NextResponse.json(teachers);
}