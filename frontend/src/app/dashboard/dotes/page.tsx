'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Card from "@/components/card";
import Input from "@/components/input";
import Button from "@/components/button";
import Pagination from '@/components/pagination';
import Modal from '@/components/modal';
import ConfirmAlert from '@/components/confirm-alert';
import { FaSearch, FaTrash, FaPencilAlt, FaEye, FaPlus, FaCheck } from 'react-icons/fa';
import { DnDFeat, DnDFeatPayload } from '@/types';
import FeatForm from './feat-form';

const API_ENDPOINT = '/api/feats/';
const PAGE_SIZE = 12;

export default function FeatsPage() {
    const { user, accessToken, logout } = useAuth();
    const router = useRouter();

    const [feats, setFeats] = useState<DnDFeat[]>([]);
    const [selectedFeat, setSelectedFeat] = useState<DnDFeat | null>(null);
    const selectedFeatRef = useRef<DnDFeat | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingFeat, setEditingFeat] = useState<DnDFeat | null>(null);
    const [isAlertOpen, setIsAlertOpen] = useState(false);

    useEffect(() => {
        selectedFeatRef.current = selectedFeat;
    }, [selectedFeat]);

    const fetchFeats = useCallback(async (page = 1, searchQuery = '') => {
        if (!accessToken) return;
        try {
            const params = new URLSearchParams({ page: String(page), search: searchQuery });
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${API_ENDPOINT}?${params}`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            
            if (!res.ok) {
                if (res.status === 401) logout();
                throw new Error('Error fetching feats');
            }
            
            const data = await res.json();
            setFeats(data.results);
            setTotalPages(Math.ceil(data.count / PAGE_SIZE));
            setCurrentPage(page);

            const currentSelected = selectedFeatRef.current;
            if (currentSelected) {
                const stillExists = data.results.find((f: DnDFeat) => f.id === currentSelected.id);
                if (stillExists) setSelectedFeat(stillExists);
                else if (data.results.length > 0) setSelectedFeat(data.results[0]);
                else setSelectedFeat(null);
            } else if (data.results.length > 0) {
                setSelectedFeat(data.results[0]);
            }

        } catch (error) { console.error(error); }
    }, [accessToken, logout]);

    useEffect(() => {
        if (user?.is_staff) fetchFeats(currentPage, searchTerm);
    }, [user, currentPage, fetchFeats, searchTerm]);

    const handleSave = async (payload: DnDFeatPayload) => {
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

            if (!res.ok) throw new Error('Error saving feat');
            
            const savedItem = await res.json();
            setIsModalOpen(false);
            setEditingFeat(null);
            setSelectedFeat(savedItem);
            selectedFeatRef.current = savedItem;
            fetchFeats(currentPage, searchTerm);
        } catch (error) { console.error(error); }
    };

    const handleDelete = async () => {
        if (!selectedFeat || !accessToken) return;
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}${API_ENDPOINT}${selectedFeat.slug}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            setSelectedFeat(null);
            selectedFeatRef.current = null;
            fetchFeats(currentPage, searchTerm);
        } catch (error) { console.error(error); } 
        finally { setIsAlertOpen(false); }
    };

    if (!user?.is_staff) return <div className="p-8">Acceso denegado</div>;

    return (
        <div className="p-8 space-y-6 font-body text-stone-800">
            {/* Header */}
            <div className="flex justify-end items-center gap-4">
                <Button variant="primary" onClick={() => { setEditingFeat(null); setIsModalOpen(true); }}>
                    <div className="flex items-center gap-2"><FaPlus /> Crear Dote</div>
                </Button>
                <div className="flex items-center gap-2 flex-grow max-w-xs">
                    <Input placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    <Button variant="secondary" onClick={() => fetchFeats(1, searchTerm)}><FaSearch /></Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Tabla */}
                <div className="lg:col-span-2">
                    <div className="overflow-x-auto rounded-xl border border-madera-oscura">
                        <table className="min-w-full text-left text-sm font-body">
                            <thead className="bg-cuero text-white font-title uppercase">
                                <tr>
                                    <th className="px-4 py-3">Nombre</th>
                                    <th className="px-4 py-3">Tipo</th>
                                    <th className="px-4 py-3">Requisitos</th>
                                </tr>
                            </thead>
                            <tbody>
                                {feats.map((feat, rowIndex) => {
                                    const isSelected = selectedFeat?.id === feat.id;
                                    return (
                                        <tr
                                            key={feat.id || rowIndex}
                                            onClick={() => setSelectedFeat(feat)}
                                            className={`
                                                transition border-b border-stone-200 last:border-0 cursor-pointer
                                                ${isSelected 
                                                    ? 'bg-bosque text-white' 
                                                    : 'odd:bg-white even:bg-pergamino hover:bg-bosque hover:text-white text-stone-800'
                                                }
                                            `}
                                        >
                                            <td className="px-4 py-2 font-semibold">{feat.name}</td>
                                            <td className="px-4 py-2">{feat.feat_type}</td>
                                            <td className="px-4 py-2 text-xs">
                                                <div className="flex flex-wrap gap-1">
                                                    {feat.prerequisite_level > 0 && (
                                                        <span className="bg-stone-200 text-stone-700 px-1.5 rounded">Lvl {feat.prerequisite_level}</span>
                                                    )}
                                                    {feat.prerequisite_species_data && (
                                                        <span className="bg-stone-200 text-stone-700 px-1.5 rounded">{feat.prerequisite_species_data.name}</span>
                                                    )}
                                                    {feat.prerequisite_text && (
                                                        <span className="bg-stone-200 text-stone-700 px-1.5 rounded truncate max-w-[100px]">{feat.prerequisite_text}</span>
                                                    )}
                                                    {!feat.prerequisite_level && !feat.prerequisite_species_data && !feat.prerequisite_text && (
                                                        <span className="opacity-50">-</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {feats.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="px-4 py-8 text-center text-stone-500 italic bg-white">
                                            No se encontraron dotes.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(p) => fetchFeats(p, searchTerm)} />
                </div>

                {/* Detalle */}
                <div className="lg:col-span-1">
                    {selectedFeat ? (
                        <Card variant="primary" className="h-full flex flex-col">
                            <div>
                                <div className="flex justify-between items-start">
                                    <h3 className="font-title text-2xl text-stone-900">{selectedFeat.name}</h3>
                                    {selectedFeat.repeatable && (
                                        <span className="bg-blue-100 text-blue-800 text-[10px] uppercase font-bold px-2 py-1 rounded border border-blue-200" title="Repetible">
                                            Repetible
                                        </span>
                                    )}
                                </div>
                                <span className="inline-block bg-white/50 px-2 py-0.5 rounded border border-madera-oscura/20 text-sm mt-1">
                                    {selectedFeat.feat_type}
                                </span>
                            </div>
                            
                            <div className="font-body text-sm flex-grow mt-4 border-t pt-4 border-madera-oscura/30">
                                <p className="whitespace-pre-wrap text-stone-800 mb-4">{selectedFeat.description}</p>
                                
                                <div className="space-y-3">
                                    {/* Caja de Requisitos */}
                                    <div className="bg-white/40 p-3 rounded border border-madera-oscura/10 text-sm">
                                        <h4 className="font-bold text-madera-oscura text-xs uppercase mb-1">Prerrequisitos</h4>
                                        <ul className="list-disc list-inside text-stone-700">
                                            {selectedFeat.prerequisite_level > 0 && <li>Nivel {selectedFeat.prerequisite_level}+</li>}
                                            {selectedFeat.prerequisite_species_data && <li>{selectedFeat.prerequisite_species_data.name}</li>}
                                            {selectedFeat.prerequisite_feat_name && <li>Dote: {selectedFeat.prerequisite_feat_name}</li>}
                                            {selectedFeat.prerequisite_text && <li>{selectedFeat.prerequisite_text}</li>}
                                            {selectedFeat.prerequisite_level === 0 && !selectedFeat.prerequisite_species && !selectedFeat.prerequisite_feat && !selectedFeat.prerequisite_text && (
                                                <li className="italic text-stone-500 list-none">Ninguno</li>
                                            )}
                                        </ul>
                                    </div>

                                    {/* Caja de Beneficios (ASI) */}
                                    {selectedFeat.ability_score_increase && (
                                        <div className="bg-bosque/10 p-3 rounded border border-bosque/20 text-sm">
                                            <h4 className="font-bold text-bosque text-xs uppercase mb-1">Aumento de Característica</h4>
                                            <p className="text-stone-800">{selectedFeat.ability_score_increase}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-auto pt-6">
                                <Button variant="dangerous" onClick={() => setIsAlertOpen(true)}><FaTrash /></Button>
                                <Button variant="secondary" onClick={() => { setEditingFeat(selectedFeat); setIsModalOpen(true); }}><FaPencilAlt /></Button>
                                
                                {/* Navegación a Detalles de Features */}
                                <Button 
                                    variant="secondary" 
                                    onClick={() => router.push(`/dashboard/dotes/${selectedFeat.slug}`)} 
                                    title="Ver Beneficios Detallados"
                                >
                                    <div className="flex items-center gap-2">
                                        <FaEye /> <span className="text-sm">Ver Beneficios</span>
                                    </div>
                                </Button>
                            </div>
                        </Card>
                    ) : (
                        <Card variant="primary" className="h-full flex items-center justify-center text-stone-500">
                            Selecciona un dote
                        </Card>
                    )}
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingFeat ? "Editar Dote" : "Nuevo Dote"}>
                <FeatForm onSave={handleSave} onCancel={() => setIsModalOpen(false)} initialData={editingFeat} />
            </Modal>

            <ConfirmAlert isOpen={isAlertOpen} onClose={() => setIsAlertOpen(false)} onConfirm={handleDelete} title="Eliminar Dote" message="¿Estás seguro? Se eliminarán todos sus beneficios asociados." />
        </div>
    );
}