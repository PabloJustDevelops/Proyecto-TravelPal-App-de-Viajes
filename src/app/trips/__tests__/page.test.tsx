import { render, screen, waitFor } from "@testing-library/react";
import TripsPage from "../page";
import { useAuth } from "@/contexts/AuthContext";
import { createSupabaseClient } from "@/lib/supabase";

// Mock dependencies
jest.mock("@/contexts/AuthContext", () => ({
  useAuth: jest.fn(),
}));
jest.mock("@/lib/supabase");
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => "/trips",
}));
jest.mock("next/link", () => {
  const MockLink = ({ children }: { children: React.ReactNode }) => {
    return children;
  };
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
  },
}));

describe("TripsPage", () => {
  const mockSupabase = {
    from: jest.fn(),
  };
  const mockSelect = jest.fn();
  const mockEq = jest.fn();
  const mockOrder = jest.fn();
  const mockBuilder = {
    abortSignal: jest.fn().mockReturnThis(),
    then: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createSupabaseClient as jest.Mock).mockReturnValue(mockSupabase);

    // Setup supabase chain
    mockSupabase.from.mockReturnValue({
      select: mockSelect,
    });
    mockSelect.mockReturnValue({
      eq: mockEq,
    });
    mockEq.mockReturnValue({
      order: mockOrder,
    });
    // Default builder behavior
    mockOrder.mockReturnValue(mockBuilder);
    mockBuilder.then.mockImplementation((resolve) =>
      resolve({ data: [], error: null }),
    );
  });

  it("shows loading spinner initially when auth is loading", () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: true,
    });

    render(<TripsPage />);
    // Buscamos el spinner por su role o clase, o simplemente verificamos que no está el texto de login ni la lista
    // Asumiendo que LoadingSpinner tiene algún texto o role, o simplemente verificando ausencia de otros elementos
    expect(
      screen.queryByText("Inicia sesión para ver tus viajes"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Mis Viajes")).not.toBeInTheDocument();
  });

  it("shows login prompt when auth finishes and no user", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
    });

    render(<TripsPage />);

    await waitFor(() => {
      expect(
        screen.getByText("Inicia sesión para ver tus viajes"),
      ).toBeInTheDocument();
    });
  });

  it("loads and displays trips when user is authenticated", async () => {
    const mockTrips = [
      {
        id: "1",
        title: "Trip to Paris",
        origin: "Madrid",
        destination: "Paris",
        departure_date: "2025-01-01",
        status: "planned",
        user_id: "user-1",
      },
    ];

    (useAuth as jest.Mock).mockReturnValue({
      user: { id: "user-1" },
      loading: false,
    });

    mockBuilder.then.mockImplementation((resolve) =>
      resolve({
        data: mockTrips,
        error: null,
      }),
    );

    render(<TripsPage />);

    await waitFor(() => {
      expect(screen.getByText("Trip to Paris")).toBeInTheDocument();
    });
  });

  it("handles empty trips list", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: "user-1" },
      loading: false,
    });

    mockBuilder.then.mockImplementation((resolve) =>
      resolve({
        data: [],
        error: null,
      }),
    );

    render(<TripsPage />);

    await waitFor(() => {
      expect(
        screen.getByText("No tienes viajes registrados"),
      ).toBeInTheDocument();
    });
  });
});
