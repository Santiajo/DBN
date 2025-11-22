// components/crafting/RecetaCard.tsx 

'use client';

import { FaHammer, FaCoins, FaTools, FaMagic, FaStar, FaLock, FaSearch } from 'react-icons/fa';
import { Receta } from '@/types/receta';

interface Props {
  receta: Receta;
  onClick: (receta: Receta) => void;
  disponible: boolean;
  tipo: 'disponible' | 'bloqueada' | 'investigable'; // ✅ NUEVO: tipo de receta
}

const getGradoColor = (grado: string) => {
  const colores: Record<string, string> = {
    'Novato': 'bg-gray-200 text-gray-700',
    'Aprendiz': 'bg-green-200 text-green-800',
    'Experto': 'bg-blue-200 text-blue-800',
    'Maestro Artesano': 'bg-purple-200 text-purple-800',
    'Gran Maestro': 'bg-yellow-200 text-yellow-800',
  };
  return colores[grado] || 'bg-gray-200 text-gray-700';
};

const getRarezaColor = (rareza: string) => {
  const colores: Record<string, string> = {
    'Common': 'bg-gray-300 text-gray-800',
    'Uncommon': 'bg-green-300 text-green-900',
    'Rare': 'bg-blue-300 text-blue-900',
    'Very Rare': 'bg-purple-300 text-purple-900',
    'Legendary': 'bg-orange-300 text-orange-900',
  };
  return colores[rareza] || 'bg-gray-300 text-gray-800';
};

export default function RecetaCard({ receta, onClick, disponible, tipo }: Props) {
  // Determinar estilos según el tipo
  const getCardStyles = () => {
    if (tipo === 'investigable') {
      return 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-400 hover:shadow-xl hover:scale-105 cursor-pointer';
    }
    if (tipo === 'disponible') {
      return 'bg-white border-bosque hover:shadow-xl hover:scale-105 cursor-pointer';
    }
    // bloqueada
    return 'bg-stone-100 border-stone-300 cursor-not-allowed opacity-75';
  };

  return (
    <div
      onClick={() => (tipo !== 'bloqueada') && onClick(receta)}
      className={`
        rounded-lg shadow-md p-5 border-2 transition-all
        ${getCardStyles()}
      `}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className={`text-lg font-bold ${tipo === 'bloqueada' ? 'text-stone-500' : 'text-stone-800'}`}>
            {receta.nombre || `Receta #${receta.id}`}
          </h3>
          <p className={`text-sm ${tipo === 'bloqueada' ? 'text-stone-400' : 'text-stone-600'}`}>
            → {receta.nombre_objeto_final}
            {receta.cantidad_final > 1 && ` (x${receta.cantidad_final})`}
          </p>
        </div>
        
        <div className="flex flex-col gap-1 items-end">
          {/* Badge de tipo */}
          {tipo === 'investigable' ? (
            <span className="px-2 py-1 rounded-full text-xs font-bold bg-purple-500 text-white flex items-center gap-1 animate-pulse">
              <FaSearch /> Investigable
            </span>
          ) : receta.es_magico ? (
            <>
              <span className="px-2 py-1 rounded-full text-xs font-bold bg-purple-200 text-purple-800 flex items-center gap-1">
                <FaMagic /> Mágico
              </span>
              {receta.rareza && (
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${getRarezaColor(receta.rareza)}`}>
                  {receta.rareza}
                </span>
              )}
            </>
          ) : (
            <span className="px-2 py-1 rounded-full text-xs font-bold bg-stone-200 text-stone-700 flex items-center gap-1">
              <FaHammer /> Mundano
            </span>
          )}
          
          {/* Badge de bloqueado */}
          {tipo === 'bloqueada' && (
            <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-200 text-red-800 flex items-center gap-1 mt-1">
              <FaLock /> Bloqueada
            </span>
          )}
        </div>
      </div>

      {/* Info Principal */}
      <div className="space-y-2 mb-3">
        {receta.es_magico ? (
          <div className="bg-purple-50 p-2 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 text-sm text-purple-800">
              <FaStar className="text-purple-600" />
              <span className="font-semibold">{receta.exitos_requeridos} éxitos necesarios</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm">
            <FaCoins className="text-yellow-600" />
            <span className={tipo === 'bloqueada' ? 'text-stone-500' : 'text-stone-700'}>
              Valor: <strong>{receta.oro_necesario} gp</strong>
            </span>
          </div>
        )}

        {receta.herramienta && (
          <div className="flex items-center gap-2 text-sm">
            <FaTools className={tipo === 'bloqueada' ? 'text-stone-400' : 'text-stone-600'} />
            <span className={tipo === 'bloqueada' ? 'text-stone-500' : 'text-stone-700'}>
              {receta.herramienta}
            </span>
            {receta.competencia_personaje && (
              <span className={`ml-1 px-2 py-0.5 rounded text-xs font-semibold ${getGradoColor(receta.competencia_personaje.grado)}`}>
                {receta.competencia_personaje.grado}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Ingredientes */}
      <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 mb-3">
        <p className="text-xs font-bold text-amber-900 mb-2">Ingredientes:</p>
        <ul className="space-y-1">
          {receta.ingredientes.map((ing, idx) => (
            <li key={idx} className="text-xs text-amber-800 flex items-start gap-2">
              <span className="mt-1.5 w-1.5 h-1.5 bg-amber-600 rounded-full flex-shrink-0"></span>
              <span>
                {ing.cantidad}x {ing.nombre_ingrediente}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* ✅ NUEVO: Objetos investigables (para recetas bloqueadas por investigación) */}
      {tipo === 'investigable' && receta.objetos_investigables && receta.objetos_investigables.length > 0 && (
        <div className="bg-purple-100 p-3 rounded-lg border-2 border-purple-300 mb-3">
          <p className="text-xs font-bold text-purple-900 mb-2 flex items-center gap-1">
            <FaSearch /> Objetos para investigar:
          </p>
          <ul className="space-y-1">
            {receta.objetos_investigables.map((obj, idx) => (
              <li key={idx} className="text-xs text-purple-800 flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 bg-purple-600 rounded-full flex-shrink-0"></span>
                <span>
                  {obj.nombre} 
                  <span className="text-purple-600 font-semibold ml-1">
                    ({obj.rareza})
                  </span>
                  {obj.es_objeto_final && (
                    <span className="text-purple-500 italic ml-1">(Objeto Final)</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Ingredientes Faltantes */}
      {tipo === 'bloqueada' && receta.ingredientes_faltantes && receta.ingredientes_faltantes.length > 0 && (
        <div className="bg-red-50 p-3 rounded-lg border border-red-200 mb-3">
          <p className="text-xs font-bold text-red-800 mb-2">Te faltan:</p>
          <ul className="space-y-1">
            {receta.ingredientes_faltantes.map((falt, idx) => (
              <li key={idx} className="text-xs text-red-700">
                • {falt.faltante}x {falt.objeto} <span className="text-red-500">(tienes {falt.actual})</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Botón/Estado */}
      <div className="mt-4">
        {tipo === 'investigable' && (
          <div className="bg-gradient-to-r from-purple-500 to-purple-700 text-white text-center py-2 rounded-lg font-bold text-sm hover:from-purple-600 hover:to-purple-800 transition-all">
            <FaSearch className="inline mr-2" />
            Investigar Receta
          </div>
        )}
        
        {tipo === 'disponible' && (
          <div className="bg-gradient-to-r from-bosque to-green-700 text-white text-center py-2 rounded-lg font-bold text-sm hover:from-green-800 hover:to-green-900 transition-all">
            <FaHammer className="inline mr-2" />
            Craftear
          </div>
        )}
        
        {tipo === 'bloqueada' && (
          <div className="bg-stone-300 text-stone-600 text-center py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-2">
            <FaLock />
            {receta.requiere_investigacion && !receta.esta_desbloqueada 
              ? 'Requiere investigación'
              : 'No disponible'
            }
          </div>
        )}
      </div>
    </div>
  );
}