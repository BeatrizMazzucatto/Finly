import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAuth } from "@/src/context/AuthContext";
import { getTransactionsByUser } from "@/src/services/transactions";
import type { Transaction } from "@/src/types/api";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalReceitas = useMemo(
    () =>
      transactions
        .filter((item) => item.tipo === "RECEITA")
        .reduce((total, item) => total + Number(item.valor), 0),
    [transactions]
  );

  const totalDespesas = useMemo(
    () =>
      transactions
        .filter((item) => item.tipo === "DESPESA")
        .reduce((total, item) => total + Number(item.valor), 0),
    [transactions]
  );

  const saldo = totalReceitas - totalDespesas;

  async function loadTransactions(isPullToRefresh = false) {
    if (!user) {
      return;
    }
    try {
      setError(null);
      if (isPullToRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const data = await getTransactionsByUser(user.id_usuario);
      setTransactions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dados");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id_usuario]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => loadTransactions(true)} />
      }
    >
      <Text style={styles.header}>Resumo financeiro</Text>
      <Text style={styles.greeting}>Olá, {user?.nome ?? "usuário"}.</Text>

      <View style={styles.cardsRow}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Saldo</Text>
          <Text style={styles.cardValue}>{formatCurrency(saldo)}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Receitas</Text>
          <Text style={styles.cardValue}>{formatCurrency(totalReceitas)}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Despesas</Text>
        <Text style={[styles.cardValue, styles.expenseText]}>{formatCurrency(totalDespesas)}</Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Transações</Text>
        <Pressable onPress={() => loadTransactions()} style={styles.refreshButton}>
          <Text style={styles.refreshButtonText}>Atualizar</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator size="large" />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : transactions.length === 0 ? (
        <Text style={styles.empty}>Nenhuma transação encontrada.</Text>
      ) : (
        transactions.map((item) => (
          <View key={item.id_transacao} style={styles.transactionItem}>
            <View style={styles.transactionInfo}>
              <Text style={styles.transactionTitle}>{item.titulo}</Text>
              <Text style={styles.transactionCategory}>
                {item.categoria ?? "Sem categoria"} • {item.data_transacao}
              </Text>
            </View>
            <Text
              style={[
                styles.transactionValue,
                item.tipo === "DESPESA" ? styles.expenseText : styles.incomeText,
              ]}
            >
              {item.tipo === "DESPESA" ? "-" : "+"}
              {formatCurrency(Number(item.valor))}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7FB" },
  content: { padding: 16, paddingTop: 24, paddingBottom: 36, gap: 12 },
  header: { fontSize: 28, fontWeight: "700", color: "#0F172A" },
  greeting: { color: "#334155", fontSize: 15, marginBottom: 4 },
  cardsRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    minWidth: 150,
    flexGrow: 1,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardLabel: { color: "#64748B", fontSize: 13, marginBottom: 6 },
  cardValue: { color: "#0F172A", fontSize: 20, fontWeight: "700" },
  sectionHeader: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  refreshButton: {
    borderWidth: 1,
    borderColor: "#2563EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  refreshButtonText: { color: "#2563EB", fontWeight: "600" },
  transactionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  transactionInfo: { flex: 1, marginRight: 12 },
  transactionTitle: { fontWeight: "700", color: "#0F172A", fontSize: 15 },
  transactionCategory: { color: "#64748B", marginTop: 2, fontSize: 12 },
  transactionValue: { fontWeight: "700", fontSize: 15 },
  incomeText: { color: "#15803D" },
  expenseText: { color: "#B91C1C" },
  error: { color: "#B91C1C", fontSize: 14 },
  empty: { color: "#64748B", fontSize: 14 },
});