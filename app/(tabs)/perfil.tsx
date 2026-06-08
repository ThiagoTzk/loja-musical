import { AccessibleButton } from "@/components/accessible-button";
import { FocusablePressable } from "@/components/focusable-pressable";
import { LanguageToggle } from "@/components/language-toggle";
import { LanguageContext } from "@/src/context/LanguageContext";
import {
  formatarEndereco,
  UsuarioContext,
} from "@/src/context/UsuarioContext";
import { ThemeContext } from "@/src/context/ThemeContext";
import { resolverImagemProduto } from "@/src/data/produto";
import {
  atualizarStatusPedidoFirestore,
  excluirPedidoFirestore,
  listarPedidosUsuarioFirestore,
  Pedido,
  PedidoStatus,
} from "@/src/services/firestore";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function formatarDataCompra(
  valor: string,
  language: "pt" | "en",
  textos: { indisponivel: string; prefixo: string }
) {
  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return textos.indisponivel;
  }

  const locale = language === "en" ? "en-US" : "pt-BR";
  const separador = language === "en" ? " at " : " às ";

  return `${textos.prefixo} ${data.toLocaleDateString(locale)}${separador}${data.toLocaleTimeString(
    locale,
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  )}`;
}

export default function Perfil() {
  const { language, t } = useContext(LanguageContext);
  const { colors } = useContext(ThemeContext);
  const { usuario, logout, atualizarFotoPerfil } = useContext(UsuarioContext);

  const [mostrarCamera, setMostrarCamera] = useState(false);
  const [tipoCamera, setTipoCamera] = useState<"front" | "back">("back");
  const [erroCamera, setErroCamera] = useState("");
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [carregandoPedidos, setCarregandoPedidos] = useState(false);
  const [erroPedidos, setErroPedidos] = useState("");
  const [pedidoEmAcao, setPedidoEmAcao] = useState("");

  const [, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const usandoFirestore = Boolean(usuario?.uid && usuario?.idToken);
  const totalHistorico = usandoFirestore
    ? pedidos.reduce((total, pedido) => total + pedido.itens.length, 0)
    : usuario?.historico.length ?? 0;
  const enderecoResumo = formatarEndereco(usuario?.enderecoPadrao);
  const textosDataCompra = {
    indisponivel: t("profile.purchaseDateMissing"),
    prefixo: t("profile.purchasedOn"),
  };
  const statusLabels: Record<PedidoStatus, string> = {
    cancelado: t("profile.statusCanceled"),
    entregue: t("profile.statusDelivered"),
    realizado: t("profile.statusCreated"),
  };

  const carregarPedidos = useCallback(async () => {
    if (!usuario?.uid || !usuario.idToken) {
      setPedidos([]);
      return;
    }

    setCarregandoPedidos(true);
    setErroPedidos("");

    try {
      const pedidosFirestore = await listarPedidosUsuarioFirestore(usuario);
      setPedidos(pedidosFirestore);
    } catch (error) {
      console.warn("Não foi possível carregar pedidos do Firestore.", error);
      setErroPedidos(t("profile.ordersLoadError"));
    } finally {
      setCarregandoPedidos(false);
    }
  }, [t, usuario]);

  useEffect(() => {
    void carregarPedidos();
  }, [carregarPedidos]);

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

  async function atualizarStatusPedido(pedidoId: string, status: PedidoStatus) {
    if (!usuario) return;

    setPedidoEmAcao(pedidoId);
    setErroPedidos("");

    try {
      await atualizarStatusPedidoFirestore(usuario, pedidoId, status);
      await carregarPedidos();
    } catch (error) {
      console.warn("Não foi possível atualizar o pedido no Firestore.", error);
      setErroPedidos(t("profile.orderUpdateError"));
    } finally {
      setPedidoEmAcao("");
    }
  }

  async function excluirPedido(pedidoId: string) {
    if (!usuario) return;

    setPedidoEmAcao(pedidoId);
    setErroPedidos("");

    try {
      await excluirPedidoFirestore(usuario, pedidoId);
      setPedidos((pedidosAtuais) =>
        pedidosAtuais.filter((pedido) => pedido.id !== pedidoId)
      );
    } catch (error) {
      console.warn("Não foi possível excluir o pedido do Firestore.", error);
      setErroPedidos(t("profile.orderDeleteError"));
    } finally {
      setPedidoEmAcao("");
    }
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
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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

        <FocusablePressable
          accessibilityHint={t("account.saveHint")}
          accessibilityLabel={t("profile.data")}
          accessibilityRole="button"
          hitSlop={6}
          onPress={() => router.push("/dados-conta")}
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
              name="person-circle"
              size={30}
              color={colors.accentText}
            />
          </View>

          <View style={styles.dataInfo}>
            <View style={styles.dataHeader}>
              <Text style={[styles.dataTitle, { color: colors.text }]}>{t("profile.data")}</Text>
              <View style={[styles.statusBadge, { backgroundColor: colors.backgroundSoft }]}>
                <Text style={[styles.statusText, { color: colors.text }]}>
                  {usuario.perfilCompleto ? t("profile.complete") : t("profile.pending")}
                </Text>
              </View>
            </View>
            <Text style={[styles.dataDescription, { color: colors.secondaryText }]}>
              {usuario.nome || t("profile.dataDescription")}
            </Text>
            <Text style={[styles.dataDescription, { color: colors.secondaryText }]}>
              {enderecoResumo || t("profile.noAddress")}
            </Text>
            <Text style={[styles.dataDescription, { color: colors.secondaryText }]}>
              {usuario.cartaoPadrao
                ? `${usuario.cartaoPadrao.apelido} ${t("checkout.cardFinal")} ${usuario.cartaoPadrao.ultimos4}`
                : t("profile.cardMissing")}
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

        <View style={styles.historyHeader}>
          <Text accessibilityRole="header" style={[styles.subtituloHistorico, { color: colors.text }]}>
            {t("profile.history")}
          </Text>
          <Text style={[styles.historyCount, { color: colors.mutedText }]}>
            {carregandoPedidos
              ? t("common.loading")
              : `${totalHistorico} ${
                  language === "en"
                    ? totalHistorico === 1
                      ? "item"
                      : "items"
                    : totalHistorico === 1
                      ? "item"
                      : "itens"
                }`}
          </Text>
        </View>

        {erroPedidos !== "" && (
          <Text
            accessibilityRole="alert"
            style={[
              styles.error,
              { backgroundColor: colors.dangerBackground, color: colors.danger },
            ]}
          >
            {erroPedidos}
          </Text>
        )}

        {usandoFirestore && !carregandoPedidos && pedidos.length === 0 && (
          <View
            accessibilityRole="summary"
            style={[
              styles.emptyHistory,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{t("profile.noPurchases")}</Text>
            <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
              {t("profile.noPurchasesText")}
            </Text>
          </View>
        )}

        {usandoFirestore &&
          pedidos.map((pedido) => (
            <View
              key={pedido.id}
              style={[
                styles.pedidoCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.pedidoHeader}>
                <View style={styles.pedidoHeaderInfo}>
                  <Text style={[styles.pedidoTitle, { color: colors.text }]}>
                    {t("profile.order")} #{pedido.id.slice(-6)}
                  </Text>
                  <Text style={[styles.historyDate, { color: colors.secondaryText }]}>
                    {formatarDataCompra(pedido.criadoEm, language, textosDataCompra)}
                  </Text>
                </View>

                <View style={[styles.statusBadge, { backgroundColor: colors.backgroundSoft }]}>
                  <Text style={[styles.statusText, { color: colors.text }]}>
                    {statusLabels[pedido.status] ?? t("profile.statusCreated")}
                  </Text>
                </View>
              </View>

              <Text style={[styles.historyPayment, { color: colors.secondaryText }]}>
                {t("profile.payment")}: {pedido.formaPagamento}
                {pedido.parcelas ? ` ${t("profile.installmentIn")} ${pedido.parcelas}x` : ""} | {t("common.total")}: {pedido.totalTexto}
              </Text>

              {pedido.itens.map((item) => (
                <View
                  key={`${pedido.id}-${item.produtoId}`}
                  style={[
                    styles.itemHistorico,
                    { backgroundColor: colors.backgroundSoft, borderColor: colors.border },
                  ]}
                >
                  <Image
                    accessibilityLabel={language === "en" ? `Product image ${item.nome}` : `Imagem do produto ${item.nome}`}
                    accessibilityRole="image"
                    source={resolverImagemProduto(item.imagemLocal, item.imagemUrl)}
                    style={[styles.imagem, { backgroundColor: colors.backgroundSoft }]}
                  />

                  <View style={styles.historyInfo}>
                    <FocusablePressable
                      accessibilityHint={t("profile.openPurchasedProductHint")}
                      accessibilityLabel={language === "en" ? `Open details for ${item.nome}` : `Abrir detalhes de ${item.nome}`}
                      accessibilityRole="button"
                      hitSlop={6}
                      onPress={() => router.push(`/produto/${item.produtoId}`)}
                      style={({ pressed }) => [
                        styles.historyNameLink,
                        {
                          borderColor: colors.border,
                          opacity: pressed ? 0.78 : 1,
                        },
                      ]}
                    >
                      <Text style={[styles.historyName, { color: colors.text }]}>
                        {item.nome}
                      </Text>
                    </FocusablePressable>
                    <Text style={[styles.historyCategory, { color: colors.secondaryText }]}>
                      {item.categoria}
                    </Text>
                    <Text style={[styles.historyPrice, { color: colors.text }]}>{item.preco}</Text>
                  </View>
                </View>
              ))}

              <View style={styles.historyActions}>
                <AccessibleButton
                  accessibilityHint={t("profile.markDeliveredHint")}
                  disabled={pedido.status === "entregue" || pedidoEmAcao === pedido.id}
                  onPress={() => atualizarStatusPedido(pedido.id, "entregue")}
                  style={styles.historyActionButton}
                  variant="secondary"
                >
                  {pedido.status === "entregue" ? t("profile.orderDelivered") : t("profile.markDelivered")}
                </AccessibleButton>

                <AccessibleButton
                  accessibilityHint={t("profile.deleteHistoryHint")}
                  disabled={pedidoEmAcao === pedido.id}
                  onPress={() => excluirPedido(pedido.id)}
                  style={styles.historyActionButton}
                  variant="danger"
                >{t("profile.deleteHistory")}</AccessibleButton>
              </View>
            </View>
          ))}

        {!usandoFirestore && usuario.historico.length === 0 && (
          <View
            accessibilityRole="summary"
            style={[
              styles.emptyHistory,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{t("profile.noPurchases")}</Text>
            <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
              {t("profile.noPurchasesText")}
            </Text>
          </View>
        )}

        {!usandoFirestore &&
          usuario.historico.map((item, index) => (
            <View
              key={`${item.id}-${index}`}
              style={[
                styles.itemHistorico,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Image
                accessibilityLabel={language === "en" ? `Product image ${item.nome}` : `Imagem do produto ${item.nome}`}
                accessibilityRole="image"
                source={item.imagem}
                style={[styles.imagem, { backgroundColor: colors.backgroundSoft }]}
              />

              <View style={styles.historyInfo}>
                <FocusablePressable
                  accessibilityHint={t("profile.openPurchasedProductHint")}
                  accessibilityLabel={language === "en" ? `Open details for ${item.nome}` : `Abrir detalhes de ${item.nome}`}
                  accessibilityRole="button"
                  hitSlop={6}
                  onPress={() => router.push(`/produto/${item.id}`)}
                  style={({ pressed }) => [
                    styles.historyNameLink,
                    {
                      borderColor: colors.border,
                      opacity: pressed ? 0.78 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.historyName, { color: colors.text }]}>{item.nome}</Text>
                </FocusablePressable>
                <Text style={[styles.historyCategory, { color: colors.secondaryText }]}>
                  {item.categoria}
                </Text>
                <Text style={[styles.historyDate, { color: colors.secondaryText }]}>
                  {formatarDataCompra(item.compradoEm, language, textosDataCompra)}
                </Text>
                <Text style={[styles.historyPayment, { color: colors.secondaryText }]}>
                  {t("profile.payment")}: {item.formaPagamento}
                  {item.parcelas ? ` ${t("profile.installmentIn")} ${item.parcelas}x` : ""}
                </Text>
                <Text style={[styles.historyPrice, { color: colors.text }]}>{item.preco}</Text>
              </View>
            </View>
          ))}
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
  emptyHistory: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
  },
  emptyText: {
    fontSize: 15,
    lineHeight: 22,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 8,
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
  historyActionButton: {
    width: "100%",
  },
  historyActions: {
    gap: 10,
    marginTop: 2,
  },
  historyCategory: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 3,
  },
  historyCount: {
    fontSize: 14,
    fontWeight: "800",
  },
  historyDate: {
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
    marginTop: 6,
  },
  historyHeader: {
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    marginTop: 26,
  },
  historyInfo: {
    flex: 1,
  },
  historyName: {
    fontSize: 16,
    fontWeight: "900",
  },
  historyNameLink: {
    alignSelf: "flex-start",
    borderBottomWidth: 1,
    paddingBottom: 2,
  },
  historyPayment: {
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
    marginTop: 2,
  },
  historyPrice: {
    fontSize: 15,
    fontWeight: "900",
    marginTop: 6,
  },
  imagem: {
    borderRadius: 14,
    height: 68,
    resizeMode: "contain",
    width: 68,
  },
  itemHistorico: {
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
    padding: 12,
  },
  logoutButton: {
    marginTop: 22,
  },
  pedidoCard: {
    borderRadius: 22,
    borderWidth: 1,
    gap: 12,
    marginBottom: 14,
    padding: 14,
  },
  pedidoHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  pedidoHeaderInfo: {
    flex: 1,
  },
  pedidoTitle: {
    fontSize: 17,
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
  subtituloHistorico: {
    flex: 1,
    fontSize: 22,
    fontWeight: "900",
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
