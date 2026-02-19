import { LLMService, createLLMService } from "../llmService";

// Mock global fetch
global.fetch = jest.fn();

describe("LLMService", () => {
  const mockConfig = {
    provider: "openrouter" as const,
    apiKey: "sk-or-test-api-key-must-be-longer-than-20-chars",
    model: "meta-llama/llama-3.1-8b-instruct:free",
    temperature: 0.7,
    maxTokens: 100,
    timeout: 5000,
  };

  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should initialize correctly with valid config", () => {
    const service = new LLMService(mockConfig);
    expect(service).toBeInstanceOf(LLMService);
  });

  it("should throw error with invalid API key", () => {
    expect(() => new LLMService({ ...mockConfig, apiKey: "short" })).toThrow(
      "API Key inválida",
    );
  });

  it("should send message successfully", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "Hello user" } }],
      }),
    });

    const service = new LLMService(mockConfig);
    const response = await service.sendMessage([
      { role: "user", content: "Hi" },
    ]);

    expect(response.content).toBe("Hello user");
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("should handle 404 model not found error", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
      json: async () => ({ error: { message: "Model not found" } }),
      headers: { get: () => "application/json" },
    });

    const service = new LLMService(mockConfig);
    // sendMessage captura excepciones y devuelve objeto con error,
    // pero si falla dentro de sendMessageWithRetry con nuestra nueva lógica,
    // debería propagar el error específico en response.error

    // NOTA: LLMService.sendMessage captura excepciones y devuelve { error: ... }
    // Así que esperamos un objeto con error, no una excepción lanzada.
    const response = await service.sendMessage([
      { role: "user", content: "Hi" },
    ]);

    expect(response.error).toContain("Modelo no encontrado");
  });

  it("should handle 401 unauthorized error", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      json: async () => ({ error: { message: "Invalid key" } }),
      headers: { get: () => "application/json" },
    });

    const service = new LLMService(mockConfig);
    const response = await service.sendMessage([
      { role: "user", content: "Hi" },
    ]);

    expect(response.error).toContain("API Key inválida");
  });
});
