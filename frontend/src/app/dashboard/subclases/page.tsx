'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Card from "@/components/card";
import SubclassesTable from "./subclasses-table";
import Input from "@/components/input";
import Button from "@/components/button";
import Pagination from '@/components/pagination';
import Modal from '@/components/modal';
import ConfirmAlert from '@/components/confirm-alert';
import { FaSearch, FaTrash, FaPencilAlt, FaEye, FaPlus } from 'react-icons/fa';
import { DnDSubclass, DnDSubclassPayload } from '@/types';
import SubclassForm from './subclass-form';

const API_ENDPOINT = '/api/subclasses/';
const PAGE_SIZE = 12;

export default function SubclassesPage() {
    const { user, accessToken, logout } = useAuth();
    const router = useRouter();

    const [subclasses, setSubclasses] = useState<DnDSubclass[]>([]);
    const [selectedSubclass, setSelectedSubclass] = useState<DnDSubclass | null>(null);
    const selectedSubclassRef = useRef<DnDSubclass | null>(null); // Ref para evitar bucles en useEffect

    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSubclass, setEditingSubclass] = useState<DnDSubclass | null>(null);
    const [isAlertOpen, setIsAlertOpen] = useState(false);

    // Sincronizar Ref
    useEffect(() => {
        selectedSubclassRef.current = selectedSubclass;
    }, [selectedSubclass]);

    const fetchSubclasses = useCallback(async (page = 1, searchQuery = '') => {
        if (!accessToken) return;
        try {
            const params = new URLSearchParams({ page: String(page), search: searchQuery });
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${API_ENDPOINT}?${params}`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            
            if (!res.ok) {
                if (res.status === 401) logout();
                throw new Error('Error fetching subclasses');
            }
            
            const data = await res.json();
            setSubclasses(data.results);
            setTotalPages(Math.ceil(data.count / PAGE_SIZE));
            setCurrentPage(page);

            // Lógica de selección estable con Ref
            const currentSelected = selectedSubclassRef.current;
            if (currentSelected) {
                const stillExists = data.results.find((s: DnDSubclass) => s.id === currentSelected.id);
                if (stillExists) setSelectedSubclass(stillExists);
                else if (data.results.length > 0) setSelectedSubclass(data.results[0]);
                else setSelectedSubclass(null);
            } else if (data.results.length > 0) {
                setSelectedSubclass(data.results[0]);
            }

        } catch (error) {
            console.error(error);
        }
    }, [accessToken, logout]);

    useEffect(() => {
        if (user?.is_staff) fetchSubclasses(currentPage, searchTerm);
    }, [user, currentPage, fetchSubclasses, searchTerm]);

    const handleSave = async (payload: DnDSubclassPayload) => {
        if (!accessToken) return;
        const isEditing = !!payload.id;
        const url = isEditing 
            ? `${process.env.NEXT_PUBLIC_API_URL}${API_ENDPOINT}${payload.slug}/`
            : `${process.env.NEXT_PUBLIC_API_URL}${API_ENDPOINT}`;
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error('Error saving subclass');
            
            const savedItem = await res.json();
            setIsModalOpen(false);
            setEditingSubclass(null);
            
            // Forzar selección y recargar
            setSelectedSubclass(savedItem);
            selectedSubclassRef.current = savedItem;
            fetchSubclasses(currentPage, searchTerm);
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async () => {
        if (!selectedSubclass || !accessToken) return;
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}${API_ENDPOINT}${selectedSubclass.slug}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            setSelectedSubclass(null);
            selectedSubclassRef.current = null;
            fetchSubclasses(currentPage, searchTerm);
        } catch (error) {
            console.error(error);
        } finally {
            setIsAlertOpen(false);
        }
    };

    if (!user?.is_staff) return <div className="p-8">Acceso denegado</div>;

    return (
        <div className="p-8 space-y-6 font-body text-stone-800">
            {/* Header */}
            <div className="flex justify-end items-center gap-4">
                <Button variant="primary" onClick={() => { setEditingSubclass(null); setIsModalOpen(true); }}>
                    <div className="flex items-center gap-2"><FaPlus /> Crear Subclase</div>
                </Button>
                <div className="flex items-center gap-2 flex-grow max-w-xs">
                    <Input placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    <Button variant="secondary" onClick={() => fetchSubclasses(1, searchTerm)}><FaSearch /></Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Tabla Izquierda */}
                <div className="lg:col-span-2">
                    <SubclassesTable 
                        data={subclasses} 
                        onRowClick={setSelectedSubclass} 
                        selectedId={selectedSubclass?.id}
                    />
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(p) => fetchSubclasses(p, searchTerm)} />
                </div>

                {/* Panel Detalle Derecha */}
                <div className="lg:col-span-1">
                    {selectedSubclass ? (
                        <Card variant="primary" className="h-full flex flex-col">
                            <div>
                                <h3 className="font-title text-2xl text-stone-900">{selectedSubclass.name}</h3>
                                <div className="mt-1 text-sm text-stone-600 flex items-center gap-2">
                                    <span className="font-semibold">Clase Padre:</span>
                                    <span className="bg-white/50 px-2 py-0.5 rounded border border-madera-oscura/20">
                                        {selectedSubclass.dnd_class_name}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="font-body text-sm flex-grow mt-4 border-t pt-4 border-madera-oscura/30">
                                <p className="whitespace-pre-wrap text-stone-800 mb-4">{selectedSubclass.description}</p>
                                
                                <div className="space-y-2 bg-white/40 p-3 rounded border border-madera-oscura/10 text-sm">
                                    <p><strong className="text-madera-oscura">Fuente:</strong> {selectedSubclass.source}</p>
                                    {selectedSubclass.bonus_proficiencies && (
                                        <p><strong className="text-madera-oscura">Proficiencias:</strong> {selectedSubclass.bonus_proficiencies}</p>
                                    )}
                                    {selectedSubclass.skill_choices.length > 0 && (
                                        <p><strong className="text-madera-oscura">Skills Extra:</strong> Elige {selectedSubclass.skill_choices_count}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-auto pt-6">
                                <Button variant="dangerous" onClick={() => setIsAlertOpen(true)}><FaTrash /></Button>
                                <Button variant="secondary" onClick={() => { setEditingSubclass(selectedSubclass); setIsModalOpen(true); }}><FaPencilAlt /></Button>
                                
                                {/* Botón Navegación Detalle (Tabla Niveles) */}
                                <Button 
                                    variant="secondary" 
                                    onClick={() => router.push(`/dashboard/subclases/${selectedSubclass.slug}`)} 
                                    title="Ver Tabla de Progresión"
                                >
                                    <div className="flex items-center gap-2">
                                        <FaEye /> <span className="text-sm">Ver Niveles</span>
                                    </div>
                                </Button>
                            </div>
                        </Card>
                    ) : (
                        <Card variant="primary" className="h-full flex items-center justify-center text-stone-500">
                            Selecciona una subclase
                        </Card>
                    )}
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingSubclass ? "Editar Subclase" : "Nueva Subclase"}>
                <SubclassForm onSave={handleSave} onCancel={() => setIsModalOpen(false)} initialData={editingSubclass} />
            </Modal>

            <ConfirmAlert isOpen={isAlertOpen} onClose={() => setIsAlertOpen(false)} onConfirm={handleDelete} title="Eliminar Subclase" message="¿Estás seguro? Se eliminarán todos sus rasgos y recursos." />
        </div>
    );
}