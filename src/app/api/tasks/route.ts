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

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Error fetching tasks:", error);
      return NextResponse.json(
        { error: "Error al obtener las tareas" },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    logger.error("Error in tasks GET route:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
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
    const { title, description, status, priority, due_date } = body;

    if (!title) {
      return NextResponse.json(
        { error: "El título es obligatorio" },
        { status: 400 },
      );
    }

    const newTask = {
      user_id: session.user.id,
      title,
      description,
      status: status || "pending",
      priority: priority || "medium",
      due_date: due_date || null,
    };

    const { data, error } = await supabase
      .from("tasks")
      .insert([newTask])
      .select()
      .single();

    if (error) {
      logger.error("Error creating task:", error);
      return NextResponse.json(
        { error: "Error al crear la tarea" },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    logger.error("Error in tasks POST route:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
