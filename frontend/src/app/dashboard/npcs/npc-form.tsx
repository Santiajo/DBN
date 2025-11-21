'use client';

import { useState, useEffect } from 'react';
import { NPC, NPCPayload } from '@/types';
import { DnDSpecies } from '@/types';
import Input from '@/components/input';
import Button from '@/components/button';
import Dropdown, { OptionType } from '@/components/dropdown';
import { useAuth } from '@/context/AuthContext';

interface NPCFormProps {
  onSave: (data: NPCPayload) => void;
  onCancel: () => void;
  initialData?: NPC | null;
}

// Estado inicial vacío
const defaultData: NPCPayload = {
  name: '',
  title: '',
  occupation: '',
  location: '',
  species: null,
  appearance: '',
  personality: '',
  reputation: '',
  gold: 0,
  sells: '',
  buys: '',
  benefit: '',
  secret_benefit: '',
  detriment: '',
  image_url: '',
};

interface PaginatedResponse<T> {
    results: T[];
}

export default function NPCForm({ onSave, onCancel, initialData }: NPCFormProps) {
  const { accessToken } = useAuth();
  
  // Estado del formulario
  const [formData, setFormData] = useState<NPCPayload>(defaultData);
  
  // Catálogo de especies
  const [speciesList, setSpeciesList] = useState<DnDSpecies[]>([]);

  // 1. Cargar Especies
  useEffect(() => {
    const fetchSpecies = async () => {
      if (!accessToken) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/species/`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (res.ok) {
          const data = (await res.json()) as PaginatedResponse<DnDSpecies>;
          setSpeciesList(data.results || []);
        }
      } catch (error) { console.error(error); }
    };
    fetchSpecies();
  }, [accessToken]);

  // 2. Cargar Datos Iniciales
  useEffect(() => {
    if (initialData) {
      // Filtramos solo los campos que necesitamos para el payload
      const { id, slug, species_name, ...rest } = initialData;
      setFormData(rest);
    } else {
      setFormData(defaultData);
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'number' ? (parseInt(value) || 0) : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleSpeciesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value ? parseInt(e.target.value) : null;
      setFormData(prev => ({ ...prev, species: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const speciesOptions: OptionType[] = [
      { value: '', label: 'Desconocida / Humano' },
      ...speciesList.map(s => ({ value: String(s.id), label: s.name }))
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 font-body text-stone-800 max-h-[80vh] overflow-y-auto pr-2 scrollbar-custom">
      
      {/* --- DATOS BÁSICOS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-1 font-semibold">Nombre</label>
          <Input name="name" value={formData.name} onChange={handleChange} required placeholder="General Bremour" />
        </div>
        <div>
          <label className="block mb-1 font-semibold">Título / Rango</label>
          <Input name="title" value={formData.title} onChange={handleChange} placeholder="Líder de expedición" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
            <label className="block mb-1 font-semibold">Ocupación</label>
            <Input name="occupation" value={formData.occupation} onChange={handleChange} placeholder="Soldado" />
        </div>
        <div>
            <label className="block mb-1 font-semibold">Ubicación</label>
            <Input name="location" value={formData.location} onChange={handleChange} placeholder="New Helmsport" />
        </div>
        <div>
            <label className="block mb-1 font-semibold">Especie</label>
            <Dropdown 
                name="species" 
                value={formData.species ? String(formData.species) : ''} 
                onChange={handleSpeciesChange} 
                options={speciesOptions} 
            />
        </div>
      </div>

      {/* --- ECONOMÍA --- */}
      <div className="p-4 bg-yellow-50/50 border border-yellow-200 rounded-lg">
          <h3 className="font-title text-yellow-800 mb-3 border-b border-yellow-200 pb-1">Economía y Comercio</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
             <div>
                <label className="block mb-1 font-semibold text-sm">Oro por Turno</label>
                <Input type="number" name="gold" value={String(formData.gold)} onChange={handleChange} />
             </div>
             <div className="md:col-span-2">
                {/* Espacio para futuro uso */}
             </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                <label className="block mb-1 font-semibold text-sm">¿Qué Vende?</label>
                <textarea name="sells" rows={2} value={formData.sells} onChange={handleChange} className="w-full p-2 text-sm border rounded" placeholder="Nada en particular..." />
             </div>
             <div>
                <label className="block mb-1 font-semibold text-sm">¿Qué Compra?</label>
                <textarea name="buys" rows={2} value={formData.buys} onChange={handleChange} className="w-full p-2 text-sm border rounded" placeholder="Armas marciales, escudos..." />
             </div>
          </div>
      </div>

      {/* --- NARRATIVA --- */}
      <div className="space-y-4">
          <h3 className="font-title text-stone-700 border-b border-stone-300 pb-1">Perfil Narrativo</h3>
          
          <div>
            <label className="block mb-1 font-semibold">Apariencia</label>
            <textarea name="appearance" rows={3} value={formData.appearance} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-stone-400 focus:ring-2 focus:ring-bosque" placeholder="Descripción física..." />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block mb-1 font-semibold">Personalidad</label>
                <textarea name="personality" rows={3} value={formData.personality} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-stone-400 focus:ring-2 focus:ring-bosque" />
            </div>
            <div>
                <label className="block mb-1 font-semibold">Reputación / Historia</label>
                <textarea name="reputation" rows={3} value={formData.reputation} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-stone-400 focus:ring-2 focus:ring-bosque" />
            </div>
          </div>
      </div>

      {/* --- BENEFICIOS Y CONSECUENCIAS --- */}
      <div className="p-4 bg-stone-100 rounded-lg border border-stone-200">
          <h3 className="font-title text-stone-700 mb-3">Relaciones e Influencia</h3>
          
          <div className="space-y-3">
            <div>
                <label className="block mb-1 font-semibold text-sm text-bosque">Beneficio Estándar</label>
                <input name="benefit" value={formData.benefit} onChange={handleChange} className="w-full px-3 py-2 rounded border border-bosque/30 focus:ring-1 focus:ring-bosque" placeholder="Ej: Paga 1.5x por objetos mágicos" />
            </div>
            <div>
                <label className="block mb-1 font-semibold text-sm text-purple-700">Beneficios Secretos (Rango Alto)</label>
                <input name="secret_benefit" value={formData.secret_benefit} onChange={handleChange} className="w-full px-3 py-2 rounded border border-purple-200 focus:ring-1 focus:ring-purple-500" placeholder="Beneficios ocultos..." />
            </div>
            <div>
                <label className="block mb-1 font-semibold text-sm text-carmesi">Perjuicio (Enemistad)</label>
                <input name="detriment" value={formData.detriment} onChange={handleChange} className="w-full px-3 py-2 rounded border border-carmesi/30 focus:ring-1 focus:ring-carmesi" placeholder="Consecuencias graves..." />
            </div>
          </div>
      </div>

      <div className="flex justify-end gap-4 pt-4 border-t border-stone-200">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" variant="primary">Guardar NPC</Button>
      </div>
    </form>
  );
}