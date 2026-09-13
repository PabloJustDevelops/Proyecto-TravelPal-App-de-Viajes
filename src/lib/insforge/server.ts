import { createServerClient } from "@insforge/sdk/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { publicEnv } from "@/lib/public-env";

export type ServerInsforgeClient = ReturnType<typeof createServerClient>;

export type ServerUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
};

export async function createServerInsforgeClient(): Promise<ServerInsforgeClient> {
  return createServerClient({
    baseUrl: publicEnv.NEXT_PUBLIC_INSFORGE_URL,
    anonKey: publicEnv.NEXT_PUBLIC_INSFORGE_ANON_KEY,
    cookies: await cookies(),
  });
}

export type RequireUserResult =
  | { ok: true; client: ServerInsforgeClient; user: ServerUser }
  | { ok: false; response: NextResponse };

function unauthorized(): NextResponse {
  return NextResponse.json({ error: "No autorizado" }, { status: 401 });
}

function authVerificationFailed(): NextResponse {
  return NextResponse.json(
    { error: "Error de autenticación" },
    { status: 500 },
  );
}

function normalizeUser(user: {
  id: string;
  email: string;
  metadata: Record<string, unknown> | null;
  profile: { name?: string; avatar_url?: string } | null;
}): ServerUser {
  const metadata: Record<string, unknown> = { ...(user.metadata ?? {}) };

  // El nombre y el avatar viven en `profile`; los exponemos también como
  // `full_name`/`avatar_url` porque es lo que consumen los handlers.
  if (metadata.full_name === undefined && user.profile?.name) {
    metadata.full_name = user.profile.name;
  }
  if (metadata.avatar_url === undefined && user.profile?.avatar_url) {
    metadata.avatar_url = user.profile.avatar_url;
  }

  return { id: user.id, email: user.email, user_metadata: metadata };
}

export async function requireUser(): Promise<RequireUserResult> {
  const client = await createServerInsforgeClient();

  try {
    const { data, error } = await client.auth.getCurrentUser();

    if (error) {
      const status = error.statusCode;
      const authServerFailed =
        status === 0 || (typeof status === "number" && status >= 500);

      if (authServerFailed) {
        logger.error("Server session: auth verification failed", {
          error: error.message,
          status,
        });

        return { ok: false, response: authVerificationFailed() };
      }

      return { ok: false, response: unauthorized() };
    }

    const user = data?.user;

    if (!user?.id) {
      return { ok: false, response: unauthorized() };
    }

    return { ok: true, client, user: normalizeUser(user) };
  } catch (err) {
    logger.error("Server session: auth verification threw", err);

    return { ok: false, response: authVerificationFailed() };
  }
}

export async function ensureUserExists(
  client: ServerInsforgeClient,
  user: ServerUser,
) {
  if (!user?.id) return;

  try {
    const { data, error } = await client.database
      .from("users")
      .select("id")
      .eq("id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      logger.error("Error checking user existence", error);
    }

    if (!data) {
      const { error: insertError } = await client.database.from("users").insert([
        {
          id: user.id,
          email: user.email,
          full_name:
            (user.user_metadata?.full_name as string | undefined) ||
            user.email?.split("@")[0] ||
            "User",
          avatar_url:
            (user.user_metadata?.avatar_url as string | undefined) || null,
          updated_at: new Date().toISOString(),
        },
      ]);

      if (insertError && !insertError.message.includes("duplicate key")) {
        logger.error("Error inserting user into public.users", insertError);
        throw insertError;
      }
    }
  } catch (err) {
    logger.error("Failed to ensure user exists", err);
  }
}
