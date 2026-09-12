import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import NewTripPage from "../page";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

// Mock dependencies
jest.mock("@/contexts/AuthContext", () => ({
  __esModule: true,
  useAuth: jest.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock("@/lib/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  },
}));
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  usePathname: () => "/trips/new",
}));

describe("NewTripPage", () => {
  const mockPush = jest.fn();
  let fetchMock: jest.Mock;

  const jsonResponse = (data: unknown, ok = true, status = 200) => ({
    ok,
    status,
    json: async () => data,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: "test-user-id" },
    });
    fetchMock = jest.fn().mockResolvedValue(jsonResponse({ id: "new-trip-id" }));
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  function fillRequiredFields() {
    fireEvent.change(screen.getByLabelText(/Título del Viaje/i), {
      target: { value: "Test Trip" },
    });
    fireEvent.change(screen.getByLabelText(/Origen/i), {
      target: { value: "Madrid" },
    });
    fireEvent.change(screen.getByLabelText(/Destino/i), {
      target: { value: "Paris" },
    });
    fireEvent.change(screen.getByLabelText(/Fecha de Salida/i), {
      target: { value: "2025-01-01T10:00" },
    });
  }

  it("submits form with correct data including confirmation_number", async () => {
    render(<NewTripPage />);

    // Fill form
    fillRequiredFields();
    fireEvent.change(screen.getByLabelText(/Código de Confirmación/i), {
      target: { value: "CONF123" },
    });
    fireEvent.change(screen.getByLabelText(/Número de Personas/i), {
      target: { value: "2" },
    });
    fireEvent.change(screen.getByLabelText(/Presupuesto Estimado/i), {
      target: { value: "1000" },
    });

    // Submit
    fireEvent.click(screen.getByText("Crear Viaje"));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/trips/new-trip-id");
    });

    // Verifica el payload real del viaje (el user_id lo añade la API)
    const tripsCall = fetchMock.mock.calls.find(([url]) => url === "/api/trips");
    expect(tripsCall).toBeDefined();
    const tripPayload = JSON.parse(tripsCall![1].body);
    expect(tripPayload).toEqual(
      expect.objectContaining({
        confirmation_number: "CONF123",
        title: "Test Trip",
        notes: "Viajeros: 2",
      }),
    );

    // Verifica el payload real del presupuesto (segunda llamada)
    const budgetCall = fetchMock.mock.calls.find(
      ([url]) => url === "/api/budget",
    );
    expect(budgetCall).toBeDefined();
    const budgetPayload = JSON.parse(budgetCall![1].body);
    expect(budgetPayload).toEqual(
      expect.objectContaining({
        name: "Presupuesto General",
        total_amount: 1000,
        trip_id: "new-trip-id",
      }),
    );
  });

  it("displays proper error message from the API", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ error: "Database error occurred" }, false, 500),
    );

    render(<NewTripPage />);

    fillRequiredFields();

    // Submit
    fireEvent.click(screen.getByText("Crear Viaje"));

    await waitFor(() => {
      expect(screen.getByText("Database error occurred")).toBeInTheDocument();
    });
  });

  it("handles timeout correctly", async () => {
    jest.useFakeTimers();

    // Simula una promesa que nunca se resuelve inicialmente
    fetchMock.mockImplementation(() => new Promise(() => {}));

    render(<NewTripPage />);

    fillRequiredFields();

    // Submit
    fireEvent.click(screen.getByText("Crear Viaje"));

    // Avanza el tiempo 16 segundos
    jest.advanceTimersByTime(16000);

    await waitFor(() => {
      expect(
        screen.getByText(/La conexión ha tardado demasiado/i),
      ).toBeInTheDocument();
    });

    jest.useRealTimers();
  });
});
