'use client';

import { useState, useMemo, useEffect } from 'react';
import { Trabajo, Personaje, Proficiencia, BonusProficiencia, ProgresoTrabajo } from '@/types';
import Input from '@/components/input';
import Button from '@/components/button';
import Dropdown, { OptionType } from '@/components/dropdown';

const buildApiUrl = (endpoint: string) => {
  const baseUrl = 'https://dbn.onrender.com'; 
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${baseUrl}/api/${normalizedEndpoint}`;
};

/**
 * Traduce la tirada de d20 al multiplicador de desempeño
 */
const getDesempenio = (tiradaD20: number): number => {
    if (tiradaD20 <= 5) return 0.5;
    if (tiradaD20 <= 10) return 0.75;
    if (tiradaD20 <= 15) return 1.0;
    if (tiradaD20 <= 19) return 1.25;
    if (tiradaD20 === 20) return 1.5; // O 2.0, como prefieras
    return 1.0;
};

/**
 * Calcula el modificador de estadística de D&D
 */
const calcularModificador = (puntuacion: number): number => {
    return Math.floor((puntuacion - 10) / 2);
};


interface TrabajarFormProps {
    trabajo: Trabajo;
    personajes: Personaje[];
    proficiencias: Proficiencia[];
    bonusTabla: BonusProficiencia[];
    progresoTrabajos: ProgresoTrabajo[];
    accessToken: string;
    onClose: () => void;
    onWorkSuccess: (oroGanado: number) => void;
}

export default function TrabajarForm({
    trabajo,
    personajes,
    proficiencias,
    bonusTabla,
    accessToken,
    onClose,
    progresoTrabajos,
    onWorkSuccess
}: TrabajarFormProps) {

    // --- ESTADO DEL FORMULARIO ---
    const [selectedPersonajeId, setSelectedPersonajeId] = useState<string>(
        personajes.length > 0 ? String(personajes[0].id) : ''
    );
    
    const currentRank = useMemo(() => {
        const progreso = progresoTrabajos.find(
            p => p.personaje === Number(selectedPersonajeId) && p.trabajo === trabajo.id
        );
        return progreso ? progreso.rango_actual : 1; 
    }, [progresoTrabajos, selectedPersonajeId, trabajo.id]);

    const [rango, setRango] = useState<number>(currentRank);
    
    useEffect(() => {
        setRango(currentRank);
    }, [currentRank]);

    const [diasTrabajados, setDiasTrabajados] = useState<number>(1);
    const [bonoEconomia, setBonoEconomia] = useState<number>(0);
    const [tiradaD20, setTiradaD20] = useState<number>(10);
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
   const { 
        personaje, 
        modificadorEstadistica, 
        bonusProficiencia 
    } = useMemo(() => {
        
        const pj = personajes.find(p => p.id === Number(selectedPersonajeId));
        if (!pj) return { personaje: null, modificadorEstadistica: 0, bonusProficiencia: 0 };

        let mod = 0;

        const statKey = trabajo.requisito_habilidad_estadistica as keyof Personaje;
        
        if (statKey && pj[statKey] !== undefined) {

            const statValue = pj[statKey] as number;

            mod = calcularModificador(statValue);
        } else {

            console.warn(`No se pudo encontrar la estadística '${statKey}' en el personaje.`);
        }

        let bonus = 0;
        const tieneProficiencia = proficiencias.find(
            p => p.personaje === pj.id && 
                 p.habilidad === trabajo.requisito_habilidad &&
                 p.es_proficiente
        );
        
        if (tieneProficiencia) {
            const bonusNivel = bonusTabla.find(b => b.nivel === pj.nivel);
            bonus = bonusNivel ? bonusNivel.bonus : 0;
        }
        
        return { 
            personaje: pj, 
            modificadorEstadistica: mod, 
            bonusProficiencia: bonus 
        };

    }, [selectedPersonajeId, personajes, trabajo, proficiencias, bonusTabla]);


    const personajeOptions: OptionType[] = personajes.map(p => ({
        value: String(p.id),
        label: p.nombre_personaje
    }));

    const rangoOptions: OptionType[] = (trabajo.pagos ?? [])
        .filter(pago => pago.rango === currentRank) 
        .map(pago => ({
            value: String(pago.rango),
            label: `Rango ${pago.rango}`
        }));

    const maxRank = (trabajo.pagos?.length ?? 0) === 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!personaje) {
            setError("Debes seleccionar un personaje válido.");
            return;
        }
        
        setIsLoading(true);
        setError(null);

        const multiplicadorDesempenio = getDesempenio(tiradaD20);

        const datosParaAPI = {
            personaje: personaje.id,
            trabajo: trabajo.id,
            rango: rango,
            dias_trabajados: diasTrabajados,
            bono_economia: bonoEconomia,
            modificador_estadistica: modificadorEstadistica,
            bonus_proficiencia: bonusProficiencia,
            desempenio: multiplicadorDesempenio
        };

        try {
            const url = buildApiUrl('trabajos-realizados/');
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify(datosParaAPI)
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.detail || errorData[Object.keys(errorData)[0]] || "Error al registrar el trabajo");
            }

            const trabajoCreado = await res.json(); 

            onWorkSuccess(trabajoCreado.pago_total);

        } catch (err: unknown) { 
            
            if (err instanceof Error) {
                setError(err.message);
            } else if (typeof err === 'string') {
                setError(err);
            } else {
                setError("Ocurrió un error inesperado.");
            }

        } finally {
            setIsLoading(false);
        }
    };


    return (
        <form onSubmit={handleSubmit} className="space-y-4 font-body">
            {/* --- INPUTS DEL USUARIO --- */}
            <div>
                <label className="block mb-1 font-semibold">Personaje</label>
                <Dropdown
                    options={personajeOptions}
                    value={selectedPersonajeId}
                    onChange={(e) => setSelectedPersonajeId(e.target.value)}
                />
                {personaje && (
                    <p className="text-xs text-stone-500 mt-1">
                        Tiempo libre disponible: {personaje.tiempo_libre} días
                    </p>
                )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block mb-1 font-semibold">Rango</label>
                    <Dropdown
                        options={rangoOptions}
                        value={String(rango)}
                        onChange={(e) => setRango(Number(e.target.value))}
                        disabled={true} 
                    />
                    {/* Muestra un mensaje si se alcanzó el rango 5 */}
                    {rangoOptions.length === 0 && !maxRank && (
                        <p className="text-xs text-stone-500 mt-1">
                            ¡Rango máximo alcanzado en este trabajo!
                        </p>
                    )}
                </div>
                <div>
                    <label className="block mb-1 font-semibold">Días a trabajar</label>
                    <Input
                        type="number"
                        min="1"
                        max={personaje?.tiempo_libre || 1}
                        value={String(diasTrabajados)}
                        onChange={(e) => setDiasTrabajados(Number(e.target.value))}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block mb-1 font-semibold">Bono de Economía</label>
                    <Input
                        type="number"
                        value={String(bonoEconomia)}
                        onChange={(e) => setBonoEconomia(Number(e.target.value))}
                    />
                </div>
                <div>
                    <label className="block mb-1 font-semibold">Tirada (d20)</label>
                    <Input
                        type="number"
                        min="1"
                        max="20"
                        value={String(tiradaD20)}
                        onChange={(e) => setTiradaD20(Number(e.target.value))}
                    />
                </div>
            </div>

            {/* --- CAMPOS AUTO-CALCULADOS (Solo lectura) --- */}
            <div className="p-3 bg-pergamino/50 rounded-lg space-y-2">
                <h4 className="font-semibold text-sm text-madera-oscura">Valores Calculados</h4>
                <div className="flex justify-between text-sm">
                    <span className="text-stone-600">Modificador (Stat):</span>
                    <span className="font-bold">{modificadorEstadistica}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-stone-600">Bonus Proficiencia:</span>
                    <span className="font-bold">{bonusProficiencia}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-stone-600">Mult. Desempeño:</span>
                    <span className="font-bold">x{getDesempenio(tiradaD20)}</span>
                </div>
            </div>

            {/* --- ERROR Y BOTONES --- */}
            {error && (
                <div className="text-red-600 bg-red-100 p-3 rounded-lg text-sm">
                    {error}
                </div>
            )}

            <div className="flex justify-end gap-4 pt-4">
                <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
                    Cancelar
                </Button>
                <Button type="submit" variant="primary" disabled={isLoading}>
                    {isLoading ? "Trabajando..." : "Confirmar Trabajo"}
                </Button>
            </div>
        </form>
    );
}