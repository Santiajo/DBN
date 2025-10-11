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