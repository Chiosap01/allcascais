// src/supabase.ts
import { createClient } from "@supabase/supabase-js";

VITE_SUPABASE_URL = "https://wfdafaaajtemwtupsvws.supabase.co";
VITE_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmZGFmYWFhanRlbXd0dXBzdndzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzMDE4MjAsImV4cCI6MjA3OTg3NzgyMH0.I2X2COdY8HH5iWE9vU_Jjd59FIKuTWVDfFXZbVfhP3s";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
