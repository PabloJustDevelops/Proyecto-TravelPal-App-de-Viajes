# Arquitectura

## Visión general
- App basada en `Next.js` (App Router) con `React` y `TypeScript`.
- Estado y contexto de autenticación en `src/contexts/AuthContext.tsx`.
- Cliente `Supabase` en `src/lib/supabase.ts`.
- Logger centralizado en `src/lib/logger.ts` con toasts (`src/lib/toast.ts` + `src/components/ui/Toast.tsx`).

## Decisiones clave
- Notificaciones: toasts globales provistos desde `RootLayout`.
- Manejo de errores: `logger.error` emite feedback visual y registra en consola.
- Organización por dominios en `src/components/*` y vistas en `src/app/*`.

## Diagramas
- Pendiente de agregar diagramas (flujo de auth, datos y UI).