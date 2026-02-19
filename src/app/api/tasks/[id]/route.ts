import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
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
    
    // Validar que el usuario sea el propietario de la tarea
    // (RLS ya lo hace, pero es buena práctica verificar antes de intentar update)
    const { data: existingTask, error: fetchError } = await supabase
      .from("tasks")
      .select("user_id")
      .eq("id", id)
      .single();

    if (fetchError || !existingTask) {
       return NextResponse.json(
        { error: "Tarea no encontrada" },
        { status: 404 },
      );
    }
    
    if (existingTask.user_id !== session.user.id) {
       return NextResponse.json(
        { error: "No tienes permiso para editar esta tarea" },
        { status: 403 },
      );
    }

    const { error } = await supabase
      .from("tasks")
      .update(body)
      .eq("id", id)
      .eq("user_id", session.user.id);

    if (error) {
      logger.error("Error updating task:", error);
      return NextResponse.json(
        { error: "Error al actualizar la tarea" },
        { status: 500 },
      );
    }

    return NextResponse.json({ message: "Tarea actualizada correctamente" });
  } catch (error) {
    logger.error("Error in tasks PUT route:", error);
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
    const { id } = await params;
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
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
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

    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", id)
      .eq("user_id", session.user.id);

    if (error) {
      logger.error("Error deleting task:", error);
      return NextResponse.json(
        { error: "Error al eliminar la tarea" },
        { status: 500 },
      );
    }

    return NextResponse.json({ message: "Tarea eliminada correctamente" });
  } catch (error) {
    logger.error("Error in tasks DELETE route:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
