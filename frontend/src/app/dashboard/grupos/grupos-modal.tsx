'use client';

import { useState, useEffect, useMemo } from 'react';
import { Party, InventarioParty, Personaje, InventarioItem } from '@/types'; // Asegúrate de importar Inventario
import Button from '@/components/button';
import Dropdown from '@/components/dropdown';
import Table from '@/components/table';
import Input from '@/components/input';
import Card from '@/components/card';

// --- Función Helper (cópiala o impórtala) ---
const buildApiUrl = (endpoint: string) => {
  const baseUrl = 'https://dbn.onrender.com'; 
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${baseUrl}/api/${normalizedEndpoint}`;
};

interface PartyModalProps {
  party: Party;
  userPersonajes: Personaje[]; // Los personajes del usuario actual
  accessToken: string;
  onClose: () => void;
  onUpdate: () => void; // Para refrescar la lista si algo cambia
}

export default function PartyModal({ party, userPersonajes, accessToken, onClose, onUpdate }: PartyModalProps) {
  
  const [activeTab, setActiveTab] = useState<'info' | 'inventario'>('info');
  const [inventarioParty, setInventarioParty] = useState<InventarioParty[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // --- ESTADOS PARA UNIRSE ---
  const [selectedCharIdToJoin, setSelectedCharIdToJoin] = useState<string>('');

  // --- ESTADOS PARA DONAR ---
  const [isDonating, setIsDonating] = useState(false);
  const [donateCharId, setDonateCharId] = useState<string>('');
  const [charInventory, setCharInventory] = useState<InventarioItem[]>([]); // Inventario del personaje seleccionado
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [donateAmount, setDonateAmount] = useState<number>(1);


  // 1. Determinar si alguno de mis personajes ya está en la party
  const myMemberCharacter = useMemo(() => {
    return userPersonajes.find(pj => party.miembros.includes(pj.id));
  }, [userPersonajes, party.miembros]);

  const isMember = !!myMemberCharacter;

  // 2. Cargar Inventario de la Party (Solo si entramos a la tab inventario)
  useEffect(() => {
    if (activeTab === 'inventario') {
      fetchInventory();
    }
  }, [activeTab, party.id]);

  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(buildApiUrl(`inventario-party/?party=${party.id}`), {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setInventarioParty(data.results || data);
      }
    } catch (error) { console.error(error); }
    finally { setIsLoading(false); }
  };

  // --- LÓGICA: UNIRSE A LA PARTY ---
  const handleJoin = async () => {
    if (!selectedCharIdToJoin) return;
    try {
      const res = await fetch(buildApiUrl(`grupos/${party.id}/unirse/`), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}` 
        },
        body: JSON.stringify({ personaje_id: Number(selectedCharIdToJoin) })
      });
      if (res.ok) {
        alert("¡Te has unido a la party!");
        onUpdate(); // Refresca la info de la party principal
        onClose();
      } else {
        const err = await res.json();
        alert(err.error || "Error al unirse");
      }
    } catch (e) { console.error(e); }
  };

  // --- LÓGICA: PREPARAR DONACIÓN (Cargar inventario del personaje) ---
  useEffect(() => {
    if (donateCharId) {
      // Cargar inventario de este personaje
      fetch(buildApiUrl(`personajes/${donateCharId}/inventario/`), {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      .then(res => res.json())
      .then(data => setCharInventory(data.results || data))
      .catch(err => console.error(err));
    } else {
        setCharInventory([]);
    }
  }, [donateCharId]);

  // --- LÓGICA: ENVIAR DONACIÓN ---
  const handleDonate = async () => {
    if (!donateCharId || !selectedItemId) return;
    
    try {
      const res = await fetch(buildApiUrl(`inventario-party/donar_objeto/`), {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}` 
        },
        body: JSON.stringify({
            party_id: party.id,
            personaje_id: Number(donateCharId),
            objeto_id: Number(selectedItemId),
            cantidad: donateAmount
        })
      });

      if (res.ok) {
        alert("Objeto donado exitosamente.");
        setIsDonating(false);
        fetchInventory(); // Refrescar inventario de la party
        // Opcional: Refrescar inventario del personaje
      } else {
        const err = await res.json();
        alert(err.error || "Error al donar");
      }
    } catch (e) { console.error(e); }
  };


  // --- RENDERIZADO ---

  // Opciones para dropdowns
  const joinOptions = userPersonajes
    .filter(pj => !party.miembros.includes(pj.id)) // Solo los que NO están unidos
    .map(pj => ({ value: String(pj.id), label: pj.nombre_personaje }));

  const donateCharOptions = userPersonajes
    .filter(pj => party.miembros.includes(pj.id)) // Solo los que SÍ están unidos
    .map(pj => ({ value: String(pj.id), label: pj.nombre_personaje }));

  const inventoryOptions = charInventory.map((item: InventarioItem)=> ({
      value: String(item.objeto), // ID del objeto
      label: `${item.objeto_nombre} (Tienes: ${item.cantidad})`
  }));


  return (
    <div className="font-body text-stone-800 space-y-6">
      
      {/* TABS */}
      <div className="flex border-b border-madera-oscura">
        <button 
          onClick={() => setActiveTab('info')}
          className={`px-4 py-2 font-bold ${activeTab === 'info' ? 'bg-pergamino text-madera-oscura border-t border-l border-r border-madera-oscura rounded-t' : 'text-stone-500'}`}
        >
          Información y Miembros
        </button>
        <button 
          onClick={() => setActiveTab('inventario')}
          className={`px-4 py-2 font-bold ${activeTab === 'inventario' ? 'bg-pergamino text-madera-oscura border-t border-l border-r border-madera-oscura rounded-t' : 'text-stone-500'}`}
        >
          Inventario Compartido
        </button>
      </div>

      {/* --- TAB 1: INFORMACIÓN --- */}
      {activeTab === 'info' && (
        <div className="space-y-4">
            <div className="bg-white/50 p-4 rounded">
                <h3 className="font-bold text-madera-oscura mb-2">Descripción</h3>
                <p className="italic">{party.descripcion || "Sin descripción."}</p>
                <p className="text-xs text-stone-500 mt-2">Líder: {party.creador_nombre}</p>
            </div>

            <div>
                <h3 className="font-bold text-madera-oscura mb-2">Miembros ({party.miembros.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {party.miembros_info.map(m => (
                        <div key={m.id} className="flex items-center gap-2 p-2 bg-white rounded border border-stone-200">
                            <div className="h-8 w-8 rounded-full bg-madera-oscura text-pergamino flex items-center justify-center font-bold">
                                {m.nombre_personaje.charAt(0)}
                            </div>
                            <div>
                                <p className="font-bold text-sm">{m.nombre_personaje}</p>
                                <p className="text-xs text-stone-500">{m.clase} Nivel {m.nivel}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ZONA DE UNIRSE */}
            {!isMember && joinOptions.length > 0 && (
                <div className="mt-6 p-4 bg-bosque/10 rounded border border-bosque">
                    <h4 className="font-bold text-bosque mb-2">¡Únete a la aventura!</h4>
                    <div className="flex gap-2">
                        <div className="flex-grow">
                            <Dropdown 
                                options={joinOptions}
                                value={selectedCharIdToJoin}
                                onChange={(e) => setSelectedCharIdToJoin(e.target.value)}
                                placeholder="Selecciona tu personaje..."
                            />
                        </div>
                        <Button variant="primary" onClick={handleJoin}>Unirse</Button>
                    </div>
                </div>
            )}
            {isMember && (
                <p className="text-center text-sm text-green-700 font-bold bg-green-100 p-2 rounded">
                    ✅ Eres miembro de esta party con {myMemberCharacter?.nombre_personaje}
                </p>
            )}
        </div>
      )}

      {/* --- TAB 2: INVENTARIO --- */}
      {activeTab === 'inventario' && (
        <div className="space-y-4">
            
            {/* BOTÓN DE DONAR (SOLO SI ERES MIEMBRO) */}
            {isMember && !isDonating && (
                <div className="flex justify-end">
                    <Button variant="secondary" onClick={() => setIsDonating(true)}>
                        📦 Donar Objeto
                    </Button>
                </div>
            )}

            {/* FORMULARIO DE DONACIÓN */}
            {isDonating && (
                <Card variant="secondary" className="mb-4">
                    <h4 className="font-bold mb-2">Donar al alijo de la party</h4>
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs font-bold">1. ¿Quién dona?</label>
                            <Dropdown 
                                options={donateCharOptions}
                                value={donateCharId}
                                onChange={(e) => setDonateCharId(e.target.value)}
                            />
                        </div>
                        {donateCharId && (
                            <>
                                <div>
                                    <label className="text-xs font-bold">2. ¿Qué objeto?</label>
                                    <Dropdown 
                                        options={inventoryOptions}
                                        value={selectedItemId}
                                        onChange={(e) => setSelectedItemId(e.target.value)}
                                        placeholder="Selecciona un objeto..."
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold">3. Cantidad</label>
                                    <Input 
                                        type="number" min="1" 
                                        value={String(donateAmount)}
                                        onChange={(e) => setDonateAmount(Number(e.target.value))}
                                    />
                                </div>
                                <div className="flex justify-end gap-2 mt-2">
                                    <Button variant="dangerous" onClick={() => setIsDonating(false)}>Cancelar</Button>
                                    <Button variant="primary" onClick={handleDonate}>Confirmar Donación</Button>
                                </div>
                            </>
                        )}
                    </div>
                </Card>
            )}

            {/* TABLA DE OBJETOS */}
            {isLoading ? <p>Cargando alijo...</p> : (
                <div className="max-h-60 overflow-y-auto scrollbar-custom">
                     <Table
                        headers={[
                            { key: 'cantidad', label: 'Cant.' },
                            { key: 'objeto_nombre', label: 'Objeto' },
                            { key: 'objeto_rarity', label: 'Rareza' },
                            { key: 'donado_por_nombre', label: 'Donado por' },
                        ]}
                        data={inventarioParty}
                        onRowClick={() => {}} // Opcional: Ver detalles del objeto
                     />
                     {inventarioParty.length === 0 && <p className="text-center text-stone-500 p-4">El alijo está vacío.</p>}
                </div>
            )}
        </div>
      )}

      <div className="flex justify-end pt-4 border-t border-madera-oscura">
        <Button variant="secondary" onClick={onClose}>Cerrar</Button>
      </div>
    </div>
  );
}