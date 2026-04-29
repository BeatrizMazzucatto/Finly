import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { login as loginService } from "@/src/services/auth";
import type { User } from "@/src/types/api";

const AUTH_STORAGE_KEY = "finly_auth_user";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      try {
        const cachedUser = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (cachedUser) {
          setUser(JSON.parse(cachedUser) as User);
        }
      } finally {
        setLoading(false);
      }
    }

    restoreSession();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login: async (email: string, senha: string) => {
        const authenticatedUser = await loginService({ email, senha });
        await AsyncStorage.setItem(
          AUTH_STORAGE_KEY,
          JSON.stringify(authenticatedUser)
        );
        setUser(authenticatedUser);
      },
      logout: async () => {
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
        setUser(null);
      },
    }),
    [loading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }
  return context;
}
