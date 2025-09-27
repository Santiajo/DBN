// src/context/AuthContext.tsx
'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';


// Estructura de datos que se obtendran del usuario mediante el token
interface User {
  user_id: number;
  username: string;
  is_staff: boolean;
}

// Forma del contexto
type AuthContextType = {
  user: User | null;
  accessToken: string | null;
  login: (access: string, refresh: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  accessToken: null,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
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
    // Al cargar la app, revisa si hay un token
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const decodedUser: User = jwtDecode(token);
        setUser(decodedUser);
        setAccessToken(token);
      } catch {
        // Token inválido o expirado, se limpia
        logout();
      }
    }
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, accessToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);