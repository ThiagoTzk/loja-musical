import { LanguageContext } from "@/src/context/LanguageContext";
import { ThemeContext } from "@/src/context/ThemeContext";
import { useContext } from "react";
import { Image, StyleProp, StyleSheet, View, ViewStyle } from "react-native";

const logo = require("../assets/images/blacktone-logo.png");

type BrandLogoProps = {
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export function BrandLogo({ size = 118, style }: BrandLogoProps) {
  const { t } = useContext(LanguageContext);
  const { colors } = useContext(ThemeContext);

  return (
    <View
      accessibilityLabel={t("a11y.brandLogo")}
      accessibilityRole="image"
      accessible
      style={[
        styles.logoShell,
        {
          backgroundColor: colors.cardStrong,
          borderColor: colors.border,
          height: size,
          shadowColor: colors.shadow,
          width: size,
        },
        style,
      ]}
    >
      <Image
        accessibilityElementsHidden
        importantForAccessibility="no"
        source={logo}
        style={styles.logo}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  logo: {
    height: "100%",
    resizeMode: "cover",
    width: "100%",
  },
  logoShell: {
    alignSelf: "center",
    borderRadius: 28,
    borderWidth: 1,
    elevation: 5,
    marginBottom: 18,
    overflow: "hidden",
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
  },
});
