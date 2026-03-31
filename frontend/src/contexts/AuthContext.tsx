import React, { createContext, useContext, useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

type AppRole = 'admin' | 'manager' | 'employee';

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
    role: 'employee' as AppRole,
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    // Check for stored token in localStorage
    const token = localStorage.getItem('b1g_token');
    
    if (token) {
      try {
        // Fetch fresh user data from API
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data.user) {
            const user = data.data.user;
            setUser({ id: user.user_id, email: user.email });
            setProfile({ 
              id: user.user_id, 
              user_id: user.user_id, 
              full_name: user.full_name, 
              email: user.email, 
              avatar_url: user.avatar_url 
            });
            setRole(user.role);
            // Update localStorage with fresh data
            localStorage.setItem('b1g_user', JSON.stringify(user));
          }
        } else {
          // Token invalid, clear it
          localStorage.removeItem('b1g_token');
          localStorage.removeItem('b1g_user');
        }
      } catch {
        // Network error, fallback to localStorage
        const storedUser = localStorage.getItem('b1g_user');
        if (storedUser) {
          try {
            const user = JSON.parse(storedUser);
            setUser({ id: user.user_id, email: user.email });
            setProfile({ 
              id: user.user_id, 
              user_id: user.user_id, 
              full_name: user.full_name, 
              email: user.email, 
              avatar_url: user.avatar_url 
            });
            setRole(user.role);
          } catch {
            localStorage.removeItem('b1g_token');
            localStorage.removeItem('b1g_user');
          }
        }
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
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Invalid email or password');
      }

      // Store token and user data
      localStorage.setItem('b1g_token', data.data.token);
      localStorage.setItem('b1g_user', JSON.stringify(data.data.user));
      
      setUser({ id: data.data.user.user_id, email: data.data.user.email });
      setProfile({ 
        id: data.data.user.user_id, 
        user_id: data.data.user.user_id, 
        full_name: data.data.user.full_name, 
        email: data.data.user.email, 
        avatar_url: data.data.user.avatar_url 
      });
      setRole(data.data.user.role);
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    }
  };

  const signOut = async () => {
    // Clear session
    localStorage.removeItem('b1g_token');
    localStorage.removeItem('b1g_user');
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