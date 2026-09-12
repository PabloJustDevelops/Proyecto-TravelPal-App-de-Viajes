import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { requireUser } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const auth = await requireUser();
    if (!auth.ok) return auth.response;
    const { supabase, user } = auth;

    const userId = user.id;
    const { searchParams } = new URL(request.url);
    const dateRange = searchParams.get('range') || 'all';

    // Compute start date based on dateRange
    let startISO: string | null = null;
    if (dateRange !== "all") {
        const days = parseInt(dateRange, 10);
        if (!isNaN(days)) {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - (days - 1));
        startISO = d.toISOString();
        }
    }

    // Load trips
    let tripsQuery = supabase
        .from("trips")
        .select(
        "id, user_id, title, origin, destination, departure_date, return_date, airline, flight_number, status, notes, created_at, updated_at",
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

    if (startISO) {
        tripsQuery = tripsQuery.gte("departure_date", startISO);
    }

    // Load expenses
    let expensesQuery = supabase
        .from("expenses")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: false });

    if (startISO) {
        expensesQuery = expensesQuery.gte("date", startISO);
    }

    // Load budgets (no date range filter usually, or maybe created_at?)
    // Keeping consistent with original page logic: no date filter on budgets query shown in page.tsx
    const budgetsQuery = supabase
        .from("budgets")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

    const [tripsRes, expensesRes, budgetsRes] = await Promise.all([
        tripsQuery,
        expensesQuery,
        budgetsQuery
    ]);

    if (tripsRes.error) logger.error("Analytics API: Trips error", tripsRes.error);
    if (expensesRes.error) logger.error("Analytics API: Expenses error", expensesRes.error);
    if (budgetsRes.error) logger.error("Analytics API: Budgets error", budgetsRes.error);

    if (tripsRes.error) throw tripsRes.error;
    if (expensesRes.error) throw expensesRes.error;
    if (budgetsRes.error) throw budgetsRes.error;

    return NextResponse.json({
        trips: tripsRes.data || [],
        expenses: expensesRes.data || [],
        budgets: budgetsRes.data || []
    });

  } catch (error) {
    logger.error("Error in analytics API:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
