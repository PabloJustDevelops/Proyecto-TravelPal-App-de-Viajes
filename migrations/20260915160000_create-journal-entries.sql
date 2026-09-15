-- Diario de viaje: entradas de memoria post-viaje, dentro del detalle del viaje
-- (ver el issue #46). Tabla nueva y RLS de propietario por auth.uid(), como el
-- resto del esquema (ver migrations/20260913181842_create-app-schema.sql).
--
-- Idempotente: se puede aplicar mas de una vez sin romper.

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id uuid not null references public.trips(id) on delete cascade,
  entry_date date not null,
  content text not null,
  rating smallint check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_journal_entries_user_id on public.journal_entries (user_id);
create index if not exists idx_journal_entries_trip_id on public.journal_entries (trip_id);
create index if not exists idx_journal_entries_entry_date on public.journal_entries (entry_date);

-- updated_at automatico (misma funcion built-in que usa el resto del esquema).
drop trigger if exists set_journal_entries_updated_at on public.journal_entries;
create trigger set_journal_entries_updated_at
  before update on public.journal_entries
  for each row execute function system.update_updated_at();

-- RLS de propietario: las cuatro politicas de siempre, por fila.
alter table public.journal_entries enable row level security;

drop policy if exists journal_entries_select_own on public.journal_entries;
create policy journal_entries_select_own on public.journal_entries
  for select using (auth.uid() = user_id);

drop policy if exists journal_entries_insert_own on public.journal_entries;
create policy journal_entries_insert_own on public.journal_entries
  for insert with check (auth.uid() = user_id);

drop policy if exists journal_entries_update_own on public.journal_entries;
create policy journal_entries_update_own on public.journal_entries
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists journal_entries_delete_own on public.journal_entries;
create policy journal_entries_delete_own on public.journal_entries
  for delete using (auth.uid() = user_id);

-- La migracion base concedio privilegios solo a las tablas que existian entonces,
-- asi que una tabla nueva necesita su grant explicito. RLS decide las filas.
grant select, insert, update, delete on public.journal_entries to anon, authenticated;
