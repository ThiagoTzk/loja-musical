import { ThemeContext } from "@/src/context/ThemeContext";
import { ReactNode, useContext, useState } from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from "react-native";

type ButtonVariant = "primary" | "secondary" | "danger";

type AccessibleButtonProps = {
  children: ReactNode;
  onPress: () => void;
  accessibilityHint?: string;
  accessibilityLabel?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  variant?: ButtonVariant;
};

export function AccessibleButton({
  children,
  onPress,
  accessibilityHint,
  accessibilityLabel,
  disabled = false,
  style,
  textStyle,
  variant = "primary",
}: AccessibleButtonProps) {
  const { colors } = useContext(ThemeContext);
  const [focused, setFocused] = useState(false);

  const isPrimary = variant === "primary";
  const isDanger = variant === "danger";
  const spokenLabel =
    accessibilityLabel ?? (typeof children === "string" ? children : undefined);

  const backgroundColor = isPrimary
    ? colors.accent
    : isDanger
      ? colors.dangerBackground
      : colors.cardStrong;

  const borderColor = isPrimary
    ? colors.borderStrong
    : isDanger
      ? colors.danger
      : colors.border;

  const color = isPrimary
    ? colors.accentText
    : isDanger
      ? colors.danger
      : colors.text;

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={spokenLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={8}
      onBlur={() => setFocused(false)}
      onFocus={() => setFocused(true)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor,
          borderColor: focused ? colors.focus : borderColor,
          borderWidth: focused ? 3 : 1,
          opacity: disabled ? 0.55 : pressed ? 0.84 : 1,
        },
        style,
      ]}
    >
      <Text style={[styles.text, { color }, textStyle]}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: 16,
    justifyContent: "center",
    minHeight: 48,
    minWidth: 48,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  text: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.2,
    textAlign: "center",
  },
});
