'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface PersonajeForm {
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

const clases = [
  'BARBARIAN', 'BARD', 'WARLOCK', 'CLERIC', 'DRUID',
  'RANGER', 'FIGHTER', 'SORCERER', 'WIZARD', 'MONK', 'PALADIN', 'ROGUE'
];

export default function CrearPersonajeForm() {
  const router = useRouter();
  const { user, accessToken } = useAuth();

  const [form, setForm] = useState<PersonajeForm>({
    nombre_personaje: '',
    clase: '',
    especie: '',
    faccion: '',
    fuerza: 10,
    inteligencia: 10,
    sabiduria: 10,
    destreza: 10,
    constitucion: 10,
    carisma: 10,
  });

  const [mensaje, setMensaje] = useState('');

  // Redirigir si no hay usuario logeado
  useEffect(() => {
    if (!user) router.push('/login');
  }, [user, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const key = name as keyof PersonajeForm;

    setForm(prevForm => ({
      ...prevForm,
      [key]: ['fuerza', 'inteligencia', 'sabiduria', 'destreza', 'constitucion', 'carisma'].includes(key)
        ? Number(value)
        : value
    }));
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accessToken) {
      setMensaje('No se encontró token de autenticación');
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/personajes/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setMensaje('Personaje creado con éxito!');
        // Opcional: limpiar formulario
        setForm({
          nombre_personaje: '',
          clase: '',
          especie: '',
          faccion: '',
          fuerza: 10,
          inteligencia: 10,
          sabiduria: 10,
          destreza: 10,
          constitucion: 10,
          carisma: 10,
        });
      } else {
        const data = await res.json();
        setMensaje('Error: ' + JSON.stringify(data));
      }
    } catch (error: unknown) {
      if (error instanceof TypeError) {
        setMensaje('Error de conexión con el servidor');
      } else if (error instanceof Error) {
        setMensaje('Error inesperado: ' + error.message);
      } else {
        setMensaje('Ocurrió un error inesperado');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="text"
        name="nombre_personaje"
        placeholder="Nombre"
        value={form.nombre_personaje}
        onChange={handleChange}
        required
        className="border p-2 w-full"
      />
      <select
        name="clase"
        value={form.clase}
        onChange={handleChange}
        required
        className="border p-2 w-full"
      >
        <option value="">Selecciona una clase</option>
        {clases.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <input
        type="text"
        name="especie"
        placeholder="Especie"
        value={form.especie}
        onChange={handleChange}
        className="border p-2 w-full"
      />
      <input
        type="text"
        name="faccion"
        placeholder="Facción"
        value={form.faccion}
        onChange={handleChange}
        className="border p-2 w-full"
      />
      {['fuerza', 'inteligencia', 'sabiduria', 'destreza', 'constitucion', 'carisma'].map(stat => (
        <input
          key={stat}
          type="number"
          name={stat}
          placeholder={stat}
          value={form[stat as keyof PersonajeForm]}
          onChange={handleChange}
          className="border p-2 w-full"
          min={1}
          max={20}
        />
      ))}
      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
        Crear
      </button>
      {mensaje && <p className="text-sm mt-2">{mensaje}</p>}
    </form>
  );
}
