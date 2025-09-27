'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function HomePage() {
  const { user } = useAuth(); // Obtener objeto 'user'
  const router = useRouter();

  useEffect(() => {
    // Si existe 'user', el usuario está autenticado.
    if (user) { 
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [user, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <p className="font-title">Cargando...</p>
    </div>
  );
}
