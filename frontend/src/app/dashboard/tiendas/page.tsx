'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Card from "@/components/card";
import Table from "@/components/table";
import Input from "@/components/input";
import Button from "@/components/button";
import Pagination from '@/components/pagination';
import Modal from '@/components/modal';
import TiendaForm from './tienda-form';
import ConfirmAlert from '@/components/confirm-alert';
import { FaSearch, FaTrash, FaPencilAlt, FaEye } from 'react-icons/fa';
import { Tienda } from '@/types';

export default function TiendasPage() {
    const { user, accessToken, logout } = useAuth();
    const router = useRouter();

    // --- Estados para Tiendas ---
    const [tiendas, setTiendas] = useState<Tienda[]>([]);
    const [selectedTienda, setSelectedTienda] = useState<Tienda | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTienda, setEditingTienda] = useState<Tienda | null>(null);

    const [isAlertOpen, setIsAlertOpen] = useState(false);

    // --- Lógica de fetch adaptada para Tiendas ---
    const fetchTiendas = useCallback(async (page = 1, searchQuery = '') => {
        if (!accessToken) return;
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const params = new URLSearchParams({
            page: String(page),
            search: searchQuery,
        });
        const url = `${apiUrl}/api/tiendas/?${params.toString()}`; // Endpoint de tiendas
        try {
            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${accessToken}` } });
            if (!res.ok) {
                if (res.status === 401) logout();
                throw new Error('Error al cargar los datos de las tiendas');
            }
            const data = await res.json();
            setTiendas(data.results);
            setTotalPages(Math.ceil(data.count / 12)); // Ajusta el divisor si cambia el page_size
            setCurrentPage(page);
            if (data.results.length > 0 && !selectedTienda) {
                setSelectedTienda(data.results[0]);
            } else if (data.results.length === 0) {
                setSelectedTienda(null);
            }
        } catch (error) {
            console.error(error);
        }
    }, [accessToken, logout, selectedTienda]);

    useEffect(() => {
        if (user?.is_staff) {
            fetchTiendas(currentPage, searchTerm);
        }
    }, [user, currentPage, fetchTiendas, searchTerm]);

    const handleSearch = () => { fetchTiendas(1, searchTerm); };
    const handlePageChange = (newPage: number) => { fetchTiendas(newPage, searchTerm); };

    // --- Lógica de Modales y CRUD adaptada para Tiendas ---
    const handleOpenCreateModal = () => {
        setEditingTienda(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (tienda: Tienda) => {
        setEditingTienda(tienda);
        setIsModalOpen(true);
    };

    const handleSaveTienda = async (tiendaData: Omit<Tienda, 'id' | 'inventario'>) => {
        if (!accessToken) return;
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const isEditing = !!editingTienda?.id;
        const url = isEditing ? `${apiUrl}/api/tiendas/${editingTienda.id}/` : `${apiUrl}/api/tiendas/`;
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
                body: JSON.stringify(tiendaData),
            });
            if (!res.ok) {
                const errorData = await res.json();
                console.error('Error response:', errorData);
                throw new Error(`Error al ${isEditing ? 'actualizar' : 'crear'} la tienda`);
            }
            setIsModalOpen(false);
            setEditingTienda(null);
            fetchTiendas(currentPage, '');
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async () => {
        if (!selectedTienda) return;
        setIsAlertOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedTienda || !accessToken) return;
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        try {
            const res = await fetch(`${apiUrl}/api/tiendas/${selectedTienda.id}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${accessToken}` },
            });
            if (!res.ok) throw new Error('Error al eliminar la tienda');
            
            if (tiendas.length === 1 && currentPage > 1) {
                fetchTiendas(currentPage - 1, searchTerm);
            } else {
                fetchTiendas(currentPage, searchTerm);
            }
            setSelectedTienda(null);
        } catch (error) {
            console.error('Error al eliminar la tienda:', error);
        } finally {
            setIsAlertOpen(false);
        }
    };

    // Navegar al inventario de la tienda seleccionada
    const handleViewInventory = (tiendaId: number) => {
        router.push(`/dashboard/tiendas/${tiendaId}/inventario`);
    };

    const tableHeaders = [
        { key: 'nombre', label: 'Nombre' },
        { key: 'npc_asociado', label: 'Regente' },
    ];

    if (!user?.is_staff) {
        return <div className="p-8 font-title">Verificando acceso...</div>;
    }

    return (
        <div className="p-8 space-y-6">
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingTienda ? "Editar Tienda" : "Crear Nueva Tienda"}
            >
                <TiendaForm
                    onSave={handleSaveTienda}
                    onCancel={() => setIsModalOpen(false)}
                    initialData={editingTienda}
                />
            </Modal>

            <ConfirmAlert
                isOpen={isAlertOpen}
                onClose={() => setIsAlertOpen(false)}
                onConfirm={handleConfirmDelete}
                title="¿ESTÁS SEGURO?"
                message={`Esta acción no se puede deshacer. La tienda "${selectedTienda?.nombre}" se eliminará permanentemente.`}
            />

            {/* Crear y Buscar */}
            <div className="flex justify-end items-center gap-4">
                <Button variant="primary" onClick={handleOpenCreateModal}>
                    Crear Tienda
                </Button>
                <div className="flex items-center gap-2 flex-grow max-w-xs">
                    <Input
                        placeholder="Buscar por nombre..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <Button variant="secondary" onClick={handleSearch}>
                        <FaSearch />
                    </Button>
                </div>
            </div>

            {/* Tabla y Tarjeta de Detalles */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2">
                    <Table data={tiendas} headers={tableHeaders} onRowClick={(tienda) => setSelectedTienda(tienda as Tienda)} />
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
                </div>

                <div className="lg:col-span-1">
                    {selectedTienda ? (
                        <Card variant="primary" className="h-full flex flex-col">
                            <div>
                                <h3 className="font-title text-xl">{selectedTienda.nombre}</h3>
                                <p className="font-body text-xs italic text-stone-600">
                                    Regentada por: {selectedTienda.npc_asociado || 'Desconocido'}
                                </p>
                            </div>
                            <div className="font-body text-sm flex-grow mt-4 border-t pt-4 border-madera-oscura">
                                <p>{selectedTienda.descripcion || 'Sin descripción.'}</p>
                                
                                <h4 className="font-semibold mt-4 mb-2">Inventario ({selectedTienda.inventario.length} items)</h4>
                                <ul className="list-disc list-inside text-xs max-h-40 overflow-y-auto scrollbar-custom">
                                    {selectedTienda.inventario.length > 0 ? (
                                        selectedTienda.inventario.map(item => (
                                            <li key={item.id}>{item.nombre_objeto} (Stock: {item.stock})</li>
                                        ))
                                    ) : (
                                        <li>Inventario vacío.</li>
                                    )}
                                </ul>
                            </div>
                            <div className="flex justify-end gap-2 mt-auto pt-4">
                                <Button variant="dangerous" onClick={handleDelete}><FaTrash /></Button>
                                <Button variant="secondary" onClick={() => handleOpenEditModal(selectedTienda)}><FaPencilAlt /></Button>
                                <Button variant="secondary" onClick={() => handleViewInventory(selectedTienda.id)}><FaEye /> Ver Inventario</Button>
                            </div>
                        </Card>
                    ) : (
                        <Card variant="primary" className="h-full flex items-center justify-center">
                            <p className="text-stone-500">Selecciona una tienda para ver sus detalles.</p>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}