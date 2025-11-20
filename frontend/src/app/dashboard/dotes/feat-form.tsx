'use client';

import { useState, useEffect } from 'react';
import { DnDFeat, DnDFeatPayload, FeatType } from '@/types';
import { DnDSpecies } from '@/types'; // Asegúrate de tener este tipo importado
import Input from '@/components/input';
import Button from '@/components/button';
import Dropdown, { OptionType } from '@/components/dropdown';
import Checkbox from '@/components/checkbox';
import { useAuth } from '@/context/AuthContext';

interface FeatFormProps {
  onSave: (data: DnDFeatPayload) => void;
  onCancel: () => void;
  initialData?: DnDFeat | null;
}

const FEAT_TYPES: OptionType[] = [
  { value: 'Origin', label: 'Origen' },
  { value: 'General', label: 'General' },
  { value: 'Epic Boon', label: 'Don Épico' },
  { value: 'Fighting Style', label: 'Estilo de Combate' },
];

export default function FeatForm({ onSave, onCancel, initialData }: FeatFormProps) {
  const { accessToken } = useAuth();
  
  // Datos para selectores
  const [availableSpecies, setAvailableSpecies] = useState<DnDSpecies[]>([]);
  const [availableFeats, setAvailableFeats] = useState<DnDFeat[]>([]);
  
  // Estado del formulario
  const [formData, setFormData] = useState<DnDFeatPayload>({
    name: '',
    feat_type: 'General',
    description: '',
    source: 'PHB',
    prerequisite_level: 0,
    prerequisite_species: null,
    prerequisite_feat: null,
    prerequisite_text: '',
    ability_score_increase: '',
    repeatable: false,
  });

  // 1. Cargar Especies y Dotes existentes (para prerrequisitos)
  useEffect(() => {
    const fetchData = async () => {
      if (!accessToken) return;
      try {
        // Especies
        const resSpecies = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/species/`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (resSpecies.ok) {
            const data = await resSpecies.json();
            setAvailableSpecies(data.results || []);
        }

        // Otros Dotes (para cadenas de dotes)
        const resFeats = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/feats/`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (resFeats.ok) {
            const data = await resFeats.json();
            setAvailableFeats(data.results || []);
        }
      } catch (error) { console.error("Error cargando dependencias", error); }
    };
    fetchData();
  }, [accessToken]);

  // 2. Cargar Datos Iniciales
  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id,
        slug: initialData.slug,
        name: initialData.name,
        feat_type: initialData.feat_type,
        description: initialData.description,
        source: initialData.source,
        prerequisite_level: initialData.prerequisite_level,
        prerequisite_species: initialData.prerequisite_species,
        prerequisite_feat: initialData.prerequisite_feat,
        prerequisite_text: initialData.prerequisite_text,
        ability_score_increase: initialData.ability_score_increase,
        repeatable: initialData.repeatable,
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const processedValue: string | number = type === 'number' ? (parseInt(value, 10) || 0) : value;
    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };

  // Manejo de Dropdowns de Prerrequisitos (retornan string, necesitamos number o null)
  const handlePrereqChange = (field: 'prerequisite_species' | 'prerequisite_feat', value: string) => {
      setFormData(prev => ({ 
          ...prev, 
          [field]: value === '' ? null : parseInt(value, 10) 
      }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  // Opciones para Dropdowns
  const speciesOptions: OptionType[] = [
      { value: '', label: 'Ninguna' },
      ...availableSpecies.map(s => ({ value: String(s.id), label: s.name }))
  ];
  
  const featOptions: OptionType[] = [
      { value: '', label: 'Ninguno' },
      ...availableFeats
          .filter(f => f.id !== initialData?.id) // Evitar auto-referencia
          .map(f => ({ value: String(f.id), label: f.name }))
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-stone-800 font-body">
      
      {/* Datos Básicos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-1 font-semibold">Nombre del Dote</label>
          <Input name="name" value={formData.name} onChange={handleChange} required placeholder="Ej: Athlete" />
        </div>
        <div>
          <label className="block mb-1 font-semibold">Tipo</label>
          <Dropdown 
            name="feat_type" 
            value={formData.feat_type} 
            onChange={handleChange} 
            options={FEAT_TYPES} 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <label className="block mb-1 font-semibold">Fuente</label>
            <Input name="source" value={formData.source} onChange={handleChange} />
        </div>
        <div className="flex items-end pb-3">
            <Checkbox 
                label="Repetible (Se puede tomar varias veces)" 
                checked={formData.repeatable} 
                onChange={(e) => setFormData(prev => ({ ...prev, repeatable: e.target.checked }))}
            />
        </div>
      </div>

      <div>
        <label className="block mb-1 font-semibold">Descripción (Flavor)</label>
        <textarea 
            name="description" rows={3} value={formData.description} onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-stone-400 bg-white focus:ring-2 focus:ring-bosque"
        />
      </div>

      {/* Sección Prerrequisitos */}
      <div className="p-4 bg-stone-100 rounded-lg border border-stone-200">
        <h3 className="font-title text-lg mb-3 text-stone-700 border-b border-stone-300 pb-1">Prerrequisitos</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
                <label className="block mb-1 font-semibold text-sm">Nivel Mínimo</label>
                <Input type="number" name="prerequisite_level" value={String(formData.prerequisite_level)} onChange={handleChange} />
            </div>
            <div>
                <label className="block mb-1 font-semibold text-sm">Requiere Especie</label>
                <Dropdown 
                    name="prerequisite_species" 
                    value={formData.prerequisite_species ? String(formData.prerequisite_species) : ''} 
                    onChange={(e) => handlePrereqChange('prerequisite_species', e.target.value)} 
                    options={speciesOptions} 
                />
            </div>
            <div>
                <label className="block mb-1 font-semibold text-sm">Requiere Dote</label>
                <Dropdown 
                    name="prerequisite_feat" 
                    value={formData.prerequisite_feat ? String(formData.prerequisite_feat) : ''} 
                    onChange={(e) => handlePrereqChange('prerequisite_feat', e.target.value)} 
                    options={featOptions} 
                />
            </div>
        </div>
        <div>
            <label className="block mb-1 font-semibold text-sm">Otro Requisito (Texto)</label>
            <Input name="prerequisite_text" value={formData.prerequisite_text} onChange={handleChange} placeholder="Ej: Strength 13+, Spellcasting feature..." />
        </div>
      </div>

      {/* Beneficios */}
      <div className="p-4 bg-stone-100 rounded-lg border border-stone-200">
         <h3 className="font-title text-lg mb-3 text-stone-700">Beneficios</h3>
         <div>
            <label className="block mb-1 font-semibold text-sm">Aumento de Característica (ASI)</label>
            <textarea 
                name="ability_score_increase" rows={2} value={formData.ability_score_increase} onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-stone-300 bg-white text-sm focus:ring-2 focus:ring-bosque"
                placeholder="Ej: Increase Strength or Dexterity by 1, to a maximum of 20."
            />
         </div>
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" variant="primary">Guardar Dote</Button>
      </div>
    </form>
  );
}