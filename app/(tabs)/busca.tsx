import { FocusablePressable } from "@/components/focusable-pressable";
import { ProdutosContext } from "@/src/context/ProdutosContext";
import { ThemeContext } from "@/src/context/ThemeContext";
import { Produto } from "@/src/data/produto";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useContext, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function normalizarTexto(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export default function Busca() {
  const { colors } = useContext(ThemeContext);
  const { erro, produtos } = useContext(ProdutosContext);
  const [busca, setBusca] = useState("");

  const produtosFiltrados = useMemo(() => {
    const termo = normalizarTexto(busca);

    if (!termo) return produtos;

    return produtos.filter((produto) => {
      const textoPesquisavel = normalizarTexto(
        `${produto.nome} ${produto.categoria} ${produto.descricao} ${produto.preco}`
      );

      return textoPesquisavel.includes(termo);
    });
  }, [busca, produtos]);

  const buscaAtiva = busca.trim().length > 0;

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
            opacity: pressed ? 0.9 : 1,
            shadowColor: colors.shadow,
          },
        ]}
      >
        <View style={[styles.imageShell, { backgroundColor: colors.backgroundSoft }]}> 
          <Image
            accessibilityLabel={`Imagem do produto ${item.nome}`}
            accessibilityRole="image"
            source={item.imagem}
            style={styles.imagem}
          />
        </View>

        <View style={styles.cardContent}>
          <Text style={[styles.category, { color: colors.accentStrong }]}> 
            {item.categoria}
          </Text>
          <Text style={[styles.productName, { color: colors.text }]}>{item.nome}</Text>
          <Text style={[styles.description, { color: colors.secondaryText }]} numberOfLines={2}>
            {item.descricao}
          </Text>
          <Text style={[styles.price, { color: colors.text }]}>{item.preco}</Text>
        </View>

        <Ionicons
          accessibilityElementsHidden
          importantForAccessibility="no"
          name="chevron-forward"
          size={22}
          color={colors.secondaryText}
        />
      </FocusablePressable>
    );
  }

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <FlatList
        ListHeaderComponent={
          <View style={styles.header}>
            <Text accessibilityRole="header" style={[styles.titulo, { color: colors.text }]}> 
              Buscar produtos
            </Text>
            <Text style={[styles.subtitulo, { color: colors.secondaryText }]}> 
              Pesquise nos produtos cadastrados no Firestore por nome,
              categoria, descricao ou preco.
            </Text>

            {erro !== "" && (
              <Text
                accessibilityLiveRegion="polite"
                style={[styles.dataStatus, { color: colors.secondaryText }]}
              >
                Usando produtos locais enquanto o Firestore e configurado.
              </Text>
            )}

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Produto</Text>
              <View
                style={[
                  styles.searchBox,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Ionicons
                  accessibilityElementsHidden
                  color={colors.secondaryText}
                  importantForAccessibility="no"
                  name="search"
                  size={20}
                />

                <TextInput
                  accessibilityHint="Digite parte do nome, categoria, descrição ou preço do produto."
                  accessibilityLabel="Buscar produto"
                  autoCapitalize="none"
                  autoCorrect={false}
                  clearButtonMode="while-editing"
                  onChangeText={setBusca}
                  placeholder="Exemplo: guitarra, vinil, 799"
                  placeholderTextColor={colors.mutedText}
                  returnKeyType="search"
                  style={[styles.input, { color: colors.text }]}
                  value={busca}
                />

                {buscaAtiva && (
                  <FocusablePressable
                    accessibilityHint="Limpa o texto pesquisado e exibe todos os produtos."
                    accessibilityLabel="Limpar busca"
                    accessibilityRole="button"
                    hitSlop={8}
                    onPress={() => setBusca("")}
                    style={({ pressed }) => [
                      styles.clearButton,
                      {
                        backgroundColor: colors.cardStrong,
                        opacity: pressed ? 0.78 : 1,
                      },
                    ]}
                  >
                    <Ionicons
                      accessibilityElementsHidden
                      color={colors.text}
                      importantForAccessibility="no"
                      name="close"
                      size={18}
                    />
                  </FocusablePressable>
                )}
              </View>
            </View>

            <Text
              accessibilityLiveRegion="polite"
              style={[styles.resultCount, { color: colors.mutedText }]}
            >
              {buscaAtiva
                ? `${produtosFiltrados.length} produto${
                    produtosFiltrados.length === 1 ? "" : "s"
                  } encontrado${produtosFiltrados.length === 1 ? "" : "s"}`
                : `Mostrando ${produtos.length} produtos disponiveis`}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View
            accessibilityRole="summary"
            style={[
              styles.emptyState,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Nenhum produto encontrado</Text>
            <Text style={[styles.emptyText, { color: colors.secondaryText }]}> 
              Tente buscar por â€œguitarraâ€, â€œvinilâ€, â€œedição especialâ€ ou pelo preço.
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        data={produtosFiltrados}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
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
  listContent: {
    padding: 20,
    paddingBottom: 34,
  },
  header: {
    marginBottom: 16,
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
  fieldGroup: {
    gap: 8,
    marginBottom: 12,
  },
  dataStatus: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
    marginBottom: 14,
    marginTop: -10,
  },
  label: {
    fontSize: 15,
    fontWeight: "900",
  },
  input: {
    flex: 1,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 4,
  },
  searchBox: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 54,
    paddingLeft: 14,
    paddingRight: 8,
  },
  clearButton: {
    alignItems: "center",
    borderRadius: 999,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  resultCount: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  card: {
    alignItems: "center",
    borderRadius: 22,
    borderWidth: 1,
    elevation: 3,
    flexDirection: "row",
    gap: 14,
    marginBottom: 14,
    minHeight: 112,
    padding: 12,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
  imageShell: {
    alignItems: "center",
    borderRadius: 16,
    height: 82,
    justifyContent: "center",
    width: 82,
  },
  imagem: {
    height: 68,
    resizeMode: "contain",
    width: 68,
  },
  cardContent: {
    flex: 1,
  },
  category: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.6,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  productName: {
    fontSize: 17,
    fontWeight: "900",
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: "900",
    marginTop: 8,
  },
  emptyState: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    lineHeight: 22,
  },
});


