import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
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
              // Server Component setAll ignore
            }
          },
        },
      },
    );

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 },
      );
    }

    const { data, error } = await supabase
      .from("trips")
      .select("*")
      .eq("user_id", session.user.id)
      .order("departure_date", { ascending: false });

    if (error) {
        logger.error("Trips API: Error fetching trips", error);
        throw error;
    }

    return NextResponse.json(data);

  } catch (error) {
    logger.error("Error in trips API:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
