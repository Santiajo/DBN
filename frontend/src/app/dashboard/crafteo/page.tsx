'use client';

import { useState } from 'react';
import PersonajesList from '@/components/PersonajeLista';
import { useRouter } from 'next/navigation';

export default function SeleccionPersonajePage() {
  const [personajeSeleccionado, setPersonajeSeleccionado] = useState(null);
  const router = useRouter();

  const handleSelect = (personaje: any) => {
    setPersonajeSeleccionado(personaje);
    // Redirigir a la página de crafteo
    router.push(`/crafteo/${personaje.id}`);
  };

  return (
    <div>
      <h1 className="text-2xl mb-4">Selecciona un personaje</h1>
      <PersonajesList onSelect={handleSelect} />
    </div>
  );
}
