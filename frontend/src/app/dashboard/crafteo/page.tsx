'use client';

import { useState } from 'react';
import PersonajesList from '@/components/PersonajeLista';
import { useRouter } from 'next/navigation';

// Definimos el tipo del personaje
interface Personaje {
  id: number;
  nombre_personaje: string;
  clase: string;
  nivel: number;
}

export default function SeleccionPersonajePage() {
  const [personajeSeleccionado, setPersonajeSeleccionado] = useState<Personaje | null>(null);
  const router = useRouter();

  const handleSelect = (personaje: Personaje) => {
    setPersonajeSeleccionado(personaje);
    // Redirigir a la página de crafteo
    router.push(`/dashboard/crafteo/${personaje.id}`);
  };

  return (
    <div>
      <h1 className="text-2xl mb-4">Selecciona un personaje</h1>
      <PersonajesList onSelect={handleSelect} />
    </div>
  );
}
