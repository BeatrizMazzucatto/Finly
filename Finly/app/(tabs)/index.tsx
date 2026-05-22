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
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useAuth } from "@/src/context/AuthContext";
import { getTransactionsByUser } from "@/src/services/transactions";
import type { Transaction } from "@/src/types/api";
import { Colors, BorderRadius, FontSize, FontWeight, Spacing, Shadow } from "@/constants/theme";
import { formatCurrency } from "@/utils/formatters";
import { getCategoryColor, getCategoryIcon } from "@/constants/categories";
import { TransactionItem } from "@/components/ui/TransactionItem";

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

function DonutChart({
  total,
  categoryTotals,
  walletMode,
}: {
  total: number;
  categoryTotals: [string, number][];
  walletMode: WalletMode;
}) {
  const size = 200;
  const stroke = 25;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  // Paleta conjunta: #9333EA, #A855F7, #C084FC, #E9D5FF
  const jointColors = ["#9333EA", "#A855F7", "#C084FC", "#E9D5FF"];
  const personalColors = [
    Colors.categories.alimentacao,
    Colors.categories.transporte,
    Colors.categories.saude,
    Colors.categories.lazer,
  ];

  const colors = walletMode === "joint" ? jointColors : personalColors;

  let segments: number[] = [];
  if (total > 0 && categoryTotals.length > 0) {
    segments = categoryTotals.map(([_, val]) => val / total);
    const sum = segments.reduce((a, b) => a + b, 0);
    if (sum < 1.0) {
      segments.push(1.0 - sum);
    }
  } else {
    segments = [1.0];
  }

  let offset = 0;

  return (
    <View style={styles.chartRing}>
      <Svg width={size} height={size}>
        {total === 0 ? (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={Colors.border}
            strokeWidth={stroke}
            fill="transparent"
          />
        ) : (
          segments.map((value, index) => {
            const dash = circumference * value;
            const strokeColor = colors[index % colors.length] || Colors.border;
            const circle = (
              <Circle
                key={index}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={strokeColor}
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
          })
        )}
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

  useEffect(() => {
    AsyncStorage.getItem("finly_id_carteira").then((val) => {
      if (val) {
        setWalletMode(Number(val) === 3 ? "joint" : "personal");
      }
    });
  }, []);

  const handleWalletModeChange = async (mode: WalletMode) => {
    setWalletMode(mode);
    await AsyncStorage.setItem("finly_id_carteira", mode === "joint" ? "3" : "1");
  };

  const filteredTransactions = useMemo(() => {
    if (walletMode === "personal") {
      return transactions.filter((t) => t.id_carteira !== 3);
    } else {
      return transactions.filter((t) => t.id_carteira === 3);
    }
  }, [transactions, walletMode]);

  const despesas = useMemo(
    () => filteredTransactions.filter((t) => t.tipo === "DESPESA"),
    [filteredTransactions]
  );
  const receitas = useMemo(
    () => filteredTransactions.filter((t) => t.tipo === "RECEITA"),
    [filteredTransactions]
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
      [...filteredTransactions].sort(
        (a, b) => new Date(b.data_transacao).getTime() - new Date(a.data_transacao).getTime()
      ).slice(0, 4),
    [filteredTransactions]
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
            onPress={() => handleWalletModeChange("personal")}
          >
            <Text style={[styles.toggleText, walletMode === "personal" && styles.toggleTextActivePersonal]}>
              Minha Carteira
            </Text>
          </Pressable>
          <Pressable
            style={[styles.toggleButton, walletMode === "joint" && styles.toggleButtonActiveJoint]}
            onPress={() => handleWalletModeChange("joint")}
          >
            <Text style={[styles.toggleText, walletMode === "joint" && styles.toggleTextActiveJoint]}>
              Carteira Conjunta
            </Text>
          </Pressable>
        </View>

        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>
            {walletMode === "joint" ? "Saldo Conjunto" : "Saldo Pessoal"}
          </Text>
          <Text style={styles.balanceValue}>
            <Text style={styles.balanceCurrency}>R$ </Text>
            {formatCurrency(saldo).replace("R$", "").trim()}
          </Text>
        </View>

        <DonutChart total={totalDespesas} categoryTotals={categoryTotals} walletMode={walletMode} />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Gastos por Categoria</Text>
          <Pressable onPress={() => router.push("/(tabs)/history")}>
            <Text style={styles.sectionLink}>Ver tudo</Text>
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {categoryTotals.length === 0 ? (
            <View style={[styles.categoryCard, { backgroundColor: walletMode === "joint" ? Colors.jointLight : Colors.categories.outros }]}>
              <View style={[styles.categoryIcon, { backgroundColor: Colors.surface }]}>
                <Feather name="tag" size={18} color={walletMode === "joint" ? Colors.jointPrimary : Colors.categoryIcons.outros} />
              </View>
              <Text style={styles.categoryName}>Sem gastos</Text>
              <Text style={styles.categoryValue}>R$ 0,00</Text>
            </View>
          ) : (
            categoryTotals.map(([nome, total], index) => {
              const JOINT_CATEGORY_PALETTE = [
                { bg: "#E9D5FF", icon: "#9333EA" },
                { bg: "#F3E8FF", icon: "#9333EA" },
                { bg: "#D8B4FE", icon: "#9333EA" },
                { bg: "#FAF5FF", icon: "#9333EA" },
              ];
              const palette = walletMode === "joint"
                ? JOINT_CATEGORY_PALETTE[index % JOINT_CATEGORY_PALETTE.length]
                : CATEGORY_PALETTE[index % CATEGORY_PALETTE.length];
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
          recentTransactions.map((item) => (
            <TransactionItem
              key={item.id_transacao}
              id={item.id_transacao}
              id_carteira={item.id_carteira}
              usuario_nome={item.usuario_nome}
              titulo={item.titulo}
              valor={Number(item.valor)}
              tipo={item.tipo}
              categoria={item.categoria ?? "Outros"}
              data={item.data_transacao}
              style={{ marginBottom: Spacing.md }}
            />
          ))
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
    fontSize: 12,
    fontWeight: FontWeight.semibold,
  },
  headerName: {
    fontSize: 18,
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
    fontSize: 14,
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
    fontSize: 14,
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
    fontSize: 15,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  categoryValue: {
    fontSize: 12,
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
