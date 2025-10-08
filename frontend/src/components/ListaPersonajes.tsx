'use client';
import { Personaje } from '@/context/PersonajeContext';

interface Props {
  personajes: Personaje[];
  onSelect: (p: Personaje) => void;
}

export default function ListaPersonajes({ personajes, onSelect }: Props) {
  if (personajes.length === 0) return <p>No tienes personajes aún.</p>;

  return (
    <ul className="space-y-2">
      {personajes.map(p => (
        <li key={p.id}>
          <button
            onClick={() => onSelect(p)}
            className="border p-2 rounded w-full text-left hover:bg-gray-100"
          >
            {p.nombre_personaje} - {p.clase}
          </button>
        </li>
      ))}
    </ul>
  );
}
