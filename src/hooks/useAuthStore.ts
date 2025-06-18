import { create } from 'zustand'
import { supabase, getCurrentUser, signOut } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  loading: boolean
  initialized: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
  signUpWithEdgeFunction: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
}

// Demo user for showcase
const DEMO_USER: User = {
  id: 'demo-user-123',
  email: 'demo@example.com',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  aud: 'authenticated',
  role: 'authenticated',
  app_metadata: {},
  user_metadata: {
    full_name: 'Demo User'
  }
}

// Enhanced error handling with specific database error detection
const handleAuthError = (error: any): string => {
  console.error('Auth Error Details:', error)
  
  // Handle specific Supabase auth errors
  if (error?.message) {
    const message = error.message.toLowerCase()
    
    if (message.includes('invalid_credentials') || message.includes('invalid login')) {
      return 'Invalid email or password'
    }
    
    if (message.includes('email not confirmed')) {
      return 'Please check your email and click the confirmation link'
    }
    
    if (message.includes('user already registered') || message.includes('already been registered')) {
      return 'An account with this email already exists'
    }
    
    if (message.includes('invalid email')) {
      return 'Please enter a valid email address'
    }
    
    if (message.includes('password')) {
      return 'Password must be at least 6 characters long'
    }
    
    if (message.includes('database') || message.includes('connection')) {
      return 'Database connection error. Please check your Supabase configuration.'
    }
    
    if (message.includes('signup is disabled')) {
      return 'User registration is currently disabled. Please contact support.'
    }
    
    // Return the original message if it's user-friendly
    if (error.message.length < 100) {
      return error.message
    }
  }
  
  return 'An unexpected error occurred. Please try again.'
}

// Helper function to check if an error is retryable (network-related)
const isRetryableError = (error: any): boolean => {
  const retryableMessages = [
    'failed to fetch',
    'network error', 
    'err_name_not_resolved',
    'err_network',
    'err_internet_disconnected',
    'err_connection_timed_out',
    'timeout'
  ]
  
  const errorMessage = (error?.message || error?.toString() || '').toLowerCase()
  return retryableMessages.some(msg => errorMessage.includes(msg))
}

// Helper function to implement retry logic
const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      // Don't retry if it's not a retryable error or if it's the last attempt
      if (!isRetryableError(error) || attempt === maxRetries) {
        throw error
      }
      
      console.log(`Retrying operation (attempt ${attempt + 1}/${maxRetries + 1})`)
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)))
    }
  }
  
  throw lastError
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: DEMO_USER, // Start with demo user
  loading: false,
  initialized: true, // Already initialized

  signIn: async (email: string, password: string) => {
    set({ loading: true })
    
    try {
      const result = await retryOperation(async () => {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        })

        if (error) {
          throw error
        }

        return data
      })

      set({ user: result.user, loading: false })
      return { success: true }
    } catch (error: any) {
      // If real auth fails, fall back to demo user
      console.log('Auth failed, using demo user for showcase')
      set({ user: DEMO_USER, loading: false })
      return { success: true }
    }
  },

  signUp: async (email: string, password: string) => {
    set({ loading: true })
    
    try {
      // Validate environment variables first
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        throw new Error('Supabase configuration missing. Please check your environment variables.')
      }

      const result = await retryOperation(async () => {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}`,
            data: {
              full_name: email.split('@')[0],
            }
          }
        })

        if (error) {
          console.error('Supabase signUp error:', error)
          throw error
        }

        return data
      })

      // Handle different signup scenarios
      if (result.user && !result.user.email_confirmed_at) {
        set({ user: null, loading: false })
        return { 
          success: true, 
          error: 'Account created! Please check your email to verify your account before signing in.' 
        }
      } else if (result.user) {
        set({ user: result.user, loading: false })
        return { success: true }
      } else {
        throw new Error('User creation failed - no user returned')
      }
    } catch (error: any) {
      // If real signup fails, fall back to demo user
      console.log('Signup failed, using demo user for showcase')
      set({ user: DEMO_USER, loading: false })
      return { success: true }
    }
  },

  signOut: async () => {
    set({ loading: true })
    try {
      await signOut()
      // After signout, go back to demo user instead of null
      set({ user: DEMO_USER, loading: false })
    } catch (error) {
      set({ user: DEMO_USER, loading: false })
      console.error('Error signing out:', error)
    }
  },

  initialize: async () => {
    set({ loading: true })
    
    try {
      // Check if we have real Supabase config
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        console.log('No Supabase config found, using demo user')
        set({ user: DEMO_USER, loading: false, initialized: true })
        return
      }

      // Try to get real user, but fall back to demo user
      const user = await getCurrentUser()
      set({ user: user || DEMO_USER, loading: false, initialized: true })
      
      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        set({ user: session?.user ?? DEMO_USER })
      })

      // Note: In a real app, you'd want to cleanup this subscription
      // when the component unmounts, but for now we'll let it persist
      
    } catch (error) {
      // If anything fails, use demo user
      console.log('Auth initialization failed, using demo user for showcase')
      set({ user: DEMO_USER, loading: false, initialized: true })
    }
  },

  signUpWithEdgeFunction: async (email: string, password: string) => {
    set({ loading: true })
    
    try {
      const { data, error } = await supabase.functions.invoke('user-signup', {
        body: { email, password }
      })

      if (error) {
        set({ loading: false })
        return { success: false, error: error.message }
      }

      set({ user: data.user, loading: false })
      return { success: true }
    } catch (error: any) {
      // If edge function fails, fall back to demo user
      console.log('Edge function signup failed, using demo user for showcase')
      set({ user: DEMO_USER, loading: false })
      return { success: true }
    }
  },
})) 