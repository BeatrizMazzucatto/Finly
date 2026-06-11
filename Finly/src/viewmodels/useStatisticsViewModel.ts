import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/src/context/AuthContext";
import { getTransactionsByUser } from "@/src/services/transactions";
import type { Transaction } from "@/src/types/api";
import { CATEGORIAS } from "@/constants/categories";
import { Colors } from "@/constants/theme";
import { formatCurrency, formatCurrencyShort } from "@/utils/formatters";

const CATEGORY_COLORS = ["#4F46E5","#3A8F31","#F59E0B","#D6492B","#8B5CF6","#EC4899","#14B8A6","#F97316","#6366F1","#84CC16"];
const MONTHS_PT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const MONTHS_FULL = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

export interface CategoryData { nome: string; total: number; percentual: number; cor: string; icon: string; }

export function useStatisticsViewModel() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"despesas" | "receitas">("despesas");

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());

  async function loadData(pull = false) {
    if (!user) return;
    try {
      if (pull) setRefreshing(true);
      const data = await getTransactionsByUser(user.id_usuario);
      setTransactions(data);
    } catch (e) { console.error(e); }
    finally { setRefreshing(false); }
  }

  useEffect(() => { loadData(); }, [user?.id_usuario]);

  function prevMonth() {
    if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(y => y - 1); }
    else setSelectedMonth(m => m - 1);
  }
  function nextMonth() {
    const isCurrentMonth = selectedYear === now.getFullYear() && selectedMonth === now.getMonth();
    if (isCurrentMonth) return;
    if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(y => y + 1); }
    else setSelectedMonth(m => m + 1);
  }

  const monthTxs = useMemo(() => transactions.filter(t => {
    const d = new Date(`${t.data_transacao}T12:00:00`);
    return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
  }), [transactions, selectedYear, selectedMonth]);

  const totalDespesas = useMemo(() => monthTxs.filter(t => t.tipo === "DESPESA").reduce((s, t) => s + Number(t.valor), 0), [monthTxs]);
  const totalReceitas = useMemo(() => monthTxs.filter(t => t.tipo === "RECEITA").reduce((s, t) => s + Number(t.valor), 0), [monthTxs]);
  const saldo = totalReceitas - totalDespesas;

  const categoryData = useMemo<CategoryData[]>(() => {
    const filtered = monthTxs.filter(t => activeTab === "despesas" ? t.tipo === "DESPESA" : t.tipo === "RECEITA");
    const total = filtered.reduce((s, t) => s + Number(t.valor), 0);
    if (total === 0) return [];
    const grouped: Record<string, number> = {};
    filtered.forEach(t => { const c = t.categoria ?? "Outros"; grouped[c] = (grouped[c] ?? 0) + Number(t.valor); });
    return Object.entries(grouped).map(([nome, tot], i) => {
      const catInfo = CATEGORIAS.find(c => c.nome === nome);
      return { nome, total: tot, percentual: (tot / total) * 100, cor: catInfo?.cor || CATEGORY_COLORS[i % CATEGORY_COLORS.length], icon: catInfo?.icon || "tag" };
    }).sort((a, b) => b.total - a.total);
  }, [monthTxs, activeTab]);

  const isCurrentMonth = selectedYear === now.getFullYear() && selectedMonth === now.getMonth();

  return {
    transactions, refreshing, activeTab, selectedYear, selectedMonth,
    monthTxs, totalDespesas, totalReceitas, saldo, categoryData, isCurrentMonth,
    MONTHS_PT, MONTHS_FULL, CATEGORY_COLORS,
    setActiveTab, loadData, prevMonth, nextMonth,
    formatCurrency, formatCurrencyShort,
  };
}
