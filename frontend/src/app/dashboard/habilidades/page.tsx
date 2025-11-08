'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Personaje, Habilidad, Proficiencia } from '@/types';
import Dropdown, { OptionType } from '@/components/dropdown';
import Card from '@/components/card';
import Checkbox from '@/components/checkbox';


// --- Función Helper ---
const buildApiUrl = (endpoint: string) => {
  const baseUrl = 'https://dbn.onrender.com'; 
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${baseUrl}/api/${normalizedEndpoint}`;
};

export default function HabilidadesPage() {
  const { user, accessToken } = useAuth();


  const [personajes, setPersonajes] = useState<Personaje[]>([]);
  const [habilidades, setHabilidades] = useState<Habilidad[]>([]);
  const [proficiencias, setProficiencias] = useState<Proficiencia[]>([]);
  

  const [selectedPersonajeId, setSelectedPersonajeId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);


  useEffect(() => {
    if (user && accessToken) {

      fetch(buildApiUrl('personajes/'), {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      .then(res => res.json())
      .then(data => setPersonajes(data.results || data));

      fetch(buildApiUrl('habilidades/'), {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      .then(res => res.json())
      .then(data => setHabilidades(data.results || data));

      fetch(buildApiUrl('proficiencias/'), {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      .then(res => res.json())
      .then(data => setProficiencias(data.results || data));
    }
  }, [user, accessToken]);

  const handleProficienciaChange = async (habilidadId: number, esProficiente: boolean) => {
    if (!selectedPersonajeId) return;

    const personajeId = Number(selectedPersonajeId);
    const existingProf = proficiencias.find(
      p => p.personaje === personajeId && p.habilidad === habilidadId
    );

    setIsLoading(true);

    try {
      if (existingProf) {
        if (existingProf.es_proficiente === esProficiente) {
           setIsLoading(false);
           return;
        }

        const url = buildApiUrl(`proficiencias/${existingProf.id}/`);
        const res = await fetch(url, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            ...existingProf, // Reutiliza datos
            es_proficiente: esProficiente // Cambia el valor
          })
        });
        
        if (!res.ok) throw new Error('Error al actualizar la proficiencia');
        
        const updatedProf = await res.json();
        // Actualizar el estado local
        setProficiencias(prev => 
          prev.map(p => (p.id === updatedProf.id ? updatedProf : p))
        );

      } else {
        // --- NO EXISTE: Crear (POST) ---
        const url = buildApiUrl(`proficiencias/`);
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            personaje: personajeId,
            habilidad: habilidadId,
            es_proficiente: esProficiente
          })
        });
        
        if (!res.ok) throw new Error('Error al crear la proficiencia');
        
        const newProf = await res.json();
        // Añadir al estado local
        setProficiencias(prev => [...prev, newProf]);
      }
    } catch (error) {
      console.error(error);
      // (Aquí deberías mostrar un error al usuario)
    } finally {
      setIsLoading(false);
    }
  };

  // --- Helpers para la UI ---
  const personajeOptions: OptionType[] = personajes.map(p => ({
    value: String(p.id),
    label: p.nombre_personaje
  }));

  const getEsProficiente = (habilidadId: number): boolean => {
    if (!selectedPersonajeId) return false;
    
    const prof = proficiencias.find(
      p => p.personaje === Number(selectedPersonajeId) && p.habilidad === habilidadId
    );
    return prof ? prof.es_proficiente : false;
  };

  return (
    <div className="p-8 space-y-6">
      <h1 className="font-title text-2xl text-madera-oscura">
        Gestionar Proficiencias de Habilidad
      </h1>

      <Card variant="primary" className="lg:w-1/2">
        <label className="block mb-2 font-semibold">Selecciona un Personaje:</label>
        <Dropdown
          options={personajeOptions}
          value={selectedPersonajeId}
          onChange={(e) => setSelectedPersonajeId(e.target.value)}
          placeholder="Elige un personaje..."
        />
      </Card>

      {selectedPersonajeId && (
        <Card variant="secondary">
          <h2 className="font-title text-xl mb-4">
            Habilidades de {personajes.find(p => p.id === Number(selectedPersonajeId))?.nombre_personaje}
          </h2>
          {isLoading && <p className="text-sm italic text-stone-500">Guardando...</p>}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {habilidades
              .sort((a, b) => a.nombre.localeCompare(b.nombre)) // Ordenar alfabéticamente
              .map(habilidad => (
                <div 
                  key={habilidad.id} 
                  className="flex items-center p-3 bg-pergamino/50 rounded-lg border border-stone-300"
                >
                  <label className="flex items-center w-full cursor-pointer">
                    <Checkbox
                    checked={getEsProficiente(habilidad.id)}
                    onChange={(e) => 
                        handleProficienciaChange(habilidad.id, e.target.checked)
                    }
                    disabled={isLoading}
                    />
                    <span className="ml-3 font-body text-stone-700">{habilidad.nombre}</span>
                    <span className="ml-auto text-xs italic text-stone-500">
                      ({habilidad.estadistica_asociada})
                    </span>
                  </label>
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  );
}