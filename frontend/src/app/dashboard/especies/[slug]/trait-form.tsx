'use client';

import { useState, useEffect } from 'react';
import { DnDTrait } from '@/types';
import Input from '@/components/input';
import Button from '@/components/button';

interface TraitFormProps {
  onSave: (trait: Partial<DnDTrait>) => void;
  onCancel: () => void;
  initialData?: DnDTrait | null;
  speciesId: number; 
  parentId?: number | null; 
}

type TraitFormData = {
  name: string;
  description: string;
  min_choices: number;
  max_choices: number;
  display_order: number;
};

const defaultFormData: TraitFormData = {
  name: '',
  description: '',
  min_choices: 0,
  max_choices: 0,
  display_order: 0,
};

export default function TraitForm({ onSave, onCancel, initialData, speciesId, parentId }: TraitFormProps) {
  const [formData, setFormData] = useState<TraitFormData>(defaultFormData);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        description: initialData.description,
        min_choices: initialData.min_choices,
        max_choices: initialData.max_choices,
        display_order: initialData.display_order,
      });
    } else {
      setFormData(defaultFormData);
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const processedValue = type === 'number' ? (parseInt(value, 10) || 0) : value;
    setFormData((prev) => ({ ...prev, [name]: processedValue }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Construimos el objeto final
    const dataToSubmit = {
      ...formData,
      id: initialData?.id,
      species: speciesId,       
      parent_choice: parentId ?? initialData?.parent_choice, 
    };

    onSave(dataToSubmit);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-stone-800">
      <div>
        <label className="block mb-1 font-semibold">Nombre del Rasgo</label>
        <Input name="name" value={formData.name} onChange={handleChange} required />
      </div>

      <div>
        <label className="block mb-1 font-semibold">Descripción</label>
        <textarea 
          name="description" rows={5} value={formData.description} onChange={handleChange} required
          className="w-full px-4 py-2 rounded-lg border border-stone-400 bg-white focus:ring-2 focus:ring-bosque"
        />
      </div>

      {/* Configuración avanzada (Opciones) */}
      {/* Solo mostramos esto si NO es una opción hija (un hijo no puede tener hijos) */}
      {!parentId && !initialData?.parent_choice && (
        <div className="p-4 bg-stone-100 rounded-lg border border-stone-300">
          <p className="text-sm font-bold mb-2 text-stone-600">Configuración de Elecciones (Solo para Grupos)</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs mb-1">Mínimo a elegir</label>
              <Input type="number" name="min_choices" value={String(formData.min_choices)} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-xs mb-1">Máximo a elegir</label>
              <Input type="number" name="max_choices" value={String(formData.max_choices)} onChange={handleChange} />
            </div>
          </div>
          <p className="text-xs text-stone-500 mt-2">Deja esto en 0 si es un rasgo fijo (como "Darkvision"). Pon valores (ej. 2 y 2) si el jugador debe elegir opciones (como "Chikcha Legacy").</p>
        </div>
      )}

      <div>
        <label className="block mb-1 font-semibold">Orden de visualización</label>
        <Input type="number" name="display_order" value={String(formData.display_order)} onChange={handleChange} />
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" variant="primary">Guardar Rasgo</Button>
      </div>
    </form>
  );
}