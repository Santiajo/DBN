'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePersonaje } from '@/context/PersonajeContext';
import { useRouter } from 'next/navigation';
import ListaPersonajes from '@/components/ListaPersonajes';
import type { Personaje } from '@/context/PersonajeContext';

export default function SeleccionarPersonajePage() {
  const { user, accessToken, loading } = useAuth();
  const { setPersonaje } = usePersonaje();
  const router = useRouter();

  const [personajes, setPersonajes] = useState<Personaje[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  // 🔹 Redirigir solo si ya terminó de cargar el contexto
  useEffect(() => {
    if (loading) return;
    if (!user || !accessToken) {
      router.push('/login');
    }
  }, [user, accessToken, loading, router]);

  // 🔹 Cargar personajes del usuario
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

        if (res.ok) {
          const data: Personaje[] = await res.json();
          setPersonajes(data);
        } else {
          setError('No se pudieron cargar tus personajes.');
        }
      } catch {
        setError('Error de conexión con el servidor.');
      } finally {
        setFetching(false);
      }
    };

    fetchPersonajes();
  }, [user, accessToken]);

  const handleSelect = (p: Personaje) => {
    setPersonaje(p);
    router.push('/dashboard'); // Redirige al dashboard usando el personaje seleccionado
  };

  // 🔹 Renderizado condicional
  if (loading || fetching) return <p className="text-center mt-10">Cargando personajes...</p>;
  if (error) return <p className="text-center text-red-600">{error}</p>;

  return (
    <div className="max-w-md mx-auto mt-12 space-y-6">
      <h1 className="text-3xl font-bold text-center text-madera-oscura">
        Selecciona tu personaje
      </h1>

      <ListaPersonajes personajes={personajes} onSelect={handleSelect} />
    </div>
  );
}
