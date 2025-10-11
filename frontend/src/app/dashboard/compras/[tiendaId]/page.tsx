'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Tienda, ObjetoTienda } from '@/types';
import { Personaje } from '@/types';
import Button from '@/components/button';
import Modal from '@/components/modal';
import { FaArrowLeft, FaCoins } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

export default function TiendaPage({ params }: { params: { tiendaId: string } }) {
    const { accessToken, user } = useAuth();
    const router = useRouter();
    const { tiendaId } = params;

    const [tienda, setTienda] = useState<Tienda | null>(null);
    const [personajes, setPersonajes] = useState<Personaje[]>([]);
    const [loading, setLoading] = useState(true);

    // Estado para el modal de compra
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [itemToBuy, setItemToBuy] = useState<ObjetoTienda | null>(null);
    const [selectedPersonajeId, setSelectedPersonajeId] = useState<string>('');
    const [cantidad, setCantidad] = useState(1);
    const [compraStatus, setCompraStatus] = useState<{ message: string, error: boolean } | null>(null);

    const fetchPageData = useCallback(async () => {
        if (!accessToken) return;
        setLoading(true);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        try {
            const [tiendaRes, personajesRes] = await Promise.all([
                fetch(`${apiUrl}/api/tiendas/${tiendaId}/`, { headers: { 'Authorization': `Bearer ${accessToken}` } }),
                fetch(`${apiUrl}/api/personajes/`, { headers: { 'Authorization': `Bearer ${accessToken}` } })
            ]);
            if (!tiendaRes.ok || !personajesRes.ok) throw new Error('Error al cargar datos');
            
            const tiendaData = await tiendaRes.json();
            const personajesData = await personajesRes.json();
            
            setTienda(tiendaData);
            setPersonajes(personajesData.results || personajesData);
            if (personajesData.results?.length > 0) {
                setSelectedPersonajeId(String(personajesData.results[0].id));
            }

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [accessToken, tiendaId]);

    useEffect(() => {
        fetchPageData();
    }, [fetchPageData]);

    const handleOpenBuyModal = (item: ObjetoTienda) => {
        setItemToBuy(item);
        setCantidad(1);
        setCompraStatus(null);
        setIsModalOpen(true);
    };

    const handleCompra = async () => {
        if (!itemToBuy || !selectedPersonajeId) return;
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        
        try {
            const res = await fetch(`${apiUrl}/api/personajes/${selectedPersonajeId}/comprar/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
                body: JSON.stringify({
                    objeto_tienda_id: itemToBuy.id,
                    cantidad: cantidad
                })
            });
            const data = await res.json();
            if (!res.ok) {
                setCompraStatus({ message: data.error || 'Ocurrió un error', error: true });
            } else {
                setCompraStatus({ message: data.success, error: false });
                await fetchPageData(); // Recargar datos para ver stock actualizado
            }
        } catch (error) {
            setCompraStatus({ message: 'Error de conexión', error: true });
        }
    };

    if (loading) return <div className="p-8 font-title">Abriendo la tienda...</div>;
    if (!tienda) return <div className="p-8 font-title">No se encontró la tienda.</div>;

    const getPrecio = (item: ObjetoTienda | null, asNumber = false) => {
        if (!item || item.precio_personalizado === null || item.precio_personalizado === undefined) {
            return asNumber ? 0 : '??';
        }
        return item.precio_personalizado;
    };

    return (
        <div className="p-8 space-y-6">
             <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Comprar ${itemToBuy?.nombre_objeto}`}>
                <div className="space-y-4">
                    <div>
                        <label className="block mb-1 font-semibold">¿Quién compra?</label>
                        <select value={selectedPersonajeId} onChange={e => setSelectedPersonajeId(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-stone-400 bg-white">
                            {personajes.map(p => <option key={p.id} value={p.id}>{p.nombre_personaje} (Oro: {p.oro})</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block mb-1 font-semibold">Cantidad (Stock: {itemToBuy?.stock})</label>
                        <input type="number" value={cantidad} onChange={e => setCantidad(Math.max(1, parseInt(e.target.value)))} min="1" max={itemToBuy?.stock} className="w-full px-4 py-2 rounded-lg border border-stone-400 bg-white" />
                    </div>
                    <p className="font-semibold text-right">Costo Total: {(getPrecio(itemToBuy, true) as number) * cantidad} <FaCoins className="inline text-yellow-500" /></p>
                    {compraStatus && <p className={compraStatus.error ? 'text-carmesi' : 'text-green-600'}>{compraStatus.message}</p>}
                    <div className="flex justify-end gap-4">
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={handleCompra}>Confirmar Compra</Button>
                    </div>
                </div>
            </Modal>

            <Button variant="secondary" onClick={() => router.back()} className="mb-4"><FaArrowLeft className="mr-2" />Volver a las Tiendas</Button>
            <h1 className="text-3xl font-title text-stone-800">{tienda.nombre}</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {tienda.inventario.map(item => (
                    <div key={item.id} className="p-4 border rounded-lg bg-white shadow">
                        <h4 className="font-bold">{item.nombre_objeto}</h4>
                        <p className="text-sm">Stock: {item.stock}</p>
                        <div className="flex justify-between items-center mt-2">
                            <p className="font-semibold">{getPrecio(item)} <FaCoins className="inline text-yellow-500" /></p>
                            <Button variant="primary" onClick={() => handleOpenBuyModal(item)} disabled={item.stock === 0}>Comprar</Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}