import { ReactNode, createContext, useCallback, useContext, useMemo, useState } from "react";
import api from "../api";
import { User } from "../types";

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthResponse = {
  token: string;
  user: User;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const serializedUser = sessionStorage.getItem("clarity_user");
    return serializedUser ? (JSON.parse(serializedUser) as User) : null;
  });
  const [token, setToken] = useState<string | null>(
    sessionStorage.getItem("clarity_token")
  );
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      const response = await api.post<AuthResponse>("/auth/login", { email, password });
      setToken(response.data.token);
      setUser(response.data.user);
      sessionStorage.setItem("clarity_token", response.data.token);
      sessionStorage.setItem("clarity_user", JSON.stringify(response.data.user));
    } finally {
      setLoading(false);
    }
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      const response = await api.post<AuthResponse>("/auth/signup", {
        name,
        email,
        password,
      });
      setToken(response.data.token);
      setUser(response.data.user);
      sessionStorage.setItem("clarity_token", response.data.token);
      sessionStorage.setItem("clarity_user", JSON.stringify(response.data.user));
    } finally {
      setLoading(false);
    }
  }, []);

  const googleLogin = useCallback(async (idToken: string): Promise<void> => {
    setLoading(true);
    try {
      const response = await api.post<AuthResponse>("/auth/google", { idToken });
      setToken(response.data.token);
      setUser(response.data.user);
      sessionStorage.setItem("clarity_token", response.data.token);
      sessionStorage.setItem("clarity_user", JSON.stringify(response.data.user));
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback((): void => {
    setToken(null);
    setUser(null);
    sessionStorage.removeItem("clarity_token");
    sessionStorage.removeItem("clarity_user");
  }, []);

  const value = useMemo(
    () => ({ user, token, loading, login, signup, googleLogin, logout }),
    [user, token, loading, login, signup, googleLogin, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};
