import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from "react-native";
import type { Transaction } from "@/src/types/api";

// ─── Paleta de cores para categorias ────────────────────────────────────────
const CATEGORY_COLORS = [
  "#2563EB", // azul
  "#7C3AED", // roxo
  "#DC2626", // vermelho
  "#059669", // verde
  "#D97706", // âmbar
  "#0891B2", // ciano
  "#DB2777", // rosa
  "#65A30D", // lima
  "#9333EA", // violeta
  "#EA580C", // laranja
];

interface SpendingByCategoryChartProps {
  transactions: Transaction[];
}

interface CategoryData {
  nome: string;
  total: number;
  percentual: number;
  cor: string;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

// ─── Gráfico de barras SVG simples usando View ───────────────────────────────
function BarChart({ data }: { data: CategoryData[] }) {
  const maxValue = Math.max(...data.map((d) => d.total), 1);
  const BAR_MAX_WIDTH = Dimensions.get("window").width - 80;

  return (
    <View style={styles.barChartContainer}>
      {data.map((item, index) => {
        const barWidth = (item.total / maxValue) * BAR_MAX_WIDTH;
        return (
          <View key={item.nome} style={styles.barRow}>
            <Text style={styles.barLabel} numberOfLines={1}>
              {item.nome}
            </Text>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: barWidth,
                    backgroundColor: item.cor,
                  },
                ]}
              />
            </View>
            <Text style={[styles.barValue, { color: item.cor }]}>
              {formatCurrency(item.total)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ─── Gráfico de pizza usando segmentos de View ───────────────────────────────
function DonutChart({ data }: { data: CategoryData[] }) {
  const SIZE = 180;
  const STROKE = 28;
  const RADIUS = (SIZE - STROKE) / 2;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  // Calcular os segmentos como arcos SVG-like usando Views rotacionadas
  let cumulativePercent = 0;

  return (
    <View style={styles.donutWrapper}>
      <View style={[styles.donutContainer, { width: SIZE, height: SIZE }]}>
        {/* Fundo cinza */}
        <View
          style={[
            styles.donutBase,
            {
              width: SIZE,
              height: SIZE,
              borderRadius: SIZE / 2,
              borderWidth: STROKE,
              borderColor: "#F1F5F9",
            },
          ]}
        />
        {/* Segmentos coloridos (simplificado com bordas coloridas) */}
        {data.slice(0, 6).map((item, index) => {
          const rotation = cumulativePercent * 3.6; // 360/100 = 3.6
          cumulativePercent += item.percentual;
          const sweepDeg = item.percentual * 3.6;

          // Simplificação visual: mostramos a fatia dominante
          if (index === 0) {
            return (
              <View
                key={item.nome}
                style={[
                  styles.donutSegment,
                  {
                    width: SIZE,
                    height: SIZE,
                    borderRadius: SIZE / 2,
                    borderWidth: STROKE,
                    borderColor: "transparent",
                    borderTopColor: item.cor,
                    transform: [{ rotate: `${rotation - 90}deg` }],
                  },
                ]}
              />
            );
          }
          return null;
        })}

        {/* Centro do donut */}
        <View
          style={[
            styles.donutCenter,
            {
              width: SIZE - STROKE * 2 - 8,
              height: SIZE - STROKE * 2 - 8,
              borderRadius: (SIZE - STROKE * 2 - 8) / 2,
            },
          ]}
        >
          <Text style={styles.donutCenterLabel}>Total</Text>
          <Text style={styles.donutCenterValue}>
            {formatCurrency(data.reduce((sum, d) => sum + d.total, 0))}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─── Componente de legenda ───────────────────────────────────────────────────
function Legend({ data }: { data: CategoryData[] }) {
  return (
    <View style={styles.legendContainer}>
      {data.map((item) => (
        <View key={item.nome} style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: item.cor }]} />
          <View style={styles.legendInfo}>
            <Text style={styles.legendNome} numberOfLines={1}>
              {item.nome}
            </Text>
            <Text style={styles.legendPct}>{item.percentual.toFixed(1)}%</Text>
          </View>
          <Text style={styles.legendValor}>{formatCurrency(item.total)}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────
export default function SpendingByCategoryChart({
  transactions,
}: SpendingByCategoryChartProps) {
  const [activeTab, setActiveTab] = React.useState<"pizza" | "barras">(
    "barras"
  );

  // US08 — Agrupar despesas por categoria e calcular percentuais
  const categoryData = useMemo<CategoryData[]>(() => {
    const despesas = transactions.filter((t) => t.tipo === "DESPESA");
    const totalGeral = despesas.reduce((sum, t) => sum + Number(t.valor), 0);

    if (totalGeral === 0) return [];

    const grouped: Record<string, number> = {};
    for (const t of despesas) {
      const cat = t.categoria ?? "Sem categoria";
      grouped[cat] = (grouped[cat] ?? 0) + Number(t.valor);
    }

    return Object.entries(grouped)
      .map(([nome, total], index) => ({
        nome,
        total,
        percentual: (total / totalGeral) * 100,
        cor: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
      }))
      .sort((a, b) => b.total - a.total);
  }, [transactions]);

  // US08 — Tratar ausência de dados
  if (categoryData.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📊</Text>
        <Text style={styles.emptyTitle}>Nenhuma despesa registrada</Text>
        <Text style={styles.emptySubtitle}>
          Cadastre transações para visualizar os gastos por categoria.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {/* Cabeçalho */}
      <Text style={styles.cardTitle}>Gastos por Categoria</Text>

      {/* Tabs: pizza ou barras */}
      <View style={styles.tabRow}>
        <View
          style={[
            styles.tabBtn,
            activeTab === "barras" && styles.tabBtnActive,
          ]}
          // Pressable nativo sem import extra
          onStartShouldSetResponder={() => true}
          onResponderRelease={() => setActiveTab("barras")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "barras" && styles.tabTextActive,
            ]}
          >
            Barras
          </Text>
        </View>
        <View
          style={[
            styles.tabBtn,
            activeTab === "pizza" && styles.tabBtnActive,
          ]}
          onStartShouldSetResponder={() => true}
          onResponderRelease={() => setActiveTab("pizza")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "pizza" && styles.tabTextActive,
            ]}
          >
            Pizza
          </Text>
        </View>
      </View>

      {/* US08 — Gráfico (pizza ou barras) */}
      {activeTab === "barras" ? (
        <BarChart data={categoryData} />
      ) : (
        <>
          <DonutChart data={categoryData} />
          <Legend data={categoryData} />
        </>
      )}

      {/* Resumo: top categoria */}
      {categoryData.length > 0 && (
        <View style={styles.summaryRow}>
          <View
            style={[
              styles.summaryDot,
              { backgroundColor: categoryData[0].cor },
            ]}
          />
          <Text style={styles.summaryText}>
            Maior gasto:{" "}
            <Text style={{ fontWeight: "700", color: categoryData[0].cor }}>
              {categoryData[0].nome}
            </Text>{" "}
            ({categoryData[0].percentual.toFixed(0)}% do total)
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Estilos ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 12,
  },

  // Tabs
  tabRow: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  tabTextActive: {
    color: "#0F172A",
  },

  // Gráfico de barras
  barChartContainer: {
    gap: 10,
    marginBottom: 8,
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  barLabel: {
    width: 80,
    fontSize: 12,
    color: "#475569",
    fontWeight: "500",
  },
  barTrack: {
    flex: 1,
    height: 10,
    backgroundColor: "#F1F5F9",
    borderRadius: 5,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 5,
  },
  barValue: {
    width: 72,
    fontSize: 11,
    fontWeight: "700",
    textAlign: "right",
  },

  // Gráfico donut
  donutWrapper: {
    alignItems: "center",
    marginVertical: 12,
  },
  donutContainer: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  donutBase: {
    position: "absolute",
  },
  donutSegment: {
    position: "absolute",
  },
  donutCenter: {
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
  },
  donutCenterLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
  },
  donutCenterValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },

  // Legenda
  legendContainer: {
    gap: 8,
    marginTop: 4,
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    flexShrink: 0,
  },
  legendInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendNome: {
    flex: 1,
    fontSize: 13,
    color: "#334155",
    fontWeight: "500",
  },
  legendPct: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "600",
  },
  legendValor: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },

  // Resumo
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  summaryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  summaryText: {
    fontSize: 12,
    color: "#475569",
    flex: 1,
  },

  // Estado vazio
  emptyContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 12,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 36,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
  },
});