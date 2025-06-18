import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginPage from '../../pages/login'
import { useAuthStore } from '../../hooks/useAuthStore'

// Mock the auth store
vi.mock('../../hooks/useAuthStore')

const mockUseAuthStore = useAuthStore as any

describe('LoginPage', () => {
  const mockSignIn = vi.fn()
  const mockSignUp = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuthStore.mockReturnValue({
      signIn: mockSignIn,
      signUp: mockSignUp,
      loading: false,
    })
  })

  it('should render login form by default', () => {
    render(<LoginPage />)

    expect(screen.getByText('Sign in to your account')).toBeInTheDocument()
    expect(screen.getByLabelText('Email address')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
  })

  it('should toggle to sign up form', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)

    await user.click(screen.getByText("Don't have an account? Sign up"))

    expect(screen.getByText('Create your account')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument()
  })

  it('should handle successful sign in', async () => {
    const user = userEvent.setup()
    mockSignIn.mockResolvedValue({ success: true })

    render(<LoginPage />)

    await user.type(screen.getByLabelText('Email address'), 'test@example.com')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Sign In' }))

    expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123')
  })

  it('should handle sign in errors', async () => {
    const user = userEvent.setup()
    mockSignIn.mockResolvedValue({ success: false, error: 'Invalid credentials' })

    render(<LoginPage />)

    await user.type(screen.getByLabelText('Email address'), 'test@example.com')
    await user.type(screen.getByLabelText('Password'), 'wrongpassword')
    await user.click(screen.getByRole('button', { name: 'Sign In' }))

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
  })

  it('should handle successful sign up', async () => {
    const user = userEvent.setup()
    mockSignUp.mockResolvedValue({ success: true })

    render(<LoginPage />)

    // Switch to sign up mode
    await user.click(screen.getByText("Don't have an account? Sign up"))

    await user.type(screen.getByLabelText('Email address'), 'newuser@example.com')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.type(screen.getByLabelText('Confirm Password'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Create Account' }))

    expect(mockSignUp).toHaveBeenCalledWith('newuser@example.com', 'password123')
    
    await waitFor(() => {
      expect(screen.getByText('Account created! Please check your email to verify your account.')).toBeInTheDocument()
    })
  })

  it('should validate password confirmation', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)

    // Switch to sign up mode
    await user.click(screen.getByText("Don't have an account? Sign up"))

    await user.type(screen.getByLabelText('Email address'), 'test@example.com')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.type(screen.getByLabelText('Confirm Password'), 'differentpassword')
    await user.click(screen.getByRole('button', { name: 'Create Account' }))

    expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
    expect(mockSignUp).not.toHaveBeenCalled()
  })

  it('should validate minimum password length', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)

    await user.type(screen.getByLabelText('Email address'), 'test@example.com')
    await user.type(screen.getByLabelText('Password'), '123')
    await user.click(screen.getByRole('button', { name: 'Sign In' }))

    expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument()
    expect(mockSignIn).not.toHaveBeenCalled()
  })

  it('should show loading state during authentication', async () => {
    mockUseAuthStore.mockReturnValue({
      signIn: mockSignIn,
      signUp: mockSignUp,
      loading: true,
    })

    render(<LoginPage />)

    expect(screen.getByText('Please wait...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Please wait...' })).toBeDisabled()
  })
}) 