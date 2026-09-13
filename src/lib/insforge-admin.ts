// Archivo de uso exclusivo en servidor: crea cliente InsForge con API key
// de proyecto (createAdminClient), equivalente al service role.
import { createAdminClient } from "@insforge/sdk";
import { publicEnv } from "./public-env";
import { serverEnv } from "./env";

export function getInsforgeAdmin() {
  if (typeof window !== "undefined") {
    throw new Error("InsForge admin no disponible en cliente: uso sólo servidor");
  }

  return createAdminClient({
    baseUrl: publicEnv.NEXT_PUBLIC_INSFORGE_URL,
    apiKey: serverEnv.INSFORGE_API_KEY,
  });
}
