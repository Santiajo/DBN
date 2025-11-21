'use client';

import { useState, useEffect } from 'react';
import { Personaje, PersonajeFormData, DnDSpecies, Habilidad, Proficiencia } from '@/types';
import { DnDClass } from '@/types';
import { DnDSubclass } from '@/types';
import { DnDFeat } from '@/types';

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

// Interfaz auxiliar para manejar la respuesta de la API de Django Rest Framework
interface PaginatedResponse<T> {
    count: number;
    results: T[];
}

const defaultFormState: PersonajeFormData = {
  nombre_personaje: '',
  clase: null,
  subclase: null,
  nivel: 1,
  especie: null,
  dotes: [],
  proficiencies: [],
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
  
  const [classesList, setClassesList] = useState<DnDClass[]>([]);
  const [subclassesList, setSubclassesList] = useState<DnDSubclass[]>([]);
  const [speciesList, setSpeciesList] = useState<DnDSpecies[]>([]);
  const [featsList, setFeatsList] = useState<DnDFeat[]>([]);
  const [skillsList, setSkillsList] = useState<Habilidad[]>([]);

  const [formData, setFormData] = useState<PersonajeFormData>(defaultFormState);
  const [filteredSubclasses, setFilteredSubclasses] = useState<DnDSubclass[]>([]);

  // 1. Cargar Catálogos
  useEffect(() => {
    const fetchCatalogs = async () => {
      if (!accessToken) return;
      const headers = { 'Authorization': `Bearer ${accessToken}` };
      
      try {
        const [resClasses, resSubclasses, resSpecies, resFeats, resSkills] = await Promise.all([
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/classes/`, { headers }),
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subclasses/`, { headers }),
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/species/`, { headers }),
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/feats/`, { headers }),
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/habilidades/`, { headers })
        ]);

        // CORRECCIÓN: Usamos 'as PaginatedResponse<T>' en lugar de 'as any'
        if (resClasses.ok) {
            const data = await resClasses.json() as PaginatedResponse<DnDClass>;
            setClassesList(data.results || []);
        }
        if (resSubclasses.ok) {
            const data = await resSubclasses.json() as PaginatedResponse<DnDSubclass>;
            setSubclassesList(data.results || []);
        }
        if (resSpecies.ok) {
            const data = await resSpecies.json() as PaginatedResponse<DnDSpecies>;
            setSpeciesList(data.results || []);
        }
        if (resFeats.ok) {
            const data = await resFeats.json() as PaginatedResponse<DnDFeat>;
            setFeatsList(data.results || []);
        }
        if (resSkills.ok) {
            const data = await resSkills.json() as PaginatedResponse<Habilidad>;
            setSkillsList(data.results || []);
        }

      } catch (error) { console.error("Error cargando catálogos:", error); }
    };
    fetchCatalogs();
  }, [accessToken]);

  // 2. Cargar Datos Iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      if (initialData) {
        const { id, user, ...rest } = initialData;
        
        let existingSkills: number[] = [];
        if (accessToken) {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/proficiencias/?personaje=${id}`, {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    // Manejo seguro de paginación o array directo
                    const profs: Proficiencia[] = Array.isArray(data) ? data : (data as PaginatedResponse<Proficiencia>).results;
                    
                    existingSkills = profs
                        .filter(p => p.es_proficiente)
                        .map(p => p.habilidad);
                }
            } catch (err) { console.error("Error cargando proficiencias:", err); }
        }

        setFormData({ ...rest, proficiencies: existingSkills });
      } else {
        setFormData(defaultFormState);
      }
    };
    loadInitialData();
  }, [initialData, accessToken]);

  // 3. Filtrar Subclases
  useEffect(() => {
    if (formData.clase) {
      const filtered = subclassesList.filter(s => s.dnd_class === formData.clase);
      setFilteredSubclasses(filtered);
    } else {
      setFilteredSubclasses([]);
    }
  }, [formData.clase, subclassesList]);

  // --- Handlers ---

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let val: string | number | null = value;
    if (type === 'number') val = parseInt(value, 10) || 0;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleIdChange = (name: string, value: string) => {
      const intVal = value ? parseInt(value, 10) : null;
      if (name === 'clase') {
          setFormData(prev => ({ ...prev, clase: intVal, subclase: null }));
      } else {
          setFormData(prev => ({ ...prev, [name]: intVal }));
      }
  };

  const toggleFeat = (featId: number) => {
      setFormData(prev => {
          const current = prev.dotes || [];
          return {
              ...prev,
              dotes: current.includes(featId) ? current.filter(id => id !== featId) : [...current, featId]
          };
      });
  };

  const toggleSkill = (skillId: number) => {
      setFormData(prev => {
          const current = prev.proficiencies || [];
          return {
              ...prev,
              proficiencies: current.includes(skillId) ? current.filter(id => id !== skillId) : [...current, skillId]
          };
      });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const classOptions: OptionType[] = [{ value: '', label: 'Selecciona Clase' }, ...classesList.map(c => ({ value: String(c.id), label: c.name }))];
  const subclassOptions: OptionType[] = [{ value: '', label: 'Selecciona Subclase' }, ...filteredSubclasses.map(s => ({ value: String(s.id), label: s.name }))];
  const speciesOptions: OptionType[] = [{ value: '', label: 'Selecciona Especie' }, ...speciesList.map(s => ({ value: String(s.id), label: s.name }))];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 font-body text-stone-800 max-h-[80vh] overflow-y-auto pr-4 scrollbar-custom">
      
      <div>
        <label htmlFor="nombre_personaje" className="block mb-1 font-semibold">Nombre del Personaje</label>
        <Input id="nombre_personaje" name="nombre_personaje" value={formData.nombre_personaje} onChange={handleChange} required />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block mb-1 font-semibold">Clase</label>
          <Dropdown name="clase" value={formData.clase ? String(formData.clase) : ''} onChange={(e) => handleIdChange('clase', e.target.value)} options={classOptions} />
        </div>
        <div>
          <label className="block mb-1 font-semibold">Subclase</label>
          <Dropdown name="subclase" value={formData.subclase ? String(formData.subclase) : ''} onChange={(e) => handleIdChange('subclase', e.target.value)} options={subclassOptions} />
           {formData.clase && filteredSubclasses.length === 0 && <span className="text-xs text-stone-500">Sin subclases disponibles</span>}
        </div>
        <div>
          <label className="block mb-1 font-semibold">Especie</label>
          <Dropdown name="especie" value={formData.especie ? String(formData.especie) : ''} onChange={(e) => handleIdChange('especie', e.target.value)} options={speciesOptions} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div><label className="block mb-1 font-semibold">Nivel</label><Input name="nivel" type="number" value={String(formData.nivel)} onChange={handleChange} /></div>
        <div><label className="block mb-1 font-semibold">Facción</label><Input name="faccion" value={formData.faccion} onChange={handleChange} /></div>
      </div>

      {/* Sección Habilidades (Skills) */}
      <div className="p-4 bg-stone-100 rounded-lg border border-stone-200">
          <h4 className="font-title text-lg mb-2 text-stone-700 border-b border-stone-300 pb-1">Habilidades (Skills)</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 border rounded bg-white">
              {skillsList.sort((a, b) => a.nombre.localeCompare(b.nombre)).map(skill => (
                  <Checkbox 
                      key={skill.id}
                      label={`${skill.nombre} (${skill.estadistica_asociada.substring(0,3)})`}
                      checked={formData.proficiencies?.includes(skill.id)}
                      onChange={() => toggleSkill(skill.id)}
                      className="text-sm"
                  />
              ))}
          </div>
      </div>

      {/* Sección Dotes */}
      <div className="p-4 bg-stone-100 rounded-lg border border-stone-200">
          <h4 className="font-title text-lg mb-2 text-stone-700 border-b border-stone-300 pb-1">Dotes (Feats)</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border rounded bg-white">
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
        <div><label className="block mb-1 font-semibold">Oro</label><Input name="oro" type="number" value={String(formData.oro)} onChange={handleChange} /></div>
        <div><label className="block mb-1 font-semibold">Checkpoints</label><Input name="treasure_points" type="number" value={String(formData.treasure_points)} onChange={handleChange} /></div>
        <div><label className="block mb-1 font-semibold">Tiempo Libre</label><Input name="tiempo_libre" type="number" value={String(formData.tiempo_libre)} onChange={handleChange} /></div>
      </div>

      <h4 className="font-title border-b border-madera-oscura pb-1 mt-4">Estadísticas</h4>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
        {['fuerza', 'destreza', 'constitucion', 'inteligencia', 'sabiduria', 'carisma'].map(stat => (
            <div key={stat}>
                <label className="block mb-1 font-semibold text-center uppercase text-xs">{stat.substring(0,3)}</label>
                <Input name={stat} type="number" value={String(formData[stat as keyof PersonajeFormData])} onChange={handleChange} className="text-center" />
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