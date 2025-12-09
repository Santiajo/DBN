'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { InventarioItem, Objeto } from '@/types';
import Button from "@/components/button";
import Modal from '@/components/modal';
import ConfirmAlert from '@/components/confirm-alert';
import InventarioPersonajeForm, { InventarioPersonajeFormData } from './inventario-form';
import { FaPlus, FaTrash, FaPencilAlt, FaBoxOpen } from 'react-icons/fa';

export default function CharacterInventoryPage() {
    const { accessToken } = useAuth();
    const params = useParams();
    const personajeId = params.personajeId as string;

    const [inventory, setInventory] = useState<InventarioItem[]>([]);
    const [allObjects, setAllObjects] = useState<Objeto[]>([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<InventarioItem | null>(null);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<InventarioItem | null>(null);

    const fetchData = useCallback(async () => {
        if (!accessToken) return;
        try {
            const headers = { 'Authorization': `Bearer ${accessToken}` };
            
            const [resInv, resObj] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/inventario/?personaje=${personajeId}`, { headers }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/objetos/?page_size=1000`, { headers })
            ]);

            if (resInv.ok && resObj.ok) {
                const invData = await resInv.json();
                const objData = await resObj.json();
                
                setInventory(invData.results || invData);
                // Aseguramos que sea un array
                setAllObjects(Array.isArray(objData) ? objData : objData.results || []);
            }
        } catch (error) {
            console.error("Error cargando inventario:", error);
        } finally {
            setLoading(false);
        }
    }, [accessToken, personajeId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSave = async (data: InventarioPersonajeFormData) => {
        if (!accessToken) return;
        
        const isEditing = !!editingItem;
        const url = isEditing 
            ? `${process.env.NEXT_PUBLIC_API_URL}/api/inventario/${editingItem.id}/`
            : `${process.env.NEXT_PUBLIC_API_URL}/api/inventario/`;
        
        const method = isEditing ? 'PUT' : 'POST';
        
        const body = isEditing 
            ? { cantidad: data.cantidad } 
            : { personaje: parseInt(personajeId), objeto: parseInt(data.objeto), cantidad: data.cantidad };

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                setIsModalOpen(false);
                setEditingItem(null);
                fetchData();
            } else {
                const err = await res.json();
                alert(`Error: ${JSON.stringify(err)}`);
            }
        } catch (error) { console.error(error); }
    };

    const handleDelete = async () => {
        if (!itemToDelete || !accessToken) return;
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/inventario/${itemToDelete.id}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            fetchData();
        } catch (error) { console.error(error); } 
        finally { setIsAlertOpen(false); setItemToDelete(null); }
    };

    if (loading) return <div className="text-center py-10 font-title text-stone-500">Revisando mochila...</div>;

    return (
        <div className="space-y-6 font-body text-stone-800">
            <div className="flex justify-between items-center border-b border-madera-oscura/10 pb-4">
                <h2 className="text-2xl font-title text-madera-oscura flex items-center gap-2">
                    <FaBoxOpen /> Inventario
                </h2>
                <Button variant="primary" onClick={() => { setEditingItem(null); setIsModalOpen(true); }}>
                    <div className="flex items-center gap-2"><FaPlus /> Añadir Objeto</div>
                </Button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-madera-oscura bg-white shadow-sm">
                <table className="min-w-full text-left text-sm">
                    <thead className="bg-cuero text-white font-title uppercase">
                        <tr>
                            <th className="px-4 py-3">Objeto</th>
                            <th className="px-4 py-3 text-center w-32">Cantidad</th>
                            <th className="px-4 py-3 text-right w-32">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-madera-oscura/10">
                        {inventory.map((item) => (
                            <tr key={item.id} className="hover:bg-bosque hover:text-white transition-colors group">
                                <td className="px-4 py-3 font-semibold">
                                    {item.objeto_nombre}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <span className="bg-stone-100 text-stone-800 px-3 py-1 rounded-full font-bold text-xs border border-stone-200 group-hover:bg-white/20 group-hover:text-white group-hover:border-white/30">
                                        x{item.cantidad}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button 
                                            onClick={() => { setEditingItem(item); setIsModalOpen(true); }}
                                            className="p-2 text-stone-400 hover:text-white hover:bg-white/20 rounded transition-colors"
                                            title="Editar Cantidad"
                                        >
                                            <FaPencilAlt />
                                        </button>
                                        <button 
                                            onClick={() => { setItemToDelete(item); setIsAlertOpen(true); }}
                                            className="p-2 text-stone-400 hover:text-carmesi hover:bg-white rounded transition-colors"
                                            title="Eliminar"
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {inventory.length === 0 && (
                            <tr>
                                <td colSpan={3} className="px-4 py-12 text-center text-stone-500 italic">
                                    El inventario está vacío.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? "Editar Cantidad" : "Añadir Objeto"}>
                <InventarioPersonajeForm 
                    onSave={handleSave} 
                    onCancel={() => setIsModalOpen(false)} 
                    initialData={editingItem}
                    objetosList={allObjects}
                />
            </Modal>

            <ConfirmAlert 
                isOpen={isAlertOpen} 
                onClose={() => setIsAlertOpen(false)} 
                onConfirm={handleDelete} 
                title="Eliminar Objeto" 
                message={`¿Estás seguro de que quieres eliminar "${itemToDelete?.objeto_nombre}" del inventario?`} 
            />
        </div>
    );
}