// src/supabase.ts
import { createClient } from "@supabase/supabase-js";

// ✅ Fallbacks – same values you know are working
const FALLBACK_SUPABASE_URL = "https://wfdafaaajtemwtupsvws.supabase.co";
const FALLBACK_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmZGFmYWFhanRlbXd0dXBzdndzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzMDE4MjAsImV4cCI6MjA3OTg3NzgyMH0.I2X2COdY8HH5iWE9vU_Jjd59FIKuTWVDfFXZbVfhP3s";

// Try env vars first (for Vercel / proper local .env)
const supabaseUrl =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
  FALLBACK_SUPABASE_URL;

const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  FALLBACK_SUPABASE_ANON_KEY;

// Optional: log once so you can debug but don't crash the app
if (import.meta.env.DEV) {
  console.log("Supabase config in dev:", {
    supabaseUrl,
    anonKeyPresent: !!supabaseAnonKey,
    envKeys: Object.keys(import.meta.env),
  });
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
