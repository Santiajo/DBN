'use client';

import { useState, useEffect, useMemo } from 'react';
import Input from '@/components/input'; 
import Button from '@/components/button';
import Select, { StylesConfig, CSSObjectWithLabel, OptionProps, GroupBase } from 'react-select'; 
import { FaTrash, FaPlus, FaCoins, FaMagic, FaStar, FaTools, FaSearch } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext'; 
import { 
    IngredienteForm, 
    RecetaFormData, 
    RecetaAdmin, 
    Objeto,
    SelectOption,
} from '@/types/receta'; 

interface RecetaFormProps {
    onSave: (receta: RecetaFormData) => Promise<void>;
    onCancel: () => void;
    initialData?: RecetaAdmin | null;
}

const defaultFormState: RecetaFormData = {
    nombre: '',
    objeto_final: '', 
    cantidad_final: 1,
    es_magico: false,
    oro_necesario: 0,
    grado_minimo_requerido: 'Novato',
    ingredientes: [],
    rareza: null,
    material_raro: null,
    es_consumible: false,
    herramienta: '',
    requiere_investigacion: false,
};

const RAREZA_CHOICES = [
    { value: 'Common', label: 'Common' },
    { value: 'Uncommon', label: 'Uncommon' },
    { value: 'Rare', label: 'Rare' },
    { value: 'Very Rare', label: 'Very Rare' },
    { value: 'Legendary', label: 'Legendary' },
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
        backgroundColor: '#faf6ed',
        borderColor: '#c4b998',
        borderWidth: '1px',
        borderRadius: '4px',
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.08)',
        padding: '2px 4px',
        minHeight: '42px',
        '&:hover': { borderColor: '#a89968' },
        '&:focus-within': { 
            borderColor: '#8b7355',
            boxShadow: '0 0 0 1px #8b7355'
        },
    }),
    option: (base: CSSObjectWithLabel, state: OptionProps<SelectOption, false, GroupBase<SelectOption>>) => ({
        ...base,
        backgroundColor: state.isFocused ? '#f0e6d3' : '#faf6ed',
        color: '#4a3f35',
        cursor: 'pointer',
        padding: '10px 12px',
        '&:active': {
            backgroundColor: '#e8dcc8',
        }
    }),
    singleValue: (base: CSSObjectWithLabel) => ({
        ...base,
        color: '#4a3f35',
    }),
    menu: (base: CSSObjectWithLabel) => ({
        ...base,
        zIndex: 9999,
        backgroundColor: '#faf6ed',
        border: '1px solid #c4b998',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        borderRadius: '4px',
    }),
    placeholder: (base: CSSObjectWithLabel) => ({
        ...base,
        color: '#9a8a6a',
    }),
    input: (base: CSSObjectWithLabel) => ({
        ...base,
        color: '#4a3f35',
    }),
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

    const getObjectNameById = (id: number | string | undefined): string => {
        if (!id) return '';
        if (!objetos || objetos.length === 0) return '';
        
        const objeto = objetos.find(o => {
            if (!o || !o.id) return false;
            return o.id.toString() === id.toString();
        });
        
        return objeto?.Name || '';
    };

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

    useEffect(() => {
        if (loadingObjetos || objetos.length === 0) return;
        
        if (initialData) {
            console.log('Cargando datos iniciales:', initialData);
            console.log('Objetos disponibles:', objetos.length);
            
            if (!initialData.ingredientes) {
                console.warn('initialData no tiene ingredientes');
                setIngredientesForm([]);
                setFormData({
                    ...defaultFormState,
                    nombre: initialData.nombre || '',
                    objeto_final: initialData.objeto_final || '',
                    cantidad_final: initialData.cantidad_final || 1,
                    es_magico: initialData.es_magico || false,
                    oro_necesario: initialData.oro_necesario || 0,
                    grado_minimo_requerido: initialData.grado_minimo_requerido || 'Novato',
                    herramienta: initialData.herramienta || '',
                });
                return;
            }
            
            if (initialData.ingredientes.length === 0) {
                console.log('No hay ingredientes para cargar');
                setIngredientesForm([]);
            } else {
                const initialIngredientesForm: IngredienteForm[] = initialData.ingredientes
                    .filter(ing => {
                        const isValid = ing && ing.objeto != null && ing.objeto !== undefined;
                        if (!isValid) {
                            console.error('Ingrediente invalido:', ing);
                        }
                        return isValid;
                    })
                    .map(ing => {
                        const nombreObjeto = getObjectNameById(ing.objeto);
                        return {
                            id: ing.id,
                            objeto: ing.objeto,
                            cantidad: ing.cantidad,
                            nombre_objeto: nombreObjeto || ing.nombre_ingrediente,
                        };
                    });

                console.log('Ingredientes cargados:', initialIngredientesForm);
                setIngredientesForm(initialIngredientesForm);
            }

            const initialRecetaData: RecetaFormData = {
                nombre: initialData.nombre || '',
                objeto_final: initialData.objeto_final || '', 
                cantidad_final: initialData.cantidad_final || 1,
                es_magico: initialData.es_magico || false,
                oro_necesario: initialData.oro_necesario || 0,
                grado_minimo_requerido: initialData.grado_minimo_requerido || 'Novato',
                ingredientes: initialData.ingredientes
                    .filter(ing => ing && ing.objeto != null)
                    .map(ing => ({
                        objeto: ing.objeto,
                        cantidad: ing.cantidad,
                    })),
                rareza: initialData.rareza || null,
                material_raro: initialData.material_raro || null,
                es_consumible: initialData.es_consumible || false,
                herramienta: initialData.herramienta || '',
                requiere_investigacion: initialData.requiere_investigacion || false,
            };
            
            setFormData(initialRecetaData);
        } else {
            setFormData(defaultFormState);
            setIngredientesForm([]);
        }
    }, [initialData, objetos, loadingObjetos]);

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

    const handleAddIngrediente = () => {
        if (objetos.length === 0) return;
        
        const defaultObject = objetos[0];
        
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
                { objeto: defaultObject.id, cantidad: 1 }
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
                    objeto: ing.objeto,
                    cantidad: cantidadFinal,
                };
            });

            setFormData(prevForm => ({
                ...prevForm,
                ingredientes: formIngredientes.filter(i => i.objeto !== '')
            }));

            return newIngredientes;
        });
    };

    const handleRemoveIngrediente = (index: number) => {
        setIngredientesForm(prev => {
            const newIngredientes = prev.filter((_, i) => i !== index);

            const formIngredientes = newIngredientes.map(ing => ({
                objeto: ing.objeto,
                cantidad: ing.cantidad === '' || ing.cantidad === 0 ? 1 : (ing.cantidad as number),
            }));

            setFormData(prevForm => ({
                ...prevForm,
                ingredientes: formIngredientes.filter(i => i.objeto !== '')
            }));

            return newIngredientes;
        });
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Enviando formulario:', formData);
        onSave(formData);
    };

    if (loadingObjetos) return (
        <div className="p-6 text-center text-[#5a4a3a] font-serif">
            Cargando objetos disponibles...
        </div>
    );
    
    if (objetos.length === 0) return (
        <div className="p-6 text-center text-[#8b4545] font-serif">
            No hay objetos disponibles. No se pueden crear recetas.
        </div>
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-5 text-[#4a3f35] max-h-[70vh] overflow-y-auto pr-2 scrollbar-parchment">
            <style jsx global>{`
                .scrollbar-parchment::-webkit-scrollbar {
                    width: 8px;
                }
                .scrollbar-parchment::-webkit-scrollbar-track {
                    background: #f0e6d3;
                    border-radius: 4px;
                }
                .scrollbar-parchment::-webkit-scrollbar-thumb {
                    background: #c4b998;
                    border-radius: 4px;
                }
                .scrollbar-parchment::-webkit-scrollbar-thumb:hover {
                    background: #a89968;
                }
                .form-input-style {
                    width: 100%;
                    padding: 10px 12px;
                    background-color: #faf6ed;
                    border: 1px solid #c4b998;
                    border-radius: 4px;
                    color: #4a3f35;
                    font-size: 14px;
                    box-shadow: inset 0 1px 3px rgba(0,0,0,0.08);
                    transition: border-color 0.2s, box-shadow 0.2s;
                }
                .form-input-style:focus {
                    outline: none;
                    border-color: #8b7355;
                    box-shadow: 0 0 0 1px #8b7355;
                }
                .form-input-style::placeholder {
                    color: #9a8a6a;
                }
                .form-select-style {
                    width: 100%;
                    padding: 10px 12px;
                    background-color: #faf6ed;
                    border: 1px solid #c4b998;
                    border-radius: 4px;
                    color: #4a3f35;
                    font-size: 14px;
                    box-shadow: inset 0 1px 3px rgba(0,0,0,0.08);
                    cursor: pointer;
                    appearance: none;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%238b7355' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: right 12px center;
                    padding-right: 36px;
                }
                .form-select-style:focus {
                    outline: none;
                    border-color: #8b7355;
                    box-shadow: 0 0 0 1px #8b7355;
                }
                .form-checkbox-style {
                    width: 18px;
                    height: 18px;
                    accent-color: #8b7355;
                    cursor: pointer;
                }
            `}</style>
            
            {/* Seccion: Detalles de la Receta */}
            <div className="border-b-2 border-[#c4b998] pb-2 mb-4">
                <h4 className="text-lg font-serif text-[#5a7a5a] tracking-wide">
                    Detalles de la Receta
                </h4>
            </div>
            
            {/* Nombre de la Receta */}
            <div>
                <label htmlFor="nombre" className="block mb-2 text-sm font-medium text-[#4a3f35]">
                    Nombre de la Receta
                </label>
                <input 
                    id="nombre" 
                    name="nombre" 
                    value={formData.nombre} 
                    onChange={handleChange} 
                    required 
                    className="form-input-style"
                />
            </div>
            
            {/* Objeto Final y Cantidad */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="objeto_final" className="block mb-2 text-sm font-medium text-[#4a3f35]">
                        Objeto Final Producido
                    </label>
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
                        styles={customSelectStyles}
                    />
                </div>
                <div>
                    <label htmlFor="cantidad_final" className="block mb-2 text-sm font-medium text-[#4a3f35]">
                        Cantidad Final
                    </label>
                    <input 
                        id="cantidad_final" 
                        name="cantidad_final" 
                        type="number" 
                        value={String(formData.cantidad_final)} 
                        onChange={handleChange} 
                        min={1} 
                        required 
                        className="form-input-style"
                    />
                </div>
            </div>

            {/* Checkbox: Es Magico */}
            <div className="bg-[#f5ede1] border-l-4 border-[#c4b998] rounded-r-md p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                        id="es_magico" 
                        name="es_magico" 
                        type="checkbox" 
                        checked={formData.es_magico} 
                        onChange={handleChange} 
                        className="form-checkbox-style" 
                    />
                    <span className="font-medium flex items-center gap-2 text-[#4a3f35]">
                        <FaMagic className="text-[#8b7355]"/>
                        Es Magico?
                    </span>
                </label>
            </div>

            {/* Checkbox: Requiere Investigacion */}
            <div className="bg-[#eef4f7] border-l-4 border-[#6a8a9a] rounded-r-md p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                        id="requiere_investigacion" 
                        name="requiere_investigacion" 
                        type="checkbox" 
                        checked={formData.requiere_investigacion} 
                        onChange={handleChange} 
                        className="form-checkbox-style" 
                    />
                    <span className="font-medium flex items-center gap-2 text-[#4a3f35]">
                        <FaSearch className="text-[#6a8a9a]"/>
                        Requiere Investigacion?
                    </span>
                </label>
            </div>

            {/* Info: Requiere Investigacion */}
            {formData.requiere_investigacion && (
                <div className="bg-[#e8f0f4] border-l-4 border-[#6a8a9a] rounded-r-md p-4">
                    <div className="flex gap-3">
                        <span className="text-[#4a6a7a] flex-shrink-0 text-base">i</span>
                        <p className="text-sm text-[#4a6a7a]">
                            Esta receta estara bloqueada hasta que el jugador investigue uno de los objetos investigables 
                        </p>
                    </div>
                </div>
            )}

            {/* Herramienta Requerida */}
            <div>
                <label htmlFor="herramienta" className="block mb-2 text-sm font-medium flex items-center gap-2 text-[#4a3f35]">
                    <FaTools className="text-[#8b7355]"/>
                    Herramienta Requerida
                </label>
                <input 
                    id="herramienta" 
                    name="herramienta" 
                    value={formData.herramienta} 
                    onChange={handleChange}
                    placeholder="Ej: Smith's Tools, Alchemist's Supplies"
                    required
                    className="form-input-style"
                />
            </div>

            {/* Campos para NO magico */}
            {!formData.es_magico && (
                <>
                    <div>
                        <label htmlFor="grado_minimo_requerido" className="block mb-2 text-sm font-medium text-[#4a3f35]">
                            Grado Minimo Requerido
                        </label>
                        <select 
                            id="grado_minimo_requerido" 
                            name="grado_minimo_requerido" 
                            value={formData.grado_minimo_requerido} 
                            onChange={handleChange} 
                            className="form-select-style"
                        >
                            {GRADO_MINIMO_CHOICES.map(g => (
                                <option key={g.value} value={g.value}>{g.label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="oro_necesario" className="block mb-2 text-sm font-medium flex items-center gap-2 text-[#4a3f35]">
                            <FaCoins className="text-[#c9a65a]"/>
                            Oro Necesario
                        </label>
                        <input 
                            id="oro_necesario" 
                            name="oro_necesario" 
                            type="number" 
                            value={String(formData.oro_necesario)} 
                            onChange={handleChange} 
                            min={0}
                            required
                            className="form-input-style"
                        />
                        <p className="text-xs text-[#7a6a5a] mt-2 italic">
                            El jugador ira acumulando este valor con tiradas exitosas diarias
                        </p>
                    </div>
                </>
            )}

            {/* Campos para Magico */}
            {formData.es_magico && (
                <div className="bg-[#f8f4eb] border border-[#c4b998] rounded-lg p-5 space-y-4">
                    <h4 className="text-base font-serif text-[#4a3f35] flex items-center gap-2 border-b border-[#d4c4a0] pb-3">
                        <FaMagic className="text-[#8b7355]"/>
                        Configuracion de Objeto Magico
                    </h4>

                    <div className="bg-[#f0e6d3] p-3 rounded text-sm text-[#5a4a3a]">
                        <p className="font-medium mb-2">Informacion automatica:</p>
                        <ul className="list-disc list-inside space-y-1 text-xs text-[#6a5a4a]">
                            <li>El <strong>grado minimo</strong> se determina automaticamente por la rareza</li>
                            <li>El <strong>coste en oro y tiempo</strong> es fijo segun la rareza</li>
                            <li>El jugador hara tiradas hasta conseguir los exitos necesarios</li>
                            <li>El coste se cobra <strong>solo al finalizar exitosamente</strong></li>
                        </ul>
                    </div>

                    <div>
                        <label htmlFor="rareza" className="block mb-2 text-sm font-medium flex items-center gap-2 text-[#4a3f35]">
                            <FaStar className="text-[#c9a65a]"/>
                            Rareza
                        </label>
                        <select 
                            id="rareza" 
                            name="rareza" 
                            value={formData.rareza || ''} 
                            onChange={handleChange} 
                            required
                            className="form-select-style"
                        >
                            <option value="">Seleccionar rareza...</option>
                            {RAREZA_CHOICES.map(r => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                        </select>
                        
                        {formData.rareza && (
                            <div className="mt-3 bg-[#faf6ed] p-3 rounded border border-[#d4c4a0] space-y-2 text-xs">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <span className="font-medium text-[#4a3f35]">Grado minimo:</span>
                                        <p className="text-[#6a5a4a]">{
                                            formData.rareza === 'Common' ? 'Novato' :
                                            formData.rareza === 'Uncommon' ? 'Aprendiz' :
                                            formData.rareza === 'Rare' ? 'Experto' :
                                            formData.rareza === 'Very Rare' ? 'Maestro Artesano' :
                                            'Gran Maestro'
                                        }</p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-[#4a3f35]">Coste final:</span>
                                        <p className="text-[#6a5a4a]">{
                                            formData.rareza === 'Common' ? '1 dia, 10 gp' :
                                            formData.rareza === 'Uncommon' ? '2 dias, 40 gp' :
                                            formData.rareza === 'Rare' ? '5 dias, 200 gp' :
                                            formData.rareza === 'Very Rare' ? '5 dias, 800 gp' :
                                            '5 dias, 2000 gp'
                                        }</p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-[#4a3f35]">Exitos:</span>
                                        <p className="text-[#6a5a4a]">{
                                            formData.rareza === 'Common' || formData.rareza === 'Uncommon' ? '1 exito' :
                                            formData.rareza === 'Rare' ? '2 exitos' :
                                            formData.rareza === 'Very Rare' ? '5 exitos' :
                                            '10 exitos'
                                        }</p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-[#4a3f35]">DC:</span>
                                        <p className="text-[#6a5a4a]">{
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
                        <label htmlFor="material_raro" className="block mb-2 text-sm font-medium text-[#4a3f35]">
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
                            styles={customSelectStyles}
                        />
                        <p className="text-xs text-[#7a6a5a] mt-2 italic">
                            Ingrediente especial que se consume al iniciar el crafting
                        </p>
                    </div>

                    <div className="bg-[#faf6ed] p-3 rounded border border-[#d4c4a0]">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input 
                                id="es_consumible" 
                                name="es_consumible" 
                                type="checkbox" 
                                checked={formData.es_consumible} 
                                onChange={handleChange} 
                                className="form-checkbox-style" 
                            />
                            <span className="font-medium text-sm text-[#4a3f35]">
                                Es Consumible? (DC reducida)
                            </span>
                        </label>
                    </div>
                </div>
            )}

            {/* Seccion: Ingredientes */}
            <div className="border-b-2 border-[#c4b998] pb-2 mb-4 mt-6">
                <h4 className="text-lg font-serif text-[#5a7a5a] tracking-wide">
                    Ingredientes
                </h4>
            </div>
            
            <div className="space-y-3">
                {ingredientesForm.map((ingrediente, index) => (
                    <div key={index} className="bg-[#faf6ed] border border-[#c4b998] rounded-lg p-4 relative">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#c4b998] rounded-l-lg"></div>
                        <div className="flex items-end gap-3 pl-2">
                            <div className="flex-grow">
                                <label htmlFor={`ingrediente-objeto-${index}`} className="block mb-2 text-sm font-medium text-[#4a3f35]">
                                    Ingrediente
                                </label>
                                <Select<SelectOption, false, GroupBase<SelectOption>>
                                    id={`ingrediente-objeto-${index}`} 
                                    name={`ingrediente-objeto-${index}`} 
                                    options={objetoOptions}
                                    value={objetoOptions.find(option => option.value === ingrediente.objeto)}
                                    onChange={(selectedOption) => {
                                        if (selectedOption) {
                                            handleIngredienteChange(index, 'objeto', selectedOption.value);
                                        }
                                    }}
                                    isClearable={false}
                                    placeholder="Buscar ingrediente..."
                                    required
                                    styles={customSelectStyles}
                                />
                                {ingrediente.nombre_objeto && (
                                    <p className="text-xs text-[#5a8a5a] mt-2 font-medium flex items-center gap-1">
                                        <span className="text-[#5a8a5a]">&#10003;</span> {ingrediente.nombre_objeto}
                                    </p>
                                )}
                            </div>
                            
                            <div className="w-24">
                                <label htmlFor={`ingrediente-cantidad-${index}`} className="block mb-2 text-sm font-medium text-[#4a3f35]">
                                    Cantidad
                                </label>
                                <input 
                                    id={`ingrediente-cantidad-${index}`} 
                                    type="number" 
                                    value={String(ingrediente.cantidad)} 
                                    onChange={(e) => {
                                        handleIngredienteChange(index, 'cantidad', e.target.value);
                                    }} 
                                    min={1} 
                                    required
                                    className="form-input-style text-center"
                                />
                            </div>

                            <button 
                                type="button" 
                                onClick={() => handleRemoveIngrediente(index)}
                                className="p-3 h-[42px] bg-[#8b4545] hover:bg-[#7a3535] text-white rounded transition-colors flex items-center justify-center"
                            >
                                <FaTrash className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}

                <button 
                    type="button" 
                    onClick={handleAddIngrediente}
                    className="w-full p-4 bg-[#faf6ed] border-2 border-dashed border-[#c4b998] rounded-lg text-[#6a5a4a] font-medium text-sm hover:bg-[#f0e6d3] hover:border-[#a89968] transition-all flex items-center justify-center gap-2"
                >
                    <FaPlus className="w-3 h-3" />
                    Anadir Ingrediente
                </button>
            </div>

            {/* Botones de accion */}
            <div className="flex justify-end gap-3 pt-5 border-t border-[#c4b998] mt-6">
                <button 
                    type="button" 
                    onClick={onCancel}
                    className="px-5 py-2.5 bg-[#f0e6d3] border border-[#c4b998] text-[#5a4a3a] rounded font-medium hover:bg-[#e8dcc8] transition-colors"
                >
                    Cancelar
                </button>
                <button 
                    type="submit"
                    className="px-5 py-2.5 bg-[#c9a65a] border border-[#a88a3a] text-white rounded font-medium hover:bg-[#b8954a] transition-colors shadow-sm"
                >
                    {initialData ? 'Guardar Cambios' : 'Crear Receta'}
                </button>
            </div>
        </form>
    );
}