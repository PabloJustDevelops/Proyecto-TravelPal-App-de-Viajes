'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { AuthUser, authService as defaultAuthService } from '@/lib/auth'
import { logger as defaultLogger } from '@/lib/logger'
import { getErrorMessage } from '@/lib/utils'

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateProfile: (updates: { full_name?: string; avatar_url?: string }) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

type AuthProviderDeps = {
  authService?: typeof defaultAuthService
  logger?: typeof defaultLogger
}
export function AuthProvider({ children, deps }: { children: React.ReactNode; deps?: AuthProviderDeps }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const authService = deps?.authService ?? defaultAuthService
  const logger = deps?.logger ?? defaultLogger

  useEffect(() => {
    logger.debug('AuthContext: Inicializando useEffect')
    // Get initial user
    authService.getCurrentUser().then((user) => {
      logger.debug('AuthContext: Usuario inicial obtenido:', user)
      setUser(user)
      setLoading(false)
    })

    // Listen for auth changes
    logger.debug('AuthContext: Configurando listener de cambios de auth')
    const { data: { subscription } } = authService.onAuthStateChange((user) => {
      logger.debug('AuthContext: Cambio de estado de auth:', user)
      setUser(user)
      setLoading(false)
    })

    return () => {
      logger.debug('AuthContext: Limpiando subscription')
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    logger.info('AuthContext: Iniciando signIn')
    setLoading(true)
    try {
      const result = await authService.signIn(email, password)
      logger.info('AuthContext: signIn exitoso', result)
      // No establecer loading a false aquí, dejar que onAuthStateChange lo maneje
    } catch (err: unknown) {
      const message = getErrorMessage(err)
      logger.error('AuthContext: Error en signIn', { error: message })
      setLoading(false)
      throw err
    }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    setLoading(true)
    try {
      await authService.signUp(email, password, fullName)
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      await authService.signOut()
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    await authService.resetPassword(email)
  }

  const updateProfile = async (updates: { full_name?: string; avatar_url?: string }) => {
    await authService.updateProfile(updates)
    // Refresh user data
    const updatedUser = await authService.getCurrentUser()
    setUser(updatedUser)
  }

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}