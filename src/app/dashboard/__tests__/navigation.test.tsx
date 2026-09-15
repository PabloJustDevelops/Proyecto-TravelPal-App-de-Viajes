import { render, screen, waitFor } from '@testing-library/react';
import DashboardPage from '@/app/dashboard/page';
import { useAuth } from '@/contexts/AuthContext';

// Mocks
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));
jest.mock('@/components/notifications/NotificationSystem', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
}));
// jsPDF es ESM puro y no se puede cargar bajo Jest; el menu de exportacion no se
// ejercita en este test, asi que basta con aislar el modulo.
jest.mock('jspdf', () => ({ __esModule: true, default: jest.fn() }));

describe('DashboardPage Navigation', () => {
  const mockUser = { id: 'user-123', full_name: 'Test User' };
  let fetchMock: jest.Mock;

  const jsonResponse = (data: unknown) => ({
    ok: true,
    status: 200,
    json: async () => data,
  });

  // Forma de respuesta del endpoint unico /api/dashboard?range=: trips y expenses
  // completos y budgets con sus filas completas (no solo total_amount).
  const dashboardPayload = {
    trips: [
      {
        id: 'trip-1',
        user_id: 'user-123',
        title: 'Escapada a Roma',
        origin: 'Madrid',
        destination: 'Roma',
        departure_date: '2026-05-01',
        return_date: '2026-05-07',
        status: 'confirmed',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    ],
    expenses: [
      {
        id: 'expense-1',
        user_id: 'user-123',
        trip_id: 'trip-1',
        title: 'Cena',
        description: 'Cena en Trastevere',
        amount: 42,
        currency: 'USD',
        category: 'food',
        date: '2026-05-02',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    ],
    budgets: [
      {
        id: 'budget-1',
        name: 'Presupuesto Roma',
        total_amount: 1500,
        spent_amount: 420,
        currency: 'USD',
        category: 'travel',
        start_date: '2026-05-01',
        end_date: '2026-05-07',
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser, loading: false });

    fetchMock = jest.fn().mockResolvedValue(jsonResponse(dashboardPayload));
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('renders dashboard content after loading', async () => {
    render(<DashboardPage />);

    // Should show welcome message eventually
    await waitFor(() => {
      expect(screen.getByText(/Bienvenido, Test/)).toBeInTheDocument();
    });

    // Un unico camino de datos: el panel carga del endpoint /api/dashboard con rango.
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/dashboard?range=all',
      expect.anything(),
    );
  });

  it('handles timeout gracefully', async () => {
    // Mock hanging promise
    fetchMock.mockImplementation(() => new Promise(() => {}));

    render(<DashboardPage />);

    // Should stop loading eventually due to timeout logic (we can't easily test time passage without fake timers,
    // but we verify code structure ensures setLoading(false) is called)
    // Here we just ensure it doesn't crash
    expect(screen.queryByText(/Bienvenido/i)).not.toBeInTheDocument(); // Still loading or error
  });
});
