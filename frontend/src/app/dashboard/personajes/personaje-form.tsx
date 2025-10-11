'use client';

import { useState, useEffect } from 'react';
import { Personaje } from '@/types';
import Input from '@/components/input';
import Button from '@/components/button';

// Definimos un tipo para los datos del formulario, que es un "Personaje" sin id y user.
type PersonajeFormData = Omit<Personaje, 'id' | 'user'>;

interface PersonajeFormProps {
  onSave: (personaje: PersonajeFormData) => void;
  onCancel: () => void;
  initialData?: Personaje | null;
}

const dndClasses = [
    'BARBARIAN', 'BARD', 'WARLOCK', 'CLERIC', 'DRUID', 'RANGER', 
    'FIGHTER', 'SORCERER', 'WIZARD', 'MONK', 'PALADIN', 'ROGUE'
];

// Estado inicial por defecto para un nuevo personaje.
const defaultFormState: PersonajeFormData = {
    nombre_personaje: '',
    clase: 'FIGHTER',
    nivel: 1,
    especie: '',
    faccion: '',
    oro: 50,
    treasure_points: 0,
    tiempo_libre: 0,
    fuerza: 10,
    inteligencia: 10,
    sabiduria: 10,
    destreza: 10,
    constitucion: 10,
    carisma: 10,
    nombre_usuario: '',
    treasure_points_gastados: 0,
};

export default function PersonajeForm({ onSave, onCancel, initialData }: PersonajeFormProps) {
  const [formData, setFormData] = useState<PersonajeFormData>(defaultFormState);

  useEffect(() => {
    if (initialData) {
      // Si hay datos iniciales, los separamos para quitar 'id' y 'user'
      // y así coincidir perfectamente con el tipo PersonajeFormData.
      const { id, user, ...formDataFromInitial } = initialData;
      setFormData(formDataFromInitial);
    } else {
      // Si no hay datos (creando nuevo), reseteamos al estado por defecto.
      setFormData(defaultFormState);
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value, 10) || 0 : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Ahora 'formData' coincide perfectamente con lo que 'onSave' espera.
    // No se necesita ningún @ts-ignore.
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 font-body text-stone-800 max-h-[70vh] overflow-y-auto pr-4 scrollbar-custom">
      
      <div>
        <label htmlFor="nombre_personaje" className="block mb-1 font-semibold">Nombre del Personaje</label>
        <Input id="nombre_personaje" name="nombre_personaje" value={formData.nombre_personaje} onChange={handleChange} required />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="clase" className="block mb-1 font-semibold">Clase</label>
          <select id="clase" name="clase" value={formData.clase} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-stone-400 bg-white focus:ring-2 focus:ring-bosque">
            {dndClasses.map(c => <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>)}
          </select>
        </div>
        <div>
            <label htmlFor="nivel" className="block mb-1 font-semibold">Nivel</label>
            <Input id="nivel" name="nivel" type="number" value={formData.nivel} onChange={handleChange} />
        </div>
        <div>
            <label htmlFor="especie" className="block mb-1 font-semibold">Especie</label>
            <Input id="especie" name="especie" value={formData.especie} onChange={handleChange} />
        </div>
      </div>

      <h4 className="font-title border-b border-madera-oscura pb-1">Recursos</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
            <label htmlFor="oro" className="block mb-1 font-semibold">Oro</label>
            <Input id="oro" name="oro" type="number" value={formData.oro} onChange={handleChange} />
        </div>
        <div>
            <label htmlFor="treasure_points" className="block mb-1 font-semibold">Checkpoints</label>
            <Input id="treasure_points" name="treasure_points" type="number" value={formData.treasure_points} onChange={handleChange} />
        </div>
        <div>
            <label htmlFor="tiempo_libre" className="block mb-1 font-semibold">Tiempo Libre</label>
            <Input id="tiempo_libre" name="tiempo_libre" type="number" value={formData.tiempo_libre} onChange={handleChange} />
        </div>
      </div>

      <h4 className="font-title border-b border-madera-oscura pb-1">Estadísticas</h4>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
        <div>
            <label htmlFor="fuerza" className="block mb-1 font-semibold text-center">FUE</label>
            <Input id="fuerza" name="fuerza" type="number" value={formData.fuerza} onChange={handleChange} className="text-center" />
        </div>
        <div>
            <label htmlFor="destreza" className="block mb-1 font-semibold text-center">DES</label>
            <Input id="destreza" name="destreza" type="number" value={formData.destreza} onChange={handleChange} className="text-center" />
        </div>
        <div>
            <label htmlFor="constitucion" className="block mb-1 font-semibold text-center">CON</label>
            <Input id="constitucion" name="constitucion" type="number" value={formData.constitucion} onChange={handleChange} className="text-center" />
        </div>
        <div>
            <label htmlFor="inteligencia" className="block mb-1 font-semibold text-center">INT</label>
            <Input id="inteligencia" name="inteligencia" type="number" value={formData.inteligencia} onChange={handleChange} className="text-center" />
        </div>
        <div>
            <label htmlFor="sabiduria" className="block mb-1 font-semibold text-center">SAB</label>
            <Input id="sabiduria" name="sabiduria" type="number" value={formData.sabiduria} onChange={handleChange} className="text-center" />
        </div>
        <div>
            <label htmlFor="carisma" className="block mb-1 font-semibold text-center">CAR</label>
            <Input id="carisma" name="carisma" type="number" value={formData.carisma} onChange={handleChange} className="text-center" />
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" variant="primary">{initialData ? 'Guardar Cambios' : 'Crear Personaje'}</Button>
      </div>
    </form>
  );
}