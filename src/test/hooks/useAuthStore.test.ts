import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAuthStore } from '../../hooks/useAuthStore'
import { supabase } from '../../lib/supabase'

// Mock Supabase
vi.mock('../../lib/supabase')

const mockSupabase = supabase as {
  auth: {
    signInWithPassword: Mock
    signUp: Mock
    signOut: Mock
    getUser: Mock
    onAuthStateChange: Mock
  }
}

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset store state
    useAuthStore.setState({
      user: null,
      loading: false,
      initialized: false,
    })

    // Reset all mocks
    vi.clearAllMocks()
  })

  describe('signIn', () => {
    it('should successfully sign in a user', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const { result } = renderHook(() => useAuthStore())

      await act(async () => {
        const response = await result.current.signIn('test@example.com', 'password123')
        expect(response.success).toBe(true)
        expect(result.current.user).toEqual(mockUser)
        expect(result.current.loading).toBe(false)
      })

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })

    it('should handle sign in errors', async () => {
      const mockError = { message: 'Invalid credentials' }
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: mockError,
      })

      const { result } = renderHook(() => useAuthStore())

      await act(async () => {
        const response = await result.current.signIn('test@example.com', 'wrongpassword')
        expect(response.success).toBe(false)
        expect(response.error).toBe('Invalid credentials')
        expect(result.current.user).toBeNull()
        expect(result.current.loading).toBe(false)
      })
    })

    it('should retry on network errors', async () => {
      const networkError = new Error('Failed to fetch')
      mockSupabase.auth.signInWithPassword
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValue({
          data: { user: { id: '123', email: 'test@example.com' } },
          error: null,
        })

      const { result } = renderHook(() => useAuthStore())

      await act(async () => {
        const response = await result.current.signIn('test@example.com', 'password123')
        expect(response.success).toBe(true)
      })

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledTimes(3)
    })
  })

  describe('signUp', () => {
    it('should successfully sign up a user', async () => {
      const mockUser = { id: '456', email: 'newuser@example.com' }
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const { result } = renderHook(() => useAuthStore())

      await act(async () => {
        const response = await result.current.signUp('newuser@example.com', 'password123')
        expect(response.success).toBe(true)
        expect(result.current.user).toEqual(mockUser)
        expect(result.current.loading).toBe(false)
      })

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'password123',
      })
    })

    it('should handle sign up errors', async () => {
      const mockError = { message: 'Email already registered' }
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: mockError,
      })

      const { result } = renderHook(() => useAuthStore())

      await act(async () => {
        const response = await result.current.signUp('existing@example.com', 'password123')
        expect(response.success).toBe(false)
        expect(response.error).toBe('Email already registered')
        expect(result.current.user).toBeNull()
      })
    })
  })

  describe('signOut', () => {
    it('should successfully sign out a user', async () => {
      // Set initial user state
      useAuthStore.setState({ user: { id: '123', email: 'test@example.com' } })

      mockSupabase.auth.signOut.mockResolvedValue({ error: null })

      const { result } = renderHook(() => useAuthStore())

      await act(async () => {
        await result.current.signOut()
        expect(result.current.user).toBeNull()
        expect(result.current.loading).toBe(false)
      })

      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
    })
  })

  describe('initialize', () => {
    it('should initialize auth state and set up auth listener', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      const mockGetCurrentUser = vi.fn().mockResolvedValue(mockUser)
      
      // Mock the getCurrentUser import
      vi.doMock('../../lib/supabase', () => ({
        supabase: mockSupabase,
        getCurrentUser: mockGetCurrentUser,
      }))

      mockSupabase.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } }
      })

      const { result } = renderHook(() => useAuthStore())

      await act(async () => {
        await result.current.initialize()
      })

      expect(result.current.initialized).toBe(true)
      expect(result.current.loading).toBe(false)
      expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalled()
    })
  })
}) 