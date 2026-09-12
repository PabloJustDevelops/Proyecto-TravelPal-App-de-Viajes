import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export type ServerSupabaseClient = ReturnType<typeof createServerClient>;

export type ServerUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
};

export async function createServerSupabaseClient(): Promise<ServerSupabaseClient> {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Components cannot write cookies; safe to ignore.
          }
        },
      },
    },
  );
}

export type RequireUserResult =
  | { ok: true; supabase: ServerSupabaseClient; user: ServerUser }
  | { ok: false; response: NextResponse };

export async function requireUser(): Promise<RequireUserResult> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase.auth.getClaims();

  if (error) {
    const status = error.status;
    const authServerFailed =
      status === 0 || (typeof status === "number" && status >= 500);

    if (authServerFailed) {
      logger.error("Server session: auth verification failed", {
        error: error.message,
        status,
      });

      return {
        ok: false,
        response: NextResponse.json(
          { error: "Error de autenticación" },
          { status: 500 },
        ),
      };
    }

    return {
      ok: false,
      response: NextResponse.json({ error: "No autorizado" }, { status: 401 }),
    };
  }

  const claims = data?.claims;

  if (!claims?.sub) {
    return {
      ok: false,
      response: NextResponse.json({ error: "No autorizado" }, { status: 401 }),
    };
  }

  const email = typeof claims.email === "string" ? claims.email : undefined;
  const metadata = claims.user_metadata;

  return {
    ok: true,
    supabase,
    user: {
      id: claims.sub,
      email,
      user_metadata:
        metadata && typeof metadata === "object"
          ? (metadata as Record<string, unknown>)
          : undefined,
    },
  };
}

export async function ensureUserExists(
  supabase: ServerSupabaseClient,
  user: ServerUser,
) {
  if (!user?.id) return;

  try {
    const { data, error } = await supabase
      .from("users")
      .select("id")
      .eq("id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      logger.error("Error checking user existence", error);
    }

    if (!data) {
      const { error: insertError } = await supabase.from("users").insert([
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
