import { FocusablePressable } from "@/components/focusable-pressable";
import { LanguageContext } from "@/src/context/LanguageContext";
import { ProdutosContext } from "@/src/context/ProdutosContext";
import { ThemeContext } from "@/src/context/ThemeContext";
import { Produto } from "@/src/data/produto";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useContext, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CATEGORIA_TODOS = "Todos";

function normalizarTexto(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function dividirTermos(valor: string) {
  return normalizarTexto(valor).split(/\s+/).filter(Boolean);
}

function pontuarProduto(produto: Produto, termos: string[]) {
  if (termos.length === 0) return 1;

  const nome = normalizarTexto(produto.nome);
  const categoria = normalizarTexto(produto.categoria);
  const descricao = normalizarTexto(produto.descricao);
  const preco = normalizarTexto(produto.preco);
  const precoNumerico = String(produto.precoNumero ?? "");

  return termos.reduce((pontuacao, termo) => {
    let termoPontuacao = 0;

    if (nome.startsWith(termo)) termoPontuacao += 12;
    else if (nome.includes(termo)) termoPontuacao += 8;

    if (categoria.includes(termo)) termoPontuacao += 6;
    if (preco.includes(termo) || precoNumerico.includes(termo)) termoPontuacao += 5;
    if (descricao.includes(termo)) termoPontuacao += 3;

    return termoPontuacao === 0
      ? Number.NEGATIVE_INFINITY
      : pontuacao + termoPontuacao;
  }, 0);
}

export default function Busca() {
  const { language, t } = useContext(LanguageContext);
  const { colors } = useContext(ThemeContext);
  const { erro, produtos } = useContext(ProdutosContext);
  const [busca, setBusca] = useState("");
  const [categoriaSelecionada, setCategoriaSelecionada] =
    useState(CATEGORIA_TODOS);

  const categorias = useMemo(() => {
    const categoriasUnicas = Array.from(
      new Set(produtos.map((produto) => produto.categoria))
    ).sort((a, b) => a.localeCompare(b));

    return [CATEGORIA_TODOS, ...categoriasUnicas];
  }, [produtos]);

  const produtosFiltrados = useMemo(() => {
    const termos = dividirTermos(busca);
    const categoriaAtual = normalizarTexto(categoriaSelecionada);

    const produtosDaCategoria =
      categoriaSelecionada === CATEGORIA_TODOS
        ? produtos
        : produtos.filter(
            (produto) => normalizarTexto(produto.categoria) === categoriaAtual
          );

    if (termos.length === 0) return produtosDaCategoria;

    return produtosDaCategoria
      .map((produto) => ({
        pontuacao: pontuarProduto(produto, termos),
        produto,
      }))
      .filter(({ pontuacao }) => Number.isFinite(pontuacao))
      .sort((a, b) => b.pontuacao - a.pontuacao)
      .map(({ produto }) => produto);
  }, [busca, categoriaSelecionada, produtos]);

  const buscaComTexto = busca.trim().length > 0;
  const buscaAtiva = buscaComTexto || categoriaSelecionada !== CATEGORIA_TODOS;

  function limparFiltros() {
    setBusca("");
    setCategoriaSelecionada(CATEGORIA_TODOS);
  }

  function nomeCategoria(categoria: string) {
    return categoria === CATEGORIA_TODOS ? t("search.all") : categoria;
  }

  function renderItem({ item }: { item: Produto }) {
    return (
      <FocusablePressable
        accessibilityHint={t("home.openProduct")}
        accessibilityLabel={
          language === "en"
            ? `Open details for ${item.nome}, ${item.categoria}, price ${item.preco}`
            : `Abrir detalhes de ${item.nome}, ${item.categoria}, preço ${item.preco}`
        }
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
            accessibilityLabel={language === "en" ? `Product image ${item.nome}` : `Imagem do produto ${item.nome}`}
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
              {t("search.title")}
            </Text>
            <Text style={[styles.subtitulo, { color: colors.secondaryText }]}>
              {t("search.subtitle")}
            </Text>

            {erro !== "" && (
              <Text
                accessibilityLiveRegion="polite"
                style={[styles.dataStatus, { color: colors.secondaryText }]}
              >
                {t("search.firestoreFallback")}
              </Text>
            )}

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.text }]}>{t("search.product")}</Text>
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
                  accessibilityHint={t("search.inputHint")}
                  accessibilityLabel={t("search.inputLabel")}
                  autoCapitalize="none"
                  autoCorrect={false}
                  clearButtonMode="while-editing"
                  onChangeText={setBusca}
                  placeholder={t("search.placeholder")}
                  placeholderTextColor={colors.mutedText}
                  returnKeyType="search"
                  style={[styles.input, { color: colors.text }]}
                  value={busca}
                />

                {buscaComTexto && (
                  <FocusablePressable
                    accessibilityHint={t("search.clearTextHint")}
                    accessibilityLabel={t("search.clearTextLabel")}
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

            <ScrollView
              accessibilityLabel={t("search.categoryFilters")}
              contentContainerStyle={styles.filterList}
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              {categorias.map((categoria) => {
                const selected = categoriaSelecionada === categoria;

                return (
                  <FocusablePressable
                    accessibilityHint={
                      language === "en"
                        ? `Filters the search by ${nomeCategoria(categoria)}.`
                        : `Filtra a busca por ${nomeCategoria(categoria)}.`
                    }
                    accessibilityLabel={
                      language === "en"
                        ? `Filter ${nomeCategoria(categoria)}`
                        : `Filtro ${nomeCategoria(categoria)}`
                    }
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    hitSlop={6}
                    key={categoria}
                    onPress={() => setCategoriaSelecionada(categoria)}
                    style={({ pressed }) => [
                      styles.filterChip,
                      {
                        backgroundColor: selected ? colors.accent : colors.card,
                        borderColor: selected ? colors.borderStrong : colors.border,
                        opacity: pressed ? 0.82 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        { color: selected ? colors.accentText : colors.text },
                      ]}
                    >
                      {nomeCategoria(categoria)}
                    </Text>
                  </FocusablePressable>
                );
              })}
            </ScrollView>

            <Text
              accessibilityLiveRegion="polite"
              style={[styles.resultCount, { color: colors.mutedText }]}
            >
              {buscaAtiva
                ? `${produtosFiltrados.length} ${
                    produtosFiltrados.length === 1
                      ? t("search.foundSingular")
                      : t("search.foundPlural")
                  }`
                : `${t("search.showing")} ${produtos.length} ${t("search.availableProducts")}`}
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
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{t("search.noResults")}</Text>
            <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
              {t("search.noResultsText")}
            </Text>
            {buscaAtiva && (
              <FocusablePressable
                accessibilityHint={t("search.clearFiltersHint")}
                accessibilityLabel={t("search.clearFilters")}
                accessibilityRole="button"
                hitSlop={8}
                onPress={limparFiltros}
                style={({ pressed }) => [
                  styles.emptyButton,
                  {
                    backgroundColor: colors.accent,
                    borderColor: colors.borderStrong,
                    opacity: pressed ? 0.84 : 1,
                  },
                ]}
              >
                <Text style={[styles.emptyButtonText, { color: colors.accentText }]}>
                  {t("search.clearFilters")}
                </Text>
              </FocusablePressable>
            )}
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
  filterChip: {
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 16,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: "900",
  },
  filterList: {
    gap: 10,
    paddingBottom: 12,
    paddingTop: 2,
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
  emptyButton: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    marginTop: 16,
    minHeight: 48,
    paddingHorizontal: 18,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: "900",
  },
});
