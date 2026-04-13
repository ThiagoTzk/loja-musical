import { ThemeContext } from "@/src/context/ThemeContext";
import { Produto, produtos } from "@/src/data/produto";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useContext } from "react";
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function Home() {
  const { colors, theme, toggleTheme } = useContext(ThemeContext);

  function renderItem({ item }: { item: Produto }) {
    return (
      <Pressable
        style={[styles.card, { backgroundColor: colors.card }]}
        onPress={() => router.push(`/produto/${item.id}`)}
      >
        <Image source={item.imagem} style={styles.image} />

        <Text style={[styles.productName, { color: colors.text }]}>
          {item.nome}
        </Text>

        <Text style={[styles.price, { color: colors.text }]}>
          {item.preco}
        </Text>

        <Text style={[styles.installment, { color: colors.secondaryText }]}>
          10x sem juros no cartão
        </Text>
      </Pressable>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      
      <View style={styles.header}>
        <Text style={[styles.logo, { color: colors.accent }]}>
          BlackTone Music
        </Text>

        <Pressable onPress={toggleTheme} style={styles.themeButton}>
          <Ionicons
            name={theme === "dark" ? "sunny" : "moon"}
            size={24}
            color={colors.text}
          />
        </Pressable>
      </View>

      <FlatList
        data={produtos}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.productsContainer}
        showsVerticalScrollIndicator={false}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },

  header: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  logo: {
    fontSize: 24,
    fontWeight: "bold",
  },

  themeButton: {
    position: "absolute",
    right: 20,
  },

  productsContainer: {
    paddingBottom: 20,
    paddingHorizontal: 10,
  },

  card: {
    flex: 1,
    margin: 5,
    borderRadius: 12,
    padding: 12,
  },

  image: {
    width: "100%",
    height: 120,
    resizeMode: "contain",
    marginBottom: 10,
  },

  productName: {
    fontSize: 14,
    fontWeight: "bold",
  },

  price: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 5,
  },

  installment: {
    fontSize: 12,
    marginTop: 4,
  },
});