'use client';

import { useState, useEffect } from 'react';
import { Personaje, PersonajeFormData } from '@/types';
import { DnDClass, DnDSubclass, DnDSpecies, DnDFeat } from '@/types';
import Input from '@/components/input';
import Button from '@/components/button';
import Dropdown, { OptionType } from '@/components/dropdown';
import Checkbox from '@/components/checkbox';
import { useAuth } from '@/context/AuthContext';

interface PersonajeFormProps {
  onSave: (personaje: PersonajeFormData) => void;
  onCancel: () => void;
  initialData?: Personaje | null;
}

// Estado inicial
const defaultFormState: PersonajeFormData = {
  nombre_personaje: '',
  clase: null,
  subclase: null,
  nivel: 1,
  especie: null,
  dotes: [],
  faccion: '',
  oro: 50,
  treasure_points: 0,
  treasure_points_gastados: 0,
  tiempo_libre: 0,
  fuerza: 10, inteligencia: 10, sabiduria: 10,
  destreza: 10, constitucion: 10, carisma: 10,
};

export default function PersonajeForm({ onSave, onCancel, initialData }: PersonajeFormProps) {
  const { accessToken } = useAuth();
  
  // Catalogos de datos
  const [classesList, setClassesList] = useState<DnDClass[]>([]);
  const [subclassesList, setSubclassesList] = useState<DnDSubclass[]>([]);
  const [speciesList, setSpeciesList] = useState<DnDSpecies[]>([]);
  const [featsList, setFeatsList] = useState<DnDFeat[]>([]);

  // Estado Formulario
  const [formData, setFormData] = useState<PersonajeFormData>(defaultFormState);
  
  // Subclases filtradas según la clase seleccionada
  const [filteredSubclasses, setFilteredSubclasses] = useState<DnDSubclass[]>([]);

  // Cargar Catálogos
  useEffect(() => {
    const fetchCatalogs = async () => {
      if (!accessToken) return;
      const headers = { 'Authorization': `Bearer ${accessToken}` };
      
      try {
        // Usamos Promise.all para cargar todo en paralelo
        const [resClasses, resSubclasses, resSpecies, resFeats] = await Promise.all([
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/classes/`, { headers }),
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subclasses/`, { headers }),
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/species/`, { headers }),
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/feats/`, { headers })
        ]);

        if (resClasses.ok) setClassesList((await resClasses.json()).results || []);
        if (resSubclasses.ok) setSubclassesList((await resSubclasses.json()).results || []);
        if (resSpecies.ok) setSpeciesList((await resSpecies.json()).results || []);
        if (resFeats.ok) setFeatsList((await resFeats.json()).results || []);

      } catch (error) {
        console.error("Error cargando catálogos:", error);
      }
    };
    fetchCatalogs();
  }, [accessToken]);

  // Cargar Datos Iniciales
  useEffect(() => {
    if (initialData) {
      const { id, user, ...rest } = initialData;
      setFormData(rest);
    } else {
      setFormData(defaultFormState);
    }
  }, [initialData]);

  // Filtrar Subclases cuando cambia la Clase
  useEffect(() => {
    if (formData.clase) {
      const filtered = subclassesList.filter(s => s.dnd_class === formData.clase);
      setFilteredSubclasses(filtered);
    } else {
      setFilteredSubclasses([]);
    }
  }, [formData.clase, subclassesList]);

  // Handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let val: string | number | null = value;

    if (type === 'number') {
        val = parseInt(value, 10) || 0;
    }

    setFormData(prev => ({ ...prev, [name]: val }));
  };

  // Handler para Dropdowns que retornan ID (Clase, Especie, Subclase)
  const handleIdChange = (name: string, value: string) => {
      const intVal = value ? parseInt(value, 10) : null;
      
      // Si cambiamos la clase, reseteamos la subclase
      if (name === 'clase') {
          setFormData(prev => ({ ...prev, clase: intVal, subclase: null }));
      } else {
          setFormData(prev => ({ ...prev, [name]: intVal }));
      }
  };

  // Handler para Dotes (Multi-select)
  const toggleFeat = (featId: number) => {
      setFormData(prev => {
          const current = prev.dotes || [];
          return {
              ...prev,
              dotes: current.includes(featId)
                ? current.filter(id => id !== featId)
                : [...current, featId]
          };
      });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  // Opciones para Dropdowns
  const classOptions: OptionType[] = [
      { value: '', label: 'Selecciona Clase' },
      ...classesList.map(c => ({ value: String(c.id), label: c.name }))
  ];
  
  const subclassOptions: OptionType[] = [
      { value: '', label: 'Selecciona Subclase' },
      ...filteredSubclasses.map(s => ({ value: String(s.id), label: s.name }))
  ];

  const speciesOptions: OptionType[] = [
      { value: '', label: 'Selecciona Especie' },
      ...speciesList.map(s => ({ value: String(s.id), label: s.name }))
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 font-body text-stone-800 max-h-[80vh] overflow-y-auto pr-4 scrollbar-custom">
      
      <div>
        <label htmlFor="nombre_personaje" className="block mb-1 font-semibold">Nombre del Personaje</label>
        <Input id="nombre_personaje" name="nombre_personaje" value={formData.nombre_personaje} onChange={handleChange} required />
      </div>
      
      {/* Sección Origen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block mb-1 font-semibold">Clase</label>
          <Dropdown 
            name="clase" 
            value={formData.clase ? String(formData.clase) : ''} 
            onChange={(e) => handleIdChange('clase', e.target.value)} 
            options={classOptions} 
          />
        </div>
        
        <div>
          <label className="block mb-1 font-semibold">Subclase</label>
          <Dropdown 
            name="subclase" 
            value={formData.subclase ? String(formData.subclase) : ''} 
            onChange={(e) => handleIdChange('subclase', e.target.value)} 
            options={subclassOptions}
          />
           {formData.clase && filteredSubclasses.length === 0 && (
               <span className="text-xs text-stone-500">Sin subclases disponibles</span>
           )}
        </div>

        <div>
          <label className="block mb-1 font-semibold">Especie</label>
          <Dropdown 
            name="especie" 
            value={formData.especie ? String(formData.especie) : ''} 
            onChange={(e) => handleIdChange('especie', e.target.value)} 
            options={speciesOptions} 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
            <label className="block mb-1 font-semibold">Nivel</label>
            <Input name="nivel" type="number" value={String(formData.nivel)} onChange={handleChange} />
        </div>
        <div>
             <label className="block mb-1 font-semibold">Facción</label>
             <Input name="faccion" value={formData.faccion} onChange={handleChange} />
        </div>
      </div>

      {/* Sección Dotes */}
      <div className="p-4 bg-stone-100 rounded-lg border border-stone-200">
          <h4 className="font-title text-lg mb-2 text-stone-700">Dotes (Feats)</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 border rounded bg-white">
              {featsList.map(feat => (
                  <Checkbox 
                      key={feat.id}
                      label={feat.name}
                      checked={formData.dotes.includes(feat.id)}
                      onChange={() => toggleFeat(feat.id)}
                      className="text-sm"
                  />
              ))}
          </div>
      </div>

      <h4 className="font-title border-b border-madera-oscura pb-1 mt-4">Recursos</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
            <label className="block mb-1 font-semibold">Oro</label>
            <Input name="oro" type="number" value={String(formData.oro)} onChange={handleChange} />
        </div>
        <div>
            <label className="block mb-1 font-semibold">Checkpoints</label>
            <Input name="treasure_points" type="number" value={String(formData.treasure_points)} onChange={handleChange} />
        </div>
        <div>
            <label className="block mb-1 font-semibold">Tiempo Libre</label>
            <Input name="tiempo_libre" type="number" value={String(formData.tiempo_libre)} onChange={handleChange} />
        </div>
      </div>

      <h4 className="font-title border-b border-madera-oscura pb-1 mt-4">Estadísticas</h4>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
        {['fuerza', 'destreza', 'constitucion', 'inteligencia', 'sabiduria', 'carisma'].map(stat => (
            <div key={stat}>
                <label className="block mb-1 font-semibold text-center uppercase text-xs">{stat.substring(0,3)}</label>
                <Input 
                    name={stat} 
                    type="number" 
                    value={String(formData[stat as keyof PersonajeFormData])} 
                    onChange={handleChange} 
                    className="text-center" 
                />
            </div>
        ))}
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" variant="primary">{initialData ? 'Guardar Cambios' : 'Crear Personaje'}</Button>
      </div>
    </form>
  );
}