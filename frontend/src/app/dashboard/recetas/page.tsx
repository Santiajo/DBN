'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import Card from "@/components/card";
import Button from "@/components/button";
import Modal from '@/components/modal';
import ConfirmAlert from '@/components/confirm-alert';
import RecetaForm from '@/components/receta-form';
import { FaPlus, FaPencilAlt, FaTrash, FaCoins, FaMagic, FaStar, FaTools, FaFlask } from 'react-icons/fa';
import { RecetaFormData, RecetaAdmin,  } from '@/types/receta';

export default function RecetasPage() {
    const { accessToken, logout } = useAuth();

    const [recetas, setRecetas] = useState<RecetaAdmin[]>([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingReceta, setEditingReceta] = useState<RecetaAdmin | null>(null);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [recetaToDelete, setRecetaToDelete] = useState<RecetaAdmin | null>(null);
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
            const recetasData = data.results || data;
            
            console.log('Recetas cargadas:', recetasData);
            
            recetasData.forEach((receta: RecetaAdmin) => {
                if (!receta.ingredientes) {
                    console.warn(`Receta "${receta.nombre}" (ID: ${receta.id}) no tiene ingredientes`);
                } else {
                    console.log(`Receta "${receta.nombre}" tiene ${receta.ingredientes.length} ingredientes`);
                }
            });
            
            setRecetas(recetasData); 
            setErrorMessage('');
        } catch (error) {
            console.error(error);
            setErrorMessage('Error al cargar las recetas. Intentalo de nuevo.');
        } finally {
            setLoading(false);
        }
    }, [accessToken, logout, apiUrl]);

    useEffect(() => {
        fetchRecetas();
    }, [fetchRecetas]);

    const fetchRecetaDetalle = async (recetaId: number): Promise<RecetaAdmin | null> => {
        if (!accessToken) return null;
        
        try {
            console.log(`Cargando detalles de receta ID: ${recetaId}`);
            const res = await fetch(`${apiUrl}/api/recetas/${recetaId}/`, {
                headers: { 'Authorization': `Bearer ${accessToken}` },
            });
            
            if (!res.ok) {
                throw new Error('Error al cargar detalles de la receta');
            }
            
            const recetaDetalle = await res.json();
            console.log('Detalles completos:', recetaDetalle);
            
            if (!recetaDetalle.ingredientes) {
                console.error('La receta no tiene campo "ingredientes"');
                recetaDetalle.ingredientes = [];
            } else {
                console.log(`Ingredientes: ${recetaDetalle.ingredientes.length}`);
                recetaDetalle.ingredientes.forEach((ing: { objeto_id: number; nombre: string; cantidad_necesaria: number }) => {
                    console.log(`  - ${ing.cantidad_necesaria}x ${ing.nombre} (ID: ${ing.objeto_id})`);
                });
            }
            
            return recetaDetalle;
        } catch (error) {
            console.error('Error cargando detalles:', error);
            setErrorMessage('Error al cargar los detalles de la receta.');
            return null;
        }
    };

    const handleSaveReceta = async (recetaData: RecetaFormData) => {
        if (!accessToken) return;
        
        const isEditing = !!editingReceta;
        const url = isEditing ? `${apiUrl}/api/recetas/${editingReceta.id}/` : `${apiUrl}/api/recetas/`;
        const method = isEditing ? 'PUT' : 'POST';

        setErrorMessage('');
        try {
            console.log('Guardando receta:', recetaData);
            
            const bodyReceta = {
                nombre: recetaData.nombre,
                objeto_final: recetaData.objeto_final,
                cantidad_final: recetaData.cantidad_final,
                es_magico: recetaData.es_magico,
                oro_necesario: recetaData.oro_necesario,
                herramienta: recetaData.herramienta || '',
                grado_minimo_requerido: recetaData.grado_minimo_requerido || 'Novato',
                rareza: recetaData.es_magico ? recetaData.rareza : null,
                material_raro: recetaData.es_magico ? recetaData.material_raro : null,
                es_consumible: recetaData.es_magico ? recetaData.es_consumible : false,
                requiere_investigacion: recetaData.requiere_investigacion,
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
            
            const savedReceta: RecetaAdmin = await res.json();
            const recetaId = savedReceta.id;

            console.log('Receta guardada:', savedReceta);

            if (isEditing) {
                console.log('Eliminando ingredientes antiguos...');
                
                const resIngredientes = await fetch(`${apiUrl}/api/ingredientes/?receta=${recetaId}`, {
                    headers: { 'Authorization': `Bearer ${accessToken}` },
                });
                
                if (resIngredientes.ok) {
                    const ingredientesActuales = await resIngredientes.json();
                    const ingredientesArray: Array<{ id: number }> = ingredientesActuales.results || ingredientesActuales;
                    
                    console.log(`  Encontrados ${ingredientesArray.length} ingredientes a eliminar`);
                    
                    const deletePromises = ingredientesArray.map((ing) => 
                        fetch(`${apiUrl}/api/ingredientes/${ing.id}/`, {
                            method: 'DELETE',
                            headers: { 'Authorization': `Bearer ${accessToken}` },
                        }).then(res => {
                            if (!res.ok) {
                                console.error(`Error al eliminar ingrediente ${ing.id}`);
                            } else {
                                console.log(`Ingrediente ${ing.id} eliminado`);
                            }
                        })
                    );
                    
                    await Promise.all(deletePromises);
                    console.log('Todos los ingredientes antiguos eliminados');
                }
            }

            console.log(`Creando ${recetaData.ingredientes.length} nuevos ingredientes...`);
            
            const createPromises = recetaData.ingredientes.map((ing, index) => {
                const bodyIngrediente = {
                    receta: recetaId,
                    objeto: ing.objeto,
                    cantidad: Number(ing.cantidad)
                };
                
                console.log(`  Creando ingrediente ${index + 1}:`, bodyIngrediente);
                
                return fetch(`${apiUrl}/api/ingredientes/`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json', 
                        'Authorization': `Bearer ${accessToken}` 
                    },
                    body: JSON.stringify(bodyIngrediente),
                }).then(async res => {
                    if (!res.ok) {
                        const errorData = await res.json();
                        console.error(`Error al crear ingrediente:`, errorData);
                        throw new Error(`Error al crear ingrediente: ${JSON.stringify(errorData)}`);
                    }
                    const created = await res.json();
                    console.log(`Ingrediente creado:`, created);
                    return created;
                });
            });

            await Promise.all(createPromises);
            console.log('Todos los ingredientes nuevos creados');

            setIsModalOpen(false);
            setEditingReceta(null);
            
            await fetchRecetas();
            
        } catch (error) {
            console.error('Error completo:', error);
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

    const handleOpenCreateModal = () => { 
        setEditingReceta(null); 
        setIsModalOpen(true); 
    };
    
    const handleOpenEditModal = async (receta: RecetaAdmin) => { 
        console.log('Editando receta:', receta);
        
        const recetaDetalle = await fetchRecetaDetalle(receta.id);
        
        if (recetaDetalle) {
            setEditingReceta(recetaDetalle);
            setIsModalOpen(true);
        } else {
            setErrorMessage('No se pudieron cargar los detalles de la receta.');
        }
    };
    
    const handleOpenDeleteAlert = (receta: RecetaAdmin) => { 
        setRecetaToDelete(receta); 
        setIsAlertOpen(true); 
    };
    
    if (loading) return (
        <div className="min-h-screen bg-[##F5F5F4] flex items-center justify-center">
            <div className="text-[#4a3f35] font-serif text-lg">Cargando recetas...</div>
        </div>
    );

    return (
        <div className="min-h-full bg-[#F5F5F4] py-8 px-4">
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&display=swap');
                
                .font-medieval {
                    font-family: 'Cinzel', serif;
                }
            `}</style>
            
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
                title="ELIMINAR RECETA?" 
                message={`La receta "${recetaToDelete?.nombre}" que produce "${recetaToDelete?.nombre_objeto_final || recetaToDelete?.objeto_final}" sera eliminada permanentemente.`} 
            />

            {/* Header */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-2">
                <div className="text-center mb-8">
                    <h1 className="font-medieval text-4xl text-[#3a2a1a] tracking-wider mb-2">
                        Gestion de Recetas
                    </h1>
                    <div className="flex justify-center">
                        <span className="text-[#5a4a3a] text-lg">&#9878;</span>
                    </div>
                </div>

                {/* Boton crear */}
                <div className="flex justify-end mb-6">
                    <button 
                        onClick={handleOpenCreateModal}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#c9a65a] border border-[#a88a3a] text-white rounded font-medium hover:bg-[#b8954a] transition-colors shadow-md"
                    >
                        <FaPlus className="w-3 h-3" />
                        Crear Receta
                    </button>
                </div>

                {/* Error message */}
                {errorMessage && (
                    <div className="bg-[#fef2f2] border-2 border-[#b91c1c] text-[#7f1d1d] px-4 py-3 rounded-lg mb-6" role="alert">
                        <strong className="font-bold">Error:</strong>
                        <span className="block sm:inline ml-2">{errorMessage}</span>
                    </div>
                )}

                {/* Cards de recetas */}
                {recetas.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {recetas.map(receta => (
                            <div 
                                key={receta.id} 
                                className="bg-[#f5ede1] border-2 border-[#3a2a1a] rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.2)] transition-shadow overflow-hidden flex flex-col"
                            >
                                {/* Header de la card */}
                                <div className="p-5 pb-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="font-medieval text-xl text-[#3a2a1a] tracking-wide">
                                            {receta.nombre}
                                        </h3>
                                        <span className={`px-3 py-1 rounded text-xs font-semibold ${
                                            receta.es_magico 
                                                ? 'bg-[#5a4a3a] text-[#f5ede1]' 
                                                : 'bg-[#8b7355] text-[#f5ede1]'
                                        }`}>
                                            {receta.es_magico ? 'Magico' : 'Mundano'}
                                        </span>
                                    </div>

                                    {/* Info principal */}
                                    <div className="space-y-2 text-sm text-[#4a3f35]">
                                        <p className="flex items-center gap-2">
                                            <span className="text-[#c9a65a]">&#9670;</span>
                                            <span>Produce:</span>
                                            <strong>{receta.cantidad_final}x {receta.nombre_objeto_final || receta.objeto_final}</strong>
                                        </p>
                                        
                                        {receta.herramienta && (
                                            <p className="flex items-center gap-2">
                                                <span className="text-[#c9a65a]">&#9670;</span>
                                                <span>Herramienta:</span>
                                                <strong>{receta.herramienta}</strong>
                                            </p>
                                        )}

                                        {!receta.es_magico && (
                                            <p className="flex items-center gap-2">
                                                <span className="text-[#c9a65a]">&#9670;</span>
                                                <span>Oro necesario:</span>
                                                <strong>{receta.oro_necesario} gp</strong>
                                            </p>
                                        )}

                                        {receta.grado_minimo_requerido && receta.grado_minimo_requerido !== 'Novato' && (
                                            <p className="flex items-center gap-2">
                                                <span className="text-[#c9a65a]">&#9670;</span>
                                                <span>Requiere:</span>
                                                <strong>{receta.grado_minimo_requerido}</strong>
                                            </p>
                                        )}
                                    </div>

                                    {/* Seccion magico */}
                                    {receta.es_magico && (
                                        <div className="bg-[#ebe3d5] p-3 rounded mt-3 space-y-1 text-sm">
                                            {receta.rareza && (
                                                <p className="flex items-center gap-2 text-[#4a3f35]">
                                                    <FaMagic className="text-[#8b7355] w-3 h-3" /> 
                                                    <span>Rareza:</span>
                                                    <strong>{receta.rareza}</strong>
                                                </p>
                                            )}
                                            {receta.tipo_artesano && (
                                                <p className="flex items-center gap-2 text-[#4a3f35]">
                                                    <FaFlask className="text-[#8b7355] w-3 h-3" /> 
                                                    <span>Artesano:</span>
                                                    <strong>{receta.tipo_artesano}</strong>
                                                </p>
                                            )}
                                            {receta.nombre_material_raro && (
                                                <p className="flex items-center gap-2 text-[#4a3f35]">
                                                    <FaStar className="text-[#c9a65a] w-3 h-3" /> 
                                                    <span>Material Raro:</span>
                                                    <strong>{receta.nombre_material_raro}</strong>
                                                </p>
                                            )}
                                            {receta.es_consumible && (
                                                <p className="text-xs text-[#6a5a4a] italic mt-1">
                                                    Consumible (DC reducida)
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Separador con linea punteada */}
                                <div className="border-t border-dashed border-[#c4b998] mx-5"></div>

                                {/* Seccion ingredientes */}
                                <div className="p-5 pt-4">
                                    <h4 className="font-semibold text-sm mb-3 text-[#4a3f35]">
                                        Ingredientes:
                                    </h4>
                                    <div className="space-y-2">
                                        {receta.ingredientes && receta.ingredientes.length > 0 ? (
                                            receta.ingredientes.map((ing, idx) => (
                                                <div 
                                                    key={ing.id || idx} 
                                                    className="flex items-center gap-2 bg-[#ebe3d5] rounded px-3 py-2"
                                                >
                                                    <span className="bg-[#c9a65a] text-white px-2 py-0.5 rounded text-xs font-bold min-w-[28px] text-center">
                                                        {ing.cantidad}x
                                                    </span>
                                                    <span className="text-sm text-[#4a3f35]">{ing.nombre_ingrediente}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-xs text-[#a85555] italic">Sin ingredientes</p>
                                        )}
                                    </div>
                                </div>

                                {/* Botones de accion */}
                                <div className="flex justify-end gap-2 px-5 pb-5 mt-auto">
                                    <button 
                                        onClick={() => handleOpenDeleteAlert(receta)}
                                        className="px-4 py-2 bg-[#8b4545] hover:bg-[#7a3535] text-white rounded text-sm font-medium transition-colors"
                                    >
                                        Eliminar
                                    </button>
                                    <button 
                                        onClick={() => handleOpenEditModal(receta)}
                                        className="px-4 py-2 bg-[#f0e6d3] border border-[#c4b998] text-[#5a4a3a] rounded text-sm font-medium hover:bg-[#e8dcc8] transition-colors"
                                    >
                                        Editar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <p className="text-[#5a4a3a] font-serif text-lg">Aun no hay recetas registradas.</p>
                    </div>
                )}
            </div>
        </div>
    );
}