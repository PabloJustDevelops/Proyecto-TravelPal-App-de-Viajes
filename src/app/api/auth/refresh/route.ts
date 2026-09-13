import { createRefreshAuthRouter } from "@insforge/sdk/ssr";

// Ruta de refresco del SDK SSR: rota el refresh token httpOnly y publica el
// nuevo access token en cookie para que los Server Components lo vean.
export const { POST } = createRefreshAuthRouter();
