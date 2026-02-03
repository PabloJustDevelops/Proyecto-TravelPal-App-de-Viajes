import { authService } from '../auth';
import { createSupabaseClient } from '../supabase';
import { logger } from '../logger';

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
        getUser: jest.fn(),
        updateUser: jest.fn(),
      },
      from: jest.fn(),
    };

    (createSupabaseClient as jest.Mock).mockReturnValue(mockSupabase);
    
    // Re-instantiate authService to use the mock client
    // Note: In a real scenario, we might want to inject dependencies, 
    // but here we are mocking the module that AuthService imports.
    // However, AuthService instantiates the client in its property initializer.
    // So we need to access the private 'supabase' property or rely on the mock being active when the module was imported.
    // Since jest.mock hoists, the mock should be active. 
    // But authService is a singleton exported from the module.
    // We might need to manually set the supabase property if it's accessible or use prototype spying.
    // For this test, let's assume we can access the private property via 'any' cast for testing purposes.
    (authService as any).supabase = mockSupabase;
  });

  test('should update profile successfully', async () => {
    // Mock getUser
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
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
    // Mock getUser
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    // Mock profiles select
    const mockSelectBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: {}, error: null }),
      upsert: jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 15000))), // Delay > 10s
    };
    mockSupabase.from.mockReturnValue(mockSelectBuilder);

    // Mock updateUser
    mockSupabase.auth.updateUser.mockResolvedValue({ error: null });

    const updates = { full_name: 'Timeout Name' };
    
    await expect(authService.updateProfile(updates)).rejects.toThrow('Update profile timed out after 10s');
  }, 20000);

  test('should fail if no user logged in', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    await expect(authService.updateProfile({})).rejects.toThrow('No user logged in');
  });
});
