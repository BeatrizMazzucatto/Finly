import { Tabs } from "expo-router";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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
          tabBarIcon: ({ color }) => <Feather name="pie-chart" size={20} color={color} />,
        }}
      />

      <Tabs.Screen
        name="history"
        options={{
          title: "Histórico",
          tabBarIcon: ({ color }) => <Feather name="list" size={20} color={color} />,
        }}
      />

      <Tabs.Screen
        name="add"
        options={{
          title: "",
          tabBarIcon: () => (
            <View style={styles.addButton}>
              <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.addGradient}>
                <Feather name="plus" size={24} color={Colors.textInverse} />
              </LinearGradient>
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
                <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.addGradient}>
                  <Feather name="plus" size={24} color={Colors.textInverse} />
                </LinearGradient>
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
        name="groups"
        options={{
          title: "Grupos",
          tabBarIcon: ({ color }) => <Feather name="users" size={20} color={color} />,
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: "Ajustes",
          tabBarIcon: ({ color }) => <Feather name="settings" size={20} color={color} />,
        }}
      />

      <Tabs.Screen name="statistics" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.3)",
    height: 85,
    paddingBottom: 15,
    paddingTop: 10,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
  },
  addButtonContainer: {
    top: -20,
    justifyContent: "center",
    alignItems: "center",
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 20,
    overflow: "hidden",
    ...Shadow.lg,
  },
  addGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
