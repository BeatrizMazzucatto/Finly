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
  const isConjuntas = label === "Conjuntas" || color === Colors.jointPrimary;

  let backgroundColor = Colors.surface;
  let borderColor = Colors.border;
  let textColor = Colors.textGray;

  if (isConjuntas) {
    if (selected) {
      backgroundColor = Colors.jointPrimary;
      borderColor = Colors.jointPrimary;
      textColor = Colors.textInverse;
    } else {
      backgroundColor = Colors.jointLight;
      borderColor = Colors.jointPrimary;
      textColor = Colors.jointPrimary;
    }
  } else {
    if (selected) {
      backgroundColor = Colors.primary;
      borderColor = Colors.primary;
      textColor = Colors.textInverse;
    } else {
      backgroundColor = Colors.surface;
      borderColor = Colors.border;
      textColor = Colors.textGray;
    }
  }

  const chipStyles = [
    styles.chip,
    styles[`size_${size}`],
    { backgroundColor, borderColor },
    style,
  ];

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
    borderRadius: BorderRadius.xl, // 20px
    borderWidth: 1,
  },
  size_sm: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  size_md: {
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  icon: {
    marginRight: Spacing.xs,
  },
  label: {
    fontWeight: FontWeight.semibold,
  },
  labelSize_sm: {
    fontSize: FontSize.xs,
  },
  labelSize_md: {
    fontSize: FontSize.sm,
  },
});