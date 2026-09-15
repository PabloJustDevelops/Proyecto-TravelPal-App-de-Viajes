import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const MIGRATIONS_DIR = path.join(process.cwd(), "migrations");

const baseSchema = readFileSync(
  path.join(MIGRATIONS_DIR, "20260913181842_create-app-schema.sql"),
  "utf8",
);

const flightMigrationName = readdirSync(MIGRATIONS_DIR).find((file) =>
  file.endsWith("_add-flight-fields-to-bookings.sql"),
);
if (!flightMigrationName) {
  throw new Error("No se encontro la migracion de campos de vuelo en bookings");
}
const flightMigration = readFileSync(
  path.join(MIGRATIONS_DIR, flightMigrationName),
  "utf8",
);

const FLIGHT_COLUMNS = ["airline", "flight_number", "origin", "destination"];

describe("bookings: RLS y politicas de propietario", () => {
  it("tiene RLS habilitada", () => {
    expect(baseSchema).toMatch(
      /alter table public\.bookings enable row level security;/,
    );
  });

  it("esta en el grupo de tablas con politicas de propietario por user_id", () => {
    expect(baseSchema).toMatch(
      /foreach t in array array\[\s*'trips', 'expenses', 'notes', 'tasks', 'bookings',/,
    );
    expect(baseSchema).toMatch(/auth\.uid\(\) = user_id/);
  });

  it("declara las cuatro politicas (select, insert, update, delete)", () => {
    for (const suffix of [
      "_select_own",
      "_insert_own",
      "_update_own",
      "_delete_own",
    ]) {
      expect(baseSchema).toContain(`t || '${suffix}'`);
    }
  });
});

describe("migracion de campos de vuelo", () => {
  it("anade las columnas de vuelo como texto nullable", () => {
    for (const column of FLIGHT_COLUMNS) {
      expect(flightMigration).toMatch(
        new RegExp(`add column if not exists ${column} text`),
      );
    }
  });

  it("no crea ni borra politicas: las de bookings ya cubren las columnas nuevas", () => {
    expect(flightMigration).not.toMatch(/create policy/i);
    expect(flightMigration).not.toMatch(/drop policy/i);
    expect(flightMigration).not.toMatch(/enable row level security/i);
  });
});
