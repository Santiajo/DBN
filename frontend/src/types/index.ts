export type Objeto = {
  id: number;
  Name: string;
  Source: string;
  es_investigable: boolean;
  Page: string | number;
  Rarity: string;
  Type: string;
  Attunement: string;
  Damage: string;
  Properties: string | string[];
  Mastery: string | string[];
  Weight: string | number;
  Value: string | number;
  Text: string;
};

export interface ObjetoTienda {
  id: number;
  objeto: number;
  nombre_objeto: string;
  stock: number;
  precio_personalizado?: number | null;
}

export interface Tienda {
  id: number;
  nombre: string;
  descripcion?: string | null;
  npc_asociado?: string | null;
  inventario: ObjetoTienda[];
}

export interface Personaje {
  id: number;
  user: number;
  nombre_usuario: string;
  nombre_personaje: string;
  treasure_points: number;
  oro: number;
  tiempo_libre: number;
  clase?: string;
  treasure_points_gastados?: number;
  nivel?: number;
  especie?: string;
  faccion?: string;
  fuerza: number;
  inteligencia: number;
  sabiduria: number;
  destreza: number;
  constitucion: number;
  carisma: number;
}

export interface InventarioItem {
  id: number;
  objeto: number;
  objeto_nombre: string;
  cantidad: number;
}

export interface Habilidad {
  id: number;
  nombre: string;
  estadistica_asociada: string;
}

export interface Trabajo {
  id?: number;
  nombre: string;
  requisito_habilidad: number;
  requisito_habilidad_nombre?: string;
  requisito_habilidad_estadistica: string;
  rango_maximo: number;
  descripcion?: string | null;
  beneficio?: string | null;
  pagos?: PagoRango[]; // Para cuando cargamos datos existentes
}

export interface PagoRango {
  id?: number;
  rango: number;
  valor_suma: number;
  multiplicador: number;
  trabajo?: number;
}

export interface ProgresoTrabajo {
  id: number;
  personaje: number; // ID del Personaje
  trabajo: number;   // ID del Trabajo
  rango_actual: number;
  dias_acumulados_rango: number;
}

export interface TrabajoFormData {
  nombre: string;
  requisito_habilidad: number;
  rango_maximo: number;
  descripcion?: string;
  beneficio?: string;
  pagos: PagoRango[]; // los pagos son parte del formulario
}

// RESPUESTA PAGINADA
export interface ApiResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface Proficiencia {
  id: number;
  personaje: number; // ID del Personaje
  personaje_nombre: string;
  habilidad: number; // ID de la Habilidad
  habilidad_nombre: string;
  es_proficiente: boolean;
}

export interface BonusProficiencia {
  id: number;
  nivel: number;
  bonus: number;
}

// Interfaces para Species y Traits
export type CreatureType =
  | 'Humanoid'
  | 'Elemental'
  | 'Monstrosity'
  | 'Fey'
  | 'Fiend'
  | 'Celestial'
  | 'Dragon'
  | 'Giant'
  | 'Aberration'
  | 'Beast'
  | 'Construct'
  | 'Ooze'
  | 'Plant'
  | 'Undead';

export type CreatureSize =
  | 'Tiny'
  | 'Small'
  | 'Medium'
  | 'Small or Medium'
  | 'Medium or Large'
  | 'Large'
  | 'Huge'
  | 'Gargantuan';

export interface DnDTraitOption {
  id: number;
  name: string;
  description: string;
  min_choices: number;
  max_choices: number;
  display_order: number;
}

export interface DnDTrait extends DnDTraitOption {
  species: number; 
  parent_choice: number | null; 
  options: DnDTraitOption[]; 
}

export interface DnDSpecies {
  id: number;
  name: string;
  slug: string;
  description: string;
  creature_type: CreatureType;
  size: CreatureSize;
  walking_speed: number;
  darkvision: number;
  traits: DnDTrait[]; 
}

// Interfaces para clases y features
export type HitDie = 6 | 8 | 10 | 12;

export type StatName = 
  | 'fuerza' 
  | 'destreza' 
  | 'constitucion' 
  | 'inteligencia' 
  | 'sabiduria' 
  | 'carisma';

export interface ClassFeature {
  id: number;
  name: string;
  level: number;
  description: string;
  display_order: number;
}

export interface ClassResource {
  id: number;
  name: string;
  progression: Record<string, number>; 
  reset_on: string;
  has_die: boolean;
  dice_type?: string;
}

export interface ClassResource {
  id: number;
  name: string;
  quantity_type: 'Fixed' | 'Stat' | 'Proficiency' | 'Unlimited';
  quantity_stat?: string; 
  progression: Record<string, number>; 
  value_progression: Record<string, string>;
  reset_on: string;
}

export interface DnDClass {
  id: number;
  name: string;
  slug: string;
  description: string;
  source: string;
  hit_die: HitDie;
  primary_ability: StatName;
  saving_throws: StatName[];
  skill_choices: Habilidad[];
  skill_choices_count: number;
  armor_proficiencies: string;
  weapon_proficiencies: string;
  tool_proficiencies: string;
  starting_equipment: string;
  features: ClassFeature[];
  resources: ClassResource[];
} 

export interface DnDClassPayload {
  id?: number;
  name: string;
  slug?: string;
  description: string;
  source: string;
  hit_die: number;
  primary_ability: string;
  saving_throws: string[];
  skill_choices_ids: number[]; 
  skill_choices_count: number;
  armor_proficiencies: string;
  weapon_proficiencies: string;
  tool_proficiencies: string;
  starting_equipment: string;
}

// Types para subclases
export interface SubclassFeature {
  id: number;
  name: string;
  level: number;
  description: string;
  display_order: number;
  parent_feature?: number | null; 
  options?: SubclassFeature[];
  choices_count: number;
}

export interface SubclassResource {
  id: number;
  name: string;
  quantity_type: 'Fixed' | 'Stat' | 'Proficiency' | 'Unlimited';
  quantity_stat?: string;
  progression: Record<string, number>;
  value_progression: Record<string, string>;
  reset_on: string;
}

// Subclase Principal
export interface DnDSubclass {
  id: number;
  name: string;
  slug: string;
  description: string;
  source: string;
  dnd_class: number;       
  dnd_class_name?: string; 

  // Proficiencias Extra
  skill_choices: Habilidad[]; 
  skill_choices_ids?: number[]; 
  skill_choices_count: number;
  bonus_proficiencies: string;

  // Relaciones
  features: SubclassFeature[];
  resources: SubclassResource[];
}

// Payload para Guardar (Create/Edit)
export interface DnDSubclassPayload {
  id?: number;
  name: string;
  slug?: string;
  description: string;
  source: string;
  dnd_class: number;
  
  skill_choices_ids: number[];
  skill_choices_count: number;
  bonus_proficiencies: string;
}