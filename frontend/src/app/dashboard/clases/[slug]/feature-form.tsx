'use client';

import { useState, useEffect } from 'react';
import { ClassFeature } from '@/types';
import Input from '@/components/input';
import Button from '@/components/button';
import { FaTrash } from 'react-icons/fa';

interface FeatureFormProps {
  onSave: (data: Partial<ClassFeature>) => void;
  onCancel: () => void;
  onDelete?: () => void;
  initialData?: ClassFeature | null;
  classId: number;
}

export default function FeatureForm({ onSave, onCancel, onDelete, initialData, classId }: FeatureFormProps) {
  const [formData, setFormData] = useState<Partial<ClassFeature>>({
    name: '', level: 1, description: '', display_order: 0,
  });

  useEffect(() => {
    if (initialData) setFormData(initialData);
    else setFormData({ name: '', level: 1, description: '', display_order: 0 });
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'number' ? parseInt(value) || 0 : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...formData, dnd_class: classId } as unknown as Partial<ClassFeature>); 
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 font-body text-stone-800">
      {/* ... Inputs de Nombre, Nivel, Orden, Descripción IGUAL QUE ANTES ... */}
      <div>
        <label className="block mb-1 font-semibold">Nombre del Rasgo</label>
        <Input name="name" value={formData.name} onChange={handleChange} required placeholder="Ej: Sneak Attack" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block mb-1 font-semibold">Nivel</label>
          <Input type="number" name="level" min={1} max={20} value={String(formData.level)} onChange={handleChange} required />
        </div>
        <div>
           <label className="block mb-1 font-semibold">Orden</label>
           <Input type="number" name="display_order" value={String(formData.display_order)} onChange={handleChange} />
        </div>
      </div>
      <div>
        <label className="block mb-1 font-semibold">Descripción</label>
        <textarea name="description" rows={5} value={formData.description} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-stone-400 bg-white focus:ring-2 focus:ring-bosque" />
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-stone-200 mt-4">
        {/* BOTÓN ELIMINAR (Solo si estamos editando, es decir, hay initialData) */}
        {initialData && onDelete ? (
            <button 
                type="button" 
                onClick={onDelete}
                className="text-red-500 hover:text-red-700 flex items-center gap-2 text-sm font-semibold transition-colors"
            >
                <FaTrash /> Eliminar Rasgo
            </button>
        ) : <div></div> /* Div vacío para mantener el flex justify-between */}

        <div className="flex gap-4">
            <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
            <Button type="submit" variant="primary">Guardar</Button>
        </div>
      </div>
    </form>
  );
}