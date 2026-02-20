import { createClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";
import { logger } from "@/lib/logger";

// Variables de entorno requeridas (sin valores placeholder para evitar confusiones)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Falla temprana y clara para facilitar diagnóstico de Testsprite y desarrollo
  const msg =
    "Supabase no configurado: define NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local";
  logger.error(msg);
  throw new Error(msg);
}

// Cliente Supabase para servidor (crear bajo demanda si se necesita)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Singleton de cliente en navegador
let supabaseClientInstance: ReturnType<typeof createBrowserClient> | null =
  null;

// Crear cliente Supabase para operaciones en cliente (patrón singleton)
export const createSupabaseClient = () => {
  if (!supabaseClientInstance) {
    supabaseClientInstance = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseClientInstance;
};

// TypeScript interfaces for our data models
export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Trip {
  id: string;
  user_id: string;
  title: string;
  origin: string;
  destination: string;
  departure_date: string;
  return_date?: string;
  airline?: string;
  flight_number?: string;
  confirmation_number?: string;
  status: "planned" | "confirmed" | "completed" | "cancelled";
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  trip_id?: string;
  title: string;
  amount: number;
  currency: string;
  category: string;
  date: string;
  description?: string;
  receipt_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  trip_id?: string;
  title: string;
  content: string;
  tags: string[];
  category?: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface Alert {
  id: string;
  user_id: string;
  trip_id?: string;
  title: string;
  message: string;
  alert_date: string;
  is_read: boolean;
  type: "reminder" | "warning" | "info";
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  user_id: string;
  trip_id?: string;
  type: "flight" | "hotel" | "car" | "activity" | "restaurant" | "other";
  title: string;
  description?: string;
  confirmation_number?: string;
  status: "confirmed" | "pending" | "cancelled";
  start_date: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  address?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  cost?: number;
  currency?: string;
  notes?: string;
  documents?: string[];
  created_at: string;
  updated_at: string;
}

export interface ItineraryActivity {
  id: string;
  user_id: string;
  trip_id?: string;
  date: string;
  title: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  address?: string;
  category?: string;
  cost?: number;
  currency?: string;
  notes?: string;
  completed: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  booking_id?: string;
  trip_id?: string;
  title: string;
  message: string;
  reminder_datetime: string;
  type: "booking" | "activity" | "general" | "document" | "payment";
  status: "pending" | "sent" | "dismissed";
  sent_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: string;
  user_id: string;
  trip_id?: string;
  booking_id?: string;
  activity_id?: string;
  title: string;
  description?: string;
  event_date: string;
  start_time?: string;
  end_time?: string;
  type: "trip" | "booking" | "activity" | "reminder" | "custom";
  color?: string;
  all_day: boolean;
  created_at: string;
  updated_at: string;
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

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  status: "pending" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  due_date?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Helper function to ensure user exists in public.users table
 * This fixes foreign key constraint issues when inserting into tables referencing public.users
 */
export async function ensureUserExists(supabase: any, user: any) {
  if (!user || !user.id) return;

  try {
    // Check if user exists in public.users
    const { data, error } = await supabase
      .from("users")
      .select("id")
      .eq("id", user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      // Real error, log it but don't throw yet, try insert anyway
      console.error("Error checking user existence:", error);
    }

    if (!data) {
      // User doesn't exist, insert it
      console.log("User missing in public.users, inserting...", user.id);
      
      const { error: insertError } = await supabase
        .from("users")
        .insert([{
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          avatar_url: user.user_metadata?.avatar_url || null,
          updated_at: new Date().toISOString()
        }]);
        
      if (insertError) {
        console.error("Error inserting user into public.users:", insertError);
        // If error is duplicate key, it means race condition, so it's fine
        if (!insertError.message.includes("duplicate key")) {
             throw insertError;
        }
      }
    }
  } catch (err) {
    console.error("Failed to ensure user exists:", err);
    // Don't block the flow, hope for the best or let the main insert fail with constraint error
  }
}
