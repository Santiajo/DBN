export type Objeto = {
  id: number;
  Name: string;
  Source: string;
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
  rango_maximo: number;
  descripcion?: string | null;
  beneficio?: string | null;
}

export interface PagoRango {
  id: number;
  trabajo: number;
  rango: number;
  valor_suma: number;
  multiplicador: number;
}

// RESPUESTA PAGINADA
export interface ApiResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}