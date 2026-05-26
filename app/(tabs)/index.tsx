import { FocusablePressable } from "@/components/focusable-pressable";
import { ProdutosContext } from "@/src/context/ProdutosContext";
import { ThemeContext } from "@/src/context/ThemeContext";
import { Produto } from "@/src/data/produto";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useContext } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Home() {
  const { colors, theme, toggleTheme } = useContext(ThemeContext);
  const { carregando, erro, origem, produtos } = useContext(ProdutosContext);

  function renderHeader() {
    const themeLabel = theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro";

    return (
      <View style={styles.headerWrap}>
        <View
          style={[
            styles.hero,
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
            style={[styles.heroGlow, { backgroundColor: colors.accentStrong }]}
          />

          <View style={styles.topBar}>
            <View style={[styles.brandMark, { backgroundColor: colors.accent }]}>
              <Text
                accessibilityElementsHidden
                importantForAccessibility="no"
                style={[styles.brandMarkText, { color: colors.accentText }]}
              >
                BT
              </Text>
            </View>

            <FocusablePressable
              accessibilityHint="Alterna entre o tema claro e o tema escuro."
              accessibilityLabel={themeLabel}
              accessibilityRole="button"
              hitSlop={8}
              onPress={toggleTheme}
              style={({ pressed }) => [
                styles.themeButton,
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
                name={theme === "dark" ? "sunny" : "moon"}
                size={18}
                color={colors.text}
              />
              <Text style={[styles.themeButtonText, { color: colors.text }]}>
                {theme === "dark" ? "Claro" : "Escuro"}
              </Text>
            </FocusablePressable>
          </View>

          <Text style={[styles.eyebrow, { color: colors.accent }]}>
            Loja Musical
          </Text>
          <Text accessibilityRole="header" style={[styles.logo, { color: colors.text }]}>
            BlackTone Music
          </Text>
          <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
            Instrumentos, vinis e acessórios selecionados para quem vive música todos os dias.
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.text }]}>
            Destaques da loja
          </Text>
          <Text style={[styles.sectionMeta, { color: colors.mutedText }]}>
            {carregando ? "Carregando" : `${produtos.length} itens`}
          </Text>
        </View>

        {erro !== "" && (
          <Text
            accessibilityLiveRegion="polite"
            style={[styles.dataStatus, { color: colors.secondaryText }]}
          >
            Usando produtos locais enquanto o Firestore e configurado.
          </Text>
        )}

        {erro === "" && origem === "firestore" && (
          <Text
            accessibilityLiveRegion="polite"
            style={[styles.dataStatus, { color: colors.secondaryText }]}
          >
            Produtos carregados do Firestore.
          </Text>
        )}
      </View>
    );
  }

  function renderItem({ item }: { item: Produto }) {
    return (
      <FocusablePressable
        accessibilityHint="Abre a tela de detalhes do produto."
        accessibilityLabel={`Abrir detalhes de ${item.nome}, ${item.categoria}, preço ${item.preco}`}
        accessibilityRole="button"
        hitSlop={6}
        onPress={() => router.push(`/produto/${item.id}`)}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            shadowColor: colors.shadow,
            opacity: pressed ? 0.9 : 1,
          },
        ]}
      >
        <View style={[styles.imageShell, { backgroundColor: colors.backgroundSoft }]}> 
          <Image
            accessibilityLabel={`Imagem do produto ${item.nome}`}
            accessibilityRole="image"
            source={item.imagem}
            style={styles.image}
          />
        </View>

        <Text style={[styles.category, { color: colors.accentStrong }]}> 
          {item.categoria}
        </Text>

        <Text style={[styles.productName, { color: colors.text }]}>
          {item.nome}
        </Text>

        <Text style={[styles.description, { color: colors.secondaryText }]} numberOfLines={2}>
          {item.descricao}
        </Text>

        <Text style={[styles.price, { color: colors.text }]}>{item.preco}</Text>

        <Text style={[styles.installment, { color: colors.mutedText }]}> 
          10x sem juros no cartão
        </Text>
      </FocusablePressable>
    );
  }

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <FlatList
        accessibilityLabel="Lista de produtos em destaque"
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.productsContainer}
        data={produtos}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        numColumns={2}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerWrap: {
    gap: 22,
    paddingBottom: 10,
  },
  hero: {
    borderRadius: 28,
    borderWidth: 1,
    elevation: 6,
    overflow: "hidden",
    padding: 22,
    shadowOffset: { height: 14, width: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
  },
  heroGlow: {
    borderRadius: 120,
    height: 180,
    opacity: 0.16,
    position: "absolute",
    right: -70,
    top: -70,
    width: 180,
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 34,
  },
  brandMark: {
    alignItems: "center",
    borderRadius: 18,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  brandMarkText: {
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 1,
  },
  themeButton: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 14,
  },
  themeButtonText: {
    fontSize: 14,
    fontWeight: "800",
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  logo: {
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: -1,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    marginTop: 12,
  },
  sectionHeader: {
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "900",
  },
  sectionMeta: {
    fontSize: 14,
    fontWeight: "700",
  },
  dataStatus: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
    marginTop: -12,
  },
  productsContainer: {
    padding: 18,
    paddingBottom: 32,
  },
  columnWrapper: {
    gap: 12,
  },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    elevation: 3,
    flex: 1,
    marginBottom: 12,
    minHeight: 310,
    padding: 14,
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
  },
  imageShell: {
    alignItems: "center",
    borderRadius: 18,
    height: 128,
    justifyContent: "center",
    marginBottom: 12,
  },
  image: {
    height: 112,
    resizeMode: "contain",
    width: "100%",
  },
  category: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.7,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  productName: {
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 21,
  },
  description: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
  },
  price: {
    fontSize: 19,
    fontWeight: "900",
    marginTop: 14,
  },
  installment: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },
});
