'use client';

import { useState, useEffect } from 'react';
import { Trabajo, Habilidad, PagoRango } from '@/types';
import Input from '@/components/input';
import Button from '@/components/button';
import Dropdown, { OptionType } from '@/components/dropdown';

interface TrabajoFormProps {
  onSave: (trabajo: Trabajo) => void;
  onCancel: () => void;
  initialData?: Trabajo | null;
  habilidades: Habilidad[];
}

// Valores por defecto para los pagos de cada rango
const pagosPorDefecto: PagoRango[] = [
  { rango: 1, valor_suma: 1, multiplicador: 1.25 },
  { rango: 2, valor_suma: 1, multiplicador: 3.75 },
  { rango: 3, valor_suma: 2, multiplicador: 7.5 },
  { rango: 4, valor_suma: 3, multiplicador: 15 },
  { rango: 5, valor_suma: 4, multiplicador: 45 },
];

export default function TrabajoForm({ onSave, onCancel, initialData, habilidades }: TrabajoFormProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    requisito_habilidad: habilidades.length > 0 ? habilidades[0].id : 0,
    rango_maximo: 5,
    descripcion: '',
    beneficio: '',
  });

  const [pagos, setPagos] = useState<PagoRango[]>(pagosPorDefecto);

  const habilidadOptions: OptionType[] = habilidades.map(habilidad => ({
    value: String(habilidad.id),
    label: habilidad.nombre
  }));

  useEffect(() => {
    if (initialData) {
      setFormData({
        nombre: initialData.nombre || '',
        requisito_habilidad: initialData.requisito_habilidad || (habilidades.length > 0 ? habilidades[0].id : 0),
        rango_maximo: initialData.rango_maximo || 5,
        descripcion: initialData.descripcion || '',
        beneficio: initialData.beneficio || '',
      });

      // Si hay pagos existentes, cargarlos
      if (initialData.pagos && initialData.pagos.length > 0) {
        setPagos(initialData.pagos);
      }
    }
  }, [initialData, habilidades]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'rango_maximo' || name === 'requisito_habilidad' 
        ? Number(value) 
        : value 
    }));
  };

  const handlePagoChange = (rango: number, field: 'valor_suma' | 'multiplicador', value: string) => {
    setPagos(prev => 
      prev.map(pago => 
        pago.rango === rango 
          ? { ...pago, [field]: Number(value) }
          : pago
      )
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Preparar datos para enviar
    const trabajoData: Trabajo = {
      ...(initialData || {}),
      ...formData,
      requisito_habilidad: Number(formData.requisito_habilidad),
      pagos: pagos, // Incluir los pagos en los datos
    };
    
    onSave(trabajoData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 font-body text-stone-800">
      {/* SECCIÓN INFORMACIÓN BÁSICA */}
      <div className="bg-pergamino/30 p-4 rounded-lg">
        <h3 className="font-title text-lg mb-4 text-madera-oscura">Información del Trabajo</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block mb-1 font-semibold">Nombre del Trabajo *</label>
            <Input 
              name="nombre" 
              value={formData.nombre} 
              onChange={handleChange} 
              required 
              placeholder="Ej: Atleta"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-semibold">Requisito de Habilidad *</label>
              <Dropdown 
                name="requisito_habilidad" 
                value={String(formData.requisito_habilidad)} 
                onChange={handleChange} 
                options={habilidadOptions}
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold">Rango Máximo *</label>
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

          <div>
            <label className="block mb-1 font-semibold">Descripción</label>
            <textarea 
              name="descripcion" 
              rows={3} 
              value={formData.descripcion}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-stone-400 bg-white focus:ring-2 focus:ring-bosque scrollbar-custom"
              placeholder="Describe las tareas y responsabilidades del trabajo..."
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold">Beneficio</label>
            <textarea 
              name="beneficio" 
              rows={2} 
              value={formData.beneficio}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-stone-400 bg-white focus:ring-2 focus:ring-bosque scrollbar-custom"
              placeholder="Beneficios o recompensas por realizar este trabajo..."
            />
          </div>
        </div>
      </div>

      {/* SECCIÓN PAGOS POR RANGO */}
      <div className="bg-pergamino/30 p-4 rounded-lg">
        <h3 className="font-title text-lg mb-4 text-madera-oscura">Pagos por Rango</h3>
        <p className="text-sm text-stone-600 mb-4">
          Fórmula: (<strong>Valor Suma</strong> + Bono de Economía) × <strong>Multiplicador</strong>
        </p>
        
        <div className="space-y-3">
          {pagos.map((pago) => (
            <div key={pago.rango} className="grid grid-cols-12 gap-2 items-center p-3 bg-white rounded-lg border border-stone-200">
              <div className="col-span-2">
                <span className="font-semibold text-sm">Rango {pago.rango}</span>
              </div>
              
              <div className="col-span-5">
                <label className="block text-xs text-stone-500 mb-1">Valor Suma</label>
                <Input 
                  type="number"
                  step="0.1"
                  value={String(pago.valor_suma)}
                  onChange={(e) => handlePagoChange(pago.rango, 'valor_suma', e.target.value)}
                  className="text-sm"
                />
              </div>
              
              <div className="col-span-5">
                <label className="block text-xs text-stone-500 mb-1">Multiplicador</label>
                <Input 
                  type="number"
                  step="0.01"
                  value={String(pago.multiplicador)}
                  onChange={(e) => handlePagoChange(pago.rango, 'multiplicador', e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>
          ))}
        </div>

        {/* EJEMPLO DE FÓRMULA */}
        <div className="mt-4 p-3 bg-bosque/10 rounded-lg">
          <p className="text-sm font-semibold mb-2">Ejemplo de cálculo (Rango 1):</p>
          <p className="text-xs font-mono bg-white p-2 rounded">
            ({pagos[0]?.valor_suma || 1} + Bono de Economía) × {pagos[0]?.multiplicador || 1.25}
          </p>
        </div>
      </div>

      {/* BOTONES */}
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