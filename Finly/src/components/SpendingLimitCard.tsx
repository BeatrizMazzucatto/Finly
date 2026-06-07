import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LIMIT_STORAGE_KEY = "finly_spending_limit";

interface SpendingLimitCardProps {
  totalDespesas: number;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function parseCurrency(raw: string): number {
  const cleaned = raw
    .replace(/R\$\s?/g, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .trim();
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

export default function SpendingLimitCard({
  totalDespesas,
}: SpendingLimitCardProps) {
  const [limit, setLimit] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLimit() {
  try {
    const stored = await AsyncStorage.getItem(LIMIT_STORAGE_KEY);

    if (stored !== null) {
      const parsed = parseFloat(stored);
      setLimit(parsed);
      setInputValue(formatCurrency(parsed));
    }
  } catch (error) {
    console.error("Erro ao carregar limite:", error);
  } finally {
    setLoading(false);
  }
}
    loadLimit();
  }, []);

  async function saveLimit() {
    const value = parseCurrency(inputValue);
    if (value <= 0) {
      Alert.alert("Valor inválido", "Insira um limite maior que zero.");
      return;
    }
    await AsyncStorage.setItem(LIMIT_STORAGE_KEY, String(value));
    setLimit(value);
    setInputValue(formatCurrency(value));
    setEditing(false);
  }

  function handleCancel() {
    setInputValue(limit !== null ? formatCurrency(limit) : "");
    setEditing(false);
  }

  if (loading) {
    return (
      <View style={styles.card}>
        <ActivityIndicator size="small" />
      </View>
    );
  }

  const percentual = limit && limit > 0 ? (totalDespesas / limit) * 100 : 0;
  const exceeded = percentual >= 100;
  const warning = percentual >= 80 && !exceeded;
  const barColor = exceeded ? "#B91C1C" : warning ? "#D97706" : "#2563EB";

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Limite mensal</Text>
        <Pressable onPress={() => (editing ? handleCancel() : setEditing(true))}>
          <Text style={styles.editBtn}>{editing ? "Cancelar" : "Editar"}</Text>
        </Pressable>
      </View>

      {editing && (
        <View style={styles.editRow}>
          <TextInput
            style={styles.input}
            value={inputValue}
            onChangeText={setInputValue}
            keyboardType="numeric"
            placeholder="R$ 0,00"
            autoFocus
          />
          <Pressable style={styles.saveBtn} onPress={saveLimit}>
            <Text style={styles.saveBtnText}>Salvar</Text>
          </Pressable>
        </View>
      )}

      {limit !== null && limit > 0 ? (
        <>
          <View style={styles.valuesRow}>
            <View>
              <Text style={styles.label}>Gasto</Text>
              <Text style={[styles.value, exceeded && { color: "#B91C1C" }]}>
                {formatCurrency(totalDespesas)}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.label}>Limite</Text>
              <Text style={styles.value}>{formatCurrency(limit)}</Text>
            </View>
          </View>

          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${Math.min(percentual, 100)}%` as any,
                  backgroundColor: barColor,
                },
              ]}
            />
          </View>

          <Text style={[styles.percentText, { color: barColor }]}>
            {exceeded
              ? `Limite ultrapassado em ${formatCurrency(totalDespesas - limit)}`
              : warning
              ? `Atenção: ${percentual.toFixed(0)}% do limite atingido`
              : `${percentual.toFixed(0)}% do limite utilizado`}
          </Text>
        </>
      ) : (
        !editing && (
          <Text style={styles.noLimit}>
            Nenhum limite definido. Toque em `Editar` para configurar.
          </Text>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 12,
    gap: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  editBtn: {
    fontSize: 13,
    color: "#2563EB",
    fontWeight: "600",
  },
  editRow: {
    flexDirection: "row",
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: "#F8FAFC",
  },
  saveBtn: {
    backgroundColor: "#2563EB",
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  valuesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  label: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 2,
  },
  value: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  barTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E2E8F0",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 4,
  },
  percentText: {
    fontSize: 12,
    fontWeight: "600",
  },
  noLimit: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    paddingVertical: 4,
  },
});