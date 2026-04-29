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
