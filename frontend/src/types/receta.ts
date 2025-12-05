// types/receta.ts

export interface Objeto {
  id: number;
  Name: string;
}

// ============ INGREDIENTES ============

// Ingrediente del endpoint /api/ingredientes/ (admin)
export interface IngredienteAPI {
  id: number;
  receta: number;
  objeto: number;
  cantidad: number;
}

// Ingrediente para formularios
export interface IngredienteForm {
  id?: number; 
  objeto: number | string;
  cantidad: number | string;
  nombre_objeto?: string;
}

// Ingrediente que viene de /api/recetas/ (admin)
export interface IngredienteAdmin {
  id: number;
  receta: number;
  objeto: number;
  nombre_ingrediente: string;
  cantidad: number;
}

// Ingrediente que viene de /api/crafting/recetas_disponibles/ (jugador)
export interface IngredienteCrafting {
  objeto_id: number;
  nombre: string;
  cantidad_necesaria: number;
  es_material_raro?: boolean;
}

// ============ RECETAS ============

// Campos comunes entre RecetaAdmin y RecetaCrafting
interface RecetaBase {
  id: number;
  nombre: string;
  objeto_final: string | number;
  nombre_objeto_final: string;
  cantidad_final: number;
  es_magico: boolean;
  oro_necesario: number;
  herramienta: string;
  rareza: string | null;
  material_raro: number | null;
  nombre_material_raro: string | null;
  tipo_artesano?: string | null;
  grado_minimo_requerido: string;
  es_consumible: boolean;
  dc: number;
  exitos_requeridos: number;
  requiere_investigacion: boolean;
}

// Receta del endpoint /api/recetas/ (para gestion/admin)
export interface RecetaAdmin extends RecetaBase {
  ingredientes: IngredienteAdmin[];
}

// Receta del endpoint /api/crafting/recetas_disponibles/ (para jugadores)
export interface RecetaCrafting extends RecetaBase {
  ingredientes: IngredienteCrafting[];
  puede_craftear?: boolean;
  ingredientes_faltantes?: Array<{
    objeto: string;
    necesaria: number;
    actual: number;
    faltante: number;
  }>;
  competencia_personaje?: CompetenciaPersonaje | null;
  coste_magico?: CosteMagico | null;
  puede_craftear_rareza?: boolean;
  esta_desbloqueada: boolean;
  objetos_investigables: ObjetoInvestigable[];
  puede_investigar: boolean;
}

// Tipo legacy para compatibilidad (usa RecetaCrafting o RecetaAdmin segun el contexto)
export type Receta = RecetaCrafting;

// ============ FORMULARIO DE RECETA ============

export interface RecetaFormData {
  nombre: string;
  objeto_final: number | string;
  cantidad_final: number;
  es_magico: boolean;
  oro_necesario: number;
  ingredientes: Array<Omit<IngredienteForm, 'nombre_objeto'> & { cantidad: number }>;
  rareza: string | null;
  material_raro: number | null;
  grado_minimo_requerido: string;
  es_consumible: boolean;
  herramienta: string;
  requiere_investigacion: boolean;
}

// ============ INVESTIGACION ============

export interface ObjetoInvestigable {
  id: number;
  nombre: string;
  rareza: string;
  es_objeto_final: boolean;
}

export interface RecetaDesbloqueada {
  id: number;
  personaje: number;
  receta: number;
  receta_nombre: string;
  fecha_desbloqueo: string;
}

export interface HistorialTiradaInvestigacion {
  id: number;
  resultado_dado: number;
  modificador: number;
  resultado_total: number;
  dc: number;
  exito: boolean;
  oro_gastado: number;
  fecha: string;
}

export interface ProgresoInvestigacion {
  id: number;
  receta_nombre: string;
  objeto_investigado_nombre: string;
  fuente_informacion: 'libros' | 'entrevistas' | 'experimentos' | 'campo';
  habilidad_nombre: string | null;
  competencia_nombre: string | null;
  exitos_conseguidos: number;
  exitos_requeridos: number;
  dc: number;
  dias_trabajados: number;
  oro_gastado_total: number;
  estado: 'en_progreso' | 'completado';
  porcentaje_completado: number;
  tiradas: HistorialTiradaInvestigacion[];
  fecha_inicio: string;
}

export interface HabilidadInvestigacion {
  id: number | null;
  nombre: string;
  estadistica: string;
}

export interface HabilidadesPorFuente {
  libros: HabilidadInvestigacion[];
  entrevistas: HabilidadInvestigacion[];
  experimentos: HabilidadInvestigacion[];
  campo: never[];
}

// ============ PERSONAJE ============

export interface Personaje {
  id: number;
  nombre_personaje: string;
  oro: number;
  tiempo_libre: number;
  nivel: number;
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

// ============ TIRADAS Y COMPETENCIAS ============

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
  modificador: number;
  modificador_competencia: number;
  modificador_habilidad: number;
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

export interface CompetenciaPersonaje {
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
}

// ============ PROGRESO DE CRAFTING ============

export interface Progreso {
  id: number;
  receta_nombre: string;
  objeto_final: string;
  es_magico: boolean;
  oro_acumulado: number;
  exitos_conseguidos: number;
  exitos_requeridos: number;
  oro_necesario: number;
  dc: number;
  dias_trabajados: number;
  estado: 'en_progreso' | 'completado' | 'pausado';
  porcentaje_completado: number;
  tiradas: Tirada[];
  competencia: Competencia;
  fecha_inicio: string;
  fecha_completado?: string | null;
}

// ============ TIPOS AUXILIARES ============

export interface CosteMagico {
  dias: number;
  oro: number;
}

export interface SubidaGrado {
  mensaje: string;
  nuevo_grado: string;
  competencia: Competencia;
}

// ============ RESPUESTAS DE LA API - CRAFTING ============

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

// ============ RESPUESTAS DE LA API - INVESTIGACION ============

export interface IniciarInvestigacionPayload {
  receta_id: number;
  personaje_id: number;
  objeto_investigado_id: number;
  fuente_informacion: 'libros' | 'entrevistas' | 'experimentos' | 'campo';
  habilidad_id?: number | null;
  competencia_herramienta_id?: number | null;
}

export interface TiradaInvestigacionPayload {
  progreso_id: number;
}

export interface RespuestaIniciarInvestigacion {
  progreso: ProgresoInvestigacion;
  mensaje: string;
}

export interface RespuestaTiradaInvestigacion {
  tirada: {
    resultado_dado: number;
    modificador: number;
    resultado_total: number;
    dc: number;
    exito: boolean;
    oro_gastado: number;
    mensaje: string;
  };
  progreso: ProgresoInvestigacion;
  personaje: {
    oro: number;
    tiempo_libre: number;
  };
  receta_desbloqueada: boolean;
}

export interface RespuestaMisInvestigaciones {
  en_progreso: ProgresoInvestigacion[];
  completadas: ProgresoInvestigacion[];
}

// ============ PROFICIENCIAS ============

export interface Proficiencia {
  id: number;
  personaje: number;
  personaje_nombre: string;
  habilidad: number;
  habilidad_nombre: string;
  es_proficiente: boolean;
}

export interface Habilidad {
  id: number;
  nombre: string;
  estadistica_asociada: string;
}

// ============ TIPOS PARA SELECT (React Select) ============

export interface SelectOption {
  value: number | string;
  label: string;
}