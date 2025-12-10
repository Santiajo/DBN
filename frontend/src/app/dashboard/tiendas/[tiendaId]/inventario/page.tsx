'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Tienda, ObjetoTienda, Objeto } from '@/types';
import Table from '@/components/table';
import Button from '@/components/button';
import Modal from '@/components/modal';
import ConfirmAlert from '@/components/confirm-alert';
import InventarioItemForm, { InventarioFormData } from './inventario-form';
import { FaPlus, FaPencilAlt, FaTrash, FaArrowLeft } from 'react-icons/fa';

export default function InventarioPage() {
    const { accessToken, logout } = useAuth();
    const router = useRouter();
    
    // --- OBTENCIÓN ROBUSTA DEL ID ---
    const params = useParams(); 
    
    // Intentamos obtener el ID de varias formas posibles para evitar errores por nombre de carpeta
    const tiendaId = (params?.tiendaId || params?.id || params?.slug) as string;

    const [tienda, setTienda] = useState<Tienda | null>(null);
    const [inventario, setInventario] = useState<ObjetoTienda[]>([]);
    const [allObjetos, setAllObjetos] = useState<Objeto[]>([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<ObjetoTienda | null>(null);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<ObjetoTienda | null>(null);

    // Debugging en consola para ver qué está pasando
    useEffect(() => {
        console.log("Params recibidos:", params);
        console.log("ID Tienda detectado:", tiendaId);
    }, [params, tiendaId]);

    const fetchPageData = useCallback(async () => {
        // VALIDACIÓN CRÍTICA: Si no hay ID o es "undefined", NO hacemos fetch
        if (!accessToken || !tiendaId || tiendaId === 'undefined') {
            return;
        }

        setLoading(true);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        
        try {
            const [tiendaRes, inventarioRes, objetosRes] = await Promise.all([
                fetch(`${apiUrl}/api/tiendas/${tiendaId}/`, { headers: { 'Authorization': `Bearer ${accessToken}` } }),
                fetch(`${apiUrl}/api/tiendas/${tiendaId}/inventario/`, { headers: { 'Authorization': `Bearer ${accessToken}` } }),
                fetch(`${apiUrl}/api/objetos/?page_size=1000`, { headers: { 'Authorization': `Bearer ${accessToken}` } }) 
            ]);

            if (!tiendaRes.ok || !inventarioRes.ok || !objetosRes.ok) {
                if ([tiendaRes.status, inventarioRes.status, objetosRes.status].includes(401)) logout();
                throw new Error('Error al cargar los datos');
            }
            const tiendaData = await tiendaRes.json();
            const inventarioData = await inventarioRes.json();
            const objetosData = await objetosRes.json();

            setTienda(tiendaData);
            setInventario(inventarioData.results || inventarioData);
            setAllObjetos(objetosData.results || objetosData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [accessToken, tiendaId, logout]);

    useEffect(() => {
        fetchPageData();
    }, [fetchPageData]);

    // --- Lógica CRUD ---

    const handleSaveItem = async (formData: InventarioFormData) => {
        if (!accessToken) return;
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const isEditing = !!editingItem;
        const url = isEditing
            ? `${apiUrl}/api/tiendas/${tiendaId}/inventario/${editingItem.id}/`
            : `${apiUrl}/api/tiendas/${tiendaId}/inventario/`;
        const method = isEditing ? 'PUT' : 'POST';

        const body = {
            ...formData,
            precio_personalizado: formData.precio_personalizado === '' ? null : Number(formData.precio_personalizado),
            stock: Number(formData.stock),
        };

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const errorData = await res.json();
                console.error("API Error:", errorData);
                throw new Error(`Error al ${isEditing ? 'actualizar' : 'añadir'} el item`);
            }
            setIsModalOpen(false);
            setEditingItem(null);
            await fetchPageData(); 
        } catch (error) {
            console.error(error);
        }
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete || !accessToken) return;
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        try {
            const res = await fetch(`${apiUrl}/api/tiendas/${tiendaId}/inventario/${itemToDelete.id}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${accessToken}` },
            });
            if (!res.ok) throw new Error('Error al eliminar el item');

            await fetchPageData(); 
        } catch (error) {
            console.error('Error al eliminar el item:', error);
        } finally {
            setIsAlertOpen(false);
            setItemToDelete(null);
        }
    };

    // --- Handlers ---
    const handleOpenAddModal = () => { setEditingItem(null); setIsModalOpen(true); };
    const handleOpenEditModal = (item: ObjetoTienda) => { setEditingItem(item); setIsModalOpen(true); };
    const handleOpenDeleteAlert = (item: ObjetoTienda) => { setItemToDelete(item); setIsAlertOpen(true); };

    const tableHeaders = [
        { key: 'nombre_objeto', label: 'Objeto' },
        { key: 'stock', label: 'Stock' },
        { key: 'precio_personalizado', label: 'Precio (Oro)' },
        { key: 'actions', label: 'Acciones' },
    ];

    const tableData = inventario.map(item => ({
        ...item,
        precio_personalizado: item.precio_personalizado || 'Por defecto',
        actions: (
            <div className="flex gap-2">
                <Button variant="secondary" onClick={() => handleOpenEditModal(item)}><FaPencilAlt /></Button>
                <Button variant="dangerous" onClick={() => handleOpenDeleteAlert(item)}><FaTrash /></Button>
            </div>
        )
    }));

    if (loading) return <div className="p-8 font-title">Cargando inventario...</div>;

    return (
        <div className="p-8 space-y-6">
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? 'Editar Item' : 'Añadir Item al Inventario'}>
                <InventarioItemForm
                    onSave={handleSaveItem}
                    onCancel={() => setIsModalOpen(false)}
                    initialData={editingItem}
                    objetosList={allObjetos}
                />
            </Modal>
            <ConfirmAlert
                isOpen={isAlertOpen}
                onClose={() => setIsAlertOpen(false)}
                onConfirm={handleConfirmDelete}
                title="¿ELIMINAR ESTE ITEM?"
                message={`Esta acción no se puede deshacer. El objeto "${itemToDelete?.nombre_objeto}" se eliminará del inventario de esta tienda.`}
            />

            <div className="flex items-center justify-between gap-4">
                <div>
                    <Button variant="secondary" onClick={() => router.back()} className="mb-4 whitespace-nowrap">
                        <FaArrowLeft className="mr-2" />
                        Volver
                    </Button>
                    <h1 className="text-3xl font-title text-stone-800">
                        Inventario de: <span className="text-bosque">{tienda?.nombre}</span>
                    </h1>
                    <p className="text-stone-600">Regentada por {tienda?.npc_asociado}</p>
                </div>
                <Button variant="primary" onClick={handleOpenAddModal} className="whitespace-nowrap">
                    <FaPlus className="mr-2" />
                    Añadir Objeto
                </Button>
            </div>

            <Table headers={tableHeaders} data={tableData} />
        </div>
    );
}


