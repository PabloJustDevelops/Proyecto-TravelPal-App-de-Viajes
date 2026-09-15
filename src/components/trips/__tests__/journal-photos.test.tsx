import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import JournalPhotos from "../JournalPhotos";
import { createInsforgeClient } from "@/lib/insforge";
import type { JournalPhoto } from "@/lib/insforge";

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "user-a" }, loading: false }),
}));
jest.mock("@/lib/logger", () => ({
  logger: { debug: jest.fn(), error: jest.fn(), info: jest.fn() },
}));
jest.mock("@/lib/toast", () => ({ showToast: jest.fn() }));

type QueryResult = { data?: unknown; error?: unknown };

interface DbChain {
  select: jest.Mock;
  eq: jest.Mock;
  order: jest.Mock;
  insert: jest.Mock;
  delete: jest.Mock;
  then: (resolve: (value: QueryResult) => unknown) => Promise<unknown>;
}

function makeDbChain(
  loadResult: QueryResult,
  writeResult: QueryResult = { data: null, error: null },
): DbChain {
  let current = loadResult;
  const chain = {} as DbChain;
  chain.select = jest.fn(() => {
    current = loadResult;
    return chain;
  });
  chain.eq = jest.fn(() => chain);
  chain.order = jest.fn(() => chain);
  chain.insert = jest.fn(() => {
    current = writeResult;
    return chain;
  });
  chain.delete = jest.fn(() => {
    current = writeResult;
    return chain;
  });
  chain.then = (resolve) => Promise.resolve(current).then(resolve);
  return chain;
}

function makeStorage(
  uploadResult: QueryResult = { data: { url: "https://cdn/photo.jpg", key: "k1" } },
  removeResult: QueryResult = { data: null, error: null },
) {
  return {
    upload: jest.fn(() => Promise.resolve(uploadResult)),
    remove: jest.fn(() => Promise.resolve(removeResult)),
  };
}

const mockedClient = createInsforgeClient as jest.Mock;

function photo(overrides: Partial<JournalPhoto> = {}): JournalPhoto {
  return {
    id: "p1",
    user_id: "user-a",
    trip_id: "trip-1",
    url: "https://cdn/foto.jpg",
    key: "user-a/trip-1/foto.jpg",
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-01T00:00:00.000Z",
    ...overrides,
  };
}

function mount(chain: DbChain, storage = makeStorage()) {
  const storageFrom = jest.fn(() => storage);
  mockedClient.mockReturnValue({
    database: { from: jest.fn(() => chain) },
    storage: { from: storageFrom },
  });
  return { storage };
}

describe("JournalPhotos", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.confirm = jest.fn(() => true) as unknown as typeof window.confirm;
  });

  it("ensena un estado de carga mientras lee las fotos", () => {
    const chain = makeDbChain({ data: [] });
    chain.then = () => new Promise(() => {});
    mount(chain);

    render(<JournalPhotos tripId="trip-1" />);

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("invita a anadir la primera foto cuando no hay ninguna", async () => {
    mount(makeDbChain({ data: [] }));

    render(<JournalPhotos tripId="trip-1" />);

    await waitFor(() => {
      expect(
        screen.getByText("Todavia no hay fotos del viaje"),
      ).toBeInTheDocument();
    });
  });

  it("muestra las fotos del viaje", async () => {
    mount(makeDbChain({ data: [photo({ id: "p1" })] }));

    render(<JournalPhotos tripId="trip-1" />);

    await waitFor(() => {
      expect(screen.getByAltText("Foto del diario")).toHaveAttribute(
        "src",
        "https://cdn/foto.jpg",
      );
    });
  });

  it("si falla la carga lo dice y permite reintentar", async () => {
    const chain = makeDbChain({ error: { message: "boom" } });
    mount(chain);

    render(<JournalPhotos tripId="trip-1" />);

    await waitFor(() => {
      expect(
        screen.getByText("No se pudieron cargar las fotos del diario"),
      ).toBeInTheDocument();
    });

    const callsBefore = chain.select.mock.calls.length;
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    await waitFor(() => {
      expect(chain.select.mock.calls.length).toBeGreaterThan(callsBefore);
    });
  });

  it("sube la foto al bucket y guarda url y key en la tabla", async () => {
    const chain = makeDbChain({ data: [] });
    const { storage } = mount(chain);

    render(<JournalPhotos tripId="trip-1" />);

    await waitFor(() => {
      expect(
        screen.getByText("Todavia no hay fotos del viaje"),
      ).toBeInTheDocument();
    });

    const file = new File(["x"], "foto.jpg", { type: "image/jpeg" });
    fireEvent.change(screen.getByLabelText("Anadir foto al diario"), {
      target: { files: [file] },
    });

    await waitFor(() => {
      expect(storage.upload).toHaveBeenCalledWith(
        expect.stringMatching(/^user-a\/trip-1\/.+\.jpg$/),
        file,
      );
      expect(chain.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          trip_id: "trip-1",
          user_id: "user-a",
          url: "https://cdn/photo.jpg",
          key: "k1",
        }),
      ]);
    });
  });

  it("borra la foto del bucket y de la tabla", async () => {
    const chain = makeDbChain({ data: [photo({ id: "p1", key: "k1" })] });
    const { storage } = mount(chain);

    render(<JournalPhotos tripId="trip-1" />);

    await waitFor(() => {
      expect(screen.getByAltText("Foto del diario")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Borrar foto" }));

    await waitFor(() => {
      expect(storage.remove).toHaveBeenCalledWith("k1");
      expect(chain.delete).toHaveBeenCalled();
      expect(screen.queryByAltText("Foto del diario")).not.toBeInTheDocument();
    });
  });
});
