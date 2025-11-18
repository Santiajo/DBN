'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { DnDSpecies, DnDTrait } from '@/types';
import Button from "@/components/button";
import Card from "@/components/card";
import Modal from '@/components/modal';
import ConfirmAlert from '@/components/confirm-alert';
import TraitForm from './trait-form';
import { FaArrowLeft, FaPlus, FaPencilAlt, FaTrash, FaIndent } from 'react-icons/fa';

export default function SpeciesDetailPage() {
  const { accessToken } = useAuth();
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [species, setSpecies] = useState<DnDSpecies | null>(null);
  const [loading, setLoading] = useState(true);

  // Estados para el CRUD de Traits
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrait, setEditingTrait] = useState<DnDTrait | null>(null);
  const [parentForNewTrait, setParentForNewTrait] = useState<number | null>(null);

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [traitToDelete, setTraitToDelete] = useState<DnDTrait | null>(null);

  // --- Cargar Datos ---
  const fetchSpeciesDetail = useCallback(async () => {
    if (!accessToken || !slug) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/species/${slug}/`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSpecies(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [accessToken, slug]);

  useEffect(() => {
    fetchSpeciesDetail();
  }, [fetchSpeciesDetail]);

  // --- Handlers CRUD ---

  const handleOpenCreate = (parentId: number | null = null) => {
    setEditingTrait(null);
    setParentForNewTrait(parentId);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (trait: DnDTrait) => {
    setEditingTrait(trait);
    setParentForNewTrait(null);
    setIsModalOpen(true);
  };

  const handleSaveTrait = async (traitData: Partial<DnDTrait>) => {
    if (!accessToken) return;
    const isEditing = !!traitData.id;
    const url = isEditing
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/traits/${traitData.id}/`
      : `${process.env.NEXT_PUBLIC_API_URL}/api/traits/`;
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(traitData),
      });

      if (!res.ok) throw new Error("Error al guardar trait");

      setIsModalOpen(false);
      fetchSpeciesDetail();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteClick = (trait: DnDTrait) => {
    setTraitToDelete(trait);
    setIsAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (!traitToDelete || !accessToken) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/traits/${traitToDelete.id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      fetchSpeciesDetail();
    } catch (error) {
      console.error(error);
    } finally {
      setIsAlertOpen(false);
      setTraitToDelete(null);
    }
  };

  if (loading) return <div className="p-8">Cargando...</div>;
  if (!species) return <div className="p-8">Especie no encontrada</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">

      {/* Botón Volver (Usando tu componente Button) */}
      <div className="flex items-center mb-4">
        <Button variant="primary" onClick={() => router.back()}>
          <div className="flex items-center gap-2">
            <FaArrowLeft /> Volver al listado
          </div>
        </Button>
      </div>

      {/* Info Principal (Usando tu componente Card Primary/Pergamino) */}
      <Card variant="secondary">
        <h1 className="text-3xl font-title mb-2 text-stone-900">{species.name}</h1>
        <div className="flex gap-4 text-sm text-stone-700 font-body mb-4">
          <span className="bg-white/50 px-3 py-1 rounded-full border border-madera-oscura/30">{species.creature_type}</span>
          <span className="bg-white/50 px-3 py-1 rounded-full border border-madera-oscura/30">{species.size}</span>
          <span className="bg-white/50 px-3 py-1 rounded-full border border-madera-oscura/30">Velocidad: {species.walking_speed}ft</span>
        </div>
        <p className="text-stone-800 whitespace-pre-wrap leading-relaxed">{species.description}</p>
      </Card>

      {/* Sección de Traits */}
      <div className="flex justify-between items-center mt-8 mb-4">
        <h2 className="text-2xl font-title text-stone-800">Rasgos de Especie (Traits)</h2>
        <Button variant="primary" onClick={() => handleOpenCreate(null)}>
          <div className="flex items-center gap-2">
            <FaPlus /> Nuevo Rasgo Base
          </div>
        </Button>
      </div>

      <div className="space-y-4">
        {species.traits.length === 0 && (
          <p className="text-stone-500 italic">No hay rasgos creados para esta especie aún.</p>
        )}

        {species.traits.map((trait) => (
          <Card key={trait.id} variant="secondary" className="p-0 overflow-hidden">
            <div className="p-4 flex justify-between items-start bg-stone-50/50">
              <div className="flex-grow">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-lg text-bosque">{trait.name}</h3>
                  {(trait.max_choices > 0) && (
                    <span className="text-xs font-medium bg-cuero/10 text-cuero px-2 py-0.5 rounded border border-cuero/40">
                      Elige {trait.min_choices} de {trait.max_choices}
                    </span>
                  )}
                </div>
                <p className="text-sm text-stone-700 whitespace-pre-wrap">{trait.description}</p>
              </div>

              <div className="flex gap-2 ml-4 shrink-0">
                {(trait.max_choices > 0) && (
                  <button
                    onClick={() => handleOpenCreate(trait.id)}
                    className="p-2 flex items-center gap-1 text-madera-oscura hover:bg-madera-oscura/10 rounded tooltip transition-colors"
                    title="Añadir Opción a este Grupo"
                  >
                    <FaIndent /> <FaPlus className="w-2.5 h-2.5" />
                  </button>
                )}
                <button onClick={() => handleOpenEdit(trait)} className="p-2 text-stone-500 hover:bg-stone-200 rounded transition-colors">
                  <FaPencilAlt />
                </button>
                <button onClick={() => handleDeleteClick(trait)} className="p-2 text-carmesi hover:bg-carmesi/10 rounded transition-colors">
                  <FaTrash />
                </button>
              </div>
            </div>

            {/* Lista de Opciones Anidadas (Si existen) */}
            {trait.options && trait.options.length > 0 && (
              <div className="border-t border-stone-200 bg-white pl-8 pr-4 py-4 space-y-3">
                <p className="text-xs font-bold text-stone-400 uppercase tracking-wide mb-2">Opciones Disponibles:</p>
                {trait.options.map((option) => (
                  <div key={option.id} className="flex justify-between items-start p-3 border border-stone-100 rounded hover:border-stone-300 transition-colors bg-stone-50/30">
                    <div>
                      <h4 className="font-semibold text-sm text-stone-800">{option.name}</h4>
                      <p className="text-xs text-stone-600 mt-1">{option.description}</p>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <button onClick={() => handleOpenEdit(option as unknown as DnDTrait)} className="p-1.5 text-stone-400 hover:text-stone-700">
                        <FaPencilAlt className="w-3 h-3" />
                      </button>
                      <button onClick={() => handleDeleteClick(trait)} className="p-2 text-carmesi hover:bg-carmesi/10 rounded transition-colors">
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Modales y Alertas (Sin cambios visuales, funcional logic) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTrait ? "Editar Rasgo" : (parentForNewTrait ? "Nueva Opción de Rasgo" : "Nuevo Rasgo Base")}
      >
        {species && (
          <TraitForm
            onSave={handleSaveTrait}
            onCancel={() => setIsModalOpen(false)}
            initialData={editingTrait}
            speciesId={species.id}
            parentId={parentForNewTrait}
          />
        )}
      </Modal>

      <ConfirmAlert
        isOpen={isAlertOpen}
        onClose={() => setIsAlertOpen(false)}
        onConfirm={confirmDelete}
        title="Eliminar Rasgo"
        message="¿Estás seguro? Si eliminas un rasgo padre, también se eliminarán todas sus opciones."
      />
    </div>
  );
}