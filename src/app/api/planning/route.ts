import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { ensureUserExists, requireUser } from "@/lib/insforge/server";

export async function GET(request: Request) {
  try {
    const auth = await requireUser();
    if (!auth.ok) return auth.response;
    const { client, user } = auth;

    const [tripsRes, bookingsRes, activitiesRes] = await Promise.all([
      client
        .database.from("trips")
        .select("*")
        .eq("user_id", user.id)
        .order("departure_date", { ascending: true }),
      client
        .database.from("bookings")
        .select("*")
        .eq("user_id", user.id)
        .order("start_date", { ascending: true }),
      client
        .database.from("itinerary_activities")
        .select("*")
        .eq("user_id", user.id)
    ]);

    if (tripsRes.error) logger.error("Planning API: Trips error", tripsRes.error);
    if (bookingsRes.error) logger.error("Planning API: Bookings error", bookingsRes.error);
    if (activitiesRes.error) logger.error("Planning API: Activities error", activitiesRes.error);

    if (tripsRes.error) throw tripsRes.error;
    if (bookingsRes.error) throw bookingsRes.error;
    if (activitiesRes.error) throw activitiesRes.error;

    return NextResponse.json({
      trips: tripsRes.data || [],
      bookings: bookingsRes.data || [],
      activities: activitiesRes.data || []
    });
  } catch (error) {
    logger.error("Error in planning API:", error);
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
    const { client, user } = auth;

    // Ensure user exists in public.users, although bookings references auth.users directly
    // but maybe trips reference public.users and we need consistency
    await ensureUserExists(client, user);

    const body = await request.json();
    const { 
      trip_id,
      type,
      title,
      description,
      start_date,
      start_time,
      end_date,
      end_time,
      location,
      confirmation_number,
      cost,
      currency,
      status,
      notes
    } = body;

    if (!trip_id || !type || !title || !start_date) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios" },
        { status: 400 },
      );
    }

    const newBooking = {
      user_id: user.id,
      trip_id,
      type,
      title,
      description: description || null,
      start_date,
      start_time: start_time || null,
      end_date: end_date || null,
      end_time: end_time || null,
      location: location || null,
      confirmation_number: confirmation_number || null,
      cost: cost || 0,
      currency: currency || 'EUR',
      status: status || 'pending',
      notes: notes || null
    };

    const { data, error } = await client
      .database.from("bookings")
      .insert([newBooking])
      .select()
      .single();

    if (error) {
      logger.error("Error creating booking:", error);
      return NextResponse.json(
        { error: "Error al crear la reserva" },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    logger.error("Error in planning POST route:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireUser();
    if (!auth.ok) return auth.response;
    const { client, user } = auth;

    const body = await request.json();
    const { 
      id,
      trip_id,
      type,
      title,
      description,
      start_date,
      start_time,
      end_date,
      end_time,
      location,
      confirmation_number,
      cost,
      currency,
      status,
      notes
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID de reserva requerido para actualizar" },
        { status: 400 },
      );
    }

    const updatedBooking = {
      type,
      title,
      description: description || null,
      start_date,
      start_time: start_time || null,
      end_date: end_date || null,
      end_time: end_time || null,
      location: location || null,
      confirmation_number: confirmation_number || null,
      cost: cost || 0,
      currency: currency || 'EUR',
      status: status || 'pending',
      notes: notes || null,
      updated_at: new Date().toISOString()
    };

    // Remove undefined keys
    Object.keys(updatedBooking).forEach(key => 
      (updatedBooking as any)[key] === undefined && delete (updatedBooking as any)[key]
    );

    const { data, error } = await client
      .database.from("bookings")
      .update(updatedBooking)
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user owns the booking
      .select()
      .single();

    if (error) {
      logger.error("Error updating booking:", error);
      return NextResponse.json(
        { error: "Error al actualizar la reserva" },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    logger.error("Error in planning PUT route:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
