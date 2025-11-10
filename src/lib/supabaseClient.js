// src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper: Get current user's profile
export async function getMyProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) throw error;
  return data;
}

// Helper: Get partner profile
export async function getPartnerProfile() {
  const profile = await getMyProfile();
  if (!profile?.partner_id) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name')
    .eq('id', profile.partner_id)
    .single();

  if (error) throw error;
  return data;
}

// Helper: Generate couple_id hash (same for both partners)
export function generateCoupleId(userId, partnerId) {
  const [a, b] = [userId, partnerId].sort();
  const hash = require('crypto').createHash('sha256').update(a + b).digest('hex');
  return hash;
}
