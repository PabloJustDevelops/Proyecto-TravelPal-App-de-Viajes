import { logger } from "@/lib/logger";
import {
  ensureUserExists,
  type ServerSupabaseClient,
  type ServerUser,
} from "../server";

jest.mock("@/lib/logger", () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

const loggerError = logger.error as jest.Mock;

type CheckError = { code: string; message: string };
type InsertError = { message: string };

function fakeClient({
  existing = false,
  checkError,
  insertError,
}: {
  existing?: boolean;
  checkError?: CheckError;
  insertError?: InsertError;
}) {
  const single = jest.fn().mockResolvedValue(
    checkError
      ? { data: null, error: checkError }
      : existing
        ? { data: { id: "user-1" }, error: null }
        : { data: null, error: { code: "PGRST116" } },
  );
  const insert = jest.fn().mockResolvedValue({ error: insertError ?? null });
  const from = jest.fn(() => ({
    select: jest.fn(() => ({ eq: jest.fn(() => ({ single })) })),
    insert,
  }));

  return { client: { from } as unknown as ServerSupabaseClient, insert, from };
}

const user: ServerUser = {
  id: "user-1",
  email: "ana@example.com",
  user_metadata: { full_name: "Ana", avatar_url: "https://cdn.example.com/ana.png" },
};

describe("ensureUserExists", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("inserta el usuario en public.users cuando no existe", async () => {
    const { client, insert } = fakeClient({ existing: false });

    await ensureUserExists(client, user);

    expect(insert).toHaveBeenCalledWith([
      {
        id: "user-1",
        email: "ana@example.com",
        full_name: "Ana",
        avatar_url: "https://cdn.example.com/ana.png",
        updated_at: expect.any(String),
      },
    ]);
  });

  it("no inserta nada cuando el usuario ya existe", async () => {
    const { client, insert } = fakeClient({ existing: true });

    await ensureUserExists(client, user);

    expect(insert).not.toHaveBeenCalled();
  });

  it("no consulta nada si el usuario no tiene id", async () => {
    const { client, from } = fakeClient({ existing: false });

    await ensureUserExists(client, { id: "" });

    expect(from).not.toHaveBeenCalled();
  });

  it("toma el nombre del email y deja avatar_url null sin metadata", async () => {
    const { client, insert } = fakeClient({ existing: false });

    await ensureUserExists(client, { id: "user-1", email: "ana@example.com" });

    expect(insert).toHaveBeenCalledWith([
      {
        id: "user-1",
        email: "ana@example.com",
        full_name: "ana",
        avatar_url: null,
        updated_at: expect.any(String),
      },
    ]);
  });

  it("registra un error real al comprobar si el usuario existe", async () => {
    const { client } = fakeClient({
      checkError: { code: "XX000", message: "boom" },
    });

    await ensureUserExists(client, user);

    expect(loggerError).toHaveBeenCalledWith("Error checking user existence", {
      code: "XX000",
      message: "boom",
    });
  });

  it("traga un insert que falla por clave duplicada", async () => {
    const { client, insert } = fakeClient({
      insertError: { message: "duplicate key value violates unique constraint" },
    });

    await expect(ensureUserExists(client, user)).resolves.toBeUndefined();

    expect(insert).toHaveBeenCalled();
    expect(loggerError).not.toHaveBeenCalledWith(
      "Error inserting user into public.users",
      expect.anything(),
    );
    expect(loggerError).not.toHaveBeenCalledWith(
      "Failed to ensure user exists",
      expect.anything(),
    );
  });

  it("registra un insert que falla por otro motivo sin propagar la excepción", async () => {
    const { client } = fakeClient({ insertError: { message: "boom" } });

    await expect(ensureUserExists(client, user)).resolves.toBeUndefined();

    expect(loggerError).toHaveBeenCalledWith(
      "Error inserting user into public.users",
      { message: "boom" },
    );
    expect(loggerError).toHaveBeenCalledWith("Failed to ensure user exists", {
      message: "boom",
    });
  });
});
