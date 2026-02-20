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

    // Ensure user exists in public.users to avoid FK constraint errors
    await ensureUserExists(supabase, session.user);

    const body = await request.json();
    const { 
      title, 
      origin, 
      destination, 
      departure_date, 
      return_date,
      airline,
      flight_number,
      confirmation_number,
      notes,
      status
    } = body;

    if (!title || !origin || !destination || !departure_date) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios" },
        { status: 400 },
      );
    }

    const newTrip = {
      user_id: session.user.id,
      title,
      origin,
      destination,
      departure_date,
      return_date: return_date || null,
      airline: airline || null,
      flight_number: flight_number || null,
      confirmation_number: confirmation_number || null,
      notes: notes || null,
      status: status || "planned",
    };

    const { data, error } = await supabase
      .from("trips")
      .insert([newTrip])
      .select()
      .single();

    if (error) {
      logger.error("Error creating trip:", error);
      return NextResponse.json(
        { error: "Error al crear el viaje" },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    logger.error("Error in trips POST route:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
