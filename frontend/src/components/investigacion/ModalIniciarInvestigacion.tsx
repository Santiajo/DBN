// components/investigacion/ModalIniciarInvestigacion.tsx

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FaTimes, FaBook, FaComments, FaFlask, FaHammer, FaSearch, FaCoins, FaClock, FaExclamationTriangle } from 'react-icons/fa';
import { Receta, Personaje, ObjetoInvestigable, HabilidadesPorFuente, Competencia } from '@/types/receta';
import Select, { StylesConfig, CSSObjectWithLabel } from 'react-select';

interface Props {
  receta: Receta;
  personaje: Personaje;
  onClose: () => void;
  onSuccess: () => void;
}

interface SelectOption {
  value: number | string;
  label: string;
}

const customSelectStyles: StylesConfig<SelectOption, false> = {
  control: (base: CSSObjectWithLabel) => ({
    ...base,
    borderColor: '#78716c',
    boxShadow: 'none',
    '&:hover': { borderColor: '#57534e' },
  }),
  option: (base: CSSObjectWithLabel, state) => ({
    ...base,
    backgroundColor: state.isFocused ? '#f5f5f4' : 'white',
    color: '#1c1917',
    cursor: 'pointer',
  }),
  singleValue: (base: CSSObjectWithLabel) => ({
    ...base,
    color: '#1c1917',
  }),
};

const FUENTES_INFO = [
  { value: 'libros', label: 'Libros y Archivos', icon: FaBook, color: 'blue' },
  { value: 'entrevistas', label: 'Entrevistas y Rumores', icon: FaComments, color: 'purple' },
  { value: 'experimentos', label: 'Experimentos y Análisis', icon: FaFlask, color: 'green' },
  { value: 'campo', label: 'Trabajo de Campo', icon: FaHammer, color: 'amber' },
];

export default function ModalIniciarInvestigacion({ receta, personaje, onClose, onSuccess }: Props) {
  const { accessToken } = useAuth();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [objetoSeleccionado, setObjetoSeleccionado] = useState<ObjetoInvestigable | null>(null);
  const [fuenteSeleccionada, setFuenteSeleccionada] = useState<string>('');
  const [habilidadSeleccionada, setHabilidadSeleccionada] = useState<number | null>(null);
  const [competenciaSeleccionada, setCompetenciaSeleccionada] = useState<number | null>(null);
  
  const [habilidadesDisponibles, setHabilidadesDisponibles] = useState<HabilidadesPorFuente | null>(null);
  const [competenciasPersonaje, setCompetenciasPersonaje] = useState<Competencia[]>([]);

  // Cargar habilidades disponibles
  useEffect(() => {
    const fetchHabilidades = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/crafting/habilidades_investigacion/`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          setHabilidadesDisponibles(data);
        }
      } catch (err) {
        console.error('Error cargando habilidades:', err);
      }
    };

    fetchHabilidades();
  }, [accessToken, apiUrl]);

  // Cargar competencias del personaje
  useEffect(() => {
    const fetchCompetencias = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/crafting/mis_competencias/?personaje_id=${personaje.id}`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCompetenciasPersonaje(data);
        }
      } catch (err) {
        console.error('Error cargando competencias:', err);
      }
    };

    fetchCompetencias();
  }, [accessToken, apiUrl, personaje.id]);

  const handleConfirmar = async () => {
    if (!objetoSeleccionado) {
      setError('Debes seleccionar un objeto para investigar');
      return;
    }

    if (!fuenteSeleccionada) {
      setError('Debes seleccionar una fuente de información');
      return;
    }

    if (fuenteSeleccionada === 'campo' && !competenciaSeleccionada) {
      setError('Debes seleccionar una herramienta para trabajo de campo');
      return;
    }

    if (fuenteSeleccionada !== 'campo' && !habilidadSeleccionada) {
      setError('Debes seleccionar una habilidad');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${apiUrl}/api/crafting/iniciar_investigacion/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          receta_id: receta.id,
          personaje_id: personaje.id,
          objeto_investigado_id: objetoSeleccionado.id,
          fuente_informacion: fuenteSeleccionada,
          habilidad_id: habilidadSeleccionada,
          competencia_herramienta_id: competenciaSeleccionada
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al iniciar la investigación');
        setLoading(false);
        return;
      }

      onSuccess();
    } catch (err) {
      setError('Error de conexión con el servidor');
      setLoading(false);
    }
  };

  const getRarezaColor = (rareza: string) => {
    const colores: Record<string, string> = {
      'Common': 'bg-gray-200 text-gray-800',
      'Uncommon': 'bg-green-200 text-green-800',
      'Rare': 'bg-blue-200 text-blue-800',
      'Very Rare': 'bg-purple-200 text-purple-800',
      'Legendary': 'bg-orange-200 text-orange-800',
    };
    return colores[rareza] || 'bg-gray-200 text-gray-800';
  };

  const getInfoInvestigacion = (rareza: string) => {
    const info: Record<string, { dc: number; exitos: number }> = {
      'Common': { dc: 10, exitos: 1 },
      'Uncommon': { dc: 15, exitos: 1 },
      'Rare': { dc: 20, exitos: 1 },
      'Very Rare': { dc: 25, exitos: 3 },
      'Legendary': { dc: 30, exitos: 3 },
    };
    return info[rareza] || { dc: 10, exitos: 1 };
  };

  const habilidadesActuales = fuenteSeleccionada && habilidadesDisponibles
    ? habilidadesDisponibles[fuenteSeleccionada as keyof HabilidadesPorFuente]
    : [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border-4 border-purple-600">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-6 flex justify-between items-center sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-title font-bold flex items-center gap-2">
              <FaSearch />
              Iniciar Investigación
            </h2>
            <p className="text-sm opacity-90 mt-1">
              {receta.nombre}
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
              <div className="flex items-center gap-2">
                <FaExclamationTriangle />
                <span className="font-semibold">{error}</span>
              </div>
            </div>
          )}

          {/* Paso 1: Seleccionar objeto investigable */}
          <div className="border-2 border-purple-300 rounded-lg p-4 bg-purple-50">
            <h3 className="font-bold text-lg text-purple-900 mb-3 flex items-center gap-2">
              <span className="bg-purple-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm">1</span>
              Selecciona el Objeto a Investigar
            </h3>
            
            <div className="grid grid-cols-1 gap-3">
              {receta.objetos_investigables.map((obj) => {
                const info = getInfoInvestigacion(obj.rareza);
                return (
                  <button
                    key={obj.id}
                    onClick={() => setObjetoSeleccionado(obj)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      objetoSeleccionado?.id === obj.id
                        ? 'border-purple-600 bg-purple-100'
                        : 'border-purple-200 bg-white hover:border-purple-400'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-stone-800">{obj.nombre}</h4>
                        <p className="text-xs text-stone-600">
                          {obj.es_objeto_final ? '📦 Objeto Final' : '🧪 Ingrediente'}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getRarezaColor(obj.rareza)}`}>
                        {obj.rareza}
                      </span>
                    </div>
                    <div className="flex gap-4 text-sm text-purple-800">
                      <span>🎯 DC: {info.dc}</span>
                      <span>✨ Éxitos: {info.exitos}</span>
                      <span>💰 25 gp/día</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Paso 2: Seleccionar fuente de información */}
          {objetoSeleccionado && (
            <div className="border-2 border-purple-300 rounded-lg p-4 bg-purple-50">
              <h3 className="font-bold text-lg text-purple-900 mb-3 flex items-center gap-2">
                <span className="bg-purple-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm">2</span>
                Elige tu Fuente de Información
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                {FUENTES_INFO.map((fuente) => {
                  const Icon = fuente.icon;
                  return (
                    <button
                      key={fuente.value}
                      onClick={() => {
                        setFuenteSeleccionada(fuente.value);
                        setHabilidadSeleccionada(null);
                        setCompetenciaSeleccionada(null);
                      }}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        fuenteSeleccionada === fuente.value
                          ? `border-${fuente.color}-600 bg-${fuente.color}-100`
                          : 'border-stone-300 bg-white hover:border-stone-400'
                      }`}
                    >
                      <Icon className={`text-3xl mx-auto mb-2 text-${fuente.color}-600`} />
                      <p className="font-semibold text-sm text-center text-stone-800">
                        {fuente.label}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Paso 3: Seleccionar habilidad o herramienta */}
          {fuenteSeleccionada && (
            <div className="border-2 border-purple-300 rounded-lg p-4 bg-purple-50">
              <h3 className="font-bold text-lg text-purple-900 mb-3 flex items-center gap-2">
                <span className="bg-purple-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm">3</span>
                {fuenteSeleccionada === 'campo' ? 'Selecciona tu Herramienta' : 'Selecciona tu Habilidad'}
              </h3>
              
              {fuenteSeleccionada === 'campo' ? (
                // Trabajo de campo: mostrar competencias
                <Select<SelectOption, false>
                  options={competenciasPersonaje.map(c => ({
                    value: c.id,
                    label: `${c.nombre_herramienta} (${c.grado}) - Mod: +${c.modificador}`
                  }))}
                  value={competenciaSeleccionada ? {
                    value: competenciaSeleccionada,
                    label: competenciasPersonaje.find(c => c.id === competenciaSeleccionada)?.nombre_herramienta || ''
                  } : null}
                  onChange={(option) => setCompetenciaSeleccionada(option ? option.value as number : null)}
                  placeholder="Selecciona una herramienta..."
                  styles={customSelectStyles}
                  isClearable
                />
              ) : (
                // Otras fuentes: mostrar habilidades
                <div className="space-y-2">
                  {habilidadesActuales.map((hab) => (
                    <button
                      key={hab.nombre}
                      onClick={() => setHabilidadSeleccionada(hab.id)}
                      disabled={!hab.id}
                      className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                        habilidadSeleccionada === hab.id
                          ? 'border-purple-600 bg-purple-100'
                          : hab.id 
                            ? 'border-stone-300 bg-white hover:border-stone-400'
                            : 'border-stone-200 bg-stone-100 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-semibold text-stone-800">{hab.nombre}</span>
                          <span className="text-xs text-stone-600 ml-2">
                            ({hab.estadistica.charAt(0).toUpperCase() + hab.estadistica.slice(1)})
                          </span>
                        </div>
                        {!hab.id && (
                          <span className="text-xs text-red-600 italic">
                            No disponible en BD
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                  <p className="text-xs text-stone-600 mt-2 italic">
                    💡 Puedes usar cualquier habilidad. Si no eres proficiente, no sumas bonus de proficiencia.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Información importante */}
          <div className="bg-blue-50 border border-blue-300 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">📋 Información importante:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Cada día de investigación consume <strong>1 día de tiempo libre</strong> y <strong>25 gp</strong></li>
              <li>• Si fallas una tirada, pierdes el tiempo y oro pero el progreso se mantiene</li>
              <li>• Al completar los éxitos necesarios, desbloquearás la receta permanentemente</li>
              <li>• El objeto investigado <strong>NO se consume</strong>, puedes usarlo para otras recetas</li>
            </ul>
          </div>

          {/* Recursos actuales */}
          <div className="flex gap-4 justify-center bg-stone-100 p-4 rounded-lg">
            <div className="text-center">
              <FaCoins className="text-2xl text-yellow-600 mx-auto mb-1" />
              <p className="text-sm text-stone-600">Oro disponible</p>
              <p className="text-xl font-bold text-stone-800">{personaje.oro} gp</p>
            </div>
            <div className="text-center">
              <FaClock className="text-2xl text-blue-600 mx-auto mb-1" />
              <p className="text-sm text-stone-600">Tiempo libre</p>
              <p className="text-xl font-bold text-stone-800">{personaje.tiempo_libre} días</p>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-stone-300 hover:bg-stone-400 text-stone-800 font-bold py-3 px-6 rounded-lg transition-all disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmar}
              disabled={loading || !objetoSeleccionado || !fuenteSeleccionada || 
                (fuenteSeleccionada === 'campo' ? !competenciaSeleccionada : !habilidadSeleccionada)}
              className="flex-1 bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white font-bold py-3 px-6 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Iniciando...
                </>
              ) : (
                <>
                  <FaSearch />
                  Confirmar e Iniciar
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}