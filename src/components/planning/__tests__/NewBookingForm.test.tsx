import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import NewBookingForm from "../NewBookingForm";
import { useAuth } from "@/contexts/AuthContext";
import { createSupabaseClient } from "@/lib/supabase";

// Mock dependencies
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}))
jest.mock('@/lib/supabase')
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
  const mockSupabase = {
    from: jest.fn(),
  }
  const mockInsert = jest.fn()
  const mockSelect = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { id: 'test-user-id' },
    })
    ;(createSupabaseClient as jest.Mock).mockReturnValue(mockSupabase)
    
    // Setup supabase chain
    mockSupabase.from.mockReturnValue({
      insert: mockInsert,
    })
    // insert returns an object with select method
    mockInsert.mockReturnValue({
      select: mockSelect
    })
    // select returns the promise resolving to data/error
    mockSelect.mockResolvedValue({ data: { id: '1' }, error: null })
  });

  it("renders correctly", () => {
    render(
      <NewBookingForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />,
    );
    expect(screen.getByLabelText(/Título/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Fecha/i)).toBeInTheDocument();
  });

  it("submits form with correct data", async () => {
    render(
      <NewBookingForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />,
    );

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
      expect(mockInsert).toHaveBeenCalledWith([
        expect.objectContaining({
          user_id: "test-user-id",
          title: "Test Booking",
          start_date: "2025-05-01",
          notes: expect.stringContaining("Personas: 2"),
        }),
      ]);
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it("handles cancellation", () => {
    render(
      <NewBookingForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />,
    );
    fireEvent.click(screen.getByText("Cancelar"));
    expect(mockOnCancel).toHaveBeenCalled();
  });
});
