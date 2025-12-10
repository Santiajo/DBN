'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Tienda, ObjetoTienda } from '@/types';
import { Personaje } from '@/types';
import Button from '@/components/button';
import Modal from '@/components/modal';
import { FaArrowLeft, FaCoins } from 'react-icons/fa';
import { useRouter, useParams } from 'next/navigation'; // <--- Importamos useParams

export default function TiendaPage() {
    const { accessToken, user } = useAuth();
    const router = useRouter();
    
    // CORRECCIÓN 1: Usar useParams para obtener el ID de forma segura en el cliente
    const params = useParams();
    const tiendaId = params?.tiendaId as string;

    const [tienda, setTienda] = useState<Tienda | null>(null);
    const [personajes, setPersonajes] = useState<Personaje[]>([]);
    const [loading, setLoading] = useState(true);

    // Estado para el modal de compra
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [itemToBuy, setItemToBuy] = useState<ObjetoTienda | null>(null);
    const [selectedPersonajeId, setSelectedPersonajeId] = useState<string>('');
    const [cantidad, setCantidad] = useState(1);
    const [compraStatus, setCompraStatus] = useState<{ message: string, error: boolean } | null>(null);

    // LOG DE INICIO
    useEffect(() => {
        console.log("--- TiendaPage Montado ---");
        console.log("ID Tienda detectado:", tiendaId);
        console.log("AccessToken disponible:", !!accessToken);
    }, [tiendaId, accessToken]);

    const fetchPageData = useCallback(async () => {
        if (!accessToken || !tiendaId) return;
        
        console.log("Iniciando fetchPageData...");
        setLoading(true);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        
        try {
            console.log(`Fetching tienda: ${apiUrl}/api/tiendas/${tiendaId}/`);
            console.log(`Fetching personajes: ${apiUrl}/api/personajes/`);

            const [tiendaRes, personajesRes] = await Promise.all([
                fetch(`${apiUrl}/api/tiendas/${tiendaId}/`, { headers: { 'Authorization': `Bearer ${accessToken}` } }),
                fetch(`${apiUrl}/api/personajes/`, { headers: { 'Authorization': `Bearer ${accessToken}` } })
            ]);

            if (!tiendaRes.ok) {
                console.error("Error al cargar tienda:", tiendaRes.status, tiendaRes.statusText);
                throw new Error('Error al cargar tienda');
            }
            if (!personajesRes.ok) {
                console.error("Error al cargar personajes:", personajesRes.status, personajesRes.statusText);
                throw new Error('Error al cargar personajes');
            }
            
            const tiendaData = await tiendaRes.json();
            const personajesData = await personajesRes.json();
            
            console.log("Datos Tienda recibidos:", tiendaData);
            console.log("Datos Personajes recibidos:", personajesData);

            setTienda(tiendaData);
            setPersonajes(personajesData.results || personajesData);
            
            // Seleccionar automáticamente el primer personaje si existe
            const listaPj = personajesData.results || personajesData;
            if (listaPj?.length > 0 && !selectedPersonajeId) {
                console.log("Pre-seleccionando personaje:", listaPj[0].id);
                setSelectedPersonajeId(String(listaPj[0].id));
            }

        } catch (error) {
            console.error("fetchPageData Error:", error);
        } finally {
            setLoading(false);
        }
    }, [accessToken, tiendaId, selectedPersonajeId]);

    useEffect(() => {
        fetchPageData();
    }, [fetchPageData]);

    const handleOpenBuyModal = (item: ObjetoTienda) => {
        console.log("Abriendo modal para item:", item);
        setItemToBuy(item);
        setCantidad(1);
        setCompraStatus(null);
        setIsModalOpen(true);
    };

    const handleCompra = async () => {
        console.log("Iniciando compra...");
        console.log("Item:", itemToBuy?.id);
        console.log("Personaje Comprador:", selectedPersonajeId);
        console.log("Cantidad:", cantidad);

        if (!itemToBuy || !selectedPersonajeId) {
            console.warn("Compra cancelada: Faltan datos (item o personaje)");
            return;
        }
        
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        
        try {
            const endpoint = `${apiUrl}/api/personajes/${selectedPersonajeId}/comprar/`;
            console.log("Endpoint compra:", endpoint);

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
                body: JSON.stringify({
                    objeto_tienda_id: itemToBuy.id,
                    cantidad: cantidad
                })
            });
            
            const data = await res.json();
            console.log("Respuesta compra:", data);

            if (!res.ok) {
                setCompraStatus({ message: data.error || 'Ocurrió un error', error: true });
            } else {
                setCompraStatus({ message: data.success || 'Compra realizada', error: false });
                await fetchPageData(); // Recargar datos para ver stock actualizado
            }
        } catch (error) {
            console.error("Error en handleCompra:", error);
            setCompraStatus({ message: 'Error de conexión', error: true });
        }
    };

    // Helper para precio seguro
    const getPrecio = (item: ObjetoTienda | null, asNumber = false) => {
        if (!item || item.precio_personalizado === null || item.precio_personalizado === undefined) {
            return asNumber ? 0 : '??';
        }
        return item.precio_personalizado;
    };

    // Validar carga
    if (loading) return <div className="p-8 font-title text-stone-600">Abriendo la tienda...</div>;
    
    // Validación si el ID de tienda era inválido o no existe
    if (!tienda) return <div className="p-8 font-title text-carmesi">Error: No se encontró la tienda (ID: {tiendaId}). Verifica la consola.</div>;

    return (
        <div className="p-8 space-y-6 font-body text-stone-800">
             
             {/* Modal de Compra */}
             <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Comprar ${itemToBuy?.nombre_objeto}`}>
                <div className="space-y-4">
                    <div>
                        <label className="block mb-1 font-semibold">¿Quién compra?</label>
                        <select 
                            value={selectedPersonajeId} 
                            onChange={e => setSelectedPersonajeId(e.target.value)} 
                            className="w-full px-4 py-2 rounded-lg border border-stone-400 bg-white focus:ring-2 focus:ring-bosque"
                        >
                            {personajes.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.nombre_personaje} (Oro: {p.oro})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block mb-1 font-semibold">Cantidad (Stock: {itemToBuy?.stock})</label>
                        <input 
                            type="number" 
                            value={cantidad} 
                            onChange={e => {
                                const val = parseInt(e.target.value);
                                if (!isNaN(val)) setCantidad(Math.max(1, Math.min(val, itemToBuy?.stock || 1)));
                            }} 
                            min="1" 
                            max={itemToBuy?.stock} 
                            className="w-full px-4 py-2 rounded-lg border border-stone-400 bg-white focus:ring-2 focus:ring-bosque" 
                        />
                    </div>
                    
                    <p className="font-semibold text-right text-lg">
                        Costo Total: <span className="text-yellow-600">{(getPrecio(itemToBuy, true) as number) * cantidad}</span> <FaCoins className="inline text-yellow-500" />
                    </p>
                    
                    {compraStatus && (
                        <div className={`p-3 rounded text-sm font-bold text-center ${compraStatus.error ? 'bg-carmesi/10 text-carmesi' : 'bg-bosque/10 text-bosque'}`}>
                            {compraStatus.message}
                        </div>
                    )}

                    <div className="flex justify-end gap-4 mt-4">
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={handleCompra}>Confirmar Compra</Button>
                    </div>
                </div>
            </Modal>

            {/* Cabecera */}
            <div>
                <Button variant="secondary" onClick={() => router.back()} className="mb-4">
                    <div className="flex items-center gap-2"><FaArrowLeft /> Volver a las Tiendas</div>
                </Button>
                <div className="border-b border-madera-oscura/20 pb-2">
                    <h1 className="text-4xl font-title text-stone-900 uppercase">{tienda.nombre}</h1>
                    <p className="text-stone-600 mt-1 italic">Regentada por <span className="font-semibold">{tienda.npc_asociado}</span></p>
                </div>
            </div>

            {/* Grid de Objetos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {tienda.inventario && tienda.inventario.length > 0 ? (
                    tienda.inventario.map(item => (
                        <div key={item.id} className="p-4 border border-stone-300 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full">
                            <div>
                                <h4 className="font-bold text-lg text-bosque mb-1">{item.nombre_objeto}</h4>
                                <p className="text-xs text-stone-500 font-bold uppercase tracking-wider mb-3">
                                    Stock: {item.stock}
                                </p>
                            </div>
                            
                            <div className="flex justify-between items-end border-t border-stone-100 pt-3 mt-2">
                                <div className="text-lg font-bold text-stone-800 flex items-center gap-1">
                                    {getPrecio(item)} <FaCoins className="text-yellow-500 text-sm" />
                                </div>
                                <Button 
                                    variant="primary" 
                                    onClick={() => handleOpenBuyModal(item)} 
                                    disabled={item.stock === 0}
                                    className={item.stock === 0 ? 'opacity-50 cursor-not-allowed bg-stone-400' : ''}
                                >
                                    {item.stock === 0 ? 'Agotado' : 'Comprar'}
                                </Button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full text-center py-12 text-stone-500 italic bg-stone-50 rounded-xl border-2 border-dashed border-stone-300">
                        Esta tienda no tiene productos en exhibición.
                    </div>
                )}
            </div>
        </div>
    );
}