import { AccessibleButton } from "@/components/accessible-button";
import { FocusablePressable } from "@/components/focusable-pressable";
import { CarrinhoContext } from "@/src/context/CarrinhoContext";
import { ThemeContext } from "@/src/context/ThemeContext";
import { UsuarioContext } from "@/src/context/UsuarioContext";
import { formatarMoeda, precoParaNumero } from "@/src/utils/preco";
import { router } from "expo-router";
import { useContext } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Carrinho() {
  const { colors } = useContext(ThemeContext);
  const { carrinho, removerProduto } = useContext(CarrinhoContext);
  const { usuario } = useContext(UsuarioContext);

  function finalizarCompra() {
    if (!usuario) {
      router.push("/login");
      return;
    }

    router.push("/pagamento");
  }

  const total = carrinho.reduce((acc, item) => acc + precoParaNumero(item.preco), 0);

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text accessibilityRole="header" style={[styles.titulo, { color: colors.text }]}> 
          Carrinho
        </Text>

        <Text style={[styles.subtitulo, { color: colors.secondaryText }]}> 
          Revise os itens antes de seguir para o pagamento.
        </Text>

        {carrinho.length === 0 && (
          <View
            accessibilityRole="summary"
            style={[
              styles.emptyState,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Carrinho vazio</Text>
            <Text style={[styles.emptyText, { color: colors.secondaryText }]}> 
              Explore a loja e adicione seus instrumentos ou álbuns favoritos.
            </Text>
            <AccessibleButton
              accessibilityHint="Volta para a lista de produtos."
              onPress={() => router.push("/(tabs)")}
              style={styles.emptyButton}
            >
              Ver produtos
            </AccessibleButton>
          </View>
        )}

        {carrinho.map((item, index) => (
          <View
            key={`${item.id}-${index}`}
            style={[
              styles.produto,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                shadowColor: colors.shadow,
              },
            ]}
          >
            <Image
              accessibilityLabel={`Imagem do produto ${item.nome}`}
              accessibilityRole="image"
              source={item.imagem}
              style={[styles.imagem, { backgroundColor: colors.backgroundSoft }]}
            />

            <View style={styles.infoProduto}>
              <Text style={[styles.productName, { color: colors.text }]}>{item.nome}</Text>
              <Text style={[styles.productCategory, { color: colors.secondaryText }]}> 
                {item.categoria}
              </Text>
              <Text style={[styles.productPrice, { color: colors.text }]}>{item.preco}</Text>
            </View>

            <FocusablePressable
              accessibilityHint="Remove este produto do carrinho."
              accessibilityLabel={`Remover ${item.nome} do carrinho`}
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => removerProduto(index)}
              style={({ pressed }) => [
                styles.removeButton,
                {
                  backgroundColor: colors.dangerBackground,
                  borderColor: colors.danger,
                  opacity: pressed ? 0.82 : 1,
                },
              ]}
            >
              <Text style={[styles.removeText, { color: colors.danger }]}>Remover</Text>
            </FocusablePressable>
          </View>
        ))}

        {carrinho.length > 0 && (
          <View
            style={[
              styles.summaryCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.summaryRow}>
              <View>
                <Text style={[styles.totalLabel, { color: colors.secondaryText }]}>Total</Text>
                <Text
                  accessibilityLiveRegion="polite"
                  style={[styles.total, { color: colors.text }]}
                >
                  {formatarMoeda(total)}
                </Text>
              </View>

              <Text style={[styles.summaryHint, { color: colors.secondaryText }]}>
                Próximo passo: pagamento seguro.
              </Text>
            </View>

            <AccessibleButton
              accessibilityHint={
                usuario
                  ? "Abre a tela de pagamento."
                  : "Abre a tela de login antes do pagamento."
              }
              onPress={finalizarCompra}
              style={styles.checkoutButton}
            >
              Finalizar compra
            </AccessibleButton>
          </View>
        )}
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
    paddingBottom: 20,
  },
  titulo: {
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -0.7,
    marginBottom: 8,
  },
  subtitulo: {
    fontSize: 16,
    lineHeight: 23,
    marginBottom: 22,
  },
  produto: {
    alignItems: "center",
    borderRadius: 22,
    borderWidth: 1,
    elevation: 3,
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
    padding: 12,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
  imagem: {
    borderRadius: 16,
    height: 76,
    resizeMode: "contain",
    width: 76,
  },
  infoProduto: {
    flex: 1,
  },
  productName: {
    fontSize: 17,
    fontWeight: "900",
  },
  productCategory: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 3,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "900",
    marginTop: 8,
  },
  removeButton: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 48,
    minWidth: 48,
    paddingHorizontal: 12,
  },
  removeText: {
    fontSize: 13,
    fontWeight: "900",
  },
  summaryCard: {
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 6,
    padding: 16,
  },
  summaryRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
    justifyContent: "space-between",
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  total: {
    fontSize: 24,
    fontWeight: "900",
  },
  summaryHint: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    textAlign: "right",
  },
  checkoutButton: {
    marginTop: 14,
  },
  emptyState: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 22,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    lineHeight: 23,
  },
  emptyButton: {
    marginTop: 18,
  },
});
