'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { NPC, NPCPayload } from '@/types';
import { DnDSpecies } from '@/types';
import Input from "@/components/input";
import Button from "@/components/button";
import Pagination from '@/components/pagination';
import Modal from '@/components/modal';
import ConfirmAlert from '@/components/confirm-alert';
import { FaSearch, FaTrash, FaPencilAlt, FaPlus, FaUserTie, FaMapMarkerAlt } from 'react-icons/fa';
import NPCForm from './npc-form';

const API_ENDPOINT = '/api/npcs/';
const PAGE_SIZE = 10;

interface PaginatedResponse<T> {
    count: number;
    results: T[];
}

export default function NPCsPage() {
    const { user, accessToken, logout } = useAuth();

    const [npcs, setNpcs] = useState<NPC[]>([]);
    const [speciesMap, setSpeciesMap] = useState<Record<number, string>>({});
    
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingNPC, setEditingNPC] = useState<NPC | null>(null);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [npcToDelete, setNpcToDelete] = useState<NPC | null>(null);

    // Cargar Especies (para el mapa de nombres)
    useEffect(() => {
        const fetchSpecies = async () => {
            if (!accessToken) return;
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/species/`, {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });
                if (res.ok) {
                    const data = (await res.json()) as PaginatedResponse<DnDSpecies>;
                    const map: Record<number, string> = {};
                    (data.results || []).forEach(s => { map[s.id] = s.name });
                    setSpeciesMap(map);
                }
            } catch (e) { console.error(e); }
        };
        fetchSpecies();
    }, [accessToken]);

    // Cargar NPCs
    const fetchNPCs = useCallback(async (page = 1, search = '') => {
        if (!accessToken) return;
        try {
            const params = new URLSearchParams({ page: String(page), search });
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${API_ENDPOINT}?${params}`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            
            if (!res.ok) {
                if (res.status === 401) logout();
                throw new Error('Error fetching NPCs');
            }
            
            const data = await res.json();
            setNpcs(data.results || []);
            setTotalPages(Math.ceil(data.count / PAGE_SIZE));
            setCurrentPage(page);
        } catch (error) { console.error(error); } 
        finally { setLoading(false); }
    }, [accessToken, logout]);

    useEffect(() => {
        if (user?.is_staff) fetchNPCs(currentPage, searchTerm);
    }, [user, currentPage, fetchNPCs, searchTerm]);

    // Handlers
    const handleSave = async (data: NPCPayload) => {
        if (!accessToken) return;
        const isEditing = !!editingNPC;
        const url = isEditing 
            ? `${process.env.NEXT_PUBLIC_API_URL}${API_ENDPOINT}${editingNPC.slug}/`
            : `${process.env.NEXT_PUBLIC_API_URL}${API_ENDPOINT}`;
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
                body: JSON.stringify(data),
            });

            if (!res.ok) throw new Error('Error saving NPC');
            
            setIsModalOpen(false);
            setEditingNPC(null);
            fetchNPCs(currentPage, searchTerm);
        } catch (error) { console.error(error); }
    };

    const handleDelete = async () => {
        if (!npcToDelete || !accessToken) return;
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}${API_ENDPOINT}${npcToDelete.slug}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            fetchNPCs(currentPage, searchTerm);
        } catch (error) { console.error(error); } 
        finally { setIsAlertOpen(false); setNpcToDelete(null); }
    };

    if (!user?.is_staff) return <div className="p-8">Acceso denegado</div>;

    return (
        <div className="p-8 space-y-6 font-body text-stone-800">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-title text-stone-800">Gestión de NPCs</h1>
                <Button variant="primary" onClick={() => { setEditingNPC(null); setIsModalOpen(true); }}>
                    <div className="flex items-center gap-2"><FaPlus /> Crear NPC</div>
                </Button>
            </div>

            {/* Barra de Búsqueda */}
            <div className="max-w-md">
                <Input placeholder="Buscar por nombre, título o ubicación..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>

            {/* Tabla de NPCs */}
            <div className="overflow-x-auto rounded-xl border border-madera-oscura bg-white shadow-sm">
                <table className="min-w-full text-left text-sm">
                    <thead className="bg-cuero text-white font-title uppercase">
                        <tr>
                            <th className="px-4 py-3">Nombre / Título</th>
                            <th className="px-4 py-3">Ubicación</th>
                            <th className="px-4 py-3">Especie</th>
                            <th className="px-4 py-3 text-center">Oro/Turno</th>
                            <th className="px-4 py-3 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {npcs.map((npc) => (
                            <tr key={npc.id} className="border-b border-stone-200 last:border-0 hover:bg-bosque hover:text-white transition-colors group">
                                <td className="px-4 py-3">
                                    <div className="font-bold text-base flex items-center gap-2">
                                        <FaUserTie className="opacity-50" /> {npc.name}
                                    </div>
                                    {npc.title && <div className="text-xs opacity-70">{npc.title}</div>}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-1 opacity-90">
                                        <FaMapMarkerAlt className="text-xs opacity-50" /> {npc.location || '-'}
                                    </div>
                                </td>
                                <td className="px-4 py-3 opacity-90">
                                    {speciesMap[npc.species || 0] || 'Desconocida'}
                                </td>
                                <td className="px-4 py-3 text-center font-mono opacity-90">
                                    {npc.gold.toLocaleString()} gp
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button 
                                            onClick={() => { setEditingNPC(npc); setIsModalOpen(true); }}
                                            className="p-2 bg-white/20 rounded hover:bg-white hover:text-bosque transition-colors"
                                            title="Editar"
                                        >
                                            <FaPencilAlt />
                                        </button>
                                        <button 
                                            onClick={() => { setNpcToDelete(npc); setIsAlertOpen(true); }}
                                            className="p-2 bg-white/20 rounded hover:bg-carmesi hover:text-white transition-colors"
                                            title="Eliminar"
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {npcs.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-stone-500 italic">No hay NPCs registrados.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(p) => fetchNPCs(p, searchTerm)} />

            {/* Modales */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingNPC ? "Editar NPC" : "Nuevo NPC"}>
                <NPCForm onSave={handleSave} onCancel={() => setIsModalOpen(false)} initialData={editingNPC} />
            </Modal>

            <ConfirmAlert 
                isOpen={isAlertOpen} 
                onClose={() => setIsAlertOpen(false)} 
                onConfirm={handleDelete} 
                title="Eliminar NPC" 
                message={`¿Estás seguro de eliminar a "${npcToDelete?.name}"? Esto borrará todas sus relaciones con personajes.`} 
            />
        </div>
    );
}