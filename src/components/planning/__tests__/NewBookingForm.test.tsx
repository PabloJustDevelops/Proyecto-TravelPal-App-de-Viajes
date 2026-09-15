import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import NewBookingForm from "../NewBookingForm";
import { useAuth } from "@/contexts/AuthContext";

// Mock dependencies
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}))
jest.mock('@/lib/insforge')
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }
}));

describe("NewBookingForm", () => {
  const mockOnSuccess = jest.fn();
  const mockOnCancel = jest.fn();
  let fetchMock: jest.Mock;

  const jsonResponse = (data: unknown) => ({
    ok: true,
    status: 200,
    json: async () => data,
  });

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { id: 'test-user-id' },
    })

    // GET /api/trips alimenta el selector; POST /api/planning guarda la reserva
    fetchMock = jest.fn((url: string) =>
      Promise.resolve(
        url === '/api/trips'
          ? jsonResponse([{ id: 'trip-1', title: 'Trip to Paris' }])
          : jsonResponse({ id: 'booking-1' }),
      ),
    )
    global.fetch = fetchMock as unknown as typeof fetch
  });

  it("renders correctly", async () => {
    render(
      <NewBookingForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />,
    );
    expect(screen.getByLabelText(/Título/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Fecha/i)).toBeInTheDocument();

    // Espera a que el selector de viajes cargue para evitar updates sin act
    expect(
      await screen.findByRole('option', { name: 'Trip to Paris' }),
    ).toBeInTheDocument();
  });

  it("submits form with correct data", async () => {
    render(
      <NewBookingForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />,
    );

    // El trip_id se preselecciona con el primer viaje cargado
    await screen.findByRole('option', { name: 'Trip to Paris' });

    fireEvent.change(screen.getByLabelText(/Título/i), {
      target: { value: "Test Booking" },
    });
    fireEvent.change(screen.getByLabelText(/Nº Personas/i), {
      target: { value: "2" },
    });
    fireEvent.change(screen.getByLabelText(/Fecha/i), {
      target: { value: "2025-05-01" },
    });

    fireEvent.click(screen.getByText("Guardar Reserva"));

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });

    // Verifica el payload real que el componente envía a la API
    const planningCall = fetchMock.mock.calls.find(
      ([url]) => url === '/api/planning',
    );
    expect(planningCall).toBeDefined();
    const payload = JSON.parse(planningCall![1].body);
    expect(payload).toEqual(
      expect.objectContaining({
        title: "Test Booking",
        start_date: "2025-05-01",
        notes: expect.stringContaining("Personas: 2"),
        trip_id: "trip-1",
      }),
    );
  });

  it("handles cancellation", async () => {
    render(
      <NewBookingForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />,
    );
    await screen.findByRole('option', { name: 'Trip to Paris' });
    fireEvent.click(screen.getByText("Cancelar"));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  const selectFlightType = () => {
    fireEvent.change(screen.getByLabelText(/Tipo/i), {
      target: { value: "flight" },
    });
  };

  it("muestra los campos de vuelo solo cuando el tipo es Vuelo", async () => {
    render(
      <NewBookingForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />,
    );
    await screen.findByRole('option', { name: 'Trip to Paris' });

    expect(screen.queryByLabelText(/Nº de vuelo/i)).not.toBeInTheDocument();

    selectFlightType();

    expect(screen.getByLabelText(/Aerolínea/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nº de vuelo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Origen/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Destino/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Precio/i)).toBeInTheDocument();
  });

  it("envia los datos del vuelo cuando el tipo es Vuelo", async () => {
    render(
      <NewBookingForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />,
    );
    await screen.findByRole('option', { name: 'Trip to Paris' });

    fireEvent.change(screen.getByLabelText(/Título/i), {
      target: { value: "Vuelo a Nueva York" },
    });
    fireEvent.change(screen.getByLabelText(/Fecha/i), {
      target: { value: "2025-05-01" },
    });

    selectFlightType();
    fireEvent.change(screen.getByLabelText(/Aerolínea/i), {
      target: { value: "Iberia" },
    });
    fireEvent.change(screen.getByLabelText(/Nº de vuelo/i), {
      target: { value: "IB3201" },
    });
    fireEvent.change(screen.getByLabelText(/Origen/i), {
      target: { value: "MAD" },
    });
    fireEvent.change(screen.getByLabelText(/Destino/i), {
      target: { value: "JFK" },
    });
    fireEvent.change(screen.getByLabelText(/Precio/i), {
      target: { value: "123.45" },
    });

    fireEvent.click(screen.getByText("Guardar Reserva"));

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });

    const planningCall = fetchMock.mock.calls.find(
      ([url]) => url === '/api/planning',
    );
    const payload = JSON.parse(planningCall![1].body);
    expect(payload).toEqual(
      expect.objectContaining({
        type: "flight",
        title: "Vuelo a Nueva York",
        airline: "Iberia",
        flight_number: "IB3201",
        origin: "MAD",
        destination: "JFK",
        cost: 123.45,
        currency: "EUR",
      }),
    );
  });

  it("no envia datos de vuelo si el tipo no es Vuelo", async () => {
    render(
      <NewBookingForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />,
    );
    await screen.findByRole('option', { name: 'Trip to Paris' });

    fireEvent.change(screen.getByLabelText(/Título/i), {
      target: { value: "Hotel en Paris" },
    });
    fireEvent.change(screen.getByLabelText(/Fecha/i), {
      target: { value: "2025-05-01" },
    });

    fireEvent.click(screen.getByText("Guardar Reserva"));

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });

    const planningCall = fetchMock.mock.calls.find(
      ([url]) => url === '/api/planning',
    );
    const payload = JSON.parse(planningCall![1].body);
    expect(payload.airline).toBeUndefined();
    expect(payload.flight_number).toBeUndefined();
    expect(payload.origin).toBeUndefined();
    expect(payload.destination).toBeUndefined();
    expect(payload.cost).toBeUndefined();
  });
});
