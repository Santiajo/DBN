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
import TrabajoForm from './trabajo-form';
import ConfirmAlert from '@/components/confirm-alert';
import { FaSearch, FaTrash, FaPencilAlt, FaEye } from 'react-icons/fa';
import { Trabajo, Habilidad } from '@/types';

export default function TrabajosPage() {
    const { user, accessToken, logout } = useAuth();
    const router = useRouter();

    const [trabajos, setTrabajos] = useState<Trabajo[]>([]);
    const [habilidades, setHabilidades] = useState<Habilidad[]>([]);
    const [selectedTrabajo, setSelectedTrabajo] = useState<Trabajo | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTrabajo, setEditingTrabajo] = useState<Trabajo | null>(null);
    const [isAlertOpen, setIsAlertOpen] = useState(false);

    // Fetch trabajos - IDÉNTICO a objetos
    const fetchTrabajos = useCallback(async (page = 1, searchQuery = '') => {
        if (!accessToken) return;
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const params = new URLSearchParams({
            page: String(page),
            search: searchQuery,
        });
        const url = `${apiUrl}/api/trabajos/?${params.toString()}`;
        try {
            const res = await fetch(url, { 
                headers: { 'Authorization': `Bearer ${accessToken}` } 
            });
            if (!res.ok) {
                if (res.status === 401) logout();
                throw new Error('Error al cargar los datos');
            }
            const data = await res.json();
            setTrabajos(data.results);
            setTotalPages(Math.ceil(data.count / 12));
            setCurrentPage(page);
            if (data.results.length > 0 && !selectedTrabajo) {
                setSelectedTrabajo(data.results[0]);
            } else if (data.results.length === 0) {
                setSelectedTrabajo(null);
            }
        } catch (error) {
            console.error('Error fetching trabajos:', error);
        }
    }, [accessToken, logout, selectedTrabajo]);

    // Fetch habilidades
    const fetchHabilidades = useCallback(async () => {
        if (!accessToken) return;
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        try {
            const res = await fetch(`${apiUrl}/api/habilidades/`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (res.ok) {
                const data = await res.json();
                setHabilidades(data.results || data);
            }
        } catch (error) {
            console.error('Error fetching habilidades:', error);
        }
    }, [accessToken]);

    useEffect(() => {
        if (user?.is_staff) {
            fetchTrabajos(currentPage, searchTerm);
            fetchHabilidades();
        }
    }, [user, currentPage, fetchTrabajos, fetchHabilidades, searchTerm]);

    const handleSearch = () => { fetchTrabajos(1, searchTerm); };
    const handlePageChange = (newPage: number) => { fetchTrabajos(newPage, searchTerm); };

    const handleOpenCreateModal = () => {
        setEditingTrabajo(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (trabajo: Trabajo) => {
        setEditingTrabajo(trabajo);
        setIsModalOpen(true);
    };

    const handleSaveTrabajo = async (trabajoData: Trabajo) => {
        if (!accessToken) return;
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const isEditing = !!trabajoData.id;
        const url = isEditing ? `${apiUrl}/api/trabajos/${trabajoData.id}/` : `${apiUrl}/api/trabajos/`;
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify(trabajoData),
            });
            if (!res.ok) {
                throw new Error(`Error al ${isEditing ? 'actualizar' : 'crear'} el trabajo`);
            }
            setIsModalOpen(false);
            setEditingTrabajo(null);
            fetchTrabajos(currentPage, '');
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async () => {
        if (!selectedTrabajo) return;
        setIsAlertOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedTrabajo || !accessToken) return;

        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        try {
            const res = await fetch(`${apiUrl}/api/trabajos/${selectedTrabajo.id}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${accessToken}` },
            });

            if (!res.ok) throw new Error('Error al eliminar el trabajo');

            if (trabajos.length === 1 && currentPage > 1) {
                fetchTrabajos(currentPage - 1, searchTerm);
            } else {
                fetchTrabajos(currentPage, searchTerm);
            }

            setSelectedTrabajo(null);

        } catch (error) {
            console.error('Error al eliminar el trabajo:', error);
        } finally {
            setIsAlertOpen(false);
        }
    };

    // HEADERS ESPECÍFICOS PARA TRABAJOS
    const tableHeaders = [
        { key: 'nombre', label: 'Nombre' },
        { key: 'requisito_habilidad_nombre', label: 'Habilidad Requerida' },
        { key: 'rango_maximo', label: 'Rango Máx' },
    ];

    if (!user?.is_staff) {
        return <div className="p-8 font-title">Verificando acceso...</div>;
    }

    return (
        <div className="p-8 space-y-6">
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingTrabajo ? "Editar Trabajo" : "Crear Nuevo Trabajo"}
            >
                <TrabajoForm
                    onSave={handleSaveTrabajo}
                    onCancel={() => setIsModalOpen(false)}
                    initialData={editingTrabajo}
                    habilidades={habilidades}
                />
            </Modal>

            <ConfirmAlert
                isOpen={isAlertOpen}
                onClose={() => setIsAlertOpen(false)}
                onConfirm={handleConfirmDelete}
                title="¿ESTÁS SEGURO?"
                message={`Esta acción no se puede deshacer. El trabajo "${selectedTrabajo?.nombre}" se eliminará permanentemente.`}
            />

            {/* CREAR Y BUSCAR - IDÉNTICO A OBJETOS */}
            <div className="flex justify-end items-center gap-4">
                <Button variant="primary" onClick={handleOpenCreateModal}>
                    Crear Trabajo
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

            {/* TABLA Y DESCRIPCIÓN - ESTRUCTURA IDÉNTICA */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2">
                    <Table 
                        data={trabajos} 
                        headers={tableHeaders} 
                        onRowClick={(trabajo) => setSelectedTrabajo(trabajo as Trabajo)} 
                    />
                    <Pagination 
                        currentPage={currentPage} 
                        totalPages={totalPages} 
                        onPageChange={handlePageChange} 
                    />
                </div>

                <div className="lg:col-span-1">
                    {selectedTrabajo ? (
                        <Card variant="primary" className="h-full flex flex-col">
                            <div>
                                <h3 className="font-title text-xl">{selectedTrabajo.nombre}</h3>
                                <p className="font-body text-xs italic text-stone-600">
                                    Habilidad: {selectedTrabajo.requisito_habilidad_nombre || 'N/A'} | Rango Máx: {selectedTrabajo.rango_maximo}
                                </p>
                            </div>
                            <div className="font-body text-sm flex-grow mt-4 border-t pt-4 border-madera-oscura">
                                <p className="mb-3"><strong>Descripción:</strong> {selectedTrabajo.descripcion}</p>
                                {selectedTrabajo.beneficio && (
                                    <p><strong>Beneficio:</strong> {selectedTrabajo.beneficio}</p>
                                )}
                            </div>
                            <div className="flex justify-end gap-2 mt-auto pt-4">
                                <Button variant="dangerous" onClick={handleDelete}><FaTrash /></Button>
                                <Button variant="secondary" onClick={() => handleOpenEditModal(selectedTrabajo)}><FaPencilAlt /></Button>
                                <Button variant="secondary"><FaEye /></Button>
                            </div>
                        </Card>
                    ) : (
                        <Card variant="primary" className="h-full flex items-center justify-center">
                            <p className="text-stone-500">No hay trabajo seleccionado.</p>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}