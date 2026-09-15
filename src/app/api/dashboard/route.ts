import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { requireUser } from "@/lib/insforge/server";

export async function GET(request: Request) {
  try {
    const auth = await requireUser();
    if (!auth.ok) return auth.response;
    const { client, user } = auth;

    const userId = user.id;
    const { searchParams } = new URL(request.url);
    const dateRange = searchParams.get("range") || "all";

    // El rango solo acota los viajes (por fecha de salida) y los gastos (por fecha).
    // Los presupuestos no tienen fecha de referencia util para el panel.
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

    let tripsQuery = client
      .database.from("trips")
      .select("*")
      .eq("user_id", userId)
      .order("departure_date", { ascending: true });

    if (startISO) {
      tripsQuery = tripsQuery.gte("departure_date", startISO);
    }

    let expensesQuery = client
      .database.from("expenses")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false });

    if (startISO) {
      expensesQuery = expensesQuery.gte("date", startISO);
    }

    const budgetsQuery = client
      .database.from("budgets")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    const [tripsRes, expensesRes, budgetsRes] = await Promise.all([
      tripsQuery,
      expensesQuery,
      budgetsQuery,
    ]);

    if (tripsRes.error) logger.error("Dashboard API: Trips error", tripsRes.error);
    if (expensesRes.error)
      logger.error("Dashboard API: Expenses error", expensesRes.error);
    if (budgetsRes.error)
      logger.error("Dashboard API: Budgets error", budgetsRes.error);

    if (tripsRes.error) throw tripsRes.error;
    if (expensesRes.error) throw expensesRes.error;
    if (budgetsRes.error) throw budgetsRes.error;

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
