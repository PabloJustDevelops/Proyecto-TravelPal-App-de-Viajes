import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { ensureUserExists, requireUser } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const auth = await requireUser();
    if (!auth.ok) return auth.response;
    const { supabase, user } = auth;

    const userId = user.id;

    const [notesRes, tripsRes] = await Promise.all([
      supabase
        .from("notes")
        .select(`*, trip:trips(*)`)
        .eq("user_id", userId)
        .order("updated_at", { ascending: false }),
      supabase
        .from("trips")
        .select("id, title, user_id, origin, destination, departure_date, return_date, status, created_at, updated_at")
        .eq("user_id", userId)
        .order("departure_date", { ascending: false })
    ]);

    if (notesRes.error) {
        logger.error("Notes API: Error fetching notes", notesRes.error);
        throw notesRes.error;
    }
    if (tripsRes.error) {
        logger.error("Notes API: Error fetching trips", tripsRes.error);
        throw tripsRes.error;
    }

    return NextResponse.json({
        notes: notesRes.data || [],
        trips: tripsRes.data || []
    });

  } catch (error) {
    logger.error("Error in notes API:", error);
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

    // Ensure user exists in public.users
    await ensureUserExists(supabase, user);

    const body = await request.json();
    const { 
      title, 
      content, 
      category, 
      trip_id 
    } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios" },
        { status: 400 },
      );
    }

    const newNote = {
      user_id: user.id,
      title,
      content,
      category: category || 'general',
      trip_id: trip_id || null,
      is_favorite: false
    };

    const { data, error } = await supabase
      .from("notes")
      .insert([newNote])
      .select()
      .single();

    if (error) {
      logger.error("Error creating note:", error);
      return NextResponse.json(
        { error: "Error al crear la nota" },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    logger.error("Error in notes POST route:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
