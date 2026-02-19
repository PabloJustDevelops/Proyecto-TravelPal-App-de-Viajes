'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
}

export default function ProtectedRoute({ 
  children, 
  redirectTo = '/signin' 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      // Use replace instead of push to avoid back button issues
      router.replace(redirectTo)
    }
  }, [user, loading, router, redirectTo])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    // Si no hay usuario pero tampoco estamos cargando, significa que estamos redirigiendo.
    // Mostrar un estado vacío o un spinner ligero para evitar el flash de "pantalla blanca" total.
    return null;
  }

  return <>{children}</>
}