# Documentación Técnica

## Requisitos del sistema
- `Node.js >= 18` y `npm >= 9`.
- Acceso a `Supabase` (URL y `anon key`).
- Opcional: credenciales de `Amadeus API`.

## Dependencias necesarias
- Ver `package.json` para dependencias exactas.
- Principales: `next`, `react`, `typescript`, `jest`, `eslint`, `prettier`.

## Instalación paso a paso
1. Clona el repositorio y entra al directorio.
2. Copia `.env.example` a `.env.local` y completa variables.
3. Instala dependencias:
   ```bash
   npm install
   ```
4. Ejecuta en desarrollo:
   ```bash
   npm run dev
   ```

## Comandos clave
- Desarrollo: `npm run dev`
- Build producción: `npm run build`
- Servir producción: `npm run start`
- Testing: `npm test`
- Linting: `npm run lint`

## Variables de entorno
Define en `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_LOG_LEVEL=info
AMADEUS_API_KEY=
AMADEUS_API_SECRET=
```

## Estructura de carpetas
- `src/app/`: páginas y layout.
- `src/components/`: componentes por dominio y UI.
- `src/lib/`: clientes, logger, utilidades.
- `docs/`: documentación extendida.
- `.github/`: plantillas y workflows.