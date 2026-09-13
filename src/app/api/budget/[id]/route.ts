import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { requireUser } from "@/lib/insforge/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireUser();
    if (!auth.ok) return auth.response;
    const { client, user } = auth;

    const body = await request.json();
    
    // Prepare update data
    const updateData = {
      name: body.name,
      total_amount: body.total_amount,
      currency: body.currency,
      category: body.category,
      start_date: body.start_date,
      end_date: body.end_date,
      trip_id: body.trip_id || null,
      description: body.description || null,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await client
      .database.from("budgets")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      logger.error("Error updating budget:", error);
      return NextResponse.json(
        { error: "Error al actualizar el presupuesto: " + error.message },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    logger.error("Error in budget PATCH route:", error);
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
    const auth = await requireUser();
    if (!auth.ok) return auth.response;
    const { client, user } = auth;

    const { error } = await client
      .database.from("budgets")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      logger.error("Error deleting budget:", error);
      return NextResponse.json(
        { error: "Error al eliminar el presupuesto: " + error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error in budget DELETE route:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
