import { NextResponse } from "next/server";
import { createLLMService, LLMMessage } from "@/lib/llmService";
import { logger } from "@/lib/logger";
import { requireUser } from "@/lib/insforge/server";

export async function POST(request: Request) {
  try {
    // 1. Auth check
    const auth = await requireUser();
    if (!auth.ok) return auth.response;

    // 2. Parse body
    const body = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Formato de mensajes inválido o lista vacía" },
        { status: 400 },
      );
    }

    // Validar contenido de mensajes
    const isValid = messages.every(
      (msg: any) =>
        typeof msg === "object" &&
        typeof msg.content === "string" &&
        msg.content.trim().length > 0 &&
        ["user", "assistant", "system"].includes(msg.role),
    );

    if (!isValid) {
      return NextResponse.json(
        { error: "Mensajes inválidos: contenido vacío o rol incorrecto" },
        { status: 400 },
      );
    }

    // 3. Call LLM
    const llmService = createLLMService();

    if (!llmService) {
      return NextResponse.json(
        {
          error: "El servicio de IA no está configurado en el servidor.",
        },
        { status: 503 },
      );
    }

    const response = await llmService.sendMessage(messages as LLMMessage[]);

    if (response.error) {
      return NextResponse.json({ error: response.error }, { status: 500 });
    }

    return NextResponse.json({ content: response.content });
  } catch (error) {
    logger.error("Error in chat route:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
