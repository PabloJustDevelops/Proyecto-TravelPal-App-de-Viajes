import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { ensureUserExists, requireUser } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const auth = await requireUser();
    if (!auth.ok) return auth.response;
    const { supabase, user } = auth;

    const { data, error } = await supabase
      .from("trips")
      .select("*")
      .eq("user_id", user.id)
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
    const auth = await requireUser();
    if (!auth.ok) return auth.response;
    const { supabase, user } = auth;

    // Ensure user exists in public.users to avoid FK constraint errors
    await ensureUserExists(supabase, user);

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
      user_id: user.id,
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
