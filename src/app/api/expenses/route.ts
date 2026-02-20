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

    // Ensure user exists in public.users
    await ensureUserExists(supabase, session.user);

    const body = await request.json();
    console.log('Recibida petición POST en /api/expenses con body:', body);
    
    const { 
      description, 
      amount, 
      currency, 
      category, 
      date, 
      trip_id, 
      notes 
    } = body;

    if (!description || !amount || !date) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios" },
        { status: 400 },
      );
    }

    // Verify payload against schema
    // Table 'expenses' columns: 
    // id, user_id, trip_id, title (NOT description), amount, currency, category, date, description (optional), receipt_url
    
    // Mapping frontend 'description' to 'title' as 'title' is NOT NULL in schema
    // and 'description' is optional text
    
    const newExpense = {
      user_id: session.user.id,
      title: description, // Mapped from frontend description
      amount,
      currency: currency || 'EUR',
      category: category || 'other',
      date,
      trip_id: trip_id || null,
      description: notes || null // Mapping frontend 'notes' to 'description'
    };

    logger.debug("Creating expense with payload:", newExpense);

    const { data, error } = await supabase
      .from("expenses")
      .insert([newExpense])
      .select()
      .single();

    if (error) {
      console.error("Error creating expense (DB):", error);
      logger.error("Error creating expense:", error);
      return NextResponse.json(
        { error: `Error al crear el gasto: ${error.message}` },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in expenses POST route (Catch):", error);
    logger.error("Error in expenses POST route:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
