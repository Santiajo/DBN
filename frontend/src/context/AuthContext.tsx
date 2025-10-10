'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode }from 'jwt-decode';

interface User {
  user_id: number;
  username: string;
  is_staff: boolean;
}

type AuthContextType = {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  login: (access: string, refresh: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  accessToken: null,
  loading: true,
  login: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const logout = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    router.push('/login');
  }, [router]);

  const login = (access: string, refresh: string) => {
    const decodedUser: User = jwtDecode(access);
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    setUser(decodedUser);
    setAccessToken(access);
    router.push('/dashboard');
  };

  useEffect(() => {
    // Solo en desarrollo: usar token de superuser local si no hay token en localStorage
    const isDev = process.env.NODE_ENV === 'development';
    const devToken = process.env.NEXT_PUBLIC_DEV_JWT;

    const token = localStorage.getItem('access_token') || (isDev ? devToken : null);
    if (token) {
      try {
        const decodedUser: User = jwtDecode(token);
        setUser(decodedUser);
        setAccessToken(token);
      } catch {
        logout();
      }
    }
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, accessToken, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

