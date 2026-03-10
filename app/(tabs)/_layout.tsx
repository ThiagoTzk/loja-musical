import { ThemeContext } from "@/src/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useContext } from "react";

export default function TabLayout() {
  const { colors } = useContext(ThemeContext);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 0,
          height: 60,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.secondaryText,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="busca"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="carrinho"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cart" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="perfil"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}