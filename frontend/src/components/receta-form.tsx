'use client';

import { useState, useEffect, useMemo } from 'react';
import Input from '@/components/input'; 
import Button from '@/components/button';
// Importamos los tipos necesarios de react-select
import Select, { StylesConfig, CSSObjectWithLabel, OptionProps, GroupBase } from 'react-select'; 
import { FaTrash, FaPlus, FaCoins, FaMagic } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext'; 

// Importa todos los tipos y constantes desde el archivo central
import { 
    IngredienteForm, 
    RecetaFormData, 
    Receta, 
    Objeto, 
    DIFICULTAD_CHOICES 
} from '@/types/receta'; 

// ----------------------------------------------------
// --- TIPOS DE AYUDA LOCALES ---
// ----------------------------------------------------

// Tipo de opción para react-select
type SelectOption = {
    value: number | string;
    label: string;
};

interface RecetaFormProps {
    onSave: (receta: RecetaFormData) => Promise<void>;
    onCancel: () => void;
    initialData?: Receta | null;
}

// El estado por defecto debe cumplir con la estructura de RecetaFormData
// Nota: 'ingredientes' es un array vacío, lo cual es compatible con el tipo final.
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
// --- ESTILOS DE REACT-SELECT (SIN ANY) ---
// ----------------------------------------------------

const customSelectStyles: StylesConfig<SelectOption, false, GroupBase<SelectOption>> = {
    control: (base: CSSObjectWithLabel) => ({
        ...base,
        borderColor: '#a8a29e', // stone-400
        boxShadow: 'none',
        '&:hover': { borderColor: '#a8a29e' },
    }),
    option: (base: CSSObjectWithLabel, state: OptionProps<SelectOption, false, GroupBase<SelectOption>>) => ({
        ...base,
        backgroundColor: state.isFocused ? '#EBE3D6' : 'white', // stone-100
        color: '#44403c', // stone-800
        cursor: 'pointer',
    }),
    singleValue: (base: CSSObjectWithLabel) => ({
        ...base,
        color: '#44403c', // stone-800
    }),
    menu: (base: CSSObjectWithLabel) => ({
        ...base,
        zIndex: 9999,
    })
};

// ----------------------------------------------------
// --- EL COMPONENTE ---
// ----------------------------------------------------

export default function RecetaForm({ onSave, onCancel, initialData }: RecetaFormProps) {
    const { accessToken } = useAuth();
    
    // Usamos RecetaFormData para el estado final y IngredienteForm para el estado local del array
    const [formData, setFormData] = useState<RecetaFormData>(defaultFormState);
    const [objetos, setObjetos] = useState<Objeto[]>([]);
    const [ingredientesForm, setIngredientesForm] = useState<IngredienteForm[]>([]);
    const [loadingObjetos, setLoadingObjetos] = useState(true);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    const objetoOptions: SelectOption[] = useMemo(() => {
        return objetos.map(o => ({
            value: o.id,
            label: o.Name,
        }));
    }, [objetos]);

    // 1. Cargar la lista de Objetos (todos)
    useEffect(() => {
        const fetchObjetos = async () => {
            if (!accessToken) return;
            setLoadingObjetos(true);
            try {
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
            // Transformar datos de la API al formato del formulario
            const initialIngredientesForm: IngredienteForm[] = initialData.ingredientes.map(ing => ({
                id: ing.id,
                objeto: ing.objeto, 
                cantidad: ing.cantidad, // La cantidad es number, compatible
                nombre_objeto: ing.nombre_ingrediente, 
            }));

            const initialRecetaData: RecetaFormData = {
                nombre: initialData.nombre,
                objeto_final: initialData.objeto_final, 
                cantidad_final: initialData.cantidad_final,
                es_magico: initialData.es_magico,
                oro_necesario: initialData.oro_necesario,
                dificultad: initialData.dificultad,
                // Mapeo directo de ingredientes con cantidad como number (API)
                ingredientes: initialData.ingredientes.map(ing => ({
                    id: ing.id,
                    objeto: ing.objeto, 
                    cantidad: ing.cantidad,
                })) as RecetaFormData['ingredientes'],
            };
            
            setFormData(initialRecetaData);
            setIngredientesForm(initialIngredientesForm);
        } else {
            setFormData(defaultFormState);
            setIngredientesForm([]);
        }
    }, [initialData]);


    // 3. Manejadores de cambios para campos principales de la Receta
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const target = e.target as HTMLInputElement; 
        const { name, value, type, checked } = target;
        
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

    const getObjectNameById = (id: number | string): string => {
        const objeto = objetos.find(o => o.id.toString() === id.toString());
        return objeto ? objeto.Name : `ID: ${id}`;
    };

    const handleAddIngrediente = () => {
        const defaultObject = objetos.length > 0 ? objetos[0] : { id: '' as string, Name: '' as string};
        
        const newIngrediente: IngredienteForm = { 
            objeto: defaultObject.id, 
            cantidad: 1, 
            nombre_objeto: defaultObject.Name 
        };

        setIngredientesForm(prev => [
            ...prev,
            newIngrediente
        ]);
        
        setFormData(prevForm => ({
            ...prevForm,
            ingredientes: [
                ...prevForm.ingredientes, 
                { objeto: defaultObject.id as number | string, cantidad: 1 } as RecetaFormData['ingredientes'][number]
            ]
        }));
    };

    // CORRECCIÓN DEL MANEJADOR DE CAMBIO DE CANTIDAD
    const handleIngredienteChange = (index: number, name: 'objeto' | 'cantidad', value: string | number) => {
        setIngredientesForm(prev => {
            const newIngredientes = [...prev];
            
            let newValue: string | number;

            if (name === 'cantidad') {
                const rawValue = typeof value === 'string' ? value : String(value);

                if (rawValue === '' || rawValue === '0') {
                    // Mantiene el valor como string vacío o 0 en el Input local (ingredientesForm)
                    newValue = rawValue;
                } else {
                    // Si hay un valor, lo parseamos a number
                    newValue = parseInt(rawValue, 10) || 1;
                }
            } else {
                // Es el campo 'objeto'
                newValue = value;
            }
            
            // 1. Actualizar el ingrediente en el array local (ingredientesForm)
            newIngredientes[index] = {
                ...newIngredientes[index],
                [name]: newValue,
                nombre_objeto: name === 'objeto' ? getObjectNameById(newValue) : newIngredientes[index].nombre_objeto
            };

            // 2. Sincronizar el estado de RecetaFormData (el payload final)
            const formIngredientes = newIngredientes.map(ing => {
                // Aseguramos que la cantidad para el modelo final (formData) sea un número válido (min 1)
                const cantidadFinal: number = ing.cantidad === '' || ing.cantidad === 0 ? 1 : (ing.cantidad as number);
                return {
                    id: ing.id, 
                    objeto: ing.objeto,
                    cantidad: cantidadFinal,
                };
            });

            setFormData(prevForm => ({
                ...prevForm,
                // El tipo RecetaFormData['ingredientes'] es ahora { objeto, cantidad: number }[]
                ingredientes: formIngredientes.filter(i => i.objeto !== '') as RecetaFormData['ingredientes']
            }));

            return newIngredientes;
        });
    };

    const handleRemoveIngrediente = (index: number) => {
        setIngredientesForm(prev => {
            const newIngredientes = prev.filter((_, i) => i !== index);

            const formIngredientes = newIngredientes.map(ing => ({
                id: ing.id, 
                objeto: ing.objeto,
                cantidad: ing.cantidad === '' || ing.cantidad === 0 ? 1 : (ing.cantidad as number),
            }));

            setFormData(prevForm => ({
                ...prevForm,
                ingredientes: formIngredientes.filter(i => i.objeto !== '') as RecetaFormData['ingredientes']
            }));

            return newIngredientes;
        });
    };
    
    // 5. Enviar formulario
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

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
                    
                    <Select<SelectOption, false, GroupBase<SelectOption>>
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

                </div>
                <div>
                    <label htmlFor="cantidad_final" className="block mb-1 font-semibold">Cantidad Final</label>
                    <Input 
                        id="cantidad_final" 
                        name="cantidad_final" 
                        type="number" 
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
                            
                            <Select<SelectOption, false, GroupBase<SelectOption>>
                                id={`ingrediente-objeto-${index}`} 
                                name={`ingrediente-objeto-${index}`} 
                                options={objetoOptions}
                                value={objetoOptions.find(option => option.value === ingrediente.objeto)}
                                onChange={(selectedOption) => {
                                    const value = selectedOption ? String(selectedOption.value) : '';
                                    handleIngredienteChange(index, 'objeto', value);
                                }}
                                isClearable={true}
                                placeholder="Buscar ingrediente..."
                                required
                                className="text-sm text-stone-800"
                                styles={customSelectStyles}
                            />
                        </div>
                        
                        {/* Cantidad */}
                        <div className="w-24">
                            <label htmlFor={`ingrediente-cantidad-${index}`} className="block mb-1 text-sm font-medium">Cantidad</label>
                            <Input 
                                id={`ingrediente-cantidad-${index}`} 
                                type="number" 
                                // Usamos String() para ligar el valor del Input al estado local (puede ser string vacío)
                                value={String(ingrediente.cantidad)} 
                                onChange={(e) => {
                                    // Pasamos el valor crudo (puede ser un string vacío "")
                                    handleIngredienteChange(index, 'cantidad', e.target.value);
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