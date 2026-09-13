import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { requireUser } from "@/lib/insforge/server";

export async function GET(request: Request) {
  try {
    const auth = await requireUser();
    if (!auth.ok) return auth.response;
    const { client, user } = auth;

    const { data, error } = await client
      .database.from("tasks")
      .select("*")
      .eq("user_id", user.id)
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
    const auth = await requireUser();
    if (!auth.ok) return auth.response;
    const { client, user } = auth;

    const body = await request.json();
    const { title, description, status, priority, due_date } = body;

    if (!title) {
      return NextResponse.json(
        { error: "El título es obligatorio" },
        { status: 400 },
      );
    }

    const newTask = {
      user_id: user.id,
      title,
      description,
      status: status || "pending",
      priority: priority || "medium",
      due_date: due_date || null,
    };

    const { data, error } = await client
      .database.from("tasks")
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
