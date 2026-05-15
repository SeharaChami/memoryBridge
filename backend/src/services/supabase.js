import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    "Warning: SUPABASE_URL and a Supabase key (SERVICE_ROLE or ANON) must be set for database access."
  );
}

export const supabase = createClient(supabaseUrl || "", supabaseKey || "", {
  auth: { persistSession: false, autoRefreshToken: false },
});
