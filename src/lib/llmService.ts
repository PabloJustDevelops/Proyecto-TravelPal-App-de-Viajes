import { logger } from "./logger";
import { serverEnv } from "./env";
import { publicEnv } from "./public-env";

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMResponse {
  content: string;
  error?: string;
}

export interface LLMConfig {
  provider: "openrouter";
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}

interface OpenRouterAPIResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
    type?: string;
    code?: string | number;
  };
}

interface OpenRouterAPIError {
  error?: {
    message?: string;
    type?: string;
    code?: string | number;
  };
}

const SYSTEM_PROMPT = `Eres un asistente útil y amigable para una aplicación de gestión de viajes. 
Tu nombre es "ViajeBot" y ayudas a los usuarios con:
- Planificación de viajes
- Gestión de gastos y presupuestos
- Notas y recordatorios
- Análisis de viajes
- Información general sobre la aplicación

Responde siempre en español de manera clara y concisa. 
Si no entiendes la pregunta, sugiere al usuario que reformule o pregunte algo más específico.
Mantén un tono profesional pero cercano y amigable.`;

const DEFAULT_CONFIG = {
  temperature: 0.7,
  maxTokens: 1000,
  timeout: 30000,
  maxRetries: 3,
  retryDelay: 1000,
} as const;

const VALIDATION_RULES = {
  apiKeyMinLength: 20,
  temperatureMin: 0,
  temperatureMax: 2,
  maxTokensMin: 1,
  maxTokensMax: 128000,
  timeoutMin: 1000,
  timeoutMax: 120000,
} as const;

class LLMValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LLMValidationError";
  }
}

class LLMFatalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LLMFatalError";
  }
}

export class LLMService {
  private config: LLMConfig;
  private maxRetries: number;
  private retryDelay: number;

  constructor(config: LLMConfig) {
    this.config = this.validateConfig(config);
    this.maxRetries = DEFAULT_CONFIG.maxRetries;
    this.retryDelay = DEFAULT_CONFIG.retryDelay;
  }

  private validateConfig(config: LLMConfig): LLMConfig {
    if (
      !config.apiKey ||
      config.apiKey.trim().length < VALIDATION_RULES.apiKeyMinLength
    ) {
      throw new LLMValidationError(
        `API Key inválida. Debe tener al menos ${VALIDATION_RULES.apiKeyMinLength} caracteres.`,
      );
    }

    if (!config.model || config.model.trim().length === 0) {
      throw new LLMValidationError("El modelo no puede estar vacío.");
    }

    if (config.provider !== "openrouter") {
      throw new LLMValidationError(
        "Solo se soporta el proveedor 'openrouter'.",
      );
    }

    const temperature = config.temperature ?? DEFAULT_CONFIG.temperature;
    if (
      temperature < VALIDATION_RULES.temperatureMin ||
      temperature > VALIDATION_RULES.temperatureMax
    ) {
      throw new LLMValidationError(
        `Temperature debe estar entre ${VALIDATION_RULES.temperatureMin} y ${VALIDATION_RULES.temperatureMax}.`,
      );
    }

    const maxTokens = config.maxTokens ?? DEFAULT_CONFIG.maxTokens;
    if (
      maxTokens < VALIDATION_RULES.maxTokensMin ||
      maxTokens > VALIDATION_RULES.maxTokensMax
    ) {
      throw new LLMValidationError(
        `maxTokens debe estar entre ${VALIDATION_RULES.maxTokensMin} y ${VALIDATION_RULES.maxTokensMax}.`,
      );
    }

    const timeout = config.timeout ?? DEFAULT_CONFIG.timeout;
    if (
      timeout < VALIDATION_RULES.timeoutMin ||
      timeout > VALIDATION_RULES.timeoutMax
    ) {
      throw new LLMValidationError(
        `timeout debe estar entre ${VALIDATION_RULES.timeoutMin} y ${VALIDATION_RULES.timeoutMax}ms.`,
      );
    }

    return {
      ...config,
      temperature,
      maxTokens,
      timeout,
    };
  }

  private validateMessages(messages: LLMMessage[]): void {
    if (!Array.isArray(messages)) {
      throw new LLMValidationError("Los mensajes deben ser un array.");
    }

    if (messages.length === 0) {
      throw new LLMValidationError("Debe proporcionar al menos un mensaje.");
    }

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (!msg || typeof msg !== "object") {
        throw new LLMValidationError(
          `Mensaje en índice ${i} debe ser un objeto.`,
        );
      }

      if (!["system", "user", "assistant"].includes(msg.role)) {
        throw new LLMValidationError(
          `Mensaje en índice ${i} tiene role inválido: ${msg.role}.`,
        );
      }

      if (
        !msg.content ||
        typeof msg.content !== "string" ||
        msg.content.trim().length === 0
      ) {
        throw new LLMValidationError(
          `Mensaje en índice ${i} debe tener contenido no vacío.`,
        );
      }
    }
  }

  async sendMessage(messages: LLMMessage[]): Promise<LLMResponse> {
    try {
      this.validateMessages(messages);
    } catch (error) {
      return {
        content: "",
        error:
          error instanceof Error
            ? error.message
            : "Error de validación de mensajes.",
      };
    }

    const requestId = this.generateRequestId();
    return this.sendMessageWithRetry(messages, requestId, 0);
  }

  private async sendMessageWithRetry(
    messages: LLMMessage[],
    requestId: string,
    retryCount: number,
  ): Promise<LLMResponse> {
    try {
      const response = await this.callOpenRouterWithTimeout(
        messages,
        requestId,
      );
      return response;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";

      if (retryCount < this.maxRetries && !(error instanceof LLMFatalError)) {
        const delay = this.retryDelay * Math.pow(2, retryCount);
        logger.warn(
          `Reintentando en ${delay}ms (intento ${retryCount + 1}/${this.maxRetries}): ${errorMessage}`,
        );
        await this.sleep(delay);
        return this.sendMessageWithRetry(messages, requestId, retryCount + 1);
      }

      logger.error(
        "Error en LLMService después de todos los reintentos:",
        errorMessage,
      );
      return {
        content: "",
        error: errorMessage,
      };
    }
  }

  private async callOpenRouterWithTimeout(
    messages: LLMMessage[],
    requestId: string,
  ): Promise<LLMResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, this.config.timeout);

    try {
      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.config.apiKey}`,
            "HTTP-Referer":
              typeof window !== "undefined"
                ? window.location.origin
                : publicEnv.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
            "X-Title": "App Viajes",
          },
          body: JSON.stringify({
            model: this.config.model,
            messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
            temperature: this.config.temperature,
            max_tokens: this.config.maxTokens,
          }),
          signal: controller.signal,
        },
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await this.parseErrorResponse(response);
        const errorMessage =
          errorData?.error?.message ||
          `Error HTTP ${response.status}: ${response.statusText}`;

        logger.error("Error en respuesta de OpenRouter:", {
          status: response.status,
          errorData,
        });

        if (response.status === 404) {
          throw new LLMFatalError(
            `Modelo no encontrado o URL inválida: ${errorMessage}`,
          );
        }

        if (response.status === 401) {
          throw new LLMFatalError(
            `API Key inválida o no autorizada: ${errorMessage}`,
          );
        }

        if (response.status === 400) {
          throw new LLMFatalError(
            `Petición inválida (Bad Request): ${errorMessage}`,
          );
        }

        if (response.status === 429) {
          throw new Error(
            `Rate limit excedido o crédito insuficiente. ${errorMessage}`,
          );
        }

        if (response.status === 402) {
          throw new LLMFatalError(
            `Crédito insuficiente en OpenRouter. ${errorMessage}`,
          );
        }

        throw new Error(errorMessage);
      }

      const data: OpenRouterAPIResponse = await response.json();

      if (data.error) {
        throw new Error(
          data.error.message || "Error en la respuesta de la API",
        );
      }

      if (
        !data.choices ||
        !Array.isArray(data.choices) ||
        data.choices.length === 0
      ) {
        throw new Error(
          "Respuesta inválida del servidor: no se encontraron choices",
        );
      }

      const content = data.choices[0]?.message?.content;
      if (!content || typeof content !== "string") {
        throw new Error(
          "Respuesta inválida del servidor: contenido no encontrado",
        );
      }

      return {
        content: content.trim(),
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(
          "La petición excedió el tiempo límite. Por favor, intenta nuevamente.",
        );
      }

      throw error;
    }
  }

  private async parseErrorResponse(
    response: Response,
  ): Promise<OpenRouterAPIError | null> {
    try {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return await response.json();
      }
    } catch {
      return null;
    }
    return null;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private generateRequestId(): string {
    return `request_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

function parseEnvNumber(
  value: string | undefined,
  defaultValue: number,
): number {
  if (!value) return defaultValue;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

function parseEnvInt(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

// Server-side factory
export function createLLMService(): LLMService | null {
  const provider = "openrouter";
  // Usar variable de entorno de servidor
  // Priorizamos OPENROUTER_API_KEY, fallback a GROQ_API_KEY si el usuario usa la misma key para OpenRouter
  const apiKey = serverEnv.OPENROUTER_API_KEY || serverEnv.GROQ_API_KEY || "";

  // Modelo por defecto: Llama 3.1 8B Instruct (Free tier on OpenRouter often available)
  // o google/gemini-2.0-flash-lite-preview-02-05:free
  const model =
    serverEnv.OPENROUTER_MODEL ||
    publicEnv.NEXT_PUBLIC_LLM_MODEL ||
    "meta-llama/llama-3.1-8b-instruct:free";

  const temperature = parseEnvNumber(
    publicEnv.NEXT_PUBLIC_LLM_TEMPERATURE,
    DEFAULT_CONFIG.temperature,
  );
  const maxTokens = parseEnvInt(
    publicEnv.NEXT_PUBLIC_LLM_MAX_TOKENS,
    DEFAULT_CONFIG.maxTokens,
  );
  const timeout = parseEnvInt(
    publicEnv.NEXT_PUBLIC_LLM_TIMEOUT,
    DEFAULT_CONFIG.timeout,
  );

  if (!apiKey) {
    logger.warn("OPENROUTER_API_KEY no configurada en el servidor.");
    return null;
  }

  try {
    const config: LLMConfig = {
      provider,
      apiKey,
      model,
      temperature,
      maxTokens,
      timeout,
    };

    return new LLMService(config);
  } catch (error) {
    logger.error("Error al inicializar LLMService:", error);
    return null;
  }
}
