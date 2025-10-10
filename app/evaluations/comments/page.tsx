import CommentsAnalysis from '@/src/components/CommentsAnalysis';
import { mapCommentsFromSource } from '@/src/lib/ai/utils';

// Simulación: reemplaza por fetch a tu API que devuelve comentarios crudos
async function getComments(): Promise<string[]> {
  const rows = [
    { comentario: 'Excelente dominio del tema.' },
    { comentario: 'Llega tarde y no explica.' },
    { comentario: 'Clase normal.' }
  ];
  return mapCommentsFromSource(rows);
}

export default async function Page() {
  const comments = await getComments();
  return (
    <main className="p-4">
      <h1 className="text-xl font-bold mb-4">Comentarios</h1>
      <CommentsAnalysis comments={comments} />
    </main>
  );
}