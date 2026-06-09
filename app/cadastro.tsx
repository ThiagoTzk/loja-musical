import { AccessibleButton } from "@/components/accessible-button";
import { BrandLogo } from "@/components/brand-logo";
import { FocusablePressable } from "@/components/focusable-pressable";
import { LanguageToggle } from "@/components/language-toggle";
import { cadastrarUsuarioFirebase } from "@/src/config/firebase-config";
import { LanguageContext } from "@/src/context/LanguageContext";
import { ThemeContext } from "@/src/context/ThemeContext";
import { UsuarioContext } from "@/src/context/UsuarioContext";
import { salvarUsuarioFirestore } from "@/src/services/firestore";
import { descreverErroFirebaseAuth } from "@/src/utils/firebase-auth-errors";
import { router } from "expo-router";
import { useContext, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Cadastro() {
  const { language, t } = useContext(LanguageContext);
  const { colors } = useContext(ThemeContext);
  const { sincronizarUsuario } = useContext(UsuarioContext);

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  function emailValido(valor: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
  }

  function validarFormulario() {
    const erros: string[] = [];
    const emailLimpo = email.trim();

    if (!emailLimpo) {
      erros.push(t("auth.emailRequiredSignup"));
    } else if (!emailValido(emailLimpo)) {
      erros.push(t("auth.emailInvalid"));
    }

    if (!senha) {
      erros.push(t("auth.passwordRequiredSignup"));
    } else if (senha.length < 6) {
      erros.push(t("auth.passwordWeak"));
    }

    return erros.length > 0 ? erros.join("\n") : null;
  }

  function voltar() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/(tabs)/perfil");
  }

  async function criarConta() {
    if (carregando) return;

    const emailLimpo = email.trim();
    const erroFormulario = validarFormulario();

    if (erroFormulario) {
      setErro(erroFormulario);
      return;
    }

    setCarregando(true);
    setErro("");

    try {
      const credencial = await cadastrarUsuarioFirebase(emailLimpo, senha);

      try {
        await salvarUsuarioFirestore(credencial);
      } catch (syncError) {
        console.warn("Nao foi possivel salvar o usuario no Firestore.", syncError);
      }

      sincronizarUsuario({
        email: credencial.email ?? emailLimpo,
        expiresIn: credencial.expiresIn,
        idToken: credencial.idToken,
        perfilCompleto: false,
        refreshToken: credencial.refreshToken,
        uid: credencial.localId,
      });
      router.replace("/(tabs)/perfil");
    } catch (error) {
      setErro(descreverErroFirebaseAuth(error, "cadastro", language));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
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
          <FocusablePressable
            accessibilityHint={t("auth.backHint")}
            accessibilityLabel={t("common.back")}
            accessibilityRole="button"
            disabled={carregando}
            hitSlop={8}
            onPress={voltar}
            style={({ pressed }) => [
              styles.backButton,
              { opacity: carregando ? 0.5 : pressed ? 0.72 : 1 },
            ]}
          >
            <Text style={[styles.backText, { color: colors.text }]}>{t("common.back")}</Text>
          </FocusablePressable>

          <BrandLogo />
          <LanguageToggle compact style={styles.languageToggle} />

          <Text accessibilityRole="header" style={[styles.titulo, { color: colors.text }]}>
            {t("auth.signupTitle")}
          </Text>
          <Text style={[styles.subtitulo, { color: colors.secondaryText }]}>
            {t("auth.signupSubtitle")}
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.text }]}>{t("auth.email")}</Text>
            <TextInput
              accessibilityHint={t("auth.emailSignupHint")}
              accessibilityLabel={t("auth.emailSignupLabel")}
              autoCapitalize="none"
              autoComplete="email"
              editable={!carregando}
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder={t("auth.emailPlaceholder")}
              placeholderTextColor={colors.mutedText}
              returnKeyType="next"
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              textContentType="emailAddress"
              value={email}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.text }]}>{t("auth.password")}</Text>
            <Text style={[styles.helper, { color: colors.secondaryText }]}>
              {t("auth.passwordHelper")}
            </Text>
            <TextInput
              accessibilityHint={t("auth.passwordSignupHint")}
              accessibilityLabel={t("auth.passwordSignupLabel")}
              autoComplete="new-password"
              editable={!carregando}
              onChangeText={setSenha}
              onSubmitEditing={criarConta}
              placeholder={t("auth.signupPasswordPlaceholder")}
              placeholderTextColor={colors.mutedText}
              returnKeyType="done"
              secureTextEntry
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              textContentType="newPassword"
              value={senha}
            />
          </View>

          {erro !== "" && (
            <Text
              accessibilityRole="alert"
              style={[
                styles.error,
                { backgroundColor: colors.dangerBackground, color: colors.danger },
              ]}
            >
              {erro}
            </Text>
          )}

          <AccessibleButton
            accessibilityHint={t("auth.createAccountAndProfileHint")}
            disabled={carregando}
            onPress={criarConta}
          >
            {carregando ? t("auth.creatingAccount") : t("auth.createAccount")}
          </AccessibleButton>

          <FocusablePressable
            accessibilityHint={t("profile.loginHint")}
            accessibilityLabel={t("auth.haveAccount")}
            accessibilityRole="button"
            disabled={carregando}
            hitSlop={8}
            onPress={() => router.push("/login")}
            style={({ pressed }) => [
              styles.linkButton,
              { opacity: carregando ? 0.5 : pressed ? 0.72 : 1 },
            ]}
          >
            <Text style={[styles.linkText, { color: colors.text }]}>{t("auth.haveAccount")}</Text>
          </FocusablePressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    borderRadius: 28,
    borderWidth: 1,
    elevation: 6,
    padding: 22,
    shadowOffset: { height: 14, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
  },
  backButton: {
    alignSelf: "flex-start",
    justifyContent: "center",
    marginBottom: 14,
    minHeight: 44,
    paddingHorizontal: 4,
  },
  backText: {
    fontSize: 15,
    fontWeight: "900",
    textDecorationLine: "underline",
  },
  titulo: {
    fontSize: 31,
    fontWeight: "900",
    letterSpacing: -0.8,
    marginBottom: 8,
  },
  subtitulo: {
    fontSize: 16,
    lineHeight: 23,
    marginBottom: 24,
  },
  fieldGroup: {
    gap: 8,
    marginBottom: 14,
  },
  label: {
    fontSize: 15,
    fontWeight: "900",
  },
  helper: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 16,
  },
  error: {
    borderRadius: 14,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
    marginBottom: 14,
    padding: 12,
  },
  linkButton: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
    minHeight: 48,
  },
  languageToggle: {
    alignSelf: "center",
    marginBottom: 18,
  },
  linkText: {
    fontSize: 16,
    fontWeight: "900",
    textDecorationLine: "underline",
  },
});
