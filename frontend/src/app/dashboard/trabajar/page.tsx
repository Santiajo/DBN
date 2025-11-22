'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Trabajo, Personaje, Proficiencia, BonusProficiencia, ProgresoTrabajo } from '@/types';
import Button from "@/components/button";
import Modal from '@/components/modal';
import Input from '@/components/input';
// Importamos el formulario que ya existe en la otra carpeta
import TrabajarForm from '../trabajar/trabajar-form';
import { FaHammer, FaSearch, FaBriefcase, FaCoins, FaClock } from 'react-icons/fa';
import ConfirmAlert from '@/components/confirm-alert';

// Helper para URL
const buildApiUrl = (endpoint: string) => {
  const baseUrl = 'https://dbn.onrender.com';
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${baseUrl}/api/${normalizedEndpoint}`;
};

export default function TrabajarUserPage() {
    const { user, accessToken } = useAuth();
    const [successAlert, setSuccessAlert] = useState({
        isOpen: false,
        gold: 0
    });

    // --- ESTADOS DE DATOS ---
    const [trabajos, setTrabajos] = useState<Trabajo[]>([]);
    const [personajes, setPersonajes] = useState<Personaje[]>([]);
    const [proficiencias, setProficiencias] = useState<Proficiencia[]>([]);
    const [bonusTabla, setBonusTabla] = useState<BonusProficiencia[]>([]);
    const [progresoTrabajos, setProgresoTrabajos] = useState<ProgresoTrabajo[]>([]);
    
    // --- ESTADOS DE UI ---
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTrabajo, setSelectedTrabajo] = useState<Trabajo | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);


    const fetchAllData = useCallback(async () => {
        if (!accessToken) return;
        setIsLoading(true);

        try {
            const headers = { 'Authorization': `Bearer ${accessToken}` };

            const resTrabajos = await fetch(buildApiUrl(`trabajos/?search=${searchTerm}`), { headers });
            const dataTrabajos = await resTrabajos.json();
            let listaTrabajos: Trabajo[] = dataTrabajos.results || dataTrabajos || [];

            listaTrabajos = await Promise.all(listaTrabajos.map(async (t) => {
                try {
                    const resPagos = await fetch(buildApiUrl(`trabajos/${t.id}/pagos/`), { headers });
                    if (resPagos.ok) {
                        const dataPagos = await resPagos.json();
                        t.pagos = dataPagos.results || dataPagos || [];
                    } else { t.pagos = []; }
                } catch { t.pagos = []; }
                return t;
            }));
            setTrabajos(listaTrabajos);

            const [resPj, resProf, resBonus, resProg] = await Promise.all([
                fetch(buildApiUrl('personajes/'), { headers }),
                fetch(buildApiUrl('proficiencias/'), { headers }),
                fetch(buildApiUrl('bonusproficiencias/'), { headers }),
                fetch(buildApiUrl('progreso-trabajos/'), { headers })
            ]);

            const dataPj = await resPj.json();
            setPersonajes(dataPj.results || dataPj || []);

            const dataProf = await resProf.json();
            setProficiencias(dataProf.results || dataProf || []);

            const dataBonus = await resBonus.json();
            setBonusTabla(dataBonus.results || dataBonus || []);

            const dataProg = await resProg.json();
            setProgresoTrabajos(dataProg.results || dataProg || []);

        } catch (error) {
            console.error("Error cargando datos:", error);
        } finally {
            setIsLoading(false);
        }
    }, [accessToken, searchTerm]);

    useEffect(() => {
        if (user) fetchAllData();
    }, [user, fetchAllData]);


    // --- HANDLERS ---
    const handleOpenTrabajarModal = (trabajo: Trabajo) => {
        setSelectedTrabajo(trabajo);
        setIsModalOpen(true);
    };

    const handleWorkSuccess = (oroGanado: number) => {
        setIsModalOpen(false);
        fetchAllData();

        setSuccessAlert({
            isOpen: true,
            gold: oroGanado
        });
    };

    return (
        <div className="p-8 space-y-8 font-body text-stone-800">
            
            {/* HEADER ESTILO RPG */}
            <div className="border-b-2 border-madera-oscura/20 pb-4 flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h1 className="text-3xl font-title text-madera-oscura flex items-center gap-3">
                        <FaBriefcase className="text-bosque" /> Tablón de Anuncios
                    </h1>
                    <p className="text-stone-600 mt-2 max-w-2xl">
                        Busca un empleo honesto para ganar oro y experiencia. 
                        Mejora tus habilidades y sube de rango para obtener mayores recompensas.
                    </p>
                </div>
                
                {/* BÚSQUEDA */}
                <div className="flex gap-2 w-full md:w-auto">
                    <Input 
                        placeholder="Buscar empleo..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchAllData()}
                    />
                    <Button variant="secondary" onClick={() => fetchAllData()}>
                        <FaSearch />
                    </Button>
                </div>
            </div>

            {/* GRID DE TARJETAS DE TRABAJO */}
            {isLoading ? (
                <div className="p-8 font-title text-center text-stone-500 animate-pulse">
                    Consultando ofertas disponibles...
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in">
                    {trabajos.map((trabajo) => {
                        // Calcular rango máximo disponible visualmente
                        const maxRank = trabajo.pagos?.length || 0;
                        
                        return (
                            <div 
                                key={trabajo.id}
                                className="group relative bg-white border-2 border-stone-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-bosque/50 transition-all duration-300 flex flex-col justify-between h-full"
                            >
                                {/* Icono Decorativo de Fondo */}
                                <div className="absolute top-2 right-2 text-stone-100 text-6xl group-hover:text-bosque/10 transition-colors">
                                    <FaHammer />
                                </div>

                                <div className="relative z-10">
                                    <h3 className="font-title text-xl text-madera-oscura group-hover:text-bosque transition-colors mb-1">
                                        {trabajo.nombre}
                                    </h3>
                                    <div className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                                        <span className="bg-stone-100 px-2 py-1 rounded border border-stone-200">
                                            {trabajo.requisito_habilidad_nombre || 'Sin requisito'}
                                        </span>
                                        <span className="text-stone-400">|</span>
                                        <span>Máx Rango {trabajo.rango_maximo}</span>
                                    </div>
                                    
                                    <p className="text-sm text-stone-600 line-clamp-3 mb-4">
                                        {trabajo.descripcion || "Una oportunidad de trabajo estándar."}
                                    </p>

                                    {/* Info de beneficios */}
                                    {trabajo.beneficio && (
                                        <div className="bg-pergamino/30 p-2 rounded border border-madera-oscura/10 text-xs text-stone-700 mb-4 italic">
                                            {trabajo.beneficio}
                                        </div>
                                    )}
                                </div>

                                {/* Footer de la tarjeta */}
                                <div className="relative z-10 mt-auto pt-4 border-t border-stone-100 flex items-center justify-between gap-2">
                                    <div className="text-xs text-stone-400 flex flex-col">
                                        <span className="flex items-center gap-1"><FaCoins className="text-yellow-500"/> Pagos variados</span>
                                        <span className="flex items-center gap-1"><FaClock/> Tiempo libre</span>
                                    </div>
                                    
                                    <Button 
                                        variant="primary" 
                                        onClick={() => handleOpenTrabajarModal(trabajo)}
                                        className="shadow-md flex"
                                    >
                                        <FaHammer className="mr-2" /> Trabajar
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* MODAL DE TRABAJAR (Reutilizado) */}
            {selectedTrabajo && (
                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title={`Trabajar como: ${selectedTrabajo.nombre}`}
                >
                    <TrabajarForm
                        trabajo={selectedTrabajo}
                        personajes={personajes}
                        proficiencias={proficiencias}
                        bonusTabla={bonusTabla}
                        progresoTrabajos={progresoTrabajos}
                        accessToken={accessToken!}
                        onClose={() => setIsModalOpen(false)}
                        onWorkSuccess={handleWorkSuccess}
                    />
                </Modal>
            )}
            <ConfirmAlert
                isOpen={successAlert.isOpen}
                onClose={() => setSuccessAlert({ ...successAlert, isOpen: false })}
                onConfirm={() => setSuccessAlert({ ...successAlert, isOpen: false })}
                title="¡TRABAJO COMPLETADO!"
                message={`Has realizado tus labores correctamente. Has ganado ${successAlert.gold.toFixed(2)} gp.`}
            />
        </div>
        
    );
}