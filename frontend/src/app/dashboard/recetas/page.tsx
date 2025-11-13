'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Card from "@/components/card";
import Button from "@/components/button";
import Modal from '@/components/modal';
import ConfirmAlert from '@/components/confirm-alert';
import RecetaForm from '@/components/receta-form';
import { FaPlus, FaPencilAlt, FaTrash, FaTag, FaCoins, FaMagic, FaLevelUpAlt, FaTools, FaStar, FaFlask } from 'react-icons/fa';
import { RecetaFormData, Receta } from '@/types/receta';

export default function RecetasPage() {
    const { accessToken, logout } = useAuth();
    const router = useRouter();

    const [recetas, setRecetas] = useState<Receta[]>([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingReceta, setEditingReceta] = useState<Receta | null>(null);

    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [recetaToDelete, setRecetaToDelete] = useState<Receta | null>(null);
    const [errorMessage, setErrorMessage] = useState('');

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    const fetchRecetas = useCallback(async () => {
        if (!accessToken) return;
        setLoading(true);
        try {
            const res = await fetch(`${apiUrl}/api/recetas/`, {
                headers: { 'Authorization': `Bearer ${accessToken}` },
            });
            if (!res.ok) {
                if (res.status === 401) logout();
                throw new Error('Error al cargar las recetas');
            }
            const data = await res.json();
            setRecetas(data.results || data); 
            setErrorMessage('');
        } catch (error) {
            console.error(error);
            setErrorMessage('Error al cargar las recetas. Inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    }, [accessToken, logout, apiUrl]);

    useEffect(() => {
        fetchRecetas();
    }, [fetchRecetas]);

    const handleSaveReceta = async (recetaData: RecetaFormData) => {
        if (!accessToken) return;
        
        const isEditing = !!editingReceta;
        const url = isEditing ? `${apiUrl}/api/recetas/${editingReceta.id}/` : `${apiUrl}/api/recetas/`;
        const method = isEditing ? 'PUT' : 'POST';

        setErrorMessage('');
        try {
            // ✅ 1. Preparar el body con TODOS los campos
            const bodyReceta = {
                nombre: recetaData.nombre,
                objeto_final: recetaData.objeto_final,
                cantidad_final: recetaData.cantidad_final,
                es_magico: recetaData.es_magico,
                oro_necesario: recetaData.oro_necesario,
                herramienta: recetaData.herramienta || '',
                grado_minimo_requerido: recetaData.grado_minimo_requerido || 'Novato',
                // ✅ Campos de objetos mágicos
                rareza: recetaData.es_magico ? recetaData.rareza : null,
                material_raro: recetaData.es_magico ? recetaData.material_raro : null,
                es_consumible: recetaData.es_magico ? recetaData.es_consumible : false,
            };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
                body: JSON.stringify(bodyReceta),
            });

            if (!res.ok) {
                const errorData = await res.json();
                console.error("Detalles del error del backend:", errorData);
                throw new Error('Error al guardar la Receta principal');
            }
            
            const savedReceta: Receta = await res.json();
            const recetaId = savedReceta.id;

            // 2. Gestión de Ingredientes
            if (isEditing) {
                const deletePromises = editingReceta?.ingredientes.map(ing => 
                    fetch(`${apiUrl}/api/ingredientes/${ing.objeto_id}/`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${accessToken}` },
                    })
                ) || [];
                await Promise.all(deletePromises);
            }

            // 3. Crear los nuevos ingredientes
            const createPromises = recetaData.ingredientes.map(ing => {
                const bodyIngrediente = {
                    receta: recetaId,
                    objeto: ing.objeto,
                    cantidad: ing.cantidad
                };
                return fetch(`${apiUrl}/api/ingredientes/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
                    body: JSON.stringify(bodyIngrediente),
                });
            });

            await Promise.all(createPromises);

            setIsModalOpen(false);
            setEditingReceta(null);
            await fetchRecetas();
        } catch (error) {
            console.error(error);
            setErrorMessage(`Error: ${error instanceof Error ? error.message : 'Error desconocido al guardar.'}`);
        }
    };

    const handleConfirmDelete = async () => {
        if (!recetaToDelete || !accessToken) return;
        setErrorMessage('');
        try {
            const res = await fetch(`${apiUrl}/api/recetas/${recetaToDelete.id}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${accessToken}` },
            });
            if (!res.ok) throw new Error('Error al eliminar la receta');
            
            await fetchRecetas();
        } catch (error) {
            console.error('Error al eliminar la receta:', error);
            setErrorMessage('Error al eliminar la receta.');
        } finally {
            setIsAlertOpen(false);
            setRecetaToDelete(null);
        }
    };

    const handleOpenCreateModal = () => { setEditingReceta(null); setIsModalOpen(true); };
    const handleOpenEditModal = (receta: Receta) => { setEditingReceta(receta); setIsModalOpen(true); };
    const handleOpenDeleteAlert = (receta: Receta) => { setRecetaToDelete(receta); setIsAlertOpen(true); };
    
    if (loading) return <div className="p-8 font-title">Cargando recetas...</div>

    return (
        <div className="p-8 space-y-6">
            
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingReceta ? "Editar Receta" : "Crear Nueva Receta"}>
                <RecetaForm 
                    onSave={handleSaveReceta} 
                    onCancel={() => setIsModalOpen(false)} 
                    initialData={editingReceta} 
                />
            </Modal>
            
            <ConfirmAlert 
                isOpen={isAlertOpen} 
                onClose={() => setIsAlertOpen(false)} 
                onConfirm={handleConfirmDelete} 
                title="¿ELIMINAR RECETA?" 
                message={`La receta "${recetaToDelete?.nombre}" que produce "${recetaToDelete?.objeto_final}" será eliminada permanentemente.`} 
            />

            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-title text-stone-800">Gestión de Recetas</h1>
                <Button variant="primary" onClick={handleOpenCreateModal}><FaPlus className="mr-2" />Crear Receta</Button>
            </div>

            {errorMessage && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <strong className="font-bold">Error:</strong>
                    <span className="block sm:inline ml-2">{errorMessage}</span>
                </div>
            )}

            {/* Listado de Recetas */}
            {recetas.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recetas.map(receta => (
                        <Card key={receta.id} variant="secondary" className="flex flex-col">
                            <div className="flex-grow">
                                {/* ✅ Header con badge de tipo */}
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-title text-2xl text-bosque">{receta.nombre}</h3>
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                        receta.es_magico 
                                            ? 'bg-purple-200 text-purple-800' 
                                            : 'bg-stone-200 text-stone-700'
                                    }`}>
                                        {receta.es_magico ? '✨ Mágico' : '⚒️ Mundano'}
                                    </span>
                                </div>

                                <p className="text-md italic text-stone-600 mb-4">
                                    Produce: <strong className='font-body'>{receta.cantidad_final} x {receta.objeto_final}</strong>
                                </p>
                                
                                <div className="space-y-2 text-sm font-body border-t border-madera pt-4">
                                    
                                    {/*  Mostrar herramienta si existe */}
                                    {receta.herramienta && (
                                        <p className="flex items-center gap-2">
                                            <FaTools className="text-stone-600" /> 
                                            <strong>Herramienta:</strong> {receta.herramienta}
                                        </p>
                                    )}

                                    {/*  Mostrar grado mínimo */}
                                    {receta.grado_minimo_requerido && receta.grado_minimo_requerido !== 'Novato' && (
                                        <p className="flex items-center gap-2 text-amber-700">
                                            <FaStar className="text-amber-600" /> 
                                            <strong>Requiere:</strong> {receta.grado_minimo_requerido}
                                        </p>
                                    )}

                                    <p className="flex items-center gap-2">
                                        <FaCoins className="text-yellow-500" /> 
                                        <strong>Oro:</strong> {receta.oro_necesario} gp
                                    </p>

                                    {/*  Info de objetos mágicos */}
                                    {receta.es_magico && (
                                        <div className="bg-purple-50 p-2 rounded mt-2 space-y-1">
                                            {receta.rareza && (
                                                <p className="flex items-center gap-2">
                                                    <FaMagic className="text-purple-600" /> 
                                                    <strong>Rareza:</strong> {receta.rareza}
                                                </p>
                                            )}
                                            {receta.tipo_artesano && (
                                                <p className="flex items-center gap-2">
                                                    <FaFlask className="text-purple-600" /> 
                                                    <strong>Artesano:</strong> {receta.tipo_artesano}
                                                </p>
                                            )}
                                            {receta.nombre_material_raro && (
                                                <p className="flex items-center gap-2 text-purple-800">
                                                    <FaStar className="text-yellow-500" /> 
                                                    <strong>Material Raro:</strong> {receta.nombre_material_raro}
                                                </p>
                                            )}
                                            {receta.es_consumible && (
                                                <p className="text-xs text-purple-600 italic">
                                                    * Consumible (DC reducida)
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    <h4 className="font-semibold mt-3 flex items-center gap-2">
                                        <FaTag className="text-madera-oscura"/>Ingredientes:
                                    </h4>
                                    <ul className="list-disc list-inside ml-2">
                                        {receta.ingredientes.map(ing => (
                                            <li key={ing.objeto_id} className="text-xs text-stone-700">
                                                {ing.cantidad_necesaria} x {ing.nombre}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                            
                            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-madera">
                                <Button variant="dangerous" onClick={() => handleOpenDeleteAlert(receta)}>
                                    <FaTrash />
                                </Button>
                                <Button variant="secondary" onClick={() => handleOpenEditModal(receta)}>
                                    <FaPencilAlt />
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16">
                    <p className="text-stone-500">Aún no hay recetas registradas.</p>
                </div>
            )}
        </div>
    );
}