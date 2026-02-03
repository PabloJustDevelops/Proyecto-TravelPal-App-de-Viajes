import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import NewTripPage from "../page";
import { useAuth } from "@/contexts/AuthContext";
import { createSupabaseClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

// Mock dependencies
jest.mock("@/contexts/AuthContext", () => ({
  __esModule: true,
  useAuth: jest.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock("@/lib/supabase");
jest.mock("@/lib/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

describe("NewTripPage", () => {
  const mockPush = jest.fn();
  const mockSupabase = {
    from: jest.fn(),
  };
  const mockInsert = jest.fn();
  const mockSelect = jest.fn();
  const mockSingle = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: "test-user-id" },
    });
    (createSupabaseClient as jest.Mock).mockReturnValue(mockSupabase);

    // Setup supabase chain
    mockSupabase.from.mockReturnValue({
      insert: mockInsert,
    });
    mockInsert.mockReturnValue({
      select: mockSelect,
    });
    mockSelect.mockReturnValue({
      single: mockSingle,
    });
  });

  it("submits form with correct data including confirmation_number", async () => {
    mockSingle.mockResolvedValue({
      data: { id: "new-trip-id" },
      error: null,
    });

    render(<NewTripPage />);

    // Fill form
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
      // Verifica inserción de viaje
      expect(mockInsert).toHaveBeenCalledWith([
        expect.objectContaining({
          confirmation_number: "CONF123",
          user_id: "test-user-id",
          title: "Test Trip",
          notes: expect.stringContaining("Viajeros: 2"),
        }),
      ]);

      // Verifica inserción de presupuesto (segunda llamada a insert)
      expect(mockInsert).toHaveBeenCalledWith([
        expect.objectContaining({
          user_id: "test-user-id",
          total_amount: 1000,
          name: "Presupuesto General",
        }),
      ]);

      expect(mockPush).toHaveBeenCalledWith("/trips/new-trip-id");
    });
  });

  it("displays proper error message from supabase", async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { message: "Database error occurred" },
    });

    render(<NewTripPage />);

    // Fill required fields
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

    // Submit
    fireEvent.click(screen.getByText("Crear Viaje"));

    await waitFor(() => {
      expect(screen.getByText("Database error occurred")).toBeInTheDocument();
    });
  });

  it("handles timeout correctly", async () => {
    jest.useFakeTimers();

    // Simula una promesa que nunca se resuelve inicialmente
    mockSingle.mockImplementation(() => new Promise(() => {}));

    render(<NewTripPage />);

    // Fill required fields
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
