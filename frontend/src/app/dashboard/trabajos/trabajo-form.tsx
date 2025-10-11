'use client';

import { useState, useEffect } from 'react';
import { Trabajo, Habilidad } from '@/types';
import Input from '@/components/input';
import Button from '@/components/button';
import Dropdown, { OptionType } from '@/components/dropdown';

interface TrabajoFormProps {
  onSave: (trabajo: Trabajo) => void;
  onCancel: () => void;
  initialData?: Trabajo | null;
  habilidades: Habilidad[];
}

export default function TrabajoForm({ onSave, onCancel, initialData, habilidades }: TrabajoFormProps) {
  const [formData, setFormData] = useState<Omit<Trabajo, 'id'>>({
    nombre: '',
    requisito_habilidad: 0,
    rango_maximo: 1,
    descripcion: '',
    beneficio: '', 
  });

  const habilidadOptions: OptionType[] = habilidades.map(habilidad => ({
    value: String(habilidad.id),
    label: habilidad.nombre
  }));

  useEffect(() => {
    if (initialData) {
      setFormData({
        nombre: initialData.nombre || '',
        requisito_habilidad: initialData.requisito_habilidad || 0,
        rango_maximo: initialData.rango_maximo || 1,
        descripcion: initialData.descripcion || '',
        beneficio: initialData.beneficio || '',
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'rango_maximo' || name === 'requisito_habilidad' 
        ? Number(value) 
        : value 
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave = {
      ...formData,
      requisito_habilidad: Number(formData.requisito_habilidad)
    };
    onSave({ ...initialData, ...dataToSave } as Trabajo);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 font-body text-stone-800">
      {/* NOMBRE */}
      <div>
        <label className="block mb-1 font-semibold">Nombre del Trabajo</label>
        <Input 
          name="nombre" 
          value={formData.nombre} 
          onChange={handleChange} 
          required 
          placeholder="Ej: Cazador de recompensas"
        />
      </div>

      {/* HABILIDAD Y RANGO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-1 font-semibold">Requisito de Habilidad</label>
          <Dropdown 
            name="requisito_habilidad" 
            value={String(formData.requisito_habilidad)} 
            onChange={handleChange} 
            options={habilidadOptions}
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-semibold">Rango Máximo</label>
          <Input 
            name="rango_maximo" 
            type="number" 
            value={String(formData.rango_maximo)} 
            onChange={handleChange}
            min="1"
            max="5"
            required
          />
        </div>
      </div>

      {/* DESCRIPCIÓN */}
      <div>
        <label className="block mb-1 font-semibold">Descripción</label>
        <textarea 
          name="descripcion" 
          rows={4} 
          value={formData.descripcion || ''}
          onChange={handleChange}
          className="w-full px-4 py-2 rounded-lg border border-stone-400 bg-white focus:ring-2 focus:ring-bosque scrollbar-custom"
          placeholder="Describe las tareas y responsabilidades del trabajo..."
          required
        />
      </div>

      {/* BENEFICIO - CORREGIDO */}
      <div>
        <label className="block mb-1 font-semibold">Beneficio</label>
        <textarea 
          name="beneficio" 
          rows={3} 
          value={formData.beneficio || ''}  // ✅ CORREGIDO: era formData.descripcion
          onChange={handleChange}
          className="w-full px-4 py-2 rounded-lg border border-stone-400 bg-white focus:ring-2 focus:ring-bosque scrollbar-custom"
          placeholder="Beneficios o recompensas por realizar este trabajo..."
        />
      </div>

      {/* BOTONES IDÉNTICOS A OBJETOS */}
      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary">
          {initialData ? 'Guardar Cambios' : 'Crear Trabajo'}
        </Button>
      </div>
    </form>
  );
}