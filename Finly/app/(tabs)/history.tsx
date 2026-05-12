import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  TextInput,
  Alert,
  StatusBar,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "@/src/context/AuthContext";
import { apiRequest } from "@/src/services/api";
import { getTransactionsByUser } from "@/src/services/transactions";
import type { Transaction } from "@/src/types/api";
import { Colors, BorderRadius, FontSize, FontWeight, Spacing, Shadow } from "@/constants/theme";
import { Card, Chip, TransactionItem } from "@/components/ui";
import { formatCurrency, getCurrentMonthYear } from "@/utils/formatters";
import { CATEGORIAS } from "@/constants/categories";

const FILTER_OPTIONS = ["Todos", "Alimentação", "Transporte", "Saúde", "Lazer", "Moradia"];

export default function HistoryScreen() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("Todos");
  const [sortOrder, setSortOrder] = useState<"recent" | "oldest" | "highest" | "lowest">("recent");

  async function loadData(isPullToRefresh = false) {
    if (!user) return;
    try {
      if (isPullToRefresh) setRefreshing(true);
      else setLoading(true);

      const data = await getTransactionsByUser(user.id_usuario);
      const sorted = [...data].sort(
        (a, b) => new Date(b.data_transacao).getTime() - new Date(a.data_transacao).getTime()
      );
      setTransactions(sorted);
      setFilteredTransactions(sorted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [user?.id_usuario]);

  // Filtrar e ordenar transações
  useEffect(() => {
    let filtered = [...transactions];

    // Filtro por categoria
    if (activeFilter !== "Todos") {
      filtered = filtered.filter((t) => t.categoria === activeFilter);
    }

    // Filtro por busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.titulo.toLowerCase().includes(query) ||
          (t.categoria?.toLowerCase().includes(query) ?? false)
      );
    }

    // Ordenação
    switch (sortOrder) {
      case "oldest":
        filtered.sort((a, b) => new Date(a.data_transacao).getTime() - new Date(b.data_transacao).getTime());
        break;
      case "highest":
        filtered.sort((a, b) => Number(b.valor) - Number(a.valor));
        break;
      case "lowest":
        filtered.sort((a, b) => Number(a.valor) - Number(b.valor));
        break;
      default:
        filtered.sort((a, b) => new Date(b.data_transacao).getTime() - new Date(a.data_transacao).getTime());
    }

    setFilteredTransactions(filtered);
  }, [transactions, activeFilter, searchQuery, sortOrder]);

  const totalFiltered = useMemo(
    () => filteredTransactions.reduce((a, t) => a + (t.tipo === "DESPESA" ? -Number(t.valor) : Number(t.valor)), 0),
    [filteredTransactions]
  );

  const totalDespesas = useMemo(
    () => filteredTransactions.filter((t) => t.tipo === "DESPESA").reduce((a, t) => a + Number(t.valor), 0),
    [filteredTransactions]
  );

  const totalReceitas = useMemo(
    () => filteredTransactions.filter((t) => t.tipo === "RECEITA").reduce((a, t) => a + Number(t.valor), 0),
    [filteredTransactions]
  );

  // Agrupar por data
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    filteredTransactions.forEach((t) => {
      const date = t.data_transacao;
      if (!groups[date]) groups[date] = [];
      groups[date].push(t);
    });
    return groups;
  }, [filteredTransactions]);

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
              await loadData();
            } catch (err) {
              Alert.alert("Erro", err instanceof Error ? err.message : "Não foi possível excluir.");
            }
          },
        },
      ]
    );
  }

  function formatDateHeader(dateStr: string): string {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateStr === today.toISOString().split("T")[0]) return "Hoje";
    if (dateStr === yesterday.toISOString().split("T")[0]) return "Ontem";

    const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} />}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Histórico</Text>
        <Text style={styles.subtitle}>{getCurrentMonthYear()}</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Feather name="search" size={20} color={Colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar transações..."
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery("")}>
            <Feather name="x" size={20} color={Colors.textMuted} />
          </Pressable>
        )}
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
        contentContainerStyle={styles.filtersContent}
      >
        {FILTER_OPTIONS.map((filter) => (
          <Chip
            key={filter}
            label={filter}
            selected={activeFilter === filter}
            onPress={() => setActiveFilter(filter)}
            color={Colors.primary}
          />
        ))}
      </ScrollView>

      {/* Summary Card */}
      <Card style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Receitas</Text>
            <Text style={[styles.summaryValue, { color: Colors.income }]}>
              +{formatCurrency(totalReceitas)}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Despesas</Text>
            <Text style={[styles.summaryValue, { color: Colors.expense }]}>
              -{formatCurrency(totalDespesas)}
            </Text>
          </View>
        </View>
        <View style={styles.summaryTotal}>
          <Text style={styles.summaryTotalLabel}>
            {filteredTransactions.length} transações
          </Text>
          <Text style={[
            styles.summaryTotalValue,
            { color: totalFiltered >= 0 ? Colors.income : Colors.expense },
          ]}>
            {formatCurrency(Math.abs(totalFiltered))}
          </Text>
        </View>
      </Card>

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Ordenar por:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.sortOptions}>
            {[
              { key: "recent", label: "Recentes", icon: "clock" },
              { key: "oldest", label: "Antigas", icon: "calendar" },
              { key: "highest", label: "Maior valor", icon: "arrow-up" },
              { key: "lowest", label: "Menor valor", icon: "arrow-down" },
            ].map((option) => (
              <Pressable
                key={option.key}
                style={[
                  styles.sortOption,
                  sortOrder === option.key && styles.sortOptionActive,
                ]}
                onPress={() => setSortOrder(option.key as any)}
              >
                <Feather
                  name={option.icon as any}
                  size={14}
                  color={sortOrder === option.key ? Colors.primary : Colors.textMuted}
                />
                <Text style={[
                  styles.sortOptionText,
                  sortOrder === option.key && styles.sortOptionTextActive,
                ]}>
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Feather name="inbox" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>Nenhuma transação encontrada</Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery || activeFilter !== "Todos"
              ? "Tente ajustar seus filtros"
              : "Comece adicionando sua primeira transação"}
          </Text>
          {!searchQuery && activeFilter === "Todos" && (
            <Pressable style={styles.emptyButton} onPress={() => router.push("/transaction-form")}>
              <Feather name="plus" size={18} color={Colors.textInverse} />
              <Text style={styles.emptyButtonText}>Adicionar transação</Text>
            </Pressable>
          )}
        </Card>
      ) : (
        Object.entries(groupedTransactions).map(([date, items]) => (
          <View key={date} style={styles.dateGroup}>
            <Text style={styles.dateHeader}>{formatDateHeader(date)}</Text>
            <View style={styles.transactionsList}>
              {items.map((item) => (
                <TransactionItem
                  key={item.id_transacao}
                  id={item.id_transacao}
                  titulo={item.titulo}
                  valor={Number(item.valor)}
                  tipo={item.tipo}
                  categoria={item.categoria ?? "Outros"}
                  data={item.data_transacao}
                  showActions
                  onEdit={() => handleEdit(item)}
                  onDelete={() => handleDelete(item)}
                />
              ))}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.xl,
    paddingTop: 50,
    paddingBottom: 100,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  filtersScroll: {
    marginBottom: Spacing.lg,
  },
  filtersContent: {
    gap: Spacing.sm,
    paddingRight: Spacing.lg,
  },
  summaryCard: {
    marginBottom: Spacing.lg,
  },
  summaryRow: {
    flexDirection: "row",
    marginBottom: Spacing.md,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.lg,
  },
  summaryLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  summaryValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  summaryTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  summaryTotalLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  summaryTotalValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  sortContainer: {
    marginBottom: Spacing.lg,
  },
  sortLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  sortOptions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  sortOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sortOptionActive: {
    backgroundColor: Colors.primary + "15",
    borderColor: Colors.primary,
  },
  sortOptionText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
  },
  sortOptionTextActive: {
    color: Colors.primary,
  },
  dateGroup: {
    marginBottom: Spacing.xl,
  },
  dateHeader: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  transactionsList: {
    gap: Spacing.sm,
  },
  emptyCard: {
    alignItems: "center",
    paddingVertical: Spacing.xxl,
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: "center",
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  emptyButtonText: {
    color: Colors.textInverse,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
});