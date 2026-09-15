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

describe("sistema de diseno: una sola clase de campo", () => {
  it("la clase canonica de los campos solo se declara en fieldStyles", () => {
    const offenders = sourceFiles
      .filter((file) =>
        /focus:ring-blue-500 focus:border-blue-500/.test(
          readFileSync(file, "utf8"),
        ),
      )
      .map(relative);

    expect(offenders).toEqual(["src/components/ui/fieldStyles.ts"]);
  });

  it("el componente Input se apoya en la clase compartida", () => {
    const input = readFileSync(
      path.join(SRC, "components", "ui", "Input.tsx"),
      "utf8",
    );

    expect(input).toContain("fieldClassName");
  });
});

describe("sistema de diseno: un solo boton primario", () => {
  it("la combinacion de color del primario solo se declara en Button", () => {
    const offenders = sourceFiles
      .filter((file) =>
        readFileSync(file, "utf8")
          .split("\n")
          .some(
            (line) =>
              line.includes("bg-blue-600") && line.includes("hover:bg-blue-700"),
          ),
      )
      .map(relative);

    expect(offenders).toEqual(["src/components/ui/Button.tsx"]);
  });

  // Un <button> nativo sigue siendo lo correcto cuando el control no es un boton del sistema:
  // controles de icono con geometria propia, controles segmentados, elementos que una libreria
  // de terceros clona (Menu.Item de headlessui) o disparadores de un input oculto. La lista es
  // explicita para que no pueda crecer sin que alguien lo revise.
  const NATIVE_BUTTON_FILES = [
    "src/app/analytics/page.tsx",
    "src/app/planning/page.tsx",
    "src/app/profile/page.tsx",
    "src/app/settings/page.tsx",
    "src/app/tasks/page.tsx",
    "src/components/alerts/AlertCard.tsx",
    "src/components/auth/ForgotPasswordForm.tsx",
    "src/components/auth/LoginForm.tsx",
    "src/components/auth/RegisterForm.tsx",
    "src/components/auth/ResetPasswordForm.tsx",
    "src/components/budget/BudgetCard.tsx",
    "src/components/calendar/Calendar.tsx",
    "src/components/chatbot/ChatbotWindow.tsx",
    "src/components/landing/Navbar.tsx",
    "src/components/layout/Navbar.tsx",
    "src/components/notifications/NotificationSystem.tsx",
    "src/components/ui/Button.tsx",
    "src/components/ui/Toast.tsx",
  ];

  it("los botones nativos que quedan estan en una lista explicita y justificada", () => {
    const withNativeButton = sourceFiles
      .filter((file) => /<button/.test(readFileSync(file, "utf8")))
      .map(relative)
      .sort();

    expect(withNativeButton).toEqual([...NATIVE_BUTTON_FILES].sort());
  });
});

describe("sistema de diseno: un solo sistema de iconos", () => {
  it("nadie importa la segunda libreria de iconos", () => {
    const offenders = sourceFiles
      .filter((file) => /from ['"]lucide-react['"]/.test(readFileSync(file, "utf8")))
      .map(relative);

    expect(offenders).toEqual([]);
  });

  // Unico resto permitido: el prefijo de un mensaje de error por consola en la validacion de
  // entorno del servidor. No es un icono de interfaz.
  const EMOJI_ALLOWLIST = ["src/lib/public-env.ts"];

  it("no quedan emoji haciendo de icono", () => {
    const emoji =
      /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u;

    const offenders = sourceFiles
      .filter((file) => emoji.test(readFileSync(file, "utf8")))
      .map(relative);

    expect(offenders).toEqual(EMOJI_ALLOWLIST);
  });
});

describe("sistema de diseno: movimiento y tipografia", () => {
  const css = readFileSync(path.join(SRC, "app", "globals.css"), "utf8");
  const layout = readFileSync(path.join(SRC, "app", "layout.tsx"), "utf8");

  it("no queda una transicion global a 300ms", () => {
    expect(css).not.toMatch(/transition-duration:\s*300ms/);
    expect(css).not.toMatch(/transition-property:/);
  });

  it("la preferencia de movimiento reducido del sistema se respeta", () => {
    expect(css).toContain("prefers-reduced-motion");
  });

  it("la tipografia se declara en un unico sitio", () => {
    // globals.css no impone familia: la define next/font en layout.tsx.
    expect(css).not.toContain("font-family");
    expect(layout.match(/next\/font\/google/g) ?? []).toHaveLength(1);
    expect(layout).toContain("inter.className");
  });
});
