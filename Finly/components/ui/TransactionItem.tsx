import React, { memo } from "react";
import { StyleSheet, View, Text, Pressable, ViewStyle, Image } from "react-native";
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
import { useAuth } from "@/src/context/AuthContext";

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

export const TransactionItem = memo(function TransactionItem({
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

  const { user } = useAuth();
  const isJoint = id_carteira !== undefined && id_carteira === user?.id_carteira_conjunta;
  const iconBgColor = categoryColor + "20";
  const iconColor = categoryColor;

  const content = (
    <View style={[styles.container, style]}>
      {isJoint && (
        <View style={styles.headerRow}>
          {usuario_nome ? (
            <View style={styles.userRow}>
              <View style={styles.avatarMini}>
                <Text style={styles.avatarMiniText}>
                  {usuario_nome.substring(0, 2).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.userText}>{usuario_nome} registrou</Text>
            </View>
          ) : <View />}
          <View style={styles.jointBadge}>
            <Text style={styles.jointBadgeText}>CONJUNTO</Text>
          </View>
        </View>
      )}

      <View style={styles.mainRow}>
        <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
          <Feather name={iconName} size={20} color={iconColor} />
        </View>

        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>{titulo}</Text>
          <Text style={styles.categoryText}>{categoria}</Text>
        </View>

        <View style={styles.valueContainer}>
          <Text style={[styles.value, { color: isExpense ? Colors.textPrimary : Colors.success }]}>
            {isExpense ? "- " : "+ "}{formatCurrency(valor)}
          </Text>
        </View>

        {showActions && (
          <View style={styles.actions}>
            {onEdit && (
              <Pressable style={styles.actionBtn} onPress={onEdit}>
                <Feather name="edit-2" size={16} color={Colors.textMuted} />
              </Pressable>
            )}
            {onDelete && (
              <Pressable style={styles.actionBtn} onPress={onDelete}>
                <Feather name="trash-2" size={16} color={Colors.error} />
              </Pressable>
            )}
          </View>
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} android_ripple={{ color: Colors.borderLight }}>
        {content}
      </Pressable>
    );
  }

  return content;
});

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: 16,
    ...Shadow.sm,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderColor: Colors.borderLight,
    gap: 12,
  },
  jointBadge: {
    backgroundColor: Colors.jointLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  jointBadgeText: {
    color: Colors.jointPrimary,
    fontSize: 10,
    fontWeight: FontWeight.bold,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  avatarMini: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.jointPrimary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarMiniText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  userText: {
    fontSize: 13,
    color: Colors.textGray,
    fontWeight: "500",
  },
  mainRow: {
    flexDirection: "row",
    alignItems: "center",
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
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    flexShrink: 1,
  },
  categoryText: {
    fontSize: 14,
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