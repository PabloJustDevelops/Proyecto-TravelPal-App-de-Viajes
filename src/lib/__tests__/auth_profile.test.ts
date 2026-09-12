import { authService } from '../auth';
import { createSupabaseClient } from '../supabase';

// Mock dependencies
jest.mock('../supabase', () => ({
  createSupabaseClient: jest.fn(),
}));

jest.mock('../logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('AuthService Profile Update', () => {
  let mockSupabase: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock Supabase client
    mockSupabase = {
      auth: {
        getSession: jest.fn(),
        updateUser: jest.fn(),
      },
      from: jest.fn(),
    };

    (createSupabaseClient as jest.Mock).mockReturnValue(mockSupabase);

    // AuthService instancia el cliente en un property initializer; sustituimos
    // la instancia del singleton por el mock.
    (authService as any).supabase = mockSupabase;
  });

  test('should update profile successfully', async () => {
    // getCurrentUser() obtiene la sesión (ya no usa getUser)
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-123', email: 'test@example.com' } } },
      error: null,
    });

    // Mock profiles select (called by getCurrentUser)
    const mockSelectBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: { full_name: 'Old Name' }, error: null }),
      upsert: jest.fn().mockResolvedValue({ error: null }),
    };
    mockSupabase.from.mockReturnValue(mockSelectBuilder);

    // Mock updateUser
    mockSupabase.auth.updateUser.mockResolvedValue({ error: null });

    const updates = { full_name: 'New Name' };
    await authService.updateProfile(updates);

    expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
      data: { full_name: 'New Name', avatar_url: undefined },
    });
    expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
    expect(mockSelectBuilder.upsert).toHaveBeenCalledWith(expect.objectContaining({
      id: 'user-123',
      full_name: 'New Name',
    }));
  });

  test('should handle timeout gracefully', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-123' } } },
      error: null,
    });

    // Mock profiles select
    const mockSelectBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: {}, error: null }),
      // Delay > 20s (timeout de updateProfile)
      upsert: jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 21000))),
    };
    mockSupabase.from.mockReturnValue(mockSelectBuilder);

    // Mock updateUser
    mockSupabase.auth.updateUser.mockResolvedValue({ error: null });

    const updates = { full_name: 'Timeout Name' };

    await expect(authService.updateProfile(updates)).rejects.toThrow('Update profile timed out after 20s');
  }, 25000);

  test('should fail if no user logged in', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    await expect(authService.updateProfile({})).rejects.toThrow('No user logged in');
  });
});
