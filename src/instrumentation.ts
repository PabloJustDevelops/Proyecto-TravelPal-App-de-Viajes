export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Importar el módulo dispara la validación estricta del entorno de servidor.
    await import("./lib/env");
  }
}
