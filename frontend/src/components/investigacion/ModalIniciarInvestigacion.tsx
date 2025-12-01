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
    backgroundColor: '#faf6ed',
    borderColor: '#c4b998',
    borderWidth: '1px',
    borderRadius: '8px',
    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.08)',
    padding: '2px 4px',
    minHeight: '42px',
    '&:hover': { borderColor: '#a89968' },
  }),
  option: (base: CSSObjectWithLabel, state) => ({
    ...base,
    backgroundColor: state.isFocused ? '#f0e6d3' : '#faf6ed',
    color: '#4a3f35',
    cursor: 'pointer',
    padding: '10px 12px',
  }),
  singleValue: (base: CSSObjectWithLabel) => ({
    ...base,
    color: '#4a3f35',
  }),
  menu: (base: CSSObjectWithLabel) => ({
    ...base,
    backgroundColor: '#faf6ed',
    border: '1px solid #c4b998',
    borderRadius: '8px',
  }),
  placeholder: (base: CSSObjectWithLabel) => ({
    ...base,
    color: '#9a8a6a',
  }),
};

const FUENTES_INFO = [
  { value: 'libros', label: 'Libros y Archivos', icon: FaBook, color: '#6a8a9a' },
  { value: 'entrevistas', label: 'Entrevistas y Rumores', icon: FaComments, color: '#8a6a9a' },
  { value: 'experimentos', label: 'Experimentos y Analisis', icon: FaFlask, color: '#5a7a5a' },
  { value: 'campo', label: 'Trabajo de Campo', icon: FaHammer, color: '#9a7a5a' },
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
      setError('Debes seleccionar una fuente de informacion');
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
        setError(data.error || 'Error al iniciar la investigacion');
        setLoading(false);
        return;
      }

      onSuccess();
    } catch (err) {
      setError('Error de conexion con el servidor');
      setLoading(false);
    }
  };

  const getRarezaColor = (rareza: string) => {
    const colores: Record<string, string> = {
      'Common': 'bg-[#d8d0c0] text-[#5a5040]',
      'Uncommon': 'bg-[#c4d8c4] text-[#2a4a2a]',
      'Rare': 'bg-[#c4d4e8] text-[#2a3a5a]',
      'Very Rare': 'bg-[#d8c4e8] text-[#4a2a5a]',
      'Legendary': 'bg-[#e8d4a4] text-[#5a4a1a]',
    };
    return colores[rareza] || 'bg-[#d8d0c0] text-[#5a5040]';
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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-[#f5ede1] rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border-2 border-[#3a2a1a]">
        
        {/* Header */}
        <div className="bg-[#8a6a9a] text-[#f5ede1] p-6 flex justify-between items-center sticky top-0 z-10 border-b-2 border-[#6a4a7a]">
          <div>
            <h2 className="text-2xl font-serif flex items-center gap-2">
              <FaSearch />
              Iniciar Investigacion
            </h2>
            <p className="text-sm opacity-90 mt-1">
              {receta.nombre}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#f5ede1] hover:bg-[#6a4a7a] p-2 rounded-lg transition-all"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Error */}
          {error && (
            <div className="bg-[#fdf0f0] border-l-4 border-[#c45a5a] text-[#7a3030] p-4 rounded-r-lg">
              <div className="flex items-center gap-2">
                <FaExclamationTriangle />
                <span className="font-semibold">{error}</span>
              </div>
            </div>
          )}

          {/* Paso 1: Seleccionar objeto investigable */}
          <div className="border-2 border-[#c4b0d4] rounded-xl p-4 bg-[#f8f4fb]">
            <h3 className="font-semibold text-lg text-[#6a4a7a] mb-3 flex items-center gap-2">
              <span className="bg-[#8a6a9a] text-[#f5ede1] w-7 h-7 rounded-full flex items-center justify-center text-sm">1</span>
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
                        ? 'border-[#8a6a9a] bg-[#f0e8f8]'
                        : 'border-[#d4c4e0] bg-[#faf6ed] hover:border-[#a090b0]'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-[#4a3f35]">{obj.nombre}</h4>
                        <p className="text-xs text-[#6a5a4a]">
                          {obj.es_objeto_final ? 'Objeto Final' : 'Ingrediente'}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded text-xs font-bold ${getRarezaColor(obj.rareza)}`}>
                        {obj.rareza}
                      </span>
                    </div>
                    <div className="flex gap-4 text-sm text-[#6a4a7a]">
                      <span>DC: {info.dc}</span>
                      <span>Exitos: {info.exitos}</span>
                      <span>25 gp/dia</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Paso 2: Seleccionar fuente de informacion */}
          {objetoSeleccionado && (
            <div className="border-2 border-[#c4b0d4] rounded-xl p-4 bg-[#f8f4fb]">
              <h3 className="font-semibold text-lg text-[#6a4a7a] mb-3 flex items-center gap-2">
                <span className="bg-[#8a6a9a] text-[#f5ede1] w-7 h-7 rounded-full flex items-center justify-center text-sm">2</span>
                Elige tu Fuente de Informacion
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                {FUENTES_INFO.map((fuente) => {
                  const Icon = fuente.icon;
                  const isSelected = fuenteSeleccionada === fuente.value;
                  return (
                    <button
                      key={fuente.value}
                      onClick={() => {
                        setFuenteSeleccionada(fuente.value);
                        setHabilidadSeleccionada(null);
                        setCompetenciaSeleccionada(null);
                      }}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-[#8a6a9a] bg-[#f0e8f8]'
                          : 'border-[#d4c4a0] bg-[#faf6ed] hover:border-[#a89968]'
                      }`}
                    >
                      <Icon 
                        className="text-3xl mx-auto mb-2" 
                        style={{ color: fuente.color }}
                      />
                      <p className="font-medium text-sm text-center text-[#4a3f35]">
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
            <div className="border-2 border-[#c4b0d4] rounded-xl p-4 bg-[#f8f4fb]">
              <h3 className="font-semibold text-lg text-[#6a4a7a] mb-3 flex items-center gap-2">
                <span className="bg-[#8a6a9a] text-[#f5ede1] w-7 h-7 rounded-full flex items-center justify-center text-sm">3</span>
                {fuenteSeleccionada === 'campo' ? 'Selecciona tu Herramienta' : 'Selecciona tu Habilidad'}
              </h3>
              
              {fuenteSeleccionada === 'campo' ? (
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
                <div className="space-y-2">
                  {habilidadesActuales.map((hab) => (
                    <button
                      key={hab.nombre}
                      onClick={() => setHabilidadSeleccionada(hab.id)}
                      disabled={!hab.id}
                      className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                        habilidadSeleccionada === hab.id
                          ? 'border-[#8a6a9a] bg-[#f0e8f8]'
                          : hab.id 
                            ? 'border-[#d4c4a0] bg-[#faf6ed] hover:border-[#a89968]'
                            : 'border-[#e0d8d0] bg-[#e8e0d0] opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-medium text-[#4a3f35]">{hab.nombre}</span>
                          <span className="text-xs text-[#6a5a4a] ml-2">
                            ({hab.estadistica.charAt(0).toUpperCase() + hab.estadistica.slice(1)})
                          </span>
                        </div>
                        {!hab.id && (
                          <span className="text-xs text-[#a05050] italic">
                            No disponible en BD
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                  <p className="text-xs text-[#6a5a4a] mt-2 italic">
                    Puedes usar cualquier habilidad. Si no eres proficiente, no sumas bonus de proficiencia.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Informacion importante */}
          <div className="bg-[#e8f0f4] border border-[#a0c0d0] rounded-lg p-4">
            <h4 className="font-semibold text-[#4a6a7a] mb-2">Informacion importante:</h4>
            <ul className="text-sm text-[#4a6a7a] space-y-1">
              <li>Cada dia de investigacion consume <strong>1 dia de tiempo libre</strong> y <strong>25 gp</strong></li>
              <li>Si fallas una tirada, pierdes el tiempo y oro pero el progreso se mantiene</li>
              <li>Al completar los exitos necesarios, desbloquearas la receta permanentemente</li>
              <li>El objeto investigado <strong>NO se consume</strong>, puedes usarlo para otras recetas</li>
            </ul>
          </div>

          {/* Recursos actuales */}
          <div className="flex gap-4 justify-center bg-[#f8f4eb] border border-[#d4c4a0] p-4 rounded-lg">
            <div className="text-center">
              <FaCoins className="text-2xl text-[#c9a65a] mx-auto mb-1" />
              <p className="text-sm text-[#6a5a4a]">Oro disponible</p>
              <p className="text-xl font-bold text-[#4a3f35]">{personaje.oro} gp</p>
            </div>
            <div className="text-center">
              <FaClock className="text-2xl text-[#6a8a9a] mx-auto mb-1" />
              <p className="text-sm text-[#6a5a4a]">Tiempo libre</p>
              <p className="text-xl font-bold text-[#4a3f35]">{personaje.tiempo_libre} dias</p>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4 border-t border-[#c4b998]">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-[#e8e0d0] hover:bg-[#d8d0c0] text-[#5a4a3a] font-semibold py-3 px-6 rounded-lg transition-all disabled:opacity-50 border border-[#c4b998]"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmar}
              disabled={loading || !objetoSeleccionado || !fuenteSeleccionada || 
                (fuenteSeleccionada === 'campo' ? !competenciaSeleccionada : !habilidadSeleccionada)}
              className="flex-1 bg-gradient-to-r from-[#8a6a9a] to-[#6a4a7a] hover:from-[#7a5a8a] hover:to-[#5a3a6a] text-[#f5ede1] font-semibold py-3 px-6 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#f5ede1]"></div>
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