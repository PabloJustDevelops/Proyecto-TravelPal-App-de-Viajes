import { createSupabaseClient } from './supabase'
import { User, type AuthChangeEvent, type Session } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'
import { getErrorMessage } from '@/lib/utils'

export interface AuthUser extends User {
  full_name?: string
  avatar_url?: string
  bio?: string
  phone?: string
  location?: string
  website?: string
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
    try {
      logger.debug('AuthService: Getting current user...');
      // Timeout for getUser to avoid hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('getUser timed out')), 5000)
      );
      
      const getUserPromise = this.supabase.auth.getUser();
      const { data: { user }, error } = await Promise.race([getUserPromise, timeoutPromise]) as any;
      
      if (error || !user) {
        if (error) logger.debug('AuthService: Error obteniendo usuario (esperado si no hay sesión):', error.message)
        return null
      }

      // Get additional user data from our profiles table
      // Usamos maybeSingle para no lanzar error si no existe perfil aun
      const { data: userData, error: dbError } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle() 

      if (dbError) {
        logger.warn('AuthService: Error obteniendo datos extra del usuario:', dbError.message)
        // Retornamos el usuario básico aunque falle la DB
      }

      logger.debug('AuthService: User retrieved successfully', { id: user.id });
      return {
        ...user,
        full_name: userData?.full_name,
        avatar_url: userData?.avatar_url,
        bio: userData?.bio,
        phone: userData?.phone,
        location: userData?.location,
        website: userData?.website,
      }
    } catch (err) {
      logger.error('AuthService: Excepción inesperada en getCurrentUser:', err)
      return null
    }
  }

  async updateProfile(updates: { full_name?: string; avatar_url?: string; bio?: string; phone?: string; location?: string; website?: string }) {
    logger.info('AuthService: Updating profile...', updates)
    
    let user;
    try {
        user = await this.getCurrentUser()
    } catch (e) {
        logger.error('AuthService: Failed to get user for update', e);
        throw new Error('Could not verify current session');
    }

    if (!user) {
      logger.error('AuthService: Update failed - No user logged in')
      throw new Error('No user logged in')
    }

    // Add timeout to prevent infinite hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Update profile timed out after 10s')), 10000)
    );

    try {
      // 1. Update auth metadata
      const updateAuthPromise = this.supabase.auth.updateUser({
        data: {
          full_name: updates.full_name,
          avatar_url: updates.avatar_url,
        },
      });

      // 2. Update profiles table
      const updateDbPromise = this.supabase
        .from('profiles')
        .upsert({
          id: user.id,
          updated_at: new Date().toISOString(),
          ...updates,
        });

      // Execute both in parallel with timeout
      const [authResult, dbResult] = await Promise.race([
        Promise.all([updateAuthPromise, updateDbPromise]),
        timeoutPromise
      ]) as [any, any];

      if (authResult.error) {
        logger.error('AuthService: Auth metadata update failed', authResult.error)
        throw authResult.error
      }

      if (dbResult.error) {
        logger.error('AuthService: Profile DB update failed', dbResult.error)
        throw dbResult.error
      }

      logger.info('AuthService: Profile updated successfully')
    } catch (error) {
      logger.error('AuthService: Profile update exception', error)
      throw error
    }
  }

  async uploadAvatar(file: File): Promise<string> {
    logger.info('AuthService: Uploading avatar...', { fileName: file.name, size: file.size })
    const user = await this.getCurrentUser()
    if (!user) throw new Error('No user logged in')

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${fileName}`

    // Add timeout for upload
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Avatar upload timed out after 30s')), 30000)
    );

    try {
      const uploadPromise = this.supabase.storage
        .from('avatars')
        .upload(filePath, file);

      const { error: uploadError } = await Promise.race([uploadPromise, timeoutPromise]) as any;

      if (uploadError) {
        logger.error('AuthService: Error uploading avatar:', uploadError)
        throw uploadError
      }

      const { data } = this.supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      logger.info('AuthService: Avatar uploaded successfully', { publicUrl: data.publicUrl })
      return data.publicUrl
    } catch (error) {
      logger.error('AuthService: Avatar upload exception', error)
      throw error
    }
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