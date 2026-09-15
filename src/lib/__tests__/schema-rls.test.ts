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

const journalMigrationName = readdirSync(MIGRATIONS_DIR).find((file) =>
  file.endsWith("_create-journal-entries.sql"),
);
if (!journalMigrationName) {
  throw new Error("No se encontro la migracion del diario de viaje");
}
const journalMigration = readFileSync(
  path.join(MIGRATIONS_DIR, journalMigrationName),
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

// El diario de viaje (#46) anade una tabla nueva, y una tabla con user_id sin RLS
// seria una fuga silenciosa. La guardia fija el contrato de propietario y, ademas,
// demuestra su comportamiento para dos usuarios: el predicado de lectura sale de la
// propia migracion, no de este test.
describe("diario de viaje: RLS y aislamiento de dos usuarios", () => {
  function policySql(name: string): string {
    const match = journalMigration.match(
      new RegExp(`create policy ${name}[\\s\\S]*?;`),
    );
    if (!match) {
      throw new Error(`No se encontro la politica ${name} en la migracion`);
    }
    return match[0];
  }

  // Columna de propietario que el backend aplica en la lectura, leida del SQL.
  function ownerColumnOfSelectPolicy(): string {
    const match = policySql("journal_entries_select_own").match(
      /using \(auth\.uid\(\) = (\w+)\)/,
    );
    if (!match) {
      throw new Error("La politica de lectura no usa un predicado de propietario");
    }
    return match[1];
  }

  it("crea la tabla de forma idempotente y con RLS habilitada", () => {
    expect(journalMigration).toMatch(
      /create table if not exists public\.journal_entries/,
    );
    expect(journalMigration).toMatch(
      /alter table public\.journal_entries enable row level security;/,
    );
  });

  it("declara las cuatro politicas de propietario (select, insert, update, delete)", () => {
    for (const suffix of [
      "_select_own",
      "_insert_own",
      "_update_own",
      "_delete_own",
    ]) {
      expect(journalMigration).toContain(`create policy journal_entries${suffix}`);
    }
  });

  it("insert y update llevan with check para que nadie cree filas ajenas", () => {
    expect(policySql("journal_entries_insert_own")).toMatch(
      /with check \(auth\.uid\(\) = user_id\)/,
    );
    expect(policySql("journal_entries_update_own")).toMatch(
      /with check \(auth\.uid\(\) = user_id\)/,
    );
  });

  it("concede los privilegios de tabla que la migracion base no cubre", () => {
    expect(journalMigration).toMatch(
      /grant select, insert, update, delete on public\.journal_entries to anon, authenticated;/,
    );
  });

  it("la lectura aisla a dos usuarios: cada uno solo ve sus propias filas", () => {
    const ownerColumn = ownerColumnOfSelectPolicy();
    const rows: Record<string, string>[] = [
      { id: "a1", user_id: "user-a", content: "el viaje de a" },
      { id: "a2", user_id: "user-a", content: "otra entrada de a" },
      { id: "b1", user_id: "user-b", content: "el viaje de b" },
    ];

    const visibleTo = (viewerId: string) =>
      rows.filter((row) => row[ownerColumn] === viewerId).map((row) => row.id);

    expect(visibleTo("user-a")).toEqual(["a1", "a2"]);
    expect(visibleTo("user-b")).toEqual(["b1"]);
    // La clave del aislamiento: b no ve nada de a.
    expect(visibleTo("user-b")).not.toContain("a1");
  });
});
