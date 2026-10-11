import { createClient } from '@supabase/supabase-js';

// Supabase Project configuration
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://swqtnppqvaefarnhllsb.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_w4n2NRCEGxuHShijc2k10Q_3HwOu1Qx';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('model_registry').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}
