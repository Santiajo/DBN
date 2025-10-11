'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Personaje } from '@/types';
import Card from "@/components/card";
import Button from "@/components/button";
import Modal from '@/components/modal';
import ConfirmAlert from '@/components/confirm-alert';
import PersonajeForm from './personaje-form';
import { FaPlus, FaPencilAlt, FaTrash, FaScroll, FaCoins, FaClock, FaStar } from 'react-icons/fa';

export default function PersonajesPage() {
    // El 'user' de tu contexto de autenticación tiene la información que necesitamos
    const { user, accessToken, logout } = useAuth();
    const router = useRouter();

    const [personajes, setPersonajes] = useState<Personaje[]>([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPersonaje, setEditingPersonaje] = useState<Personaje | null>(null);

    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [personajeToDelete, setPersonajeToDelete] = useState<Personaje | null>(null);

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

    const handleSavePersonaje = async (personajeData: Omit<Personaje, 'id' | 'user'>) => {
        if (!accessToken || !user) return;
        
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const isEditing = !!editingPersonaje;
        const url = isEditing ? `${apiUrl}/api/personajes/${editingPersonaje.id}/` : `${apiUrl}/api/personajes/`;
        const method = isEditing ? 'PUT' : 'POST';

        // Añadimos el nombre de usuario al cuerpo de la solicitud
        const body = {
            ...personajeData,
            nombre_usuario: user.username
        };

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
                // Enviamos el cuerpo modificado
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                // Errores detallados en la consola del navegador
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

    const handleOpenCreateModal = () => { setEditingPersonaje(null); setIsModalOpen(true); };
    const handleOpenEditModal = (personaje: Personaje) => { setEditingPersonaje(personaje); setIsModalOpen(true); };
    const handleOpenDeleteAlert = (personaje: Personaje) => { setPersonajeToDelete(personaje); setIsAlertOpen(true); };
    const handleViewInventory = (personajeId: number) => { router.push(`/dashboard/personajes/${personajeId}/inventario`); };
    
    if (loading) return <div className="p-8 font-title">Cargando tus personajes...</div>

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
                        const formattedClase = pj.clase 
                            ? pj.clase.charAt(0) + pj.clase.slice(1).toLowerCase() 
                            : 'Aventurero';

                        return (
                            <Card key={pj.id} variant="secondary" className="flex flex-col">
                                <div className="flex-grow">
                                    <h3 className="font-title text-2xl text-bosque">{pj.nombre_personaje}</h3>
                                    <p className="text-sm italic text-stone-600 mb-4">{pj.especie} {formattedClase} de Nivel {pj.nivel}</p>
                                    
                                    <div className="space-y-2 text-sm font-body border-t border-madera pt-4">
                                        <p className="flex items-center gap-2"><FaCoins className="text-yellow-500" /> <strong>Oro:</strong> {pj.oro}</p>
                                        <p className="flex items-center gap-2"><FaStar className="text-sky-500" /> <strong>Checkpoints:</strong> {pj.treasure_points}</p>
                                        <p className="flex items-center gap-2"><FaClock className="text-stone-500" /> <strong>Tiempo Libre:</strong> {pj.tiempo_libre} días</p>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-madera">
                                    <Button variant="dangerous" onClick={() => handleOpenDeleteAlert(pj)}><FaTrash /></Button>
                                    <Button variant="secondary" onClick={() => handleOpenEditModal(pj)}><FaPencilAlt /></Button>
                                    <Button variant="secondary" onClick={() => handleViewInventory(pj.id)}><FaScroll className="mr-2"/>Inventario</Button>
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