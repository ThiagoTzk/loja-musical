import { CarrinhoContext } from "@/src/context/CarrinhoContext";
import { ThemeContext } from "@/src/context/ThemeContext";
import { produtos } from "@/src/data/produto";
import { router, useLocalSearchParams } from "expo-router";
import { useContext } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Produto() {
  const { id } = useLocalSearchParams();
  const { colors } = useContext(ThemeContext);
  const { adicionarProduto } = useContext(CarrinhoContext);

  const produto = produtos.find((p) => p.id === id);

  if (!produto) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Produto não encontrado</Text>
      </SafeAreaView>
    );
  }

  function adicionarCarrinho() {
  if (!produto) return;

  adicionarProduto(produto);
  router.push("/(tabs)/carrinho");
}

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Text style={{ color: colors.accent }}>Voltar</Text>
      </Pressable>

      <Image source={produto.imagem} style={styles.image} />

      <View style={styles.infoContainer}>
        <Text style={[styles.nome, { color: colors.text }]}>
          {produto.nome}
        </Text>

        <Text style={[styles.preco, { color: colors.text }]}>
          {produto.preco}
        </Text>

        <Text style={{ color: colors.secondaryText }}>
          10x sem juros no cartão
        </Text>

        <Pressable
          style={[styles.botaoCarrinho, { backgroundColor: colors.accent }]}
          onPress={adicionarCarrinho}
        >
          <Text style={styles.textoBotao}>
            Adicionar ao carrinho
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },

  backButton: {
    marginBottom: 10,
  },

  image: {
    width: "100%",
    height: 300,
    resizeMode: "contain",
  },

  infoContainer: {
    marginTop: 20,
  },

  nome: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },

  preco: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },

  botaoCarrinho: {
    marginTop: 20,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },

  textoBotao: {
    fontWeight: "bold",
  },
});