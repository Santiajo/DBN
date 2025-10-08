'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePersonaje } from '@/context/PersonajeContext';
import { useRouter } from 'next/navigation';
import ListaPersonajes from '@/components/ListaPersonajes';
import { Personaje } from '@/context/PersonajeContext';

export default function SeleccionarPersonajePage() {
  const { user, accessToken } = useAuth();
  const { setPersonaje } = usePersonaje();
  const router = useRouter();

  const [personajes, setPersonajes] = useState<Personaje[]>([]); // lista de personajes
  const [loading, setLoading] = useState(true); // para manejar el “Cargando…”
  const [error, setError] = useState(''); // para mostrar errores


  useEffect(() => {
  if (!user || !accessToken) return;

  const fetchPersonajes = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/personajes/?user=${user.user_id}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (res.ok) {
        const data: Personaje[] = await res.json();
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
    }, [user, accessToken]);


  const handleSelect = (p: Personaje) => {
    setPersonaje(p); // guarda el personaje seleccionado en el contexto
    router.push('/dashboard'); // página principal usando ese personaje
    };


  return (
    <div className="max-w-md mx-auto mt-8 space-y-4">
      <h1 className="text-2xl font-bold text-center">Selecciona tu personaje</h1>
      {error && <p>{error}</p>}
      <ListaPersonajes personajes={personajes} onSelect={handleSelect} />
    </div>
  );
}
