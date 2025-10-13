export interface Ingrediente {
  id?: number;
  objeto: number;
  cantidad: number;
  nombre_ingrediente?: string;
}

export interface Receta {
  id: number;
  objeto_final: number;
  nombre_objeto_final: string;
  ingredientes: Ingrediente[];
  cantidad_final: number;
  es_magico: boolean;
  oro_necesario: number;
  dificultad: string;
}

// Lo que se envía desde el formulario (sin 'id' ni 'nombre_objeto_final')
export type RecetaFormData = Omit<Receta, 'id' | 'nombre_objeto_final'>;
