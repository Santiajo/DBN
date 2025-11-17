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
import SpeciesForm from './species-form';
import ConfirmAlert from '@/components/confirm-alert';
import { FaSearch, FaTrash, FaPencilAlt, FaEye } from 'react-icons/fa';
import { DnDSpecies } from '@/types';

// Configuración de la API
const API_ENDPOINT = '/api/species/'; // Endpoint base de la API de especies
const PAGE_SIZE = 12; // Cuántos items por página (ajústalo a tu 'pagination_class' de Django)

export default function SpeciesPage() {
    const { user, accessToken, logout } = useAuth();
    const router = useRouter();

    // --- Estados adaptados para Especies ---
    const [species, setSpecies] = useState<DnDSpecies[]>([]);
    const [selectedSpecies, setSelectedSpecies] = useState<DnDSpecies | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSpecies, setEditingSpecies] = useState<DnDSpecies | null>(null);

    const [isAlertOpen, setIsAlertOpen] = useState(false);

    // --- Función de Carga de Datos ---
    const fetchSpecies = useCallback(async (page = 1, searchQuery = '') => {
        if (!accessToken) return;
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const params = new URLSearchParams({
            page: String(page),
            search: searchQuery,
        });
        const url = `${apiUrl}${API_ENDPOINT}?${params.toString()}`;

        try {
            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${accessToken}` } });
            if (!res.ok) {
                if (res.status === 401) logout();
                throw new Error('Error al cargar las especies');
            }
            const data = await res.json();
            setSpecies(data.results);
            setTotalPages(Math.ceil(data.count / PAGE_SIZE));
            setCurrentPage(page);

            // Lógica para seleccionar el primer item
            if (data.results.length > 0 && !selectedSpecies) {
                setSelectedSpecies(data.results[0]);
            } else if (data.results.length === 0) {
                setSelectedSpecies(null);
            }
        } catch (error) {
            console.error(error);
        }
    }, [accessToken, logout, selectedSpecies]);

    useEffect(() => {
        // Solo carga los datos si el usuario es staff
        if (user?.is_staff) {
            fetchSpecies(currentPage, searchTerm);
        }
    }, [user, currentPage, fetchSpecies, searchTerm]);

    const handleSearch = () => { fetchSpecies(1, searchTerm); };
    const handlePageChange = (newPage: number) => { fetchSpecies(newPage, searchTerm); };

    // --- Manejo del Modal (Crear/Editar) ---
    const handleOpenCreateModal = () => {
        setEditingSpecies(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (species: DnDSpecies) => {
        setEditingSpecies(species);
        setIsModalOpen(true);
    };

    const handleSaveSpecies = async (speciesData: Partial<DnDSpecies>) => {
        if (!accessToken) return;
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        
        const isEditing = !!speciesData.id;
        const url = isEditing 
            ? `${apiUrl}${API_ENDPOINT}${speciesData.slug}/` 
            : `${apiUrl}${API_ENDPOINT}`;
        
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify(speciesData),
            });
            if (!res.ok) {
                const errorData = await res.json();
                console.error("Error al guardar:", errorData);
                throw new Error(`Error al ${isEditing ? 'actualizar' : 'crear'} la especie`);
            }
            setIsModalOpen(false);
            setEditingSpecies(null);
            fetchSpecies(currentPage, ''); // Recarga la lista
        } catch (error) {
            console.error(error);
        }
    };

    // --- Manejo de Eliminación ---
    const handleDelete = () => {
        if (!selectedSpecies) return;
        setIsAlertOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedSpecies || !accessToken) return;

        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        try {
            const res = await fetch(`${apiUrl}${API_ENDPOINT}${selectedSpecies.slug}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${accessToken}` },
            });

            if (!res.ok) throw new Error('Error al eliminar la especie');

            if (species.length === 1 && currentPage > 1) {
                fetchSpecies(currentPage - 1, searchTerm);
            } else {
                fetchSpecies(currentPage, searchTerm);
            }
            setSelectedSpecies(null);

        } catch (error) {
            console.error('Error al eliminar la especie:', error);
        } finally {
            setIsAlertOpen(false);
        }
    };

    const tableHeaders = [
        { key: 'name', label: 'Nombre' },
        { key: 'creature_type', label: 'Tipo' },
        { key: 'size', label: 'Tamaño' },
        { key: 'walking_speed', label: 'Vel.' },
    ];

    if (!user?.is_staff) {
        return <div className="p-8 font-title">Verificando acceso...</div>;
    }

    return (
        <div className="p-8 space-y-6">
            {/* Modal para Crear/Editar */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingSpecies ? "Editar Especie" : "Crear Nueva Especie"}
            >
                <SpeciesForm
                    onSave={handleSaveSpecies}
                    onCancel={() => setIsModalOpen(false)}
                    initialData={editingSpecies}
                />
            </Modal>

            {/* Alerta de Confirmación de Borrado */}
            <ConfirmAlert
                isOpen={isAlertOpen}
                onClose={() => setIsAlertOpen(false)}
                onConfirm={handleConfirmDelete}
                title="¿ESTÁS SEGURO?"
                message={`Esta acción no se puede deshacer. La especie "${selectedSpecies?.name}" se eliminará permanentemente.`}
            />

            {/* Cabecera: Crear y Buscar */}
            <div className="flex justify-end items-center gap-4">
                <Button variant="primary" onClick={handleOpenCreateModal}>
                    Crear Especie
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

            {/* Cuerpo: Tabla y Panel de Detalles */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* Columna Izquierda: Tabla y Paginación */}
                <div className="lg:col-span-2">
                    <Table 
                        data={species} 
                        headers={tableHeaders} 
                        onRowClick={(sp) => setSelectedSpecies(sp as DnDSpecies)} 
                    />
                    <Pagination 
                        currentPage={currentPage} 
                        totalPages={totalPages} 
                        onPageChange={handlePageChange} 
                    />
                </div>

                {/* Columna Derecha: Panel de Detalles */}
                <div className="lg:col-span-1">
                    {selectedSpecies ? (
                        <Card variant="primary" className="h-full flex flex-col">
                            <div>
                                <h3 className="font-title text-xl">{selectedSpecies.name}</h3>
                                <p className="font-body text-xs italic text-stone-600">
                                    {selectedSpecies.creature_type}, {selectedSpecies.size}
                                </p>
                            </div>
                            <div className="font-body text-sm flex-grow mt-4 border-t pt-4 border-madera-oscura">
                                <p className="mt-4 whitespace-pre-wrap">{selectedSpecies.description}</p>
                            </div>
                            <div className="flex justify-end gap-2 mt-auto pt-4">
                                <Button variant="dangerous" onClick={handleDelete}><FaTrash /></Button>
                                <Button variant="secondary" onClick={() => handleOpenEditModal(selectedSpecies)}><FaPencilAlt /></Button>
                                {/* Este botón ahora navega a la página de detalles de la especie */}
                                <Button variant="secondary" onClick={() => router.push(`/species/${selectedSpecies.slug}`)}>
                                    <FaEye />
                                </Button>
                            </div>
                        </Card>
                    ) : (
                        <Card variant="primary" className="h-full flex items-center justify-center">
                            <p className="text-stone-500">No hay especie seleccionada.</p>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}

// Para evitar errores