import { createSupabaseClient } from './supabase'
import { User, type AuthChangeEvent, type Session } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'
import { getErrorMessage } from '@/lib/utils'

export interface AuthUser extends User {
  full_name?: string
  avatar_url?: string
}

export class AuthService {
  private supabase = createSupabaseClient()

  async signUp(email: string, password: string, fullName: string) {
    logger.info('AuthService: Iniciando signUp con email:', email)
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        // Deshabilitar confirmación de email para desarrollo
        emailRedirectTo: undefined,
      },
    })

    logger.debug('AuthService: Respuesta de signUp:', { data, error })
    if (error) {
      logger.error('AuthService: Error en signUp:', { error: getErrorMessage(error) })
      throw error
    }
    return data
  }

  async signIn(email: string, password: string) {
    logger.info('AuthService: Iniciando signIn con email:', email)
    
    try {
      logger.debug('AuthService: Llamando a supabase.auth.signInWithPassword...')
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      })

      logger.debug('AuthService: Respuesta de signIn completa:', { 
        data: data ? {
          user: data.user ? { id: data.user.id, email: data.user.email } : null,
          session: data.session ? 'session_exists' : null
        } : null, 
        error: error ? { message: error.message, status: error.status } : null 
      })
      
      if (error) {
        logger.error('AuthService: Error en signIn:', { error: getErrorMessage(error) })
        throw new Error(`Error de autenticación: ${error.message}`)
      }
      
      if (!data.user) {
        logger.error('AuthService: No se obtuvo usuario después del signIn')
        throw new Error('No se pudo autenticar el usuario')
      }
      
      logger.info('AuthService: signIn completado exitosamente')
      return data
    } catch (err: unknown) {
      logger.error('AuthService: Excepción en signIn:', { error: getErrorMessage(err) })
      throw err
    }
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut()
    if (error) throw error
  }

  async resetPassword(email: string) {
    // Validar formato de email antes de enviar la solicitud
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new Error('El formato del email no es válido')
    }

    // Normalizar el email (trim y lowercase)
    const normalizedEmail = email.trim().toLowerCase()

    const { error } = await this.supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      logger.error('AuthService: Error en resetPassword:', { error: getErrorMessage(error) })
      // Proporcionar mensajes de error más específicos
      if (error.message.includes('invalid')) {
        throw new Error('El email proporcionado no es válido')
      } else if (error.message.includes('not found')) {
        throw new Error('No se encontró una cuenta con este email')
      } else {
        throw new Error(`Error al enviar email de recuperación: ${error.message}`)
      }
    }
  }

  async updatePassword(password: string) {
    const { error } = await this.supabase.auth.updateUser({
      password,
    })

    if (error) throw error
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    const { data: { user }, error } = await this.supabase.auth.getUser()
    
    if (error || !user) return null

    // Get additional user data from our users table
    const { data: userData } = await this.supabase
      .from('users')
      .select('full_name, avatar_url')
      .eq('id', user.id)
      .single()

    return {
      ...user,
      full_name: userData?.full_name,
      avatar_url: userData?.avatar_url,
    }
  }

  async updateProfile(updates: { full_name?: string; avatar_url?: string }) {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('No user logged in')

    // Update auth metadata
    const { error: authError } = await this.supabase.auth.updateUser({
      data: updates,
    })

    if (authError) throw authError

    // Update users table
    const { error: dbError } = await this.supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)

    if (dbError) throw dbError
  }

  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return this.supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (session?.user) {
        const user = await this.getCurrentUser()
        callback(user)
      } else {
        callback(null)
      }
    })
  }
}

export const authService = new AuthService()