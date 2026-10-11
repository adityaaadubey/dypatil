import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://swqtnppqvaefarnhllsb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_w4n2NRCEGxuHShijc2k10Q_3HwOu1Qx';

export const supabaseServer = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export async function testSupabaseServerHealth(): Promise<{ connected: boolean; latencyMs: number; error?: string }> {
  const t0 = Date.now();
  try {
    const { error } = await supabaseServer.from('users').select('id').limit(1);
    const latencyMs = Date.now() - t0;
    if (error) {
      return { connected: false, latencyMs, error: error.message };
    }
    return { connected: true, latencyMs };
  } catch (err: any) {
    return { connected: false, latencyMs: Date.now() - t0, error: err.message };
  }
}
