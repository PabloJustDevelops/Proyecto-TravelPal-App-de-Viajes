import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const SRC = path.join(process.cwd(), "src");
const THIS_FILE = path.resolve(__filename);

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const allFiles = walk(SRC).filter((file) => file !== THIS_FILE);

const sourceFiles = allFiles.filter((file) => /\.(ts|tsx|js|jsx)$/.test(file));

// Ruta relativa con separadores POSIX para que el mismo assert valga en Windows y en la CI.
const relative = (file: string) =>
  path.relative(process.cwd(), file).split(path.sep).join("/");

describe("sistema de diseno: un solo spinner", () => {
  it("existe un unico fichero LoadingSpinner y vive en components/ui", () => {
    const spinners = allFiles
      .filter((file) => path.basename(file) === "LoadingSpinner.tsx")
      .map(relative);

    expect(spinners).toEqual(["src/components/ui/LoadingSpinner.tsx"]);
  });

  it("nadie importa el spinner retirado de components/common", () => {
    const offenders = sourceFiles
      .filter((file) => /common\/LoadingSpinner/.test(readFileSync(file, "utf8")))
      .map(relative);

    expect(offenders).toEqual([]);
  });

  it("la animacion de giro solo se declara dentro del componente del spinner", () => {
    const offenders = sourceFiles
      .filter((file) => /animate-spin/.test(readFileSync(file, "utf8")))
      .map(relative);

    expect(offenders).toEqual(["src/components/ui/LoadingSpinner.tsx"]);
  });
});
