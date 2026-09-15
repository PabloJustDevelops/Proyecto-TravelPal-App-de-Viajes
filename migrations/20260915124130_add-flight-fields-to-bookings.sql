-- Campos de vuelo en la reserva: el vuelo introducido a mano se registra como
-- una Booking de tipo 'flight' (ver ADR-006).
--
-- No hacen falta politicas ni grants nuevos: las politicas de bookings son por
-- fila (bookings_select_own/_insert_own/_update_own/_delete_own, con
-- auth.uid() = user_id) y ya cubren estas columnas, y los grants de la
-- migracion base son a nivel de tabla (select/insert/update/delete a anon y
-- authenticated), no de columna.
-- Ver migrations/20260913181842_create-app-schema.sql.

alter table public.bookings
  add column if not exists airline text,
  add column if not exists flight_number text,
  add column if not exists origin text,
  add column if not exists destination text;
