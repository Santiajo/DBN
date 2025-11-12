'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FaTimes, FaHammer, FaCoins, FaClock, FaTools, FaMagic, FaExclamationTriangle } from 'react-icons/fa';

interface Receta {
  id: number;
  nombre: string;
  nombre_objeto_final: string;
  cantidad_final: number;
  es_magico: boolean;
  oro_necesario: number;
  herramienta: string;
  ingredientes: any[];
  rareza: string | null;
  dc: number;
  exitos_requeridos: number;
  competencia_personaje: any;
}

interface Personaje {
  id: number;
  nombre_personaje: string;
  oro: number;
  tiempo_libre: number;
}

interface Props {
  receta: Receta;
  personaje: Personaje;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalIniciarCrafting({ receta, personaje, onClose, onSuccess }: Props) {
  const { accessToken } = useAuth();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfirmar = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${apiUrl}/api/crafting/iniciar_crafting/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          receta_id: receta.id,
          personaje_id: personaje.id
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al iniciar el crafting');
        setLoading(false);
        return;
      }

      // Éxito
      onSuccess();
    } catch (err) {
      setError('Error de conexión con el servidor');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-4 border-bosque">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-bosque to-green-700 text-white p-6 flex justify-between items-center sticky top-0">
          <div>
            <h2 className="text-2xl font-title font-bold flex items-center gap-2">
              <FaHammer />
              Iniciar Crafteo
            </h2>
            <p className="text-sm opacity-90 mt-1">
              {receta.nombre || `Receta #${receta.id}`}
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

          {/* Info del Objeto */}
          <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4">
            <h3 className="font-bold text-lg text-stone-800 mb-2">Vas a crear:</h3>
            <p className="text-2xl font-title font-bold text-bosque mb-1">
              {receta.nombre_objeto_final}
              {receta.cantidad_final > 1 && <span className="text-lg"> (x{receta.cantidad_final})</span>}
            </p>
            {receta.es_magico && receta.rareza && (
              <div className="flex items-center gap-2 mt-2">
                <FaMagic className="text-purple-600" />
                <span className="text-sm font-semibold text-purple-800">
                  Objeto Mágico - {receta.rareza}
                </span>
              </div>
            )}
          </div>

          {/* Requisitos */}
          <div className="border-2 border-stone-300 rounded-lg p-4">
            <h4 className="font-bold text-stone-800 mb-3 flex items-center gap-2">
              <FaTools className="text-bosque" />
              Requisitos
            </h4>
            
            <div className="space-y-3">
              {/* Herramienta */}
              {receta.herramienta && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-stone-600">Herramienta:</span>
                  <span className="font-semibold text-stone-800">
                    {receta.herramienta}
                    {receta.competencia_personaje && (
                      <span className="ml-2 text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
                        {receta.competencia_personaje.grado}
                      </span>
                    )}
                  </span>
                </div>
              )}

              {/* DC y Éxitos (para mágicos) */}
              {receta.es_magico ? (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-stone-600">Éxitos necesarios:</span>
                    <span className="font-bold text-purple-800">{receta.exitos_requeridos}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-stone-600">Dificultad (DC):</span>
                    <span className="font-bold text-purple-800">{receta.dc}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-stone-600">Valor total del objeto:</span>
                  <div className="flex items-center gap-2">
                    <FaCoins className="text-yellow-600" />
                    <span className="font-bold text-stone-800">{receta.oro_necesario} gp</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Ingredientes que se consumirán */}
          <div className="border-2 border-red-300 bg-red-50 rounded-lg p-4">
            <h4 className="font-bold text-red-800 mb-3 flex items-center gap-2">
              <FaExclamationTriangle />
              Se consumirán estos ingredientes:
            </h4>
            <ul className="space-y-2">
              {receta.ingredientes.map((ing, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm text-red-900">
                  <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                  <span className="font-semibold">{ing.cantidad_necesaria}x</span>
                  <span>{ing.nombre}</span>
                  {ing.es_material_raro && (
                    <span className="text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded">
                      Material Raro
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <p className="text-xs text-red-700 mt-3 italic">
              ⚠️ Los ingredientes serán eliminados de tu inventario al confirmar
            </p>
          </div>

          {/* Info adicional */}
          <div className="bg-blue-50 border border-blue-300 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Información importante:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Cada día de trabajo consume <strong>1 día de tiempo libre</strong></li>
              <li>• Cada día también tiene un <strong>coste en oro</strong> según tu grado</li>
              {receta.es_magico ? (
                <li>• Debes conseguir <strong>{receta.exitos_requeridos} tiradas exitosas</strong> para completar</li>
              ) : (
                <li>• La <strong>DC de las tiradas es 12</strong> para objetos mundanos</li>
              )}
              <li>• Si fallas una tirada, pierdes el tiempo y oro de ese día pero el progreso se mantiene</li>
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
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-bosque to-green-700 hover:from-green-800 hover:to-green-900 text-white font-bold py-3 px-6 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Iniciando...
                </>
              ) : (
                <>
                  <FaHammer />
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