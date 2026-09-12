import { render, screen, waitFor } from "@testing-library/react";
import TripsPage from "../page";
import { useAuth } from "@/contexts/AuthContext";

// Mock dependencies
jest.mock("@/contexts/AuthContext", () => ({
  useAuth: jest.fn(),
}));
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
  let fetchMock: jest.Mock;

  const jsonResponse = (data: unknown) => ({
    ok: true,
    status: 200,
    json: async () => data,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    fetchMock = jest.fn().mockResolvedValue(jsonResponse([]));
    global.fetch = fetchMock as unknown as typeof fetch;
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

    fetchMock.mockResolvedValue(jsonResponse(mockTrips));

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

    fetchMock.mockResolvedValue(jsonResponse([]));

    render(<TripsPage />);

    await waitFor(() => {
      expect(
        screen.getByText("No tienes viajes registrados"),
      ).toBeInTheDocument();
    });
  });
});
