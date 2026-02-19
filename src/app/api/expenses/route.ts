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

    const userId = session.user.id;

    const [expensesRes, tripsRes] = await Promise.all([
      supabase
        .from("expenses")
        .select(`*, trip:trips(*)`)
        .eq("user_id", userId)
        .order("date", { ascending: false }),
      supabase
        .from("trips")
        .select("id, title, user_id, origin, destination, departure_date, return_date, status, created_at, updated_at")
        .eq("user_id", userId)
        .order("departure_date", { ascending: false })
    ]);

    if (expensesRes.error) {
        logger.error("Expenses API: Error fetching expenses", expensesRes.error);
        throw expensesRes.error;
    }
    if (tripsRes.error) {
        logger.error("Expenses API: Error fetching trips", tripsRes.error);
        throw tripsRes.error;
    }

    return NextResponse.json({
        expenses: expensesRes.data || [],
        trips: tripsRes.data || []
    });

  } catch (error) {
    logger.error("Error in expenses API:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
