import { ThemeContext } from "@/src/context/ThemeContext";
import { ReactNode, useContext, useState } from "react";
import {
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
} from "react-native";

type FocusablePressableState = {
  focused: boolean;
  pressed: boolean;
};

type FocusablePressableProps = Omit<PressableProps, "children" | "style"> & {
  children: ReactNode;
  focusStyle?: StyleProp<ViewStyle>;
  style?:
    | StyleProp<ViewStyle>
    | ((state: FocusablePressableState) => StyleProp<ViewStyle>);
};

export function FocusablePressable({
  children,
  focusStyle,
  onBlur,
  onFocus,
  style,
  ...props
}: FocusablePressableProps) {
  const { colors } = useContext(ThemeContext);
  const [focused, setFocused] = useState(false);

  return (
    <Pressable
      {...props}
      onBlur={(event) => {
        setFocused(false);
        onBlur?.(event);
      }}
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
      }}
      style={({ pressed }) => [
        typeof style === "function" ? style({ focused, pressed }) : style,
        focused && [
          {
            borderColor: colors.focus,
            borderWidth: 3,
          },
          focusStyle,
        ],
      ]}
    >
      {children}
    </Pressable>
  );
}
