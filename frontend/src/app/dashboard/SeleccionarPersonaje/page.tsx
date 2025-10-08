'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePersonaje, Personaje } from '@/context/PersonajeContext';
import { useRouter } from 'next/navigation';
import ListaPersonajes from '@/components/ListaPersonajes';

export default function SeleccionarPersonajePage() {
  const { user, accessToken } = useAuth();
  const { setPersonaje } = usePersonaje();
  const router = useRouter();

  const [personajes, setPersonajes] = useState<Personaje[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !accessToken) return;

    const fetchPersonajes = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/personajes/?user=${user.user_id}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        if (!res.ok) {
          setError('No se pudieron cargar tus personajes');
          setPersonajes([]);
          return;
        }

        const data = await res.json();

        // Validamos que data sea un array
        if (Array.isArray(data)) {
          setPersonajes(data);
        } else {
          console.error('Respuesta inesperada de personajes:', data);
          setPersonajes([]);
          setError('No se encontraron personajes');
        }
      } catch (err) {
        console.error('Error de conexión:', err);
        setError('Error de conexión con el servidor');
        setPersonajes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPersonajes();
  }, [user, accessToken]);

  const handleSelect = (p: Personaje) => {
    setPersonaje(p);
    router.push('/dashboard'); // Página principal donde usarás el personaje
  };

  if (loading) return <p className="text-center mt-8">Cargando personajes...</p>;
  if (error) return <p className="text-center mt-8 text-red-600">{error}</p>;

  return (
    <div className="max-w-md mx-auto mt-8 space-y-4">
      <h1 className="text-2xl font-bold text-center">Selecciona tu personaje</h1>
      {personajes.length > 0 ? (
        <ListaPersonajes personajes={personajes} onSelect={handleSelect} />
      ) : (
        <p className="text-center">No tienes personajes aún</p>
      )}
    </div>
  );
}
