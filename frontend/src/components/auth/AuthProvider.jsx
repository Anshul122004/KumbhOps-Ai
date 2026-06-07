import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { getCurrentProfile, logout as logoutUser } from "../../services/authService";

const AuthContext = createContext(null);

const initialState = {
  loading: true,
  error: null,
  session: null,
  user: null,
  profile: null,
};

export function AuthProvider({ children }) {
  const [state, setState] = useState(initialState);

  useEffect(() => {
    let mounted = true;

    async function syncSession(session) {
      try {
        const profile = await getCurrentProfile(session?.user?.id);

        if (mounted) {
          setState({
            loading: false,
            error: null,
            session,
            user: session?.user ?? null,
            profile,
          });
        }
      } catch (error) {
        if (mounted) {
          setState({
            loading: false,
            error,
            session,
            user: session?.user ?? null,
            profile: null,
          });
        }
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      syncSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      syncSession(session);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      refreshProfile: async () => {
        const profile = await getCurrentProfile(state.user?.id);
        setState((current) => ({ ...current, profile }));
        return profile;
      },
      logout: logoutUser,
    }),
    [state],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used inside AuthProvider.");
  }
  return context;
}
