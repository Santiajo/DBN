// types/receta.ts

export interface Objeto {
    id: number;
    Name: string;
}

// Opciones de dificultad (también centralizadas)
export const DIFICULTAD_CHOICES = [
    { value: 'Facil', label: 'Fácil' },
    { value: 'Medio', label: 'Medio' },
    { value: 'Dificil', label: 'Difícil' },
    { value: 'Muy dificil', label: 'Muy Difícil' },
    { value: 'Oculto', label: 'Oculto' },
];

// 1. IngredienteForm: Usado para la gestión del estado local en el formulario. 
// Permite que 'cantidad' sea string temporalmente para inputs.
export interface IngredienteForm {
    id?: number; 
    objeto: number | string;
    cantidad: number | string; // <-- Acepta string para el input
    nombre_objeto?: string;
}

// 2. RecetaFormData: Usado para la estructura final que se envía a la API (el payload).
// ¡Aquí la cantidad debe ser number, como espera la API!
export interface RecetaFormData {
    nombre: string;
    objeto_final: number | string;
    cantidad_final: number;
    es_magico: boolean;
    oro_necesario: number;
    dificultad: string;
    // Utilizamos el tipo IngredienteForm, pero forzamos 'cantidad' a ser number
    ingredientes: Array<Omit<IngredienteForm, 'nombre_objeto'> & { cantidad: number }>;
}

// 3. Receta: Usado para la estructura que se recibe de la API.
export interface Receta {
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