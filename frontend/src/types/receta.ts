// types/receta.ts

export interface Objeto {
    id: number;
    Name: string;
}


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
    ingredientes: Array<Omit<IngredienteForm, 'nombre_objeto'> & { cantidad: number }>;
    
    //  Nuevos campos para objetos mágicos
    rareza: string | null;
    material_raro: number | null;
    grado_minimo_requerido: string;
    es_consumible: boolean;
    herramienta: string;
}

// 3. Receta: Usado para la estructura que se recibe de la API.
export interface Receta {
  id: number;
  nombre: string;
  objeto_final: string;
  nombre_objeto_final: string; // ✅ Añadir este campo que viene del serializer
  cantidad_final: number;
  es_magico: boolean;
  oro_necesario: number;
  herramienta: string;
  ingredientes: Array<{
    objeto_id: number;
    nombre: string;
    cantidad_necesaria: number;
    es_material_raro?: boolean;
  }>;
  puede_craftear: boolean;
  ingredientes_faltantes: Array<{
    objeto: string;
    necesaria: number;
    actual: number;
    faltante: number;
  }>;
  rareza: string | null;
  material_raro: number | null;
  nombre_material_raro: string | null;
  tipo_artesano: string | null;
  grado_minimo_requerido: string;
  es_consumible: boolean;
  dc: number;
  exitos_requeridos: number;
  competencia_personaje: {
    id?: number;
    grado: string;
    exitos_acumulados: number;
    modificador?: number;
    modificador_competencia?: number;
    modificador_habilidad?: number;
    habilidad_maxima?: {
      nombre: string;
      valor: number;
    };
    info_grado?: {
      suma_oro: number;
      gasto_oro: number;
    };
    exitos_para_siguiente_grado?: number | null;
    mensaje?: string;
  } | null;
  coste_magico: {
    dias: number;
    oro: number;
  } | null;
  puede_craftear_rareza: boolean;
}

export interface Personaje {
  id: number;
  nombre_personaje: string;
  oro: number;
  tiempo_libre: number;
  nivel: number;
  // Campos opcionales adicionales de tu modelo Django
  treasure_points?: number;
  clase?: string;
  treasure_points_gastados?: number;
  especie?: string;
  faccion?: string;
  fuerza?: number;
  inteligencia?: number;
  sabiduria?: number;
  destreza?: number;
  constitucion?: number;
  carisma?: number;
}

export interface Tirada {
  id?: number;
  resultado_dado: number;
  modificador: number;
  resultado_total: number;
  dc?: number;
  exito: boolean;
  oro_sumado: number;
  oro_gastado: number;
  fecha?: string;
  mensaje?: string;
}

export interface Competencia {
  id: number;
  nombre_herramienta: string;
  grado: string;
  exitos_acumulados: number;
  modificador: number; // Total
  modificador_competencia: number; // Solo PB × grado
  modificador_habilidad: number; // Solo habilidad
  habilidad_maxima: {
    nombre: string;
    valor: number;
  };
  info_grado: {
    suma_oro: number;
    gasto_oro: number;
  };
  exitos_para_siguiente_grado: number | null;
  fecha_obtencion?: string;
}

//  INTERFACE DE PROGRESO
export interface Progreso {
  id: number;
  receta_nombre: string;
  objeto_final: string;
  es_magico: boolean;
  oro_acumulado: number;
  exitos_conseguidos: number;
  exitos_requeridos: number;
  oro_necesario: number;  // 
  dc: number;             // 
  dias_trabajados: number;
  estado: 'en_progreso' | 'completado' | 'pausado';
  porcentaje_completado: number;
  tiradas: Tirada[];
  competencia: Competencia;
  fecha_inicio: string;
  fecha_completado?: string | null;
}

//  TIPOS AUXILIARES PARA RESPUESTAS DE LA API

export interface SubidaGrado {
  mensaje: string;
  nuevo_grado: string;
  competencia: Competencia;
}

export interface RespuestaTirada {
  tirada: Tirada;
  progreso: Progreso;
  personaje: {
    oro: number;
    tiempo_libre: number;
  };
  subida_grado?: SubidaGrado;
}

export interface RespuestaIniciarCrafting {
  progreso: Progreso;
  mensaje: string;
  competencia_creada: boolean;
}

export interface RespuestaMisProgresos {
  en_progreso: Progreso[];
  completados: Progreso[];
}