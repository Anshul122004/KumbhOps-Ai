import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const initialState = {
  loading: true,
  session: null,
  user: null,
  profile: null,
};

export function useAuth() {
  const [state, setState] = useState(initialState);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      const profile = await loadProfile(session?.user?.id);

      if (mounted) {
        setState({
          loading: false,
          session,
          user: session?.user ?? null,
          profile,
        });
      }
    }

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const profile = await loadProfile(session?.user?.id);
        setState({
          loading: false,
          session,
          user: session?.user ?? null,
          profile,
        });
      },
    );

    loadSession();

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  return state;
}

async function loadProfile(userId) {
  if (!userId) return null;

  const { data, error } = await supabase
    .from("users")
    .select("id, email, role, full_name")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.warn("Unable to load user profile.", error.message);
    return null;
  }

  return data;
}
