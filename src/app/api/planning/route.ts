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

    const [tripsRes, bookingsRes, activitiesRes] = await Promise.all([
      supabase
        .from("trips")
        .select("*")
        .eq("user_id", userId)
        .order("departure_date", { ascending: true }),
      supabase
        .from("bookings")
        .select("*")
        .eq("user_id", userId)
        .order("start_date", { ascending: true }),
      supabase
        .from("itinerary_activities")
        .select("*")
        .eq("user_id", userId)
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
