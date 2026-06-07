import { apiRequest } from "@/src/services/api";

export interface Category {
  id_categoria: number;
  nome: string;
  cor_hex: string;
  icone: string;
}

export async function getCategories(carteiras: (number | null)[] = []): Promise<Category[]> {
  const query = carteiras.filter(Boolean).join(",");
  return apiRequest<Category[]>(`/categorias${query ? `?carteiras=${query}` : ""}`);
}

export async function createCategory(payload: {
  nome: string;
  icone: string;
  cor_hex: string;
  id_carteira?: number;
}): Promise<Category> {
  return apiRequest<Category>("/categorias", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateCategory(
  id: number,
  payload: { nome: string; icone: string; cor_hex: string }
): Promise<Category> {
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
