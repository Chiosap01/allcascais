// src/context/AuthContext.tsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
  type FC,
} from "react";
import { supabase } from "../supabase";

type AuthUser = {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;

  // Add these ↓
  profile_image_url?: string | null;
  phone?: string | null;
  languages?: string[] | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  // you can add refreshUser if you need later
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const mapSupabaseUser = (sbUser: any): AuthUser => {
    const meta = sbUser?.user_metadata || {};
    return {
      id: sbUser.id,
      email: sbUser.email ?? "",
      first_name: meta.first_name,
      last_name: meta.last_name,

      // Add these ↓ so they come from auth metadata
      profile_image_url: meta.profile_image_url ?? null,
      phone: meta.phone ?? null,
      languages: meta.languages ?? null,
    };
  };

  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(mapSupabaseUser(session.user));
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(mapSupabaseUser(session.user));
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};
