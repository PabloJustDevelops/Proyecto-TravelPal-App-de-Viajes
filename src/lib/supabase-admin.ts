// Archivo de uso exclusivo en servidor: crea cliente Supabase con Service Role
import { createClient } from '@supabase/supabase-js'
import { logger } from './logger'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  logger.error('Supabase admin: falta NEXT_PUBLIC_SUPABASE_URL en entorno')
}

export function getSupabaseAdmin() {
  if (typeof window !== 'undefined') {
    throw new Error('Supabase admin no disponible en cliente: uso sólo servidor')
  }
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Config de Supabase incompleta: URL o Service Role no definidos')
  }
  return createClient(supabaseUrl, serviceRoleKey)
}