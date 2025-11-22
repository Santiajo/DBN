'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Personaje, Objeto } from '@/types'; 
import Card from "@/components/card";
import Button from "@/components/button";
import Dropdown, { OptionType } from '@/components/dropdown';
import Modal from '@/components/modal'; // Importamos Modal
import ConfirmAlert from '@/components/confirm-alert'; // Importamos ConfirmAlert
import { FaCoins, FaShoppingCart, FaLock, FaSearch } from 'react-icons/fa';

// Reglas de Negocio
const TP_RULES: Record<string, { cost: number, tier: number, color: string, border: string }> = {
    'Uncommon': { cost: 2, tier: 1, color: 'text-green-600', border: 'border-green-600' },
    'Rare': { cost: 6, tier: 2, color: 'text-blue-600', border: 'border-blue-600' },
    'Very Rare': { cost: 12, tier: 3, color: 'text-purple-600', border: 'border-purple-600' },
    'Legendary': { cost: 20, tier: 4, color: 'text-orange-600', border: 'border-orange-600' },
};

const normalizeRarity = (rarity: string | undefined | null): string => {
    if (!rarity) return '';
    return rarity.split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ')
        .trim();
};

const getTier = (level: number) => {
    if (level <= 4) return 1;
    if (level <= 10) return 2;
    if (level <= 16) return 3;
    return 4;
};

export default function TreasureStorePage() {
    const { accessToken } = useAuth();
    
    const [personajes, setPersonajes] = useState<Personaje[]>([]);
    const [objetos, setObjetos] = useState<Objeto[]>([]);
    
    const [selectedPjId, setSelectedPjId] = useState<string>('');
    const [selectedRarity, setSelectedRarity] = useState<string>('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [buyingId, setBuyingId] = useState<number | null>(null);

    // Estados para Alertas y Modales
    const [itemToBuy, setItemToBuy] = useState<Objeto | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    
    // Estado para el Modal de Resultado (Éxito/Error)
    const [resultModal, setResultModal] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'success'
    });

    useEffect(() => {
        if (!accessToken) return;
        const headers = { 'Authorization': `Bearer ${accessToken}` };

        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/personajes/`, { headers })
            .then(res => res.json())
            .then(data => setPersonajes(data.results || data));

        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/objetos/`, { headers })
            .then(res => res.json())
            .then(data => {
                const items = (data.results || data) as Objeto[];
                const validItems = items.filter(i => {
                    if (!i.in_tp_store) return false;
                    const normalized = normalizeRarity(i.Rarity);
                    return TP_RULES[normalized] !== undefined;
                });
                setObjetos(validItems);
            });
    }, [accessToken]);

    const selectedPj = personajes.find(p => String(p.id) === selectedPjId);
    const currentTier = selectedPj ? getTier(selectedPj.nivel) : 0;

    const filteredObjects = objetos.filter(obj => {
        const normRarity = normalizeRarity(obj.Rarity);
        const matchesSearch = obj.Name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRarity = selectedRarity === 'All' || normRarity === selectedRarity;
        return matchesSearch && matchesRarity;
    });

    // 1. Iniciar proceso de compra (Abrir confirmación)
    const initiateBuy = (objeto: Objeto) => {
        setItemToBuy(objeto);
        setIsConfirmOpen(true);
    };

    // 2. Confirmar compra (Llamada a API)
    const handleConfirmPurchase = async () => {
        if (!selectedPj || !accessToken || !itemToBuy) return;
        
        setIsConfirmOpen(false); // Cerrar confirmación
        setBuyingId(itemToBuy.id); // Mostrar loading en el botón (opcional visualmente)

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/store/buy/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
                body: JSON.stringify({
                    personaje_id: selectedPj.id,
                    objeto_id: itemToBuy.id
                })
            });

            const data = await res.json();
            
            if (res.ok) {
                // Éxito
                setResultModal({
                    isOpen: true,
                    title: '¡Objeto Adquirido!',
                    message: `Has comprado "${itemToBuy.Name}". Te quedan ${data.new_tp} Treasure Points.`,
                    type: 'success'
                });
                // Actualizar estado local
                setPersonajes(prev => prev.map(p => 
                    p.id === selectedPj.id ? { ...p, treasure_points: data.new_tp } : p
                ));
            } else {
                // Error de lógica (Tier, Fondos, etc)
                setResultModal({
                    isOpen: true,
                    title: 'No se pudo comprar',
                    message: data.error || 'Ocurrió un error desconocido.',
                    type: 'error'
                });
            }
        } catch (error) {
            console.error(error);
            setResultModal({
                isOpen: true,
                title: 'Error de Conexión',
                message: 'No se pudo contactar con el servidor.',
                type: 'error'
            });
        } finally {
            setBuyingId(null);
            setItemToBuy(null);
        }
    };

    const pjOptions: OptionType[] = personajes.map(p => ({ value: String(p.id), label: `${p.nombre_personaje} (TP: ${p.treasure_points})` }));
    const rarityOptions: OptionType[] = [
        { value: 'All', label: 'Todas las Rarezas' },
        { value: 'Uncommon', label: 'Uncommon (2 TP)' },
        { value: 'Rare', label: 'Rare (6 TP)' },
        { value: 'Very Rare', label: 'Very Rare (12 TP)' },
        { value: 'Legendary', label: 'Legendary (20 TP)' },
    ];

    return (
        <div className="p-8 space-y-8 font-body text-stone-800">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-title text-madera-oscura flex items-center gap-3">
                        <FaCoins className="text-yellow-600" /> Emporio de Checkpoints
                    </h1>
                    <p className="text-stone-600 text-sm mt-1">Canjea tus Treasure Points por objetos mágicos aprobados.</p>
                </div>
                
                <div className="w-full md:w-1/3">
                    <label className="block text-sm font-bold mb-1 text-madera-oscura">Comprar como:</label>
                    <Dropdown 
                        options={pjOptions} 
                        value={selectedPjId} 
                        onChange={(e) => setSelectedPjId(e.target.value)} 
                        placeholder="Selecciona tu Personaje"
                    />
                </div>
            </div>

            {selectedPj && (
                <div className="bg-pergamino border border-madera-oscura rounded-xl p-4 flex justify-between items-center">
                    <div className="flex gap-6">
                        <div>
                            <p className="text-xs text-stone-500 uppercase font-bold">Tier Actual</p>
                            <p className="text-2xl font-title text-madera-oscura">Tier {currentTier}</p>
                        </div>
                        <div>
                            <p className="text-xs text-stone-500 uppercase font-bold">Nivel</p>
                            <p className="text-xl font-bold text-stone-700">{selectedPj.nivel}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-stone-500 uppercase font-bold">Treasure Points Disponibles</p>
                        <p className="text-3xl font-bold text-bosque">{selectedPj.treasure_points} TP</p>
                    </div>
                </div>
            )}

            {/* Filtros - ESTILO ACTUALIZADO: Sin sombras, borde madera */}
            <div className="flex gap-4 bg-white p-4 rounded-xl border border-madera-oscura">
                <div className="flex-1 flex items-center gap-2">
                    <FaSearch className="text-stone-400"/>
                    <input 
                        type="text" 
                        placeholder="Buscar objeto..." 
                        className="w-full outline-none text-stone-700"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="w-1/4 border-l pl-4 border-stone-200">
                    <Dropdown options={rarityOptions} value={selectedRarity} onChange={(e) => setSelectedRarity(e.target.value)} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredObjects.map(item => {
                    const normRarity = normalizeRarity(item.Rarity);
                    const rules = TP_RULES[normRarity];
                    
                    if (!rules) return null;

                    const canAfford = selectedPj ? selectedPj.treasure_points >= rules.cost : false;
                    const hasTier = currentTier >= rules.tier;
                    const isBuyable = selectedPj && canAfford && hasTier;

                    return (
                        // CARD ACTUALIZADO: Sin sombras (shadow-none por defecto en variant secondary si está configurado así, o controlamos clases extra aquí)
                        <Card key={item.id} variant="secondary" className={`flex flex-col relative overflow-hidden group hover:border-madera-oscura transition-colors ${!hasTier && selectedPj ? 'opacity-60 grayscale' : ''}`}>
                            
                            <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl font-bold text-white text-xs ${
                                normRarity === 'Legendary' ? 'bg-orange-600' :
                                normRarity === 'Very Rare' ? 'bg-purple-600' :
                                normRarity === 'Rare' ? 'bg-blue-600' : 'bg-green-600'
                            }`}>
                                {rules.cost} TP
                            </div>

                            <div className="p-4 flex-grow">
                                <h3 className="font-bold text-lg text-stone-800 pr-10 leading-tight mb-1">{item.Name}</h3>
                                <p className="text-xs text-stone-500 italic mb-2">{item.Type} • {item.Attunement ? 'Requires Attunement' : 'No Attunement'}</p>
                                
                                <div className="text-xs mt-2 flex items-center gap-1">
                                    {hasTier ? (
                                        <span className="text-bosque font-bold">✓ Tier {rules.tier}+</span>
                                    ) : (
                                        <span className="text-carmesi font-bold flex items-center gap-1">
                                            <FaLock size={10}/> Req. Tier {rules.tier}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="p-4 pt-0 mt-auto">
                                <Button 
                                    variant={isBuyable ? 'primary' : 'secondary'} 
                                    className={`w-full flex justify-center items-center gap-2 ${!isBuyable ? 'cursor-not-allowed opacity-50' : ''}`}
                                    onClick={() => isBuyable && initiateBuy(item)}
                                    disabled={!isBuyable || buyingId === item.id}
                                >
                                    {buyingId === item.id ? 'Procesando...' : (
                                        <>
                                            <FaShoppingCart /> 
                                            {canAfford ? 'Comprar' : 'Insuficientes TP'}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </Card>
                    );
                })}
            </div>
            
            {filteredObjects.length === 0 && (
                <div className="text-center py-12 text-stone-500 italic">
                    No se encontraron objetos disponibles en la tienda.
                </div>
            )}

            {/* ALERTA DE CONFIRMACIÓN (Usando tu componente ConfirmAlert) */}
            <ConfirmAlert 
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirmPurchase}
                title="Confirmar Compra"
                message={`¿Estás seguro de que deseas comprar "${itemToBuy?.Name}" por ${itemToBuy ? TP_RULES[normalizeRarity(itemToBuy.Rarity)].cost : 0} TP? Esta acción es irreversible.`}
                confirmText="Sí, Comprar"
                cancelText="Cancelar"
            />

            {/* ALERTA DE RESULTADO (Usando Modal Genérico + Card) */}
            <Modal
                isOpen={resultModal.isOpen}
                onClose={() => setResultModal({ ...resultModal, isOpen: false })}
                title={resultModal.title}
            >
                <div className="text-center space-y-6 py-4">
                    <p className={`text-lg ${resultModal.type === 'error' ? 'text-carmesi' : 'text-bosque'}`}>
                        {resultModal.message}
                    </p>
                    <div className="flex justify-center">
                        <Button variant="primary" onClick={() => setResultModal({ ...resultModal, isOpen: false })}>
                            Entendido
                        </Button>
                    </div>
                </div>
            </Modal>

        </div>
    );
}