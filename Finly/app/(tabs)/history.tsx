import React, { useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
  TextInput,
  StatusBar,
  Dimensions
} from "react-native";
const SCREEN_W = Dimensions.get("window").width;
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors, BorderRadius, FontSize, FontWeight, Spacing } from "@/constants/theme";
import { Card, Chip, TransactionItem } from "@/components/ui";
import { LineChart } from "react-native-gifted-charts";
import { formatCurrency } from "@/utils/formatters";
import { useHistoryViewModel } from "@/src/viewmodels/useHistoryViewModel";
import type { Transaction } from "@/src/types/api";

const FILTER_OPTIONS = ["Todos", "Receitas", "Despesas"];

const SORT_OPTIONS = [
  { key: "recent", label: "Mais recentes" },
  { key: "oldest", label: "Mais antigas" },
  { key: "highest", label: "Maior valor" },
  { key: "lowest", label: "Menor valor" },
] as const;

export default function HistoryScreen() {
  const {
    filteredTransactions,
    refreshing,
    searchQuery,
    activeFilter,
    sortOrder,
    showSearch,
    showSort,
    monthFilters,
    activeMonthFilter,
    totalFiltered,
    totalDespesas,
    totalReceitas,
    lineDataBalance,
    groupedTransactions,
    setSearchQuery,
    setActiveFilter,
    setSortOrder,
    toggleSearch,
    toggleSort,
    navigateToPrevMonth,
    navigateToNextMonth,
    canGoPrevMonth,
    canGoNextMonth,
    loadData,
    handleEdit,
    handleDelete,
    formatDateHeader,
  } = useHistoryViewModel();

  // FlatList: converte grupos em seções flat [ header, item, item, header, item... ]
  const flatData = useMemo(() => {
    const result: Array<{ type: "header"; date: string } | { type: "item"; item: Transaction }> = [];
    for (const [date, items] of Object.entries(groupedTransactions)) {
      result.push({ type: "header", date });
      for (const item of items) result.push({ type: "item", item });
    }
    return result;
  }, [groupedTransactions]);

  const renderRow = useCallback(({ item: row }: { item: typeof flatData[number] }) => {
    if (row.type === "header") {
      return <Text style={styles.dateHeader}>{formatDateHeader(row.date)}</Text>;
    }
    const t = row.item;
    return (
      <TransactionItem
        id={t.id_transacao}
        id_carteira={t.id_carteira}
        usuario_nome={t.usuario_nome}
        titulo={t.titulo}
        valor={Number(t.valor)}
        tipo={t.tipo}
        categoria={t.categoria ?? "Outros"}
        data={t.data_transacao}
        showActions
        onEdit={() => handleEdit(t)}
        onDelete={() => handleDelete(t)}
        style={styles.transactionItem}
      />
    );
  }, [formatDateHeader, handleEdit, handleDelete]);

  const keyExtractor = useCallback((row: typeof flatData[number], idx: number) =>
    row.type === "header" ? `h-${row.date}` : `t-${row.item.id_transacao}-${idx}`, []);

  // Header da FlatList (tudo acima da lista de transações)
  const ListHeader = useMemo(() => (
    <>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Histórico</Text>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <Pressable onPress={toggleSort} style={styles.iconBtn}>
            <Feather name="sliders" size={22} color={Colors.textPrimary} />
          </Pressable>
          <Pressable onPress={toggleSearch} style={styles.iconBtn}>
            <Feather name="search" size={22} color={Colors.textPrimary} />
          </Pressable>
        </View>
      </View>

      {/* Sort Dropdown */}
      {showSort && (
        <View style={styles.sortDropdown}>
          <Text style={styles.sortDropdownTitle}>Ordenar transações por</Text>
          {SORT_OPTIONS.map((opt, idx) => (
            <Pressable
              key={opt.key}
              style={[styles.sortDropdownItem, idx === SORT_OPTIONS.length - 1 && { borderBottomWidth: 0 }]}
              onPress={() => setSortOrder(opt.key)}
            >
              <Text style={[styles.sortDropdownText, sortOrder === opt.key && { color: Colors.primary, fontWeight: "bold" }]}>
                {opt.label}
              </Text>
              {sortOrder === opt.key && <Feather name="check" size={18} color={Colors.primary} />}
            </Pressable>
          ))}
        </View>
      )}

      {/* Search */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar transações..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")}>
              <Feather name="x" size={20} color={Colors.textMuted} />
            </Pressable>
          )}
        </View>
      )}

      {/* Filtros de tipo */}
      <View style={styles.filtersRow}>
        {FILTER_OPTIONS.map(f => (
          <Chip key={f} label={f} selected={activeFilter === f} onPress={() => setActiveFilter(f)} color={Colors.primary} />
        ))}
      </View>

      {/* Seletor de mês */}
      {monthFilters.length > 0 && activeMonthFilter && (
        <View style={styles.monthSelector}>
          <Pressable style={styles.monthArrow} onPress={navigateToPrevMonth}>
            <Feather name="chevron-left" size={24} color={canGoPrevMonth() ? Colors.textPrimary : Colors.textMuted} />
          </Pressable>
          <Text style={styles.monthLabel}>{activeMonthFilter.label}</Text>
          <Pressable style={styles.monthArrow} onPress={navigateToNextMonth}>
            <Feather name="chevron-right" size={24} color={canGoNextMonth() ? Colors.textPrimary : Colors.textMuted} />
          </Pressable>
        </View>
      )}

      {/* Resumo */}
      <Card style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Receitas</Text>
            <Text style={[styles.summaryValue, { color: Colors.income }]}>+{formatCurrency(totalReceitas)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Despesas</Text>
            <Text style={[styles.summaryValue, { color: Colors.expense }]}>-{formatCurrency(totalDespesas)}</Text>
          </View>
        </View>
        <View style={styles.summaryTotal}>
          <Text style={styles.summaryTotalLabel}>Lucro</Text>
          <Text style={[styles.summaryTotalValue, { color: totalFiltered >= 0 ? Colors.income : Colors.expense }]}>
            {formatCurrency(Math.abs(totalFiltered))}
          </Text>
        </View>
      </Card>

      {/* Gráfico saldo */}
      {activeFilter === "Todos" && lineDataBalance.length > 0 && (
        <Card style={styles.summaryCard}>
          <Text style={{ fontSize: 14, fontWeight: "bold", color: Colors.textPrimary, marginBottom: 12 }}>Saldo</Text>
          <View style={{ alignItems: "center", width: "100%" }}>
            <Text style={{ fontSize: 10, color: Colors.textMuted, marginBottom: 4, alignSelf: 'flex-start' }}>Valor (R$)</Text>
            <LineChart
              data={lineDataBalance}
              areaChart 
              startFillColor={Colors.primary} startOpacity={0.3}
              endFillColor={Colors.primary} endOpacity={0.02}
              color={Colors.primary} thickness={3}
              xAxisColor={Colors.border} yAxisColor={Colors.border}
              yAxisTextStyle={{ color: Colors.textMuted, fontSize: 10 }}
              xAxisLabelTextStyle={{ color: Colors.textMuted, fontSize: 10 }}
              rulesColor={Colors.borderLight}
              curved 
              height={120} 
              width={SCREEN_W - 90}
              initialSpacing={20}
              noOfSections={4}
              isAnimated
            />
            <Text style={{ fontSize: 10, color: Colors.textMuted, marginTop: 4, textAlign: 'center' }}>Dias do mês</Text>
          </View>
        </Card>
      )}
    </>
  ), [showSort, showSearch, sortOrder, searchQuery, activeFilter, activeMonthFilter,
    monthFilters, totalReceitas, totalDespesas, totalFiltered, lineDataBalance,
    toggleSort, toggleSearch, setSortOrder, setSearchQuery, setActiveFilter,
    navigateToPrevMonth, navigateToNextMonth, canGoPrevMonth, canGoNextMonth]);

  const ListEmpty = useMemo(() => (
    <Card style={styles.emptyCard}>
      <Feather name="inbox" size={48} color={Colors.textMuted} />
      <Text style={styles.emptyTitle}>Nenhuma transação encontrada</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery || activeFilter !== "Todos" ? "Tente ajustar seus filtros" : "Comece adicionando sua primeira transação"}
      </Text>
      {!searchQuery && activeFilter === "Todos" && (
        <Pressable style={styles.emptyButton} onPress={() => router.push("/transaction-form")}>
          <Feather name="plus" size={18} color={Colors.textInverse} />
          <Text style={styles.emptyButtonText}>Adicionar transação</Text>
        </Pressable>
      )}
    </Card>
  ), [searchQuery, activeFilter]);

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={flatData}
      keyExtractor={keyExtractor}
      renderItem={renderRow}
      ListHeaderComponent={ListHeader}
      ListEmptyComponent={ListEmpty}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} />}
      showsVerticalScrollIndicator={false}
      removeClippedSubviews
      maxToRenderPerBatch={12}
      windowSize={5}
      initialNumToRender={15}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.xl, paddingTop: 50, paddingBottom: 100 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.lg },
  iconBtn: { padding: Spacing.xs, alignItems: "center", justifyContent: "center" },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#F1F5F9", borderRadius: 16, paddingHorizontal: 16, marginBottom: Spacing.md },
  searchIcon: { marginRight: Spacing.sm },
  searchInput: { flex: 1, paddingVertical: 14, fontSize: FontSize.md, color: Colors.textPrimary },
  filtersRow: { flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.lg, flexWrap: "wrap" },
  summaryCard: { marginBottom: Spacing.lg },
  summaryRow: { flexDirection: "row", marginBottom: Spacing.md },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryDivider: { width: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.lg },
  summaryLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: Spacing.xs },
  summaryValue: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  summaryTotal: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border },
  summaryTotalLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  summaryTotalValue: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  monthSelector: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: Colors.surface, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.full, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  monthArrow: { padding: Spacing.xs },
  monthLabel: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary, textTransform: "capitalize" },
  sortDropdown: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  sortDropdownTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textSecondary, marginBottom: Spacing.sm, textTransform: "uppercase", letterSpacing: 0.5 },
  sortDropdownItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  sortDropdownText: { fontSize: FontSize.md, color: Colors.textPrimary },
  dateHeader: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary, marginBottom: Spacing.sm, textTransform: "uppercase", letterSpacing: 0.5, marginTop: Spacing.md },
  transactionItem: { marginBottom: Spacing.sm },
  emptyCard: { alignItems: "center", paddingVertical: Spacing.xxl, gap: Spacing.sm },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  emptySubtitle: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: "center" },
  emptyButton: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, marginTop: Spacing.md },
  emptyButtonText: { color: Colors.textInverse, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
});