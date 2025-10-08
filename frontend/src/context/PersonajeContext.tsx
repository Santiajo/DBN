'use client';
import { createContext, useContext, useState } from 'react';

export interface Personaje {
  id: number;
  nombre_personaje: string;
  clase: string;
  especie: string;
  faccion: string;
  fuerza: number;
  inteligencia: number;
  sabiduria: number;
  destreza: number;
  constitucion: number;
  carisma: number;
}

interface PersonajeContextType {
  personaje: Personaje | null;
  setPersonaje: (p: Personaje) => void;
}

const PersonajeContext = createContext<PersonajeContextType>({
  personaje: null,
  setPersonaje: () => {},
});

export const PersonajeProvider = ({ children }: { children: React.ReactNode }) => {
  const [personaje, setPersonaje] = useState<Personaje | null>(null);

  return (
    <PersonajeContext.Provider value={{ personaje, setPersonaje }}>
      {children}
    </PersonajeContext.Provider>
  );
};

export const usePersonaje = () => useContext(PersonajeContext);
