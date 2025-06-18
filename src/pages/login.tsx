import React, { useState } from 'react'
import { useAuthStore } from '../hooks/useAuthStore'

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const { signIn, signUp, loading } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Client-side validation
    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }

    if (!email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email address')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (isSignUp && password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    try {
      const result = isSignUp 
        ? await signUp(email, password)
        : await signIn(email, password)

      if (result.success) {
        if (isSignUp) {
          setSuccess(result.error || 'Account created successfully!')
          // Clear form on successful signup
          setEmail('')
          setPassword('')
          setConfirmPassword('')
        }
        // Navigation will be handled by the auth state change
      } else {
        setError(result.error || 'Authentication failed')
      }
    } catch (error) {
      console.error('Authentication error:', error)
      setError('An unexpected error occurred. Please try again.')
    }
  }

  // Environment check warning
  const showEnvWarning = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Writing Assistant</h1>
          <h2 className="mt-6 text-2xl font-semibold text-gray-900">
            {isSignUp ? 'Create your account' : 'Sign in to your account'}
          </h2>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Environment Configuration Warning */}
          {showEnvWarning && (
            <div className="mb-6 rounded-md bg-yellow-50 p-4">
              <div className="text-sm text-yellow-700">
                <strong>⚠️ Configuration Required:</strong>
                <br />
                Please create a <code>.env.local</code> file with your Supabase credentials:
                <pre className="mt-2 text-xs bg-yellow-100 p-2 rounded">
{`VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key`}
                </pre>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter your email"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter your password"
                  disabled={loading}
                />
              </div>
            </div>

            {isSignUp && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="mt-1">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Confirm your password"
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            {success && (
              <div className="rounded-md bg-green-50 p-4">
                <div className="text-sm text-green-700">{success}</div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading || showEnvWarning}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Please wait...
                  </div>
                ) : (
                  isSignUp ? 'Create Account' : 'Sign In'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp)
                  setError('')
                  setSuccess('')
                  setPassword('')
                  setConfirmPassword('')
                }}
                className="text-sm text-blue-600 hover:text-blue-500"
                disabled={loading}
              >
                {isSignUp 
                  ? 'Already have an account? Sign in' 
                  : "Don't have an account? Sign up"
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 