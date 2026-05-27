import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import type { ReactNode } from "react";

const PHONE_WIDTH = 390;
const PHONE_HEIGHT = 844;

export function PhoneShell({ children }: { children: ReactNode }) {
  if (Platform.OS !== "web") {
    return <>{children}</>;
  }

  return (
    <View style={styles.stage}>
      <View style={styles.phone}>
        <View style={styles.notch} />
        <View style={styles.screen}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100%",
  },
  phone: {
    width: PHONE_WIDTH,
    height: PHONE_HEIGHT,
    borderWidth: 14,
    borderColor: "#111111",
    borderRadius: 50,
    overflow: "hidden",
    backgroundColor: "#F8FAFC",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.5,
    shadowRadius: 50,
  },
  notch: {
    position: "absolute",
    top: 0,
    alignSelf: "center",
    width: 150,
    height: 30,
    backgroundColor: "#111111",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    zIndex: 10,
  },
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
});
