import { FocusablePressable } from "@/components/focusable-pressable";
import { LanguageContext } from "@/src/context/LanguageContext";
import { ThemeContext } from "@/src/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useContext } from "react";
import { StyleProp, StyleSheet, Text, ViewStyle } from "react-native";

type LanguageToggleProps = {
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function LanguageToggle({ compact = false, style }: LanguageToggleProps) {
  const { colors } = useContext(ThemeContext);
  const { language, t, toggleLanguage } = useContext(LanguageContext);
  const nextLanguageLabel = language === "pt" ? "English" : "Português";

  return (
    <FocusablePressable
      accessibilityHint={`${t("a11y.languageToggle")}: ${nextLanguageLabel}.`}
      accessibilityLabel={t("a11y.languageToggle")}
      accessibilityRole="button"
      hitSlop={8}
      onPress={toggleLanguage}
      style={({ pressed }) => [
        styles.button,
        compact && styles.compact,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.84 : 1,
        },
        style,
      ]}
    >
      <Ionicons
        accessibilityElementsHidden
        color={colors.text}
        importantForAccessibility="no"
        name="language"
        size={compact ? 16 : 18}
      />
      <Text style={[styles.text, compact && styles.compactText, { color: colors.text }]}>
        {t("language.current")}
      </Text>
    </FocusablePressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 14,
  },
  compact: {
    minHeight: 42,
    paddingHorizontal: 12,
  },
  compactText: {
    fontSize: 13,
  },
  text: {
    fontSize: 14,
    fontWeight: "900",
  },
});
