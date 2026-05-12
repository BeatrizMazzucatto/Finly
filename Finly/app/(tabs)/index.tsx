import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  StatusBar,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";

import { useAuth } from "@/src/context/AuthContext";
import { getTransactionsByUser } from "@/src/services/transactions";
import type { Transaction } from "@/src/types/api";
import { Colors, BorderRadius, FontSize, FontWeight, Spacing, Shadow } from "@/constants/theme";
import { formatCurrency } from "@/utils/formatters";
import { getCategoryColor, getCategoryIcon } from "@/constants/categories";

type WalletMode = "personal" | "joint";

const CATEGORY_PALETTE = [
  { bg: Colors.categories.alimentacao, icon: Colors.categoryIcons.alimentacao },
  { bg: Colors.categories.transporte, icon: Colors.categoryIcons.transporte },
  { bg: Colors.categories.saude, icon: Colors.categoryIcons.saude },
  { bg: Colors.categories.lazer, icon: Colors.categoryIcons.lazer },
];

function formatTime(dateStr: string) {
  const date = new Date(`${dateStr}T12:00:00`);
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function DonutChart({ total }: { total: number }) {
  const size = 200;
  const stroke = 25;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const segments = [0.4, 0.3, 0.2, 0.1];
  const colors = [
    Colors.categories.alimentacao,
    Colors.categories.transporte,
    Colors.categories.saude,
    Colors.categories.lazer,
  ];

  let offset = 0;

  return (
    <View style={styles.chartRing}>
      <Svg width={size} height={size}>
        {segments.map((value, index) => {
          const dash = circumference * value;
          const circle = (
            <Circle
              key={index}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={colors[index]}
              strokeWidth={stroke}
              fill="transparent"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              rotation={-90}
              origin={`${size / 2}, ${size / 2}`}
            />
          );
          offset += dash;
          return circle;
        })}
      </Svg>
      <View style={styles.chartCenter}>
        <Text style={styles.chartCenterLabel}>Despesas</Text>
        <Text style={styles.chartCenterValue}>{formatCurrency(total)}</Text>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletMode, setWalletMode] = useState<WalletMode>("personal");

  const despesas = useMemo(
    () => transactions.filter((t) => t.tipo === "DESPESA"),
    [transactions]
  );
  const receitas = useMemo(
    () => transactions.filter((t) => t.tipo === "RECEITA"),
    [transactions]
  );
  const totalDespesas = useMemo(
    () => despesas.reduce((sum, item) => sum + Number(item.valor), 0),
    [despesas]
  );
  const totalReceitas = useMemo(
    () => receitas.reduce((sum, item) => sum + Number(item.valor), 0),
    [receitas]
  );
  const saldo = totalReceitas - totalDespesas;

  const categoryTotals = useMemo(() => {
    const totals = new Map<string, number>();
    despesas.forEach((item) => {
      const key = item.categoria ?? "Outros";
      totals.set(key, (totals.get(key) ?? 0) + Number(item.valor));
    });
    return Array.from(totals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
  }, [despesas]);

  const recentTransactions = useMemo(
    () =>
      [...transactions].sort(
        (a, b) => new Date(b.data_transacao).getTime() - new Date(a.data_transacao).getTime()
      ).slice(0, 4),
    [transactions]
  );

  async function loadData(isPullToRefresh = false) {
    if (!user) return;
    try {
      setError(null);
      if (isPullToRefresh) setRefreshing(true);
      else setLoading(true);
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
    loadData();
  }, [user?.id_usuario]);

  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.nome ?? "User")}&background=4F46E5&color=fff`;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          <View>
            <Text style={styles.headerGreeting}>Olá, de novo!</Text>
            <Text style={styles.headerName}>{user?.nome ?? "Usuário"}</Text>
          </View>
        </View>
        <Pressable style={styles.bellButton}>
          <Feather name="bell" size={18} color={Colors.textPrimary} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.walletToggle}>
          <Pressable
            style={[styles.toggleButton, walletMode === "personal" && styles.toggleButtonActivePersonal]}
            onPress={() => setWalletMode("personal")}
          >
            <Text style={[styles.toggleText, walletMode === "personal" && styles.toggleTextActivePersonal]}>
              Minha Carteira
            </Text>
          </Pressable>
          <Pressable
            style={[styles.toggleButton, walletMode === "joint" && styles.toggleButtonActiveJoint]}
            onPress={() => setWalletMode("joint")}
          >
            <Text style={[styles.toggleText, walletMode === "joint" && styles.toggleTextActiveJoint]}>
              Carteira Conjunta
            </Text>
          </Pressable>
        </View>

        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>Saldo Disponível</Text>
          <Text style={styles.balanceValue}>{formatCurrency(saldo)}</Text>
        </View>

        <DonutChart total={totalDespesas} />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Gastos por Categoria</Text>
          <Pressable onPress={() => router.push("/(tabs)/history")}>
            <Text style={styles.sectionLink}>Ver tudo</Text>
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {categoryTotals.length === 0 ? (
            <View style={[styles.categoryCard, { backgroundColor: Colors.categories.outros }]}>
              <View style={[styles.categoryIcon, { backgroundColor: Colors.surface }]}>
                <Feather name="tag" size={18} color={Colors.categoryIcons.outros} />
              </View>
              <Text style={styles.categoryName}>Sem gastos</Text>
              <Text style={styles.categoryValue}>R$ 0,00</Text>
            </View>
          ) : (
            categoryTotals.map(([nome, total], index) => {
              const palette = CATEGORY_PALETTE[index % CATEGORY_PALETTE.length];
              const icon = getCategoryIcon(nome);
              return (
                <View key={nome} style={[styles.categoryCard, { backgroundColor: palette.bg }]}>
                  <View style={[styles.categoryIcon, { backgroundColor: Colors.surface }]}>
                    <Feather name={icon} size={18} color={palette.icon} />
                  </View>
                  <Text style={styles.categoryName}>{nome}</Text>
                  <Text style={styles.categoryValue}>{formatCurrency(total)}</Text>
                </View>
              );
            })
          )}
        </ScrollView>

        <View style={[styles.sectionHeader, { marginTop: Spacing.xxl }]}>
          <Text style={styles.sectionTitle}>Transações Recentes</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: Spacing.xxl }} />
        ) : error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : recentTransactions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Nenhuma transação recente.</Text>
          </View>
        ) : (
          recentTransactions.map((item) => {
            const isExpense = item.tipo === "DESPESA";
            const icon = getCategoryIcon(item.categoria ?? "Outros");
            const bg = getCategoryColor(item.categoria ?? "Outros");
            return (
              <View key={item.id_transacao} style={styles.txItem}>
                <View style={[styles.txIcon, { backgroundColor: bg }]}>
                  <Feather name={icon} size={20} color={Colors.textPrimary} />
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txTitle}>{item.titulo}</Text>
                  <Text style={styles.txMeta}>
                    {item.categoria ?? "Sem categoria"} • {formatTime(item.data_transacao)}
                  </Text>
                </View>
                <Text style={[styles.txValue, !isExpense && styles.txValuePositive]}>
                  {isExpense ? "- " : "+ "}
                  {formatCurrency(Number(item.valor))}
                </Text>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.xl,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  headerGreeting: {
    color: Colors.textGray,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  headerName: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xxl,
    paddingBottom: 120,
  },
  walletToggle: {
    flexDirection: "row",
    backgroundColor: "#E2E8F0",
    borderRadius: BorderRadius.xl,
    padding: 4,
    marginBottom: Spacing.xxl,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
  },
  toggleButtonActivePersonal: {
    backgroundColor: Colors.surface,
    ...Shadow.sm,
  },
  toggleButtonActiveJoint: {
    backgroundColor: Colors.surface,
    ...Shadow.sm,
  },
  toggleText: {
    color: Colors.textGray,
    fontWeight: FontWeight.semibold,
    fontSize: FontSize.sm,
  },
  toggleTextActivePersonal: {
    color: Colors.primary,
  },
  toggleTextActiveJoint: {
    color: Colors.jointPrimary,
  },
  balanceContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  balanceLabel: {
    color: Colors.textGray,
    fontWeight: FontWeight.medium,
    fontSize: FontSize.sm,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  balanceValue: {
    marginTop: 5,
    fontSize: 42,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
  },
  balanceCurrency: {
    fontSize: 24,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
  },
  chartRing: {
    width: 200,
    height: 200,
    alignSelf: "center",
    marginBottom: 30,
    alignItems: "center",
    justifyContent: "center",
    ...Shadow.md,
  },
  chartCenter: {
    position: "absolute",
    alignItems: "center",
  },
  chartCenterLabel: {
    color: Colors.textGray,
    fontWeight: FontWeight.semibold,
    fontSize: FontSize.xs,
  },
  chartCenterValue: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  sectionLink: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: FontWeight.medium,
  },
  categoryRow: {
    gap: 14,
    paddingBottom: 10,
  },
  categoryCard: {
    minWidth: 140,
    padding: 18,
    borderRadius: BorderRadius.xl,
    gap: Spacing.md,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryName: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  categoryValue: {
    fontSize: FontSize.xs,
    color: Colors.textGray,
  },
  txItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: 14,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  txIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  txInfo: {
    flex: 1,
  },
  txTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  txMeta: {
    color: Colors.textGray,
    fontSize: FontSize.sm,
  },
  txValue: {
    fontWeight: FontWeight.bold,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    marginLeft: 10,
  },
  txValuePositive: {
    color: Colors.success,
  },
  errorCard: {
    backgroundColor: Colors.errorLight,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  errorText: {
    color: Colors.error,
    textAlign: "center",
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: "center",
    ...Shadow.sm,
  },
  emptyText: {
    color: Colors.textGray,
  },
});
