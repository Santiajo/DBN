'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Tienda, ObjetoTienda } from '@/types';
import Table from '@/components/table';
import Button from '@/components/button';
import { FaPlus, FaPencilAlt, FaTrash, FaArrowLeft } from 'react-icons/fa';

// La página recibe `params` con los segmentos dinámicos de la URL
export default function InventarioPage({ params }: { params: { tiendaId: string } }) {
    const { accessToken, logout } = useAuth();
    const router = useRouter();
    const { tiendaId } = params;

    const [tienda, setTienda] = useState<Tienda | null>(null);
    const [inventario, setInventario] = useState<ObjetoTienda[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchInventario = useCallback(async () => {
        if (!accessToken) return;
        setLoading(true);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;

        try {
            // Usamos Promise.all para hacer ambas peticiones en paralelo
            const [tiendaRes, inventarioRes] = await Promise.all([
                fetch(`${apiUrl}/api/tiendas/${tiendaId}/`, {
                    headers: { 'Authorization': `Bearer ${accessToken}` },
                }),
                fetch(`${apiUrl}/api/tiendas/${tiendaId}/inventario/`, {
                    headers: { 'Authorization': `Bearer ${accessToken}` },
                })
            ]);

            if (!tiendaRes.ok || !inventarioRes.ok) {
                if (tiendaRes.status === 401 || inventarioRes.status === 401) logout();
                throw new Error('Error al cargar los datos del inventario');
            }

            const tiendaData = await tiendaRes.json();
            const inventarioData = await inventarioRes.json();
            
            setTienda(tiendaData);
            // La API anidada puede devolver paginación, nos aseguramos de coger `results` si existe
            setInventario(inventarioData.results || inventarioData);

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [accessToken, tiendaId, logout]);

    useEffect(() => {
        fetchInventario();
    }, [fetchInventario]);

    // Lógica para las futuras acciones del CRUD
    const handleAddItem = () => {
        console.log("Abrir modal para añadir item");
        // Aquí abrirías un modal para añadir un nuevo objeto al inventario
    };

    const handleEditItem = (item: ObjetoTienda) => {
        console.log("Editar item:", item);
        // Aquí abrirías un modal para editar el stock o precio del item
    };
    
    const handleDeleteItem = (item: ObjetoTienda) => {
        console.log("Eliminar item:", item);
        // Aquí mostrarías una alerta de confirmación para eliminar el item
    };

    const tableHeaders = [
        { key: 'nombre_objeto', label: 'Objeto' },
        { key: 'stock', label: 'Stock' },
        { key: 'precio_personalizado', label: 'Precio (Oro)' },
        { key: 'actions', label: 'Acciones' },
    ];

    // Mapeamos los datos para añadir la columna de acciones
    const tableData = inventario.map(item => ({
        ...item,
        precio_personalizado: item.precio_personalizado || 'Por defecto',
        actions: (
            <div className="flex gap-2">
                <Button variant="secondary" onClick={() => handleEditItem(item)}><FaPencilAlt /></Button>
                <Button variant="dangerous" onClick={() => handleDeleteItem(item)}><FaTrash /></Button>
            </div>
        )
    }));

    if (loading) {
        return <div className="p-8 font-title">Cargando inventario...</div>;
    }

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                     <Button variant="secondary" onClick={() => router.back()} className="mb-4">
                        <FaArrowLeft className="mr-2" />
                        Volver a Tiendas
                    </Button>
                    <h1 className="text-3xl font-title text-stone-800">
                        Inventario de: <span className="text-bosque">{tienda?.nombre}</span>
                    </h1>
                    <p className="text-stone-600">Regentada por {tienda?.npc_asociado}</p>
                </div>
                <Button variant="primary" onClick={handleAddItem}>
                    <FaPlus className="mr-2" />
                    Añadir Objeto
                </Button>
            </div>
            
            <Table
                headers={tableHeaders}
                data={tableData}
            />
        </div>
    );
}