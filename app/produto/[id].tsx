import { AccessibleButton } from "@/components/accessible-button";
import { FocusablePressable } from "@/components/focusable-pressable";
import { CarrinhoContext } from "@/src/context/CarrinhoContext";
import { LanguageContext } from "@/src/context/LanguageContext";
import { ProdutosContext } from "@/src/context/ProdutosContext";
import { ThemeContext } from "@/src/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useContext } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Produto() {
  const { id } = useLocalSearchParams();
  const { language, t } = useContext(LanguageContext);
  const { colors } = useContext(ThemeContext);
  const { adicionarProduto } = useContext(CarrinhoContext);
  const { produtos } = useContext(ProdutosContext);

  const produto = produtos.find((p) => p.id === id);

  if (!produto) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
        <Text accessibilityRole="header" style={[styles.nome, { color: colors.text }]}>{t("product.notFound")}</Text>
        <AccessibleButton
          accessibilityHint={t("auth.backHint")}
          onPress={() => router.back()}
          variant="secondary"
        >{t("common.back")}</AccessibleButton>
      </SafeAreaView>
    );
  }

  function adicionarCarrinho() {
    if (!produto) return;

    adicionarProduto(produto);
    router.push("/(tabs)/carrinho");
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <FocusablePressable
          accessibilityHint={t("product.backHint")}
          accessibilityLabel={t("common.back")}
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              opacity: pressed ? 0.84 : 1,
            },
          ]}
        >
          <Ionicons
            accessibilityElementsHidden
            importantForAccessibility="no"
            name="arrow-back"
            size={18}
            color={colors.text}
          />
          <Text style={[styles.backText, { color: colors.text }]}>{t("common.back")}</Text>
        </FocusablePressable>

        <View
          style={[
            styles.imageCard,
            {
              backgroundColor: colors.cardStrong,
              borderColor: colors.border,
              shadowColor: colors.shadow,
            },
          ]}
        >
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={[styles.imageHalo, { backgroundColor: colors.accent }]}
          />
          <Image
            accessibilityLabel={language === "en" ? `Product image ${produto.nome}` : `Imagem do produto ${produto.nome}`}
            accessibilityRole="image"
            source={produto.imagem}
            style={styles.image}
          />
        </View>

        <View style={styles.infoContainer}>
          <Text style={[styles.category, { color: colors.accentStrong }]}> 
            {produto.categoria}
          </Text>

          <Text accessibilityRole="header" style={[styles.nome, { color: colors.text }]}> 
            {produto.nome}
          </Text>

          <Text style={[styles.descricao, { color: colors.secondaryText }]}> 
            {produto.descricao}
          </Text>

          <View
            style={[
              styles.priceCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View>
              <Text style={[styles.priceLabel, { color: colors.mutedText }]}>{t("common.price")}</Text>
              <Text style={[styles.preco, { color: colors.text }]}>{produto.preco}</Text>
            </View>
            <Text style={[styles.installment, { color: colors.secondaryText }]}>{t("home.installments")}</Text>
          </View>

          <AccessibleButton
            accessibilityHint={language === "en" ? `Adds ${produto.nome} to the cart and opens the cart.` : `Adiciona ${produto.nome} ao carrinho e abre o carrinho.`}
            accessibilityLabel={language === "en" ? `Add ${produto.nome} to cart` : `Adicionar ${produto.nome} ao carrinho`}
            onPress={adicionarCarrinho}
            style={styles.botaoCarrinho}
          >{t("product.addToCart")}</AccessibleButton>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 36,
  },
  backButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 14,
  },
  backText: {
    fontSize: 15,
    fontWeight: "900",
  },
  imageCard: {
    alignItems: "center",
    borderRadius: 30,
    borderWidth: 1,
    elevation: 6,
    justifyContent: "center",
    marginTop: 18,
    minHeight: 330,
    overflow: "hidden",
    padding: 22,
    shadowOffset: { height: 14, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
  },
  imageHalo: {
    borderRadius: 170,
    height: 260,
    opacity: 0.14,
    position: "absolute",
    width: 260,
  },
  image: {
    height: 280,
    resizeMode: "contain",
    width: "100%",
  },
  infoContainer: {
    marginTop: 24,
  },
  category: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  nome: {
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -0.8,
    lineHeight: 39,
    marginBottom: 12,
  },
  descricao: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 18,
  },
  priceCard: {
    alignItems: "center",
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
  },
  priceLabel: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  preco: {
    fontSize: 27,
    fontWeight: "900",
    marginTop: 2,
  },
  installment: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
    maxWidth: 130,
    textAlign: "right",
  },
  botaoCarrinho: {
    marginTop: 18,
  },
});
