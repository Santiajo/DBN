'use client';

import { useState, useEffect } from 'react';
import { Objeto } from '@/types';
import Input from '@/components/input';
import Button from '@/components/button';
import Dropdown, { OptionType } from '@/components/dropdown';
import Checkbox from '@/components/checkbox';

interface ObjectFormProps {
  onSave: (objeto: Objeto) => void;
  onCancel: () => void;
  initialData?: Objeto | null;
}

// Opciones para los campos
const rarities: OptionType[] = ["Common", "Uncommon", "Rare", "Very Rare", "Legendary"].map(v => ({ value: v, label: v }));
const sources: OptionType[] = ["DMG", "TCE", "XGE", "FTD", "PHB"].map(v => ({ value: v, label: v }));
const properties: string[] = ["Light", "Heavy", "Finesse", "Reach", "Thrown", "Versatile", "Ammunition", "Two-Handed"];
const mastery: string[] = ["Push", "Nick", "Cleave", "Flex", "Sap", "Slow", "Topple"];

export default function ObjectForm({ onSave, onCancel, initialData }: ObjectFormProps) {
  const [formData, setFormData] = useState<Omit<Objeto, 'id'>>({
    Name: '', Source: 'DMG', Page: '', Rarity: 'Common', Type: '',
    Attunement: '', Damage: '', Properties: [], Mastery: [],
    Weight: '', Value: '', Text: '',
  });

  useEffect(() => {
    if (initialData) {
      // SOLUCIÓN: Usamos una guarda de tipo (typeof) para asegurar que solo llamamos a .split() en un string.
      const initialProperties = typeof initialData.Properties === 'string'
        ? initialData.Properties.split(', ').filter(p => p) // .filter(p => p) para eliminar strings vacíos si hay
        : initialData.Properties || [];

      const initialMastery = typeof initialData.Mastery === 'string'
        ? initialData.Mastery.split(', ').filter(p => p)
        : initialData.Mastery || [];
      
      setFormData({ ...initialData, Properties: initialProperties, Mastery: initialMastery });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (group: 'Properties' | 'Mastery', value: string) => {
    setFormData(prev => {
      const currentValues = (prev[group] as string[]) || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(item => item !== value)
        : [...currentValues, value];
      return { ...prev, [group]: newValues };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave = {
      ...formData,
      Properties: (formData.Properties as string[]).join(', '),
      Mastery: (formData.Mastery as string[]).join(', '),
    };
    onSave({ ...initialData, ...dataToSave } as Objeto);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 font-body text-stone-800">
      <div>
        <label className="block mb-1 font-semibold">Name</label>
        <Input name="Name" value={formData.Name} onChange={handleChange} required />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-1 font-semibold">Source</label>
          <Dropdown name="Source" value={String(formData.Source)} onChange={handleChange} options={sources} />
        </div>
        <div>
          <label className="block mb-1 font-semibold">Page</label>
          <Input name="Page" type="number" value={String(formData.Page)} onChange={handleChange} />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-1 font-semibold">Rarity</label>
          <Dropdown name="Rarity" value={String(formData.Rarity)} onChange={handleChange} options={rarities} />
        </div>
        <div>
          <label className="block mb-1 font-semibold">Type</label>
          <Input name="Type" value={formData.Type} onChange={handleChange} />
        </div>
      </div>

      <div>
        <label className="block mb-1 font-semibold">Attunement</label>
        <Input name="Attunement" value={formData.Attunement} onChange={handleChange} placeholder="Ej: requires attunement by a wizard" />
      </div>
      
      <div>
        <label className="block mb-1 font-semibold">Damage</label>
        <Input name="Damage" value={formData.Damage} onChange={handleChange} placeholder="Ej: 1d8 + 2 slashing" />
      </div>

      <div>
        <label className="block mb-2 font-semibold">Properties</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {properties.map(prop => (
            <Checkbox
              key={prop}
              label={prop}
              checked={Array.isArray(formData.Properties) && formData.Properties.includes(prop)}
              onChange={() => handleCheckboxChange('Properties', prop)}
            />
          ))}
        </div>
      </div>
      
      <div>
        <label className="block mb-2 font-semibold">Mastery</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {mastery.map(mas => (
            <Checkbox
              key={mas}
              label={mas}
              checked={Array.isArray(formData.Mastery) && formData.Mastery.includes(mas)}
              onChange={() => handleCheckboxChange('Mastery', mas)}
            />
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-1 font-semibold">Weight (lbs)</label>
          <Input name="Weight" type="number" value={String(formData.Weight)} onChange={handleChange} />
        </div>
        <div>
          <label className="block mb-1 font-semibold">Value (gp)</label>
          <Input name="Value" value={String(formData.Value)} onChange={handleChange} />
        </div>
      </div>
      
      <div>
        <label className="block mb-1 font-semibold">Text</label>
        <textarea name="Text" rows={6} value={formData.Text} onChange={handleChange}
          className="w-full px-4 py-2 rounded-lg border border-stone-400 bg-white text-stone-900 focus:ring-2 focus:ring-[#3E6B5C] focus:border-[#3E6B5C] focus:outline-none"
        />
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" variant="primary">Guardar Cambios</Button>
      </div>
    </form>
  );
}

