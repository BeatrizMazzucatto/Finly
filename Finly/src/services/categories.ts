import { apiRequest } from "@/src/services/api";

export interface Category {
  id_categoria: number;
  nome: string;
  cor_hex: string;
  icone: string;
}

export async function getCategories(): Promise<Category[]> {
  return apiRequest<Category[]>("/categorias");
}

export async function createCategory(payload: {
  nome: string;
  icone: string;
  cor_hex: string;
}): Promise<Category> {
  return apiRequest<Category>("/categorias", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
