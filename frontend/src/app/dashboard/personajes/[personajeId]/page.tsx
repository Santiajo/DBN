'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Personaje, DnDSpecies, DnDClass, DnDSubclass, DnDFeat } from '@/types';
import Card from "@/components/card";
import TraitCard from "@/components/trait-card";
import { FaHeart, FaShieldAlt, FaRunning, FaDna, FaScroll, FaStar, FaFistRaised } from 'react-icons/fa';

// Modificador de habilidad
const getModifier = (score: number) => {
    const mod = Math.floor((score - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
};

// Bono de proficiencia
const getProficiencyBonus = (level: number) => Math.ceil(level / 4) + 1;


export default function CharacterSummaryPage() {
    const { accessToken } = useAuth();
    const params = useParams();
    const personajeId = params.personajeId as string;

    const [pj, setPj] = useState<Personaje | null>(null);

    // Estados de detalles
    const [speciesDetails, setSpeciesDetails] = useState<DnDSpecies | null>(null);
    const [classDetails, setClassDetails] = useState<DnDClass | null>(null);
    const [subclassDetails, setSubclassDetails] = useState<DnDSubclass | null>(null);
    const [featsDetails, setFeatsDetails] = useState<DnDFeat[]>([]);

    const [loading, setLoading] = useState(true);

    // Fetch Personaje
    const fetchPersonaje = useCallback(async () => {
        if (!accessToken) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/personajes/${personajeId}/`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPj(data);
                return data;
            }
        } catch (error) { console.error(error); }
        return null;
    }, [accessToken, personajeId]);

    // Fetch Detalles
    useEffect(() => {
        const loadAllData = async () => {
            const character = await fetchPersonaje();
            if (!character) { setLoading(false); return; }

            const headers = { 'Authorization': `Bearer ${accessToken}` };
            const promises = [];

            if (character.especie) {
                promises.push(fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/species/${character.especie}/`, { headers }).then(res => res.ok ? res.json() : null).then(data => setSpeciesDetails(data)));
            }
            if (character.clase) {
                promises.push(fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/classes/${character.clase}/`, { headers }).then(res => res.ok ? res.json() : null).then(data => setClassDetails(data)));
            }
            if (character.subclase) {
                promises.push(fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subclasses/${character.subclase}/`, { headers }).then(res => res.ok ? res.json() : null).then(data => setSubclassDetails(data)));
            }
            if (character.dotes && character.dotes.length > 0) {
                const featPromises = character.dotes.map((featId: number) => fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/feats/${featId}/`, { headers }).then(res => res.ok ? res.json() : null));
                promises.push(Promise.all(featPromises).then(results => setFeatsDetails(results.filter(Boolean))));
            }

            await Promise.all(promises);
            setLoading(false);
        };

        if (accessToken) loadAllData();
    }, [accessToken, fetchPersonaje]);

    if (loading) return <div className="text-center py-10 font-title text-stone-600">Cargando...</div>;
    if (!pj) return <div className="text-center py-10 text-carmesi">Personaje no encontrado.</div>;

    return (
        <div className="space-y-8 font-body text-stone-800">

            {/* --- CABECERA --- */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* Tarjeta de Perfil (USANDO CARD PRIMARY) */}
                <div className="lg:col-span-1 space-y-4">
                    <Card variant="primary" className="text-center shadow-sm">
                        <div className="w-24 h-24 bg-stone-300 rounded-full mx-auto mb-4 border-4 border-white shadow-inner flex items-center justify-center text-4xl text-stone-500 uppercase font-title">
                            {pj.nombre_personaje.charAt(0)}
                        </div>
                        <h2 className="text-2xl font-title text-madera-oscura truncate">{pj.nombre_personaje}</h2>
                        <p className="text-sm text-stone-600 italic">
                            {speciesDetails?.name || 'Desconocido'} {classDetails?.name || 'Aventurero'}
                        </p>
                        <p className="text-xs font-bold uppercase tracking-widest text-bosque mt-1">Nivel {pj.nivel}</p>

                        {/* Stats Rápidas */}
                        <div className="flex justify-center gap-4 mt-6 pt-4 border-t border-madera-oscura/10">
                            <div className="text-center" title="Clase de Armadura">
                                <FaShieldAlt className="mx-auto text-stone-400 mb-1" />
                                <span className="font-bold text-lg block leading-none">{10 + Math.floor((pj.destreza - 10) / 2)}</span>
                                <span className="text-[10px] uppercase">CA</span>
                            </div>
                            <div className="text-center" title="Puntos de Golpe">
                                <FaHeart className="mx-auto text-carmesi mb-1" />
                                <span className="font-bold text-lg block leading-none">--</span>
                                <span className="text-[10px] uppercase">PG</span>
                            </div>
                            <div className="text-center" title="Velocidad">
                                <FaRunning className="mx-auto text-bosque mb-1" />
                                <span className="font-bold text-lg block leading-none">{speciesDetails?.walking_speed || 30}</span>
                                <span className="text-[10px] uppercase">Pies</span>
                            </div>
                            <div className="text-center" title="Bono Competencia">
                                <FaStar className="mx-auto text-yellow-600 mb-1" />
                                <span className="font-bold text-lg block leading-none">+{getProficiencyBonus(pj.nivel)}</span>
                                <span className="text-[10px] uppercase">BC</span>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Stats (Características) */}
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
                    <section>
                        <h3 className="text-xl font-title border-b-2 border-bosque pb-2 mb-4 flex items-center gap-2 text-stone-800">
                            <FaDna className="text-bosque" /> Rasgos de Especie
                        </h3>
                        <div className="space-y-3">
                            {speciesDetails?.traits?.map(trait => (
                                <TraitCard key={trait.id} title={trait.name} color="bosque">
                                    {trait.description}
                                </TraitCard>
                            ))}
                            {!speciesDetails && <p className="text-stone-400 italic text-sm">Sin especie definida.</p>}
                        </div>
                    </section>

                    <section>
                        <h3 className="text-xl font-title border-b-2 border-yellow-600 pb-2 mb-4 flex items-center gap-2 text-stone-800">
                            <FaStar className="text-yellow-600" /> Dotes
                        </h3>
                        <div className="space-y-3">
                            {featsDetails.map(feat => (
                                <TraitCard key={feat.id} title={feat.name} color="yellow">
                                    <p className="italic mb-2 text-xs">{feat.feat_type} - {feat.description}</p>
                                    {/* Beneficios del Dote */}
                                    {feat.features?.length > 0 && (
                                        <ul className="space-y-2 mt-3 border-t border-stone-100 pt-2">
                                            {feat.features.map(f => (
                                                <li key={f.id}>
                                                    <strong className="text-stone-700 block text-xs uppercase mb-0.5">{f.name}</strong>
                                                    <span className="text-stone-600">{f.description}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </TraitCard>
                            ))}
                            {featsDetails.length === 0 && <p className="text-stone-400 italic text-sm">Sin dotes.</p>}
                        </div>
                    </section>
                </div>

                {/* Columna Derecha: Clase y Subclase */}
                <div className="space-y-6">
                    <section>
                        <h3 className="text-xl font-title border-b-2 border-carmesi pb-2 mb-4 flex items-center gap-2 text-stone-800">
                            <FaScroll className="text-carmesi" /> Rasgos de Clase
                        </h3>
                        <div className="space-y-3">
                            {classDetails?.features
                                ?.filter(f => f.level <= pj.nivel)
                                .map(feature => (
                                    <TraitCard key={feature.id} title={`${feature.name} (Lvl ${feature.level})`} color="carmesi">
                                        {feature.description}
                                    </TraitCard>
                                ))}
                            {!classDetails && <p className="text-stone-400 italic text-sm">Sin clase definida.</p>}
                        </div>
                    </section>

                    {subclassDetails && (
                        <section>
                            <h3 className="text-xl font-title border-b-2 border-sky-600 pb-2 mb-4 flex items-center gap-2 text-stone-800">
                                <FaFistRaised className="text-sky-600" /> {subclassDetails.name}
                            </h3>
                            <div className="space-y-3">
                                {subclassDetails.features
                                    ?.filter(f => f.level <= pj.nivel)
                                    .map(feature => (
                                        <TraitCard key={feature.id} title={`${feature.name} (Lvl ${feature.level})`} color="sky">
                                            <p className="mb-2">{feature.description}</p>
                                            {/* Opciones anidadas (ej. Maniobras) */}
                                            {feature.options && feature.options.length > 0 && (
                                                <div className="mt-2 bg-stone-50 p-2 rounded border border-stone-100">
                                                    <p className="text-xs font-bold text-stone-400 uppercase mb-1">Opciones:</p>
                                                    <ul className="list-disc list-inside text-xs text-stone-600">
                                                        {feature.options.map(opt => (
                                                            <li key={opt.id}><span className="font-semibold">{opt.name}:</span> {opt.description.substring(0, 80)}...</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </TraitCard>
                                    ))}
                            </div>
                        </section>
                    )}
                </div>

            </div>
        </div>
    );
}