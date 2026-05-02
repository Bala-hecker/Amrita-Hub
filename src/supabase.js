// src/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || "missing";
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || "missing";

if (supabaseUrl === "missing" || supabaseKey === "missing") {
  console.error("CRITICAL ERROR: Supabase URL or Key is missing from Environment Variables!");
}

// We will only create the client if the URL is valid, to prevent white-screen crashes
let supabaseInstance = null;
try {
  if (supabaseUrl !== "missing" && supabaseKey !== "missing") {
    supabaseInstance = createClient(supabaseUrl, supabaseKey);
  }
} catch (error) {
  console.error("CRITICAL ERROR: Failed to initialize Supabase client. LocalStorage might be corrupted.", error);
  // Optional: clear local storage if Supabase crashes on init
  if (typeof window !== 'undefined') {
    localStorage.clear();
    window.location.reload();
  }
}

export const supabase = supabaseInstance;
