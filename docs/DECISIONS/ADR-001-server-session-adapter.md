# ADR-001: Adaptador único de sesión de servidor

## Contexto

Los 12 route handlers de `src/app/api/**` construían cada uno su propio cliente Supabase de servidor (`createServerClient` + `cookies()`) y resolvían la sesión por su cuenta con `supabase.auth.getSession()`. El bloque estaba copiado 21 veces (con dos variantes de comentario) y cada handler reescribía su propia respuesta 401 con textos distintos ("No autorizado" / "No autorizado. Por favor inicia sesión."). El handler de `planning` tenía además un helper local `withAuth` que solo cubría sus tres métodos.

`getSession()` carga la sesión desde las cookies sin reverificar el token con el servidor de Auth. La documentación de Supabase desaconseja confiar en él en código de servidor.

## Decisión

Extraer un único module en `src/lib/supabase/server.ts` que exporta `createServerSupabaseClient()` y `requireUser()`. `requireUser()` verifica la identidad con `supabase.auth.getClaims()` (valida la firma del JWT; verificación local cuando el proyecto usa claves asimétricas) y devuelve un discriminado:

- `{ ok: true, supabase, user }`, con `user` normalizado (`id`, `email`, `user_metadata`) a partir de los claims
- `{ ok: false, response }`, con 401 si no hay usuario y 500 si falla el servidor de Auth

Los 12 handlers consumen `requireUser()`. `ensureUserExists` se mueve al mismo module y queda opt-in (los handlers POST lo invocan explícitamente). El helper `withAuth` de `planning` se elimina. El middleware se mantiene aparte: corre en runtime edge y usa la API de cookies `get/set/remove`, distinta de `getAll/setAll`.

## Consecuencias

- 21 copias del bloque pasan a 1 seam; un único texto de 401 y una única política de sesión.
- `getClaims()` verifica el token de verdad; con claves simétricas implica una llamada de red por petición (con asimétricas, verificación local).
- La distinción 401/500 se deriva de `error.status` de `AuthError`: `0` o `>= 500` → 500; cualquier otro valor (o sin status) → 401.
- Los handlers dejan de saber cómo se construye el cliente; el módulo es testeable a través de `requireUser()`.
- `getSupabaseAdmin` sigue sin usarse; no entra en este cambio.

## Estado

Aprobado
