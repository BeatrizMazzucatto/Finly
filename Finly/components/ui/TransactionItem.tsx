import React from "react";
import { StyleSheet, View, Text, TouchableOpacity, ViewStyle, Image } from "react-native";
import { Feather } from "@expo/vector-icons";
import {
  Colors,
  BorderRadius,
  Spacing,
  FontSize,
  FontWeight,
  Shadow,
} from "@/constants/theme";
import { getCategoryColor, getCategoryIcon } from "@/constants/categories";
import { formatCurrency } from "@/utils/formatters";

interface TransactionItemProps {
  id: number;
  id_carteira?: number;
  usuario_nome?: string;
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
  id_carteira,
  usuario_nome,
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
  const iconName = getCategoryIcon(categoria);
  const categoryColor = getCategoryColor(categoria);
  
  const isJoint = id_carteira === 3;
  const iconBgColor = isJoint ? Colors.jointLight : (categoryColor + "20");
  const iconColor = isJoint ? Colors.jointPrimary : categoryColor;

  const content = (
    <View style={[styles.container, style]}>
      {/* Ícone da categoria */}
      <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
        <Feather name={isJoint ? "shopping-cart" : iconName} size={20} color={iconColor} />
      </View>

      {/* Info */}
      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>{titulo}</Text>
          {isJoint && (
            <View style={styles.jointBadge}>
              <Text style={styles.jointBadgeText}>CONJUNTO</Text>
            </View>
          )}
        </View>
        <View style={styles.metaRow}>
          {isJoint && usuario_nome && (
            <Image
              source={{ uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(usuario_nome)}&background=9333EA&color=fff` }}
              style={styles.avatarMini}
            />
          )}
          <Text style={styles.meta}>
            {isJoint && usuario_nome ? `${usuario_nome} registrou • ` : ""}{categoria}
          </Text>
        </View>
      </View>

      {/* Valor */}
      <View style={styles.valueContainer}>
        <Text style={[styles.value, { color: isExpense ? Colors.textPrimary : Colors.success }]}>
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
    borderRadius: BorderRadius.xl,
    padding: 14,
    ...Shadow.sm,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  title: {
    fontSize: 16,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    flexShrink: 1,
  },
  jointBadge: {
    backgroundColor: Colors.jointLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 0,
  },
  jointBadgeText: {
    color: Colors.jointPrimary,
    fontSize: 10,
    fontWeight: FontWeight.bold,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarMini: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6,
  },
  meta: {
    fontSize: 13,
    color: Colors.textGray,
  },
  valueContainer: {
    alignItems: "flex-end",
  },
  value: {
    fontSize: 16,
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