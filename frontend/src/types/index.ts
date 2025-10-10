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