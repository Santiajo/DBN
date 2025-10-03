'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Card from "@/components/card";
import Table from "@/components/table";
import Input from "@/components/input";
import Button from "@/components/button";
import Pagination from '@/components/pagination';
import { FaSearch, FaLink, FaTrash, FaPencilAlt, FaEye } from 'react-icons/fa';

// Tipo de dato para objetos
type Objeto = {
    id: number;
    Name: string;
    Type: string;
    Rarity: string;
    Value: string;
    Text: string;
    Attunement: string;
    Weight: string;
    Source: string;
};

export default function ObjetosPage() {
    const { user, accessToken, logout } = useAuth();
    const router = useRouter();

    const [objetos, setObjetos] = useState<Objeto[]>([]);
    const [selectedObject, setSelectedObject] = useState<Objeto | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalObjects, setTotalObjects] = useState(0);

    const fetchObjects = useCallback(async (page = 1, searchQuery = '') => {
        if (!accessToken) return;

        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const params = new URLSearchParams({
            page: String(page),
            search: searchQuery,
        });
        const url = `${apiUrl}/api/objetos/?${params.toString()}`;

        try {
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${accessToken}` },
            });

            if (!res.ok) {
                if (res.status === 401) logout();
                throw new Error('Error al cargar los datos');
            }

            const data = await res.json();

            setObjetos(data.results);
            setTotalObjects(data.count);
            setTotalPages(Math.ceil(data.count / 12));
            setCurrentPage(page);

            if (data.results.length > 0) {
                setSelectedObject(data.results[0]);
            } else {
                setSelectedObject(null);
            }
        } catch (error) {
            console.error(error);
        }
    }, [accessToken, logout]);

    useEffect(() => {
        if (user?.is_staff) {
            fetchObjects(currentPage, searchTerm);
        }
    }, [user, currentPage]);

    const handleSearch = () => {
        fetchObjects(1, searchTerm);
    };

    const handlePageChange = (newPage: number) => {
        fetchObjects(newPage, searchTerm);
    };

    const handleDelete = async () => {
        if (!selectedObject || !accessToken) return;

        if (confirm(`¿Estás seguro de que quieres eliminar "${selectedObject.Name}"?`)) {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL;
            try {
                await fetch(`${apiUrl}/api/objetos/${selectedObject.id}/`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                    },
                });
                fetchObjects();
            } catch (error) {
                console.error('Error al eliminar el objeto:', error);
            }
        }
    };

    const tableHeaders = [
        { key: 'Name', label: 'Nombre' },
        { key: 'Type', label: 'Tipo' },
        { key: 'Value', label: 'Costo' },
        { key: 'Weight', label: 'Peso' },
        { key: 'Source', label: 'Fuente' },
    ];

    // No mostrar nada hasta que se confirme que el usuario es staff
    if (!user?.is_staff) {
        return <div className="p-8 font-title">Verificando acceso...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Crear y Buscar */}
            <div className="flex justify-end items-center gap-4">
                <Button variant="primary">Crear Objeto</Button>
                <div className="flex items-center gap-2 flex-grow max-w-xs">
                    <Input
                        placeholder="Buscar por nombre exacto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Button variant="secondary" onClick={handleSearch}>
                        <FaSearch />
                    </Button>
                </div>
            </div>

            {/* Tabla a la izquierda, Descripción a la derecha */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                {/* Tabla */}
                <div className="lg:col-span-2">
                    {/* Tabla interactiva pasando una función onClick a las filas */}
                    <Table
                        headers={tableHeaders}
                        data={objetos}
                        onRowClick={(objeto) => setSelectedObject(objeto as Objeto)}
                    />
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                    />
                </div>

                {/* Descripción */}
                <div className="lg:col-span-1">
                    {selectedObject ? (
                        <Card variant="primary" className="h-full flex flex-col">
                            {/* Título y subtítulo como 5e.tools */}
                            <div>
                                <h3 className="font-title text-xl">{selectedObject.Name}</h3>
                                <p className="font-body text-xs italic text-stone-600">
                                    {selectedObject.Type}, {selectedObject.Rarity}
                                    {selectedObject.Attunement && ` (${selectedObject.Attunement})`}
                                </p>
                            </div>

                            <div className="font-body space-y-2 text-sm flex-grow mt-4 border-t pt-4 border-madera-oscura">
                                <p className="mt-4">{selectedObject.Text}</p>
                            </div>
                            <div className="flex justify-end gap-2 mt-auto pt-4">
                                <Button variant="dangerous" onClick={handleDelete}><FaTrash /></Button>
                                <Button variant="secondary"><FaPencilAlt /></Button>
                                <Button variant="secondary"><FaEye /></Button>
                            </div>
                        </Card>
                    ) : (
                        <Card variant="primary" className="h-full flex items-center justify-center">
                            <p className="text-stone-500">No se encontraron objetos o no hay ninguno seleccionado.</p>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}