import React from "react";
import { StyleSheet, View, Text, TouchableOpacity, ViewStyle } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors, BorderRadius, FontSize, FontWeight, Spacing } from "@/constants/theme";

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: keyof typeof Feather.glyphMap;
  color?: string;
  variant?: "default" | "filled" | "outlined";
  size?: "sm" | "md";
  style?: ViewStyle;
}

export function Chip({
  label,
  selected = false,
  onPress,
  icon,
  color,
  variant = "default",
  size = "md",
  style,
}: ChipProps) {
  const chipColor = color || (selected ? Colors.primary : Colors.textMuted);

  const chipStyles = [
    styles.chip,
    styles[`size_${size}`],
    variant === "filled" && { backgroundColor: chipColor },
    variant === "outlined" && { borderColor: chipColor, borderWidth: 1.5 },
    selected && variant === "default" && { backgroundColor: chipColor + "15", borderColor: chipColor },
    style,
  ];

  const textColor = variant === "filled" 
    ? Colors.textInverse 
    : selected 
    ? chipColor 
    : Colors.textSecondary;

  const content = (
    <>
      {icon && (
        <Feather 
          name={icon} 
          size={size === "sm" ? 14 : 16} 
          color={textColor} 
          style={styles.icon}
        />
      )}
      <Text style={[
        styles.label,
        styles[`labelSize_${size}`],
        { color: textColor },
        selected && { fontWeight: FontWeight.semibold },
      ]}>
        {label}
      </Text>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity style={chipStyles} onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={chipStyles}>{content}</View>;
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.borderLight,
    borderWidth: 1,
    borderColor: "transparent",
  },
  size_sm: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  size_md: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  icon: {
    marginRight: Spacing.xs,
  },
  label: {
    fontWeight: FontWeight.medium,
  },
  labelSize_sm: {
    fontSize: FontSize.xs,
  },
  labelSize_md: {
    fontSize: FontSize.sm,
  },
});