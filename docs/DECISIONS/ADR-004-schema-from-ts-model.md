# ADR-004: El esquema se deriva del modelo TypeScript de la app

## Contexto

Los `.sql` del repo eran de la etapa Supabase y no eran una fuente de verdad utilizable:
`supabase-schema.sql` avisaba de que "no está pensado para ejecutarse" y usaba un enum
`trip_status` que ningún fichero define; `src/lib/supabase-schema.sql` creaba claves foráneas a
`trips(id)` sin crear `trips`; `create_profiles_table.sql` usaba `raw_user_meta_data` (columna de
Supabase) y tocaba el esquema `auth`. El esquema real de la app estaba en el modelo TypeScript y
en las consultas de las rutas API y las páginas.

## Decisión

Derivar el esquema de las consultas reales (tipos de `src/lib` + rutas API + páginas) y dejarlo en
**una sola fuente de verdad**: `migrations/20260913181842_create-app-schema.sql`.

- `text + CHECK` en lugar de enums de Postgres (encaja con las uniones de strings del TS y evita
  el enum no definido).
- FKs solo donde una consulta las usa (`auth.users(id)`, `trips(id)`, etc.).
- RLS de propietario con `auth.uid()` en cada tabla con `user_id` (y por `id` en `users`/`profiles`).
- Índices solo para filtros/órdenes reales; `updated_at` con `system.update_updated_at()`.
- Los avatares son Storage: el bucket se crea con el CLI, no con DDL.
- Se borran los `.sql` de Supabase que se contradecían (quedan en el historial de git).

## Consecuencias

- Un cambio de esquema se hace con `db migrations new` + `up`, no editando SQL suelto.
- Si el modelo TS cambia, la migración debe reflejarlo; el código manda sobre la documentación.
- Al no haber enums, los valores válidos se validan por `CHECK` y por los tipos TS.

## Estado

Aprobado
