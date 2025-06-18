import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import App from '../App'
import { useAuthStore } from '../hooks/useAuthStore'

// Mock the auth store
vi.mock('../hooks/useAuthStore')
vi.mock('../pages/dashboard', () => ({
  default: () => <div data-testid="dashboard">Dashboard Page</div>
}))
vi.mock('../pages/login', () => ({
  default: () => <div data-testid="login">Login Page</div>
}))

const mockUseAuthStore = useAuthStore as any

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show loading spinner when initializing', () => {
    mockUseAuthStore.mockReturnValue({
      user: null,
      loading: true,
      initialized: false,
      initialize: vi.fn(),
    })

    render(<App />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { hidden: true })).toBeInTheDocument()
  })

  it('should show loading spinner when not initialized', () => {
    mockUseAuthStore.mockReturnValue({
      user: null,
      loading: false,
      initialized: false,
      initialize: vi.fn(),
    })

    render(<App />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('should show login page when user is not authenticated', async () => {
    mockUseAuthStore.mockReturnValue({
      user: null,
      loading: false,
      initialized: true,
      initialize: vi.fn(),
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByTestId('login')).toBeInTheDocument()
    })
  })

  it('should show dashboard when user is authenticated', async () => {
    mockUseAuthStore.mockReturnValue({
      user: { id: 'test-user', email: 'test@example.com' },
      loading: false,
      initialized: true,
      initialize: vi.fn(),
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByTestId('dashboard')).toBeInTheDocument()
    })
  })

  it('should call initialize on mount', () => {
    const mockInitialize = vi.fn()
    mockUseAuthStore.mockReturnValue({
      user: null,
      loading: true,
      initialized: false,
      initialize: mockInitialize,
    })

    render(<App />)

    expect(mockInitialize).toHaveBeenCalledOnce()
  })
}) 