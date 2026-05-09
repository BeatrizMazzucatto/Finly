import React from "react";
import { StyleSheet, View, Text, TouchableOpacity, ViewStyle } from "react-native";
import { Feather } from "@expo/vector-icons";
import {
  Colors,
  BorderRadius,
  Spacing,
  FontSize,
  FontWeight,
  Shadow,
} from "@/constants/theme";
import { CATEGORIAS } from "@/constants/categories";
import { formatCurrency } from "@/utils/formatters";

interface TransactionItemProps {
  id: number;
  titulo: string;
  valor: number;
  tipo: "RECEITA" | "DESPESA";
  categoria: string;
  data: string;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
  style?: ViewStyle;
}

export function TransactionItem({
  id,
  titulo,
  valor,
  tipo,
  categoria,
  data,
  onPress,
  onEdit,
  onDelete,
  showActions = false,
  style,
}: TransactionItemProps) {
  const isExpense = tipo === "DESPESA";
  const iconName = "circle";
  const categoryColor = Colors.primary;

  const content = (
    <View style={[styles.container, style]}>
      {/* Ícone da categoria */}
      <View style={[styles.iconContainer, { backgroundColor: categoryColor + "20" }]}>
        <Feather name={iconName} size={20} color={categoryColor} />
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{titulo}</Text>
        <Text style={styles.meta}>
           {categoria}
        </Text>
      </View>

      {/* Valor */}
      <View style={styles.valueContainer}>
        <Text style={[styles.value, { color: isExpense ? Colors.expense : Colors.income }]}>
          {isExpense ? "- " : "+ "}{formatCurrency(valor)}
        </Text>
      </View>

      {/* Ações */}
      {showActions && (
        <View style={styles.actions}>
          {onEdit && (
            <TouchableOpacity style={styles.actionBtn} onPress={onEdit}>
              <Feather name="edit-2" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity style={styles.actionBtn} onPress={onDelete}>
              <Feather name="trash-2" size={16} color={Colors.error} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  meta: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  valueContainer: {
    alignItems: "flex-end",
  },
  value: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  actionBtn: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.borderLight,
  },
});