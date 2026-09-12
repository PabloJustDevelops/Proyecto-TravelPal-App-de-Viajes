import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createServerSupabaseClient, requireUser } from "../server";

jest.mock("@supabase/ssr");
jest.mock("next/headers");
// The jsdom Response (whatwg-fetch) has no static json() nor body streams, which
// NextResponse.json relies on. Stub it so the module runs under test.
jest.mock("next/server", () => {
  class StubResponse extends Response {
    static json(body: unknown, init?: ResponseInit) {
      return new Response(JSON.stringify(body), {
        ...init,
        headers: {
          "content-type": "application/json",
          ...((init?.headers as Record<string, string>) ?? {}),
        },
      });
    }
  }
  return { NextResponse: StubResponse };
});
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

function mockAuthClient(getClaims: jest.Mock) {
  createServerClientMock.mockReturnValue({ auth: { getClaims } });
}

describe("requireUser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cookiesMock.mockResolvedValue({
      getAll: jest.fn(() => []),
      set: jest.fn(),
    });
  });

  it("devuelve el usuario normalizado desde los claims", async () => {
    mockAuthClient(
      jest.fn().mockResolvedValue({
        data: {
          claims: {
            sub: "user-1",
            email: "ana@example.com",
            user_metadata: { full_name: "Ana" },
          },
          header: { alg: "ES256", kid: "k1", typ: "JWT" },
          signature: new Uint8Array(),
        },
        error: null,
      }),
    );

    const result = await requireUser();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.user).toEqual({
        id: "user-1",
        email: "ana@example.com",
        user_metadata: { full_name: "Ana" },
      });
      expect(result.supabase).toBeDefined();
    }
  });

  it("devuelve 401 cuando no hay sesión", async () => {
    mockAuthClient(jest.fn().mockResolvedValue({ data: null, error: null }));

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
        data: null,
        error: { message: "invalid JWT", status: 401 },
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
        data: null,
        error: { message: "fetch failed", status: 0 },
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
        data: null,
        error: { message: "internal error", status: 503 },
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
          claims: { sub: "user-2" },
          header: {},
          signature: new Uint8Array(),
        },
        error: null,
      }),
    );

    const result = await requireUser();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.user).toEqual({
        id: "user-2",
        email: undefined,
        user_metadata: undefined,
      });
    }
  });
});

describe("createServerSupabaseClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("enlaza getAll/setAll con las cookies del request", async () => {
    const store = {
      getAll: jest.fn(() => [{ name: "sb", value: "token" }]),
      set: jest.fn(),
    };
    cookiesMock.mockResolvedValue(store);
    createServerClientMock.mockReturnValue({});

    await createServerSupabaseClient();

    const options = createServerClientMock.mock.calls[0][2];
    expect(options.cookies.getAll()).toEqual([{ name: "sb", value: "token" }]);

    options.cookies.setAll([{ name: "sb", value: "nuevo", options: {} }]);
    expect(store.set).toHaveBeenCalledWith("sb", "nuevo", {});
  });

  it("ignora el fallo al escribir cookies (Server Component)", async () => {
    const store = {
      getAll: jest.fn(() => []),
      set: jest.fn(() => {
        throw new Error("read-only");
      }),
    };
    cookiesMock.mockResolvedValue(store);
    createServerClientMock.mockReturnValue({});

    await createServerSupabaseClient();

    const options = createServerClientMock.mock.calls[0][2];
    expect(() =>
      options.cookies.setAll([{ name: "sb", value: "x", options: {} }]),
    ).not.toThrow();
  });
});
