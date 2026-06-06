import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
  console.warn("Missing Supabase backend environment variables.");
}

export const supabaseAdmin = createClient(
  env.supabaseUrl ?? "",
  env.supabaseServiceRoleKey ?? "",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);
