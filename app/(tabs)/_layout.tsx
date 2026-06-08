import { LanguageContext } from "@/src/context/LanguageContext";
import { ThemeContext } from "@/src/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useContext } from "react";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
  const { t } = useContext(LanguageContext);
  const { colors } = useContext(ThemeContext);
  const insets = useSafeAreaInsets();

  const bottomInset = Platform.OS === "web" ? 0 : insets.bottom;
  const tabBarHeight = Platform.OS === "web" ? 72 : 64 + bottomInset;
  const tabBarPaddingBottom =
    Platform.OS === "web" ? 10 : Math.max(bottomInset + 8, 14);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingBottom: tabBarPaddingBottom,
          paddingTop: Platform.OS === "web" ? 8 : 8,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarHideOnKeyboard: true,
        tabBarInactiveTintColor: colors.secondaryText,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "700",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarAccessibilityLabel: t("tabs.home"),
          title: t("tabs.home"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              accessibilityElementsHidden
              importantForAccessibility="no"
              name="home"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="busca"
        options={{
          tabBarAccessibilityLabel: t("tabs.search"),
          title: t("tabs.search"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              accessibilityElementsHidden
              importantForAccessibility="no"
              name="search"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="carrinho"
        options={{
          tabBarAccessibilityLabel: t("tabs.cart"),
          title: t("tabs.cart"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              accessibilityElementsHidden
              importantForAccessibility="no"
              name="cart"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="perfil"
        options={{
          tabBarAccessibilityLabel: t("tabs.profile"),
          title: t("tabs.profile"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              accessibilityElementsHidden
              importantForAccessibility="no"
              name="person"
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
