// Ícones e dados das categorias
import { Feather } from "@expo/vector-icons";
import { Colors } from "./theme";

export type CategoryIconName = keyof typeof Feather.glyphMap;

export interface Category {
  id: number;
  nome: string;
  icon: CategoryIconName;
  cor: string;
}

export const CATEGORIAS: Category[] = [
  { id: 1, nome: "Alimentação", icon: "coffee", cor: Colors.categories.alimentacao },
  { id: 2, nome: "Mercado", icon: "shopping-cart", cor: Colors.categories.alimentacao },
  { id: 3, nome: "Transporte", icon: "truck", cor: Colors.categories.transporte },
  { id: 4, nome: "Combustível", icon: "droplet", cor: Colors.categories.transporte },
  { id: 5, nome: "Saúde", icon: "heart", cor: Colors.categories.saude },
  { id: 6, nome: "Farmácia", icon: "plus-square", cor: Colors.categories.saude },
  { id: 7, nome: "Lazer", icon: "film", cor: Colors.categories.lazer },
  { id: 8, nome: "Moradia", icon: "home", cor: Colors.categories.moradia },
  { id: 9, nome: "Educação", icon: "book", cor: Colors.categories.educacao },
  { id: 10, nome: "Compras", icon: "shopping-bag", cor: Colors.categories.compras },
  { id: 11, nome: "Serviços", icon: "tool", cor: Colors.categories.servicos },
  { id: 12, nome: "Salário", icon: "briefcase", cor: Colors.categories.salario },
  { id: 13, nome: "Investimentos", icon: "trending-up", cor: Colors.categories.investimentos },
  { id: 14, nome: "Outros", icon: "more-horizontal", cor: Colors.categories.outros },
];

export function getCategoryById(id: number): Category | undefined {
  return CATEGORIAS.find((cat) => cat.id === id);
}

export function getCategoryByName(nome: string): Category | undefined {
  return CATEGORIAS.find((cat) => cat.nome.toLowerCase() === nome.toLowerCase());
}

export function getCategoryIcon(categoria: string): CategoryIconName {
  const cat = getCategoryByName(categoria);
  return cat?.icon ?? "tag";
}

export function getCategoryColor(categoria: string): string {
  const cat = getCategoryByName(categoria);
  return cat?.cor ?? Colors.categories.outros;
}