import React from "react";
import { 
  StyleSheet, 
  TextInput, 
  View, 
  Text,
  TextInputProps,
  ViewStyle,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors, BorderRadius, FontSize, FontWeight, Spacing } from "@/constants/theme";

interface InputProps extends TextInputProps {
  label?: string;
  icon?: keyof typeof Feather.glyphMap;
  error?: string;
  hint?: string;
  containerStyle?: ViewStyle;
}

export function Input({
  label,
  icon,
  error,
  hint,
  containerStyle,
  style,
  ...props
}: InputProps) {
  const hasError = !!error;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={[
        styles.inputContainer,
        hasError && styles.inputContainerError,
        props.editable === false && styles.inputContainerDisabled,
      ]}>
        {icon && (
          <Feather 
            name={icon} 
            size={20} 
            color={hasError ? Colors.error : Colors.textMuted} 
            style={styles.icon}
          />
        )}
        <TextInput
          style={[
            styles.input,
            icon && styles.inputWithIcon,
            style,
          ]}
          placeholderTextColor={Colors.textMuted}
          {...props}
        />
      </View>

      {(error || hint) && (
        <Text style={[styles.hint, hasError && styles.errorText]}>
          {error || hint}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
  },
  inputContainerError: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorLight,
  },
  inputContainerDisabled: {
    backgroundColor: Colors.borderLight,
    opacity: 0.7,
  },
  icon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    paddingVertical: Spacing.lg,
    fontWeight: FontWeight.medium,
  },
  inputWithIcon: {
    paddingLeft: 0,
  },
  hint: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  errorText: {
    color: Colors.error,
  },
});