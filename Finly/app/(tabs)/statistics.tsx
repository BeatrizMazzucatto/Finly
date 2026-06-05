import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { PieChart, BarChart, LineChart } from "react-native-gifted-charts";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@/src/context/AuthContext";
import { getTransactionsByUser } from "@/src/services/transactions";
import type { Transaction } from "@/src/types/api";
import { BorderRadius, Colors, FontSize, FontWeight, Shadow, Spacing } from "@/constants/theme";
import { CATEGORIAS } from "@/constants/categories";
import { formatCurrency, formatCurrencyShort } from "@/utils/formatters";

const { width: SCREEN_W } = Dimensions.get("window");
const CHART_W = SCREEN_W - Spacing.xxl * 2 - 32;

const CATEGORY_COLORS = [
  "#4F46E5","#10B981","#F59E0B","#EF4444","#8B5CF6",
  "#EC4899","#14B8A6","#F97316","#6366F1","#84CC16",
];

const MONTHS_PT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const MONTHS_FULL = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

interface CategoryData { nome: string; total: number; percentual: number; cor: string; icon: string; }

// ─── Donut Chart ──────────────────────────────────────────────────────────────
function DonutChart({ data, total, label }: { data: CategoryData[]; total: number; label: string }) {
  const [focusedCat, setFocusedCat] = useState<CategoryData | null>(null);

  if (data.length === 0) {
    return (
      <View style={{ alignItems: "center", paddingVertical: 32 }}>
        <Feather name="pie-chart" size={48} color={Colors.textMuted} />
        <Text style={{ color: Colors.textMuted, marginTop: 8, fontSize: FontSize.sm }}>Sem dados</Text>
      </View>
    );
  }

  const pieData = data.slice(0, 8).map(cat => ({
    value: cat.total,
    color: cat.cor,
    text: cat.nome,
    focused: focusedCat?.nome === cat.nome,
    onPress: () => {
      if (focusedCat?.nome === cat.nome) {
        setFocusedCat(null);
      } else {
        setFocusedCat(cat);
      }
    }
  }));

  return (
    <View style={{ alignItems: "center", paddingVertical: 10 }}>
      <PieChart
        data={pieData}
        donut
        focusOnPress
        toggleFocusOnPress
        radius={100}
        innerRadius={70}
        innerCircleColor={Colors.surface}
        centerLabelComponent={() => {
          if (focusedCat) {
            return (
              <View style={{justifyContent: 'center', alignItems: 'center'}}>
                <Text style={{fontSize: FontSize.xs, color: focusedCat.cor, fontWeight: 'bold'}}>{focusedCat.nome}</Text>
                <Text style={{fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary}}>
                  {formatCurrencyShort(focusedCat.total)}
                </Text>
              </View>
            );
          }
          return (
            <View style={{justifyContent: 'center', alignItems: 'center'}}>
              <Text style={{fontSize: FontSize.xs, color: Colors.textMuted}}>{label}</Text>
              <Text style={{fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary}}>
                {formatCurrencyShort(total)}
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
}

// ─── Bar Chart (últimos 6 meses) ──────────────────────────────────────────────
function MonthlyBarChart({ transactions }: { transactions: Transaction[] }) {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return { year: d.getFullYear(), month: d.getMonth(), label: MONTHS_PT[d.getMonth()] };
  });

  const barData: any[] = [];
  months.forEach(m => {
    const txs = transactions.filter(t => {
      const d = new Date(`${t.data_transacao}T12:00:00`);
      return d.getFullYear() === m.year && d.getMonth() === m.month;
    });
    const receitas = txs.filter(t => t.tipo === "RECEITA").reduce((s, t) => s + Number(t.valor), 0);
    const despesas = txs.filter(t => t.tipo === "DESPESA").reduce((s, t) => s + Number(t.valor), 0);
    
    barData.push({
      value: receitas,
      frontColor: Colors.income,
      label: m.label,
      spacing: 4,
      labelWidth: 30,
      labelTextStyle: {color: Colors.textMuted, fontSize: 10}
    });
    barData.push({
      value: despesas,
      frontColor: Colors.expense,
      spacing: 16
    });
  });

  return (
    <View>
      <Text style={s.chartSubtitle}>Últimos 6 meses</Text>
      <View style={{ marginTop: 20 }}>
        <BarChart
          data={barData}
          barWidth={12}
          spacing={16}
          roundedTop
          roundedBottom
          hideRules
          xAxisThickness={0}
          yAxisThickness={0}
          yAxisTextStyle={{color: Colors.textMuted, fontSize: 10}}
          noOfSections={4}
          maxValue={Math.max(...barData.map(d => d.value), 100)}
          isAnimated
        />
      </View>
      <View style={{ flexDirection: "row", gap: 16, marginTop: 16, justifyContent: 'center' }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: Colors.income }} />
          <Text style={{ fontSize: FontSize.xs, color: Colors.textMuted }}>Receitas</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: Colors.expense }} />
          <Text style={{ fontSize: FontSize.xs, color: Colors.textMuted }}>Despesas</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Line Chart (dias do mês) ─────────────────────────────────────────────────
function DailyLineChart({ transactions, year, month }: { transactions: Transaction[]; year: number; month: number }) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daily = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return transactions.filter(t => t.data_transacao === dateStr && t.tipo === "DESPESA")
      .reduce((s, t) => s + Number(t.valor), 0);
  });

  if (daily.every(v => v === 0)) {
    return (
      <View style={{ alignItems: "center", paddingVertical: 24 }}>
        <Text style={{ color: Colors.textMuted, fontSize: FontSize.sm }}>Sem despesas no período</Text>
      </View>
    );
  }

  const lineData = daily.map((val, i) => ({
    value: val,
    label: (i === 0 || i === Math.floor(daysInMonth / 2) || i === daysInMonth - 1) ? String(i + 1) : "",
    dataPointText: val > 0 ? String(val) : ""
  }));

  return (
    <View>
      <Text style={s.chartSubtitle}>Gastos por dia — {MONTHS_PT[month]}</Text>
      <View style={{ marginTop: 20 }}>
        <LineChart
          areaChart
          data={lineData}
          hideDataPoints
          startFillColor={Colors.primary}
          startOpacity={0.3}
          endFillColor={Colors.primary}
          endOpacity={0.02}
          color={Colors.primary}
          thickness={3}
          xAxisThickness={0}
          yAxisThickness={0}
          yAxisTextStyle={{color: Colors.textMuted, fontSize: 10}}
          xAxisLabelTextStyle={{color: Colors.textMuted, fontSize: 10}}
          noOfSections={4}
          maxValue={Math.max(...daily, 100)}
          isAnimated
          curved
        />
      </View>
    </View>
  );
}

// ─── Horizontal Bar Ranking ───────────────────────────────────────────────────
function CategoryRanking({ data }: { data: CategoryData[] }) {
  const animated = useRef(data.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.stagger(60, animated.map(a => Animated.timing(a, { toValue: 1, duration: 500, useNativeDriver: false }))).start();
  }, [data.length]);

  if (data.length === 0) {
    return <Text style={{ color: Colors.textMuted, fontSize: FontSize.sm }}>Sem dados</Text>;
  }

  return (
    <View style={{ gap: 14 }}>
      {data.slice(0, 7).map((cat, i) => (
        <View key={cat.nome}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: cat.cor }} />
              <Text style={{ fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: FontWeight.medium }}>{cat.nome}</Text>
            </View>
            <Text style={{ fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.semibold }}>
              {formatCurrency(cat.total)} <Text style={{ color: Colors.textMuted, fontWeight: FontWeight.regular }}>({cat.percentual.toFixed(0)}%)</Text>
            </Text>
          </View>
          <View style={{ height: 8, backgroundColor: Colors.borderLight, borderRadius: 4, overflow: "hidden" }}>
            <Animated.View style={{
              height: 8, borderRadius: 4, backgroundColor: cat.cor,
              width: animated[i]?.interpolate({ inputRange: [0, 1], outputRange: ["0%", `${cat.percentual}%`] }) ?? `${cat.percentual}%`,
            }} />
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── Insight Cards ────────────────────────────────────────────────────────────
function InsightCards({ transactions, year, month }: { transactions: Transaction[]; year: number; month: number }) {
  const curTxs = transactions.filter(t => {
    const d = new Date(`${t.data_transacao}T12:00:00`);
    return d.getFullYear() === year && d.getMonth() === month;
  });
  const prevDate = new Date(year, month - 1, 1);
  const prevTxs = transactions.filter(t => {
    const d = new Date(`${t.data_transacao}T12:00:00`);
    return d.getFullYear() === prevDate.getFullYear() && d.getMonth() === prevDate.getMonth();
  });

  const curDespesas = curTxs.filter(t => t.tipo === "DESPESA").reduce((s, t) => s + Number(t.valor), 0);
  const prevDespesas = prevTxs.filter(t => t.tipo === "DESPESA").reduce((s, t) => s + Number(t.valor), 0);
  const curReceitas = curTxs.filter(t => t.tipo === "RECEITA").reduce((s, t) => s + Number(t.valor), 0);
  const saldo = curReceitas - curDespesas;

  const catMap: Record<string, number> = {};
  curTxs.filter(t => t.tipo === "DESPESA").forEach(t => {
    const c = t.categoria ?? "Outros";
    catMap[c] = (catMap[c] ?? 0) + Number(t.valor);
  });
  const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];

  const dayMap: Record<number, number> = {};
  curTxs.filter(t => t.tipo === "DESPESA").forEach(t => {
    const dow = new Date(`${t.data_transacao}T12:00:00`).getDay();
    dayMap[dow] = (dayMap[dow] ?? 0) + Number(t.valor);
  });
  const DAYS = ["Domingos", "Segundas", "Terças", "Quartas", "Quintas", "Sextas", "Sábados"];
  const topDay = Object.entries(dayMap).sort((a, b) => Number(b[1]) - Number(a[1]))[0];

  const pctChange = prevDespesas > 0 ? ((curDespesas - prevDespesas) / prevDespesas) * 100 : null;

  const insights: { icon: string; color: string; bg: string; text: string }[] = [];

  if (pctChange !== null) {
    const up = pctChange > 0;
    insights.push({
      icon: up ? "trending-up" : "trending-down",
      color: up ? Colors.expense : Colors.income,
      bg: up ? Colors.expenseLight : Colors.incomeLight,
      text: up
        ? `Você gastou ${Math.abs(pctChange).toFixed(0)}% a mais que ${MONTHS_PT[prevDate.getMonth()]}`
        : `Você gastou ${Math.abs(pctChange).toFixed(0)}% a menos que ${MONTHS_PT[prevDate.getMonth()]} 🎉`,
    });
  }

  if (topCat) {
    insights.push({
      icon: "award", color: Colors.warning, bg: Colors.warningLight,
      text: `Sua maior categoria este mês foi ${topCat[0]} (${formatCurrency(topCat[1])})`,
    });
  }

  if (topDay) {
    insights.push({
      icon: "calendar", color: Colors.primary, bg: Colors.primaryLight,
      text: `${DAYS[Number(topDay[0])]} são seus dias com mais gastos`,
    });
  }

  insights.push({
    icon: saldo >= 0 ? "check-circle" : "alert-circle",
    color: saldo >= 0 ? Colors.income : Colors.expense,
    bg: saldo >= 0 ? Colors.incomeLight : Colors.expenseLight,
    text: saldo >= 0
      ? `Saldo positivo de ${formatCurrency(saldo)} — continue assim! 💚`
      : `Saldo negativo de ${formatCurrency(Math.abs(saldo))} — atenção aos gastos`,
  });

  return (
    <View style={{ gap: 10 }}>
      {insights.map((ins, i) => (
        <View key={i} style={[s.insightCard, { borderLeftColor: ins.color }]}>
          <View style={[s.insightIcon, { backgroundColor: ins.bg }]}>
            <Feather name={ins.icon as any} size={18} color={ins.color} />
          </View>
          <Text style={s.insightText}>{ins.text}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function StatisticsScreen() {
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
      const personalData = data.filter(t => t.id_carteira === user.id_carteira_pessoal);
      setTransactions(personalData);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
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

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} />} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Estatísticas</Text>
        <View style={s.monthSelector}>
          <Pressable style={s.monthArrow} onPress={prevMonth}>
            <Feather name="chevron-left" size={20} color={Colors.textPrimary} />
          </Pressable>
          <Text style={s.monthLabel}>{MONTHS_FULL[selectedMonth]} {selectedYear}</Text>
          <Pressable style={[s.monthArrow, isCurrentMonth && s.monthArrowDisabled]} onPress={nextMonth}>
            <Feather name="chevron-right" size={20} color={isCurrentMonth ? Colors.textMuted : Colors.textPrimary} />
          </Pressable>
        </View>
      </View>

      {/* Resumo: 3 cards */}
      <View style={s.summaryRow}>
        <View style={[s.summaryCard, { borderTopColor: Colors.expense }]}>
          <Feather name="arrow-down-circle" size={18} color={Colors.expense} />
          <Text style={s.summaryLabel}>Despesas</Text>
          <Text style={[s.summaryValue, { color: Colors.expense }]}>{formatCurrencyShort(totalDespesas)}</Text>
        </View>
        <View style={[s.summaryCard, { borderTopColor: Colors.income }]}>
          <Feather name="arrow-up-circle" size={18} color={Colors.income} />
          <Text style={s.summaryLabel}>Receitas</Text>
          <Text style={[s.summaryValue, { color: Colors.income }]}>{formatCurrencyShort(totalReceitas)}</Text>
        </View>
        <View style={[s.summaryCard, { borderTopColor: saldo >= 0 ? Colors.income : Colors.expense }]}>
          <Feather name="activity" size={18} color={saldo >= 0 ? Colors.income : Colors.expense} />
          <Text style={s.summaryLabel}>Saldo</Text>
          <Text style={[s.summaryValue, { color: saldo >= 0 ? Colors.income : Colors.expense }]}>{formatCurrencyShort(saldo)}</Text>
        </View>
      </View>

      {/* Tab: Despesas / Receitas */}
      <View style={s.tabRow}>
        <Pressable style={[s.tab, activeTab === "despesas" && s.tabActive]} onPress={() => setActiveTab("despesas")}>
          <Text style={[s.tabText, activeTab === "despesas" && s.tabTextActive]}>Despesas</Text>
        </Pressable>
        <Pressable style={[s.tab, activeTab === "receitas" && s.tabActive]} onPress={() => setActiveTab("receitas")}>
          <Text style={[s.tabText, activeTab === "receitas" && s.tabTextActive]}>Receitas</Text>
        </Pressable>
      </View>

      {/* Gráfico 1: Donut */}
      <View style={s.card}>
        <Text style={s.cardTitle}>🍩 {activeTab === "despesas" ? "Gastos" : "Receitas"} por Categoria</Text>
        <DonutChart
          data={categoryData}
          total={activeTab === "despesas" ? totalDespesas : totalReceitas}
          label={activeTab === "despesas" ? "Despesas" : "Receitas"}
        />
        {categoryData.length > 0 && (
          <View style={{ marginTop: 16, gap: 8 }}>
            {categoryData.slice(0, 5).map(cat => (
              <View key={cat.nome} style={s.legendRow}>
                <View style={[s.legendDot, { backgroundColor: cat.cor }]} />
                <Text style={s.legendName} numberOfLines={1}>{cat.nome}</Text>
                <Text style={s.legendPct}>{cat.percentual.toFixed(1)}%</Text>
                <Text style={s.legendVal}>{formatCurrency(cat.total)}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Gráfico 2: Ranking Horizontal */}
      <View style={s.card}>
        <Text style={s.cardTitle}>🏆 Ranking de Categorias</Text>
        <CategoryRanking data={categoryData} />
      </View>

      {/* Gráfico 3: Barras Mensais */}
      <View style={s.card}>
        <Text style={s.cardTitle}>📊 Comparativo Mensal</Text>
        <MonthlyBarChart transactions={transactions} />
      </View>

      {/* Gráfico 4: Linha Diária */}
      <View style={s.card}>
        <Text style={s.cardTitle}>📈 Tendência Diária</Text>
        <DailyLineChart transactions={monthTxs} year={selectedYear} month={selectedMonth} />
      </View>

      {/* Insights */}
      <View style={s.card}>
        <Text style={s.cardTitle}>💡 Insights</Text>
        <InsightCards transactions={transactions} year={selectedYear} month={selectedMonth} />
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.xxl, paddingTop: 50, paddingBottom: 120 },
  header: { marginBottom: Spacing.xl },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: 12 },
  monthSelector: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, borderWidth: 1, borderColor: Colors.border, overflow: "hidden" },
  monthArrow: { padding: 10 },
  monthArrowDisabled: { opacity: 0.3 },
  monthLabel: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary, paddingHorizontal: 4, minWidth: 150, textAlign: "center" },
  summaryRow: { flexDirection: "row", gap: Spacing.md, marginBottom: Spacing.xl },
  summaryCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: 12, alignItems: "center", borderTopWidth: 3, gap: 4, ...Shadow.sm },
  summaryLabel: { fontSize: 10, color: Colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5 },
  summaryValue: { fontSize: FontSize.md, fontWeight: FontWeight.bold },
  tabRow: { flexDirection: "row", backgroundColor: Colors.borderLight, borderRadius: BorderRadius.xl, padding: 3, marginBottom: Spacing.xl },
  tab: { flex: 1, paddingVertical: 10, borderRadius: BorderRadius.lg, alignItems: "center" },
  tabActive: { backgroundColor: Colors.surface, ...Shadow.sm },
  tabText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textMuted },
  tabTextActive: { color: Colors.primary },
  card: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.xl, marginBottom: Spacing.xl, ...Shadow.sm },
  cardTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.lg },
  chartSubtitle: { fontSize: FontSize.sm, color: Colors.textMuted, marginBottom: 4 },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendName: { flex: 1, fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: FontWeight.medium },
  legendPct: { fontSize: FontSize.xs, color: Colors.textMuted, width: 40, textAlign: "right" },
  legendVal: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary, width: 90, textAlign: "right" },
  insightCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: Colors.background, borderRadius: BorderRadius.lg, padding: 14, borderLeftWidth: 4 },
  insightIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  insightText: { flex: 1, fontSize: FontSize.sm, color: Colors.textPrimary, lineHeight: 20 },
});