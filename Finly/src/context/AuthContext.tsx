import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { login as loginService } from "@/src/services/auth";
import { User } from "../types/api";
import { API_BASE_URL } from "@/src/services/api";

const AUTH_STORAGE_KEY = "finly_auth_user";

export const GUEST_USER: User = {
  id_usuario: 1,
  nome: "Lucas Silva",
  email: "lucas.silva@email.com",
};

interface AuthContextValue {
  user: User;
  loading: boolean;
  login: (email: string, senha: string) => Promise<User>;
  logout: () => Promise<void>;
  updateUser: (newUser: User) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(GUEST_USER);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      try {
        const cachedUser = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (cachedUser) {
          const parsedUser = JSON.parse(cachedUser) as User;
          setUser(parsedUser);

          // Force sync with server if it's a real user
          if (parsedUser.id_usuario !== 1) {
            try {
              const res = await fetch(`${API_BASE_URL}/usuarios/${parsedUser.id_usuario}`);
              if (res.ok) {
                const freshUser = await res.json();
                setUser(freshUser);
                await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(freshUser));
              }
            } catch (error) {
              console.error("Erro ao sincronizar usuário:", error);
            }
          }
        }
      } catch (error) {
        console.error("Erro ao restaurar sessão:", error);
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
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authenticatedUser));
        setUser(authenticatedUser);
        return authenticatedUser;
      },
      logout: async () => {
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
        setUser(GUEST_USER);
      },
      updateUser: async (newUser: User) => {
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
        setUser(newUser);
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
