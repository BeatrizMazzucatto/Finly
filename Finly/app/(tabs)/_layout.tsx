import { Tabs } from "expo-router";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors, Shadow } from "@/constants/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Início",
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="statistics"
        options={{
          title: "Estatísticas",
          tabBarIcon: ({ color, size }) => (
            <Feather name="pie-chart" size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="add"
        options={{
          title: "",
          tabBarIcon: ({ color }) => (
            <View style={styles.addButton}>
              <Feather name="plus" size={28} color={Colors.textInverse} />
            </View>
          ),
          tabBarButton: (props: any) => (
            <Pressable
              {...props}
              onPress={() => {
                const { router } = require("expo-router");
                router.push("/transaction-form");
              }}
              style={styles.addButtonContainer}
            >
              <View style={styles.addButton}>
                <Feather
                  name="plus"
                  size={28}
                  color={Colors.textInverse}
                />
              </View>
            </Pressable>
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            const { router } = require("expo-router");
            router.push("/transaction-form");
          },
        }}
      />

      <Tabs.Screen
        name="history"
        options={{
          title: "Histórico",
          tabBarIcon: ({ color, size }) => (
            <Feather name="clock" size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: "Config",
          tabBarIcon: ({ color, size }) => (
            <Feather name="settings" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    height: 80,
    paddingBottom: 20,
    paddingTop: 10,
    ...Shadow.md,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "500",
  },
  addButtonContainer: {
    top: -20,
    justifyContent: "center",
    alignItems: "center",
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...Shadow.lg,
  },
});