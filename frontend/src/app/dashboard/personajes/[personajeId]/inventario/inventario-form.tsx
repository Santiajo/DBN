'use client';

import { useState, useEffect } from 'react';
import { Objeto, InventarioItem } from '@/types';
import Input from '@/components/input';
import Button from '@/components/button';
import ObjectSearch from '@/components/object-search';

export interface InventarioPersonajeFormData {
  objeto: string;
  cantidad: number;
}

interface InventarioPersonajeFormProps {
  onSave: (data: InventarioPersonajeFormData) => void;
  onCancel: () => void;
  initialData?: InventarioItem | null;
  objetosList: Objeto[];
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
  
  // Buscar el nombre inicial si estamos editando
  const initialObjectName = initialData
    ? objetosList.find(o => o.id === initialData.objeto)?.Name
    : '';

  return (
    <form onSubmit={handleSubmit} className="space-y-6 font-body text-stone-800">
      <div>
        <label className="block mb-1 font-semibold">Objeto</label>
        <ObjectSearch
          objetosList={objetosList} // Aquí es vital que la lista no esté vacía
          onObjectSelect={handleObjectSelect}
          initialObjectName={initialObjectName}
          disabled={!!initialData} // No permitir cambiar el objeto al editar la cantidad
        />
        {/* Validación visual simple */}
        {!formData.objeto && <p className="text-xs text-carmesi mt-1">* Selecciona un objeto de la lista</p>}
      </div>

      <div>
        <label htmlFor="cantidad" className="block mb-1 font-semibold">Cantidad</label>
        <Input
            id="cantidad"
            name="cantidad"
            type="number"
            min="1"
            value={String(formData.cantidad)}
            onChange={handleChange}
            required
        />
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" disabled={!formData.objeto}>
          {initialData ? 'Guardar Cambios' : 'Añadir al Inventario'}
        </Button>
      </div>
    </form>
  );
}