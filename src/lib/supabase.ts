import { createClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/public-env";

// TEMPORAL (etapa 3): este módulo sólo alimenta la auth de cliente que aún
// vive en Supabase. La capa de datos ya usa `@/lib/insforge`. Se eliminará al
// migrar la auth a InsForge.
const supabaseUrl = publicEnv.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

let supabaseClientInstance: ReturnType<typeof createBrowserClient> | null =
  null;

export const createSupabaseClient = () => {
  if (!supabaseClientInstance) {
    supabaseClientInstance = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseClientInstance;
};
