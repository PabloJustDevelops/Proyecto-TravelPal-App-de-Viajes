import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

// Environment variables with fallbacks for development
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// Create Supabase client for server-side operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Create Supabase client for client-side operations
export const createSupabaseClient = () => {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// TypeScript interfaces for our data models
export interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Trip {
  id: string
  user_id: string
  title: string
  origin: string
  destination: string
  departure_date: string
  return_date?: string
  airline?: string
  flight_number?: string
  status: 'planned' | 'confirmed' | 'completed' | 'cancelled'
  notes?: string
  created_at: string
  updated_at: string
}

export interface Expense {
  id: string
  user_id: string
  trip_id?: string
  title: string
  amount: number
  currency: string
  category: string
  date: string
  description?: string
  receipt_url?: string
  created_at: string
  updated_at: string
}

export interface Note {
  id: string
  user_id: string
  trip_id?: string
  title: string
  content: string
  tags: string[]
  category?: string
  is_favorite: boolean
  created_at: string
  updated_at: string
}

export interface Alert {
  id: string
  user_id: string
  trip_id?: string
  title: string
  message: string
  alert_date: string
  is_read: boolean
  type: 'reminder' | 'warning' | 'info'
  created_at: string
  updated_at: string
}

// Extended interfaces with relations
export interface NoteWithTrip extends Note {
  trip?: {
    title: string;
  };
}

export interface ExpenseWithTrip extends Expense {
  trip?: {
    title: string;
  };
  notes?: string;
}