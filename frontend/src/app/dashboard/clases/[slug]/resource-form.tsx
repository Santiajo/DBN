'use client';

import { useState, useEffect } from 'react';
import { ClassResource } from '@/types';
import Input from '@/components/input';
import Button from '@/components/button';
import Dropdown from '@/components/dropdown';
import Checkbox from '@/components/checkbox';

interface ResourceFormProps {
  onSave: (data: Partial<ClassResource>) => void;
  onCancel: () => void;
  initialData?: ClassResource | null;
  classId: number;
}

export default function ResourceForm({ onSave, onCancel, initialData, classId }: ResourceFormProps) {
  const [formData, setFormData] = useState<Partial<ClassResource>>({
    name: '',
    reset_on: 'Long Rest',
    has_die: false,
    dice_type: '',
    progression: {}, 
  });

  const [levels, setLevels] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      const progStrings: Record<string, string> = {};
      for (let i = 1; i <= 20; i++) {
        progStrings[i] = initialData.progression[i] !== undefined ? String(initialData.progression[i]) : '';
      }
      setLevels(progStrings);
    } else {
      setFormData({ name: '', reset_on: 'Long Rest', has_die: false, dice_type: '', progression: {} });
      setLevels({});
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData(prev => ({...prev, has_die: e.target.checked}));
  }

  const handleLevelChange = (level: number, value: string) => {
    setLevels(prev => ({ ...prev, [level]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // CORRECCIÓN 1: Eliminamos 'lastValue' que no se usaba
    const cleanProgression: Record<string, number> = {};
    
    Object.entries(levels).forEach(([lvl, val]) => {
        if (val.trim() !== '') {
            cleanProgression[lvl] = parseFloat(val); 
        }
    });

    // CORRECCIÓN 2: Reemplazamos 'as any' por un casteo seguro
    onSave({ 
        ...formData, 
        progression: cleanProgression,
        dnd_class: classId 
    } as unknown as Partial<ClassResource>);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 font-body text-stone-800">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <label className="block mb-1 font-semibold">Nombre del Recurso</label>
            <Input name="name" value={formData.name} onChange={handleChange} required placeholder="Ej: Ki Points" />
        </div>
        <div>
            <label className="block mb-1 font-semibold">Recuperación</label>
            <Dropdown 
                name="reset_on" 
                value={formData.reset_on} 
                onChange={handleChange} 
                options={[
                    {value: 'Short Rest', label: 'Descanso Corto'},
                    {value: 'Long Rest', label: 'Descanso Largo'},
                    {value: 'Special', label: 'Especial'},
                ]} 
            />
        </div>
      </div>

      <div className="flex items-center gap-4 p-4 bg-stone-100 rounded border border-stone-200">
         <Checkbox label="¿Usa Dados?" checked={formData.has_die} onChange={handleCheckbox} />
         {formData.has_die && (
             <div className="flex-grow">
                 <Input name="dice_type" value={formData.dice_type} onChange={handleChange} placeholder="Ej: d6 (opcional)" />
             </div>
         )}
      </div>

      <div>
        <label className="block mb-2 font-semibold">Progresión por Nivel</label>
        <p className="text-xs text-stone-500 mb-2">Ingresa el valor (cantidad de usos, daño, etc.) para cada nivel.</p>
        
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-10 gap-2">
            {Array.from({ length: 20 }, (_, i) => i + 1).map((lvl) => (
                <div key={lvl} className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-stone-400 uppercase">Lvl {lvl}</span>
                    <input 
                        type="text" 
                        value={levels[lvl] || ''}
                        onChange={(e) => handleLevelChange(lvl, e.target.value)}
                        className="w-full text-center py-1 px-1 rounded border border-stone-300 focus:ring-1 focus:ring-bosque text-sm"
                    />
                </div>
            ))}
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" variant="primary">Guardar Recurso</Button>
      </div>
    </form>
  );
}