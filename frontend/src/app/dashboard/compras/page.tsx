'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Tienda } from '@/types'; // Asegúrate que la ruta a tus tipos sea correcta
import Card from "@/components/card";
import { FaStore } from 'react-icons/fa';

export default function ListaTiendasPage() {
    const { accessToken } = useAuth();
    const router = useRouter();
    const [tiendas, setTiendas] = useState<Tienda[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTiendas = useCallback(async () => {
        if (!accessToken) return;
        setLoading(true);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        try {
            const res = await fetch(`${apiUrl}/api/tiendas/`, {
                headers: { 'Authorization': `Bearer ${accessToken}` },
            });
            if (!res.ok) throw new Error('Error al cargar las tiendas');
            const data = await res.json();
            setTiendas(data.results || data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [accessToken]);

    useEffect(() => {
        fetchTiendas();
    }, [fetchTiendas]);

    if (loading) return <div className="p-8 font-title">Buscando tiendas abiertas...</div>;

    return (
        <div className="p-8 space-y-6">
            <h1 className="text-3xl font-title text-stone-800">Tiendas Disponibles</h1>
            {tiendas.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tiendas.map(tienda => (
                        <Card key={tienda.id} variant="primary" className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push(`/tiendas/${tienda.id}`)}>
                            <FaStore className="text-4xl text-bosque mb-4" />
                            <h3 className="font-title text-2xl">{tienda.nombre}</h3>
                            <p className="text-sm italic text-stone-600">Regentada por {tienda.npc_asociado}</p>
                            <p className="font-body text-sm mt-2">{tienda.descripcion}</p>
                        </Card>
                    ))}
                </div>
            ) : (
                <p>No hay tiendas disponibles en este momento.</p>
            )}
        </div>
    );
}