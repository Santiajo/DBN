'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import RecetaCard from '@/components/crafting/RecetaCard';
import ModalIniciarCrafting from '@/components/crafting/ModalIniciarCrafting';
import ModalProgresoActivo from '@/components/crafting/ModalProgresoActivo';
import { FaHammer, FaCoins, FaClock, FaSpinner } from 'react-icons/fa';
import { RecetaFormData, Receta, Progreso } from '@/types/receta';
import dynamic from 'next/dynamic';

// Importamos dinámicamente, asegurando que NO se renderice en el servidor.
const DynamicSelectorPersonaje = dynamic(
    () => import('@/components/crafting/SelectorPersonaje'),
    {
        ssr: false, // 
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
    
    const [recetaParaCraftear, setRecetaParaCraftear] = useState<Receta | null>(null);
    const [progresoActivo, setProgresoActivo] = useState<Progreso | null>(null);
    
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
    }

}, [personajeSeleccionado, accessToken]);

    // --- FUNCIÓN DE CARGA CORREGIDA ---
    const cargarPersonajes = async () => {
        if (!accessToken) {
            // Esto no debería ejecutarse si el useEffect funciona bien, pero es una buena guardia.
            console.warn("Intento de carga de personajes sin accessToken.");
            return;
        }

        try {
            const res = await fetch(`${apiUrl}/api/personajes/`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });

            if (res.ok) {
                const data = await res.json();
                console.log('Datos recibidos de la API (Personajes):', data);
                // Asume que la data puede venir directamente o dentro de 'results'
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
      
      // 💡 ¡Añade este console.log!
      console.log('Respuesta de Recetas - Status:', res.status, 'StatusText:', res.statusText); 
      
      // Si el status es 401, el servidor enviará un cuerpo de error
      if (!res.ok) {
          const errorData = await res.json().catch(() => ({ detail: 'No hay cuerpo de error.' }));
          console.error('Error del servidor al cargar recetas:', errorData);
          throw new Error(`Fallo de la API con código: ${res.status}`);
      }

      // Si el fetch fue OK (200)
      const data = await res.json();
      console.log('Recetas cargadas con éxito:', data);
      setRecetas(data.results || data);
      
    } catch (error) {
      console.error('Error cargando recetas:', error);
      setError('Error al cargar las recetas');
    } finally {
      setLoading(false);
    }
  };

  const cargarProgresosActivos = async () => {
    if (!personajeSeleccionado || !accessToken) return; // Asegurar el token aquí
    
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

  const actualizarPersonaje = async () => {
    if (!personajeSeleccionado || !accessToken) return; // Asegurar el token aquí
    
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
    if (!receta.puede_craftear) return;
    setRecetaParaCraftear(receta);
  };

  const handleIniciarCrafting = async () => {
    await cargarRecetas();
    await cargarProgresosActivos();
    await actualizarPersonaje();
    setRecetaParaCraftear(null);
    
    // Si hay un progreso nuevo, abrirlo automáticamente
    // Asegurar el token en esta llamada también
    if (personajeSeleccionado && accessToken) {
      const res = await fetch(
        `${apiUrl}/api/crafting/mis_progresos/?personaje_id=${personajeSeleccionado?.id}`,
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

  const handleCerrarProgreso = async () => {
    await cargarRecetas();
    await cargarProgresosActivos();
    await actualizarPersonaje();
    setProgresoActivo(null);
  };

  const recetasDisponibles = recetas.filter(r => r.puede_craftear);
  const recetasBloqueadas = recetas.filter(r => !r.puede_craftear);

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
              <DynamicSelectorPersonaje // 👈 ¡APLICADO EL CAMBIO AQUÍ!
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
            {/* Progresos Activos */}
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
                            : `${progreso.oro_acumulado}/${progreso.oro_necesario} gp` // ✅ Usar oro_necesario
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

            {/* Recetas Disponibles */}
            {!loading && recetasDisponibles.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-title font-bold text-stone-800 mb-4 flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                  Recetas Disponibles ({recetasDisponibles.length})
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recetasDisponibles.map(receta => (
                    <RecetaCard
                      key={receta.id}
                      receta={receta}
                      onClick={handleRecetaClick}
                      disponible={true}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Recetas Bloqueadas */}
            {!loading && recetasBloqueadas.length > 0 && (
              <div>
                <h2 className="text-2xl font-title font-bold text-stone-500 mb-4 flex items-center gap-2">
                  <span className="w-3 h-3 bg-gray-400 rounded-full"></span>
                  Recetas No Disponibles ({recetasBloqueadas.length})
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-60">
                  {recetasBloqueadas.map(receta => (
                    <RecetaCard
                      key={receta.id}
                      receta={receta}
                      onClick={() => {}}
                      disponible={false}
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

        {/* Modal Progreso Activo */}
        {progresoActivo && personajeSeleccionado && (
          <ModalProgresoActivo
            progreso={progresoActivo}
            personaje={personajeSeleccionado}
            onClose={handleCerrarProgreso}
            onActualizar={handleCerrarProgreso}
          />
        )}
      </div>
    </div>
  );
}