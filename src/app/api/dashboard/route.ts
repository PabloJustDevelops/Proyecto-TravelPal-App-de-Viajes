import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { requireUser } from "@/lib/insforge/server";

export async function GET(request: Request) {
  try {
    const auth = await requireUser();
    if (!auth.ok) return auth.response;
    const { client, user } = auth;

    const userId = user.id;

    // Parallel fetch for Dashboard data
    const [tripsRes, expensesRes, budgetsRes] = await Promise.all([
      client
        .database.from("trips")
        .select("*")
        .eq("user_id", userId)
        .order("departure_date", { ascending: true }),
      client
        .database.from("expenses")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: false }),
      client
        .database.from("budgets")
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
