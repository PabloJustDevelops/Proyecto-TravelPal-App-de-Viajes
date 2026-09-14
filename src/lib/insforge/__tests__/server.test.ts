import { createServerClient } from "@insforge/sdk/ssr";
import { cookies } from "next/headers";
import { createServerInsforgeClient, requireUser } from "../server";

jest.mock("@insforge/sdk/ssr", () => ({
  createServerClient: jest.fn(),
}));
jest.mock("next/headers");
jest.mock("next/server");
jest.mock("@/lib/logger", () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

const createServerClientMock = createServerClient as jest.Mock;
const cookiesMock = cookies as unknown as jest.Mock;

function mockAuthClient(getCurrentUser: jest.Mock) {
  createServerClientMock.mockReturnValue({ auth: { getCurrentUser } });
}

const userFixture = {
  id: "user-1",
  email: "ana@example.com",
  emailVerified: true,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
  metadata: { full_name: "Ana" },
  profile: { name: "Ana", avatar_url: "https://cdn.example.com/ana.png" },
};

describe("requireUser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cookiesMock.mockResolvedValue({ get: jest.fn() });
  });

  it("devuelve el usuario normalizado desde getCurrentUser", async () => {
    mockAuthClient(
      jest.fn().mockResolvedValue({ data: { user: userFixture }, error: null }),
    );

    const result = await requireUser();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.user).toEqual({
        id: "user-1",
        email: "ana@example.com",
        user_metadata: {
          full_name: "Ana",
          avatar_url: "https://cdn.example.com/ana.png",
        },
      });
      expect(result.client).toBeDefined();
    }
  });

  it("devuelve 401 cuando no hay sesión", async () => {
    mockAuthClient(
      jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    );

    const result = await requireUser();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(401);
      await expect(result.response.json()).resolves.toEqual({
        error: "No autorizado",
      });
    }
  });

  it("devuelve 401 cuando el token no es válido", async () => {
    mockAuthClient(
      jest.fn().mockResolvedValue({
        data: { user: null },
        error: { message: "invalid JWT", statusCode: 401 },
      }),
    );

    const result = await requireUser();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(401);
    }
  });

  it("devuelve 500 cuando falla el servidor de Auth", async () => {
    mockAuthClient(
      jest.fn().mockResolvedValue({
        data: { user: null },
        error: { message: "fetch failed", statusCode: 0 },
      }),
    );

    const result = await requireUser();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(500);
      await expect(result.response.json()).resolves.toEqual({
        error: "Error de autenticación",
      });
    }
  });

  it("devuelve 500 cuando el servidor de Auth responde con un error >= 500", async () => {
    mockAuthClient(
      jest.fn().mockResolvedValue({
        data: { user: null },
        error: { message: "internal error", statusCode: 503 },
      }),
    );

    const result = await requireUser();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(500);
      await expect(result.response.json()).resolves.toEqual({
        error: "Error de autenticación",
      });
    }
  });

  it("devuelve 500 estandarizado si el cliente de Auth lanza", async () => {
    mockAuthClient(jest.fn().mockRejectedValue(new Error("fetch failed")));

    const result = await requireUser();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(500);
      await expect(result.response.json()).resolves.toEqual({
        error: "Error de autenticación",
      });
    }
  });

  it("normaliza un usuario sin email ni metadata", async () => {
    mockAuthClient(
      jest.fn().mockResolvedValue({
        data: {
          user: {
            id: "user-2",
            email: "",
            emailVerified: false,
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
            metadata: null,
            profile: null,
          },
        },
        error: null,
      }),
    );

    const result = await requireUser();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.user).toEqual({
        id: "user-2",
        email: "",
        user_metadata: {},
      });
    }
  });
});

describe("createServerInsforgeClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("pasa el store de cookies al cliente de servidor", async () => {
    const store = { get: jest.fn() };
    cookiesMock.mockResolvedValue(store);
    createServerClientMock.mockReturnValue({});

    await createServerInsforgeClient();

    expect(cookies).toHaveBeenCalled();
    expect(createServerClientMock).toHaveBeenCalledWith(
      expect.objectContaining({
        baseUrl: expect.stringContaining("insforge.app"),
        anonKey: expect.any(String),
        cookies: store,
      }),
    );
  });
});
