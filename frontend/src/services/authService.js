import { isSupabaseConfigured, supabase } from "../lib/supabase";

function assertSupabaseConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to frontend/.env.");
  }
}

export async function registerVolunteer({ fullName, email, password }) {
  assertSupabaseConfigured();

  const normalizedEmail = email.trim().toLowerCase();

  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: {
        full_name: fullName.trim(),
        role: "volunteer",
      },
    },
  });

  if (error) throw error;

  const user = data.user;
  if (!user) {
    throw new Error("Supabase did not return a user. Check email confirmation settings.");
  }

  const { error: profileError } = await supabase.from("users").upsert({
    id: user.id,
    email: normalizedEmail,
    role: "volunteer",
  });

  if (profileError) throw profileError;

  return data;
}

export async function loginWithRole({ email, password, expectedRole }) {
  assertSupabaseConfigured();

  const normalizedEmail = email.trim().toLowerCase();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (error) throw error;

  const profile = await getCurrentProfile(data.user.id);

  if (!profile) {
    await supabase.auth.signOut();
    throw new Error("No profile was found for this account.");
  }

  if (profile.role !== expectedRole) {
    await supabase.auth.signOut();
    throw new Error(`This account is registered as ${profile.role}, not ${expectedRole}.`);
  }

  return { session: data.session, user: data.user, profile };
}

export async function getCurrentProfile(userId) {
  if (!userId) return null;

  const { data, error } = await supabase
    .from("users")
    .select("id, email, role, created_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;

  return data;
}

export async function logout() {
  assertSupabaseConfigured();

  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
