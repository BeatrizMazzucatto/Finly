import { apiRequest } from "@/src/services/api";
import type { Transaction } from "@/src/types/api";

interface TransactionsResponseMessage {
  mensagem: string;
}

export async function getTransactionsByUser(
  userId: number
): Promise<Transaction[]> {
  const response = await apiRequest<Transaction[] | TransactionsResponseMessage>(
    `/transacoes/${userId}`
  );

  if (!Array.isArray(response)) {
    return [];
  }

  return response;
}

export interface CreateTransactionPayload {
  id_carteira: number;
  id_usuario: number;
  id_categoria: number;
  titulo: string;
  descricao?: string;
  tipo: "RECEITA" | "DESPESA";
  valor: number;
  data_transacao: string; // YYYY-MM-DD
  forma_pagamento?: string;
  status?: "PAGO" | "PENDENTE";
}

export async function createTransaction(
  payload: CreateTransactionPayload
): Promise<{ mensagem: string; id_transacao: number }> {
  return apiRequest("/transacoes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateTransaction(
  id: number,
  payload: Partial<CreateTransactionPayload>
): Promise<{ mensagem: string }> {
  return apiRequest(`/transacoes/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteTransaction(
  id: number
): Promise<{ mensagem: string }> {
  return apiRequest(`/transacoes/${id}`, {
    method: "DELETE",
  });
}