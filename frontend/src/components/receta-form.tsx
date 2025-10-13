'use client';

import { useState, useEffect, useMemo } from 'react';
// Asegúrate de que estas importaciones sean correctas para tu proyecto
import Input from '@/components/input'; 
import Button from '@/components/button';
import { FaTrash, FaPlus, FaCoins, FaMagic } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext'; 

// ----------------------------------------------------
// --- TIPOS DE DATOS (Necesarios para TypeScript) ---
// ----------------------------------------------------

// Definición de las opciones de dificultad (copiadas de tu modelo)
const DIFICULTAD_CHOICES = [
    { value: 'Facil', label: 'Fácil' },
    { value: 'Medio', label: 'Medio' },
    { value: 'Dificil', label: 'Difícil' },
    { value: 'Muy dificil', label: 'Muy Difícil' },
    { value: 'Oculto', label: 'Oculto' },
];

// Tipo para el Objeto (para los selects)
interface Objeto {
    id: number;
    Name: string; // Asumo que el campo es 'Name'
}

// Tipo para un Ingrediente en el formulario (incluye el nombre para visualización)
interface IngredienteForm {
    id?: number; 
    objeto: number | string; // ID del Objeto
    cantidad: number;
    nombre_objeto?: string; // Para mostrar el nombre sin hacer otra búsqueda
}

// Tipo para los datos que el formulario va a enviar (sin 'nombre_objeto_final', etc.)
interface RecetaFormData {
    nombre: string;
    objeto_final: number | string; // ID del Objeto final
    cantidad_final: number;
    es_magico: boolean;
    oro_necesario: number;
    dificultad: string;
    // Ingredientes anidados que se pasarán a la función onSave
    ingredientes: Omit<IngredienteForm, 'nombre_objeto'>[];
}

// Interfaz COMPLETA de la receta (tal como la devuelve tu API para initialData)
interface Receta {
    id: number;
    nombre: string;
    objeto_final: number; // ID del Objeto final
    nombre_objeto_final: string; // Nombre para visualización
    ingredientes: {
        id: number;
        objeto: number; // ID del Objeto ingrediente
        cantidad: number;
        nombre_ingrediente: string; // Nombre para visualización
    }[];
    cantidad_final: number;
    es_magico: boolean;
    oro_necesario: number;
    dificultad: string;
}

// Propiedades del componente
interface RecetaFormProps {
    onSave: (receta: RecetaFormData) => Promise<void>;
    onCancel: () => void;
    initialData?: Receta | null; // El objeto Receta completo (para edición)
}

// Estado inicial por defecto para una nueva receta.
const defaultFormState: RecetaFormData = {
    nombre: '',
    objeto_final: '', 
    cantidad_final: 1,
    es_magico: false,
    oro_necesario: 0,
    dificultad: 'Facil',
    ingredientes: [],
};

// ----------------------------------------------------
// --- EL COMPONENTE ---
// ----------------------------------------------------

export default function RecetaForm({ onSave, onCancel, initialData }: RecetaFormProps) {
    const { accessToken } = useAuth();
    
    const [formData, setFormData] = useState<RecetaFormData>(defaultFormState);
    const [objetos, setObjetos] = useState<Objeto[]>([]);
    const [ingredientesForm, setIngredientesForm] = useState<IngredienteForm[]>([]);
    const [loadingObjetos, setLoadingObjetos] = useState(true);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    // 1. Cargar la lista de Objetos al montar el componente (para selects)
    useEffect(() => {
        const fetchObjetos = async () => {
            if (!accessToken) return;
            setLoadingObjetos(true);
            try {
                // Endpoint para listar todos los Objetos
                const res = await fetch(`${apiUrl}/api/objetos/`, {
                    headers: { 'Authorization': `Bearer ${accessToken}` },
                });
                if (!res.ok) throw new Error('Error al cargar objetos');
                
                const data = await res.json();
                setObjetos(data.results || data); 
            } catch (error) {
                console.error("Error cargando objetos:", error);
            } finally {
                setLoadingObjetos(false);
            }
        };
        fetchObjetos();
    }, [accessToken, apiUrl]);

    // 2. Cargar datos iniciales de la receta (para edición)
    useEffect(() => {
        if (initialData) {
            // A. Cargar datos de la Receta principal
            const initialRecetaData: RecetaFormData = {
                nombre: initialData.nombre,
                objeto_final: initialData.objeto_final, 
                cantidad_final: initialData.cantidad_final,
                es_magico: initialData.es_magico,
                oro_necesario: initialData.oro_necesario,
                dificultad: initialData.dificultad,
                // El campo ingredientes se sincroniza más abajo
                ingredientes: initialData.ingredientes.map(ing => ({
                    id: ing.id,
                    objeto: ing.objeto, 
                    cantidad: ing.cantidad,
                })),
            };
            setFormData(initialRecetaData);
            
            // B. Cargar ingredientes para visualización en el formulario
            setIngredientesForm(initialData.ingredientes.map(ing => ({
                id: ing.id,
                objeto: ing.objeto, 
                cantidad: ing.cantidad,
                nombre_objeto: ing.nombre_ingrediente, // Usamos el nombre del serializer
            })));
        } else {
            // Creando nuevo
            setFormData(defaultFormState);
            setIngredientesForm([]);
        }
    }, [initialData]);

    // Obtiene el nombre de un objeto por su ID (para visualización)
    const getObjectNameById = (id: number | string): string => {
        const objeto = objetos.find(o => o.id.toString() === id.toString());
        return objeto ? objeto.Name : `ID: ${id}`;
    };

    // 3. Manejadores de cambios para campos principales de la Receta
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type, checked } = e.target as HTMLInputElement;
        
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' 
                ? parseInt(value, 10) || 0 
                : type === 'checkbox'
                ? checked
                : value,
        }));
    };

    // 4. Manejadores para la lista de Ingredientes

    // Añadir nuevo ingrediente
    const handleAddIngrediente = () => {
        setIngredientesForm(prev => [
            ...prev,
            // Usar el primer objeto como valor por defecto, si existe
            { objeto: objetos[0]?.id || '', cantidad: 1, nombre_objeto: objetos[0]?.Name || '' }
        ]);
        // Se sincronizará con formData en la siguiente llamada a handleIngredienteChange/handleSubmit
    };

    // Cambiar ingrediente (Objeto o Cantidad)
    const handleIngredienteChange = (index: number, name: 'objeto' | 'cantidad', value: string | number) => {
        setIngredientesForm(prev => {
            const newIngredientes = [...prev];
            const newValue = name === 'cantidad' ? (typeof value === 'string' ? parseInt(value, 10) || 1 : value) : value;
            
            newIngredientes[index] = {
                ...newIngredientes[index],
                [name]: newValue,
                // Actualizar nombre para visualización si se cambia el objeto
                nombre_objeto: name === 'objeto' ? getObjectNameById(newValue) : newIngredientes[index].nombre_objeto
            };

            // Sincronizar el estado de la RecetaFormData
            const formIngredientes = newIngredientes.map(ing => ({
                id: ing.id, 
                objeto: ing.objeto,
                cantidad: ing.cantidad
            }));

            setFormData(prevForm => ({
                ...prevForm,
                // Filtrar ingredientes con ID de objeto válido antes de guardar
                ingredientes: formIngredientes.filter(i => i.objeto !== '') as Omit<IngredienteForm, 'nombre_objeto'>[]
            }));

            return newIngredientes;
        });
    };

    // Eliminar ingrediente
    const handleRemoveIngrediente = (index: number) => {
        setIngredientesForm(prev => {
            const newIngredientes = prev.filter((_, i) => i !== index);

            // Sincronizar el estado de la RecetaFormData
            const formIngredientes = newIngredientes.map(ing => ({
                id: ing.id, 
                objeto: ing.objeto,
                cantidad: ing.cantidad
            }));

            setFormData(prevForm => ({
                ...prevForm,
                ingredientes: formIngredientes.filter(i => i.objeto !== '') as Omit<IngredienteForm, 'nombre_objeto'>[]
            }));

            return newIngredientes;
        });
    };
    
    // 5. Enviar formulario
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    // Mostrar un estado de carga
    if (loadingObjetos) return <div className="p-4 text-center font-body">Cargando objetos disponibles... ⏳</div>;
    
    // Validar si hay objetos para crear la receta
    if (objetos.length === 0) return <div className="p-4 text-center font-body text-red-600">No hay objetos disponibles. No se pueden crear recetas. 😥</div>;


    return (
        <form onSubmit={handleSubmit} className="space-y-6 font-body text-stone-800 max-h-[70vh] overflow-y-auto pr-4 scrollbar-custom">
            
            {/* Sección de la Receta Principal */}
            <h4 className="font-title text-xl border-b border-madera-oscura pb-1 text-bosque">Detalles de la Receta</h4>
            
            <div>
                <label htmlFor="nombre" className="block mb-1 font-semibold">Nombre de la Receta</label>
                <Input id="nombre" name="nombre" value={formData.nombre} onChange={handleChange} required />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="objeto_final" className="block mb-1 font-semibold">Objeto Final Producido</label>
                    <select id="objeto_final" name="objeto_final" value={formData.objeto_final} onChange={handleChange} required className="w-full px-4 py-2 rounded-lg border border-stone-400 bg-white focus:ring-2 focus:ring-bosque">
                        <option value="" disabled>Selecciona un objeto</option>
                        {objetos.map(o => (
                            <option key={o.id} value={o.id}>{o.Name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="cantidad_final" className="block mb-1 font-semibold">Cantidad Final</label>
                    <Input id="cantidad_final" name="cantidad_final" type="number" value={formData.cantidad_final} onChange={handleChange} min={1} required />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                    <Input id="es_magico" name="es_magico" type="checkbox" checked={formData.es_magico} onChange={handleChange} className="w-auto h-5" />
                    <label htmlFor="es_magico" className="font-semibold flex items-center gap-2"><FaMagic className="text-purple-600"/>¿Es Mágico?</label>
                </div>
                <div>
                    <label htmlFor="oro_necesario" className="block mb-1 font-semibold flex items-center gap-2"><FaCoins className="text-yellow-500"/>Oro Necesario</label>
                    <Input id="oro_necesario" name="oro_necesario" type="number" value={formData.oro_necesario} onChange={handleChange} min={0} />
                </div>
            </div>
            
            <div>
                <label htmlFor="dificultad" className="block mb-1 font-semibold">Dificultad</label>
                <select id="dificultad" name="dificultad" value={formData.dificultad} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-stone-400 bg-white focus:ring-2 focus:ring-bosque">
                    {DIFICULTAD_CHOICES.map(d => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                </select>
            </div>

            {/* Sección de Ingredientes */}
            <h4 className="font-title text-xl border-b border-madera-oscura pb-1 pt-4 text-bosque">Ingredientes</h4>
            
            <div className="space-y-3">
                {ingredientesForm.map((ingrediente, index) => (
                    <div key={index} className="flex items-end gap-3 p-3 border border-madera-oscura rounded-lg bg-stone-50">
                        {/* Selector de Objeto */}
                        <div className="flex-grow">
                            <label htmlFor={`ingrediente-objeto-${index}`} className="block mb-1 text-sm font-medium">Ingrediente</label>
                            <select 
                                id={`ingrediente-objeto-${index}`} 
                                // El ID del objeto es el valor
                                value={ingrediente.objeto} 
                                onChange={(e) => handleIngredienteChange(index, 'objeto', e.target.value)} 
                                required 
                                className="w-full px-3 py-2 rounded-lg border border-stone-400 bg-white focus:ring-2 focus:ring-bosque text-sm"
                            >
                                <option value="" disabled>Selecciona un ingrediente</option>
                                {objetos.map(o => (
                                    <option key={o.id} value={o.id}>{o.Name}</option>
                                ))}
                            </select>
                        </div>
                        
                        {/* Cantidad */}
                        <div className="w-24">
                            <label htmlFor={`ingrediente-cantidad-${index}`} className="block mb-1 text-sm font-medium">Cantidad</label>
                            <Input 
                                id={`ingrediente-cantidad-${index}`} 
                                type="number" 
                                value={ingrediente.cantidad} 
                                onChange={(e) => handleIngredienteChange(index, 'cantidad', e.target.value)} 
                                min={1} 
                                required
                                className="text-sm text-center"
                            />
                        </div>

                        {/* Botón de Eliminar */}
                        <Button 
                            type="button" 
                            variant="dangerous" 
                            onClick={() => handleRemoveIngrediente(index)}
                            className="p-3 h-full"
                        >
                            <FaTrash />
                        </Button>
                    </div>
                ))}

                <Button type="button" variant="secondary" onClick={handleAddIngrediente} className="w-full justify-center">
                    <FaPlus className="mr-2" />Añadir Ingrediente
                </Button>
            </div>


            <div className="flex justify-end gap-4 pt-4 border-t border-madera">
                <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
                <Button type="submit" variant="primary">{initialData ? 'Guardar Cambios' : 'Crear Receta'}</Button>
            </div>
        </form>
    );
}