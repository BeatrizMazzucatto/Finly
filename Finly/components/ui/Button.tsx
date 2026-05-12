import React from "react";
import { 
  StyleSheet, 
  TouchableOpacity, 
  Text, 
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors, BorderRadius, FontSize, FontWeight, Shadow } from "@/constants/theme";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  icon?: keyof typeof Feather.glyphMap;
  iconPosition?: "left" | "right";
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "left",
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const buttonStyles: ViewStyle[] = [
    styles.base,
    styles[`variant_${variant}`],
    styles[`size_${size}`],
    fullWidth && styles.fullWidth,
    isDisabled && styles.disabled,
    style,
  ].filter(Boolean) as ViewStyle[];

  const textStyles: TextStyle[] = [
    styles.text,
    styles[`text_${variant}`],
    styles[`textSize_${size}`],
  ];

  const iconColor = variant === "primary" || variant === "danger" 
    ? Colors.textInverse 
    : variant === "secondary" 
    ? Colors.primary 
    : Colors.textPrimary;

  const iconSize = size === "sm" ? 16 : size === "lg" ? 22 : 18;

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === "primary" || variant === "danger" ? Colors.textInverse : Colors.primary} 
          size="small" 
        />
      ) : (
        <>
          {icon && iconPosition === "left" && (
            <Feather name={icon} size={iconSize} color={iconColor} style={styles.iconLeft} />
          )}
          <Text style={textStyles}>{title}</Text>
          {icon && iconPosition === "right" && (
            <Feather name={icon} size={iconSize} color={iconColor} style={styles.iconRight} />
          )}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.md,
    ...Shadow.sm,
  },
  fullWidth: {
    width: "100%",
  },
  disabled: {
    opacity: 0.6,
  },

  // Variants
  variant_primary: {
    backgroundColor: Colors.primary,
  },
  variant_secondary: {
    backgroundColor: Colors.primaryLight + "20",
  },
  variant_outline: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  variant_ghost: {
    backgroundColor: "transparent",
    shadowOpacity: 0,
    elevation: 0,
  },
  variant_danger: {
    backgroundColor: Colors.error,
  },

  // Sizes
  size_sm: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    minHeight: 36,
  },
  size_md: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    minHeight: 48,
  },
  size_lg: {
    paddingVertical: 16,
    paddingHorizontal: 28,
    minHeight: 56,
  },

  // Text
  text: {
    fontWeight: FontWeight.semibold,
  },
  text_primary: {
    color: Colors.textInverse,
  },
  text_secondary: {
    color: Colors.primary,
  },
  text_outline: {
    color: Colors.textPrimary,
  },
  text_ghost: {
    color: Colors.textSecondary,
  },
  text_danger: {
    color: Colors.textInverse,
  },

  // Text sizes
  textSize_sm: {
    fontSize: FontSize.sm,
  },
  textSize_md: {
    fontSize: FontSize.md,
  },
  textSize_lg: {
    fontSize: FontSize.lg,
  },

  // Icons
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});