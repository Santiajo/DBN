'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Party, Personaje } from '@/types';
import Card from '@/components/card';
import Button from '@/components/button';
import Input from '@/components/input';
import Modal from '@/components/modal';
import { FaUsers, FaPlus, FaSearch } from 'react-icons/fa';
import PartyModal from './grupos-modal';

// --- Función Helper ---
const buildApiUrl = (endpoint: string) => {
  const baseUrl = 'https://dbn.onrender.com';
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${baseUrl}/api/${normalizedEndpoint}`;
};

export default function GruposPage() {
  const { user, accessToken } = useAuth();

  // Estados
  const [grupos, setgrupos] = useState<Party[]>([]);
  const [userPersonajes, setUserPersonajes] = useState<Personaje[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal y Selección
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  // Crear Party
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newPartyName, setNewPartyName] = useState('');
  const [newPartyDesc, setNewPartyDesc] = useState('');
  
  // NUEVO: Estado para guardar el personaje elegido para ser líder
  const [selectedLeaderId, setSelectedLeaderId] = useState<string>('');

  // --- FETCH DATA ---
  const fetchData = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      // 1. Cargar grupos
      const resgrupos = await fetch(buildApiUrl(`grupos/?search=${searchTerm}`), {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const datagrupos = await resgrupos.json();
      setgrupos(datagrupos.results || datagrupos || []);

      // 2. Cargar Personajes del Usuario
      const resPj = await fetch(buildApiUrl('personajes/'), {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const dataPj = await resPj.json();
      const personajesCargados = dataPj.results || dataPj || [];
      setUserPersonajes(personajesCargados);

      // NUEVO: Pre-seleccionar el primer personaje si existe para facilitar la UI
      if (personajesCargados.length > 0) {
        setSelectedLeaderId(personajesCargados[0].id);
      }

    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  }, [accessToken, searchTerm]);

  useEffect(() => {
    if (user) fetchData();
  }, [user, fetchData]);

  // --- HANDLERS ---
  const handleCreateParty = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación: Necesitas un personaje para fundar un grupo
    if (!selectedLeaderId) {
        alert("Debes tener un personaje para fundar un grupo.");
        return;
    }

    try {
        // PASO 1: Crear el Grupo
        const res = await fetch(buildApiUrl('grupos/'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({ nombre: newPartyName, descripcion: newPartyDesc })
        });

        if (res.ok) {
            const newGroupData = await res.json(); // Obtenemos el grupo creado (con su ID)

            // PASO 2: Unirse automáticamente con el personaje seleccionado
            // Asumiendo que el endpoint es /grupos/{id}/unirse/
            const joinRes = await fetch(buildApiUrl(`grupos/${newGroupData.id}/unirse/`), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({ personaje_id: selectedLeaderId })
            });

            if (joinRes.ok) {
                setIsCreateOpen(false);
                setNewPartyName('');
                setNewPartyDesc('');
                fetchData(); // Recargar lista para ver el nuevo grupo con el miembro añadido
            } else {
                alert("Grupo creado, pero hubo un error al unirte automáticamente.");
                setIsCreateOpen(false);
                fetchData();
            }

        } else {
            alert("Error al crear la party (quizás el nombre ya existe)");
        }
    } catch (e) { console.error(e); }
  };

  const openDetail = (party: Party) => {
    setSelectedParty(party);
    setIsDetailOpen(true);
  };

  return (
    <div className="p-8 space-y-6">
        {/* HEADER */}
        <div className="flex justify-between items-center">
            <h1 className="font-title text-3xl text-madera-oscura flex items-center gap-2">
                <FaUsers /> Gremios y grupos
            </h1>
            <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
                <FaPlus className="mr-2" /> Nuevo Grupo
            </Button>
        </div>

        {/* BÚSQUEDA */}
        <div className="flex gap-2 max-w-md">
            <Input 
                placeholder="Buscar party..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button variant="secondary" onClick={() => fetchData()}><FaSearch /></Button>
        </div>

        {/* LISTA DE grupos */}
        {isLoading ? <p>Cargando aventuras...</p> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {grupos.map(party => (
                    <Card key={party.id} variant="primary" className="flex flex-col justify-between h-full hover:shadow-lg transition-shadow">
                        <div>
                            <h3 className="font-title text-xl text-madera-oscura mb-1">{party.nombre}</h3>
                            <p className="text-xs text-stone-500 mb-4">Líder: {party.creador_nombre}</p>
                            <p className="font-body text-sm text-stone-700 line-clamp-3">
                                {party.descripcion || "Sin descripción disponible."}
                            </p>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-madera-oscura flex justify-between items-center">
                            <span className="text-xs font-bold bg-white px-2 py-1 rounded border border-stone-300">
                                {party.miembros.length} Miembros
                            </span>
                            <Button variant="secondary" onClick={() => openDetail(party)}>
                                Ver Detalles
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>
        )}

        {/* MODAL DE DETALLE (Sin cambios) */}
        {selectedParty && (
            <Modal 
                isOpen={isDetailOpen} 
                onClose={() => setIsDetailOpen(false)}
                title={`Gremio: ${selectedParty.nombre}`}
            >
                <PartyModal 
                    party={selectedParty}
                    userPersonajes={userPersonajes}
                    accessToken={accessToken!}
                    onClose={() => setIsDetailOpen(false)}
                    onUpdate={() => {
                        fetchData(); 
                    }}
                />
            </Modal>
        )}

        {/* MODAL CREAR (MODIFICADO) */}
        <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Fundar nueva Party">
            <form onSubmit={handleCreateParty} className="space-y-4">
                <div>
                    <label className="font-bold block mb-1">Nombre del Grupo</label>
                    <Input required value={newPartyName} onChange={(e) => setNewPartyName(e.target.value)} placeholder="Ej: Los Mata-Dragones" />
                </div>
                
                {/* NUEVO: Selector de personaje líder */}
                <div>
                    <label className="font-bold block mb-1">Fundador (Tu personaje)</label>
                    {userPersonajes.length > 0 ? (
                        <select 
                            className="w-full p-2 rounded border border-stone-400 bg-white"
                            value={selectedLeaderId}
                            onChange={(e) => setSelectedLeaderId(e.target.value)}
                            required
                        >
                            {userPersonajes.map(pj => (
                                <option key={pj.id} value={pj.id}>
                                    {pj.nombre_personaje} (Nivel {pj.nivel} )
                                </option>
                            ))}
                        </select>
                    ) : (
                        <p className="text-red-500 text-sm">Necesitas crear un personaje antes de fundar un grupo.</p>
                    )}
                </div>

                <div>
                    <label className="font-bold block mb-1">Descripción</label>
                    <textarea 
                        className="w-full p-2 rounded border border-stone-400" 
                        rows={3}
                        value={newPartyDesc} 
                        onChange={(e) => setNewPartyDesc(e.target.value)} 
                        placeholder="Objetivos del grupo..."
                    />
                </div>
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="secondary" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                    <Button type="submit" variant="primary" disabled={userPersonajes.length === 0}>Fundar</Button>
                </div>
            </form>
        </Modal>
    </div>
  );
}