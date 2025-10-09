'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePersonaje, Personaje } from '@/context/PersonajeContext';
import { useRouter } from 'next/navigation';
import ListaPersonajes from '@/components/ListaPersonajes';

export default function SeleccionarPersonajePage() {
  const { user, accessToken, loading: authLoading } = useAuth();
  const { setPersonaje } = usePersonaje();
  const router = useRouter();

  const [personajes, setPersonajes] = useState<Personaje[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Espera a que AuthContext termine de inicializar
    if (authLoading) return;

    if (!user || !accessToken) {
      setLoading(false); // Ya no hay usuario, no cargamos nada
      return;
    }

    const fetchPersonajes = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/personajes/?user=${user.user_id}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!res.ok) {
          setError('No se pudieron cargar tus personajes');
          return;
        }

        const data: Personaje[] = await res.json();
        setPersonajes(data);
      } catch {
        setError('Error de conexión con el servidor');
      } finally {
        setLoading(false);
      }
    };

    fetchPersonajes();
  }, [user, accessToken, authLoading]);

  const handleSelect = (p: Personaje) => {
    setPersonaje(p);
    router.push('/dashboard'); // Redirige al dashboard usando ese personaje
  };

  if (authLoading || loading) return <p className="text-center mt-8">Cargando...</p>;
  if (!user) return <p className="text-center mt-8">No estás logueado.</p>;
  if (error) return <p className="text-center mt-8 text-red-500">{error}</p>;

  return (
    <div className="max-w-md mx-auto mt-8 space-y-4">
      <h1 className="text-2xl font-bold text-center">Selecciona tu personaje</h1>
      <ListaPersonajes personajes={personajes} onSelect={handleSelect} />
    </div>
  );
}
