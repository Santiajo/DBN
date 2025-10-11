'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Personaje, InventarioItem, Objeto } from '@/types';
import Table from '@/components/table';
import Button from '@/components/button';
import Modal from '@/components/modal';
import ConfirmAlert from '@/components/confirm-alert';
import InventarioPersonajeForm, { InventarioPersonajeFormData } from './inventario-personaje-form';
import { FaPlus, FaPencilAlt, FaTrash, FaArrowLeft } from 'react-icons/fa';

export default function InventarioPersonajePage({ params }: { params: { personajeId: string } }) {
    const { accessToken, logout } = useAuth();
    const router = useRouter();
    const { personajeId } = params;

    const [personaje, setPersonaje] = useState<Personaje | null>(null);
    const [inventario, setInventario] = useState<InventarioItem[]>([]);
    const [allObjetos, setAllObjetos] = useState<Objeto[]>([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<InventarioItem | null>(null);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<InventarioItem | null>(null);

    const fetchPageData = useCallback(async () => {
        if (!accessToken) return;
        setLoading(true);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        try {
            const [personajeRes, inventarioRes, objetosRes] = await Promise.all([
                fetch(`${apiUrl}/api/personajes/${personajeId}/`, { headers: { 'Authorization': `Bearer ${accessToken}` } }),
                fetch(`${apiUrl}/api/personajes/${personajeId}/inventario/`, { headers: { 'Authorization': `Bearer ${accessToken}` } }),
                fetch(`${apiUrl}/api/objetos/?page_size=1000`, { headers: { 'Authorization': `Bearer ${accessToken}` } })
            ]);

            if (!personajeRes.ok || !inventarioRes.ok || !objetosRes.ok) throw new Error('Error al cargar datos');

            const personajeData = await personajeRes.json();
            const inventarioData = await inventarioRes.json();
            const objetosData = await objetosRes.json();

            setPersonaje(personajeData);
            setInventario(inventarioData.results || inventarioData);
            setAllObjetos(objetosData.results || objetosData);
        } catch (error) {
            console.error(error);
            if ((error as any).status === 401) logout();
        } finally {
            setLoading(false);
        }
    }, [accessToken, personajeId, logout]);

    useEffect(() => {
        fetchPageData();
    }, [fetchPageData]);

    const handleSaveItem = async (formData: InventarioPersonajeFormData) => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const isEditing = !!editingItem;
        const url = isEditing
            ? `${apiUrl}/api/personajes/${personajeId}/inventario/${editingItem.id}/`
            : `${apiUrl}/api/personajes/${personajeId}/inventario/`;
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
                body: JSON.stringify(formData),
            });
            if (!res.ok) throw new Error('Error al guardar el item');
            setIsModalOpen(false);
            await fetchPageData();
        } catch (error) {
            console.error(error);
        }
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        try {
            await fetch(`${apiUrl}/api/personajes/${personajeId}/inventario/${itemToDelete.id}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${accessToken}` },
            });
            await fetchPageData();
        } catch (error) {
            console.error('Error al eliminar el item:', error);
        } finally {
            setIsAlertOpen(false);
        }
    };

    const handleOpenAddModal = () => { setEditingItem(null); setIsModalOpen(true); };
    const handleOpenEditModal = (item: InventarioItem) => { setEditingItem(item); setIsModalOpen(true); };
    const handleOpenDeleteAlert = (item: InventarioItem) => { setItemToDelete(item); setIsAlertOpen(true); };

    const tableHeaders = [{ key: 'objeto_nombre', label: 'Objeto' }, { key: 'cantidad', label: 'Cantidad' }, { key: 'actions', label: 'Acciones' }];
    const tableData = inventario.map(item => ({
        ...item,
        actions: (
            <div className="flex gap-2">
                <Button variant="secondary" onClick={() => handleOpenEditModal(item)}><FaPencilAlt /></Button>
                <Button variant="dangerous" onClick={() => handleOpenDeleteAlert(item)}><FaTrash /></Button>
            </div>
        )
    }));
    
    if (loading) return <div className="p-8 font-title">Cargando la ficha del personaje...</div>;

    return (
        <div className="p-8 space-y-6">
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? 'Editar Cantidad' : 'Añadir Objeto al Inventario'}>
                <InventarioPersonajeForm onSave={handleSaveItem} onCancel={() => setIsModalOpen(false)} initialData={editingItem} objetosList={allObjetos} />
            </Modal>
            <ConfirmAlert isOpen={isAlertOpen} onClose={() => setIsAlertOpen(false)} onConfirm={handleConfirmDelete} title="¿QUITAR OBJETO?" message={`El objeto "${itemToDelete?.objeto_nombre}" se eliminará del inventario.`} />

            <div className="flex justify-between items-start">
                <div>
                    <Button variant="secondary" onClick={() => router.back()} className="mb-4"><FaArrowLeft className="mr-2" />Volver a Personajes</Button>
                    <h1 className="text-3xl font-title text-stone-800">Inventario de: <span className="text-bosque">{personaje?.nombre_personaje}</span></h1>
                    <p className="text-stone-600">Revisa y gestiona los objetos de tu personaje.</p>
                </div>
                <Button variant="primary" onClick={handleOpenAddModal} className="whitespace-nowrap"><FaPlus className="mr-2" />Añadir Objeto</Button>
            </div>

            <Table headers={tableHeaders} data={tableData} />
        </div>
    );
}