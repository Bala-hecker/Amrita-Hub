// src/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || "missing";
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || "missing";

if (supabaseUrl === "missing" || supabaseKey === "missing") {
  console.error("CRITICAL ERROR: Supabase URL or Key is missing from Environment Variables!");
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,      // automatically refresh the token before it expires
    persistSession: true,         // keep the session in localStorage
    detectSessionInUrl: true,     // pick up the token from confirmation/magic links in the URL
    storageKey: "amritahub-auth", // use a unique storage key so nothing else can wipe it
  },
});
