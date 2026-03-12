import React, { createContext, useContext, useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

type AppRole = 'admin' | 'manager' | 'user';

interface User {
  id: string;
  email: string;
}

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  role: AppRole | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// ─── DEV ONLY ────────────────────────────────────────────────────────────────
// Comment out the other two when testing different views
// TODO: Remove entirely and use role from API when backend is ready
const DEV_ROLE: AppRole = 'admin';    // ← Admin view
// const DEV_ROLE: AppRole = 'manager'; // ← Manager view
// const DEV_ROLE: AppRole = 'user';    // ← User view
// ─────────────────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        credentials: 'include',
      });
      if (!res.ok) {
        setUser(null);
        setProfile(null);
        setRole(null);
        return;
      }
      const data = await res.json();
      // Expected: { user: { id, email }, profile: { ... }, role: 'admin' | 'manager' | 'user' }
      setUser(data.user);
      setProfile(data.profile);
      setRole(data.role ?? 'user');
    } catch {
      setUser(null);
      setProfile(null);
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password, fullName }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message ?? 'Sign up failed');
    }
    await fetchMe();
  };

  const signIn = async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message ?? 'Sign in failed');
    }
    await fetchMe();
  };

  const signOut = async () => {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    setUser(null);
    setProfile(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      // ── DEV: overrides real API role with DEV_ROLE above ──
      // TODO: change `DEV_ROLE` to `role` when backend is ready
      role: DEV_ROLE,
      // ──────────────────────────────────────────────────────
      loading,
      signUp,
      signIn,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
};