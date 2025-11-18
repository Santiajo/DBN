'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FaTimes, FaDice, FaCheckCircle, FaTimesCircle, FaCoins, FaClock, FaTools, FaStar, FaMagic, FaTrophy } from 'react-icons/fa';
import { Progreso, Personaje, Tirada, SubidaGrado } from '@/types/receta';

interface Props {
  progreso: Progreso;
  personaje: Personaje;
  onClose: () => void;
  onActualizar: () => void;
}

export default function ModalProgresoActivo({ progreso: initialProgreso, personaje: initialPersonaje, onClose, onActualizar }: Props) {
  const { accessToken } = useAuth();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  
  const [progreso, setProgreso] = useState(initialProgreso);
  const [personaje, setPersonaje] = useState(initialPersonaje);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ultimaTirada, setUltimaTirada] = useState<Tirada | null>(null);
  const [mostrarNotificacion, setMostrarNotificacion] = useState(false);
  const [subidaGrado, setSubidaGrado] = useState<SubidaGrado | null>(null);

  const realizarTirada = async () => {
    setLoading(true);
    setError('');
    setUltimaTirada(null);

    try {
      const res = await fetch(`${apiUrl}/api/crafting/realizar_tirada/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          progreso_id: progreso.id
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al realizar la tirada');
        setLoading(false);
        return;
      }

      // Actualizar datos locales
      setUltimaTirada(data.tirada);
      setPersonaje(data.personaje);
      
      // Actualizar progreso completo
      const progresoActualizado = data.progreso;
      setProgreso(progresoActualizado);

      // Mostrar notificación animada
      setMostrarNotificacion(true);
      setTimeout(() => setMostrarNotificacion(false), 3000);

      // Si hubo subida de grado
      if (data.subida_grado) {
        setSubidaGrado(data.subida_grado);
        setTimeout(() => setSubidaGrado(null), 5000);
      }

      // Si se completó, esperar un momento y cerrar
      if (progresoActualizado.estado === 'completado') {
        setTimeout(() => {
          onActualizar();
        }, 3000);
      }

      setLoading(false);
    } catch (err) {
      setError('Error de conexión con el servidor');
      setLoading(false);
    }
  };

  const getGradoColor = (grado: string) => {
    const colores: Record<string, string> = {
      'Novato': 'bg-gray-200 text-gray-700 border-gray-400',
      'Aprendiz': 'bg-green-200 text-green-800 border-green-400',
      'Experto': 'bg-blue-200 text-blue-800 border-blue-400',
      'Maestro Artesano': 'bg-purple-200 text-purple-800 border-purple-400',
      'Gran Maestro': 'bg-yellow-200 text-yellow-800 border-yellow-400',
    };
    return colores[grado] || 'bg-gray-200 text-gray-700 border-gray-400';
  };

  const puedeTrabajar = personaje.tiempo_libre >= 1 && personaje.oro >= progreso.competencia.info_grado.gasto_oro;
  const estaCompletado = progreso.estado === 'completado';

  // Calcular el oro/éxitos objetivo
  const calcularObjetivoOro = () => {
    if (progreso.es_magico) {
      return progreso.exitos_requeridos;
    }
    
    // Para objetos no mágicos, el objetivo es el oro_necesario de la receta
    // Lo calculamos basándonos en el porcentaje
    if (progreso.porcentaje_completado === 0) {
      // Si no hay progreso aún, no sabemos el objetivo exacto
      // Podríamos hacer una llamada extra o asumir un valor
      return 0; // O puedes poner "?" si prefieres
    }
    
    // Calcular el oro total necesario basándose en el porcentaje actual
    const oro_total = Math.ceil(progreso.oro_acumulado / (progreso.porcentaje_completado / 100));
    return oro_total;
  };

  const objetivoFinal = calcularObjetivoOro();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border-4 border-bosque">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-bosque to-green-700 text-white p-6 flex justify-between items-center sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-title font-bold flex items-center gap-2">
              <FaTools />
              {progreso.receta_nombre}
            </h2>
            <p className="text-sm opacity-90 mt-1 flex items-center gap-2">
              → {progreso.objeto_final}
              {progreso.es_magico && (
                <span className="bg-purple-500 px-2 py-0.5 rounded text-xs flex items-center gap-1">
                  <FaMagic /> Mágico
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-all"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Error */}
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {/* Notificación de subida de grado */}
          {subidaGrado && (
            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 border-2 border-yellow-600 text-yellow-900 p-4 rounded-lg shadow-lg animate-pulse">
              <div className="flex items-center gap-3">
                <FaTrophy className="text-3xl" />
                <div>
                  <p className="font-bold text-lg">{subidaGrado.mensaje}</p>
                  <p className="text-sm">¡Tus habilidades han mejorado!</p>
                </div>
              </div>
            </div>
          )}

          {/* Estado de completado */}
          {estaCompletado && (
            <div className="bg-gradient-to-r from-green-400 to-emerald-500 border-4 border-green-600 rounded-lg p-6 text-center shadow-xl">
              <FaCheckCircle className="text-6xl text-white mx-auto mb-3 animate-bounce" />
              <h3 className="text-2xl font-bold text-white mb-2">¡Objeto Completado!</h3>
              <p className="text-white text-lg">
                {progreso.objeto_final} ha sido añadido a tu inventario
              </p>
            </div>
          )}

          {/* Barra de progreso */}
          <div className="bg-stone-100 border-2 border-stone-300 rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-lg text-stone-800">Progreso</h3>
              <span className="text-2xl font-bold text-bosque">
                {progreso.porcentaje_completado.toFixed(0)}%
              </span>
            </div>

            <div className="w-full bg-stone-300 rounded-full h-6 overflow-hidden mb-3 shadow-inner">
              <div
                className="bg-gradient-to-r from-bosque via-green-600 to-emerald-600 h-full transition-all duration-500 flex items-center justify-center"
                style={{ width: `${progreso.porcentaje_completado}%` }}
              >
                {progreso.porcentaje_completado > 10 && (
                  <span className="text-white text-sm font-bold">
                    {progreso.porcentaje_completado.toFixed(0)}%
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-between text-sm text-stone-700">
              <span>
                {progreso.es_magico 
                  ? `${progreso.exitos_conseguidos} / ${progreso.exitos_requeridos} éxitos`
                  : `${progreso.oro_acumulado} / ${progreso.oro_necesario} gp`
                }
              </span>
              <span className="font-semibold">
                {progreso.dias_trabajados} días trabajados
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 text-center">
              <FaClock className="text-2xl text-blue-600 mx-auto mb-2" />
              <p className="text-xs text-blue-600 font-semibold">Tiempo Libre</p>
              <p className="text-2xl font-bold text-blue-800">{personaje.tiempo_libre}</p>
              <p className="text-xs text-blue-500">días</p>
            </div>

            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 text-center">
              <FaCoins className="text-2xl text-yellow-600 mx-auto mb-2" />
              <p className="text-xs text-yellow-600 font-semibold">Oro Disponible</p>
              <p className="text-2xl font-bold text-yellow-800">{personaje.oro}</p>
              <p className="text-xs text-yellow-500">gp</p>
            </div>

            <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-4 text-center">
              <FaStar className="text-2xl text-purple-600 mx-auto mb-2" />
              <p className="text-xs text-purple-600 font-semibold">Modificador Total</p>
              <p className="text-2xl font-bold text-purple-800">+{progreso.competencia.modificador}</p>
              <p className="text-xs text-purple-500">
                +{progreso.competencia.modificador_competencia} (comp) + {progreso.competencia.modificador_habilidad} ({progreso.competencia.habilidad_maxima.nombre})
              </p>
            </div>

            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 text-center">
              <FaCoins className="text-2xl text-red-600 mx-auto mb-2" />
              <p className="text-xs text-red-600 font-semibold">Coste por día</p>
              <p className="text-2xl font-bold text-red-800">{progreso.competencia.info_grado.gasto_oro}</p>
              <p className="text-xs text-red-500">gp</p>
            </div>
          </div>

          {/* Competencia */}
          <div className={`border-2 rounded-lg p-4 ${getGradoColor(progreso.competencia.grado)}`}>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <FaTools className="text-xl" />
                <span className="font-bold text-lg">{progreso.competencia.nombre_herramienta}</span>
              </div>
              <span className="font-bold text-xl">{progreso.competencia.grado}</span>
            </div>
            
            {progreso.competencia.exitos_para_siguiente_grado && (
              <div>
                <p className="text-sm mb-1">
                  Progreso al siguiente grado: <strong>{progreso.competencia.exitos_acumulados} / {progreso.competencia.exitos_para_siguiente_grado}</strong>
                </p>
                <div className="w-full bg-white bg-opacity-50 rounded-full h-2">
                  <div
                    className="bg-current h-2 rounded-full transition-all"
                    style={{ 
                      width: `${(progreso.competencia.exitos_acumulados / progreso.competencia.exitos_para_siguiente_grado) * 100}%` 
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Última tirada con animación */}
          {mostrarNotificacion && ultimaTirada && (
            <div className={`border-4 rounded-lg p-6 shadow-xl animate-pulse ${
              ultimaTirada.exito 
                ? 'bg-gradient-to-r from-green-100 to-emerald-100 border-green-500' 
                : 'bg-gradient-to-r from-red-100 to-rose-100 border-red-500'
            }`}>
              <div className="flex items-center gap-4">
                <div className={`text-6xl font-bold ${
                  ultimaTirada.exito ? 'text-green-700' : 'text-red-700'
                }`}>
                  {ultimaTirada.resultado_dado}
                </div>
                <div className="flex-1">
                  <p className="text-xl font-bold mb-1">
                    {ultimaTirada.resultado_dado} + {ultimaTirada.modificador} = {ultimaTirada.resultado_total}
                  </p>
                  <p className={`text-lg font-semibold ${
                    ultimaTirada.exito ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {ultimaTirada.exito ? '✓ ÉXITO' : '✗ FALLO'}
                  </p>
                  <p className="text-sm text-stone-700 mt-1">
                    {ultimaTirada.mensaje || (
                      progreso.es_magico 
                        ? (ultimaTirada.exito ? '+1 éxito' : 'Sin progreso')
                        : (ultimaTirada.exito ? `+${ultimaTirada.oro_sumado} gp` : 'Sin progreso')
                    )}
                  </p>
                </div>
                {ultimaTirada.exito ? (
                  <FaCheckCircle className="text-5xl text-green-600" />
                ) : (
                  <FaTimesCircle className="text-5xl text-red-600" />
                )}
              </div>
            </div>
          )}

          {/* Botón de trabajar */}
          {!estaCompletado && (
            <div className="border-2 border-bosque rounded-lg p-4 bg-gradient-to-br from-green-50 to-emerald-50">
              {!puedeTrabajar && (
                <div className="bg-amber-100 border border-amber-400 text-amber-800 p-3 rounded-lg mb-4 text-sm">
                  <strong>⚠️ No puedes trabajar:</strong>
                  {personaje.tiempo_libre < 1 && <p>• Te falta tiempo libre</p>}
                  {personaje.oro < progreso.competencia.info_grado.gasto_oro && (
                    <p>• Te faltan {progreso.competencia.info_grado.gasto_oro - personaje.oro} gp</p>
                  )}
                </div>
              )}

              <button
                onClick={realizarTirada}
                disabled={loading || !puedeTrabajar}
                className="w-full bg-gradient-to-r from-bosque to-green-700 hover:from-green-800 hover:to-green-900 text-white font-bold py-4 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg shadow-lg"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    Lanzando dados...
                  </>
                ) : (
                  <>
                    <FaDice className="text-2xl" />
                    Trabajar 1 Día (-{progreso.competencia.info_grado.gasto_oro} gp)
                  </>
                )}
              </button>

              <p className="text-center text-xs text-stone-600 mt-2">
                DC: {progreso.es_magico ? `${ultimaTirada?.dc || progreso.dc}` : '12'} | 
                d20 + {progreso.competencia.modificador} (modificador)
              </p>
            </div>
          )}

          {/* Historial de tiradas */}
          {progreso.tiradas.length > 0 && (
            <div className="border-2 border-stone-300 rounded-lg p-4 bg-stone-50">
              <h3 className="font-bold text-lg text-stone-800 mb-3 flex items-center gap-2">
                <FaDice className="text-bosque" />
                Historial de Tiradas ({progreso.tiradas.length})
              </h3>
              
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-stone-400 scrollbar-track-stone-200">
                {progreso.tiradas.slice(0, 10).map((tirada, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border-l-4 transition-all ${
                      tirada.exito 
                        ? 'bg-green-50 border-green-500' 
                        : 'bg-red-50 border-red-500'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className={`text-2xl font-bold ${
                          tirada.exito ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {tirada.resultado_dado}
                        </div>
                        <div className="text-sm">
                          <p className="font-semibold text-stone-800">
                            {tirada.resultado_dado} + {tirada.modificador} = {tirada.resultado_total}
                            {tirada.exito ? ' ✓' : ' ✗'}
                          </p>
                          <p className="text-xs text-stone-600">
                            {progreso.es_magico 
                              ? (tirada.exito ? '+1 éxito' : 'Sin progreso')
                              : (tirada.exito ? `+${tirada.oro_sumado} gp` : 'Sin progreso')
                            }
                          </p>
                        </div>
                      </div>
                      <div className="text-right text-xs text-stone-500">
                        <p>-{tirada.oro_gastado} gp</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botón cerrar */}
          <div className="flex justify-end pt-4 border-t-2 border-stone-300">
            <button
              onClick={onClose}
              className="bg-stone-300 hover:bg-stone-400 text-stone-800 font-bold py-2 px-6 rounded-lg transition-all"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}