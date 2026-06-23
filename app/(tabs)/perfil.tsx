import { AccessibleButton } from "@/components/accessible-button";
import { FocusablePressable } from "@/components/focusable-pressable";
import { LanguageToggle } from "@/components/language-toggle";
import { LanguageContext } from "@/src/context/LanguageContext";
import { UsuarioContext } from "@/src/context/UsuarioContext";
import { ThemeContext } from "@/src/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { useContext, useRef, useState } from "react";
import {
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Perfil() {
  const { language, t } = useContext(LanguageContext);
  const { colors } = useContext(ThemeContext);
  const { usuario, logout, atualizarFotoPerfil } = useContext(UsuarioContext);

  const [mostrarCamera, setMostrarCamera] = useState(false);
  const [tipoCamera, setTipoCamera] = useState<"front" | "back">("back");
  const [erroCamera, setErroCamera] = useState("");
  const [, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const secoesConta = usuario
    ? [
        {
          badge: usuario.nome && usuario.cpf ? t("profile.complete") : t("profile.pending"),
          icon: "person-circle" as keyof typeof Ionicons.glyphMap,
          route: "/dados-conta?secao=pessoal",
          title: t("account.personal"),
        },
        {
          badge: usuario.enderecoPadrao ? t("profile.complete") : t("profile.pending"),
          icon: "location" as keyof typeof Ionicons.glyphMap,
          route: "/dados-conta?secao=endereco",
          title: t("account.address"),
        },
        {
          badge: usuario.cartaoPadrao ? t("profile.complete") : t("profile.pending"),
          icon: "card" as keyof typeof Ionicons.glyphMap,
          route: "/dados-conta?secao=cartao",
          title: t("account.card"),
        },
        {
          icon: "receipt" as keyof typeof Ionicons.glyphMap,
          route: "/historico",
          title: t("profile.history"),
        },
      ]
    : [];
  async function tirarFoto() {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      atualizarFotoPerfil(photo.uri);
      setMostrarCamera(false);
    }
  }

  function trocarCamera() {
    setTipoCamera((prev) => (prev === "back" ? "front" : "back"));
  }

  async function abrirCamera() {
    const status = await requestPermission();

    if (status.granted) {
      setErroCamera("");
      setMostrarCamera(true);
      return;
    }

    setErroCamera(t("profile.cameraPermissionError"));
  }

  if (!usuario) {
    return (
      <SafeAreaView
        edges={["top", "left", "right"]}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View
          style={[
            styles.accessCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              shadowColor: colors.shadow,
            },
          ]}
        >
          <Text accessibilityRole="header" style={[styles.titulo, { color: colors.text }]}>{t("profile.title")}</Text>
          <Text style={[styles.subtitulo, { color: colors.secondaryText }]}>{t("profile.loginText")}</Text>

          <AccessibleButton
            accessibilityHint={t("profile.loginHint")}
            onPress={() => router.push("/login")}
          >
            {t("common.login")}
          </AccessibleButton>

          <AccessibleButton
            accessibilityHint={t("profile.signupHint")}
            onPress={() => router.push("/cadastro")}
            style={styles.secondaryButton}
            variant="secondary"
          >
            {t("profile.signup")}
          </AccessibleButton>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleRow}>
          <Text accessibilityRole="header" style={[styles.titulo, { color: colors.text }]}>
            {t("profile.title")}
          </Text>
          <LanguageToggle compact />
        </View>

        <View
          style={[
            styles.profileCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              shadowColor: colors.shadow,
            },
          ]}
        >
          <View style={styles.avatarWrap}>
            {usuario.fotoPerfil ? (
              <Image
                accessibilityLabel={t("profile.profilePhoto")}
                accessibilityRole="image"
                source={{ uri: usuario.fotoPerfil }}
                style={styles.foto}
              />
            ) : (
              <View
                accessibilityLabel={t("profile.noPhoto")}
                accessibilityRole="image"
                style={[styles.foto, styles.avatarPlaceholder, { backgroundColor: colors.backgroundSoft }]}
              >
                <Text style={[styles.avatarInitials, { color: colors.text }]}>BT</Text>
              </View>
            )}

            <View style={styles.profileInfo}>
              <Text style={[styles.emailLabel, { color: colors.mutedText }]}>{t("profile.account")}</Text>
              <Text style={[styles.email, { color: colors.text }]}>{usuario.email}</Text>
            </View>
          </View>

          {erroCamera !== "" && (
            <Text
              accessibilityRole="alert"
              style={[
                styles.error,
                { backgroundColor: colors.dangerBackground, color: colors.danger },
              ]}
            >
              {erroCamera}
            </Text>
          )}

          <AccessibleButton
            accessibilityHint={t("profile.addPhotoHint")}
            onPress={abrirCamera}
            variant="secondary"
          >
            {t("profile.addPhoto")}
          </AccessibleButton>
        </View>

        {!usuario.perfilCompleto && (
          <View
            accessibilityRole="summary"
            style={[
              styles.profileHintCard,
              { backgroundColor: colors.successBackground, borderColor: colors.success },
            ]}
          >
            <Text style={[styles.profileHintTitle, { color: colors.text }]}>{t("profile.completeData")}</Text>
            <Text style={[styles.profileHintText, { color: colors.secondaryText }]}>{t("profile.completeDataText")}</Text>
          </View>
        )}

        <View
          accessibilityRole="menu"
          style={[
            styles.accountMenu,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              shadowColor: colors.shadow,
            },
          ]}
        >
          <View style={styles.accountMenuHeader}>
            <View>
              <Text style={[styles.menuEyebrow, { color: colors.accent }]}>
                {t("account.myAccount")}
              </Text>
              <Text style={[styles.menuTitle, { color: colors.text }]}>
                {t("profile.data")}
              </Text>
            </View>
          </View>

          <View style={styles.accountSectionList}>
            {secoesConta.map((secaoConta) => (
              <FocusablePressable
                accessibilityHint={
                  secaoConta.route === "/historico"
                    ? language === "en"
                      ? "Opens purchase history."
                      : "Abre o historico de compras."
                    : t("account.saveHint")
                }
                accessibilityLabel={secaoConta.title}
                accessibilityRole="menuitem"
                hitSlop={6}
                key={secaoConta.title}
                onPress={() => router.push(secaoConta.route as never)}
                style={({ pressed }) => [
                  styles.accountSection,
                  {
                    backgroundColor: colors.backgroundSoft,
                    borderColor: colors.border,
                    opacity: pressed ? 0.82 : 1,
                  },
                ]}
              >
                <View style={[styles.dataIcon, { backgroundColor: colors.accent }]}>
                  <Ionicons
                    accessibilityElementsHidden
                    importantForAccessibility="no"
                    name={secaoConta.icon}
                    size={24}
                    color={colors.accentText}
                  />
                </View>

                <View style={styles.dataInfo}>
                  <View style={styles.dataHeader}>
                    <Text style={[styles.dataTitle, { color: colors.text }]}>
                      {secaoConta.title}
                    </Text>
                    {secaoConta.badge && (
                      <View style={[styles.statusBadge, { backgroundColor: colors.card }]}>
                        <Text style={[styles.statusText, { color: colors.text }]}>
                          {secaoConta.badge}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <Ionicons
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                  name="chevron-forward"
                  size={22}
                  color={colors.secondaryText}
                />
              </FocusablePressable>
            ))}
          </View>
        </View>

        {usuario.admin && Platform.OS === "web" && (
          <FocusablePressable
            accessibilityHint={
              language === "en"
                ? "Opens the web administrative panel."
                : "Abre o painel administrativo web."
            }
            accessibilityLabel="Admin Web BlackTone"
            accessibilityRole="button"
            hitSlop={6}
            onPress={() => router.push("/admin-web" as never)}
            style={({ pressed }) => [
              styles.dataCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: pressed ? 0.84 : 1,
                shadowColor: colors.shadow,
              },
            ]}
          >
            <View style={[styles.dataIcon, { backgroundColor: colors.accent }]}>
              <Ionicons
                accessibilityElementsHidden
                importantForAccessibility="no"
                name="shield-checkmark"
                size={28}
                color={colors.accentText}
              />
            </View>

            <View style={styles.dataInfo}>
              <Text style={[styles.dataTitle, { color: colors.text }]}>
                Admin Web BlackTone
              </Text>
              <Text style={[styles.dataDescription, { color: colors.secondaryText }]}>
                {language === "en"
                  ? "Open the browser backoffice."
                  : "Abra o backoffice no navegador."}
              </Text>
            </View>

            <Ionicons
              accessibilityElementsHidden
              importantForAccessibility="no"
              name="chevron-forward"
              size={22}
              color={colors.secondaryText}
            />
          </FocusablePressable>
        )}
        <AccessibleButton
          accessibilityHint={t("profile.logoutHint")}
          onPress={logout}
          style={styles.logoutButton}
          variant="danger"
        >
          {t("profile.logout")}
        </AccessibleButton>
      </ScrollView>

      <Modal
        animationType="slide"
        onRequestClose={() => setMostrarCamera(false)}
        visible={mostrarCamera}
      >
        <View accessibilityViewIsModal style={styles.cameraModal}>
          <CameraView ref={cameraRef} facing={tipoCamera} style={styles.camera} />

          <View style={styles.cameraActions}>
            <FocusablePressable
              accessibilityHint={t("profile.takePhotoHint")}
              accessibilityLabel={t("profile.takePhoto")}
              accessibilityRole="button"
              hitSlop={8}
              onPress={tirarFoto}
              style={({ pressed }) => [styles.botaoCamera, { opacity: pressed ? 0.82 : 1 }]}
            >
              <Text style={styles.textoCamera}>{t("profile.takePhoto")}</Text>
            </FocusablePressable>

            <FocusablePressable
              accessibilityHint={t("profile.switchCameraHint")}
              accessibilityLabel={t("profile.switchCamera")}
              accessibilityRole="button"
              hitSlop={8}
              onPress={trocarCamera}
              style={({ pressed }) => [styles.botaoCamera, { opacity: pressed ? 0.82 : 1 }]}
            >
              <Text style={styles.textoCamera}>{t("profile.switchCamera")}</Text>
            </FocusablePressable>

            <FocusablePressable
              accessibilityHint={t("profile.cancelPhotoHint")}
              accessibilityLabel={t("profile.cancelPhoto")}
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => setMostrarCamera(false)}
              style={({ pressed }) => [
                styles.botaoCamera,
                styles.botaoCameraDanger,
                { opacity: pressed ? 0.82 : 1 },
              ]}
            >
              <Text style={styles.textoCamera}>{t("common.cancel")}</Text>
            </FocusablePressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  accessCard: {
    borderRadius: 28,
    borderWidth: 1,
    elevation: 6,
    marginTop: 70,
    padding: 22,
    shadowOffset: { height: 14, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
  },
  avatarInitials: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 1,
  },
  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatarWrap: {
    alignItems: "center",
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  botaoCamera: {
    alignItems: "center",
    backgroundColor: "#111827",
    borderRadius: 16,
    justifyContent: "center",
    minHeight: 52,
    padding: 14,
  },
  botaoCameraDanger: {
    backgroundColor: "#991B1B",
  },
  camera: {
    flex: 1,
  },
  cameraActions: {
    bottom: 30,
    gap: 12,
    left: 20,
    position: "absolute",
    right: 20,
  },
  cameraModal: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  content: {
    paddingBottom: 34,
  },
  accountMenu: {
    borderRadius: 28,
    borderWidth: 1,
    elevation: 5,
    gap: 14,
    marginTop: 16,
    padding: 16,
    shadowOffset: { height: 12, width: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 22,
  },
  accountMenuHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  accountSection: {
    alignItems: "center",
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 92,
    padding: 12,
  },
  accountSectionList: {
    gap: 10,
  },
  dataCard: {
    alignItems: "center",
    borderRadius: 26,
    borderWidth: 1,
    elevation: 5,
    flexDirection: "row",
    gap: 14,
    marginTop: 16,
    padding: 16,
    shadowOffset: { height: 12, width: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 22,
  },
  dataDescription: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
    marginTop: 4,
  },
  dataHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  dataIcon: {
    alignItems: "center",
    borderRadius: 18,
    height: 54,
    justifyContent: "center",
    width: 54,
  },
  dataInfo: {
    flex: 1,
  },
  dataTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "900",
  },
  email: {
    fontSize: 17,
    fontWeight: "900",
    marginTop: 4,
  },
  emailLabel: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  error: {
    borderRadius: 14,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 21,
    marginBottom: 14,
    padding: 12,
  },
  foto: {
    borderRadius: 42,
    height: 84,
    width: 84,
  },
  logoutButton: {
    marginTop: 22,
  },
  menuEyebrow: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  menuTitle: {
    fontSize: 22,
    fontWeight: "900",
  },
  profileCard: {
    borderRadius: 28,
    borderWidth: 1,
    elevation: 5,
    marginTop: 12,
    padding: 18,
    shadowOffset: { height: 12, width: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 22,
  },
  profileHintCard: {
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 16,
    padding: 16,
  },
  profileHintText: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    marginTop: 6,
  },
  profileHintTitle: {
    fontSize: 17,
    fontWeight: "900",
  },
  profileInfo: {
    flex: 1,
  },
  secondaryButton: {
    marginTop: 12,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  subtitulo: {
    fontSize: 16,
    lineHeight: 23,
    marginBottom: 22,
  },
  textoCamera: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },
  titulo: {
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -0.7,
    marginBottom: 8,
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
});
