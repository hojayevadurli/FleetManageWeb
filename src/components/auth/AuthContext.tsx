// src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/Api";
import {
  login as authLogin,
  me as fetchMe,
  logout as authLogout,
  getToken,
  type User,
  type AuthResponse,
} from "./Auth";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (
    companyName: string,
    fullName: string,
    email: string,
    phoneNumber: string,
    password: string,
    industryId?: string
  ) => Promise<{ error?: string }>;
  signOut: () => void;
  updateUser: (user: User) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Auto-logout on 401
  useEffect(() => {
    const id = api.interceptors.response.use(
      (r) => r,
      (err) => {
        if (err?.response?.status === 401) {
          authLogout();
          setUser(null);
        }
        return Promise.reject(err);
      }
    );
    return () => api.interceptors.response.eject(id);
  }, []);

  // Restore user on mount if token exists
  useEffect(() => {
    (async () => {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const me = await fetchMe();
        setUser(me);
      } catch {
        authLogout();
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const extractError = (e: any, fallback: string) => {
    const data = e?.response?.data;
    if (!data) return fallback;

    if (typeof data === "string") return data;
    if (typeof data.message === "string") return data.message;

    if (data.errors && typeof data.errors === "object") {
      const first = Object.values(data.errors)[0];
      if (Array.isArray(first) && first.length > 0) return String(first[0]);
      if (typeof first === "string") return first;
    }

    return fallback;
  };

  const handleLoginSuccess = async (auth: AuthResponse) => {
    // token already stored by authLogin
    const me = await fetchMe();
    setUser(me);
  };

  const signIn = async (email: string, password: string) => {
    try {
      const auth = await authLogin(email, password);
      await handleLoginSuccess(auth);
      return {};
    } catch (e: any) {
      return { error: extractError(e, "Invalid login") };
    }
  };

  // Register company, NO auto-login
  const signUp = async (
    companyName: string,
    fullName: string,
    email: string,
    phoneNumber: string,
    password: string,
    industryId?: string
  ) => {
    try {
      await api.post("/Auth/register", {
        companyName,
        fullName,
        email,
        phone: phoneNumber,
        password,
        industryId
      });

      return {};
    } catch (e: any) {
      return { error: extractError(e, "Registration failed") };
    }
  };

  const signOut = () => {
    authLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        updateUser: (u: User) => setUser(u),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
