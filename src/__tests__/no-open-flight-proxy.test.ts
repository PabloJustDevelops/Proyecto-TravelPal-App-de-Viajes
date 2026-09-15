import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const SRC = path.join(process.cwd(), "src");
const THIS_FILE = path.resolve(__filename);

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const sourceFiles = walk(SRC).filter(
  (file) => file !== THIS_FILE && /\.(ts|tsx|js|jsx)$/.test(file),
);

describe("proxy de vuelos retirado", () => {
  it("no vuelve a existir la ruta /api/flights", () => {
    expect(existsSync(path.join(SRC, "app", "api", "flights"))).toBe(false);
  });

  it("no queda el cliente retirado de Amadeus ni su servicio", () => {
    expect(existsSync(path.join(SRC, "lib", "amadeus.ts"))).toBe(false);
    expect(existsSync(path.join(SRC, "lib", "flightService.ts"))).toBe(false);
  });

  it("ningun fichero de src importa el cliente retirado ni llama a /api/flights", () => {
    const offenders = sourceFiles.filter((file) => {
      const content = readFileSync(file, "utf8");
      return (
        /@\/lib\/amadeus|@\/lib\/flightService/.test(content) ||
        /\/api\/flights/.test(content) ||
        /AMADEUS_/.test(content)
      );
    });

    expect(offenders.map((file) => path.relative(process.cwd(), file))).toEqual(
      [],
    );
  });
});
