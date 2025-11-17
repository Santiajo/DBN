'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { DnDSpecies, DnDTrait } from '@/types';
import Button from "@/components/button";
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
    const [parentForNewTrait, setParentForNewTrait] = useState<number | null>(null); // Para saber si estamos agregando una opción a un padre

    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [traitToDelete, setTraitToDelete] = useState<DnDTrait | null>(null);

    // --- Cargar Datos ---
    const fetchSpeciesDetail = useCallback(async () => {
        if (!accessToken || !slug) return;
        try {
            // Nota: El endpoint de detalle YA trae los traits anidados gracias al serializer
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
        setParentForNewTrait(null); // Al editar, el padre ya viene en el objeto, no necesitamos forzarlo
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
            fetchSpeciesDetail(); // Recargamos toda la especie para ver los cambios
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
            {/* Botón Volver */}
            <button onClick={() => router.back()} className="flex items-center gap-2 text-stone-600 hover:text-stone-900 mb-4">
                <FaArrowLeft /> Volver al listado
            </button>

            {/* Cabecera de la Especie */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
                <h1 className="text-3xl font-title mb-2">{species.name}</h1>
                <div className="flex gap-4 text-sm text-stone-600 font-body">
                    <span className="bg-stone-100 px-3 py-1 rounded-full border">{species.creature_type}</span>
                    <span className="bg-stone-100 px-3 py-1 rounded-full border">{species.size}</span>
                    <span className="bg-stone-100 px-3 py-1 rounded-full border">Speed: {species.walking_speed}ft</span>
                </div>
                <p className="mt-4 text-stone-700 whitespace-pre-wrap">{species.description}</p>
            </div>

            {/* Sección de Traits */}
            <div className="flex justify-between items-center mt-8 mb-4">
                <h2 className="text-2xl font-title">Rasgos de Especie (Traits)</h2>
                <Button variant="primary" onClick={() => handleOpenCreate(null)}>
                    <FaPlus className="mr-2" /> Nuevo Rasgo Base
                </Button>
            </div>

            <div className="space-y-4">
                {species.traits.length === 0 && (
                    <p className="text-stone-500 italic">No hay rasgos creados para esta especie aún.</p>
                )}

                {species.traits.map((trait) => (
                    <div key={trait.id} className="bg-white border border-stone-200 rounded-lg overflow-hidden shadow-sm">
                        {/* Rasgo Padre / Base */}
                        <div className="p-4 flex justify-between items-start bg-stone-50">
                            <div className="flex-grow">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold text-lg text-bosque">{trait.name}</h3>
                                    {/* Indicador si es un grupo de opciones */}
                                    {(trait.max_choices > 0) && (
                                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded border border-blue-200">
                                            Elige {trait.min_choices} de {trait.max_choices}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-stone-700 whitespace-pre-wrap">{trait.description}</p>
                            </div>
                            <div className="flex gap-2 ml-4 shrink-0">
                                {/* Botón para añadir opción (Solo si es un grupo) */}
                                {(trait.max_choices > 0) && (
                                    <button
                                        onClick={() => handleOpenCreate(trait.id)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded tooltip"
                                        title="Añadir Opción a este Grupo"
                                    >
                                        <FaIndent /> <FaPlus className="inline w-3 h-3" />
                                    </button>
                                )}
                                <button onClick={() => handleOpenEdit(trait)} className="p-2 text-stone-500 hover:bg-stone-200 rounded">
                                    <FaPencilAlt />
                                </button>
                                <button onClick={() => handleDeleteClick(trait)} className="p-2 text-red-500 hover:bg-red-50 rounded">
                                    <FaTrash />
                                </button>
                            </div>
                        </div>

                        {/* Lista de Opciones (Hijos) */}
                        {trait.options && trait.options.length > 0 && (
                            <div className="border-t border-stone-200 bg-white pl-8 pr-4 py-2 space-y-2">
                                <p className="text-xs font-bold text-stone-400 uppercase tracking-wide mb-2 mt-1">Opciones Disponibles:</p>
                                {trait.options.map((option) => (
                                    <div key={option.id} className="flex justify-between items-start p-3 border border-stone-100 rounded hover:border-stone-300 transition-colors">
                                        <div>
                                            <h4 className="font-semibold text-sm text-stone-800">{option.name}</h4>
                                            <p className="text-xs text-stone-600 mt-1">{option.description}</p>
                                        </div>
                                        <div className="flex gap-1 ml-2">
                                            <button
                                                onClick={() => handleOpenEdit(option as unknown as DnDTrait)}
                                                className="p-1.5 text-stone-400 hover:text-stone-700"><FaPencilAlt className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(option as unknown as DnDTrait)}
                                                className="p-1.5 text-red-300 hover:text-red-600"><FaTrash className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Modales */}
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