'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { RelacionNPC } from '@/types';
import Card from "@/components/card";
import Button from "@/components/button";
import { FaUserTie, FaHeart, FaSkull, FaRegCommentDots, FaSave } from 'react-icons/fa';

// Helper para traducir valor numérico a estado
const getReputationStatus = (val: number) => {
    if (val <= -20) return { label: "Enemigo Jurado", color: "text-carmesi", bar: "bg-carmesi" };
    if (val <= -10) return { label: "Hostil", color: "text-orange-600", bar: "bg-orange-500" };
    if (val < 10) return { label: "Neutral", color: "text-stone-500", bar: "bg-stone-400" };
    if (val < 20) return { label: "Amistoso", color: "text-bosque", bar: "bg-bosque" };
    return { label: "Aliado", color: "text-sky-600", bar: "bg-sky-500" };
};

export default function CharacterRelationsPage() {
  const { accessToken } = useAuth();
  const params = useParams();
  const personajeId = params.personajeId as string;

  const [relations, setRelations] = useState<RelacionNPC[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [tempNote, setTempNote] = useState("");

  const fetchRelations = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/relaciones-npc/?personaje=${personajeId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRelations(data.results || data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [accessToken, personajeId]);

  useEffect(() => {
    fetchRelations();
  }, [fetchRelations]);

  const startEditing = (rel: RelacionNPC) => {
      setEditingNoteId(rel.id);
      setTempNote(rel.notas_jugador || "");
  };

  const saveNote = async (relId: number) => {
      if (!accessToken) return;
      try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/relaciones-npc/${relId}/`, {
              method: 'PATCH',
              headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${accessToken}` 
              },
              body: JSON.stringify({ notas_jugador: tempNote })
          });

          if (res.ok) {
              // Actualizar localmente
              setRelations(prev => prev.map(r => r.id === relId ? { ...r, notas_jugador: tempNote } : r));
              setEditingNoteId(null);
          }
      } catch (error) {
          console.error("Error guardando nota", error);
      }
  };

  if (loading) return <div className="text-center py-10 font-title text-stone-600">Consultando red de contactos...</div>;

  return (
    <div className="space-y-6 font-body text-stone-800">
        <div className="border-b border-madera-oscura/10 pb-4 mb-6">
            <h2 className="text-3xl font-title text-madera-oscura">Relaciones y Contactos</h2>
            <p className="text-sm text-stone-500 italic">Personas que has conocido en tus viajes y qué piensan de ti.</p>
        </div>

        {relations.length === 0 ? (
            <div className="text-center py-12 bg-stone-50 rounded-xl border-2 border-dashed border-stone-200">
                <FaUserTie className="mx-auto text-4xl text-stone-300 mb-2" />
                <p className="text-stone-500">Aún no tienes relaciones conocidas con NPCs.</p>
                <p className="text-xs text-stone-400">¡Sal de juerga o completa misiones para conocer gente!</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {relations.map(rel => {
                    const status = getReputationStatus(rel.valor_amistad);
                    
                    // Calcular porcentaje para la barra (de -50 a +50 mapeado a 0-100%)
                    // Rango total aprox 100 puntos (-50 a 50)
                    const percent = Math.min(100, Math.max(0, (rel.valor_amistad + 50))); 

                    return (
                        <Card key={rel.id} variant="secondary" className="flex flex-col relative overflow-hidden group">
                            {/* Encabezado NPC */}
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-stone-200 p-3 rounded-full text-stone-500 border border-stone-300">
                                        <FaUserTie className="text-xl" />
                                    </div>
                                    <div>
                                        <h3 className="font-title text-xl text-stone-900 font-bold leading-none">
                                            {rel.npc_nombre}
                                        </h3>
                                        <p className="text-xs text-stone-500 uppercase tracking-wider mt-1">
                                            {rel.npc_titulo || 'Personaje'}
                                        </p>
                                    </div>
                                </div>
                                <div className={`text-right ${status.color}`}>
                                    <span className="block font-bold text-lg leading-none">{rel.valor_amistad > 0 ? `+${rel.valor_amistad}` : rel.valor_amistad}</span>
                                    <span className="text-[10px] uppercase font-bold border border-current px-1 rounded">
                                        {status.label}
                                    </span>
                                </div>
                            </div>

                            {/* Barra de Reputación */}
                            <div className="w-full bg-stone-200 h-2 rounded-full mb-4 overflow-hidden border border-stone-300 relative">
                                {/* Marcador central (Neutral 0) */}
                                <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-stone-400 z-10 h-full opacity-50"></div>
                                <div 
                                    className={`h-full transition-all duration-500 ${status.bar}`} 
                                    style={{ width: `${percent}%` }}
                                ></div>
                            </div>

                            {/* Notas del Jugador */}
                            <div className="mt-auto bg-pergamino/30 p-3 rounded border border-madera-oscura/10">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-bold text-madera-oscura uppercase flex items-center gap-1">
                                        <FaRegCommentDots /> Tus Notas
                                    </span>
                                    {!editingNoteId && (
                                        <button 
                                            onClick={() => startEditing(rel)}
                                            className="text-[10px] text-stone-400 hover:text-bosque underline decoration-dotted"
                                        >
                                            Editar
                                        </button>
                                    )}
                                </div>

                                {editingNoteId === rel.id ? (
                                    <div className="flex flex-col gap-2">
                                        <textarea 
                                            value={tempNote}
                                            onChange={(e) => setTempNote(e.target.value)}
                                            className="w-full text-sm p-2 rounded border border-stone-300 focus:ring-1 focus:ring-bosque bg-white"
                                            rows={3}
                                            placeholder="Escribe notas sobre este NPC..."
                                            autoFocus
                                        />
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => setEditingNoteId(null)} className="text-xs text-stone-500 hover:underline">Cancelar</button>
                                            <Button variant="primary" onClick={() => saveNote(rel.id)} className="px-3 py-1 text-xs h-auto">
                                                Guardar
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-stone-600 italic min-h-[1.5rem]">
                                        {rel.notas_jugador || "Sin notas..."}
                                    </p>
                                )}
                            </div>
                        </Card>
                    );
                })}
            </div>
        )}
    </div>
  );
}