'use client';

import { useState, useEffect } from 'react';
import { SubclassFeature } from '@/types';
import Input from '@/components/input';
import Button from '@/components/button';
import { FaTrash } from 'react-icons/fa';

interface FeatureFormProps {
  onSave: (data: Partial<SubclassFeature>) => void;
  onCancel: () => void;
  onDelete?: () => void;
  initialData?: SubclassFeature | null;
  subclassId: number;
}

export default function FeatureForm({ onSave, onCancel, onDelete, initialData, subclassId }: FeatureFormProps) {
  const [formData, setFormData] = useState<Partial<SubclassFeature>>({
    name: '',
    level: 3, // Las subclases suelen empezar al nivel 3
    description: '',
    display_order: 0,
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({ name: '', level: 3, description: '', display_order: 0 });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'number' ? parseInt(value) || 0 : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ 
      ...formData, 
      dnd_subclass: subclassId 
    } as unknown as Partial<SubclassFeature>); 
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 font-body text-stone-800">
      <div>
        <label className="block mb-1 font-semibold">Nombre del Rasgo</label>
        <Input name="name" value={formData.name} onChange={handleChange} required placeholder="Ej: Combat Superiority" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block mb-1 font-semibold">Nivel de Obtención</label>
          <Input type="number" name="level" min={1} max={20} value={String(formData.level)} onChange={handleChange} required />
        </div>
        <div>
           <label className="block mb-1 font-semibold">Orden</label>
           <Input type="number" name="display_order" value={String(formData.display_order)} onChange={handleChange} />
        </div>
      </div>

      <div>
        <label className="block mb-1 font-semibold">Descripción</label>
        <textarea 
          name="description" 
          rows={5} 
          value={formData.description} 
          onChange={handleChange} 
          className="w-full px-4 py-2 rounded-lg border border-stone-400 bg-white focus:ring-2 focus:ring-bosque"
          placeholder="Descripción de la habilidad..."
        />
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-stone-200 mt-4">
        {initialData && onDelete ? (
            <button 
                type="button" 
                onClick={onDelete}
                className="flex items-center gap-2 text-sm font-semibold text-carmesi hover:bg-carmesi/10 px-3 py-2 rounded transition-colors"
            >
                <FaTrash /> Eliminar Rasgo
            </button>
        ) : <div></div>}

        <div className="flex gap-4">
            <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
            <Button type="submit" variant="primary">Guardar</Button>
        </div>
      </div>
    </form>
  );
}