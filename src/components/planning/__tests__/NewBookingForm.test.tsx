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
});
