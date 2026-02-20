import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
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
      .from("expenses")
      .select("*")
      .eq("id", id)
      .eq("user_id", session.user.id)
      .single();

    if (error) {
      logger.error("Error fetching expense:", error);
      return NextResponse.json(
        { error: "Gasto no encontrado o error al cargar" },
        { status: 404 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    logger.error("Error in expenses GET route:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
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

    const body = await request.json();
    console.log('Recibida petición PUT en /api/expenses/[id] con body:', body);

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

    const updateData = {
      title: description, // Mapped from frontend description
      amount,
      currency: currency || 'EUR',
      category: category || 'other',
      date,
      trip_id: trip_id || null,
      description: notes || null, // Mapping frontend 'notes' to 'description'
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from("expenses")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", session.user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating expense (DB):", error);
      logger.error("Error updating expense:", error);
      return NextResponse.json(
        { error: `Error al actualizar el gasto: ${error.message}` },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in expenses PUT route:", error);
    logger.error("Error in expenses PUT route:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
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

    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", id)
      .eq("user_id", session.user.id);

    if (error) {
      logger.error("Error deleting expense:", error);
      return NextResponse.json(
        { error: "Error al eliminar el gasto" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error in expenses DELETE route:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}