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