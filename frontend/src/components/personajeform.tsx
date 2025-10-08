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
    if (!token) {
      setMensaje('Error: No se encontró token de autenticación');
      return;
    }

    const res = await fetch('http://127.0.0.1:8000/api/personajes/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setMensaje(' Personaje creado con éxito!');
      return;
    }

    // Si no es OK, intentamos parsear JSON
    let data;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    // Manejo de distintos códigos HTTP
    switch (res.status) {
      case 400:
        setMensaje(' Datos inválidos: ' + (data ? JSON.stringify(data) : res.statusText));
        break;
      case 401:
        setMensaje(' No autorizado. Revisa tu token o inicia sesión de nuevo.');
        break;
      case 403:
        setMensaje(' Prohibido. No tienes permisos para realizar esta acción.');
        break;
      case 404:
        setMensaje(' Endpoint no encontrado: ' + res.url);
        break;
      case 500:
        setMensaje(' Error interno del servidor. Revisa los logs de Django.');
        break;
      default:
        setMensaje(` Error ${res.status}: ${res.statusText}` + (data ? ' - ' + JSON.stringify(data) : ''));
    }

  } catch (networkError) {
    console.error('Error de conexión o fetch:', networkError);
    setMensaje(' Error de conexión con el servidor. ¿Está Django corriendo en http://127.0.0.1:8000?');
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
