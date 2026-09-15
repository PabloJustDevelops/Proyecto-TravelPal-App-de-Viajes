import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import ExpensesPage from "../page";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/utils";

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: jest.fn(),
}));
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
  usePathname: () => "/expenses",
}));
jest.mock("next/link", () => {
  const MockLink = ({ children }: { children: React.ReactNode }) => children;
  MockLink.displayName = "Link";
  return MockLink;
});
jest.mock("@/components/layout/DashboardLayout", () => {
  const MockLayout = ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  );
  MockLayout.displayName = "DashboardLayout";
  return MockLayout;
});
jest.mock("@/lib/logger", () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

const mockUser = { id: "user-123", full_name: "Test User", email: "test@test.test" };

const trips = [
  {
    id: "trip-1",
    user_id: "user-123",
    title: "Escapada a Roma",
    origin: "Madrid",
    destination: "Roma",
    departure_date: "2026-05-01",
    return_date: "2026-05-07",
    status: "confirmed",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
];

// Gastos pensados para probar el recalculo: e1 y e2 dentro del periodo, e3 fuera
// de fechas, e4 en otra moneda. Ninguno debe colarse donde no aplica.
const expenses = [
  {
    id: "e1",
    user_id: "user-123",
    trip_id: "trip-1",
    title: "Cena en Trastevere",
    description: "Cena en Trastevere",
    amount: 900,
    currency: "USD",
    category: "food",
    date: "2026-05-02",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    trip: { id: "trip-1", title: "Escapada a Roma" },
  },
  {
    id: "e2",
    user_id: "user-123",
    trip_id: null,
    title: "Taxi",
    description: "Taxi",
    amount: 50,
    currency: "USD",
    category: "transport",
    date: "2026-05-02",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    trip: null,
  },
  {
    id: "e3",
    user_id: "user-123",
    trip_id: "trip-1",
    title: "Compra fuera de fechas",
    description: "Compra fuera de fechas",
    amount: 9999,
    currency: "USD",
    category: "food",
    date: "2026-06-30",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    trip: null,
  },
  {
    id: "e4",
    user_id: "user-123",
    trip_id: "trip-1",
    title: "Gasto en otra moneda",
    description: "Gasto en otra moneda",
    amount: 9999,
    currency: "EUR",
    category: "food",
    date: "2026-05-02",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    trip: null,
  },
];

// El API devuelve spent_amount 0: el "real" solo puede salir del cruce con gastos.
const budgets = [
  {
    id: "b1",
    name: "Presupuesto Roma",
    total_amount: 1000,
    spent_amount: 0,
    currency: "USD",
    category: "travel",
    trip_id: "trip-1",
    start_date: "2026-05-01",
    end_date: "2026-05-07",
    description: "",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "b2",
    name: "Presupuesto Comida",
    total_amount: 100,
    spent_amount: 0,
    currency: "USD",
    category: "food",
    trip_id: null,
    start_date: "2026-05-01",
    end_date: "2026-05-07",
    description: "",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
];

describe("ExpensesPage con el presupuesto fusionado", () => {
  let fetchMock: jest.Mock;

  const jsonResponse = (data: unknown) => ({
    ok: true,
    status: 200,
    json: async () => data,
  });

  function findCall(url: string, method: string) {
    return fetchMock.mock.calls.find(
      ([inputUrl, init]) =>
        inputUrl === url &&
        (init as RequestInit | undefined)?.method === method,
    );
  }

  // Intl inserta un espacio duro entre cifra y simbolo; las consultas de texto lo
  // colapsan a un espacio normal, asi que comparamos ya normalizado.
  const flat = (value: string) => value.replace(/\s+/g, " ");

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser, loading: false });

    fetchMock = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      const method = init?.method ?? "GET";

      if (url.startsWith("/api/expenses")) {
        return Promise.resolve(jsonResponse({ expenses, trips }));
      }
      if (url === "/api/budget" && method === "POST") {
        return Promise.resolve(jsonResponse({ id: "budget-new" }));
      }
      if (url.startsWith("/api/budget/")) {
        return Promise.resolve(jsonResponse({ id: "budget-deleted" }));
      }
      if (url.startsWith("/api/budget")) {
        return Promise.resolve(jsonResponse({ budgets, trips, expenses }));
      }
      return Promise.resolve(jsonResponse({}));
    });

    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("lee previsto frente a real y recalcula el gastado cruzando los gastos", async () => {
    render(<ExpensesPage />);

    await screen.findByText("Mis Gastos");

    // El listado de gastos sigue en pie.
    expect(screen.getByText("Cena en Trastevere")).toBeInTheDocument();

    // b1 (travel, 900/1000) y b2 (comida, 900/100) recalculan a 900: el API decia 0.
    expect(
      screen.getAllByText(flat(`Gastado: ${formatCurrency(900, "USD")}`)),
    ).toHaveLength(2);

    // Contadores y totales sobre todos los presupuestos (1100 previsto, 1800 real).
    expect(screen.getByText("Presupuesto total").parentElement).toHaveTextContent(
      flat(formatCurrency(1100, "USD")),
    );
    expect(screen.getByText("Gastado").parentElement).toHaveTextContent(
      flat(formatCurrency(1800, "USD")),
    );
    expect(screen.getByText("Superados").parentElement).toHaveTextContent("1");
    expect(screen.getByText("Cerca del límite").parentElement).toHaveTextContent("1");

    expect(screen.getByText("¡Presupuesto excedido!")).toBeInTheDocument();
    expect(
      screen.getByText("¡Cerca del límite del presupuesto!"),
    ).toBeInTheDocument();
  });

  it("usa el mismo bloque de filtros para gastos y presupuestos", async () => {
    render(<ExpensesPage />);

    await screen.findByText("Mis Gastos");

    fireEvent.change(screen.getByLabelText("Filtrar por categoría"), {
      target: { value: "food" },
    });

    // Presupuestos: sobrevive el de comida, el de viaje se filtra.
    expect(screen.getByText("Presupuesto Comida")).toBeInTheDocument();
    expect(screen.queryByText("Presupuesto Roma")).not.toBeInTheDocument();

    // Gastos: la cena (food) sigue, el taxi (transport) no.
    expect(screen.getByText("Cena en Trastevere")).toBeInTheDocument();
    expect(screen.queryByText("Taxi")).not.toBeInTheDocument();
  });

  it("crea un presupuesto desde el modal y hace POST a /api/budget", async () => {
    render(<ExpensesPage />);

    await screen.findByText("Mis Gastos");

    fireEvent.click(screen.getByText("Nuevo Presupuesto"));

    fireEvent.change(screen.getByLabelText("Nombre del Presupuesto"), {
      target: { value: "Presupuesto Playa" },
    });
    fireEvent.change(screen.getByLabelText("Monto Total"), {
      target: { value: "500" },
    });
    fireEvent.change(screen.getByLabelText("Categoría"), {
      target: { value: "food" },
    });
    fireEvent.change(screen.getByLabelText("Fecha de Inicio"), {
      target: { value: "2026-07-01" },
    });
    fireEvent.change(screen.getByLabelText("Fecha de Fin"), {
      target: { value: "2026-07-10" },
    });

    const submitButton = screen.getByText("Crear Presupuesto");
    fireEvent.submit(submitButton.closest("form") as HTMLFormElement);

    await waitFor(() => {
      expect(findCall("/api/budget", "POST")).toBeDefined();
    });

    const postCall = findCall("/api/budget", "POST");
    const payload = JSON.parse((postCall![1] as RequestInit).body as string);
    expect(payload).toEqual(
      expect.objectContaining({
        name: "Presupuesto Playa",
        total_amount: 500,
        category: "food",
        start_date: "2026-07-01",
        end_date: "2026-07-10",
      }),
    );
  });

  it("borra un presupuesto desde su tarjeta y hace DELETE a /api/budget/:id", async () => {
    jest.spyOn(window, "confirm").mockReturnValue(true);

    render(<ExpensesPage />);

    await screen.findByText("Mis Gastos");

    const card = screen.getByText("Presupuesto Roma").closest(".group");
    expect(card).not.toBeNull();

    const deleteButton = within(card as HTMLElement)
      .getAllByRole("button")
      .find((button) => button.className.includes("text-danger"));
    expect(deleteButton).toBeDefined();

    fireEvent.click(deleteButton as HTMLElement);

    await waitFor(() => {
      expect(findCall("/api/budget/b1", "DELETE")).toBeDefined();
    });
  });
});
