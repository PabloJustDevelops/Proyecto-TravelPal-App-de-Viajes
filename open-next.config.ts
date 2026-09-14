import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Configuración mínima del adaptador. No se habilita caché en R2 por ahora:
// se añadirá al configurar la cuenta de Cloudflare y su bucket.
export default defineCloudflareConfig({});
