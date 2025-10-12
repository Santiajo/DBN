'use client';

import { useState, useEffect } from 'react';
import { Objeto, InventarioItem } from '@/types';
import Input from '@/components/input';
import Button from '@/components/button';
// Reutilizamos el buscador de objetos que ya creamos. ¡Modularidad al poder!
import ObjectSearch from '@/app/dashboard/tiendas/[tiendaId]/inventario/buscador-objeto';

export interface InventarioPersonajeFormData {
  objeto: string; // Guardamos el ID del objeto
  cantidad: number;
}

interface InventarioPersonajeFormProps {
  onSave: (data: InventarioPersonajeFormData) => void;
  onCancel: () => void;
  initialData?: InventarioItem | null;
  objetosList: Objeto[]; // La lista completa de objetos para el buscador
}

export default function InventarioPersonajeForm({
  onSave,
  onCancel,
  initialData,
  objetosList,
}: InventarioPersonajeFormProps) {
  const [formData, setFormData] = useState<InventarioPersonajeFormData>({
    objeto: '',
    cantidad: 1,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        objeto: String(initialData.objeto),
        cantidad: initialData.cantidad,
      });
    }
  }, [initialData]);

  const handleObjectSelect = (objectId: string) => {
    setFormData(prev => ({ ...prev, objeto: objectId }));
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };
  
  const initialObjectName = initialData
    ? objetosList.find(o => o.id === initialData.objeto)?.Name
    : '';

  return (
    <form onSubmit={handleSubmit} className="space-y-6 font-body text-stone-800">
      <div>
        <label className="block mb-1 font-semibold">Objeto</label>
        <ObjectSearch
          objetosList={objetosList}
          onObjectSelect={handleObjectSelect}
          initialObjectName={initialObjectName}
          disabled={!!initialData} // Deshabilitamos si estamos editando
        />
      </div>

      <div>
        <label htmlFor="cantidad" className="block mb-1 font-semibold">Cantidad</label>
        <Input
            id="cantidad"
            name="cantidad"
            type="number"
            min="1"
            value={formData.cantidad}
            onChange={handleChange}
            required
        />
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary">
          {initialData ? 'Guardar Cambios' : 'Añadir al Inventario'}
        </Button>
      </div>
    </form>
  );
}