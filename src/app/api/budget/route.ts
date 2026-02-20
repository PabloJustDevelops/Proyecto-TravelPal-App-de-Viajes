import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { ensureUserExists } from "@/lib/supabase";

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

    // Load budgets
    const budgetsQuery = supabase
        .from("budgets")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

    // Load trips
    const tripsQuery = supabase
        .from("trips")
        .select(
        "id, title, user_id, origin, destination, departure_date, return_date, status, created_at, updated_at",
        )
        .eq("user_id", userId)
        .order("title");

    // Load expenses for calculations
    const expensesQuery = supabase
        .from("expenses")
        .select(
        "id, user_id, title, amount, currency, category, date, trip_id, description, receipt_url, created_at, updated_at",
        )
        .eq("user_id", userId);

    const [budgetsRes, tripsRes, expensesRes] = await Promise.all([
        budgetsQuery,
        tripsQuery,
        expensesQuery
    ]);

    if (budgetsRes.error) logger.error("Budget API: Budgets error", budgetsRes.error);
    if (tripsRes.error) logger.error("Budget API: Trips error", tripsRes.error);
    if (expensesRes.error) logger.error("Budget API: Expenses error", expensesRes.error);

    if (budgetsRes.error) throw budgetsRes.error;
    if (tripsRes.error) throw tripsRes.error;
    if (expensesRes.error) throw expensesRes.error;

    return NextResponse.json({
        budgets: budgetsRes.data || [],
        trips: tripsRes.data || [],
        expenses: expensesRes.data || []
    });

  } catch (error) {
    logger.error("Error in budget API:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
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
        { error: "No autorizado. Por favor inicia sesión." },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { 
      name, 
      total_amount, 
      currency, 
      category, 
      start_date, 
      end_date,
      trip_id,
      description
    } = body;

    if (!name || !total_amount || !category || !start_date || !end_date) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios" },
        { status: 400 },
      );
    }

    // Ensure user exists in public.users to avoid FK constraint error
    await ensureUserExists(supabase, session.user);

    const newBudget = {
      user_id: session.user.id,
      name,
      total_amount,
      currency: currency || 'USD',
      category,
      start_date,
      end_date,
      trip_id: trip_id || null,
      description: description || null
    };

    const { data, error } = await supabase
      .from("budgets")
      .insert([newBudget])
      .select()
      .single();

    if (error) {
      logger.error("Error creating budget:", error);
      return NextResponse.json(
        { error: "Error al crear el presupuesto: " + error.message },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    logger.error("Error in budget POST route:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
