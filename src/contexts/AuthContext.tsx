import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { type User, getCurrentUser, login as authLogin, logout as authLogout, initUsers } from "@/lib/auth";

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => User | null;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    initUsers();
    setUser(getCurrentUser());
  }, []);

  const handleLogin = (username: string, password: string): User | null => {
    const loggedIn = authLogin(username, password);
    setUser(loggedIn);
    return loggedIn;
  };

  const handleLogout = () => {
    authLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login: handleLogin, logout: handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
