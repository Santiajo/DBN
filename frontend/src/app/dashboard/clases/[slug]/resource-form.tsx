'use client';

import { useState, useEffect } from 'react';
import { ClassResource } from '@/types';
import Input from '@/components/input';
import Button from '@/components/button';
import Dropdown from '@/components/dropdown';

interface ResourceFormProps {
  onSave: (data: Partial<ClassResource>) => void;
  onCancel: () => void;
  onDelete?: () => void; // Añadimos opción de borrar desde el modal si se desea
  initialData?: ClassResource | null;
  classId: number;
}

const STAT_OPTIONS = [
    { value: 'fuerza', label: 'Fuerza' },
    { value: 'destreza', label: 'Destreza' },
    { value: 'constitucion', label: 'Constitución' },
    { value: 'inteligencia', label: 'Inteligencia' },
    { value: 'sabiduria', label: 'Sabiduría' },
    { value: 'carisma', label: 'Carisma' },
];

export default function ResourceForm({ onSave, onCancel, initialData, classId }: ResourceFormProps) {
  const [formData, setFormData] = useState<Partial<ClassResource>>({
    name: '',
    reset_on: 'Long Rest',
    quantity_type: 'Fixed',
    quantity_stat: '',
    progression: {},
    value_progression: {},
  });

  // Estados para las cuadrículas de inputs
  const [qtyLevels, setQtyLevels] = useState<Record<string, string>>({});
  const [valLevels, setValLevels] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      
      // Cargar datos de cantidad
      const qStrings: Record<string, string> = {};
      for (let i = 1; i <= 20; i++) {
        qStrings[i] = initialData.progression?.[i] !== undefined ? String(initialData.progression[i]) : '';
      }
      setQtyLevels(qStrings);

      // Cargar datos de valor (dados)
      const vStrings: Record<string, string> = {};
      for (let i = 1; i <= 20; i++) {
        vStrings[i] = initialData.value_progression?.[i] || '';
      }
      setValLevels(vStrings);

    } else {
      setFormData({ 
          name: '', reset_on: 'Long Rest', quantity_type: 'Fixed', 
          quantity_stat: 'carisma', progression: {}, value_progression: {} 
      });
      setQtyLevels({});
      setValLevels({});
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const cleanQty: Record<string, number> = {};
    const cleanVal: Record<string, string> = {};
    
    // Procesar inputs de niveles
    for (let i = 1; i <= 20; i++) {
        if (qtyLevels[i]?.trim()) cleanQty[i] = parseFloat(qtyLevels[i]);
        if (valLevels[i]?.trim()) cleanVal[i] = valLevels[i].trim();
    }

    onSave({ 
        ...formData, 
        progression: cleanQty,
        value_progression: cleanVal,
        dnd_class: classId 
    } as unknown as Partial<ClassResource>);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 font-body text-stone-800">
      
      {/* Configuración General */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="col-span-2">
            <label className="block mb-1 font-semibold">Nombre del Recurso</label>
            <Input name="name" value={formData.name} onChange={handleChange} required placeholder="Ej: Bardic Inspiration" />
        </div>
        <div>
            <label className="block mb-1 font-semibold text-sm">Tipo de Cantidad</label>
            <Dropdown 
                name="quantity_type" 
                value={formData.quantity_type} 
                onChange={handleChange} 
                options={[
                    {value: 'Fixed', label: 'Tabla Fija (1, 2, 3...)'},
                    {value: 'Stat', label: 'Modificador de Estadística'},
                    {value: 'Proficiency', label: 'Bono de Competencia'},
                    {value: 'Unlimited', label: 'Ilimitado'},
                ]} 
            />
        </div>
        
        {/* Selector condicional de Estadística */}
        {formData.quantity_type === 'Stat' && (
             <div>
                <label className="block mb-1 font-semibold text-sm">Estadística Base</label>
                <Dropdown 
                    name="quantity_stat" 
                    value={formData.quantity_stat} 
                    onChange={handleChange} 
                    options={STAT_OPTIONS} 
                />
            </div>
        )}

        <div>
            <label className="block mb-1 font-semibold text-sm">Recuperación</label>
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

      <hr className="border-stone-200" />

      {/* Tabla de Progresión (Grid) */}
      <div>
        <div className="flex justify-between items-end mb-2">
             <label className="font-semibold text-stone-700">Progresión por Nivel</label>
             <span className="text-xs text-stone-500">Deja vacío si no aplica</span>
        </div>
        
        <div className="overflow-x-auto border border-stone-300 rounded-lg">
            <div className="min-w-[800px] grid grid-cols-[40px_repeat(20,1fr)] text-xs">
                {/* Header Niveles */}
                <div className="bg-stone-100 p-2 font-bold text-center border-b border-r border-stone-200">#</div>
                {Array.from({length: 20}, (_, i) => i + 1).map(lvl => (
                    <div key={lvl} className="bg-stone-100 p-1 text-center border-b border-stone-200 font-semibold text-stone-500">
                        {lvl}
                    </div>
                ))}

                {/* Fila Cantidad (Solo si es Fixed) */}
                {formData.quantity_type === 'Fixed' && (
                    <>
                        <div className="p-2 font-bold text-stone-600 border-r border-stone-200 bg-stone-50 flex items-center justify-center writing-mode-vertical">
                            Cant.
                        </div>
                        {Array.from({length: 20}, (_, i) => i + 1).map(lvl => (
                            <div key={lvl} className="border-r border-b border-stone-200 p-0.5">
                                <input 
                                    type="text" 
                                    value={qtyLevels[lvl] || ''}
                                    onChange={(e) => setQtyLevels(prev => ({...prev, [lvl]: e.target.value}))}
                                    className="w-full h-full text-center bg-transparent focus:outline-none focus:bg-blue-50"
                                    placeholder="-"
                                />
                            </div>
                        ))}
                    </>
                )}

                {/* Fila Valor/Dado (Siempre visible) */}
                <div className="p-2 font-bold text-stone-600 border-r border-stone-200 bg-stone-50 flex items-center justify-center">
                    Valor
                </div>
                {Array.from({length: 20}, (_, i) => i + 1).map(lvl => (
                    <div key={lvl} className="border-r border-stone-200 p-0.5">
                        <input 
                            type="text" 
                            value={valLevels[lvl] || ''}
                            onChange={(e) => setValLevels(prev => ({...prev, [lvl]: e.target.value}))}
                            className="w-full h-full text-center bg-transparent focus:outline-none focus:bg-green-50 text-[10px]"
                            placeholder="d6"
                        />
                    </div>
                ))}
            </div>
        </div>
        <p className="text-xs text-stone-400 mt-1">
            * Fila <strong>Cant:</strong> Usos disponibles (si es tabla fija). <br/>
            * Fila <strong>Valor:</strong> Daño o dado específico (ej. "d6", "1d8").
        </p>
      </div>

      <div className="flex justify-end gap-4 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" variant="primary">Guardar Recurso</Button>
      </div>
    </form>
  );
}