import { useMemo, useCallback, useState } from "react";
import { Alert } from "react-native";
import { useAuth } from "@/src/context/AuthContext";
import { useTransactionSync } from "@/src/services/transactions";
import { formatCurrency, formatDateMD } from "@/utils/formatters";

export function useDashboardViewModel() {
  const { user } = useAuth();

  // Polling automático de 5s para sincronização entre dispositivos
  const { transactions, loading: loadingData, refresh } = useTransactionSync(user?.id_usuario);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [focusedCat, setFocusedCat] = useState<{ name: string, value: number } | null>(null);


  const [chartType, setChartType] = useState<'DESPESA' | 'RECEITA'>('DESPESA');
  const [walletFilter, setWalletFilter] = useState<'AMBAS' | 'PESSOAL' | 'CONJUNTA'>('PESSOAL');

  async function handleRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return transactions.filter(t => {
      const personalWalletId = user?.id_carteira_pessoal || 1;
      const jointWalletId = user?.id_carteira_conjunta || 3;

      // Wallet filter
      if (walletFilter === 'PESSOAL' && Number(t.id_carteira) !== Number(personalWalletId)) return false;
      if (walletFilter === 'CONJUNTA' && Number(t.id_carteira) !== Number(jointWalletId)) return false;

      // Period filter (Forçado para mês atual)
      const parts = t.data_transacao.split('-');
      if (parts.length < 2) return true;
      const transYear = parseInt(parts[0], 10);
      const transMonth = parseInt(parts[1], 10) - 1;

      return transYear === currentYear && transMonth === currentMonth;
    });
  }, [transactions, walletFilter, user]);

  const { saldo, totalDespesas, totalReceitas, expensesByCategory, incomesByCategory } = useMemo(() => {
    let s = 0;
    let d = 0;
    let r = 0;
    let expCats: Record<string, number> = {};
    let incCats: Record<string, number> = {};

    filteredTransactions.forEach(t => {
      const val = Number(t.valor);
      const c = t.categoria || "Outros";
      if (t.tipo === "RECEITA") {
        s += val;
        r += val;
        incCats[c] = (incCats[c] || 0) + val;
      } else {
        s -= val;
        d += val;
        expCats[c] = (expCats[c] || 0) + val;
      }
    });
    return { saldo: s, totalDespesas: d, totalReceitas: r, expensesByCategory: expCats, incomesByCategory: incCats };
  }, [filteredTransactions]);

  const recentTransactions = useMemo(() => {
    return [...filteredTransactions]
      .sort((a, b) => b.data_transacao.localeCompare(a.data_transacao))
      .slice(0, 5);
  }, [filteredTransactions]);

  return {
    // State
    user,
    recentTransactions,
    loadingData,
    refreshing,
    modalVisible,
    focusedCat,
    chartType,
    walletFilter,
    saldo,
    totalDespesas,
    totalReceitas,
    expensesByCategory,
    incomesByCategory,

    // Actions
    setModalVisible,
    setFocusedCat,
    setChartType,
    setWalletFilter,
    handleRefresh,

    // Formatters
    formatCurrency,
    formatDate: formatDateMD,
  };
}
