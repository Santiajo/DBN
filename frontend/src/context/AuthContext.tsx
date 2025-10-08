// src/context/AuthContext.tsx
'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {jwtDecode} from 'jwt-decode';

interface User {
  user_id: number;
  username: string;
  is_staff: boolean;
}

type AuthContextType = {
  user: User | null;
  accessToken: string | null;
  login: (access: string, refresh: string) => void;
  logout: () => void;
  loading: boolean; // <-- nuevo
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  accessToken: null,
  login: () => {},
  logout: () => {},
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); // <-- nuevo
  const router = useRouter();

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    // Hacemos un push directo sin useCallback
    window.location.href = '/login';
  };

  const login = (access: string, refresh: string) => {
    const decodedUser: User = jwtDecode(access);
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    setUser(decodedUser);
    setAccessToken(access);
    router.push('/dashboard');
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const decodedUser: User = jwtDecode(token);
        setUser(decodedUser);
        setAccessToken(token);
      } catch {
        logout();
      }
    }
    setLoading(false); // <-- importante
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, accessToken, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
