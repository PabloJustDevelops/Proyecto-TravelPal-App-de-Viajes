// We use require and jest.doMock to avoid hoisting issues with variables
describe("AuthService Resilience", () => {
  let authService: any;
  let mockSupabase: any;
  let mockSession: any;
  let mockUser: any;

  beforeEach(() => {
    jest.resetModules(); // Clear cache to allow re-mocking

    mockUser = {
      id: "user-123",
      email: "test@example.com",
      aud: "authenticated",
      created_at: "2023-01-01T00:00:00Z",
    };

    mockSession = {
      user: mockUser,
      access_token: "token",
    };

    mockSupabase = {
      auth: {
        getSession: jest
          .fn()
          .mockResolvedValue({ data: { session: mockSession }, error: null }),
        getUser: jest
          .fn()
          .mockResolvedValue({ data: { user: mockUser }, error: null }),
        onAuthStateChange: jest.fn(),
      },
      from: jest.fn(),
    };

    // Setup default DB mock
    const mockBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockReturnThis(),
    };
    mockSupabase.from.mockReturnValue(mockBuilder);

    jest.doMock("../supabase", () => ({
      createSupabaseClient: () => mockSupabase,
    }));

    // Import AuthService AFTER mocking
    const { AuthService } = require("../auth");
    authService = new AuthService();
  });

  it("getCurrentUser should return basic user if DB fetch fails", async () => {
    // Setup DB failure
    const mockBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest
        .fn()
        .mockResolvedValue({ data: null, error: { message: "DB Error" } }),
    };
    mockSupabase.from.mockReturnValue(mockBuilder);

    const user = await authService.getCurrentUser();

    expect(user).not.toBeNull();
    expect(user.id).toBe(mockUser.id);
    expect(user.email).toBe(mockUser.email);
    // Profile data should be undefined
    expect(user.full_name).toBeUndefined();
  });

  it("onAuthStateChange should use session fallback if getCurrentUser fails completely", async () => {
    // Mock getCurrentUser to fail completely (return null)
    // Since we are using the real class instance, we can spy on it
    const getCurrentUserSpy = jest
      .spyOn(authService, "getCurrentUser")
      .mockResolvedValue(null);

    let authCallback: any;
    mockSupabase.auth.onAuthStateChange.mockImplementation((cb: any) => {
      authCallback = cb;
      return { data: { subscription: { unsubscribe: jest.fn() } } };
    });

    const spyCallback = jest.fn();
    authService.onAuthStateChange(spyCallback);

    // Simulate Auth Change Event with valid session
    await authCallback("SIGNED_IN", mockSession);

    // Even though getCurrentUser returned null, we should get the session user back
    expect(spyCallback).toHaveBeenCalledWith(
      expect.objectContaining({
        id: mockUser.id,
        email: mockUser.email,
      }),
    );

    getCurrentUserSpy.mockRestore();
  });
});
