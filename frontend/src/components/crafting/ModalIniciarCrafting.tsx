'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FaTimes, FaHammer, FaCoins, FaClock, FaTools, FaMagic, FaExclamationTriangle } from 'react-icons/fa';
import { Receta, Personaje } from '@/types/receta';

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

      onSuccess();
    } catch (err) {
      setError('Error de conexion con el servidor');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-[#f5ede1] rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-[#3a2a1a]">
        
        {/* Header */}
        <div className="bg-[#5a7a5a] text-[#f5ede1] p-6 flex justify-between items-center sticky top-0 border-b-2 border-[#3a5a3a]">
          <div>
            <h2 className="text-2xl font-serif flex items-center gap-2">
              <FaHammer />
              Iniciar Crafteo
            </h2>
            <p className="text-sm opacity-90 mt-1">
              {receta.nombre || `Receta #${receta.id}`}
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
              <div className="flex items-center gap-2">
                <FaExclamationTriangle />
                <span className="font-semibold">{error}</span>
              </div>
            </div>
          )}

          {/* Info del Objeto */}
          <div className="bg-[#f8f4eb] border-2 border-[#c9a65a] rounded-xl p-4">
            <h3 className="font-semibold text-lg text-[#4a3f35] mb-2">Vas a crear:</h3>
            <p className="text-2xl font-serif text-[#5a7a5a] mb-1">
              {receta.nombre_objeto_final}
              {receta.cantidad_final > 1 && <span className="text-lg"> (x{receta.cantidad_final})</span>}
            </p>
            {receta.es_magico && receta.rareza && (
              <div className="flex items-center gap-2 mt-2">
                <FaMagic className="text-[#8a6a9a]" />
                <span className="text-sm font-semibold text-[#6a4a7a]">
                  Objeto Magico - {receta.rareza}
                </span>
              </div>
            )}
          </div>

          {/* Requisitos */}
          <div className="border-2 border-[#c4b998] rounded-xl p-4 bg-[#faf6ed]">
            <h4 className="font-semibold text-[#4a3f35] mb-3 flex items-center gap-2">
              <FaTools className="text-[#5a7a5a]" />
              Requisitos
            </h4>
            
            <div className="space-y-3">
              {receta.herramienta && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#6a5a4a]">Herramienta:</span>
                  <span className="font-semibold text-[#4a3f35]">
                    {receta.herramienta}
                    {receta.competencia_personaje && (
                      <span className="ml-2 text-xs bg-[#d4e6d4] text-[#3a5a3a] px-2 py-1 rounded">
                        {receta.competencia_personaje.grado}
                      </span>
                    )}
                  </span>
                </div>
              )}

              {receta.es_magico ? (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#6a5a4a]">Exitos necesarios:</span>
                    <span className="font-bold text-[#6a4a7a]">{receta.exitos_requeridos}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#6a5a4a]">Dificultad (DC):</span>
                    <span className="font-bold text-[#6a4a7a]">{receta.dc}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#6a5a4a]">Valor total del objeto:</span>
                  <div className="flex items-center gap-2">
                    <FaCoins className="text-[#c9a65a]" />
                    <span className="font-bold text-[#4a3f35]">{receta.oro_necesario} gp</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Ingredientes que se consumiran */}
          <div className="border-2 border-[#c45a5a] bg-[#fdf0f0] rounded-xl p-4">
            <h4 className="font-semibold text-[#7a3030] mb-3 flex items-center gap-2">
              <FaExclamationTriangle />
              Se consumiran estos ingredientes:
            </h4>
            <ul className="space-y-2">
              {receta.ingredientes.map((ing, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm text-[#6a3030]">
                  <span className="w-2 h-2 bg-[#a05050] rounded-full"></span>
                  <span className="font-semibold">{ing.cantidad_necesaria}x</span>
                  <span>{ing.nombre}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-[#7a4040] mt-3 italic">
              Los ingredientes seran eliminados de tu inventario al confirmar
            </p>
          </div>

          {/* Info adicional */}
          <div className="bg-[#e8f0f4] border border-[#a0c0d0] rounded-xl p-4">
            <h4 className="font-semibold text-[#4a6a7a] mb-2">Informacion importante:</h4>
            <ul className="text-sm text-[#4a6a7a] space-y-1">
              <li>Cada dia de trabajo consume <strong>1 dia de tiempo libre</strong></li>
              <li>Cada dia tambien tiene un <strong>coste en oro</strong> segun tu grado</li>
              {receta.es_magico ? (
                <li>Debes conseguir <strong>{receta.exitos_requeridos} tiradas exitosas</strong> para completar</li>
              ) : (
                <li>La <strong>DC de las tiradas es 12</strong> para objetos mundanos</li>
              )}
              <li>Si fallas una tirada, pierdes el tiempo y oro de ese dia pero el progreso se mantiene</li>
            </ul>
          </div>

          {/* Recursos actuales */}
          <div className="flex gap-4 justify-center bg-[#f8f4eb] border border-[#d4c4a0] p-4 rounded-xl">
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
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-[#5a7a5a] to-[#4a6a4a] hover:from-[#4a6a4a] hover:to-[#3a5a3a] text-[#f5ede1] font-semibold py-3 px-6 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#f5ede1]"></div>
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