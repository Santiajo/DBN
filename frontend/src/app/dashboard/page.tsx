'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Personaje } from '@/types';
import { DnDClass } from '@/types';
import { DnDSubclass } from '@/types';
import { DnDSpecies } from '@/types';
import Input from "@/components/input";

// Helper para calcular Nivel basado en Checkpoints (Reglas provistas)
const calculateLevelFromCP = (cp: number) => {
    let level = 1;
    let remaining = cp;
    
    // Bucle de subida de nivel
    while (level < 20) {
        let cost = 4; // Default Tier 1 (Levels 1-4 paying to go up)
        
        // Si ya somos nivel 4 (para subir a 5) hasta nivel 9 (para subir a 10)
        // Interpretación: [5,10] costo 8. Significa para ALCANZAR niveles en ese rango.
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
            const results = Array.isArray(data) ? data : data.results || [];
            setPersonajes(results);
            setFilteredPersonajes(results);
        }

        if (resClasses.ok) {
            const data = await resClasses.json();
            const map: Record<number, string> = {};
            (data.results || []).forEach((c: DnDClass) => map[c.id] = c.name);
            setClassMap(map);
        }
        if (resSub.ok) {
            const data = await resSub.json();
            const map: Record<number, string> = {};
            (data.results || []).forEach((s: DnDSubclass) => map[s.id] = s.name);
            setSubclassMap(map);
        }
        if (resSpec.ok) {
            const data = await resSpec.json();
            const map: Record<number, string> = {};
            (data.results || []).forEach((s: DnDSpecies) => map[s.id] = s.name);
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
            (p as any).nombre_usuario?.toLowerCase().includes(lower) // Si nombre_usuario no está en la interfaz pero viene del backend
        ));
    }
  }, [searchTerm, personajes]);

  const handleCellChange = (id: number, field: keyof Personaje, value: any) => {
    setEdits(prev => ({
        ...prev,
        [id]: { ...prev[id], [field]: value }
    }));
  };

  const saveChanges = async (id: number) => {
    const changes = edits[id];
    if (!changes || Object.keys(changes).length === 0) return;

    // Si cambiamos checkpoints, calculamos el nuevo nivel para enviarlo también
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

  if (loading) return <div className="p-8 text-center">Cargando Tabla Maestra...</div>;

  return (
    <div className="p-6 space-y-4 h-full flex flex-col">
        <div className="flex justify-between items-end">
            <div>
                <h1 className="text-3xl font-title text-stone-800">Registro de Jugadores</h1>
                <p className="text-sm text-stone-500">Gestión de Checkpoints y Recursos</p>
            </div>
            <div className="w-64">
                <Input 
                    placeholder="Buscar..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white"
                />
            </div>
        </div>

        <div className="flex-1 overflow-auto border border-madera-oscura/30 rounded-lg shadow-lg bg-white">
            <table className="min-w-full border-collapse text-sm font-body">
                <thead className="bg-madera-oscura text-pergamino sticky top-0 z-10 shadow-md">
                    <tr>
                        <th colSpan={2} className="border-r border-pergamino/20 px-2 py-1">Identificación</th>
                        <th colSpan={1} className="border-r border-pergamino/20 px-2 py-1 bg-stone-800">Tier</th>
                        {/* ADMIN ZONE */}
                        <th colSpan={3} className="border-r border-pergamino/20 px-2 py-1 bg-carmesi/20">Progresión (Admin)</th>
                        {/* INFO */}
                        <th colSpan={2} className="border-r border-pergamino/20 px-2 py-1">Detalle</th>
                        {/* USER ZONE */}
                        <th colSpan={2} className="border-r border-pergamino/20 px-2 py-1 bg-bosque/20">Recursos</th>
                        <th colSpan={2} className="px-2 py-1 bg-blue-900/20">Social</th>
                    </tr>
                    <tr className="text-xs uppercase tracking-wider text-pergamino/80 bg-madera-oscura">
                        <th className="px-3 py-2 text-left w-32">Jugador</th>
                        <th className="px-3 py-2 text-left w-40 border-r border-pergamino/10">Personaje</th>
                        
                        <th className="px-2 py-2 text-center w-12 border-r border-pergamino/10 bg-stone-800">Tier</th>
                        
                        {/* ADMIN */}
                        <th className="px-2 py-2 text-center w-24 bg-carmesi/10 text-white font-bold">Checkpoints</th>
                        <th className="px-2 py-2 text-center w-20 bg-carmesi/10">TP Total</th>
                        <th className="px-2 py-2 text-center w-20 bg-carmesi/10 border-r border-pergamino/10">TP Gastados</th>
                        
                        {/* INFO */}
                        <th className="px-3 py-2 text-left w-48">Clase (Nivel)</th>
                        <th className="px-3 py-2 text-left w-32 border-r border-pergamino/10">Especie</th>
                        
                        {/* USER (Solo GP y Downtime) */}
                        <th className="px-2 py-2 text-center w-24 bg-bosque/10 text-yellow-200 font-bold">Total (gp)</th>
                        <th className="px-2 py-2 text-center w-20 bg-bosque/10 border-r border-pergamino/10">Downtime</th>
                        
                        <th className="px-3 py-2 text-left w-32 bg-blue-900/10">Facción</th>
                        <th className="px-2 py-2 text-center w-16 bg-blue-900/10">Renombre</th>
                    </tr>
                </thead>

                <tbody className="divide-y divide-stone-200">
                    {filteredPersonajes.map((pj) => {
                        const isAdmin = user?.is_staff;
                        const isOwner = user?.user_id === pj.user;
                        const canEditAdmin = isAdmin;
                        const canEditUser = isAdmin || isOwner;

                        const val = (field: keyof Personaje) => 
                            edits[pj.id]?.[field] !== undefined ? edits[pj.id]?.[field] : pj[field];

                        // Calculamos el nivel dinámicamente basado en los checkpoints actuales (o editados)
                        const currentCP = Number(val('checkpoints'));
                        const calculatedLevel = calculateLevelFromCP(currentCP);
                        const tier = getTier(calculatedLevel);

                        return (
                            <tr key={pj.id} className="hover:bg-stone-50 transition-colors group">
                                <td className="px-3 py-2 text-stone-600 font-semibold">{(pj as any).nombre_usuario || '-'}</td>
                                <td className="px-3 py-2 border-r border-stone-200 text-bosque font-bold">{pj.nombre_personaje}</td>

                                {/* Tier Calculado */}
                                <td className="px-2 py-2 text-center border-r border-stone-200 font-title font-bold text-stone-700 bg-stone-50">
                                    {tier}
                                </td>

                                {/* ADMIN: Checkpoints (Edita esto y cambia el nivel) */}
                                <td className="p-0 border-r border-stone-100 bg-carmesi/5">
                                    <input 
                                        type="number"
                                        disabled={!canEditAdmin}
                                        value={String(val('checkpoints'))}
                                        onChange={(e) => handleCellChange(pj.id, 'checkpoints', parseInt(e.target.value))}
                                        onBlur={() => saveChanges(pj.id)}
                                        className="w-full h-full px-2 py-2 text-center bg-transparent focus:bg-carmesi/10 outline-none font-bold text-stone-800"
                                    />
                                </td>
                                {/* ADMIN: Treasure Points */}
                                <td className="p-0 border-r border-stone-100">
                                    <input 
                                        type="number"
                                        disabled={!canEditAdmin}
                                        value={String(val('treasure_points'))}
                                        onChange={(e) => handleCellChange(pj.id, 'treasure_points', parseInt(e.target.value))}
                                        onBlur={() => saveChanges(pj.id)}
                                        className="w-full h-full px-2 py-2 text-center bg-transparent focus:bg-carmesi/5 outline-none disabled:text-stone-400"
                                    />
                                </td>
                                <td className="p-0 border-r border-stone-200 bg-stone-50/30">
                                    <input 
                                        type="number"
                                        disabled={!canEditAdmin}
                                        value={String(val('treasure_points_gastados') || 0)}
                                        onChange={(e) => handleCellChange(pj.id, 'treasure_points_gastados', parseInt(e.target.value))}
                                        onBlur={() => saveChanges(pj.id)}
                                        className="w-full h-full px-2 py-2 text-center bg-transparent focus:bg-carmesi/5 outline-none disabled:text-stone-400"
                                    />
                                </td>

                                {/* Info Fija: Nivel Calculado */}
                                <td className="px-3 py-2 text-xs text-stone-600">
                                    <span className="font-bold">{classMap[pj.clase || 0] || '-'}</span>
                                    <span className="text-stone-400 mx-1">/</span>
                                    {subclassMap[pj.subclase || 0] || '-'}
                                    {/* Aquí mostramos el nivel calculado, no el de la DB si difieren */}
                                    <span className="ml-1 bg-stone-200 px-1 rounded text-[10px] text-stone-600">Lvl {calculatedLevel}</span>
                                </td>
                                <td className="px-3 py-2 text-xs text-stone-600 border-r border-stone-200">
                                    {speciesMap[pj.especie || 0] || '-'}
                                </td>

                                {/* USER: Oro Total (GP) */}
                                <td className="p-0 border-r border-stone-100 bg-yellow-50/30">
                                    <input 
                                        type="number"
                                        disabled={!canEditUser}
                                        value={String(val('oro'))}
                                        onChange={(e) => handleCellChange(pj.id, 'oro', parseInt(e.target.value))}
                                        onBlur={() => saveChanges(pj.id)}
                                        className="w-full h-full px-2 py-2 text-center bg-transparent focus:bg-yellow-100 outline-none font-semibold text-yellow-700"
                                    />
                                </td>
                                {/* USER: Downtime */}
                                <td className="p-0 border-r border-stone-200">
                                    <input 
                                        type="number"
                                        disabled={!canEditUser}
                                        value={String(val('tiempo_libre'))}
                                        onChange={(e) => handleCellChange(pj.id, 'tiempo_libre', parseInt(e.target.value))}
                                        onBlur={() => saveChanges(pj.id)}
                                        className="w-full h-full px-2 py-2 text-center bg-transparent focus:bg-blue-50 outline-none"
                                    />
                                </td>

                                {/* USER: Facción */}
                                <td className="p-0 border-r border-stone-100">
                                    <input 
                                        type="text"
                                        disabled={!canEditUser}
                                        value={String(val('faccion'))}
                                        onChange={(e) => handleCellChange(pj.id, 'faccion', e.target.value)}
                                        onBlur={() => saveChanges(pj.id)}
                                        className="w-full h-full px-3 py-2 text-left bg-transparent focus:bg-blue-50 outline-none text-xs"
                                        placeholder="-"
                                    />
                                </td>
                                <td className="p-0 text-center text-xs text-stone-300 py-2">-</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
        
        <div className="text-xs text-stone-500 flex justify-between px-2">
            <p>* Los cambios se guardan automáticamente al salir de la celda.</p>
            <p>Mostrando {filteredPersonajes.length} aventureros</p>
        </div>
    </div>
  );
}