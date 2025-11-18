'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Card from "@/components/card";
import Input from "@/components/input";
import Button from "@/components/button";
import Pagination from '@/components/pagination';
import Modal from '@/components/modal';
import ConfirmAlert from '@/components/confirm-alert';
import { FaSearch, FaTrash, FaPencilAlt, FaEye, FaPlus } from 'react-icons/fa';
import { DnDClass, DnDClassPayload } from '@/types';
import ClassForm from './class-form';

const API_ENDPOINT = '/api/classes/';
const PAGE_SIZE = 12;

export default function ClassesPage() {
    const { user, accessToken, logout } = useAuth();
    const router = useRouter();

    const [classes, setClasses] = useState<DnDClass[]>([]);
    const [selectedClass, setSelectedClass] = useState<DnDClass | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClass, setEditingClass] = useState<DnDClass | null>(null);
    const [isAlertOpen, setIsAlertOpen] = useState(false);

    const fetchClasses = useCallback(async (page = 1, searchQuery = '') => {
        if (!accessToken) return;
        try {
            const params = new URLSearchParams({ page: String(page), search: searchQuery });
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${API_ENDPOINT}?${params}`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            
            if (!res.ok) {
                if (res.status === 401) logout();
                throw new Error('Error fetching classes');
            }
            
            const data = await res.json();
            setClasses(data.results);
            setTotalPages(Math.ceil(data.count / PAGE_SIZE));
            setCurrentPage(page);

            if (selectedClass) {
                const stillExists = data.results.find((c: DnDClass) => c.id === selectedClass.id);
                if (stillExists) setSelectedClass(stillExists);
                else if (data.results.length > 0) setSelectedClass(data.results[0]);
            } else if (data.results.length > 0) {
                setSelectedClass(data.results[0]);
            }

        } catch (error) {
            console.error(error);
        }
    }, [accessToken, logout, selectedClass]);

    useEffect(() => {
        if (user?.is_staff) fetchClasses(currentPage, searchTerm);
    }, [user, currentPage, fetchClasses, searchTerm]);

    const handleSaveClass = async (classData: DnDClassPayload) => {
        if (!accessToken) return;
        const isEditing = !!classData.id;
        const url = isEditing 
            ? `${process.env.NEXT_PUBLIC_API_URL}${API_ENDPOINT}${classData.slug}/`
            : `${process.env.NEXT_PUBLIC_API_URL}${API_ENDPOINT}`;
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify(classData),
            });

            if (!res.ok) throw new Error('Error saving class');
            
            const savedClass = await res.json();
            setIsModalOpen(false);
            setEditingClass(null);
            fetchClasses(currentPage, searchTerm).then(() => setSelectedClass(savedClass));
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async () => {
        if (!selectedClass || !accessToken) return;
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}${API_ENDPOINT}${selectedClass.slug}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            fetchClasses(currentPage, searchTerm);
            setSelectedClass(null);
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
                <Button variant="primary" onClick={() => { setEditingClass(null); setIsModalOpen(true); }}>
                    <div className="flex items-center gap-2"><FaPlus /> Crear Clase</div>
                </Button>
                <div className="flex items-center gap-2 flex-grow max-w-xs">
                    <Input placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    <Button variant="secondary" onClick={() => fetchClasses(1, searchTerm)}><FaSearch /></Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2">
                    
                    {/* TABLA INCRUSTADA DIRECTAMENTE AQUÍ */}
                    <div className="overflow-x-auto rounded-xl border border-madera-oscura">
                        <table className="min-w-full text-left text-sm font-body">
                            <thead className="bg-cuero text-white font-title uppercase">
                                <tr>
                                    <th className="px-4 py-3">Nombre</th>
                                    <th className="px-4 py-3">Dado de Golpe</th>
                                    <th className="px-4 py-3">Habilidad Principal</th>
                                    <th className="px-4 py-3">Fuente</th>
                                </tr>
                            </thead>
                            <tbody>
                                {classes.map((dndClass, rowIndex) => {
                                    const isSelected = selectedClass?.id === dndClass.id;
                                    return (
                                        <tr
                                            key={dndClass.id || rowIndex}
                                            onClick={() => setSelectedClass(dndClass)}
                                            className={`
                                                transition border-b border-stone-200 last:border-0 cursor-pointer
                                                ${isSelected 
                                                    ? 'bg-bosque text-white' 
                                                    : 'odd:bg-white even:bg-pergamino hover:bg-bosque/10 text-stone-800'
                                                }
                                            `}
                                        >
                                            <td className="px-4 py-2 font-semibold">{dndClass.name}</td>
                                            <td className="px-4 py-2">d{dndClass.hit_die}</td>
                                            <td className="px-4 py-2 capitalize">{dndClass.primary_ability}</td>
                                            <td className="px-4 py-2">
                                                <span className={`inline-block px-2 py-0.5 rounded text-xs border border-stone-300 ${isSelected ? 'bg-white/20' : 'bg-stone-200/50'}`}>
                                                    {dndClass.source}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {classes.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8 text-center text-stone-500 italic bg-white">
                                            No se encontraron clases.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(p) => fetchClasses(p, searchTerm)} />
                </div>

                <div className="lg:col-span-1">
                    {selectedClass ? (
                        <Card variant="primary" className="h-full flex flex-col">
                            <div>
                                <h3 className="font-title text-2xl text-stone-900">{selectedClass.name}</h3>
                                <div className="flex gap-2 mt-2 text-sm text-stone-700">
                                    <span className="bg-white/50 px-2 py-0.5 rounded border border-madera-oscura/20">d{selectedClass.hit_die}</span>
                                    <span className="bg-white/50 px-2 py-0.5 rounded border border-madera-oscura/20 uppercase">{selectedClass.primary_ability.substring(0,3)}</span>
                                </div>
                            </div>
                            <div className="font-body text-sm flex-grow mt-4 border-t pt-4 border-madera-oscura/30">
                                <p className="whitespace-pre-wrap text-stone-800 mb-4">{selectedClass.description}</p>
                                
                                <div className="space-y-2 bg-white/40 p-3 rounded border border-madera-oscura/10 text-sm">
                                    <p><strong className="text-madera-oscura">Salvaciones:</strong> <span className="capitalize">{selectedClass.saving_throws.join(', ')}</span></p>
                                    <p><strong className="text-madera-oscura">Skills:</strong> Elige {selectedClass.skill_choices_count}</p>
                                    <p><strong className="text-madera-oscura">Fuente:</strong> {selectedClass.source}</p>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-auto pt-6">
                                <Button variant="dangerous" onClick={() => setIsAlertOpen(true)}><FaTrash /></Button>
                                <Button variant="secondary" onClick={() => { setEditingClass(selectedClass); setIsModalOpen(true); }}><FaPencilAlt /></Button>
                                
                                {/* Botón de Detalle */}
                                <Button 
                                    variant="secondary" 
                                    onClick={() => router.push(`/admin/classes/${selectedClass.slug}`)} 
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
                            Selecciona una clase para ver detalles
                        </Card>
                    )}
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingClass ? "Editar Clase" : "Nueva Clase"}>
                <ClassForm onSave={handleSaveClass} onCancel={() => setIsModalOpen(false)} initialData={editingClass} />
            </Modal>

            <ConfirmAlert isOpen={isAlertOpen} onClose={() => setIsAlertOpen(false)} onConfirm={handleDelete} title="Eliminar Clase" message="¿Estás seguro? Se eliminarán todos los rasgos y recursos asociados." />
        </div>
    );
}