'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

interface Personaje {
  id: number;
  nombre_personaje: string;
  nivel: number;
  clase: string;
}

interface PersonajesListProps {
  onSelect: (personaje: Personaje) => void; // función para seleccionar personaje
}

export default function PersonajesList({ onSelect }: PersonajesListProps) {
  const { accessToken } = useAuth();
  const [personajes, setPersonajes] = useState<Personaje[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    const fetchPersonajes = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/personajes/`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!res.ok) throw new Error('No se pudieron cargar los personajes');

        const data = await res.json();
        // Si la API tiene paginación de DRF
        setPersonajes(data.results || data); 
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPersonajes();
  }, [accessToken]);

  if (loading) return <p>Cargando personajes...</p>;
  if (error) return <p>Error: {error}</p>;
  if (personajes.length === 0) return <p>No tienes personajes creados</p>;

  return (
    <ul className="space-y-2">
      {personajes.map(p => (
        <li
          key={p.id}
          className="flex justify-between items-center border p-3 rounded cursor-pointer hover:bg-gray-100"
          onClick={() => onSelect(p)}
        >
          <span>{p.nombre_personaje}</span>
          <span>Nivel: {p.nivel}</span>
          <span>Clase: {p.clase}</span>
        </li>
      ))}
    </ul>
  );
}
