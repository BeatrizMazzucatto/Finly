import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { useState, useMemo, useEffect } from "react";
import type { Transaction } from "@/src/types/api";

type Period = "all" | "today" | "week" | "month" | "3months" | "6months" | "year";

const PERIODS: { label: string; value: Period }[] = [
  { label: "Todos", value: "all" },
  { label: "Hoje", value: "today" },
  { label: "Esta semana", value: "week" },
  { label: "Este mês", value: "month" },
  { label: "3 meses", value: "3months" },
  { label: "6 meses", value: "6months" },
  { label: "1 ano", value: "year" },
];

interface TransactionFiltersProps {
  transactions: Transaction[];
  onFilterChange: (filtered: Transaction[]) => void;
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function startOfWeek(d: Date) {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export default function TransactionFilters({
  transactions,
  onFilterChange,
}: TransactionFiltersProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("all");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const t of transactions) {
      if (t.categoria) set.add(t.categoria);
    }
    return Array.from(set).sort();
  }, [transactions]);

  function applyFilters(period: Period, category: string | null) {
    const now = new Date();
    let filtered = transactions;

    if (period !== "all") {
      let from: Date;
      if (period === "today") from = startOfDay(now);
      else if (period === "week") from = startOfWeek(now);
      else if (period === "month") from = startOfMonth(now);
      else if (period === "3months") from = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      else if (period === "6months") from = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
      else from = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

      filtered = filtered.filter((t) => {
        const [y, m, d] = t.data_transacao.split("-").map(Number);
        const date = new Date(y, m - 1, d);
        return date >= from;
      });
    }

    if (category) {
      filtered = filtered.filter((t) => t.categoria === category);
    }

    onFilterChange(filtered);
  }

  // Reaaplica filtros sempre que as transações mudarem (fix: dados carregam depois do render)
  useEffect(() => {
    applyFilters(selectedPeriod, selectedCategory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions]);

  function handlePeriod(period: Period) {
    setSelectedPeriod(period);
    applyFilters(period, selectedCategory);
  }

  function handleCategory(cat: string | null) {
    const next = selectedCategory === cat ? null : cat;
    setSelectedCategory(next);
    applyFilters(selectedPeriod, next);
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rowContent}
      >
        {PERIODS.map((p) => (
          <Pressable
            key={p.value}
            style={[styles.chip, selectedPeriod === p.value && styles.chipActive]}
            onPress={() => handlePeriod(p.value)}
          >
            <Text style={[styles.chipText, selectedPeriod === p.value && styles.chipTextActive]}>
              {p.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {categories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rowContent}
        >
          <Pressable
            style={[styles.chip, !selectedCategory && styles.chipActive]}
            onPress={() => handleCategory(null)}
          >
            <Text style={[styles.chipText, !selectedCategory && styles.chipTextActive]}>
              Todas categorias
            </Text>
          </Pressable>
          {categories.map((cat) => (
            <Pressable
              key={cat}
              style={[styles.chip, selectedCategory === cat && styles.chipActive]}
              onPress={() => handleCategory(cat)}
            >
              <Text style={[styles.chipText, selectedCategory === cat && styles.chipTextActive]}>
                {cat}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    marginBottom: 4,
  },
  rowContent: {
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  chipActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  chipText: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "500",
  },
  chipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});