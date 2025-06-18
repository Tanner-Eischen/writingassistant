import React, { useEffect } from 'react'
import { useAuthStore } from './hooks/useAuthStore'
import DashboardPage from './pages/dashboard'
import LoginPage from './pages/login'

function App() {
  const { user, loading, initialized, initialize } = useAuthStore()

  // Add diagnostic logging
  useEffect(() => {
    console.log('🔍 App Environment Check:')
    console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL)
    console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Present' : 'MISSING')
  }, [])

  // Initialize authentication on app startup
  useEffect(() => {
    initialize()
  }, [initialize])

  // Show loading spinner while initializing
  if (!initialized || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show login page if user is not authenticated
  if (!user) {
    return <LoginPage />
  }

  // Show dashboard if user is authenticated
  return <DashboardPage />
}

export default App