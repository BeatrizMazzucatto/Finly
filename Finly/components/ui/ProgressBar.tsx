import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { Colors, BorderRadius } from "@/constants/theme";

interface ProgressBarProps {
  progress: number; // 0 to 100
  color?: string;
  backgroundColor?: string;
  height?: number;
  showOverflow?: boolean;
  style?: ViewStyle;
}

export function ProgressBar({
  progress,
  color = Colors.primary,
  backgroundColor = Colors.borderLight,
  height = 8,
  showOverflow = false,
  style,
}: ProgressBarProps) {
  const clampedProgress = showOverflow ? progress : Math.min(Math.max(progress, 0), 100);
  const isOverflow = progress > 100;

  return (
    <View 
      style={[
        styles.container, 
        { height, backgroundColor, borderRadius: height / 2 },
        style,
      ]}
    >
      <View
        style={[
          styles.fill,
          {
            width: `${Math.min(clampedProgress, 100)}%`,
            backgroundColor: isOverflow ? Colors.error : color,
            borderRadius: height / 2,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
  },
});