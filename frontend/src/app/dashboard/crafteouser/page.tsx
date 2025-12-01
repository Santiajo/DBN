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
        loading: () => <p className="text-[#5a4a3a]">Cargando selector...</p>,
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
                throw new Error(`Fallo de la API con codigo: ${res.status}`);
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
        <div className="min-h-full bg-[#F5F5F4] py-8 px-4">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Header */}
                <div className="bg-[#f5ede1] rounded-xl border-2 border-[#3a2a1a] shadow-[0_4px_12px_rgba(0,0,0,0.15)] p-6 mb-6">
                    <div className="flex justify-between items-center flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-[#5a7a5a] rounded-lg flex items-center justify-center">
                                <FaHammer className="text-2xl text-[#f5ede1]" />
                            </div>
                            <div>
                                <h1 className="font-serif text-3xl text-[#3a2a1a] tracking-wide">Taller de Crafteo</h1>
                                <p className="text-sm text-[#6a5a4a]">Crea objetos mundanos y magicos</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <DynamicSelectorPersonaje
                                personajes={personajes}
                                personajeSeleccionado={personajeSeleccionado}
                                onSeleccionar={setPersonajeSeleccionado}
                            />
                            
                            {personajeSeleccionado && (
                                <div className="flex gap-3">
                                    <div className="flex items-center gap-2 bg-[#f8f4eb] px-4 py-2 rounded-lg border border-[#c9a65a]">
                                        <FaCoins className="text-[#c9a65a]" />
                                        <span className="font-semibold text-[#4a3f35]">{personajeSeleccionado.oro} gp</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-[#f8f4eb] px-4 py-2 rounded-lg border border-[#6a8a9a]">
                                        <FaClock className="text-[#6a8a9a]" />
                                        <span className="font-semibold text-[#4a3f35]">{personajeSeleccionado.tiempo_libre} dias</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Mensaje de error */}
                {error && (
                    <div className="bg-[#fdf0f0] border-2 border-[#c45a5a] text-[#7a3030] px-4 py-3 rounded-lg mb-4">
                        {error}
                    </div>
                )}

                {/* Sin personaje seleccionado */}
                {!personajeSeleccionado && (
                    <div className="bg-[#f5ede1] rounded-xl border-2 border-[#3a2a1a] shadow-[0_4px_12px_rgba(0,0,0,0.15)] p-12 text-center">
                        <div className="w-20 h-20 bg-[#e8e0d0] rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaHammer className="text-4xl text-[#a0988a]" />
                        </div>
                        <p className="text-xl text-[#4a3f35] font-serif">Selecciona un personaje para comenzar</p>
                        <p className="text-[#6a5a4a] mt-2">Elige uno de tus personajes del menu superior</p>
                    </div>
                )}

                {/* Con personaje seleccionado */}
                {personajeSeleccionado && (
                    <>
                        {/* Investigaciones Activas */}
                        {investigacionesActivas.length > 0 && (
                            <div className="mb-6">
                                <h2 className="font-serif text-2xl text-[#6a4a7a] mb-4 flex items-center gap-2">
                                    <FaSearch className="text-[#8a6a9a]" />
                                    Investigaciones en Curso ({investigacionesActivas.length})
                                </h2>
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {investigacionesActivas.map(investigacion => (
                                        <button
                                            key={investigacion.id}
                                            onClick={() => setInvestigacionActiva(investigacion)}
                                            className="bg-gradient-to-br from-[#f0e8f8] to-[#e8e0f0] border-2 border-[#8a6a9a] rounded-xl p-4 hover:shadow-[0_6px_16px_rgba(100,60,120,0.2)] transition-all text-left"
                                        >
                                            <h3 className="font-semibold text-[#4a3f35] mb-2">{investigacion.receta_nombre}</h3>
                                            <div className="flex items-center gap-2 text-sm text-[#6a5a4a] mb-2">
                                                <FaSearch className="text-[#8a6a9a] w-3 h-3" />
                                                <span>{investigacion.objeto_investigado_nombre}</span>
                                            </div>
                                            <div className="w-full bg-[#e0d8e8] rounded-full h-2 mb-2">
                                                <div
                                                    className="bg-gradient-to-r from-[#8a6a9a] to-[#6a4a7a] h-2 rounded-full transition-all"
                                                    style={{ width: `${investigacion.porcentaje_completado}%` }}
                                                />
                                            </div>
                                            <p className="text-xs text-[#6a5a4a]">
                                                {investigacion.exitos_conseguidos}/{investigacion.exitos_requeridos} exitos
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Progresos Activos de Crafting */}
                        {progresosActivos.length > 0 && (
                            <div className="mb-6">
                                <h2 className="font-serif text-2xl text-[#4a6a7a] mb-4 flex items-center gap-2">
                                    <FaClock className="text-[#6a8a9a]" />
                                    Proyectos en Curso ({progresosActivos.length})
                                </h2>
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {progresosActivos.map(progreso => (
                                        <button
                                            key={progreso.id}
                                            onClick={() => setProgresoActivo(progreso)}
                                            className="bg-gradient-to-br from-[#e8f0f4] to-[#e0e8f0] border-2 border-[#6a8a9a] rounded-xl p-4 hover:shadow-[0_6px_16px_rgba(60,100,120,0.2)] transition-all text-left"
                                        >
                                            <h3 className="font-semibold text-[#4a3f35] mb-2">{progreso.receta_nombre}</h3>
                                            <div className="flex items-center gap-2 text-sm text-[#6a5a4a] mb-2">
                                                <span className="text-[#6a8a9a]">&#8594;</span>
                                                <span>{progreso.objeto_final}</span>
                                            </div>
                                            <div className="w-full bg-[#d8e0e8] rounded-full h-2 mb-2">
                                                <div
                                                    className="bg-gradient-to-r from-[#5a7a5a] to-[#4a6a4a] h-2 rounded-full transition-all"
                                                    style={{ width: `${progreso.porcentaje_completado}%` }}
                                                />
                                            </div>
                                            <p className="text-xs text-[#6a5a4a]">
                                                {progreso.es_magico 
                                                    ? `${progreso.exitos_conseguidos}/${progreso.exitos_requeridos} exitos`
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
                                <FaSpinner className="animate-spin text-4xl text-[#5a7a5a]" />
                            </div>
                        )}

                        {/* Recetas Investigables */}
                        {!loading && recetasInvestigables.length > 0 && (
                            <div className="mb-8">
                                <h2 className="font-serif text-2xl text-[#6a4a7a] mb-4 flex items-center gap-2">
                                    <FaSearch className="text-[#8a6a9a]" />
                                    Recetas por Descubrir ({recetasInvestigables.length})
                                </h2>
                                <div className="bg-[#f0e8f8] border border-[#c4b0d4] rounded-lg p-3 mb-4">
                                    <p className="text-sm text-[#6a4a7a]">
                                        Estas recetas requieren investigacion. Investiga los objetos marcados para desbloquearlas.
                                    </p>
                                </div>
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
                                <h2 className="font-serif text-2xl text-[#3a5a3a] mb-4 flex items-center gap-2">
                                    <FaCheckCircle className="text-[#5a7a5a]" />
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
                                <h2 className="font-serif text-2xl text-[#6a5a4a] mb-4 flex items-center gap-2">
                                    <FaLock className="text-[#8a8078]" />
                                    Recetas No Disponibles ({recetasBloqueadas.length})
                                </h2>
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                            <div className="bg-[#f5ede1] rounded-xl border-2 border-[#3a2a1a] shadow-[0_4px_12px_rgba(0,0,0,0.15)] p-12 text-center">
                                <p className="text-xl text-[#4a3f35] font-serif">No hay recetas disponibles</p>
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

                {/* Modal Iniciar Investigacion */}
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

                {/* Modal Investigacion Activa */}
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