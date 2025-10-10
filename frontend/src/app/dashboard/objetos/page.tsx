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
import ObjectForm from './object-form';
import { FaSearch, FaTrash, FaPencilAlt, FaEye } from 'react-icons/fa';

// SOLUCIÓN 1: Eliminamos la definición local y usamos la centralizada.
import { Objeto } from '@/types';

export default function ObjetosPage() {
    const { user, accessToken, logout } = useAuth();
    const router = useRouter();

    const [objetos, setObjetos] = useState<Objeto[]>([]);
    const [selectedObject, setSelectedObject] = useState<Objeto | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // --- LÓGICA MEJORADA PARA MODALES ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    // Este estado guardará el objeto que estamos editando, o null si estamos creando uno nuevo.
    const [editingObject, setEditingObject] = useState<Objeto | null>(null);

    const fetchObjects = useCallback(async (page = 1, searchQuery = '') => {
        if (!accessToken) return;
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const params = new URLSearchParams({
            page: String(page),
            search: searchQuery,
        });
        const url = `${apiUrl}/api/objetos/?${params.toString()}`;
        try {
            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${accessToken}` } });
            if (!res.ok) {
                if (res.status === 401) logout();
                throw new Error('Error al cargar los datos');
            }
            const data = await res.json();
            setObjetos(data.results);
            setTotalPages(Math.ceil(data.count / 12));
            setCurrentPage(page);
            if (data.results.length > 0 && !selectedObject) {
                setSelectedObject(data.results[0]);
            } else if (data.results.length === 0) {
                setSelectedObject(null);
            }
        } catch (error) {
            console.error(error);
        }
    }, [accessToken, logout, selectedObject]);

    useEffect(() => {
        if (user?.is_staff) {
            fetchObjects(currentPage, searchTerm);
        }
    }, [user, currentPage, fetchObjects, searchTerm]);

    const handleSearch = () => { fetchObjects(1, searchTerm); };
    const handlePageChange = (newPage: number) => { fetchObjects(newPage, searchTerm); };
    
    // --- LÓGICA PARA ABRIR LOS MODALES ---
    const handleOpenCreateModal = () => {
        setEditingObject(null); // No hay datos iniciales para un objeto nuevo
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (objeto: Objeto) => {
        setEditingObject(objeto); // Pasamos los datos del objeto seleccionado
        setIsModalOpen(true);
    };

    // SOLUCIÓN 2: Una única función para guardar (Crear o Editar).
    const handleSaveObject = async (objectData: Objeto) => {
        if (!accessToken) return;
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        // Determinamos si es una petición de creación (POST) o edición (PUT)
        const isEditing = !!objectData.id;
        const url = isEditing ? `${apiUrl}/api/objetos/${objectData.id}/` : `${apiUrl}/api/objetos/`;
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify(objectData),
            });
            if (!res.ok) {
                throw new Error(`Error al ${isEditing ? 'actualizar' : 'crear'} el objeto`);
            }
            setIsModalOpen(false);
            setEditingObject(null);
            fetchObjects(currentPage, ''); // Recargar la tabla
        } catch (error) {
            console.error(error);
        }
    };
    
    const handleDelete = async () => {
        if (!selectedObject) return;
        if (confirm(`¿Estás seguro de que quieres eliminar "${selectedObject.Name}"?`)) {
            // ... (tu lógica de borrado no cambia)
        }
    };

    const tableHeaders = [
        { key: 'Name', label: 'Nombre' }, { key: 'Type', label: 'Tipo' },
        { key: 'Value', label: 'Costo' }, { key: 'Weight', label: 'Peso' },
        { key: 'Source', label: 'Fuente' },
    ];

    if (!user?.is_staff) {
        return <div className="p-8 font-title">Verificando acceso...</div>;
    }

    return (
        <div className="p-8 space-y-6">
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingObject ? "Editar Objeto" : "Crear Nuevo Objeto"}
            >
                <ObjectForm
                    onSave={handleSaveObject} // <- Ahora pasamos la función unificada
                    onCancel={() => setIsModalOpen(false)}
                    initialData={editingObject} // <- Pasamos los datos para edición
                />
            </Modal>

            {/* Crear y Buscar */}
            <div className="flex justify-end items-center gap-4">
                <Button variant="primary" onClick={handleOpenCreateModal}>
                    Crear Objeto
                </Button>
                {/* ... (resto del JSX de búsqueda) */}
            </div>

            {/* Tabla y Descripción */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2">
                    <Table data={objetos} headers={tableHeaders} onRowClick={(obj) => setSelectedObject(obj as Objeto)} />
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
                </div>

                <div className="lg:col-span-1">
                    {selectedObject ? (
                        <Card variant="primary" className="h-full flex flex-col">
                            <div>
                                <h3 className="font-title text-xl">{selectedObject.Name}</h3>
                                <p className="font-body text-xs italic text-stone-600">{selectedObject.Type}, {selectedObject.Rarity}</p>
                            </div>
                            <div className="font-body text-sm flex-grow mt-4 border-t pt-4 border-madera-oscura">
                                <p className="mt-4">{selectedObject.Text}</p>
                            </div>
                            <div className="flex justify-end gap-2 mt-auto pt-4">
                                <Button variant="dangerous" onClick={handleDelete}><FaTrash /></Button>
                                {/* Ahora el botón de editar funciona */}
                                <Button variant="secondary" onClick={() => handleOpenEditModal(selectedObject)}><FaPencilAlt /></Button>
                                <Button variant="secondary"><FaEye /></Button>
                            </div>
                        </Card>
                    ) : (
                        <Card variant="primary" className="h-full flex items-center justify-center">
                            <p className="text-stone-500">No hay objeto seleccionado.</p>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}

