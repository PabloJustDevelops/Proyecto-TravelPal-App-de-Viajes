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

function fakeClient({ existing }: { existing: boolean }) {
  const single = jest.fn().mockResolvedValue(
    existing
      ? { data: { id: "user-1" }, error: null }
      : { data: null, error: { code: "PGRST116" } },
  );
  const insert = jest.fn().mockResolvedValue({ error: null });
  const from = jest.fn(() => ({
    select: jest.fn(() => ({ eq: jest.fn(() => ({ single })) })),
    insert,
  }));

  return { client: { from } as unknown as ServerSupabaseClient, insert };
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
});
