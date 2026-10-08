import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, tokenStore } from "./api";
import type { User } from "./types";

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (d: { phone: string; full_name: string; password: string; role: "parent" | "worker" }) => Promise<void>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const t = await tokenStore.load();
      if (t) {
        try { setUser(await api.auth.me()); } catch { await tokenStore.clear(); }
      }
      setLoading(false);
    })();
  }, []);

  const login = useCallback(async (phone: string, password: string) => {
    const r = await api.auth.login(phone, password);
    await tokenStore.set(r.access_token);
    setUser(r.user);
  }, []);
  const register = useCallback(async (d: { phone: string; full_name: string; password: string; role: "parent" | "worker" }) => {
    const r = await api.auth.register(d);
    await tokenStore.set(r.access_token);
    setUser(r.user);
  }, []);
  const logout = useCallback(async () => { await tokenStore.clear(); setUser(null); }, []);

  return <Ctx.Provider value={{ user, loading, login, register, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth outside AuthProvider");
  return c;
}
