import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL = "https://vodjxhmlfyduluskpisc.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvZGp4aG1sZnlkdWx1c2twaXNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMzkyMzYsImV4cCI6MjEwMDcxNTIzNn0.dS9eyRG8oFErSMqbHhHpBoE9hLU9jAydRRIc5UtNDMg";
export const AUTH_CALLBACK_URL = "logdd://auth/callback";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    flowType: "pkce",
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storageKey: "logdd-supabase-auth",
  },
});
