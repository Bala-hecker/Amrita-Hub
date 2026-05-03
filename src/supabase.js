// src/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || "missing";
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || "missing";

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,   // automatically refresh the token before it expires
    persistSession: true,      // keep the session across page closes
    detectSessionInUrl: true,  // pick up tokens from confirmation/magic links in the URL
  },
});
