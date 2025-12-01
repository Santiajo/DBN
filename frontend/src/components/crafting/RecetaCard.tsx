// components/crafting/RecetaCard.tsx 

'use client';

import { FaHammer, FaCoins, FaTools, FaMagic, FaStar, FaLock, FaSearch } from 'react-icons/fa';
import { Receta } from '@/types/receta'; 

interface Props {
  receta: Receta;
  onClick: (receta: Receta) => void;
  disponible: boolean;
  tipo: 'disponible' | 'bloqueada' | 'investigable';
}

const getGradoColor = (grado: string) => {
  const colores: Record<string, string> = {
    'Novato': 'bg-[#e8e0d0] text-[#5a4a3a]',
    'Aprendiz': 'bg-[#d4e6d4] text-[#3a5a3a]',
    'Experto': 'bg-[#d4e0f0] text-[#3a4a6a]',
    'Maestro Artesano': 'bg-[#e4d4f0] text-[#5a3a6a]',
    'Gran Maestro': 'bg-[#f0e4c4] text-[#6a5a2a]',
  };
  return colores[grado] || 'bg-[#e8e0d0] text-[#5a4a3a]';
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

export default function RecetaCard({ receta, onClick, disponible, tipo }: Props) {
  
  // Estilos segun el tipo de card
  const getCardStyles = () => {
    if (tipo === 'investigable') {
      return {
        container: 'bg-gradient-to-br from-[#f0e8f8] to-[#e8e0f0] border-[#8a6a9a] hover:shadow-[0_6px_20px_rgba(100,60,120,0.25)] hover:border-[#6a4a7a]',
        headerBg: 'bg-[#725283]',
        headerText: 'text-[#f5ede1]',
        accentColor: '#8a6a9a',
        buttonBg: 'bg-gradient-to-r from-[#8a6a9a] to-[#6a4a7a] hover:from-[#7a5a8a] hover:to-[#5a3a6a]',
      };
    }
    if (tipo === 'disponible') {
      if (receta.es_magico) {
        return {
          container: 'bg-gradient-to-br from-[#f8f0e8] to-[#f0e8d8] border-[#9a7a5a] hover:shadow-[0_6px_20px_rgba(120,90,50,0.25)] hover:border-[#7a5a3a]',
          headerBg: 'bg-[#816147]',
          headerText: 'text-[#f5ede1]',
          accentColor: '#c9a65a',
          buttonBg: 'bg-gradient-to-r from-[#9a7a5a] to-[#7a5a3a] hover:from-[#8a6a4a] hover:to-[#6a4a2a]',
        };
      }
      return {
        container: 'bg-[#f5ede1] border-[#3a2a1a] hover:shadow-[0_6px_20px_rgba(58,42,26,0.2)] hover:border-[#2a1a0a]',
        headerBg: 'bg-[#5a7a5a]',
        headerText: 'text-[#f5ede1]',
        accentColor: '#5a7a5a',
        buttonBg: 'bg-gradient-to-r from-[#5a7a5a] to-[#4a6a4a] hover:from-[#4a6a4a] hover:to-[#3a5a3a]',
      };
    }
    // bloqueada
    return {
      container: 'bg-[#e8e0d0] border-[#a0988a] opacity-80',
      headerBg: 'bg-[#8a8078]',
      headerText: 'text-[#e8e0d0]',
      accentColor: '#8a8078',
      buttonBg: 'bg-[#a0988a]',
    };
  };

  const styles = getCardStyles();
  const isClickable = tipo !== 'bloqueada';

  return (
    <div
      onClick={() => isClickable && onClick(receta)}
      className={`
        rounded-xl border-2 overflow-hidden transition-all duration-300
        shadow-[0_4px_12px_rgba(0,0,0,0.12)]
        flex flex-col
        ${styles.container}
        ${isClickable ? 'cursor-pointer hover:scale-[1.02]' : 'cursor-not-allowed'}
      `}
    >
      {/* Header con nombre */}
      <div className={`${styles.headerBg} px-4 py-3`}>
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <h3 className={`font-serif text-lg font-semibold ${styles.headerText} truncate`}>
              {receta.nombre || `Receta #${receta.id}`}
            </h3>
            <p className={`text-sm ${styles.headerText} opacity-90 truncate`}>
              Produce: {receta.cantidad_final}x {receta.nombre_objeto_final}
            </p>
          </div>
          
          {/* Badge de tipo */}
          <div className="flex flex-col gap-1 items-end flex-shrink-0">
            {tipo === 'investigable' ? (
              <span className="px-2 py-1 rounded text-xs font-bold bg-[#f5ede1] text-[#6a4a7a] flex items-center gap-1">
                <FaSearch className="w-3 h-3" /> Investigable
              </span>
            ) : receta.es_magico ? (
              <span className="px-2 py-1 rounded text-xs font-bold bg-[#f5ede1] text-[#8a6a4a] flex items-center gap-1">
                <FaMagic className="w-3 h-3" /> Magico
              </span>
            ) : (
              <span className="px-2 py-1 rounded text-xs font-bold bg-[#f5ede1] text-[#5a7a5a] flex items-center gap-1">
                <FaHammer className="w-3 h-3" /> Mundano
              </span>
            )}
            
            {tipo === 'bloqueada' && (
              <span className="px-2 py-1 rounded text-xs font-bold bg-[#c45a5a] text-[#f5ede1] flex items-center gap-1 mt-1">
                <FaLock className="w-3 h-3" /> Bloqueada
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-4 space-y-3">
        
        {/* Info segun tipo */}
        {receta.es_magico && tipo !== 'investigable' && (
          <div className="flex flex-wrap gap-2">
            {receta.rareza && (
              <span className={`px-2 py-1 rounded text-xs font-semibold ${getRarezaColor(receta.rareza)}`}>
                <FaStar className="inline w-3 h-3 mr-1" />
                {receta.rareza}
              </span>
            )}
            {receta.exitos_requeridos && (
              <span className="px-2 py-1 rounded text-xs font-semibold bg-[#f0e6d3] text-[#6a5a4a]">
                {receta.exitos_requeridos} exitos necesarios
              </span>
            )}
          </div>
        )}

        {/* Detalles */}
        <div className="space-y-2 text-sm">
          {!receta.es_magico && (
            <div className="flex items-center gap-2 text-[#5a4a3a]">
              <FaCoins className="w-4 h-4 text-[#c9a65a]" />
              <span>Valor: <strong>{receta.oro_necesario} gp</strong></span>
            </div>
          )}

          {receta.herramienta && (
            <div className="flex items-center gap-2 text-[#5a4a3a]">
              <FaTools className="w-4 h-4" style={{ color: styles.accentColor }} />
              <span>{receta.herramienta}</span>
              {receta.competencia_personaje && (
                <span className={`ml-1 px-2 py-0.5 rounded text-xs font-semibold ${getGradoColor(receta.competencia_personaje.grado)}`}>
                  {receta.competencia_personaje.grado}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Ingredientes */}
        <div className="bg-[#f8f4eb] border border-[#d4c4a0] rounded-lg p-3">
          <p className="text-xs font-bold text-[#6a5a4a] mb-2 flex items-center gap-1">
            <span style={{ color: styles.accentColor }}>&#9670;</span> Ingredientes:
          </p>
          <ul className="space-y-1.5">
            {receta.ingredientes && receta.ingredientes.length > 0 ? (
              receta.ingredientes.map((ing, idx) => (
                <li key={ing.objeto_id || idx} className="flex items-center gap-2">
                  <span 
                    className="text-white text-xs font-bold px-1.5 py-0.5 rounded min-w-[24px] text-center"
                    style={{ backgroundColor: styles.accentColor }}
                  >
                    {ing.cantidad_necesaria}x
                  </span>
                  <span className="text-sm text-[#4a3f35]">
                    {ing.nombre}
                  </span>
                </li>
              ))
            ) : (
              <li className="text-xs text-[#a08070] italic">Sin ingredientes definidos</li>
            )}
          </ul>
        </div>

        {/* Objetos investigables (solo para tipo investigable) */}
        {tipo === 'investigable' && receta.objetos_investigables && receta.objetos_investigables.length > 0 && (
          <div className="bg-[#f0e8f8] border border-[#c4b0d4] rounded-lg p-3">
            <p className="text-xs font-bold text-[#6a4a7a] mb-2 flex items-center gap-1">
              <FaSearch className="w-3 h-3" /> Objetos para investigar:
            </p>
            <ul className="space-y-1.5">
              {receta.objetos_investigables.map((obj, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm text-[#5a4a6a]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8a6a9a]"></span>
                  <span>
                    {obj.nombre}
                    <span className="text-[#8a6a9a] font-semibold ml-1">({obj.rareza})</span>
                    {obj.es_objeto_final && (
                      <span className="text-[#a080b0] italic ml-1 text-xs">(Objeto Final)</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Ingredientes Faltantes (solo para bloqueadas) */}
        {tipo === 'bloqueada' && receta.ingredientes_faltantes && receta.ingredientes_faltantes.length > 0 && (
          <div className="bg-[#fdf0f0] border border-[#e0b0b0] rounded-lg p-3">
            <p className="text-xs font-bold text-[#8a4a4a] mb-2">Te faltan:</p>
            <ul className="space-y-1">
              {receta.ingredientes_faltantes.map((falt, idx) => (
                <li key={idx} className="text-xs text-[#7a4040]">
                  <span className="text-[#a05050]">&#8226;</span> {falt.faltante}x {falt.objeto} 
                  <span className="text-[#a07070] ml-1">(tienes {falt.actual})</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Boton de accion */}
      <div className="px-4 pb-4 mt-auto">
        {tipo === 'investigable' && (
          <button className={`w-full ${styles.buttonBg} text-[#f5ede1] py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2`}>
            <FaSearch className="w-4 h-4" />
            Investigar Receta
          </button>
        )}
        
        {tipo === 'disponible' && (
          <button className={`w-full ${styles.buttonBg} text-[#f5ede1] py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2`}>
            <FaHammer className="w-4 h-4" />
            Craftear
          </button>
        )}
        
        {tipo === 'bloqueada' && (
          <div className={`w-full ${styles.buttonBg} text-[#e8e0d0] py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2`}>
            <FaLock className="w-4 h-4" />
            {receta.requiere_investigacion && !receta.esta_desbloqueada 
              ? 'Requiere investigacion'
              : 'No disponible'
            }
          </div>
        )}
      </div>
    </div>
  );
}