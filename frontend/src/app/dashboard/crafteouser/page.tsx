// app/crafteo/page.tsx - VERSIÓN COMPLETA ACTUALIZADA

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import RecetaCard from '@/components/crafting/RecetaCard';
import ModalIniciarCrafting from '@/components/crafting/ModalIniciarCrafting';
import ModalProgresoActivo from '@/components/crafting/ModalProgresoActivo';
import ModalIniciarInvestigacion from '@/components/investigacion/ModalIniciarInvestigacion';
import ModalProgresoInvestigacion from '@/components/investigacion/ModalProgresoInvestigacion';
import { FaHammer, FaCoins, FaClock, FaSpinner, FaSearch, FaLock, FaCheckCircle } from 'react-icons/fa';
import { Receta, Progreso, ProgresoInvestigacion } from '@/types/receta';
import dynamic from 'next/dynamic';

const DynamicSelectorPersonaje = dynamic(
    () => import('@/components/crafting/SelectorPersonaje'),
    {
        ssr: false,
        loading: () => <p className="text-stone-500">Cargando selector...</p>,
    }
);

interface Personaje {
    id: number;
    nombre_personaje: string;
    oro: number;
    tiempo_libre: number;
    nivel: number;
}

export default function CrafteoPage() {
    const { accessToken } = useAuth();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    const [personajes, setPersonajes] = useState<Personaje[]>([]);
    const [personajeSeleccionado, setPersonajeSeleccionado] = useState<Personaje | null>(null);
    
    const [recetas, setRecetas] = useState<Receta[]>([]);
    const [progresosActivos, setProgresosActivos] = useState<Progreso[]>([]);
    const [investigacionesActivas, setInvestigacionesActivas] = useState<ProgresoInvestigacion[]>([]);
    
    const [recetaParaCraftear, setRecetaParaCraftear] = useState<Receta | null>(null);
    const [recetaParaInvestigar, setRecetaParaInvestigar] = useState<Receta | null>(null);
    const [progresoActivo, setProgresoActivo] = useState<Progreso | null>(null);
    const [investigacionActiva, setInvestigacionActiva] = useState<ProgresoInvestigacion | null>(null);
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (accessToken) {
            cargarPersonajes();
        }
    }, [accessToken]);

    useEffect(() => {
        if (personajeSeleccionado && accessToken) {
            cargarRecetas();
            cargarProgresosActivos();
            cargarInvestigacionesActivas();
        }
    }, [personajeSeleccionado, accessToken]);

    const cargarPersonajes = async () => {
        if (!accessToken) {
            console.warn("Intento de carga de personajes sin accessToken.");
            return;
        }

        try {
            const res = await fetch(`${apiUrl}/api/personajes/`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });

            if (res.ok) {
                const data = await res.json();
                setPersonajes(data.results || data); 
            } else {
                console.error(`Error ${res.status} al cargar personajes: ${res.statusText}`);
                setError(`Error ${res.status} al cargar personajes.`);
            }
        } catch (error) {
            console.error('Error cargando personajes:', error);
            setError('Error de red al cargar personajes.');
        }
    };

    const cargarRecetas = async () => {
        if (!personajeSeleccionado || !accessToken) return;
        
        setLoading(true);
        try {
            const res = await fetch(
                `${apiUrl}/api/crafting/recetas_disponibles/?personaje_id=${personajeSeleccionado.id}`,
                { headers: { 'Authorization': `Bearer ${accessToken}` } }
            );
            
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ detail: 'No hay cuerpo de error.' }));
                console.error('Error del servidor al cargar recetas:', errorData);
                throw new Error(`Fallo de la API con código: ${res.status}`);
            }

            const data = await res.json();
            setRecetas(data.results || data);
            
        } catch (error) {
            console.error('Error cargando recetas:', error);
            setError('Error al cargar las recetas');
        } finally {
            setLoading(false);
        }
    };

    const cargarProgresosActivos = async () => {
        if (!personajeSeleccionado || !accessToken) return;
        
        try {
            const res = await fetch(
                `${apiUrl}/api/crafting/mis_progresos/?personaje_id=${personajeSeleccionado.id}`,
                { headers: { 'Authorization': `Bearer ${accessToken}` } }
            );
            if (res.ok) {
                const data = await res.json();
                setProgresosActivos(data.en_progreso || []);
            }
        } catch (error) {
            console.error('Error cargando progresos:', error);
        }
    };

    const cargarInvestigacionesActivas = async () => {
        if (!personajeSeleccionado || !accessToken) return;
        
        try {
            const res = await fetch(
                `${apiUrl}/api/crafting/mis_investigaciones/?personaje_id=${personajeSeleccionado.id}`,
                { headers: { 'Authorization': `Bearer ${accessToken}` } }
            );
            if (res.ok) {
                const data = await res.json();
                setInvestigacionesActivas(data.en_progreso || []);
            }
        } catch (error) {
            console.error('Error cargando investigaciones:', error);
        }
    };

    const actualizarPersonaje = async () => {
        if (!personajeSeleccionado || !accessToken) return;
        
        try {
            const res = await fetch(
                `${apiUrl}/api/personajes/${personajeSeleccionado.id}/`,
                { headers: { 'Authorization': `Bearer ${accessToken}` } }
            );
            if (res.ok) {
                const data = await res.json();
                setPersonajeSeleccionado(data);
            }
        } catch (error) {
            console.error('Error actualizando personaje:', error);
        }
    };

    const handleRecetaClick = (receta: Receta) => {
        // Si requiere investigación y no está desbloqueada
        if (receta.requiere_investigacion && !receta.esta_desbloqueada) {
            setRecetaParaInvestigar(receta);
        } else if (receta.puede_craftear) {
            setRecetaParaCraftear(receta);
        }
    };

    const handleIniciarCrafting = async () => {
        await cargarRecetas();
        await cargarProgresosActivos();
        await actualizarPersonaje();
        setRecetaParaCraftear(null);
        
        if (personajeSeleccionado && accessToken) {
            const res = await fetch(
                `${apiUrl}/api/crafting/mis_progresos/?personaje_id=${personajeSeleccionado.id}`,
                { headers: { 'Authorization': `Bearer ${accessToken}` } }
            );
            if (res.ok) {
                const data = await res.json();
                const progresosEnCurso = data.en_progreso || [];
                if (progresosEnCurso.length > 0) {
                    setProgresoActivo(progresosEnCurso[0]);
                }
            }
        }
    };

    const handleIniciarInvestigacion = async () => {
        await cargarRecetas();
        await cargarInvestigacionesActivas();
        await actualizarPersonaje();
        setRecetaParaInvestigar(null);
        
        if (personajeSeleccionado && accessToken) {
            const res = await fetch(
                `${apiUrl}/api/crafting/mis_investigaciones/?personaje_id=${personajeSeleccionado.id}`,
                { headers: { 'Authorization': `Bearer ${accessToken}` } }
            );
            if (res.ok) {
                const data = await res.json();
                const investigacionesEnCurso = data.en_progreso || [];
                if (investigacionesEnCurso.length > 0) {
                    setInvestigacionActiva(investigacionesEnCurso[0]);
                }
            }
        }
    };

    const handleCerrarProgreso = async () => {
        await cargarRecetas();
        await cargarProgresosActivos();
        await actualizarPersonaje();
        setProgresoActivo(null);
    };

    const handleCerrarInvestigacion = async () => {
        await cargarRecetas();
        await cargarInvestigacionesActivas();
        await actualizarPersonaje();
        setInvestigacionActiva(null);
    };

    // ✅ Separar recetas por categorías
    const recetasInvestigables = recetas.filter(r => 
        r.requiere_investigacion && !r.esta_desbloqueada && r.puede_investigar
    );
    
    const recetasDisponibles = recetas.filter(r => 
        (!r.requiere_investigacion || r.esta_desbloqueada) && r.puede_craftear
    );
    
    const recetasBloqueadas = recetas.filter(r => 
        (!r.requiere_investigacion || r.esta_desbloqueada) && !r.puede_craftear
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-piedra-50 via-stone-100 to-amber-50 p-6 font-body">
            <div className="max-w-7xl mx-auto">
                
                {/* Header */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border-t-4 border-bosque">
                    <div className="flex justify-between items-center flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <FaHammer className="text-4xl text-bosque" />
                            <div>
                                <h1 className="text-3xl font-title font-bold text-stone-800">Taller de Crafteo</h1>
                                <p className="text-sm text-stone-600">Crea objetos mundanos y mágicos</p>
                            </div>
                        </div>

                        {/* Selector de Personaje */}
                        <div className="flex items-center gap-4">
                            <DynamicSelectorPersonaje
                                personajes={personajes}
                                personajeSeleccionado={personajeSeleccionado}
                                onSeleccionar={setPersonajeSeleccionado}
                            />
                            
                            {personajeSeleccionado && (
                                <div className="flex gap-3">
                                    <div className="flex items-center gap-2 bg-yellow-100 px-4 py-2 rounded-lg border border-yellow-300">
                                        <FaCoins className="text-yellow-600" />
                                        <span className="font-bold text-stone-800">{personajeSeleccionado.oro} gp</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-blue-100 px-4 py-2 rounded-lg border border-blue-300">
                                        <FaClock className="text-blue-600" />
                                        <span className="font-bold text-stone-800">{personajeSeleccionado.tiempo_libre} días</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Mensaje de error */}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
                        {error}
                    </div>
                )}

                {/* Sin personaje seleccionado */}
                {!personajeSeleccionado && (
                    <div className="bg-white rounded-lg shadow-md p-12 text-center">
                        <FaHammer className="text-6xl text-stone-300 mx-auto mb-4" />
                        <p className="text-xl text-stone-600 font-semibold">Selecciona un personaje para comenzar</p>
                        <p className="text-stone-500 mt-2">Elige uno de tus personajes del menú superior</p>
                    </div>
                )}

                {/* Con personaje seleccionado */}
                {personajeSeleccionado && (
                    <>
                        {/* ✅ NUEVO: Investigaciones Activas */}
                        {investigacionesActivas.length > 0 && (
                            <div className="mb-6">
                                <h2 className="text-2xl font-title font-bold text-stone-800 mb-4 flex items-center gap-2">
                                    <FaSearch className="text-purple-600" />
                                    Investigaciones en Curso ({investigacionesActivas.length})
                                </h2>
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {investigacionesActivas.map(investigacion => (
                                        <button
                                            key={investigacion.id}
                                            onClick={() => setInvestigacionActiva(investigacion)}
                                            className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 rounded-lg p-4 hover:shadow-lg transition-all text-left"
                                        >
                                            <h3 className="font-bold text-stone-800 mb-2">{investigacion.receta_nombre}</h3>
                                            <div className="flex items-center gap-2 text-sm text-stone-600 mb-2">
                                                <span>🔍 {investigacion.objeto_investigado_nombre}</span>
                                            </div>
                                            <div className="w-full bg-stone-200 rounded-full h-2 mb-2">
                                                <div
                                                    className="bg-gradient-to-r from-purple-600 to-purple-800 h-2 rounded-full transition-all"
                                                    style={{ width: `${investigacion.porcentaje_completado}%` }}
                                                />
                                            </div>
                                            <p className="text-xs text-stone-600">
                                                {investigacion.exitos_conseguidos}/{investigacion.exitos_requeridos} éxitos
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Progresos Activos de Crafting */}
                        {progresosActivos.length > 0 && (
                            <div className="mb-6">
                                <h2 className="text-2xl font-title font-bold text-stone-800 mb-4 flex items-center gap-2">
                                    <FaClock className="text-blue-600" />
                                    Proyectos en Curso ({progresosActivos.length})
                                </h2>
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {progresosActivos.map(progreso => (
                                        <button
                                            key={progreso.id}
                                            onClick={() => setProgresoActivo(progreso)}
                                            className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg p-4 hover:shadow-lg transition-all text-left"
                                        >
                                            <h3 className="font-bold text-stone-800 mb-2">{progreso.receta_nombre}</h3>
                                            <div className="flex items-center gap-2 text-sm text-stone-600 mb-2">
                                                <span>→ {progreso.objeto_final}</span>
                                            </div>
                                            <div className="w-full bg-stone-200 rounded-full h-2 mb-2">
                                                <div
                                                    className="bg-gradient-to-r from-bosque to-green-600 h-2 rounded-full transition-all"
                                                    style={{ width: `${progreso.porcentaje_completado}%` }}
                                                />
                                            </div>
                                            <p className="text-xs text-stone-600">
                                                {progreso.es_magico 
                                                    ? `${progreso.exitos_conseguidos}/${progreso.exitos_requeridos} éxitos`
                                                    : `${progreso.oro_acumulado}/${progreso.oro_necesario} gp`
                                                }
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Loading */}
                        {loading && (
                            <div className="flex justify-center items-center py-12">
                                <FaSpinner className="animate-spin text-4xl text-bosque" />
                            </div>
                        )}

                        {/* ✅ NUEVO: Recetas Investigables */}
                        {!loading && recetasInvestigables.length > 0 && (
                            <div className="mb-8">
                                <h2 className="text-2xl font-title font-bold text-purple-800 mb-4 flex items-center gap-2">
                                    <FaSearch className="text-purple-600 animate-pulse" />
                                    Recetas por Descubrir ({recetasInvestigables.length})
                                </h2>
                                <p className="text-sm text-purple-700 mb-4 bg-purple-50 p-3 rounded-lg border border-purple-200">
                                    💡 Estas recetas requieren investigación. Investiga los objetos marcados para desbloquearlas.
                                </p>
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {recetasInvestigables.map(receta => (
                                        <RecetaCard
                                            key={receta.id}
                                            receta={receta}
                                            onClick={handleRecetaClick}
                                            disponible={true}
                                            tipo="investigable"
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Recetas Disponibles */}
                        {!loading && recetasDisponibles.length > 0 && (
                            <div className="mb-8">
                                <h2 className="text-2xl font-title font-bold text-stone-800 mb-4 flex items-center gap-2">
                                    <FaCheckCircle className="text-green-500" />
                                    Recetas Disponibles ({recetasDisponibles.length})
                                </h2>
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {recetasDisponibles.map(receta => (
                                        <RecetaCard
                                            key={receta.id}
                                            receta={receta}
                                            onClick={handleRecetaClick}
                                            disponible={true}
                                            tipo="disponible"
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Recetas Bloqueadas */}
                        {!loading && recetasBloqueadas.length > 0 && (
                            <div>
                                <h2 className="text-2xl font-title font-bold text-stone-500 mb-4 flex items-center gap-2">
                                    <FaLock className="text-gray-400" />
                                    Recetas No Disponibles ({recetasBloqueadas.length})
                                </h2>
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-60">
                                    {recetasBloqueadas.map(receta => (
                                        <RecetaCard
                                            key={receta.id}
                                            receta={receta}
                                            onClick={() => {}}
                                            disponible={false}
                                            tipo="bloqueada"
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Sin recetas */}
                        {!loading && recetas.length === 0 && (
                            <div className="bg-white rounded-lg shadow-md p-12 text-center">
                                <p className="text-xl text-stone-600">No hay recetas disponibles</p>
                            </div>
                        )}
                    </>
                )}

                {/* Modal Iniciar Crafting */}
                {recetaParaCraftear && personajeSeleccionado && (
                    <ModalIniciarCrafting
                        receta={recetaParaCraftear}
                        personaje={personajeSeleccionado}
                        onClose={() => setRecetaParaCraftear(null)}
                        onSuccess={handleIniciarCrafting}
                    />
                )}

                {/* ✅ NUEVO: Modal Iniciar Investigación */}
                {recetaParaInvestigar && personajeSeleccionado && (
                    <ModalIniciarInvestigacion
                        receta={recetaParaInvestigar}
                        personaje={personajeSeleccionado}
                        onClose={() => setRecetaParaInvestigar(null)}
                        onSuccess={handleIniciarInvestigacion}
                    />
                )}

                {/* Modal Progreso Activo */}
                {progresoActivo && personajeSeleccionado && (
                    <ModalProgresoActivo
                        progreso={progresoActivo}
                        personaje={personajeSeleccionado}
                        onClose={handleCerrarProgreso}
                        onActualizar={handleCerrarProgreso}
                    />
                )}

                {/* ✅ NUEVO: Modal Investigación Activa */}
                {investigacionActiva && personajeSeleccionado && (
                    <ModalProgresoInvestigacion
                        progreso={investigacionActiva}
                        personaje={personajeSeleccionado}
                        onClose={handleCerrarInvestigacion}
                        onActualizar={handleCerrarInvestigacion}
                    />
                )}
            </div>
        </div>
    );
}