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

// Hardcoded user database for demo purposes
const HARDCODED_USERS = [
  {
    user: { id: '1', email: 'admin@b1g.com' },
    profile: { id: '1', user_id: '1', full_name: 'Admin User', email: 'admin@b1g.com', avatar_url: null },
    role: 'admin' as AppRole,
    password: 'admin123'
  },
  {
    user: { id: '2', email: 'manager@b1g.com' },
    profile: { id: '2', user_id: '2', full_name: 'Manager User', email: 'manager@b1g.com', avatar_url: null },
    role: 'manager' as AppRole,
    password: 'manager123'
  },
  {
    user: { id: '3', email: 'user@b1g.com' },
    profile: { id: '3', user_id: '3', full_name: 'Regular User', email: 'user@b1g.com', avatar_url: null },
    role: 'user' as AppRole,
    password: 'user123'
  }
];

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
    // Check for stored session in localStorage
    const storedSession = localStorage.getItem('b1g_session');
    if (storedSession) {
      try {
        const session = JSON.parse(storedSession);
        const user = HARDCODED_USERS.find(u => u.user.id === session.userId);
        if (user) {
          setUser(user.user);
          setProfile(user.profile);
          setRole(user.role);
        }
      } catch {
        localStorage.removeItem('b1g_session');
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    // Hardcoded signup - simulate creating a new user
    throw new Error('Signup disabled in demo mode. Use existing hardcoded accounts.');
  };

  const signIn = async (email: string, password: string) => {
    // Hardcoded authentication
    const foundUser = HARDCODED_USERS.find(u => u.user.email === email && u.password === password);
    if (!foundUser) {
      throw new Error('Invalid email or password');
    }
    
    // Store session
    localStorage.setItem('b1g_session', JSON.stringify({ userId: foundUser.user.id }));
    
    setUser(foundUser.user);
    setProfile(foundUser.profile);
    setRole(foundUser.role);
  };

  const signOut = async () => {
    // Clear session
    localStorage.removeItem('b1g_session');
    setUser(null);
    setProfile(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      role,
      loading,
      signUp,
      signIn,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
};