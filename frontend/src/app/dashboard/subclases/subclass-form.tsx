'use client';

import { useState, useEffect } from 'react';
import { DnDSubclass, DnDSubclassPayload } from '@/types';
import { DnDClass, Habilidad } from '@/types'; // Importamos tipos necesarios
import Input from '@/components/input';
import Button from '@/components/button';
import Dropdown, { OptionType } from '@/components/dropdown';
import Checkbox from '@/components/checkbox';
import { useAuth } from '@/context/AuthContext';

interface SubclassFormProps {
  onSave: (data: DnDSubclassPayload) => void;
  onCancel: () => void;
  initialData?: DnDSubclass | null;
}

export default function SubclassForm({ onSave, onCancel, initialData }: SubclassFormProps) {
  const { accessToken } = useAuth();
  
  // Datos para los selectores
  const [availableClasses, setAvailableClasses] = useState<DnDClass[]>([]);
  const [availableSkills, setAvailableSkills] = useState<Habilidad[]>([]);
  
  // Estado del formulario (Payload)
  const [formData, setFormData] = useState<DnDSubclassPayload>({
    name: '',
    description: '',
    source: 'PHB',
    dnd_class: 0, // ID de la clase padre
    skill_choices_ids: [],
    skill_choices_count: 0,
    bonus_proficiencies: '',
  });

  // Cargar Clases y Habilidades
  useEffect(() => {
    const fetchData = async () => {
      if (!accessToken) return;
      try {
        // Fetch Clases Padre
        const resClasses = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/classes/`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (resClasses.ok) {
            const data = await resClasses.json();
            setAvailableClasses(data.results || []);
        }

        // Fetch Habilidades
        const resSkills = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/habilidades/`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (resSkills.ok) {
            const data = await resSkills.json();
            setAvailableSkills(Array.isArray(data) ? data : data.results || []);
        }

      } catch (error) { console.error("Error cargando datos", error); }
    };
    fetchData();
  }, [accessToken]);

  // Cargar Datos Iniciales si es Edición
  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id,
        slug: initialData.slug,
        name: initialData.name,
        description: initialData.description,
        source: initialData.source,
        dnd_class: initialData.dnd_class,
        skill_choices_ids: initialData.skill_choices.map(s => s.id),
        skill_choices_count: initialData.skill_choices_count,
        bonus_proficiencies: initialData.bonus_proficiencies,
      });
    } else if (availableClasses.length > 0) {
        // Si es nuevo, pre-seleccionar la primera clase para evitar ID 0
        setFormData(prev => ({ ...prev, dnd_class: availableClasses[0].id }));
    }
  }, [initialData, availableClasses]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const processedValue: string | number = type === 'number' ? (parseInt(value, 10) || 0) : value;
    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };

  // Manejo de Dropdown (que retorna string)
  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setFormData(prev => ({ ...prev, dnd_class: parseInt(e.target.value, 10) }));
  };

  const toggleSkill = (skillId: number) => {
    setFormData(prev => {
      const current = prev.skill_choices_ids || [];
      return {
        ...prev,
        skill_choices_ids: current.includes(skillId)
          ? current.filter(id => id !== skillId)
          : [...current, skillId]
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  // Opciones para el Dropdown de clases
  const classOptions: OptionType[] = availableClasses.map(c => ({ value: String(c.id), label: c.name }));

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-stone-800 font-body">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-1 font-semibold">Nombre Subclase</label>
          <Input name="name" value={formData.name} onChange={handleChange} required placeholder="Ej: Battle Master" />
        </div>
        <div>
          <label className="block mb-1 font-semibold">Clase Padre</label>
          {/* Usamos Dropdown estándar. El value debe ser string */}
          <Dropdown 
            name="dnd_class" 
            value={String(formData.dnd_class)} 
            onChange={handleClassChange} 
            options={classOptions} 
          />
        </div>
      </div>

      <div>
        <label className="block mb-1 font-semibold">Fuente</label>
        <Input name="source" value={formData.source} onChange={handleChange} className="w-1/2" />
      </div>

      <div>
        <label className="block mb-1 font-semibold">Descripción</label>
        <textarea 
            name="description" rows={3} value={formData.description} onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-stone-400 bg-white focus:ring-2 focus:ring-bosque"
            placeholder="Descripción general de la subclase..."
        />
      </div>

      {/* Proficiencias Extra */}
      <div className="p-4 bg-stone-100 rounded-lg border border-stone-200">
        <h3 className="font-title text-lg mb-3 text-stone-700">Proficiencias Adicionales</h3>
        
        <div className="mb-4">
            <label className="block mb-1 font-semibold text-sm">Otras Proficiencias (Texto)</label>
            <Input name="bonus_proficiencies" value={formData.bonus_proficiencies} onChange={handleChange} placeholder="Ej: Heavy Armor, Thieves' Tools..." />
        </div>

        <div className="flex justify-between items-center mb-2">
            <label className="font-semibold text-sm text-stone-700">Habilidades Extra Elegibles</label>
            <div className="flex items-center gap-2">
                <label className="text-xs font-semibold">Elegir:</label>
                <Input 
                    type="number" name="skill_choices_count" 
                    value={String(formData.skill_choices_count)} onChange={handleChange}
                    className="w-14 py-1 px-2 text-sm" 
                />
            </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 border rounded bg-white">
            {availableSkills.map(skill => (
                <Checkbox
                  key={skill.id}
                  label={`${skill.nombre}`}
                  checked={formData.skill_choices_ids?.includes(skill.id)}
                  onChange={() => toggleSkill(skill.id)}
                  className="text-sm"
                />
            ))}
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" variant="primary">Guardar Subclase</Button>
      </div>
    </form>
  );
}