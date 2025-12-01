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

      setUltimaTirada(data.tirada);
      setPersonaje(data.personaje);
      
      const progresoActualizado = data.progreso;
      setProgreso(progresoActualizado);

      setMostrarNotificacion(true);
      setTimeout(() => setMostrarNotificacion(false), 3000);

      if (data.subida_grado) {
        setSubidaGrado(data.subida_grado);
        setTimeout(() => setSubidaGrado(null), 5000);
      }

      if (progresoActualizado.estado === 'completado') {
        setTimeout(() => {
          onActualizar();
        }, 3000);
      }

      setLoading(false);
    } catch (err) {
      setError('Error de conexion con el servidor');
      setLoading(false);
    }
  };

  const getGradoColor = (grado: string) => {
    const colores: Record<string, string> = {
      'Novato': 'bg-[#e8e0d0] text-[#5a4a3a] border-[#c4b998]',
      'Aprendiz': 'bg-[#d4e6d4] text-[#3a5a3a] border-[#a0c0a0]',
      'Experto': 'bg-[#d4e0f0] text-[#3a4a6a] border-[#a0b0d0]',
      'Maestro Artesano': 'bg-[#e4d4f0] text-[#5a3a6a] border-[#c0a0d0]',
      'Gran Maestro': 'bg-[#f0e4c4] text-[#6a5a2a] border-[#d4c480]',
    };
    return colores[grado] || 'bg-[#e8e0d0] text-[#5a4a3a] border-[#c4b998]';
  };

  const puedeTrabajar = personaje.tiempo_libre >= 1 && personaje.oro >= progreso.competencia.info_grado.gasto_oro;
  const estaCompletado = progreso.estado === 'completado';

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-[#f5ede1] rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border-2 border-[#3a2a1a]">
        
        {/* Header */}
        <div className="bg-[#5a7a5a] text-[#f5ede1] p-6 flex justify-between items-center sticky top-0 z-10 border-b-2 border-[#3a5a3a]">
          <div>
            <h2 className="text-2xl font-serif flex items-center gap-2">
              <FaTools />
              {progreso.receta_nombre}
            </h2>
            <p className="text-sm opacity-90 mt-1 flex items-center gap-2">
              Creando: {progreso.objeto_final}
              {progreso.es_magico && (
                <span className="bg-[#8a6a9a] px-2 py-0.5 rounded text-xs flex items-center gap-1">
                  <FaMagic /> Magico
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#f5ede1] hover:bg-[#4a6a4a] p-2 rounded-lg transition-all"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Error */}
          {error && (
            <div className="bg-[#fdf0f0] border-l-4 border-[#c45a5a] text-[#7a3030] p-4 rounded-r-lg">
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {/* Notificacion de subida de grado */}
          {subidaGrado && (
            <div className="bg-gradient-to-r from-[#c9a65a] to-[#e8c060] border-2 border-[#a88a3a] text-[#4a3a1a] p-4 rounded-xl shadow-lg animate-pulse">
              <div className="flex items-center gap-3">
                <FaTrophy className="text-3xl" />
                <div>
                  <p className="font-bold text-lg">{subidaGrado.mensaje}</p>
                  <p className="text-sm">Tus habilidades han mejorado!</p>
                </div>
              </div>
            </div>
          )}

          {/* Estado de completado */}
          {estaCompletado && (
            <div className="bg-gradient-to-r from-[#5a7a5a] to-[#4a6a4a] border-2 border-[#3a5a3a] rounded-xl p-6 text-center shadow-xl">
              <FaCheckCircle className="text-6xl text-[#f5ede1] mx-auto mb-3 animate-bounce" />
              <h3 className="text-2xl font-serif text-[#f5ede1] mb-2">Objeto Completado!</h3>
              <p className="text-[#d4e4d4] text-lg">
                {progreso.objeto_final} ha sido anadido a tu inventario
              </p>
            </div>
          )}

          {/* Barra de progreso */}
          <div className="bg-[#f8f4eb] border-2 border-[#c4b998] rounded-xl p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-lg text-[#4a3f35]">Progreso</h3>
              <span className="text-2xl font-bold text-[#5a7a5a]">
                {progreso.porcentaje_completado.toFixed(0)}%
              </span>
            </div>

            <div className="w-full bg-[#d8e0d8] rounded-full h-6 overflow-hidden mb-3 shadow-inner">
              <div
                className="bg-gradient-to-r from-[#5a7a5a] via-[#4a6a4a] to-[#3a5a3a] h-full transition-all duration-500 flex items-center justify-center"
                style={{ width: `${progreso.porcentaje_completado}%` }}
              >
                {progreso.porcentaje_completado > 10 && (
                  <span className="text-[#f5ede1] text-sm font-bold">
                    {progreso.porcentaje_completado.toFixed(0)}%
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-between text-sm text-[#6a5a4a]">
              <span>
                {progreso.es_magico 
                  ? `${progreso.exitos_conseguidos} / ${progreso.exitos_requeridos} exitos`
                  : `${progreso.oro_acumulado} / ${progreso.oro_necesario} gp`
                }
              </span>
              <span className="font-semibold">
                {progreso.dias_trabajados} dias trabajados
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#e8f0f4] border-2 border-[#a0c0d0] rounded-xl p-4 text-center">
              <FaClock className="text-2xl text-[#6a8a9a] mx-auto mb-2" />
              <p className="text-xs text-[#4a6a7a] font-semibold">Tiempo Libre</p>
              <p className="text-2xl font-bold text-[#3a5a6a]">{personaje.tiempo_libre}</p>
              <p className="text-xs text-[#6a8a9a]">dias</p>
            </div>

            <div className="bg-[#f8f4eb] border-2 border-[#d4c4a0] rounded-xl p-4 text-center">
              <FaCoins className="text-2xl text-[#c9a65a] mx-auto mb-2" />
              <p className="text-xs text-[#6a5a4a] font-semibold">Oro Disponible</p>
              <p className="text-2xl font-bold text-[#4a3f35]">{personaje.oro}</p>
              <p className="text-xs text-[#8a7a5a]">gp</p>
            </div>

            <div className="bg-[#f8f4fb] border-2 border-[#c4b0d4] rounded-xl p-4 text-center">
              <FaStar className="text-2xl text-[#8a6a9a] mx-auto mb-2" />
              <p className="text-xs text-[#6a4a7a] font-semibold">Modificador Total</p>
              <p className="text-2xl font-bold text-[#5a3a6a]">+{progreso.competencia.modificador}</p>
              <p className="text-xs text-[#8a6a9a]">
                +{progreso.competencia.modificador_competencia} (comp) + {progreso.competencia.modificador_habilidad} ({progreso.competencia.habilidad_maxima.nombre})
              </p>
            </div>

            <div className="bg-[#fdf0f0] border-2 border-[#e0b0b0] rounded-xl p-4 text-center">
              <FaCoins className="text-2xl text-[#a05050] mx-auto mb-2" />
              <p className="text-xs text-[#7a4040] font-semibold">Coste por dia</p>
              <p className="text-2xl font-bold text-[#6a3030]">{progreso.competencia.info_grado.gasto_oro}</p>
              <p className="text-xs text-[#a07070]">gp</p>
            </div>
          </div>

          {/* Competencia */}
          <div className={`border-2 rounded-xl p-4 ${getGradoColor(progreso.competencia.grado)}`}>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <FaTools className="text-xl" />
                <span className="font-semibold text-lg">{progreso.competencia.nombre_herramienta}</span>
              </div>
              <span className="font-bold text-xl">{progreso.competencia.grado}</span>
            </div>
            
            {progreso.competencia.exitos_para_siguiente_grado && (
              <div>
                <p className="text-sm mb-1">
                  Progreso al siguiente grado: <strong>{progreso.competencia.exitos_acumulados} / {progreso.competencia.exitos_para_siguiente_grado}</strong>
                </p>
                <div className="w-full bg-white/50 rounded-full h-2">
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

          {/* Ultima tirada con animacion */}
          {mostrarNotificacion && ultimaTirada && (
            <div className={`border-2 rounded-xl p-6 shadow-xl animate-pulse ${
              ultimaTirada.exito 
                ? 'bg-gradient-to-r from-[#e8f4e8] to-[#d4e8d4] border-[#5a7a5a]' 
                : 'bg-gradient-to-r from-[#fdf0f0] to-[#f8e0e0] border-[#a05050]'
            }`}>
              <div className="flex items-center gap-4">
                <div className={`text-6xl font-bold ${
                  ultimaTirada.exito ? 'text-[#3a5a3a]' : 'text-[#7a3030]'
                }`}>
                  {ultimaTirada.resultado_dado}
                </div>
                <div className="flex-1">
                  <p className="text-xl font-bold text-[#4a3f35] mb-1">
                    {ultimaTirada.resultado_dado} + {ultimaTirada.modificador} = {ultimaTirada.resultado_total}
                  </p>
                  <p className={`text-lg font-semibold ${
                    ultimaTirada.exito ? 'text-[#3a5a3a]' : 'text-[#7a3030]'
                  }`}>
                    {ultimaTirada.exito ? 'EXITO' : 'FALLO'}
                  </p>
                  <p className="text-sm text-[#6a5a4a] mt-1">
                    {ultimaTirada.mensaje || (
                      progreso.es_magico 
                        ? (ultimaTirada.exito ? '+1 exito' : 'Sin progreso')
                        : (ultimaTirada.exito ? `+${ultimaTirada.oro_sumado} gp` : 'Sin progreso')
                    )}
                  </p>
                </div>
                {ultimaTirada.exito ? (
                  <FaCheckCircle className="text-5xl text-[#5a7a5a]" />
                ) : (
                  <FaTimesCircle className="text-5xl text-[#a05050]" />
                )}
              </div>
            </div>
          )}

          {/* Boton de trabajar */}
          {!estaCompletado && (
            <div className="border-2 border-[#5a7a5a] rounded-xl p-4 bg-gradient-to-br from-[#f0f8f0] to-[#e8f4e8]">
              {!puedeTrabajar && (
                <div className="bg-[#f8f0e0] border border-[#d4b480] text-[#6a5020] p-3 rounded-lg mb-4 text-sm">
                  <strong>No puedes trabajar:</strong>
                  {personaje.tiempo_libre < 1 && <p>Te falta tiempo libre</p>}
                  {personaje.oro < progreso.competencia.info_grado.gasto_oro && (
                    <p>Te faltan {progreso.competencia.info_grado.gasto_oro - personaje.oro} gp</p>
                  )}
                </div>
              )}

              <button
                onClick={realizarTirada}
                disabled={loading || !puedeTrabajar}
                className="w-full bg-gradient-to-r from-[#5a7a5a] to-[#4a6a4a] hover:from-[#4a6a4a] hover:to-[#3a5a3a] text-[#f5ede1] font-semibold py-4 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg shadow-lg"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#f5ede1]"></div>
                    Lanzando dados...
                  </>
                ) : (
                  <>
                    <FaDice className="text-2xl" />
                    Trabajar 1 Dia (-{progreso.competencia.info_grado.gasto_oro} gp)
                  </>
                )}
              </button>

              <p className="text-center text-xs text-[#6a5a4a] mt-2">
                DC: {progreso.es_magico ? `${ultimaTirada?.dc || progreso.dc}` : '12'} | 
                d20 + {progreso.competencia.modificador} (modificador)
              </p>
            </div>
          )}

          {/* Historial de tiradas */}
          {progreso.tiradas.length > 0 && (
            <div className="border-2 border-[#c4b998] rounded-xl p-4 bg-[#f8f4eb]">
              <h3 className="font-semibold text-lg text-[#4a3f35] mb-3 flex items-center gap-2">
                <FaDice className="text-[#5a7a5a]" />
                Historial de Tiradas ({progreso.tiradas.length})
              </h3>
              
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                {progreso.tiradas.slice(0, 10).map((tirada, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border-l-4 transition-all ${
                      tirada.exito 
                        ? 'bg-[#e8f4e8] border-[#5a7a5a]' 
                        : 'bg-[#fdf0f0] border-[#a05050]'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className={`text-2xl font-bold ${
                          tirada.exito ? 'text-[#3a5a3a]' : 'text-[#7a3030]'
                        }`}>
                          {tirada.resultado_dado}
                        </div>
                        <div className="text-sm">
                          <p className="font-semibold text-[#4a3f35]">
                            {tirada.resultado_dado} + {tirada.modificador} = {tirada.resultado_total}
                            {tirada.exito ? ' (Exito)' : ' (Fallo)'}
                          </p>
                          <p className="text-xs text-[#6a5a4a]">
                            {progreso.es_magico 
                              ? (tirada.exito ? '+1 exito' : 'Sin progreso')
                              : (tirada.exito ? `+${tirada.oro_sumado} gp` : 'Sin progreso')
                            }
                          </p>
                        </div>
                      </div>
                      <div className="text-right text-xs text-[#6a5a4a]">
                        <p>-{tirada.oro_gastado} gp</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Boton cerrar */}
          <div className="flex justify-end pt-4 border-t-2 border-[#c4b998]">
            <button
              onClick={onClose}
              className="bg-[#e8e0d0] hover:bg-[#d8d0c0] text-[#5a4a3a] font-semibold py-2 px-6 rounded-lg transition-all border border-[#c4b998]"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}