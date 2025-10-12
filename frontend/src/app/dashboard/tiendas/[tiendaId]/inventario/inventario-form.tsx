'use client';

import { useState, useEffect } from 'react';
import { Objeto, ObjetoTienda } from '@/types';
import Input from '@/components/input';
import Button from '@/components/button';
import ObjectSearch from './buscador-objeto'; // Importamos el nuevo componente

export interface InventarioFormData {
  objeto: string;
  stock: number;
  precio_personalizado?: number | string;
}

interface InventarioItemFormProps {
  onSave: (data: InventarioFormData) => void;
  onCancel: () => void;
  initialData?: ObjetoTienda | null;
  objetosList: Objeto[];
}

export default function InventarioItemForm({
  onSave,
  onCancel,
  initialData,
  objetosList,
}: InventarioItemFormProps) {
  const [formData, setFormData] = useState<InventarioFormData>({
    objeto: '',
    stock: 1,
    precio_personalizado: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        objeto: String(initialData.objeto),
        stock: initialData.stock,
        precio_personalizado: initialData.precio_personalizado || '',
      });
    }
  }, [initialData]);

  const handleObjectSelect = (objectId: string) => {
    setFormData(prev => ({ ...prev, objeto: objectId }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
        <label htmlFor="objeto" className="block mb-1 font-semibold">Objeto</label>
        <ObjectSearch
          objetosList={objetosList}
          onObjectSelect={handleObjectSelect}
          initialObjectName={initialObjectName}
          disabled={!!initialData}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <label htmlFor="stock" className="block mb-1 font-semibold">Stock</label>
            <Input id="stock" name="stock" type="number" min="0" value={formData.stock} onChange={handleChange} required />
        </div>
        <div>
            <label htmlFor="precio_personalizado" className="block mb-1 font-semibold">Precio Personalizado (Oro)</label>
            <Input id="precio_personalizado" name="precio_personalizado" type="number" min="0" value={String(formData.precio_personalizado)} onChange={handleChange} placeholder="Opcional" />
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" variant="primary">{initialData ? 'Guardar Cambios' : 'Añadir al Inventario'}</Button>
      </div>
    </form>
  );
}