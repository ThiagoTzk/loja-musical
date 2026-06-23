import { AccessibleButton } from "@/components/accessible-button";
import { FocusablePressable } from "@/components/focusable-pressable";
import { LanguageContext } from "@/src/context/LanguageContext";
import { ThemeContext } from "@/src/context/ThemeContext";
import { UsuarioContext } from "@/src/context/UsuarioContext";
import { resolverImagemProduto } from "@/src/data/produto";
import {
  listarPedidosUsuarioFirestore,
  Pedido,
  PedidoStatus,
} from "@/src/services/firestore";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useContext, useEffect, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
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
  const separador = language === "en" ? " at " : " as ";

  return `${textos.prefixo} ${data.toLocaleDateString(locale)}${separador}${data.toLocaleTimeString(
    locale,
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  )}`;
}

export default function Historico() {
  const { language, t } = useContext(LanguageContext);
  const { colors } = useContext(ThemeContext);
  const { usuario } = useContext(UsuarioContext);

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [carregandoPedidos, setCarregandoPedidos] = useState(false);
  const [erroPedidos, setErroPedidos] = useState("");

  const usandoFirestore = Boolean(usuario?.uid && usuario?.idToken);
  const totalHistorico = usandoFirestore
    ? pedidos.reduce(
        (total, pedido) =>
          total + pedido.itens.reduce((subtotal, item) => subtotal + item.quantidade, 0),
        0
      )
    : usuario?.historico.reduce((total, item) => total + (item.quantidade ?? 1), 0) ?? 0;
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
      console.warn("Nao foi possivel carregar pedidos do Firestore.", error);
      setErroPedidos(t("profile.ordersLoadError"));
    } finally {
      setCarregandoPedidos(false);
    }
  }, [t, usuario]);

  useEffect(() => {
    void carregarPedidos();
  }, [carregarPedidos]);

  if (!usuario) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
            {t("profile.history")}
          </Text>
          <Text style={[styles.description, { color: colors.secondaryText }]}>
            {t("profile.loginText")}
          </Text>
          <AccessibleButton onPress={() => router.replace("/login")}>
            {t("common.goToLogin")}
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
        <FocusablePressable
          accessibilityHint={t("account.backHint")}
          accessibilityLabel={t("common.back")}
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.72 : 1 }]}
        >
          <Ionicons name="chevron-back" size={20} color={colors.text} />
          <Text style={[styles.backText, { color: colors.text }]}>{t("common.back")}</Text>
        </FocusablePressable>

        <View style={[styles.hero, { backgroundColor: colors.cardStrong, borderColor: colors.border }]}>
          <View style={[styles.heroIcon, { backgroundColor: colors.accent }]}>
            <Ionicons name="receipt" size={34} color={colors.accentText} />
          </View>
          <View style={styles.heroText}>
            <Text style={[styles.kicker, { color: colors.accent }]}>
              {t("account.myAccount")}
            </Text>
            <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
              {t("profile.history")}
            </Text>
            <Text style={[styles.description, { color: colors.secondaryText }]}>
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
                    <Text style={[styles.historyQuantity, { color: colors.secondaryText }]}>
                      {language === "en"
                        ? `Quantity: ${item.quantidade}`
                        : `Quantidade: ${item.quantidade}`}
                    </Text>
                  </View>
                </View>
              ))}
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
                <Text style={[styles.historyQuantity, { color: colors.secondaryText }]}>
                  {language === "en"
                    ? `Quantity: ${item.quantidade ?? 1}`
                    : `Quantidade: ${item.quantidade ?? 1}`}
                </Text>
              </View>
            </View>
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 6,
    marginBottom: 16,
    minHeight: 44,
  },
  backText: {
    fontSize: 16,
    fontWeight: "900",
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 38,
  },
  description: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
    marginTop: 6,
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
  hero: {
    alignItems: "center",
    borderRadius: 28,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    marginBottom: 16,
    padding: 18,
  },
  heroIcon: {
    alignItems: "center",
    borderRadius: 18,
    height: 58,
    justifyContent: "center",
    width: 58,
  },
  heroText: {
    flex: 1,
  },
  historyCategory: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 3,
  },
  historyDate: {
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
    marginTop: 6,
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
  historyQuantity: {
    fontSize: 12,
    fontWeight: "800",
    marginTop: 3,
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
  kicker: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
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
  title: {
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.6,
    lineHeight: 34,
  },
});
