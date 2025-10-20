'use client';

import { useState, useEffect, useMemo } from 'react';
import Input from '@/components/input'; 
import Button from '@/components/button';
import Select from 'react-select'; // Importado para manejar grandes listas
import { FaTrash, FaPlus, FaCoins, FaMagic } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext'; 

// ----------------------------------------------------
// --- TIPOS DE DATOS ---
// ----------------------------------------------------

// Definiciones de tipos y constantes (sin cambios, necesarias para TS)
const DIFICULTAD_CHOICES = [
    { value: 'Facil', label: 'Fácil' },
    { value: 'Medio', label: 'Medio' },
    { value: 'Dificil', label: 'Difícil' },
    { value: 'Muy dificil', label: 'Muy Difícil' },
    { value: 'Oculto', label: 'Oculto' },
];

interface Objeto {
    id: number;
    Name: string;
}

interface IngredienteForm {
    id?: number; 
    objeto: number | string;
    cantidad: number;
    nombre_objeto?: string;
}

interface RecetaFormData {
    nombre: string;
    objeto_final: number | string;
    cantidad_final: number;
    es_magico: boolean;
    oro_necesario: number;
    dificultad: string;
    ingredientes: Omit<IngredienteForm, 'nombre_objeto'>[];
}

interface Receta {
    id: number;
    nombre: string;
    objeto_final: number;
    nombre_objeto_final: string;
    ingredientes: {
        id: number;
        objeto: number; 
        cantidad: number;
        nombre_ingrediente: string;
    }[];
    cantidad_final: number;
    es_magico: boolean;
    oro_necesario: number;
    dificultad: string;
}

interface RecetaFormProps {
    onSave: (receta: RecetaFormData) => Promise<void>;
    onCancel: () => void;
    initialData?: Receta | null;
}

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

    // Opciones para react-select, memorizadas para no recalcular
    const objetoOptions = useMemo(() => {
        return objetos.map(o => ({
            value: o.id,
            label: o.Name,
        }));
    }, [objetos]);

    // Estilos personalizados para react-select (para seguir tu diseño)
    const customSelectStyles = {
        control: (base: any) => ({
            ...base,
            borderColor: '#a8a29e', // stone-400
            boxShadow: 'none',
            '&:hover': { borderColor: '#a8a29e' },
        }),
        option: (base: any, state: { isFocused: any; }) => ({
            ...base,
            backgroundColor: state.isFocused ? '#EBE3D6' : 'white', // stone-100
            color: '#44403c', // stone-800
            cursor: 'pointer',
        }),
        singleValue: (base: any) => ({
            ...base,
            color: '#44403c', // stone-800
        }),
        menu: (base: any) => ({
            ...base,
            zIndex: 9999, // Asegura que el dropdown esté por encima de otros elementos
        })
    };


    // 1. Cargar la lista de Objetos (todos)
    useEffect(() => {
        const fetchObjetos = async () => {
            if (!accessToken) return;
            setLoadingObjetos(true);
            try {
                // Endpoint para listar todos los Objetos (usar paginación si es necesario en el backend)
                const res = await fetch(`${apiUrl}/api/objetos/`, {
                    headers: { 'Authorization': `Bearer ${accessToken}` },
                });
                if (!res.ok) throw new Error('Error al cargar objetos');
                
                // Asumo que tu API devuelve una lista completa de objetos (o ya está paginada)
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
            const initialRecetaData: RecetaFormData = {
                nombre: initialData.nombre,
                objeto_final: initialData.objeto_final, 
                cantidad_final: initialData.cantidad_final,
                es_magico: initialData.es_magico,
                oro_necesario: initialData.oro_necesario,
                dificultad: initialData.dificultad,
                ingredientes: initialData.ingredientes.map(ing => ({
                    id: ing.id,
                    objeto: ing.objeto, 
                    cantidad: ing.cantidad,
                })),
            };
            setFormData(initialRecetaData);
            
            setIngredientesForm(initialData.ingredientes.map(ing => ({
                id: ing.id,
                objeto: ing.objeto, 
                cantidad: ing.cantidad,
                nombre_objeto: ing.nombre_ingrediente, 
            })));
        } else {
            setFormData(defaultFormState);
            setIngredientesForm([]);
        }
    }, [initialData]);


    // 3. Manejadores de cambios para campos principales de la Receta
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type, checked } = e.target as HTMLInputElement;
        
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' 
                ? parseInt(value, 10) || 0 // Asegura que siempre se guarda un número
                : type === 'checkbox'
                ? checked
                : value,
        }));
    };

    // 4. Manejadores para la lista de Ingredientes

    // Función auxiliar para obtener el nombre (útil antes de que los objetos se carguen)
    const getObjectNameById = (id: number | string): string => {
        const objeto = objetos.find(o => o.id.toString() === id.toString());
        return objeto ? objeto.Name : `ID: ${id}`;
    };

    // Añadir nuevo ingrediente
    const handleAddIngrediente = () => {
        // Usar un valor por defecto válido del primer objeto si la lista no está vacía
        const defaultObject = objetos.length > 0 ? objetos[0] : { id: '', Name: '' };

        setIngredientesForm(prev => [
            ...prev,
            { 
                objeto: defaultObject.id, 
                cantidad: 1, 
                nombre_objeto: defaultObject.Name 
            }
        ]);
        // Sincronizar formData inmediatamente con el nuevo ingrediente por defecto
        setFormData(prevForm => ({
            ...prevForm,
            ingredientes: [
                ...prevForm.ingredientes, 
                { objeto: defaultObject.id, cantidad: 1 } as Omit<IngredienteForm, 'nombre_objeto'>
            ]
        }));
    };

    // Cambiar ingrediente (Objeto o Cantidad)
    const handleIngredienteChange = (index: number, name: 'objeto' | 'cantidad', value: string | number) => {
        setIngredientesForm(prev => {
            const newIngredientes = [...prev];
            
            // Si es cantidad, aseguramos que sea un número válido. 
            // Si es objeto, aseguramos que sea el ID.
            const newValue = name === 'cantidad' ? (typeof value === 'string' ? parseInt(value, 10) || 1 : value) : value;
            
            newIngredientes[index] = {
                ...newIngredientes[index],
                [name]: newValue,
                nombre_objeto: name === 'objeto' ? getObjectNameById(newValue) : newIngredientes[index].nombre_objeto
            };

            // Sincronizar el estado de RecetaFormData (solo IDs y Cantidades)
            const formIngredientes = newIngredientes.map(ing => ({
                id: ing.id, 
                objeto: ing.objeto,
                cantidad: ing.cantidad
            }));

            setFormData(prevForm => ({
                ...prevForm,
                // Filtrar ingredientes con ID de objeto válido
                ingredientes: formIngredientes.filter(i => i.objeto !== '') as Omit<IngredienteForm, 'nombre_objeto'>[]
            }));

            return newIngredientes;
        });
    };

    // Eliminar ingrediente
    const handleRemoveIngrediente = (index: number) => {
        setIngredientesForm(prev => {
            const newIngredientes = prev.filter((_, i) => i !== index);

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

    // Vista de carga y validación
    if (loadingObjetos) return <div className="p-4 text-center font-body">Cargando objetos disponibles... ⏳</div>;
    
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
                    
                    {/* >>> CAMBIO: Uso de React-Select para Objeto Final <<< */}
                    <Select
                        id="objeto_final"
                        name="objeto_final"
                        options={objetoOptions}
                        value={objetoOptions.find(option => option.value === formData.objeto_final)}
                        onChange={(selectedOption) => {
                            if (selectedOption) {
                                setFormData(prev => ({
                                    ...prev,
                                    objeto_final: selectedOption.value,
                                }));
                            }
                        }}
                        isClearable={true}
                        placeholder="Buscar y seleccionar objeto..."
                        required
                        className="text-stone-800"
                        styles={customSelectStyles}
                    />
                    {/* >>> FIN CAMBIO <<< */}

                </div>
                <div>
                    <label htmlFor="cantidad_final" className="block mb-1 font-semibold">Cantidad Final</label>
                    <Input 
                        id="cantidad_final" 
                        name="cantidad_final" 
                        type="number" 
                        // Cambio: Usar String() para asegurar que el input controlado funciona
                        value={String(formData.cantidad_final)} 
                        onChange={handleChange} 
                        min={1} 
                        required 
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                    <Input id="es_magico" name="es_magico" type="checkbox" checked={formData.es_magico} onChange={handleChange} className="w-auto h-5" />
                    <label htmlFor="es_magico" className="font-semibold flex items-center gap-2"><FaMagic className="text-purple-600"/>¿Es Mágico?</label>
                </div>
                <div>
                    <label htmlFor="oro_necesario" className="block mb-1 font-semibold flex items-center gap-2"><FaCoins className="text-yellow-500"/>Oro Necesario</label>
                    <Input id="oro_necesario" name="oro_necesario" type="number" value={String(formData.oro_necesario)} onChange={handleChange} min={0} />
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
                        {/* Selector de Objeto (Ingrediente) */}
                        <div className="flex-grow">
                            <label htmlFor={`ingrediente-objeto-${index}`} className="block mb-1 text-sm font-medium">Ingrediente</label>
                            
                            {/* >>> CAMBIO: Uso de React-Select para Ingrediente <<< */}
                            <Select
                                id={`ingrediente-objeto-${index}`} 
                                name={`ingrediente-objeto-${index}`} 
                                options={objetoOptions}
                                value={objetoOptions.find(option => option.value === ingrediente.objeto)}
                                onChange={(selectedOption) => {
                                    // Se usa String() porque el valor del select/form data puede ser string o number
                                    const value = selectedOption ? String(selectedOption.value) : '';
                                    handleIngredienteChange(index, 'objeto', value);
                                }}
                                isClearable={true}
                                placeholder="Buscar ingrediente..."
                                required
                                className="text-sm text-stone-800"
                                styles={customSelectStyles}
                            />
                            {/* >>> FIN CAMBIO <<< */}

                        </div>
                        
                        {/* Cantidad */}
                        <div className="w-24">
                            <label htmlFor={`ingrediente-cantidad-${index}`} className="block mb-1 text-sm font-medium">Cantidad</label>
                            <Input 
                                id={`ingrediente-cantidad-${index}`} 
                                type="number" 
                                // Cambio: Usar String() para ligar al input, resuelve el problema de "no cambiar"
                                value={String(ingrediente.cantidad)} 
                                onChange={(e) => {
                                    // Cambio: Asegurar que se pasa un número válido a la función de cambio
                                    const numValue = parseInt(e.target.value, 10) || 1;
                                    handleIngredienteChange(index, 'cantidad', numValue);
                                }} 
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