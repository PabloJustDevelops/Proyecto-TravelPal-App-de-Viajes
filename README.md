# App Viajes — Colaboración con Alejandro

Repositorio colaborativo orientado a documentación, organización y mejores prácticas para el proyecto de viajes.

## Descripción del proyecto

Aplicación web para gestionar viajes, gastos, presupuestos y analíticas. Integra autenticación, dashboards y utilidades como logger centralizado y sistema de notificaciones/toasts.

## Estado del desarrollo

- Estable con vistas principales (`/trips`, `/expenses`, `/budget`, `/analytics`).
- Logger centralizado y toasts globales integrados.
- En proceso: estandarización de spinners y validaciones consistentes.

## Tecnologías utilizadas

- Frontend: `Next.js` (App Router), `React`, `TypeScript`.
- Estilos/UI: `Tailwind CSS`, componentes propios.
- Backend/Servicios: `Supabase` (DB, Auth), `Amadeus API` (opcional).
- Herramientas: `Jest`, `ESLint`, `Prettier`, `GitHub Actions`.

## Roadmap

- Funcionalidades implementadas
  - Gestión de viajes, gastos y presupuestos.
  - Vista de analíticas y exportación de datos.
  - Autenticación vía `AuthProvider`.
  - Logger centralizado (`src/lib/logger.ts`) con toasts globales.
- Bugs conocidos
  - Revisar consistencia de spinners entre páginas.
  - Afinar mensajes de error en exportaciones/lecturas.
- Features pendientes
  - Toasters de éxito para operaciones CRUD.
  - Filtros avanzados y más métricas en analíticas.
  - Internacionalización de textos.
- Mejoras futuras
  - Tests de integración por página clave.
  - Documentación de componentes UI reutilizables.

## Documentación técnica

Consulta `docs/TECHNICAL.md` para requisitos del sistema, instalación, comandos clave y variables de entorno.

## Contribución y organización

- Guías y mejores prácticas en `docs/CONTRIBUTING.md`, `docs/BRANCHING.md`, `docs/PR_PROCESS.md`, `docs/COMMITS.md`.
- Plantillas y automatizaciones en `.github/` (issues, PRs, CI/CD, commitlint, creación de labels).
- Arquitectura y decisiones: `docs/ARCHITECTURE.md`, `docs/DECISIONS/ADR-000-template.md`.

## Puesta en marcha rápida

```bash
npm install
npm run dev
```

Más detalles en `docs/TECHNICAL.md`.
