// components/receta-form.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import Input from '@/components/input'; 
import Button from '@/components/button';
import Select, { StylesConfig, CSSObjectWithLabel, OptionProps, GroupBase } from 'react-select'; 
import { FaTrash, FaPlus, FaCoins, FaMagic, FaStar, FaTools } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext'; 

// Importa todos los tipos y constantes desde el archivo central
import { 
    IngredienteForm, 
    RecetaFormData, 
    Receta, 
    Objeto, 
} from '@/types/receta'; 



type SelectOption = {
    value: number | string;
    label: string;
};

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
    grado_minimo_requerido: 'Novato', // Para no mágicos
    ingredientes: [],
    // Campos para objetos mágicos
    rareza: null,
    material_raro: null,
    es_consumible: false,
    herramienta: '',
};

// ✅ Opciones para los nuevos campos
const RAREZA_CHOICES = [
    { value: 'Common', label: 'Common' },
    { value: 'Uncommon', label: 'Uncommon' },
    { value: 'Rare', label: 'Rare' },
    { value: 'Very Rare', label: 'Very Rare' },
    { value: 'Legendary', label: 'Legendary' },
];

const TIPO_ARTESANO_CHOICES = [
    { value: 'Alchemist', label: 'Alchemist' },
    { value: 'Blacksmith', label: 'Blacksmith' },
    { value: 'Enchanter', label: 'Enchanter' },
    { value: 'Leatherworker', label: 'Leatherworker' },
    { value: 'Tinker', label: 'Tinker' },
    { value: 'Thaumaturge', label: 'Thaumaturge' },
];

const GRADO_MINIMO_CHOICES = [
    { value: 'Novato', label: 'Novato' },
    { value: 'Aprendiz', label: 'Aprendiz' },
    { value: 'Experto', label: 'Experto' },
    { value: 'Maestro Artesano', label: 'Maestro Artesano' },
    { value: 'Gran Maestro', label: 'Gran Maestro' },
];

const customSelectStyles: StylesConfig<SelectOption, false, GroupBase<SelectOption>> = {
    control: (base: CSSObjectWithLabel) => ({
        ...base,
        borderColor: '#a8a29e',
        boxShadow: 'none',
        '&:hover': { borderColor: '#a8a29e' },
    }),
    option: (base: CSSObjectWithLabel, state: OptionProps<SelectOption, false, GroupBase<SelectOption>>) => ({
        ...base,
        backgroundColor: state.isFocused ? '#EBE3D6' : 'white',
        color: '#44403c',
        cursor: 'pointer',
    }),
    singleValue: (base: CSSObjectWithLabel) => ({
        ...base,
        color: '#44403c',
    }),
    menu: (base: CSSObjectWithLabel) => ({
        ...base,
        zIndex: 9999,
    })
};

export default function RecetaForm({ onSave, onCancel, initialData }: RecetaFormProps) {
    const { accessToken } = useAuth();
    
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

    // Cargar objetos
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

    // Cargar datos iniciales
    useEffect(() => {
        if (initialData) {
            const initialIngredientesForm: IngredienteForm[] = initialData.ingredientes.map(ing => ({
                id: ing.id,
                objeto: ing.objeto, 
                cantidad: ing.cantidad,
                nombre_objeto: ing.nombre_ingrediente, 
            }));

            const initialRecetaData: RecetaFormData = {
                nombre: initialData.nombre,
                objeto_final: initialData.objeto_final, 
                cantidad_final: initialData.cantidad_final,
                es_magico: initialData.es_magico,
                oro_necesario: initialData.oro_necesario,
                ingredientes: initialData.ingredientes.map(ing => ({
                    id: ing.id,
                    objeto: ing.objeto, 
                    cantidad: ing.cantidad,
                })) as RecetaFormData['ingredientes'],
                // ✅ Nuevos campos
                rareza: initialData.rareza || null,
                material_raro: initialData.material_raro || null,
                grado_minimo_requerido: initialData.grado_minimo_requerido || 'Novato',
                es_consumible: initialData.es_consumible || false,
                herramienta: initialData.herramienta || '',
            };
            
            setFormData(initialRecetaData);
            setIngredientesForm(initialIngredientesForm);
        } else {
            setFormData(defaultFormState);
            setIngredientesForm([]);
        }
    }, [initialData]);

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

        setIngredientesForm(prev => [...prev, newIngrediente]);
        
        setFormData(prevForm => ({
            ...prevForm,
            ingredientes: [
                ...prevForm.ingredientes, 
                { objeto: defaultObject.id as number | string, cantidad: 1 } as RecetaFormData['ingredientes'][number]
            ]
        }));
    };

    const handleIngredienteChange = (index: number, name: 'objeto' | 'cantidad', value: string | number) => {
        setIngredientesForm(prev => {
            const newIngredientes = [...prev];
            
            let newValue: string | number;

            if (name === 'cantidad') {
                const rawValue = typeof value === 'string' ? value : String(value);
                if (rawValue === '' || rawValue === '0') {
                    newValue = rawValue;
                } else {
                    newValue = parseInt(rawValue, 10) || 1;
                }
            } else {
                newValue = value;
            }
            
            newIngredientes[index] = {
                ...newIngredientes[index],
                [name]: newValue,
                nombre_objeto: name === 'objeto' ? getObjectNameById(newValue) : newIngredientes[index].nombre_objeto
            };

            const formIngredientes = newIngredientes.map(ing => {
                const cantidadFinal: number = ing.cantidad === '' || ing.cantidad === 0 ? 1 : (ing.cantidad as number);
                return {
                    id: ing.id, 
                    objeto: ing.objeto,
                    cantidad: cantidadFinal,
                };
            });

            setFormData(prevForm => ({
                ...prevForm,
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

        {/* Checkbox es_magico */}
        <div className="flex items-center space-x-2 bg-purple-50 p-3 rounded-lg border border-purple-200">
            <Input 
                id="es_magico" 
                name="es_magico" 
                type="checkbox" 
                checked={formData.es_magico} 
                onChange={handleChange} 
                className="w-auto h-5" 
            />
            <label htmlFor="es_magico" className="font-semibold flex items-center gap-2">
                <FaMagic className="text-purple-600"/>¿Es Mágico?
            </label>
        </div>

        {/* ✅ Herramienta Requerida - SIEMPRE VISIBLE */}
        <div>
            <label htmlFor="herramienta" className="block mb-1 font-semibold flex items-center gap-2">
                <FaTools className="text-stone-600"/>Herramienta Requerida
            </label>
            <Input 
                id="herramienta" 
                name="herramienta" 
                value={formData.herramienta} 
                onChange={handleChange}
                placeholder="Ej: Smith's Tools, Alchemist's Supplies"
                required
            />
        </div>

        {/* ✅ CAMPOS PARA OBJETOS NO MÁGICOS */}
        {!formData.es_magico && (
            <>
                <div>
                    <label htmlFor="grado_minimo_requerido" className="block mb-1 font-semibold">
                        Grado Mínimo Requerido
                    </label>
                    <select 
                        id="grado_minimo_requerido" 
                        name="grado_minimo_requerido" 
                        value={formData.grado_minimo_requerido} 
                        onChange={handleChange} 
                        className="w-full px-4 py-2 rounded-lg border border-stone-400 bg-white focus:ring-2 focus:ring-bosque"
                    >
                        {GRADO_MINIMO_CHOICES.map(g => (
                            <option key={g.value} value={g.value}>{g.label}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="oro_necesario" className="block mb-1 font-semibold flex items-center gap-2">
                        <FaCoins className="text-yellow-500"/>Oro Necesario
                    </label>
                    <Input 
                        id="oro_necesario" 
                        name="oro_necesario" 
                        type="number" 
                        value={String(formData.oro_necesario)} 
                        onChange={handleChange} 
                        min={0}
                        required
                    />
                    <p className="text-xs text-stone-600 mt-1">
                        El jugador irá acumulando este valor con tiradas exitosas diarias
                    </p>
                </div>
            </>
        )}

        {/* ✅ CAMPOS PARA OBJETOS MÁGICOS */}
        {formData.es_magico && (
            <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-4 space-y-4">
                <h4 className="font-title text-lg text-purple-900 flex items-center gap-2">
                    <FaMagic />Configuración de Objeto Mágico
                </h4>

                <div className="bg-purple-100 p-3 rounded text-sm text-purple-800">
                    <p className="font-semibold mb-2">ℹ️ Información automática:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>El <strong>grado mínimo</strong> se determina automáticamente por la rareza</li>
                        <li>El <strong>coste en oro y tiempo</strong> es fijo según la rareza</li>
                        <li>El jugador hará tiradas hasta conseguir los éxitos necesarios</li>
                        <li>El coste se cobra <strong>solo al finalizar exitosamente</strong></li>
                    </ul>
                </div>

                <div>
                    <label htmlFor="rareza" className="block mb-1 font-semibold flex items-center gap-2">
                        <FaStar className="text-yellow-500"/>Rareza *
                    </label>
                    <select 
                        id="rareza" 
                        name="rareza" 
                        value={formData.rareza || ''} 
                        onChange={handleChange} 
                        required
                        className="w-full px-4 py-2 rounded-lg border border-purple-400 bg-white focus:ring-2 focus:ring-purple-600"
                    >
                        <option value="">Seleccionar rareza...</option>
                        {RAREZA_CHOICES.map(r => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                    </select>
                    
                    {/* Mostrar info automática según rareza */}
                    {formData.rareza && (
                        <div className="mt-3 bg-white p-3 rounded border border-purple-300 space-y-2 text-xs">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <span className="font-semibold text-purple-900">🎯 Grado mínimo:</span>
                                    <p className="text-purple-700">{
                                        formData.rareza === 'Common' ? 'Novato' :
                                        formData.rareza === 'Uncommon' ? 'Aprendiz' :
                                        formData.rareza === 'Rare' ? 'Experto' :
                                        formData.rareza === 'Very Rare' ? 'Maestro Artesano' :
                                        'Gran Maestro'
                                    }</p>
                                </div>
                                <div>
                                    <span className="font-semibold text-purple-900">💰 Coste final:</span>
                                    <p className="text-purple-700">{
                                        formData.rareza === 'Common' ? '1 día, 10 gp' :
                                        formData.rareza === 'Uncommon' ? '2 días, 40 gp' :
                                        formData.rareza === 'Rare' ? '5 días, 200 gp' :
                                        formData.rareza === 'Very Rare' ? '5 días, 800 gp' :
                                        '5 días, 2000 gp'
                                    }</p>
                                </div>
                                <div>
                                    <span className="font-semibold text-purple-900">✨ Éxitos:</span>
                                    <p className="text-purple-700">{
                                        formData.rareza === 'Common' || formData.rareza === 'Uncommon' ? '1 éxito' :
                                        formData.rareza === 'Rare' ? '2 éxitos' :
                                        formData.rareza === 'Very Rare' ? '5 éxitos' :
                                        '10 éxitos'
                                    }</p>
                                </div>
                                <div>
                                    <span className="font-semibold text-purple-900">🎲 DC:</span>
                                    <p className="text-purple-700">{
                                        formData.es_consumible ? (
                                            formData.rareza === 'Common' ? '10' :
                                            formData.rareza === 'Uncommon' ? '13' :
                                            formData.rareza === 'Rare' ? '16' :
                                            formData.rareza === 'Very Rare' ? '19' :
                                            '25'
                                        ) : (
                                            formData.rareza === 'Common' ? '15' :
                                            formData.rareza === 'Uncommon' ? '18' :
                                            formData.rareza === 'Rare' ? '21' :
                                            formData.rareza === 'Very Rare' ? '24' :
                                            '30'
                                        )
                                    } {formData.es_consumible && '(consumible)'}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div>
                    <label htmlFor="material_raro" className="block mb-1 font-semibold">
                        Material Raro Necesario
                    </label>
                    <Select<SelectOption, false, GroupBase<SelectOption>>
                        id="material_raro"
                        name="material_raro"
                        options={objetoOptions}
                        value={objetoOptions.find(option => option.value === formData.material_raro)}
                        onChange={(selectedOption) => {
                            setFormData(prev => ({
                                ...prev,
                                material_raro: selectedOption ? selectedOption.value as number : null,
                            }));
                        }}
                        isClearable={true}
                        placeholder="Buscar material raro..."
                        className="text-stone-800"
                        styles={customSelectStyles}
                    />
                    <p className="text-xs text-purple-600 mt-1">
                        Ingrediente especial que se consume al iniciar el crafting
                    </p>
                </div>

                <div className="flex items-center space-x-2 bg-white p-3 rounded border border-purple-300">
                    <Input 
                        id="es_consumible" 
                        name="es_consumible" 
                        type="checkbox" 
                        checked={formData.es_consumible} 
                        onChange={handleChange} 
                        className="w-auto h-5" 
                    />
                    <label htmlFor="es_consumible" className="font-semibold text-sm">
                        ¿Es Consumible? (DC reducida)
                    </label>
                </div>
            </div>
        )}

        {/* Sección de Ingredientes */}
        <h4 className="font-title text-xl border-b border-madera-oscura pb-1 pt-4 text-bosque">Ingredientes</h4>
        
        <div className="space-y-3">
            {ingredientesForm.map((ingrediente, index) => (
                <div key={index} className="flex items-end gap-3 p-3 border border-madera-oscura rounded-lg bg-stone-50">
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
                    
                    <div className="w-24">
                        <label htmlFor={`ingrediente-cantidad-${index}`} className="block mb-1 text-sm font-medium">Cantidad</label>
                        <Input 
                            id={`ingrediente-cantidad-${index}`} 
                            type="number" 
                            value={String(ingrediente.cantidad)} 
                            onChange={(e) => {
                                handleIngredienteChange(index, 'cantidad', e.target.value);
                            }} 
                            min={1} 
                            required
                            className="text-sm text-center"
                        />
                    </div>

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