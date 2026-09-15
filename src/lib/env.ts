import { z } from "zod";
import { optionalNonEmpty, parseEnv, publicEnvSchema } from "./public-env";

// Módulo de uso exclusivo en servidor: además de las variables públicas,
// valida los secretos (p. ej. INSFORGE_API_KEY), que Next.js nunca
// inyecta en el bundle del cliente. No importar desde componentes de cliente.
//
// La validación se ejecuta al importar el módulo, de modo que el build y el
// arranque fallan con un mensaje claro si falta alguna variable obligatoria.

export const serverEnvSchema = publicEnvSchema.extend({
  INSFORGE_API_KEY: z
    .string({ error: "es obligatoria (sólo servidor, nunca exponerla al cliente)" })
    .min(1, "no puede estar vacía"),

  OPENROUTER_API_KEY: optionalNonEmpty,
  GROQ_API_KEY: optionalNonEmpty,
  OPENROUTER_MODEL: optionalNonEmpty,
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function parseServerEnv(
  source: Record<string, string | undefined>,
): ServerEnv {
  return parseEnv(serverEnvSchema, source);
}

export const serverEnv: ServerEnv = parseServerEnv(process.env);
