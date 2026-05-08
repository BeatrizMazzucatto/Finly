import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";

import { useAuth } from "@/src/context/AuthContext";
import { apiRequest } from "@/src/services/api";
import { getTransactionsByUser } from "@/src/services/transactions";
import type { Transaction } from "@/src/types/api";
import TransactionFilters from "@/src/components/TransactionFilters";
import SpendingLimitCard from "@/src/components/SpendingLimitCard";
import SpendingByCategoryChart from "@/src/components/SpendingByCategoryChart"; // US08

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalReceitas = useMemo(
    () => transactions.filter((t) => t.tipo === "RECEITA").reduce((a, t) => a + Number(t.valor), 0),
    [transactions]
  );
  const totalDespesas = useMemo(
    () => transactions.filter((t) => t.tipo === "DESPESA").reduce((a, t) => a + Number(t.valor), 0),
    [transactions]
  );
  const saldo = totalReceitas - totalDespesas;

  async function loadTransactions(isPullToRefresh = false) {
    if (!user) return;
    try {
      setError(null);
      if (isPullToRefresh) setRefreshing(true);
      else setLoading(true);
      const data = await getTransactionsByUser(user.id_usuario);
      const sorted = [...data].sort(
        (a, b) => new Date(b.data_transacao).getTime() - new Date(a.data_transacao).getTime()
      );
      setTransactions(sorted);
      setFilteredTransactions(sorted);
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

  const handleFilterChange = useCallback((filtered: Transaction[]) => {
    setFilteredTransactions(filtered);
  }, []);

  function handleEdit(item: Transaction) {
    router.push({
      pathname: "/transaction-form",
      params: {
        id_transacao: String(item.id_transacao),
        titulo: item.titulo,
        valor: String(item.valor),
        tipo: item.tipo,
        categoria_nome: item.categoria ?? "",
        data_transacao: item.data_transacao,
      },
    });
  }

  function handleDelete(item: Transaction) {
    Alert.alert(
      "Excluir transação",
      `Deseja excluir "${item.titulo}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await apiRequest(`/transacoes/${item.id_transacao}`, { method: "DELETE" });
              await loadTransactions();
            } catch (err) {
              Alert.alert("Erro", err instanceof Error ? err.message : "Não foi possível excluir.");
            }
          },
        },
      ]
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadTransactions(true)} />}
    >
      <Text style={styles.header}>Resumo financeiro</Text>
      <Text style={styles.greeting}>Olá, {user?.nome ?? "usuário"}. 👋</Text>

      {/* Cards de saldo */}
      <View style={styles.cardsRow}>
        <View style={[styles.card, styles.cardFlex]}>
          <Text style={styles.cardLabel}>Saldo</Text>
          <Text style={[styles.cardValue, { color: saldo >= 0 ? "#15803D" : "#B91C1C" }]}>
            {formatCurrency(saldo)}
          </Text>
        </View>
        <View style={[styles.card, styles.cardFlex]}>
          <Text style={styles.cardLabel}>Receitas</Text>
          <Text style={[styles.cardValue, { color: "#15803D" }]}>{formatCurrency(totalReceitas)}</Text>
        </View>
      </View>
      <View style={[styles.card, { marginBottom: 12 }]}>
        <Text style={styles.cardLabel}>Despesas</Text>
        <Text style={[styles.cardValue, { color: "#B91C1C" }]}>{formatCurrency(totalDespesas)}</Text>
      </View>

      {/* US09 — Limite de gastos */}
      <Text style={styles.sectionTitle}>Limite de Gastos</Text>
      <SpendingLimitCard totalDespesas={totalDespesas} />

      {/* US08 — Gráfico de gastos por categoria */}
      <Text style={styles.sectionTitle}>Gastos por Categoria</Text>
      <SpendingByCategoryChart transactions={transactions} />

      {/* US05 — Lista de transações */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Transações</Text>
        <Pressable style={styles.btnNova} onPress={() => router.push("/transaction-form")}>
          <Text style={styles.btnNovaText}>+ Nova</Text>
        </Pressable>
      </View>

      {/* US06 — Filtros */}
      <TransactionFilters transactions={transactions} onFilterChange={handleFilterChange} />

      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 24 }} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : filteredTransactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Nenhuma transação encontrada.</Text>
          <Pressable style={styles.btnEmptyAdd} onPress={() => router.push("/transaction-form")}>
            <Text style={styles.btnEmptyAddText}>Cadastrar primeira transação</Text>
          </Pressable>
        </View>
      ) : (
        filteredTransactions.map((item) => (
          <View key={item.id_transacao} style={styles.transactionItem}>
            <View style={[styles.badge, { backgroundColor: item.tipo === "DESPESA" ? "#FEE2E2" : "#DCFCE7" }]}>
              <Text style={styles.badgeText}>{item.tipo === "DESPESA" ? "↓" : "↑"}</Text>
            </View>
            <View style={styles.transactionInfo}>
              <Text style={styles.transactionTitle}>{item.titulo}</Text>
              <Text style={styles.transactionMeta}>
                {item.categoria ?? "Sem categoria"} • {formatDate(item.data_transacao)}
              </Text>
            </View>
            <Text style={[styles.transactionValue, { color: item.tipo === "DESPESA" ? "#B91C1C" : "#15803D" }]}>
              {item.tipo === "DESPESA" ? "-" : "+"}{formatCurrency(Number(item.valor))}
            </Text>
            <View style={styles.actions}>
              <Pressable onPress={() => handleEdit(item)} style={styles.actionBtn}>
                <Text style={styles.actionEdit}>✏️</Text>
              </Pressable>
              <Pressable onPress={() => handleDelete(item)} style={styles.actionBtn}>
                <Text style={styles.actionDelete}>🗑️</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7FB" },
  content: { padding: 16, paddingTop: 24, paddingBottom: 36, gap: 8 },
  header: { fontSize: 26, fontWeight: "700", color: "#0F172A" },
  greeting: { color: "#334155", fontSize: 14, marginBottom: 12 },
  cardsRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#E2E8F0" },
  cardFlex: { flex: 1 },
  cardLabel: { color: "#64748B", fontSize: 12, marginBottom: 4 },
  cardValue: { fontSize: 18, fontWeight: "700" },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A", marginBottom: 8, marginTop: 4 },
  btnNova: { backgroundColor: "#2563EB", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7 },
  btnNovaText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },
  transactionItem: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#E2E8F0", marginBottom: 8, gap: 10 },
  badge: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  badgeText: { fontSize: 16, fontWeight: "700" },
  transactionInfo: { flex: 1 },
  transactionTitle: { fontWeight: "700", color: "#0F172A", fontSize: 14 },
  transactionMeta: { color: "#64748B", marginTop: 2, fontSize: 12 },
  transactionValue: { fontWeight: "700", fontSize: 13 },
  actions: { flexDirection: "row", gap: 4 },
  actionBtn: { padding: 4, borderRadius: 8 },
  actionEdit: { fontSize: 16 },
  actionDelete: { fontSize: 16 },
  emptyContainer: { alignItems: "center", paddingVertical: 32, gap: 12 },
  emptyText: { color: "#64748B", fontSize: 14 },
  btnEmptyAdd: { backgroundColor: "#2563EB", borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  btnEmptyAddText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
  error: { color: "#B91C1C", fontSize: 14, marginTop: 8 },
});