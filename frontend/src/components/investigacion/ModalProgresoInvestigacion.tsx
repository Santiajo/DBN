// components/investigacion/ModalProgresoInvestigacion.tsx

'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FaTimes, FaDice, FaCheckCircle, FaTimesCircle, FaCoins, FaClock, FaBook, FaStar, FaTrophy } from 'react-icons/fa';
import { ProgresoInvestigacion, Personaje, HistorialTiradaInvestigacion } from '@/types/receta';

interface Props {
  progreso: ProgresoInvestigacion;
  personaje: Personaje;
  onClose: () => void;
  onActualizar: () => void;
}

export default function ModalProgresoInvestigacion({ 
  progreso: initialProgreso, 
  personaje: initialPersonaje, 
  onClose, 
  onActualizar 
}: Props) {
  const { accessToken } = useAuth();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  
  const [progreso, setProgreso] = useState(initialProgreso);
  const [personaje, setPersonaje] = useState(initialPersonaje);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ultimaTirada, setUltimaTirada] = useState<HistorialTiradaInvestigacion | null>(null);
  const [mostrarNotificacion, setMostrarNotificacion] = useState(false);
  const [recetaDesbloqueada, setRecetaDesbloqueada] = useState(false);

  const realizarTirada = async () => {
    setLoading(true);
    setError('');
    setUltimaTirada(null);
    setRecetaDesbloqueada(false);

    try {
      const res = await fetch(`${apiUrl}/api/crafting/realizar_tirada_investigacion/`, {
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
      setPersonaje({
        ...personaje,
        oro: data.personaje.oro,
        tiempo_libre: data.personaje.tiempo_libre
      });
      
      // Actualizar progreso completo
      const progresoActualizado = data.progreso;
      setProgreso(progresoActualizado);

      // Mostrar notificación animada
      setMostrarNotificacion(true);
      setTimeout(() => setMostrarNotificacion(false), 3000);

      // Si se desbloqueó la receta
      if (data.receta_desbloqueada) {
        setRecetaDesbloqueada(true);
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

  const getFuenteIcon = (fuente: string): React.ReactNode => {
    const iconos: Record<string, React.ReactNode> = {
      'libros': <FaBook className="text-blue-600" />,
      'entrevistas': <FaBook className="text-purple-600" />,
      'experimentos': <FaBook className="text-green-600" />,
      'campo': <FaBook className="text-amber-600" />,
    };
    return iconos[fuente] || <FaBook />;
  };

  const getFuenteLabel = (fuente: string) => {
    const labels: Record<string, string> = {
      'libros': 'Libros y Archivos',
      'entrevistas': 'Entrevistas y Rumores',
      'experimentos': 'Experimentos y Análisis',
      'campo': 'Trabajo de Campo',
    };
    return labels[fuente] || fuente;
  };

  const puedeTrabajar = personaje.tiempo_libre >= 1 && personaje.oro >= 25;
  const estaCompletado = progreso.estado === 'completado';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border-4 border-purple-600">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-6 flex justify-between items-center sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-title font-bold flex items-center gap-2">
              <FaBook />
              {progreso.receta_nombre}
            </h2>
            <p className="text-sm opacity-90 mt-1 flex items-center gap-2">
              Investigando: {progreso.objeto_investigado_nombre}
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

          {/* Notificación de receta desbloqueada */}
          {recetaDesbloqueada && (
            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 border-2 border-yellow-600 text-yellow-900 p-4 rounded-lg shadow-lg animate-pulse">
              <div className="flex items-center gap-3">
                <FaTrophy className="text-3xl" />
                <div>
                  <p className="font-bold text-lg">¡Receta Desbloqueada!</p>
                  <p className="text-sm">Has descubierto los secretos de {progreso.receta_nombre}</p>
                </div>
              </div>
            </div>
          )}

          {/* Estado de completado */}
          {estaCompletado && (
            <div className="bg-gradient-to-r from-green-400 to-emerald-500 border-4 border-green-600 rounded-lg p-6 text-center shadow-xl">
              <FaCheckCircle className="text-6xl text-white mx-auto mb-3 animate-bounce" />
              <h3 className="text-2xl font-bold text-white mb-2">¡Investigación Completada!</h3>
              <p className="text-white text-lg">
                Has desbloqueado la receta de {progreso.receta_nombre}
              </p>
            </div>
          )}

          {/* Barra de progreso */}
          <div className="bg-stone-100 border-2 border-stone-300 rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-lg text-stone-800">Progreso de Investigación</h3>
              <span className="text-2xl font-bold text-purple-600">
                {progreso.porcentaje_completado.toFixed(0)}%
              </span>
            </div>

            <div className="w-full bg-stone-300 rounded-full h-6 overflow-hidden mb-3 shadow-inner">
              <div
                className="bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 h-full transition-all duration-500 flex items-center justify-center"
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
                {progreso.exitos_conseguidos} / {progreso.exitos_requeridos} éxitos
              </span>
              <span className="font-semibold">
                {progreso.dias_trabajados} días investigados
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
              <p className="text-xs text-purple-600 font-semibold">DC Objetivo</p>
              <p className="text-2xl font-bold text-purple-800">{progreso.dc}</p>
              <p className="text-xs text-purple-500">dificultad</p>
            </div>

            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 text-center">
              <FaCoins className="text-2xl text-red-600 mx-auto mb-2" />
              <p className="text-xs text-red-600 font-semibold">Oro Gastado</p>
              <p className="text-2xl font-bold text-red-800">{progreso.oro_gastado_total}</p>
              <p className="text-xs text-red-500">gp</p>
            </div>
          </div>

          {/* Método de investigación */}
          <div className="border-2 border-purple-300 rounded-lg p-4 bg-purple-50">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                {getFuenteIcon(progreso.fuente_informacion)}
                <div>
                  <p className="font-bold text-stone-800">
                    {getFuenteLabel(progreso.fuente_informacion)}
                  </p>
                  <p className="text-sm text-stone-600">
                    {progreso.habilidad_nombre || progreso.competencia_nombre || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
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
                    {ultimaTirada.exito ? '✓ ÉXITO' : '✗ FALLO'} (DC {ultimaTirada.dc})
                  </p>
                  <p className="text-sm text-stone-700 mt-1">
                    {ultimaTirada.exito ? '+1 éxito descubierto' : 'Sin progreso, pero sigues aprendiendo'}
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

          {/* Botón de investigar */}
          {!estaCompletado && (
            <div className="border-2 border-purple-600 rounded-lg p-4 bg-gradient-to-br from-purple-50 to-purple-100">
              {!puedeTrabajar && (
                <div className="bg-amber-100 border border-amber-400 text-amber-800 p-3 rounded-lg mb-4 text-sm">
                  <strong>⚠️ No puedes investigar:</strong>
                  {personaje.tiempo_libre < 1 && <p>• Te falta tiempo libre</p>}
                  {personaje.oro < 25 && (
                    <p>• Te faltan {25 - personaje.oro} gp</p>
                  )}
                </div>
              )}

              <button
                onClick={realizarTirada}
                disabled={loading || !puedeTrabajar}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white font-bold py-4 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg shadow-lg"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    Investigando...
                  </>
                ) : (
                  <>
                    <FaDice className="text-2xl" />
                    Investigar 1 Día (-25 gp)
                  </>
                )}
              </button>

              <p className="text-center text-xs text-stone-600 mt-2">
                DC: {progreso.dc} | d20 + modificador
              </p>
            </div>
          )}

          {/* Historial de tiradas */}
          {progreso.tiradas.length > 0 && (
            <div className="border-2 border-stone-300 rounded-lg p-4 bg-stone-50">
              <h3 className="font-bold text-lg text-stone-800 mb-3 flex items-center gap-2">
                <FaDice className="text-purple-600" />
                Historial de Investigaciones ({progreso.tiradas.length})
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
                            DC {tirada.dc} • {tirada.exito ? '+1 éxito' : 'Sin progreso'}
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