import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  Pressable,
  StatusBar,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@/src/context/AuthContext";
import { getTransactionsByUser } from "@/src/services/transactions";
import type { Transaction } from "@/src/types/api";
import { Colors, BorderRadius, FontSize, FontWeight, Spacing, Shadow } from "@/constants/theme";
import { Card, Chip } from "@/components/ui";
import { formatCurrency, getCurrentMonthYear } from "@/utils/formatters";
import { CATEGORIAS } from "@/constants/categories";

const { width } = Dimensions.get("window");

const CATEGORY_COLORS = [
  "#059669", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", 
  "#EC4899", "#14B8A6", "#F97316", "#6366F1", "#84CC16"
];

interface CategoryData {
  nome: string;
  total: number;
  percentual: number;
  cor: string;
  icon: string;
}

export default function StatisticsScreen() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"despesas" | "receitas">("despesas");

  async function loadData(isPullToRefresh = false) {
    if (!user) return;
    try {
      if (isPullToRefresh) setRefreshing(true);
      else setLoading(true);

      const data = await getTransactionsByUser(user.id_usuario);
      setTransactions(data);
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

  const totalDespesas = useMemo(
    () => transactions.filter((t) => t.tipo === "DESPESA").reduce((a, t) => a + Number(t.valor), 0),
    [transactions]
  );

  const totalReceitas = useMemo(
    () => transactions.filter((t) => t.tipo === "RECEITA").reduce((a, t) => a + Number(t.valor), 0),
    [transactions]
  );

  const categoryData = useMemo<CategoryData[]>(() => {
    const filtered = transactions.filter((t) => 
      activeTab === "despesas" ? t.tipo === "DESPESA" : t.tipo === "RECEITA"
    );
    const totalGeral = filtered.reduce((sum, t) => sum + Number(t.valor), 0);

    if (totalGeral === 0) return [];

    const grouped: Record<string, number> = {};
    for (const t of filtered) {
      const cat = t.categoria ?? "Outros";
      grouped[cat] = (grouped[cat] ?? 0) + Number(t.valor);
    }

    return Object.entries(grouped)
      .map(([nome, total], index) => {
        const catInfo = CATEGORIAS.find((c) => c.nome === nome);
        return {
          nome,
          total,
          percentual: (total / totalGeral) * 100,
          cor: catInfo?.cor || CATEGORY_COLORS[index % CATEGORY_COLORS.length],
          icon: catInfo?.icon || "tag",
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [transactions, activeTab]);

  // Calcular dados do gráfico de pizza
  const pieData = useMemo(() => {
    let startAngle = 0;
    return categoryData.map((cat) => {
      const sweepAngle = (cat.percentual / 100) * 360;
      const data = {
        ...cat,
        startAngle,
        sweepAngle,
      };
      startAngle += sweepAngle;
      return data;
    });
  }, [categoryData]);

  const totalAtivo = activeTab === "despesas" ? totalDespesas : totalReceitas;

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
        <Text style={styles.title}>Estatísticas</Text>
        <Text style={styles.subtitle}>{getCurrentMonthYear()}</Text>
      </View>

      {/* Resumo Cards */}
      <View style={styles.summaryCards}>
        <Pressable 
          style={[
            styles.summaryCard, 
            activeTab === "despesas" && styles.summaryCardActive
          ]}
          onPress={() => setActiveTab("despesas")}
        >
          <View style={[styles.summaryIcon, { backgroundColor: Colors.expenseLight }]}>
            <Feather name="arrow-down" size={20} color={Colors.expense} />
          </View>
          <Text style={styles.summaryLabel}>Despesas</Text>
          <Text style={[styles.summaryValue, { color: Colors.expense }]}>
            {formatCurrency(totalDespesas)}
          </Text>
        </Pressable>

        <Pressable 
          style={[
            styles.summaryCard, 
            activeTab === "receitas" && styles.summaryCardActive
          ]}
          onPress={() => setActiveTab("receitas")}
        >
          <View style={[styles.summaryIcon, { backgroundColor: Colors.incomeLight }]}>
            <Feather name="arrow-up" size={20} color={Colors.income} />
          </View>
          <Text style={styles.summaryLabel}>Receitas</Text>
          <Text style={[styles.summaryValue, { color: Colors.income }]}>
            {formatCurrency(totalReceitas)}
          </Text>
        </Pressable>
      </View>

      {/* Gráfico de Pizza */}
      <Card style={styles.chartCard}>
        <Text style={styles.chartTitle}>
          {activeTab === "despesas" ? "Gastos por Categoria" : "Receitas por Categoria"}
        </Text>

        {categoryData.length === 0 ? (
          <View style={styles.emptyChart}>
            <Feather name="pie-chart" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>
              Nenhuma {activeTab === "despesas" ? "despesa" : "receita"} registrada
            </Text>
          </View>
        ) : (
          <>
            {/* Pizza Chart Visual */}
            <View style={styles.chartContainer}>
              <View style={styles.pieChart}>
                {pieData.map((item, index) => {
                  // Criar segmentos com Views rotacionadas (simplificado)
                  const rotation = item.startAngle - 90;
                  return (
                    <View
                      key={item.nome}
                      style={[
                        styles.pieSegment,
                        {
                          transform: [{ rotate: `${rotation}deg` }],
                          borderTopColor: item.cor,
                          borderRightColor: item.percentual > 50 ? item.cor : "transparent",
                        },
                      ]}
                    />
                  );
                })}
                {/* Centro */}
                <View style={styles.pieCenter}>
                  <Text style={styles.pieCenterLabel}>Total</Text>
                  <Text style={styles.pieCenterValue}>{formatCurrency(totalAtivo)}</Text>
                </View>
              </View>
            </View>

            {/* Legenda */}
            <View style={styles.legend}>
              {categoryData.slice(0, 6).map((item) => (
                <View key={item.nome} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: item.cor }]} />
                  <View style={styles.legendInfo}>
                    <Text style={styles.legendName} numberOfLines={1}>{item.nome}</Text>
                    <Text style={styles.legendPercent}>{item.percentual.toFixed(1)}%</Text>
                  </View>
                  <Text style={styles.legendValue}>{formatCurrency(item.total)}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </Card>

      {/* Categorias Grid */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Categorias</Text>
        <View style={styles.categoriesGrid}>
          {categoryData.slice(0, 6).map((cat) => (
            <View key={cat.nome} style={styles.categoryCard}>
              <View style={[styles.categoryIcon, { backgroundColor: cat.cor + "20" }]}>
                <Feather name={cat.icon as any} size={24} color={cat.cor} />
              </View>
              <Text style={styles.categoryName} numberOfLines={1}>{cat.nome}</Text>
              <Text style={styles.categoryValue}>{formatCurrency(cat.total)}</Text>
              <Text style={styles.categoryPercent}>{cat.percentual.toFixed(0)}%</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Maior gasto */}
      {categoryData.length > 0 && (
        <Card style={styles.highlightCard}>
          <View style={styles.highlightIcon}>
            <Feather name="award" size={24} color={Colors.warning} />
          </View>
          <View style={styles.highlightContent}>
            <Text style={styles.highlightLabel}>
              {activeTab === "despesas" ? "Maior Gasto" : "Maior Receita"}
            </Text>
            <Text style={styles.highlightCategory}>{categoryData[0].nome}</Text>
            <Text style={[styles.highlightValue, { color: categoryData[0].cor }]}>
              {formatCurrency(categoryData[0].total)} ({categoryData[0].percentual.toFixed(0)}%)
            </Text>
          </View>
        </Card>
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
    marginBottom: Spacing.xl,
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
  summaryCards: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  summaryCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + "08",
  },
  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  summaryLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  summaryValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  chartCard: {
    marginBottom: Spacing.xl,
  },
  chartTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  emptyChart: {
    alignItems: "center",
    paddingVertical: Spacing.xxl,
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  chartContainer: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  pieChart: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  pieSegment: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 30,
    borderColor: "transparent",
  },
  pieCenter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...Shadow.sm,
  },
  pieCenterLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  pieCenterValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  legend: {
    gap: Spacing.md,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  legendName: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: FontWeight.medium,
  },
  legendPercent: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  legendValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  categoryCard: {
    width: (width - Spacing.xl * 2 - Spacing.md * 2) / 3,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  categoryName: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  categoryValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  categoryPercent: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  highlightCard: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  highlightIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.warningLight,
    alignItems: "center",
    justifyContent: "center",
  },
  highlightContent: {
    flex: 1,
  },
  highlightLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  highlightCategory: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  highlightValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
});