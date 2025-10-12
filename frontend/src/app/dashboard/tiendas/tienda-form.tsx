'use client';

import { useState, useEffect } from 'react';
import { Tienda } from '@/types';
import Input from '@/components/input';
import Button from '@/components/button';

interface TiendaFormProps {
  onSave: (tienda: Omit<Tienda, 'id' | 'inventario'>) => void;
  onCancel: () => void;
  initialData?: Tienda | null;
}

export default function TiendaForm({ onSave, onCancel, initialData }: TiendaFormProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    npc_asociado: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        nombre: initialData.nombre || '',
        descripcion: initialData.descripcion || '',
        npc_asociado: initialData.npc_asociado || '',
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 font-body text-stone-800">
      {/* Campo para el nombre de la tienda */}
      <div>
        <label htmlFor="nombre" className="block mb-1 font-semibold">Nombre de la Tienda</label>
        <Input
          id="nombre"
          name="nombre"
          value={formData.nombre}
          onChange={handleChange}
          required
          placeholder="Ej: La Botica del Alquimista"
        />
      </div>

      {/* Campo para el NPC asociado */}
      <div>
        <label htmlFor="npc_asociado" className="block mb-1 font-semibold">NPC que la regenta</label>
        <Input
          id="npc_asociado"
          name="npc_asociado"
          value={formData.npc_asociado}
          onChange={handleChange}
          placeholder="Ej: Elminster Aumar"
        />
      </div>

      {/* Campo para la descripción de la tienda */}
      <div>
        <label htmlFor="descripcion" className="block mb-1 font-semibold">Descripción</label>
        <textarea
          id="descripcion"
          name="descripcion"
          rows={5}
          value={formData.descripcion}
          onChange={handleChange}
          className="w-full px-4 py-2 rounded-lg border border-stone-400 bg-white focus:ring-2 focus:ring-bosque scrollbar-custom"
          placeholder="Una breve descripción de la tienda, su ambiente, lo que vende, etc."
        />
      </div>

      {/* Botones de acción */}
      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary">
          {initialData ? 'Guardar Cambios' : 'Crear Tienda'}
        </Button>
      </div>
    </form>
  );
}