// src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper: Generate couple_id (same for both partners)
export function generateCoupleId(userId, partnerId) {
  const [a, b] = [userId, partnerId].sort();
  return require('crypto').createHash('sha256').update(a + b).digest('hex');
}
