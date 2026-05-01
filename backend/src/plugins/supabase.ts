import { createClient, SupabaseClient } from '@supabase/supabase-js';
import 'dotenv/config';

let supabase: SupabaseClient;

export function getSupabase(): SupabaseClient {
  if (!supabase) {
    const url = process.env.SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_KEY!;
    if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY must be set');
    supabase = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
  }
  return supabase;
}
