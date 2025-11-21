'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Personaje, DnDSpecies, DnDClass, DnDSubclass, DnDFeat } from '@/types';
import Card from "@/components/card";
import { FaHeart, FaShieldAlt, FaRunning, FaDna, FaScroll, FaStar, FaFistRaised } from 'react-icons/fa';

// Calcular modificador (Ej: 16 -> +3)
const getModifier = (score: number) => {
    const mod = Math.floor((score - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
};

// Calcular Bono de Competencia según nivel
const getProficiencyBonus = (level: number) => Math.ceil(level / 4) + 1;

export default function CharacterSummaryPage() {
    const { accessToken } = useAuth();
    const params = useParams();
    const personajeId = params.personajeId as string;

    const [pj, setPj] = useState<Personaje | null>(null);

    // Estados para los detalles expandidos
    const [speciesDetails, setSpeciesDetails] = useState<DnDSpecies | null>(null);
    const [classDetails, setClassDetails] = useState<DnDClass | null>(null);
    const [subclassDetails, setSubclassDetails] = useState<DnDSubclass | null>(null);
    const [featsDetails, setFeatsDetails] = useState<DnDFeat[]>([]);

    const [loading, setLoading] = useState(true);

    // Cargar Personaje Base
    const fetchPersonaje = useCallback(async () => {
        if (!accessToken) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/personajes/${personajeId}/`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPj(data);
                return data; // Retornamos para encadenar
            }
        } catch (error) { console.error(error); }
        return null;
    }, [accessToken, personajeId]);

    // Cargar Detalles Relacionados (Waterfall seguro)
    useEffect(() => {
        const loadAllData = async () => {
            const character = await fetchPersonaje();
            if (!character) return;

            const headers = { 'Authorization': `Bearer ${accessToken}` };
            const promises = [];

            // Fetch Especie
            if (character.especie) {
                promises.push(
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/species/${character.especie}/`, { headers })
                        .then(res => res.ok ? res.json() : null)
                        .then(data => setSpeciesDetails(data))
                );
            }

            // Fetch Clase
            if (character.clase) {
                promises.push(
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/classes/${character.clase}/`, { headers })
                        .then(res => res.ok ? res.json() : null)
                        .then(data => setClassDetails(data))
                );
            }

            // Fetch Subclase
            if (character.subclase) {
                promises.push(
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subclasses/${character.subclase}/`, { headers })
                        .then(res => res.ok ? res.json() : null)
                        .then(data => setSubclassDetails(data))
                );
            }

            // Fetch Dotes (Array de IDs)
            if (character.dotes && character.dotes.length > 0) {
                // Hacemos fetch individual por dote (o podrías tener un endpoint de filtro por IDs)
                const featPromises = character.dotes.map((featId: number) =>
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/feats/${featId}/`, { headers })
                        .then(res => res.ok ? res.json() : null)
                );
                promises.push(
                    Promise.all(featPromises).then(results => setFeatsDetails(results.filter(Boolean)))
                );
            }

            await Promise.all(promises);
            setLoading(false);
        };

        if (accessToken) loadAllData();
    }, [accessToken, fetchPersonaje]);

    if (loading) return <div className="text-center py-10 font-title text-stone-600">Cargando grimorio...</div>;
    if (!pj) return <div className="text-center py-10 text-carmesi">Personaje no encontrado.</div>;

    return (
        <div className="space-y-8 font-body text-stone-800">

            {/* --- SECCIÓN 1: CABECERA Y ESTADÍSTICAS --- */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* Tarjeta de Perfil */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-pergamino border border-madera-oscura rounded-xl p-6 text-center shadow-sm">
                        <div className="w-24 h-24 bg-stone-300 rounded-full mx-auto mb-4 border-4 border-white shadow-inner flex items-center justify-center text-4xl text-stone-500">
                            {/* Placeholder para avatar */}
                            {pj.nombre_personaje.charAt(0)}
                        </div>
                        <h2 className="text-2xl font-title text-madera-oscura">{pj.nombre_personaje}</h2>
                        <p className="text-sm text-stone-600 italic">
                            {speciesDetails?.name || 'Desconocido'} {classDetails?.name || 'Aventurero'}
                        </p>
                        <p className="text-xs font-bold uppercase tracking-widest text-bosque mt-1">Nivel {pj.nivel}</p>

                        {/* Stats Rápidas */}
                        <div className="flex justify-center gap-4 mt-6 pt-4 border-t border-madera-oscura/10">
                            <div className="text-center" title="Clase de Armadura (Base 10 + Des)">
                                <FaShieldAlt className="mx-auto text-stone-400 mb-1" />
                                <span className="font-bold text-lg block leading-none">{10 + Math.floor((pj.destreza - 10) / 2)}</span>
                                <span className="text-[10px] uppercase">CA</span>
                            </div>
                            <div className="text-center" title="Puntos de Golpe (Estimado)">
                                <FaHeart className="mx-auto text-carmesi mb-1" />
                                <span className="font-bold text-lg block leading-none">--</span>
                                <span className="text-[10px] uppercase">PG</span>
                            </div>
                            <div className="text-center" title="Velocidad">
                                <FaRunning className="mx-auto text-bosque mb-1" />
                                <span className="font-bold text-lg block leading-none">{speciesDetails?.walking_speed || 30}</span>
                                <span className="text-[10px] uppercase">Pies</span>
                            </div>
                            <div className="text-center" title="Bono de Competencia">
                                <FaStar className="mx-auto text-yellow-600 mb-1" />
                                <span className="font-bold text-lg block leading-none">+{getProficiencyBonus(pj.nivel)}</span>
                                <span className="text-[10px] uppercase">BC</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bloque de Características */}
                <div className="lg:col-span-3">
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 h-full">
                        {[
                            { label: 'Fuerza', val: pj.fuerza },
                            { label: 'Destreza', val: pj.destreza },
                            { label: 'Constitución', val: pj.constitucion },
                            { label: 'Inteligencia', val: pj.inteligencia },
                            { label: 'Sabiduría', val: pj.sabiduria },
                            { label: 'Carisma', val: pj.carisma },
                        ].map(stat => (
                            <div key={stat.label} className="bg-white rounded-xl border border-stone-200 p-3 flex flex-col items-center justify-center shadow-sm hover:border-madera-oscura/30 transition-colors">
                                <span className="text-[10px] uppercase font-bold text-stone-400 mb-1">{stat.label.substring(0, 3)}</span>
                                <span className="text-3xl font-title text-madera-oscura">{getModifier(stat.val)}</span>
                                <div className="mt-1 bg-stone-100 px-2 py-0.5 rounded-full border border-stone-200 text-xs font-bold text-stone-600">
                                    {stat.val}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- RASGOS Y HABILIDADES --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Columna Izquierda: Especie y Dotes */}
                <div className="space-y-6">

                    {/* Rasgos de Especie */}
                    <section>
                        <h3 className="text-xl font-title border-b-2 border-bosque pb-2 mb-4 flex items-center gap-2 text-stone-800">
                            <FaDna className="text-bosque" /> Rasgos de Especie
                        </h3>
                        <div className="space-y-3">
                            {speciesDetails?.traits?.map(trait => (
                                <Card key={trait.id} variant="secondary" className="p-4">
                                    <h4 className="font-bold text-bosque mb-1">{trait.name}</h4>
                                    <p className="text-sm text-stone-600 leading-relaxed">{trait.description}</p>
                                    {/* Si el trait tiene opciones y el usuario eligió una, aquí deberíamos mostrar la elección. 
                                Requiere cruzar con el modelo PersonajeEleccion en el futuro. */}
                                </Card>
                            ))}
                            {!speciesDetails && <p className="text-stone-400 italic">Sin especie definida.</p>}
                        </div>
                    </section>

                    {/* Dotes */}
                    <section>
                        <h3 className="text-xl font-title border-b-2 border-yellow-600 pb-2 mb-4 flex items-center gap-2 text-stone-800">
                            <FaStar className="text-yellow-600" /> Dotes
                        </h3>
                        <div className="space-y-3">
                            {featsDetails.map(feat => (
                                <Card key={feat.id} variant="secondary" className="p-4 border-l-4 border-l-yellow-600">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-stone-800">{feat.name}</h4>
                                        <span className="text-[10px] bg-stone-100 px-2 py-0.5 rounded border border-stone-200 text-stone-500">{feat.feat_type}</span>
                                    </div>
                                    <p className="text-xs mt-1 text-stone-500 mb-2 italic">{feat.description}</p>

                                    {/* Listar los beneficios del dote */}
                                    {feat.features?.length > 0 && (
                                        <ul className="space-y-2 mt-3">
                                            {feat.features.map(f => (
                                                <li key={f.id} className="text-sm border-t border-stone-100 pt-2">
                                                    <strong className="text-stone-700 block text-xs uppercase">{f.name}</strong>
                                                    <span className="text-stone-600">{f.description}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </Card>
                            ))}
                            {featsDetails.length === 0 && <p className="text-stone-400 italic text-sm">Este personaje no tiene dotes.</p>}
                        </div>
                    </section>
                </div>

                {/* Columna Derecha: Clase y Subclase */}
                <div className="space-y-6">

                    {/* Rasgos de Clase */}
                    <section>
                        <h3 className="text-xl font-title border-b-2 border-carmesi pb-2 mb-4 flex items-center gap-2 text-stone-800">
                            <FaScroll className="text-carmesi" /> Rasgos de Clase
                        </h3>
                        <div className="space-y-3">
                            {classDetails?.features
                                // IMPORTANTE: Filtramos por el nivel actual del personaje
                                ?.filter(f => f.level <= pj.nivel)
                                .map(feature => (
                                    <Card key={feature.id} variant="secondary" className="p-4 border-l-4 border-l-carmesi">
                                        <div className="flex justify-between items-center mb-1">
                                            <h4 className="font-bold text-stone-800">{feature.name}</h4>
                                            <span className="text-[10px] font-bold text-white bg-carmesi/80 px-1.5 py-0.5 rounded">Lvl {feature.level}</span>
                                        </div>
                                        <p className="text-sm text-stone-600 leading-relaxed">{feature.description}</p>
                                    </Card>
                                ))}
                            {!classDetails && <p className="text-stone-400 italic">Sin clase definida.</p>}
                        </div>
                    </section>

                    {/* Rasgos de Subclase */}
                    {subclassDetails && (
                        <section>
                            <h3 className="text-xl font-title border-b-2 border-sky-600 pb-2 mb-4 flex items-center gap-2 text-stone-800">
                                <FaFistRaised className="text-sky-600" /> {subclassDetails.name}
                            </h3>
                            <div className="space-y-3">
                                {subclassDetails.features
                                    ?.filter(f => f.level <= pj.nivel)
                                    .map(feature => (
                                        <Card key={feature.id} variant="secondary" className="p-4 border-l-4 border-l-sky-600">
                                            <div className="flex justify-between items-center mb-1">
                                                <h4 className="font-bold text-stone-800">{feature.name}</h4>
                                                <span className="text-[10px] font-bold text-white bg-sky-600/80 px-1.5 py-0.5 rounded">Lvl {feature.level}</span>
                                            </div>
                                            <p className="text-sm text-stone-600 leading-relaxed">{feature.description}</p>

                                            {/* Si es un feature padre con opciones (ej. Maneuvers) */}
                                            {feature.options && feature.options.length > 0 && (
                                                <div className="mt-2 bg-stone-50 p-2 rounded border border-stone-100">
                                                    <p className="text-xs font-bold text-stone-400 uppercase mb-1">Opciones disponibles:</p>
                                                    <ul className="list-disc list-inside text-xs text-stone-600">
                                                        {feature.options.map(opt => (
                                                            <li key={opt.id}><span className="font-semibold">{opt.name}:</span> {opt.description.substring(0, 60)}...</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </Card>
                                    ))}
                            </div>
                        </section>
                    )}
                </div>

            </div>
        </div>
    );
}