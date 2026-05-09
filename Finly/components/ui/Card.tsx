import React from "react";
import { StyleSheet, View, Text, ViewStyle } from "react-native";
import { Colors, BorderRadius, Shadow, Spacing, FontSize, FontWeight } from "@/constants/theme";

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  variant?: "default" | "elevated" | "outlined" | "success" | "warning" | "error";
  padding?: "none" | "sm" | "md" | "lg";
  style?: ViewStyle;
}

export function Card({
  children,
  title,
  subtitle,
  variant = "default",
  padding = "md",
  style,
}: CardProps) {
  return (
    <View style={[
      styles.card,
      styles[`variant_${variant}`],
      styles[`padding_${padding}`],
      style,
    ]}>
      {(title || subtitle) && (
        <View style={styles.header}>
          {title && <Text style={styles.title}>{title}</Text>}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    ...Shadow.md,
  },
  header: {
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // Variants
  variant_default: {
    borderWidth: 1,
    borderColor: Colors.border,
  },
  variant_elevated: {
    ...Shadow.lg,
  },
  variant_outlined: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: Colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  variant_success: {
    backgroundColor: Colors.successLight,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  variant_warning: {
    backgroundColor: Colors.warningLight,
    borderWidth: 1,
    borderColor: Colors.warning,
  },
  variant_error: {
    backgroundColor: Colors.errorLight,
    borderWidth: 1,
    borderColor: Colors.error,
  },

  // Padding
  padding_none: {
    padding: 0,
  },
  padding_sm: {
    padding: Spacing.md,
  },
  padding_md: {
    padding: Spacing.lg,
  },
  padding_lg: {
    padding: Spacing.xl,
  },
});