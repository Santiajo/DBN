'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Card from "@/components/card";
import Input from "@/components/input";
import Button from "@/components/button";
import Pagination from '@/components/pagination';
import Modal from '@/components/modal';
import ObjectForm from './object-form';
import ConfirmAlert from '@/components/confirm-alert';
import { FaSearch, FaTrash, FaPencilAlt, FaEye, FaPlus, FaStore } from 'react-icons/fa';
import { Objeto } from '@/types';

const API_ENDPOINT = '/api/objetos/';
const PAGE_SIZE = 12;

export default function ObjetosPage() {
    const { user, accessToken, logout } = useAuth();
    const router = useRouter();

    const [objetos, setObjetos] = useState<Objeto[]>([]);
    const [selectedObject, setSelectedObject] = useState<Objeto | null>(null);
    
    // REF: Para romper el ciclo infinito de dependencias
    const selectedObjectRef = useRef<Objeto | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingObject, setEditingObject] = useState<Objeto | null>(null);
    const [isAlertOpen, setIsAlertOpen] = useState(false);

    // Sincronizar Ref con Estado
    useEffect(() => {
        selectedObjectRef.current = selectedObject;
    }, [selectedObject]);

    // Cargar Objetos (Ahora estable, sin depender de selectedObject)
    const fetchObjects = useCallback(async (page = 1, searchQuery = '') => {
        if (!accessToken) return;
        const params = new URLSearchParams({
            page: String(page),
            search: searchQuery,
        });
        const url = `${process.env.NEXT_PUBLIC_API_URL}${API_ENDPOINT}?${params.toString()}`;
        try {
            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${accessToken}` } });
            if (!res.ok) {
                if (res.status === 401) logout();
                throw new Error('Error al cargar los datos');
            }
            const data = await res.json();
            setObjetos(data.results);
            setTotalPages(Math.ceil(data.count / PAGE_SIZE));
            setCurrentPage(page);
            
            // Lógica de selección usando el Ref
            const currentSelected = selectedObjectRef.current;
            if (data.results.length > 0) {
                if (currentSelected) {
                    const stillExists = data.results.find((o: Objeto) => o.id === currentSelected.id);
                    if (stillExists) setSelectedObject(stillExists);
                    else setSelectedObject(data.results[0]);
                } else {
                    setSelectedObject(data.results[0]);
                }
            } else {
                setSelectedObject(null);
            }
        } catch (error) {
            console.error(error);
        }
    }, [accessToken, logout]); // <--- Dependencia eliminada: selectedObject

    useEffect(() => {
        if (user?.is_staff) {
            fetchObjects(currentPage, searchTerm);
        }
    }, [user, currentPage, fetchObjects, searchTerm]);

    const handleSearch = () => { fetchObjects(1, searchTerm); };
    const handlePageChange = (newPage: number) => { fetchObjects(newPage, searchTerm); };

    const handleOpenCreateModal = () => {
        setEditingObject(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (objeto: Objeto) => {
        setEditingObject(objeto);
        setIsModalOpen(true);
    };

    const handleSaveObject = async (objectData: Objeto) => {
        if (!accessToken) return;
        const isEditing = !!objectData.id;
        const url = isEditing 
            ? `${process.env.NEXT_PUBLIC_API_URL}${API_ENDPOINT}${objectData.id}/` 
            : `${process.env.NEXT_PUBLIC_API_URL}${API_ENDPOINT}`;
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
            if (!res.ok) throw new Error(`Error al guardar objeto`);
            
            const savedItem = await res.json();
            setIsModalOpen(false);
            setEditingObject(null);
            
            // Forzar selección y recargar
            setSelectedObject(savedItem);
            selectedObjectRef.current = savedItem;
            fetchObjects(currentPage, searchTerm);
        } catch (error) { console.error(error); }
    };

    const handleToggleStore = async (obj: Objeto) => {
        if (!accessToken) return;
        try {
            const newValue = !obj.in_tp_store;
            
            setObjetos(prev => prev.map(o => o.id === obj.id ? { ...o, in_tp_store: newValue } : o));
            if (selectedObject?.id === obj.id) setSelectedObject({ ...selectedObject, in_tp_store: newValue });

            await fetch(`${process.env.NEXT_PUBLIC_API_URL}${API_ENDPOINT}${obj.id}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify({ in_tp_store: newValue }),
            });
        } catch (error) {
            console.error("Error actualizando tienda:", error);
            fetchObjects(currentPage, searchTerm);
        }
    };

    const handleDelete = async () => { if (selectedObject) setIsAlertOpen(true); };

    const handleConfirmDelete = async () => {
        if (!selectedObject || !accessToken) return;
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}${API_ENDPOINT}${selectedObject.id}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${accessToken}` },
            });
            
            // Limpiar selección antes de recargar para evitar conflictos
            setSelectedObject(null);
            selectedObjectRef.current = null;
            
            fetchObjects(currentPage, searchTerm);
        } catch (error) { console.error(error); } 
        finally { setIsAlertOpen(false); }
    };

    if (!user?.is_staff) return <div className="p-8 font-title">Verificando acceso...</div>;

    return (
        <div className="p-8 space-y-6 font-body text-stone-800">
            {/* Header */}
            <div className="flex justify-end items-center gap-4">
                <Button variant="primary" onClick={handleOpenCreateModal}>
                    <div className="flex items-center gap-2"><FaPlus /> Crear Objeto</div>
                </Button>
                <div className="flex items-center gap-2 flex-grow max-w-xs">
                    <Input placeholder="Buscar objeto..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
                    <Button variant="secondary" onClick={handleSearch}><FaSearch /></Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Tabla */}
                <div className="lg:col-span-2">
                    <div className="overflow-x-auto rounded-xl border border-madera-oscura bg-white">
                        <table className="min-w-full text-left text-sm">
                            <thead className="bg-cuero text-white font-title uppercase">
                                <tr>
                                    <th className="px-4 py-3 w-12 text-center">Tienda</th>
                                    <th className="px-4 py-3">Nombre</th>
                                    <th className="px-4 py-3">Tipo</th>
                                    <th className="px-4 py-3">Rareza</th>
                                    <th className="px-4 py-3 text-center">Valor</th>
                                </tr>
                            </thead>
                            <tbody>
                                {objetos.map((obj, rowIndex) => {
                                    const isSelected = selectedObject?.id === obj.id;
                                    return (
                                        <tr
                                            key={obj.id || rowIndex}
                                            onClick={() => setSelectedObject(obj)}
                                            className={`
                                                cursor-pointer transition-colors duration-150
                                                ${isSelected 
                                                    ? 'bg-bosque text-white' 
                                                    : 'odd:bg-white even:bg-pergamino/60 hover:bg-bosque hover:text-white text-stone-800'
                                                }
                                            `}
                                        >
                                            <td className="px-4 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                                                <button 
                                                    onClick={() => handleToggleStore(obj)}
                                                    className={`p-2 rounded-full transition-colors hover:bg-white/20 ${
                                                        obj.in_tp_store 
                                                            ? 'text-yellow-500 drop-shadow-sm' 
                                                            : 'text-stone-300 hover:text-yellow-200'
                                                    }`}
                                                    title={obj.in_tp_store ? "En Tienda TP" : "Añadir a Tienda TP"}
                                                >
                                                    <FaStore />
                                                </button>
                                            </td>
                                            <td className="px-4 py-2 font-semibold">{obj.Name}</td>
                                            <td className="px-4 py-2">{obj.Type}</td>
                                            <td className="px-4 py-2">
                                                <span className={`text-xs px-2 py-0.5 rounded border ${
                                                    isSelected ? 'border-white/30 bg-white/10' : 'border-stone-300 bg-white/50'
                                                }`}>
                                                    {obj.Rarity}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2 text-center">{obj.Value}</td>
                                        </tr>
                                    );
                                })}
                                {objetos.length === 0 && (
                                    <tr><td colSpan={5} className="px-4 py-8 text-center text-stone-500 italic">No se encontraron objetos.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
                </div>

                {/* Detalle */}
                <div className="lg:col-span-1">
                    {selectedObject ? (
                        <Card variant="primary" className="h-full flex flex-col">
                            <div>
                                <div className="flex justify-between items-start">
                                    <h3 className="font-title text-xl text-stone-900">{selectedObject.Name}</h3>
                                    {selectedObject.in_tp_store && (
                                        <span className="bg-yellow-100 text-yellow-800 text-[10px] font-bold px-2 py-1 rounded border border-yellow-200 flex items-center gap-1">
                                            <FaStore /> EN TIENDA
                                        </span>
                                    )}
                                </div>
                                <p className="font-body text-xs italic text-stone-600 mt-1">
                                    {selectedObject.Type}, {selectedObject.Rarity} ({selectedObject.Attunement || 'No Attunement'})
                                </p>
                            </div>
                            
                            <div className="font-body text-sm flex-grow mt-4 border-t pt-4 border-madera-oscura/30">
                                <p className="whitespace-pre-wrap text-stone-800 mb-4">{selectedObject.Text}</p>
                                {selectedObject.Properties && (
                                    <p className="text-xs text-stone-600"><strong>Propiedades:</strong> {selectedObject.Properties}</p>
                                )}
                            </div>

                            <div className="flex justify-end gap-2 mt-auto pt-4">
                                <Button variant="dangerous" onClick={handleDelete}><FaTrash /></Button>
                                <Button variant="secondary" onClick={() => handleOpenEditModal(selectedObject)}><FaPencilAlt /></Button>
                                <Button 
                                    variant="secondary" 
                                    onClick={() => handleToggleStore(selectedObject)}
                                    className={selectedObject.in_tp_store ? 'bg-yellow-50 border-yellow-300 text-yellow-800' : ''}
                                >
                                    <FaStore className={selectedObject.in_tp_store ? 'text-yellow-600' : 'text-stone-400'} />
                                </Button>
                            </div>
                        </Card>
                    ) : (
                        <Card variant="primary" className="h-full flex items-center justify-center text-stone-500">
                            Selecciona un objeto para ver detalles
                        </Card>
                    )}
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingObject ? "Editar Objeto" : "Crear Nuevo Objeto"}>
                <ObjectForm onSave={handleSaveObject} onCancel={() => setIsModalOpen(false)} initialData={editingObject} />
            </Modal>

            <ConfirmAlert isOpen={isAlertOpen} onClose={() => setIsAlertOpen(false)} onConfirm={handleConfirmDelete} title="¿ESTÁS SEGURO?" message={`Esta acción no se puede deshacer. El objeto "${selectedObject?.Name}" se eliminará permanentemente.`} />
        </div>
    );
}