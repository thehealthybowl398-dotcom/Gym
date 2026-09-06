import { createClient } from '@supabase/supabase-js';

// Supabase Configuration
export const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || "https://qbgdhjwapdigmsimqctm.supabase.co";
export const SUPABASE_SECRET_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || "sb_publishable_2XCMMAOQHIL6mSuhsc6Awg_rkcPlMj2";

export const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});


