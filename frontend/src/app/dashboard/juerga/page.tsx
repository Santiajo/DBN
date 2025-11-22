'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Personaje } from '@/types'; 
import Button from "@/components/button";
import Dropdown, { OptionType } from '@/components/dropdown';
import Modal from '@/components/modal';
import { FaGlassCheers, FaDiceD20, FaUserTie, FaArrowUp, FaArrowDown } from 'react-icons/fa';

// Interfaz para la respuesta del backend
interface CarousingResult {
    isOpen: boolean;
    roll: number;
    total: number;
    mod: number;
    outcome: string;
    type: 'success' | 'failure' | 'neutral';
    npcs_affected: Array<{
        name: string;
        title: string;
        change: number;
        new_value: number;
    }>;
}

export default function CarousingPage() {
    const { accessToken } = useAuth();
    
    const [personajes, setPersonajes] = useState<Personaje[]>([]);
    const [selectedPjId, setSelectedPjId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    
    // Estado del Resultado
    const [result, setResult] = useState<CarousingResult | null>(null);

    useEffect(() => {
        if (!accessToken) return;
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/personajes/`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        })
        .then(res => res.json())
        .then(data => setPersonajes(data.results || data));
    }, [accessToken]);

    const selectedPj = personajes.find(p => String(p.id) === selectedPjId);
    const COSTO_BASE = 50; // Debe coincidir con el backend visualmente

    const handleRoll = async () => {
        if (!selectedPj || !accessToken) return;
        
        if (selectedPj.oro < COSTO_BASE) return alert(`Necesitas al menos ${COSTO_BASE} gp.`);
        if (selectedPj.tiempo_libre < 5) return alert("Necesitas al menos 5 días de tiempo libre.");

        setIsLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/downtime/carousing/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
                body: JSON.stringify({
                    personaje_id: selectedPj.id
                    // Ya no enviamos social_class
                })
            });

            const data = await res.json();
            
            if (res.ok) {
                // Actualizar datos locales
                setPersonajes(prev => prev.map(p => 
                    p.id === selectedPj.id ? { ...p, oro: data.new_gold, tiempo_libre: data.new_downtime } : p
                ));
                
                setResult({
                    isOpen: true,
                    roll: data.roll_base,
                    mod: data.modifier,
                    total: data.total,
                    outcome: data.outcome,
                    type: data.result_type,
                    npcs_affected: data.npcs_affected
                });
            } else {
                alert(data.error || "Ocurrió un error.");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const pjOptions: OptionType[] = personajes.map(p => ({ 
        value: String(p.id), 
        label: `${p.nombre_personaje} (Oro: ${p.oro}gp | Días: ${p.tiempo_libre})` 
    }));

    return (
        <div className="p-8 space-y-8 font-body text-stone-800">
            <div className="border-b-2 border-madera-oscura/20 pb-4">
                <h1 className="text-3xl font-title text-madera-oscura flex items-center gap-3">
                    <FaGlassCheers className="text-carmesi" /> Irse de Juerga
                </h1>
                <p className="text-stone-600 mt-2 max-w-3xl">
                    Pasa una semana socializando para influenciar a la gente local.
                    <br/>
                    <span className="text-sm font-bold text-stone-700">Costo: {COSTO_BASE} gp + 5 Días de Tiempo Libre.</span>
                </p>
            </div>

            {/* Selector */}
            <div className="max-w-md bg-pergamino/50 p-6 rounded-xl border border-madera-oscura">
                <label className="block mb-2 font-bold text-madera-oscura">Selecciona tu Personaje</label>
                <Dropdown 
                    options={pjOptions} 
                    value={selectedPjId} 
                    onChange={(e) => setSelectedPjId(e.target.value)} 
                    placeholder="¿Quién paga la ronda?"
                />
                
                <div className="mt-6 flex justify-end">
                    <Button 
                        variant="primary" 
                        onClick={handleRoll}
                        className={`px-8 py-3 text-lg shadow-lg w-full flex justify-center ${(!selectedPjId || isLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={!selectedPjId || isLoading}
                    >
                        {isLoading ? 'Socializando...' : (
                            <div className="flex items-center gap-2">
                                <FaDiceD20 /> Tirar Persuasión
                            </div>
                        )}
                    </Button>
                </div>
            </div>

            {/* Modal de Resultado */}
            {result && (
                <Modal 
                    isOpen={result.isOpen} 
                    onClose={() => setResult(null)} 
                    title="Resultado de la Juerga"
                >
                    <div className="text-center space-y-6 p-4">
                        {/* Dados */}
                        <div className="flex justify-center items-center gap-4 animate-pulse-once">
                            <div className="relative">
                                <FaDiceD20 className={`text-6xl ${result.type === 'failure' ? 'text-carmesi' : 'text-bosque'}`} />
                                <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-xl pt-1">
                                    {result.roll}
                                </span>
                            </div>
                            <div className="text-2xl font-title text-stone-400">=</div>
                            <div className="text-left">
                                <p className="text-xs uppercase font-bold text-stone-500">Total</p>
                                <p className="text-4xl font-bold text-madera-oscura">{result.total}</p>
                            </div>
                        </div>

                        <div className="bg-stone-50 p-3 rounded border border-stone-200">
                            <p className="font-bold text-lg mb-1">{result.outcome}</p>
                        </div>

                        {/* Lista de NPCs Afectados */}
                        {result.npcs_affected.length > 0 && (
                            <div className="text-left">
                                <h4 className="text-xs font-bold uppercase text-stone-400 mb-2">NPCs Afectados</h4>
                                <div className="space-y-2">
                                    {result.npcs_affected.map((npc, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-3 bg-white border border-stone-200 rounded shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-stone-200 p-2 rounded-full text-stone-500">
                                                    <FaUserTie />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-stone-800">{npc.name}</p>
                                                    <p className="text-xs text-stone-500">{npc.title || 'Ciudadano'}</p>
                                                </div>
                                            </div>
                                            <div className={`font-bold text-sm flex items-center gap-1 ${npc.change > 0 ? 'text-bosque' : 'text-carmesi'}`}>
                                                {npc.change > 0 ? <FaArrowUp size={10}/> : <FaArrowDown size={10}/>}
                                                {npc.change > 0 ? '+' : ''}{npc.change} 
                                                <span className="text-xs text-stone-400 font-normal ml-1">(Total: {npc.new_value})</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <Button variant="secondary" onClick={() => setResult(null)}>Cerrar</Button>
                    </div>
                </Modal>
            )}
        </div>
    );
}