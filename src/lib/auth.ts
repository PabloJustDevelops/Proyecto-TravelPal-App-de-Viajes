import { createSupabaseClient } from './supabase'
import { User } from '@supabase/supabase-js'

export interface AuthUser extends User {
  full_name?: string
  avatar_url?: string
}

export class AuthService {
  private supabase = createSupabaseClient()

  async signUp(email: string, password: string, fullName: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) throw error
    return data
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    return data
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut()
    if (error) throw error
  }

  async resetPassword(email: string) {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) throw error
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
    return this.supabase.auth.onAuthStateChange(async (event, session) => {
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