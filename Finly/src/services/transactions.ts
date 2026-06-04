import { apiRequest } from "@/src/services/api";
import type { Transaction } from "@/src/types/api";
import { useEffect, useRef, useState } from "react";

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
  id: number,
  id_usuario?: number
): Promise<{ mensagem: string }> {
  return apiRequest(`/transacoes/${id}`, {
    method: "DELETE",
    body: JSON.stringify({ id_usuario }),
  });
}

/**
 * Hook que sincroniza as transações automaticamente a cada 5 segundos.
 * Atende ao requisito de sincronização entre dispositivos em até 5s.
 */
export function useTransactionSync(userId: number | undefined, intervalMs = 5000) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function fetchTransactions() {
    if (!userId) return;
    try {
      const data = await getTransactionsByUser(userId);
      setTransactions(data);
      setLastSync(new Date());
    } catch (err) {
      // Silencia erros de polling para não interromper o usuário
      console.warn("[Sync] Falha ao sincronizar:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!userId) return;

    // Carga inicial
    fetchTransactions();

    // Polling a cada intervalMs (padrão: 5s)
    intervalRef.current = setInterval(fetchTransactions, intervalMs);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [userId, intervalMs]);

  return { transactions, loading, lastSync, refresh: fetchTransactions };
}