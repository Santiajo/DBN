'use client';

import { useState, useEffect } from 'react';
import { DnDClass, Habilidad, DnDClassPayload, StatName } from '@/types'; // Asegúrate de importar DnDClassPayload
import Input from '@/components/input';
import Button from '@/components/button';
import Dropdown, { OptionType } from '@/components/dropdown';
import Checkbox from '@/components/checkbox'; // <--- TU COMPONENTE
import { useAuth } from '@/context/AuthContext';

interface ClassFormProps {
    onSave: (data: DnDClassPayload) => void; // <--- TIPO CORREGIDO
    onCancel: () => void;
    initialData?: DnDClass | null;
}

// ... (CONSTANTES HIT_DIE_OPTIONS y STAT_OPTIONS igual que antes) ...
const HIT_DIE_OPTIONS: OptionType[] = [
    { value: '6', label: 'd6' }, { value: '8', label: 'd8' },
    { value: '10', label: 'd10' }, { value: '12', label: 'd12' },
];

const STAT_OPTIONS: { value: StatName; label: string }[] = [
    { value: 'fuerza', label: 'Fuerza' }, { value: 'destreza', label: 'Destreza' },
    { value: 'constitucion', label: 'Constitución' }, { value: 'inteligencia', label: 'Inteligencia' },
    { value: 'sabiduria', label: 'Sabiduría' }, { value: 'carisma', label: 'Carisma' },
];

export default function ClassForm({ onSave, onCancel, initialData }: ClassFormProps) {
    const { accessToken } = useAuth();
    const [availableSkills, setAvailableSkills] = useState<Habilidad[]>([]);

    // Estado inicial tipado como Payload (lo que vamos a enviar)
    const [formData, setFormData] = useState<DnDClassPayload>({
        name: '', description: '', source: 'PHB', hit_die: 8,
        primary_ability: 'fuerza', saving_throws: [],
        skill_choices_ids: [], // Inicializamos vacío
        skill_choices_count: 2, armor_proficiencies: '',
        weapon_proficiencies: '', tool_proficiencies: '', starting_equipment: '',
    });

    // Cargar Habilidades
    useEffect(() => {
        const fetchSkills = async () => {
            if (!accessToken) return;
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/habilidades/`, {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setAvailableSkills(Array.isArray(data) ? data : data.results || []);
                }
            } catch (error) { console.error(error); }
        };
        fetchSkills();
    }, [accessToken]);

    // Cargar Datos Iniciales
    useEffect(() => {
        if (initialData) {
            // Convertimos el objeto DnDClass (lectura) al formato Payload (escritura)
            setFormData({
                id: initialData.id,
                name: initialData.name,
                slug: initialData.slug, // Importante para el update
                description: initialData.description,
                source: initialData.source,
                hit_die: initialData.hit_die,
                primary_ability: initialData.primary_ability,
                saving_throws: initialData.saving_throws, // Es array de strings, pasa directo
                // Aquí extraemos solo los IDs de los objetos completos
                skill_choices_ids: initialData.skill_choices.map(s => s.id),
                skill_choices_count: initialData.skill_choices_count,
                armor_proficiencies: initialData.armor_proficiencies,
                weapon_proficiencies: initialData.weapon_proficiencies,
                tool_proficiencies: initialData.tool_proficiencies,
                starting_equipment: initialData.starting_equipment,
            });
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        let processedValue: any = value;
        if (type === 'number') processedValue = parseInt(value, 10) || 0;
        setFormData(prev => ({ ...prev, [name]: processedValue }));
    };

    // Manejo de Checkboxes usando tu componente
    const toggleSavingThrow = (stat: string) => {
        setFormData(prev => {
            const current = prev.saving_throws || [];
            return {
                ...prev,
                saving_throws: current.includes(stat)
                    ? current.filter(s => s !== stat)
                    : [...current, stat]
            };
        });
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

    return (
        <form onSubmit={handleSubmit} className="space-y-6 text-stone-800 font-body">

            {/* Básicos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block mb-1 font-semibold">Nombre</label>
                    <Input name="name" value={formData.name} onChange={handleChange} required />
                </div>
                <div>
                    <label className="block mb-1 font-semibold">Fuente (Source)</label>
                    <Input name="source" value={formData.source} onChange={handleChange} />
                </div>
            </div>

            <div>
                <label className="block mb-1 font-semibold">Descripción</label>
                <textarea
                    name="description" rows={3} value={formData.description} onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-stone-400 bg-white focus:ring-2 focus:ring-bosque"
                />
            </div>

            {/* Stats Core */}
            <div className="p-4 bg-stone-100 rounded-lg border border-stone-200">
                <h3 className="font-title text-lg mb-3 text-stone-700">Estadísticas Base</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block mb-1 font-semibold">Dado de Golpe</label>
                        <Dropdown
                            name="hit_die"
                            value={String(formData.hit_die)}
                            onChange={handleChange}
                            options={HIT_DIE_OPTIONS}
                        />
                    </div>
                    <div>
                        <label className="block mb-1 font-semibold">Habilidad Principal</label>
                        <Dropdown
                            name="primary_ability"
                            value={formData.primary_ability}
                            onChange={handleChange}
                            options={STAT_OPTIONS.map(s => ({ value: s.value, label: s.label }))}
                        />
                    </div>
                </div>

                {/* Saving Throws */}
                <div className="mt-4">
                    <label className="block mb-2 font-semibold">Competencia en Salvaciones</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {STAT_OPTIONS.map(stat => (
                            <Checkbox
                                key={stat.value}
                                label={stat.label}
                                checked={formData.saving_throws.includes(stat.value)}
                                onChange={() => toggleSavingThrow(stat.value)}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Skills */}
            <div className="p-4 bg-stone-100 rounded-lg border border-stone-200">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-title text-lg text-stone-700">Habilidades Elegibles</h3>
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-semibold">Elige:</label>
                        <Input type="number" name="skill_choices_count" value={String(formData.skill_choices_count)} onChange={handleChange} className="w-16 py-1 px-2" />
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 border rounded bg-white">
                    {availableSkills.map(skill => (
                        <Checkbox
                            key={skill.id}
                            label={`${skill.nombre} (${skill.estadistica_asociada.substring(0, 3)})`}
                            checked={formData.skill_choices_ids.includes(skill.id)}
                            onChange={() => toggleSkill(skill.id)}
                        />
                    ))}
                </div>
            </div>

            {/* Proficiencias Texto */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block mb-1 font-semibold text-sm">Armaduras</label>
                    <Input name="armor_proficiencies" value={formData.armor_proficiencies} onChange={handleChange} placeholder="Light, Medium..." />
                </div>
                <div>
                    <label className="block mb-1 font-semibold text-sm">Armas</label>
                    <Input name="weapon_proficiencies" value={formData.weapon_proficiencies} onChange={handleChange} placeholder="Simple weapons..." />
                </div>
                <div>
                    <label className="block mb-1 font-semibold text-sm">Herramientas</label>
                    <Input name="tool_proficiencies" value={formData.tool_proficiencies} onChange={handleChange} placeholder="Thieves' tools..." />
                </div>
            </div>

            <div>
                <label className="block mb-1 font-semibold">Equipo Inicial</label>
                <textarea
                    name="starting_equipment" rows={2} value={formData.starting_equipment} onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-stone-400 bg-white focus:ring-2 focus:ring-bosque"
                    placeholder="(a) a greataxe or (b) any martial melee weapon..."
                />
            </div>

            <div className="flex justify-end gap-4 pt-4">
                <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
                <Button type="submit" variant="primary">Guardar Clase</Button>
            </div>
        </form>
    );
}