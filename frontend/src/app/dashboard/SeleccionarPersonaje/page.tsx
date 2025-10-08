'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePersonaje } from '@/context/PersonajeContext';
import { useRouter } from 'next/navigation';
import ListaPersonajes from '@/components/ListaPersonajes';

export default function SeleccionarPersonajePage() {
  const { user, accessToken } = useAuth();
  const { setPersonaje } = usePersonaje();
  const router = useRouter();

  const [personajes, setPersonajes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !accessToken) {
      router.push('/login');
      return;
    }

    const fetchPersonajes = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/personajes/?user=${user.user_id}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setPersonajes(data);
        } else {
          setError('No se pudieron cargar tus personajes');
        }
      } catch {
        setError('Error de conexión con el servidor');
      } finally {
        setLoading(false);
      }
    };

    fetchPersonajes();
  }, [user, accessToken, router]);

  const handleSelect = (p: any) => {
    setPersonaje(p);
    router.push('/dashboard'); // Página donde usarás el personaje
  };

  if (loading) return <p>Cargando personajes...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="max-w-md mx-auto mt-8 space-y-4">
      <h1 className="text-2xl font-bold text-center">Selecciona tu personaje</h1>
      <ListaPersonajes personajes={personajes} onSelect={handleSelect} />
    </div>
  );
}
