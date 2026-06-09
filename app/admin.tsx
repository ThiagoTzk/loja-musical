import { AccessibleButton } from "@/components/accessible-button";
import { BrandLogo } from "@/components/brand-logo";
import { ThemeContext } from "@/src/context/ThemeContext";
import { UsuarioContext } from "@/src/context/UsuarioContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useContext, useEffect } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AdminRedirect() {
  const { colors } = useContext(ThemeContext);
  const { usuario } = useContext(UsuarioContext);

  useEffect(() => {
    if (Platform.OS === "web") {
      router.replace("/admin-web" as never);
    }
  }, []);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <BrandLogo size={86} />

        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              shadowColor: colors.shadow,
            },
          ]}
        >
          <Ionicons
            color={colors.accent}
            name={Platform.OS === "web" ? "open-outline" : "desktop-outline"}
            size={34}
          />

          <Text style={[styles.eyebrow, { color: colors.accent }]}>
            Painel administrativo
          </Text>

          <Text style={[styles.title, { color: colors.text }]}>
            Admin BlackTone agora fica no navegador
          </Text>

          <Text style={[styles.description, { color: colors.secondaryText }]}>
            O gerenciamento de produtos, pedidos e usuarios foi movido para um
            backoffice web separado, como em uma loja real. Entre com uma conta
            marcada como admin para acessar.
          </Text>

          {usuario?.admin ? (
            <AccessibleButton
              accessibilityHint="Volta para a tela anterior."
              onPress={() => router.back()}
            >
              Voltar ao aplicativo
            </AccessibleButton>
          ) : (
            <AccessibleButton
              accessibilityHint="Abre a tela de login do aplicativo."
              onPress={() => router.push("/login")}
            >
              Entrar com conta admin
            </AccessibleButton>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 30,
    borderWidth: 1,
    gap: 14,
    padding: 24,
    shadowOffset: { height: 14, width: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    width: "100%",
  },
  content: {
    alignItems: "center",
    flex: 1,
    gap: 24,
    justifyContent: "center",
    padding: 24,
  },
  description: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  safeArea: {
    flex: 1,
  },
  title: {
    fontSize: 27,
    fontWeight: "900",
    lineHeight: 32,
  },
});
