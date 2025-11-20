'use client';

import { useState, useEffect } from 'react';
import { FeatFeature } from '@/types';
import Input from '@/components/input';
import Button from '@/components/button';
import { FaTrash } from 'react-icons/fa';

interface FeatureFormProps {
  onSave: (data: Partial<FeatFeature>) => void;
  onCancel: () => void;
  onDelete?: () => void;
  initialData?: FeatFeature | null;
  featId: number;
}

export default function FeatFeatureForm({ onSave, onCancel, onDelete, initialData, featId }: FeatureFormProps) {
  const [formData, setFormData] = useState<Partial<FeatFeature>>({
    name: '',
    description: '',
    display_order: 0,
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({ name: '', description: '', display_order: 0 });
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
      dnd_feat: featId 
    } as unknown as Partial<FeatFeature>); 
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 font-body text-stone-800">
      <div>
        <label className="block mb-1 font-semibold">Nombre del Beneficio</label>
        <Input 
            name="name" 
            value={formData.name} 
            onChange={handleChange} 
            required 
            placeholder="Ej: Fast Crafting" 
        />
      </div>

      <div>
        <label className="block mb-1 font-semibold">Descripción</label>
        <textarea 
          name="description" 
          rows={5} 
          value={formData.description} 
          onChange={handleChange} 
          className="w-full px-4 py-2 rounded-lg border border-stone-400 bg-white focus:ring-2 focus:ring-bosque"
          placeholder="Detalle de la regla..."
          required
        />
      </div>

      <div className="w-1/3">
           <label className="block mb-1 font-semibold text-sm">Orden (Opcional)</label>
           <Input 
             type="number" 
             name="display_order" 
             value={String(formData.display_order)} 
             onChange={handleChange} 
           />
      </div>

      {/* Pie de página con botones */}
      <div className="flex justify-between items-center pt-4 border-t border-stone-200 mt-4">
        
        {initialData && onDelete ? (
            <button 
                type="button" 
                onClick={onDelete}
                className="flex items-center gap-2 text-sm font-semibold text-carmesi hover:bg-carmesi/10 px-3 py-2 rounded transition-colors"
            >
                <FaTrash /> Eliminar
            </button>
        ) : (
            <div></div> 
        )}

        <div className="flex gap-4">
            <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
            <Button type="submit" variant="primary">Guardar</Button>
        </div>
      </div>
    </form>
  );
}