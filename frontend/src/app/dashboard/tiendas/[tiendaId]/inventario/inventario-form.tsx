'use client';

import { useState, useEffect } from 'react';
import { Objeto, ObjetoTienda } from '@/types';
import Input from '@/components/input';
import Button from '@/components/button';

export interface InventarioFormData {
  objeto: string; // Guardaremos el ID del objeto como string para el select
  stock: number;
  precio_personalizado?: number | string; // Puede ser string por el input
}

interface InventarioFormProps {
  onSave: (data: InventarioFormData) => void;
  onCancel: () => void;
  initialData?: ObjetoTienda | null;
  objetosList: Objeto[]; // Lista de todos los objetos para el dropdown
}

export default function InventarioItemForm({
  onSave,
  onCancel,
  initialData,
  objetosList,
}: InventarioFormProps) {
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 font-body text-stone-800">
      <div>
        <label htmlFor="objeto" className="block mb-1 font-semibold">Objeto</label>
        <select
          id="objeto"
          name="objeto"
          value={formData.objeto}
          onChange={handleChange}
          required
          // Deshabilitamos el select si estamos editando, no se debe cambiar el objeto
          disabled={!!initialData}
          className="w-full px-4 py-2 rounded-lg border border-stone-400 bg-white focus:ring-2 focus:ring-bosque disabled:bg-stone-200 disabled:cursor-not-allowed"
        >
          <option value="" disabled>Selecciona un objeto...</option>
          {objetosList.map((obj) => (
            <option key={obj.id} value={obj.id}>
              {obj.Name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <label htmlFor="stock" className="block mb-1 font-semibold">Stock</label>
            <Input
                id="stock"
                name="stock"
                type="number"
                min="0"
                value={formData.stock}
                onChange={handleChange}
                required
            />
        </div>
        <div>
            <label htmlFor="precio_personalizado" className="block mb-1 font-semibold">Precio Personalizado (Oro)</label>
            <Input
                id="precio_personalizado"
                name="precio_personalizado"
                type="number"
                min="0"
                value={formData.precio_personalizado}
                onChange={handleChange}
                placeholder="Dejar en blanco para usar valor por defecto"
            />
        </div>
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