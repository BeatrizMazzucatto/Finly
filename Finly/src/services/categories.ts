import { apiRequest } from "@/src/services/api";

export interface Category {
  id_categoria: number;
  nome: string;
  cor_hex: string;
  icone: string;
  id_carteira?: number | null;
}


export async function getCategories(id_carteira?: number | null): Promise<Category[]> {
  const url = id_carteira ? `/categorias/${id_carteira}` : "/categorias";
  return apiRequest<Category[]>(url);
}

export async function createCategory(payload: {
  nome: string;
  icone: string;
  cor_hex: string;
  id_carteira?: number | null;
}): Promise<Category> {
  return apiRequest<Category>("/categorias", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function editCategory(id: number, payload: {
  nome: string;
  icone: string;
  cor_hex: string;
}): Promise<Category> {
  return apiRequest<Category>(`/categorias/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteCategory(id: number): Promise<{ mensagem: string }> {
  return apiRequest<{ mensagem: string }>(`/categorias/${id}`, {
    method: "DELETE",
  });
}
