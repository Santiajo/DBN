'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Personaje, PersonajeFormData, DnDSpecies } from '@/types';
import { DnDClass } from '@/types';
import Card from "@/components/card";
import Button from "@/components/button";
import Modal from '@/components/modal';
import ConfirmAlert from '@/components/confirm-alert';
import PersonajeForm from './personaje-form'; 
import { FaPlus, FaPencilAlt, FaTrash, FaEye, FaCoins, FaClock, FaStar } from 'react-icons/fa';

export default function PersonajesPage() {
    const { user, accessToken, logout } = useAuth();
    const router = useRouter();

    const [personajes, setPersonajes] = useState<Personaje[]>([]);
    const [loading, setLoading] = useState(true);

    const [classMap, setClassMap] = useState<Record<number, string>>({});
    const [speciesMap, setSpeciesMap] = useState<Record<number, string>>({});

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPersonaje, setEditingPersonaje] = useState<Personaje | null>(null);

    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [personajeToDelete, setPersonajeToDelete] = useState<Personaje | null>(null);

    // 1. Cargar Catálogos
    useEffect(() => {
        const fetchCatalogs = async () => {
            if (!accessToken) return;
            try {
                const headers = { 'Authorization': `Bearer ${accessToken}` };
                const [resClasses, resSpecies] = await Promise.all([
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/classes/`, { headers }),
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/species/`, { headers })
                ]);

                if (resClasses.ok) {
                    const data = await resClasses.json();
                    const map: Record<number, string> = {};
                    (data.results || []).forEach((c: DnDClass) => { map[c.id] = c.name; });
                    setClassMap(map);
                }

                if (resSpecies.ok) {
                    const data = await resSpecies.json();
                    const map: Record<number, string> = {};
                    (data.results || []).forEach((s: DnDSpecies) => { map[s.id] = s.name; });
                    setSpeciesMap(map);
                }
            } catch (error) {
                console.error("Error cargando metadatos", error);
            }
        };
        fetchCatalogs();
    }, [accessToken]);

    // 2. Cargar Personajes
    const fetchPersonajes = useCallback(async () => {
        if (!accessToken) return;
        setLoading(true);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        try {
            const res = await fetch(`${apiUrl}/api/personajes/`, {
                headers: { 'Authorization': `Bearer ${accessToken}` },
            });
            if (!res.ok) {
                if (res.status === 401) logout();
                throw new Error('Error al cargar los personajes');
            }
            const data = await res.json();
            setPersonajes(data.results || data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [accessToken, logout]);

    useEffect(() => {
        fetchPersonajes();
    }, [fetchPersonajes]);

    // Guardar
    const handleSavePersonaje = async (personajeData: PersonajeFormData) => {
        if (!accessToken || !user) return;
        
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const isEditing = !!editingPersonaje;
        const url = isEditing ? `${apiUrl}/api/personajes/${editingPersonaje.id}/` : `${apiUrl}/api/personajes/`;
        const method = isEditing ? 'PUT' : 'POST';

        const body = {
            ...personajeData,
            user: user.user_id, 
            nombre_usuario: user.username
        };

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const errorData = await res.json();
                console.error("Detalles del error del backend:", errorData);
                throw new Error('Error al guardar el personaje');
            }
            
            setIsModalOpen(false);
            setEditingPersonaje(null);
            await fetchPersonajes();
        } catch (error) {
            console.error(error);
        }
    };

    // Eliminar
    const handleConfirmDelete = async () => {
        if (!personajeToDelete || !accessToken) return;
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        try {
            await fetch(`${apiUrl}/api/personajes/${personajeToDelete.id}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${accessToken}` },
            });
            await fetchPersonajes();
        } catch (error) {
            console.error('Error al eliminar el personaje:', error);
        } finally {
            setIsAlertOpen(false);
            setPersonajeToDelete(null);
        }
    };

    // --- NUEVO HANDLER PARA NAVEGACIÓN ---
    const handleViewCharacter = (personajeId: number) => {
        // Navega a la raíz del personaje, donde cargará el layout con navbar y la página de resumen
        router.push(`/dashboard/personajes/${personajeId}`); 
    };

    const handleOpenCreateModal = () => { setEditingPersonaje(null); setIsModalOpen(true); };
    const handleOpenEditModal = (personaje: Personaje) => { setEditingPersonaje(personaje); setIsModalOpen(true); };
    const handleOpenDeleteAlert = (personaje: Personaje) => { setPersonajeToDelete(personaje); setIsAlertOpen(true); };
    
    if (loading && personajes.length === 0) return <div className="p-8 font-title">Cargando tus personajes...</div>

    return (
        <div className="p-8 space-y-6">
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingPersonaje ? "Editar Personaje" : "Crear Nuevo Personaje"}>
                <PersonajeForm onSave={handleSavePersonaje} onCancel={() => setIsModalOpen(false)} initialData={editingPersonaje} />
            </Modal>
            <ConfirmAlert isOpen={isAlertOpen} onClose={() => setIsAlertOpen(false)} onConfirm={handleConfirmDelete} title="¿ELIMINAR PERSONAJE?" message={`El personaje "${personajeToDelete?.nombre_personaje}" será eliminado permanentemente.`} />

            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-title text-stone-800">Mis Personajes</h1>
                <Button variant="primary" onClick={handleOpenCreateModal}><FaPlus className="mr-2" />Crear Personaje</Button>
            </div>

            {personajes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {personajes.map(pj => {
                        const className = (pj.clase && classMap[pj.clase]) ? classMap[pj.clase] : 'Sin Clase';
                        const speciesName = (pj.especie && speciesMap[pj.especie]) ? speciesMap[pj.especie] : 'Desconocida';

                        return (
                            <Card key={pj.id} variant="secondary" className="flex flex-col group">
                                <div className="flex-grow">
                                    {/* Hacemos el título interactivo */}
                                    <h3 
                                        className="font-title text-2xl text-bosque cursor-pointer hover:underline decoration-2 underline-offset-2"
                                        onClick={() => handleViewCharacter(pj.id)}
                                    >
                                        {pj.nombre_personaje}
                                    </h3>
                                    <p className="text-sm italic text-stone-600 mb-4">
                                        {speciesName} {className}, Nivel {pj.nivel}
                                    </p>
                                    
                                    <div className="space-y-2 text-sm font-body border-t border-madera-oscura/20 pt-4">
                                        <p className="flex items-center gap-2"><FaCoins className="text-yellow-500" /> <strong>Oro:</strong> {pj.oro}</p>
                                        <p className="flex items-center gap-2"><FaStar className="text-sky-500" /> <strong>Checkpoints:</strong> {pj.treasure_points}</p>
                                        <p className="flex items-center gap-2"><FaClock className="text-stone-500" /> <strong>Tiempo Libre:</strong> {pj.tiempo_libre} días</p>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-madera-oscura/20">
                                    <Button variant="dangerous" onClick={() => handleOpenDeleteAlert(pj)}><FaTrash /></Button>
                                    <Button variant="secondary" onClick={() => handleOpenEditModal(pj)}><FaPencilAlt /></Button>
                                    
                                    {/* Botón Principal Actualizado */}
                                    <Button variant="secondary" onClick={() => handleViewCharacter(pj.id)}>
                                        <FaEye className="mr-2"/> Ver Ficha
                                    </Button>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-16">
                    <p className="text-stone-500">Aún no has creado ningún personaje.</p>
                </div>
            )}
        </div>
    );
}