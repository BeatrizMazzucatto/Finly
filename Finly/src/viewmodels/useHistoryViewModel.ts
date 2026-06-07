import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Platform } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/src/context/AuthContext";
import { apiRequest } from "@/src/services/api";
import { getTransactionsByUser } from "@/src/services/transactions";
import type { Transaction } from "@/src/types/api";

const FILTER_OPTIONS = ["Todos", "Receitas", "Despesas"];

const MONTHS_LABEL = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const DAYS_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
const MONTHS_SHORT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

// Pré-calcula data de hoje e ontem fora do hook para não recriar a cada render
const todayStr = new Date().toISOString().split("T")[0];
const yesterdayDate = new Date();
yesterdayDate.setDate(yesterdayDate.getDate() - 1);
const yesterdayStr = yesterdayDate.toISOString().split("T")[0];

export function useHistoryViewModel() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("Todos");
  const [sortOrder, setSortOrder] = useState<"recent" | "oldest" | "highest" | "lowest">("recent");
  const [showSearch, setShowSearch] = useState(false);
  const [showSort, setShowSort] = useState(false);

  // ─── Month filters ─────────────────────────────────────────────────────────
  const monthFilters = useMemo(() => {
    if (transactions.length === 0) return [];
    const currentYear = new Date().getFullYear();
    const seen = new Set<string>();
    const list: { label: string; month: number; year: number }[] = [];

    for (const t of transactions) {
      const parts = t.data_transacao.split("-");
      if (parts.length < 2) continue;
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const key = `${year}-${month}`;
      if (!seen.has(key)) {
        seen.add(key);
        list.push({
          label: year === currentYear ? MONTHS_LABEL[month] : `${MONTHS_LABEL[month]} ${year}`,
          month,
          year,
        });
      }
    }

    return list.sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month);
  }, [transactions]);

  const [activeMonthFilter, setActiveMonthFilter] = useState<{
    label: string;
    month: number;
    year: number;
  } | null>(null);

  // Seleciona o mês mais recente por padrão
  useEffect(() => {
    if (monthFilters.length > 0 && !activeMonthFilter) {
      setActiveMonthFilter(monthFilters[monthFilters.length - 1]);
    }
  }, [monthFilters]);

  // ─── Load data ─────────────────────────────────────────────────────────────
  const loadData = useCallback(async (isPullToRefresh = false) => {
    if (!user) return;
    try {
      if (isPullToRefresh) setRefreshing(true);
      else setLoading(true);

      const data = await getTransactionsByUser(user.id_usuario);
      // Ordena desc por data uma única vez na carga (evita re-sort em cada filtro)
      data.sort((a, b) => b.data_transacao.localeCompare(a.data_transacao));
      setTransactions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  // ─── filteredTransactions via useMemo (zero estado extra, zero useEffect extra)
  const filteredTransactions = useMemo(() => {
    const jointId = user?.id_carteira_conjunta ?? 3;
    let filtered: Transaction[];

    if (activeFilter === "Conjuntas") {
      filtered = transactions.filter(t => t.id_carteira === jointId);
    } else {
      filtered = transactions.filter(t => t.id_carteira !== jointId);
      if (activeFilter === "Receitas") filtered = filtered.filter(t => t.tipo === "RECEITA");
      else if (activeFilter === "Despesas") filtered = filtered.filter(t => t.tipo === "DESPESA");
    }

    if (activeMonthFilter) {
      filtered = filtered.filter(t => {
        const parts = t.data_transacao.split("-");
        return parts.length >= 2
          && parseInt(parts[0], 10) === activeMonthFilter.year
          && parseInt(parts[1], 10) - 1 === activeMonthFilter.month;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        t => t.titulo.toLowerCase().includes(q) || (t.categoria?.toLowerCase().includes(q) ?? false)
      );
    }

    // Ordenação — só cria novo array se necessário
    switch (sortOrder) {
      case "oldest":  return [...filtered].sort((a, b) => a.data_transacao.localeCompare(b.data_transacao));
      case "highest": return [...filtered].sort((a, b) => Number(b.valor) - Number(a.valor));
      case "lowest":  return [...filtered].sort((a, b) => Number(a.valor) - Number(b.valor));
      default:        return filtered; // já ordenado desc por data_transacao desde a carga
    }
  }, [transactions, activeFilter, activeMonthFilter, searchQuery, sortOrder, user]);

  // ─── Totais (calculados em uma só passagem) ────────────────────────────────
  const { totalFiltered, totalDespesas, totalReceitas } = useMemo(() => {
    let d = 0, r = 0;
    for (const t of filteredTransactions) {
      if (t.tipo === "DESPESA") d += Number(t.valor);
      else r += Number(t.valor);
    }
    return { totalFiltered: r - d, totalDespesas: d, totalReceitas: r };
  }, [filteredTransactions]);

  // ─── Gráfico de saldo ─────────────────────────────────────────────────────
  const lineDataBalance = useMemo(() => {
    if (activeFilter !== "Todos") return [];
    const grouped: Record<string, number> = {};
    for (const t of filteredTransactions) {
      const d = t.data_transacao;
      grouped[d] = (grouped[d] || 0) + (t.tipo === "RECEITA" ? Number(t.valor) : -Number(t.valor));
    }
    const entries = Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
    if (entries.length === 0) return [];
    
    let currentBalance = 0;
    const data = entries.map(([date, netValue]) => {
      currentBalance += netValue;
      return { value: currentBalance, label: date.split("-")[2] };
    });
    
    return [{ value: 0, label: "" }, ...data];
  }, [filteredTransactions, activeFilter]);

  // ─── Agrupamento por data ─────────────────────────────────────────────────
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    for (const t of filteredTransactions) {
      if (!groups[t.data_transacao]) groups[t.data_transacao] = [];
      groups[t.data_transacao].push(t);
    }
    return groups;
  }, [filteredTransactions]);

  // ─── Actions ───────────────────────────────────────────────────────────────
  const handleEdit = useCallback((item: Transaction) => {
    router.push({
      pathname: "/transaction-form",
      params: {
        id_transacao: String(item.id_transacao),
        titulo: item.titulo,
        valor: String(item.valor),
        tipo: item.tipo,
        categoria_nome: item.categoria ?? "",
        data_transacao: item.data_transacao,
        id_carteira: String(item.id_carteira ?? 1),
      },
    });
  }, []);

  const handleDelete = useCallback((item: Transaction) => {
    const doDelete = async () => {
      try {
        await apiRequest(`/transacoes/${item.id_transacao}`, { method: "DELETE" });
        await loadData();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Não foi possível excluir.";
        if (Platform.OS === "web") alert(`Erro: ${msg}`);
        else Alert.alert("Erro", msg);
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm(`Deseja excluir "${item.titulo}"?`)) doDelete();
    } else {
      Alert.alert("Excluir transação", `Deseja excluir "${item.titulo}"?`, [
        { text: "Cancelar", style: "cancel" },
        { text: "Excluir", style: "destructive", onPress: doDelete },
      ]);
    }
  }, [loadData]);

  const formatDateHeader = useCallback((dateStr: string): string => {
    if (dateStr === todayStr) return "Hoje";
    if (dateStr === yesterdayStr) return "Ontem";
    const d = new Date(`${dateStr}T12:00:00`);
    return `${DAYS_SHORT[d.getDay()]}, ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
  }, []);

  const toggleSearch = useCallback(() => { setShowSearch(v => !v); setShowSort(false); }, []);
  const toggleSort   = useCallback(() => { setShowSort(v => !v);   setShowSearch(false); }, []);

  const navigateToPrevMonth = useCallback(() => {
    if (!activeMonthFilter) return;
    const idx = monthFilters.findIndex(m => m.month === activeMonthFilter.month && m.year === activeMonthFilter.year);
    if (idx > 0) setActiveMonthFilter(monthFilters[idx - 1]);
  }, [activeMonthFilter, monthFilters]);

  const navigateToNextMonth = useCallback(() => {
    if (!activeMonthFilter) return;
    const idx = monthFilters.findIndex(m => m.month === activeMonthFilter.month && m.year === activeMonthFilter.year);
    if (idx < monthFilters.length - 1) setActiveMonthFilter(monthFilters[idx + 1]);
  }, [activeMonthFilter, monthFilters]);

  const canGoPrevMonth = useCallback((): boolean => {
    if (!activeMonthFilter) return false;
    return monthFilters.findIndex(m => m.month === activeMonthFilter.month && m.year === activeMonthFilter.year) > 0;
  }, [activeMonthFilter, monthFilters]);

  const canGoNextMonth = useCallback((): boolean => {
    if (!activeMonthFilter) return false;
    const idx = monthFilters.findIndex(m => m.month === activeMonthFilter.month && m.year === activeMonthFilter.year);
    return idx < monthFilters.length - 1;
  }, [activeMonthFilter, monthFilters]);

  return {
    FILTER_OPTIONS,
    user,
    filteredTransactions,
    loading,
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
  };
}
