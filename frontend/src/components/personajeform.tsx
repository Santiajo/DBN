'use client';

import { useState } from 'react';

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
  'BARBARIAN','BARD','WARLOCK','CLERIC','DRUID',
  'RANGER','FIGHTER','SORCERER','WIZARD','MONK','PALADIN','ROGUE'
];

export default function CrearPersonajeForm() {
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: isNaN(Number(value)) ? value : Number(value) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('https://tu-backend.com/api/personajes/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setMensaje('Personaje creado con éxito!');
      } else {
        const data = await res.json();
        setMensaje('Error: ' + JSON.stringify(data));
      }
    } catch {
      setMensaje('Error en la conexión con el servidor');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input type="text" name="nombre_personaje" placeholder="Nombre" value={form.nombre_personaje} onChange={handleChange} required className="border p-2 w-full" />
      <select name="clase" value={form.clase} onChange={handleChange} required className="border p-2 w-full">
        <option value="">Selecciona una clase</option>
        {clases.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <input type="text" name="especie" placeholder="Especie" value={form.especie} onChange={handleChange} className="border p-2 w-full" />
      <input type="text" name="faccion" placeholder="Facción" value={form.faccion} onChange={handleChange} className="border p-2 w-full" />
      {['fuerza','inteligencia','sabiduria','destreza','constitucion','carisma'].map(stat => (
        <input key={stat} type="number" name={stat} placeholder={stat} value={form[stat as keyof PersonajeForm]} onChange={handleChange} className="border p-2 w-full" min={1} max={20} />
      ))}
      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Crear</button>
      {mensaje && <p>{mensaje}</p>}
    </form>
  );
}
