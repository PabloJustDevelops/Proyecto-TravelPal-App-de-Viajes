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

    // Parallel fetch for Dashboard data
    const [tripsRes, expensesRes, budgetsRes] = await Promise.all([
      supabase
        .from("trips")
        .select("*")
        .eq("user_id", userId)
        .order("departure_date", { ascending: true }),
      supabase
        .from("expenses")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: false }),
      supabase
        .from("budgets")
        .select("total_amount")
        .eq("user_id", userId)
    ]);

    if (tripsRes.error) logger.error("Dashboard API: Trips error", tripsRes.error);
    if (expensesRes.error) logger.error("Dashboard API: Expenses error", expensesRes.error);
    if (budgetsRes.error) logger.error("Dashboard API: Budgets error", budgetsRes.error);

    return NextResponse.json({
      trips: tripsRes.data || [],
      expenses: expensesRes.data || [],
      budgets: budgetsRes.data || [],
    });

  } catch (error) {
    logger.error("Error in dashboard API:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
