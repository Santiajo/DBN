'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Personaje } from '@/types';
import { DnDClass } from '@/types';
import { DnDSubclass } from '@/types';
import { DnDSpecies } from '@/types';
import Input from "@/components/input";

// Helper para calcular Nivel basado en Checkpoints
const calculateLevelFromCP = (cp: number) => {
    let level = 1;
    let remaining = cp;
    
    while (level < 20) {
        let cost = 4; 
        if (level >= 4 && level < 10) cost = 8;
        else if (level >= 10 && level < 16) cost = 10;
        else if (level >= 16) cost = 12;

        if (remaining >= cost) {
            remaining -= cost;
            level++;
        } else {
            break;
        }
    }
    return level;
};

const getTier = (level: number) => {
  if (level <= 4) return 1;
  if (level <= 10) return 2;
  if (level <= 16) return 3;
  return 4;
};

interface PaginatedResponse<T> {
    count: number;
    results: T[];
}

export default function PlayersTablePage() {
  const { user, accessToken } = useAuth();
  
  const [personajes, setPersonajes] = useState<Personaje[]>([]);
  const [filteredPersonajes, setFilteredPersonajes] = useState<Personaje[]>([]);
  
  const [classMap, setClassMap] = useState<Record<number, string>>({});
  const [subclassMap, setSubclassMap] = useState<Record<number, string>>({});
  const [speciesMap, setSpeciesMap] = useState<Record<number, string>>({});
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [edits, setEdits] = useState<Record<number, Partial<Personaje>>>({});

  useEffect(() => {
    const fetchData = async () => {
      if (!accessToken) return;
      const headers = { 'Authorization': `Bearer ${accessToken}` };
      try {
        const [resPj, resClasses, resSub, resSpec] = await Promise.all([
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/personajes/`, { headers }),
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/classes/`, { headers }),
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subclasses/`, { headers }),
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/species/`, { headers })
        ]);

        if (resPj.ok) {
            const data = await resPj.json();
            const results = Array.isArray(data) ? data : (data as PaginatedResponse<Personaje>).results || [];
            setPersonajes(results);
            setFilteredPersonajes(results);
        }

        if (resClasses.ok) {
            const data = await resClasses.json();
            const results = Array.isArray(data) ? data : (data as PaginatedResponse<DnDClass>).results || [];
            const map: Record<number, string> = {};
            results.forEach((c: DnDClass) => map[c.id] = c.name);
            setClassMap(map);
        }
        if (resSub.ok) {
            const data = await resSub.json();
            const results = Array.isArray(data) ? data : (data as PaginatedResponse<DnDSubclass>).results || [];
            const map: Record<number, string> = {};
            results.forEach((s: DnDSubclass) => map[s.id] = s.name);
            setSubclassMap(map);
        }
        if (resSpec.ok) {
            const data = await resSpec.json();
            const results = Array.isArray(data) ? data : (data as PaginatedResponse<DnDSpecies>).results || [];
            const map: Record<number, string> = {};
            results.forEach((s: DnDSpecies) => map[s.id] = s.name);
            setSpeciesMap(map);
        }

      } catch (error) { console.error(error); } 
      finally { setLoading(false); }
    };
    fetchData();
  }, [accessToken]);

  useEffect(() => {
    if (!searchTerm) {
        setFilteredPersonajes(personajes);
    } else {
        const lower = searchTerm.toLowerCase();
        setFilteredPersonajes(personajes.filter(p => 
            p.nombre_personaje.toLowerCase().includes(lower) ||
            p.nombre_usuario?.toLowerCase().includes(lower)
        ));
    }
  }, [searchTerm, personajes]);

  const handleCellChange = (id: number, field: keyof Personaje, value: string | number) => {
    setEdits(prev => ({
        ...prev,
        [id]: { ...prev[id], [field]: value }
    }));
  };

  const saveChanges = async (id: number) => {
    const changes = edits[id];
    if (!changes || Object.keys(changes).length === 0) return;

    if (changes.checkpoints !== undefined) {
        changes.nivel = calculateLevelFromCP(changes.checkpoints);
    }

    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/personajes/${id}/`, {
            method: 'PATCH',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}` 
            },
            body: JSON.stringify(changes)
        });

        if (res.ok) {
            const updatedPj = await res.json();
            setPersonajes(prev => prev.map(p => p.id === id ? updatedPj : p));
            const newEdits = { ...edits };
            delete newEdits[id];
            setEdits(newEdits);
        } else {
            alert("Error al guardar cambios");
        }
    } catch (error) { console.error(error); }
  };

  if (loading) return <div className="p-8 text-center font-title text-stone-600">Cargando Tabla Maestra...</div>;

  return (
    <div className="p-6 space-y-4 h-full flex flex-col font-body text-stone-800">
        <div className="flex justify-between items-end">
            <div>
                <h1 className="text-3xl font-title text-madera-oscura">Registro de Jugadores</h1>
                <p className="text-sm text-stone-500">Gestión de Checkpoints y Recursos</p>
            </div>
            <div className="w-64">
                <Input 
                    placeholder="Buscar Jugador o Personaje..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white"
                />
            </div>
        </div>

        {/* TABLA ESTILIZADA */}
        {/* CORRECCIÓN: Quitamos shadow-lg y usamos border-madera-oscura sólido y rounded-xl */}
        <div className="flex-1 overflow-auto border border-madera-oscura rounded-xl bg-white">
            <table className="min-w-full border-collapse text-sm">
                {/* Cabecera Sticky - Quitamos shadow-md para que sea plana */}
                <thead className="bg-cuero text-white font-title uppercase sticky top-0 z-10">
                    {/* Fila Superior: Categorías */}
                    <tr className="text-xs tracking-wide border-b border-white/20">
                        <th colSpan={2} className="px-2 py-1 border-r border-white/20 bg-cuero">Identificación</th>
                        <th colSpan={1} className="px-2 py-1 border-r border-white/20 bg-stone-800">Rank</th>
                        <th colSpan={3} className="px-2 py-1 border-r border-white/20 bg-carmesi/80">Admin Zone</th>
                        <th colSpan={2} className="px-2 py-1 border-r border-white/20 bg-cuero">Detalle</th>
                        <th colSpan={2} className="px-2 py-1 border-r border-white/20 bg-bosque/80">Economía</th>
                        <th colSpan={2} className="px-2 py-1 bg-sky-700/80">Social</th>
                    </tr>
                    {/* Fila Inferior: Columnas */}
                    <tr className="text-[11px] tracking-wider">
                        <th className="px-3 py-2 text-left w-32">Jugador</th>
                        <th className="px-3 py-2 text-left w-40 border-r border-white/10">Personaje</th>
                        
                        <th className="px-2 py-2 text-center w-12 border-r border-white/10 bg-stone-800">Tier</th>
                        
                        {/* Admin */}
                        <th className="px-2 py-2 text-center w-20 bg-carmesi/80">CP</th>
                        <th className="px-2 py-2 text-center w-20 bg-carmesi/80">TP Total</th>
                        <th className="px-2 py-2 text-center w-20 bg-carmesi/80 border-r border-white/10">TP Gast.</th>
                        
                        {/* Info */}
                        <th className="px-3 py-2 text-left w-48">Clase (Lvl)</th>
                        <th className="px-3 py-2 text-left w-32 border-r border-white/10">Especie</th>
                        
                        {/* User */}
                        <th className="px-2 py-2 text-center w-24 bg-bosque/80">Oro (GP)</th>
                        <th className="px-2 py-2 text-center w-20 bg-bosque/80 border-r border-white/10">Días</th>
                        
                        {/* Social */}
                        <th className="px-3 py-2 text-left w-32 bg-sky-700/80">Facción</th>
                        <th className="px-2 py-2 text-center w-16 bg-sky-700/80">Ren.</th>
                    </tr>
                </thead>

                <tbody className="divide-y divide-madera-oscura/10">
                    {filteredPersonajes.map((pj) => {
                        const isAdmin = user?.is_staff;
                        const isOwner = user?.user_id === pj.user;
                        const canEditAdmin = isAdmin;
                        const canEditUser = isAdmin || isOwner;

                        const val = (field: keyof Personaje) => 
                            edits[pj.id]?.[field] !== undefined ? edits[pj.id]?.[field] : pj[field];

                        const currentCP = Number(val('checkpoints'));
                        const calculatedLevel = calculateLevelFromCP(currentCP);
                        const tier = getTier(calculatedLevel);

                        return (
                            <tr 
                                key={pj.id} 
                                // ESTILO DE FILA: Alternado (Blanco/Pergamino) y Hover (Bosque)
                                className="group transition-colors duration-150 odd:bg-white even:bg-pergamino/60 hover:bg-bosque hover:text-white text-stone-800"
                            >
                                {/* Identificación */}
                                <td className="px-3 py-2 font-medium opacity-80 group-hover:text-white/80">{pj.nombre_usuario || '-'}</td>
                                <td className="px-3 py-2 border-r border-madera-oscura/5 font-bold group-hover:border-white/20">{pj.nombre_personaje}</td>

                                {/* Tier */}
                                <td className="px-2 py-2 text-center border-r border-madera-oscura/5 bg-stone-100 group-hover:bg-stone-800 group-hover:text-white group-hover:border-white/20 font-title font-bold">
                                    {tier}
                                </td>

                                {/* ADMIN INPUTS (Fondo rojizo suave que cambia en hover) */}
                                <td className="p-0 border-r border-madera-oscura/5 group-hover:border-white/20">
                                    <input 
                                        type="number"
                                        disabled={!canEditAdmin}
                                        value={String(val('checkpoints'))}
                                        onChange={(e) => handleCellChange(pj.id, 'checkpoints', parseInt(e.target.value))}
                                        onBlur={() => saveChanges(pj.id)}
                                        className="w-full h-full px-2 py-2 text-center bg-transparent outline-none font-bold text-inherit focus:bg-white/20 cursor-pointer focus:cursor-text"
                                    />
                                </td>
                                <td className="p-0 border-r border-madera-oscura/5 group-hover:border-white/20">
                                    <input 
                                        type="number"
                                        disabled={!canEditAdmin}
                                        value={String(val('treasure_points'))}
                                        onChange={(e) => handleCellChange(pj.id, 'treasure_points', parseInt(e.target.value))}
                                        onBlur={() => saveChanges(pj.id)}
                                        className="w-full h-full px-2 py-2 text-center bg-transparent outline-none text-inherit focus:bg-white/20 disabled:opacity-50"
                                    />
                                </td>
                                <td className="p-0 border-r border-madera-oscura/5 group-hover:border-white/20">
                                    <input 
                                        type="number"
                                        disabled={!canEditAdmin}
                                        value={String(val('treasure_points_gastados') || 0)}
                                        onChange={(e) => handleCellChange(pj.id, 'treasure_points_gastados', parseInt(e.target.value))}
                                        onBlur={() => saveChanges(pj.id)}
                                        className="w-full h-full px-2 py-2 text-center bg-transparent outline-none text-inherit focus:bg-white/20 disabled:opacity-50"
                                    />
                                </td>

                                {/* Info Fija */}
                                <td className="px-3 py-2 text-xs opacity-90 group-hover:text-white/90">
                                    <span className="font-bold">{classMap[pj.clase || 0] || '-'}</span>
                                    <span className="mx-1 opacity-50">/</span>
                                    {subclassMap[pj.subclase || 0] || '-'}
                                    <span className="ml-1 bg-madera-oscura/10 px-1.5 py-0.5 rounded text-[10px] group-hover:bg-white/20 group-hover:text-white">
                                        Lvl {calculatedLevel}
                                    </span>
                                </td>
                                <td className="px-3 py-2 text-xs opacity-90 border-r border-madera-oscura/5 group-hover:border-white/20">
                                    {speciesMap[pj.especie || 0] || '-'}
                                </td>

                                {/* USER INPUTS (Economía) */}
                                <td className="p-0 border-r border-madera-oscura/5 group-hover:border-white/20">
                                    <input 
                                        type="number"
                                        disabled={!canEditUser}
                                        value={String(val('oro'))}
                                        onChange={(e) => handleCellChange(pj.id, 'oro', parseInt(e.target.value))}
                                        onBlur={() => saveChanges(pj.id)}
                                        className="w-full h-full px-2 py-2 text-center bg-transparent outline-none font-semibold text-inherit focus:bg-white/20 cursor-pointer focus:cursor-text"
                                    />
                                </td>
                                <td className="p-0 border-r border-madera-oscura/5 group-hover:border-white/20">
                                    <input 
                                        type="number"
                                        disabled={!canEditUser}
                                        value={String(val('tiempo_libre'))}
                                        onChange={(e) => handleCellChange(pj.id, 'tiempo_libre', parseInt(e.target.value))}
                                        onBlur={() => saveChanges(pj.id)}
                                        className="w-full h-full px-2 py-2 text-center bg-transparent outline-none text-inherit focus:bg-white/20 cursor-pointer focus:cursor-text"
                                    />
                                </td>

                                {/* USER INPUTS (Social) */}
                                <td className="p-0 border-r border-madera-oscura/5 group-hover:border-white/20">
                                    <input 
                                        type="text"
                                        disabled={!canEditUser}
                                        value={String(val('faccion'))}
                                        onChange={(e) => handleCellChange(pj.id, 'faccion', e.target.value)}
                                        onBlur={() => saveChanges(pj.id)}
                                        className="w-full h-full px-3 py-2 text-left bg-transparent outline-none text-xs text-inherit focus:bg-white/20 cursor-pointer focus:cursor-text placeholder:text-stone-300 group-hover:placeholder:text-white/40"
                                        placeholder="-"
                                    />
                                </td>
                                <td className="p-0 text-center text-xs opacity-50 py-2 group-hover:text-white/50">-</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
        
        <div className="text-xs text-stone-500 flex justify-between px-2">
            <p>* Los cambios se guardan automáticamente al salir de la celda (Blur).</p>
            <p>Mostrando {filteredPersonajes.length} aventureros</p>
        </div>
    </div>
  );
}