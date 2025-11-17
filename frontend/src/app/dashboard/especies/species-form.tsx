'use client';

import { useState, useEffect } from 'react';
import { DnDSpecies } from '@/types';
import Input from '@/components/input';
import Button from '@/components/button';
import Dropdown, { OptionType } from '@/components/dropdown';

interface SpeciesFormProps {
  onSave: (species: Partial<DnDSpecies>) => void;
  onCancel: () => void;
  initialData?: DnDSpecies | null;
}

// Opciones para los Dropdowns
const creatureTypeOptions: OptionType[] = [
  { value: 'Humanoid', label: 'Humanoide' },
  { value: 'Elemental', label: 'Elemental' },
  { value: 'Monstrosity', label: 'Monstruosidad' },
  { value: 'Fey', label: 'Feérico' },
  { value: 'Fiend', label: 'Infernal' },
  { value: 'Celestial', label: 'Celestial' },
  { value: 'Dragon', label: 'Dragón' },
  { value: 'Giant', label: 'Gigante' },
  { value: 'Aberration', label: 'Aberración' },
  { value: 'Beast', label: 'Bestia' },
  { value: 'Construct', label: 'Constructo' },
  { value: 'Ooze', label: 'Limo' },
  { value: 'Plant', label: 'Planta' },
  { value: 'Undead', label: 'No-muerto' },
];

const sizeOptions: OptionType[] = [
  { value: 'Tiny', label: 'Diminuto' },
  { value: 'Small', label: 'Pequeño' },
  { value: 'Medium', label: 'Mediano' },
  { value: 'Small or Medium', label: 'Pequeño o Mediano' },
  { value: 'Medium or Large', label: 'Mediano o Grande' },
  { value: 'Large', label: 'Grande' },
  { value: 'Huge', label: 'Enorme' },
  { value: 'Gargantuan', label: 'Gargantuesco' },
];

type SpeciesFormData = Omit<DnDSpecies, 'id' | 'slug' | 'traits'>;

const defaultFormData: SpeciesFormData = {
  name: '',
  description: '',
  creature_type: 'Humanoid',
  size: 'Medium',
  walking_speed: 30,
  darkvision: 0,
};

export default function SpeciesForm({ onSave, onCancel, initialData }: SpeciesFormProps) {
  const [formData, setFormData] = useState<SpeciesFormData>(defaultFormData);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        description: initialData.description,
        creature_type: initialData.creature_type,
        size: initialData.size,
        walking_speed: initialData.walking_speed,
        darkvision: initialData.darkvision,
      });
    } else {
      setFormData(defaultFormData);
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    const processedValue = type === 'number' ? (parseInt(value, 10) || 0) : value;

    setFormData((prev) => ({ ...prev, [name]: processedValue }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...formData, id: initialData?.id });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 font-body text-stone-800">
      
      {/* Nombre */}
      <div>
        <label className="block mb-1 font-semibold">Nombre de la Especie</label>
        <Input 
          name="name" 
          value={formData.name} 
          onChange={handleChange} 
          required 
          placeholder="Ej: Aarakocra (New World Ancestry)" 
        />
      </div>

      {/* Grid: Tipo y Tamaño */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-1 font-semibold">Tipo de Criatura</label>
          <Dropdown 
            name="creature_type" 
            value={formData.creature_type} 
            onChange={handleChange} 
            options={creatureTypeOptions} 
          />
        </div>
        
        <div>
          <label className="block mb-1 font-semibold">Tamaño</label>
          <Dropdown 
            name="size" 
            value={formData.size} 
            onChange={handleChange} 
            options={sizeOptions} 
          />
        </div>
      </div>

      {/* Grid: Velocidad y Visión */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-1 font-semibold">Velocidad (pies)</label>
          <Input 
            name="walking_speed" 
            type="number" 
            value={String(formData.walking_speed)} 
            onChange={handleChange} 
          />
        </div>
        <div>
          <label className="block mb-1 font-semibold">Visión en la Oscuridad (pies)</label>
          <Input 
            name="darkvision" 
            type="number" 
            value={String(formData.darkvision)} 
            onChange={handleChange} 
          />
        </div>
      </div>

      {/* Descripción (Lore) */}
      <div>
        <label className="block mb-1 font-semibold">Descripción (Lore)</label>
        <textarea 
          name="description" 
          rows={6} 
          value={formData.description} 
          onChange={handleChange}
          placeholder="Describe la historia, apariencia y cultura de la especie..."
          className="w-full px-4 py-2 rounded-lg border border-stone-400 bg-white focus:ring-2 focus:ring-bosque scrollbar-custom"
        />
      </div>

      {/* Botones de Acción */}
      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary">
          {initialData ? 'Guardar Cambios' : 'Crear Especie'}
        </Button>
      </div>
    </form>
  );
}