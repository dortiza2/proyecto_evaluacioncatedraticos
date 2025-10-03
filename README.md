# Proyecto: Evaluación de Catedráticos

Este repositorio contiene la aplicación para gestionar y evaluar catedráticos. El proyecto fue reorganizado para separar claramente la aplicación de formulario y una carpeta reservada para la API.

## Estructura

- `formulario/`: Aplicación Next.js con la interfaz de usuario.
  - Rutas clave: `/` (inicio), `/evaluacion` (formulario de evaluación), `/docs` (sección de documentación si aplica).
  - Estilos y ajustes recientes: mejora de responsividad móvil, botones numéricos más bajos y área de comentarios en gris.

- `api/`: Carpeta independiente reservada para endpoints/servicios. Actualmente contiene un `README.md` de inicio.

## Requisitos

- `Node.js >= 18`
- `npm` o `pnpm`

## Instalación y ejecución (formulario)

```bash
cd formulario
npm install
npm run dev
```

La aplicación suele iniciar en `http://localhost:3001/` (puede variar si algún puerto está ocupado). La ruta `http://localhost:3001/evaluacion` debería cargar sin errores.

## Despliegue y ramas

- Rama principal: `main`.
- Remoto: `origin` -> `https://github.com/dortiza2/proyecto_evaluacioncatedraticos.git`.

## Notas de reestructuración

- Se movió el proyecto original a `formulario/` y se creó `api/` de forma separada.
- Se eliminaron restos irrelevantes del nombre previo y se ajustaron estilos en la página de evaluación.

## Próximos pasos

- Definir endpoints en `api/` y su integración con `formulario`.
- Agregar documentación técnica adicional según necesidades del curso/proyecto.