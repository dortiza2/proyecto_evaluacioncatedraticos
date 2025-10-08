# Frontend — Evaluación de Catedráticos

Este frontend (Next.js 14) consume el backend mediante la variable de entorno `NEXT_PUBLIC_API_URL`. Todas las peticiones al backend utilizan el prefijo `/v1` en los endpoints.

## Configuración de entorno

- Define `NEXT_PUBLIC_API_URL` apuntando a la URL base del backend (sin `/v1`). Ejemplo:

```
NEXT_PUBLIC_API_URL=https://proyecto-evaluacioncatedraticos-back.onrender.com
```

- El código del frontend añade el prefijo `/v1` en los endpoints:
  - GET `"${API_URL}/v1/teachers"` (cache: `no-store`)
  - POST `"${API_URL}/v1/evaluations"` (payload con `comment`)

- Hay un archivo `.env.example` en la raíz que puedes copiar a `.env.local`.

## Instalación y ejecución local

1. Instala dependencias:
   - `npm install --legacy-peer-deps`

2. Define la variable de entorno y arranca el servidor:
   - `NEXT_PUBLIC_API_URL=https://proyecto-evaluacioncatedraticos-back.onrender.com npm run dev`
   - Abre `http://localhost:3000`.

> Nota: Si el backend está caído, verás errores de red al cargar docentes o enviar evaluaciones.

## Convenciones del frontend

- No se usan rutas locales `"/api/..."` en el frontend.
- No hay dependencias de cliente de base de datos en `package.json`.
- Peticiones `GET` usan `cache: "no-store"`.
- El campo del comentario en el POST es `comment` (antes `comentario`).

## Despliegue en Render

- En el servicio de Render del FRONT (Static/Next.js), configura la variable `NEXT_PUBLIC_API_URL` con la URL base del BACK (sin `/v1`).
- Verifica que el BACK está en línea; de lo contrario, el FRONT mostrará errores de red al consumir `/v1/teachers` y `/v1/evaluations`.

## Desarrollo de documentación (Fumadocs)

- Integración actualizada a Fumadocs MDX v10.
- La configuración vive en `source.config.ts` y se genera `.source` automáticamente.

## Comandos útiles

- `npm run dev` — desarrollo local
- `npm run build` — build de producción
- `npm run start` — servidor de producción