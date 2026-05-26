import { AccessibleButton } from "@/components/accessible-button";
import { FocusablePressable } from "@/components/focusable-pressable";
import { entrarUsuarioFirebase } from "@/src/config/firebase-config";
import { ThemeContext } from "@/src/context/ThemeContext";
import { UsuarioContext } from "@/src/context/UsuarioContext";
import { atualizarLoginUsuarioFirestore } from "@/src/services/firestore";
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

export default function Login() {
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
      erros.push("Informe seu email.");
    } else if (!emailValido(emailLimpo)) {
      erros.push("Digite um email no formato exemplo@exemplo.com.");
    }

    if (!senha) {
      erros.push("Informe sua senha.");
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

  async function entrar() {
    if (carregando) return;

    const erroFormulario = validarFormulario();

    if (erroFormulario) {
      setErro(erroFormulario);
      return;
    }

    const emailLimpo = email.trim();

    setCarregando(true);
    setErro("");

    try {
      const credencial = await entrarUsuarioFirebase(emailLimpo, senha);

      try {
        await atualizarLoginUsuarioFirestore(credencial);
      } catch (syncError) {
        console.warn("Nao foi possivel atualizar o usuario no Firestore.", syncError);
      }

      sincronizarUsuario({
        email: credencial.email ?? emailLimpo,
        idToken: credencial.idToken,
        refreshToken: credencial.refreshToken,
        uid: credencial.localId,
      });
      router.replace("/(tabs)/perfil");
    } catch (error) {
      setErro(descreverErroFirebaseAuth(error, "login"));
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
            accessibilityHint="Volta para a tela anterior."
            accessibilityLabel="Voltar"
            accessibilityRole="button"
            disabled={carregando}
            hitSlop={8}
            onPress={voltar}
            style={({ pressed }) => [
              styles.backButton,
              { opacity: carregando ? 0.5 : pressed ? 0.72 : 1 },
            ]}
          >
            <Text style={[styles.backText, { color: colors.text }]}>Voltar</Text>
          </FocusablePressable>

          <Text accessibilityRole="header" style={[styles.titulo, { color: colors.text }]}>
            Entrar na BlackTone
          </Text>
          <Text style={[styles.subtitulo, { color: colors.secondaryText }]}>
            Acesse sua conta para concluir compras e acompanhar o historico.
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Email</Text>
            <TextInput
              accessibilityHint="Digite seu email cadastrado."
              accessibilityLabel="Email"
              autoCapitalize="none"
              autoComplete="email"
              editable={!carregando}
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="seuemail@exemplo.com"
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
            <Text style={[styles.label, { color: colors.text }]}>Senha</Text>
            <TextInput
              accessibilityHint="Digite sua senha."
              accessibilityLabel="Senha"
              autoComplete="password"
              editable={!carregando}
              onChangeText={setSenha}
              onSubmitEditing={entrar}
              placeholder="Sua senha"
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
              textContentType="password"
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
            accessibilityHint="Entra na sua conta."
            disabled={carregando}
            onPress={entrar}
          >
            {carregando ? "Entrando..." : "Entrar"}
          </AccessibleButton>

          <FocusablePressable
            accessibilityHint="Abre a tela de cadastro."
            accessibilityLabel="Criar conta"
            accessibilityRole="button"
            disabled={carregando}
            hitSlop={8}
            onPress={() => router.push("/cadastro")}
            style={({ pressed }) => [
              styles.linkButton,
              { opacity: carregando ? 0.5 : pressed ? 0.72 : 1 },
            ]}
          >
            <Text style={[styles.linkText, { color: colors.text }]}>Criar conta</Text>
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
  linkText: {
    fontSize: 16,
    fontWeight: "900",
    textDecorationLine: "underline",
  },
});
