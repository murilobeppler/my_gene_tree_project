export type Gender = 'male' | 'female' | 'other';

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  birthDate?: string;
  deathDate?: string;
  gender: Gender;
  photoUrl?: string;
  bio?: string;
  // IDs dos pais e cônjuges para reconstruir a árvore
  fatherId?: string;
  motherId?: string;
  spouses?: string[];
  children?: string[];
  media_items?: {
    id: number;
    type: string;
    url: string;
    title?: string;
  }[];
  // Frontend only props for interactivity
  onAddRelative?: (id: string) => void;
}

export interface FamilyTreeData {
  people: Record<string, Person>;
  rootId: string; // Pessoa foco inicial
}
