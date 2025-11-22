'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Personaje } from '@/types'; 
import Button from "@/components/button";
import Dropdown, { OptionType } from '@/components/dropdown';
import Modal from '@/components/modal';
import { FaGlassCheers, FaDiceD20, FaUserTie, FaArrowUp, FaArrowDown, FaCoins, FaUserFriends, FaCrown, FaCheckCircle } from 'react-icons/fa';

// Opciones de Juerga (Deben coincidir con las llaves del backend)
const JUERGA_OPTIONS = [
    { id: 'Baja', cost: 10, title: 'Clase Baja', desc: 'Tabernas comunes y fiestas callejeras.', icon: <FaUserFriends className="text-stone-500"/> },
    { id: 'Modesta', cost: 50, title: 'Clase Modesta', desc: 'Posadas refinadas y cenas privadas.', icon: <FaGlassCheers className="text-bosque"/> },
    { id: 'Comoda', cost: 200, title: 'Clase Cómoda', desc: 'Eventos de alto nivel y trato preferencial.', icon: <FaCoins className="text-yellow-600"/> },
    { id: 'Adinerada', cost: 500, title: 'Clase Adinerada', desc: 'Mansiones y cenas con mercaderes poderosos.', icon: <FaCoins className="text-yellow-500"/> },
    { id: 'Aristócrata', cost: 1000, title: 'Aristocracia', desc: 'Banquetes nobles y eventos exclusivos.', icon: <FaCrown className="text-purple-600"/> },
];

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
    const [selectedOption, setSelectedOption] = useState<string | null>(null); // Estado para la opción elegida
    const [isLoading, setIsLoading] = useState(false);
    
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

    const handleRoll = async () => {
        // 1. Validar selección
        if (!selectedPj || !selectedOption || !accessToken) return;
        
        // 2. Obtener datos de la opción seleccionada
        const optionData = JUERGA_OPTIONS.find(opt => opt.id === selectedOption);
        if (!optionData) return;

        // 3. Validar recursos (Frontend)
        if (selectedPj.oro < optionData.cost) return alert(`Necesitas al menos ${optionData.cost} gp.`);
        if (selectedPj.tiempo_libre < 5) return alert("Necesitas al menos 5 días de tiempo libre.");

        setIsLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/downtime/carousing/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
                body: JSON.stringify({
                    personaje_id: selectedPj.id,
                    social_class: selectedOption // <--- IMPORTANTE: Ahora sí enviamos la clase social
                })
            });

            const data = await res.json();
            
            if (res.ok) {
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
                    npcs_affected: data.npcs_affected || []
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
                    Elige el nivel de vida que deseas mantener durante estos días.
                </p>
            </div>

            {/* Selector de Personaje */}
            <div className="max-w-md">
                <label className="block mb-2 font-bold text-madera-oscura">¿Quién paga la ronda?</label>
                <Dropdown 
                    options={pjOptions} 
                    value={selectedPjId} 
                    onChange={(e) => setSelectedPjId(e.target.value)} 
                    placeholder="Selecciona un personaje..."
                />
            </div>

            {/* Selector de Clase Social (Grid de Tarjetas) */}
            {selectedPj && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 animate-fade-in">
                    {JUERGA_OPTIONS.map((opt) => {
                        const canAfford = selectedPj.oro >= opt.cost;
                        const isSelected = selectedOption === opt.id;
                        
                        return (
                            <div 
                                key={opt.id}
                                onClick={() => canAfford && setSelectedOption(opt.id)}
                                className={`
                                    cursor-pointer border-2 rounded-xl p-4 transition-all duration-200 relative overflow-hidden
                                    ${isSelected 
                                        ? 'border-bosque bg-bosque/5 scale-105 shadow-md' 
                                        : 'border-stone-200 bg-white hover:border-madera-oscura/50'
                                    }
                                    ${!canAfford ? 'opacity-50 grayscale cursor-not-allowed' : ''}
                                `}
                            >
                                {isSelected && <div className="absolute top-2 right-2 text-bosque"><FaCheckCircle/></div>}
                                
                                <div className="text-3xl mb-3 opacity-80">{opt.icon}</div>
                                <h3 className="font-title text-lg text-stone-800">{opt.title}</h3>
                                <p className="text-xs font-bold text-madera-oscura mt-1 mb-2">{opt.cost} gp</p>
                                <p className="text-xs text-stone-500 leading-tight">{opt.desc}</p>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Botón de Acción */}
            <div className="flex justify-end pt-4">
                <Button 
                    variant="primary" 
                    onClick={handleRoll}
                    className={`px-8 py-3 text-lg shadow-lg ${(!selectedPjId || !selectedOption || isLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={!selectedPjId || !selectedOption || isLoading}
                >
                    {isLoading ? 'Tirando dados...' : (
                        <div className="flex items-center gap-2">
                            <FaDiceD20 /> ¡A Beber! (-5 Días)
                        </div>
                    )}
                </Button>
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
                        <div className="flex justify-center items-center gap-4">
                            <div className="relative">
                                <FaDiceD20 className={`text-6xl ${result.type === 'failure' ? 'text-carmesi' : 'text-bosque'}`} />
                                <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-xl pt-1">
                                    {result.roll}
                                </span>
                            </div>
                            <div className="text-2xl font-title text-stone-400">=</div>
                            <div className="text-left">
                                <p className="text-xs uppercase font-bold text-stone-500">Total (Persuasión)</p>
                                <p className="text-4xl font-bold text-madera-oscura">{result.total}</p>
                                <p className="text-xs text-stone-400">({result.roll} dado + {result.mod} mod)</p>
                            </div>
                        </div>

                        <div className={`p-4 rounded-lg border ${
                            result.type === 'failure' ? 'bg-carmesi/10 border-carmesi text-carmesi' : 
                            result.type === 'neutral' ? 'bg-stone-100 border-stone-300 text-stone-600' : 
                            'bg-bosque/10 border-bosque text-bosque'
                        }`}>
                            <p className="font-bold text-lg mb-1">{result.outcome}</p>
                        </div>

                        {/* Lista de NPCs Afectados */}
                        {result.npcs_affected && result.npcs_affected.length > 0 && (
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