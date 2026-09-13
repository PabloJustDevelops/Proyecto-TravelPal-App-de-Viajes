// Archivo de uso exclusivo en servidor: crea cliente Supabase con Service Role
import { createClient } from '@supabase/supabase-js'
import { serverEnv } from './env'

export function getSupabaseAdmin() {
  if (typeof window !== 'undefined') {
    throw new Error('Supabase admin no disponible en cliente: uso sólo servidor')
  }

  return createClient(
    serverEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY,
  )
}
